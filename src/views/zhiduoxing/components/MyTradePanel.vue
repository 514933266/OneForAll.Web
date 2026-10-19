<template>
	<div v-loading="loading" class="my-trade-panel">
		<!-- 无记录空态 -->
		<div v-if="!data && !loading" class="mtp-empty">
			<el-empty description="暂无该股交易记录" :image-size="80">
				<el-button type="primary" @click="emit('gotoZone')">前往“我的地盘”导入交易记录</el-button>
			</el-empty>
		</div>

		<template v-else-if="data">
			<!-- 概览统计（盈亏/胜率/盈亏比/笔数/费用；盈亏均已扣除买卖全部费用） -->
			<div class="mtp-stats">
				<div class="stat-item">
					<div class="stat-label">
						累计净盈亏
						<el-tooltip placement="top" effect="dark">
							<template #content>
								<div style="max-width: 340px; line-height: 1.7">
									该股全部历史交易的累计净盈亏（含各轮建仓/清仓）：<br />
									卖出盈亏 = 卖出金额 − 成本价 × 卖出数量 − 卖出费用<br />
									成本价含买入费用；卖出费用含佣金、印花税、过户费<br />
									注：券商 App 的“清仓盈亏”按单轮持仓周期统计（空仓→建仓→清仓为一轮），可对照下方“清仓轮次”逐轮核对
								</div>
							</template>
							<font-awesome-icon icon="fa-solid fa-circle-question" class="stat-help" />
						</el-tooltip>
					</div>
					<div
						class="stat-value"
						:class="stats.SellCount ? changeClass(stats.RealizedProfit) : ''"
						:title="stats.SellCount ? formatThousands(stats.RealizedProfit, true) : '--'"
					>
						{{ stats.SellCount ? formatThousands(stats.RealizedProfit, true) : '--' }}
					</div>
					<div class="stat-sub">
						<template v-if="data.Position">
							持仓浮动盈亏
							<span :class="changeClass(data.Position.FloatProfit)">{{ formatThousands(data.Position.FloatProfit, true) }}</span>
						</template>
						<template v-else>已清仓</template>
					</div>
				</div>
				<div class="stat-item">
					<div class="stat-label">
						卖出胜率
						<el-tooltip placement="top" effect="dark">
							<template #content>
								<div style="max-width: 260px; line-height: 1.7">胜率 = 盈利卖出笔数 ÷ 卖出总笔数 × 100%（按笔统计）</div>
							</template>
							<font-awesome-icon icon="fa-solid fa-circle-question" class="stat-help" />
						</el-tooltip>
					</div>
					<div class="stat-value" :class="winRateClass">{{ stats.SellCount ? stats.WinRate.toFixed(2) + '%' : '--' }}</div>
					<div class="stat-sub">盈利 {{ stats.WinSellCount }} / 卖出 {{ stats.SellCount }} 笔</div>
				</div>
				<div class="stat-item">
					<div class="stat-label">
						盈亏比
						<el-tooltip placement="top" effect="dark">
							<template #content>
								<div style="max-width: 300px; line-height: 1.7">
									盈亏比 = 平均盈利金额 ÷ 平均亏损金额<br />
									平均盈利 = 盈利卖出盈亏合计 ÷ 盈利笔数；平均亏损同理（取绝对值）
								</div>
							</template>
							<font-awesome-icon icon="fa-solid fa-circle-question" class="stat-help" />
						</el-tooltip>
					</div>
					<div class="stat-value" :class="ratioClass">{{ profitStat.ratio === null ? '--' : profitStat.ratio.toFixed(2) }}</div>
					<div class="stat-sub">平均盈利 {{ formatThousands(profitStat.avgWin) }} / 平均亏损 {{ formatThousands(profitStat.avgLoss) }}</div>
				</div>
				<div class="stat-item">
					<div class="stat-label">交易笔数</div>
					<div class="stat-value">{{ stats.TradeCount }} 笔</div>
					<div class="stat-sub">买入 {{ stats.BuyCount }} / 卖出 {{ stats.SellCount }}</div>
				</div>
				<div class="stat-item">
					<div class="stat-label">费用合计（元）</div>
					<div class="stat-value" :title="formatThousands(feeSummary.total)">{{ formatThousands(feeSummary.total) }}</div>
					<div class="stat-sub">
						佣金 {{ formatThousands(feeSummary.commission) }} · 印花税 {{ formatThousands(feeSummary.stampTax) }} · 过户费
						{{ formatThousands(feeSummary.transferFee) }}
					</div>
				</div>
				<div v-if="dividendSummary" class="stat-item">
					<div class="stat-label">
						红利入账
						<el-tooltip placement="top" effect="dark">
							<template #content>
								<div style="max-width: 280px; line-height: 1.7">该股历史红利净额合计（红利入账为正向，红利税扣缴为负；不含利息归本）</div>
							</template>
							<font-awesome-icon icon="fa-solid fa-circle-question" class="stat-help" />
						</el-tooltip>
					</div>
					<div class="stat-value" :title="formatThousands(dividendSummary.total)">{{ formatThousands(dividendSummary.total) }}</div>
					<div class="stat-sub">共 {{ dividendSummary.count }} 笔红利流水</div>
				</div>
			</div>

			<!-- 当前持仓条 -->
			<div class="mtp-position">
				<span class="pos-label">当前持仓</span>
				<template v-if="data.Position">
					<span>数量 <b>{{ fmtVolume(data.Position.Volume) }}</b></span>
					<span>成本价 <b>{{ data.Position.AvgCost.toFixed(4) }}</b></span>
					<span v-if="data.Position.Price > 0">现价 <b>{{ data.Position.Price.toFixed(2) }}</b></span>
					<span v-if="data.Position.Price > 0">市值 <b>{{ formatThousands(data.Position.MarketValue) }}</b></span>
					<span>
						持仓浮动盈亏
						<b :class="changeClass(data.Position.FloatProfit)">
							{{ formatThousands(data.Position.FloatProfit, true) }}（{{ formatPercent(data.Position.FloatProfitPercent) }}）
						</b>
					</span>
				</template>
				<template v-else>
					<span>已清仓</span>
				</template>
			</div>

			<!-- 清仓轮次（券商口径：空仓→建仓→清仓为一轮；展开卡片含归因标签/操作质量/T+N 走势/AI 评语/关联笔记/买卖明细） -->
			<div v-if="cycles.length" class="mtp-cycles">
				<div class="mtp-table-head">
					<span class="table-title">清仓轮次</span>
					<span class="table-tip">按持仓周期统计（空仓建仓起、清仓止）；收益率 = 清仓盈亏 ÷ 买入成本（含买入费用），与券商 App“清仓盈亏”同口径；点击“查看归因”展开当期 K 线（B/S 标记 + 上证对比）与 AI 评语</span>
				</div>
				<!-- 分类筛选（大额盈利/大额亏损/高频做T；阈值见脚本常量） -->
				<div class="cycle-filter">
					<span v-for="f in CYCLE_FILTERS" :key="f.key" :class="['cf-chip', { active: cycleFilter === f.key }]" @click="cycleFilter = f.key">{{ f.label }}</span>
				</div>
				<div class="cycle-list" ref="cycleListEl">
					<div
						v-for="c in visibleCycles"
						:key="c.CycleSeq"
						class="cycle-card"
						:class="{ 'is-open': expandedSeqs.has(c.CycleSeq), 'is-holding': !c.IsClosed }"
						:data-seq="c.CycleSeq"
						:style="{ '--bar-color': barColor(c) }"
					>
						<div class="cycle-head" @click="toggleCycle(c.CycleSeq)">
							<span class="cycle-seq">第 {{ c.round }} 轮</span>
							<span class="cycle-period">{{ cyclePeriod(c) }}</span>
							<el-tag v-if="c.IsClosed && c.AttributionTag" :type="tagColor(c.AttributionTag)" size="small" class="cycle-tag">{{ tagLabel(c.AttributionTag) }}</el-tag>
							<el-tag v-if="c.IsClosed && buyTagInfo(c)" :type="buyTagInfo(c)!.type" size="small" class="cycle-tag">{{ buyTagInfo(c)!.label }}</el-tag>
							<el-tag v-if="!c.IsClosed" type="primary" size="small" class="cycle-tag is-holding-tag">持仓中</el-tag>
							<span class="cycle-spacer"></span>
							<span v-if="c.IsClosed" class="cycle-profit" :class="changeClass(c.Profit)">{{ formatThousands(c.Profit, true) }}</span>
							<span v-else class="cycle-profit">--</span>
							<span v-if="c.IsClosed" class="cycle-rate" :class="changeClass(c.ProfitRate)">{{ formatPercent(c.ProfitRate) }}</span>
							<span v-else class="cycle-rate">--</span>
							<span class="cycle-open-btn" @click.stop="toggleCycle(c.CycleSeq)">
								{{ expandedSeqs.has(c.CycleSeq) ? '收起' : '查看归因' }}
								<font-awesome-icon :icon="expandedSeqs.has(c.CycleSeq) ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'" />
							</span>
						</div>
						<div v-if="expandedSeqs.has(c.CycleSeq)" class="cycle-body">
							<!-- 左半区 65%：操作质量 + 走势融合 + 买卖明细；右半区 35%：AI 评语 + 关联笔记（持仓中/未落库时单栏） -->
							<div class="cb-flex" :class="{ 'no-ai': !(c.IsClosed && c.CycleId > 0) }">
								<div class="cb-left">
									<div v-if="c.IsClosed" class="cycle-quality">
										<span class="cq-label">操作质量</span>
										<el-popover placement="top" :width="380" trigger="click" popper-class="cq-rule-popper">
											<template #reference>
												<span class="cq-rule-link"><font-awesome-icon icon="fa-solid fa-circle-info" />{{ scoreDetail(c) ? '评分明细' : '评分标准' }}</span>
											</template>
											<div class="cq-rule-body">
												<template v-if="scoreDetail(c)">
													<div class="cqr-head">
														<b>第 {{ c.CycleSeq }} 轮操作质量得分明细</b>
														<span>{{ gradeInfo(c.QualityScore).text }}</span>
													</div>
													<div v-for="row in scoreDetailRows(c)" :key="row.key" class="cqr-item">
														<div class="cqr-top">
															<b>{{ row.label }}</b>
															<span class="cqr-desc">{{ row.desc }}</span>
														</div>
														<div class="cqr-track"><i :style="{ width: row.pct + '%', background: row.color }"></i></div>
														<div class="cqr-val" :style="{ color: row.color }">{{ row.valText }}</div>
													</div>
													<div class="cqr-final">最终得分 <b :style="{ color: qualityColor(c.QualityScore) }">{{ scoreDetail(c)!.Final }}</b> 分 · {{ gradeInfo(c.QualityScore).text }}</div>
												</template>
												<template v-else>
													<div class="cqr-head">
														<b>操作质量评分</b>
														<span>0~100 分，越高越好</span>
													</div>
													<div class="cqr-sec">
														<b>基础分</b>
														<p>每轮从 <b>50 分</b> 起评，按下列四项加减后钳制到 0~100。</p>
													</div>
													<div class="cqr-sec">
														<b>收益贡献 · ±30 封顶</b>
														<p>本轮收益率每 1% 加/扣 <b class="plus">1.5 分</b>（亏损同幅度扣分），封顶 ±30，小赚大赚能拉开差距。</p>
													</div>
													<div class="cqr-sec">
														<b>择时归因</b>
														<p>精准止盈 <b class="plus">+20</b> · 逃顶 <b class="plus">+15</b> · 卖飞 <b class="minus">−10</b>（落袋为安不重罚）；反T/短线/正常不加减。</p>
													</div>
													<div class="cqr-sec">
														<b>耐心达标 · +10</b>
														<p>收益率 &gt; 5% 视同达标直接加分；否则看持有天数是否在流派目标 ±30% 内。</p>
													</div>
													<div class="cqr-sec">
														<b>费用侵蚀 · −5</b>
														<p>本轮买卖费用合计超过含费买入成本 <b>0.5%</b> 扣 5 分（小额频繁交易摩擦成本提醒）。</p>
													</div>
													<div class="cqr-sec">
														<b>评级</b>
														<p>S ≥85 优秀 · A 70~84 良好 · B 50~69 及格 · C &lt;50 不及格</p>
													</div>
												</template>
											</div>
										</el-popover>
										<b class="cq-score" :style="{ color: qualityColor(c.QualityScore) }">{{ c.QualityScore }}</b>
										<span class="cq-unit">分</span>
										<span class="cq-grade" :class="gradeInfo(c.QualityScore).cls">{{ gradeInfo(c.QualityScore).text }}</span>
										<span class="cq-hold">持有 {{ c.HoldDays }} 天</span>
										<div class="cq-track">
											<div class="cq-fill" :style="{ width: Math.min(100, c.QualityScore) + '%', background: qualityGrad(c.QualityScore) }"></div>
										</div>
									</div>
									<div v-if="c.IsClosed && c.TrendData && c.TrendData.length" class="cycle-trend">
										<div class="ct-head">
											<span class="ct-title">当期 K 线（前复权 · B/S 买卖点）</span>
											<span v-if="hasMarket(c)" class="ct-bench">虚线=上证对比</span>
										</div>
										<div class="ct-main">
											<!-- 左列：T+N 数值卡（涨跌幅 + 加粗超额）；右侧：带零轴与 Y 轴刻度的走势图 -->
											<div class="ct-nums">
												<div v-for="t in c.TrendData" :key="t.Window" class="tn-item">
													<div class="tn-row">
														<span class="tn-key">T+{{ t.Window }}</span>
														<b class="tn-val" :class="changeClass(t.ChangePct)">{{ fmtPct(t.ChangePct) }}</b>
													</div>
													<div v-if="hasMarket(c)" class="tn-row">
														<span class="tn-key">超额</span>
														<b class="tn-excess" :class="changeClass(t.ExcessPct)">{{ fmtPct(t.ExcessPct) }}</b>
													</div>
												</div>
											</div>
											<div :ref="el => setSparkRef(c.CycleSeq, el as HTMLElement)" class="cycle-kmini"></div>
										</div>
									</div>
									<div v-else-if="c.IsClosed" class="cycle-trend-none">清仓后行情数据不足，走势仅供参考</div>
									<!-- 买卖明细：时间轴式列表（红点买入 / 绿点卖出，去表格化） -->
									<div v-if="cycleRecords(c).length" class="cycle-records">
										<span class="cr-title">本轮买卖明细</span>
										<div v-for="r in visibleRecords(c)" :key="r.Id" class="cr-row">
											<span class="cr-dot" :class="r.Category === 1 ? 'is-buy' : 'is-sell'"></span>
											<span class="cr-date">{{ dayjs(r.TradeDate).format('YY-MM-DD') }}</span>
											<span class="cr-kind" :class="r.Category === 1 ? 'is-buy' : 'is-sell'">{{ r.Category === 1 ? '买入' : '卖出' }}</span>
											<span class="cr-vol">{{ r.Volume ? fmtVolume(r.Volume) : '' }} 股</span>
											<span class="cr-price">@ {{ r.Price ? r.Price.toFixed(3) : '' }}</span>
											<span class="cr-amt">金额 {{ formatThousands(r.Amount) }}</span>
										</div>
										<div v-if="cycleRecords(c).length > REC_PREVIEW && !openAllSeqs.has(c.CycleSeq)" class="cr-more">
											<el-button size="small" text @click="openAllSeqs.add(c.CycleSeq)">展开全部 {{ cycleRecords(c).length }} 条</el-button>
										</div>
									</div>
								</div>
								<div v-if="c.IsClosed && c.CycleId > 0" class="cb-right">
									<div class="cycle-ai">
										<div class="ai-head">
											<span class="ai-label">AI 评语</span>
											<el-tooltip :content="c.AiComment ? '重新生成' : '生成评语'" placement="top">
												<el-button class="ai-refresh" text size="small" :loading="aiLoadingSeqs.has(c.CycleSeq)" @click="regenerateAi(c)">
													<font-awesome-icon icon="fa-solid fa-rotate" />
												</el-button>
											</el-tooltip>
										</div>
										<div v-if="c.AttributionTag || buyTagInfo(c)" class="ai-tags">
											<el-tag v-if="c.AttributionTag" :type="tagColor(c.AttributionTag)" size="small" effect="plain">{{ tagLabel(c.AttributionTag) }}</el-tag>
											<el-tag v-if="buyTagInfo(c)" :type="buyTagInfo(c)!.type" size="small" effect="plain">{{ buyTagInfo(c)!.label }}</el-tag>
										</div>
										<div v-if="c.AiComment" class="ai-text">{{ c.AiComment }}</div>
										<div v-else class="ai-text ai-none">尚未生成评语，点击右侧按钮生成</div>
									</div>
									<!-- 关联复盘笔记：独立区块，长文默认两行截断可点开 -->
									<div v-if="c.ReviewRefs && c.ReviewRefs.length" class="cycle-reviews">
										<span class="cv-title">关联复盘笔记（{{ c.ReviewRefs.length }}）</span>
										<div v-for="rv in c.ReviewRefs" :key="rv.Id" class="cv-item">
											<el-tag size="small" :type="rv.IsBoundary ? 'warning' : 'info'" effect="plain">{{ rv.IsBoundary ? '边界' : '区间' }}</el-tag>
											<span
												class="cv-text"
												:class="{ 'is-open': openNoteKeys.has(c.CycleSeq + '-' + rv.Id) }"
												:title="reviewFull(rv.Id)"
												@click="toggleNote(c.CycleSeq + '-' + rv.Id)"
											>{{ reviewFull(rv.Id) }}</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<!-- 默认仅展示最近 8 轮（新→旧），筛选/轮次数 ≤ 8 时自然全部展示 -->
					<div v-if="!showAllCycles && filteredCycles.length > CYCLE_PREVIEW" class="cycle-expand">
						<el-button size="small" text @click="showAllCycles = true">展开全部 {{ filteredCycles.length }} 轮（已隐藏 {{ filteredCycles.length - CYCLE_PREVIEW }} 轮较早记录）</el-button>
					</div>
					<div v-else-if="showAllCycles && filteredCycles.length > CYCLE_PREVIEW" class="cycle-expand">
						<el-button size="small" text @click="showAllCycles = false">收起，仅看最近 {{ CYCLE_PREVIEW }} 轮</el-button>
					</div>
				</div>
			</div>

			<!-- 图表：累计盈亏走势（面积线）+ 每笔费用构成（堆叠柱） -->
			<div class="mtp-chart">
				<div class="chart-head">
					<span class="chart-title">盈亏走势</span>
					<span class="chart-tip">累计净盈亏（按卖出时点更新；已扣除佣金、印花税、过户费等全部费用）</span>
				</div>
				<div v-if="timeline.length" ref="chartRef" class="chart-body"></div>
				<div v-else class="chart-none">暂无买卖成交记录（资金流水类记录不参与统计）</div>
			</div>

			<!-- 交易明细（含费用与每笔盈亏） -->
			<div class="mtp-table-head">
				<span class="table-title">交易明细</span>
				<span class="table-tip">共 {{ data.Records.length }} 条记录（含资金流水）；盈亏为卖出净盈亏（已扣除全部费用）</span>
			</div>
			<el-table :data="data.Records" size="small" class="mtp-table" empty-text="暂无交易记录" max-height="420">
				<el-table-column label="日期时间" width="150">
					<template #default="scope">{{ fmtTradeTime(scope.row) }}</template>
				</el-table-column>
				<el-table-column label="类别" width="104">
					<template #default="scope">
						<el-tag :type="categoryItem(scope.row.Category)?.tag" size="small">
							{{ scope.row.CategoryName || categoryItem(scope.row.Category)?.label }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="数量" width="96" align="right">
					<template #default="scope">{{ scope.row.Volume ? fmtVolume(scope.row.Volume) : '' }}</template>
				</el-table-column>
				<el-table-column label="均价" width="84" align="right">
					<template #default="scope">{{ scope.row.Price ? scope.row.Price.toFixed(3) : '' }}</template>
				</el-table-column>
				<el-table-column label="成交金额" width="106" align="right">
					<template #default="scope">{{ scope.row.Amount ? formatThousands(scope.row.Amount) : '' }}</template>
				</el-table-column>
				<el-table-column label="发生金额" width="112" align="right">
					<template #default="scope">
						<span :class="changeClass(scope.row.CashAmount)">{{ formatThousands(scope.row.CashAmount, true) }}</span>
					</template>
				</el-table-column>
				<el-table-column label="佣金" width="84" align="right">
					<template #default="scope">{{ scope.row.Commission ? formatThousands(scope.row.Commission) : '' }}</template>
				</el-table-column>
				<el-table-column label="印花税" width="84" align="right">
					<template #default="scope">{{ scope.row.StampTax ? formatThousands(scope.row.StampTax) : '' }}</template>
				</el-table-column>
				<el-table-column label="过户费" width="84" align="right">
					<template #default="scope">{{ scope.row.TransferFee ? formatThousands(scope.row.TransferFee) : '' }}</template>
				</el-table-column>
				<el-table-column width="106" align="right">
					<template #header>
						<el-tooltip content="卖出净盈亏（已扣除买卖全部费用：佣金/印花税/过户费）" placement="top">
							<span>盈亏</span>
						</el-tooltip>
					</template>
					<template #default="scope">
						<span v-if="profitOf(scope.row) !== null" :class="changeClass(profitOf(scope.row)!)">
							{{ formatThousands(profitOf(scope.row)!, true) }}
						</span>
					</template>
				</el-table-column>
			</el-table>

			<!-- 复盘笔记区已拆至独立 Tab 组件 StockReviewPanel.vue（轮次卡片仅保留关联笔记摘要） -->
		</template>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { dayjs, ElMessage } from 'element-plus'
import { calcProfitStat, formatPercent, formatThousands, sortTradeRecords } from '@/consts/zhiduoxing-const'
import { IZdxStockTradeSummary, IZdxTradeCycle, IZdxTradeRecordData, IZdxTradeStockStat, IZdxReview, ICycleScoreDetail, ICycleKline, ZDX_TRADE_CATEGORIES } from '@/interfaces/zhiduoxing/IZdxMyTrade'
import zdxApi from '@/apis/zdx-api'

const props = defineProps<{
	// 该股交易汇总（无记录为 null）
	data: IZdxStockTradeSummary | null
	// 加载中（切换股票时）
	loading: boolean
	// 复盘刷新键（悬浮球保存/删除复盘后自增，触发笔记列表刷新；可选）
	reviewKey?: number
	// 定位展开轮次序号（实盘台账“第 N 轮”徽标跳转；变化时展开对应卡片并滚动进可视区）
	focusCycleSeq?: number | null
}>()

const emit = defineEmits<{
	(e: 'gotoZone'): void
}>()

// 涨红跌绿（与行情页一致）
const upColor = '#f56c6c'
const downColor = '#67c23a'

// ---------- 关联复盘笔记（仅供轮次卡片展示关联笔记标题；笔记列表展示已拆至 StockReviewPanel） ----------
const notes = ref<IZdxReview[]>([])

async function loadNotes() {
	const code = props.data?.StockCode
	if (!code) {
		notes.value = []
		return
	}
	try {
		notes.value = await zdxApi.getReviewList({ type: 4, stockCode: code, max: 100 })
	} catch {
		notes.value = []
	}
}

// 切换股票时加载该股复盘笔记
watch(() => props.data?.StockCode, () => loadNotes(), { immediate: true })

// 复盘悬浮球保存/删除后（reviewKey 变化）刷新笔记列表
watch(() => props.reviewKey, () => loadNotes())

// 无统计时兜底（该股仅有资金流水类记录时后端 Stats 为 null）
const EMPTY_STAT: IZdxTradeStockStat = {
	StockCode: '',
	StockName: '',
	TradeCount: 0,
	BuyCount: 0,
	SellCount: 0,
	WinSellCount: 0,
	WinRate: 0,
	ProfitRatio: 0,
	AvgProfit: 0,
	AvgLoss: 0,
	BuyAmount: 0,
	SellAmount: 0,
	RealizedProfit: 0,
	LastTradeDate: ''
}
const stats = computed<IZdxTradeStockStat>(() => props.data?.Stats ?? EMPTY_STAT)

// ---------- 时间线（前端复刻后端移动加权口径：买入成本=金额+费用；卖出盈亏=金额-成本×匹配数量-费用） ----------
interface ITimelinePoint {
	// 记录 Id（关联表格行）
	Id: number
	// X 轴标签（MM-DD 或 MM-DD HH:mm）
	label: string
	// 完整时间（tooltip）
	full: string
	// 交易类别（1买入 2卖出）
	Category: number
	// 成交金额（元）
	Amount: number
	// 该笔净盈亏（仅卖出有值）
	Profit: number | null
	// 佣金及杂费（佣金+其他费用）
	Commission: number
	// 印花税
	StampTax: number
	// 过户费
	TransferFee: number
	// 累计净盈亏（买入笔延续前值）
	CumProfit: number
}

const timeline = computed<ITimelinePoint[]>(() => {
	const records = props.data?.Records ?? []
	const sorted = sortTradeRecords(records)
	const points: ITimelinePoint[] = []
	let volume = 0
	let costTotal = 0
	let cumProfit = 0
	for (const r of sorted) {
		// 仅买卖成交类参与（银证转账/红利/利息等仅留档）
		if (r.Category !== 1 && r.Category !== 2) continue
		const commission = (r.Commission ?? 0) + (r.OtherFee ?? 0)
		const stampTax = r.StampTax ?? 0
		const transferFee = r.TransferFee ?? 0
		const fee = commission + stampTax + transferFee
		// 成交金额缺失时以发生金额还原兜底：买入发生金额=-(成交金额+费用)、卖出发生金额=成交金额-费用
		const amount =
			r.Amount > 0
				? r.Amount
				: r.Category === 1
					? Math.max(0, Math.abs(r.CashAmount ?? 0) - fee)
					: Math.max(0, Math.abs(r.CashAmount ?? 0) + fee)
		let profit: number | null = null
		if (r.Category === 1) {
			volume += r.Volume
			costTotal += amount + fee
		} else {
			const avgCost = volume > 0 ? costTotal / volume : 0
			const matched = Math.min(r.Volume, volume)
			// 持仓不足（期初缺失）时按匹配比例摊分成交金额与费用
			const ratio = r.Volume > 0 ? matched / r.Volume : 0
			profit = amount * ratio - avgCost * matched - fee * ratio
			volume -= matched
			costTotal -= avgCost * matched
			if (volume <= 0) volume = 0
			if (costTotal < 0) costTotal = 0
			cumProfit += profit
		}
		const date = dayjs(r.TradeDate).format('MM-DD')
		points.push({
			Id: r.Id,
			label: r.TradeTime ? `${date} ${r.TradeTime.slice(0, 5)}` : date,
			full: fmtTradeTime(r),
			Category: r.Category,
			Amount: round2(amount),
			Profit: profit === null ? null : round2(profit),
			Commission: round2(commission),
			StampTax: round2(stampTax),
			TransferFee: round2(transferFee),
			CumProfit: round2(cumProfit)
		})
	}
	return points
})

// ---------- 清仓轮次（后端 CalcCycles 推导：空仓→建仓→清仓为一轮，券商“清仓盈亏”口径） ----------
// 附加轮次序号（第 N 轮），最新轮在前展示
const cycles = computed(() => {
	const list = props.data?.Cycles ?? []
	return list.map((c, i) => ({ ...c, round: i + 1 })).reverse()
})

// 分类筛选（大额盈利/大额亏损/高频做T；阈值常量化，与卡片徽章语义对齐）
type CycleFilterKey = 'all' | 'bigProfit' | 'bigLoss' | '高频'
const FILTER_BIG_PROFIT_RATE = 10
const FILTER_BIG_LOSS_RATE = -10
const FILTER_T_MIN_TRADES = 6
const FILTER_T_MAX_HOLD_DAYS = 15
const CYCLE_FILTERS: { key: CycleFilterKey, label: string }[] = [
	{ key: 'all', label: '全部' },
	{ key: 'bigProfit', label: '大额盈利' },
	{ key: 'bigLoss', label: '大额亏损' },
	{ key: '高频', label: '高频做T' }
]
const cycleFilter = ref<CycleFilterKey>('all')

function matchCycleFilter(c: IZdxTradeCycle) {
	switch (cycleFilter.value) {
		case 'bigProfit': return c.IsClosed && c.ProfitRate >= FILTER_BIG_PROFIT_RATE
		case 'bigLoss': return c.IsClosed && c.ProfitRate <= FILTER_BIG_LOSS_RATE
		case '高频': return c.IsClosed && (c.BuyCount + c.SellCount) >= FILTER_T_MIN_TRADES && c.HoldDays <= FILTER_T_MAX_HOLD_DAYS
		default: return true
	}
}

// 筛选结果（最新轮在前）
const filteredCycles = computed(() => cycles.value.filter(c => matchCycleFilter(c)))

// 默认仅展示最近 8 轮（列表过长视觉灾难；“展开全部”可放开）
const CYCLE_PREVIEW = 8
const showAllCycles = ref(false)
const visibleCycles = computed(() =>
	showAllCycles.value || filteredCycles.value.length <= CYCLE_PREVIEW
		? filteredCycles.value
		: filteredCycles.value.slice(0, CYCLE_PREVIEW)
)

// 轮次持仓周期文案（统一短年份 YY-MM-DD：跨年轮次混排也能区分年份；持仓中：起始日 ~ 持仓中）
function cyclePeriod(c: IZdxTradeCycle) {
	const s = dayjs(c.StartDate)
	if (!c.IsClosed || !c.EndDate) return `${s.format('YY-MM-DD')} ~ 持仓中`
	const e = dayjs(c.EndDate)
	return `${s.format('YY-MM-DD')} ~ ${e.format('YY-MM-DD')}`
}

// ---------- 清仓轮次卡片（展开/归因/迷你 K 线(AI 评语/关联笔记) ----------
// 展开的轮次序号集合（默认收起；切换股票时全部收起）
const expandedSeqs = ref(new Set<number>())
// AI 评语生成中的轮次序号集合（按钮 loading 防重复提交）
const aiLoadingSeqs = ref(new Set<number>())

function toggleCycle(seq: number) {
	if (expandedSeqs.value.has(seq)) {
		expandedSeqs.value.delete(seq)
		disposeSpark(seq)
	} else {
		// 聚焦展开：收起其余轮次并释放旧实例，一次只看一轮
		for (const s of Array.from(expandedSeqs.value)) {
			expandedSeqs.value.delete(s)
			disposeSpark(s)
		}
		expandedSeqs.value.add(seq)
		renderSparks()
	}
}

// 实盘台账跳转定位用列表容器
const cycleListEl = ref<HTMLElement>()

// 展开时自动定位：台账跳转目标不在当前可见集（被筛选/截断隐藏）时，回“全部”并展开全量再滚动
watch(
	() => props.focusCycleSeq,
	seq => {
		if (!seq) return
		const inView = visibleCycles.value.some(c => c.CycleSeq === seq)
		if (!inView) {
			cycleFilter.value = 'all'
			showAllCycles.value = true
		}
		for (const s of Array.from(expandedSeqs.value)) {
			if (s !== seq) {
				expandedSeqs.value.delete(s)
				disposeSpark(s)
			}
		}
		expandedSeqs.value.add(seq)
		renderSparks()
		setTimeout(() => {
			const el = cycleListEl.value?.querySelector(`.cycle-card[data-seq="${seq}"]`)
			el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
		}, 150)
	},
	{ immediate: true }
)

// 归因标签文案与色调（与后端 AttributionCalculator 取值一一对应；语义配色：卖飞黄/反T逃顶精准绿/中性灰）
const CYCLE_TAGS: Record<string, { label: string; type: 'warning' | 'info' | 'success' }> = {
	sell_fly: { label: '卖飞', type: 'warning' },
	reverse_t: { label: '反T', type: 'success' },
	short_term: { label: '短线', type: 'info' },
	escape_top: { label: '逃顶', type: 'success' },
	optimal: { label: '精准止盈', type: 'success' },
	normal: { label: '正常', type: 'info' }
}

// 买点表现标签（涨红跌绿语义：买入后大涨=红、买入后大跌=绿；normal 不展示徽标）
const BUY_TAGS: Record<string, { label: string; type: 'danger' | 'success' }> = {
	fly_high: { label: '买入后大涨', type: 'danger' },
	fall_low: { label: '买入后大跌', type: 'success' }
}

function buyTagInfo(c: IZdxTradeCycle) {
	return BUY_TAGS[c.BuyTag ?? ''] ?? null
}

function tagColor(tag?: string | null) {
	return CYCLE_TAGS[tag ?? '']?.type ?? 'info'
}

function tagLabel(tag?: string | null) {
	return CYCLE_TAGS[tag ?? '']?.label ?? '正常'
}

// 卡片左缘归因色竖条（卖飞黄 > 买点大涨红 > 反T/逃顶/精准/买点大跌绿 > 中性灰）
function barColor(c: IZdxTradeCycle) {
	if (c.AttributionTag === 'sell_fly') return '#e6a23c'
	if (c.BuyTag === 'fly_high') return upColor
	if (c.AttributionTag === 'reverse_t' || c.AttributionTag === 'escape_top' || c.AttributionTag === 'optimal' || c.BuyTag === 'fall_low') return downColor
	return '#dcdfe6'
}

// 带符号百分比（+3.21% / -2.10%；涨红跌绿由 changeClass 叠加）
function fmtPct(value: number) {
	return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

// 大盘对比数据可用（历史未回填行全为 0 时不画对比线、不显示超额）
function hasMarket(c: IZdxTradeCycle) {
	return (c.TrendData ?? []).some(t => (t.MarketChangePct ?? 0) !== 0)
}

// 操作质量分颜色（评级三档：≥70 绿(S/A) / ≥50 橙(B) / <50 红(C)；质量分非涨跌语义）
function qualityColor(score?: number | null) {
	const v = score ?? 0
	if (v >= 70) return '#67c23a'
	if (v >= 50) return '#e6a23c'
	return '#f56c6c'
}

// 质量进度条渐变色（同色系深→浅，质感优于纯色块；与 qualityColor 分档一致）
function qualityGrad(score?: number | null) {
	const v = score ?? 0
	if (v >= 70) return 'linear-gradient(90deg, #529b2e, #85ce61)'
	if (v >= 50) return 'linear-gradient(90deg, #d48a1e, #ebb563)'
	return 'linear-gradient(90deg, #e04b4b, #f89898)'
}

// 评分档位评级（2026-10 交易轮次评分设计：S≥85 / A 70~84 / B 50~69 / C <50）
function gradeInfo(score?: number | null): { text: string; cls: string } {
	const v = score ?? 0
	if (v >= 85) return { text: 'S级·优秀', cls: 'cqg-s' }
	if (v >= 70) return { text: 'A级·良好', cls: 'cqg-a' }
	if (v >= 50) return { text: 'B级·及格', cls: 'cqg-b' }
	return { text: 'C级·待改进', cls: 'cqg-c' }
}

// 评分五项明细解析（JSON 字符串→对象；按原文缓存避免 v-for 重复 parse；旧公式行返回 null → 弹层降级为静态规则）
const scoreDetailCache = new Map<string, ICycleScoreDetail | null>()

function scoreDetail(c: IZdxTradeCycle): ICycleScoreDetail | null {
	const s = c.ScoreDetail
	if (!s) return null
	if (scoreDetailCache.has(s)) return scoreDetailCache.get(s) ?? null
	let d: ICycleScoreDetail | null = null
	try {
		d = JSON.parse(s) as ICycleScoreDetail
	} catch {
		d = null
	}
	scoreDetailCache.set(s, d)
	return d
}

// 明细行颜色语义（评分设计：不套用涨跌红绿；加分一律金色亮色，扣分灰色，零分浅灰）
const CQR_PLUS = '#e6a23c'
const CQR_MINUS = '#909399'
const CQR_ZERO = '#c0c4cc'

function scoreDetailRows(c: IZdxTradeCycle) {
	const d = scoreDetail(c)
	if (!d) return []
	const colorOf = (v: number) => (v > 0 ? CQR_PLUS : v < 0 ? CQR_MINUS : CQR_ZERO)
	const textOf = (v: number) => (v > 0 ? `+${v.toFixed(2)} 分` : `${v.toFixed(2)} 分`)
	const feeRate = c.BuyCost > 0 ? (c.FeeSum / c.BuyCost) * 100 : 0
	const patienceDesc = c.ProfitRate > 5
		? '收益率 >5%，视同达标'
		: d.HoldDaysTarget > 0
			? `持有 ${c.HoldDays} 天 / 目标 ${d.HoldDaysTarget} 天 ±30%（${(d.HoldDaysTarget * 0.7).toFixed(0)}~${(d.HoldDaysTarget * 1.3).toFixed(0)}）`
			: '未配置流派目标天数'
	return [
		{ key: 'base', label: '基础分', desc: '每轮起评', pct: Math.min(100, d.Base), color: CQR_ZERO, valText: `${d.Base.toFixed(1)} 分` },
		{ key: 'profit', label: '收益贡献', desc: `收益率 ${c.ProfitRate}% × 1.5（封顶 ±30）`, pct: Math.min(100, (Math.abs(d.Profit) / 30) * 100), color: colorOf(d.Profit), valText: textOf(d.Profit) },
		{ key: 'timing', label: '择时归因', desc: d.Timing === 0 ? '本次无择时加减分' : tagLabel(c.AttributionTag), pct: Math.min(100, (Math.abs(d.Timing) / 20) * 100), color: colorOf(d.Timing), valText: textOf(d.Timing) },
		{ key: 'patience', label: '耐心达标', desc: patienceDesc, pct: d.Patience > 0 ? 100 : 0, color: colorOf(d.Patience), valText: textOf(d.Patience) },
		{ key: 'fee', label: '费用侵蚀', desc: `手续费/成本 = ${feeRate.toFixed(2)}%（>0.5% 扣 5）`, pct: d.Fee < 0 ? 100 : 0, color: colorOf(d.Fee), valText: textOf(d.Fee) }
	]
}

// 本轮买卖明细（[建仓日, 清仓日] 区间内的买入/卖出记录；持仓中取建仓日之后全部）
function cycleRecords(c: IZdxTradeCycle) {
	const start = dayjs(c.StartDate).format('YYYY-MM-DD')
	const end = c.IsClosed && c.EndDate ? dayjs(c.EndDate).format('YYYY-MM-DD') : ''
	return (props.data?.Records ?? []).filter(r => {
		if (r.Category !== 1 && r.Category !== 2) return false
		const d = dayjs(r.TradeDate).format('YYYY-MM-DD')
		return d >= start && (!end || d <= end)
	})
}

// 明细折叠（超过 6 条先截断，点"展开全部"后整轮展示）
const REC_PREVIEW = 6
const openAllSeqs = ref(new Set<number>())

function visibleRecords(c: IZdxTradeCycle) {
	const list = cycleRecords(c)
	return list.length > REC_PREVIEW && !openAllSeqs.value.has(c.CycleSeq) ? list.slice(0, REC_PREVIEW) : list
}

// 关联复盘笔记全文（日期 + 正文首两段摘要；默认两行截断，点开看全）
function reviewFull(id: number) {
	const n = notes.value.find(x => x.Id === id)
	if (!n) return `笔记 #${id}`
	const body = (n.Content || n.PlanContent || n.MoodText || n.TechnicalText || '（无内容）').slice(0, 200)
	return `${dayjs(n.ReviewDate).format('MM-DD')} · ${body}`
}

// 笔记展开态（键：轮次序号-笔记Id；点击切换两行截断/全文）
const openNoteKeys = ref(new Set<string>())

function toggleNote(key: string) {
	if (openNoteKeys.value.has(key)) openNoteKeys.value.delete(key)
	else openNoteKeys.value.add(key)
}

// 轮次迷你 K 线（当期前复权蜡烛 + B/S 标记 + 上证归一化对比；每个展开轮次一个 echarts 小实例，数据按 CycleSeq 缓存惰性拉取）
const sparkEls = new Map<number, HTMLElement>()
const sparks = new Map<number, echarts.ECharts>()
const klineCache = new Map<number, ICycleKline | null>()
const klineLoading = new Set<number>()

function setSparkRef(seq: number, el: HTMLElement | null) {
	if (el) {
		sparkEls.set(seq, el)
	} else {
		sparkEls.delete(seq)
		disposeSpark(seq)
	}
}

function disposeSpark(seq: number) {
	sparks.get(seq)?.dispose()
	sparks.delete(seq)
}

// 迷你 K 线配置（涨红跌绿蜡烛 + B/S/T 标记散点 + 上证归一化虚线右轴；基准按蜡烛首日对齐）
function buildKminiOption(k: ICycleKline): echarts.EChartsOption {
	const dates = k.Candles.map(c => c.Date)
	const idx = new Map(dates.map((d, i) => [d, i]))
	const candles = k.Candles.map(c => [c.Open, c.Close, c.Low, c.High])
	// 买卖点合并：同日仅买=B、仅卖=S、双向=T（与“反T”徽标语义一致）
	type KMark = { idx: number, kind: 'B' | 'S' | 'T', price: number, buyVol: number, sellVol: number }
	const byDate = new Map<string, { buy?: number, sell?: number, buyVol: number, sellVol: number }>()
	for (const m of k.Marks) {
		const cur = byDate.get(m.Date) ?? { buyVol: 0, sellVol: 0 }
		if (m.Category === 1) { cur.buy = m.Price; cur.buyVol += m.Volume }
		else { cur.sell = m.Price; cur.sellVol += m.Volume }
		byDate.set(m.Date, cur)
	}
	const marks: KMark[] = []
	byDate.forEach((v, d) => {
		const i = idx.get(d)
		if (i === undefined) return // 成交日无蜡烛（停牌/缺数据）：不画标记
		if (v.buy != null && v.sell != null) marks.push({ idx: i, kind: 'T', price: v.buy, buyVol: v.buyVol, sellVol: v.sellVol })
		else if (v.buy != null) marks.push({ idx: i, kind: 'B', price: v.buy, buyVol: v.buyVol, sellVol: 0 })
		else if (v.sell != null) marks.push({ idx: i, kind: 'S', price: v.sell, buyVol: 0, sellVol: v.sellVol })
	})
	// 标记点颜色也走涨红跌绿语义（买=红、卖=绿、T=金）
	const mkData = marks.map(m => ({
		value: [m.idx, m.price],
		itemStyle: { color: m.kind === 'B' ? upColor : m.kind === 'S' ? downColor : '#e6a23c' }
	}))
	// 上证归一化（相对区间首日涨跌幅，缩放到本股首蜡烛收盘基准）
	let benchData: (number | null)[] = []
	if (k.Bench.length > 1) {
		const base = k.Bench[0].Close
		const stockBase = k.Candles[0].Close
		benchData = dates.map(d => {
			const b = k.Bench.find(x => x.Date === d)
			return b && b.Close > 0 ? Number((((b.Close / base) - 1) * stockBase + stockBase).toFixed(3)) : null
		})
	}
	const series: echarts.SeriesOption[] = [
		{
			type: 'candlestick',
			data: candles,
			yAxisIndex: 0,
			itemStyle: { color: upColor, color0: downColor, borderColor: upColor, borderColor0: downColor }
		},
		{
			type: 'scatter',
			data: mkData,
			symbolSize: 13,
			z: 6,
			tooltip: {
				formatter: (p: any) => {
					const m = marks[p.dataIndex]
					if (!m) return ''
					const d = dates[m.idx]
					if (m.kind === 'B') return `${d}<br/>买入 @ ${m.price.toFixed(3)} · ${fmtVolume(m.buyVol)} 股`
					if (m.kind === 'S') return `${d}<br/>卖出 @ ${m.price.toFixed(3)} · ${fmtVolume(m.sellVol)} 股`
					return `${d}<br/>做T：买 @ ${m.price.toFixed(3)} ${fmtVolume(m.buyVol)} 股 / 卖 ${fmtVolume(m.sellVol)} 股`
				}
			}
		}
	]
	if (benchData.length) {
		series.push({
			type: 'line',
			data: benchData,
			symbol: 'none',
			yAxisIndex: 1,
			lineStyle: { width: 1.2, color: '#909399', type: 'dashed' },
			itemStyle: { color: '#909399' }
		})
	}
	return {
		animation: false,
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'line', lineStyle: { color: '#c0c4cc' } },
			backgroundColor: 'rgba(255, 255, 255, 0.96)',
			borderColor: '#eef0f7',
			padding: 8,
			textStyle: { color: '#2e3543', fontSize: 12 },
			formatter: (params: any) => {
				const arr = Array.isArray(params) ? params : [params]
				const cd = arr.find((e: any) => e.seriesType === 'candlestick')
				let html = cd ? `${cd.axisValue}<br/>开 ${(+cd.data[1]).toFixed(2)} 收 ${(+cd.data[2]).toFixed(2)}<br/>低 ${(+cd.data[3]).toFixed(2)} 高 ${(+cd.data[4]).toFixed(2)}` : ''
				const bd = arr.find((e: any) => e.seriesType === 'line')
				if (bd && bd.value != null && k.Bench.length > 1) {
					const bi = k.Bench.findIndex(x => x.Date === bd.axisValue)
					if (bi >= 0) html += `<br/>上证区间 ${fmtPct(Number(((k.Bench[bi].Close / k.Bench[0].Close) - 1) * 100))}`
				}
				return html
			}
		},
		grid: { left: 48, right: benchData.length ? 42 : 10, top: 14, bottom: 18 },
		xAxis: {
			type: 'category',
			data: dates,
			axisLabel: { fontSize: 10, color: '#a7abba', formatter: (v: string) => (v || '').slice(2) },
			axisLine: { lineStyle: { color: '#e6e8f0' } },
			axisTick: { show: false },
			splitLine: { show: false }
		},
		yAxis: [
			{ type: 'value', scale: true, position: 'left', axisLabel: { fontSize: 10, color: '#a7abba' }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false } },
			{ type: 'value', show: false } // 归一化基准线专用（与左轴同首点量级，天然对齐）
		],
		series
	}
}

