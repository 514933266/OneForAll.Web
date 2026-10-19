<template>
	<div class="stock-events">
		<!-- 顶部：视图切换 + 事件子类筛选 chips（火苗图标=该子类事件数≥3） -->
		<div class="se-head">
			<el-radio-group v-model="view" size="small">
				<el-radio-button value="flow">公告流水</el-radio-button>
				<el-radio-button value="board">事件回测</el-radio-button>
			</el-radio-group>
			<div class="se-chips">
				<span v-if="view === 'flow'" :class="['se-chip', { active: subFilter === null }]" @click="onChip(null)">全部</span>
				<span v-for="c in ZDX_EVENT_SUB_CATEGORIES" :key="c.value"
					:class="['se-chip', { active: subFilter === c.value }]" @click="onChip(c.value)">
					{{ c.label }}<span v-if="isHot(c.value)" class="chip-hot" title="该类事件≥3个"><font-awesome-icon fas icon="fire"></font-awesome-icon></span>
				</span>
			</div>
		</div>

		<!-- 公告流水视图（关键事件高亮卡片 + 常规公告折叠极简列表 + 分页；切换加载用骨架屏） -->
		<div v-if="view === 'flow'" class="se-flow">
			<el-skeleton v-if="flowLoading" animated :rows="6" class="se-skeleton" />
			<template v-else>
				<div v-if="keyItems.length" class="tlfade-wrap">
					<transition-group name="tlfade" tag="div">
						<div v-for="item in keyItems" :key="item.Id" class="flow-card" :class="dirClass(item.Ai?.Direction)">
							<div class="flow-card-main" @click="openUrl(item.Url)">
								<div class="flow-title">
									<span v-if="item.Ai?.SubCategory" class="flow-sub">{{ subLabelOf(item.Ai.SubCategory) }}</span>
									{{ item.Title }}
								</div>
								<div class="flow-meta">
									<span class="date">{{ fmtDate(item.PublishTime) }}</span>
									<el-tag v-if="item.Ai && item.Ai.Direction" :type="directionTag(item.Ai.Direction)" size="small"
										effect="plain">{{ directionLabel(item.Ai.Direction) }}</el-tag>
									<el-tag v-if="item.Ai?.AiSummary" type="info" size="small" effect="plain" class="sum-tag">{{ item.Ai.AiSummary }}</el-tag>
								</div>
							</div>
							<el-button size="small" text type="primary" @click="toBoard(item.Ai?.SubCategory)">回测&nbsp;<font-awesome-icon fas icon="arrow-up-right-from-square"></font-awesome-icon></el-button>
						</div>
					</transition-group>
				</div>
				<!-- 常规公告：默认折叠极简列表 -->
				<div v-if="normalItems.length" class="flow-normal">
					<span class="normal-toggle" @click="showNormal = !showNormal">
						常规公告（{{ normalItems.length }}条）{{ showNormal ? '收起' : '展开' }}&nbsp;<font-awesome-icon fas :icon="showNormal ? 'chevron-up' : 'chevron-down'"></font-awesome-icon>
					</span>
					<template v-if="showNormal">
						<div v-for="item in normalItems" :key="item.Id" class="normal-item" @click="openUrl(item.Url)">
							<span class="normal-title">{{ item.Title }}</span>
							<span class="normal-date">{{ fmtDate(item.PublishTime) }}</span>
						</div>
					</template>
				</div>
				<el-empty v-if="!flowTotal" description="暂无公告数据（可先执行公告同步/历史回溯）" :image-size="60"></el-empty>
				<el-pagination v-if="flowTotal" background small layout="total, sizes, prev, pager, next"
					v-model:current-page="pageIndex" :page-sizes="[20, 50, 100]" v-model:page-size="pageSize" :total="flowTotal"
					@size-change="loadFlow" @current-change="loadFlow">
				</el-pagination>
			</template>
		</div>

		<!-- 事件回测视图（全景看板 + AI 洞察 + 关键事件时间轴） -->
		<div v-else class="se-board">
			<el-skeleton v-if="boardLoading" animated :rows="8" class="se-skeleton" />
			<template v-else-if="board">
				<!-- 样本不足警示（不虚构统计） -->
				<div v-if="board.EventCount < 5" class="board-warn">
					<font-awesome-icon fas icon="triangle-exclamation"></font-awesome-icon>&nbsp;该类事件样本不足（{{ board.EventCount }} 个 &lt; 5），统计与建议仅供参考；可先执行公告历史回溯补齐存量
				</div>

				<!-- 1. 事件驱动全景看板（涨红跌绿语义；口径显式标注防与时间轴错位） -->
				<div class="board-title"><font-awesome-icon fas icon="chart-column"></font-awesome-icon>&nbsp;事件驱动全景看板 —「{{ subLabelOf(board.SubCategory) }}」
					<span class="board-sub">共 {{ board.EventCount }} 个关键事件 · 前复权 · 含停牌顺延</span>
				</div>
				<table class="board-table">
					<thead>
						<tr>
							<th>窗口</th>
							<th>历史胜率<span class="th-tip">（跑赢上证口径）</span></th>
							<th>平均绝对收益</th>
							<th>平均超额收益<span class="th-tip">（跑赢上证）</span></th>
							<th>操作建议</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(w, wi) in board.Windows" :key="w.Window"
							:class="['win-row', { 'win-on': winFilter === w.Window }]"
							@mouseenter="hoverWin = w.Window" @mouseleave="hoverWin = null" @click="toggleWinFilter(w)">
							<td>T+{{ w.Window }}<span class="win-sample">（n={{ w.Sample }}）</span></td>
							<td :class="winRateClass(w)">
								<template v-if="w.Reliable">{{ w.WinRate }}%</template>
								<template v-else>--<span class="unreliable">样本不足</span></template>
							</td>
							<td :class="valClass(w.AvgAbs)">{{ w.Reliable ? fmtPct(w.AvgAbs) : '--' }}</td>
							<td :class="valClass(w.AvgExc)">{{ w.Reliable ? fmtPct(w.AvgExc) : '--' }}</td>
							<td v-if="wi === 0" :rowspan="board.Windows.length" class="advice-cell">
								<span v-if="board.Advice" class="advice-text">{{ board.Advice }}</span>
								<span v-else class="advice-none">样本不足</span>
							</td>
						</tr>
					</tbody>
				</table>
				<div class="board-tip">悬停窗口行：时间轴按该窗口跑赢/跑不赢高亮/淡化；点击窗口行：筛选时间轴仅显示该窗口已补齐样本的事件</div>

				<!-- 2. 分红送转子类：分红走势（每10股派息柱序）+ 同行业位置（近3年同业最新派息降序比较） -->
				<div v-if="board.SubCategory === 23" class="div-card">
					<div class="div-head">
						<span class="div-title"><font-awesome-icon fas icon="coins"></font-awesome-icon>&nbsp;分红走势与同行业位置</span>
						<span v-if="dividend?.Sector" class="div-sector">{{ dividend.Sector }}</span>
					</div>
					<template v-if="dividend && dividend.Own.length">
						<div class="div-body">
							<div class="div-left">
								<div class="div-block-label">历年每10股派息（元）</div>
								<div v-if="divHasCash" ref="divChartRef" class="div-line-chart"></div>
								<span v-else class="div-peer-none">暂无可提取的分红金额（数据源：东方财富 F10 分红送转）</span>
							</div>
							<div class="div-right">
								<div class="div-block-label">同行业水位<span v-if="dividend.Sector" class="div-water-sector">{{ dividend.Sector }}</span></div>
								<template v-if="dividend.Rank">
									<div :class="['div-water', divWaterTone]">
										<div class="div-water-track">
											<div class="div-water-fill" :style="{ width: divWaterPct(dividend.LatestPer10Cash) }"></div>
											<div v-if="dividend.PeerMedian != null" class="div-water-median" :style="{ left: divWaterPct(dividend.PeerMedian) }" :title="`同业中位 ${dividend.PeerMedian} 元`"></div>
											<div class="div-water-dot" :style="{ left: divWaterPct(dividend.LatestPer10Cash) }" :title="`本股 ${dividend.LatestPer10Cash} 元`"></div>
										</div>
										<div class="div-water-scale">
											<span>0</span>
											<span>头部 {{ dividend.PeerMax ?? '—' }}</span>
										</div>
									</div>
									<div class="div-water-legend">
										<span :class="['div-water-self', divWaterTone]">本股 <b>{{ dividend.LatestPer10Cash }}</b> 元</span>
										<span v-if="divWaterTone" :class="['div-water-tone-chip', divWaterTone]">{{ divAboveMedian ? '高于' : '低于' }}中位 {{ divMedianGap }}%</span>
										<span v-if="dividend.PeerMedian != null" class="div-water-median-txt">中位 {{ dividend.PeerMedian }}</span>
										<span class="div-peer-chip">同业头部 {{ dividend.TopPercent }}%（{{ dividend.Rank }}/{{ dividend.PeerSampleCount }}）</span>
									</div>
								</template>
								<span v-else class="div-peer-none">同行业可对比样本不足，暂不出水位</span>
							</div>
						</div>
					</template>
					<div v-else-if="dividend" class="div-peer-none">暂无分红送转记录（数据源：东方财富 F10 分红送转）</div>
				</div>

				<!-- 3. 历史关键事件时间轴（年份过滤 + 窗口样本过滤） -->
				<div class="board-title timeline-title"><font-awesome-icon fas icon="clock-rotate-left"></font-awesome-icon>&nbsp;历史关键事件时间轴
					<span v-if="winFilter !== null" class="tl-filter-on" @click="winFilter = null">仅 T+{{ winFilter }} 已补齐样本 ×</span>
				</div>
				<div v-if="yearList.length > 1" class="year-bar">
					<span :class="['se-chip', { active: yearFilter === null }]" @click="yearFilter = null">全部年份</span>
					<span v-for="y in yearList" :key="y" :class="['se-chip', { active: yearFilter === y }]" @click="yearFilter = y">{{ y }}</span>
				</div>
				<div v-if="!board.Events.length" class="board-empty">该子类暂无已转写的关键事件（每日 17:10 转写任务自动处理，或手动补跑事件转写）</div>
				<div v-else-if="!timelineEvents.length" class="board-empty">当前过滤条件下暂无事件（换个年份或取消窗口筛选）</div>
				<transition-group v-else name="tlfade" tag="div">
					<div v-for="ev in timelineEvents" :key="ev.Id" class="tl-item">
						<div class="tl-node">
							<span :class="['tl-dot', dirClass(ev.Direction)]"></span>
							<span class="tl-date">{{ fmtDate(ev.EventDate) }}</span>
						</div>
						<div :class="['tl-card', cardCls(ev)]">
							<!-- 标题力度前置：日期 + tag + 核心金额，原标题降次行 -->
							<div class="tl-head">
								<span class="tl-strength">
									<span class="tl-date-big">{{ fmtDate(ev.EventDate) }}</span>
									<span v-if="eventTag(ev.KeyParams)" class="tl-tag-chip">{{ eventTag(ev.KeyParams) }}</span>
									<span v-if="coreKp(ev)" class="tl-core">{{ coreKp(ev) }}</span>
								</span>
								<el-tag v-if="ev.Direction" :type="directionTag(ev.Direction)" size="small" effect="plain">{{ directionLabel(ev.Direction) }}</el-tag>
							</div>
							<div class="tl-title" @click="openUrl(ev.Url)">{{ ev.Title }}</div>
							<!-- 回购点位（仅回购子类且匹配到方案时：价格/金额/占比/已回购 + 未完成高亮） -->
							<div v-if="bbOf(ev)" :class="['bb-points', bbOf(ev)!.IsOngoing ? 'ongoing' : '']">
								<div class="bb-head">
									<font-awesome-icon fas icon="rotate"></font-awesome-icon>
									<span class="bb-label">回购点位</span>
									<span :class="['bb-status', bbOf(ev)!.IsOngoing ? 'on' : 'done']">
										{{ bbOf(ev)!.IsOngoing ? '● 回购进行中' : (bbOf(ev)!.ProgressText || '已结束') }}
									</span>
								</div>
								<div v-if="bbChips(bbOf(ev)!).length" class="bb-chips">
									<span v-for="(c, ci) in bbChips(bbOf(ev)!)" :key="ci" class="bb-chip">{{ c }}</span>
								</div>
								<div v-if="bbWin(bbOf(ev)!)" class="bb-win">{{ bbWin(bbOf(ev)!) }}</div>
							</div>
							<div v-if="restKp(ev).length" class="tl-kp">
								<span v-for="(p, pi) in restKp(ev)" :key="pi" class="kp-chip">{{ p }}</span>
							</div>
							<!-- 事件链子公告折叠 -->
							<div v-if="ev.SubNews?.length" class="tl-subs">
								<span class="subs-toggle" @click="toggleSubs(ev.Id)">
									含 {{ ev.SubNews.length }} 条进展公告 {{ openSubs.includes(ev.Id) ? '收起' : '展开' }}&nbsp;<font-awesome-icon fas :icon="openSubs.includes(ev.Id) ? 'chevron-up' : 'chevron-down'"></font-awesome-icon>
								</span>
								<div v-if="openSubs.includes(ev.Id)" class="subs-list">
									<div v-for="(s, si) in ev.SubNews" :key="si" class="subs-item" @click="openUrl(s.Url)">
										<span class="subs-date">{{ fmtDate(s.Date) }}</span>
										<span class="subs-title">{{ s.Title }}</span>
									</div>
								</div>
							</div>
							<!-- 三徽章固定槽位：主数字=绝对收益，小字=超额（与看板口径可视对齐） + T+0..T+20 Sparkline -->
							<div class="tl-trend">
								<span class="trend-label">历史走势</span>
								<span v-for="w in [5, 20, 60]" :key="w" :class="['tl-badge', valClass(absOf(ev, w))]">
									<span class="badge-main">T+{{ w }} {{ fmtPct(absOf(ev, w)) }}</span>
									<span class="badge-exc">超额 {{ fmtPct(excOf(ev, w)) }}</span>
								</span>
								<svg v-if="spark(ev)" class="tl-spark" :width="spark(ev)!.w" :height="spark(ev)!.h">
									<line x1="0" :y1="spark(ev)!.zeroY" :x2="spark(ev)!.w" :y2="spark(ev)!.zeroY"
										stroke="#e6e8f0" stroke-width="1" stroke-dasharray="3,3"></line>
									<polyline :points="spark(ev)!.pts" fill="none" :stroke="spark(ev)!.color" stroke-width="1.5"></polyline>
								</svg>
							</div>
							<!-- 联动 Callout：Tag 徽标 + 文案分行（左侧蓝色竖条） -->
							<div v-if="ev.Linkages?.length" class="tl-link">
								<div class="link-head">【与你联动】</div>
								<div v-for="(lk, li) in ev.Linkages" :key="li" class="link-row">
									<span :class="['link-tag', lkClass(lk)]">{{ lk.Tag }}</span>
									<span class="link-text">{{ lk.Text }}</span>
								</div>
							</div>
							<div class="tl-ops">
								<el-button size="small" text type="primary" @click="onFocusEvent(ev)">在K线图上查看</el-button>
								<el-button size="small" text type="warning" @click="onReviewQuote(ev)">关联我的复盘</el-button>
							</div>
						</div>
					</div>
				</transition-group>
			</template>
			<el-empty v-else :description="`「${subLabelOf(boardSub)}」暂无事件统计`" :image-size="60"></el-empty>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import zdxApi from '@/apis/zdx-api'
