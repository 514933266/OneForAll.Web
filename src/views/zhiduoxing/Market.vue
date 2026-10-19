<template>
	<div class="market">
		<!-- 日期选择（仅可跳转交易日，默认最近交易日） -->
		<div class="date-box">
			<span class="date-label">行情日期</span>
			<el-button :disabled="tradeDayLoaded && !prevDate" @click="shiftDay(-1)">上一天</el-button>
			<el-date-picker
				v-model="selectedDate"
				type="date"
				value-format="YYYY-MM-DD"
				:clearable="false"
				:disabled-date="disabledPickDate"
				@change="loadOverview"
			></el-date-picker>
			<el-button :disabled="tradeDayLoaded && !nextDate" @click="shiftDay(1)">下一天</el-button>
			<el-button :disabled="isDefaultDate" @click="toDefault">最近交易日</el-button>
		</div>
		<!-- 今日未收盘提示（今日为交易日但未到收盘时间，默认展示最近交易日） -->
		<el-alert v-if="isTodayNotClosed" class="close-alert" type="info" :closable="false" show-icon
			:title="'今日为交易日但尚未收盘，行情数据将在收盘后更新（当前展示 ' + selectedDate + '）'"></el-alert>
		<!-- 统计卡片 -->
		<div class="panle-box">
			<!-- 当日成交额 -->
			<div class="center-item">
				<div class="center-title">
					<span class="ofa-title">当日成交额</span>
					<el-text type="primary"><font-awesome-icon fas icon="chart-line"></font-awesome-icon></el-text>
				</div>
				<div class="center-body">
					<span class="num-text">{{ todayAmount }}</span>
					<span class="num-type">亿</span>
				</div>
				<div class="center-foot">
					<span>较昨日</span>
					<label :class="amountDiffClass">{{ amountDiffText }}</label>
					<label :class="amountDiffClass">{{ amountDiffPercent }}</label>
				</div>
				<!-- 本周趋势：成交量柱 + 成交额折线 -->
				<div ref="amountChart" class="week-chart"></div>
			</div>
			<!-- 上涨 -->
			<div class="center-item">
				<div class="center-title">
					<span class="ofa-title">上涨</span>
					<el-text type="danger"><font-awesome-icon fas icon="arrow-trend-up"></font-awesome-icon></el-text>
				</div>
				<div class="center-body">
					<span class="num-text up">{{ upCount }}</span>
					<span class="num-type">家</span>
				</div>
				<div class="center-foot">
					<span>较昨日</span>
					<label :class="upDiffClass">{{ upDiffText }}</label>
					<span class="foot-split"></span>
					<span>涨停</span>
					<label class="up">{{ limitUpText }}</label>
				</div>
				<!-- 本周趋势：上涨家数 -->
				<div ref="upChart" class="week-chart"></div>
			</div>
			<!-- 下跌 -->
			<div class="center-item">
				<div class="center-title">
					<span class="ofa-title">下跌</span>
					<el-text type="success"><font-awesome-icon fas icon="arrow-trend-down"></font-awesome-icon></el-text>
				</div>
				<div class="center-body">
					<span class="num-text down">{{ downCount }}</span>
					<span class="num-type">家</span>
				</div>
				<div class="center-foot">
					<span>较昨日</span>
					<label :class="downDiffClass">{{ downDiffText }}</label>
					<span class="foot-split"></span>
					<span>跌停</span>
					<label class="down">{{ limitDownText }}</label>
				</div>
				<!-- 本周趋势：下跌家数 -->
				<div ref="downChart" class="week-chart"></div>
			</div>
			<!-- 涨跌分布 -->
			<div class="center-item">
				<div class="center-title">
					<span class="ofa-title">涨跌分布</span>
					<el-text type="info"><font-awesome-icon fas icon="chart-column"></font-awesome-icon></el-text>
				</div>
				<div ref="distributionChart" class="distribution-box"></div>
			</div>
		</div>

		<!-- AI 大盘解读 -->
		<div class="ai-box">
			<div class="ai-header">
				<span class="ai-title">AI 大盘解读</span>
				<span class="ai-desc">{{ selectedDate }}</span>
			</div>
			<p v-if="aiAnalysis" class="ai-content">{{ aiAnalysis }}</p>
			<p v-else class="ai-content empty">暂无 AI 解读（每个交易日收盘后自动生成）</p>
		</div>

		<!-- 大盘走势 -->
		<div class="market-box">
			<div class="market-header">
				<div class="left-header">
					<span class="left-header-title">大盘走势</span>
					<span class="left-header-desc">{{ selectedDate }} 沪深两市</span>
				</div>
				<div class="right-header">
					<div
						v-for="(item, index) in marketList"
						:key="item.Code"
						:class="{ active: marketActive === index }"
						@click="switchMarket(index)"
					>
						{{ item.Name }}
					</div>
				</div>
			</div>
			<div class="market-content">
				<div class="index-list">
					<div
						v-for="(item, index) in marketList"
						:key="item.Code"
						class="index-item"
						:class="{ active: marketActive === index }"
						@click="switchMarket(index)"
					>
						<div class="name">{{ item.Name }}</div>
						<div class="value" :class="item.Percent >= 0 ? 'up' : 'down'">{{ item.Value.toFixed(2) }}</div>
						<div class="percent" :class="item.Percent >= 0 ? 'up' : 'down'">
							{{ formatPercent(item.Percent) }}
						</div>
					</div>
				</div>
				<div v-loading="marketLoading" class="trend-box">
					<div class="trend-info">
						<span class="trend-name">{{ currentMarket?.Name ?? '--' }}</span>
						<span class="trend-value" :class="marketClass">
							{{ currentMarket ? currentMarket.Value.toFixed(2) : '--' }}
						</span>
						<span class="trend-change" :class="marketClass">
							{{ currentMarket ? formatPercent(currentMarket.Percent) : '--' }}
						</span>
						<span v-if="currentMarket" class="trend-amount">成交额 {{ currentMarket.Amount }}亿</span>
						<!-- 走势周期切换：分时/日K/周K/月K（日/周/月K为蜡烛图） -->
						<div class="period-tabs">
							<el-radio-group v-model="trendPeriod" size="small" @change="changeTrendPeriod">
								<el-radio-button v-for="p in TREND_PERIODS" :key="p.value" :value="p.value">{{ p.label }}</el-radio-button>
							</el-radio-group>
						</div>
					</div>
					<div ref="trendChart" class="trend-chart"></div>
				</div>
			</div>
		</div>

		<!-- 市场资讯（24小时滚动）+ 龙虎榜上榜个股（最新同步口径，不随行情日期切换） -->
		<div class="news-box">
			<!-- 24小时滚动 -->
			<div class="news-panel">
				<div class="news-header">
					<div class="news-title">
						<span class="left-header-title">24小时滚动</span>
						<span class="news-desc">全市场最新资讯</span>
					</div>
					<el-button link :loading="newsLoading" @click="loadMarketNews">
						<font-awesome-icon fas icon="refresh"></font-awesome-icon>&nbsp;刷新
					</el-button>
				</div>
				<div v-loading="newsLoading" class="news-list">
					<div
						v-for="(item, index) in flashNews"
						:key="'flash' + index"
						class="flash-item"
						@click="openNewsUrl(item.Url)"
					>
						<span class="flash-time">{{ formatNewsTime(item.PublishTime) }}</span>
						<div class="flash-body">
							<div class="flash-title" :title="item.Title">{{ item.Title }}</div>
							<div class="flash-meta">
								<span v-if="item.StockName" class="flash-stock">{{ item.StockName }}</span>
								<span class="flash-source">{{ item.Source }}</span>
							</div>
						</div>
					</div>
					<el-empty v-if="!newsLoading && !flashNews.length" description="暂无资讯" :image-size="60"></el-empty>
				</div>
			</div>
			<!-- 龙虎榜上榜个股（最新交易日，按净买额降序；点击打开个股详情） -->
			<div class="news-panel">
				<div class="news-header">
					<div class="news-title">
						<span class="left-header-title">龙虎榜</span>
						<span class="news-desc">{{ lhbDateText }} · 按净买额排序</span>
					</div>
					<el-button link :loading="lhbLoading" @click="loadLhb">
						<font-awesome-icon fas icon="refresh"></font-awesome-icon>&nbsp;刷新
					</el-button>
				</div>
				<div v-loading="lhbLoading" class="news-list">
					<div
						v-for="(item, index) in lhbList"
						:key="'lhb' + index"
						class="lhb-item"
						@click="openLhbStock(item)"
					>
						<div class="lhb-head">
							<span class="lhb-name">{{ item.StockName }}</span>
							<span class="lhb-code">{{ item.StockCode }}</span>
							<span class="lhb-pct" :class="upDownClass(item.ChangeRate)">{{ formatPercent(item.ChangeRate) }}</span>
						</div>
						<div class="lhb-meta">
							<span class="lhb-reason" :title="lhbReason(item)">{{ lhbReason(item) }}</span>
							<span class="lhb-net" :class="upDownClass(item.NetAmount)">{{ formatNetAmount(item.NetAmount) }}</span>
						</div>
					</div>
					<el-empty v-if="!lhbLoading && !lhbList.length" description="暂无龙虎榜数据" :image-size="60"></el-empty>
				</div>
			</div>
		</div>

		<!-- 板块涨跌幅矩形树图（本地快照等权聚合；矩形面积随涨跌幅绝对值大小，点击联动行业筛选） -->
		<div class="mosaic-box">
			<div class="mosaic-header">
				<div class="left-header">
					<span class="left-header-title">板块涨跌幅</span>
					<span class="left-header-desc">最新收盘快照 · 共 {{ mosaicList.length }} 个行业板块</span>
				</div>
				<el-button link :disabled="!mosaicList.length" @click="mosaicDialog = true">
					<font-awesome-icon fas icon="table-cells-large"></font-awesome-icon>&nbsp;全景
				</el-button>
			</div>
			<div v-loading="mosaicLoading" ref="mosaicChart" class="mosaic-treemap"></div>
			<!-- 全景弹窗：全部行业板块涨跌幅 -->
			<el-dialog v-model="mosaicDialog" title="全部板块涨跌幅" width="95%" top="4vh" @opened="openMosaicPanorama">
				<div ref="mosaicPanoramaChart" class="mosaic-treemap panorama"></div>
			</el-dialog>
		</div>

		<!-- 个股列表 -->
		<div class="stock-box">
			<div class="stock-tabs">
				<el-tabs v-model="activeMarket" @tab-change="marketChange">
					<el-tab-pane
						v-for="m in markets"
						:key="m.Key"
						:name="m.Key"
						:label="`${m.Label} (${m.Count})`"
					></el-tab-pane>
				</el-tabs>
			</div>
			<div class="filter-bar">
				<div class="filter-conditions">
					<el-input v-model="searchOption.code" placeholder="股票代码" clearable class="w-code"></el-input>
					<el-input v-model="searchOption.name" placeholder="股票名称" clearable class="w-code"></el-input>
					<div class="range-group">
						<el-input v-model="searchOption.percentMin" placeholder="涨跌幅" clearable class="range-input">
							<template #suffix>%</template>
						</el-input>
						<span class="range-separator">-</span>
						<el-input v-model="searchOption.percentMax" placeholder="涨跌幅" clearable class="range-input">
							<template #suffix>%</template>
						</el-input>
					</div>
					<div class="range-group">
						<el-input v-model="searchOption.marketCapMin" placeholder="市值" clearable class="range-input">
							<template #suffix>亿</template>
						</el-input>
						<span class="range-separator">-</span>
						<el-input v-model="searchOption.marketCapMax" placeholder="市值" clearable class="range-input">
							<template #suffix>亿</template>
						</el-input>
					</div>
					<el-select v-model="searchOption.sector" placeholder="行业板块" clearable filterable class="w-sector" @change="search">
						<el-option v-for="s in sectors" :key="s" :label="s" :value="s"></el-option>
					</el-select>
					<div class="check-group">
						<!-- 勾选/取消即时触发查询，不再依赖"查询"按钮 -->
						<el-checkbox v-model="searchOption.limitUp" @change="search">涨停</el-checkbox>
						<el-checkbox v-model="searchOption.limitDown" @change="search">跌停</el-checkbox>
						<el-checkbox v-model="searchOption.leader" @change="search">龙头</el-checkbox>
						<el-checkbox v-model="searchOption.hideST" @change="search">不看ST</el-checkbox>
						<el-checkbox v-model="searchOption.hideSpecialST" @change="search">不看*ST</el-checkbox>
						<!-- 退市股默认隐藏，勾选后纳入列表（带“退市”徽标） -->
						<el-checkbox v-model="searchOption.showDelisted" @change="search">含退市</el-checkbox>
					</div>
				</div>
				<div class="filter-btns">
					<el-button type="primary" @click="search"
						><font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询</el-button
					>
					<el-button @click="reset">
						<font-awesome-icon fas icon="refresh"></font-awesome-icon>&nbsp;重置</el-button
					>
					<el-button @click="openColumnConfig">
						<font-awesome-icon fas icon="table-columns"></font-awesome-icon>&nbsp;表头配置
					</el-button>
				</div>
			</div>
			<div class="table-box">
				<!-- 固定高度 + 内部滚动：一次性加载当前筛选的全量数据，通过滚轮查看 -->
				<el-table v-loading="listLoading" :data="stocks" class="ofa-table" height="600" @row-click="rowClick">
					<el-table-column
						v-for="col in visibleColumns"
						:key="col.key"
						:prop="col.key"
						:label="col.label"
						:width="col.width"
						:sortable="col.sortable"
					>
						<template #default="scope">
							<el-tag
								v-if="col.key === 'Status' && scope.row.TradeStatus > 0"
								size="small"
								effect="plain"
								:type="scope.row.TradeStatus === 2 ? 'danger' : 'warning'"
								>{{ col.text(scope.row) }}</el-tag
							>
							<span v-else :class="col.class ? col.class(scope.row) : ''">{{ col.text(scope.row) }}</span>
						</template>
					</el-table-column>
				</el-table>
			</div>
		</div>

		<!-- 表头配置抽屉 -->
		<el-drawer v-model="columnDrawer" title="表头配置" size="320px" class="ofa-drawer">
			<div class="column-config">
				<div v-for="col in allColumns" :key="col.key" class="column-item">
					<el-checkbox v-model="columnChecked[col.key]">{{ col.label }}</el-checkbox>
				</div>
			</div>
			<div class="footer">
				<el-button @click="restoreColumns">恢复默认</el-button>
				<el-button type="primary" @click="confirmColumns">确定</el-button>
			</div>
		</el-drawer>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { dayjs } from 'element-plus'
