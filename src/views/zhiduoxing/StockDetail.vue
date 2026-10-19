<template>
	<div class="stock-detail">
		<!-- 公告事件回测吸顶联动栏：公告 Tab + 事件回测视图且已滚过K线区时出现，免长距离滚动回看走势 -->
		<transition name="slb-fade">
			<div v-if="showStickyBar" class="sticky-link-bar">
				<span class="slb-title"><font-awesome-icon fas icon="bullhorn"></font-awesome-icon>&nbsp;{{ currentCode }} {{ detail?.Name ?? '' }}</span>
				<span :class="['slb-price', changeClass(detail?.ChangePercent)]">{{ fmtPrice(detail?.Price) }}</span>
				<span :class="['slb-pct', changeClass(detail?.ChangePercent)]">{{ fmtSigned(detail?.ChangePercent) }}%</span>
				<span class="slb-tip">公告事件已同步至K线下方泳道</span>
				<span class="slb-btn" @click="backToChart">回到K线 ↑</span>
			</div>
		</transition>
		<!-- 左侧栏：个股/自选 -->
		<div class="side-bar">
			<div class="side-tabs">
				<span :class="{ active: sideTab === 'stock' }" @click="switchSideTab('stock')">个股</span>
				<span :class="{ active: sideTab === 'fav' }" @click="switchSideTab('fav')">自选</span>
				<el-select v-model="sideSort" class="sort-select" size="small">
					<template #prefix>
						<font-awesome-icon fas icon="sort" class="sort-prefix"></font-awesome-icon>
					</template>
					<el-option v-for="s in SIDE_SORTS" :key="s.value" :label="s.label" :value="s.value"></el-option>
				</el-select>
				<!-- 市场选择（与市场行情页同一数据源；切换浏览各市场个股） -->
				<div v-if="sideTab === 'stock' && marketTabs.length" class="side-markets">
					<span
						v-for="m in marketTabs"
						:key="m.Key"
						class="market-chip"
						:class="{ active: sideMarket === m.Key }"
						@click="selectSideMarket(m.Key)"
					>
						<span class="chip-label">{{ m.Label }}</span>
						<span class="chip-count">{{ m.Count }}</span>
					</span>
				</div>
			</div>
			<div ref="sideListRef" v-loading="sideLoading" class="side-list">
				<div
					v-for="item in sideList"
					:key="item.Code"
					class="side-item"
					:class="{ active: item.Code === currentCode }"
					@click="switchStock(item.Code)"
				>
					<div class="item-left">
						<div class="item-name-row">
							<span class="item-name">{{ item.Name }}</span>
							<span v-if="item.HoldVolume" class="item-hold">持 {{ fmtVolume(item.HoldVolume) }}</span>
						</div>
						<div class="item-code">{{ item.Code }}</div>
					</div>
					<div class="item-right">
						<div class="item-price" :class="changeClass(item.ChangePercent)">{{ fmtPrice(item.Price) }}</div>
						<div class="item-change" :class="changeClass(item.ChangePercent)">
							{{ fmtSigned(item.ChangeAmount) }} {{ formatPercent(item.ChangePercent) }}
						</div>
					</div>
				</div>
				<div v-if="!sideLoading && !sideList.length" class="side-empty">
					{{ sideTab === 'fav' ? '暂无自选股，可在个股页点击"自选"添加' : '暂无数据' }}
				</div>
			</div>
		</div>

		<!-- 右侧主区 -->
		<div class="main-area">
			<!-- 个股搜索块 -->
			<div class="search-box">
				<el-select
					v-model="searchCode"
					class="stock-search"
					filterable
					remote
					reserve-keyword
					clearable
					:remote-method="searchStocks"
					:loading="searchLoading"
					placeholder="搜索股票代码/名称"
					popper-class="stock-search-popper"
					@change="onSearchSelect"
				>
					<template #prefix>
						<font-awesome-icon fas icon="search" class="search-icon"></font-awesome-icon>
					</template>
					<el-option v-for="s in searchOptions" :key="s.Code" :label="`${s.Code} ${s.Name}`" :value="s.Code">
						<div class="search-option">
							<span class="opt-name">{{ s.Name }}</span>
							<span class="opt-code">{{ s.Code }}</span>
							<span class="opt-pct" :class="changeClass(s.ChangePercent)">
								{{ formatPercent(s.ChangePercent) }}
							</span>
						</div>
					</el-option>
				</el-select>
				<span class="search-tip">支持代码/名称模糊搜索，选中即可切换个股</span>
			</div>

			<!-- 报价卡 -->
			<div v-loading="pageLoading" class="quote-card">
				<div class="title-row">
					<div class="stock-title">
						<el-dropdown trigger="click" max-height="420px" @command="switchStock">
							<span class="title-text">
								{{ detail?.Code ?? currentCode }} {{ detail?.Name ?? '--' }}
								<font-awesome-icon fas icon="chevron-down" class="arrow-icon"></font-awesome-icon>
							</span>
							<template #dropdown>
								<el-dropdown-menu>
									<el-dropdown-item
										v-for="s in marketStocks"
										:key="s.Code"
										:command="s.Code"
										:class="{ current: s.Code === currentCode }"
									>
										<span class="dd-code">{{ s.Code }}</span>&nbsp;{{ s.Name }}
									</el-dropdown-item>
								</el-dropdown-menu>
							</template>
						</el-dropdown>
						<span class="tag" @click="backToMarket">{{ marketLabel }}</span>
						<span v-if="detail?.Sector" class="tag" @click="backToSector">{{ detail.Sector }}</span>
						<!-- 交易状态徽标（池同步维护：1=停牌 2=退市；正常不展示） -->
						<span v-if="detail?.TradeStatus === 1" class="state-tag suspended">停牌</span>
						<span v-if="detail?.TradeStatus === 2" class="state-tag delisted">退市</span>
						<span :class="['favorite-tag', isFavorite ? 'active' : '']" @click="onToggleFav">
							<font-awesome-icon :icon="isFavorite ? 'star' : 'plus'"></font-awesome-icon>
							{{ isFavorite ? '已自选' : '自选' }}
						</span>
						<!-- 近期公告提示徒标（近7天条数/回购进行中；多条合并 tooltip；点击跳公告 Tab） -->
						<el-tooltip v-if="noticeHint?.Show" placement="bottom" :show-after="120">
							<template #content>
								<div style="max-width: 320px; line-height: 1.6">
									<div style="font-weight: 600; margin-bottom: 4px">{{ noticeChipText }}</div>
									<div v-for="it in noticeHint.Items" :key="it.Id" style="font-size: 12px; color: #c8c9cc; white-space: normal">
										<span v-if="it.IsBuyback" style="color: #e6a23c; margin-right: 4px">[回购]</span>{{ it.Title }}
									</div>
								</div>
							</template>
							<span class="notice-tag" @click="gotoNoticeTab">
								<font-awesome-icon fas icon="bullhorn"></font-awesome-icon>
								{{ noticeChipText }}
							</span>
						</el-tooltip>
					</div>
					<div class="title-right">
						<div class="close-time">已收盘 {{ closeDate }} 15:00:00</div>
					</div>
				</div>
				<div class="quote-row">
					<div class="price-block">
						<div class="price">
							<span :class="changeClass(detail?.ChangePercent)">{{ fmtPrice(detail?.Price) }}</span>
							<font-awesome-icon
								v-if="detail"
								fas
								:icon="(detail.ChangePercent ?? 0) >= 0 ? 'arrow-trend-up' : 'arrow-trend-down'"
								:class="['trend-icon', changeClass(detail.ChangePercent)]"
							></font-awesome-icon>
						</div>
						<div :class="['change-line', changeClass(detail?.ChangePercent)]">
							<span>{{ fmtSigned(detail?.ChangeAmount) }}</span>
							<span>{{ detail ? formatPercent(detail.ChangePercent) : '--' }}</span>
						</div>
					</div>
					<div class="metric-grid">
						<el-tooltip v-for="m in metrics" :key="m.label" :content="`${m.label} ${m.value}`" placement="top">
							<div class="metric-item">
								<span class="label">{{ m.label }}</span>
								<span class="value" :class="m.cls ?? ''">{{ m.value }}</span>
							</div>
						</el-tooltip>
					</div>
				</div>

				<!-- 我的交易简略条（点击跳转“交易记录”Tab；明细见页面下方“交易记录”Tab） -->
				<div v-if="myTrade && myTrade.Stats" class="my-trade-strip" @click="gotoTradeTab">
					<span class="strip-title">我的交易</span>
					<span class="strip-item">
						累计净盈亏
						<b :class="changeClass(myTrade.Stats.RealizedProfit)">
							{{ myTrade.Stats.SellCount ? formatThousands(myTrade.Stats.RealizedProfit, true) : '--' }}
						</b>
					</span>
					<span class="strip-item">
						盈亏比
						<b :class="ratioClass">{{ tradeProfitStat.ratio === null ? '--' : tradeProfitStat.ratio.toFixed(2) }}</b>
					</span>
					<span class="strip-item">共 <b>{{ myTrade.Stats.TradeCount }}</b> 笔</span>
					<span class="strip-link">查看交易分析 →</span>
				</div>
			</div>

			<!-- 走势图（分时/日K/周K/月K；周K/月K不显示买卖点与支撑/压力位；双击K线可按该日期打开复盘抽屉） -->
			<QuoteChart ref="quoteChartRef" :code="currentCode" :detail="detail" :trades="myTrade?.Records" drawable hide-week-month-marks @date-dblclick="onChartDblclick" />

			<!-- 行业行情（紧随K线图之后） -->
			<IndustryPanel :sector="detail?.Sector ?? ''" @detail="backToSector" />

			<!-- 信息Tabs（资讯/研报/公司/财务/股东，置于页面最后） -->
			<div ref="infoBox" class="info-box">
				<el-tabs v-model="activeTab" class="info-tabs">
					<el-tab-pane label="资讯" name="news" lazy>
						<NewsReports mode="news" :data="news" />
					</el-tab-pane>
					<el-tab-pane name="notice" lazy>
						<template #label>
							<span class="notice-tab-label">
								公告
								<el-badge v-if="noticeBadgeCount > 0" :value="noticeBadgeCount" :max="99" :offset="[4, -2]" class="notice-tab-badge" />
							</span>
						</template>
						<StockEvents :code="currentCode" @focus-event="onFocusEvent" @review-quote="onReviewQuote" @events-loaded="onEventsLoaded" @view-change="onEventsViewChange" />
					</el-tab-pane>
					<el-tab-pane label="研报" name="report" lazy>
						<NewsReports mode="report" :data="reports" />
					</el-tab-pane>
					<el-tab-pane label="公司" name="company" lazy>
						<CompanyInfo :data="company" />
					</el-tab-pane>
					<el-tab-pane label="财务" name="finance" lazy>
						<FinanceInfo :data="finance" />
					</el-tab-pane>
					<el-tab-pane label="股东" name="holder" lazy>
						<ShareholderInfo :data="holders" />
					</el-tab-pane>
					<el-tab-pane label="交易分析" name="trade" lazy>
						<MyTradePanel
							:data="myTrade"
							:loading="myTradeLoading"
							:review-key="reviewRefreshKey"
							:focus-cycle-seq="focusCycleSeq"
							@goto-zone="gotoMyZone"
						/>
					</el-tab-pane>
					<el-tab-pane label="复盘笔记" name="review" lazy>
						<StockReviewPanel :data="myTrade" :review-key="reviewRefreshKey" @goto-cycle="onGotoCycle" />
					</el-tab-pane>
				</el-tabs>
			</div>
		</div>

		<!-- 复盘悬浮球（页面右下角固定；点击弹出个股复盘笔记抽屉；最近交易日已复盘显示完成态） -->
		<el-tooltip :content="reviewDone ? '最近交易日已复盘，点击查看/修改笔记' : '写复盘笔记'" placement="left">
			<div class="review-ball" :class="{ done: reviewDone }" @click="openReview">
				<font-awesome-icon fas icon="pen-to-square"></font-awesome-icon>
				<span v-if="reviewDone" class="ball-check">✓</span>
			</div>
		</el-tooltip>

		<!-- 个股复盘笔记抽屉（悬浮球/双击K线入口；保存/删除后同步悬浮球完成态与交易记录面板笔记列表） -->
		<ReviewDrawer
			v-model="reviewVisible"
			:type="4"
			:date="reviewDate"
			:stock-code="currentCode"
			:stock-name="detail?.Name"
			:position="myTrade?.Position ?? null"
			:stat="myTrade?.Stats ?? null"
			:detail="detail ?? null"
			:event-quote="reviewEventQuote"
			@saved="onReviewSaved"
			@level-saved="onLevelSaved"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { dayjs } from 'element-plus'