// 惰性拉取并渲染单轮迷你 K 线（同股同区间缓存；失败缓存 null 不重试轰炸）
async function renderKmini(c: IZdxTradeCycle) {
	const el = sparkEls.get(c.CycleSeq)
	if (!el) return
	const start = dayjs(c.StartDate).format('YYYY-MM-DD')
	const end = (c.EndDate ?? dayjs().format('YYYY-MM-DD'))
	const endS = (typeof end === 'string' ? end : dayjs(end as any).format('YYYY-MM-DD'))
	let k = klineCache.get(c.CycleSeq)
	if (k === undefined && !klineLoading.has(c.CycleSeq)) {
		klineLoading.add(c.CycleSeq)
		try {
			k = await zdxApi.getCycleKline(props.data?.StockCode ?? '', start, endS)
			if (!k?.Success || !k.Candles?.length) k = null
		} catch {
			k = null
		}
		klineLoading.delete(c.CycleSeq)
		klineCache.set(c.CycleSeq, k)
	}
	if (!k) return
	if (!expandedSeqs.value.has(c.CycleSeq)) return // 拉取期间已收起则不再渲染
	let inst = sparks.get(c.CycleSeq)
	if (!inst || inst.isDisposed()) {
		inst = echarts.init(el)
		sparks.set(c.CycleSeq, inst)
	}
	inst.setOption(buildKminiOption(k), true)
}

