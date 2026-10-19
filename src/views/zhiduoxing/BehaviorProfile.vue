<template>
	<div class="behavior-profile">
		<!-- 页头 -->
		<div class="bp-head">
			<div class="bp-head-left">
				<span class="bp-head-badge"><font-awesome-icon fas icon="fingerprint"></font-awesome-icon></span>
				<div class="bp-head-title">
					<div class="bp-title-row">
						<span class="bp-title">交易行为画像</span>
						<el-tooltip v-if="styleChipText" :content="styleChipTip" placement="bottom" effect="dark" :show-after="120">
							<span class="bp-style-chip">
								<font-awesome-icon fas icon="compass"></font-awesome-icon>{{ styleChipText }}
							</span>
						</el-tooltip>
					</div>
					<span class="bp-sub">基于全部历史成交（FIFO 配对 + 移动加权口径）的自动化诊断，结合日K进行择时分析</span>
				</div>
			</div>
			<el-button size="small" class="bp-refresh-btn" :loading="evaluating" :disabled="loading" @click="evaluate">
				<font-awesome-icon fas icon="rotate-right"></font-awesome-icon>&nbsp;{{ data?.EvaluatedAt ? '重新评定' : '评定' }}
			</el-button>
		</div>

		<div v-loading="loading" class="bp-body">
			<el-empty v-if="!loading && data && !data.HasData" description="暂无成交数据（导入交易记录后自动生成画像）" :image-size="120"></el-empty>

			<template v-if="data?.HasData">
				<!-- 顶部：八维雷达 + AI 分析 -->
				<div class="bp-top">
					<!-- 八维能力雷达 -->
					<div class="bp-card bp-radar-card">
						<div class="bp-card-title">
							<span class="bp-mini-ico tone-violet"><font-awesome-icon fas icon="chart-pie"></font-awesome-icon></span>八维能力雷达
							<div class="bp-radar-seg">
								<button type="button" :class="{ 'is-on': radarMode === 'all' }" @click="radarMode = 'all'">全部历史</button>
								<button type="button" :class="{ 'is-on': radarMode === 'year' }" @click="radarMode = 'year'">今年</button>
							</div>
							<span class="bp-title-note">标准「{{ radarView.basis?.Standard || '默认' }}」</span>
							<button v-if="radarView.has" type="button" class="bp-note-link" @click="openRadarBasis">评分依据</button>
						</div>
						<!-- 评分标准变更提示（评定后流派评分参数被调整：当前分值为实时换算，建议重新评定） -->
						<div v-if="data?.StandardChanged" class="bp-std-changed">
							<font-awesome-icon fas icon="triangle-exclamation"></font-awesome-icon>
							<span>{{ data.StandardChangedNote }}</span>
						</div>
						<div class="bp-radar-wrap">
							<div ref="radarRef" class="bp-radar"></div>
							<div v-if="radarView.has" class="bp-total">
								<div class="total-num">{{ (radarView.scores?.Total ?? 0).toFixed(1) }}</div>
								<div class="total-label">综合得分</div>
							</div>
							<div v-else class="bp-radar-empty">今年暂无成交记录</div>
						</div>
						<div class="bp-overall">
							<div class="tkv"><span class="t-k">卖出笔数</span><span class="t-v">{{ data.Overall.SellCount }}</span></div>
							<div class="tkv"><span class="t-k">胜率</span><span class="t-v">{{ data.Overall.WinRate.toFixed(1) }}%</span></div>
							<div class="tkv"><span class="t-k">盈亏比</span><span class="t-v">{{ data.Overall.SellCount ? data.Overall.ProfitRatio.toFixed(2) : '--' }}</span></div>
							<div class="tkv"><span class="t-k">净盈亏</span><span class="t-v" :class="changeClass(data.Overall.RealizedProfit)">{{ fmtMoney(data.Overall.RealizedProfit, true) }} 元</span></div>
							<div class="tkv"><span class="t-k">平均盈利 / 亏损</span><span class="t-v">{{ fmtMoney(data.Overall.AvgProfit) }} / -{{ fmtMoney(data.Overall.AvgLoss) }}</span></div>
							<div class="tkv"><span class="t-k">累计费用</span><span class="t-v">{{ fmtMoney(data.Overall.FeeSum) }} 元</span></div>
						</div>
					</div>

					<!-- AI 智能分析 -->
					<div class="bp-card bp-ai-card">
						<div class="bp-card-title">
							<span class="bp-mini-ico tone-violet"><font-awesome-icon fas icon="robot"></font-awesome-icon></span>AI 智能分析
							<span v-if="ai && data?.EvaluatedAt" class="bp-title-note">随「评定」自动生成并保存</span>
						</div>
						<div v-if="evaluating" class="ai-loading">
							<font-awesome-icon fas icon="wand-magic-sparkles" class="ai-loading-ico"></font-awesome-icon>
							<div>正在评定交易行为画像</div>
							<div class="ai-progress">
								<div class="ai-progress-track"><div class="ai-progress-fill" :style="{ width: `${evalProgress?.Percent ?? 5}%` }"></div></div>
								<div class="ai-progress-stage">
									<span>{{ evalProgress?.Stage || '正在提交评定请求…' }}</span>
									<span class="ai-progress-pct">{{ evalProgress?.Percent ?? 5 }}%</span>
								</div>
							</div>
							<div class="ai-loading-tip">先评定行为与风格 → 落库风格总结与基础数值参照 → 按流派标准换算八维分值 → 生成 AI 诊断，通常需要数秒到数十秒，请稍候...</div>
						</div>
						<div v-else-if="ai" class="ai-body">
							<div class="ai-sections">
								<div v-for="(seg, i) in aiSegments" :key="i" class="ai-seg">
									<div v-if="seg.head" class="ai-seg-head" :class="headTone(seg.head)">
										<font-awesome-icon fas :icon="headIcon(seg.head)"></font-awesome-icon>
										<span>{{ seg.head }}</span>
									</div>
									<div v-if="seg.text" class="ai-seg-text">{{ seg.text }}</div>
								</div>
							</div>
							<div class="ai-time">生成时间：{{ fmtTime(ai.GeneratedAt) }} · 由 DeepSeek 依据本地统计数据生成，仅供学习参考，不构成投资建议</div>
						</div>
						<div v-else class="ai-empty">
							<font-awesome-icon fas icon="robot" class="ai-empty-ico"></font-awesome-icon>
							<div class="ai-empty-text">AI 将根据你的交易节奏、持仓周期、盈亏结构、仓位、成本与择时数据，输出风格诊断、主要优势、风险短板与改进建议</div>
							<div class="ai-empty-tip">点击右上角「评定」开始（先评定行为与风格并落库基础数值参照，再按流派标准换算八维分值并自动生成 AI 诊断）</div>
						</div>
					</div>
				</div>

				<!-- 得分窗口与趋势（近1/3/6自然月 + 月度综合分趋势） -->
				<div v-if="scores" class="bp-card bp-scores-card">
					<div class="bp-card-title">
						<span class="bp-mini-ico tone-blue"><font-awesome-icon fas icon="chart-line"></font-awesome-icon></span>得分窗口与趋势
						<span class="bp-title-note">近1/3/6个自然月 · 点击窗口选中 · 依据按选中窗口展示</span>
						<button type="button" class="bp-note-link" @click="openWinBasis">评分依据</button>
					</div>
					<div class="bp-scores-wrap">
						<div class="bp-win-cols">
							<div
								v-for="(w, i) in scoreWindows"
								:key="w.label"
								class="bp-win"
								:class="{ 'is-empty': !w.has, 'is-sel': i === selWin && w.has }"
								@click="selectWin(i)"
							>
								<div class="bw-head">
									<span class="bw-label">{{ w.label }}</span>
									<span v-if="w.has" class="bw-total" :style="{ color: scoreColor(w.total) }">{{ w.total.toFixed(1) }}</span>
									<span v-else class="bw-total bw-na">--</span>
								</div>
								<template v-if="w.has">
									<el-tooltip v-for="d in w.dims" :key="d.name" placement="top" effect="dark" :show-after="120">
										<div class="bw-dim">
											<span class="bw-dim-name">{{ d.name }}</span>
											<div class="bw-dim-track"><div class="bw-dim-fill" :style="{ width: `${d.value}%`, background: scoreColor(d.value) }"></div></div>
											<span class="bw-dim-val" :style="{ color: scoreColor(d.value) }">{{ d.value.toFixed(0) }}</span>
										</div>
										<template #content><div style="max-width: 340px; line-height: 1.5">{{ d.formula }}</div></template>
									</el-tooltip>
								</template>
								<div v-else class="bw-empty">窗口内无成交记录</div>
							</div>
						</div>
						<div class="bp-score-trend-wrap">
							<div ref="scoreTrendRef" class="bp-score-trend"></div>
							<div v-if="!scores?.Trend?.length" class="bp-none">暂无得分趋势数据（无交易记录或计算未完成）</div>
						</div>
					</div>
				</div>

				<!-- 行为标签墙 -->
				<div class="bp-card bp-tags-card">
					<div class="bp-card-title"><span class="bp-mini-ico tone-teal"><font-awesome-icon fas icon="tags"></font-awesome-icon></span>行为标签</div>
					<div class="bp-tags">
						<el-tooltip v-for="(t, i) in data.Tags" :key="i" :content="t.Description || ''" placement="top" :disabled="!t.Description" :show-after="120" effect="dark">
							<span class="bp-tag" :class="'tone-' + t.Tone">{{ t.Text }}</span>
						</el-tooltip>
					</div>
				</div>

				<!-- 交易风格 / 选股风格 / 交易性格（六层合成风格画像） -->
				<div class="bp-style-grid">
					<!-- 交易风格（L1-L6 六层维度） -->
					<div class="bp-card bp-style-card">
						<div class="bp-card-title">
							<span class="bp-mini-ico tone-violet"><font-awesome-icon fas icon="compass"></font-awesome-icon></span>交易风格
							<span class="bp-title-note">六层维度合成 · FIFO 全历史口径</span>
						</div>
						<div v-if="data.Style?.MainStyle || data.Style?.Summary" class="st-hero">
							<el-tooltip :content="data.Style?.MainStyle?.Description || ''" placement="top" :disabled="!data.Style?.MainStyle?.Description" :show-after="120" effect="dark">
								<span class="st-main-tag" :class="'st-tone-' + (data.Style?.MainStyle?.Tone || 'info')">{{ data.Style?.MainStyle?.Text || data.TradeStyle }}</span>
							</el-tooltip>
							<span class="st-summary">{{ data.Style?.Summary }}</span>
						</div>
						<div v-else class="bp-none">暂无配对交易（六层风格需卖出配对样本）</div>
						<div class="st-rows">
							<div v-for="row in styleRows" :key="row.label" class="st-row">
								<span class="st-row-label">{{ row.label }}</span>
								<el-tooltip v-if="row.tag" :content="row.tag.Description || ''" placement="top" :disabled="!row.tag.Description" :show-after="120" effect="dark">
									<span class="bp-tag" :class="'tone-' + row.tag.Tone">{{ row.tag.Text }}</span>
								</el-tooltip>
								<span v-else class="st-none">未识别</span>
							</div>
						</div>
						<div class="st-values">
							<div class="kv"><span class="k">平均持有</span><span class="v">{{ num1(data.Style?.AvgHoldDays) }} 天</span></div>
							<div class="kv"><span class="k">月均笔数</span><span class="v">{{ num1(data.Style?.MonthlyAvgCount) }} 笔</span></div>
							<div class="kv"><span class="k">平均仓位</span><span class="v">{{ num1(data.Style?.AvgPosition) }}%</span></div>
						</div>
					</div>
					<!-- 选股风格（8 维） -->
					<div class="bp-card bp-style-card">
						<div class="bp-card-title">
							<span class="bp-mini-ico tone-teal"><font-awesome-icon fas icon="magnifying-glass-chart"></font-awesome-icon></span>选股风格
							<span class="bp-title-note">8 维 · 买入金额加权</span>
						</div>
						<div class="st-rows">
							<div v-for="row in stockRows" :key="row.label" class="st-row">
								<span class="st-row-label">{{ row.label }}</span>
								<el-tooltip v-if="row.tag" :content="row.tag.Description || ''" placement="top" :disabled="!row.tag.Description" :show-after="120" effect="dark">
									<span class="bp-tag" :class="'tone-' + row.tag.Tone">{{ row.tag.Text }}</span>
								</el-tooltip>
								<span v-else class="st-none">无样本</span>
							</div>
						</div>
						<div class="st-values">
							<div class="kv"><span class="k">加权市值</span><span class="v">{{ num1(data.StockStyle?.WeightedMarketValue) }} 亿</span></div>
							<div class="kv"><span class="k">加权 PE</span><span class="v">{{ num1(data.StockStyle?.WeightedPe) }}</span></div>
							<div class="kv"><span class="k">加权 ROE</span><span class="v">{{ num1(data.StockStyle?.WeightedRoe) }}%</span></div>
							<div class="kv"><span class="k">年化波动</span><span class="v">{{ num1(data.StockStyle?.WeightedVolatility) }}%</span></div>
							<div class="kv"><span class="k">买入前20日</span><span class="v">{{ pctText(data.StockStyle?.AvgPre20Change ?? 0) }}</span></div>
							<div class="kv"><span class="k">前三大行业</span><span class="v">{{ num1(data.StockStyle?.Top3SectorRatio) }}%</span></div>
							<div class="kv"><span class="k">买入高位占比</span><span class="v">{{ num1(data.StockStyle?.BuyHighRatio) }}%</span></div>
							<div class="kv"><span class="k">期末持股</span><span class="v">{{ data.StockStyle?.HoldStockCount ?? 0 }} 只</span></div>
							<div v-if="data.StockStyle?.TopSectorNames?.length" class="kv wide"><span class="k">主要行业</span><span class="v">{{ data.StockStyle?.TopSectorNames?.join(' / ') }}</span></div>
						</div>
					</div>
					<!-- 交易性格（10 维） -->
					<div class="bp-card bp-style-card">
						<div class="bp-card-title">
							<span class="bp-mini-ico tone-rose"><font-awesome-icon fas icon="user-gear"></font-awesome-icon></span>交易性格
							<span class="bp-title-note">10 维行为特征 · 逐笔交易时点口径</span>
						</div>
						<div class="st-rows">
							<div v-for="row in personaRows" :key="row.label" class="st-row">
								<span class="st-row-label">{{ row.label }}</span>
								<el-tooltip v-if="row.tag" :content="row.tag.Description || ''" placement="top" :disabled="!row.tag.Description" :show-after="120" effect="dark">
									<span class="bp-tag" :class="'tone-' + row.tag.Tone">{{ row.tag.Text }}</span>
								</el-tooltip>
								<span v-else class="st-none">未识别</span>
							</div>
						</div>
						<div class="st-values">
							<div class="kv"><span class="k">平均仓位</span><span class="v">{{ num1(data.Persona?.AvgPosition) }}%</span></div>
							<div class="kv"><span class="k">单票最大仓位</span><span class="v">{{ num1(data.Persona?.MaxSinglePosition) }}%</span></div>
							<div class="kv"><span class="k">年化换手率</span><span class="v">{{ num1(data.Persona?.AnnualTurnover) }}%</span></div>
							<div class="kv"><span class="k">处置效应</span><span class="v">{{ num2(data.Persona?.DispositionEffect) }}</span></div>
							<div class="kv"><span class="k">费用侵蚀</span><span class="v">{{ num1(data.Persona?.FeeErosionRatio) }}%</span></div>
							<div class="kv"><span class="k">3日短卖占比</span><span class="v">{{ num1(data.Persona?.ShortSellRatio) }}%</span></div>
						</div>
					</div>
				</div>

				<div class="bp-grid">
					<!-- 交易节奏 -->
					<div class="bp-card">
						<div class="bp-card-title"><span class="bp-mini-ico tone-blue"><font-awesome-icon fas icon="gauge-high"></font-awesome-icon></span>交易节奏</div>
						<div class="bp-kv">
							<div class="kv"><span class="k">交易月份</span><span class="v">{{ data.Rhythm.TradeMonthCount }} 个月</span></div>
							<div class="kv"><span class="k">月均笔数</span><span class="v">{{ data.Rhythm.MonthlyAvgCount.toFixed(1) }} 笔</span></div>
							<div class="kv"><span class="k">最活跃月</span><span class="v">{{ data.Rhythm.BusiestMonth || '--' }}（{{ data.Rhythm.BusiestMonthCount }} 笔）</span></div>
							<div class="kv"><span class="k">最活跃股</span><span class="v">{{ data.Rhythm.TopStockCode }} {{ data.Rhythm.TopStockName }}（{{ data.Rhythm.TopStockCount }} 笔）</span></div>
						</div>
						<div class="bp-bar-wrap">
							<div class="bp-bar-label"><span>日内时段分布</span><span>{{ morningText }}</span></div>
							<div class="bp-bar">
								<div v-show="data.Rhythm.MorningCount > 0" class="seg seg-morning" :style="{ flexGrow: data.Rhythm.MorningCount }"></div>
								<div v-show="data.Rhythm.AfternoonCount > 0" class="seg seg-afternoon" :style="{ flexGrow: data.Rhythm.AfternoonCount }"></div>
							</div>
						</div>
					</div>

					<!-- 持仓周期 -->
					<div class="bp-card">
						<div class="bp-card-title"><span class="bp-mini-ico tone-violet"><font-awesome-icon fas icon="clock"></font-awesome-icon></span>持仓周期（FIFO 配对）</div>
						<div class="bp-kv">
							<div class="kv"><span class="k">平均持有</span><span class="v">{{ data.HoldPeriod.AvgHoldDays.toFixed(1) }} 天</span></div>
							<div class="kv"><span class="k">中位持有</span><span class="v">{{ data.HoldPeriod.MedianHoldDays.toFixed(1) }} 天</span></div>
							<div class="kv"><span class="k">盈利配对</span><span class="v">平均 {{ data.HoldPeriod.WinAvgHoldDays.toFixed(1) }} 天</span></div>
							<div class="kv"><span class="k">亏损配对</span><span class="v">平均 {{ data.HoldPeriod.LossAvgHoldDays.toFixed(1) }} 天</span></div>
						</div>
						<div class="bp-bar-wrap">
							<div class="bp-bar-label"><span>短线 / 波段 / 长线</span><span>{{ data.HoldPeriod.ShortCount }} / {{ data.HoldPeriod.SwingCount }} / {{ data.HoldPeriod.LongCount }}</span></div>
							<div class="bp-bar">
								<div v-show="data.HoldPeriod.ShortCount > 0" class="seg seg-short" :style="{ flexGrow: data.HoldPeriod.ShortCount }"></div>
								<div v-show="data.HoldPeriod.SwingCount > 0" class="seg seg-swing" :style="{ flexGrow: data.HoldPeriod.SwingCount }"></div>
								<div v-show="data.HoldPeriod.LongCount > 0" class="seg seg-long" :style="{ flexGrow: data.HoldPeriod.LongCount }"></div>
							</div>
							<div class="bp-bar-legend"><span class="lg-short">短线 ≤5 天</span><span class="lg-swing">波段 6~30 天</span><span class="lg-long">长线 &gt;30 天</span></div>
						</div>
					</div>

					<!-- 盈亏结构 -->
					<div class="bp-card">
						<div class="bp-card-title"><span class="bp-mini-ico tone-orange"><font-awesome-icon fas icon="scale-unbalanced"></font-awesome-icon></span>盈亏结构</div>
						<div class="bp-kv">
							<div class="kv"><span class="k">最大连赢</span><span class="v">{{ data.ProfitStructure.MaxWinStreak }} 笔</span></div>
							<div class="kv"><span class="k">最大连亏</span><span class="v">{{ data.ProfitStructure.MaxLossStreak }} 笔</span></div>
							<div class="kv"><span class="k">最大单笔盈利</span><span class="v up">+{{ fmtMoney(data.ProfitStructure.MaxSingleProfit) }}</span></div>
							<div class="kv"><span class="k">最大单笔亏损</span><span class="v down">-{{ fmtMoney(data.ProfitStructure.MaxSingleLoss) }}</span></div>
							<div class="kv"><span class="k">盈利集中度</span><span class="v">TOP3 占 {{ data.ProfitStructure.Top3ProfitRatio.toFixed(1) }}%</span></div>
						</div>
						<div class="bp-bar-wrap">
							<div class="bp-bar-label"><span>单笔分布</span><span>大亏 {{ data.ProfitStructure.BigLossCount }} · 小亏 {{ data.ProfitStructure.SmallLossCount }} · 小赚 {{ data.ProfitStructure.SmallWinCount }} · 大赚 {{ data.ProfitStructure.BigWinCount }}</span></div>
							<div class="bp-bar">
								<div v-show="data.ProfitStructure.BigLossCount > 0" class="seg seg-bigloss" :style="{ flexGrow: data.ProfitStructure.BigLossCount }"></div>
								<div v-show="data.ProfitStructure.SmallLossCount > 0" class="seg seg-smallloss" :style="{ flexGrow: data.ProfitStructure.SmallLossCount }"></div>
								<div v-show="data.ProfitStructure.SmallWinCount > 0" class="seg seg-smallwin" :style="{ flexGrow: data.ProfitStructure.SmallWinCount }"></div>
								<div v-show="data.ProfitStructure.BigWinCount > 0" class="seg seg-bigwin" :style="{ flexGrow: data.ProfitStructure.BigWinCount }"></div>
							</div>
							<div class="bp-bar-legend"><span class="lg-bigloss">大亏 &lt;-1万</span><span class="lg-smallloss">小亏 -1万~0</span><span class="lg-smallwin">小赚 0~1万</span><span class="lg-bigwin">大赚 &gt;1万</span></div>
						</div>
					</div>

					<!-- 仓位与集中度 -->
					<div class="bp-card">
						<div class="bp-card-title"><span class="bp-mini-ico tone-teal"><font-awesome-icon fas icon="chart-pie"></font-awesome-icon></span>仓位与集中度</div>
						<div class="bp-kv">
							<div class="kv"><span class="k">平均单笔买入</span><span class="v">{{ fmtMoney(data.Position.AvgBuyAmount) }} 元</span></div>
							<div class="kv"><span class="k">最大单笔买入</span><span class="v">{{ fmtMoney(data.Position.MaxBuyAmount) }} 元</span></div>
							<div class="kv"><span class="k">前3持仓占比</span><span class="v">{{ data.Position.Top3HoldRatio.toFixed(1) }}%（持仓成本）</span></div>
							<div class="kv"><span class="k">资金周转比</span><span class="v">{{ data.Position.Turnover.toFixed(1) }}%（卖出÷买入）</span></div>
						</div>
					</div>

					<!-- 成本结构 -->
					<div class="bp-card">
						<div class="bp-card-title"><span class="bp-mini-ico tone-rose"><font-awesome-icon fas icon="receipt"></font-awesome-icon></span>成本结构（费用视角）</div>
						<div class="bp-kv">
							<div class="kv"><span class="k">累计费用</span><span class="v">{{ fmtMoney(data.Cost.FeeSum) }} 元</span></div>
							<div class="kv"><span class="k">费用/盈亏比</span><span class="v">{{ data.Cost.FeeProfitRatio.toFixed(1) }}%</span></div>
							<div class="kv"><span class="k">费用/成交额</span><span class="v">{{ data.Cost.FeeAmountRatio.toFixed(1) }} 万分比</span></div>
							<div class="kv"><span class="k">单笔卖出均摊</span><span class="v">{{ fmtMoney(data.Cost.AvgFeePerSell) }} 元</span></div>
						</div>
					</div>

					<!-- 择时分析 -->
					<div class="bp-card">
						<div class="bp-card-title"><span class="bp-mini-ico tone-green"><font-awesome-icon fas icon="bullseye"></font-awesome-icon></span>择时分析（结合日K）</div>
						<div v-if="data.Timing.ValidBuyCount > 0" class="bp-bar-wrap">
							<div class="bp-bar-label"><span>买入位置分位（前60根日K区间）</span><span>{{ data.Timing.ValidBuyCount }} 笔有效样本</span></div>
							<div class="bp-bar">
								<div v-show="data.Timing.BuyLowCount > 0" class="seg seg-low" :style="{ flexGrow: data.Timing.BuyLowCount }"></div>
								<div v-show="data.Timing.BuyMidCount > 0" class="seg seg-mid" :style="{ flexGrow: data.Timing.BuyMidCount }"></div>
								<div v-show="data.Timing.BuyHighCount > 0" class="seg seg-high" :style="{ flexGrow: data.Timing.BuyHighCount }"></div>
							</div>
							<div class="bp-bar-legend"><span class="lg-low">低位 &lt;30%（{{ data.Timing.BuyLowCount }}）</span><span class="lg-mid">中位 30~70%（{{ data.Timing.BuyMidCount }}）</span><span class="lg-high">高位 &gt;70%（{{ data.Timing.BuyHighCount }}）</span></div>
						</div>
						<div v-else class="bp-none">买入位置样本不足（需买入日前有 ≥20 根日K）</div>
						<div v-if="(timingWin(5)?.BuyValidCount ?? 0) > 0 || (timingWin(20)?.SellValidCount ?? 0) > 0" class="bp-timing-sell">
							<div v-if="(timingWin(5)?.BuyValidCount ?? 0) > 0" class="kv"><span class="k">买入后 5 日</span><span class="v" :class="changeClass(timingWin(5)?.AvgBuyChange)">{{ pctText(timingWin(5)?.AvgBuyChange ?? 0) }}（{{ timingWin(5)?.BuyValidCount }} 笔）</span></div>
							<div v-if="(timingWin(20)?.BuyValidCount ?? 0) > 0" class="kv"><span class="k">买入后 20 日</span><span class="v" :class="changeClass(timingWin(20)?.AvgBuyChange)">{{ pctText(timingWin(20)?.AvgBuyChange ?? 0) }}（{{ timingWin(20)?.BuyValidCount }} 笔）</span></div>
							<template v-if="(timingWin(20)?.SellValidCount ?? 0) > 0">
								<div class="kv"><span class="k">卖出后 5 日</span><span class="v" :class="changeClass(data.Timing.AvgSellAfter5)">{{ pctText(data.Timing.AvgSellAfter5) }}</span></div>
								<div class="kv"><span class="k">卖出后 20 日</span><span class="v" :class="changeClass(timingWin(20)?.AvgSellChange)">{{ pctText(timingWin(20)?.AvgSellChange ?? 0) }}</span></div>
								<div class="kv"><span class="k">卖飞</span><span class="v warn-text">{{ data.Timing.SellFlyCount }} 笔（卖后20日涨超5%）</span></div>
								<div class="kv"><span class="k">逃顶</span><span class="v good-text">{{ data.Timing.EscapeCount }} 笔（卖后20日跌超5%）</span></div>
							</template>
						</div>
						<div v-else class="bp-none">买卖后表现样本不足（需成交后有满 5/20 根日K）</div>
					</div>
				</div>

				<!-- 四象限 -->
				<div class="bp-card bp-quadrant">
					<div class="bp-card-title"><span class="bp-mini-ico tone-orange"><font-awesome-icon fas icon="border-all"></font-awesome-icon></span>个股四象限（胜率 × 盈亏比）</div>
					<div class="bp-quad-grid">
						<div class="bp-quad-item q-expert">
							<div class="qi-head">
								<span class="qi-ico"><font-awesome-icon fas icon="award"></font-awesome-icon></span>
								<span class="qi-name">顶尖</span>
								<span class="qi-ratio">{{ quadRatio(data.Quadrant.ExpertCount) }}</span>
							</div>
							<div class="qi-count">{{ data.Quadrant.ExpertCount }}</div>
							<div class="qi-rule">胜率≥50% 且 盈亏比≥1</div>
						</div>
						<div class="bp-quad-item q-steady">
							<div class="qi-head">
								<span class="qi-ico"><font-awesome-icon fas icon="shield-halved"></font-awesome-icon></span>
								<span class="qi-name">稳健</span>
								<span class="qi-ratio">{{ quadRatio(data.Quadrant.SteadyCount) }}</span>
							</div>
							<div class="qi-count">{{ data.Quadrant.SteadyCount }}</div>
							<div class="qi-rule">胜率≥50% 且 盈亏比&lt;1</div>
						</div>
						<div class="bp-quad-item q-aggressive">
							<div class="qi-head">
								<span class="qi-ico"><font-awesome-icon fas icon="bolt"></font-awesome-icon></span>
								<span class="qi-name">激进</span>
								<span class="qi-ratio">{{ quadRatio(data.Quadrant.AggressiveCount) }}</span>
							</div>
							<div class="qi-count">{{ data.Quadrant.AggressiveCount }}</div>
							<div class="qi-rule">胜率&lt;50% 且 盈亏比≥1</div>
						</div>
						<div class="bp-quad-item q-improve">
							<div class="qi-head">
								<span class="qi-ico"><font-awesome-icon fas icon="triangle-exclamation"></font-awesome-icon></span>
								<span class="qi-name">待改进</span>
								<span class="qi-ratio">{{ quadRatio(data.Quadrant.ImproveCount) }}</span>
							</div>
							<div class="qi-count">{{ data.Quadrant.ImproveCount }}</div>
							<div class="qi-rule">胜率&lt;50% 且 盈亏比&lt;1</div>
						</div>
					</div>
					<el-table :data="data.Quadrant.Stocks" max-height="420" empty-text="无个股数据" size="small" class="bp-quad-table">
						<el-table-column prop="StockCode" label="代码" width="100"></el-table-column>
						<el-table-column prop="StockName" label="名称" min-width="110"></el-table-column>
						<el-table-column label="卖出笔数" width="90" align="right">
							<template #default="scope">{{ scope.row.SellCount }}</template>
						</el-table-column>
						<el-table-column label="胜率" width="90" align="right">
							<template #default="scope">
								<span :class="rateClass(scope.row.WinRate)">{{ scope.row.WinRate.toFixed(1) }}%</span>
							</template>
						</el-table-column>
						<el-table-column label="盈亏比" width="90" align="right">
							<template #default="scope">
								<span :class="rateClass(scope.row.ProfitRatio)">{{ scope.row.SellCount ? scope.row.ProfitRatio.toFixed(2) : '--' }}</span>
							</template>
						</el-table-column>
						<el-table-column label="净盈亏" width="130" align="right">
							<template #default="scope">
								<span :class="changeClass(scope.row.RealizedProfit)">{{ fmtMoney(scope.row.RealizedProfit, true) }}</span>
							</template>
						</el-table-column>
						<el-table-column label="象限" width="100" align="center">
							<template #default="scope">
								<el-tag size="small" :type="quadTag(scope.row.Quadrant)" effect="plain">{{ quadLabel(scope.row.Quadrant) }}</el-tag>
							</template>
						</el-table-column>
					</el-table>
				</div>
			</template>
		</div>

		<!-- 八维评分依据弹窗（雷达/得分窗口共用入口；按作用域展示对应口径的实际值+阈值+公式） -->
		<el-dialog v-model="basisVisible" :title="`八维评分依据 · ${basisView.label}`" width="620px" class="ofa-dialog" append-to-body>
			<div class="basis-head">
				<span class="basis-std">评分标准「{{ basisView.basis?.Standard || '默认' }}」<template v-if="basisView.basis?.MainStyle">（主风格 {{ basisView.basis.MainStyle }}）</template></span>
				<span class="basis-note">满分 100 · ≥80 优秀 · ≥60 及格 · &lt;60 不及格 · 样本不足按 50 计</span>
			</div>
			<div class="basis-list">
				<div v-for="row in basisView.rows" :key="row.name" class="basis-row">
					<div class="basis-row-head">
						<span class="basis-name">{{ row.name }}</span>
						<span class="basis-score" :style="{ color: scoreColor(row.value) }">{{ row.value.toFixed(1) }} 分</span>
					</div>
					<div class="basis-formula">{{ row.formula }}</div>
				</div>
			</div>
			<div class="basis-foot">{{ basisView.foot }}</div>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import dayjs from '@/untils/dayjs'
