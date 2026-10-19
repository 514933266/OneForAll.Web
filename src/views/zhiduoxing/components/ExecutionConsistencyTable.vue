<template>
	<div class="ect-wrap">
		<!-- 执行一致性（已判定假设 × 假设期间实盘动作逐行对照；判断力与执行力放在同一行） -->
		<el-table v-loading="loading" :data="rows" size="small" class="ect-table" max-height="560">
			<el-table-column label="股票" width="160" fixed="left">
				<template #default="{ row }">
					<div class="tk-stock">
						<div class="tk-stock-top">
							<span class="tk-name">{{ row.StockName || '--' }}</span>
						</div>
						<span class="tk-code link" @click="openStock(row.StockCode)">{{ row.StockCode }}</span>
					</div>
				</template>
			</el-table-column>
			<el-table-column label="假设摘要 / 判定" min-width="230">
				<template #default="{ row }">
					<div class="tk-sum">
						<span class="ec-sum">{{ row.ForecastSummary }}</span>
						<span class="ec-range">{{ fmtDate(row.ForecastStartDate) }} ~ {{ fmtDate(row.ForecastEndDate) }}</span>
					</div>
				</template>
			</el-table-column>
			<el-table-column label="判定结果" width="150">
				<template #default="{ row }">
					<div class="ec-verdict">
						<el-tag v-if="row.HitDirection !== null && row.HitDirection !== undefined" size="small" :type="row.HitDirection ? 'success' : 'danger'" effect="plain">{{ row.HitDirection ? '方向命中' : '方向未中' }}</el-tag>
						<span v-if="row.HitDirection !== null && row.HitDirection !== undefined && row.AmplitudeClass" class="ec-amp">{{ ampText(row.AmplitudeClass) }}</span>
						<span v-if="row.ForecastScore !== null && row.ForecastScore !== undefined" class="ec-score">{{ Number(row.ForecastScore).toFixed(0) }} 分</span>
					</div>
				</template>
			</el-table-column>
			<el-table-column label="同期实盘动作" min-width="210">
				<template #default="{ row }">
					<div class="ec-acts">
						<span class="ec-act-line">买 <b class="c-red">{{ row.BuyCount }}</b> 笔 · 卖 <b class="c-green">{{ row.SellCount }}</b> 笔</span>
						<span v-if="row.FirstBuyTime || row.LastSellTime" class="ec-act-time">
							{{ row.FirstBuyTime ? fmtTime(row.FirstBuyTime) + ' 首买' : '' }}{{ row.FirstBuyTime && row.LastSellTime ? ' / ' : '' }}{{ row.LastSellTime ? fmtTime(row.LastSellTime) + ' 末卖' : '' }}
						</span>
					</div>
				</template>
			</el-table-column>
			<el-table-column label="一致性" width="110" align="center">
				<template #default="{ row }">
					<el-tag size="small" :type="consistTag(row.Consistency).type" effect="dark">{{ consistTag(row.Consistency).label }}</el-tag>
				</template>
			</el-table-column>
			<el-table-column label="盈亏 / 假设均分" width="150" align="right">
				<template #default="{ row }">
					<div class="ec-compare">
						<span v-if="row.RealizedProfit !== null && row.RealizedProfit !== undefined" class="ec-profit" :class="Number(row.RealizedProfit) >= 0 ? 'c-red' : 'c-green'">{{ fmtMoney(row.RealizedProfit) }}</span>
						<span v-else class="muted">--</span>
						<span class="ec-avg">假设均分 {{ Number(row.AvgForecastScore).toFixed(0) }}</span>
					</div>
				</template>
			</el-table-column>
			<template #empty>
				<el-empty description="暂无已判定假设 × 已了结交易的同股交叉样本" :image-size="80"></el-empty>
			</template>
		</el-table>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { dayjs } from 'element-plus'
import { IZdxExecutionConsistencyItem } from '@/interfaces/zhiduoxing/IZdxStockReview'
import zdxApi from '@/apis/zdx-api'

