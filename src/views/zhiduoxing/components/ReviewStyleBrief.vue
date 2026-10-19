<template>
	<div class="rsb-wrap">
		<!-- 口径说明（时间范围随全局时间线） -->
		<div class="rsb-bar">
			<span class="rsb-note">时间范围随全局时间线筛选 · 风格摘要复用交易画像口径 · 详情深链行为画像页</span>
		</div>

		<div v-loading="loading" class="rsb-body">
			<!-- 空态 -->
			<el-empty v-if="!loading && !stats?.HasData" description="暂无成交数据，无法生成风格摘要" :image-size="80"></el-empty>

			<template v-else-if="stats">
				<!-- 上排：六层风格一句话 + 八维雷达 -->
				<div class="rsb-top">
					<div class="rsb-style">
						<div class="rsb-style-head">
							<span class="rsb-sec-title"><font-awesome-icon fas icon="palette"></font-awesome-icon>风格定位</span>
						</div>
						<el-tooltip v-if="styleSummary" content="交易风格总结：由六层维度合成 - L1 持仓周期 × L2 交易频率 → 主风格；L3 盈亏结构 → 策略类型；L4 仓位 → 风险等级；L5 选股 → 标的偏好；L6 决策 → 执行方式" placement="top" effect="dark" :show-after="120">
							<span class="rsb-summary-chip">{{ styleSummary }}</span>
						</el-tooltip>
						<span v-else class="muted">--</span>
						<div class="rsb-tag-wall">
							<el-tag v-if="stats.Style?.MainStyle?.Name" size="small" effect="plain">{{ stats.Style.MainStyle.Name }}</el-tag>
							<el-tag v-if="stats.Style?.HoldCycleTag?.Name" size="small" type="info" effect="plain">{{ stats.Style.HoldCycleTag.Name }}</el-tag>
							<el-tag v-if="stats.Style?.FrequencyTag?.Name" size="small" type="info" effect="plain">{{ stats.Style.FrequencyTag.Name }}</el-tag>
							<el-tag v-if="stats.Style?.StrategyType?.Name" size="small" type="info" effect="plain">{{ stats.Style.StrategyType.Name }}</el-tag>
							<el-tag v-if="stats.Style?.RiskLevel?.Name" size="small" :type="riskTone(stats.Style.RiskLevel.Name)" effect="plain">{{ stats.Style.RiskLevel.Name }}</el-tag>
							<el-tag v-if="stats.Style?.TargetTag?.Name" size="small" type="info" effect="plain">{{ stats.Style.TargetTag.Name }}</el-tag>
							<el-tag v-if="stats.Style?.ExecutionTag?.Name" size="small" :type="execTone(stats.Style.ExecutionTag.Name)" effect="plain">{{ stats.Style.ExecutionTag.Name }}</el-tag>
						</div>
						<div class="rsb-style-nums">
							<span>平均持有 <b>{{ (stats.Style?.AvgHoldDays ?? 0).toFixed(1) }}</b> 天</span>
							<span>月均成交 <b>{{ stats.Style?.MonthlyAvgCount ?? 0 }}</b> 笔</span>
							<span>平均仓位 <b>{{ (stats.Style?.AvgPosition ?? 0).toFixed(1) }}</b>%</span>
						</div>
					</div>
					<div class="rsb-radar-wrap">
						<div v-if="hasScores" ref="radarRef" class="rsb-radar"></div>
						<div v-else class="rsb-radar-empty">暂无八维评分</div>
						<div v-if="hasScores" class="rsb-total">
							<span class="rsb-total-num">{{ stats.Scores.Total.toFixed(1) }}</span>
							<span class="rsb-total-label">综合得分</span>
						</div>
					</div>
				</div>

				<!-- 下排：择时摘要 + 四象限 -->
				<div class="rsb-grid">
					<div class="rsb-panel">
						<div class="rsb-sec-title"><font-awesome-icon fas icon="clock"></font-awesome-icon>择时摘要</div>
						<div v-if="timing.valid > 0" class="rsb-kv">
							<span class="rsb-kv-label">高位买入占比</span>
							<span class="rsb-kv-value" :class="timing.highRatio >= 50 ? 'c-red' : timing.highRatio >= 30 ? 'c-orange' : 'c-green'">{{ timing.highRatio.toFixed(0) }}%</span>
						</div>
						<div v-if="timing.valid > 0" class="rsb-kv">
							<span class="rsb-kv-label">低位买入占比</span>
							<span class="rsb-kv-value">{{ timing.lowRatio.toFixed(0) }}%</span>
						</div>
						<div class="rsb-kv">
							<span class="rsb-kv-label">卖飞率（卖后 20 日涨超 5%）</span>
							<span class="rsb-kv-value" :class="timing.sellFlyRatio >= 30 ? 'c-orange' : ''">{{ timing.sellFlyText }}</span>
						</div>
						<div class="rsb-kv">
							<span class="rsb-kv-label">逃顶率（卖后 20 日跌超 5%）</span>
							<span class="rsb-kv-value">{{ timing.escapeText }}</span>
						</div>
						<div v-if="timing.valid === 0" class="rsb-empty-line muted">暂无有效买入样本</div>
					</div>
					<div class="rsb-panel">
						<div class="rsb-sec-title"><font-awesome-icon fas icon="table-cells-large"></font-awesome-icon>个股四象限（胜率 × 盈亏比）</div>
						<div class="rsb-quad">
							<div class="rsb-quad-cell q-expert">
								<b>{{ stats.Quadrant?.ExpertCount ?? 0 }}</b>
								<span>顶尖</span>
							</div>
							<div class="rsb-quad-cell q-steady">
								<b>{{ stats.Quadrant?.SteadyCount ?? 0 }}</b>
								<span>稳健</span>
							</div>
							<div class="rsb-quad-cell q-aggressive">
								<b>{{ stats.Quadrant?.AggressiveCount ?? 0 }}</b>
								<span>激进</span>
							</div>
							<div class="rsb-quad-cell q-improve">
								<b>{{ stats.Quadrant?.ImproveCount ?? 0 }}</b>
								<span>待改进</span>
							</div>
						</div>
						<div class="rsb-quad-note">共 {{ quadTotal }} 只有平仓记录的个股</div>
					</div>
				</div>

				<!-- 底部：查看完整交易画像 -->
				<div class="rsb-foot">
					<el-button size="small" type="primary" plain @click="openProfile">
						<font-awesome-icon fas icon="fingerprint"></font-awesome-icon>&nbsp;查看完整交易画像
					</el-button>
				</div>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { IZdxBehaviorStats, IZdxBehaviorScore } from '@/interfaces/zhiduoxing/IZdxMyTrade'