import * as echarts from 'echarts'
import { formatThousands } from '@/consts/zhiduoxing-const'
import { IZdxBehaviorStats, IZdxBehaviorAiData, IZdxBehaviorScore, IZdxBehaviorScores, IZdxBehaviorScoreBasis, IZdxBehaviorEvalProgress } from '@/interfaces/zhiduoxing/IZdxMyTrade'
import zdxApi from '@/apis/zdx-api'

// 交易行为画像（独立页面：八维雷达 + AI 智能分析 + 标签墙 + 指标卡 + 四象限）
const data = ref<IZdxBehaviorStats>()
const loading = ref(false)

// ---------- 数据加载 ----------
async function load() {
	loading.value = true
	try {
		data.value = await zdxApi.getMyBehaviorStats()
	} catch {
		data.value = undefined
	} finally {
		loading.value = false
	}
	// AI 分析读库加载（独立容错：失败不阻断画像主体，无记录时保持空态）
	try {
		ai.value = (await zdxApi.getMyBehaviorAi()) ?? undefined
	} catch {
		ai.value = undefined
	}
	// 得分窗口与月度趋势（独立容错：失败不阻断画像主体）
	try {
		scores.value = await zdxApi.getMyBehaviorScores()
	} catch {
		scores.value = undefined
	}
}

