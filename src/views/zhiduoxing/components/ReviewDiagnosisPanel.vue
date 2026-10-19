<template>
	<div class="rdp-wrap">
		<!-- 左 2/3：改进方向清单（判断力/执行力/绩效退化 分组，红橙蓝分级，每条 = 问题 + 证据 + 动作 + 跳转） -->
		<div class="rdp-left">
			<div class="rdp-left-head">
				<span class="rdp-mini-ico tone-violet"><font-awesome-icon fas icon="stethoscope"></font-awesome-icon></span>
				<b>改进方向</b>
				<span class="rdp-note">问题 → 证据 → 动作，点击直达对应台账</span>
			</div>
			<div v-loading="loading" class="rdp-groups">
				<el-empty v-if="!loading && !diagnosis?.Issues?.length" description="暂无诊断问题，策略运行健康" :image-size="70"></el-empty>
				<template v-for="group in issueGroups" :key="group.key">
					<div v-if="group.items.length" class="rdp-group">
						<div class="rdp-group-head">
							<font-awesome-icon fas :icon="group.icon" class="rdp-group-ico" :style="{ color: group.color }"></font-awesome-icon>
							<span class="rdp-group-name" :style="{ color: group.color }">{{ group.name }}</span>
							<span class="rdp-group-count">{{ group.items.length }}</span>
						</div>
						<div v-for="(issue, i) in group.items" :key="issue.RuleKey || i" class="rdp-issue" :class="['sev-' + issue.Severity, { 'is-resolved': issue.Status === 3 }]">
							<div class="rdp-issue-main">
								<div class="rdp-issue-title">
									<span>{{ issue.Title }}</span>
									<span v-if="issue.RuleKey" class="rdp-status" :class="'st-' + issue.Status">{{ statusText(issue.Status) }}</span>
								</div>
								<div class="rdp-issue-evidence">{{ issue.Evidence }}</div>
								<div v-if="issue.RuleKey" class="rdp-issue-regression">
									<font-awesome-icon fas icon="arrows-rotate"></font-awesome-icon>
									<span>{{ regressionText(issue) }}</span>
								</div>
								<div class="rdp-issue-action">
									<font-awesome-icon fas icon="arrow-right"></font-awesome-icon>
									<span>{{ issue.Action }}</span>
								</div>
							</div>
							<el-button v-if="issue.LinkTarget" size="small" text type="primary" class="rdp-issue-link" @click="navigate(issue.LinkTarget)">去看</el-button>
							<el-button v-if="issue.RuleKey && issue.Status !== 3" size="small" text type="warning" class="rdp-issue-link" @click="linkStrategy(issue)">定为策略目标</el-button>
						</div>
					</div>
				</template>
			</div>
		</div>

		<!-- 右 1/3：流派契合徽章 + 今日待办 + KPI 周趋势 -->
		<div class="rdp-right">
			<!-- 流派契合徽章（数据由父组件拉取一次，复盘中心与流派契合 Tab 共用） -->
			<div class="rdp-badge" :class="badgeTone" @click="navigate('tab-school')">
				<div class="rdp-badge-score">
					<span class="rdp-badge-num">{{ alignScore }}</span>
					<span class="rdp-badge-unit">分</span>
				</div>
				<div class="rdp-badge-info">
					<span class="rdp-badge-label">流派契合</span>
					<span class="rdp-badge-name">{{ schoolAlign?.CurrentSchoolName || '未评定流派' }}</span>
					<span v-if="schoolAlign?.HasData" class="rdp-badge-sub" :class="badgeTone">{{ badgeText }}</span>
					<span v-else class="rdp-badge-sub muted">{{ schoolAlign ? '近期无成交数据' : '加载中…' }}</span>
				</div>
				<font-awesome-icon fas icon="angle-right" class="rdp-badge-arrow"></font-awesome-icon>
			</div>

			<!-- 进行中策略迷你卡（交易策略页联动：有进行中策略才显示，点击跳策略页） -->
			<div v-if="activeStrategy" class="rdp-strategy" @click="gotoStrategy()">
				<span class="rdp-mini-ico tone-violet"><font-awesome-icon fas icon="bullseye"></font-awesome-icon></span>
				<div class="rdp-strategy-info">
					<span class="rdp-strategy-label muted">进行中策略</span>
					<span class="rdp-strategy-name" :title="activeStrategy.Name">{{ activeStrategy.Name }}</span>
					<span class="rdp-strategy-sub muted">当前第 {{ activeStrategy.CurrentMinorNo }} 小周期 · 距下个大验证 {{ activeStrategy.NextMajorInDays }} 天</span>
				</div>
				<span v-if="activeStrategy.LastMajorVerdict" class="rdp-strategy-verdict" :class="'vd-' + activeStrategy.LastMajorVerdict">{{ verdictText(activeStrategy.LastMajorVerdict) }}</span>
				<font-awesome-icon fas icon="angle-right" class="rdp-badge-arrow"></font-awesome-icon>
			</div>

			<!-- 今日待办 -->
			<div class="rdp-todo">
				<div class="rdp-todo-head">
					<span class="rdp-mini-ico tone-orange"><font-awesome-icon fas icon="list-check"></font-awesome-icon></span>
					<b>今日待办</b>
					<span class="rdp-todo-count">{{ diagnosis?.Todos?.length ?? 0 }}</span>
				</div>
				<div class="rdp-todo-list">
					<div v-for="(todo, i) in diagnosis?.Todos ?? []" :key="i" class="rdp-todo-item" :class="{ 'is-link': isTodoLink(todo) }" @click="openTodo(todo)">
						<font-awesome-icon fas :icon="todoIcon(todo.Type)" class="rdp-todo-ico"></font-awesome-icon>
						<span class="rdp-todo-text" :title="todo.Text">{{ todo.Text }}</span>
					</div>
					<span v-if="!loading && !(diagnosis?.Todos ?? []).length" class="rdp-todo-empty muted">今日无待办</span>
				</div>
			</div>

			<!-- 核心 KPI 趋势迷你折线（按流派小验证周期分桶，近 8 桶 + 桶环比；含成交频率线） -->
			<div class="rdp-kpi">
				<div class="rdp-kpi-head">
					<span class="rdp-mini-ico tone-blue"><font-awesome-icon fas icon="chart-line"></font-awesome-icon></span>
					<b>核心 KPI 趋势</b>
					<span class="rdp-kpi-bucket muted">{{ bucketLabel }}</span>
					<span class="rdp-kpi-deltas">
						<span v-if="delta.win !== null" class="rdp-delta" :class="delta.win >= 0 ? 'c-green' : 'c-red'">胜率 {{ delta.win >= 0 ? '↑' : '↓' }}{{ Math.abs(delta.win).toFixed(0) }}pp</span>
						<span v-if="delta.hit !== null" class="rdp-delta" :class="delta.hit >= 0 ? 'c-green' : 'c-red'">命中 {{ delta.hit >= 0 ? '↑' : '↓' }}{{ Math.abs(delta.hit).toFixed(0) }}pp</span>
						<span v-if="delta.exp !== null" class="rdp-delta" :class="delta.exp >= 0 ? 'c-red' : 'c-green'">期望 {{ delta.exp >= 0 ? '↑' : '↓' }}{{ Math.abs(delta.exp).toFixed(0) }}</span>
						<span v-if="delta.trades !== null" class="rdp-delta muted">成交 {{ delta.trades >= 0 ? '↑' : '↓' }}{{ Math.abs(delta.trades).toFixed(0) }}笔</span>
						<span v-if="delta.feeEr !== null" class="rdp-delta" :class="delta.feeEr <= 0 ? 'c-green' : 'c-red'">费用侵蚀 {{ delta.feeEr >= 0 ? '↑' : '↓' }}{{ Math.abs(delta.feeEr).toFixed(1) }}pp</span>
					</span>
				</div>
				<div v-if="hasTrend" ref="kpiRef" class="rdp-kpi-chart"></div>
				<div v-else class="rdp-kpi-empty muted">{{ loading ? '加载中…' : '暂无已了结交易，无法生成趋势' }}</div>
			</div>
		</div>

		<!-- AI 策略周报（跨两列全宽；诊断聚合数据提交 DeepSeek：本周策略归因 + 下周调整建议，落库缓存） -->
		<div class="rdp-ai">
			<div class="rdp-ai-head">
				<span class="rdp-mini-ico tone-violet"><font-awesome-icon fas icon="wand-magic-sparkles"></font-awesome-icon></span>
				<b><span class="rdp-ai-title">AI 策略周报</span></b>
				<span class="rdp-ai-note">
					<template v-if="aiData">本周策略归因与下周调整建议 · 生成于 {{ dayjs(aiData.GeneratedAt).format('MM-DD HH:mm') }}</template>
					<template v-else>由 AI 结合 KPI 周趋势、问题清单与今日待办生成</template>
				</span>
				<el-button size="small" type="primary" plain :loading="aiLoading" @click="genAi">{{ aiLoading ? '生成中…' : aiData ? '重新生成' : '生成周报' }}</el-button>
			</div>
			<div v-if="aiData" class="rdp-ai-text">
				<div v-for="(line, i) in aiLines" :key="i" class="rdp-ai-line" :class="{ 'is-head': line.isHead, 'is-foot': line.isFoot }">{{ line.text }}</div>
			</div>
			<div v-else-if="aiLoading" class="rdp-ai-empty muted">AI 正在生成策略周报，约需 10~30 秒，请稍候…</div>
			<div v-else class="rdp-ai-empty muted">点击“生成周报”，AI 将输出本周策略归因与下周调整建议（生成后落库缓存，随时可重新生成）</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { dayjs, ElMessage } from 'element-plus'
