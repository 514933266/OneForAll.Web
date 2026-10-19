<template>
	<div v-loading="loading" class="stock-review-panel">
		<!-- 个股复盘笔记 Tab（原交易记录面板底部 mtp-review 区块拆出；写复盘入口在页面右下角悬浮球） -->
		<div class="srp-head">
			<span class="srp-title">复盘笔记</span>
			<span class="srp-tip">对该股的操作复盘与总结（私密，仅自己可见；写复盘见右下角悬浮球）</span>
		</div>

		<!-- 长线目标价（里程碑式：N 个交易日内到达目标收盘价；收盘价口径自动判定，与复盘抽屉同款展示） -->
		<div v-if="forecastLongs.length" class="srp-flong">
			<div class="flong-head">
				<span class="flong-title">长线目标价</span>
				<span class="flong-note">里程碑 · 交易日口径 · 收盘价自动判定</span>
			</div>
			<div class="flong-list">
				<div v-for="f in forecastLongs" :key="f.Id" class="flong-row">
					<span class="flong-days">{{ f.Days }} 个交易日内</span>
					<b class="flong-price">{{ f.TargetPrice.toFixed(2) }} 元</b>
					<span class="flong-pct" :class="changeClass(flongPct(f))">{{ flongPct(f) > 0 ? '+' : '' }}{{ flongPct(f).toFixed(2) }}%</span>
					<span class="flong-base">起点 {{ f.BasePrice.toFixed(2) }}（{{ dayjs(f.StartDate).format('MM-DD') }}）</span>
					<span v-if="f.Status === 2" class="flong-st" :title="f.HitDate ? `${dayjs(f.HitDate).format('MM-DD')} 达标 · 第 ${f.HitDays} 交易日` : '已达成'">已达成</span>
					<span v-else-if="f.Status === 3" class="flong-st is-bad">未达成</span>
				</div>
			</div>
		</div>

		<!-- 历史笔记列表（倒序；含情绪/技术/消息面、后续操作、走势预测、实盘目标价、AI 验证） -->
		<div v-if="notes.length" class="srp-notes">
			<div v-for="n in notes" :key="n.Id" class="srp-note">
				<div class="note-head">
					<span class="note-date">{{ dayjs(n.ReviewDate).format('YYYY-MM-DD') }}</span>
					<span v-if="n.MoodTags" class="note-moods">{{ n.MoodTags }}</span>
					<el-tooltip v-if="n.AiScore !== undefined && n.AiScore !== null" placement="top" effect="light">
						<template #content>
							<div style="max-width: 280px; white-space: normal; line-height: 1.7; font-size: 12px">{{ n.AiScoreText || '暂无评语' }}</div>
						</template>
						<span class="note-score" :class="noteScoreCls(n.AiScore)">AI {{ n.AiScore }} 分</span>
					</el-tooltip>
					<span class="note-time">更新 {{ dayjs(n.UpdateTime).format('MM-DD HH:mm') }}</span>
				</div>
				<div v-if="n.MoodText" class="note-item">
					<span class="ni-label">情绪面</span>
					<span class="ni-text">{{ n.MoodText }}</span>
				</div>
				<div v-if="n.TechnicalText" class="note-item">
					<span class="ni-label">技术面</span>
					<span class="ni-text">{{ n.TechnicalText }}</span>
				</div>
				<div v-if="n.NewsText" class="note-item">
					<span class="ni-label">消息面</span>
					<span class="ni-text">{{ n.NewsText }}</span>
				</div>
				<div class="note-item">
					<span class="ni-label">复盘笔记</span>
					<span class="ni-text">{{ n.Content || '（无内容）' }}</span>
				</div>
				<div v-if="n.PlanContent" class="note-item">
					<span class="ni-label is-plan">后续操作</span>
					<span class="ni-text">{{ n.PlanContent }}</span>
				</div>
				<div v-if="noteForecast(n)" class="note-item">
					<span class="ni-label is-fc">走势预测</span>
					<span class="ni-text">
						目标价 {{ forecastTarget(noteForecast(n)!).toFixed(2) }}
						<span v-if="forecastDays(noteForecast(n)!)" class="ni-days">· {{ forecastDays(noteForecast(n)!) }} 个交易日内</span>
						<span v-if="forecastJudgeText(noteForecast(n)!)" class="ni-judge">（{{ forecastJudgeText(noteForecast(n)!) }}）</span>
					</span>
				</div>
				<div v-if="notePlanRows(n).length" class="note-item">
					<span class="ni-label is-op">实盘目标价</span>
					<div class="ni-op-list">
						<div v-for="(t, i) in notePlanRows(n)" :key="i" class="ni-op">
							<span class="ni-op-vol">{{ fmtVolume(t.Volume) }} 股</span>
							<span class="ni-op-cost">成本 <b>{{ t.Cost.toFixed(3) }}</b></span>
							<span class="ni-op-arrow">→</span>
							<b class="ni-op-target" :class="changeClass(t.Pct)">{{ t.Target.toFixed(2) }}</b>
							<span class="ni-op-pct" :class="changeClass(t.Pct)">{{ t.Pct > 0 ? '+' : '' }}{{ t.Pct.toFixed(2) }}%</span>
							<span class="ni-op-profit">预期盈利 <b :class="changeClass(t.Profit)">{{ formatThousands(t.Profit, true) }}</b> 元</span>
							<span v-if="t.Days" class="ni-op-days">{{ t.Days }} 个交易日内</span>
							<!-- 台账验证结果（后端接口惰性验证到期实时收敛；未折算入表时无行） -->
							<template v-if="t.Live">
								<el-tag size="small" :type="liveStatusType(t.Live.Status)" effect="plain" class="ni-op-st">{{ ZDX_LIVE_TARGET_STATUSES[t.Live.Status] ?? '--' }}</el-tag>
								<span v-if="liveResultText(t.Live)" class="ni-op-result" :class="liveResultCls(t.Live)">{{ liveResultText(t.Live) }}</span>
								<el-tag v-if="t.Live.CycleSeq > 0" size="small" type="info" effect="plain" class="ni-op-cycle" title="跳转到交易分析对应轮次" @click="emit('goto-cycle', t.Live.CycleSeq)">第 {{ t.Live.CycleSeq }} 轮</el-tag>
							</template>
						</div>
					</div>
				</div>
				<div v-if="n.AiScoreText" class="note-item">
					<span class="ni-label is-ai">AI 验证</span>
					<span class="ni-text">{{ n.AiScoreText }}</span>
				</div>
			</div>
		</div>
		<div v-else-if="!loading" class="srp-empty">暂无复盘笔记，点击右下角悬浮球记录你的操作逻辑与总结</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { dayjs } from 'element-plus'