import * as echarts from 'echarts'
import { formatPercent } from '@/consts/zhiduoxing-const'
import zdxApi from '@/apis/zdx-api'
import { IZdxMarketOverview } from '@/interfaces/zhiduoxing/IZdxMarketOverview'
import { IZdxMarketDaily } from '@/interfaces/zhiduoxing/IZdxMarketDaily'
import {
	IZdxMarketKlinePoint,
	IZdxMarketQuote,
	IZdxMarketTrend,
	IZdxStockQuoteItem,
	IZdxStockQuoteQuery,
	IZdxStockMarketTab,
	IZdxSectorSummary,
	IZdxMarketNews,
	IZdxMarketLhb
} from '@/interfaces/zhiduoxing/IZdxStockQuote'
import { IPersonalMenuTree } from '@/interfaces/IPersonalMenuTree'
import { useBrowserStore } from '@/stores/browserStore'

const route = useRoute()
const browserStore = useBrowserStore()

// “个股行情”菜单（与 sys_menu 配置一致；点击列表行打开详情标签并携带股票代码）
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

// ---------- 日期选择（仅可跳转交易日，默认最近交易日） ----------
// 当前查看日期（默认最近交易日；切换日期后概览与涨跌分布随之刷新）
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
// 近一年交易日列表（升序 yyyy-MM-dd，仅含交易日；接口失败时降级为仅禁未来）
const tradeDays = ref<string[]>([])
const tradeDayLoaded = ref(false)
// 默认展示日期（后端计算：今日收盘后=今日，否则最近历史交易日）
const defaultTradeDate = ref('')
// 今日为交易日但尚未收盘（顶部提示）
const isTodayNotClosed = ref(false)

// 默认展示日期（交易日接口未就绪时回退今天）
const defaultDate = computed(() => defaultTradeDate.value || dayjs().format('YYYY-MM-DD'))
// 当前是否已展示默认日期
const isDefaultDate = computed(() => selectedDate.value === defaultDate.value)
// 更早/更晚的最近交易日（更晚的不超过今天）
const prevDate = computed(() => findPrevTradeDay(selectedDate.value))
const nextDate = computed(() => findNextTradeDay(selectedDate.value))

// 查找更早的最近交易日（无则 null）
function findPrevTradeDay(date: string): string | null {
	let result: string | null = null
	for (const d of tradeDays.value) {
		if (d < date) result = d
		else break
	}
	return result
}

// 查找更晚的最近交易日（不晚于今天；无则 null）
function findNextTradeDay(date: string): string | null {
	const today = dayjs().format('YYYY-MM-DD')
	for (const d of tradeDays.value) {
		if (d > date) return d <= today ? d : null
	}
	return null
}

// 加载近一年交易日列表与默认展示日期（失败时降级为仅禁未来）
async function loadTradeDays() {
	try {
		const begin = dayjs().subtract(1, 'year').format('YYYY-MM-DD')
		const end = dayjs().format('YYYY-MM-DD')
		const [list, def] = await Promise.all([zdxApi.getTradeDays(begin, end), zdxApi.getTradeDayDefault()])
		tradeDays.value = list.filter(d => d.IsTradeDay).map(d => dayjs(d.TradeDate).format('YYYY-MM-DD'))
		tradeDayLoaded.value = true
		defaultTradeDate.value = dayjs(def.TradeDate).format('YYYY-MM-DD')
		isTodayNotClosed.value = def.IsTodayNotClosed
	} catch {
		// 交易日接口异常时降级：日期选择仅禁未来、切换按自然日（axios 拦截器已统一提示）
		tradeDays.value = []
		tradeDayLoaded.value = false
	}
}

// 上一天/下一天（按交易日跳转；交易日历未加载时降级为自然日）
function shiftDay(offset: number) {
	if (tradeDayLoaded.value) {
		const target = offset < 0 ? prevDate.value : nextDate.value
		if (!target) return
		selectedDate.value = target
	} else {
		if (offset > 0 && selectedDate.value >= dayjs().format('YYYY-MM-DD')) return
		selectedDate.value = dayjs(selectedDate.value).add(offset, 'day').format('YYYY-MM-DD')
	}
	loadOverview()
}

// 回到最近交易日（默认展示日期）
function toDefault() {
	if (isDefaultDate.value) return
	selectedDate.value = defaultDate.value
	loadOverview()
}

// 不能选择未来日期；交易日历加载成功时仅交易日可选
function disabledPickDate(date: Date) {
	if (dayjs(date).isAfter(dayjs(), 'day')) return true
	if (tradeDayLoaded.value) {
		return !tradeDays.value.includes(dayjs(date).format('YYYY-MM-DD'))
	}
	return false
}

// ---------- 大盘概览（东方财富渠道） ----------
const overview = ref<IZdxMarketOverview>()

// 当日沪深两市成交额（亿元）
const todayAmount = computed(() => (overview.value ? Math.round(overview.value.TotalAmount).toString() : '--'))
// 上涨家数
const upCount = computed(() => (overview.value ? overview.value.UpCount.toString() : '--'))
// 下跌家数
const downCount = computed(() => (overview.value ? overview.value.DownCount.toString() : '--'))
// 涨停家数
const limitUpText = computed(() => (overview.value ? overview.value.LimitUpCount.toString() + '家' : '--'))
// 跌停家数
const limitDownText = computed(() => (overview.value ? overview.value.LimitDownCount.toString() + '家' : '--'))
// AI 行情解读（收盘后自动生成；无解读时为空）
const aiAnalysis = computed(() => overview.value?.AiAnalysis ?? '')

// 成交额较昨日（亿元；无昨日记录返回 null）
const amountDiff = computed(() =>
	overview.value && overview.value.YesterdayAmount > 0 ? overview.value.TotalAmount - overview.value.YesterdayAmount : null
)
const amountDiffText = computed(() => {
	const diff = amountDiff.value
	if (diff === null) return '--'
	const value = Math.round(diff)
	return (value > 0 ? '+' : '') + value + '亿'
})
const amountDiffPercent = computed(() => {
	const diff = amountDiff.value
	if (diff === null || !overview.value) return '--'
	const percent = (diff / overview.value.YesterdayAmount) * 100
	return (percent > 0 ? '+' : '') + percent.toFixed(2) + '%'
})
const amountDiffClass = computed(() => {
	const diff = amountDiff.value
	if (diff === null || diff === 0) return ''
	return diff > 0 ? 'up' : 'down'
})