// 渲染展开轮次的迷你 K 线（聚焦展开下至多一轮；nextTick 后取容器）
async function renderSparks() {
	await nextTick()
	for (const c of visibleCycles.value) {
		if (!c.IsClosed || !expandedSeqs.value.has(c.CycleSeq)) continue
		renderKmini(c)
	}
}

// 生成/重新生成单轮 AI 评语（CycleId 定位落库行；成功后回填源数据触发轮次 computed 刷新）
async function regenerateAi(c: IZdxTradeCycle) {
	if (!c.CycleId || aiLoadingSeqs.value.has(c.CycleSeq)) return
	aiLoadingSeqs.value.add(c.CycleSeq)
	try {
		const res = await zdxApi.refreshCycleAi(c.CycleId)
		if (res?.Success && res.AiComment) {
			const src = (props.data?.Cycles ?? []).find(x => x.CycleSeq === c.CycleSeq)
			if (src) src.AiComment = res.AiComment
		} else {
			ElMessage.error('AI 评语生成失败，请稍后重试')
		}
	} catch (err: any) {
		ElMessage.error(err?.message || 'AI 评语生成失败')
	} finally {
		aiLoadingSeqs.value.delete(c.CycleSeq)
	}
}

// 切换股票：收起全部轮次、重置筛选/展开态，并释放全部迷你 K 线实例与缓存
watch(
	() => props.data?.StockCode,
	() => {
		expandedSeqs.value.clear()
		openAllSeqs.value.clear()
		cycleFilter.value = 'all'
		showAllCycles.value = false
		sparkEls.clear()
		for (const s of sparks.values()) s.dispose()
		sparks.clear()
		klineCache.clear()
		klineLoading.clear()
	}
)