import { IZdxStrategyDiagnosis, IZdxStrategyIssue, IZdxReviewTodo, IZdxStrategyAi } from '@/interfaces/zhiduoxing/IZdxStockReview'
import { IZdxUserStrategy, ZDX_VERIFY_VERDICTS } from '@/interfaces/zhiduoxing/IZdxUserStrategy'
import { IZdxSchoolAlignment } from '@/interfaces/zhiduoxing/IZdxMyTrade'
import zdxApi from '@/apis/zdx-api'

// 策略诊断带（复盘中心常驻顶部）：改进方向清单 + 流派契合徽章 + 今日待办 + KPI 周趋势
// 流派契合数据由父组件拉取一次传入（复盘中心与流派契合 Tab 共用），本组件只负责展示与跳转
const props = defineProps<{
	schoolAlign?: IZdxSchoolAlignment | null
}>()

const emit = defineEmits<{
	(e: 'navigate', target: string): void
	(e: 'open-review', v: { code: string; name: string }): void
}>()

const loading = ref(false)
const diagnosis = ref<IZdxStrategyDiagnosis | null>(null)
const router = useRouter()

// 分组展示定义（按后端 Group 键聚合；风格风险/流派契合由其他数据合成，不在本接口输出）
const ISSUE_GROUPS: { key: string; name: string; icon: string; color: string }[] = [
	{ key: 'judgement', name: '判断力', icon: 'crosshairs', color: '#7c5cf0' },
	{ key: 'execution', name: '执行力', icon: 'bolt', color: '#e6a23c' },
	{ key: 'performance', name: '绩效退化', icon: 'chart-line', color: '#f56c6c' }
]