import { MARKETS, calcProfitStat, formatPercent, formatThousands, getFavorites, saveFavorites } from '@/consts/zhiduoxing-const'
import { IPersonalMenuTree } from '@/interfaces/IPersonalMenuTree'
import { IZdxStockMarketTab, IZdxStockQuoteItem } from '@/interfaces/zhiduoxing/IZdxStockQuote'
import { IZdxStockTradeSummary } from '@/interfaces/zhiduoxing/IZdxMyTrade'
import {
	IZdxStockDetail,
	IZdxStockNews,
	IZdxStockReports,
	IZdxCompanyInfo,
	IZdxStockFinance,
	IZdxShareholderInfo
} from '@/interfaces/zhiduoxing/IZdxStockDetail'
import { INoticeHint } from '@/interfaces/zhiduoxing/IZdxNews'
import zdxApi from '@/apis/zdx-api'
import { useBrowserStore } from '@/stores/browserStore'
import QuoteChart from './components/QuoteChart.vue'
import NewsReports from './components/NewsReports.vue'
import StockEvents from './components/StockEvents.vue'
import CompanyInfo from './components/CompanyInfo.vue'
import FinanceInfo from './components/FinanceInfo.vue'
import ShareholderInfo from './components/ShareholderInfo.vue'
import MyTradePanel from './components/MyTradePanel.vue'
import StockReviewPanel from './components/StockReviewPanel.vue'
import ReviewDrawer from './components/ReviewDrawer.vue'
import IndustryPanel from './components/IndustryPanel.vue'