// ---------- 交易风格总结（标题横栏胶囊） ----------
// 摘要文本：优先六层合成 Summary（如"短线交易 · 趋势型 · 稳健 · 中盘成长 · 半系统化"），回退主风格名
const styleChipText = computed(() => data.value?.Style?.Summary || data.value?.TradeStyle || '')
const styleChipTip = computed(() => '交易风格总结：由六层维度合成 - L1 持仓周期 × L2 交易频率 → 主风格；L3 盈亏结构 → 策略类型；L4 仓位 → 风险等级；L5 选股 → 标的偏好；L6 决策 → 执行方式；详细维度见下方"交易风格"卡片')

// ---------- 八维雷达 ----------
const radarRef = ref<HTMLDivElement>()
let radarChart: echarts.ECharts | undefined

// 八维评分维度定义（展示顺序：盈亏比、胜率、择时、成本、风控、耐心、回撤控制、收益能力；及格线 60：≥80 绿 / ≥60 蓝 / <60 红）
// 评分依据文案由 dimFormula 按评定落库的 ScoreBasis 动态生成（实际值 + 流派参照阈值 + 换算口径）
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

// 维度评分依据文案（按作用域基础数值参照展示：实际值 + 流派参照阈值 + 换算口径；basis 缺失时回退通用口径；旧评定快照按当时口径展示并标注）
function dimFormula(key: keyof IZdxBehaviorScore, b?: IZdxBehaviorScoreBasis): string {
	switch (key) {
		case 'ProfitRatio':
			return b
				? `得分：实际盈亏比 ${b.ProfitRatio.toFixed(2)} vs 达标线 ${b.ProfitRatioTarget}（软饱和：达标=85 分，达标内线性 85×实际÷达标、达标外 85+15×ln(实际÷达标)÷ln${b.ProfitRatioCapMult ?? 3} 延伸，${b.ProfitRatioCapMult ?? 3}×达标=100 封顶；平均盈利 ${fmtMoney(b.AvgProfit)} 元 ÷ 平均亏损 ${fmtMoney(b.AvgLoss)} 元；全胜计 100）`
				: '得分 = 软饱和映射（盈亏比 ÷ 流派达标线）：达标=85 分、封顶倍数×达标=100 分封顶（倍数可按流派配置，默认 3；全胜计 100）'
		case 'WinRate':
			return b
				? `得分 = 盈利 ${b.WinSellCount} 笔 ÷ 总平仓 ${b.SellCount} 笔 × 100（全流派通用）`
				: '得分 = 盈利平仓笔数 ÷ 总平仓笔数 × 100'
		case 'Timing':
			return b
				? `得分 = 0.6 × 买入后${b.TimingWindow}日 ${b.AvgBuyWindowChange.toFixed(2)}% 映射 + 0.4 × 卖出后${b.TimingWindow}日 ${b.AvgSellWindowChange.toFixed(2)}% 反向映射（软饱和居中：0=50、±${b.TimingSpan}%=85/15、±${b.TimingCapMult ?? 3}×幅度=100/0；样本不足按 50）`
				: '得分 = 0.6 × 买入后均涨幅映射 + 0.4 × 卖出后均涨幅反向映射（软饱和居中：0=50、±标准幅度=85/15、±封顶倍数×幅度=100/0，倍数默认 3；样本不足按 50）'
		case 'CostControl':
			return b
				? b.GrossProfitSum !== undefined
					? b.GrossProfitSum > 0
						? `得分 = 100 − 费用侵蚀比 ${b.FeeErosionRatio.toFixed(1)}% ÷ 零分线 ${b.FeeErosionTolerance}% × 100（侵蚀比 = 费用 ÷ 盈利平仓毛利合计 ${fmtMoney(b.GrossProfitSum)} 元；毛利口径与盈亏符号无关）`
						: `无止盈样本（盈利平仓毛利合计 ${fmtMoney(b.GrossProfitSum)} 元 ≤ 0）：费用侵蚀无从评估，按中性 50 分（不以固定低分惩罚亏损账户）`
					: `得分 = 100 − 费用侵蚀比 ${b.FeeErosionRatio.toFixed(1)}% ÷ 零分线 ${b.FeeErosionTolerance}% × 100（侵蚀比 = 费用 ÷ 净盈利；盈利 ≤ 0 记 0；本次评定为旧口径快照）`
				: '得分 = 100 − 费用侵蚀比 ÷ 标准零分线 × 100（侵蚀比 = 费用 ÷ 盈利平仓毛利合计；全亏无止盈样本按中性 50 无法评估）'
		case 'RiskControl':
			return b
				? b.StreakPenaltyStart
					? `得分 = 100 − 大亏烈度扣分（大亏合计 ${fmtMoney(b.BigLossAmountSum ?? 0)} 元 = 资金基准的 ${(b.BigLossCapitalRatio ?? 0).toFixed(1)}%，每 1% 扣 1.5 分封顶 60） − 连亏惩罚（最大连亏 ${b.MaxLossStreak} 笔，期望 ${(b.ExpectMaxLossStreak ?? 0).toFixed(1)} 笔，超起扣 ${b.StreakPenaltyStart} 笔每笔 6 分，期望 k*=ln(n·q̂)÷ln(1/p̂)、p̂=(亏损笔数+1)÷(总笔数+2) Laplace 平滑；大亏 = 单笔亏损低于 -平均单笔买入 ${fmtMoney(b.AvgBuyAmount)} 元 × ${b.BigLossThreshold}% = ${fmtMoney(b.BigLossAmount)} 元；下限 5）`
					: b.BigLossAmount > 0
						? `得分 = 100 − 大亏占比 ${b.BigLossRatio.toFixed(1)}% × 60 − 连亏惩罚（大亏 = 单笔亏损低于 -平均单笔买入 ${fmtMoney(b.AvgBuyAmount)} 元 × ${b.BigLossThreshold}% = ${fmtMoney(b.BigLossAmount)} 元；最大连亏 ${b.MaxLossStreak} 笔，超 ${b.ConsecutiveLossStart} 笔每笔 6 分；本次评定为旧口径快照）`
						: `得分 = 100 − 大亏占比 ${b.BigLossRatio.toFixed(1)}% × 60 − 连亏惩罚（大亏阈值 ${fmtMoney(b.BigLossThreshold)} 元；最大连亏 ${b.MaxLossStreak} 笔，超 ${b.ConsecutiveLossStart} 笔每笔 6 分；本次评定为旧口径快照）`
				: '得分 = 100 − 大亏烈度（大亏合计 ÷ 资金基准）− 连亏惩罚（起扣取标准阈值与期望最大连亏的大者）；下限 5 分'
		case 'Patience':
			return b
				? `得分：平均持有 ${b.AvgHoldDays.toFixed(1)} 天 vs 达标 ${b.HoldDaysTarget} 天（软饱和：达标=85、${b.PatienceCapMult ?? 3}×达标封顶 100）− 处置扣分（盈利持 ${b.WinAvgHoldDays.toFixed(1)} 天 vs 亏损持 ${b.LossAvgHoldDays.toFixed(1)} 天；下限 0）`
				: '得分 = 软饱和映射（平均持有天数 ÷ 流派达标天数）：达标=85、封顶倍数×达标封顶 100（倍数默认 3）− 处置效应扣分（下限 0）'
		case 'DrawdownControl':
			return b
				? b.CumulativeReturn > 0
					? `得分 = 100 − 最大回撤 ${fmtMoney(b.MaxDrawdown)} 元 ÷ 基准 ${fmtMoney(b.DrawdownScale)} 元 × 100（基准 = max(曲线峰值, 单笔均幅×${b.AvgAmplitudeMultiplier}, 资金基准 ${fmtMoney(b.CapitalBase)} 元)；无卖出按 50 计）`
					: b.ReboundAmount !== undefined
						? `亏损账户按止血度：得分 = 50 × 期末反弹 ${fmtMoney(b.ReboundAmount)} 元 ÷ 最大回撤 ${fmtMoney(b.MaxDrawdown)} 元（单调阴跌记 0，深跌后企稳回血按度给分；与收益能力维解耦）`
						: `得分 = 100 − 最大回撤 ${fmtMoney(b.MaxDrawdown)} 元 ÷ 基准 ${fmtMoney(b.DrawdownScale)} 元 × 100（本次评定为旧口径快照）`
				: '得分 = 盈利账户 100 − 最大回撤 ÷ 基准 × 100；亏损账户止血度 = 50 × 期末反弹 ÷ 最大回撤（单调阴跌记 0）'
		case 'Profitability':
			return b
				? `得分：年化 ${b.AnnualRate.toFixed(2)}% vs 达标线 ${b.AnnualRateTarget}%（软饱和居中：0=50、达标=85、${b.ProfitCapMult ?? 3}×达标封顶 100，负方向对称；累计收益率 ${b.CumulativeReturn.toFixed(2)}% = 净盈亏 ÷ 资金基准 ${fmtMoney(b.CapitalBase)} 元；年化 × 365 ÷ 活跃 ${b.TradeDays} 天）`
				: '得分 = 软饱和居中映射（年化收益率 ÷ 流派达标线）：0=50、达标=85、封顶倍数×达标=100（倍数默认 3）'
		default:
			return ''
	}
}