// 家数较昨日差值（↑311家 红 / ↓299家 绿；无昨日记录显示 --）
function countDiffText(current?: number, yesterday?: number): string {
	if (!current || !yesterday) return '--'
	const diff = current - yesterday
	if (diff === 0) return '0家'
	return (diff > 0 ? '↑' : '↓') + Math.abs(diff) + '家'
}
function countDiffClass(current?: number, yesterday?: number): string {
	if (!current || !yesterday) return ''
	const diff = current - yesterday
	if (diff === 0) return ''
	return diff > 0 ? 'up' : 'down'
}
const upDiffText = computed(() => countDiffText(overview.value?.UpCount, overview.value?.YesterdayUpCount))
const upDiffClass = computed(() => countDiffClass(overview.value?.UpCount, overview.value?.YesterdayUpCount))
const downDiffText = computed(() => countDiffText(overview.value?.DownCount, overview.value?.YesterdayDownCount))
const downDiffClass = computed(() => countDiffClass(overview.value?.DownCount, overview.value?.YesterdayDownCount))

// 加载大盘概览（随所选日期刷新；历史日期无记录或请求失败时显示 --）
async function loadOverview() {
	try {
		const res = await zdxApi.getMarketOverview(selectedDate.value)
		overview.value = res.HasData ? res : undefined
	} catch {
		// 请求失败时显示 --（axios 拦截器已统一提示）
		overview.value = undefined
	} finally {
		// 图表随日期刷新（无数据时清空）
		setDistributionOption()
	}
}

// 涨红跌绿
const upColor = '#f56c6c'
const downColor = '#67c23a'
const upClass = (r: IZdxStockQuoteItem) => (r.ChangePercent >= 0 ? 'up' : 'down')

// 交易状态文案（0=正常不展示徽标；1=停牌 2=退市，见表格“状态”列）
function tradeStatusText(status: number): string {
	if (status === 1) return '停牌'
	if (status === 2) return '退市'
	return ''
}

// ---------- 本周趋势（最近5个交易日：成交量柱+成交额线、上涨/下跌家数柱） ----------
const weekData = ref<IZdxMarketDaily[]>([])

// 加载本周趋势数据（最近20天内取最近5个交易日，接口按交易日期倒序返回后转正序）
async function loadWeeklyTrend() {
	try {
		const begin = dayjs().subtract(20, 'day').format('YYYY-MM-DD')
		const end = dayjs().format('YYYY-MM-DD')
		const list = await zdxApi.getMarketDailys(begin, end)
		weekData.value = list.slice(0, 5).reverse()
	} catch {
		// 请求失败时清空趋势图（axios 拦截器已统一提示）
		weekData.value = []
	} finally {
		setWeekCharts()
	}
}