const route = useRoute()
const router = useRouter()
const browserStore = useBrowserStore()

// 默认展示股票（无路由参数时；拉取失败回退同市场涨幅第一）
const DEFAULT_CODE = '000001'

// 市场行情菜单（与 sys_menu 配置一致；点击市场标签时跳回并携带筛选参数）
const MARKET_MENU: IPersonalMenuTree = {
	Id: '679836CE-C0A0-49F4-1CE7-08DF07289DFB',
	Code: 'ZdxCNDaily',
	Name: '市场行情',
	Url: '/zhiduoxing/market',
	Type: 2,
	OpenType: 1,
	Icon: 'star',
	IsDefault: false,
	Children: []
}

// 板块行情菜单（与 sys_menu 配置一致；点击行业标签/行业面板“详情”时跳转并携带行业名称）
const SECTOR_MENU: IPersonalMenuTree = {
	Id: 'C4F8E2A1-7D35-4B96-B8E2-08E01C3D5F6A',
	Code: 'ZdxSectorQuote',
	Name: '板块行情',
	Url: '/zhiduoxing/sector-quote',
	Type: 2,
	OpenType: 1,
	Icon: 'object-group',
	IsDefault: false,
	Children: []
}

// 我的地盘菜单（无交易记录时引导跳转导入；与 sys_menu 配置一致）
const MY_ZONE_MENU: IPersonalMenuTree = {
	Id: 'ZdxMyZone',
	Code: 'ZdxMyZone',
	Name: '我的地盘',
	Url: '/zhiduoxing/my-zone',
	Type: 2,
	OpenType: 1,
	Icon: 'user',
	IsDefault: false,
	Children: []
}

// 左侧栏条目（个股tab=行情列表项；自选tab=按代码组装）
interface ISideStock {
	Code: string
	Name: string
	Price: number
	ChangeAmount: number
	ChangePercent: number
	// 持仓数量（有持仓时显示“持 N”标记）
	HoldVolume?: number
}

// ---------- 状态 ----------
const currentCode = ref('')
const detail = ref<IZdxStockDetail>()
const pageLoading = ref(false)
const closeDate = ref('')
const activeTab = ref('news')
// 信息Tabs容器（“交易分析”入口滚动定位）
const infoBox = ref<HTMLElement>()

// 左侧栏
const sideTab = ref<'stock' | 'fav'>('stock')
const sideLoading = ref(false)
const marketStocks = ref<IZdxStockQuoteItem[]>([])
const favStocks = ref<ISideStock[]>([])

// 左侧"个股"市场选择（与市场行情页同数据源的4市场Tab；家数服务端实时统计）
const marketTabs = ref<IZdxStockMarketTab[]>([])
const sideMarket = ref('')
const sideListRef = ref<HTMLElement>()

// 左侧栏排序（默认=接口原序（涨幅降序）；涨跌幅/价格升降序）
const SIDE_SORTS = [
	{ value: 'default', label: '默认排序' },
	{ value: 'pctDesc', label: '涨跌幅↓' },
	{ value: 'pctAsc', label: '涨跌幅↑' },
	{ value: 'priceDesc', label: '价格↓' },
	{ value: 'priceAsc', label: '价格↑' }
]
const sideSort = ref('default')

// 头部检索（远程搜索：代码/名称双字段并行查询合并）
const searchCode = ref('')
const searchOptions = ref<IZdxStockQuoteItem[]>([])
const searchLoading = ref(false)
let searchSeq = 0
let searchTimer: ReturnType<typeof setTimeout> | undefined

function searchStocks(keyword: string) {
	if (searchTimer) clearTimeout(searchTimer)
	const kw = (keyword ?? '').trim()
	if (!kw) {
		searchOptions.value = []
		return
	}
	// 输入防抖（300ms）后发起远程查询
	searchTimer = setTimeout(() => doSearchStocks(kw), 300)
}

async function doSearchStocks(kw: string) {
	const seq = ++searchSeq
	searchLoading.value = true
	const empty = { Items: [] as IZdxStockQuoteItem[], Total: 0, PageSize: 0, PageIndex: 1 }
	try {
		const [byCode, byName] = await Promise.all([
			zdxApi.getStocks({ Code: kw }, 1, 20).catch(() => empty),
			zdxApi.getStocks({ Name: kw }, 1, 20).catch(() => empty)
		])
		if (seq !== searchSeq) return
		const map = new Map<string, IZdxStockQuoteItem>()
		for (const item of [...byCode.Items, ...byName.Items]) {
			if (!map.has(item.Code)) map.set(item.Code, item)
		}
		searchOptions.value = [...map.values()].sort((a, b) => b.ChangePercent - a.ChangePercent)
	} finally {
		if (seq === searchSeq) searchLoading.value = false
	}
}

// 选中搜索结果：切换股票并清空检索框
function onSearchSelect(code: string) {
	if (!code) return
	searchCode.value = ''
	searchOptions.value = []
	switchStock(code)
}

// 信息区数据
const news = ref<IZdxStockNews>()
const reports = ref<IZdxStockReports>()
const company = ref<IZdxCompanyInfo>()
const finance = ref<IZdxStockFinance>()
const holders = ref<IZdxShareholderInfo>()