import { IZdxNewsStockItem, ZDX_NEWS_DIRECTIONS } from '@/interfaces/zhiduoxing/IZdxNews'
import {
	IZdxStockEvent,
	IZdxStockEventBoard,
	IZdxEventLinkage,
	IZdxEventSubCount,
	IZdxEventWindowStat,
	IZdxBuybackPlan,
	IZdxBuybackContext,
	matchBuybackPlan,
	ZDX_EVENT_SUB_CATEGORIES,
	isKeyEvent,
	eventSubLabel,
	parseKeyParams,
	eventTag
} from '@/interfaces/zhiduoxing/IZdxStockEvent'

// 个股公告双视图组件（公告流水 + 事件回测看板），替换 StockDetail 公告 Tab 原极简列表
// 事件回测视图数据按"股 × 事件子类"查询；chips 在流水视图为筛选、在回测视图为子类切换
// 2.0：默认视图=事件回测（进股先取 SubCounts 定位事件最多子类）；看板行悬停/点击联动时间轴；徽章+Sparkline+子公告折叠
const props = defineProps<{ code: string }>()

// 点击[在K线图上查看]：父页切回行情主图并调用 QuoteChart.focusEvent 定位；关联复盘带核心金额与 T+20 超额
const emit = defineEmits<{
	(e: 'focus-event', payload: { date: string; direction: number; title: string }): void
	(e: 'review-quote', payload: { title: string; url: string; date: string; trend: string; exc20: string; core: string; linkages: string[] }): void
	(e: 'events-loaded', payload: IZdxStockEvent[]): void
	(e: 'view-change', payload: 'flow' | 'board'): void
}>()