// ---------- 市场板块（腾讯渠道同步落库后读库） ----------
const marketList = ref<IZdxMarketQuote[]>([])
const marketActive = ref(0)
const currentMarket = computed(() => marketList.value[marketActive.value])
const marketTrend = ref<IZdxMarketTrend>()
const marketLoading = ref(false)
// 走势周期（minute=当日分时线；day/week/month=蜡烛图K线）
const trendPeriod = ref('minute')
// 走势周期切换项
const TREND_PERIODS = [
	{ value: 'minute', label: '分时' },
	{ value: 'day', label: '日K' },
	{ value: 'week', label: '周K' },
	{ value: 'month', label: '月K' }
]
// K线数据（日/周/月K，按日期升序）
const marketKlines = ref<IZdxMarketKlinePoint[]>([])
// K线请求条数上限（日K约2.4年，覆盖 MA250 均线窗口；周K近250周、月K近120个月）
const KLINE_COUNT_LIMIT: Record<string, number> = { day: 600, week: 250, month: 120 }
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
// K线均线配置（日K：MA5/MA20/MA120/MA250；周K：MA4/MA12/MA24/MA48；月K：MA3/MA6/MA12；
// 均线值由后端同步/维护任务重算落库，不足周期为空）
const KLINE_MA_LINES: Record<string, { key: 'Ma5' | 'Ma20' | 'Ma120' | 'Ma250' | 'Ma4' | 'Ma3' | 'Ma6' | 'Ma12' | 'Ma24' | 'Ma48'; label: string; color: string }[]> = {
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
// 成交量区量均线配置（按周期：日K 量MA5/量MA20、周K 量MA4/量MA12、月K 量MA3/量MA6；量MA1（当日成交量柱本身）不展示；
// 均线值由后端同步/维护任务重算落库，不足周期为空不绘制；颜色与 tooltip 行保持一致）
const KLINE_VOL_MA_LINES: Record<string, { key: 'VolMa5' | 'VolMa20' | 'VolMa4' | 'VolMa12' | 'VolMa3' | 'VolMa6'; label: string; color: string }[]> = {
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
// 当前板块涨跌样式（涨红跌绿，作用于走势图价格线与头部数值）
const marketClass = computed(() => {
	const idx = currentMarket.value
	return idx ? (idx.Percent >= 0 ? 'up' : 'down') : ''
})

// 加载板块列表（随后加载当前选中板块的分时走势）
async function loadMarketQuotes() {
	try {
		const res = await zdxApi.getMarkets()
		marketList.value = res
		if (marketActive.value >= res.length) marketActive.value = 0
	} catch {
		// 请求失败时显示空状态（axios 拦截器已统一提示）
		marketList.value = []
	}
	await loadMarketTrend()
}

// 加载当前选中板块的走势（分时或日/周/月K；序号防竞态：快速切换板块/周期时丢弃过期响应）
let trendSeq = 0
async function loadMarketTrend() {
	const seq = ++trendSeq
	const idx = currentMarket.value
	marketTrend.value = undefined
	marketKlines.value = []
	if (!idx) {
		setTrendOption()
		return
	}
	marketLoading.value = true
	try {
		if (trendPeriod.value === 'minute') {
			const trend = await zdxApi.getMarketTrend(idx.Code)
			if (seq !== trendSeq) return
			marketTrend.value = trend
		} else {
			const klines = await zdxApi.getMarketKlines(idx.Code, trendPeriod.value, KLINE_COUNT_LIMIT[trendPeriod.value])
			if (seq !== trendSeq) return
			// 日/周/月K全量展示（日K约600根，保证 MA120/MA250 等长周期均线完整呈现）
			marketKlines.value = klines ?? []
		}
	} catch {
		if (seq !== trendSeq) return
		marketTrend.value = undefined
		marketKlines.value = []
	} finally {
		if (seq === trendSeq) {
			marketLoading.value = false
			setTrendOption()
		}
	}
}

// 切换板块
function switchMarket(index: number) {
	if (marketActive.value === index) return
	marketActive.value = index
	loadMarketTrend()
}

// 切换走势周期（分时/日K/周K/月K）
function changeTrendPeriod() {
	loadMarketTrend()
}

// ---------- 图表初始化 ----------
const trendChart = ref(null)
const distributionChart = ref(null)
const amountChart = ref(null)
const upChart = ref(null)
const downChart = ref(null)
const mosaicChart = ref(null)
const mosaicPanoramaChart = ref(null)
let trendEchart: echarts.ECharts | null = null
let distributionEchart: echarts.ECharts | null = null
let amountEchart: echarts.ECharts | null = null
let upEchart: echarts.ECharts | null = null
let downEchart: echarts.ECharts | null = null
let mosaicEchart: echarts.ECharts | null = null
let mosaicPanoramaEchart: echarts.ECharts | null = null

function initCharts() {
	trendEchart = echarts.init(trendChart.value)
	// K线缩放（滚轮/拖动）时按可见根数自适应重算刻度步长
	trendEchart.on('dataZoom', handleKlineZoom)
	setTrendOption()
	distributionEchart = echarts.init(distributionChart.value)
	setDistributionOption()
	amountEchart = echarts.init(amountChart.value)
	upEchart = echarts.init(upChart.value)
	downEchart = echarts.init(downChart.value)
	setWeekCharts()
	// 板块矩形树图（数据到达后由 loadSectorMosaic 填充；点击矩形联动行业筛选）
	mosaicEchart = echarts.init(mosaicChart.value)
	mosaicEchart.on('click', (params: any) => {
		const name = params?.data?.name
		if (name) pickSector(name)
	})
	setMosaicOption(mosaicEchart, [])
}

// 设置涨跌分布图（数据来自概览接口，前4档红色/后4档绿色）
function setDistributionOption() {
	if (!distributionEchart) return
	const items = overview.value?.Distribution ?? []
	distributionEchart.setOption({
		tooltip: {
			trigger: 'item',
			backgroundColor: 'rgba(48, 49, 51, 0.92)',
			borderColor: 'rgba(48, 49, 51, 0.92)',
			textStyle: { color: '#ffffff', fontSize: 12 },
			borderRadius: 8
		},
		grid: {
			left: 50,
			right: 36,
			top: 5,
			bottom: 5
		},
		xAxis: {
			type: 'value',
			show: false
		},
		yAxis: {
			type: 'category',
			data: items.map(d => d.Name),
			axisLine: {
				show: false
			},
			axisTick: {
				show: false
			},
			axisLabel: {
				color: '#909399',
				fontSize: 10
			}
		},
		series: [
			{
				type: 'bar',
				barWidth: 8,
				itemStyle: {
					borderRadius: 3
				},
				label: {
					show: true,
					position: 'right',
					color: '#606266',
					fontSize: 10
				},
				data: items.map((d, i) => {
					return {
						value: d.Value,
						itemStyle: {
							color: i < 4 ? upColor : downColor
						}
					}
				})
			}
		]
	})
}

// 设置本周趋势图（x=最近5个交易日；成交额卡：成交量柱+成交额线双轴；上涨/下跌卡：家数柱）
function setWeekCharts() {
	if (!amountEchart || !upEchart || !downEchart) return
	const data = weekData.value
	// 迷你图轴样式（Y 轴仅保留虚线网格，标签隐藏）
	const xAxis = {
		type: 'category',
		data: data.map(d => dayjs(d.TradeDate).format('MM-DD')),
		axisLine: { show: false },
		axisTick: { show: false },
		axisLabel: { color: '#909399', fontSize: 10 }
	}
	const yAxis = {
		type: 'value',
		axisLine: { show: false },
		axisTick: { show: false },
		axisLabel: { show: false },
		splitLine: { lineStyle: { type: 'dashed' } }
	}
	// 上涨/下跌卡共用 Y 轴最大值（以全市场股票总数为参照，两侧柱高参照一致；
	// 固定 interval 为总数五等分，保证网格线等距且首尾对齐轴顶/零轴，避免顶部出现密集小间隔虚线）
	const marketTotal = Math.max(0, ...data.map(d => d.UpCount + d.DownCount + d.FlatCount))
	const countYAxis = marketTotal > 0
		? { ...yAxis, max: marketTotal, interval: marketTotal / 5 }
		: { ...yAxis }
	const tooltip = {
		trigger: 'axis',
		backgroundColor: 'rgba(48, 49, 51, 0.92)',
		borderColor: 'rgba(48, 49, 51, 0.92)',
		textStyle: { color: '#ffffff', fontSize: 12 },
		borderRadius: 8
	}

	// 成交额卡：柱=成交量（亿手），线=成交额（亿元，右轴）
	amountEchart.setOption(
		{
			tooltip,
			grid: { left: 6, right: 6, top: 10, bottom: 0, containLabel: true },
			xAxis,
			yAxis: [yAxis, { type: 'value', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false } }],
			series: [
				{
					name: '成交量',
					type: 'bar',
					barWidth: 12,
					itemStyle: { color: '#a0cfff', borderRadius: [3, 3, 0, 0] },
					tooltip: { valueFormatter: (value: any) => String(value) + '亿手' },
					data: data.map(d => d.Volume)
				},
				{
					name: '成交额',
					type: 'line',
					yAxisIndex: 1,
					symbolSize: 5,
					lineStyle: { width: 2, color: '#e6a23c' },
					itemStyle: { color: '#e6a23c' },
					tooltip: { valueFormatter: (value: any) => String(value) + '亿' },
					data: data.map(d => d.Amount)
				}
			]
		},
		true
	)

	// 上涨卡：本周上涨家数
	upEchart.setOption(
		{
			tooltip,
			grid: { left: 6, right: 6, top: 10, bottom: 0, containLabel: true },
			xAxis,
			yAxis: countYAxis,
			series: [
				{
					name: '上涨家数',
					type: 'bar',
					barWidth: 12,
					itemStyle: { color: upColor, borderRadius: [3, 3, 0, 0] },
					tooltip: { valueFormatter: (value: any) => String(value) + '家' },
					data: data.map(d => d.UpCount)
				}
			]
		},
		true
	)

	// 下跌卡：本周下跌家数
	downEchart.setOption(
		{
			tooltip,
			grid: { left: 6, right: 6, top: 10, bottom: 0, containLabel: true },
			xAxis,
			yAxis: countYAxis,
			series: [
				{
					name: '下跌家数',
					type: 'bar',
					barWidth: 12,
					itemStyle: { color: downColor, borderRadius: [3, 3, 0, 0] },
					tooltip: { valueFormatter: (value: any) => String(value) + '家' },
					data: data.map(d => d.DownCount)
				}
			]
		},
		true
	)
}

// 设置走势图（分时=价格线+均价虚线、时间轴仅显示 09:30/11:30/15:00 三刻度；日/周/月K=蜡烛图；无数据时清空）
function setTrendOption() {
	if (!trendEchart) return
	const idx = currentMarket.value
	if (!idx) {
		trendEchart.clear()
		return
	}
	// 日/周/月K周期：绘制蜡烛图
	if (trendPeriod.value !== 'minute') {
		setKlineOption()
		return
	}
	const trend = marketTrend.value
	if (!trend || !trend.Times?.length) {
		trendEchart.clear()
		return
	}
	const color = idx.Percent >= 0 ? upColor : downColor
	// 收盘补齐：最后点定格于 14:57（盘后数据未收满 15:00）时补一个 15:00 点（取最后值），修复"截止 14:57"
	const times = [...trend.Times]
	const prices = [...trend.Prices]
	const avg = [...(trend.Avg ?? [])]
	const volumes = [...(trend.Volumes ?? [])]
	const lastTime = times[times.length - 1]
	if (lastTime && lastTime >= '14:57' && lastTime < '15:00') {
		times.push('15:00')
		prices.push(prices[prices.length - 1])
		if (avg.length) avg.push(avg[avg.length - 1])
		if (volumes.length) volumes.push(volumes[volumes.length - 1])
	}
	// 分时量为累计值（手），量柱转区间增量（首点为开盘首段）；无量或长度不齐时不显示量柱
	const hasVol = volumes.length === times.length
	const volDeltas = hasVol ? volumes.map((v, i) => (i === 0 ? v : Math.max(0, +(v - volumes[i - 1]).toFixed(0)))) : []
	const volTop = volDeltas.length ? niceVolTop(Math.max(...volDeltas)) : 0
	// 分时量口语化（手）
	const formatHands = (hands: number) => {
		if (hands >= 1e8) return (hands / 1e8).toFixed(1) + '亿'
		if (hands >= 1e4) return (hands / 1e4).toFixed(1) + '万'
		return String(Math.round(hands))
	}
	// 时间刻度：标签与网格线同频，仅显示 09:30 / 11:30（午休两端合并显示为一个"11:30/13:00"刻度）/ 15:00；
	// 其余刻度通过悬浮提示查看（11:30与13:00在类目轴上直接相邻，午休不占位、数据线自然衔接）
	const keyTick = (_index: number, value: string) => value === '09:30' || value === '11:30' || value === '15:00'
	trendEchart.setOption(
		{
			tooltip: {
				trigger: 'axis',
				axisPointer: {
					type: 'none'
				},
				backgroundColor: 'rgba(48, 49, 51, 0.92)',
				borderColor: 'rgba(48, 49, 51, 0.92)',
				textStyle: { color: '#ffffff', fontSize: 12 },
				borderRadius: 8,
				// 无数据点不显示提示框
				formatter: (params: any) => {
					const list = Array.isArray(params) ? params : [params]
					if (!list.length || !list[0].axisValue) return ''
					const lines = list
						.filter((p: any) => p.value !== null && p.value !== undefined && p.value !== '-')
						.map((p: any) => `${p.marker}${p.seriesName} ${p.seriesName === '成交量' ? formatHands(Number(p.value)) + ' 手' : p.value}`)
					return lines.length ? [list[0].axisValue, ...lines].join('<br/>') : ''
				}
			},
			grid: hasVol
				? [
					{ left: '3%', right: '4%', top: '8%', height: '52%', containLabel: true },
					{ left: '3%', right: '4%', bottom: '4%', height: '16%', containLabel: true }
				]
				: {
					left: '3%',
					right: '4%',
					bottom: '3%',
					top: '10%',
					containLabel: true
				},
			// 价格区时间轴（有量图时时间标签移至量区底部）；网格线仅 09:30/11:30/15:00 三条
			xAxis: hasVol
				? [
					{
						type: 'category',
						boundaryGap: false,
						data: times,
						axisLine: { show: false },
						axisTick: { show: false },
						axisLabel: { show: false },
						splitLine: {
							show: true,
							interval: keyTick,
							lineStyle: { type: 'dashed' }
						}
					},
					{
						type: 'category',
						gridIndex: 1,
						boundaryGap: false,
						data: times,
						axisLine: { show: false },
						axisTick: { show: false },
						axisLabel: {
							interval: keyTick,
							formatter: (value: string) => (value === '11:30' ? '11:30/13:00' : value)
						},
						splitLine: { show: false }
					}
				]
				: {
					type: 'category',
					boundaryGap: false,
					data: times,
					axisLine: {
						show: false
					},
					axisTick: {
						show: false
					},
					axisLabel: {
						// 时间标签仅显示 09:30 / 11:30（午休接缝合并显示为"11:30/13:00"）/ 15:00 三个刻度，其余悬浮查看
						interval: keyTick,
						formatter: (value: string) => (value === '11:30' ? '11:30/13:00' : value)
					},
					splitLine: {
						show: true,
						// 网格线仅 09:30 / 11:30 / 15:00 三条（午休接缝 11:30/13:00 两值相邻，只画一条）
						interval: keyTick,
						lineStyle: {
							type: 'dashed'
						}
					}
				},
			yAxis: hasVol
				? [
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
					{
						type: 'value',
						gridIndex: 1,
						min: 0,
						max: volTop > 0 ? volTop : undefined,
						interval: volTop > 0 ? volTop : undefined,
						axisLine: { show: false },
						axisTick: { show: false },
						axisLabel: { fontSize: 10, formatter: (v: number) => formatHands(v) },
						splitLine: { show: false }
					}
				]
				: {
					type: 'value',
					scale: true,
					axisLine: {
						show: false
					},
					axisTick: {
						show: false
					},
					splitLine: {
						show: true,
						lineStyle: {
							type: 'dashed'
						}
					}
				},
			series: [
				{
					name: idx.Name,
					type: 'line',
					showSymbol: false,
					color: [color],
					lineStyle: {
						width: 2
					},
					areaStyle: {
						color: new echarts.graphic.LinearGradient(
							0,
							0,
							0,
							0.8,
							[
								{ offset: 0, color },
								{ offset: 1, color: color + '00' }
							],
							false
						)
					},
					data: prices
				},
				{
					name: '均价',
					type: 'line',
					showSymbol: false,
					color: ['#e6a23c'],
					lineStyle: {
						width: 1.5,
						type: 'dashed'
					},
					data: avg
				},
				...(hasVol
					? [
						{
							name: '成交量',
							type: 'bar',
							xAxisIndex: 1,
							yAxisIndex: 1,
							barWidth: '60%',
							data: volDeltas.map((v, i) => ({
								value: v,
								itemStyle: { color: i > 0 && prices[i] >= prices[i - 1] ? upColor : downColor }
							}))
						}
					]
					: [])
			]
		},
		true
	)
}

// 当前K线刻度步长（根/格；随 dataZoom 缩放自适应重算）
let klineTickStep = 5
// 量轴当前轴顶（渲染与缩放刷新共用；值未变化时不重复刷新）
let lastVolAxisTop = 0

// 按可见根数选择最贴近"视窗内约10格"的候选步长（平局取大，更贴近目标格数）
function pickTickStep(visible: number) {
	const candidates = KLINE_TICK_CANDIDATES[trendPeriod.value] ?? KLINE_TICK_CANDIDATES.day
	const ideal = Math.max(1, visible) / KLINE_TARGET_TICKS
	let best = candidates[0]
	for (const c of candidates) {
		if (Math.abs(c - ideal) <= Math.abs(best - ideal)) best = c
	}
	return best
}

// 可见区间量系列峰值（成交量柱 + 当前周期各条量均线；均线为滑窗均值，视窗窄于均线周期时可能高于柱峰，一并纳入）
function visibleVolPeak(klines: IZdxMarketKlinePoint[], from: number, to: number): number {
	let peak = 0
	const maKeys = (KLINE_VOL_MA_LINES[trendPeriod.value] ?? []).map(ma => ma.key)
	for (let i = Math.max(0, from); i <= Math.min(klines.length - 1, to); i++) {
		const row = klines[i]
		if (typeof row.Volume === 'number' && row.Volume > peak) peak = row.Volume
		for (const key of maKeys) {
			const v = row[key]
			if (typeof v === 'number' && v > peak) peak = v
		}
	}
	return peak
}

// 量轴轴顶：在可见量峰上留少量余量（约6%）再向上取整到量级步长（如 4.9e6→5.2e6、1.8e7→2e7），
// 使轴顶紧贴可见峰值且为整洁数字（替代全量 1/2/5 大档取整，避免轴顶被远处历史峰值拉高、量柱显矮）
function niceVolTop(v: number) {
	if (!isFinite(v) || v <= 0) return 0
	const step = Math.pow(10, Math.floor(Math.log10(v)) - 1)
	return Number((Math.ceil((v * 1.06) / step) * step).toPrecision(12))
}

// 成交量口语化（K线字段口径为百手：源值×100 换算为手）：按量级自动切换 万亿手/亿手/万手/手；
// 数字自适应裁剪（≥100 整数、≥10 保留1位、其余2位并去尾零），如 4145602.47 → "4.15 亿手"
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
	if (!trendEchart || trendPeriod.value === 'minute' || !marketKlines.value.length) return
	const len = marketKlines.value.length
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
		const dz = (trendEchart.getOption().dataZoom as any[] | undefined)?.[0]
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
	trendEchart.setOption({
		xAxis: [
			{ splitLine: { interval: isTick } },
			{ axisLabel: { interval: isTick }, splitLine: { interval: isTick } }
		]
	})
}