// ---------- 格式化 ----------
function changeClass(percent?: number) {
	if (percent === undefined || percent === null || percent === 0) return ''
	return percent > 0 ? 'up' : 'down'
}
function fmtPrice(value?: number) {
	return typeof value === 'number' ? value.toFixed(2) : '--'
}
function fmtSigned(value?: number, digits = 2) {
	if (typeof value !== 'number') return '--'
	return (value > 0 ? '+' : '') + value.toFixed(digits)
}

// 持仓数量（整数不带小数；与“我的地盘”口径一致）
function fmtVolume(value: number) {
	return Number.isInteger(value) ? value.toString() : value.toFixed(2)
}

// ---------- 头部信息 ----------
const marketLabel = computed(() => MARKETS.find(m => m.Key === detail.value?.Market)?.Label || '--')

// 指标网格（22项；市盈率TTM后端未序列化，暂显示 --）
const metrics = computed(() => {
	const d = detail.value
	const num = (v?: number, digits = 2) => (typeof v === 'number' ? v.toFixed(digits) : '--')
	const unit = (v: number | undefined, u: string) => (typeof v === 'number' ? v + u : '--')
	return [
		{ label: '今开', value: num(d?.Open), cls: d ? (d.Open >= d.PrevClose ? 'up' : 'down') : '' },
		{ label: '昨收', value: num(d?.PrevClose), cls: '' },
		{ label: '最高价', value: num(d?.High), cls: 'up' },
		{ label: '最低价', value: num(d?.Low), cls: 'down' },
		{ label: '涨停价', value: num(d?.LimitUp), cls: '' },
		{ label: '跌停价', value: num(d?.LimitDown), cls: '' },
		{ label: '换手率', value: typeof d?.Turnover === 'number' ? d.Turnover.toFixed(2) + '%' : '--', cls: '' },
		{ label: '量比', value: num(d?.VolumeRatio), cls: '' },
		{ label: '成交量', value: unit(d?.Volume, '万'), cls: '' },
		{ label: '成交额', value: unit(d?.Amount, '亿'), cls: '' },
		{ label: '总市值', value: typeof d?.MarketCap === 'number' ? d.MarketCap.toFixed(0) + '亿' : '--', cls: '' },
		{ label: '市净率', value: num(d?.PB), cls: '' },
		{ label: '总股本', value: unit(d?.TotalShares, '亿'), cls: '' },
		{ label: '均价', value: num(d?.AvgPrice), cls: '' },
		{ label: '流通股本', value: unit(d?.FreeFloat, '亿'), cls: '' },
		{ label: '发行股本', value: unit(d?.IssuedShares, '万'), cls: '' },
		{ label: '市盈率静态', value: num(d?.PE), cls: '' },
		{ label: '市盈率TTM', value: '--', cls: '' },
		{ label: '每股收益', value: num(d?.EPS, 3), cls: '' },
		{ label: '每股净资产', value: num(d?.BPS), cls: '' },
		{ label: '主力流入', value: unit(d?.MainInflow, '亿'), cls: 'up' },
		{ label: '主力流出', value: unit(d?.MainOutflow, '亿'), cls: 'down' }
	]
})

// ---------- 自选（服务端落库，按登录用户隔离；行情快照随列表返回） ----------
const favCodes = ref<string[]>([])
const isFavorite = computed(() => favCodes.value.includes(currentCode.value))

// 加载自选列表（含 localStorage 旧数据一次性迁移：服务端为空且本地有旧自选时同步）
async function loadFavorites() {
	try {
		let list = await zdxApi.getWatchlist()
		const legacy = getFavorites()
		if (!list.length && legacy.length) {
			await zdxApi.migrateWatchlist(legacy)
			saveFavorites([])
			list = await zdxApi.getWatchlist()
		}
		favCodes.value = list.map(w => w.StockCode)
		favStocks.value = list.map(w => ({
			Code: w.StockCode,
			Name: w.StockName,
			Price: w.Price,
			ChangeAmount: w.ChangeAmount,
			ChangePercent: w.ChangePercent
		}))
	} catch {
		// 接口异常时保持既有状态
	}
}

// 切换自选（服务端接口；请求结果提示由 axios 拦截器统一处理）
async function onToggleFav() {
	const code = currentCode.value
	if (!code) return
	try {
		if (isFavorite.value) await zdxApi.delWatchlist(code)
		else await zdxApi.addWatchlist(code)
		await loadFavorites()
	} catch {
		// 请求异常时保持既有状态
	}
}

// 加载自选行情（服务端快照直接使用；sideLoading 包裹加载过程）
async function loadFavStocks() {
	sideLoading.value = true
	try {
		await loadFavorites()
	} finally {
		sideLoading.value = false
	}
}

// ---------- 左侧栏持仓标记（“持 N”；自选/个股两个列表均显示；数据来自“我的地盘”导入） ----------
const holdVolumes = ref<Map<string, number>>(new Map())

async function loadHoldVolumes() {
	try {
		const list = await zdxApi.getMyPositions()
		holdVolumes.value = new Map(list.filter(p => p.Volume > 0).map(p => [p.StockCode, p.Volume]))
	} catch {
		// 接口异常时保持既有状态
	}
}

// ---------- 我的交易（该股持仓+历史交易记录；数据来自"我的地盘"导入） ----------
const myTrade = ref<IZdxStockTradeSummary | null>(null)
const myTradeLoading = ref(false)

async function loadMyTrade(code: string, seq: number) {
	try {
		const data = await zdxApi.getMyTradeByStock(code)
		if (seq === loadSeq) myTrade.value = data
	} catch {
		if (seq === loadSeq) myTrade.value = null
	} finally {
		if (seq === loadSeq) myTradeLoading.value = false
	}
}

// 跳转"我的地盘"（无交易记录时引导导入）
function gotoMyZone() {
	browserStore.navigate(MY_ZONE_MENU, undefined, undefined)
}

