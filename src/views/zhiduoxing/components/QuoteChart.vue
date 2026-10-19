<template>
	<div class="quote-chart">
		<div class="chart-header">
			<div class="header-left">
				<div class="period-tabs">
					<span v-for="p in PERIODS" :key="p.value" :class="{ active: period === p.value }" @click="switchPeriod(p.value)">
						{{ p.label }}
					</span>
				</div>
			</div>
			<div class="header-right">
				<div v-if="period !== 'minute' || canDraw" class="btn-group">
					<el-dropdown v-if="period !== 'minute'" trigger="click" @command="onFqtCommand" @visible-change="onFqtVisible">
						<span class="group-btn" :class="{ active: fqtOpen }" title="复权口径切换">
							{{ fqtLabel }}
							<font-awesome-icon fas icon="caret-down" class="group-caret"></font-awesome-icon>
						</span>
						<template #dropdown>
							<el-dropdown-menu>
								<el-dropdown-item v-for="f in FQT_OPTIONS" :key="f.value" :command="f.value" :class="{ 'fqt-item-on': fqt === f.value }">
									{{ f.label }}
								</el-dropdown-item>
							</el-dropdown-menu>
						</template>
					</el-dropdown>
					<span
						v-if="canDraw"
						class="group-btn"
						:class="{ active: drawPanelOpen }"
						:title="drawPanelOpen ? '收起画线工具' : '展开画线工具'"
						@click="toggleDrawPanel"
					>
						<font-awesome-icon fas icon="pen-ruler"></font-awesome-icon>
						<span>画线</span>
						<i v-if="drawingDirty" class="dirty-dot"></i>
					</span>
				</div>
				<span
					v-if="isReviewMode"
					class="forecast-btn"
					:class="{ active: drawMode === 'forecast', disabled: period !== 'day' }"
					:title="period !== 'day' ? '预测仅支持日K' : '在未来区域点击添加锚点，拖动调整，双击删除'"
					@click="toggleForecastMode"
				>
					预测走势
				</span>
			</div>
		</div>
		<div v-loading="chartLoading" class="chart-box">
			<!-- 画线悬浮工具栏：浮于图表顶部空白带，不推挤K线图布局 -->
			<div v-if="canDraw && (drawPanelOpen || drawMode === 'forecast')" class="draw-float">
				<template v-if="drawMode === 'forecast'">
					<span class="df-action primary" @click="saveForecastDraft">保存预测</span>
					<span class="df-action" @click="cancelForecastMode">取消</span>
				</template>
				<template v-else>
					<div class="df-tools">
						<span
							v-for="t in DRAW_TOOLS"
							:key="t.mode"
							class="df-tool"
							:class="{ active: drawMode === t.mode }"
							:title="t.label"
							@click="switchDrawMode(t.mode)"
						>
							<font-awesome-icon fas :icon="t.icon"></font-awesome-icon>
						</span>
					</div>
					<div class="df-sep"></div>
					<span class="df-action" :class="{ disabled: !hasSelectedShape }" @click="deleteSelectedShape">删除选中</span>
					<span class="df-action" :class="{ disabled: !drawShapes.length }" @click="clearDrawings">清空</span>
					<span class="df-action primary" @click="saveDrawings">
						保存画图<i v-if="drawingDirty" class="dirty-dot"></i>
					</span>
				</template>
			</div>
			<div ref="chart" class="chart" :style="{ visibility: isEmpty ? 'hidden' : 'visible' }"></div>
			<el-empty v-if="!chartLoading && isEmpty" class="chart-empty" description="暂无走势数据"></el-empty>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { dayjs, ElMessage, ElMessageBox } from 'element-plus'
import { IZdxStockDetail, IZdxStockTrend, IZdxStockKlinePoint } from '@/interfaces/zhiduoxing/IZdxStockDetail'
import { IZdxTradeRecordData } from '@/interfaces/zhiduoxing/IZdxMyTrade'
import { IZdxChartShape, IZdxForecastAnchor, IZdxStockForecast } from '@/interfaces/zhiduoxing/IZdxStockReview'
import { useChartDrawing } from './chart-drawing/useChartDrawing'
import { ChartDrawMode, DRAW_TOOLS } from './chart-drawing/types'
import { formatThousands } from '@/consts/zhiduoxing-const'
import zdxApi from '@/apis/zdx-api'

const props = defineProps<{
	code: string
	detail?: IZdxStockDetail
	// 该股交易记录（“我的地盘”导入；用于 K线/分时买卖点标记）
	trades?: IZdxTradeRecordData[]
	// 复盘模式（个股复盘页传入；启用画图工具栏与预测锚点编辑）
	reviewMode?: boolean
	// 画图模式（个股行情传入；启用画图工具栏，不含预测锚点与未来段）
	drawable?: boolean
	// 周K/月K隐藏买卖点（B/S/T）与支撑/压力位参考线（个股行情传入；分时/日K与其他页面不受影响）
	hideWeekMonthMarks?: boolean
	// 预测列表（复盘模式；其中“进行中”预测在图上渲染蓝色虚线路径）
	forecasts?: IZdxStockForecast[]
}>()

// 预测保存事件（画图保存直接调接口，保存成功 emit drawing-saved 通知宿主刷新）
const emit = defineEmits<{
	(e: 'forecast-save', anchors: IZdxForecastAnchor[]): void
	(e: 'drawing-saved'): void
	// 双击K线（非绘制/预测编辑中）：携带该根K线日期（分时=当天），供宿主按日期打开复盘
	(e: 'date-dblclick', date: string): void
}>()

// 涨红跌绿（与行情页一致）
const upColor = '#f56c6c'
const downColor = '#67c23a'
// 做T标记色（同一根K线买卖并存的 T 标记；黄色与买卖红绿区分）
const tColor = '#f7ba2a'

// 周期切换（本轮不含 MACD/KDJ/RSI 副图指标）
const PERIODS = [
	{ value: 'minute', label: '分时' },
	{ value: 'day', label: '日K' },
	{ value: 'week', label: '周K' },
	{ value: 'month', label: '月K' }
]
// 复权口径切换（K线专用，分时不受影响；默认前复权，localStorage 记忆；买卖点按当日比率折算到显示口径）
const FQT_OPTIONS = [
	{ value: 'qfq', label: '前复权', tip: '历史价格消除除权影响，K线连续（默认）' },
	{ value: 'none', label: '不复权', tip: '实际成交价格走势，与历史成交价口径一致' }
]
const FQT_STORAGE_KEY = 'zhiduoxing_kline_fqt'
// K线请求条数（覆盖MA窗口，与行情页口径一致）
const KLINE_COUNT: Record<string, number> = { day: 600, week: 250, month: 120 }
// K线默认可视窗口（根数）：日K近60个交易日、月K近3年；周K默认今年以来（按日期计算）
const KLINE_DEFAULT_DAYS = 60
const KLINE_DEFAULT_MONTHS = 36
// K线x轴刻度候选步长（根/格；缩放自适应时从中选最贴近"视窗约10格"的值）
const KLINE_TICK_CANDIDATES: Record<string, number[]> = {
	day: [1, 2, 3, 5, 10, 12, 15, 20, 30, 60],
	week: [1, 2, 4, 8, 13, 26, 52],
	month: [1, 3, 6, 12, 24, 36]
}
// K线刻度目标格数（视窗内约10格，据此选择候选步长）
const KLINE_TARGET_TICKS = 10
// K线均线键（与后端 DTO 字段一致）
type StockMaKey = 'Ma5' | 'Ma20' | 'Ma120' | 'Ma250' | 'Ma4' | 'Ma12' | 'Ma24' | 'Ma48' | 'Ma3' | 'Ma6'
type StockVolMaKey = 'VolMa5' | 'VolMa10' | 'VolMa20' | 'VolMa4' | 'VolMa12' | 'VolMa3' | 'VolMa6'
// K线均线配置（日K：MA5/MA20/MA120/MA250；周K：MA4/MA12/MA24/MA48；月K：MA3/MA6/MA12；
// 均线值由后端读取时全序列计算填充，不足周期为空）
const KLINE_MA_LINES: Record<string, { key: StockMaKey; label: string; color: string }[]> = {
	day: [
		{ key: 'Ma5', label: 'MA5', color: '#f5c542' },
		{ key: 'Ma20', label: 'MA20', color: '#e6a23c' },
		{ key: 'Ma120', label: 'MA120', color: '#409eff' },
		{ key: 'Ma250', label: 'MA250', color: '#b37feb' }
	],
	week: [
		{ key: 'Ma4', label: 'MA4', color: '#f5c542' },
		{ key: 'Ma12', label: 'MA12', color: '#e6a23c' },
		{ key: 'Ma24', label: 'MA24', color: '#409eff' },
		{ key: 'Ma48', label: 'MA48', color: '#b37feb' }
	],
	month: [
		{ key: 'Ma3', label: 'MA3', color: '#f5c542' },
		{ key: 'Ma6', label: 'MA6', color: '#e6a23c' },
		{ key: 'Ma12', label: 'MA12', color: '#409eff' }
	]
}
// 成交量区量均线配置（日K 量MA5/量MA20、周K 量MA4/量MA12、月K 量MA3/量MA6；
// 均线值由后端读取时全序列计算填充，不足周期为空不绘制；颜色与 tooltip 行保持一致）
const KLINE_VOL_MA_LINES: Record<string, { key: StockVolMaKey; label: string; color: string }[]> = {
	day: [
		{ key: 'VolMa5', label: '量MA5', color: '#00d4ff' },
		{ key: 'VolMa20', label: '量MA20', color: '#ff85c0' }
	],
	week: [
		{ key: 'VolMa4', label: '量MA4', color: '#00d4ff' },
		{ key: 'VolMa12', label: '量MA12', color: '#ff85c0' }
	],
	month: [
		{ key: 'VolMa3', label: '量MA3', color: '#00d4ff' },
		{ key: 'VolMa6', label: '量MA6', color: '#ff85c0' }
	]
}

const period = ref('minute')
const trend = ref<IZdxStockTrend>()
const klines = ref<IZdxStockKlinePoint[]>([])
// 另一口径 K 线序列（与当前显示口径相反；存在买卖点时随主口径并行拉取，用于买卖点坐标折算）
const klinesOther = ref<IZdxStockKlinePoint[]>([])
// 复权口径（K线默认前复权；localStorage 记忆用户选择）
const fqt = ref(localStorage.getItem(FQT_STORAGE_KEY) === 'none' ? 'none' : 'qfq')
const chartLoading = ref(false)
const chart = ref(null)
let myEchart: echarts.ECharts | null = null