import zdxApi from '@/apis/zdx-api'

// 风格摘要卡（风格分析 Tab）：复用行为画像 BehaviorStats 接口，紧凑摘要 + 随全局时间线联动
// 完整交互（雷达模式切换/评分依据/评定留档）深链行为画像页承载
// range：全局时间线（all/history/20/60/120/250；非空时由后端按窗口聚合）
const props = defineProps<{ range?: string }>()
const router = useRouter()

const loading = ref(false)
const stats = ref<IZdxBehaviorStats | null>(null)

// 八维评分维度定义（展示顺序与行为画像一致）
const SCORE_DIMS: { key: keyof IZdxBehaviorScore; name: string }[] = [
	{ key: 'ProfitRatio', name: '盈亏比' },
	{ key: 'WinRate', name: '胜率' },
	{ key: 'Timing', name: '择时' },
	{ key: 'CostControl', name: '成本' },
	{ key: 'RiskControl', name: '风控' },
	{ key: 'Patience', name: '耐心' },
	{ key: 'DrawdownControl', name: '回撤控制' },
	{ key: 'Profitability', name: '收益能力' }
]

const hasScores = computed(() => !!stats.value?.Scores)
const styleSummary = computed(() => stats.value?.Style?.Summary || stats.value?.TradeStyle || '')