// 默认进事件回测视图（看板口径优先）；流水视图仍可随时切换
const view = ref<'flow' | 'board'>('board')
// 子类筛选（null=全部；回测视图落到事件最多子类）
const subFilter = ref<number | null>(null)
const boardSub = computed(() => subFilter.value ?? topSub())

// ---------- 子类计数（火苗高发角标 + 默认子类） ----------
const subCounts = ref<IZdxEventSubCount[]>([])
async function loadSubCounts() {
	if (!props.code) return
	try {
		subCounts.value = await zdxApi.getZdxStockEventSubCounts(props.code)
	} catch {
		subCounts.value = []
	}
}
function countOf(sub: number) {
	return subCounts.value.find(c => c.SubCategory === sub)?.Count ?? 0
}
function isHot(sub: number) {
	return countOf(sub) >= 3
}
// 事件数最多的关键子类（无计数回落首个子类；仅认已定义子类值，避免历史脏值）
function topSub(): number {
	const known = ZDX_EVENT_SUB_CATEGORIES.map(c => c.value)
	let best = 0
	let bestN = 0
	for (const c of subCounts.value) {
		if (known.includes(c.SubCategory) && c.Count > bestN) { best = c.SubCategory; bestN = c.Count }
	}
	return best || ZDX_EVENT_SUB_CATEGORIES[0].value
}

// ---------- 公告流水 ----------
const flowLoading = ref(false)
const flowItems = ref<IZdxNewsStockItem[]>([])
const flowTotal = ref(0)
const pageIndex = ref(1)
const pageSize = ref(20)
const showNormal = ref(false)

// 关键事件高亮卡片（子类+方向+AI 摘要；常规公告折叠极简列表；口径与后端 EventRules 一致）
const keyItems = computed(() => flowItems.value.filter(i => isKeyEvent(i.Ai?.SubCategory, i.Title)))
const normalItems = computed(() => flowItems.value.filter(i => !isKeyEvent(i.Ai?.SubCategory, i.Title)))

async function loadFlow() {
	if (!props.code) return
	const seq = ++flowSeq
	flowLoading.value = true
	try {
		const res = await zdxApi.getZdxNewsStockNews(
			{ StockCode: props.code, SubCategory: subFilter.value ?? undefined },
			2, pageIndex.value, pageSize.value)
		if (seq !== flowSeq) return
		flowItems.value = res?.Items ?? []
		flowTotal.value = res?.Total ?? 0
		showNormal.value = false
	} catch {
		if (seq !== flowSeq) return
		flowItems.value = []
		flowTotal.value = 0
	} finally {
		if (seq === flowSeq) flowLoading.value = false
	}
}
let flowSeq = 0

// ---------- 事件回测看板 ----------
const boardLoading = ref(false)
const board = ref<IZdxStockEventBoard | null>(null)