// ---------- 复盘画图/预测状态（reviewMode 启用） ----------
// 是否复盘模式（个股复盘页传入）
const isReviewMode = computed(() => props.reviewMode === true)
// 是否启用画图（复盘模式或个股行情 drawable；预测锚点与未来段仅复盘模式）
const canDraw = computed(() => isReviewMode.value || props.drawable === true)
// 画线面板展开态（总开关控制；展开后才显示线型选择功能区）
const drawPanelOpen = ref(false)
// 画图模式（工具栏控制；select 时图表恢复常规交互）
const drawMode = ref<ChartDrawMode>('select')
// 已落图元（数据坐标 { Date, Price }，Price 存不复权价、显示时按比率折算）
const drawShapes = ref<IZdxChartShape[]>([])
// 手动支撑位/压力位（不复权价；null=按最近未回补缺口自动计算；保存后随画图数据重新加载）
const manualSupport = ref<number | null>(null)
const manualResist = ref<number | null>(null)
// 画图未保存标记（有图元变更且未点保存）
const drawingDirty = ref(false)
// 预测锚点编辑草稿（进入预测模式时初始化；空数组=显示进行中预测）
const forecastDraft = ref<IZdxForecastAnchor[]>([])
// 预测未保存标记
const forecastDirty = ref(false)
// 未来交易日（复盘模式日K；用于 x 轴扩展未来段，最多 20 个）
const futureDays = ref<string[]>([])
// 复权折算比率缓存（ratio=前复权收盘÷不复权收盘；K线数据加载后一次性构建，引擎高频读取）
let ratioCache = new Map<string, number>()

// 空数据（无走势/K线时展示空态占位）
const isEmpty = computed(() =>
	period.value === 'minute' ? !trend.value || trend.value.Times.length === 0 : klines.value.length === 0
)

// ---------- 数据加载（序号防竞态：快速切换股票/周期时丢弃过期响应） ----------
let loadSeq = 0
async function loadChart() {
	if (!props.code) return
	const seq = ++loadSeq
	chartLoading.value = true
	try {
		if (period.value === 'minute') {
			const data = await zdxApi.getStockTrend(props.code)
			if (seq !== loadSeq) return
			trend.value = data
			klines.value = []
			klinesOther.value = []
			futureDays.value = []
		} else {
			// 主口径 + 另一口径（存在买卖点或复盘模式时并行拉取，用于买卖点/图元/预测锚点坐标折算；失败静默为空）
			const needOther = hasTradeMarks.value || canDraw.value
			const otherFqt = fqt.value === 'qfq' ? 'none' : 'qfq'
			const [data, other] = await Promise.all([
				zdxApi.getStockKlines(props.code, period.value, KLINE_COUNT[period.value], fqt.value),
				needOther
					? zdxApi.getStockKlines(props.code, period.value, KLINE_COUNT[period.value], otherFqt).catch(() => [] as IZdxStockKlinePoint[])
					: Promise.resolve([] as IZdxStockKlinePoint[])
			])
			if (seq !== loadSeq) return
			klines.value = data ?? []
			klinesOther.value = other ?? []
			trend.value = undefined
			// 折算比率缓存（买卖点/图元/预测锚点共用）
			ratioCache = buildFqtRatioMap()
			// 未来交易日（复盘模式日K；x 轴扩展未来段）
			await loadFutureDays()
			if (seq !== loadSeq) return
		}
	} catch {
		if (seq !== loadSeq) return
		trend.value = undefined
		klines.value = []
		klinesOther.value = []
		futureDays.value = []
	} finally {
		if (seq === loadSeq) {
			chartLoading.value = false
			resetDrawState()
			renderChart()
		}
	}
}

function switchPeriod(value: string) {
	if (period.value === value) return
	period.value = value
	loadChart()
}

// 切换复权口径（K线重拉；localStorage 记忆）
function switchFqt(value: string) {
	if (fqt.value === value) return
	fqt.value = value
	localStorage.setItem(FQT_STORAGE_KEY, value)
	loadChart()
}

// 复权下拉（按钮组内；显示当前口径，点开切换）
const fqtOpen = ref(false)
const fqtLabel = computed(() => FQT_OPTIONS.find(f => f.value === fqt.value)?.label ?? '前复权')

function onFqtVisible(visible: boolean) {
	fqtOpen.value = visible
}

function onFqtCommand(value: string | number | object) {
	switchFqt(String(value))
}

// ---------- 买卖点标记（数据来自“我的地盘”导入的交易记录） ----------
interface ITradeMark {
	// 交易日（yyyy-MM-dd）
	Date: string
	// 1买入 2卖出 0做T（同一根K线上买卖并存时融合）
	Category: number
	// 合计数量（股）
	Volume: number
	// 合计成交金额（元）
	Amount: number
	// 标记价（同方向聚合均价）
	Price: number
	// 合并笔数
	Count: number
	// 做T（Category=0）时卖出部分的量/金额/均价/笔数（主字段保留买入部分）
	SellVolume?: number
	SellAmount?: number
	SellPrice?: number
	SellCount?: number
}

// 分时档位标记（在日聚合结构上增加档位索引）
interface ITrendMark extends ITradeMark {
	Slot: number
}

// 是否展示买卖点图例（存在买卖成交类记录时才显示）
const hasTradeMarks = computed(() => (props.trades ?? []).some(r => r.Category === 1 || r.Category === 2))

// 单笔金额（与交易记录统计口径一致：成交金额缺失时退回发生金额绝对值）
function tradeAmount(r: IZdxTradeRecordData) {
	return r.Amount > 0 ? r.Amount : Math.abs(r.CashAmount ?? 0)
}

// 按成交日聚合（同日同方向合并：数量/金额累加，标记价=金额÷数量；金额异常时保留原价）
function buildDailyMarks(): ITradeMark[] {
	const map = new Map<string, ITradeMark>()
	for (const r of props.trades ?? []) {
		if (r.Category !== 1 && r.Category !== 2) continue
		const day = (r.TradeDate ?? '').slice(0, 10)
		if (!day) continue
		const key = `${day}_${r.Category}`
		const item = map.get(key)
		if (item) {
			item.Volume += r.Volume
			item.Amount += tradeAmount(r)
			item.Count++
			continue
		}
		map.set(key, { Date: day, Category: r.Category, Volume: r.Volume, Amount: tradeAmount(r), Price: r.Price, Count: 1 })
	}
	const list: ITradeMark[] = []
	for (const item of map.values()) {
		if (item.Volume > 0 && item.Amount > 0) item.Price = item.Amount / item.Volume
		list.push(item)
	}
	return list
}

// 构建“周期根日期 → 复权比率”映射（ratio = 前复权收盘 ÷ 不复权收盘；同一交易日两口径同因子，
// 可把实际成交价精确折算到前复权口径；另一口径序列未就绪或日期缺失时无映射，折算回退原值）
function buildFqtRatioMap(): Map<string, number> {
	const map = new Map<string, number>()
	if (!klinesOther.value.length) return map
	const qfqList = fqt.value === 'qfq' ? klines.value : klinesOther.value
	const rawList = fqt.value === 'qfq' ? klinesOther.value : klines.value
	const rawMap = new Map<string, number>()
	for (const k of rawList) {
		if (typeof k.Close === 'number' && k.Close > 0) rawMap.set(k.Date, k.Close)
	}
	for (const k of qfqList) {
		const rawClose = rawMap.get(k.Date)
		if (typeof k.Close === 'number' && k.Close > 0 && typeof rawClose === 'number' && rawClose > 0) {
			map.set(k.Date, k.Close / rawClose)
		}
	}
	return map
}

// 分时买卖点（仅标记今天的成交；TradeTime 向下取整到最近分时档位，同档同方向合并；
// 返回“标记 + 档位时间”，供 markPoint 绘制与 tooltip 展示买卖信息共用）
function buildTrendMarks(times: string[]): { mark: ITrendMark; date: string }[] {
	if (!times.length) return []
	const today = dayjs().format('YYYY-MM-DD')
	const slotOf = (hhmm: string) => {
		let idx = 0
		for (let i = 0; i < times.length; i++) {
			if (times[i] <= hhmm) idx = i
			else break
		}
		return idx
	}
	const map = new Map<string, ITrendMark>()
	for (const r of props.trades ?? []) {
		if (r.Category !== 1 && r.Category !== 2) continue
		if ((r.TradeDate ?? '').slice(0, 10) !== today) continue
		const hhmm = (r.TradeTime || (r.TradeDate ?? '').slice(11, 16)).slice(0, 5)
		if (!/^\d{2}:\d{2}$/.test(hhmm)) continue
		const slot = slotOf(hhmm)
		const key = `${slot}_${r.Category}`
		const item = map.get(key)
		if (item) {
			item.Volume += r.Volume
			item.Amount += tradeAmount(r)
			item.Count++
			continue
		}
		map.set(key, { Date: today, Category: r.Category, Volume: r.Volume, Amount: tradeAmount(r), Price: r.Price, Count: 1, Slot: slot })
	}
	const list: { mark: ITrendMark; date: string }[] = []
	for (const item of map.values()) {
		if (item.Volume > 0 && item.Amount > 0) item.Price = item.Amount / item.Volume
		list.push({ mark: item, date: times[item.Slot] ?? times[0] })
	}
	return list
}

// 买卖点标记数据项（B=买入红、S=卖出绿、T=做T黄；标记价可传入校正价，买卖符号上下错位避免同价重叠）
function tradeMarkItem(mark: ITradeMark, date: string, price = mark.Price): any {
	// 做T（同一根K线既有买入又有卖出）：黄色向上三角形 + T 标签（悬于K线上方）
	if (mark.Category === 0) {
		return {
			name: `做T 买入 ${mark.Count} 笔 / 卖出 ${mark.SellCount ?? 0} 笔`,
			coord: [date, price],
			symbol: 'triangle',
			symbolRotate: 0,
			symbolSize: 8,
			symbolOffset: [0, -16],
			itemStyle: { color: tColor },
			label: {
				show: true,
				position: 'top',
				formatter: 'T',
				color: tColor,
				fontSize: 10,
				fontWeight: 'bold'
			}
		}
	}
	const isBuy = mark.Category === 1
	return {
		name: `${isBuy ? '买入' : '卖出'} ${mark.Count} 笔`,
		coord: [date, price],
		symbol: 'triangle',
		symbolRotate: isBuy ? 0 : 180,
		symbolSize: 8,
		symbolOffset: [0, isBuy ? 16 : -16],
		itemStyle: { color: isBuy ? upColor : downColor },
		label: {
			show: true,
			position: isBuy ? 'bottom' : 'top',
			formatter: isBuy ? 'B' : 'S',
			color: isBuy ? upColor : downColor,
			fontSize: 10,
			fontWeight: 'bold'
		}
	}
}

// 买卖点 tooltip 信息块（类别/数量/均价/金额；同根多笔合并时标注笔数；做T时分行展示买入与卖出两段）
function tradeMarkLines(marks: ITradeMark[]): string {
	// 单方向信息段（label 买入/卖出，颜色红/绿）
	const block = (label: string, color: string, volume: number, amount: number, price: number, count: number) => {
		const cnt = count > 1 ? `<span style="color:#a7abba;font-weight:400">（${count} 笔合并）</span>` : ''
		return `<div style="color:${color};font-weight:600">${label} ${Math.round(volume).toLocaleString('en-US')} 股${cnt}</div>`
			+ `<div style="display:flex;justify-content:space-between;gap:18px"><span>均价</span><span style="color:${color}">${price.toFixed(3)}</span></div>`
			+ `<div style="display:flex;justify-content:space-between;gap:18px"><span>成交金额</span><span style="color:${color}">${formatThousands(amount)}</span></div>`
	}
	const rows = marks.map(m => {
		// 做T：买入段 + 卖出段（主字段为买入，Sell* 为卖出）
		if (m.Category === 0) {
			return block('买入', upColor, m.Volume, m.Amount, m.Price, m.Count)
				+ block('卖出', downColor, m.SellVolume ?? 0, m.SellAmount ?? 0, m.SellPrice ?? m.Price, m.SellCount ?? 0)
		}
		const isBuy = m.Category === 1
		return block(isBuy ? '买入' : '卖出', isBuy ? upColor : downColor, m.Volume, m.Amount, m.Price, m.Count)
	})
	return `<div style="border-top:1px solid rgba(255,255,255,0.16);margin:5px 0 3px"></div>${rows.join('')}`
}