// 评分色彩（60 分及格线；雷达轴名、数据点标签、悬浮明细共用）
function scoreColor(v: number) {
	return v >= 80 ? '#2fa66a' : v >= 60 ? '#4a7ef7' : '#f2637b'
}

function scoreTone(v: number) {
	return v >= 80 ? 'g' : v >= 60 ? 'p' : 'f'
}

// （评分依据弹窗状态与视图见下方「评分依据弹窗」区块；雷达/得分窗口按作用域共用）

// 雷达切换（全部历史=实时组合全历史口径；今年=今年窗口得分）
const radarMode = ref<'all' | 'year'>('all')

function renderRadar() {
	const el = radarRef.value
	const view = radarView.value
	if (!el || !view.has || !view.scores) {
		if (radarChart) {
			radarChart.dispose()
			radarChart = undefined
		}
		return
	}
	if (!radarChart) radarChart = echarts.init(el)
	const s = view.scores
	const dims = SCORE_DIMS.map(e => ({ ...e, value: Number(s[e.key]), formula: dimFormula(e.key, view.basis) }))
	radarChart.setOption({
		tooltip: {
			trigger: 'item',
			confine: true,
			enterable: true,
			backgroundColor: '#fff',
			borderColor: 'rgba(228, 233, 245, 0.9)',
			borderWidth: 1,
			padding: [10, 12],
			textStyle: { color: '#303133', fontSize: 12 },
			extraCssText: 'box-shadow: 0 6px 20px rgba(31, 45, 61, 0.12); border-radius: 12px; max-width: 376px; max-height: 272px; overflow-y: auto; overscroll-behavior: contain; white-space: normal;',
			// 悬停任一数据点：展开八维评分标准（分数 + 维度 + 该维动态评分公式；超高时可在浮层内滚动）
			formatter: () => {
				const rows = dims
					.map((e, i) =>
						`<div style="margin-top:${i === 0 ? 0 : 8}px;text-align:left;white-space:normal">` +
						`<div><span style="color:${scoreColor(e.value)};font-weight:600">${e.value.toFixed(1)} 分</span>` +
						`<span style="font-weight:600;color:#303133;margin-left:6px">${e.name}</span></div>` +
						`<div style="color:#8a94a6;font-size:11px;line-height:1.55;margin-top:2px">${e.formula}</div></div>`
					)
					.join('')
				const b = view.basis
				return (
					'<div style="text-align:left"><div style="font-weight:600;color:#303133">八维评分标准</div>' +
					`<div style="color:#8a94a6;font-size:11px;margin-top:2px">评分标准「${b?.Standard ?? '默认'}」· ≥80 优秀 · ≥60 及格 · &lt;60 不及格</div>` +
					`<div style="margin-top:8px">${rows}</div></div>`
				)
			}
		},
		radar: {
			indicator: dims.map(e => ({ name: `{${scoreTone(e.value)}|${e.name}}`, max: 100 })),
			radius: '62%',
			center: ['50%', '51%'],
			splitNumber: 4,
			axisName: {
				color: '#5b6478',
				fontSize: 12,
				fontWeight: 600,
				rich: {
					g: { color: '#2fa66a', fontSize: 12, fontWeight: 600 },
					p: { color: '#4a7ef7', fontSize: 12, fontWeight: 600 },
					f: { color: '#f2637b', fontSize: 12, fontWeight: 600 }
				}
			},
			splitArea: { areaStyle: { color: ['rgba(240, 245, 255, 0.65)', 'rgba(255, 255, 255, 0)'] } },
			axisLine: { lineStyle: { color: '#e3e9f6' } },
			splitLine: { lineStyle: { color: '#e3e9f6' } }
		},
		series: [
			{
				type: 'radar',
				symbolSize: 6,
				data: [
					{
						value: dims.map(e => e.value),
						name: '八维评分',
						areaStyle: {
							color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
								{ offset: 0, color: 'rgba(124, 92, 240, 0.32)' },
								{ offset: 1, color: 'rgba(74, 126, 247, 0.08)' }
							])
						},
						lineStyle: { color: '#4a7ef7', width: 2 },
						itemStyle: { color: '#4a7ef7', borderColor: '#fff', borderWidth: 1.5 },
						// 数据点分数标签按及格线着色（绿/蓝/红）
						label: {
							show: true,
							formatter: (p: any) => `{${scoreTone(Number(p.value))}|${Number(p.value).toFixed(1)}}`,
							rich: {
								g: { color: '#2fa66a', fontSize: 10, fontWeight: 600 },
								p: { color: '#4a7ef7', fontSize: 10, fontWeight: 600 },
								f: { color: '#f2637b', fontSize: 10, fontWeight: 600 }
							}
						}
					}
				]
			}
		]
	})
}