// 每笔盈亏映射（表格“盈亏”列；仅卖出笔有值）
const profitMap = computed(() => new Map(timeline.value.map(p => [p.Id, p.Profit])))

// 费用汇总（仅买卖类，与后端 fee 口径一致）
const feeSummary = computed(() => {
	let commission = 0
	let stampTax = 0
	let transferFee = 0
	for (const p of timeline.value) {
		commission += p.Commission
		stampTax += p.StampTax
		transferFee += p.TransferFee
	}
	return { commission, stampTax, transferFee, total: commission + stampTax + transferFee }
})

// 盈亏聚合（平均盈利/平均亏损/盈亏比；与后端移动加权口径一致，个股页简略条同源）
const profitStat = computed(() => calcProfitStat(props.data?.Records ?? []))

// 红利入账汇总（Category=5 资金流水类；净额口径 Σ发生金额，红利税扣缴为负；无红利记录返回 null 不展示卡片）
const dividendSummary = computed(() => {
	const list = (props.data?.Records ?? []).filter(r => r.Category === 5)
	if (!list.length) return null
	let total = 0
	for (const r of list) total += r.CashAmount !== 0 ? r.CashAmount : r.Amount
	return { total, count: list.length }
})

// 盈亏比颜色（>1 红 / <1 绿；无亏损笔或等于 1 无色）
const ratioClass = computed(() => {
	const r = profitStat.value.ratio
	if (r === null || r === 1) return ''
	return r > 1 ? 'up' : 'down'
})

