<template>
	<div class="sector-quote">
		<!-- 左侧栏：行业板块列表（只读库内行情快照，按涨跌幅降序；本地过滤） -->
		<div class="side-bar">
			<div class="side-header">
				<span class="side-title">行业板块</span>
				<span class="side-count">{{ sectors.length }} 个</span>
			</div>
			<div class="side-search">
				<el-input v-model="sideFilter" size="small" clearable placeholder="搜索行业名称">
					<template #prefix>
						<font-awesome-icon fas icon="search" class="search-icon"></font-awesome-icon>
					</template>
				</el-input>
			</div>
			<div v-loading="sectorLoading" class="side-list">
				<div
					v-for="item in filteredSectors"
					:key="item.Name"
					class="side-item"
					:class="{ active: item.Name === currentName }"
					@click="switchSector(item.Name)"
				>
					<div class="item-left">
						<div class="item-name">{{ item.Name }}</div>
						<div class="item-stats">涨 {{ item.Up }} · 跌 {{ item.Down }}</div>
					</div>
					<div class="item-right">
						<div class="item-price" :class="changeClass(item.Change)">{{ fmtPoint(item.Value) }}</div>
						<div class="item-change" :class="changeClass(item.Change)">{{ formatPercent(item.Change) }}</div>
					</div>
				</div>
				<div v-if="!sectorLoading && !filteredSectors.length" class="side-empty">暂无数据</div>
			</div>
		</div>

		<!-- 右侧主区 -->
		<div class="main-area">
			<!-- 板块报价卡 -->
			<div v-loading="detailLoading" class="quote-card">
				<div class="title-row">
					<div class="sector-title">
						<span class="title-text">{{ detail?.Name ?? (currentName || '--') }}</span>
						<span class="tag">板块行情</span>
						<span v-if="detail" class="tag">{{ detail.Total }} 只成分股</span>
					</div>
					<div class="title-right">
						<div class="close-time">已收盘 {{ closeDate }} 15:00:00</div>
					</div>
				</div>
				<div class="quote-row">
					<div class="price-block">
						<div class="price">
							<span :class="changeClass(detail?.Change)">{{ fmtPoint(detail?.Value) }}</span>
							<font-awesome-icon
								v-if="detail"
								fas
								:icon="(detail.Change ?? 0) >= 0 ? 'arrow-trend-up' : 'arrow-trend-down'"
								:class="['trend-icon', changeClass(detail.Change)]"
							></font-awesome-icon>
						</div>
						<div :class="['change-line', changeClass(detail?.Change)]">
							<span>{{ detail ? formatPercent(detail.Change) : '--' }}</span>
						</div>
					</div>
					<div class="stats-block">
						<div class="stat-grid">
							<div class="stat-item">
								<span class="label">上涨</span>
								<span class="value up">{{ detail?.Up ?? '--' }} 家</span>
							</div>
							<div class="stat-item">
								<span class="label">平盘</span>
								<span class="value flat">{{ detail?.Flat ?? '--' }} 家</span>
							</div>
							<div class="stat-item">
								<span class="label">下跌</span>
								<span class="value down">{{ detail?.Down ?? '--' }} 家</span>
							</div>
							<div class="stat-item">
								<span class="label">总家数</span>
								<span class="value">{{ detail?.Total ?? '--' }} 家</span>
							</div>
						</div>
						<div class="ratio-bar">
							<div class="ratio-up" :style="{ width: upRatio + '%' }"></div>
							<div class="ratio-flat" :style="{ width: flatRatio + '%' }"></div>
							<div class="ratio-down" :style="{ width: downRatio + '%' }"></div>
						</div>
						<div class="ratio-text">
							<span class="up">{{ upRatio }}%</span>
							<span class="flat">{{ flatRatio }}%</span>
							<span class="down">{{ downRatio }}%</span>
						</div>
					</div>
				</div>
			</div>

			<!-- K线卡（日/周/月蜡烛图：读板块K线库，均线前端按收盘价现算） -->
			<div class="chart-card">
				<div class="card-header">
					<span class="card-title">{{ (detail?.Name ?? currentName) || '--' }} 走势</span>
					<div class="header-controls">
						<div class="period-tabs source-tabs">
							<span class="tab-caption">数据源</span>
							<span
								v-for="s in SOURCES"
								:key="s.label"
								:class="{ active: s.active() }"
								@click="switchDataSource(s.value)"
							>{{ s.label }}</span>
						</div>
						<div class="period-tabs">
							<span
								v-for="p in PERIODS"
								:key="p.value"
								:class="{ active: period === p.value }"
								@click="switchPeriod(p.value)"
							>{{ p.label }}</span>
						</div>
					</div>
				</div>
				<div v-loading="klineLoading" class="chart-box">
					<div v-if="klines.length" ref="chartEl" class="chart"></div>
					<el-empty
						v-else-if="!klineLoading"
						description="暂无K线数据（可在数据中台-板块K线同步维护后查看）"
						:image-size="80"
					></el-empty>
				</div>
			</div>

			<!-- 成分股卡（该行业个股列表；点击行跳个股行情） -->
			<div class="member-card">
				<div class="card-header">
					<span class="card-title">成分股 {{ members.length }}</span>
					<el-input v-model="memberFilter" size="small" clearable placeholder="搜索代码/名称" class="member-search">
						<template #prefix>
							<font-awesome-icon fas icon="search" class="search-icon"></font-awesome-icon>
						</template>
					</el-input>
				</div>
				<el-table
					v-loading="memberLoading"
					:data="filteredMembers"
					class="ofa-table"
					height="520"
					:default-sort="{ prop: 'ChangePercent', order: 'descending' }"
					@row-click="openStock"
				>
					<el-table-column prop="Code" label="股票代码" width="110"></el-table-column>
					<el-table-column label="股票名称" width="150">
						<template #default="scope">
							<span :class="upDownClass(scope.row.ChangePercent)">{{ scope.row.Name }}</span>
							<el-tag v-if="scope.row.IsLimitUp" size="small" effect="plain" type="danger" class="name-tag">涨停</el-tag>
							<el-tag v-else-if="scope.row.IsLimitDown" size="small" effect="plain" type="success" class="name-tag">跌停</el-tag>
						</template>
					</el-table-column>
					<el-table-column prop="Price" label="最新价" width="100" sortable>
						<template #default="scope">
							<span :class="upDownClass(scope.row.ChangePercent)">{{ fmtPrice(scope.row.Price) }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="ChangePercent" label="涨跌幅" width="110" sortable>
						<template #default="scope">
							<span :class="upDownClass(scope.row.ChangePercent)">{{ formatPercent(scope.row.ChangePercent) }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="ChangeAmount" label="涨跌额" width="100" sortable>
						<template #default="scope">
							<span :class="upDownClass(scope.row.ChangePercent)">{{ fmtSigned(scope.row.ChangeAmount) }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="Volume" label="成交量" width="110" sortable>
						<template #default="scope">{{ fmtUnit(scope.row.Volume, '万') }}</template>
					</el-table-column>
					<el-table-column prop="Amount" label="成交额" width="110" sortable>
						<template #default="scope">{{ fmtUnit(scope.row.Amount, '亿') }}</template>
					</el-table-column>
					<el-table-column prop="Amplitude" label="振幅" width="100" sortable>
						<template #default="scope">{{ fmtUnit(scope.row.Amplitude, '%') }}</template>
					</el-table-column>
					<el-table-column prop="Turnover" label="换手率" width="110" sortable>
						<template #default="scope">{{ fmtUnit(scope.row.Turnover, '%') }}</template>
					</el-table-column>
					<el-table-column prop="MarketCap" label="市值" width="120" sortable>
						<template #default="scope">{{ fmtUnit(scope.row.MarketCap, '亿', 1) }}</template>
					</el-table-column>
				</el-table>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { dayjs } from 'element-plus'
import * as echarts from 'echarts'
import { formatPercent } from '@/consts/zhiduoxing-const'
import zdxApi from '@/apis/zdx-api'
import { IZdxSectorDetail } from '@/interfaces/zhiduoxing/IZdxStockDetail'
import { IZdxMarketKlinePoint, IZdxSectorSummary, IZdxStockQuoteItem } from '@/interfaces/zhiduoxing/IZdxStockQuote'
import { IPersonalMenuTree } from '@/interfaces/IPersonalMenuTree'
import { useBrowserStore } from '@/stores/browserStore'

const route = useRoute()
const router = useRouter()
const browserStore = useBrowserStore()

// “个股行情”菜单（与 sys_menu 配置一致；点击成分股行打开个股详情标签并携带股票代码）
const STOCK_MENU: IPersonalMenuTree = {
	Id: '7E4B2C9A-1D5F-4A8B-9C0E-08DF07289DFB',
	Code: 'ZdxStockQuote',
	Name: '个股行情',
	Url: '/zhiduoxing/stock-detail',
	Type: 2,
	OpenType: 1,
	Icon: 'arrow-trend-up',
	IsDefault: false,
	Children: []
}

// ---------- 状态 ----------
// 行业列表（只读库内行情快照；涨跌幅降序）与本地过滤
const sectors = ref<IZdxSectorSummary[]>([])
const sectorLoading = ref(false)
const sideFilter = ref('')

// 当前行业（路由 query.name 驱动；支持个股页行业标签跳入）
const currentName = ref('')

// 报价卡
const detail = ref<IZdxSectorDetail>()
const detailLoading = ref(false)

const dataSource = ref<number | undefined>(undefined) // 当前数据源（undefined=东财优先回退腾讯；4=腾讯）

// K线（日/周/月）
const PERIODS = [
	{ value: 'day', label: '日K' },
	{ value: 'week', label: '周K' },
	{ value: 'month', label: '月K' }
]
// K线请求条数上限（日K约2.4年，覆盖 MA250 均线窗口；周K近250周、月K近120个月）
const KLINE_COUNT: Record<string, number> = { day: 600, week: 250, month: 120 }
// K线默认可视窗口（根数：日K近120个交易日、周K近100周、月K近120个月）
const DEFAULT_VIEW: Record<string, number> = { day: 120, week: 100, month: 120 }
// 价格均线配置（与市场行情页K线口径一致：日K MA5/20/120/250、周K MA4/12/24/48、月K MA3/6/12；
// 板块K线接口均线字段为空，此处由前端按收盘价现算）
const MA_PERIODS: Record<string, number[]> = {
	day: [5, 20, 120, 250],
	week: [4, 12, 24, 48],
	month: [3, 6, 12]
}
const MA_COLORS = ['#f5c542', '#e6a23c', '#409eff', '#b37feb']
// 成交量均线配置（日 量MA5/20、周 量MA4/12、月 量MA3/6；颜色与 tooltip 行一致）
const VOL_MA_PERIODS: Record<string, number[]> = {
	day: [5, 20],
	week: [4, 12],
	month: [3, 6]
}
const VOL_MA_COLORS = ['#00d4ff', '#ff85c0']
// K线x轴刻度候选步长（根/格；缩放自适应时从中选最贴近"视窗约10格"的值）
const TICK_CANDIDATES: Record<string, number[]> = {
	day: [1, 2, 3, 5, 10, 12, 15, 20, 30, 60],
	week: [1, 2, 4, 8, 13, 26, 52],
	month: [1, 3, 6, 12, 24, 36]
}
const TARGET_TICKS = 10
const upColor = '#f56c6c'
const downColor = '#67c23a'

const period = ref('day')
const klines = ref<IZdxMarketKlinePoint[]>([])
const klineLoading = ref(false)

// 数据源切换（行业K线双渠道分行存底：2=东财/4=腾讯；undefined=后端默认“东财优先、无东财行回退腾讯”）
// 东财按钮：置 undefined（优先东财、缺失时自动回退腾讯，避免仅腾讯渠道行业空图）；腾讯按钮：置 4（强制腾讯口径）
const SOURCES = [
	{ value: undefined as number | undefined, label: '东财', active: () => dataSource.value !== 4 },
	{ value: 4 as number | undefined, label: '腾讯', active: () => dataSource.value === 4 }
]

// 成分股（该行业个股列表；本地过滤）
const members = ref<IZdxStockQuoteItem[]>([])
const memberLoading = ref(false)
const memberFilter = ref('')

// 已收盘日期（交易日历默认值；失败回退今日）
const closeDate = ref(dayjs().format('YYYY/MM/DD'))

// ---------- 计算属性 ----------
// 侧栏过滤（按行业名称模糊）
const filteredSectors = computed(() => {
	const kw = sideFilter.value.trim()
	if (!kw) return sectors.value
	return sectors.value.filter(s => s.Name.includes(kw))
})

// 成分股过滤（代码/名称模糊）
const filteredMembers = computed(() => {
	const kw = memberFilter.value.trim().toLowerCase()
	if (!kw) return members.value
	return members.value.filter(m => m.Code.toLowerCase().includes(kw) || m.Name.toLowerCase().includes(kw))
})

// 涨跌家数占比（平盘=剩余部分，保证比例条三段合计100%）
const upRatio = computed(() => {
	const total = detail.value?.Total ?? 0
	return total ? Math.round(((detail.value?.Up ?? 0) / total) * 100) : 0
})
const downRatio = computed(() => {
	const total = detail.value?.Total ?? 0
	return total ? Math.round(((detail.value?.Down ?? 0) / total) * 100) : 0
})
const flatRatio = computed(() => Math.max(0, 100 - upRatio.value - downRatio.value))

// ---------- 格式化 ----------
function changeClass(percent?: number | null) {
	if (percent === undefined || percent === null || percent === 0) return ''
	return percent > 0 ? 'up' : 'down'
}
function upDownClass(percent: number) {
	return percent > 0 ? 'up' : percent < 0 ? 'down' : ''
}
function fmtPoint(v?: number | null) {
	return typeof v === 'number' && v > 0 ? v.toFixed(2) : '--'
}
function fmtPrice(v?: number) {
	return typeof v === 'number' ? v.toFixed(2) : '--'
}
function fmtSigned(v?: number) {
	if (typeof v !== 'number') return '--'
	return (v > 0 ? '+' : '') + v.toFixed(2)
}
function fmtUnit(v: number | undefined, unit: string, digits = 2) {
	return typeof v === 'number' ? v.toFixed(digits) + unit : '--'
}

// 成交量口语化（K线字段口径为百手：源值×100 换算为手）：按量级自动切换 万亿手/亿手/万手/手
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

// ---------- 数据加载（序号防竞态） ----------
let detailSeq = 0
let klineSeq = 0
let memberSeq = 0

// 加载行业列表（完成后无选中项时默认第一条，即涨幅第一）
async function loadSectors() {
	sectorLoading.value = true
	try {
		const list = await zdxApi.getMarketSectors()
		sectors.value = list ?? []
		if (!currentName.value && sectors.value.length) {
			router.replace({ query: { ...route.query, name: sectors.value[0].Name } })
		}
	} catch {
		sectors.value = []
	} finally {
		sectorLoading.value = false
	}
}

// 加载板块报价（东财实时三级降级兜底；接口空响应时按无数据处理）
async function loadDetail(name: string) {
	const seq = ++detailSeq
	detailLoading.value = true
	try {
		const res = await zdxApi.getSectorDetail(name, dataSource.value)
		if (seq !== detailSeq) return
		detail.value = res && res.Name ? res : undefined
	} catch {
		if (seq === detailSeq) detail.value = undefined
	} finally {
		if (seq === detailSeq) detailLoading.value = false
	}
}

// 加载板块K线（日/周/月均读库；无数据返回空数组）
async function loadKlines(name: string, p: string) {
	const seq = ++klineSeq
	klineLoading.value = true
	try {
		const list = await zdxApi.getSectorKlines(name, p, KLINE_COUNT[p] ?? 600, dataSource.value)
		if (seq !== klineSeq) return
		klines.value = list ?? []
	} catch {
		if (seq !== klineSeq) return
		klines.value = []
	} finally {
		if (seq === klineSeq) {
			klineLoading.value = false
			renderChart()
		}
	}
}

// 加载成分股（一次性拉取该行业全量，前端本地过滤/排序）
async function loadMembers(name: string) {
	const seq = ++memberSeq
	memberLoading.value = true
	try {
		const res = await zdxApi.getStocks({ Sector: name }, 1, 1000)
		if (seq !== memberSeq) return
		members.value = res?.Items ?? []
	} catch {
		if (seq === memberSeq) members.value = []
	} finally {
		if (seq === memberSeq) memberLoading.value = false
	}
}

// 已收盘日期（交易日历口径；失败回退今日）
async function loadCloseDate() {
	try {
		const def = await zdxApi.getTradeDayDefault()
		closeDate.value = dayjs(def.TradeDate).format('YYYY/MM/DD')
	} catch {
		// 接口异常时保持今日
	}
}

// ---------- 交互 ----------
// 切换行业（路由驱动重新加载）
function switchSector(name: string) {
	if (!name || name === currentName.value) return
	router.replace({ query: { ...route.query, name } })
}

// 切换K线周期
function switchPeriod(p: string) {
	if (period.value === p) return
	period.value = p
	if (currentName.value) loadKlines(currentName.value, p)
}

// 切换数据源（undefined=东财优先回退腾讯；4=腾讯）：按所选来源重拉K线与详情走势
function switchDataSource(src?: number) {
	if (dataSource.value === src) return
	dataSource.value = src
	if (currentName.value) {
		loadKlines(currentName.value, period.value)
		loadDetail(currentName.value)
	}
}

// 点击成分股行：打开个股详情（携带股票代码）
function openStock(row: IZdxStockQuoteItem) {
	if (!row?.Code) return
	browserStore.navigate(STOCK_MENU, undefined, { code: row.Code })
}

// 同步浏览器标签的参数（避免切走后再切回时数据回退到旧行业）
function syncBrowserTab(name: string) {
	const tab = browserStore.tabs.find(t => t.Url === '/zhiduoxing/sector-quote')
	if (tab) tab.Query = { ...(tab.Query ?? {}), name }
}

// ---------- 路由驱动 ----------
watch(
	() => route.query.name,
	name => {
		const target = (name as string) || ''
		if (target === currentName.value) return
		currentName.value = target
		if (target) {
			syncBrowserTab(target)
			loadDetail(target)
			loadKlines(target, period.value)
			loadMembers(target)
		} else {
			// 无参数（首次进入）：等 loadSectors 完成后自动选中第一条
			detail.value = undefined
			klines.value = []
			members.value = []
		}
	},
	{ immediate: true }
)

// ---------- K线图（ECharts 自绘：蜡烛 + 前端算均线 + 成交量副图） ----------
const chartEl = ref<HTMLElement>()
let chartIns: echarts.ECharts | null = null
// x轴当前刻度步长（缩放自适应；变化时局部刷新双图x轴）
let tickStep = 1
// 量轴当前轴顶（视窗量峰取整；避免重复局部刷新）
let lastVolAxisTop = 0
// 当前周期的量均线值数组（缩放时量峰计算需一并纳入均线）
let volOverlay: { label: string; color: string; values: (number | null)[] }[] = []

// 收盘价移动平均（不足周期的位置为 null，线从首个有值点开始）
function calcMA(values: number[], p: number): (number | null)[] {
	const result: (number | null)[] = []
	let sum = 0
	for (let i = 0; i < values.length; i++) {
		sum += values[i]
		if (i >= p) sum -= values[i - p]
		result.push(i >= p - 1 ? sum / p : null)
	}
	return result
}

// x轴刻度步长：从候选表中选最贴近"视窗约10格"的值
function pickTickStep(visible: number) {
	const candidates = TICK_CANDIDATES[period.value] ?? TICK_CANDIDATES.day
	const ideal = Math.max(1, visible) / TARGET_TICKS
	let best = candidates[0]
	for (const c of candidates) {
		if (Math.abs(c - ideal) <= Math.abs(best - ideal)) best = c
	}
	return best
}

// 可见区间量系列峰值（成交量柱 + 当前周期各条量均线）
function visibleVolPeak(list: IZdxMarketKlinePoint[], from: number, to: number): number {
	let peak = 0
	const start = Math.max(0, from)
	const end = Math.min(list.length - 1, to)
	for (let i = start; i <= end; i++) {
		const v = list[i].Volume
		if (typeof v === 'number' && v > peak) peak = v
	}
	for (const def of volOverlay) {
		for (let i = start; i <= end; i++) {
			const v = def.values[i]
			if (typeof v === 'number' && v > peak) peak = v
		}
	}
	return peak
}

// 量轴轴顶：在可见量峰上留少量余量（约6%）再向上取整到量级步长，使轴顶紧贴可见峰值为整洁数字
function niceVolTop(v: number) {
	if (!isFinite(v) || v <= 0) return 0
	const step = Math.pow(10, Math.floor(Math.log10(v)) - 1)
	return Number((Math.ceil((v * 1.06) / step) * step).toPrecision(12))
}

// 图表初始化与渲染（数据晚到场景：容器出现后再初始化）
async function renderChart() {
	await nextTick()
	if (!klines.value.length) {
		chartIns?.dispose()
		chartIns = null
		return
	}
	if (!chartIns && chartEl.value) {
		chartIns = echarts.init(chartEl.value)
		// K线缩放（滚轮/拖动）时按可见根数自适应重算刻度步长
		chartIns.on('dataZoom', handleZoom)
	}
	if (!chartIns) return
	if (chartIns.getWidth() === 0) chartIns.resize()
	setKlineOption()
}

// 绘制K线图（涨红跌绿；双图：上=蜡烛+价格均线、下=成交量柱+量均线）
function setKlineOption() {
	if (!chartIns) return
	const list = klines.value
	if (!list.length) {
		chartIns.clear()
		return
	}
	const lastIndex = list.length - 1
	// 默认可视窗口起始索引（日K近120个交易日、周K近100周、月K近120个月）
	const view = DEFAULT_VIEW[period.value] ?? 120
	const zoomStart = Math.max(0, list.length - view)
	tickStep = pickTickStep(list.length - zoomStart)
	const isTick = (index: number) => (lastIndex - index) % tickStep === 0
	// 均线（前端现算）：价格均线 + 量均线（量均线保存供缩放时量峰重算）
	const closes = list.map(k => k.Close)
	const maDefs = (MA_PERIODS[period.value] ?? MA_PERIODS.day).map((n, i) => ({
		label: `MA${n}`,
		color: MA_COLORS[i] ?? MA_COLORS[MA_COLORS.length - 1],
		values: calcMA(closes, n)
	}))
	const volMaDefs = (VOL_MA_PERIODS[period.value] ?? VOL_MA_PERIODS.day).map((n, i) => ({
		label: `量MA${n}`,
		color: VOL_MA_COLORS[i] ?? VOL_MA_COLORS[VOL_MA_COLORS.length - 1],
		values: calcMA(list.map(k => k.Volume ?? 0), n)
	}))
	volOverlay = volMaDefs
	// 量轴轴顶：按默认视窗内的量系列峰值取整（只显示 0 与轴顶两档刻度）
	const volAxisMax = niceVolTop(visibleVolPeak(list, zoomStart, lastIndex))
	lastVolAxisTop = volAxisMax
	chartIns.setOption(
		{
			animation: false,
			tooltip: {
				trigger: 'axis',
				// 十字线跨双图联动（鼠标在任一图内时，两图同列十字线同步显示）
				axisPointer: {
					type: 'cross',
					link: [{ xAxisIndex: 'all' }]
				},
				backgroundColor: 'rgba(48, 49, 51, 0.92)',
				borderColor: 'rgba(48, 49, 51, 0.92)',
				textStyle: { color: '#ffffff', fontSize: 12 },
				borderRadius: 8,
				// 蜡烛图提示用中文；类目轴下 ECharts 会给 candlestick 数据项前置类目索引，
				// 因此直接按 dataIndex（原始全量索引）取源数据，避免解构错位；
				// 版式统一：标签左、数值右两列布局，数值固定两位小数
				formatter: (params: any) => {
					const p = Array.isArray(params) ? params[0] : params
					if (!p) return ''
					const k = list[p.dataIndex]
					if (!k) return ''
					const row = (label: string, value: string, color = '#ffffff') =>
						`<div style="display:flex;justify-content:space-between;gap:18px"><span>${label}</span><span style="color:${color}">${value}</span></div>`
					const num = (v: number | null | undefined) => (typeof v === 'number' ? v.toFixed(2) : '--')
					const lines = [`<div style="font-weight:600;margin-bottom:3px">${k.Date}</div>`]
					lines.push(row('开盘', num(k.Open)))
					lines.push(row('最高', num(k.High)))
					lines.push(row('最低', num(k.Low)))
					lines.push(row('收盘', num(k.Close)))
					// 涨跌幅/振幅为落库字段（首根无前收盘：涨跌幅为0、振幅为空显示 --；涨红跌绿）
					const pct = k.ChangePercent
					const pctText = pct === null || pct === undefined ? '--' : `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`
					const pctColor = pct === null || pct === undefined || pct === 0 ? '#ffffff' : pct > 0 ? upColor : downColor
					lines.push(row('涨跌幅', pctText, pctColor))
					const amp = k.Amplitude
					lines.push(row('振幅', amp === null || amp === undefined ? '--' : `${amp.toFixed(2)}%`))
					for (const def of maDefs) {
						lines.push(row(def.label, num(def.values[p.dataIndex]), def.color))
					}
					// 成交量与量均线（口语化量词自动切换；分隔线与上方K线数据块区分）
					lines.push('<div style="border-top:1px solid rgba(255,255,255,0.16);margin:5px 0 3px"></div>')
					lines.push(row('成交量', formatVolume(k.Volume)))
					for (const def of volMaDefs) {
						lines.push(row(def.label, formatVolume(def.values[p.dataIndex]), def.color))
					}
					return `<div style="font-size:12px;line-height:1.7;min-width:170px">${lines.join('')}</div>`
				}
			},
			// 均线说明图例：上=价格均线（显示最新一根均线值；点击切换显示/隐藏）；下=量均线（图标颜色与线色一致）
			legend: [
				{
					top: 6,
					left: 74,
					itemWidth: 14,
					itemHeight: 8,
					itemGap: 18,
					icon: 'roundRect',
					selectedMode: true,
					textStyle: { fontSize: 12, color: '#606266' },
					data: maDefs.map(ma => ma.label),
					formatter: (name: string) => {
						const def = maDefs.find(m => m.label === name)
						const v = def ? def.values[def.values.length - 1] : null
						return `${name} ${typeof v === 'number' ? v.toFixed(2) : '--'}`
					}
				},
				{
					top: 337,
					left: 132,
					itemWidth: 14,
					itemHeight: 8,
					itemGap: 18,
					icon: 'roundRect',
					selectedMode: true,
					textStyle: { fontSize: 12, color: '#a7abba' },
					data: volMaDefs.map(ma => ma.label),
					formatter: (name: string) => {
						const def = volMaDefs.find(m => m.label === name)
						const v = def ? def.values[def.values.length - 1] : null
						return `${name} ${formatVolume(v)}`
					}
				}
			],
			// 双图布局：上=K线蜡烛图（顶部留出均线图例带），下=成交量柱状图；
			// 两图采用相同的左右固定边距，保证纵向网格线与蜡烛/柱列严格对齐
			grid: [
				{
					left: 70,
					right: 20,
					top: 32,
					height: 296
				},
				{
					left: 70,
					right: 20,
					top: 356,
					bottom: 40
				}
			],
			// 成交量区小标题（置于K线区与成交量区的间隙带左缘）
			graphic: [
				{
					type: 'text',
					left: 74,
					top: 341,
					style: {
						text: '成交量',
						fontSize: 12,
						fill: '#a7abba'
					}
				}
			],
			// 滚轮缩放、拖动平移（默认视窗：日K近120个交易日、周K近100周、月K近120个月）；x轴联动双图
			dataZoom: [
				{
					type: 'inside',
					xAxisIndex: [0, 1],
					startValue: zoomStart,
					endValue: lastIndex
				}
			],
			// 主图x轴（纵向网格线与副图对齐；日期标签统一在成交量图底部显示）
			xAxis: [
				{
					type: 'category',
					gridIndex: 0,
					data: list.map(k => k.Date),
					axisLine: { show: false },
					axisTick: { show: false },
					axisLabel: { show: false },
					splitLine: {
						show: true,
						interval: (index: number) => isTick(index),
						lineStyle: { type: 'dashed' }
					}
				},
				// 成交量图x轴（标签与网格线同频：从最新点倒推每N根一格、N随缩放自适应），最右侧刻度即最新日期
				{
					type: 'category',
					gridIndex: 1,
					data: list.map(k => k.Date),
					axisLine: { show: false },
					axisTick: { show: false },
					axisLabel: {
						interval: (index: number) => isTick(index),
						hideOverlap: true,
						formatter: (value: string) => (period.value === 'month' ? value.slice(0, 7) : value)
					},
					splitLine: {
						show: true,
						interval: (index: number) => isTick(index),
						lineStyle: { type: 'dashed' }
					}
				}
			],
			// 主图价格轴 + 成交量图独立轴（柱状图从0起画）
			yAxis: [
				{
					type: 'value',
					scale: true,
					axisLine: { show: false },
					axisTick: { show: false },
					splitLine: {
						show: true,
						lineStyle: { type: 'dashed' }
					}
				},
				// 成交量轴（只保留最大/最小两个刻度值——0 与量峰取整值）
				{
					type: 'value',
					gridIndex: 1,
					min: 0,
					max: volAxisMax > 0 ? volAxisMax : undefined,
					interval: volAxisMax > 0 ? volAxisMax : undefined,
					axisLine: { show: false },
					axisTick: { show: false },
					axisLabel: {
						show: true,
						fontSize: 10,
						// 两档刻度值口语化（0 与轴顶，值口径同成交量：×100 为手）
						formatter: (value: number) => formatVolume(value, false)
					},
					splitLine: { show: false }
				}
			],
			series: [
				{
					name: 'K线',
					type: 'candlestick',
					// ECharts 蜡烛图数据顺序：[开盘, 收盘, 最低, 最高]
					data: list.map(k => [k.Open, k.Close, k.Low, k.High]),
					itemStyle: {
						// 涨红跌绿（阳线红、阴线绿）
						color: upColor,
						color0: downColor,
						borderColor: upColor,
						borderColor0: downColor
					}
				},
				...maDefs.map(def => ({
					name: def.label,
					type: 'line',
					showSymbol: false,
					data: def.values,
					lineStyle: { width: 1, color: def.color },
					itemStyle: { color: def.color }
				})),
				// 成交量柱状图（涨红跌绿：收盘不低于开盘为红）
				{
					name: '成交量',
					type: 'bar',
					xAxisIndex: 1,
					yAxisIndex: 1,
					barWidth: '60%',
					data: list.map(k => ({
						value: k.Volume,
						itemStyle: { color: k.Close >= k.Open ? upColor : downColor }
					}))
				},
				// 成交量均线（不足周期为空不绘制，线从首个有值点开始）
				...volMaDefs.map(def => ({
					name: def.label,
					type: 'line',
					xAxisIndex: 1,
					yAxisIndex: 1,
					showSymbol: false,
					data: def.values,
					lineStyle: { width: 1, color: def.color },
					itemStyle: { color: def.color }
				}))
			]
		},
		true
	)
}

// 量轴轴顶随视窗刷新：按本次可见区间（含量均线）的量峰重算轴顶；值无变化时不重复刷新
function refreshVolAxisMax(startIdx: number, endIdx: number) {
	if (!chartIns || !klines.value.length) return
	const top = niceVolTop(visibleVolPeak(klines.value, startIdx, endIdx))
	if (!top || top === lastVolAxisTop) return
	lastVolAxisTop = top
	// 仅局部刷新量轴（yAxis 索引1）：max=interval=轴顶值，保持"0 与轴顶"两档刻度
	chartIns.setOption({ yAxis: [{}, { max: top, interval: top }] })
}

// K线缩放回调：按当前视窗可见根数重算刻度步长（步长变化才局部刷新，双图x轴共用同一函数）；
// 视窗范围优先取事件载荷（滚动缩放为批处理 { batch: [{ start, end }] } 百分比区间，最可靠），
// 读组件状态可能拿到未就绪值（null/undefined），必须严格校验有限数值
function handleZoom(params?: any) {
	if (!chartIns || !klines.value.length) return
	const lastIndex = klines.value.length - 1
	let startIdx = NaN
	let endIdx = NaN
	const evtItem = (Array.isArray(params?.batch) ? params.batch[0] : params) as any
	if (typeof evtItem?.start === 'number' && isFinite(evtItem.start) && typeof evtItem.end === 'number' && isFinite(evtItem.end)) {
		startIdx = Math.round((evtItem.start / 100) * lastIndex)
		endIdx = Math.round((evtItem.end / 100) * lastIndex)
	} else {
		const dz = (chartIns.getOption().dataZoom as any[] | undefined)?.[0]
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
	if (step === tickStep) return
	tickStep = step
	// 使用新的 interval 函数引用触发 ECharts 重新判定标签与网格线（双图x轴：主图仅网格线、副图标签+网格线）
	const isTick = (index: number) => (lastIndex - index) % step === 0
	chartIns.setOption({
		xAxis: [
			{ splitLine: { interval: isTick } },
			{ axisLabel: { interval: isTick }, splitLine: { interval: isTick } }
		]
	})
}

function handleResize() {
	chartIns?.resize()
}

onMounted(() => {
	loadCloseDate()
	loadSectors()
	window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
	window.removeEventListener('resize', handleResize)
	chartIns?.dispose()
	chartIns = null
})
</script>

<style lang="scss" scoped>
.sector-quote {
	display: flex;
	align-items: flex-start;
	gap: 20px;

	// 涨红跌绿
	.up {
		color: var(--el-color-danger);
	}

	.down {
		color: var(--el-color-success);
	}

	.flat {
		color: #606266;
	}

	// ---------- 左侧栏 ----------
	.side-bar {
		position: sticky;
		top: 0;
		display: flex;
		flex-direction: column;
		width: 240px;
		flex-shrink: 0;
		max-height: calc(100vh - 150px);
		background: #fff;
		border-radius: 16px;
		overflow: hidden;

		.side-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 14px 16px 10px;

			.side-title {
				font-size: 15px;
				font-weight: 600;
				color: #303133;
			}

			.side-count {
				font-size: 12px;
				color: #a7abba;
			}
		}

		.side-search {
			padding: 0 12px 10px;
			border-bottom: 1px solid #f5f6fb;

			:deep(.el-input__wrapper) {
				min-height: 28px;
				font-size: 12px;
				padding: 0 10px;
				border-radius: 14px;
				background: #f5f6fb;
				box-shadow: none;
				transition: background 0.2s, box-shadow 0.2s;

				&:hover {
					background: #eef0f7;
				}

				&.is-focus {
					background: #fff;
					box-shadow: 0 0 0 1px #409eff inset;
				}
			}

			.search-icon {
				font-size: 11px;
				color: #a7abba;
			}
		}

		.side-list {
			flex: 1;
			min-height: 240px;
			overflow-y: auto;
			padding: 8px;

			.side-item {
				position: relative;
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 8px 12px;
				border-radius: 10px;
				cursor: pointer;
				margin-bottom: 2px;
				transition: background 0.2s;

				&:hover {
					background: #f7f8fc;
				}

				&.active {
					background: #ecf5ff;

					&::before {
						content: '';
						position: absolute;
						left: 0;
						top: 22%;
						bottom: 22%;
						width: 3px;
						border-radius: 2px;
						background: #409eff;
					}

					.item-name {
						color: #409eff;
					}
				}

				.item-left {
					min-width: 0;
					margin-right: 8px;

					.item-name {
						font-size: 13px;
						color: #2e3543;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						transition: color 0.2s;
					}

					.item-stats {
						font-size: 11px;
						color: #a7abba;
						margin-top: 2px;
					}
				}

				.item-right {
					text-align: right;
					flex-shrink: 0;

					.item-price {
						font-size: 13px;
						font-weight: 600;
						color: #2e3543;
					}

					.item-change {
						font-size: 11px;
						margin-top: 2px;
					}
				}
			}

			.side-empty {
				padding: 40px 12px;
				text-align: center;
				font-size: 13px;
				color: #a7abba;
				line-height: 22px;
			}
		}
	}

	// ---------- 右侧主区 ----------
	.main-area {
		flex: 1;
		min-width: 0;
	}

	// 板块报价卡
	.quote-card {
		background: #fff;
		border-radius: 16px;
		padding: 20px 24px;
		margin-bottom: 20px;

		.title-row {
			display: flex;
			align-items: center;
			justify-content: space-between;

			.sector-title {
				display: flex;
				align-items: center;

				.title-text {
					font-size: 1.35rem;
					font-weight: 600;
					color: #303133;
					margin-right: 14px;
				}

				.tag {
					padding: 4px 12px;
					font-size: 13px;
					color: #606266;
					border-radius: 6px;
					background: #f5f6fb;
					margin-right: 8px;
				}
			}

			.close-time {
				font-size: 12px;
				color: #a7abba;
			}
		}

		.quote-row {
			display: flex;
			align-items: center;
			padding-top: 16px;

			.price-block {
				width: 200px;
				flex-shrink: 0;
				margin-right: 32px;

				.price {
					display: flex;
					align-items: center;

					span {
						font-size: 2.5rem;
						font-weight: bold;
						color: #303133;

						&.up {
							color: var(--el-color-danger);
						}

						&.down {
							color: var(--el-color-success);
						}
					}

					.trend-icon {
						font-size: 1.5rem;
						margin-left: 8px;
					}
				}

				.change-line {
					display: flex;
					align-items: center;
					gap: 12px;
					margin-top: 2px;
					font-size: 1rem;
					font-weight: 500;
				}
			}

			// 涨跌家数统计块 + 比例条
			.stats-block {
				flex: 1;
				min-width: 260px;
				max-width: 520px;

				.stat-grid {
					display: grid;
					grid-template-columns: repeat(4, 1fr);
					gap: 10px 16px;
					margin-bottom: 14px;

					.stat-item {
						display: flex;
						align-items: baseline;
						gap: 8px;
						font-size: 13px;
						white-space: nowrap;

						.label {
							color: #a7abba;
						}

						.value {
							font-weight: 600;
							color: #2e3543;
						}
					}
				}

				.ratio-bar {
					display: flex;
					height: 10px;
					border-radius: 5px;
					overflow: hidden;

					.ratio-up {
						background: var(--el-color-danger);
					}

					.ratio-flat {
						background: #dcdfe6;
					}

					.ratio-down {
						background: var(--el-color-success);
					}
				}

				.ratio-text {
					display: flex;
					justify-content: space-between;
					font-size: 12px;
					margin-top: 6px;
				}
			}
		}
	}

	// K线卡与成分股卡
	.chart-card,
	.member-card {
		background: #fff;
		border-radius: 16px;
		padding: 16px 24px 20px;
		margin-bottom: 20px;

		.card-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding-bottom: 12px;
			border-bottom: 1px solid #f5f6fb;
			margin-bottom: 12px;

			.card-title {
				font-size: 16px;
				font-weight: 600;
				color: #303133;
			}

			.header-controls {
				display: flex;
				align-items: center;
				gap: 12px;
			}
		}
	}

	// 数据源切换（复用周期切换胶囊样式，仅缩小内边距并加标题前缀）
	.source-tabs {
		.tab-caption {
			padding: 5px 4px 5px 10px;
			font-size: 12px;
			color: #909399;
			cursor: default;

			&:hover {
				color: #909399;
			}

			&.active {
				background: transparent;
				box-shadow: none;
				color: #909399;
				font-weight: 400;
			}
		}

		span {
			padding: 5px 12px;
		}
	}

	// K线周期切换
	.period-tabs {
		display: flex;
		gap: 4px;
		padding: 3px;
		border-radius: 10px;
		background: #f5f6fb;

		span {
			padding: 5px 16px;
			font-size: 13px;
			color: #606266;
			border-radius: 8px;
			cursor: pointer;
			transition: all 0.2s;

			&:hover {
				color: #409eff;
			}

			&.active {
				color: #409eff;
				font-weight: 600;
				background: #fff;
				box-shadow: 0 2px 6px rgba(64, 158, 255, 0.15);
			}
		}
	}

	.chart-box {
		min-height: 200px;

		.chart {
			height: 480px;
		}
	}

	// 成分股搜索框
	.member-search {
		width: 220px;

		:deep(.el-input__wrapper) {
			min-height: 30px;
			font-size: 13px;
			border-radius: 15px;
			background: #f5f6fb;
			box-shadow: none;
			transition: background 0.2s, box-shadow 0.2s;

			&:hover {
				background: #eef0f7;
			}

			&.is-focus {
				background: #fff;
				box-shadow: 0 0 0 1px #409eff inset;
			}
		}

		.search-icon {
			font-size: 12px;
			color: #a7abba;
		}
	}

	// 成分股表格行（点击跳个股行情）
	:deep(.ofa-table) {
		.el-table__row {
			cursor: pointer;
		}

		.name-tag {
			margin-left: 4px;
		}
	}
}
</style>
