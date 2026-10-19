<template>
	<div class="rsa-wrap">
		<div v-loading="loading" class="rsa-body">
			<!-- 空态（近期无成交数据或无流派） -->
			<el-empty v-if="!loading && !data?.HasData" description="近期暂无成交数据，无法校验流派契合度" :image-size="80"></el-empty>

			<template v-else-if="data">
				<!-- 顶部总卡：当前流派徽章 + 契合度环形 + 一句话结论 -->
				<div class="rsa-hero">
					<div class="rsa-school">
						<div class="rsa-school-badge">
							<font-awesome-icon fas icon="compass"></font-awesome-icon>
						</div>
						<div class="rsa-school-info">
							<span class="rsa-school-label">当前流派</span>
							<div class="rsa-school-name-row">
								<b class="rsa-school-name">{{ data.CurrentSchoolName || '未评定' }}</b>
								<el-tag v-if="data.SchoolSource === 'user'" size="small" type="primary" effect="plain">自选</el-tag>
								<el-tag v-else-if="data.SchoolSource === 'ai'" size="small" type="warning" effect="plain">AI 判定</el-tag>
								<el-tag v-else size="small" type="info" effect="plain">未评定</el-tag>
							</div>
							<span v-if="data.AiDiffers" class="rsa-ai-tip">
								<font-awesome-icon fas icon="triangle-exclamation"></font-awesome-icon>
								你的实际行为更接近「{{ data.AiJudgedSchoolName }}」
							</span>
						</div>
					</div>
					<div class="rsa-score">
						<el-progress type="circle" :percentage="Number(data.Overall)" :width="92" :stroke-width="8"
							:color="levelColor(data.Level)" :format="() => (data?.Overall ?? 0).toFixed(0)">
						</el-progress>
						<div class="rsa-level">
							<el-tag size="small" :type="levelTag(data.Level)" effect="dark">{{ levelText(data.Level) }}</el-tag>
						</div>
					</div>
					<div class="rsa-conclusion">
						<div class="rsa-conclusion-title"><font-awesome-icon fas icon="comment-dots"></font-awesome-icon>一句话结论</div>
						<p class="rsa-conclusion-text">{{ data.Conclusion || '--' }}</p>
					</div>
				</div>

				<!-- 契合分解表：维度 / 流派期望 / 近期实测 / 累计实测 / 状态 / 调整建议 -->
				<div class="rsa-card">
					<div class="rsa-card-title">
						<span class="rsa-mini-ico tone-violet"><font-awesome-icon fas icon="crosshairs"></font-awesome-icon></span>契合分解
						<span class="rsa-title-note">{{ rangeNote }} · 直接回答“最近是否跑偏了”</span>
					</div>
					<el-table :data="data.Dims" size="small" class="rsa-table" max-height="520">
						<el-table-column label="维度" width="110">
							<template #default="{ row }"><b class="rsa-dim-name">{{ row.DimName }}</b></template>
						</el-table-column>
						<el-table-column label="流派期望" min-width="150">
							<template #default="{ row }"><span class="rsa-expect">{{ row.Expect || '--' }}</span></template>
						</el-table-column>
						<el-table-column label="近期实测" min-width="150">
							<template #default="{ row }"><span class="rsa-recent">{{ row.Recent || '--' }}</span></template>
						</el-table-column>
						<el-table-column label="累计实测" min-width="150">
							<template #default="{ row }"><span class="rsa-total">{{ row.Total || '--' }}</span></template>
						</el-table-column>
						<el-table-column label="状态" width="86" align="center">
							<template #default="{ row }">
								<el-tag size="small" :type="statusTag(row.Status)" effect="plain">{{ statusText(row.Status) }}</el-tag>
							</template>
						</el-table-column>
						<el-table-column label="调整建议" min-width="220">
							<template #default="{ row }">
								<span v-if="row.Advice" class="rsa-advice">{{ row.Advice }}</span>
								<span v-else class="muted">--</span>
							</template>
						</el-table-column>
						<template #empty>
							<el-empty description="暂无契合维度数据" :image-size="60"></el-empty>
						</template>
					</el-table>
				</div>

				<!-- 风格漂移卡：近期 vs 累计主风格/选股风格 -->
				<div class="rsa-card">
					<div class="rsa-card-title">
						<span class="rsa-mini-ico tone-teal"><font-awesome-icon fas icon="wind"></font-awesome-icon></span>风格漂移
						<span class="rsa-title-note">近期窗口 vs 累计窗口</span>
					</div>
					<div class="rsa-drift">
						<div class="rsa-drift-row">
							<span class="rsa-drift-label">主风格</span>
							<span class="rsa-drift-val" :class="{ 'is-drift': data.Drift?.MainStyleDrift }">{{ data.Drift?.RecentMainStyle || '--' }}</span>
							<font-awesome-icon fas icon="arrow-right-long" class="rsa-drift-arrow"></font-awesome-icon>
							<span class="rsa-drift-val muted">{{ data.Drift?.TotalMainStyle || '--' }}</span>
							<el-tag v-if="data.Drift?.MainStyleDrift" size="small" type="warning" effect="plain">已漂移</el-tag>
							<el-tag v-else size="small" type="success" effect="plain">稳定</el-tag>
						</div>
						<div class="rsa-drift-row">
							<span class="rsa-drift-label">选股风格</span>
							<span class="rsa-drift-val" :class="{ 'is-drift': data.Drift?.StockStyleDrift }">{{ data.Drift?.RecentStockStyle || '--' }}</span>
							<font-awesome-icon fas icon="arrow-right-long" class="rsa-drift-arrow"></font-awesome-icon>
							<span class="rsa-drift-val muted">{{ data.Drift?.TotalStockStyle || '--' }}</span>
							<el-tag v-if="data.Drift?.StockStyleDrift" size="small" type="warning" effect="plain">已漂移</el-tag>
							<el-tag v-else size="small" type="success" effect="plain">稳定</el-tag>
						</div>
					</div>
				</div>

				<!-- AI 深度建议（契合分解表提交 DeepSeek；实时生成不落库） -->
				<div class="rsa-card">
					<div class="rsa-card-title">
						<span class="rsa-mini-ico tone-gold"><font-awesome-icon fas icon="wand-magic-sparkles"></font-awesome-icon></span>AI 深度建议
						<span class="rsa-title-note">按偏离程度给出优先改进项与量化动作</span>
						<el-button size="small" type="primary" plain :loading="aiLoading" class="rsa-ai-btn" @click="genAiAdvice">{{ aiLoading ? '生成中…' : aiAdvice ? '重新生成' : '生成 AI 建议' }}</el-button>
					</div>
					<div v-if="aiAdvice" class="rsa-ai-text">{{ aiAdvice }}</div>
					<div v-else-if="aiLoading" class="rsa-ai-empty muted">AI 正在对照契合分解表生成深度建议，约需 10~30 秒，请稍候…</div>
					<div v-else class="rsa-ai-empty muted">点击“生成 AI 建议”，AI 将逐维分析偏离原因，给出总体判断、优先改进项与流派适配性建议（实时生成不落库）</div>
				</div>

				<!-- 重新评定流派（SuggestChange 时展示原因与入口） -->
				<div v-if="data.SuggestChange" class="rsa-suggest">
					<div class="rsa-suggest-info">
						<font-awesome-icon fas icon="circle-exclamation"></font-awesome-icon>
						<span>建议重新评定流派{{ data.SuggestSchoolName ? `（建议：${data.SuggestSchoolName}）` : '' }}：{{ data.SuggestReason }}</span>
					</div>
					<el-button size="small" type="warning" @click="schoolVisible = true">
						<font-awesome-icon fas icon="compass"></font-awesome-icon>&nbsp;重新评定流派
					</el-button>
				</div>
			</template>
		</div>

		<!-- 流派评定弹窗（复用交易画像评定弹窗；保存后回流刷新契合度） -->
		<SchoolDialog v-model="schoolVisible" @saved="load" />
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { IZdxSchoolAlignment } from '@/interfaces/zhiduoxing/IZdxMyTrade'
import zdxApi from '@/apis/zdx-api'
import SchoolDialog from './SchoolDialog.vue'