// 同一根K线上的标记合并：同方向多笔累加为一条；买卖并存时融合为做T标记（Category=0，黄色 T），
// 主字段保留买入部分（量/金额/均价/笔数），卖出部分存 Sell* 字段；单方向仅一条时原样返回
function mergeRootTradeMarks(list: ITradeMark[]): ITradeMark[] {
	// 同方向聚合（量/金额/笔数累加，均价=金额÷数量；量或金额异常时回退首条均价）
	const fold = (arr: ITradeMark[], category: number): ITradeMark | null => {
		if (!arr.length) return null
		if (arr.length === 1) return arr[0]
		const volume = arr.reduce((s, m) => s + m.Volume, 0)
		const amount = arr.reduce((s, m) => s + m.Amount, 0)
		const count = arr.reduce((s, m) => s + m.Count, 0)
		return {
			Date: arr[0].Date,
			Category: category,
			Volume: volume,
			Amount: amount,
			Price: volume > 0 && amount > 0 ? amount / volume : arr[0].Price,
			Count: count
		}
	}
	const buys = fold(list.filter(m => m.Category === 1), 1)
	const sells = fold(list.filter(m => m.Category === 2), 2)
	if (buys && sells) {
		return [{ ...buys, Category: 0, SellVolume: sells.Volume, SellAmount: sells.Amount, SellPrice: sells.Price, SellCount: sells.Count }]
	}
	const one = buys ?? sells
	return one ? [one] : list
}

// ---------- 复盘画图/预测（reviewMode） ----------
// K线渲染行（复盘模式日K在历史后拼接未来交易日；未来行仅占位日期，数据为空不绘制）
interface KlineRenderRow extends IZdxStockKlinePoint {
	Future?: boolean
}

// 未来交易日行（最后一根历史K之后的交易日，最多 5 个）
const futureRows = computed<KlineRenderRow[]>(() => {
	if (!isReviewMode.value || period.value !== 'day' || !futureDays.value.length || !klines.value.length) return []
	return futureDays.value.map(d => ({ Date: d, Future: true } as unknown as KlineRenderRow))
})

// K线渲染序列（含未来段）与类目序列（引擎坐标换算共用）
const renderRows = computed<KlineRenderRow[]>(() =>
	period.value === 'minute' ? [] : ([...klines.value, ...futureRows.value] as KlineRenderRow[])
)
const renderCategories = computed(() => (period.value === 'minute' ? trend.value?.Times ?? [] : renderRows.value.map(k => k.Date)))

// “进行中”预测（图上渲染的预测路径）
const activeForecast = computed(() => (props.forecasts ?? []).find(f => f.Status === 1))
// 图上预测锚点：编辑草稿优先，否则进行中预测的锚点（仅日K展示）
const displayForecastAnchors = computed(() => {
	if (period.value !== 'day') return []
	return forecastDraft.value.length ? forecastDraft.value : activeForecast.value?.Anchors ?? []
})

// 复权比率（不复权 → 显示口径；未来日期取最新已知比率；分时/不复权口径返回 1）
function ratioOf(date: string): number {
	if (period.value === 'minute' || fqt.value !== 'qfq') return 1
	const r = ratioCache.get(date)
	if (typeof r === 'number' && r > 0) return r
	const last = klines.value[klines.value.length - 1]
	const lr = last ? ratioCache.get(last.Date) : undefined
	return typeof lr === 'number' && lr > 0 ? lr : 1
}

// 不复权价 → 显示口径价 / 显示口径价 → 不复权价（图元与预测锚点口径折算）
function displayPriceOf(date: string, rawPrice: number): number {
	return rawPrice * ratioOf(date)
}

function rawPriceOf(date: string, displayPrice: number): number {
	const r = ratioOf(date)
	return r > 0 ? displayPrice / r : displayPrice
}

// 最新交易日不复权收盘（预测起点锚点价格；取自另一口径序列）
function rawCloseOf(date: string): number {
	const rawList = fqt.value === 'qfq' ? klinesOther.value : klines.value
	const k = rawList.find(item => item.Date === date)
	return k && typeof k.Close === 'number' ? k.Close : 0
}

// 解析画图回显 JSON（非法数据静默为空）
function parseDrawingJson(raw?: string): IZdxChartShape[] {
	if (!raw) return []
	try {
		const list = JSON.parse(raw)
		if (!Array.isArray(list)) return []
		return list.filter((s: any) => s && typeof s.Type === 'string' && Array.isArray(s.Points))
	} catch {
		return []
	}
}

// 画图数据加载（序号防竞态；切换股票/周期时重新拉取回显）
let drawSeq = 0
async function loadDrawing() {
	const seq = ++drawSeq
	if (!canDraw.value || !props.code) {
		drawShapes.value = []
		manualSupport.value = null
		manualResist.value = null
		return
	}
	let levelChanged = false
	try {
		const res = await zdxApi.getStockDrawing(props.code, period.value)
		if (seq !== drawSeq) return
		drawShapes.value = parseDrawingJson(res?.Drawings)
		const sup = res?.SupportPrice ?? null
		const rst = res?.ResistPrice ?? null
		levelChanged = sup !== manualSupport.value || rst !== manualResist.value
		manualSupport.value = sup
		manualResist.value = rst
	} catch {
		if (seq !== drawSeq) return
		drawShapes.value = []
		levelChanged = manualSupport.value !== null || manualResist.value !== null
		manualSupport.value = null
		manualResist.value = null
	}
	drawingDirty.value = false
	drawing.redraw()
	// 手动支撑/压力位变化时刷新K线参考线（K线已加载时立即重绘；未加载则渲染时自然取用新值）
	if (levelChanged && klines.value.length) renderChart()
}

// 复盘编辑态重置（切换股票/周期时丢弃未保存改动；重新拉取画图回显）
function resetDrawState() {
	drawMode.value = 'select'
	forecastDraft.value = []
	forecastDirty.value = false
	drawingDirty.value = false
	loadDrawing()
}

// 支撑/压力位保存后由父组件调用：重拉画图数据（loadDrawing 检测到手动值变化后刷新K线参考线）
function reloadDrawing() {
	loadDrawing()
}

// ---------- 公告事件定位（事件回测视图[在K线图上查看]） ----------
// 事件标记状态：date=基准交易日（T+0，已顺延口径）、direction=1利好 2利空 3中性、endIdx=色块右端偏移根数
const eventMark = ref<{ date: string; direction: number; endIdx: number } | null>(null)

// 事件泳道标记列表（2.0：事件回测视图多事件传入，日K下方独立小 grid 泳道，替代单事件扩声器 pin）
const eventMarks = ref<{ date: string; title: string; direction: number }[]>([])

// 泳道标记图形：FontAwesome fa-bullhorn（扩声器）SVG path，与全站图标体系一致（ECharts path symbol，viewBox 512）
const EVENT_LANE_SYMBOL =
	'path://M480 32c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9L381.7 53c-48 48-113.1 75-181 75H192 160 64c-35.3 0-64 28.7-64 64v96c0 35.3 28.7 64 64 64l0 128c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V352l8.7 0c67.9 0 133 27 181 75l43.6 43.6c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V300.4c18.6-8.8 32-32.5 32-60.4s-13.4-51.6-32-60.4V32zm-64 76.7V240 371.3C357.2 317.8 280.5 288 200.7 288H192V192h8.7c79.8 0 156.5-29.8 215.3-83.3z'

// 传入事件列表（StockDetail 监听 events-loaded 转发 IZdxStockEvent[]）：映射日K根在 renderKline 内完成
function setEventMarks(list: any[]) {
	eventMarks.value = (list ?? [])
		.map(ev => ({
			date: String(ev.BaseTradeDate ?? ev.EventDate ?? '').slice(0, 10),
			title: ev.Title ?? '',
			direction: ev.Direction ?? 3
		}))
		.filter(m => m.date)
	if (myEchart && !isEmpty.value && period.value === 'day') renderChart()
}

// 定位事件日：切回日K→泳道高亮对应标记并绘制 T+0→T+endIdx 半透明色块→视窗滚动至事件区间
async function focusEvent(date: string, direction: number, endIdx = 20) {
	if (!date) return
	eventMark.value = { date, direction, endIdx }
	if (period.value !== 'day') {
		// 周期切日K（loadChart 内渲染已包含事件标记）
		period.value = 'day'
		await loadChart()
	} else {
		renderChart()
	}
	nextTick(() => scrollEventWindow())
}

// 视窗滚动：事件日前 8 根至 T+endIdx 后 8 根（与 focusFutureArea 同 dataZoom 索引口径）
function scrollEventWindow() {
	if (!myEchart || !eventMark.value || period.value !== 'day' || !renderRows.value.length) return
	const idx = renderRows.value.findIndex(k => String(k.Date).slice(0, 10) >= eventMark.value!.date)
	if (idx < 0) return
	const start = Math.max(0, idx - 8)
	const end = Math.min(renderRows.value.length - 1, idx + eventMark.value.endIdx + 8)
	myEchart.dispatchAction({ type: 'dataZoom', startValue: start, endValue: end })
}

defineExpose({ reloadDrawing, focusEvent, setEventMarks })

// 未来交易日加载（复盘模式日K；自然日范围取约 45 天，截取 5 个交易日）
async function loadFutureDays() {
	if (!props.reviewMode || period.value !== 'day' || !klines.value.length) {
		futureDays.value = []
		return
	}
	try {
		const begin = dayjs().format('YYYY-MM-DD')
		const end = dayjs().add(45, 'day').format('YYYY-MM-DD')
		const days = await zdxApi.getTradeDays(begin, end)
		const lastK = klines.value[klines.value.length - 1]?.Date ?? ''
		futureDays.value = (days ?? [])
			.filter(d => d.IsTradeDay)
			.map(d => (d.TradeDate ?? '').slice(0, 10))
			.filter(d => d && d > lastK)
			.slice(0, 5)
	} catch {
		futureDays.value = []
	}
}

// 画线总开关：开启后显示线型选择功能区；关闭时退出绘制工具（预测编辑保持，由预测按钮单独控制）
function toggleDrawPanel() {
	if (drawPanelOpen.value) {
		drawPanelOpen.value = false
		if (drawMode.value !== 'select' && drawMode.value !== 'forecast') drawMode.value = 'select'
	} else {
		drawPanelOpen.value = true
	}
}