// 胜率颜色（>50% 红 / <50% 绿；无卖出或等于 50% 无色）
const winRateClass = computed(() => {
	if (!stats.value.SellCount) return ''
	if (stats.value.WinRate > 50) return 'up'
	if (stats.value.WinRate < 50) return 'down'
	return ''
})

function profitOf(row: IZdxTradeRecordData): number | null {
	return profitMap.value.has(row.Id) ? profitMap.value.get(row.Id)! : null
}

// ---------- 图表 ----------
const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

// tooltip（十字定位 + 该笔详情）
function tooltipFormatter(params: any[]) {
	const idx = params?.[0]?.dataIndex
	const p = timeline.value[idx]
	if (!p) return ''
	const color = (v: number) => (v >= 0 ? upColor : downColor)
	const profitLine =
		p.Profit === null
			? ''
			: `<div>该笔盈亏：<b style="color:${color(p.Profit)}">${formatThousands(p.Profit, true)}</b></div>`
	return (
		`<div style="font-weight:600;margin-bottom:4px">${p.full}&nbsp;&nbsp;&nbsp;${p.Category === 1 ? '买入' : '卖出'}</div>` +
		`<div>成交金额：${formatThousands(p.Amount)}</div>` +
		profitLine +
		`<div style="margin-top:4px;padding-top:4px;border-top:1px dashed #eef0f7">` +
		`<div>佣金及杂费：${formatThousands(p.Commission)}</div>` +
		`<div>印花税：${formatThousands(p.StampTax)}</div>` +
		`<div>过户费：${formatThousands(p.TransferFee)}</div>` +
		`</div>` +
		`<div style="margin-top:4px;padding-top:4px;border-top:1px dashed #eef0f7">` +
		`累计盈亏：<b style="color:${color(p.CumProfit)}">${formatThousands(p.CumProfit, true)}</b>` +
		`<span style="color:#a7abba;font-size:11px">（已扣费用）</span></div>`
	)
}