const issueGroups = computed(() =>
	ISSUE_GROUPS.map(g => ({
		...g,
		items: (diagnosis.value?.Issues ?? []).filter((e: IZdxStrategyIssue) => e.Group === g.key)
	}))
)

// ---------- 流派契合徽章 ----------
const alignScore = computed(() => {
	const v = props.schoolAlign?.Overall
	return v !== null && v !== undefined ? Number(v).toFixed(0) : '--'
})

// 契合色调（high 高度契合 / good 基本契合 / drift 偏离）
const badgeTone = computed(() => {
	const level = props.schoolAlign?.Level
	if (level === 'drift') return 'tone-drift'
	if (level === 'good') return 'tone-good'
	return 'tone-high'
})

const badgeText = computed(() => {
	const level = props.schoolAlign?.Level
	if (level === 'drift') return props.schoolAlign?.AiDiffers ? '偏离 · AI 判定更接近 ' + props.schoolAlign.AiJudgedSchoolName : '偏离流派要求'
	if (level === 'good') return '基本契合'
	return '高度契合'
})

// ---------- 今日待办 ----------
const TODO_ICONS: Record<string, string> = {
	forecast: 'bullseye',
	review: 'pen-to-square',
	long: 'flag',
	live: 'money-check-dollar'
}

function todoIcon(type: string) {
	return TODO_ICONS[type] ?? 'list-check'
}