async function loadBoard() {
	if (!props.code) return
	const seq = ++boardSeq
	const sub = boardSub.value
	boardLoading.value = true
	try {
		const res = await zdxApi.getZdxStockEventBoard(props.code, sub)
		if (seq !== boardSeq) return
		board.value = res
		emit('events-loaded', res?.Events ?? [])
	} catch {
		if (seq !== boardSeq) return
		board.value = null
		emit('events-loaded', [])
	} finally {
		if (seq === boardSeq) boardLoading.value = false
	}
	// 分红走势与同业位置仅子类 23 需要（随看板切换重载，其余子类清空）
	loadDividend()
	// 回购方案点位仅子类 25 需要（随看板切换重载，其余子类清空）
	loadBuyback()
}
let boardSeq = 0

// ---------- 分红走势与同行业位置（子类=分红送转 23 时懒加载） ----------
const dividend = ref<any | null>(null)
let divSeq = 0
async function loadDividend() {
	const seq = ++divSeq
	dividend.value = null
	if (!props.code || boardSub.value !== 23) return
	try {
		const res = await zdxApi.getZdxStockEventDividend(props.code)
		if (seq !== divSeq) return
		dividend.value = res
	} catch {
		if (seq === divSeq) dividend.value = null
	}
}

// ---------- 分红折线图（ECharts；多年份自动收缩 x 轴刻度，仅显首尾年） ----------
const divChartRef = ref<HTMLElement | null>(null)
let divChart: echarts.ECharts | null = null
function buildDivLineOption(): echarts.EChartsOption {
	const own = (dividend.value?.Own ?? []) as any[]
	const years = own.map(d => String(d.Year))
	const cash = own.map(d => (d.Per10Cash != null ? d.Per10Cash : null))
	const n = years.length
	const sparse = n > 10
	return {
		grid: { left: 36, right: 14, top: 16, bottom: 24 },
		tooltip: {
			trigger: 'axis',
			formatter: (params: any) => {
				const p = Array.isArray(params) ? params[0] : params
				const d = own[p.dataIndex]
				if (!d) return ''
				let s = `<b>${d.Year}</b>`
				if (d.Per10Cash != null) s += `<br/>每10股派 ${d.Per10Cash} 元`
				if (d.Per10Bonus) s += `<br/>送转 ${d.Per10Bonus} 股`
				return s
			}
		},
		xAxis: {
			type: 'category',
			data: years,
			boundaryGap: false,
			axisTick: { alignWithLabel: true },
			axisLine: { lineStyle: { color: '#dcdfe6' } },
			axisLabel: {
				color: '#98a0ad',
				fontSize: 10,
				interval: sparse ? (i: number) => i === 0 || i === n - 1 : 0,
				hideOverlap: true
			}
		},
		yAxis: {
			type: 'value',
			splitLine: { lineStyle: { color: '#f2f3f5' } },
			axisLabel: { color: '#98a0ad', fontSize: 10 }
		},
		series: [
			{
				type: 'line',
				data: cash,
				smooth: true,
				connectNulls: true,
				symbol: 'circle',
				symbolSize: 6,
				lineStyle: { color: '#e6a23c', width: 2 },
				itemStyle: { color: '#e6a23c' },
				areaStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: 'rgba(230, 162, 60, 0.28)' },
						{ offset: 1, color: 'rgba(230, 162, 60, 0.02)' }
					])
				}
			}
		]
	}
}
async function renderDivChart() {
	await nextTick()
	const el = divChartRef.value
	if (!el || !divHasCash.value) {
		if (divChart) { divChart.dispose(); divChart = null }
		return
	}
	if (!divChart || divChart.getDom() !== el) {
		divChart?.dispose()
		divChart = echarts.init(el)
	}
	divChart.setOption(buildDivLineOption(), true)
	divChart.resize()
}
watch(dividend, () => { renderDivChart() })
onUnmounted(() => { divChart?.dispose(); divChart = null })

// ---------- 回购方案点位（子类=回购 25 时懒加载；为时间轴每条回购事件内嵌点位与未完成标识） ----------
const buyback = ref<IZdxBuybackContext | null>(null)
let bbSeq = 0
async function loadBuyback() {
	const seq = ++bbSeq
	buyback.value = null
	if (!props.code || boardSub.value !== 25) return
	try {
		const res = await zdxApi.getZdxStockEventBuyback(props.code)
		if (seq !== bbSeq) return
		buyback.value = res
	} catch {
		if (seq === bbSeq) buyback.value = null
	}
}
// 为当前事件匹配所属回购方案（仅回购子类且已加载方案时）
function bbOf(ev: IZdxStockEvent): IZdxBuybackPlan | null {
	if (boardSub.value !== 25 || !buyback.value?.Plans?.length) return null
	return matchBuybackPlan(buyback.value.Plans, ev.EventDate)
}
// 金额友好文本（元→亿/万）
function bbMoney(v?: number | null): string {
	if (v == null) return ''
	if (Math.abs(v) >= 1e8) return (v / 1e8).toFixed(2).replace(/\.?0+$/, '') + '亿'
	if (Math.abs(v) >= 1e4) return (v / 1e4).toFixed(2).replace(/\.?0+$/, '') + '万'
	return String(v)
}
// 股数友好文本（股→亿股/万股）
function bbVol(v?: number | null): string {
	if (v == null) return ''
	if (Math.abs(v) >= 1e8) return (v / 1e8).toFixed(2).replace(/\.?0+$/, '') + '亿股'
	if (Math.abs(v) >= 1e4) return (v / 1e4).toFixed(0) + '万股'
	return v + '股'
}
// 区间文本（上下限拼接，相等/单值只显一个）
function bbRange(lo?: number | null, hi?: number | null, unit = ''): string {
	const has = (v?: number | null) => v != null
	if (has(lo) && has(hi) && lo !== hi) return `${lo}~${hi}${unit}`
	if (has(lo)) return `${lo}${unit}`
	if (has(hi)) return `${hi}${unit}`
	return ''
}
// 方案点位展示片段（价格/金额/占比/已回购；无值项自动跳过）
function bbChips(p: IZdxBuybackPlan): string[] {
	const chips: string[] = []
	const price = p.PriceLower != null && p.PriceCap != null && p.PriceLower !== p.PriceCap
		? `回购价 ${p.PriceLower}~${p.PriceCap}元/股`
		: p.PriceCap != null
			? `回购价上限 ${p.PriceCap}元/股`
			: ''
	if (price) chips.push(price)
	if (bbMoney(p.AmtLower) || bbMoney(p.AmtUpper)) chips.push(`计划金额 ${bbRangeTwo(p.AmtLower, p.AmtUpper)}`)
	const ratio = bbRange(
		p.RatioLower != null ? Math.round(p.RatioLower * 100) / 100 : null,
		p.RatioUpper != null ? Math.round(p.RatioUpper * 100) / 100 : null,
		'%'
	)
	if (ratio) chips.push(`占总股本 ${ratio}`)
	if (p.BoughtVol != null || p.BoughtAmt != null) {
		let t = `已回购 ${bbVol(p.BoughtVol)}`
		const ba = bbMoney(p.BoughtAmt)
		if (ba) t += ` / ${ba}元`
		if (p.BoughtAvgPrice != null) t += `｜均价 ${p.BoughtAvgPrice}元`
		else if (p.BoughtPriceLower != null && p.BoughtPriceUpper != null) t += `｜成交 ${p.BoughtPriceLower}~${p.BoughtPriceUpper}元`
		chips.push(t)
	}
	return chips
}
// 金额区间（亿/万自适应，上限下限）
function bbRangeTwo(lo?: number | null, hi?: number | null): string {
	const a = bbMoney(lo)
	const b = bbMoney(hi)
	if (a && b && a !== b) return `${a}~${b}元`
	if (a) return `${a}元起`
	if (b) return `不超${b}元`
	return ''
}
// 回购窗口（起止日）
function bbWin(p: IZdxBuybackPlan): string {
	const dd = (s?: string) => (s && String(s).slice(0, 10) !== '0001-01-01' ? String(s).slice(0, 10) : '')
	const s = dd(p.StartDate) || dd(p.NoticeDate)
	const e = dd(p.EndDate)
	if (s && e) return `回购窗口 ${s} ~ ${e}`
	if (s) return `回购起始 ${s}`
	return ''
}
// 至少一条可提取派息才出折线图（否则只出文字空态）
const divHasCash = computed(() => (dividend.value?.Own ?? []).some((d: any) => d.Per10Cash != null && d.Per10Cash > 0))
// 同业水位色调：本股最新派息高于/低于同业中位（中位缺失时不区分）
const divAboveMedian = computed<boolean | null>(() => {
	const d = dividend.value
	if (!d || d.PeerMedian == null || d.LatestPer10Cash == null) return null
	return d.LatestPer10Cash > d.PeerMedian
})
const divWaterTone = computed(() => (divAboveMedian.value === null ? '' : divAboveMedian.value ? 'up' : 'down'))
// 本股相对中位的偏离百分比（绝对值，保留一位小数）
const divMedianGap = computed(() => {
	const d = dividend.value
	if (!d || !d.PeerMedian || d.LatestPer10Cash == null) return 0
	return Math.abs(Math.round(((d.LatestPer10Cash - d.PeerMedian) / d.PeerMedian) * 1000) / 10)
})
// 同业水位条百分比（以同业最高派息 PeerMax 为满刻度，本股/中位相对定位）
function divWaterPct(v?: number | null): string {
	const max = dividend.value?.PeerMax
	if (!max || v == null || v <= 0) return '0%'
	return `${Math.min(100, Math.round((v / max) * 100))}%`
}