import { formatThousands } from '@/consts/zhiduoxing-const'
import { IZdxStockTradeSummary, IZdxReview, IZdxTradeNoteItem } from '@/interfaces/zhiduoxing/IZdxMyTrade'
import {
	IZdxStockForecast,
	IZdxStockForecastLong,
	IZdxLiveTarget,
	ZDX_FORECAST_AMPLITUDE_CLASSES,
	ZDX_FORECAST_PATH_CLASSES,
	ZDX_LIVE_TARGET_STATUSES
} from '@/interfaces/zhiduoxing/IZdxStockReview'
import zdxApi from '@/apis/zdx-api'

const props = defineProps<{
	// 该股交易汇总（实盘目标价折算需买卖记录；无记录为 null）
	data: IZdxStockTradeSummary | null
	// 复盘刷新键（悬浮球保存/删除后自增，触发笔记列表刷新；可选）
	reviewKey?: number
}>()

const emit = defineEmits<{
	// 跳转交易分析 Tab 对应轮次（实盘台账行“第 N 轮”徽标）
	(e: 'goto-cycle', seq: number): void
}>()

const loading = ref(false)
const notes = ref<IZdxReview[]>([])
// 该股日K预测列表（笔记卡展示预测目标价与回归判定）
const forecasts = ref<IZdxStockForecast[]>([])
// 该股长线目标列表（笔记区顶部展示里程碑目标价）
const forecastLongs = ref<IZdxStockForecastLong[]>([])
// 该股实盘目标台账行（全量接口按 StockCode 过滤；行匹配键 笔记Id|交易记录Id）
const liveTargets = ref<IZdxLiveTarget[]>([])
const liveByKey = computed(() => {
	const m = new Map<string, IZdxLiveTarget>()
	liveTargets.value.forEach(t => m.set(t.ReviewId + '|' + t.TradeRecordId, t))
	return m
})