// 数据（含刷新/雷达切换）到达后重绘；无数据时销毁旧图（雷达重绘统一由下方 watch 触发）

// ---------- 得分窗口与趋势（近1/3/6自然月 + 月度趋势） ----------
const scores = ref<IZdxBehaviorScores>()
const scoreTrendRef = ref<HTMLDivElement>()
let scoreTrendChart: echarts.ECharts | undefined

// 三窗口得分卡数据（has=false 表示窗口内无成交，展示空态；评分依据公式按窗口基础数值参照生成）
const scoreWindows = computed(() => {
	const s = scores.value
	if (!s) return []
	const make = (label: string, has: boolean, sc: IZdxBehaviorScore, basis?: IZdxBehaviorScoreBasis) => ({
		label,
		has,
		total: sc.Total,
		dims: SCORE_DIMS.map(d => ({ name: d.name, value: Number(sc[d.key]), formula: dimFormula(d.key, basis) }))
	})
	return [
		make('近1个月', s.Month1HasData, s.Month1, s.Month1Basis),
		make('近3个月', s.Month3HasData, s.Month3, s.Month3Basis),
		make('近6个月', s.Month6HasData, s.Month6, s.Month6Basis)
	]
})

// 得分窗口选中（点击卡片切换；评分依据按选中窗口展示）
const selWin = ref(0)

// 当前雷达视图（全部历史=实时组合全历史口径；今年=今年窗口；has=false 时雷达展示空态）
const radarView = computed(() => {
	if (radarMode.value === 'year') {
		const s = scores.value
		const has = !!s?.HasData && !!s?.YearHasData
		return { has, scores: has ? s?.Year : undefined, basis: has ? s?.YearBasis : undefined }
	}
	return { has: !!data.value?.HasData, scores: data.value?.Scores, basis: data.value?.ScoreBasis }
})

// 渲染月度得分趋势（综合分折线；全历史按月累计；x 轴仅显示首尾两个时间点；悬停展示当月八维明细）
function renderScoreTrend() {
	const el = scoreTrendRef.value
	const points = scores.value?.Trend ?? []
	if (!el || !points.length) return
	if (!scoreTrendChart) scoreTrendChart = echarts.init(el)
	scoreTrendChart.setOption({
		grid: { left: 48, right: 42, top: 32, bottom: 26 },
		tooltip: {
			trigger: 'axis',
			confine: true,
			backgroundColor: '#fff',
			borderColor: 'rgba(228, 233, 245, 0.9)',
			borderWidth: 1,
			padding: [10, 12],
			textStyle: { color: '#303133', fontSize: 12 },
			extraCssText: 'box-shadow: 0 6px 20px rgba(31, 45, 61, 0.12); border-radius: 12px; white-space: normal;',
			formatter: (params: any[]) => {
				const p = points[params?.[0]?.dataIndex ?? -1]
				if (!p) return ''
				const rows = SCORE_DIMS.map(
					d =>
						`<span style="color:${scoreColor(Number(p.Scores[d.key]))};font-weight:600">${Number(p.Scores[d.key]).toFixed(1)}</span>` +
						`<span style="color:#5b6478"> ${d.name}</span>`
				).join('　')
				return (
					`<div style="font-weight:600;color:#303133">${p.Month}</div>` +
					`<div style="margin-top:4px">综合 <span style="color:${scoreColor(Number(p.Scores.Total))};font-weight:700">${Number(p.Scores.Total).toFixed(1)}</span> 分</div>` +
					`<div style="margin-top:6px;line-height:1.7;max-width:360px">${rows}</div>`
				)
			}
		},
		xAxis: {
			type: 'category',
			data: points.map(p => p.Month),
			boundaryGap: false,
			// 时间标签：首尾必显 + 偶数索引间隔显示（末尾附近留空防拥挤），避免结束月份被裁切
			axisLabel: {
				interval: (i: number) => i === 0 || i === points.length - 1 || (i % 2 === 0 && points.length - 1 - i >= 2),
				color: '#8a91a8',
				fontSize: 11
			},
			axisTick: { show: false }
		},
		yAxis: { type: 'value', min: 0, max: 100, splitLine: { lineStyle: { color: '#eef0f6' } } },
		series: [
			{
				name: '综合得分',
				type: 'line',
				data: points.map(p => Number(Number(p.Scores.Total).toFixed(1))),
				smooth: true,
				symbol: 'circle',
				symbolSize: 7,
				lineStyle: { width: 2.4, color: '#4a7ef7' },
				itemStyle: { color: '#4a7ef7', borderColor: '#fff', borderWidth: 1.5 },
				areaStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: 'rgba(74, 126, 247, 0.22)' },
						{ offset: 1, color: 'rgba(74, 126, 247, 0.02)' }
					])
				},
				label: { show: false }
			}
		]
	} as any, true)
}

// 得分数据到达后重绘；无趋势时销毁旧图；默认选中第一个有成交的窗口
watch(scores, async () => {
	await nextTick()
	if (scores.value?.Trend?.length) {
		renderScoreTrend()
	} else if (scoreTrendChart) {
		scoreTrendChart.dispose()
		scoreTrendChart = undefined
	}
	if (!scoreWindows.value[selWin.value]?.has) {
		const first = scoreWindows.value.findIndex(w => w.has)
		if (first >= 0) selWin.value = first
	}
})

// 数据（data=全历史 / scores=窗口）与雷达切换到达后重绘雷达；无数据时销毁旧图
watch([data, scores, radarMode], async () => {
	await nextTick()
	renderRadar()
})

// ---------- 评分依据弹窗（雷达=全部历史/今年；得分窗口=近1/3/6个月；按作用域展示对应口径） ----------
type BasisScope = 'all' | 'year' | 'm1' | 'm3' | 'm6'
const basisVisible = ref(false)
const basisScope = ref<BasisScope>('all')

// 窗口作用域底部说明（实际值取自该窗口实时统计）
function winBasisFoot(name: string) {
	return `按所属流派评分标准换算；公式中的实际值取自${name}窗口的实时统计，字段缺失时显示通用口径`
}

// 弹窗视图：按作用域取对应窗口的得分与基础数值参照（雷达与得分窗口共用入口）
const basisView = computed(() => {
	const d = data.value
	const s = scores.value
	const scopes: Record<BasisScope, { label: string; scores?: IZdxBehaviorScore; basis?: IZdxBehaviorScoreBasis; foot: string }> = {
		all: { label: '全部历史', scores: d?.Scores, basis: d?.ScoreBasis, foot: '评定时按所属流派评分标准换算；公式中的实际值取自最近一次评定的全历史基础数值参照，未评定或字段缺失时显示通用口径' },
		year: { label: '今年', scores: s?.Year, basis: s?.YearBasis, foot: winBasisFoot('今年') },
		m1: { label: '近1个月', scores: s?.Month1, basis: s?.Month1Basis, foot: winBasisFoot('近1个月') },
		m3: { label: '近3个月', scores: s?.Month3, basis: s?.Month3Basis, foot: winBasisFoot('近3个月') },
		m6: { label: '近6个月', scores: s?.Month6, basis: s?.Month6Basis, foot: winBasisFoot('近6个月') }
	}
	const cur = scopes[basisScope.value]
	return {
		...cur,
		rows: SCORE_DIMS.map(e => ({ name: e.name, value: Number(cur.scores?.[e.key] ?? 0), formula: dimFormula(e.key, cur.basis) }))
	}
})