// 跳转“交易记录”Tab（报价卡简略条入口；切换后滚动到信息区）
function gotoTradeTab() {
	activeTab.value = 'trade'
	nextTick(() => infoBox.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

// 定位展开轮次（复盘笔记实盘台账行“第 N 轮”徽标→交易分析 Tab 对应轮次卡片）
const focusCycleSeq = ref<number | null>(null)
function onGotoCycle(seq: number) {
	activeTab.value = 'trade'
	// 同一轮次重复点击：先置空再赋值，保证 watch 能再次触发滚动
	focusCycleSeq.value = null
	nextTick(() => {
		focusCycleSeq.value = seq
		infoBox.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	})
}

// ---------- 复盘悬浮球（弹出个股复盘笔记抽屉；最近交易日已复盘显示完成态） ----------
const reviewDone = ref(false)
// 复盘抽屉显隐（悬浮球/双击K线入口）
const reviewVisible = ref(false)
// 复盘目标日期（悬浮球=最近交易日；双击K线=该K线日期）
const reviewDate = ref(dayjs().format('YYYY-MM-DD'))
// 笔记变更刷新键（悬浮球保存/删除后 +1，驱动交易分析与复盘笔记面板刷新）
const reviewRefreshKey = ref(0)
// 走势图组件引用（支撑/压力位保存后重拉画图数据刷新参考线）
const quoteChartRef = ref()
// 今日日期（解析失败时的回退值）
const todayStr = dayjs().format('YYYY-MM-DD')
// 最近已收盘交易日（悬浮球默认复盘日期：今日收盘后=今日；盘中/非交易日=上一交易日；服务端交易日历口径）
const latestTradeDate = ref(todayStr)

// 解析最近已收盘交易日（失败回退今日）
async function resolveLatestTradeDate(seq: number) {
	try {
		const def = await zdxApi.getTradeDayDefault()
		if (seq !== loadSeq) return
		latestTradeDate.value = dayjs(def.TradeDate).format('YYYY-MM-DD')
	} catch {
		if (seq !== loadSeq) return
		latestTradeDate.value = todayStr
	}
}

// 打开复盘笔记抽屉（当前股票；悬浮球入口默认最近交易日）
function openReview() {
	if (!currentCode.value) return
	reviewEventQuote.value = null
	reviewDate.value = latestTradeDate.value
	reviewVisible.value = true
}

// 双击K线：按该根K线对应日期打开复盘抽屉
function onChartDblclick(date: string) {
	if (!currentCode.value) return
	reviewEventQuote.value = null
	reviewDate.value = date
	reviewVisible.value = true
}

// 公告事件回测→K线全景联动：调用走势图 focusEvent 定位事件日（泳道标记高亮+T+0→T+20淡色带）并滚动至图表区
function onFocusEvent(payload: { date: string; direction: number; title: string }) {
	quoteChartRef.value?.focusEvent?.(payload.date, payload.direction)
	nextTick(() => (quoteChartRef.value?.$el as HTMLElement | undefined)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }))
}

// 事件列表→K线泳道：事件回测视图加载完成后传入 QuoteChart（多事件小 grid 泳道，替代单事件 pin）
function onEventsLoaded(list: any[]) {
	quoteChartRef.value?.setEventMarks?.(list)
}

// ---------- 吸顶联动栏（公告 Tab + 事件回测视图 + 已滚过K线区） ----------
const eventsBoard = ref(true)
const pastChart = ref(false)
const showStickyBar = computed(() => activeTab.value === 'notice' && eventsBoard.value && pastChart.value)
function onEventsViewChange(v: 'flow' | 'board') {
	eventsBoard.value = v === 'board'
}

