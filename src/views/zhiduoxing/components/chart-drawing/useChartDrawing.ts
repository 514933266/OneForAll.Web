// 智多星（神策智投）：个股复盘画图引擎（基于 echarts 的 zrender 层自绘）
// 能力：图元绘制（趋势线/水平线/箭头/文字/矩形/振幅尺子）、选中与删除、预测锚点编辑（新增/拖动/双击删除）；
// 坐标换算基于 echarts convertToPixel/convertFromPixel（类目轴吸附最近根），
// dataZoom 缩放/平移时以 rAF 帧序列跟随重绘；绘制/预测模式下临时禁用图表缩放与 tooltip（防交互冲突）
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Circle, Group, Line, Polyline, Rect, Text } from 'zrender/lib/export.js'
import { IZdxChartPoint, IZdxChartShape } from '@/interfaces/zhiduoxing/IZdxStockReview'
import { ChartDrawingInstance, ChartDrawingOptions, ChartDrawMode, ChartShapeType, DRAW_SHAPE_COLORS, FORECAST_COLOR } from './types'

// 命中测试容差（像素）
const HIT_TOLERANCE = 7
// 锚点命中半径（像素）
const ANCHOR_HIT_RADIUS = 10
// 点击/拖动判定阈值（像素；位移小于该值视为点击）
const CLICK_THRESHOLD = 5
// 缩放跟随重绘帧数（覆盖 dataZoom 缩放动画时长）
const ZOOM_FOLLOW_FRAMES = 12