// 待办是否可点击（review 类需有股票代码以跳转个股行情页复盘；其余有跳转目标切 Tab）
function isTodoLink(todo: IZdxReviewTodo) {
	return (todo.Type === 'review' && !!todo.StockCode) || !!todo.LinkTarget
}

// 待办点击：持仓未写复盘类跳转个股行情页复盘（不弹抽屉）；其余跳转对应台账 Tab
function openTodo(todo: IZdxReviewTodo) {
	if (todo.Type === 'review' && todo.StockCode) {
		emit('open-review', { code: todo.StockCode, name: todo.StockName ?? todo.StockCode })
		return
	}
	if (todo.LinkTarget) navigate(todo.LinkTarget)
}

// ---------- 问题台账回归状态 ----------
const STATUS_TEXT: Record<number, string> = { 1: '未改善', 2: '改善中', 3: '已解决', 4: '恶化' }

function statusText(status: number) {
	return STATUS_TEXT[status] ?? '未改善'
}

// 台账行回归文案：优先后端一句话评语，否则基线→当前 + 首次检出日期
function regressionText(issue: IZdxStrategyIssue) {
	const first = issue.FirstDetectedAt ? dayjs(issue.FirstDetectedAt).format('MM-DD') : ''
	if (issue.RegressionNote) {
		return first ? `${issue.RegressionNote}（首次检出 ${first}）` : issue.RegressionNote
	}
	const fmt = (v: number) => String(Math.round(Number(v) * 100) / 100)
	return `基线 ${fmt(issue.BaselineValue)} → 当前 ${fmt(issue.CurrentValue)}${first ? '（首次检出 ' + first + '）' : ''}`
}

// ---------- KPI 分桶趋势 ----------
const kpiRef = ref<HTMLElement>()
let kpiChart: echarts.ECharts | null = null

const hasTrend = computed(() => (diagnosis.value?.KpiTrend ?? []).length > 0)

// 分桶标签（桶天数=流派小验证周期；未评定回退 7 天周桶）
const bucketLabel = computed(() => `近 8 桶 · ${diagnosis.value?.KpiBucketDays ?? 7} 天/桶`)

// 最新桶环比（KpiDelta 在诊断 DTO 顶层）
const delta = computed(() => {
	const d = diagnosis.value?.KpiDelta
	return {
		win: d?.WinRate ?? null,
		hit: d?.HitRate ?? null,
		exp: d?.Expectancy ?? null,
		trades: d?.TradeCount ?? null,
		feeEr: d?.FeeErosion ?? null
	}
})