// 量轴轴顶随视窗刷新：按本次可见区间（含量均线）的量峰重算轴顶；值无变化时不重复刷新
function refreshVolAxisMax(startIdx: number, endIdx: number) {
	if (!trendEchart || !marketKlines.value.length) return
	const top = niceVolTop(visibleVolPeak(marketKlines.value, startIdx, endIdx))
	if (!top || top === lastVolAxisTop) return
	lastVolAxisTop = top
	// 仅局部刷新量轴（yAxis 索引1）：max=interval=轴顶值，保持"0 与轴顶"两档刻度
	trendEchart.setOption({ yAxis: [{}, { max: top, interval: top }] })
}

// 最近一个跳空缺口（从最新往前找）：向上缺口=当根最低高于前根最高；向下缺口=当根最高低于前根最低
function findLatestGap(klines: IZdxMarketKlinePoint[]) {
	for (let i = klines.length - 1; i >= 1; i--) {
		const prev = klines[i - 1]
		const cur = klines[i]
		if (cur.Low > prev.High) return { up: true, prevDate: prev.Date, curDate: cur.Date, low: prev.High, high: cur.Low }
		if (cur.High < prev.Low) return { up: false, prevDate: prev.Date, curDate: cur.Date, low: cur.High, high: prev.Low }
	}
	return null
}

// 设置板块K线图（日/周/月蜡烛图：涨红跌绿；x=日期升序；无数据时清空）
function setKlineOption() {
	if (!trendEchart) return
	const klines = marketKlines.value
	if (!klines.length) {
		trendEchart.clear()
		return
	}
	// 默认可视窗口起始索引（日K近60个交易日、周K今年以来的首根、月K近36个月）
	let zoomStart = 0
	if (trendPeriod.value === 'day') {
		zoomStart = Math.max(0, klines.length - KLINE_DEFAULT_DAYS)
	} else if (trendPeriod.value === 'week') {
		const idx = klines.findIndex(k => k.Date >= dayjs().format('YYYY-01-01'))
		zoomStart = idx <= 0 ? 0 : idx
	} else {
		zoomStart = Math.max(0, klines.length - KLINE_DEFAULT_MONTHS)
	}
	// x轴刻度：按当前视窗可见根数自适应选择步长（缩放时由 handleKlineZoom 重算），
	// 刻度从最新一根（最后一点）倒推，最后一点必然显示最新日期
	klineTickStep = pickTickStep(klines.length - zoomStart)
	const lastIndex = klines.length - 1
	const isTick = (index: number) => (lastIndex - index) % klineTickStep === 0
	// 最近一个跳空缺口（默认高亮标注在图上）
	const gap = findLatestGap(klines)
	// 量轴轴顶：按默认视窗内的量系列峰值（柱+量均线）取整（留少量余量），保持只显示 0 与轴顶两档数值；
	// 不用全量历史峰值，避免轴顶被远处行情拉高、当前视窗的量柱显矮
	const volAxisMax = niceVolTop(visibleVolPeak(klines, zoomStart, lastIndex))
	lastVolAxisTop = volAxisMax
	// 当前周期均线配置与最新行（图例数值显示用）
	const maList = KLINE_MA_LINES[trendPeriod.value] ?? []
	const volMaList = KLINE_VOL_MA_LINES[trendPeriod.value] ?? []
	const last = klines[klines.length - 1]
	// 均线线（按当前周期配置；不足周期的行值为空不绘制，线从首个有值点开始）
	const maSeries: any[] = maList.map(ma => ({
		name: ma.label,
		type: 'line',
		showSymbol: false,
		data: klines.map(k => {
			const v = k[ma.key]
			return typeof v === 'number' ? v : null
		}),
		lineStyle: { width: 1, color: ma.color },
		itemStyle: { color: ma.color }
	}))
	trendEchart.setOption(
		{
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
				// 蜡烛图提示用中文（默认 open/close/lowest/highest 为英文）；
				// 注意：类目轴下 ECharts 会给 candlestick 数据项前置类目索引（value=[索引,开盘,收盘,最低,最高]），
				// 因此直接按 dataIndex（原始全量索引）取源数据，避免解构错位；
				// 版式统一：同一字号/行高、数值固定两位小数，标签左、数值右两列布局，避免行间观感参差
				formatter: (params: any) => {
					const p = Array.isArray(params) ? params[0] : params
					if (!p) return ''
					const k = marketKlines.value[p.dataIndex]
					if (!k) return ''
					// 两列行（标签左、数值右；数值按需着色）
					const row = (label: string, value: string, color = '#ffffff') =>
						`<div style="display:flex;justify-content:space-between;gap:18px"><span>${label}</span><span style="color:${color}">${value}</span></div>`
					const num = (v: number | null | undefined) => (typeof v === 'number' ? v.toFixed(2) : '--')
					const lines = [`<div style="font-weight:600;margin-bottom:3px">${k.Date}</div>`]
					lines.push(row('开盘', num(k.Open)))
					lines.push(row('最高', num(k.High)))
					lines.push(row('最低', num(k.Low)))
					lines.push(row('收盘', num(k.Close)))
					// 涨跌幅/振幅均为后端落库字段（全序列重算；首根无前收盘：涨跌幅为0、振幅为空显示 --；涨红跌绿）
					const pct = k.ChangePercent
					const pctText = pct === null || pct === undefined ? '--' : `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`
					const pctColor = pct === null || pct === undefined || pct === 0 ? '#ffffff' : pct > 0 ? upColor : downColor
					lines.push(row('涨跌幅', pctText, pctColor))
					// 振幅（（最高-最低）/前收盘，后端落库字段；首根显示 --）
					const amp = k.Amplitude
					lines.push(row('振幅', amp === null || amp === undefined ? '--' : `${amp.toFixed(2)}%`))
					// 均线值（按当前周期配置；不足周期的行显示 --）
					for (const ma of KLINE_MA_LINES[trendPeriod.value] ?? []) {
						lines.push(row(ma.label, num(k[ma.key]), ma.color))
					}
					// 成交量与量均线（口语化量词自动切换 亿手/万手；量均线按周期展示：日 量MA5/量MA20、
					// 周 量MA4/量MA12、月 量MA3/量MA6，为后端落库字段，不足周期的量均线显示 --）；分隔线与上方 K 线数据块区分
					lines.push('<div style="border-top:1px solid rgba(255,255,255,0.16);margin:5px 0 3px"></div>')
					lines.push(row('成交量', formatVolume(k.Volume)))
					for (const ma of KLINE_VOL_MA_LINES[trendPeriod.value] ?? []) {
						lines.push(row(ma.label, formatVolume(k[ma.key]), ma.color))
					}
					// 悬浮缺口前后两根K线时，提示缺口方向（向上红、向下绿）
					if (gap && (k.Date === gap.prevDate || k.Date === gap.curDate)) {
						lines.push(gap.up ? '<div style="color:#f56c6c">↑ 向上缺口</div>' : '<div style="color:#67c23a">↓ 向下缺口</div>')
					}
					return `<div style="font-size:12px;line-height:1.7;min-width:170px">${lines.join('')}</div>`
				}
			},
			// 均线说明图例：上=价格均线（图表上方，显示最新一根均线值；点击切换对应均线显示/隐藏）；
			// 下=量均线（量区小标题右侧，显示最新量均线值，同样可点击切换；图标颜色与图中线色一致）
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
					data: maList.map(ma => ma.label),
					formatter: (name: string) => {
						const ma = maList.find(m => m.label === name)
						const v = ma ? last[ma.key] : null
						return `${name} ${typeof v === 'number' ? v.toFixed(2) : '--'}`
					}
				},
				{
					top: 285,
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
			// 两图采用相同的左右固定边距，保证纵向网格线与蜡烛/柱列严格对齐，两区之间留出间距形成清晰分区
			grid: [
				{
					left: 70,
					right: 20,
					top: 32,
					height: 250
				},
				{
					left: 70,
					right: 20,
					top: 310,
					bottom: 32
				}
			],
			// 成交量区小标题（置于K线区与成交量区的间隙带左缘，标记下方柱状图为成交量；量均线数值见右侧图例）
			graphic: [
				{
					type: 'text',
					left: 74,
					top: 290,
					style: {
						text: '成交量',
						fontSize: 12,
						fill: '#a7abba'
					}
				}
			],
			// 滚轮缩放、拖动平移（默认视窗：日K近60个交易日、周K今年、月K近3年）；x轴联动双图
			dataZoom: [
				{
					type: 'inside',
					xAxisIndex: [0, 1],
					startValue: zoomStart,
					endValue: klines.length - 1
				}
			],
			// 主图x轴（纵向网格线与副图对齐；日期标签统一在成交量图底部显示）
			xAxis: [
				{
					type: 'category',
					gridIndex: 0,
					data: klines.map(k => k.Date),
					axisLine: {
						show: false
					},
					axisTick: {
						show: false
					},
					axisLabel: {
						show: false
					},
					splitLine: {
						show: true,
						interval: (index: number) => isTick(index),
						lineStyle: {
							type: 'dashed'
						}
					}
				},
				// 成交量图x轴（标签与网格线同频：从最新点倒推每N根一格、N随缩放自适应），最右侧刻度即最新日期；
				// 日/周K显示完整日期（如 2026-09-30）；月K显示到月份（如 2026-09）
				{
					type: 'category',
					gridIndex: 1,
					data: klines.map(k => k.Date),
					axisLine: {
						show: false
					},
					axisTick: {
						show: false
					},
					axisLabel: {
						interval: (index: number) => isTick(index),
						// 极端场景（读数异常导致步长过小）自动隐藏重叠日期，避免标签糊成一片
						hideOverlap: true,
						formatter: (value: string) => (trendPeriod.value === 'month' ? value.slice(0, 7) : value)
					},
					splitLine: {
						show: true,
						interval: (index: number) => isTick(index),
						lineStyle: {
							type: 'dashed'
						}
					}
				}
			],
			// 主图价格轴 + 成交量图独立轴（成交量单位：万手，柱状图从0起画）
			yAxis: [
				{
					type: 'value',
					scale: true,
					axisLine: {
						show: false
					},
					axisTick: {
						show: false
					},
					splitLine: {
						show: true,
						lineStyle: {
							type: 'dashed'
						}
					}
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
					axisLine: {
						show: false
					},
					axisTick: {
						show: false
					},
					axisLabel: {
						show: true,
						fontSize: 10,
						// 两档刻度值口语化（0 与轴顶，如 "0"/"5.9亿"；值口径同成交量：×100 为手）
						formatter: (value: number) => formatVolume(value, false)
					},
					splitLine: {
						show: false
					}
				}
			],
			series: [
				{
					name: 'K线',
					type: 'candlestick',
					// ECharts 蜡烛图数据顺序：[开盘, 收盘, 最低, 最高]
					data: klines.map(k => [k.Open, k.Close, k.Low, k.High]),
					itemStyle: {
						// 涨红跌绿（阳线红、阴线绿）
						color: upColor,
						color0: downColor,
						borderColor: upColor,
						borderColor0: downColor
					},
					// 最近跳空缺口高亮标注（x覆盖缺口前后两根、y覆盖缺口区间；向上缺口红、向下缺口绿；
					// 缺口方向在鼠标悬浮缺口前后两根K线时由 tooltip 提示）
					markArea: {
						silent: true,
						itemStyle: {
							color: gap ? (gap.up ? 'rgba(245, 108, 108, 0.4)' : 'rgba(103, 194, 58, 0.4)') : 'transparent'
						},
						data: gap
							? [
								[
									{ xAxis: gap.prevDate, yAxis: gap.low },
									{ xAxis: gap.curDate, yAxis: gap.high }
								]
							]
							: []
					}
				},
				...maSeries,
				// 成交量柱状图（涨红跌绿：收盘不低于开盘为红；柱高=成交量万手）
				{
					name: '成交量',
					type: 'bar',
					xAxisIndex: 1,
					yAxisIndex: 1,
					barWidth: '60%',
					data: klines.map(k => ({
						value: k.Volume,
						itemStyle: { color: k.Close >= k.Open ? upColor : downColor }
					}))
				},
				// 成交量均线（按周期：日K 量MA5/量MA20、周K 量MA4/量MA12、月K 量MA3/量MA6，后端落库字段；
				// 不足周期为空不绘制，线从首个有值点开始）
				...(KLINE_VOL_MA_LINES[trendPeriod.value] ?? []).map(ma => ({
					name: ma.label,
					type: 'line',
					xAxisIndex: 1,
					yAxisIndex: 1,
					showSymbol: false,
					data: klines.map(k => {
						const v = k[ma.key]
						return typeof v === 'number' ? v : null
					}),
					lineStyle: { width: 1, color: ma.color },
					itemStyle: { color: ma.color }
				}))
			]
		},
		true
	)
}