// 切换画图工具（退出预测编辑时丢弃未保存的预测改动）
function switchDrawMode(mode: ChartDrawMode) {
	if (drawMode.value === mode) return
	if (drawMode.value === 'forecast') {
		if (forecastDirty.value) ElMessage.info('已退出预测编辑，未保存的预测已丢弃')
		forecastDraft.value = []
		forecastDirty.value = false
	}
	drawMode.value = mode
}

// 进入/退出预测编辑模式（仅日K）
function toggleForecastMode() {
	if (period.value !== 'day') {
		ElMessage.info('预测仅支持日K')
		return
	}
	if (drawMode.value === 'forecast') {
		cancelForecastMode()
		return
	}
	if (activeForecast.value?.Anchors?.length) {
		forecastDraft.value = activeForecast.value.Anchors.map(a => ({ ...a }))
	} else {
		const last = klines.value[klines.value.length - 1]
		if (!last) {
			ElMessage.warning('暂无K线数据，无法建立预测')
			return
		}
		forecastDraft.value = [{ Date: last.Date, Price: rawCloseOf(last.Date) }]
	}
	forecastDirty.value = false
	drawMode.value = 'forecast'
	focusFutureArea()
}

// 退出预测编辑（丢弃草稿）
function cancelForecastMode() {
	if (forecastDirty.value) ElMessage.info('已退出预测编辑，未保存的预测已丢弃')
	forecastDraft.value = []
	forecastDirty.value = false
	drawMode.value = 'select'
}

// 预测模式自动滚动到含未来段右侧（保留近 30 根历史作为上下文）
function focusFutureArea() {
	if (!myEchart || period.value !== 'day' || !futureRows.value.length) return
	const total = renderRows.value.length
	const start = Math.max(0, klines.value.length - 30)
	myEchart.dispatchAction({ type: 'dataZoom', startValue: start, endValue: total - 1 })
}

// 保存预测（校验锚点；存在进行中预测时二次确认覆盖；实际保存由宿主完成）
async function saveForecastDraft() {
	if (period.value !== 'day') return
	const anchors = [...forecastDraft.value].sort((a, b) => a.Date.localeCompare(b.Date))
	if (anchors.length < 2) {
		ElMessage.warning('预测至少需要 2 个锚点（最新交易日起点 + 至少一个未来交易日）')
		return
	}
	if (anchors.length > 6) {
		ElMessage.warning('预测锚点最多 6 个（含起点，即预测期限最多 5 个交易日）')
		return
	}
	for (let i = 1; i < anchors.length; i++) {
		if (anchors[i].Date === anchors[i - 1].Date) {
			ElMessage.warning('锚点日期不能重复，请调整后重试')
			return
		}
	}
	if (activeForecast.value) {
		try {
			await ElMessageBox.confirm('已存在进行中的预测，保存后将覆盖该预测，是否继续？', '覆盖预测确认', {
				confirmButtonText: '覆盖保存',
				cancelButtonText: '取消',
				type: 'warning'
			})
		} catch {
			return
		}
	}
	forecastDirty.value = false
	emit('forecast-save', anchors)
}

// 保存画图（当前股票 + 周期，存在则覆盖）
async function saveDrawings() {
	if (!canDraw.value || !props.code) return
	try {
		await zdxApi.saveStockDrawing({
			StockCode: props.code,
			Period: period.value,
			Drawings: JSON.stringify(drawShapes.value)
		})
		drawingDirty.value = false
		ElMessage.success('画图已保存')
		emit('drawing-saved')
	} catch (err: any) {
		ElMessage.error(err?.message || '画图保存失败')
	}
}

// 清空当前周期画图（清空后需点“保存画图”落库）
async function clearDrawings() {
	if (!drawShapes.value.length) return
	try {
		await ElMessageBox.confirm('确认清空当前周期的全部画图？清空后需点击“保存画图”才会生效。', '清空画图', {
			confirmButtonText: '清空',
			cancelButtonText: '取消',
			type: 'warning'
		})
	} catch {
		return
	}
	drawShapes.value = []
	drawingDirty.value = true
	drawing.redraw()
}

// 删除选中图元（工具栏按钮；键盘 Delete 由引擎处理）
function deleteSelectedShape() {
	if (drawing.selectedIndex.value < 0) return
	drawing.deleteSelected()
}

// 是否有选中的图元（“删除选中”按钮可用态）
const hasSelectedShape = computed(() => drawing.selectedIndex.value >= 0)

// 画图引擎（zrender 层自绘；状态由本组件持有，引擎经回调修改）
const drawing = useChartDrawing({
	getChart: () => myEchart,
	getCategories: () => renderCategories.value,
	getHistoryCount: () => (period.value === 'minute' ? trend.value?.Times.length ?? 0 : klines.value.length),
	parseCategory: date => (period.value === 'minute' ? date.slice(11, 16) : date),
	formatCategory: cat => (period.value === 'minute' ? `${dayjs().format('YYYY-MM-DD')} ${cat}` : cat),
	toDisplayPrice: (date, raw) => displayPriceOf(date, raw),
	toRawPrice: (date, disp) => rawPriceOf(date, disp),
	mode: drawMode,
	enabled: canDraw,
	getShapes: () => drawShapes.value,
	setShapes: list => {
		drawShapes.value = list
	},
	getForecastAnchors: () => displayForecastAnchors.value,
	setForecastAnchors: list => {
		forecastDraft.value = list
	},
	onShapesChange: () => {
		drawingDirty.value = true
	},
	onForecastChange: () => {
		forecastDirty.value = true
	}
})

// ---------- 渲染 ----------
function renderChart() {
	if (!myEchart) return
	if (isEmpty.value) {
		myEchart.clear()
		return
	}
	if (period.value === 'minute') {
		renderTrend()
	} else {
		renderKline()
	}
	// 复盘画图/预测跟随重绘（含普通模式下的相对定位刷新）
	drawing.redraw()
}

// 分时图：价格线（涨跌染色+渐变面积）+均价线+昨收基准虚线+右侧涨跌幅轴+成交量柱
function renderTrend() {
	const data = trend.value!
	const prevClose = props.detail?.PrevClose ?? data.Prices[0]
	const isUp = (props.detail?.ChangePercent ?? 0) >= 0
	const lineColor = isUp ? upColor : downColor

	// 收盘补齐：最后点定格于 14:57（盘后数据未收满 15:00）时补一个 15:00 点（取最后值），修复"截止 14:57"
	const times = [...data.Times]
	const prices = [...data.Prices]
	const avg = [...(data.Avg ?? [])]
	const volumes = [...(data.Volumes ?? [])]
	const lastTime = times[times.length - 1]
	if (lastTime && lastTime >= '14:57' && lastTime < '15:00') {
		times.push('15:00')
		prices.push(prices[prices.length - 1])
		if (avg.length) avg.push(avg[avg.length - 1])
		if (volumes.length) volumes.push(volumes[volumes.length - 1])
	}
	// 接口分时量为累计量（逐点递增），绘制量柱需转区间增量（首点为开盘首段），负向异常钳制为0
	const volDeltas = volumes.map((v, i) => (i === 0 ? v : Math.max(0, +(v - volumes[i - 1]).toFixed(2))))
	const volTop = niceVolTop(Math.max(...volDeltas, 0))

	// 价格轴范围（含昨收，上下留白；prices 为补齐后的本地数组）
	const minP = Math.min(...prices, prevClose)
	const maxP = Math.max(...prices, prevClose)
	const pad = Math.max((maxP - minP) * 0.15, prevClose * 0.002)
	const yMin = minP - pad
	const yMax = maxP + pad
	const pct = (v: number) => +(((v - prevClose) / prevClose) * 100).toFixed(2)
	// 时间刻度：标签与网格线同频，仅显示 09:30 / 11:30（午休两端合并显示为一个"11:30/13:00"刻度）/ 15:00；
	// 其余刻度通过悬浮提示查看（11:30与13:00在类目轴上相邻，午休不占位、数据线自然衔接）
	const keyTick = (_index: number, value: string) => value === '09:30' || value === '11:30' || value === '15:00'

	// 当日买卖点（档位时间 → 标记列表：markPoint 绘制 + tooltip 悬浮时展示买卖信息）
	const trendMarks: any[] = []
	const trendMarkMap = new Map<string, ITradeMark[]>()
	for (const { mark, date } of buildTrendMarks(times)) {
		trendMarks.push(tradeMarkItem(mark, date, mark.Price))
		const arr = trendMarkMap.get(date) ?? []
		arr.push(mark)
		trendMarkMap.set(date, arr)
	}

	const option = {
		animation: false,
		tooltip: {
			trigger: 'axis',
			// 提示线跨双图联动（价格图与成交量图同列提示线同步）
			axisPointer: { type: 'line', link: [{ xAxisIndex: 'all' }] },
			backgroundColor: 'rgba(48, 49, 51, 0.92)',
			borderColor: 'rgba(48, 49, 51, 0.92)',
			borderRadius: 8,
			textStyle: { color: '#ffffff', fontSize: 12 },
			formatter: (params: any) => {
				const list = Array.isArray(params) ? params : [params]
				const i = list[0]?.dataIndex
				if (typeof i !== 'number') return ''
				const price = prices[i]
				const avgPrice = avg[i]
				if (typeof price !== 'number') return ''
				// 两列行（标签左、数值右；数值按需着色）
				const row = (label: string, value: string, color = '#ffffff') =>
					`<div style="display:flex;justify-content:space-between;gap:18px"><span>${label}</span><span style="color:${color}">${value}</span></div>`
				const changeAmount = +(price - prevClose).toFixed(2)
				const percent = pct(price)
				const cls = percent === 0 ? '#ffffff' : percent > 0 ? upColor : downColor
				const lines = [`<div style="font-weight:600;margin-bottom:3px">${times[i]}</div>`]
				lines.push(row('价格', price.toFixed(2)))
				lines.push(row('均价', Number(avgPrice).toFixed(2)))
				lines.push(row('涨跌额', `${changeAmount > 0 ? '+' : ''}${changeAmount.toFixed(2)}`, cls))
				lines.push(row('涨跌幅', `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`, cls))
				lines.push(row('成交量', formatVolume(volDeltas[i])))
				// 悬浮所在分时档位有买卖成交时，展示对应买卖信息（类别/数量/均价/金额）
				const marks = trendMarkMap.get(times[i])
				if (marks) lines.push(tradeMarkLines(marks))
				return `<div style="font-size:12px;line-height:1.7;min-width:150px">${lines.join('')}</div>`
			}
		},
		grid: [
			{ left: 60, right: 64, top: 14, height: '58%' },
			{ left: 60, right: 64, top: '72%', height: '16%' }
		],
		xAxis: [
			{
				type: 'category',
				data: times,
				boundaryGap: false,
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: {
					color: '#a7abba',
					// 时间标签仅显示 09:30 / 11:30（显示为"11:30/13:00"）/ 15:00 三个刻度，其余悬浮查看
					interval: keyTick,
					formatter: (value: string) => (value === '11:30' ? '11:30/13:00' : value)
				},
				splitLine: { show: true, interval: keyTick, lineStyle: { type: 'dashed', color: '#f0f2f7' } }
			},
			{
				type: 'category',
				gridIndex: 1,
				data: times,
				boundaryGap: false,
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: { show: false }
			}
		],
		yAxis: [
			{
				type: 'value',
				min: +yMin.toFixed(2),
				max: +yMax.toFixed(2),
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: { color: '#a7abba' },
				splitLine: { show: true, lineStyle: { type: 'dashed', color: '#f0f2f7' } }
			},
			{
				type: 'value',
				position: 'right',
				min: +pct(yMin).toFixed(2),
				max: +pct(yMax).toFixed(2),
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: { color: '#a7abba', formatter: (v: number) => v.toFixed(2) + '%' },
				splitLine: { show: false }
			},
			// 分时成交量轴（只保留 0 与峰值取整值两档刻度，口径与K线量轴一致：×100 为手）
			{
				type: 'value',
				gridIndex: 1,
				min: 0,
				max: volTop > 0 ? volTop : undefined,
				interval: volTop > 0 ? volTop : undefined,
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: { show: true, fontSize: 10, color: '#a7abba', formatter: (v: number) => formatVolume(v, false) },
				splitLine: { show: false }
			}
		],
		series: [
			{
				name: '价格',
				type: 'line',
				showSymbol: false,
				color: [lineColor],
				lineStyle: { width: 1.5 },
				areaStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 0.8, [
						{ offset: 0, color: lineColor + '55' },
						{ offset: 1, color: lineColor + '00' }
					])
				},
				data: prices,
				markLine: {
					symbol: 'none',
					silent: true,
					lineStyle: { type: 'dashed', color: '#c6ccda', width: 1 },
					label: {
						show: true,
						position: 'insideStartTop',
						color: '#fff',
						backgroundColor: '#a7abba',
						padding: [2, 6],
						borderRadius: 3,
						fontSize: 11,
						formatter: prevClose.toFixed(2)
					},
					data: [{ yAxis: prevClose }]
				},
				// 当日买卖点标记（仅标记今天的成交；时间向下取整到最近分时档位，同档同方向合并）
				markPoint: {
					data: trendMarks
				}
			},
			{
				name: '均价',
				type: 'line',
				showSymbol: false,
				color: ['#e6a23c'],
				lineStyle: { width: 1.5, type: 'dashed' },
				data: avg
			},
			{
				name: '成交量',
				type: 'bar',
				xAxisIndex: 1,
				yAxisIndex: 2,
				barWidth: '60%',
				data: volDeltas.map((v, i) => ({
					value: v,
					itemStyle: { color: i > 0 && prices[i] >= prices[i - 1] ? upColor : downColor }
				}))
			}
		]
	}
	myEchart?.setOption(option, true)
}