// 执行一致性表格（交易记录 Tab 内嵌）：已判定假设 × 假设期间实盘动作逐行对照
// 标签口径（后端 FIFO 已了结配对）：plan 按计划执行 / reverse 反向操作 / early 提前离场（卖飞）/ late 止损延误 / none 到期未动作
// range：全局时间线（all/history/20/60/120/250；按假设创建时间过滤）
const props = defineProps<{ range?: string }>()
const router = useRouter()

const loading = ref(false)
const rows = ref<IZdxExecutionConsistencyItem[]>([])

// 一致性标签 → 展示（红=反向 / 橙=纪律缺陷 / 绿=按计划 / 灰=到期未动作）
const CONSIST_TAGS: Record<string, { label: string; type: 'success' | 'warning' | 'danger' | 'info' }> = {
	plan: { label: '按计划执行', type: 'success' },
	reverse: { label: '反向操作', type: 'danger' },
	early: { label: '提前离场', type: 'warning' },
	late: { label: '止损延误', type: 'warning' },
	none: { label: '到期未动作', type: 'info' }
}

function consistTag(key: string) {
	return CONSIST_TAGS[key] ?? { label: key || '--', type: 'info' }
}

// 幅度判定文案（1超越 2贴近 3不及）
function ampText(cls: number) {
	return cls === 1 ? '幅度超越' : cls === 2 ? '幅度贴近' : '幅度不及'
}

function fmtDate(v?: string) {
	return v ? dayjs(v).format('YYYY-MM-DD') : '--'
}

function fmtTime(v?: string) {
	return v ? dayjs(v).format('MM-DD HH:mm') : ''
}

// 盈亏金额（带正负号，千分位）
function fmtMoney(v: number | null | undefined) {
	const n = Number(v ?? 0)
	return (n >= 0 ? '+' : '') + n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

// 点击股票代码 → 跳转个股行情页（携带 code 深链）
function openStock(code: string) {
	if (!code) return
	router.push({ name: 'ZdxPortalStock', query: { code } })
}

// 加载执行一致性列表（随全局时间线筛选）
async function load() {
	loading.value = true
	try {
		rows.value = (await zdxApi.getExecutionConsistency(props.range)) ?? []
	} catch (err: any) {
		rows.value = []
		ElMessage.error(err?.message || '执行一致性加载失败')
	} finally {
		loading.value = false
	}
}

// 全局时间线切换后重新加载
watch(
	() => props.range,
	() => load()
)

onMounted(load)

defineExpose({ refresh: load })
</script>

<style lang="scss" scoped>
.ect-wrap {
	width: 100%;
}

.ect-table {
	width: 100%;
}

.tk-stock {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.tk-stock-top {
	display: flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
}

.tk-name {
	font-weight: 600;
	color: var(--el-text-color-primary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.tk-code {
	font-size: 12px;
	color: #a7abba;

	&.link {
		cursor: pointer;
		color: var(--el-color-primary);

		&:hover {
			text-decoration: underline;
		}
	}
}

.tk-sum {
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
}

.ec-sum {
	font-size: 13px;
	color: var(--el-text-color-regular);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.ec-range {
	font-size: 12px;
	color: var(--el-text-color-secondary);
	font-variant-numeric: tabular-nums;
}

.ec-verdict {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 3px;
}

.ec-amp {
	font-size: 12px;
	color: var(--el-text-color-secondary);
}

.ec-score {
	font-size: 12px;
	font-weight: 600;
	color: #7c5cf0;
	font-variant-numeric: tabular-nums;
}

.ec-acts {
	display: flex;
	flex-direction: column;
	gap: 3px;
	font-size: 12px;
	color: var(--el-text-color-regular);
	font-variant-numeric: tabular-nums;
}

.ec-act-time {
	font-size: 12px;
	color: var(--el-text-color-secondary);
}

.ec-compare {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 3px;
}

.ec-profit {
	font-size: 13px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}

.ec-avg {
	font-size: 12px;
	color: var(--el-text-color-secondary);
	font-variant-numeric: tabular-nums;
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
</style>