function handleResize() {
	trendEchart?.resize()
	distributionEchart?.resize()
	amountEchart?.resize()
	upEchart?.resize()
	downEchart?.resize()
	mosaicEchart?.resize()
	mosaicPanoramaEchart?.resize()
}

// ---------- 市场资讯、龙虎榜与板块树图（最新快照/资讯流口径，不随行情日期切换） ----------
// 24小时滚动（全市场最新资讯，含关联股票）
const flashNews = ref<IZdxMarketNews[]>([])
const newsLoading = ref(false)
// 龙虎榜上榜个股（最新交易日，按净买额降序；同一股票可因多个上榜原因出现多条）
const lhbList = ref<IZdxMarketLhb[]>([])
const lhbLoading = ref(false)
// 龙虎榜标注日期（MM-DD，取自数据首条的最新交易日）
const lhbDateText = computed(() =>
	lhbList.value.length ? `${dayjs(lhbList.value[0].TradeDate).format('MM-DD')} 上榜` : '最新交易日'
)
// 行业板块摘要（等权聚合，按涨跌幅降序；树图数据源）
const mosaicList = ref<IZdxSectorSummary[]>([])
const mosaicLoading = ref(false)
const mosaicDialog = ref(false)

// 加载市场资讯（24小时滚动；区头刷新按钮复用）
async function loadMarketNews() {
	newsLoading.value = true
	try {
		flashNews.value = (await zdxApi.getMarketNewsFlash(50)) ?? []
	} catch {
		flashNews.value = []
	} finally {
		newsLoading.value = false
	}
}

// 加载龙虎榜上榜个股（最新交易日，按净买额降序）
async function loadLhb() {
	lhbLoading.value = true
	try {
		lhbList.value = (await zdxApi.getMarketLhb(50)) ?? []
	} catch {
		lhbList.value = []
	} finally {
		lhbLoading.value = false
	}
}

// 加载行业板块摘要（树图数据源；完成后刷新首页树图）
async function loadSectorMosaic() {
	mosaicLoading.value = true
	try {
		mosaicList.value = (await zdxApi.getMarketSectors()) ?? []
	} catch {
		mosaicList.value = []
	} finally {
		mosaicLoading.value = false
	}
	setMosaicOption(mosaicEchart, mosaicList.value)
}

// 资讯时间显示（当日=HH:mm，非当日=MM-DD HH:mm）
function formatNewsTime(time: string) {
	const t = dayjs(time)
	return t.isSame(dayjs(), 'day') ? t.format('HH:mm') : t.format('MM-DD HH:mm')
}

// 打开资讯原文（新窗口）
function openNewsUrl(url?: string | null) {
	if (url) window.open(url, '_blank')
}

// 龙虎榜上榜原因（上榜原因优先，其次补充说明）
function lhbReason(item: IZdxMarketLhb) {
	return item.Explanation || item.Remark || '-'
}

// 龙虎榜净买额格式化（亿/万，保留正负号）
function formatNetAmount(value: number) {
	const abs = Math.abs(value)
	const sign = value > 0 ? '+' : value < 0 ? '-' : ''
	if (abs >= 1e8) return `${sign}${(abs / 1e8).toFixed(2)}亿`
	if (abs >= 1e4) return `${sign}${(abs / 1e4).toFixed(1)}万`
	return `${sign}${abs.toFixed(0)}`
}

// 涨红跌绿样式（龙虎榜涨跌幅/净买额；平盘无色）
function upDownClass(value: number) {
	return value > 0 ? 'up' : value < 0 ? 'down' : ''
}

// 打开龙虎榜个股详情（个股行情标签，携带股票代码）
function openLhbStock(item: IZdxMarketLhb) {
	if (!item.StockCode) return
	browserStore.navigate(STOCK_MENU, undefined, { code: item.StockCode })
}

// 树图色阶（红涨绿跌：|涨跌幅|映射透明度，0%→浅、5%及以上→深；平盘灰；白字需足够底色深度）
function sectorBlockColor(change: number) {
	if (change > 0) return `rgba(207, 19, 34, ${(0.35 + (Math.min(change, 5) / 5) * 0.5).toFixed(2)})`
	if (change < 0) return `rgba(0, 168, 84, ${(0.35 + (Math.min(-change, 5) / 5) * 0.5).toFixed(2)})`
	return 'rgba(144, 147, 153, 0.6)'
}

// 构建树图数据（矩形面积随 |涨跌幅| 变化，最小 0.5 保证 0% 板块可见；附原始字段供悬浮展示）
function buildTreemapData(list: IZdxSectorSummary[]) {
	return list.map(e => ({
		name: e.Name,
		value: Math.max(Math.abs(e.Change), 0.5),
		change: e.Change,
		up: e.Up,
		flat: e.Flat,
		down: e.Down,
		itemStyle: { color: sectorBlockColor(e.Change) }
	}))
}