// 流派契合度分析（流派契合 Tab）：当前流派 vs 近期/累计实测逐维对照 + 风格漂移 + 重新评定建议
// 契合度分仅作诊断参考，不改变八维评分换算口径；建议文案规则集中在后端
// initial：父组件（StockReview）已拉取的数据，首屏直接复用避免重复请求；updated：加载/刷新后回传父组件供诊断带徽章共用
// range：全局时间线（all/history/20/60/120/250；近期=所选时间线末段近 20 交易日，累计=所选时间线全量）
const props = defineProps<{ initial?: IZdxSchoolAlignment | null; range?: string }>()
const emit = defineEmits<{ (e: 'updated', v: IZdxSchoolAlignment | null): void }>()

// 分解表口径说明（随全局时间线动态展示）
const rangeNote = computed(() => {
	const r = props.range ?? 'all'
	if (r === 'all') return '近期 = 近 20 交易日 · 累计 = 全历史'
	if (r === 'history') return '近期 = 今年之前末段近 20 交易日 · 累计 = 今年之前全量'
	return `近期 = 近 ${r} 天末段近 20 交易日 · 累计 = 近 ${r} 天全量`
})

const loading = ref(false)
const data = ref<IZdxSchoolAlignment | null>(null)
const schoolVisible = ref(false) // 重新评定弹窗