function buildOption(): echarts.EChartsOption {
	const points = timeline.value
	const last = points[points.length - 1]
	// 累计盈亏线颜色随最终盈亏（红=盈利、绿=亏损、蓝=持平）
	const lineColor = !last || last.CumProfit === 0 ? '#409eff' : last.CumProfit > 0 ? upColor : downColor
	return {
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'line' },
			backgroundColor: 'rgba(255, 255, 255, 0.96)',
			borderColor: '#eef0f7',
			padding: 10,
			textStyle: { color: '#2e3543', fontSize: 12 },
			extraCssText: 'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); border-radius: 8px;',
			formatter: (params: any) => tooltipFormatter(params)
		},
		grid: { left: 76, right: 30, top: 36, bottom: 30 },
		xAxis: {
			type: 'category',
			data: points.map(p => p.label),
			axisLine: { lineStyle: { color: '#e4e7ed' } },
			axisTick: { show: false },
			axisLabel: { color: '#909399', fontSize: 11 }
		},
		yAxis: {
			type: 'value',
			name: '盈亏(元)',
			nameGap: 12,
			nameTextStyle: { color: '#a7abba', fontSize: 11 },
			scale: true,
			splitLine: { lineStyle: { color: '#f0f2f5' } },
			axisLabel: { color: '#909399', fontSize: 11, formatter: (value: number) => formatThousands(value) }
		},
		series: [
			{
				name: '累计盈亏',
				type: 'line',
				data: points.map(p => p.CumProfit),
				symbol: 'circle',
				symbolSize: 5,
				lineStyle: { width: 2, color: lineColor },
				itemStyle: { color: lineColor },
				areaStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: toRgba(lineColor, 0.25) },
						{ offset: 1, color: toRgba(lineColor, 0.02) }
					])
				},
				markLine: {
					silent: true,
					symbol: 'none',
					label: { show: false },
					lineStyle: { color: '#dcdfe6', type: 'dashed', width: 1 },
					data: [{ yAxis: 0 }]
				},
				z: 3
			}
		]
	}
}