// 设置板块矩形树图（首页与全景弹窗共用；tooltip 展示名称/涨跌幅/涨跌家数）
function setMosaicOption(chart: echarts.ECharts | null, list: IZdxSectorSummary[]) {
	if (!chart) return
	chart.setOption(
		{
			tooltip: {
				backgroundColor: 'rgba(48, 49, 51, 0.92)',
				borderColor: 'rgba(48, 49, 51, 0.92)',
				textStyle: { color: '#ffffff', fontSize: 12 },
				borderRadius: 8,
				formatter: (p: any) => {
					const d = p.data ?? {}
					return `${d.name} ${formatPercent(d.change ?? 0)}<br/>涨 ${d.up ?? 0} 家 / 平 ${d.flat ?? 0} 家 / 跌 ${d.down ?? 0} 家`
				}
			},
			series: [
				{
					type: 'treemap',
					roam: false,
					nodeClick: false,
					breadcrumb: { show: false },
					left: 0,
					right: 0,
					top: 0,
					bottom: 0,
					gapWidth: 1,
					borderWidth: 1,
					borderColor: '#fff',
					label: {
						show: true,
						formatter: (p: any) => {
							const d = p.data ?? {}
							return `{n|${d.name}}\n{v|${formatPercent(d.change ?? 0)}}`
						},
						rich: {
							n: { color: '#fff', fontSize: 12, lineHeight: 16 },
							v: { color: '#fff', fontSize: 12, fontWeight: 'bold', lineHeight: 16 }
						}
					},
					upperLabel: { show: false },
					data: buildTreemapData(list)
				}
			]
		},
		true
	)
}

// 全景弹窗打开后初始化/刷新树图（首次惰性 init，避免隐藏容器尺寸为 0）
function openMosaicPanorama() {
	if (!mosaicPanoramaEchart) {
		mosaicPanoramaEchart = echarts.init(mosaicPanoramaChart.value)
		mosaicPanoramaEchart.on('click', (params: any) => {
			const name = params?.data?.name
			if (name) pickSector(name)
		})
	}
	setMosaicOption(mosaicPanoramaEchart, mosaicList.value)
	mosaicPanoramaEchart.resize()
}

