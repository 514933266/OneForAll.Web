<template>
	<el-drawer v-model="visible" size="50%" :destroy-on-close="true" direction="rtl" class="ofa-drawer day-detail-drawer">
		<template #header>
			<div class="dd-header">
				<span class="dd-badge"><font-awesome-icon fas icon="chart-simple"></font-awesome-icon></span>
				<div class="dd-head-info">
					<span class="dd-title">当日明细</span>
					<span v-if="date" class="dd-range">{{ date }} · 持仓浮动盈亏 / 净盈亏 / 费用</span>
				</div>
			</div>
		</template>

		<div v-loading="loading" class="dd-body">
			<el-empty v-if="!loading && !detail?.HasData" :image-size="80" description="该日期早于交易记录导入起点，暂无当日数据" />

			<template v-if="detail?.HasData">
				<!-- ① 持仓浮动盈亏（当日日终持仓） -->
				<div class="dd-section">
					<div class="dd-sec-title">
						持仓浮动盈亏记录
						<span class="dd-sec-note">当日日终持仓 · 未卖出部分按收盘价折算</span>
					</div>
					<el-table v-if="detail.Positions.length" :data="detail.Positions" size="small" class="dd-table">
						<el-table-column label="股票" min-width="130">
							<template #default="scope">
								<span class="dd-name">{{ scope.row.StockName || '--' }}</span>
								<span class="dd-code">{{ scope.row.StockCode }}</span>
							</template>
						</el-table-column>
						<el-table-column label="数量" width="100" align="right">
							<template #default="scope">{{ fmtVolume(scope.row.Volume) }}</template>
						</el-table-column>
						<el-table-column label="成本价" width="100" align="right">
							<template #default="scope">{{ fmtNum(scope.row.AvgCost, 4) }}</template>
						</el-table-column>
						<el-table-column label="收盘价" width="90" align="right">
							<template #default="scope">
								<span v-if="scope.row.ClosePrice > 0">{{ fmtNum(scope.row.ClosePrice, 2) }}</span>
								<span v-else class="dd-na">无行情</span>
							</template>
						</el-table-column>
						<el-table-column label="持仓浮动盈亏" width="110" align="right">
							<template #default="scope">
								<span class="dd-profit" :class="changeClass(scope.row.FloatProfit)">{{ fmtMoney(scope.row.FloatProfit, true) }}</span>
							</template>
						</el-table-column>
					</el-table>
					<div v-else class="dd-empty">当日日终无持仓</div>
					<div v-if="detail.Positions.length" class="dd-sum">
						<span class="dds-label">持仓浮动盈亏合计</span>
						<span class="dds-value" :class="changeClass(detail.FloatProfitSum)">{{ fmtMoney(detail.FloatProfitSum, true) }}</span>
					</div>
				</div>

				<!-- ② 净盈亏记录（当日卖出逐笔） -->
				<div class="dd-section">
					<div class="dd-sec-title">
						净盈亏记录
						<span class="dd-sec-note">当日卖出逐笔 · 已扣全部费用</span>
					</div>
					<el-table v-if="detail.Sells.length" :data="detail.Sells" size="small" class="dd-table">
						<el-table-column label="时间" width="88">
							<template #default="scope"><span class="dd-time">{{ scope.row.TradeTime || '--' }}</span></template>
						</el-table-column>
						<el-table-column label="股票" min-width="120">
							<template #default="scope">
								<span class="dd-name">{{ scope.row.StockName || '--' }}</span>
								<span class="dd-code">{{ scope.row.StockCode }}</span>
							</template>
						</el-table-column>
						<el-table-column label="卖价×数量" width="125" align="right">
							<template #default="scope">{{ fmtNum(scope.row.Price, 2) }} × {{ fmtVolume(scope.row.Volume) }}</template>
						</el-table-column>
						<el-table-column label="成本价" width="95" align="right">
							<template #default="scope">{{ fmtNum(scope.row.AvgCost, 4) }}</template>
						</el-table-column>
						<el-table-column label="成交金额" width="105" align="right">
							<template #default="scope">{{ fmtMoney(scope.row.Amount) }}</template>
						</el-table-column>
						<el-table-column label="费用" width="80" align="right">
							<template #default="scope">{{ fmtMoney(scope.row.Fee) }}</template>
						</el-table-column>
						<el-table-column label="净盈亏" width="110" align="right">
							<template #default="scope">
								<span class="dd-profit" :class="changeClass(scope.row.Profit)">{{ fmtMoney(scope.row.Profit, true) }}</span>
							</template>
						</el-table-column>
					</el-table>
					<div v-else class="dd-empty">当日无卖出</div>
					<div v-if="detail.Sells.length" class="dd-sum">
						<span class="dds-label">净盈亏合计</span>
						<span class="dds-value" :class="changeClass(detail.SellProfitSum)">{{ fmtMoney(detail.SellProfitSum, true) }}</span>
					</div>
				</div>

				<!-- ③ 费用明细（当日买卖实际发生额） -->
				<div class="dd-section">
					<div class="dd-sec-title">
						费用明细
						<span class="dd-sec-note">当日买卖实际发生额 · 逐笔列示</span>
					</div>
					<div class="dd-fees">
						<div class="dd-fee-item">
							<span class="ddf-label">佣金</span>
							<span class="ddf-value">{{ fmtMoney(detail.Fees.CommissionSum) }}</span>
						</div>
						<div class="dd-fee-item">
							<span class="ddf-label">印花税</span>
							<span class="ddf-value">{{ fmtMoney(detail.Fees.StampTaxSum) }}</span>
						</div>
						<div class="dd-fee-item">
							<span class="ddf-label">过户费</span>
							<span class="ddf-value">{{ fmtMoney(detail.Fees.TransferFeeSum) }}</span>
						</div>
						<div class="dd-fee-item">
							<span class="ddf-label">其他</span>
							<span class="ddf-value">{{ fmtMoney(detail.Fees.OtherFeeSum) }}</span>
						</div>
					</div>
					<div class="dd-sum">
						<span class="dds-label">费用合计<span class="dds-sub">买入 {{ fmtMoney(detail.Fees.BuyFeeSum) }} · 卖出 {{ fmtMoney(detail.Fees.SellFeeSum) }}</span></span>
						<span class="dds-value">{{ fmtMoney(detail.Fees.FeeSum) }}</span>
					</div>
					<div v-if="detail.Fees.Items?.length" class="dd-fee-sub">逐笔明细（{{ detail.Fees.Items.length }} 笔）</div>
					<el-table v-if="detail.Fees.Items?.length" :data="detail.Fees.Items" size="small" class="dd-table">
						<el-table-column label="时间" width="88">
							<template #default="scope"><span class="dd-time">{{ scope.row.TradeTime || '--' }}</span></template>
						</el-table-column>
						<el-table-column label="方向" width="58" align="center">
							<template #default="scope">
								<span class="dd-dir" :class="scope.row.IsBuy ? 'buy' : 'sell'">{{ scope.row.IsBuy ? '买' : '卖' }}</span>
							</template>
						</el-table-column>
						<el-table-column label="股票" min-width="110">
							<template #default="scope">
								<span class="dd-name">{{ scope.row.StockName || '--' }}</span>
								<span class="dd-code">{{ scope.row.StockCode }}</span>
							</template>
						</el-table-column>
						<el-table-column label="成交金额" width="100" align="right">
							<template #default="scope">{{ fmtMoney(scope.row.Amount) }}</template>
						</el-table-column>
						<el-table-column label="佣金" width="76" align="right">
							<template #default="scope">{{ fmtMoney(scope.row.Commission) }}</template>
						</el-table-column>
						<el-table-column label="印花税" width="76" align="right">
							<template #default="scope">{{ fmtMoney(scope.row.StampTax) }}</template>
						</el-table-column>
						<el-table-column label="过户费" width="76" align="right">
							<template #default="scope">{{ fmtMoney(scope.row.TransferFee) }}</template>
						</el-table-column>
						<el-table-column label="其他" width="64" align="right">
							<template #default="scope">{{ fmtMoney(scope.row.OtherFee) }}</template>
						</el-table-column>
						<el-table-column label="合计" width="88" align="right">
							<template #default="scope"><span class="dd-fee-sum">{{ fmtMoney(scope.row.FeeSum) }}</span></template>
						</el-table-column>
					</el-table>
				</div>

				<!-- ④ 计算说明 -->
				<div class="dd-section">
					<div class="dd-sec-title">计算说明</div>
					<ul class="dd-notes">
						<li><b>含费成本价</b>：买入的（成交金额 + 费用）累计计入持仓成本，卖出按移动加权扣减，成本价 = 持仓成本 ÷ 持仓数量。</li>
						<li><b>持仓浮动盈亏</b> =（收盘价 − 含费成本价）× 持仓数量；收盘价历史日期取当日日K收盘价，当天取最新行情价，停牌沿用最近有价日。</li>
						<li><b>净盈亏</b> = 卖出成交金额 − 含费成本价 × 卖出数量 − 卖出费用（佣金 + 印花税 + 过户费 + 其他）。</li>
						<li><b>费用明细</b>：逐笔列示当日买入/卖出的佣金、印花税、过户费、其他费用；买入费用已计入持仓成本（不重复扣减），卖出费用已在净盈亏中扣除。</li>
					</ul>
				</div>
			</template>
		</div>
	</el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import zdxApi from '@/apis/zdx-api'