async function loadAll() {
	const code = props.data?.StockCode
	if (!code) {
		notes.value = []
		forecasts.value = []
		forecastLongs.value = []
		liveTargets.value = []
		return
	}
	loading.value = true
	try {
		try {
			notes.value = await zdxApi.getReviewList({ type: 4, stockCode: code, max: 100 })
		} catch {
			notes.value = []
		}
		try {
			forecasts.value = await zdxApi.getForecastList(code)
		} catch {
			forecasts.value = []
		}
		try {
			forecastLongs.value = await zdxApi.getForecastLongList(code)
		} catch {
			forecastLongs.value = []
		}
		// 台账接口自带惰性折算同步+验证（到期结果实时收敛）；失败不阻塞笔记展示
		try {
			const all = await zdxApi.getLiveTargetList()
			liveTargets.value = all.filter(t => t.StockCode === code)
		} catch {
			liveTargets.value = []
		}
	} finally {
		loading.value = false
	}
}

// 切换股票时加载；悬浮球保存/删除后（reviewKey 变化）刷新
watch(() => props.data?.StockCode, () => loadAll(), { immediate: true })
watch(() => props.reviewKey, () => loadAll())

// 涨红跌绿（与行情页一致）
function changeClass(value?: number) {
	if (value === undefined || value === null || value === 0) return ''
	return value > 0 ? 'up' : 'down'
}

function fmtVolume(value: number) {
	return Number.isInteger(value) ? value.toString() : value.toFixed(2)
}

// 该笔记当日的日K预测（预测起点=复盘当日；无则 null）
function noteForecast(n: IZdxReview) {
	if (!n.ReviewDate) return null
	const d = dayjs(n.ReviewDate).format('YYYY-MM-DD')
	return forecasts.value.find(f => f.StartDate && dayjs(f.StartDate).format('YYYY-MM-DD') === d) ?? null
}

// 预测目标价（末锚点不复权价；无锚点返回 0）
function forecastTarget(f: IZdxStockForecast) {
	const list = f.Anchors ?? []
	return list.length ? list[list.length - 1].Price : 0
}

// 预测期限（交易日数 = 锚点数 - 1，首锚点=起点当日；不足 2 个锚点返回 0）
function forecastDays(f: IZdxStockForecast) {
	const count = (f.Anchors ?? []).length
	return count > 1 ? count - 1 : 0
}

// 预测回归判定文案（已判定：方向/幅度/路径 + 综合得分；未判定 null）
function forecastJudgeText(f: IZdxStockForecast) {
	if (f.Status !== 2 || f.Score === undefined || f.Score === null) return null
	const amp = ZDX_FORECAST_AMPLITUDE_CLASSES[f.AmplitudeClass ?? 0] ?? '--'
	const path = ZDX_FORECAST_PATH_CLASSES[f.PathClass ?? 0] ?? '--'
	return `${f.HitDirection ? '方向命中' : '方向未中'} · 幅度${amp} · 路径${path} · ${f.Score} 分`
}

// 长线目标涨幅（相对起点收盘价，%）
function flongPct(f: IZdxStockForecastLong) {
	return f.BasePrice > 0 ? (f.TargetPrice - f.BasePrice) / f.BasePrice * 100 : 0
}