async function renderChart() {
	if (!timeline.value.length) {
		resizeObserver?.disconnect()
		resizeObserver = null
		chart?.dispose()
		chart = null
		return
	}
	await nextTick()
	const el = chartRef.value
	if (!el) return
	if (!chart) {
		chart = echarts.init(el)
		// 容器尺寸变化（Tab 显隐/窗口缩放）时自适应
		resizeObserver = new ResizeObserver(() => chart?.resize())
		resizeObserver.observe(el)
	}
	chart.setOption(buildOption(), true)
}

watch(() => props.data, () => renderChart(), { immediate: true })

onUnmounted(() => {
	resizeObserver?.disconnect()
	resizeObserver = null
	chart?.dispose()
	chart = null
	for (const s of sparks.values()) s.dispose()
	sparks.clear()
})

// ---------- 格式化 ----------
function fmtTradeTime(r: IZdxTradeRecordData) {
	const date = dayjs(r.TradeDate).format('YYYY-MM-DD')
	return r.TradeTime ? `${date} ${r.TradeTime}` : date
}

function fmtVolume(value: number) {
	return Number.isInteger(value) ? value.toString() : value.toFixed(2)
}

function categoryItem(category: number) {
	return ZDX_TRADE_CATEGORIES.find(c => c.value === category)
}

function changeClass(value?: number) {
	if (value === undefined || value === null || value === 0) return ''
	return value > 0 ? 'up' : 'down'
}

function round2(value: number) {
	return Math.round(value * 100) / 100
}