function renderKpi() {
	const trend = diagnosis.value?.KpiTrend ?? []
	if (!kpiRef.value || !trend.length) return
	if (!kpiChart) kpiChart = echarts.init(kpiRef.value)
	kpiChart.setOption(
		{
			grid: { left: 42, right: 42, top: 36, bottom: 22 },
			tooltip: { trigger: 'axis' },
			legend: { top: 2, itemWidth: 12, itemHeight: 8, textStyle: { fontSize: 11 } },
			xAxis: { type: 'category', data: trend.map(e => dayjs(e.WeekBegin).format('MM-DD')), axisLabel: { fontSize: 10 }, axisTick: { alignWithLabel: true } },
			yAxis: [
				{ type: 'value', min: 0, max: 100, axisLabel: { fontSize: 10, formatter: '{value}%' } },
				{ type: 'value', scale: true, axisLabel: { fontSize: 10 } }
			],
			series: [
				{ name: '胜率%', type: 'line', yAxisIndex: 0, smooth: true, symbolSize: 4, lineStyle: { width: 2 }, itemStyle: { color: '#f56c6c' }, data: trend.map(e => e.WinRate) },
				{ name: '命中率%', type: 'line', yAxisIndex: 0, smooth: true, symbolSize: 4, lineStyle: { width: 2 }, itemStyle: { color: '#409eff' }, data: trend.map(e => e.HitRate) },
				{ name: '费用侵蚀%', type: 'line', yAxisIndex: 0, smooth: true, symbolSize: 3, lineStyle: { width: 1.5, type: 'dotted' }, itemStyle: { color: '#e6a23c' }, data: trend.map(e => e.FeeErosion) },
				{ name: '期望值', type: 'line', yAxisIndex: 1, smooth: true, symbolSize: 3, lineStyle: { width: 1.5, type: 'dashed' }, itemStyle: { color: '#67c23a' }, data: trend.map(e => e.Expectancy) },
				{ name: '盈亏比', type: 'line', yAxisIndex: 1, smooth: true, symbolSize: 3, lineStyle: { width: 1.5, type: 'dotted' }, itemStyle: { color: '#909399' }, data: trend.map(e => e.ProfitLossRatio) },
				{ name: '成交笔数', type: 'bar', yAxisIndex: 1, barWidth: 10, itemStyle: { color: 'rgba(124, 92, 240, 0.35)', borderRadius: [3, 3, 0, 0] }, data: trend.map(e => e.TradeCount) }
			]
		},
		true
	)
	kpiChart.resize()
}

// ---------- AI 策略周报 ----------
const aiData = ref<IZdxStrategyAi | null>(null)
const aiLoading = ref(false)

// 正文按行渲染：一、二、… 小标题加粗（提升阅读层级）；免责声明弱化
const aiLines = computed(() =>
	(aiData.value?.Analysis ?? '').split('\n').map(t => ({
		text: t,
		isHead: /^[一二三四五六七八九十]+、/.test(t.trim()),
		isFoot: t.trim() === '不构成投资建议。'
	}))
)

// 加载已落库的周报（次级信息，失败静默不打断诊断带）
async function loadAi() {
	try {
		aiData.value = await zdxApi.getStrategyAi()
	} catch {
		aiData.value = null
	}
}

// 生成/重新生成（AI 耗时较长，按钮 loading 展示进度；成功/失败提示由拦截器统一弹出）
async function genAi() {
	if (aiLoading.value) return
	aiLoading.value = true
	try {
		const data = await zdxApi.genStrategyAi()
		if (data) aiData.value = data
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		aiLoading.value = false
	}
}

// ---------- 进行中策略迷你卡 / 定为策略目标 ----------
const activeStrategy = ref<IZdxUserStrategy | null>(null)

// 拉取进行中策略（只取最新一条；次级信息失败静默，不影响诊断带主体）
async function loadStrategy() {
	try {
		const list = await zdxApi.getUserStrategyList(1)
		activeStrategy.value = list.length ? list[list.length - 1] : null
	} catch {
		activeStrategy.value = null
	}
}

// 跳交易策略页（独立站上下文由路由守卫自动映射 /zdx/strategy）
function gotoStrategy(query?: Record<string, string>) {
	router.push({ name: 'ZdxPortalStrategy', query })
}

// 改进方向→策略目标：携带规则编码预填新增对话框
function linkStrategy(issue: IZdxStrategyIssue) {
	gotoStrategy({ link: issue.RuleKey })
}

function verdictText(verdict: string) {
	return ZDX_VERIFY_VERDICTS.find(e => e.value === verdict)?.label ?? verdict
}

// ---------- 加载与跳转 ----------
async function load() {
	loading.value = true
	try {
		diagnosis.value = await zdxApi.getStrategyDiagnosis()
		await nextTick(renderKpi)
	} catch (err: any) {
		diagnosis.value = null
		ElMessage.error(err?.message || '策略诊断加载失败')
	} finally {
		loading.value = false
	}
}

// 跳转目标（tab-forecast/tab-trade/tab-school → 父组件切换 Tab）
function navigate(target: string) {
	if (!target) return
	emit('navigate', target)
}