export function useChartDrawing(opts: ChartDrawingOptions): ChartDrawingInstance {
	// 选中图元索引（-1=未选中；宿主工具栏"删除选中"按此判断可用性）
	const selectedIndex = ref(-1)

	// 根组（每次重绘整体重建；图表清空后由重绘重新挂载）
	let rootGroup: Group | null = null
	let attached = false

	// 绘制拖拽状态（mousedown 开始、mousemove 更新预览、mouseup 落图）
	let drawing = false
	let drawStart: IZdxChartPoint | null = null
	// 当前鼠标数据坐标（水平线幽灵线与拖拽预览共用）
	let previewPt: IZdxChartPoint | null = null
	let downPx: [number, number] | null = null

	// 预测锚点拖拽状态（mousedown 命中锚点后进入，拖动中实时吸附）
	let dragAnchorIdx = -1
	let forecastDownPx: [number, number] | null = null

	// 缩放跟随重绘的 rAF 句柄
	let zoomRaf = 0

	// 离屏文字测量上下文（文字框宽度自适应）
	let measureCtx: CanvasRenderingContext2D | null = null

	// ---------- 坐标换算 ----------
	// 类目吸附：优先精确匹配；否则取首个不小于目标的类目；全部小于时取最后一根（与买卖点当日映射口径一致）
	function catIndexOf(cat: string): number {
		const cats = opts.getCategories()
		if (!cats.length) return -1
		const exact = cats.indexOf(cat)
		if (exact >= 0) return exact
		const idx = cats.findIndex(c => c >= cat)
		return idx < 0 ? cats.length - 1 : idx
	}

	// 数据坐标 → 像素（价格经宿主折算为显示口径；日期吸附最近根）
	function toPx(pt: IZdxChartPoint): [number, number] | null {
		const chart = opts.getChart()
		if (!chart) return null
		const idx = catIndexOf(opts.parseCategory(pt.Date))
		if (idx < 0) return null
		let px: unknown
		let py: unknown
		try {
			px = chart.convertToPixel({ xAxisIndex: 0 }, idx)
			py = chart.convertToPixel({ yAxisIndex: 0 }, opts.toDisplayPrice(pt.Date, pt.Price))
		} catch {
			return null
		}
		const x = typeof px === 'number' ? px : Array.isArray(px) ? Number(px[0]) : NaN
		const y = typeof py === 'number' ? py : Array.isArray(py) ? Number(py[1]) : NaN
		return isFinite(x) && isFinite(y) ? [x, y] : null
	}

	// 像素 → 数据坐标（类目吸附最近根；价格反折算为不复权口径）
	function toData(x: number, y: number): IZdxChartPoint | null {
		const chart = opts.getChart()
		const cats = opts.getCategories()
		if (!chart || !cats.length) return null
		let res: unknown
		try {
			res = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [x, y])
		} catch {
			return null
		}
		if (!Array.isArray(res) || res.length < 2) return null
		const rawIdx = Number(res[0])
		const price = Number(res[1])
		if (!isFinite(rawIdx) || !isFinite(price)) return null
		const idx = Math.max(0, Math.min(cats.length - 1, Math.round(rawIdx)))
		const date = opts.formatCategory(cats[idx])
		return { Date: date, Price: opts.toRawPrice(date, price) }
	}

	// 主图网格矩形（水平线贯穿全宽用；内部 API 取值失败时返回 null 由调用方兜底）
	function gridRect(): { x: number; y: number; width: number; height: number } | null {
		const chart = opts.getChart()
		if (!chart) return null
		try {
			const model = (chart as any).getModel?.()
			const rect = model?.getComponent?.('grid', 0)?.coordinateSystem?.getRect?.()
			if (rect && isFinite(rect.x) && isFinite(rect.width)) {
				return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
			}
		} catch {
			/* 忽略 */
		}
		return null
	}

	// 文字宽度测量（文字框底板宽度自适应）
	function textWidth(text: string): number {
		if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d')
		if (!measureCtx) return text.length * 12
		measureCtx.font = '12px sans-serif'
		return measureCtx.measureText(text).width
	}

	// 点到线段距离（趋势线/箭头命中测试）
	function distToSegment(x: number, y: number, a: [number, number], b: [number, number]): number {
		const dx = b[0] - a[0]
		const dy = b[1] - a[1]
		const len2 = dx * dx + dy * dy
		if (!len2) return Math.hypot(x - a[0], y - a[1])
		let t = ((x - a[0]) * dx + (y - a[1]) * dy) / len2
		t = Math.max(0, Math.min(1, t))
		return Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy))
	}

	// ---------- 命中测试 ----------
	function hitTestShape(shape: IZdxChartShape, x: number, y: number): boolean {
		const pix = shape.Points.map(p => toPx(p))
		if (!pix.length || pix.some(p => !p)) return false
		const pts = pix as [number, number][]
		switch (shape.Type) {
			case 'trend':
			case 'arrow':
			case 'ruler':
				return pts.length >= 2 && distToSegment(x, y, pts[0], pts[1]) <= HIT_TOLERANCE
			case 'hline': {
				const rect = gridRect()
				const inX = rect ? x >= rect.x - 4 && x <= rect.x + rect.width + 26 : true
				return inX && Math.abs(y - pts[0][1]) <= HIT_TOLERANCE
			}
			case 'text': {
				const w = textWidth(shape.Text ?? '') + 12
				return Math.abs(x - pts[0][0]) <= w / 2 + 2 && Math.abs(y - pts[0][1]) <= 12
			}
			case 'rect': {
				if (pts.length < 2) return false
				const minX = Math.min(pts[0][0], pts[1][0]) - HIT_TOLERANCE
				const maxX = Math.max(pts[0][0], pts[1][0]) + HIT_TOLERANCE
				const minY = Math.min(pts[0][1], pts[1][1]) - HIT_TOLERANCE
				const maxY = Math.max(pts[0][1], pts[1][1]) + HIT_TOLERANCE
				return x >= minX && x <= maxX && y >= minY && y <= maxY
			}
			default:
				return false
		}
	}

	// 图元命中（从后往前，后画者优先）
	function hitTestShapes(x: number, y: number): number {
		const shapes = opts.getShapes()
		for (let i = shapes.length - 1; i >= 0; i--) {
			if (hitTestShape(shapes[i], x, y)) return i
		}
		return -1
	}

	// 预测锚点命中（含起点）
	function hitTestAnchors(x: number, y: number): number {
		const anchors = opts.getForecastAnchors()
		for (let i = anchors.length - 1; i >= 0; i--) {
			const p = toPx({ Date: anchors[i].Date, Price: anchors[i].Price })
			if (p && Math.hypot(x - p[0], y - p[1]) <= ANCHOR_HIT_RADIUS) return i
		}
		return -1
	}

	// ---------- 图元渲染 ----------
	// 单个图元 → zrender 组（坐标换算失败返回 null 不绘制）
	function buildShapeEl(shape: IZdxChartShape, index: number, preview = false): Group | null {
		const pix = shape.Points.map(p => toPx(p))
		if (!pix.length || pix.some(p => !p)) return null
		const pts = pix as [number, number][]
		const baseColor = shape.Color || DRAW_SHAPE_COLORS[shape.Type as ChartShapeType] || FORECAST_COLOR
		const selected = !preview && selectedIndex.value === index
		const stroke = selected ? FORECAST_COLOR : baseColor
		const lineWidth = selected ? 2.2 : 1.5
		// 端点小圆点（趋势线/箭头端点）
		const endDot = (x: number, y: number) =>
			new Circle({
				shape: { cx: x, cy: y, r: 2.8 },
				style: { fill: '#fff', stroke, lineWidth: 1.4 },
				silent: true
			})
		const g = new Group()
		switch (shape.Type) {
			case 'trend': {
				if (pts.length < 2) return null
				g.add(new Line({ shape: { x1: pts[0][0], y1: pts[0][1], x2: pts[1][0], y2: pts[1][1] }, style: { stroke, lineWidth }, silent: true }))
				g.add(endDot(pts[0][0], pts[0][1]))
				g.add(endDot(pts[1][0], pts[1][1]))
				break
			}
			case 'arrow': {
				if (pts.length < 2) return null
				const [a, b] = pts
				g.add(new Line({ shape: { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, style: { stroke, lineWidth }, silent: true }))
				// 箭头头部（两条短线，终点处 ±spread 角度）
				const angle = Math.atan2(b[1] - a[1], b[0] - a[0])
				const head = 10
				const spread = Math.PI / 7
				g.add(
					new Line({
						shape: { x1: b[0], y1: b[1], x2: b[0] - head * Math.cos(angle - spread), y2: b[1] - head * Math.sin(angle - spread) },
						style: { stroke, lineWidth },
						silent: true
					})
				)
				g.add(
					new Line({
						shape: { x1: b[0], y1: b[1], x2: b[0] - head * Math.cos(angle + spread), y2: b[1] - head * Math.sin(angle + spread) },
						style: { stroke, lineWidth },
						silent: true
					})
				)
				g.add(endDot(a[0], a[1]))
				break
			}
			case 'hline': {
				const [, y] = pts[0]
				const rect = gridRect()
				const x1 = rect ? rect.x : pts[0][0] - 400
				const x2 = rect ? rect.x + rect.width : pts[0][0] + 400
				g.add(new Line({ shape: { x1, y1: y, x2, y2: y }, style: { stroke, lineWidth }, silent: true }))
				// 右端价格标签（显示口径价格，与图内价格刻度一致）
				g.add(
					new Text({
						style: {
							text: opts.toDisplayPrice(shape.Points[0].Date, shape.Points[0].Price).toFixed(2),
							x: x2 + 3,
							y,
							fill: stroke,
							font: '11px sans-serif',
							verticalAlign: 'middle'
						},
						silent: true
					})
				)
				break
			}
			case 'text': {
				const [x, y] = pts[0]
				const text = shape.Text ?? ''
				const w = textWidth(text)
				g.add(
					new Rect({
						shape: { x: x - w / 2 - 5, y: y - 9, width: w + 10, height: 18, r: 3 },
						style: { fill: 'rgba(255, 255, 255, 0.92)', stroke, lineWidth: Math.min(lineWidth, 1.4), shadowBlur: 2, shadowColor: 'rgba(0, 0, 0, 0.12)' },
						silent: true
					})
				)
				g.add(
					new Text({
						style: { text, x, y, fill: stroke, font: '12px sans-serif', align: 'center', verticalAlign: 'middle' },
						silent: true
					})
				)
				break
			}
			case 'rect': {
				if (pts.length < 2) return null
				const x = Math.min(pts[0][0], pts[1][0])
				const y = Math.min(pts[0][1], pts[1][1])
				g.add(
					new Rect({
						shape: { x, y, width: Math.abs(pts[1][0] - pts[0][0]), height: Math.abs(pts[1][1] - pts[0][1]) },
						style: { fill: baseColor + '1f', stroke, lineWidth },
						silent: true
					})
				)
				break
			}
			case 'ruler': {
				if (pts.length < 2) return null
				const [a, b] = pts
				// 测量线（虚线）+ 两端点
				g.add(new Line({ shape: { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, style: { stroke, lineWidth, lineDash: [5, 3] }, silent: true }))
				g.add(endDot(a[0], a[1]))
				g.add(endDot(b[0], b[1]))
				// 读数标签：固定显示在K线图左上角（多条尺子自上而下堆叠；拖拽预览排在最末）；
				// 价格区间 + 涨幅/振幅%（低位→高位=涨幅[红]，高位→低位=振幅[绿]）
				const shapes = opts.getShapes()
				const rowIdx = preview ? shapes.filter(s => s.Type === 'ruler').length : shapes.slice(0, index).filter(s => s.Type === 'ruler').length
				const p0 = opts.toDisplayPrice(shape.Points[0].Date, shape.Points[0].Price)
				const p1 = opts.toDisplayPrice(shape.Points[1].Date, shape.Points[1].Price)
				const rise = p1 >= p0
				const pct = p0 > 0 ? ((p1 - p0) / p0) * 100 : 0
				const txt1 = `${p0.toFixed(2)} → ${p1.toFixed(2)}`
				const txt2 = rise ? `涨幅 +${pct.toFixed(2)}%` : `振幅 ${pct.toFixed(2)}%`
				const w = Math.max(textWidth(txt1), textWidth(txt2)) + 14
				const grid = gridRect()
				const bx = (grid ? grid.x : 46) + 8
				const by = (grid ? grid.y : 4) + 6 + rowIdx * 40
				g.add(
					new Rect({
						shape: { x: bx, y: by, width: w, height: 34, r: 3 },
						style: { fill: 'rgba(255, 255, 255, 0.95)', stroke, lineWidth: Math.min(lineWidth, 1.4), shadowBlur: 2, shadowColor: 'rgba(0, 0, 0, 0.12)' },
						silent: true
					})
				)
				g.add(new Text({ style: { text: txt1, x: bx + 7, y: by + 11, fill: '#303133', font: 'bold 11px sans-serif', align: 'left', verticalAlign: 'middle' }, silent: true }))
				g.add(new Text({ style: { text: txt2, x: bx + 7, y: by + 26, fill: rise ? '#f56c6c' : '#67c23a', font: 'bold 12px sans-serif', align: 'left', verticalAlign: 'middle' }, silent: true }))
				break
			}
			default:
				return null
		}
		// 拖拽预览半透明
		if (preview) {
			g.traverse((child: any) => {
				if (child && child.style) child.style.opacity = 0.7
			})
		}
		return g
	}

	// 预测路径渲染（蓝色虚线 + 锚点圆点；起点实心、拖动中放大；末端锚点价格标签）
	function renderForecastEls(g: Group) {
		const anchors = opts.getForecastAnchors()
		if (!anchors.length) return
		const pix = anchors.map(a => toPx({ Date: a.Date, Price: a.Price }))
		const linePts: number[][] = []
		for (const p of pix) {
			if (p) linePts.push([p[0], p[1]])
		}
		if (linePts.length >= 2) {
			g.add(
				new Polyline({
					shape: { points: linePts },
					style: { stroke: FORECAST_COLOR, lineWidth: 1.6, lineDash: [6, 4] },
					silent: true
				})
			)
		}
		anchors.forEach((_, i) => {
			const p = pix[i]
			if (!p) return
			const dragging = dragAnchorIdx === i
			g.add(
				new Circle({
					shape: { cx: p[0], cy: p[1], r: dragging ? 6 : 4.5 },
					style: { fill: i === 0 || dragging ? FORECAST_COLOR : '#fff', stroke: FORECAST_COLOR, lineWidth: 2 },
					silent: true
				})
			)
		})
		const lastPix = pix[pix.length - 1]
		if (lastPix) {
			const last = anchors[anchors.length - 1]
			g.add(
				new Text({
					style: {
						text: opts.toDisplayPrice(last.Date, last.Price).toFixed(2),
						x: lastPix[0] + 8,
						y: lastPix[1] - 9,
						fill: FORECAST_COLOR,
						font: '11px sans-serif'
					},
					silent: true
				})
			)
		}
	}

	// 绘制预览（拖拽中的临时图元 + 水平线幽灵线）
	function renderPreviewEls(g: Group) {
		const mode = opts.mode.value
		if (mode === 'select' || mode === 'forecast') return
		const type = mode as ChartShapeType
		let ghost: IZdxChartShape | null = null
		if (type === 'hline') {
			if (previewPt) ghost = { Type: 'hline', Points: [previewPt], Color: DRAW_SHAPE_COLORS.hline }
		} else if (drawing && drawStart && previewPt) {
			ghost = { Type: type, Points: [drawStart, previewPt], Color: DRAW_SHAPE_COLORS[type] }
		}
		if (!ghost) return
		const el = buildShapeEl(ghost, -1, true)
		if (el) g.add(el)
	}

	// 全量重绘：移除旧根组、重建图元/预测/预览、重新挂载
	function redraw() {
		if (!opts.enabled.value) return
		const chart = opts.getChart()
		if (!chart) return
		let zr: any
		try {
			zr = chart.getZr()
		} catch {
			return
		}
		if (!zr) return
		const shapes = opts.getShapes()
		if (selectedIndex.value >= shapes.length) selectedIndex.value = -1
		if (rootGroup) {
			try {
				zr.remove(rootGroup)
			} catch {
				/* 图表已清空时忽略 */
			}
			rootGroup = null
		}
		const g = new Group()
		rootGroup = g
		shapes.forEach((s, i) => {
			const el = buildShapeEl(s, i)
			if (el) g.add(el)
		})
		renderForecastEls(g)
		renderPreviewEls(g)
		zr.add(g)
	}

	// ---------- 图元编辑 ----------
	// 新增图元（写入宿主状态并标记未保存）
	function pushShape(shape: IZdxChartShape) {
		opts.setShapes([...opts.getShapes(), shape])
		opts.onShapesChange?.()
	}

	// 新增文字标注（弹窗输入）
	async function promptTextShape(pt: IZdxChartPoint) {
		let value = ''
		try {
			const res = await ElMessageBox.prompt('请输入标注文字', '文字标注', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				inputPlaceholder: '如：压力位观察',
				inputValidator: (v: string) => (!!v && v.trim().length > 0) || '文字不能为空'
			})
			value = String(res.value ?? '').trim()
		} catch {
			redraw()
			return
		}
		if (value) pushShape({ Type: 'text', Points: [pt], Text: value, Color: DRAW_SHAPE_COLORS.text })
		redraw()
	}

	// 编辑文字标注（选择模式双击文字框）
	async function editTextShape(index: number) {
		const shape = opts.getShapes()[index]
		if (!shape || shape.Type !== 'text') return
		let value = ''
		try {
			const res = await ElMessageBox.prompt('修改标注文字', '文字标注', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				inputValue: shape.Text ?? '',
				inputValidator: (v: string) => (!!v && v.trim().length > 0) || '文字不能为空'
			})
			value = String(res.value ?? '').trim()
		} catch {
			return
		}
		if (!value || value === shape.Text) return
		const list = opts.getShapes().slice()
		list[index] = { ...shape, Text: value }
		opts.setShapes(list)
		opts.onShapesChange?.()
		redraw()
	}

	// 删除选中图元（工具栏按钮 / Delete 键）
	function deleteSelected() {
		const idx = selectedIndex.value
		const list = opts.getShapes().slice()
		if (idx < 0 || idx >= list.length) return
		list.splice(idx, 1)
		opts.setShapes(list)
		selectedIndex.value = -1
		opts.onShapesChange?.()
		redraw()
	}

	// ---------- 预测锚点编辑 ----------
	// 新增锚点（点击未来区；同一交易日则更新价格，不新增重复项）
	function addForecastAnchorAt(x: number, y: number) {
		if (hitTestAnchors(x, y) >= 0) return
		const chart = opts.getChart()
		const cats = opts.getCategories()
		if (!chart || !cats.length) return
		let res: unknown
		try {
			res = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [x, y])
		} catch {
			return
		}
		if (!Array.isArray(res) || res.length < 2) return
		const rawIdx = Number(res[0])
		const price = Number(res[1])
		if (!isFinite(rawIdx) || !isFinite(price)) return
		const histCount = opts.getHistoryCount()
		if (Math.round(rawIdx) < histCount) {
			ElMessage.info('请在图表右侧未来区域点击添加预测锚点')
			return
		}
		const idx = Math.min(cats.length - 1, Math.round(rawIdx))
		const date = opts.formatCategory(cats[idx])
		const anchors = opts.getForecastAnchors().slice()
		const exist = anchors.findIndex(a => a.Date === date)
		if (exist === 0) return
		const rawPrice = opts.toRawPrice(date, price)
		if (exist > 0) {
			anchors[exist] = { Date: date, Price: rawPrice }
		} else {
			anchors.push({ Date: date, Price: rawPrice })
			anchors.sort((a, b) => a.Date.localeCompare(b.Date))
		}
		opts.setForecastAnchors(anchors)
		opts.onForecastChange?.()
		redraw()
	}

	// 拖动锚点（起点固定不可拖；日期吸附最近类目并限制在未来区且不越前后锚点）
	function dragForecastAnchor(index: number, x: number, y: number) {
		const chart = opts.getChart()
		const cats = opts.getCategories()
		if (!chart || !cats.length) return
		let res: unknown
		try {
			res = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [x, y])
		} catch {
			return
		}
		if (!Array.isArray(res) || res.length < 2) return
		const rawIdx = Number(res[0])
		const price = Number(res[1])
		if (!isFinite(rawIdx) || !isFinite(price)) return
		const anchors = opts.getForecastAnchors().slice()
		if (index <= 0 || index >= anchors.length) return
		const startIdx = catIndexOf(opts.parseCategory(anchors[0].Date))
		const loIdx = catIndexOf(opts.parseCategory(anchors[index - 1].Date))
		const hiIdx = index < anchors.length - 1 ? catIndexOf(opts.parseCategory(anchors[index + 1].Date)) : cats.length
		let idx = Math.round(rawIdx)
		idx = Math.max(startIdx, Math.min(cats.length - 1, idx))
		// 严格保持日期升序不重复（空间不足时忽略本次拖动）
		if (idx <= loIdx || idx >= hiIdx) return
		const date = opts.formatCategory(cats[idx])
		anchors[index] = { Date: date, Price: opts.toRawPrice(date, price) }
		opts.setForecastAnchors(anchors)
		opts.onForecastChange?.()
		redraw()
	}

	// 删除锚点（双击；起点不可删）
	function removeForecastAnchor(index: number) {
		if (index <= 0) {
			if (index === 0) ElMessage.info('起点锚点为最新交易日收盘，不可删除')
			return
		}
		const anchors = opts.getForecastAnchors().slice()
		if (index >= anchors.length) return
		anchors.splice(index, 1)
		opts.setForecastAnchors(anchors)
		opts.onForecastChange?.()
		redraw()
	}

	// ---------- 事件处理 ----------
	type ZrEventLike = { offsetX?: unknown; offsetY?: unknown }

	function readEventPos(e: ZrEventLike | undefined): [number, number] | null {
		const x = Number(e?.offsetX)
		const y = Number(e?.offsetY)
		return isFinite(x) && isFinite(y) ? [x, y] : null
	}

	function onZrMouseDown(e: ZrEventLike) {
		if (!opts.enabled.value) return
		const pos = readEventPos(e)
		if (!pos) return
		const mode = opts.mode.value
		if (mode === 'select') return
		if (mode === 'forecast') {
			forecastDownPx = pos
			dragAnchorIdx = hitTestAnchors(pos[0], pos[1])
			if (dragAnchorIdx === 0) dragAnchorIdx = -1
			return
		}
		const pt = toData(pos[0], pos[1])
		if (!pt) return
		drawing = true
		drawStart = pt
		previewPt = pt
		downPx = pos
		redraw()
	}

	function onZrMouseMove(e: ZrEventLike) {
		if (!opts.enabled.value) return
		const pos = readEventPos(e)
		if (!pos) return
		const mode = opts.mode.value
		if (mode === 'select') return
		if (mode === 'forecast') {
			if (dragAnchorIdx >= 0) dragForecastAnchor(dragAnchorIdx, pos[0], pos[1])
			return
		}
		const pt = toData(pos[0], pos[1])
		if (!pt) return
		previewPt = pt
		// 拖拽中与水平线幽灵线需要跟随重绘
		if (drawing || mode === 'hline') redraw()
	}

	function onZrMouseUp(e: ZrEventLike) {
		if (!opts.enabled.value) return
		const pos = readEventPos(e)
		if (!pos) return
		const mode = opts.mode.value
		if (mode === 'forecast') {
			if (dragAnchorIdx >= 0) {
				dragAnchorIdx = -1
				redraw()
				return
			}
			const down = forecastDownPx
			forecastDownPx = null
			if (!down) return
			if (Math.hypot(pos[0] - down[0], pos[1] - down[1]) >= CLICK_THRESHOLD) return
			addForecastAnchorAt(pos[0], pos[1])
			return
		}
		if (!drawing) return
		drawing = false
		const down = downPx
		const start = drawStart
		const end = toData(pos[0], pos[1]) ?? previewPt
		downPx = null
		drawStart = null
		previewPt = null
		if (!start || !end) {
			redraw()
			return
		}
		const type = mode as ChartShapeType
		const dist = down ? Math.hypot(pos[0] - down[0], pos[1] - down[1]) : 0
		if (type === 'text') {
			if (dist >= CLICK_THRESHOLD) {
				redraw()
				return
			}
			promptTextShape(start)
			return
		}
		// 水平线以落点价格为准（所见即所得）
		if (type === 'hline') {
			pushShape({ Type: 'hline', Points: [end], Color: DRAW_SHAPE_COLORS.hline })
			redraw()
			return
		}
		if (dist < CLICK_THRESHOLD) {
			redraw()
			return
		}
		pushShape({ Type: type, Points: [start, end], Color: DRAW_SHAPE_COLORS[type] })
		redraw()
	}

	// 选择模式：点击选中/取消选中图元
	function onZrClick(e: ZrEventLike) {
		if (!opts.enabled.value || opts.mode.value !== 'select') return
		const pos = readEventPos(e)
		if (!pos) return
		const hit = hitTestShapes(pos[0], pos[1])
		if (hit !== selectedIndex.value) {
			selectedIndex.value = hit
			redraw()
		}
	}

	// 预测模式：双击锚点删除；选择模式：双击文字框编辑文字
	function onZrDblClick(e: ZrEventLike) {
		if (!opts.enabled.value) return
		const pos = readEventPos(e)
		if (!pos) return
		const mode = opts.mode.value
		if (mode === 'forecast') {
			removeForecastAnchor(hitTestAnchors(pos[0], pos[1]))
			return
		}
		if (mode === 'select') {
			const hit = hitTestShapes(pos[0], pos[1])
			if (hit >= 0 && opts.getShapes()[hit]?.Type === 'text') editTextShape(hit)
		}
	}

	// dataZoom 缩放/平移时跟随重绘（连续帧覆盖缩放动画，动画停止后自动结束）
	function onChartZoom() {
		cancelAnimationFrame(zoomRaf)
		let frames = 0
		const tick = () => {
			redraw()
			if (++frames < ZOOM_FOLLOW_FRAMES) zoomRaf = requestAnimationFrame(tick)
		}
		zoomRaf = requestAnimationFrame(tick)
	}

	// 模式切换：清理进行中的交互状态；绘制/预测模式临时禁用图表缩放与 tooltip（防拖拽与缩放冲突）
	function applyModeLock(mode: ChartDrawMode) {
		const chart = opts.getChart()
		if (!chart) return
		const lock = opts.enabled.value && mode !== 'select'
		try {
			chart.setOption({ dataZoom: [{ disabled: lock }], tooltip: { show: !lock } })
		} catch {
			/* 图表未就绪时忽略 */
		}
		try {
			const zr: any = chart.getZr()
			zr?.setCursorStyle?.(lock ? 'crosshair' : 'default')
		} catch {
			/* 忽略 */
		}
	}

	watch(
		() => opts.mode.value,
		mode => {
			drawing = false
			drawStart = null
			previewPt = null
			downPx = null
			dragAnchorIdx = -1
			forecastDownPx = null
			selectedIndex.value = -1
			applyModeLock(mode)
			redraw()
		}
	)

	// Delete/Backspace 删除选中图元（输入框聚焦时不拦截）
	function onKeydown(ev: KeyboardEvent) {
		if (!opts.enabled.value || opts.mode.value !== 'select') return
		if (ev.key !== 'Delete' && ev.key !== 'Backspace') return
		if (selectedIndex.value < 0) return
		const target = ev.target as HTMLElement | null
		const tag = target?.tagName
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return
		ev.preventDefault()
		deleteSelected()
	}

	// 挂载图表事件（zr 层 mousedown/mousemove/mouseup/click/dblclick + dataZoom）
	function attach() {
		if (attached) return
		const chart = opts.getChart()
		if (!chart) return
		attached = true
		const zr: any = chart.getZr()
		zr.on('mousedown', onZrMouseDown)
		zr.on('mousemove', onZrMouseMove)
		zr.on('mouseup', onZrMouseUp)
		zr.on('click', onZrClick)
		zr.on('dblclick', onZrDblClick)
		chart.on('dataZoom', onChartZoom)
	}

	onMounted(() => window.addEventListener('keydown', onKeydown))
	onUnmounted(() => {
		window.removeEventListener('keydown', onKeydown)
		cancelAnimationFrame(zoomRaf)
	})

	return { attach, redraw, deleteSelected, selectedIndex }
}