// 当前K线刻度步长（根/格；随 dataZoom 缩放自适应重算）
let klineTickStep = 5
// 量轴当前轴顶（渲染与缩放刷新共用；值未变化时不重复刷新）
let lastVolAxisTop = 0

// 按可见根数选择最贴近"视窗内约10格"的候选步长（平局取大，更贴近目标格数）
function pickTickStep(visible: number) {
	const candidates = KLINE_TICK_CANDIDATES[period.value] ?? KLINE_TICK_CANDIDATES.day
	const ideal = Math.max(1, visible) / KLINE_TARGET_TICKS
	let best = candidates[0]
	for (const c of candidates) {
		if (Math.abs(c - ideal) <= Math.abs(best - ideal)) best = c
	}
	return best
}

// 可见区间量系列峰值（成交量柱 + 当前周期各条量均线；均线为滑窗均值，视窗窄于均线周期时可能高于柱峰，一并纳入）
function visibleVolPeak(data: IZdxStockKlinePoint[], from: number, to: number): number {
	let peak = 0
	const maKeys = (KLINE_VOL_MA_LINES[period.value] ?? []).map(ma => ma.key)
	for (let i = Math.max(0, from); i <= Math.min(data.length - 1, to); i++) {
		const row = data[i]
		if (typeof row.Volume === 'number' && row.Volume > peak) peak = row.Volume
		for (const key of maKeys) {
			const v = row[key]
			if (typeof v === 'number' && v > peak) peak = v
		}
	}
	return peak
}

// 量轴轴顶：在可见量峰上留少量余量（约6%）再向上取整到量级步长（如 2.1e5→2.2e5），
// 使轴顶紧贴可见峰值且为整洁数字（避免轴顶被远处历史峰值拉高、量柱显矮）
function niceVolTop(v: number) {
	if (!isFinite(v) || v <= 0) return 0
	const step = Math.pow(10, Math.floor(Math.log10(v)) - 1)
	return Number((Math.ceil((v * 1.06) / step) * step).toPrecision(12))
}

// 成交量口语化（字段口径为百手：源值×100 换算为手）：按量级自动切换 万亿手/亿手/万手/手；
// 数字自适应裁剪（≥100 整数、≥10 保留1位、其余2位并去尾零），如 41456.02 → "4.15 亿手"
function formatVolume(v: number | null | undefined, withUnit = true): string {
	if (typeof v !== 'number' || !isFinite(v)) return '--'
	const hands = v * 100
	const abs = Math.abs(hands)
	const trim = (n: number) => {
		const a = Math.abs(n)
		const s = a >= 100 ? n.toFixed(0) : a >= 10 ? n.toFixed(1) : n.toFixed(2)
		return String(Number(s))
	}
	if (abs >= 1e12) return `${trim(hands / 1e12)}${withUnit ? ' 万亿手' : '万亿'}`
	if (abs >= 1e8) return `${trim(hands / 1e8)}${withUnit ? ' 亿手' : '亿'}`
	if (abs >= 1e4) return `${trim(hands / 1e4)}${withUnit ? ' 万手' : '万'}`
	return withUnit ? `${Math.round(hands)} 手` : String(Math.round(hands))
}

// K线缩放回调：按当前视窗可见根数重算刻度步长（步长变化才局部刷新，双图x轴共用同一函数）
// 视窗范围优先取事件载荷（本次缩放提交的百分比区间，最可靠）：快速滚轮连发时读取组件状态可能拿到
// 未就绪值（null/undefined），必须严格校验有限数值，否则可见根数会退化为1、步长崩到1、日期挤满整轴
function handleKlineZoom(params?: any) {
	if (!myEchart || period.value === 'minute' || !klines.value.length) return
	const len = renderRows.value.length
	const lastIndex = len - 1
	let startIdx = NaN
	let endIdx = NaN
	// 事件载荷结构：滚动缩放为批处理 { batch: [{ start, end }] }（均为百分比），取首项
	const evtItem = (Array.isArray(params?.batch) ? params.batch[0] : params) as any
	if (typeof evtItem?.start === 'number' && isFinite(evtItem.start) && typeof evtItem.end === 'number' && isFinite(evtItem.end)) {
		startIdx = Math.round((evtItem.start / 100) * lastIndex)
		endIdx = Math.round((evtItem.end / 100) * lastIndex)
	} else {
		// 回退：读取 dataZoom 组件状态（值域优先、百分比兜底；仅接受有限数值，排除 null/0 干扰）
		const dz = (myEchart.getOption().dataZoom as any[] | undefined)?.[0]
		if (!dz) return
		const isNum = (v: unknown): v is number => typeof v === 'number' && isFinite(v)
		if (isNum(dz.startValue) && isNum(dz.endValue)) {
			startIdx = Math.round(dz.startValue)
			endIdx = Math.round(dz.endValue)
		} else if (isNum(dz.start) && isNum(dz.end)) {
			startIdx = Math.round((dz.start / 100) * lastIndex)
			endIdx = Math.round((dz.end / 100) * lastIndex)
		} else {
			return
		}
	}
	const visible = endIdx - startIdx + 1
	if (!isFinite(visible) || visible < 1) return
	// 量轴轴顶随视窗同步（与刻度步长是否变化无关，故放在步长短路判断之前）
	refreshVolAxisMax(startIdx, endIdx)
	const step = pickTickStep(visible)
	if (step === klineTickStep) return
	klineTickStep = step
	// 使用新的 interval 函数引用触发 ECharts 重新判定标签与网格线（双图x轴：主图仅网格线、副图标签+网格线）
	const isTick = (index: number) => (lastIndex - index) % step === 0
	myEchart.setOption({
		xAxis: [
			{ splitLine: { interval: isTick } },
			{ axisLabel: { interval: isTick }, splitLine: { interval: isTick } }
		]
	})
}

// 量轴轴顶随视窗刷新：按本次可见区间（含量均线）的量峰重算轴顶；值无变化时不重复刷新
function refreshVolAxisMax(startIdx: number, endIdx: number) {
	if (!myEchart || !klines.value.length) return
	const top = niceVolTop(visibleVolPeak(klines.value, startIdx, endIdx))
	if (!top || top === lastVolAxisTop) return
	lastVolAxisTop = top
	// 仅局部刷新量轴（yAxis 索引1）：max=interval=轴顶值，保持"0 与轴顶"两档刻度
	myEchart.setOption({ yAxis: [{}, { max: top, interval: top }] })
}

// 跳空缺口信息（未回补）：向上缺口=当根最低高于前根最高；向下缺口=当根最高低于前根最低
interface IGapInfo {
	up: boolean
	prevDate: string
	curDate: string
	low: number
	high: number
	amp: number
}

// 全部“未回补”的跳空缺口（按时间升序收集）：回补判定=缺口形成后的任一根价格重返缺口起始边
//（向上缺口：某根最低≤缺口下沿；向下缺口：某根最高≥缺口上沿），已回补的缺口跳过（所有缺口同此逻辑）；
// amp=缺口幅度%（向上取正、向下取负；分母为缺口下沿前值，零值保护）
function findAllGaps(data: IZdxStockKlinePoint[]): IGapInfo[] {
	const list: IGapInfo[] = []
	for (let i = 1; i < data.length; i++) {
		const prev = data[i - 1]
		const cur = data[i]
		if (cur.Low > prev.High) {
			// 向上缺口：下沿=prev.High；缺口形成后任一根最低重返下沿即视为已回补
			let filled = false
			for (let j = i + 1; j < data.length; j++) {
				if (data[j].Low <= prev.High) {
					filled = true
					break
				}
			}
			if (filled) continue
			const amp = prev.High > 0 ? +(((cur.Low - prev.High) / prev.High) * 100).toFixed(2) : 0
			list.push({ up: true, prevDate: prev.Date, curDate: cur.Date, low: prev.High, high: cur.Low, amp })
			continue
		}
		if (cur.High < prev.Low) {
			// 向下缺口：上沿=prev.Low；缺口形成后任一根最高重返上沿即视为已回补
			let filled = false
			for (let j = i + 1; j < data.length; j++) {
				if (data[j].High >= prev.Low) {
					filled = true
					break
				}
			}
			if (filled) continue
			const amp = prev.Low > 0 ? +(((cur.High - prev.Low) / prev.Low) * 100).toFixed(2) : 0
			list.push({ up: false, prevDate: prev.Date, curDate: cur.Date, low: cur.High, high: prev.Low, amp })
		}
	}
	return list
}