// ---------- 看板 ↔ 时间轴联动（悬停按该窗口超额高亮/淡化；点击筛选该窗口已补齐样本） ----------
const hoverWin = ref<number | null>(null)
const winFilter = ref<number | null>(null)
function toggleWinFilter(w: IZdxEventWindowStat) {
	winFilter.value = winFilter.value === w.Window ? null : w.Window
}
function excOf(ev: IZdxStockEvent, w: number): number | null | undefined {
	return w === 5 ? ev.Exc5 : w === 20 ? ev.Exc20 : ev.Exc60
}
function absOf(ev: IZdxStockEvent, w: number): number | null | undefined {
	return w === 5 ? ev.Abs5 : w === 20 ? ev.Abs20 : ev.Abs60
}
function cardCls(ev: IZdxStockEvent) {
	const cls: string[] = [dirClass(ev.Direction)]
	if (hoverWin.value !== null) {
		const e = excOf(ev, hoverWin.value)
		if (e === undefined || e === null) cls.push('tl-faded')
		else cls.push(e > 0 ? 'tl-win' : 'tl-lose')
	}
	return cls
}

// ---------- 时间轴过滤（年份 + 窗口已补齐样本） ----------
const yearFilter = ref<number | null>(null)
const yearList = computed(() => {
	const ys = new Set((board.value?.Events ?? []).map(e => dayjs(e.EventDate).year()))
	return Array.from(ys).sort((a, b) => b - a)
})
const timelineEvents = computed(() => (board.value?.Events ?? []).filter(ev => {
	if (yearFilter.value !== null && dayjs(ev.EventDate).year() !== yearFilter.value) return false
	if (winFilter.value !== null) {
		const e = excOf(ev, winFilter.value)
		if (e === undefined || e === null) return false
	}
	return true
}))

// 事件链子公告折叠展开态（按事件 Id 数组）
const openSubs = ref<number[]>([])
function toggleSubs(id: number) {
	const i = openSubs.value.indexOf(id)
	if (i >= 0) openSubs.value.splice(i, 1)
	else openSubs.value.push(id)
}

// ---------- 交互 ----------
function onChip(sub: number | null) {
	subFilter.value = sub
	pageIndex.value = 1
	if (view.value === 'flow') loadFlow()
	else loadBoard()
}

// 流水视图关键事件行点击[回测]：切到回测视图并定位该子类
function toBoard(sub?: number) {
	if (view.value === 'board') return
	if (sub && ZDX_EVENT_SUB_CATEGORIES.some(c => c.value === sub)) subFilter.value = sub
	view.value = 'board'
}

function onFocusEvent(ev: IZdxStockEvent) {
	emit('focus-event', { date: fmtDate(ev.BaseTradeDate), direction: ev.Direction, title: ev.Title })
}

function onReviewQuote(ev: IZdxStockEvent) {
	const parts = parseKeyParams(ev.KeyParams)
	emit('review-quote', {
		title: ev.Title,
		url: ev.Url ?? '',
		date: fmtDate(ev.EventDate),
		trend: `T+5 ${fmtPct(ev.Abs5)} | T+20 ${fmtPct(ev.Abs20)} | T+60 ${fmtPct(ev.Abs60)}`,
		exc20: `T+20超额 ${fmtPct(ev.Exc20)}（跑赢上证口径）`,
		core: parts.length ? `核心数据：${parts.join('，')}` : '',
		linkages: (ev.Linkages ?? []).map(l => l.Text)
	})
}

function openUrl(url?: string | null) {
	if (url) window.open(url, '_blank')
}