// 雷达卡「评分依据」：按当前雷达切换（全部历史/今年）打开
function openRadarBasis() {
	basisScope.value = radarMode.value === 'year' ? 'year' : 'all'
	basisVisible.value = true
}

// 得分窗口卡「评分依据」：按当前选中窗口打开（选中窗口无成交时回退到第一个有成交的窗口）
function openWinBasis() {
	const ws = scoreWindows.value
	if (!ws[selWin.value]?.has) {
		const first = ws.findIndex(w => w.has)
		if (first >= 0) selWin.value = first
	}
	basisScope.value = (['m1', 'm3', 'm6'] as BasisScope[])[selWin.value] ?? 'm1'
	basisVisible.value = true
}

// 得分窗口点击选中（无成交窗口不可选；评分依据按选中窗口展示）
function selectWin(i: number) {
	if (scoreWindows.value[i]?.has) selWin.value = i
}

function onResize() {
	radarChart?.resize()
	scoreTrendChart?.resize()
}

// ---------- 评定 / 重新评定（AI 分析随评定自动生成；评定期间轮询进度展示当前计算阶段） ----------
const ai = ref<IZdxBehaviorAiData>()
const evaluating = ref(false)
// 评定进度（轮询后端内存进度：百分比 + 当前阶段说明）
const evalProgress = ref<IZdxBehaviorEvalProgress>()
let evalTimer: number | undefined

// 评定/重新评定：按步骤执行（先评定行为/选股风格/交易风格/交易性格 → 落库风格总结与八维基础数值参照 → 按流派标准换算八维分值并刷新月度快照 → 生成 AI 诊断）
async function evaluate() {
	evaluating.value = true
	evalProgress.value = { Running: true, Percent: 3, Stage: '正在提交评定请求…' }
	startEvalPolling()
	try {
		const res = await zdxApi.evaluateMyBehaviorProfile()
		data.value = res.Stats
		if (res.Ai) ai.value = res.Ai
		// 得分窗口与月度趋势刷新（评定已按新口径重算快照；失败不阻断）
		try {
			scores.value = await zdxApi.getMyBehaviorScores()
		} catch {
			// 忽略：保留旧得分展示
		}
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		stopEvalPolling()
		evaluating.value = false
	}
}

// 评定进度轮询（每秒读取一次；失败静默，保留最后一次已展示进度）
function startEvalPolling() {
	stopEvalPolling()
	evalTimer = window.setInterval(async () => {
		try {
			const p = await zdxApi.getMyBehaviorEvalProgress()
			if (p && (p.Running || p.Percent > 0)) evalProgress.value = p
		} catch {
			// 忽略：保留当前展示
		}
	}, 1000)
}

function stopEvalPolling() {
	if (evalTimer !== undefined) {
		window.clearInterval(evalTimer)
		evalTimer = undefined
	}
}

// AI 正文分段：识别段头行（如“交易风格：…”），其余作为普通段落
const aiSegments = computed<{ head?: string; text: string }[]>(() => {
	const text = ai.value?.Analysis
	if (!text) return []
	const segs: { head?: string; text: string }[] = []
	for (const raw of text.split('\n')) {
		const line = raw.trim()
		if (!line) continue
		const m = line.match(/^(?:【)?(交易风格|选股风格|交易性格|主要优势|风险短板|改进建议)(?:】)?\s*[：:，,]?\s*(.*)$/)
		if (m) {
			segs.push({ head: m[1], text: m[2] })
		} else {
			segs.push({ text: line })
		}
	}
	return segs
})

// 段头图标（fas 全量已注册）
const AI_HEAD_ICONS: Record<string, string> = {
	交易风格: 'compass',
	选股风格: 'magnifying-glass-chart',
	交易性格: 'user-gear',
	主要优势: 'circle-check',
	风险短板: 'triangle-exclamation',
	改进建议: 'lightbulb'
}

// 段头色调
const AI_HEAD_TONES: Record<string, string> = {
	交易风格: 'tone-blue',
	选股风格: 'tone-teal',
	交易性格: 'tone-rose',
	主要优势: 'tone-green',
	风险短板: 'tone-orange',
	改进建议: 'tone-violet'
}

function headIcon(head?: string) {
	return AI_HEAD_ICONS[head ?? ''] ?? 'circle-info'
}

function headTone(head?: string) {
	return AI_HEAD_TONES[head ?? ''] ?? 'tone-blue'
}

// ---------- 交易风格 / 选股风格 / 交易性格（三卡片维度行） ----------
// 交易风格六层维度（标签为空显示"未识别"）
const styleRows = computed(() => {
	const s = data.value?.Style
	if (!s) return []
	return [
		{ label: '持仓周期', tag: s.HoldCycleTag },
		{ label: '交易频率', tag: s.FrequencyTag },
		{ label: '策略类型', tag: s.StrategyType },
		{ label: '风险等级', tag: s.RiskLevel },
		{ label: '标的偏好', tag: s.TargetTag },
		{ label: '执行方式', tag: s.ExecutionTag }
	]
})

// 选股风格 8 维
const stockRows = computed(() => {
	const s = data.value?.StockStyle
	if (!s) return []
	return [
		{ label: '市值', tag: s.MarketCapTag },
		{ label: '估值', tag: s.ValuationTag },
		{ label: '成长价值', tag: s.GrowthValueTag },
		{ label: '质量', tag: s.QualityTag },
		{ label: '行业', tag: s.IndustryTag },
		{ label: '动量', tag: s.MomentumTag },
		{ label: '波动', tag: s.VolatilityTag },
		{ label: '集中度', tag: s.ConcentrationTag }
	]
})

// 交易性格维度（10 维 + 换手辅助标签）
const personaRows = computed(() => {
	const s = data.value?.Persona
	if (!s) return []
	return [
		{ label: '风险偏好', tag: s.RiskTag },
		{ label: '持仓周期', tag: s.HoldCycleTag },
		{ label: '交易频率', tag: s.FrequencyTag },
		{ label: '换手水平', tag: s.TurnoverTag },
		{ label: '盈亏处理', tag: s.ProfitLossTag },
		{ label: '仓位变化', tag: s.PositionChangeTag },
		{ label: '情绪反应', tag: s.EmotionTag },
		{ label: '决策一致性', tag: s.ConsistencyTag },
		{ label: '集中度', tag: s.ConcentrationTag },
		{ label: '成本敏感度', tag: s.CostSenseTag },
		{ label: '耐心程度', tag: s.PatienceTag }
	]
})

// ---------- 格式化 ----------
function fmtMoney(value: number, signed = false) {
	return formatThousands(value, signed)
}
function num1(value?: number) {
	return (value ?? 0).toFixed(1)
}
function num2(value?: number) {
	return (value ?? 0).toFixed(2)
}
function fmtTime(value: string) {
	return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
}
// 择时窗口取值（多窗口预计算按窗口号取；指定窗口不存在返回 null）
function timingWin(n: number) {
	return data.value?.Timing?.Windows?.find(w => w.Window === n) ?? null
}
function pctText(value: number) {
	return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}
function changeClass(value?: number) {
	if (value === undefined || value === null || value === 0) return ''
	return value > 0 ? 'up' : 'down'
}
function rateClass(value: number) {
	if (!value) return ''
	return value >= 50 || value >= 1 ? 'up' : 'down'
}
function quadLabel(q: number) {
	return ['', '顶尖', '稳健', '激进', '待改进'][q] ?? '--'
}
function quadTag(q: number) {
	return ['info', 'warning', 'primary', 'warning', 'info'][q] ?? 'info'
}
// 象限占比（相对有卖出统计的个股总数；无数据返回空）
function quadRatio(count: number) {
	const total = data.value?.Quadrant.Stocks?.length ?? 0
	if (!total) return ''
	return `${((count / total) * 100).toFixed(0)}%`
}

const morningText = computed(() => {
	const d = data.value
	if (!d) return ''
	const total = d.Rhythm.MorningCount + d.Rhythm.AfternoonCount
	if (!total) return '无时段数据'
	const m = Math.round((d.Rhythm.MorningCount / total) * 100)
	return `早盘 ${m}% · 午后 ${100 - m}%`
})

onMounted(() => {
	window.addEventListener('resize', onResize)
	load()
})

onUnmounted(() => {
	window.removeEventListener('resize', onResize)
	stopEvalPolling()
	radarChart?.dispose()
	radarChart = undefined
	scoreTrendChart?.dispose()
	scoreTrendChart = undefined
})
</script>