function handleResize() {
	kpiChart?.resize()
}

onMounted(() => {
	load()
	loadAi()
	loadStrategy()
	window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
	window.removeEventListener('resize', handleResize)
	kpiChart?.dispose()
	kpiChart = null
})

defineExpose({
	refresh: async () => {
		await Promise.all([load(), loadAi(), loadStrategy()])
	}
})
</script>

<style lang="scss" scoped>
.rdp-wrap {
	display: grid;
	grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
	gap: 16px;
	width: 100%;
}

.rdp-mini-ico {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 26px;
	height: 26px;
	flex: none;
	border-radius: 8px;
	font-size: 12px;

	&.tone-violet {
		color: #7c5cf0;
		background: rgba(124, 92, 240, 0.12);
	}

	&.tone-orange {
		color: #e6a23c;
		background: rgba(230, 162, 60, 0.14);
	}

	&.tone-blue {
		color: #409eff;
		background: rgba(64, 158, 255, 0.12);
	}
}

// ---------- 左 2/3：改进方向清单 ----------
.rdp-left {
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-width: 0;
	padding: 14px 16px;
	border-radius: 16px;
	background: #fff;
	border: 1px solid rgba(228, 233, 245, 0.9);
	box-shadow: 0 2px 12px rgba(31, 45, 61, 0.06);
}

.rdp-left-head {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	font-weight: 700;
	color: #303133;
}

.rdp-note {
	margin-left: auto;
	font-size: 12px;
	font-weight: 400;
	color: var(--el-text-color-secondary);
	white-space: nowrap;
}

.rdp-groups {
	display: flex;
	flex-direction: column;
	gap: 12px;
	min-height: 120px;
}