// K线图：蜡烛图（日/周/月：涨红跌绿）+均线+成交量柱+量均线；刻度从最新一根倒推，缩放自适应
function renderKline() {
	// 历史序列（缺口/买卖点/均线图例按历史计算）与含未来段的渲染序列（复盘模式日K）
	const data = klines.value
	const rows = renderRows.value
	// 周K/月K隐藏买卖点（B/S/T）与支撑/压力位参考线（个股行情页传入 hideWeekMonthMarks 时生效；
	// 缺口高亮与缺口方向悬浮提示保留，仅去除“支撑位/压力位”标注后缀）
	const hideMarks = props.hideWeekMonthMarks === true && (period.value === 'week' || period.value === 'month')
	// 默认视窗聚焦历史段末尾（未来段默认不进视窗，进入预测模式时自动滚动）
	const lastViewIndex = data.length - 1
	// 默认可视窗口起始索引（日K近60个交易日、周K今年以来的首根、月K近36个月）
	let zoomStart = 0
	if (period.value === 'day') {
		zoomStart = Math.max(0, data.length - KLINE_DEFAULT_DAYS)
	} else if (period.value === 'week') {
		const idx = data.findIndex(k => k.Date >= dayjs().format('YYYY-01-01'))
		zoomStart = idx <= 0 ? 0 : idx
	} else {
		zoomStart = Math.max(0, data.length - KLINE_DEFAULT_MONTHS)
	}
	// x轴刻度：按当前视窗可见根数自适应选择步长（缩放时由 handleKlineZoom 重算），
	// 刻度从渲染序列最新一根（含未来段末根）倒推
	const tickBase = rows.length - 1
	klineTickStep = pickTickStep(data.length - zoomStart)
	const isTick = (index: number) => (tickBase - index) % klineTickStep === 0
	// 全部未回补跳空缺口（高亮标注在图上）；最近未回补向上缺口下沿=支撑位、最近未回补向下缺口上沿=压力位；
	// 手动值优先（不复权价折算到当前显示口径：按最新交易日比率；非前复权时 ratioOf=1 直接用）
	const gaps = findAllGaps(data)
	const supportGap = [...gaps].reverse().find(g => g.up)
	const resistGap = [...gaps].reverse().find(g => !g.up)
	const lastKlineDate = data.length ? data[data.length - 1].Date : ''
	const supportManual = manualSupport.value != null && manualSupport.value > 0
	const resistManual = manualResist.value != null && manualResist.value > 0
	const supportPrice = supportManual ? displayPriceOf(lastKlineDate, manualSupport.value as number) : supportGap ? supportGap.low : 0
	const resistPrice = resistManual ? displayPriceOf(lastKlineDate, manualResist.value as number) : resistGap ? resistGap.high : 0
	// 公告事件标记（事件回测定位，仅日K绘制）：基准日→第 endIdx 根背景色带（利好红/利空绿，2.0 弱化 alpha 0.12→0.06）；
	// 单事件扩声器 pin 已被多事件泳道替代（pin 不再绘制）；基准日映射同买卖点口径（首根日期≥事件日），事件日早于序列时不绘制
	const eventArea: any[] = []
	if (eventMark.value && period.value === 'day') {
		const ei = data.findIndex(k => String(k.Date).slice(0, 10) >= eventMark.value!.date)
		if (ei >= 0) {
			const eDate = data[ei].Date
			const eEnd = data[Math.min(data.length - 1, ei + eventMark.value.endIdx)]
			eventArea.push([
				{ xAxis: eDate, itemStyle: { color: eventMark.value.direction === 2 ? 'rgba(103, 194, 58, 0.06)' : 'rgba(245, 108, 108, 0.06)' } },
				{ xAxis: eEnd ? eEnd.Date : eDate }
			])
		}
	}
	// 事件泳道（2.0）：日K且已传入事件列表时，K线区与量区之间插入独立小 grid 泳道；
	// 事件按“首根日期≥事件日”映射周期根（同买卖点口径），同日多事件聚合一条标记（tooltip 列出全部标题）；
	// focusEvent 当前定位事件放大高亮（黄色与买卖点 B/S 红绿色系区分）
	const laneInput = period.value === 'day' && eventMarks.value.length > 0
	const laneMap = new Map<string, { titles: string[]; focused: boolean }>()
	if (laneInput) {
		for (const m of eventMarks.value) {
			const idx = data.findIndex(k => String(k.Date).slice(0, 10) >= m.date)
			if (idx < 0) continue
			const root = data[idx].Date
			const isFocus = eventMark.value != null && String(root).slice(0, 10) === eventMark.value.date
			const hit = laneMap.get(root)
			if (hit) {
				if (m.title) hit.titles.push(m.title)
				hit.focused = hit.focused || isFocus
			} else {
				laneMap.set(root, { titles: m.title ? [m.title] : [], focused: isFocus })
			}
		}
	}
	const laneActive = laneMap.size > 0
	// 买卖点标记（B/S：按“首根日期≥交易日”映射到所在周期根，日K 即当日；成交价为不复权实际成交价，
	// 前复权显示时按当日比率折算到显示口径——ratio=前复权收盘÷不复权收盘，同日价格同因子故折算精确）；
	// 同时构建“周期根日期 → 标记列表”映射，悬浮该根时 tooltip 展示买卖信息；
	// 周K/月K隐藏标记时不做聚合（dailyMarks 为空 → markPoint 不绘制、tooltip 无买卖信息）
	const ratioMap = buildFqtRatioMap()
	const tradeMarkPoint: any[] = []
	const tradeMarkMap = new Map<string, ITradeMark[]>()
	const dailyMarks = hideMarks ? [] : buildDailyMarks()
	// 先按“周期根日期”分组：周K/月K 上同一周期根可能聚合多个交易日的成交，再逐根合并
	// （同方向多笔累加为一条；买卖并存融合为做T标记 T，保证同一根K线上最多一个标记）
	const rootTradeMap = new Map<string, { k: IZdxStockKlinePoint; list: ITradeMark[] }>()
	for (const m of dailyMarks) {
		const idx = data.findIndex(k => k.Date >= m.Date)
		if (idx < 0) continue
		const k = data[idx]
		const group = rootTradeMap.get(k.Date)
		if (group) group.list.push(m)
		else rootTradeMap.set(k.Date, { k, list: [m] })
	}
	for (const [date, { k, list }] of rootTradeMap) {
		const marks = mergeRootTradeMarks(list)
		for (const m of marks) {
			// 折算到当前显示口径（前复权：成交价 × 当日比率；不复权：直接使用成交价）；
			// 比率缺失回退原值，再限幅在K线高低区间兜底（防两口径数据残余差异使标记悬空）；
			// 做T标记位置取买入/卖出折算价均值
			const conv = (p: number) => (fqt.value === 'qfq' ? p * (ratioMap.get(date) ?? 1) : p)
			const base = m.Category === 0 ? (conv(m.Price) + conv(m.SellPrice ?? m.Price)) / 2 : conv(m.Price)
			tradeMarkPoint.push(tradeMarkItem(m, date, Math.min(Math.max(base, k.Low), k.High)))
		}
		tradeMarkMap.set(date, marks)
	}
	// 量轴轴顶：按默认视窗内的量系列峰值（柱+量均线）取整（留少量余量），保持只显示 0 与轴顶两档数值
	const volAxisMax = niceVolTop(visibleVolPeak(rows, zoomStart, lastViewIndex))
	lastVolAxisTop = volAxisMax
	// 当前周期均线配置与最新行（图例数值显示用）
	const maList = KLINE_MA_LINES[period.value] ?? []
	const volMaList = KLINE_VOL_MA_LINES[period.value] ?? []
	const last = data[data.length - 1]
	// 复盘模式：价格轴范围纳入预测锚点（显示口径，含 5% 余量），保证预测路径与锚点始终可见
	let yMin: number | undefined
	let yMax: number | undefined
	if (props.reviewMode === true && data.length) {
		let minV = Infinity
		let maxV = -Infinity
		for (const k of data) {
			if (typeof k.Low === 'number' && k.Low < minV) minV = k.Low
			if (typeof k.High === 'number' && k.High > maxV) maxV = k.High
		}
		for (const a of displayForecastAnchors.value) {
			const v = displayPriceOf(a.Date, a.Price)
			if (isFinite(v) && v > 0) {
				if (v < minV) minV = v
				if (v > maxV) maxV = v
			}
		}
		if (isFinite(minV) && isFinite(maxV) && maxV > minV) {
			const pad = Math.max((maxV - minV) * 0.05, 0.01)
			yMin = +(minV - pad).toFixed(2)
			yMax = +(maxV + pad).toFixed(2)
		}
	}
	// 均线线（按当前周期配置；不足周期的行值为空不绘制，线从首个有值点开始）
	const maSeries: any[] = maList.map(ma => ({
		name: ma.label,
		type: 'line',
		showSymbol: false,
		data: rows.map(k => {
			const v = k[ma.key]
			return typeof v === 'number' ? v : null
		}),
		lineStyle: { width: 1, color: ma.color },
		itemStyle: { color: ma.color }
	}))

	const option = {
		animation: false,
		tooltip: {
			trigger: 'axis',
			// 十字线跨双图联动（鼠标在任一图内时，两图同列十字线同步显示）
			axisPointer: { type: 'cross', link: [{ xAxisIndex: 'all' }] },
			backgroundColor: 'rgba(48, 49, 51, 0.92)',
			borderColor: 'rgba(48, 49, 51, 0.92)',
			borderRadius: 8,
			textStyle: { color: '#ffffff', fontSize: 12 },
			// 蜡烛图提示用中文（默认 open/close/lowest/highest 为英文）；
			// 注意：类目轴下 ECharts 会给 candlestick 数据项前置类目索引（value=[索引,开盘,收盘,最低,最高]），
			// 因此直接按 dataIndex（原始全量索引）取源数据，避免解构错位；
			// 版式统一：同一字号/行高、数值固定两位小数，标签左、数值右两列布局，避免行间观感参差
			formatter: (params: any) => {
				const p = Array.isArray(params) ? params[0] : params
				if (!p) return ''
				const k = rows[p.dataIndex]
				if (!k || k.Future) return ''
				// 两列行（标签左、数值右；数值按需着色）
				const row = (label: string, value: string, color = '#ffffff') =>
					`<div style="display:flex;justify-content:space-between;gap:18px"><span>${label}</span><span style="color:${color}">${value}</span></div>`
				const num = (v: number | null | undefined) => (typeof v === 'number' ? v.toFixed(2) : '--')
				const lines = [`<div style="font-weight:600;margin-bottom:3px">${k.Date}</div>`]
				lines.push(row('开盘', num(k.Open)))
				lines.push(row('最高', num(k.High)))
				lines.push(row('最低', num(k.Low)))
				lines.push(row('收盘', num(k.Close)))
				// 涨跌幅/振幅均为后端读取时全序列计算字段（首根无前收盘：涨跌幅为0、振幅为空显示 --；涨红跌绿）
				const pctVal = k.ChangePercent
				const pctText = pctVal === null || pctVal === undefined ? '--' : `${pctVal > 0 ? '+' : ''}${pctVal.toFixed(2)}%`
				const pctColor = pctVal === null || pctVal === undefined || pctVal === 0 ? '#ffffff' : pctVal > 0 ? upColor : downColor
				lines.push(row('涨跌幅', pctText, pctColor))
				// 振幅（（最高-最低）/前收盘，后端读取时全序列计算；首根显示 --）
				const amp = k.Amplitude
				lines.push(row('振幅', amp === null || amp === undefined ? '--' : `${amp.toFixed(2)}%`))
				// 均线值（按当前周期配置；不足周期的行显示 --）
				for (const ma of KLINE_MA_LINES[period.value] ?? []) {
					lines.push(row(ma.label, num(k[ma.key]), ma.color))
				}
				// 成交量与量均线（口语化量词自动切换 亿手/万手；不足周期的量均线显示 --）；分隔线与上方 K 线数据块区分
				lines.push('<div style="border-top:1px solid rgba(255,255,255,0.16);margin:5px 0 3px"></div>')
				lines.push(row('成交量', formatVolume(k.Volume)))
				for (const ma of KLINE_VOL_MA_LINES[period.value] ?? []) {
					lines.push(row(ma.label, formatVolume(k[ma.key]), ma.color))
				}
				// 悬浮所在周期根含买卖成交时，展示对应买卖信息（类别/数量/均价/金额）
				const marks = tradeMarkMap.get(k.Date)
				if (marks) lines.push(tradeMarkLines(marks))
				// 悬浮事件泳道对应周期根时，列出公告标题（圆点 marker 与 tooltip 默认样式一致，黄色与泳道标记同色系；超 3 条折叠计数）
				const laneInfo = laneMap.get(k.Date)
				if (laneInfo?.titles.length) {
					lines.push('<div style="border-top:1px solid rgba(255,255,255,0.16);margin:5px 0 3px"></div>')
					const dot = '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#e6a23c;margin-right:5px"></span>'
					for (const t of laneInfo.titles.slice(0, 3)) lines.push(`<div style="color:#e6a23c">${dot}${t}</div>`)
					if (laneInfo.titles.length > 3) lines.push(`<div style="color:#e6a23c">…共 ${laneInfo.titles.length} 条公告</div>`)
				}
				// 悬浮缺口前后两根K线时，提示缺口方向与幅度（向上红、向下绿；幅度=缺口上下沿差÷前根价格；
				// 最近未回补向上缺口标注支撑位、向下缺口标注压力位；周K/月K隐藏标记时仅提示方向与幅度）
				for (const g of gaps) {
					if (k.Date !== g.prevDate && k.Date !== g.curDate) continue
					const ampText = `${g.amp > 0 ? '+' : ''}${g.amp.toFixed(2)}%`
					const tail = hideMarks ? '' : g === supportGap ? '（支撑位）' : g === resistGap ? '（压力位）' : ''
					lines.push(
						g.up
							? `<div style="color:#f56c6c">↑ 向上缺口 ${ampText}${tail}</div>`
							: `<div style="color:#67c23a">↓ 向下缺口 ${ampText}${tail}</div>`
					)
				}
				return `<div style="font-size:12px;line-height:1.7;min-width:170px">${lines.join('')}</div>`
			}
		},
		// 均线说明图例：上=价格均线（图表上方，显示最新一根均线值；点击切换对应均线显示/隐藏）；
		// 下=量均线（量区小标题右侧，显示最新量均线值，同样可点击切换；图标颜色与图中线色一致）
		legend: [
			{
				top: 8,
				left: 74,
				itemWidth: 14,
				itemHeight: 8,
				itemGap: 18,
				icon: 'roundRect',
				selectedMode: true,
				textStyle: { fontSize: 12, color: '#606266' },
				data: maList.map(ma => ma.label),
				formatter: (name: string) => {
					const ma = maList.find(m => m.label === name)
					const v = ma ? last[ma.key] : null
					return `${name} ${typeof v === 'number' ? v.toFixed(2) : '--'}`
				}
			},
			{
				top: 339,
				left: 132,
				itemWidth: 14,
				itemHeight: 8,
				itemGap: 18,
				icon: 'roundRect',
				selectedMode: true,
				textStyle: { fontSize: 12, color: '#a7abba' },
				data: volMaList.map(ma => ma.label),
				formatter: (name: string) => {
					const ma = volMaList.find(m => m.label === name)
					const v = ma ? last[ma.key] : null
					return `${name} ${formatVolume(v)}`
				}
			}
		],
		// 双图布局：上=K线蜡烛图（独立上方主区，顶部留出均线图例带），下=成交量柱状图（独立下方面板区，含量均线与日期标签）；
		// 两图采用相同的左右固定边距，保证纵向网格线与蜡烛/柱列严格对齐，两区之间留出间距形成清晰分区；
		// 事件泳道激活时（日K+有事件）：K线区高度 300→254，腾出 300~330 带放置第三 grid 泳道（量区位置不变）
		grid: laneActive
			? [
					{ left: 70, right: 20, top: 34, height: 254 },
					{ left: 70, right: 20, top: 366, bottom: 42 },
					{ left: 70, right: 20, top: 300, height: 30 }
				]
			: [
					{ left: 70, right: 20, top: 34, height: 300 },
					{ left: 70, right: 20, top: 366, bottom: 42 }
				],
		// 成交量区小标题（置于K线区与成交量区的间隙带左缘，标记下方柱状图为成交量；量均线数值见右侧图例）；
		// 泳道激活时在左侧轴外区域加“公告”分栏标题（与量区标题同样式）
		graphic: laneActive
			? [
					{
						type: 'text',
						left: 74,
						top: 344,
						style: {
							text: '成交量',
							fontSize: 12,
							fill: '#a7abba'
						}
					},
					{
						type: 'text',
						left: 22,
						top: 308,
						style: {
							text: '公告',
							fontSize: 11,
							fill: '#e6a23c'
						}
					}
				]
			: [
				{
					type: 'text',
					left: 74,
					top: 344,
					style: {
						text: '成交量',
						fontSize: 12,
						fill: '#a7abba'
					}
				}
			],
		// 滚轮缩放、拖动平移（默认视窗：日K近60个交易日、周K今年、月K近3年）；x轴联动双图（泳道激活时三图）
		dataZoom: [
			{
				type: 'inside',
				xAxisIndex: laneActive ? [0, 1, 2] : [0, 1],
				startValue: zoomStart,
				endValue: lastViewIndex
			}
		],
		// 主图x轴（纵向网格线与副图对齐；日期标签统一在成交量图底部显示）
		xAxis: [
			{
				type: 'category',
				gridIndex: 0,
				data: rows.map(k => k.Date),
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: { show: false },
				splitLine: { show: true, interval: (index: number) => isTick(index), lineStyle: { type: 'dashed' } }
			},
			// 成交量图x轴（标签与网格线同频：从最新点倒推每N根一格、N随缩放自适应），最右侧刻度即最新日期；
			// 日/周K显示完整日期（如 2026-09-30）；月K显示到月份（如 2026-09）
			{
				type: 'category',
				gridIndex: 1,
				data: rows.map(k => k.Date),
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: {
					color: '#a7abba',
					interval: (index: number) => isTick(index),
					// 极端场景（读数异常导致步长过小）自动隐藏重叠日期，避免标签糊成一片
					hideOverlap: true,
					formatter: (value: string) => (period.value === 'month' ? value.slice(0, 7) : value)
				},
				splitLine: { show: true, interval: (index: number) => isTick(index), lineStyle: { type: 'dashed' } }
			},
			// 事件泳道x轴（仅激活时存在）：类目与双图同源保证列对齐；轴/标签全隐藏，十字指示线经 axisPointer link 贯穿
			...(laneActive
				? [
						{
							type: 'category',
							gridIndex: 2,
							data: rows.map(k => k.Date),
							axisLine: { show: false },
							axisTick: { show: false },
							axisLabel: { show: false },
							splitLine: { show: false }
						}
					]
				: [])
		],
		// 主图价格轴 + 成交量图独立轴（成交量单位：万手，柱状图从0起画）
		yAxis: [
			{
				type: 'value',
				// 复盘模式显式给范围（纳入预测锚点）；常规模式自适应
				...(yMin !== undefined && yMax !== undefined ? { min: yMin, max: yMax } : { scale: true }),
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: { color: '#a7abba' },
				splitLine: { show: true, lineStyle: { type: 'dashed' } }
			},
			// 成交量轴（只保留最大/最小两个刻度值——0 与量峰取整值，避免一排数值挤压；
			// 横向网格线不显示，纵向网格线与主图对齐）
			{
				type: 'value',
				gridIndex: 1,
				min: 0,
				max: volAxisMax > 0 ? volAxisMax : undefined,
				// 步长=轴顶值（显式指定 min/max/interval 后不会插入中间刻度，标签仅 0 与轴顶两档）
				interval: volAxisMax > 0 ? volAxisMax : undefined,
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: {
					show: true,
					fontSize: 10,
					color: '#a7abba',
					// 两档刻度值口语化（0 与轴顶，如 "0"/"5.9亿"；值口径同成交量：×100 为手）
					formatter: (value: number) => formatVolume(value, false)
				},
				splitLine: { show: false }
			},
			// 事件泳道y轴（仅激活时存在）：固定 0~1 空轴，标记统一画在带中线 0.5
			...(laneActive
				? [{ type: 'value', gridIndex: 2, min: 0, max: 1, show: false }]
				: [])
		],
		series: [
			{
				name: 'K线',
				type: 'candlestick',
				// ECharts 蜡烛图数据顺序：[开盘, 收盘, 最低, 最高]
				data: rows.map(k => (k.Future ? '-' : [k.Open, k.Close, k.Low, k.High])),
				itemStyle: {
					// 涨红跌绿（阳线红、阴线绿）
					color: upColor,
					color0: downColor,
					borderColor: upColor,
					borderColor0: downColor
				},
				// 全部未回补跳空缺口高亮标注（x覆盖缺口前后两根、y覆盖缺口区间；向上缺口红、向下缺口绿；淡色不遮挡K线；
				// 缺口方向在鼠标悬浮缺口前后两根K线时由 tooltip 提示）
				markArea: {
					silent: true,
					data: [
						...gaps.map(g => [
							{ xAxis: g.prevDate, yAxis: g.low, itemStyle: { color: g.up ? 'rgba(245, 108, 108, 0.18)' : 'rgba(103, 194, 58, 0.18)' } },
							{ xAxis: g.curDate, yAxis: g.high }
						]),
						...eventArea
					]
				},
				// 支撑/压力位水平参考线：最近未回补向上缺口下沿=支撑位（绿，取缺口下沿）、
				// 最近未回补向下缺口上沿=压力位（红，取缺口上沿）；周K/月K隐藏标记时不绘制（手动值同样隐藏）
				markLine: {
					silent: true,
					symbol: ['none', 'none'],
					data: hideMarks ? [] : [
						...(supportPrice > 0
							? [
									{
										yAxis: supportPrice,
										lineStyle: { type: 'dashed', color: '#67c23a', width: 1.2 },
										label: { show: true, position: 'insideEndTop', formatter: `支撑位 ${supportPrice.toFixed(2)}${supportManual ? '·手动' : ''}`, fontSize: 10, color: '#529b2e' }
									}
								]
							: []),
						...(resistPrice > 0
							? [
									{
										yAxis: resistPrice,
										lineStyle: { type: 'dashed', color: '#f56c6c', width: 1.2 },
										label: { show: true, position: 'insideEndBottom', formatter: `压力位 ${resistPrice.toFixed(2)}${resistManual ? '·手动' : ''}`, fontSize: 10, color: '#c45656' }
									}
								]
							: [])
					]
				},
				// 买卖点标记（B/S：按“首根日期≥交易日”映射到所在周期根，日K 即当日；成交价限幅在K线高低区间内）；公告事件标记已移入独立泳道
				markPoint: {
					data: tradeMarkPoint
				}
			},
			...maSeries,
			// 成交量柱状图（涨红跌绿：收盘不低于开盘为红；柱高=成交量）
			{
				name: '成交量',
				type: 'bar',
				xAxisIndex: 1,
				yAxisIndex: 1,
				barWidth: '60%',
				data: rows.map(k =>
					k.Future ? '-' : { value: k.Volume, itemStyle: { color: k.Close >= k.Open ? upColor : downColor } }
				)
			},
			// 成交量均线（按周期：日K 量MA5/量MA20、周K 量MA4/量MA12、月K 量MA3/量MA6，后端读取时计算字段；
			// 不足周期为空不绘制，线从首个有值点开始）
			...(KLINE_VOL_MA_LINES[period.value] ?? []).map(ma => ({
				name: ma.label,
				type: 'line',
				xAxisIndex: 1,
				yAxisIndex: 1,
				showSymbol: false,
				data: rows.map(k => {
					const v = k[ma.key]
					return typeof v === 'number' ? v : null
				}),
				lineStyle: { width: 1, color: ma.color },
				itemStyle: { color: ma.color }
			})),
			// 事件泳道系列（独立 grid，不与买卖点重叠）：FontAwesome 扩声器造型标记（与全站图标体系一致）；focusEvent 定位事件放大高亮；
			// 悬浮时十字指示线经 axisPointer link（xAxisIndex: 'all'）贯穿主图，tooltip 列出当日公告标题
			...(laneActive
				? [
						{
							name: '公告事件',
							type: 'scatter',
							xAxisIndex: 2,
							yAxisIndex: 2,
							symbol: EVENT_LANE_SYMBOL,
							symbolSize: [14, 14],
							itemStyle: { color: '#e6a23c' },
							z: 5,
							data: [...laneMap.entries()].map(([date, v]) => ({
								value: [date, 0.5],
								symbolSize: v.focused ? [20, 20] : [14, 14],
								itemStyle: { color: v.focused ? '#e6a23c' : 'rgba(230, 162, 60, 0.82)' }
							}))
						}
					]
				: [])
		]
	}
	myEchart?.setOption(option, true)
}