// ---------- 展示工具（涨红跌绿，A股习惯；空值 --） ----------
function kpAll(ev: IZdxStockEvent) {
	return parseKeyParams(ev.KeyParams)
}
// 核心金额/首个实体片段（标题行前置）；其余片段留在 kp-chip 行
function coreKp(ev: IZdxStockEvent) {
	return kpAll(ev)[0] ?? ''
}
function restKp(ev: IZdxStockEvent) {
	return kpAll(ev).slice(1)
}
function fmtPct(v?: number | null) {
	if (v === undefined || v === null) return '--'
	return (v > 0 ? '+' : '') + v + '%'
}
function valClass(v?: number | null) {
	if (v === undefined || v === null) return ''
	return v > 0 ? 'up' : v < 0 ? 'down' : ''
}
// 胜率 >50% 红、<50% 绿（沿用全站涨红跌绿语义；恰好 50% 中性；不可信样本显示 -- 不着色）
function winRateClass(w: IZdxEventWindowStat) {
	if (!w.Reliable || w.WinRate === undefined || w.WinRate === null) return 'unreliable-cell'
	return w.WinRate > 50 ? 'up' : w.WinRate < 50 ? 'down' : ''
}
// 联动条目 Tag 配色：正向兑现类红 / 负向类绿 / 顺势追高橙 / 中性过程蓝
function lkClass(lk: IZdxEventLinkage) {
	if (lk.Tag === '吃满红利' || lk.Tag === '左侧埋伏') return 'lk-good'
	if (lk.Tag === '未及时止损' || lk.Tag === '过早兑现') return 'lk-bad'
	if (lk.Tag === '右侧顺势跟进') return 'lk-chase'
	return 'lk-neutral'
}
// Sparkline：T+0..T+20 收益折线（首个 null 截断；<2 点不画；末值正红负绿）
function spark(ev: IZdxStockEvent) {
	const nums: number[] = []
	for (const v of ev.Series ?? []) {
		if (v === null || v === undefined) break
		nums.push(v)
	}
	if (nums.length < 2) return null
	const w = 150
	const h = 40
	const pad = 4
	const min = Math.min(...nums, 0)
	const max = Math.max(...nums, 0)
	const span = max - min || 1
	const pts = nums
		.map((v, i) => `${(pad + (i * (w - 2 * pad)) / (nums.length - 1)).toFixed(1)},${(pad + ((max - v) * (h - 2 * pad)) / span).toFixed(1)}`)
		.join(' ')
	const zeroY = (pad + (max * (h - 2 * pad)) / span).toFixed(1)
	return { w, h, pts, zeroY, color: nums[nums.length - 1] >= 0 ? 'var(--el-color-danger)' : 'var(--el-color-success)' }
}
// 方向底色：利好微红/利空微绿（公告卡片背景，非文字涨跌色）
function dirClass(direction?: number) {
	if (direction === 1) return 'dir-good'
	if (direction === 2) return 'dir-bad'
	return ''
}
function directionLabel(d: number) {
	return ZDX_NEWS_DIRECTIONS.find(e => e.value === d)?.label ?? ''
}
function directionTag(d: number) {
	return ZDX_NEWS_DIRECTIONS.find(e => e.value === d)?.tag ?? 'info'
}
function subLabelOf(sub: number) {
	return eventSubLabel(sub)
}
function fmtDate(v?: string | null) {
	return v ? dayjs(v).format('YYYY-MM-DD') : ''
}

// ---------- 联动加载 ----------
watch(view, v => {
	emit('view-change', v)
	if (v === 'board') {
		// 回测视图必须有具体子类；"全部"进入时落到事件最多子类并同步 chips 选中态
		if (subFilter.value === null) subFilter.value = topSub()
		if (!board.value) loadBoard()
	} else {
		loadFlow()
	}
})
watch(() => props.code, () => {
	pageIndex.value = 1
	board.value = null
	subCounts.value = []
	yearFilter.value = null
	winFilter.value = null
	hoverWin.value = null
	loadSubCounts().then(() => {
		if (view.value === 'flow') loadFlow()
		else loadBoard()
	})
})

loadSubCounts().then(() => {
	if (view.value === 'board') {
		subFilter.value = topSub()
		loadBoard()
	} else {
		loadFlow()
	}
})
// 初始视图上报（默认事件回测：宿主吸顶联动栏条件依赖）
emit('view-change', view.value)
</script>