// 实盘目标价明细项（复盘笔记 TradeNotes JSON 折算展示）
interface INotePlan {
	// 交易记录 Id（台账行匹配键之一）
	RecordId: number
	// 股份数量
	Volume: number
	// 持仓成本（成本基准，元/股）
	Cost: number
	// 预期目标价（元）
	Target: number
	// 预期盈利（元）
	Profit: number
	// 预期涨幅（%）
	Pct: number
	// 预测期限（交易日；旧数据无）
	Days?: number
}

// 实盘目标价明细（TradeNotes JSON 折算：成本/数量/目标价/涨幅/盈利/期限；未填返回空数组）
// 成本基准：买入=含费成本单价；卖出=按 目标价-盈利/数量 反推；旧数据（无 MinPrice）的卖出记录无法折算跳过
function notePlans(n: IZdxReview) {
	if (!n.TradeNotes) return [] as INotePlan[]
	try {
		const list = JSON.parse(n.TradeNotes) as IZdxTradeNoteItem[]
		const records = props.data?.Records ?? []
		const plans: INotePlan[] = []
		list.forEach(d => {
			const rec = records.find(r => r.Id === d.RecordId)
			const vol = rec?.Volume ?? 0
			if (!rec || !vol) return
			// 成本基准：买入按含费成本单价；卖出在已知目标价时反推（目标价 - 盈利/数量）
			let cost = 0
			if (rec.Category === 1) {
				const fee = (rec.Commission ?? 0) + (rec.OtherFee ?? 0) + (rec.StampTax ?? 0) + (rec.TransferFee ?? 0)
				cost = (rec.Amount + fee) / vol
			}
			const profit = d.MinProfit ?? null
			let target = 0
			if (d.MinPrice !== undefined && d.MinPrice !== null) {
				target = d.MinPrice
				if (!cost) cost = target - (profit === null ? 0 : profit / vol)
			} else if (profit !== null && cost > 0) {
				// 旧版前端未存 MinPrice：按 成本基准 + 预测盈利/数量 折算
				target = cost + profit / vol
			} else {
				return
			}
			const gain = profit === null ? (target - cost) * vol : profit
			plans.push({
				RecordId: d.RecordId,
				Volume: vol,
				Cost: cost,
				Target: target,
				Profit: gain,
				Pct: cost > 0 ? ((target - cost) / cost) * 100 : 0,
				Days: d.Days
			})
		})
		return plans
	} catch {
		return [] as INotePlan[]
	}
}

// 实盘目标价行（笔记逐笔 + 台账验证结果联配：ReviewId|TradeRecordId 命中则带 Live 行）
function notePlanRows(n: IZdxReview) {
	return notePlans(n).map(p => ({ ...p, Live: liveByKey.value.get(n.Id + '|' + p.RecordId) ?? null }))
}

// 状态标签色（与复盘中心同款：2/3=达标 success；4/5=失败 danger；6=提前卖出 warning；1=进行中 primary）
function liveStatusType(status: number): 'success' | 'primary' | 'warning' | 'danger' | 'info' {
	if (status === 2 || status === 3) return 'success'
	if (status === 1) return 'primary'
	if (status === 6) return 'warning'
	if (status === 4 || status === 5) return 'danger'
	return 'info'
}

// 验证结果小字（达标类：达标 MM-DD · 实际 +x%；终态未达标类：实际收益/最大浮亏 + 偏差；进行中/无效不展）
function liveResultText(t: IZdxLiveTarget) {
	if (t.Status === 2 || t.Status === 3) {
		const d = t.HitTime ? `达标 ${dayjs(t.HitTime).format('MM-DD')}` : '达标'
		const actual = t.ActualReturn ?? t.MaxProfit ?? null
		return actual === null ? d : `${d} · 实际 ${actual > 0 ? '+' : ''}${actual.toFixed(2)}%`
	}
	if (t.Status === 4 || t.Status === 5 || t.Status === 6) {
		const actual = t.ActualReturn ?? t.MaxDrawdown ?? t.MaxProfit ?? null
		const parts: string[] = []
		if (actual !== null) parts.push(`${t.ActualReturn !== null && t.ActualReturn !== undefined ? '实际' : '最大浮亏'} ${actual > 0 ? '+' : ''}${actual.toFixed(2)}%`)
		if (t.Deviation !== null && t.Deviation !== undefined) parts.push(`偏差 ${t.Deviation > 0 ? '+' : ''}${t.Deviation.toFixed(2)}%`)
		return parts.join(' · ')
	}
	return ''
}