import { formatThousands } from '@/consts/zhiduoxing-const'
import { IZdxTradeDayDetail } from '@/interfaces/zhiduoxing/IZdxMyTrade'

const props = defineProps<{
	modelValue: boolean
	date?: string
}>()

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emit('update:modelValue', value)
})

const loading = ref(false)
const detail = ref<IZdxTradeDayDetail | null>(null)

// 打开或切换日期时加载当日明细
watch(
	[visible, () => props.date],
	([open]) => {
		if (open && props.date) load()
	},
	{ immediate: true }
)

async function load() {
	if (!props.date) return
	loading.value = true
	try {
		detail.value = await zdxApi.getMyDayDetail(props.date)
	} catch {
		detail.value = null
	} finally {
		loading.value = false
	}
}

// ---------- 格式化 ----------
function fmtMoney(value: number, signed = false) {
	return formatThousands(value ?? 0, signed)
}
function fmtNum(value: number, digits = 2) {
	const fixed = Math.abs(value ?? 0).toFixed(digits)
	const [int, dec] = fixed.split('.')
	const grouped = int.replace(/\B(?=(\d{3})+$)/g, ',')
	return `${(value ?? 0) < 0 ? '-' : ''}${grouped}.${dec}`
}
function fmtVolume(value: number) {
	return (value ?? 0).toLocaleString('zh-CN')
}
function changeClass(value?: number) {
	if (value === undefined || value === null || !isFinite(value) || value === 0) return ''
	return value > 0 ? 'up' : 'down'
}
</script>