// 契合等级（high 高度契合 / good 基本契合 / drift 偏离）
function levelText(level: string) {
	if (level === 'high') return '高度契合'
	if (level === 'good') return '基本契合'
	if (level === 'drift') return '偏离'
	return level || '--'
}

function levelTag(level: string): 'success' | 'warning' | 'danger' | 'info' {
	if (level === 'high') return 'success'
	if (level === 'good') return 'warning'
	if (level === 'drift') return 'danger'
	return 'info'
}

// 环形颜色：high 绿 / good 橙 / drift 红
function levelColor(level: string) {
	if (level === 'high') return '#67c23a'
	if (level === 'good') return '#e6a23c'
	return '#f56c6c'
}

// 单维状态（meet 达标 / near 接近 / off 偏离）
function statusText(status: string) {
	if (status === 'meet') return '达标'
	if (status === 'near') return '接近'
	if (status === 'off') return '偏离'
	return status || '--'
}

function statusTag(status: string): 'success' | 'warning' | 'danger' | 'info' {
	if (status === 'meet') return 'success'
	if (status === 'near') return 'warning'
	if (status === 'off') return 'danger'
	return 'info'
}

async function load() {
	loading.value = true
	try {
		data.value = await zdxApi.getSchoolAlignment(props.range)
		emit('updated', data.value)
	} catch (err: any) {
		data.value = null
		ElMessage.error(err?.message || '流派契合度加载失败')
	} finally {
		loading.value = false
	}
}

// ---------- AI 深度建议（实时生成不落库） ----------
const aiAdvice = ref('')
const aiLoading = ref(false)

// 生成：成功/失败提示由拦截器统一弹出
async function genAiAdvice() {
	if (aiLoading.value) return
	aiLoading.value = true
	try {
		const res = await zdxApi.genSchoolAiAdvice(props.range)
		if (res?.Advice) aiAdvice.value = res.Advice
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		aiLoading.value = false
	}
}

// 父组件刷新后同步最新数据（诊断带徽章与契合 Tab 共用同一份）
watch(
	() => props.initial,
	v => {
		if (v) data.value = v
	}
)

// 全局时间线切换：清空旧时间范围生成的 AI 建议（契合数据由父组件重拉后经 initial 下发）
watch(
	() => props.range,
	() => {
		aiAdvice.value = ''
	}
)

onMounted(() => {
	if (props.initial) data.value = props.initial
	else load()
})

defineExpose({ refresh: load })
</script>

<style lang="scss" scoped>
.rsa-wrap {
	width: 100%;
}

.rsa-body {
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-height: 200px;
}

// 顶部总卡（标准白卡，与契合分解/风格漂移等卡片统一）
.rsa-hero {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto minmax(0, 1.2fr);
	gap: 18px;
	align-items: center;
	padding: 16px 20px;
	border-radius: 14px;
	background: #fff;
	border: 1px solid rgba(228, 233, 245, 0.9);
	box-shadow: 0 2px 12px rgba(31, 45, 61, 0.05);
}