.rdp-group {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.rdp-group-head {
	display: flex;
	align-items: center;
	gap: 6px;
}

.rdp-group-ico {
	font-size: 13px;
}

.rdp-group-name {
	font-size: 13px;
	font-weight: 700;
}

.rdp-group-count {
	min-width: 18px;
	height: 18px;
	padding: 0 5px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	line-height: 18px;
	text-align: center;
	color: var(--el-text-color-secondary);
	background: var(--el-fill-color-lighter);
	font-variant-numeric: tabular-nums;
}

// 问题卡片：severity 左条（high 红 / mid 橙 / low 蓝）
.rdp-issue {
	display: flex;
	align-items: flex-start;
	gap: 10px;
	padding: 10px 12px 10px 14px;
	border-radius: 10px;
	background: #fafbfd;
	border: 1px solid rgba(228, 233, 245, 0.9);
	border-left: 3px solid transparent;

	&.sev-high {
		border-left-color: #f56c6c;
	}

	&.sev-mid {
		border-left-color: #e6a23c;
	}

	&.sev-low {
		border-left-color: #409eff;
	}

	// 已解决（台账归档行）弱化展示
	&.is-resolved {
		opacity: 0.72;
	}
}

// 回归状态徽标（1未改善灰 2改善中绿 3已解决蓝 4恶化红）
.rdp-status {
	margin-left: 6px;
	padding: 0 7px;
	border-radius: 999px;
	font-size: 10px;
	font-weight: 600;
	line-height: 16px;
	vertical-align: 2px;
	white-space: nowrap;

	&.st-1 {
		color: #909399;
		background: rgba(144, 147, 153, 0.12);
	}

	&.st-2 {
		color: #67c23a;
		background: rgba(103, 194, 58, 0.12);
	}

	&.st-3 {
		color: #409eff;
		background: rgba(64, 158, 255, 0.12);
	}

	&.st-4 {
		color: #f56c6c;
		background: rgba(245, 108, 108, 0.12);
	}
}

.rdp-issue-main {
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
	flex: 1;
}

.rdp-issue-title {
	font-size: 13px;
	font-weight: 700;
	color: #303133;
	line-height: 1.5;
}

.rdp-issue-evidence {
	font-size: 12px;
	color: var(--el-text-color-secondary);
	line-height: 1.6;
}

// 台账回归行（基线→当前/一句话评语）
.rdp-issue-regression {
	display: flex;
	align-items: flex-start;
	gap: 6px;
	font-size: 12px;
	color: #7c5cf0;
	line-height: 1.6;

	svg {
		margin-top: 4px;
		flex-shrink: 0;
	}
}

.rdp-issue-action {
	display: flex;
	align-items: flex-start;
	gap: 6px;
	font-size: 12px;
	color: var(--el-text-color-regular);
	line-height: 1.6;

	svg {
		margin-top: 4px;
		flex-shrink: 0;
		color: #7c5cf0;
	}
}

.rdp-issue-link {
	flex: none;
	margin-top: 2px;
}

// ---------- 右 1/3 ----------
.rdp-right {
	display: flex;
	flex-direction: column;
	gap: 14px;
	min-width: 0;
}

// 流派契合徽章（点击跳流派契合 Tab）
.rdp-badge {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
	border-radius: 14px;
	background: #fff;
	border: 1px solid rgba(228, 233, 245, 0.9);
	box-shadow: 0 2px 12px rgba(31, 45, 61, 0.06);
	cursor: pointer;
	transition: box-shadow 0.2s, transform 0.2s;

	&:hover {
		box-shadow: 0 6px 20px rgba(64, 158, 255, 0.14);
		transform: translateY(-1px);
	}

	&.tone-high .rdp-badge-score {
		color: #67c23a;
		background: rgba(103, 194, 58, 0.12);
	}

	&.tone-good .rdp-badge-score {
		color: #e6a23c;
		background: rgba(230, 162, 60, 0.14);
	}

	&.tone-drift .rdp-badge-score {
		color: #f56c6c;
		background: rgba(245, 108, 108, 0.12);
	}
}

.rdp-badge-score {
	display: flex;
	align-items: baseline;
	justify-content: center;
	flex: none;
	width: 58px;
	height: 58px;
	border-radius: 12px;
}

.rdp-badge-num {
	font-size: 22px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	line-height: 58px;
}

.rdp-badge-unit {
	font-size: 11px;
	opacity: 0.75;
}

.rdp-badge-info {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
	flex: 1;
}

.rdp-badge-label {
	font-size: 12px;
	color: var(--el-text-color-secondary);
}

.rdp-badge-name {
	font-size: 14px;
	font-weight: 700;
	color: #303133;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.rdp-badge-sub {
	font-size: 12px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;

	&.tone-high {
		color: #67c23a;
	}

	&.tone-good {
		color: #e6a23c;
	}

	&.tone-drift {
		color: #f56c6c;
	}
}

.rdp-badge-arrow {
	flex: none;
	font-size: 12px;
	color: var(--el-text-color-placeholder);
}

// 进行中策略迷你卡（点击跳交易策略页）
.rdp-strategy {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 16px;
	border-radius: 14px;
	background: #fff;
	border: 1px solid rgba(124, 92, 240, 0.25);
	box-shadow: 0 2px 12px rgba(31, 45, 61, 0.06);
	cursor: pointer;
	transition: box-shadow 0.2s, transform 0.2s;

	&:hover {
		box-shadow: 0 6px 20px rgba(124, 92, 240, 0.14);
		transform: translateY(-1px);
	}
}

.rdp-strategy-info {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
	flex: 1;
}

.rdp-strategy-name {
	font-size: 13px;
	font-weight: 700;
	color: #303133;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.rdp-strategy-sub {
	font-size: 11px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

// 最近大验证判定徽标（improved 绿 flat 灰 worse 红 deferred 橙）
.rdp-strategy-verdict {
	flex: none;
	padding: 0 8px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 600;
	line-height: 18px;
	white-space: nowrap;

	&.vd-improved {
		color: #67c23a;
		background: rgba(103, 194, 58, 0.12);
	}

	&.vd-flat {
		color: #909399;
		background: rgba(144, 147, 153, 0.12);
	}

	&.vd-worse {
		color: #f56c6c;
		background: rgba(245, 108, 108, 0.12);
	}

	&.vd-deferred {
		color: #e6a23c;
		background: rgba(230, 162, 60, 0.14);
	}
}

// 今日待办
.rdp-todo {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px 16px;
	border-radius: 14px;
	background: #fff;
	border: 1px solid rgba(228, 233, 245, 0.9);
	box-shadow: 0 2px 12px rgba(31, 45, 61, 0.06);
}

.rdp-todo-head {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
	font-weight: 700;
	color: #303133;
}

.rdp-todo-count {
	margin-left: auto;
	min-width: 20px;
	height: 20px;
	padding: 0 6px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	line-height: 20px;
	text-align: center;
	color: #fff;
	background: #e6a23c;
	font-variant-numeric: tabular-nums;
}

.rdp-todo-list {
	display: flex;
	flex-direction: column;
	gap: 6px;
	max-height: 132px;
	overflow-y: auto;
}

.rdp-todo-item {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	padding: 6px 10px;
	border-radius: 8px;
	background: #fafbfd;
	border: 1px solid rgba(228, 233, 245, 0.9);
	font-size: 12px;

	&.is-link {
		cursor: pointer;

		&:hover {
			border-color: #c6d4f5;
			background: #f5f8ff;
		}
	}
}

.rdp-todo-ico {
	margin-top: 2px;
	flex-shrink: 0;
	color: #e6a23c;
}

.rdp-todo-text {
	color: var(--el-text-color-regular);
	line-height: 1.55;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.rdp-todo-empty {
	font-size: 12px;
	padding: 6px 10px;
}

// KPI 周趋势
.rdp-kpi {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px 16px;
	border-radius: 14px;
	background: #fff;
	border: 1px solid rgba(228, 233, 245, 0.9);
	box-shadow: 0 2px 12px rgba(31, 45, 61, 0.06);
	flex: 1;
	min-height: 0;
}

.rdp-kpi-head {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
	font-weight: 700;
	color: #303133;
}

.rdp-kpi-deltas {
	margin-left: auto;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 4px 10px;
}

.rdp-kpi-bucket {
	font-size: 11px;
	font-weight: 400;
	white-space: nowrap;
}

.rdp-delta {
	font-size: 11px;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}

.rdp-kpi-chart {
	width: 100%;
	height: 168px;
	flex: 1;
	min-height: 0;
}

.rdp-kpi-empty {
	font-size: 12px;
	padding: 20px 0;
	text-align: center;
}

// ---------- AI 策略周报（跨两列全宽） ----------
.rdp-ai {
	display: flex;
	flex-direction: column;
	gap: 8px;
	grid-column: 1 / -1;
	min-width: 0;
	padding: 12px 16px;
	border-radius: 14px;
	background: #fff;
	border: 1px solid rgba(228, 233, 245, 0.9);
	box-shadow: 0 2px 12px rgba(31, 45, 61, 0.06);
}

.rdp-ai-head {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	row-gap: 8px;
	font-size: 13px;
	font-weight: 700;
	color: #303133;
}

.rdp-ai-title {
	white-space: nowrap;
}

.rdp-ai-note {
	min-width: 0;
	flex: 1;
	font-size: 12px;
	font-weight: 400;
	color: var(--el-text-color-secondary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.rdp-ai-text {
	font-size: 13px;
	color: var(--el-text-color-regular);
}

.rdp-ai-line {
	line-height: 1.8;
	word-break: break-word;

	&.is-head {
		margin-top: 10px;
		font-weight: 700;
		color: #303133;

		&:first-child {
			margin-top: 0;
		}
	}

	&.is-foot {
		margin-top: 10px;
		font-size: 12px;
		color: var(--el-text-color-placeholder);
	}
}

.rdp-ai-empty {
	padding: 16px 12px;
	font-size: 12px;
	text-align: center;
	border: 1px dashed #e3e9f5;
	border-radius: 10px;
	background: #fafcff;
}

// 智多星红涨绿跌体系
.c-red {
	color: var(--el-color-danger);
}

.c-green {
	color: var(--el-color-success);
}

.muted {
	color: var(--el-text-color-placeholder);
}

// 窄屏：纵向堆叠
@media (max-width: 1300px) {
	.rdp-wrap {
		grid-template-columns: minmax(0, 1fr);
	}
}
</style>