// 择时摘要（高位买入占比 / 卖飞率 / 逃顶率）
const timing = computed(() => {
	const t = stats.value?.Timing
	const valid = t?.ValidBuyCount ?? 0
	const highRatio = valid > 0 ? ((t?.BuyHighCount ?? 0) / valid) * 100 : 0
	const lowRatio = valid > 0 ? ((t?.BuyLowCount ?? 0) / valid) * 100 : 0
	const sellFly = t?.SellFlyCount ?? 0
	const escape = t?.EscapeCount ?? 0
	const sellFlyRatio = valid > 0 ? (sellFly / valid) * 100 : 0
	return {
		valid,
		highRatio,
		lowRatio,
		sellFlyRatio,
		sellFlyText: sellFly > 0 ? `${sellFly} 笔 · ${sellFlyRatio.toFixed(0)}%` : '0 笔',
		escapeText: escape > 0 ? `${escape} 笔` : '0 笔'
	}
})

const quadTotal = computed(
	() => (stats.value?.Quadrant?.ExpertCount ?? 0) + (stats.value?.Quadrant?.SteadyCount ?? 0) + (stats.value?.Quadrant?.AggressiveCount ?? 0) + (stats.value?.Quadrant?.ImproveCount ?? 0)
)

// 风险等级标签色调（保守=success 稳健=primary 激进=warning 赌徒=danger）
function riskTone(name?: string): 'success' | 'primary' | 'warning' | 'danger' | 'info' {
	if (name === '保守') return 'success'
	if (name === '稳健') return 'primary'
	if (name === '激进') return 'warning'
	if (name === '赌徒') return 'danger'
	return 'info'
}

// 执行方式标签色调（情绪化标红）
function execTone(name?: string): 'danger' | 'info' {
	return name === '情绪化' ? 'danger' : 'info'
}

// ---------- 八维雷达（迷你，复用行为画像 SCORE_DIMS 口径） ----------
const radarRef = ref<HTMLElement>()
let radarChart: echarts.ECharts | null = null

function renderRadar() {
	if (!radarRef.value || !stats.value?.Scores) return
	if (!radarChart) radarChart = echarts.init(radarRef.value)
	const s = stats.value.Scores
	radarChart.setOption(
		{
			radar: {
				indicator: SCORE_DIMS.map(d => ({ name: d.name, max: 100 })),
				radius: '62%',
				center: ['50%', '52%'],
				axisName: { fontSize: 10, color: '#606266' },
				splitNumber: 4,
				splitLine: { lineStyle: { color: 'rgba(124,92,240,0.12)' } },
				splitArea: { areaStyle: { color: ['rgba(124,92,240,0.02)', 'rgba(124,92,240,0.05)'] } },
				axisLine: { lineStyle: { color: 'rgba(124,92,240,0.2)' } }
			},
			series: [
				{
					type: 'radar',
					symbolSize: 4,
					data: [
						{
							value: SCORE_DIMS.map(d => s[d.key] ?? 0),
							areaStyle: { color: 'rgba(124,92,240,0.18)' },
							lineStyle: { color: '#7c5cf0', width: 2 },
							itemStyle: { color: '#7c5cf0' }
						}
					]
				}
			]
		},
		true
	)
	radarChart.resize()
}

async function load() {
	loading.value = true
	try {
		stats.value = await zdxApi.getMyBehaviorStats(undefined, props.range)
		await nextTick(renderRadar)
	} catch (err: any) {
		stats.value = null
		ElMessage.error(err?.message || '风格摘要加载失败')
	} finally {
		loading.value = false
	}
}

// 深链行为画像页
function openProfile() {
	router.push({ name: 'ZdxPortalBehavior' })
}

function handleResize() {
	radarChart?.resize()
}

// 全局时间线切换后重新加载（雷达图随数据重渲染）
watch(
	() => props.range,
	() => load()
)