.rsa-school {
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
}

.rsa-school-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 46px;
	height: 46px;
	flex: none;
	border-radius: 14px;
	font-size: 20px;
	color: #fff;
	background: linear-gradient(135deg, #4a7ef7 0%, #7c5cf0 100%);
	box-shadow: 0 4px 12px rgba(124, 92, 240, 0.3);
}

.rsa-school-info {
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
}

.rsa-school-label {
	font-size: 12px;
	color: var(--el-text-color-secondary);
}

.rsa-school-name-row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
}

.rsa-school-name {
	font-size: 20px;
	font-weight: 700;
	color: #303133;
}

.rsa-ai-tip {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: #e6a23c;

	svg {
		color: #e6a23c;
	}
}

.rsa-score {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
}

.rsa-level {
	display: flex;
	justify-content: center;
}

.rsa-conclusion {
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
}

.rsa-conclusion-title {
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

.rsa-conclusion-text {
	margin: 0;
	font-size: 13px;
	line-height: 1.7;
	color: var(--el-text-color-regular);
}

// 通用白卡
.rsa-card {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 14px 16px;
	border-radius: 14px;
	background: #fff;
	border: 1px solid rgba(228, 233, 245, 0.9);
	box-shadow: 0 2px 12px rgba(31, 45, 61, 0.05);
}

.rsa-card-title {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	font-weight: 700;
	color: #303133;
}

.rsa-mini-ico {
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

	&.tone-teal {
		color: #13c2c2;
		background: rgba(19, 194, 194, 0.12);
	}

	&.tone-gold {
		color: #d48806;
		background: rgba(212, 136, 6, 0.12);
	}
}

.rsa-title-note {
	margin-left: auto;
	font-size: 12px;
	font-weight: 400;
	color: var(--el-text-color-secondary);
	white-space: nowrap;
}

.rsa-dim-name {
	color: #303133;
}

.rsa-expect {
	font-size: 12px;
	color: #7c5cf0;
}

.rsa-recent {
	font-size: 12px;
	font-weight: 600;
	color: #303133;
}

.rsa-total {
	font-size: 12px;
	color: var(--el-text-color-regular);
}

.rsa-advice {
	font-size: 12px;
	color: var(--el-text-color-regular);
	line-height: 1.6;
}

// AI 深度建议（按钮定格于标题行右侧）
.rsa-ai-btn {
	flex: none;
}

.rsa-ai-text {
	font-size: 13px;
	line-height: 1.8;
	color: var(--el-text-color-regular);
	white-space: pre-wrap;
	word-break: break-word;
}

.rsa-ai-empty {
	padding: 16px 12px;
	font-size: 12px;
	text-align: center;
	border: 1px dashed #e3e9f5;
	border-radius: 10px;
	background: #fafcff;
}

.rsa-drift {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.rsa-drift-row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 10px;
}

.rsa-drift-label {
	flex: none;
	width: 72px;
	font-size: 12px;
	color: var(--el-text-color-secondary);
}

.rsa-drift-val {
	font-size: 13px;
	font-weight: 600;
	color: #303133;
	padding: 4px 12px;
	border-radius: 999px;
	background: #f5f7fa;

	&.is-drift {
		color: #e6a23c;
		background: #fdf6ec;
	}
}

.rsa-drift-arrow {
	font-size: 12px;
	color: var(--el-text-color-placeholder);
}

// 重新评定建议条（橙底）
.rsa-suggest {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 10px;
	padding: 12px 16px;
	border-radius: 12px;
	background: #fdf6ec;
	border: 1px solid rgba(230, 162, 60, 0.35);
}

.rsa-suggest-info {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	font-size: 13px;
	color: #e6a23c;
	line-height: 1.6;

	svg {
		margin-top: 3px;
		flex-shrink: 0;
	}
}

.muted {
	color: var(--el-text-color-placeholder);
}

// 窄屏：总卡两列（流派 + 环形同排，结论独占一行），保持左右平衡
@media (max-width: 1300px) {
	.rsa-hero {
		grid-template-columns: minmax(0, 1fr) auto;
	}

	.rsa-conclusion {
		grid-column: 1 / -1;
	}
}
</style>