// 点击矩形：回填行业筛选并查询个股列表（自动滚动到个股列表）
function pickSector(name: string) {
	mosaicDialog.value = false
	searchOption.sector = name
	loadStocks()
	document.querySelector('.stock-box')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ---------- 个股列表（服务端筛选 + 一次性加载全量） ----------
// 市场Tab（服务端实时统计家数，key 与后端市场标识一致）
const markets = ref<IZdxStockMarketTab[]>([])
const activeMarket = ref('shMain')
// 行业下拉（服务端去重数据，与库内东财口径行业一致）
const sectors = ref<string[]>([])
// 列表数据（表格固定高度 + 内部滚动查看）
const stocks = ref<IZdxStockQuoteItem[]>([])
// 初始为加载态：个股列表延迟到首屏其他接口完成后才请求（见 onMounted）
const listLoading = ref(true)
// 一次请求条数（覆盖单市场全量约1700条，后端上限10000）
const FULL_PAGE_SIZE = 10000

// 搜索条件（输入框数值保持字符串，下发时转为数字）
const searchOption = reactive({
	code: '',
	name: '',
	sector: '',
	percentMin: '',
	percentMax: '',
	marketCapMin: '',
	marketCapMax: '',
	limitUp: false,
	limitDown: false,
	leader: false,
	hideST: false,
	hideSpecialST: false,
	showDelisted: false
})

// 加载市场Tab统计（首次进入后校正当前选中市场）
async function loadMarkets() {
	try {
		const res = await zdxApi.getStockMarkets()
		markets.value = res
		if (res.length && !res.some(m => m.Key === activeMarket.value)) {
			activeMarket.value = res[0].Key
		}
	} catch {
		markets.value = []
	}
}

// 加载行业列表
async function loadSectors() {
	try {
		sectors.value = await zdxApi.getStockSectors()
	} catch {
		sectors.value = []
	}
}

// 字符串转数字（空值/非数字返回 undefined，不下发该筛选条件）
function toNumber(value: string): number | undefined {
	if (value === '') return undefined
	const num = Number(value)
	return isNaN(num) ? undefined : num
}

// 加载个股列表（服务端筛选 + 一次性加载全量，默认按涨跌幅降序；序号防竞态：快速查询时丢弃过期响应）
let stocksSeq = 0
async function loadStocks() {
	const seq = ++stocksSeq
	const form: IZdxStockQuoteQuery = {
		Code: searchOption.code.trim() || undefined,
		Name: searchOption.name.trim() || undefined,
		Market: activeMarket.value || undefined,
		Sector: searchOption.sector || undefined,
		PercentMin: toNumber(searchOption.percentMin),
		PercentMax: toNumber(searchOption.percentMax),
		MarketCapMin: toNumber(searchOption.marketCapMin),
		MarketCapMax: toNumber(searchOption.marketCapMax),
		LimitUp: searchOption.limitUp || undefined,
		LimitDown: searchOption.limitDown || undefined,
		Leader: searchOption.leader || undefined,
		HideST: searchOption.hideST || undefined,
		HideSpecialST: searchOption.hideSpecialST || undefined,
		ShowDelisted: searchOption.showDelisted || undefined
	}
	listLoading.value = true
	try {
		const res = await zdxApi.getStocks(form, 1, FULL_PAGE_SIZE)
		if (seq !== stocksSeq) return
		stocks.value = res.Items
	} catch {
		if (seq !== stocksSeq) return
		stocks.value = []
	} finally {
		if (seq === stocksSeq) listLoading.value = false
	}
}

// ---------- 表格列配置 ----------
interface IColumnConfig {
	key: string
	label: string
	width: number
	sortable?: boolean
	text: (row: IZdxStockQuoteItem) => string
	class?: (row: IZdxStockQuoteItem) => string
}
const allColumns: IColumnConfig[] = [
	{ key: 'Code', label: '股票代码', width: 110, text: r => r.Code },
	{ key: 'Name', label: '股票名称', width: 130, text: r => r.Name, class: upClass },
	{ key: 'Status', label: '状态', width: 80, text: r => tradeStatusText(r.TradeStatus) },
	{ key: 'Sector', label: '所属板块', width: 120, text: r => r.Sector },
	{ key: 'Price', label: '最新价', width: 100, sortable: true, text: r => r.Price.toFixed(2), class: upClass },
	{ key: 'ChangePercent', label: '涨跌幅', width: 100, sortable: true, text: r => formatPercent(r.ChangePercent), class: upClass },
	{ key: 'ChangeAmount', label: '涨跌额', width: 100, sortable: true, text: r => (r.ChangeAmount > 0 ? '+' : '') + r.ChangeAmount.toFixed(2), class: upClass },
	{ key: 'Volume', label: '成交量', width: 100, sortable: true, text: r => r.Volume.toFixed(2) + '万' },
	{ key: 'Amount', label: '成交额', width: 100, sortable: true, text: r => r.Amount.toFixed(2) + '亿' },
	{ key: 'Amplitude', label: '振幅', width: 90, sortable: true, text: r => r.Amplitude.toFixed(2) + '%' },
	{ key: 'High', label: '最高', width: 100, sortable: true, text: r => r.High.toFixed(2), class: () => 'up' },
	{ key: 'Low', label: '最低', width: 100, sortable: true, text: r => r.Low.toFixed(2), class: () => 'down' },
	{ key: 'Open', label: '今开', width: 100, sortable: true, text: r => r.Open.toFixed(2), class: upClass },
	{ key: 'PrevClose', label: '昨收', width: 100, text: r => r.PrevClose.toFixed(2) },
	{ key: 'VolumeRatio', label: '量比', width: 90, sortable: true, text: r => r.VolumeRatio.toFixed(2) },
	{ key: 'Turnover', label: '换手率', width: 100, sortable: true, text: r => r.Turnover.toFixed(2) + '%' },
	{ key: 'PE', label: '市盈率', width: 100, sortable: true, text: r => r.PE.toFixed(2) },
	{ key: 'PB', label: '市净率', width: 100, sortable: true, text: r => r.PB.toFixed(2) },
	{ key: 'MarketCap', label: '市值', width: 110, sortable: true, text: r => r.MarketCap.toFixed(1) + '亿' }
]

// 默认显示的列（前15个，与设计图默认勾选一致）
const DEFAULT_COLUMN_KEYS = allColumns.slice(0, 15).map(c => c.key)

// 抽屉
const columnDrawer = ref(false)
const columnChecked = reactive<Record<string, boolean>>({})
allColumns.forEach(c => {
	columnChecked[c.key] = DEFAULT_COLUMN_KEYS.includes(c.key)
})

const visibleColumns = computed(() => allColumns.filter(c => columnChecked[c.key]))

function openColumnConfig() {
	columnDrawer.value = true
}
function restoreColumns() {
	allColumns.forEach(c => {
		columnChecked[c.key] = DEFAULT_COLUMN_KEYS.includes(c.key)
	})
}
function confirmColumns() {
	columnDrawer.value = false
}

// ---------- 交互 ----------
// 切换市场
function marketChange() {
	loadStocks()
}

// 查询
function search() {
	loadStocks()
}

// 重置
function reset() {
	Object.assign(searchOption, {
		code: '',
		name: '',
		sector: '',
		percentMin: '',
		percentMax: '',
		marketCapMin: '',
		marketCapMax: '',
		limitUp: false,
		limitDown: false,
		leader: false,
		hideST: false,
		hideSpecialST: false,
		showDelisted: false
	})
	loadStocks()
}

// 点击行跳转详情
function rowClick(row: IZdxStockQuoteItem) {
	browserStore.navigate(STOCK_MENU, undefined, { code: row.Code })
}

// 接收详情页跳回参数（market/sector）
function applyRouteQuery() {
	const q = route.query
	if (q.market) activeMarket.value = q.market as string
	if (q.sector) searchOption.sector = q.sector as string
}

// 组件保留时路由参数变化（详情页跳回）重新加载列表
watch(
	() => route.query,
	() => {
		applyRouteQuery()
		loadStocks()
	}
)

onMounted(async () => {
	initCharts()
	// 先加载交易日历并校正默认展示日期（最近交易日），再加载概览
	await loadTradeDays()
	const target = defaultDate.value
	if (target !== selectedDate.value) selectedDate.value = target
	applyRouteQuery()
	window.addEventListener('resize', handleResize)
	// 首屏各区域接口并行加载并等待全部完成（概览/周趋势/市场Tab/行业下拉/板块树图/市场资讯/龙虎榜）
	await Promise.all([loadOverview(), loadWeeklyTrend(), loadMarkets(), loadSectors(), loadSectorMosaic(), loadMarketNews(), loadLhb()])
	// 板块行情与走势完成后（市场Tab/行业已就绪，校正选中市场有效性）
	await loadMarketQuotes()
	// 延迟加载：等其他接口全部完成后，最后再加载底部个股列表（数据量大，避免与首屏接口竞争资源）
	loadStocks()
})

onUnmounted(() => {
	window.removeEventListener('resize', handleResize)
	trendEchart?.dispose()
	distributionEchart?.dispose()
	amountEchart?.dispose()
	upEchart?.dispose()
	downEchart?.dispose()
	mosaicEchart?.dispose()
	mosaicPanoramaEchart?.dispose()
})
</script>

<style lang="scss" scoped>
.market {
	// 涨红跌绿
	.up {
		color: var(--el-color-danger);
	}

	.down {
		color: var(--el-color-success);
	}

	// 日期选择
	.date-box {
		display: flex;
		align-items: center;
		gap: 12px;
		background: #fff;
		border-radius: 16px;
		padding: 12px 20px;
		margin-bottom: 20px;

		.date-label {
			font-size: 14px;
			font-weight: 500;
			color: #909399;
			margin-right: auto;
		}

		// 统一由 gap 控制间距，抵消 el-button 相邻 12px 默认外边距
		:deep(.el-button + .el-button) {
			margin-left: 0;
		}

		.el-date-editor {
			width: 130px;
		}
	}

	// 今日未收盘提示（默认展示最近交易日时的说明）
	.close-alert {
		margin-bottom: 20px;
	}

	// 统计卡片
	.panle-box {
		display: flex;
		align-items: stretch;
		flex-wrap: wrap;
		justify-content: space-between;
		margin-bottom: 20px;

		.center-item {
			box-sizing: border-box;
			display: flex;
			flex-direction: column;
			width: 23.5%;
			min-width: 220px;
			height: 300px;
			background: #fff;
			border-radius: 16px;
			padding: 20px 20px;

			.center-title {
				display: flex;
				align-items: center;
				justify-content: space-between;
				font-size: 15px;
				font-weight: 500;
				color: #909399;

				svg {
					width: 20px;
					height: 20px;
				}
			}

			.center-body {
				margin: 14px 0 8px;

				.num-text {
					font-size: 2.25rem;
					font-weight: bold;
					color: #303133;
				}

				.num-type {
					margin-left: 4px;
					font-size: 1rem;
					color: #909399;
				}
			}

			.center-foot {
				display: flex;
				align-items: center;
				font-size: 13px;
				color: #a7abba;

				label {
					margin: 0 2px;
				}

				.foot-split {
					width: 1px;
					height: 12px;
					background: #e4e7ed;
					margin: 0 12px;
				}
			}

			.week-chart {
				flex: 1;
				min-height: 0;
				margin-top: 8px;
			}

			.distribution-box {
				height: calc(100% - 26px);
				margin-top: 8px;
			}
		}
	}

	// AI 大盘解读
	.ai-box {
		background: #fff;
		border-radius: 16px;
		padding: 16px 20px;
		margin-bottom: 20px;

		.ai-header {
			display: flex;
			align-items: center;

			.ai-title {
				font-size: 16px;
				font-weight: 600;
				line-height: 24px;
			}

			.ai-desc {
				color: #909399;
				font-size: 0.85rem;
				margin-left: 10px;
			}
		}

		.ai-content {
			margin: 10px 0 0;
			font-size: 14px;
			line-height: 24px;
			color: #606266;

			&.empty {
				color: #a7abba;
			}
		}
	}

	// 大盘走势
	.market-box {
		background: #fff;
		border-radius: 16px;
		margin-bottom: 20px;

		.market-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px 20px;
			border-bottom: 1px solid #f5f6fb;

			.left-header-title {
				font-size: 16px;
				font-weight: 600;
				line-height: 24px;
			}

			.left-header-desc {
				color: #909399;
				font-size: 0.85rem;
				margin-left: 10px;
			}

			.right-header {
				display: flex;
				align-content: center;

				div {
					padding: 5px 12px;
					font-size: 14px;
					font-weight: 500;
					color: #a7abba;
					line-height: 20px;
					border-radius: 6px;
					border: 1px solid #a7abba;
					cursor: pointer;
					margin-left: 8px;
				}

				.active {
					background: #409eff;
					border: 1px solid #409eff;
					color: #fff;
				}
			}
		}

		.market-content {
			display: flex;
			padding: 20px;

			.index-list {
				width: 180px;
				margin-right: 12px;

				.index-item {
					box-sizing: border-box;
					padding: 8px 12px;
					border-radius: 10px;
					border: 1px solid transparent;
					cursor: pointer;
					margin-bottom: 8px;

					&.active {
						background: #ecf5ff;
						border-color: #d9ecff;
					}

					.name {
						font-size: 13px;
						color: #909399;
						margin-bottom: 6px;
					}

					.value {
						font-size: 1.15rem;
						font-weight: bold;
						color: #303133;
					}

					.percent {
						font-size: 13px;
						margin-top: 4px;
					}
				}
			}

			.trend-box {
				flex: 1;

				.trend-info {
					display: flex;
					align-items: center;
					margin-bottom: 10px;

					.trend-name {
						font-size: 15px;
						font-weight: 600;
						color: #303133;
						margin-right: 12px;
					}

					.trend-value {
						font-size: 1.75rem;
						font-weight: bold;
						margin-right: 12px;
					}

					.trend-change {
						font-size: 14px;
						margin-right: 20px;
					}

					.trend-amount {
						font-size: 13px;
						color: #a7abba;
					}

					// 走势周期切换（分时/日K/周K/月K）右对齐
					.period-tabs {
						margin-left: auto;
					}
				}

				.trend-chart {
					height: 410px;
				}
			}
		}
	}

	// 市场资讯（24小时滚动）+ 龙虎榜
	.news-box {
		display: flex;
		gap: 20px;
		margin-bottom: 20px;

		.news-panel {
			display: flex;
			flex-direction: column;
			background: #fff;
			border-radius: 16px;
			overflow: hidden;

			// 24小时滚动栏稍宽（条目较长）
			&:first-child {
				flex: 1.3;
			}

			&:last-child {
				flex: 1;
			}

			.news-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 16px 20px;
				border-bottom: 1px solid #f5f6fb;

				.news-title {
					display: flex;
					align-items: baseline;

					.left-header-title {
						font-size: 16px;
						font-weight: 600;
					}

					.news-desc {
						margin-left: 10px;
						color: #909399;
						font-size: 0.85rem;
					}
				}
			}

			.news-list {
				height: 342px;
				overflow-y: auto;
				padding: 4px 0;

				// 24小时滚动条目（时间 + 单行标题 + 来源/关联股票）
				.flash-item {
					display: flex;
					gap: 10px;
					padding: 8px 20px;
					cursor: pointer;

					&:hover {
						background: #f5f6fb;
					}

					.flash-time {
						flex-shrink: 0;
						width: 42px;
						padding-top: 2px;
						font-size: 12px;
						color: #a7abba;
					}

					.flash-body {
						flex: 1;
						min-width: 0;

						.flash-title {
							font-size: 13px;
							line-height: 20px;
							color: #303133;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						}

						.flash-meta {
							display: flex;
							gap: 8px;
							margin-top: 2px;
							font-size: 12px;
							color: #a7abba;

							.flash-stock {
								color: var(--el-color-primary);
							}
						}
					}
				}

				// 龙虎榜条目（名称/代码/涨跌幅 + 上榜原因/净买额）
				.lhb-item {
					padding: 8px 20px;
					cursor: pointer;

					&:hover {
						background: #f5f6fb;
					}

					.lhb-head {
						display: flex;
						align-items: baseline;
						gap: 8px;
						font-size: 13px;

						.lhb-name {
							max-width: 96px;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
							font-weight: 600;
							color: #303133;
						}

						.lhb-code {
							font-size: 12px;
							color: #a7abba;
						}

						.lhb-pct {
							margin-left: auto;
							font-weight: 600;
						}
					}

					.lhb-meta {
						display: flex;
						justify-content: space-between;
						gap: 8px;
						margin-top: 2px;
						font-size: 12px;
						color: #a7abba;

						.lhb-reason {
							flex: 1;
							min-width: 0;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						}

						.lhb-net {
							flex-shrink: 0;
							font-weight: 600;
						}
					}
				}
			}
		}
	}

	// 板块涨跌幅矩形树图
	.mosaic-box {
		background: #fff;
		border-radius: 16px;
		padding: 16px 20px 20px;
		margin-bottom: 20px;

		.mosaic-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 14px;

			.left-header {
				display: flex;
				align-items: baseline;

				.left-header-title {
					font-size: 16px;
					font-weight: 600;
				}

				.left-header-desc {
					margin-left: 10px;
					color: #909399;
					font-size: 0.85rem;
				}
			}
		}

		// 矩形树图（面积随涨跌幅绝对值大小；全景弹窗内接近全屏展示）
		.mosaic-treemap {
			height: 400px;

			&.panorama {
				height: 78vh;
			}
		}
	}

	// 个股列表
	.stock-box {
		background: #fff;
		border-radius: 16px;
		padding: 0 20px 20px;

		.stock-tabs {
			:deep(.el-tabs__header) {
				margin-bottom: 0;
			}
		}

		.filter-bar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			flex-wrap: wrap;
			gap: 10px 16px;
			padding: 12px 0;
			border-bottom: 1px solid #f5f6fb;

			.filter-conditions {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 10px 12px;

				.w-code {
					width: 120px;
				}

				.w-sector {
					width: 150px;
				}

				.range-group,
				.check-group {
					display: flex;
					align-items: center;
					gap: 6px;
				}

				.range-input {
					width: 96px;
				}

				.range-separator {
					color: #a7abba;
				}
			}

			.filter-btns {
				display: flex;
				align-items: center;
				gap: 12px;

				// 统一由 gap 控制间距，抵消 el-button 相邻默认外边距
				:deep(.el-button + .el-button) {
					margin-left: 0;
				}
			}
		}

		.table-box {
			padding-top: 15px;
		}
	}

	// 表头配置抽屉
	.column-config {
		.column-item {
			padding: 8px 0;
			border-bottom: 1px solid #f5f6fb;
		}
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px 0;
		border-top: 1px solid #e4e7ed;
	}
}
</style>