<style lang="scss" scoped>
.day-detail-drawer {
	.dd-header {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.dd-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		flex: none;
		border-radius: 10px;
		background: linear-gradient(135deg, #6ba4ff, #409eff);
		box-shadow: 0 4px 10px rgba(64, 158, 255, 0.28);
		color: #fff;
		font-size: 15px;
	}

	.dd-head-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.dd-title {
		font-size: 16px;
		font-weight: 700;
		color: var(--el-text-color-primary);
	}

	.dd-range {
		font-size: 12px;
		color: var(--el-text-color-secondary);
		font-variant-numeric: tabular-nums;
	}

	.dd-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
		min-height: 200px;
	}

	.dd-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.dd-sec-title {
		display: flex;
		align-items: baseline;
		gap: 8px;
		font-size: 13px;
		font-weight: 600;
		color: var(--el-text-color-primary);
	}

	.dd-sec-note {
		font-size: 11px;
		font-weight: 400;
		color: var(--el-text-color-secondary);
	}

	.dd-table {
		:deep(.el-table__cell) {
			padding: 4px 0;
		}
	}

	.dd-name {
		font-weight: 600;
		color: var(--el-text-color-primary);
	}

	.dd-code {
		margin-left: 6px;
		font-size: 11px;
		color: var(--el-text-color-secondary);
		font-variant-numeric: tabular-nums;
	}

	.dd-na {
		font-size: 11px;
		color: var(--el-text-color-placeholder);
	}

	.dd-profit {
		font-weight: 600;
		font-variant-numeric: tabular-nums;

		&.up {
			color: var(--el-color-danger);
		}

		&.down {
			color: var(--el-color-success);
		}
	}

	.dd-empty {
		padding: 14px 0;
		text-align: center;
		font-size: 12px;
		color: var(--el-text-color-placeholder);
		background: #fafbfc;
		border: 1px dashed #e8ecf2;
		border-radius: 8px;
	}

	.dd-sum {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 8px 12px;
		background: linear-gradient(180deg, #f8fafd, #f2f6fc);
		border: 1px solid #eef2fa;
		border-radius: 10px;
	}

	.dds-label {
		display: flex;
		align-items: baseline;
		gap: 8px;
		font-size: 12px;
		color: var(--el-text-color-regular);
	}

	.dds-sub {
		font-size: 11px;
		color: var(--el-text-color-secondary);
		font-variant-numeric: tabular-nums;
	}

	.dds-value {
		font-size: 15px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;

		&.up {
			color: var(--el-color-danger);
		}

		&.down {
			color: var(--el-color-success);
		}
	}

	.dd-fees {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
		gap: 8px;
	}

	.dd-fee-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 10px 12px;
		background: linear-gradient(180deg, #f8fafd, #f2f6fc);
		border: 1px solid #eef2fa;
		border-radius: 10px;
	}

	.ddf-label {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	.ddf-value {
		font-size: 14px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.dd-time {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.dd-dir {
		display: inline-block;
		min-width: 34px;
		padding: 0 4px;
		line-height: 18px;
		font-size: 11px;
		text-align: center;
		border-radius: 4px;

		&.buy {
			color: var(--el-color-danger);
			background: rgba(245, 108, 108, 0.12);
		}

		&.sell {
			color: var(--el-color-success);
			background: rgba(103, 194, 58, 0.12);
		}
	}

	.dd-fee-sub {
		margin-top: 2px;
		font-size: 12px;
		font-weight: 600;
		color: var(--el-text-color-primary);
	}

	.dd-fee-sum {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.dd-notes {
		margin: 0;
		padding: 12px 14px 12px 28px;
		background: #fafcff;
		border: 1px solid #eef2fa;
		border-radius: 10px;

		li {
			margin: 0 0 6px;
			font-size: 12px;
			line-height: 1.7;
			color: var(--el-text-color-regular);

			&:last-child {
				margin-bottom: 0;
			}
		}

		b {
			color: var(--el-text-color-primary);
		}
	}
}
</style>