<style lang="scss" scoped>
.stock-events {
	padding: 12px 20px 20px;

	.up {
		color: var(--el-color-danger);
	}

	.down {
		color: var(--el-color-success);
	}

	.se-skeleton {
		padding: 16px 4px;
	}

	.se-head {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
		padding-bottom: 12px;

		.se-chips {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;

			.se-chip {
				padding: 2px 10px;
				border-radius: 12px;
				font-size: 12px;
				color: #606266;
				background: #f5f6fb;
				cursor: pointer;
				transition: all 0.2s;

				&:hover {
					color: #409eff;
				}

				&.active {
					color: #fff;
					background: #409eff;
				}

				.chip-hot {
					margin-left: 3px;
					font-size: 11px;
					color: #e6a23c; // 火苗角标固定橙色（chips 选中态白底时不随文字变色）
					vertical-align: -1px;
				}
			}
		}
	}

	// 卡片淡入动效（视图/子类切换降噪）
	.tlfade-enter-active {
		transition: opacity 0.25s ease, transform 0.25s ease;
	}

	.tlfade-enter-from {
		opacity: 0;
		transform: translateY(6px);
	}

	// ---------- 公告流水 ----------
	.se-flow {
		min-height: 120px;

		.flow-card {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 10px;
			padding: 10px 14px;
			margin-bottom: 10px;
			border: 2px solid #e6e8f0;
			border-radius: 8px;

			&.dir-good {
				border-color: rgba(245, 108, 108, 0.5);
				background: rgba(245, 108, 108, 0.05);
			}

			&.dir-bad {
				border-color: rgba(103, 194, 58, 0.5);
				background: rgba(103, 194, 58, 0.05);
			}

			.flow-card-main {
				flex: 1;
				min-width: 0;
				cursor: pointer;

				.flow-title {
					font-size: 14px;
					font-weight: 600;
					color: #2e3543;
					line-height: 22px;

					.flow-sub {
						display: inline-block;
						margin-right: 8px;
						padding: 0 6px;
						border-radius: 3px;
						font-size: 12px;
						font-weight: 400;
						color: #fff;
						background: #e6a23c;
					}
				}

				.flow-meta {
					display: flex;
					align-items: center;
					flex-wrap: wrap;
					gap: 8px;
					margin-top: 6px;
					font-size: 12px;
					color: #a7abba;

					.sum-tag {
						max-width: 60%;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
				}
			}
		}

		.flow-normal {
			margin: 6px 0 12px;

			.normal-toggle {
				display: inline-block;
				font-size: 12px;
				color: #909399;
				cursor: pointer;
				padding: 4px 0;

				&:hover {
					color: #409eff;
				}
			}

			.normal-item {
				display: flex;
				justify-content: space-between;
				gap: 12px;
				padding: 6px 0;
				border-bottom: 1px solid #f5f6fb;
				cursor: pointer;
				font-size: 13px;

				.normal-title {
					flex: 1;
					min-width: 0;
					color: #606266;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.normal-date {
					color: #a7abba;
					font-size: 12px;
					flex-shrink: 0;
				}

				&:hover .normal-title {
					color: #409eff;
				}
			}
		}
	}

	// ---------- 事件回测 ----------
	.se-board {
		min-height: 160px;

		// 分红走势与同业位置卡（行式白卡 + 分红金主题色对 #fdf6ec/#b88230，沿用全站徽标体系）
		.div-card {
			background: #fff;
			border: 1px solid #f3e6d8;
			border-radius: 8px;
			padding: 8px 12px;
			margin: 10px 0 12px;

			.div-head {
				display: flex;
				align-items: center;
				gap: 8px;
				font-size: 13px;
				font-weight: 600;
				color: #3a4150;
			}

			.div-sector {
				font-size: 11px;
				font-weight: 400;
				color: #b88230;
				background: #fdf6ec;
				border-radius: 4px;
				padding: 1px 6px;
			}

			.div-line-chart {
				width: 100%;
				height: 150px;
				margin: 8px 0 2px;
			}

			.div-body {
				display: flex;
				gap: 18px;
				flex-wrap: wrap;
				align-items: flex-start;
				margin: 8px 0 2px;

				.div-left { flex: 1 1 240px; min-width: 220px; }
				.div-right { flex: 1 1 240px; min-width: 220px; }
			}

			.div-block-label {
				font-size: 11px;
				color: #98a0ad;
				margin-bottom: 6px;
			}

			.div-water-sector {
				margin-left: 6px;
				font-size: 10px;
				color: #b88230;
				background: #fdf6ec;
				border-radius: 4px;
				padding: 0 5px;
			}

			.div-water {
				.div-water-track {
					position: relative;
					height: 12px;
					border-radius: 6px;
					background: #f2f3f5;
				}

				.div-water-fill {
					position: absolute;
					left: 0;
					top: 0;
					bottom: 0;
					border-radius: 6px;
					background: linear-gradient(90deg, #f3c27a, #e6a23c);
				}

				.div-water-median {
					position: absolute;
					top: -3px;
					bottom: -3px;
					width: 2px;
					background: #98a0ad;
					transform: translateX(-1px);
				}

				.div-water-dot {
					position: absolute;
					top: 50%;
					width: 12px;
					height: 12px;
					border-radius: 50%;
					background: #b88230;
					border: 2px solid #fff;
					transform: translate(-50%, -50%);
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
				}

				// 高于中位：整条转绿（水位填充 + 本股圆点）
				&.up {
					.div-water-fill {
						background: linear-gradient(90deg, #b3e19d, #67c23a);
					}

					.div-water-dot {
						background: #529b2e;
					}
				}

				// 低于中位：整条转红（水位填充 + 本股圆点）
				&.down {
					.div-water-fill {
						background: linear-gradient(90deg, #fab6b6, #f56c6c);
					}

					.div-water-dot {
						background: #d94a4a;
					}
				}

				.div-water-scale {
					display: flex;
					justify-content: space-between;
					font-size: 10px;
					color: #98a0ad;
					margin-top: 4px;
				}
			}

			.div-water-legend {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 6px;
				margin-top: 8px;
				font-size: 12px;
				color: #5c6470;

				.div-water-self b {
					font-weight: 700;
					color: #b88230;
					font-variant-numeric: tabular-nums;
				}

				.div-water-self.up b {
					color: #529b2e;
				}

				.div-water-self.down b {
					color: #d94a4a;
				}

				.div-water-tone-chip {
					font-size: 11px;
					border-radius: 4px;
					padding: 1px 6px;
					font-weight: 600;

					&.up {
						color: #529b2e;
						background: #f0f9eb;
					}

					&.down {
						color: #d94a4a;
						background: #fef0f0;
					}
				}

				.div-water-median-txt {
					font-size: 11px;
					color: #98a0ad;
				}
			}

			.div-peer-chip {
				font-size: 11px;
				color: #b88230;
				background: #fdf6ec;
				border-radius: 4px;
				padding: 1px 6px;
			}

			.div-peer-none {
				color: #98a0ad;
				font-size: 12px;
			}
		}

		.board-warn {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 8px 12px;
			margin-bottom: 10px;
			border-radius: 6px;
			font-size: 12px;
			color: #b88230;
			background: rgba(230, 162, 60, 0.1);
		}

		.board-title {
			font-size: 14px;
			font-weight: 600;
			color: #303133;
			margin: 14px 0 8px;

			.board-sub {
				margin-left: 8px;
				font-size: 12px;
				font-weight: 400;
				color: #a7abba;
			}

			.tl-filter-on {
				margin-left: 10px;
				padding: 1px 8px;
				border-radius: 10px;
				font-size: 12px;
				font-weight: 400;
				color: #409eff;
				background: rgba(64, 158, 255, 0.1);
				cursor: pointer;
			}
		}

		.board-table {
			width: 100%;
			border-collapse: collapse;
			font-size: 13px;

			th,
			td {
				border: 1px solid #f0f1f6;
				padding: 8px 10px;
				text-align: center;
			}

			th {
				background: #fafbfe;
				color: #606266;
				font-weight: 500;

				.th-tip {
					color: #a7abba;
					font-weight: 400;
					font-size: 12px;
				}
			}

			.win-row {
				cursor: pointer;
				transition: background 0.15s;

				&:hover td {
					background: #f3f7ff;
				}

				&.win-on td {
					background: rgba(64, 158, 255, 0.12);
				}
			}

			.win-sample {
				color: #a7abba;
				font-size: 12px;
			}

			.unreliable {
				margin-left: 4px;
				font-size: 11px;
				color: #a7abba;
			}

			.unreliable-cell {
				color: #c0c4cc;
			}

			.advice-cell {
				max-width: 220px;

				.advice-text {
					color: var(--el-color-danger);
					font-weight: 600;
				}

				.advice-none {
					color: #a7abba;
				}
			}
		}

		.board-tip {
			margin-top: 6px;
			font-size: 11px;
			color: #c0c4cc;
		}

		.year-bar {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
			margin-bottom: 8px;

			.se-chip {
				padding: 2px 10px;
				border-radius: 12px;
				font-size: 12px;
				color: #606266;
				background: #f5f6fb;
				cursor: pointer;
				transition: all 0.2s;

				&:hover {
					color: #409eff;
				}

				&.active {
					color: #fff;
					background: #409eff;
				}
			}
		}

		.timeline-title {
			margin-top: 18px;
		}

		.board-empty {
			padding: 24px 0;
			text-align: center;
			font-size: 13px;
			color: #a7abba;
		}

		.tl-item {
			display: flex;
			gap: 10px;

			.tl-node {
				display: flex;
				flex-direction: column;
				align-items: center;
				width: 84px;
				flex-shrink: 0;

				.tl-dot {
					width: 12px;
					height: 12px;
					margin-top: 14px;
					border-radius: 50%;
					border: 3px solid #c0c4cc;
					background: #fff;

					&.dir-good {
						border-color: var(--el-color-danger);
					}

					&.dir-bad {
						border-color: var(--el-color-success);
					}
				}

				.tl-date {
					margin-top: 4px;
					font-size: 12px;
					color: #909399;
				}

				&::after {
					content: '';
					flex: 1;
					width: 2px;
					background: #f0f1f6;
				}
			}

			.tl-card {
				flex: 1;
				min-width: 0;
				margin-bottom: 12px;
				padding: 10px 14px;
				border: 1px solid #ebeef5;
				border-radius: 8px;
				transition: opacity 0.2s, box-shadow 0.2s;

				&.dir-good {
					background: rgba(245, 108, 108, 0.04);
				}

				&.dir-bad {
					background: rgba(103, 194, 58, 0.04);
				}

				// 看板行悬停联动：跑赢高亮描边、跑不赢/缺值淡化
				&.tl-win {
					box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.35);
				}

				&.tl-lose {
					opacity: 0.45;
				}

				&.tl-faded {
					opacity: 0.3;
				}

				.tl-head {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 8px;

					.tl-strength {
						flex: 1;
						min-width: 0;
						display: flex;
						align-items: center;
						flex-wrap: wrap;
						gap: 6px;

						.tl-date-big {
							font-size: 14px;
							font-weight: 600;
							color: #2e3543;
						}

						.tl-tag-chip {
							padding: 1px 8px;
							border-radius: 4px;
							font-size: 12px;
							color: #fff;
							background: #409eff;
						}

						.tl-core {
							font-size: 13px;
							font-weight: 600;
							color: #b88230;
						}
					}
				}

				.tl-title {
					margin-top: 4px;
					font-size: 13px;
					color: #606266;
					line-height: 20px;
					cursor: pointer;

					&:hover {
						color: #409eff;
					}
				}

				// 回购点位内嵌块（价格/金额/占比/已回购 chips；未完成高亮琥珀左边框）
				.bb-points {
					margin-top: 8px;
					padding: 8px 10px;
					border-radius: 6px;
					background: #f7f8fa;
					border-left: 3px solid #dcdfe6;

					&.ongoing {
						background: #fdf6ec;
						border-left-color: #e6a23c;
					}

					.bb-head {
						display: flex;
						align-items: center;
						gap: 6px;
						font-size: 12px;
						color: #5c6470;

						svg {
							width: 11px;
							height: 11px;
							color: #b88230;
						}

						.bb-label {
							font-weight: 600;
							color: #3a4150;
						}

						.bb-status {
							margin-left: auto;
							font-size: 11px;
							border-radius: 4px;
							padding: 1px 6px;

							&.on {
								color: #b88230;
								background: #faecd8;
								font-weight: 600;
							}

							&.done {
								color: #909399;
								background: #eef0f3;
							}
						}
					}

					.bb-chips {
						display: flex;
						flex-wrap: wrap;
						gap: 6px;
						margin-top: 6px;

						.bb-chip {
							padding: 1px 8px;
							border-radius: 4px;
							font-size: 12px;
							color: #5c6470;
							background: #fff;
							border: 1px solid #ebeef5;
							font-variant-numeric: tabular-nums;

							&:first-child {
								color: #b88230;
								border-color: #f3e6d8;
							}
						}
					}

					.bb-win {
						margin-top: 5px;
						font-size: 11px;
						color: #98a0ad;
					}
				}

				.tl-kp {
					display: flex;
					flex-wrap: wrap;
					gap: 6px;
					margin-top: 6px;

					.kp-chip {
						padding: 1px 8px;
						border-radius: 4px;
						font-size: 12px;
						color: #b88230;
						background: rgba(230, 162, 60, 0.12);
					}
				}

				.tl-subs {
					margin-top: 6px;

					.subs-toggle {
						display: inline-block;
						font-size: 12px;
						color: #909399;
						cursor: pointer;

						&:hover {
							color: #409eff;
						}
					}

					.subs-list {
						margin-top: 4px;
						padding: 4px 10px;
						border-radius: 6px;
						background: #f7f8fc;

						.subs-item {
							display: flex;
							gap: 10px;
							padding: 3px 0;
							font-size: 12px;
							cursor: pointer;

							.subs-date {
								flex-shrink: 0;
								color: #a7abba;
							}

							.subs-title {
								flex: 1;
								min-width: 0;
								color: #606266;
								white-space: nowrap;
								overflow: hidden;
								text-overflow: ellipsis;
							}

							&:hover .subs-title {
								color: #409eff;
							}
						}
					}
				}

				.tl-trend {
					display: flex;
					align-items: flex-end;
					flex-wrap: wrap;
					gap: 8px;
					margin-top: 8px;
					font-size: 13px;

					.trend-label {
						font-size: 12px;
						color: #a7abba;
					}

					.tl-badge {
						display: flex;
						flex-direction: column;
						align-items: center;
						min-width: 84px;
						padding: 3px 8px;
						border-radius: 6px;
						border: 1px solid #f0f1f6;
						background: #fafbfe;

						.badge-main {
							font-size: 13px;
							font-weight: 600;
							line-height: 18px;
						}

						.badge-exc {
							font-size: 11px;
							line-height: 14px;
							color: #a7abba;
						}

						// 徽章主数字沿用全局红绿（绝对收益口径）
						&.up .badge-main {
							color: var(--el-color-danger);
						}

						&.down .badge-main {
							color: var(--el-color-success);
						}
					}

					.tl-spark {
						margin-left: 4px;
						flex-shrink: 0;
					}
				}

				// 联动 Callout：左侧蓝色竖条提示块 + Tag 徽标 + 文案行
				.tl-link {
					margin-top: 8px;
					padding: 6px 10px 6px 12px;
					border-radius: 0 6px 6px 0;
					border-left: 3px solid #409eff;
					font-size: 12px;
					line-height: 20px;
					background: rgba(64, 158, 255, 0.06);

					.link-head {
						color: #3a76c4;
						font-weight: 600;
						margin-bottom: 2px;
					}

					.link-row {
						display: flex;
						align-items: baseline;
						flex-wrap: wrap;
						gap: 6px;
						margin-top: 3px;

						.link-tag {
							flex-shrink: 0;
							padding: 0 6px;
							border-radius: 3px;
							font-size: 11px;
							color: #fff;
							background: #909399;

							&.lk-good {
								background: var(--el-color-danger);
							}

							&.lk-bad {
								background: var(--el-color-success);
							}

							&.lk-chase {
								background: #e6a23c;
							}

							&.lk-neutral {
								background: #409eff;
							}
						}

						.link-text {
							flex: 1;
							min-width: 0;
							color: #2e3543;
						}
					}
				}

				.tl-ops {
					margin-top: 4px;
					text-align: right;
				}
			}
		}
	}
}
</style>