// ---------- 公告提示（近7天公告数 + 回购进行中；tab 徒标与顶栏 chip 共用；seq 防竞态） ----------
const noticeHint = ref<INoticeHint | null>(null)
async function loadNoticeHint(code: string, seq: number) {
	try {
		const h = await zdxApi.getZdxNoticeHint(code)
		if (seq === loadSeq) noticeHint.value = h
	} catch {
		if (seq === loadSeq) noticeHint.value = null
	}
}
// 公告 tab 徒标数字：优先近7天条数；仅回购进行中至少显 1（红点）
const noticeBadgeCount = computed(() => {
	const h = noticeHint.value
	if (!h || !h.Show) return 0
	return h.RecentCount > 0 ? h.RecentCount : (h.BuybackActive ? 1 : 0)
})
// 顶栏 chip 文案（多条合并；近7天 N 条 + 回购进行中）
const noticeChipText = computed(() => {
	const h = noticeHint.value
	if (!h || !h.Show) return ''
	const parts: string[] = []
	if (h.RecentCount > 0) parts.push(`近7天 ${h.RecentCount} 条公告`)
	if (h.BuybackActive) parts.push('回购进行中')
	return parts.join(' · ')
})
function gotoNoticeTab() {
	activeTab.value = 'notice'
	nextTick(() => infoBox.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
// K线卡片底缘滚出视口顶部即激活（吸顶栏出现的“图表区”基准用组件根元素）
function onScrollCheckPastChart() {
	const el = quoteChartRef.value?.$el as HTMLElement | undefined
	if (!el) {
		pastChart.value = false
		return
	}
	pastChart.value = el.getBoundingClientRect().bottom < 8
}
function backToChart() {
	(quoteChartRef.value?.$el as HTMLElement | undefined)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
}
window.addEventListener('scroll', onScrollCheckPastChart, { passive: true })
onBeforeUnmount(() => window.removeEventListener('scroll', onScrollCheckPastChart))

// 公告转复盘笔记：拼事件引用块预填抽屉正文（复盘日期切到公告发布日；2.0 增核心金额行与 T+20 超额）
const reviewEventQuote = ref<string | null>(null)
function onReviewQuote(payload: { title: string; url: string; date: string; trend: string; exc20: string; core: string; linkages: string[] }) {
	const lines: string[] = [`【公告事件】《${payload.title}》（${payload.date}）`]
	if (payload.core) lines.push(payload.core)
	if (payload.trend) lines.push(`历史走势：${payload.trend}`)
	if (payload.exc20) lines.push(payload.exc20)
	payload.linkages.forEach(t => lines.push(`【与你联动】${t}`))
	if (payload.url) lines.push(`原文链接：${payload.url}`)
	reviewEventQuote.value = lines.join('\n')
	reviewDate.value = payload.date
	reviewVisible.value = true
}

// 抽屉保存/删除后：同步悬浮球完成态并通知交易分析/复盘笔记面板刷新笔记列表
function onReviewSaved() {
	loadReviewDone(currentCode.value, loadSeq)
	reviewRefreshKey.value++
}

// 抽屉中支撑/压力位保存后：让走势图重拉画图数据（手动值优先显示 + 刷新参考线）
function onLevelSaved() {
	quoteChartRef.value?.reloadDrawing?.()
}

// 查询最近交易日是否已写该股复盘（先按交易日历解析最近已收盘交易日；与 loadMyTrade 同款 seq 防竞态）
async function loadReviewDone(code: string, seq: number) {
	await resolveLatestTradeDate(seq)
	if (seq !== loadSeq) return
	try {
		const list = await zdxApi.getReviewList({ type: 4, stockCode: code, begin: latestTradeDate.value, end: latestTradeDate.value, max: 1 })
		if (seq === loadSeq) reviewDone.value = list.length > 0
	} catch {
		if (seq === loadSeq) reviewDone.value = false
	}
}

// 盈亏聚合（平均盈利/平均亏损/盈亏比；与交易分析 Tab 同一口径）
const tradeProfitStat = computed(() => calcProfitStat(myTrade.value?.Records ?? []))

// 盈亏比颜色（>1 红 / <1 绿；无亏损笔或等于 1 无色）
const ratioClass = computed(() => {
	const r = tradeProfitStat.value.ratio
	if (r === null || r === 1) return ''
	return r > 1 ? 'up' : 'down'
})

// ---------- 左侧栏 ----------
const sideList = computed<ISideStock[]>(() => {
	const raw: ISideStock[] =
		sideTab.value === 'fav'
			? favStocks.value
			: marketStocks.value.map(s => ({ Code: s.Code, Name: s.Name, Price: s.Price, ChangeAmount: s.ChangeAmount, ChangePercent: s.ChangePercent }))
	// 持仓标记（“持 N”；与“我的地盘”自选列表同款）
	const base: ISideStock[] = raw.map(s => ({ ...s, HoldVolume: holdVolumes.value.get(s.Code) }))
	if (sideSort.value === 'default') return base
	const list = [...base]
	switch (sideSort.value) {
		case 'pctDesc':
			list.sort((a, b) => b.ChangePercent - a.ChangePercent)
			break
		case 'pctAsc':
			list.sort((a, b) => a.ChangePercent - b.ChangePercent)
			break
		case 'priceDesc':
			list.sort((a, b) => b.Price - a.Price)
			break
		case 'priceAsc':
			list.sort((a, b) => a.Price - b.Price)
			break
	}
	return list
})

function switchSideTab(tab: 'stock' | 'fav') {
	if (sideTab.value === tab) return
	sideTab.value = tab
	if (tab === 'fav') loadFavStocks()
}

// 切换股票（同市场下拉/左侧栏；路由驱动重新加载）
function switchStock(code: string) {
	if (!code || code === currentCode.value) return
	router.replace({ query: { ...route.query, code } })
}

// ---------- 数据加载（序号防竞态） ----------
let loadSeq = 0

// 同步浏览器标签的参数（避免切走后再切回时数据回退到旧股票）
function syncBrowserTab(code: string) {
	const tab = browserStore.tabs.find(t => t.Url === '/zhiduoxing/stock-detail')
	if (tab) tab.Query = { ...(tab.Query ?? {}), code }
}

async function loadStock(code: string, allowFallback: boolean) {
	const seq = ++loadSeq
	currentCode.value = code
	pageLoading.value = true
	// 切换股票时清空轮次定位（避免残留上一只股票的展开滚动）
	focusCycleSeq.value = null
	// 重置信息区（避免切换股票时残留上一只股票的数据）
	news.value = undefined
	reports.value = undefined
	company.value = undefined
	finance.value = undefined
	holders.value = undefined
	myTrade.value = null
	myTradeLoading.value = true
	reviewDone.value = false
	noticeHint.value = null
	try {
		const data = await zdxApi.getStockDetail(code)
		if (seq !== loadSeq) return
		detail.value = data
	} catch {
		if (seq !== loadSeq) return
		myTradeLoading.value = false
		if (allowFallback) await fallbackToTopStock(code)
		return
	} finally {
		if (seq === loadSeq) pageLoading.value = false
	}
	// 行情+信息区+我的交易并行加载（个股列表/行业行情由左侧栏与行业面板组件负责）
	loadInfo(code, seq)
	sideMarket.value = detail.value!.Market
	loadMarketStocks(detail.value!.Market, seq)
	loadMyTrade(code, seq)
	loadReviewDone(code, seq)
	loadNoticeHint(code, seq)
}

// 默认股票拉取失败时回退同市场涨幅第一（极端场景；正常路径不会触发）
async function fallbackToTopStock(failedCode: string) {
	try {
		const list = await zdxApi.getStockListByMarket('szMain')
		const target = list.find(s => s.Code !== failedCode)
		if (target) router.replace({ path: '/zhiduoxing/stock-detail', query: { code: target.Code } })
	} catch {
		// 列表也失败时保持空状态
	}
}

// 加载市场Tab（左侧"个股"市场选择数据源；家数服务端实时统计）
async function loadMarketTabs() {
	try {
		marketTabs.value = await zdxApi.getStockMarkets()
	} catch {
		marketTabs.value = []
	}
}

// 加载同市场个股列表（下拉切换 + 左侧"个股"tab；同市场已有数据时跳过重复请求，切换股票不重拉全量）
const marketStocksMarket = ref('')
async function loadMarketStocks(market: string, seq: number) {
	if (marketStocksMarket.value === market && marketStocks.value.length) return
	try {
		const list = await zdxApi.getStockListByMarket(market)
		if (seq !== loadSeq) return
		// 请求期间已切换浏览市场时丢弃过期响应（列表以侧栏选中市场为准）
		if (sideMarket.value && sideMarket.value !== market) return
		marketStocks.value = list
		marketStocksMarket.value = market
	} catch {
		if (seq === loadSeq && sideMarket.value === market) {
			marketStocks.value = []
			marketStocksMarket.value = ''
		}
	}
}

// 切换左侧浏览市场（仅"个股"tab；列表切换为该市场全量并回到顶部）
async function selectSideMarket(market: string) {
	if (sideMarket.value === market) return
	sideMarket.value = market
	sideLoading.value = true
	try {
		await loadMarketStocks(market, loadSeq)
		nextTick(() => sideListRef.value?.scrollTo({ top: 0 }))
	} finally {
		if (sideMarket.value === market) sideLoading.value = false
	}
}

// 加载信息区5类数据（资讯/研报/公司/财务/股东；失败静默由组件展示空态）
async function loadInfo(code: string, seq: number) {
	// 泛型函数声明（避免 .vue 单文件中 <T> 箭头函数与解析器歧义）
	function set<T>(target: { value?: T }, value: T) {
		if (seq === loadSeq) target.value = value
	}
	await Promise.all([
		zdxApi.getStockNews(code).then(d => set(news, d)).catch(() => {}),
		zdxApi.getStockReports(code).then(d => set(reports, d)).catch(() => {}),
		zdxApi.getStockCompany(code).then(d => set(company, d)).catch(() => {}),
		zdxApi.getStockFinance(code).then(d => set(finance, d)).catch(() => {}),
		zdxApi.getStockHolders(code).then(d => set(holders, d)).catch(() => {})
	])
}

// 加载默认展示日期（"已收盘"时间）
async function loadCloseDate() {
	try {
		const def = await zdxApi.getTradeDayDefault()
		closeDate.value = dayjs(def.TradeDate).format('YYYY/MM/DD')
	} catch {
		closeDate.value = dayjs().format('YYYY/MM/DD')
	}
}

// ---------- 联动跳转 ----------
// 跳回所属市场（市场行情列表页对应Tab）
function backToMarket() {
	browserStore.navigate(MARKET_MENU, undefined, { market: detail.value?.Market })
}

// 跳转板块行情页（携带行业名称；打开/复用“板块行情”标签）
function backToSector() {
	if (!detail.value?.Sector) return
	browserStore.navigate(SECTOR_MENU, undefined, { name: detail.value.Sector })
}

// ---------- 路由驱动 ----------
watch(
	() => route.query.code,
	code => {
		const target = (code as string) || DEFAULT_CODE
		if (target === currentCode.value) return
		syncBrowserTab(target)
		loadStock(target, !code)
	},
	{ immediate: true }
)

// 初始挂钩"已收盘"日期（只取一次）
loadCloseDate()

// 初始加载自选（含 localStorage 旧数据迁移）
loadFavorites()

// 初始加载市场Tab（左侧“个股”市场选择）
loadMarketTabs()

// 初始加载持仓标记（左侧“自选/个股”列表“持 N”）
loadHoldVolumes()
</script>

<style lang="scss" scoped>
.stock-detail {
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

	// ---------- 公告事件吸顶联动栏（滚过K线区后固定视口顶部的迷你报价条） ----------
	.sticky-link-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 2000;
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 8px 24px;
		background: rgba(255, 255, 255, 0.97);
		border-bottom: 1px solid #ebeef5;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		font-size: 13px;

		.slb-title {
			font-weight: 600;
			color: #303133;
		}

		.slb-price {
			font-family: 'Roboto Mono', Consolas, 'Courier New', monospace;
			font-weight: 600;
		}

		.slb-pct {
			font-family: 'Roboto Mono', Consolas, 'Courier New', monospace;
		}

		.slb-tip {
			color: #a7abba;
			font-size: 12px;
		}

		.slb-btn {
			margin-left: auto;
			padding: 3px 12px;
			border-radius: 12px;
			font-size: 12px;
			color: #409eff;
			background: rgba(64, 158, 255, 0.1);
			cursor: pointer;
			transition: all 0.2s;

			&:hover {
				background: rgba(64, 158, 255, 0.2);
			}
		}
	}

	// 吸顶栏淡入淡出
	.slb-fade-enter-active,
	.slb-fade-leave-active {
		transition: opacity 0.2s, transform 0.2s;
	}

	.slb-fade-enter-from,
	.slb-fade-leave-to {
		opacity: 0;
		transform: translateY(-8px);
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

		.side-tabs {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 6px 20px;
			padding: 14px 12px 0;
			border-bottom: 1px solid #f5f6fb;

			.sort-select {
				width: 108px;
				margin-left: auto;
				margin-bottom: 8px;

				:deep(.el-select__wrapper) {
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

					&.is-focused,
					&:focus-within {
						background: #fff;
						box-shadow: 0 0 0 1px #409eff inset;
					}
				}

				:deep(.el-select__prefix) {
					margin-right: 4px;

					.sort-prefix {
						font-size: 11px;
						color: #409eff;
					}
				}

				:deep(.el-select__caret) {
					font-size: 12px;
					color: #a7abba;
				}
			}

			> span {
				position: relative;
				padding-bottom: 10px;
				font-size: 15px;
				color: #909399;
				cursor: pointer;
				transition: color 0.2s;

				&:hover {
					color: #409eff;
				}

				&.active {
					color: #303133;
					font-weight: 600;

					&::after {
						content: '';
						position: absolute;
						left: 20%;
						right: 20%;
						bottom: 0;
						height: 2.5px;
						border-radius: 2px;
						background: #409eff;
					}
				}
			}

			.side-markets {
				display: grid;
				flex: 0 0 100%;
				grid-template-columns: repeat(2, 1fr);
				gap: 6px;
				padding: 2px 0 10px;

				.market-chip {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 4px;
					padding: 5px 8px;
					border-radius: 8px;
					background: #f5f6fb;
					font-size: 11px;
					color: #5a6072;
					cursor: pointer;
					transition: background 0.2s, color 0.2s, box-shadow 0.2s;

					.chip-count {
						font-size: 11px;
						color: #a7abba;
						transition: color 0.2s;
					}

					&:hover {
						background: #eef0f7;
						color: #409eff;
					}

					&.active {
						background: #eaf3ff;
						color: #409eff;
						font-weight: 600;
						box-shadow: 0 0 0 1px #b8d8ff inset;

						.chip-count {
							color: #409eff;
						}
					}
				}
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
				padding: 10px 12px;
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

					// 名称行（名称 + 持仓标记）
					.item-name-row {
						display: flex;
						align-items: center;
						gap: 6px;
						min-width: 0;
					}

					.item-name {
						min-width: 0;
						font-size: 14px;
						font-weight: 500;
						color: #2e3543;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
					}

					// 持仓标记（与“我的地盘”自选列表 .w-hold 同款）
					.item-hold {
						flex-shrink: 0;
						font-size: 11px;
						color: #d48806;
						background: rgba(212, 136, 6, 0.1);
						border-radius: 4px;
						padding: 0 4px;
						line-height: 16px;
					}

					.item-code {
						font-size: 12px;
						color: #a7abba;
						margin-top: 2px;
					}
				}

				.item-right {
					text-align: right;
					flex-shrink: 0;

					.item-price {
						font-size: 14px;
						font-weight: 600;
						color: #2e3543;

						&.up {
							color: var(--el-color-danger);
						}

						&.down {
							color: var(--el-color-success);
						}
					}

					.item-change {
						font-size: 12px;
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

	// 个股搜索块
	.search-box {
		display: flex;
		align-items: center;
		background: #fff;
		border-radius: 16px;
		padding: 14px 24px;
		margin-bottom: 20px;

		.stock-search {
			width: 320px;

			.search-icon {
				color: #a7abba;
				font-size: 12px;
			}
		}

		.search-tip {
			margin-left: 12px;
			font-size: 12px;
			color: #a7abba;
		}
	}

	// 报价卡
	.quote-card {
		background: #fff;
		border-radius: 16px;
		padding: 20px 24px;
		margin-bottom: 20px;

		.title-row {
			display: flex;
			align-items: center;
			justify-content: space-between;

			.stock-title {
				display: flex;
				align-items: center;

				.title-text {
					display: flex;
					align-items: center;
					font-size: 1.35rem;
					font-weight: 600;
					color: #303133;
					cursor: pointer;
					margin-right: 14px;
					outline: none;

					.arrow-icon {
						font-size: 0.8rem;
						color: #a7abba;
						margin-left: 6px;
					}
				}

				.tag {
					padding: 4px 12px;
					font-size: 13px;
					color: #606266;
					border-radius: 6px;
					background: #f5f6fb;
					cursor: pointer;
					margin-right: 8px;
					transition: all 0.2s;

					&:hover {
						color: #409eff;
						background: #ecf5ff;
					}
				}

				// 交易状态徽标（停牌/退市；不可点击，仅展示）
				.state-tag {
					padding: 4px 12px;
					font-size: 13px;
					border-radius: 6px;
					margin-right: 8px;

					&.suspended {
						color: #e6a23c;
						background: #fdf6ec;
					}

					&.delisted {
						color: #f56c6c;
						background: #fef0f0;
					}
				}

				.favorite-tag {
					display: flex;
					align-items: center;
					padding: 4px 12px;
					font-size: 13px;
					color: #409eff;
					border-radius: 6px;
					border: 1px solid #409eff;
					cursor: pointer;
					transition: all 0.2s;

					svg {
						width: 12px;
						height: 12px;
						margin-right: 4px;
					}

					&.active {
						color: #fff;
						background: #409eff;
					}
				}

				.notice-tag {
					display: inline-flex;
					align-items: center;
					margin-left: 10px;
					padding: 4px 11px;
					font-size: 12px;
					font-weight: 600;
					color: #fff;
					background: #e6a23c;
					border: 1px solid #e6a23c;
					border-radius: 6px;
					cursor: pointer;
					transition: all 0.2s;
					box-shadow: 0 1px 4px rgba(230, 162, 60, 0.4);

					svg {
						width: 11px;
						height: 11px;
						margin-right: 5px;
					}

					&:hover {
						background: #d18f26;
						border-color: #d18f26;
					}
				}
			}

			.title-right {
				display: flex;
				align-items: center;
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
				width: 180px;
				flex-shrink: 0;
				margin-right: 24px;

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

			.metric-grid {
				flex: 1;
				display: grid;
				grid-template-columns: repeat(6, 1fr);
				gap: 12px 16px;

				.metric-item {
					display: flex;
					align-items: center;
					min-width: 0;
					font-size: 13px;
					white-space: nowrap;

					.label {
						color: #a7abba;
						margin-right: 8px;
						flex-shrink: 0;
					}

					.value {
						font-weight: 500;
						color: #2e3543;
						overflow: hidden;
						text-overflow: ellipsis;
					}
				}
			}
		}
	}

	// 我的交易简略条（个股基础信息内；点击跳转“交易记录”Tab）
	.my-trade-strip {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 18px;
		margin-top: 14px;
		padding: 9px 16px;
		font-size: 13px;
		color: #5c6370;
		background: #f7f8fc;
		border-radius: 10px;
		cursor: pointer;
		transition: background 0.2s;

		&:hover {
			background: #eef0f7;
		}

		.strip-title {
			position: relative;
			padding-left: 9px;
			font-weight: 600;
			color: #2e3543;

			&::before {
				content: '';
				position: absolute;
				left: 0;
				top: 50%;
				transform: translateY(-50%);
				width: 3px;
				height: 12px;
				border-radius: 2px;
				background: #409eff;
			}
		}

		.strip-item b {
			font-weight: 600;
		}

		.strip-link {
			margin-left: auto;
			font-size: 12px;
			color: #409eff;
		}
	}

	// 复盘悬浮球（页面右下角固定；点击跳转独立复盘页；今日已复盘为绿色完成态）
	.review-ball {
		position: fixed;
		right: 26px;
		// 抬高至 64px：避免被底部 Windows 任务栏悬浮遮挡
		bottom: 64px;
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: #409eff;
		color: #fff;
		font-size: 18px;
		cursor: pointer;
		box-shadow: 0 6px 18px rgba(64, 158, 255, 0.4);
		transition: transform 0.2s, box-shadow 0.2s, background 0.2s;

		&:hover {
			transform: scale(1.08);
			box-shadow: 0 8px 22px rgba(64, 158, 255, 0.5);
		}

		&.done {
			background: #67c23a;
			box-shadow: 0 6px 18px rgba(103, 194, 58, 0.4);

			&:hover {
				box-shadow: 0 8px 22px rgba(103, 194, 58, 0.5);
			}
		}

		.ball-check {
			position: absolute;
			top: -2px;
			right: -2px;
			width: 16px;
			height: 16px;
			border-radius: 50%;
			background: #fff;
			color: #67c23a;
			font-size: 11px;
			font-weight: 700;
			line-height: 16px;
			text-align: center;
			box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
		}
	}

	// 信息Tabs
	.info-box {
		background: #fff;
		border-radius: 16px;
		padding: 0 20px 20px;
		margin-bottom: 20px;

		.info-tabs {
			:deep(.el-tabs__header) {
				margin-bottom: 0;
			}

			.notice-tab-label {
				display: inline-flex;
				align-items: center;
			}

			.notice-tab-badge {
				margin-left: 8px;
				margin-right: 2px;

				:deep(.el-badge__content) {
					background: #f56c6c;
					border: none;
					height: 15px;
					line-height: 15px;
					padding: 0 5px;
					font-size: 10px;
				}
			}
		}
	}
}

// 头部下拉：股票代码灰色小字
.dd-code {
	color: #a7abba;
	font-size: 12px;
}

// 头部检索下拉（popper 挂载于 body，需非 scoped 样式）
.stock-search-popper {
	.search-option {
		display: flex;
		align-items: center;
		gap: 10px;

		.opt-name {
			flex: 1;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.opt-code {
			color: #a7abba;
			font-size: 12px;
		}

		.opt-pct {
			width: 68px;
			text-align: right;
		}

		.up {
			color: var(--el-color-danger);
		}

		.down {
			color: var(--el-color-success);
		}
	}
}
</style>