onMounted(() => {
	load()
	window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
	window.removeEventListener('resize', handleResize)
	radarChart?.dispose()
	radarChart = null
})

defineExpose({ refresh: load })
</script>

<style lang="scss" scoped>
.rsb-wrap {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;
}

.rsb-bar {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px 12px;
}

.rsb-note {
	font-size: 12px;
	color: var(--el-text-color-secondary);
}

.rsb-body {
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-height: 200px;
}

.rsb-top {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 320px;
	gap: 14px;
	align-items: stretch;
}

.rsb-style {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 14px 16px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid rgba(228, 233, 245, 0.9);
	box-shadow: 0 2px 12px rgba(31, 45, 61, 0.05);
}

.rsb-sec-title {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	font-weight: 700;
	color: #303133;

	svg {
		color: #7c5cf0;
	}
}

.rsb-summary-chip {
	align-self: flex-start;
	max-width: 100%;
	padding: 6px 14px;
	border-radius: 999px;
	font-size: 14px;
	font-weight: 700;
	color: #fff;
	background: linear-gradient(135deg, #4a7ef7 0%, #7c5cf0 100%);
	box-shadow: 0 4px 12px rgba(124, 92, 240, 0.3);
}

.rsb-tag-wall {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.rsb-style-nums {
	display: flex;
	flex-wrap: wrap;
	gap: 6px 18px;
	font-size: 12px;
	color: var(--el-text-color-secondary);

	b {
		color: #303133;
		font-variant-numeric: tabular-nums;
	}
}

.rsb-radar-wrap {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid rgba(228, 233, 245, 0.9);
	box-shadow: 0 2px 12px rgba(31, 45, 61, 0.05);
}

.rsb-radar {
	width: 100%;
	height: 240px;
}

.rsb-radar-empty {
	align-self: center;
	font-size: 12px;
	color: var(--el-text-color-placeholder);
}

.rsb-total {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 3px;
	padding: 5px 14px 7px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid rgba(124, 92, 240, 0.16);
	box-shadow: 0 2px 10px rgba(124, 92, 240, 0.1);
	pointer-events: none;
}

.rsb-total-num {
	font-size: 20px;
	font-weight: 700;
	line-height: 1.15;
	color: #7c5cf0;
	font-variant-numeric: tabular-nums;
}

.rsb-total-label {
	font-size: 11px;
	color: var(--el-text-color-secondary);
}

.rsb-grid {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
	gap: 16px;
}

.rsb-panel {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 12px 14px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid rgba(228, 233, 245, 0.9);
	box-shadow: 0 2px 12px rgba(31, 45, 61, 0.05);
}

.rsb-kv {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	font-size: 12px;
}

.rsb-kv-label {
	color: var(--el-text-color-secondary);
}

.rsb-kv-value {
	font-weight: 700;
	color: #303133;
	font-variant-numeric: tabular-nums;
}

.rsb-empty-line {
	font-size: 12px;
}

.rsb-quad {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 8px;
}

.rsb-quad-cell {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
	padding: 10px 4px;
	border-radius: 9px;
	background: #f8faff;
	border: 1px solid #ecf1fa;

	b {
		font-size: 16px;
		font-variant-numeric: tabular-nums;
	}

	span {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	&.q-expert b { color: #13c2c2; }
	&.q-steady b { color: #67c23a; }
	&.q-aggressive b { color: #e6a23c; }
	&.q-improve b { color: #f56c6c; }
}

.rsb-quad-note {
	font-size: 12px;
	color: var(--el-text-color-secondary);
}

.rsb-foot {
	display: flex;
	justify-content: flex-end;
}

// 智多星红涨绿跌 / 警示色体系
.c-red {
	color: var(--el-color-danger);
}

.c-green {
	color: var(--el-color-success);
}

.c-orange {
	color: #e6a23c;
}

.muted {
	color: var(--el-text-color-placeholder);
}

// 窄屏：雷达下移
@media (max-width: 1300px) {
	.rsb-top {
		grid-template-columns: minmax(0, 1fr);
	}
}
</style>