// 结果小字色调（按实际收益符号涨红跌绿；无数值中性灰）
function liveResultCls(t: IZdxLiveTarget) {
	const actual = t.ActualReturn ?? (t.Status === 2 || t.Status === 3 ? t.MaxProfit : t.MaxDrawdown ?? t.MaxProfit) ?? null
	return changeClass(actual ?? undefined)
}

// 评分分档样式（高分绿 / 低分红）
function noteScoreCls(score?: number | null) {
	const v = score ?? 0
	if (v >= 75) return 'is-good'
	if (v >= 60) return 'is-mid'
	return 'is-bad'
}
</script>

<style lang="scss" scoped>
.stock-review-panel {
	min-height: 160px;

	// 涨红跌绿
	.up {
		color: var(--el-color-danger);
	}

	.down {
		color: var(--el-color-success);
	}

	.srp-head {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 12px;
		margin: 6px 0 8px;

		.srp-title {
			font-size: 14px;
			font-weight: 600;
			color: #2e3543;
		}

		.srp-tip {
			font-size: 12px;
			color: #a7abba;
		}
	}

	// 长线目标价卡（绿色里程碑卡，与复盘抽屉同款；行=白卡+绿徽标）
	.srp-flong {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px 12px;
		margin-top: 10px;
		background: linear-gradient(135deg, #f2fbf6, #e9f7f0);
		border: 1px solid #cdeadd;
		border-radius: 10px;

		.flong-head {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 8px;

			.flong-title {
				font-size: 12px;
				font-weight: 600;
				color: #2e7d5b;
			}

			.flong-note {
				font-size: 11px;
				color: var(--el-text-color-secondary);
			}
		}

		.flong-list {
			display: flex;
			flex-direction: column;
			gap: 6px;
		}

		.flong-row {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 4px 8px;
			padding: 4px 9px;
			font-size: 11px;
			color: #5c6470;
			background: #fff;
			border: 1px solid #d9efe4;
			border-radius: 8px;
			font-variant-numeric: tabular-nums;

			.flong-days {
				flex: none;
				padding: 1px 7px;
				border-radius: 8px;
				font-size: 10px;
				line-height: 15px;
				color: #fff;
				background: linear-gradient(135deg, #52b788, #40916c);
			}

			.flong-price {
				font-weight: 600;
				color: #2e7d5b;
			}

			.flong-pct {
				font-weight: 600;
			}

			.flong-base {
				font-size: 11px;
				color: #a7abba;
			}

			.flong-st {
				flex: none;
				padding: 1px 7px;
				border-radius: 6px;
				font-size: 10px;
				color: #1f9254;
				background: #e6f7ee;
			}

			.flong-st.is-bad {
				color: #cf1322;
				background: #fff1f0;
			}
		}
	}

	.srp-notes {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 10px;
	}

	.srp-note {
		padding: 10px 12px;
		background: #f7f8fa;
		border-radius: 8px;
	}

	.note-head {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 4px;
	}

	.note-date {
		font-size: 12px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.note-moods {
		font-size: 11px;
		color: #7c5cf0;
	}

	// AI 评分徽章（配合悬浮评语；高分绿 / 低分红）
	.note-score {
		padding: 0 6px;
		font-size: 11px;
		font-weight: 600;
		border-radius: 8px;
		cursor: default;

		&.is-good {
			color: #529b2e;
			background: rgba(103, 194, 58, 0.12);
		}

		&.is-mid {
			color: #b88230;
			background: rgba(230, 162, 60, 0.12);
		}

		&.is-bad {
			color: #c45656;
			background: rgba(245, 108, 108, 0.12);
		}
	}

	.note-time {
		margin-left: auto;
		font-size: 11px;
		color: #a7abba;
	}

	// 分区块信息行（情绪面/技术面/消息面/复盘笔记/后续操作；网格对齐：标签列右对齐、内容列左对齐）
	.note-item {
		display: grid;
		grid-template-columns: 72px minmax(0, 1fr);
		align-items: start;
		gap: 8px;
		margin-top: 4px;
	}

	.ni-label {
		justify-self: end;
		height: 18px;
		line-height: 18px;
		padding: 0 7px;
		margin-top: 1px;
		border-radius: 4px;
		background: #eef2fa;
		color: #6b7a99;
		font-size: 11px;

		&.is-plan {
			background: #ecf5ff;
			color: #409eff;
		}

		// 走势预测（紫）/ 实盘目标价（橙）/ AI 验证（青）
		&.is-fc {
			background: #f3f0ff;
			color: #7c5cf0;
		}

		&.is-op {
			background: #fdf6ec;
			color: #b88230;
		}

		&.is-ai {
			background: #eafaf4;
			color: #2ba471;
		}
	}

	// 预测回归判定附注（方向/幅度/路径/得分）
	.ni-judge {
		font-size: 11px;
		color: #8a94a6;
	}

	.ni-days {
		font-size: 11px;
		color: #8a94a6;
	}

	// 实盘目标价明细（对齐长线目标卡行式设计：白色小卡 + 徽标 + 数字等宽；橙系呼应 is-op 标签）
	.ni-op-list {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-height: 104px;
		overflow-y: auto;

		.ni-op {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 4px 8px;
			padding: 5px 10px;
			font-size: 11px;
			color: #5c6470;
			background: #fff;
			border: 1px solid #f3e6d8;
			border-radius: 8px;
			font-variant-numeric: tabular-nums;

			.ni-op-vol {
				flex: none;
				padding: 0 6px;
				border-radius: 8px;
				font-size: 10px;
				line-height: 16px;
				color: #b88230;
				background: #fdf6ec;
			}

			.ni-op-cost {
				b {
					font-weight: 600;
					color: #2e3543;
				}
			}

			.ni-op-arrow {
				font-size: 10px;
				color: #c0c4cc;
			}

			.ni-op-target {
				font-weight: 700;
				color: #2e3543;

				&.up {
					color: var(--el-color-danger);
				}

				&.down {
					color: var(--el-color-success);
				}
			}

			.ni-op-pct {
				font-style: normal;
				font-weight: 600;
			}

			.ni-op-profit {
				b {
					font-weight: 600;
				}
			}

			.ni-op-days {
				flex: none;
				padding: 1px 7px;
				border-radius: 8px;
				font-size: 10px;
				line-height: 15px;
				color: #fff;
				background: linear-gradient(135deg, #52b788, #40916c);
			}

			// 台账验证状态徽标（与复盘中心同款 el-tag 色系）
			.ni-op-st {
				flex: none;
			}

			// 验证结果小字（达标日/实际收益/偏差；涨红跌绿由 up/down 叠加）
			.ni-op-result {
				flex: none;
				font-size: 10px;
				color: #8a94a6;
			}

			// 所属轮次徽标（点击跳转交易分析 Tab 对应轮次卡片）
			.ni-op-cycle {
				flex: none;
				cursor: pointer;
			}
		}
	}

	.ni-text {
		flex: 1;
		min-width: 0;
		font-size: 12px;
		color: #5c6470;
		white-space: pre-wrap;
		word-break: break-all;
		max-height: 76px;
		overflow-y: auto;
	}

	.srp-empty {
		font-size: 12px;
		color: #a7abba;
		padding: 12px 0 4px;
	}
}
</style>