function handleResize() {
	myEchart?.resize()
	drawing.redraw()
}

// 切换股票重新拉取
watch(
	() => props.code,
	() => {
		// 切股票清除公告事件标记与泳道列表（避免旧股事件色块/标记残留）
		eventMark.value = null
		eventMarks.value = []
		loadChart()
	}
)

// 交易记录到达/更新后重渲染（叠加最新买卖点；切股票置空时同样刷新清除旧标记）；
// K线模式下若存在买卖点而另一口径序列尚未就绪（trades 晚于K线到达），补拉后重渲染
watch(
	() => props.trades,
	() => {
		if (!myEchart || isEmpty.value) return
		if (period.value !== 'minute' && hasTradeMarks.value && !klinesOther.value.length && klines.value.length) {
			loadChart()
			return
		}
		renderChart()
	}
)

// 详情到达后刷新分时渲染（昨收基准/涨跌染色）
watch(
	() => props.detail,
	() => {
		if (period.value === 'minute' && trend.value) renderChart()
	}
)

// 预测列表更新（宿主保存后刷新）时重渲染：退出预测编辑回显最新进行中预测、价格轴纳入预测范围；
// 编辑中（有未保存改动）不打断
watch(
	() => props.forecasts,
	() => {
		if (forecastDirty.value) return
		if (forecastDraft.value.length) forecastDraft.value = []
		if (drawMode.value === 'forecast') drawMode.value = 'select'
		if (!isEmpty.value) renderChart()
		drawing.redraw()
	}
)

