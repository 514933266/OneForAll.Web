// K线截图识别：从蜡烛图截图中提取红涨绿跌K线柱体，输出 0~100 固定坐标系下的 o/h/l/c 数组
// 算法：颜色分类红/绿像素 → 按列聚类分割每根K线 → 行宽判定实体与影线 → 全局极值归一化（上下留 3 边距）

export interface IRecognizedCandle {
	o: number
	h: number
	l: number
	c: number
}

export interface IRecognizeResult {
	// 是否识别成功
	ok: boolean
	// 结果说明或失败原因
	message: string
	// 识别出的K线（ok 为 true 时有效）
	candles: IRecognizedCandle[]
}

// 图片处理最大边长（超过则等比缩小，降低像素遍历耗时）
const MAX_SIZE = 1600

// 红色（涨）像素判定：以红为主且与绿蓝差异显著（排除白底/黑白文字/黄色均线等干扰）
function isUpPixel(r: number, g: number, b: number): boolean {
	return r > 140 && r - g > 60 && r - b > 60
}

// 绿色（跌）像素判定
function isDownPixel(r: number, g: number, b: number): boolean {
	return g > 110 && g - r > 45 && g - b > 45
}

// 保留1位小数
function r1(v: number): number {
	return Math.round(v * 10) / 10
}

// 段信息（一根K线的像素范围）
interface SegmentInfo {
	// 柱体最高像素行（y 向下增长）
	top: number
	// 柱体最低像素行
	bottom: number
	// 实体上沿像素行
	bodyTop: number
	// 实体下沿像素行
	bodyBottom: number
	// 是否阳线（红）
	up: boolean
}

export function recognizeCandlesFromImage(img: HTMLImageElement): IRecognizeResult {
	const fail = (message: string): IRecognizeResult => ({ ok: false, message, candles: [] })

	// 1) 等比缩放绘制到离屏 canvas 并读取像素
	let w = img.naturalWidth || img.width
	let h = img.naturalHeight || img.height
	if (!w || !h) return fail('图片无效，请重新选择截图')
	const scale = Math.min(1, MAX_SIZE / w, MAX_SIZE / h)
	w = Math.max(1, Math.round(w * scale))
	h = Math.max(1, Math.round(h * scale))
	const canvas = document.createElement('canvas')
	canvas.width = w
	canvas.height = h
	const ctx = canvas.getContext('2d')
	if (!ctx) return fail('当前浏览器不支持画布识别，请更换浏览器')
	ctx.drawImage(img, 0, 0, w, h)
	const data = ctx.getImageData(0, 0, w, h).data

	// 2) 像素颜色分类：0=忽略 1=红（涨） 2=绿（跌）；同时按列统计着色像素数
	const type = new Uint8Array(w * h)
	const colCount = new Int32Array(w)
	for (let y = 0; y < h; y++) {
		const rowOffset = y * w
		for (let x = 0; x < w; x++) {
			const idx = (rowOffset + x) * 4
			if (data[idx + 3] < 128) continue
			const r = data[idx]
			const g = data[idx + 1]
			const b = data[idx + 2]
			let t = 0
			if (isUpPixel(r, g, b)) t = 1
			else if (isDownPixel(r, g, b)) t = 2
			if (t) {
				type[rowOffset + x] = t
				colCount[x]++
			}
		}
	}

	// 3) 按列分段：连续着色列（≥2 像素高）构成一根K线；段宽 ≥2 列过滤噪点
	const segments: Array<{ x1: number; x2: number }> = []
	let cur: { x1: number; x2: number } | null = null
	for (let x = 0; x <= w; x++) {
		const colored = x < w && colCount[x] >= 2
		if (colored) {
			if (cur) cur.x2 = x
			else cur = { x1: x, x2: x }
		} else if (cur) {
			if (cur.x2 - cur.x1 >= 1) segments.push(cur)
			cur = null
		}
	}

	if (!segments.length) return fail('未识别到K线柱体：请确认截图包含红涨绿跌的蜡烛图区域')
	if (segments.length > 8) return fail(`识别到 ${segments.length} 根K线（超过 8 根上限）：请只截取目标形态附近的K线区域`)

	// 4) 逐段提取：最高/最低像素界 + 实体上下沿 + 阴阳颜色
	const infos: SegmentInfo[] = []
	for (const seg of segments) {
		const segW = seg.x2 - seg.x1 + 1
		const rowCount = new Int32Array(h)
		let top = -1
		let bottom = -1
		let upCnt = 0
		let downCnt = 0
		for (let y = 0; y < h; y++) {
			const rowOffset = y * w
			let cnt = 0
			for (let x = seg.x1; x <= seg.x2; x++) {
				const t = type[rowOffset + x]
				if (t) {
					cnt++
					if (t === 1) upCnt++
					else downCnt++
				}
			}
			if (cnt) {
				rowCount[y] = cnt
				if (top < 0) top = y
				bottom = y
			}
		}
		if (top < 0) continue
		// 实体行：行内着色宽度 ≥ 段宽 60%（影线通常仅 1~3 像素宽）；取最长连续块（抗噪点行）
		const th = Math.max(2, Math.ceil(segW * 0.6))
		let bodyTop = -1
		let bodyBottom = -1
		let bestLen = -1
		let blockA = -1
		for (let y = top; y <= bottom + 1; y++) {
			const isBody = y <= bottom && rowCount[y] >= th
			if (isBody) {
				if (blockA < 0) blockA = y
			} else if (blockA >= 0) {
				if (y - 1 - blockA > bestLen) {
					bestLen = y - 1 - blockA
					bodyTop = blockA
					bodyBottom = y - 1
				}
				blockA = -1
			}
		}
		// 无实体行（如十字星实体极薄）回退为整个柱体范围
		if (bodyTop < 0) {
			bodyTop = top
			bodyBottom = bottom
		}
		infos.push({ top, bottom, bodyTop, bodyBottom, up: upCnt >= downCnt })
	}
	if (!infos.length) return fail('未识别到有效K线：请提供更清晰的截图')

	// 5) 全局极值归一化到 0~100（上下各留 3 边距；保持各K线相对位置与形态比例）
	let gTop = Number.MAX_SAFE_INTEGER
	let gBottom = -1
	for (const s of infos) {
		gTop = Math.min(gTop, s.top)
		gBottom = Math.max(gBottom, s.bottom)
	}
	const range = gBottom - gTop
	if (range < 5) return fail('识别区域高度过小：请提供更清晰的截图')
	const val = (y: number): number => r1(3 + (gBottom - y) / range * 94)

	const candles: IRecognizedCandle[] = infos.map(s => {
		// 红（阳线）：实体上沿=收盘、下沿=开盘；绿（阴线）：上沿=开盘、下沿=收盘
		let o: number
		let c: number
		if (s.up) {
			c = val(s.bodyTop)
			o = val(s.bodyBottom)
		} else {
			o = val(s.bodyTop)
			c = val(s.bodyBottom)
		}
		// 几何不变量保险：h≥max(o,c)、l≤min(o,c)
		const hi = Math.max(val(s.top), o, c)
		const lo = Math.min(val(s.bottom), o, c)
		return { o, h: hi, l: lo, c }
	})
	return { ok: true, message: `识别到 ${candles.length} 根K线`, candles }
}