<style lang="scss" scoped>
.behavior-profile {
	display: flex;
	flex-direction: column;
	gap: 14px;

	.up {
		color: var(--el-color-danger);
	}

	.down {
		color: var(--el-color-success);
	}

	.warn-text {
		color: #b88230;
	}

	.good-text {
		color: #529b2e;
	}

	// ---------- 页头（蓝紫渐变横幅） ----------
	.bp-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 20px 24px;
		border-radius: 18px;
		position: relative;
		overflow: hidden;
		background: linear-gradient(135deg, #4a7ef7 0%, #6c63f0 55%, #7c5cf0 100%);
		box-shadow: 0 8px 22px rgba(74, 126, 247, 0.26);

		// 装饰光斑
		&::before {
			content: "";
			position: absolute;
			right: -36px;
			top: -78px;
			width: 230px;
			height: 230px;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.12);
		}

		&::after {
			content: "";
			position: absolute;
			right: 140px;
			bottom: -96px;
			width: 190px;
			height: 190px;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.08);
		}
	}

	.bp-head-left {
		display: flex;
		align-items: center;
		gap: 14px;
		min-width: 0;
		position: relative;
		z-index: 1;
	}

	.bp-head-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 46px;
		height: 46px;
		flex: none;
		border-radius: 14px;
		font-size: 20px;
		color: #fff;
		background: rgba(255, 255, 255, 0.18);
		border: 1px solid rgba(255, 255, 255, 0.32);
	}

	.bp-head-title {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.bp-title-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
	}

	// 标题横栏的交易风格总结胶囊（渐变横幅上的半透明胶囊）
	.bp-style-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 3px 12px;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.2px;
		color: #fff;
		background: rgba(255, 255, 255, 0.18);
		border: 1px solid rgba(255, 255, 255, 0.4);
		transition: background 0.2s;

		&:hover {
			background: rgba(255, 255, 255, 0.28);
		}
	}

	.bp-title {
		font-size: 19px;
		font-weight: 700;
		color: #fff;
		letter-spacing: 0.5px;
	}

	.bp-sub {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.78);
	}

	.bp-refresh-btn {
		position: relative;
		z-index: 1;
		background: rgba(255, 255, 255, 0.16);
		border-color: rgba(255, 255, 255, 0.42);
		color: #fff;

		&:hover,
		&:focus {
			background: rgba(255, 255, 255, 0.28);
			border-color: rgba(255, 255, 255, 0.65);
			color: #fff;
		}
	}

	// 主体内容（板块纵向排列 + 统一间距）
	.bp-body {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	// ---------- 顶部两栏 ----------
	.bp-top {
		display: flex;
		gap: 14px;
		align-items: stretch;
	}

	// 通用白卡
	.bp-card {
		border: 1px solid rgba(228, 233, 245, 0.9);
		border-radius: 16px;
		padding: 16px 18px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		background: #fff;
		box-shadow: 0 2px 12px rgba(31, 45, 61, 0.06);
		transition: box-shadow 0.2s, transform 0.2s;

		&:hover {
			box-shadow: 0 6px 20px rgba(64, 158, 255, 0.14);
			transform: translateY(-2px);
		}
	}

	.bp-card-title {
		font-size: 14px;
		font-weight: 700;
		color: #303133;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.bp-title-note {
		margin-left: auto;
		font-size: 11px;
		font-weight: 400;
		color: var(--el-text-color-secondary);
		white-space: nowrap;
	}

	// 标题旁「评分依据」入口（雷达/得分窗口共用弹窗）
	.bp-note-link {
		flex: none;
		padding: 1px 8px;
		border: 1px solid rgba(74, 126, 247, 0.35);
		border-radius: 10px;
		font-size: 11px;
		color: #4a7ef7;
		background: rgba(74, 126, 247, 0.06);
		cursor: pointer;
		transition: background 0.2s, border-color 0.2s;

		&:hover {
			background: rgba(74, 126, 247, 0.14);
			border-color: rgba(74, 126, 247, 0.6);
		}
	}

	.bp-mini-ico {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		flex: none;
		border-radius: 8px;
		font-size: 12px;

		&.tone-blue {
			color: #409eff;
			background: rgba(64, 158, 255, 0.12);
		}

		&.tone-violet {
			color: #7c5cf0;
			background: rgba(124, 92, 240, 0.12);
		}

		&.tone-orange {
			color: #e6a23c;
			background: rgba(230, 162, 60, 0.14);
		}

		&.tone-teal {
			color: #13c2c2;
			background: rgba(19, 194, 194, 0.12);
		}

		&.tone-rose {
			color: #f2637b;
			background: rgba(242, 99, 123, 0.12);
		}

		&.tone-green {
			color: #2fa66a;
			background: rgba(47, 166, 106, 0.12);
		}
	}

	// 雷达卡
	.bp-radar-card {
		width: 440px;
		flex-shrink: 0;

		// 标题小标题防溢出（切换器 + 依据按钮占位后空间有限）
		.bp-title-note {
			max-width: 132px;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	// 评分标准变更提示条（评定后流派评分参数被调整；警告色调）
	.bp-std-changed {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		margin: 0 0 10px;
		padding: 7px 10px;
		border-radius: 8px;
		font-size: 11px;
		line-height: 1.55;
		color: #d48806;
		background: rgba(212, 136, 6, 0.1);

		svg {
			flex: none;
			margin-top: 2px;
		}
	}

	// 雷达切换（全部历史/今年 小分段）
	.bp-radar-seg {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		flex: none;
		padding: 2px;
		border-radius: 9px;
		background: #f1f4fb;

		button {
			border: none;
			padding: 2px 9px;
			border-radius: 7px;
			font-size: 11px;
			line-height: 1.5;
			color: #6b7280;
			background: transparent;
			cursor: pointer;
			transition: background 0.2s, color 0.2s, box-shadow 0.2s;

			&.is-on {
				color: #4a7ef7;
				font-weight: 600;
				background: #fff;
				box-shadow: 0 1px 4px rgba(74, 126, 247, 0.25);
			}
		}
	}

	.bp-radar-wrap {
		position: relative;
	}

	.bp-radar {
		width: 100%;
		height: 306px;
	}

	// 雷达空态（今年窗口无成交时的覆盖提示）
	.bp-radar-empty {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		color: #9aa3b6;
		background: rgba(255, 255, 255, 0.72);
	}

	.bp-total {
		position: absolute;
		left: 50%;
		top: 51%;
		transform: translate(-50%, -50%);
		width: 84px;
		height: 84px;
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1px;
		pointer-events: none;
		background: radial-gradient(circle at 50% 36%, #ffffff 30%, #f2f6ff 100%);
		box-shadow: 0 2px 10px rgba(74, 126, 247, 0.18), 0 0 0 6px rgba(74, 126, 247, 0.07);

		.total-num {
			font-size: 26px;
			font-weight: 700;
			line-height: 1.1;
			color: #5a6cf0;
			font-variant-numeric: tabular-nums;
			background: linear-gradient(135deg, #4a7ef7, #7c5cf0);
			-webkit-background-clip: text;
			background-clip: text;
			-webkit-text-fill-color: transparent;
		}

		.total-label {
			font-size: 11px;
			color: var(--el-text-color-secondary);
		}
	}

	// 总体战绩（胶囊格）
	.bp-overall {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
		border-top: 1px dashed var(--el-border-color-lighter);
		padding-top: 12px;

		.tkv {
			display: flex;
			flex-direction: column;
			gap: 3px;
			min-width: 0;
			padding: 8px 12px;
			border-radius: 10px;
			background: var(--el-fill-color-lighter);
		}

		.t-k {
			font-size: 11px;
			color: var(--el-text-color-secondary);
		}

		.t-v {
			font-size: 13px;
			font-weight: 700;
			font-variant-numeric: tabular-nums;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	// AI 卡
	.bp-ai-card {
		flex: 1;
		min-width: 0;
	}

	.ai-loading {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		color: var(--el-text-color-regular);
		font-size: 13px;

		.ai-loading-ico {
			font-size: 30px;
			color: #7c5cf0;
			animation: ai-pulse 1.6s ease-in-out infinite;
		}

		// 评定步骤进度（轮询展示：进度条 + 当前计算阶段）
		.ai-progress {
			width: 78%;
			max-width: 360px;
			display: flex;
			flex-direction: column;
			gap: 6px;

			.ai-progress-track {
				height: 6px;
				border-radius: 999px;
				background: rgba(124, 92, 240, 0.14);
				overflow: hidden;
			}

			.ai-progress-fill {
				height: 100%;
				border-radius: 999px;
				background: linear-gradient(90deg, #4a7ef7, #7c5cf0);
				transition: width 0.4s ease;
			}

			.ai-progress-stage {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 10px;
				font-size: 12px;
				color: #5b637a;

				.ai-progress-pct {
					flex: none;
					font-weight: 600;
					color: #7c5cf0;
					font-variant-numeric: tabular-nums;
				}
			}
		}

		.ai-loading-tip {
			font-size: 12px;
			color: var(--el-text-color-secondary);
			text-align: center;
		}
	}

	.ai-body {
		display: flex;
		flex-direction: column;
		gap: 10px;
		overflow-y: auto;
		max-height: 380px;

		.ai-sections {
			display: flex;
			flex-direction: column;
			gap: 12px;
			flex: 1;
			padding: 14px 16px;
			border-radius: 12px;
			border: 1px solid rgba(124, 92, 240, 0.12);
			background: linear-gradient(160deg, rgba(74, 126, 247, 0.05), rgba(124, 92, 240, 0.06));
		}

		.ai-seg {
			display: flex;
			flex-direction: column;
			gap: 4px;
		}

		.ai-seg-head {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 13px;
			font-weight: 700;

			&.tone-blue {
				color: #337ecc;
			}

			&.tone-green {
				color: #2fa66a;
			}

			&.tone-orange {
				color: #b88230;
			}

			&.tone-violet {
				color: #6c4ae8;
			}

			&.tone-teal {
				color: #0f9b9b;
			}

			&.tone-rose {
				color: #d2607a;
			}
		}

		.ai-seg-text {
			font-size: 13px;
			line-height: 1.85;
			color: #303133;
			word-break: break-word;
			white-space: pre-wrap;
		}

		.ai-time {
			font-size: 11px;
			color: var(--el-text-color-secondary);
			border-top: 1px dashed var(--el-border-color-lighter);
			padding-top: 8px;
		}
	}

	.ai-empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 20px;
		text-align: center;

		.ai-empty-ico {
			font-size: 38px;
			color: #9f8bf7;
			opacity: 0.75;
		}

		.ai-empty-text {
			font-size: 13px;
			color: var(--el-text-color-secondary);
			line-height: 1.8;
			max-width: 460px;
		}

		.ai-empty-tip {
			font-size: 12px;
			color: var(--el-text-color-placeholder);
		}
	}

	// ---------- 得分窗口与趋势 ----------
	.bp-scores-card {
		.bp-scores-wrap {
			display: grid;
			grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
			gap: 20px;
			align-items: stretch;
		}

		.bp-win-cols {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 12px;
		}

		.bp-win {
			display: flex;
			flex-direction: column;
			gap: 8px;
			border: 1px solid #eef0f6;
			border-radius: 14px;
			padding: 14px;
			background: linear-gradient(180deg, #fbfcff 0%, #f6f8ff 100%);
			transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
			cursor: pointer;

			&:hover {
				border-color: rgba(74, 126, 247, 0.35);
				box-shadow: 0 4px 14px rgba(74, 126, 247, 0.1);
			}

			// 无成交窗口不可选
			&.is-empty {
				cursor: default;
			}

			// 选中态（评分依据按选中窗口展示）
			&.is-sel {
				border-color: rgba(74, 126, 247, 0.55);
				background: linear-gradient(180deg, #f7faff 0%, #eef4ff 100%);
				box-shadow: 0 4px 16px rgba(74, 126, 247, 0.16);
			}

			.bw-head {
				display: flex;
				align-items: baseline;
				justify-content: space-between;
				padding-bottom: 8px;
				border-bottom: 1px dashed #e6ebf7;

				.bw-label {
					font-size: 12px;
					font-weight: 600;
					color: #5b637a;
				}

				.bw-total {
					font-size: 24px;
					font-weight: 700;
					font-variant-numeric: tabular-nums;
					letter-spacing: -0.5px;
				}

				.bw-na {
					color: #c3c8d4;
				}
			}

			.bw-dim {
				display: flex;
				align-items: center;
				gap: 6px;

				.bw-dim-name {
					flex: none;
					width: 52px;
					font-size: 11px;
					color: #8a94a6;
					white-space: nowrap;
				}

				.bw-dim-track {
					flex: 1;
					height: 5px;
					border-radius: 999px;
					background: #edf0f8;
					overflow: hidden;

					.bw-dim-fill {
						height: 100%;
						border-radius: 999px;
						transition: width 0.4s;
					}
				}

				.bw-dim-val {
					width: 22px;
					text-align: right;
					font-size: 11px;
					font-weight: 600;
					font-variant-numeric: tabular-nums;
				}
			}

			.bw-empty {
				padding: 14px 0;
				text-align: center;
				font-size: 12px;
				color: #a7abba;
			}
		}

		.bp-score-trend-wrap {
			display: flex;
			flex-direction: column;
			justify-content: center;
			border: 1px solid rgba(74, 126, 247, 0.1);
			border-radius: 14px;
			padding: 10px 12px 4px;
			background: linear-gradient(160deg, rgba(74, 126, 247, 0.045), rgba(124, 92, 240, 0.04));

			.bp-score-trend {
				height: 236px;
			}
		}
	}

	// ---------- 标签墙 ----------
	.bp-tags-card {
		gap: 12px;
	}

	.bp-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.bp-tag {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 14px;
		border-radius: 999px;
		font-size: 13px;
		font-weight: 600;
		transition: transform 0.15s;

		&::before {
			content: "";
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: currentColor;
			opacity: 0.7;
		}

		&:hover {
			transform: translateY(-1px);
		}

		&.tone-good {
			background: rgba(103, 194, 58, 0.12);
			color: #529b2e;
		}

		&.tone-warn {
			background: rgba(230, 162, 60, 0.14);
			color: #b88230;
		}

		&.tone-info {
			background: rgba(64, 158, 255, 0.12);
			color: #337ecc;
		}
	}

	// ---------- 交易风格 / 选股风格 / 交易性格（三卡片） ----------
	.bp-style-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
		gap: 14px;
	}

	.bp-style-card {
		gap: 12px;

		// 主风格焦点区（渐变衬底 + 主风格大标签 + 一句话总结）
		.st-hero {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 10px;
			padding: 10px 12px;
			border-radius: 12px;
			background: linear-gradient(135deg, rgba(124, 92, 240, 0.08), rgba(74, 126, 247, 0.06));
			border: 1px dashed rgba(124, 92, 240, 0.25);
		}

		.st-main-tag {
			font-size: 15px;
			font-weight: 700;
			letter-spacing: 0.3px;
			padding: 4px 14px;
			border-radius: 10px;
			color: #fff;

			&.st-tone-good {
				background: linear-gradient(135deg, #35b26f, #2fa66a);
			}

			&.st-tone-warn {
				background: linear-gradient(135deg, #f0a020, #d9534f);
			}

			&.st-tone-info {
				background: linear-gradient(135deg, #5f8bf8, #7c5cf0);
			}
		}

		.st-summary {
			font-size: 12px;
			line-height: 1.6;
			color: var(--el-text-color-secondary);
			word-break: break-word;
		}

		.st-rows {
			display: flex;
			flex-direction: column;
			gap: 7px;
		}

		.st-row {
			display: flex;
			align-items: center;
			gap: 10px;
			min-height: 26px;

			.st-row-label {
				flex: none;
				width: 72px;
				font-size: 12px;
				color: var(--el-text-color-secondary);
			}
		}

		.st-none {
			font-size: 12px;
			color: #c3c8d4;
		}

		.st-values {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 6px 18px;
			border-top: 1px dashed var(--el-border-color-lighter);
			padding-top: 10px;

			.kv.wide {
				grid-column: 1 / -1;
			}
		}
	}

	// ---------- 指标卡 ----------
	.bp-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
		gap: 14px;
	}

	.bp-kv {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px 18px;
	}

	.kv {
		display: flex;
		align-items: baseline;
		gap: 8px;
		font-size: 12px;
		min-width: 0;
	}

	.k {
		color: var(--el-text-color-secondary);
		flex: none;
	}

	// 值：常规字重（非标题样式）；允许换行完整展示，不再截断省略
	.v {
		font-weight: 400;
		color: var(--el-text-color-regular);
		font-variant-numeric: tabular-nums;
		flex: 1;
		min-width: 0;
		text-align: right;
		overflow-wrap: anywhere;

		&.up {
			color: var(--el-color-danger);
		}

		&.down {
			color: var(--el-color-success);
		}

		&.warn-text {
			color: #b88230;
		}

		&.good-text {
			color: #529b2e;
		}
	}

	.bp-bar-wrap {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.bp-bar-label {
		display: flex;
		justify-content: space-between;
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	.bp-bar {
		display: flex;
		height: 9px;
		border-radius: 5px;
		overflow: hidden;
		background: var(--el-fill-color-light);
	}

	.seg {
		min-width: 3px;
	}

	.seg-morning {
		background: #f0a020;
	}

	.seg-afternoon {
		background: #4a7ef7;
	}

	.seg-short {
		background: #f0a020;
	}

	.seg-swing {
		background: #4a7ef7;
	}

	.seg-long {
		background: #7c5cf0;
	}

	.seg-bigloss {
		background: #2fa66a;
	}

	.seg-smallloss {
		background: #a9d8bf;
	}

	.seg-smallwin {
		background: #f5b9b9;
	}

	.seg-bigwin {
		background: #d9534f;
	}

	.seg-low {
		background: #73a0fa;
	}

	.seg-mid {
		background: #4a7ef7;
	}

	.seg-high {
		background: #2f5bd4;
	}

	.bp-bar-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 14px;
		font-size: 11px;
		color: var(--el-text-color-secondary);

		.lg-bigloss::before,
		.lg-smallloss::before,
		.lg-smallwin::before,
		.lg-bigwin::before,
		.lg-short::before,
		.lg-swing::before,
		.lg-long::before,
		.lg-low::before,
		.lg-mid::before,
		.lg-high::before {
			content: "";
			display: inline-block;
			width: 8px;
			height: 8px;
			border-radius: 2px;
			margin-right: 4px;
		}

		.lg-bigloss::before {
			background: #2fa66a;
		}

		.lg-smallloss::before {
			background: #a9d8bf;
		}

		.lg-smallwin::before {
			background: #f5b9b9;
		}

		.lg-bigwin::before {
			background: #d9534f;
		}

		.lg-short::before {
			background: #f0a020;
		}

		.lg-swing::before {
			background: #4a7ef7;
		}

		.lg-long::before {
			background: #7c5cf0;
		}

		.lg-low::before {
			background: #73a0fa;
		}

		.lg-mid::before {
			background: #4a7ef7;
		}

		.lg-high::before {
			background: #2f5bd4;
		}
	}

	.bp-timing-sell {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 6px 18px;
		border-top: 1px dashed var(--el-border-color-lighter);
		padding-top: 10px;
	}

	.bp-none {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	// ---------- 四象限 ----------
	.bp-quadrant {
		gap: 12px;
	}

	.bp-quad-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
	}

	.bp-quad-item {
		position: relative;
		overflow: hidden;
		border-radius: 12px;
		padding: 12px 14px;
		transition: transform 0.15s, box-shadow 0.15s;

		&::before {
			content: "";
			position: absolute;
			left: 0;
			top: 0;
			width: 100%;
			height: 3px;
			background: currentColor;
			opacity: 0.55;
		}

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 16px rgba(31, 45, 61, 0.1);
		}

		.qi-head {
			display: flex;
			align-items: center;
			gap: 6px;
			margin-bottom: 6px;
		}

		.qi-ico {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 22px;
			height: 22px;
			flex: none;
			border-radius: 7px;
			font-size: 11px;
			color: #fff;
			background: linear-gradient(135deg, #b9bec7, #909399);
		}

		.qi-name {
			font-size: 13px;
			font-weight: 600;
		}

		.qi-ratio {
			margin-left: auto;
			font-size: 11px;
			line-height: 1;
			padding: 4px 8px;
			border-radius: 999px;
			background: rgba(255, 255, 255, 0.75);
			font-variant-numeric: tabular-nums;
		}

		.qi-count {
			font-size: 30px;
			font-weight: 700;
			font-variant-numeric: tabular-nums;
			line-height: 1.2;
		}

		.qi-rule {
			font-size: 11px;
			opacity: 0.75;
		}

		&.q-expert {
			background: linear-gradient(160deg, rgba(230, 162, 60, 0.16), rgba(230, 162, 60, 0.05));
			color: #b88230;

			.qi-ico {
				background: linear-gradient(135deg, #f2c46d, #e6a23c);
				box-shadow: 0 3px 8px rgba(230, 162, 60, 0.35);
			}
		}

		&.q-steady {
			background: linear-gradient(160deg, rgba(64, 158, 255, 0.16), rgba(64, 158, 255, 0.05));
			color: #337ecc;

			.qi-ico {
				background: linear-gradient(135deg, #74b3ff, #409eff);
				box-shadow: 0 3px 8px rgba(64, 158, 255, 0.35);
			}
		}

		&.q-aggressive {
			background: linear-gradient(160deg, rgba(245, 108, 108, 0.16), rgba(245, 108, 108, 0.05));
			color: #c45656;

			.qi-ico {
				background: linear-gradient(135deg, #f79b9b, #f56c6c);
				box-shadow: 0 3px 8px rgba(245, 108, 108, 0.35);
			}
		}

		&.q-improve {
			background: linear-gradient(160deg, rgba(144, 147, 153, 0.14), rgba(144, 147, 153, 0.04));
			color: var(--el-text-color-secondary);

			.qi-ico {
				box-shadow: 0 3px 8px rgba(144, 147, 153, 0.3);
			}
		}
	}

	// 响应式：窄屏降列
	@media (max-width: 1100px) {
		.bp-scores-card {
			.bp-scores-wrap {
				grid-template-columns: 1fr;
			}

			.bp-score-trend-wrap {
				margin-top: 2px;
			}
		}
	}
}

// ---------- 八维评分依据弹窗（雷达/得分窗口共用；el-dialog append-to-body 故置顶层） ----------
.basis-head {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding-bottom: 10px;
	border-bottom: 1px dashed #e6ebf7;

	.basis-std {
		font-size: 13px;
		font-weight: 600;
		color: #303133;
	}

	.basis-note {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}
}

.basis-list {
	display: flex;
	flex-direction: column;
	gap: 10px;
	max-height: 56vh;
	overflow-y: auto;
	padding: 12px 2px 4px;
}

.basis-row {
	border: 1px solid #eef0f6;
	border-radius: 12px;
	padding: 10px 12px;
	background: linear-gradient(180deg, #fbfcff 0%, #f7f9ff 100%);
}

.basis-row-head {
	display: flex;
	align-items: center;
	justify-content: space-between;

	.basis-name {
		font-size: 13px;
		font-weight: 600;
		color: #303133;
	}

	.basis-score {
		font-size: 13px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
}

.basis-formula {
	margin-top: 6px;
	font-size: 12px;
	line-height: 1.6;
	color: #5b637a;
}

.basis-foot {
	margin-top: 10px;
	font-size: 11px;
	color: #a7abba;
	line-height: 1.5;
}

@keyframes ai-pulse {
	0%,
	100% {
		opacity: 0.45;
		transform: scale(0.92);
	}

	50% {
		opacity: 1;
		transform: scale(1.06);
	}
}
</style>