// 双击K线：非绘制/预测编辑中双击蜡烛（或分时线）时通知宿主按该日期打开复盘抽屉
// （绘制工具激活时不响应，避免与画图交互冲突；周/月K取该周期根标注日期）
function handleChartDblclick(params: any) {
	if (drawMode.value !== 'select') return
	if (!params || typeof params.dataIndex !== 'number' || params.dataIndex < 0) return
	let date = ''
	if (period.value === 'minute') {
		date = dayjs().format('YYYY-MM-DD')
	} else {
		const k = klines.value[params.dataIndex]
		if (!k) return
		date = k.Date
	}
	if (!date) return
	emit('date-dblclick', date)
}

onMounted(() => {
	myEchart = echarts.init(chart.value)
	// K线缩放（滚轮/拖动）时按可见根数自适应重算刻度步长
	myEchart.on('dataZoom', handleKlineZoom)
	// 双击K线打开指定日期复盘（绘制工具激活时不响应）
	myEchart.on('dblclick', handleChartDblclick)
	// 画图引擎挂载（复盘模式的 zrender 层事件）
	drawing.attach()
	loadChart()
	window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
	window.removeEventListener('resize', handleResize)
	myEchart?.dispose()
})
</script>

<style lang="scss" scoped>
.quote-chart {
	background: #fff;
	border-radius: 16px;
	margin-bottom: 20px;

	.chart-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 20px;
		border-bottom: 1px solid #f5f6fb;

		.header-left {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
		}

		// 右侧操作区（复权口径、画线入口、预测走势；视觉与图表卡片风格统一）
		.header-right {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 10px;
		}

		.period-tabs {
			display: flex;
			align-items: center;

			span {
				padding: 5px 14px;
				font-size: 14px;
				font-weight: 500;
				color: #a7abba;
				border-radius: 6px;
				border: 1px solid #a7abba;
				cursor: pointer;
				margin-right: 8px;
				transition: all 0.2s;
			}

			.active {
				background: #409eff;
				border: 1px solid #409eff;
				color: #fff;
			}
		}

		// 复权下拉 + 画线按钮组（连体按钮：共享边框、首尾圆角；hover/激活提升层级完整描边）
		.btn-group {
			display: inline-flex;
			align-items: center;

			& > * + * {
				margin-left: -1px;
			}

			// 首尾圆角（兼容 el-dropdown 容器包裹层）
			& > :first-child,
			& > :first-child .group-btn {
				border-radius: 6px 0 0 6px;
			}

			& > :last-child,
			& > :last-child .group-btn {
				border-radius: 0 6px 6px 0;
			}

			& > :only-child,
			& > :only-child .group-btn {
				border-radius: 6px;
			}

			.el-dropdown {
				display: inline-flex;
				align-items: center;
			}

			// 组内通用按钮（复权下拉触发器 / 画线）
			.group-btn {
				display: inline-flex;
				align-items: center;
				gap: 5px;
				padding: 4px 12px;
				font-size: 12px;
				// 显式行高统一两按钮高度（el-dropdown 默认 line-height:1 会继承导致复权按钮偏矮）
				line-height: 16px;
				font-weight: 500;
				color: #a7abba;
				background: #fff;
				border: 1px solid #dcdfe6;
				cursor: pointer;
				transition: all 0.2s;
				user-select: none;

				&:hover,
				&.active {
					position: relative;
					z-index: 1;
					border-color: #409eff;
					color: #409eff;
				}

				&.active {
					background: #ecf5ff;
				}
			}

			// 下拉箭头（小尺寸，跟随按钮文字色）
			.group-caret {
				font-size: 9px;
				margin-left: 1px;
				opacity: 0.75;
			}
		}

		// 复权下拉选中项高亮
		.fqt-item-on {
			color: #409eff;
			font-weight: 600;
			background: #ecf5ff;
		}

		// 预测走势入口（复盘模式；仅日K可用）
		.forecast-btn {
			display: inline-flex;
			align-items: center;
			padding: 4px 10px;
			font-size: 12px;
			font-weight: 500;
			color: #a7abba;
			border: 1px dashed #dcdfe6;
			border-radius: 6px;
			cursor: pointer;
			transition: all 0.2s;
			user-select: none;

			&:hover {
				border-color: #409eff;
				color: #409eff;
			}

			&.active {
				background: #ecf5ff;
				border-color: #409eff;
				color: #409eff;
			}

			&.disabled {
				cursor: not-allowed;
				color: #c0c4cc;
				border-color: #ebeef5;

				&:hover {
					border-color: #ebeef5;
					color: #c0c4cc;
				}
			}
		}
	}

	// 未保存红点（画线入口/保存按钮共用）
	.dirty-dot {
		display: inline-block;
		width: 6px;
		height: 6px;
		margin-left: 4px;
		border-radius: 50%;
		background: #f56c6c;
		vertical-align: middle;
	}

	// 画线悬浮工具栏（绝对定位于图表顶部空白带；白底轻阴影圆角与卡片风格统一，不占布局高度、不推挤K线图）
	.draw-float {
		position: absolute;
		top: 2px;
		right: 14px;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 3px 8px;
		background: rgba(255, 255, 255, 0.95);
		border: 1px solid #ebeef5;
		border-radius: 10px;
		box-shadow: 0 6px 18px rgba(31, 45, 61, 0.1);
		backdrop-filter: blur(6px);
		animation: floatIn 0.15s ease;

		.df-tools {
			display: flex;
			align-items: center;
			gap: 2px;
		}

		// 线型图标按钮（悬浮显示中文名；选中态主色填充）
		.df-tool {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 26px;
			height: 26px;
			border-radius: 6px;
			font-size: 12px;
			color: #606266;
			cursor: pointer;
			transition: all 0.15s;
			user-select: none;

			&:hover {
				background: #f0f5ff;
				color: #409eff;
			}

			&.active {
				background: #409eff;
				color: #fff;
			}
		}

		.df-sep {
			width: 1px;
			height: 16px;
			margin: 0 4px;
			background: #ebeef5;
		}

		.df-action {
			padding: 4px 9px;
			font-size: 12px;
			color: #606266;
			border-radius: 6px;
			cursor: pointer;
			transition: all 0.15s;
			user-select: none;

			&:hover {
				background: #f0f5ff;
				color: #409eff;
			}

			&.disabled {
				color: #c0c4cc;
				cursor: not-allowed;

				&:hover {
					background: none;
					color: #c0c4cc;
				}
			}

			&.primary {
				background: #ecf5ff;
				color: #409eff;
				font-weight: 500;

				&:hover {
					background: #409eff;
					color: #fff;
				}
			}
		}
	}

	.chart-box {
		position: relative;

		.chart {
			height: 520px;
			padding: 6px 10px 10px;
		}

		.chart-empty {
			position: absolute;
			left: 0;
			right: 0;
			top: 0;
			bottom: 0;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}
}

@keyframes floatIn {
	from {
		opacity: 0;
		transform: translateY(-4px);
	}

	to {
		opacity: 1;
		transform: none;
	}
}
</style>