function toRgba(hex: string, alpha: number) {
	const r = parseInt(hex.slice(1, 3), 16)
	const g = parseInt(hex.slice(3, 5), 16)
	const b = parseInt(hex.slice(5, 7), 16)
	return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
</script>

<style lang="scss" scoped>
.my-trade-panel {
	min-height: 220px;

	// 涨红跌绿
	.up {
		color: var(--el-color-danger);
	}

	.down {
		color: var(--el-color-success);
	}

	.mtp-empty {
		padding: 30px 0;
	}

	// 概览统计卡（auto-fit 自适应：宽屏 5 列，窄屏自动折行防挤压）
	.mtp-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(196px, 1fr));
		gap: 12px;
		margin: 16px 0 12px;

		.stat-item {
			min-width: 0;
			padding: 12px 16px;
			background: #f7f8fc;
			border-radius: 10px;

			.stat-label {
				display: flex;
				align-items: center;
				gap: 4px;
				font-size: 12px;
				color: #a7abba;

				.stat-help {
					font-size: 12px;
					color: #c0c4cc;
					cursor: help;
					transition: color 0.2s;

					&:hover {
						color: var(--el-color-primary);
					}
				}
			}

			.stat-value {
				margin-top: 4px;
				font-size: 20px;
				font-weight: 700;
				color: #2e3543;
				font-variant-numeric: tabular-nums;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;

				&.up {
					color: var(--el-color-danger);
				}

				&.down {
					color: var(--el-color-success);
				}
			}

			.stat-sub {
				margin-top: 4px;
				font-size: 12px;
				color: #909399;
				line-height: 18px;
			}
		}
	}

	// 持仓条
	.mtp-position {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 24px;
		padding: 10px 16px;
		font-size: 13px;
		color: #5c6370;
		background: #f7f8fc;
		border-radius: 10px;

		.pos-label {
			font-weight: 600;
			color: #2e3543;
		}

		b {
			font-weight: 600;
		}
	}

	// 清仓轮次卡片列表（收起态一行摘要，展开态归因/质量/T+N/AI/明细/关联笔记）
	.mtp-cycles {
		.cycle-filter {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
			margin-top: 8px;

			.cf-chip {
				padding: 2px 10px;
				border-radius: 12px;
				font-size: 12px;
				color: #606266;
				background: #f4f6fa;
				cursor: pointer;
				user-select: none;
				transition: all 0.15s;

				&:hover {
					color: #409eff;
				}

				&.active {
					color: #fff;
					background: #409eff;
				}
			}
		}

		.cycle-list {
			display: flex;
			flex-direction: column;
			gap: 8px;
			margin: 10px 0 4px;
		}

		.cycle-expand {
			margin-top: 6px;
			text-align: center;
		}

		.cycle-card {
			position: relative;
			background: #f7f8fc;
			border: 1px solid transparent;
			border-radius: 10px;
			transition:
				border-color 0.2s,
				background 0.2s;

			// 左缘归因色竖条（颜色由 --bar-color 内联变量控制）
			&::before {
				content: '';
				position: absolute;
				left: 0;
				top: 8px;
				bottom: 8px;
				width: 3px;
				border-radius: 0 2px 2px 0;
				background: var(--bar-color, #dcdfe6);
			}

			&.is-open {
				background: #fff;
				border-color: #e4e7ed;
				box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
			}

			.cycle-head {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 8px 12px;
				padding: 10px 14px 10px 18px;
				font-size: 13px;
				cursor: pointer;

				.cycle-seq {
					font-weight: 600;
					color: #2e3543;
				}

				.cycle-period {
					font-size: 12px;
					color: #909399;
					font-variant-numeric: tabular-nums;
				}

				.cycle-spacer {
					flex: 1;
				}

				.cycle-profit,
				.cycle-rate {
					font-weight: 600;
					font-variant-numeric: tabular-nums;
				}

				.cycle-open-btn {
					display: inline-flex;
					align-items: center;
					gap: 4px;
					margin-left: 2px;
					font-size: 12px;
					color: #409eff;
					cursor: pointer;
					white-space: nowrap;
				}
			}

			.cycle-body {
				display: flex;
				flex-direction: column;
				gap: 10px;
				padding: 4px 14px 12px 18px;
				border-top: 1px dashed #eef0f7;
			}

			// 展开区左右分栏：左 65%（质量/走势/明细）+ 右 35%（AI/笔记）；窄屏单列
			.cb-flex {
				display: grid;
				grid-template-columns: minmax(0, 65fr) minmax(0, 35fr);
				gap: 0 20px;
				align-items: start;
				margin-top: 8px;

				&.no-ai {
					grid-template-columns: minmax(0, 1fr);
				}

				@media (max-width: 1100px) {
					grid-template-columns: 1fr;
				}
			}

			.cb-left,
			.cb-right {
				min-width: 0;
				display: flex;
				flex-direction: column;
				gap: 12px;
			}

			// 头部盈亏/收益率数字等宽字体（上下对齐）
			.cycle-head .cycle-profit,
			.cycle-head .cycle-rate {
				font-family: 'Roboto Mono', Consolas, 'Courier New', monospace;
			}

			// 操作质量（大数字 + 渐变进度条；分档色 >80 绿 / 60~80 橙 / <60 红）
			.cycle-quality {
				display: flex;
				align-items: baseline;
				flex-wrap: wrap;
				gap: 4px 8px;
				font-size: 12px;
				color: #5c6370;

				.cq-label {
					color: #909399;
				}

				// 评分标准弹层入口（与预测“评分规则”链接同款交互）
				.cq-rule-link {
					display: inline-flex;
					align-items: center;
					gap: 4px;
					font-size: 12px;
					font-weight: 400;
					color: var(--el-color-primary);
					cursor: pointer;
					white-space: nowrap;

					&:hover {
						opacity: 0.75;
					}
				}

				.cq-score {
					font-size: 22px;
					font-weight: 700;
					line-height: 1;
					font-family: 'Roboto Mono', Consolas, 'Courier New', monospace;
				}

				.cq-unit {
					color: #a7abba;
				}

				// 评分档位徽标（S/A 绿、B 橙、C 红；与 qualityColor 分档一致）
				.cq-grade {
					padding: 1px 7px;
					border-radius: 8px;
					font-size: 10px;
					line-height: 15px;
					white-space: nowrap;

					&.cqg-s,
					&.cqg-a {
						background: #f0f9eb;
						color: #529b2e;
					}

					&.cqg-b {
						background: #fdf6ec;
						color: #b88230;
					}

					&.cqg-c {
						background: #fef0f0;
						color: #c45656;
					}
				}

				.cq-hold {
					margin-left: auto;
					font-size: 11px;
					color: #a7abba;
				}

				.cq-track {
					flex-basis: 100%;
					height: 8px;
					margin-top: 4px;
					background: #eef0f6;
					border-radius: 4px;
					overflow: hidden;

					.cq-fill {
						height: 100%;
						border-radius: 4px;
						transition: width 0.3s;
					}
				}
			}

			// 清仓后走势（左数值卡列 + 右走势图融合，视线不再跳跃）
			.cycle-trend {
				.ct-head {
					display: flex;
					align-items: center;
					gap: 8px;
					margin-bottom: 8px;

					.ct-title {
						font-size: 13px;
						font-weight: 600;
						color: #2e3543;
					}

					.ct-bench {
						padding: 0 6px;
						border-radius: 6px;
						background: #eef2fa;
						color: #6b7a99;
						font-size: 10px;
						line-height: 16px;
					}
				}

				.ct-main {
					display: flex;
					align-items: stretch;
					gap: 12px;

					.ct-nums {
						flex: none;
						width: 148px;
						display: flex;
						flex-direction: column;
						gap: 6px;

						.tn-item {
							flex: 1;
							display: flex;
							flex-direction: column;
							justify-content: center;
							gap: 2px;
							padding: 5px 9px;
							background: #f7f8fc;
							border-radius: 8px;
							font-size: 11px;
							color: #5c6370;

							.tn-row {
								display: flex;
								justify-content: space-between;
								gap: 8px;
								line-height: 17px;

								b {
									font-family: 'Roboto Mono', Consolas, 'Courier New', monospace;
									font-variant-numeric: tabular-nums;
								}

								.tn-val {
									font-weight: 600;
								}

								// 超额比绝对涨跌更有意义，加粗强调
								.tn-excess {
									font-weight: 700;
								}
							}
						}
					}

					.cycle-kmini {
						flex: 1;
						min-width: 0;
						height: 150px;
					}
				}
			}

			.cycle-trend-none {
				font-size: 12px;
				color: #a7abba;
			}

			// AI 评语（紫系卡：标题行含刷新图标；归因标签提炼 + 正文分段）
			.cycle-ai {
				padding: 10px 12px;
				background: #f9f7ff;
				border: 1px solid #eee7ff;
				border-radius: 8px;
				font-size: 12px;

				.ai-head {
					display: flex;
					align-items: center;
					gap: 8px;

					.ai-label {
						flex: none;
						padding: 0 6px;
						border-radius: 6px;
						background: #f3f0ff;
						color: #7c5cf0;
						font-size: 11px;
						line-height: 18px;
					}

					.ai-refresh {
						margin-left: auto;
						height: 20px;
						padding: 0 4px;
						color: #7c5cf0;
						font-size: 12px;
					}
				}

				.ai-tags {
					display: flex;
					flex-wrap: wrap;
					gap: 6px;
					margin-top: 8px;
				}

				.ai-text {
					margin-top: 8px;
					color: #5c6470;
					line-height: 1.8;
					white-space: pre-wrap;
					word-break: break-word;
				}

				.ai-none {
					color: #a7abba;
				}
			}

			// 本轮买卖明细（时间轴式列表：红点买入/绿点卖出，去表格化）
			.cycle-records {
				.cr-title {
					display: block;
					margin-bottom: 4px;
					font-size: 12px;
					font-weight: 600;
					color: #2e3543;
				}

				.cr-row {
					display: flex;
					align-items: center;
					gap: 8px;
					padding: 3px 0;
					font-size: 12px;
					color: #5c6370;
					font-variant-numeric: tabular-nums;

					.cr-dot {
						flex: none;
						width: 7px;
						height: 7px;
						border-radius: 50%;

						&.is-buy {
							background: var(--el-color-danger);
						}

						&.is-sell {
							background: var(--el-color-success);
						}
					}

					.cr-kind {
						flex: none;
						font-weight: 600;

						&.is-buy {
							color: var(--el-color-danger);
						}

						&.is-sell {
							color: var(--el-color-success);
						}
					}

					.cr-date,
					.cr-vol,
					.cr-price {
						font-family: 'Roboto Mono', Consolas, 'Courier New', monospace;
					}

					.cr-amt {
						margin-left: auto;
						font-family: 'Roboto Mono', Consolas, 'Courier New', monospace;
					}
				}

				.cr-more {
					margin-top: 2px;
				}
			}

			// 关联复盘笔记（右栏独立区块；长文默认两行截断，点击展开）
			.cycle-reviews {
				padding: 10px 12px;
				background: #f7f8fc;
				border-radius: 8px;

				.cv-title {
					display: block;
					margin-bottom: 2px;
					font-size: 12px;
					font-weight: 600;
					color: #2e3543;
				}

				.cv-item {
					display: flex;
					align-items: flex-start;
					gap: 6px;
					margin-top: 6px;
					font-size: 12px;

					.cv-text {
						flex: 1;
						min-width: 0;
						color: #5c6370;
						line-height: 1.7;
						cursor: pointer;
						display: -webkit-box;
						-webkit-box-orient: vertical;
						-webkit-line-clamp: 2;
						overflow: hidden;
						word-break: break-all;

						&.is-open {
							display: block;
							overflow: visible;
						}
					}
				}
			}
		}
	}

	// 图表
	.mtp-chart {
		margin: 16px 0 8px;

		.chart-head {
			display: flex;
			align-items: baseline;
			flex-wrap: wrap;
			gap: 12px;
			margin-bottom: 8px;

			.chart-title {
				font-size: 14px;
				font-weight: 600;
				color: #2e3543;
			}

			.chart-tip {
				font-size: 12px;
				color: #a7abba;
			}
		}

		.chart-body {
			width: 100%;
			height: 320px;
		}

		.chart-none {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 160px;
			font-size: 13px;
			color: #a7abba;
			background: #f7f8fc;
			border-radius: 10px;
		}
	}

	// 交易明细区（小标题 + 表格）
	.mtp-table-head {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 12px;
		margin: 18px 0 8px;

		.table-title {
			font-size: 14px;
			font-weight: 600;
			color: #2e3543;
		}

		.table-tip {
			font-size: 12px;
			color: #a7abba;
		}
	}

	.mtp-table {
		margin-top: 10px;
	}
}
</style>

<style lang="scss">
// 操作质量评分标准弹层（el-popover teleport 到 body，需非 scoped 全局样式；分区式与预测评分规则弹层同款）
.cq-rule-popper {
	padding: 12px 14px;

	.cq-rule-body {
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 12px;
		line-height: 1.65;
		color: var(--el-text-color-regular);

		.cqr-head {
			display: flex;
			align-items: baseline;
			justify-content: space-between;
			gap: 8px;

			b {
				font-size: 13px;
				color: var(--el-text-color-primary);
			}

			span {
				font-size: 12px;
				color: var(--el-text-color-secondary);
			}
		}

		.cqr-sec {
			padding: 8px 10px;
			border-radius: 10px;
			background: #f7f8fa;

			> b {
				display: block;
				margin-bottom: 2px;
				color: var(--el-text-color-primary);
			}

			p {
				margin: 0;

				b {
					color: var(--el-text-color-primary);

					// 评分设计色彩语义：不套用涨跌红绿；加分金色亮色、扣分灰色
					&.plus {
						color: #b88230;
					}

					&.minus {
						color: #909399;
					}
				}
			}
		}

		// 评分明细行（标题+口径小字 / 进度条 / 带符号分值；加分向右拉长金色，扣分灰色）
		.cqr-item {
			padding: 7px 10px;
			border-radius: 10px;
			background: #f7f8fa;

			.cqr-top {
				display: flex;
				align-items: baseline;
				gap: 8px;

				> b {
					flex-shrink: 0;
					color: var(--el-text-color-primary);
				}

				.cqr-desc {
					flex: 1;
					min-width: 0;
					color: var(--el-text-color-secondary);
					font-size: 11px;
					text-align: right;
				}
			}

			.cqr-track {
				height: 6px;
				margin-top: 6px;
				background: #eceef2;
				border-radius: 3px;
				overflow: hidden;

				>i {
					display: block;
					height: 100%;
					border-radius: 3px;
					transition: width 0.3s;
				}
			}

			.cqr-val {
				margin-top: 3px;
				text-align: right;
				font-size: 11px;
				font-weight: 600;
				font-family: 'Roboto Mono', Consolas, 'Courier New', monospace;
			}
		}

		.cqr-final {
			padding-top: 8px;
			border-top: 1px dashed #e4e7ed;
			text-align: right;
			color: var(--el-text-color-regular);

			b {
				font-size: 15px;
				font-family: 'Roboto Mono', Consolas, 'Courier New', monospace;
			}
		}
	}
}
</style>
