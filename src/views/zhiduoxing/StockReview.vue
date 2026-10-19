<template>
	<div class="stock-review">
		<!-- 页头（蓝紫渐变横幅，与交易画像一致） -->
		<div class="sr-head">
			<div class="sr-head-left">
				<span class="sr-head-badge"><font-awesome-icon fas icon="pen-to-square"></font-awesome-icon></span>
				<div class="sr-head-title">
					<div class="sr-title-row">
						<span class="sr-title">复盘中心</span>
						<span class="sr-style-chip"><font-awesome-icon fas icon="compass"></font-awesome-icon>假设 · 验证 · 统计分析闭环</span>
					</div>
					<span class="sr-sub">走势假设逐日验证 · 实盘目标分钟K达标判定 · 交易绩效画像沉淀</span>
				</div>
			</div>
			<div class="sr-head-right">
				<el-button size="small" class="sr-ghost-btn" :loading="listLoading || statsLoading" @click="refreshAll">
					<font-awesome-icon fas icon="rotate-right"></font-awesome-icon>&nbsp;刷新
				</el-button>
				<el-button size="small" class="sr-new-btn" @click="openCreate()">
					<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新建假设
				</el-button>
			</div>
		</div>

		<!-- 策略诊断带（常驻顶部：概览胶囊 + 改进方向 + 流派契合徽章 + 今日待办 + KPI 周趋势） -->
		<div class="sr-diag">
			<div class="sr-overview">
				<div v-for="card in overviewCards" :key="card.label" class="tkv">
					<span class="t-k">{{ card.label }}</span>
					<span class="t-v" :class="card.cls">{{ card.value }}</span>
				</div>
			</div>
			<ReviewDiagnosisPanel ref="diagPanelRef" :school-align="schoolAlign" @navigate="onDiagNavigate" @open-review="onTodoOpenReview" />
		</div>

		<!-- 六页签：流派契合 / 风格分析 / 交易记录 / 假设验证 / 实盘验证 / 统计分析 -->
		<div class="sr-tabs-wrap">
			<el-tabs v-model="activeTab" class="sr-tabs">
			<!-- ① 流派契合 -->
			<el-tab-pane name="school" lazy>
				<template #label>
					<span class="sr-tab-label"><font-awesome-icon fas icon="compass"></font-awesome-icon>流派契合</span>
				</template>
				<ReviewSchoolAlign ref="schoolAlignRef" :initial="schoolAlign" :range="globalRange" @updated="v => (schoolAlign = v)" />
			</el-tab-pane>

			<!-- ② 风格分析 -->
			<el-tab-pane name="style" lazy>
				<template #label>
					<span class="sr-tab-label"><font-awesome-icon fas icon="palette"></font-awesome-icon>风格分析</span>
				</template>
				<ReviewStyleBrief ref="styleBriefRef" :range="globalRange" />
			</el-tab-pane>

			<!-- ③ 交易记录：交易绩效 + 执行一致性 -->
			<el-tab-pane name="trade" lazy>
				<template #label>
					<span class="sr-tab-label"><font-awesome-icon fas icon="chart-pie"></font-awesome-icon>交易记录<span class="sr-tab-badge">{{ perf?.Core.TotalSold ?? 0 }}</span></span>
				</template>

		<!-- 交易绩效（五子卡：核心指标 / 盈亏分布 / 盈亏单 / 单笔盈亏比 / 归因分组） -->
		<div v-loading="perfLoading" class="sr-card">
			<div class="sr-card-title">
				<span class="sr-mini-ico tone-rose"><font-awesome-icon fas icon="chart-pie"></font-awesome-icon></span><span class="sr-title-text">交易绩效</span>
				<span class="sr-title-note">样本：已了结 {{ perf?.SampleSize ?? 0 }} 笔 · 随全局时间线筛选{{ perf && !perf.SampleEnough ? '（样本不足 10 笔，仅供参考）' : '' }}</span>
			</div>

			<!-- 卡1 核心指标（大数字横排） -->
			<div class="pf-hero">
				<div class="pf-hero-cell">
					<span class="pf-h-label">净盈亏</span>
					<span class="pf-h-value" :class="toneCls(perf?.Core.RealizedProfit)">{{ perf ? fmtAmount(perf.Core.RealizedProfit, true) : '--' }}</span>
					<span class="pf-h-sub">元 · 已了结 {{ perf?.Core.TotalSold ?? 0 }} 笔（盈 {{ perf?.Core.WinCount ?? 0 }} / 亏 {{ perf?.Core.LossCount ?? 0 }}）</span>
				</div>
				<div class="pf-hero-cell">
					<span class="pf-h-label">卖出胜率</span>
					<span class="pf-h-value">{{ perf?.Core.WinRate != null ? perf.Core.WinRate + '%' : '--' }}</span>
					<span class="pf-h-sub">盈利笔 ÷ 已了结笔</span>
				</div>
				<div class="pf-hero-cell">
					<span class="pf-h-label">盈亏比</span>
					<span class="pf-h-value">{{ perf?.Core.ProfitLossRatio != null ? Number(perf.Core.ProfitLossRatio).toFixed(2) : '--' }}</span>
					<span class="pf-h-sub">平均盈利 ÷ 平均亏损</span>
				</div>
				<div class="pf-hero-cell">
					<span class="pf-h-label">期望值</span>
					<span class="pf-h-value" :class="toneCls(perf?.Core.Expectancy)">{{ perf?.Core.Expectancy != null ? fmtAmount(perf.Core.Expectancy, true) : '--' }}</span>
					<span class="pf-h-sub">元 / 笔</span>
				</div>
				<div class="pf-hero-cell">
					<span class="pf-h-label">持仓浮动盈亏</span>
					<span class="pf-h-value" :class="toneCls(perf?.Core.FloatingProfit)">{{ perf ? fmtAmount(perf.Core.FloatingProfit, true) : '--' }}</span>
					<span class="pf-h-sub">元 · 未了结持仓按最新收盘估</span>
				</div>
			</div>

			<div class="pf-grid">
				<!-- 卡2 盈亏分布 -->
				<div class="pf-panel">
					<div class="pf-panel-title">盈亏分布<span class="pf-panel-note">单位：元</span></div>
					<div class="pf-metrics">
						<div class="pf-metric"><span class="pf-m-label">平均盈利</span><span class="pf-m-value up">{{ fmtAmount(perf?.Distribution.AvgProfit) }}</span></div>
						<div class="pf-metric"><span class="pf-m-label">平均亏损</span><span class="pf-m-value down">{{ fmtAmount(perf?.Distribution.AvgLoss) }}</span></div>
						<div class="pf-metric"><span class="pf-m-label">最大盈利</span><span class="pf-m-value up">{{ fmtAmount(perf?.Distribution.MaxProfit) }}</span></div>
						<div class="pf-metric"><span class="pf-m-label">最大亏损</span><span class="pf-m-value down">{{ fmtAmount(perf?.Distribution.MaxLoss) }}</span></div>
						<div class="pf-metric"><span class="pf-m-label">盈利中位数</span><span class="pf-m-value">{{ fmtAmount(perf?.Distribution.MedianProfit) }}</span></div>
						<div class="pf-metric"><span class="pf-m-label">亏损中位数</span><span class="pf-m-value">{{ fmtAmount(perf?.Distribution.MedianLoss) }}</span></div>
					</div>
					<div class="pf-bar">
						<span class="pf-bar-win" :style="{ width: perfBarWin }"></span>
						<span class="pf-bar-loss" :style="{ width: perfBarLoss }"></span>
					</div>
					<div class="pf-bar-legend">
						<span class="up">总盈利 {{ fmtAmount(perf?.Distribution.TotalProfit) }}</span>
						<span class="down">总亏损 {{ fmtAmount(perf?.Distribution.TotalLoss) }}</span>
					</div>
				</div>

				<!-- 卡4 单笔盈亏比排序（升序 TOP10） -->
				<div class="pf-panel">
					<div class="pf-panel-title">单笔盈亏比<span class="pf-panel-note">实际盈亏 ÷ 最大浮亏额 · 升序（越低越需优化止损）</span></div>
					<el-table :data="perf?.RatioRanking ?? []" size="small" max-height="300">
						<el-table-column label="股票" min-width="120">
							<template #default="{ row }">
								<div class="tk-stock">
									<div class="tk-stock-top">
										<span class="tk-name">{{ row.StockName || '--' }}</span>
									</div>
									<span class="tk-code">{{ row.StockCode }}</span>
								</div>
							</template>
						</el-table-column>
						<el-table-column label="实际盈亏" width="104" align="right">
							<template #default="{ row }">
								<span class="lk-pct" :class="toneCls(row.ActualProfit)">{{ fmtAmount(row.ActualProfit, true) }}</span>
							</template>
						</el-table-column>
						<el-table-column label="最大浮亏额" width="104" align="right">
							<template #default="{ row }">
								<span class="lk-num">{{ fmtAmount(row.MaxDrawdownAmount) }}</span>
							</template>
						</el-table-column>
						<el-table-column label="盈亏比" width="86" align="right">
							<template #default="{ row }">
								<b class="pf-ratio" :class="(row.Ratio ?? 0) >= 1 ? 'up' : 'down'">{{ row.Ratio != null ? Number(row.Ratio).toFixed(2) : '--' }}</b>
							</template>
						</el-table-column>
						<template #empty>
							<el-empty description="暂无可统计样本" :image-size="60"></el-empty>
						</template>
					</el-table>
				</div>

				<!-- 卡3 盈利单 TOP10 -->
				<div class="pf-panel">
					<div class="pf-panel-title">盈利单 TOP10<span class="pf-panel-note">按实际盈亏降序</span></div>
					<el-table :data="perf?.ProfitTrades ?? []" size="small" max-height="320">
						<el-table-column label="股票" min-width="120">
							<template #default="{ row }">
								<div class="tk-stock">
									<div class="tk-stock-top">
										<span class="tk-name">{{ row.StockName || '--' }}</span>
									</div>
									<span class="tk-code">{{ row.StockCode }}</span>
								</div>
							</template>
						</el-table-column>
						<el-table-column label="卖出时间" width="102">
							<template #default="{ row }">
								<span class="tk-time">{{ fmtTime(row.SellTime, 'MM-DD HH:mm') }}</span>
							</template>
						</el-table-column>
						<el-table-column label="收益率" width="90" align="right">
							<template #default="{ row }">
								<span class="lk-pct" :class="toneCls(row.ActualReturn)">{{ fmtPct(row.ActualReturn) }}</span>
							</template>
						</el-table-column>
						<el-table-column label="盈亏（元）" width="104" align="right">
							<template #default="{ row }">
								<b class="lk-pct up">{{ fmtAmount(row.ActualProfit, true) }}</b>
							</template>
						</el-table-column>
						<template #empty>
							<el-empty description="暂无盈利单" :image-size="60"></el-empty>
						</template>
					</el-table>
				</div>

				<!-- 卡3 亏损单 TOP10 -->
				<div class="pf-panel">
					<div class="pf-panel-title">亏损单 TOP10<span class="pf-panel-note">按实际盈亏升序</span></div>
					<el-table :data="perf?.LossTrades ?? []" size="small" max-height="320">
						<el-table-column label="股票" min-width="120">
							<template #default="{ row }">
								<div class="tk-stock">
									<div class="tk-stock-top">
										<span class="tk-name">{{ row.StockName || '--' }}</span>
									</div>
									<span class="tk-code">{{ row.StockCode }}</span>
								</div>
							</template>
						</el-table-column>
						<el-table-column label="卖出时间" width="102">
							<template #default="{ row }">
								<span class="tk-time">{{ fmtTime(row.SellTime, 'MM-DD HH:mm') }}</span>
							</template>
						</el-table-column>
						<el-table-column label="收益率" width="90" align="right">
							<template #default="{ row }">
								<span class="lk-pct" :class="toneCls(row.ActualReturn)">{{ fmtPct(row.ActualReturn) }}</span>
							</template>
						</el-table-column>
						<el-table-column label="盈亏（元）" width="104" align="right">
							<template #default="{ row }">
								<b class="lk-pct down">{{ fmtAmount(row.ActualProfit, true) }}</b>
							</template>
						</el-table-column>
						<template #empty>
							<el-empty description="暂无亏损单" :image-size="60"></el-empty>
						</template>
					</el-table>
				</div>

				<!-- 卡5 归因分组（全宽） -->
				<div class="pf-panel pf-span2">
					<div class="pf-panel-title">归因分析
						<el-radio-group v-model="attrDim" size="small" class="pf-attr-switch">
							<el-radio-button value="ByHitStatus">目标达标</el-radio-button>
							<el-radio-button value="ByHoldingPeriod">持有周期</el-radio-button>
							<el-radio-button value="ByStock">股票</el-radio-button>
							<el-radio-button value="ByTradeTime">买卖时段</el-radio-button>
						</el-radio-group>
					</div>
					<el-table :data="attrRows" size="small" max-height="320">
						<el-table-column label="分组" prop="GroupName" min-width="130"></el-table-column>
						<el-table-column label="笔数" width="72" align="center">
							<template #default="{ row }">{{ row.Count }}</template>
						</el-table-column>
						<el-table-column label="胜率" width="90" align="center">
							<template #default="{ row }">{{ row.WinRate != null ? row.WinRate + '%' : '--' }}</template>
						</el-table-column>
						<el-table-column label="盈亏比" width="90" align="center">
							<template #default="{ row }">{{ row.ProfitLossRatio != null ? Number(row.ProfitLossRatio).toFixed(2) : '--' }}</template>
						</el-table-column>
						<el-table-column label="期望值" width="100" align="right">
							<template #default="{ row }">
								<span class="lk-pct" :class="toneCls(row.Expectancy)">{{ row.Expectancy != null ? fmtAmount(row.Expectancy, true) : '--' }}</span>
							</template>
						</el-table-column>
						<el-table-column label="总盈亏" width="110" align="right">
							<template #default="{ row }">
								<span class="lk-pct" :class="toneCls(row.TotalProfit)">{{ fmtAmount(row.TotalProfit, true) }}</span>
							</template>
						</el-table-column>
						<template #empty>
							<el-empty description="暂无可统计样本" :image-size="60"></el-empty>
						</template>
					</el-table>
				</div>
			</div>
		</div>

			<!-- 执行一致性（已判定假设 × 假设期间实盘动作逐行对照） -->
			<div class="sr-card">
				<div class="sr-card-title">
					<span class="sr-mini-ico tone-violet"><font-awesome-icon fas icon="link"></font-awesome-icon></span><span class="sr-title-text">执行一致性</span>
					<span class="sr-title-note">已判定假设 × 假设期间实盘动作 · 判断力与执行力同一行对照</span>
				</div>
				<ExecutionConsistencyTable ref="execTableRef" :range="globalRange" />
			</div>
			</el-tab-pane>

			<!-- ④ 假设验证：假设台账 + 长线目标台账 -->
			<el-tab-pane name="forecast" lazy>
				<template #label>
					<span class="sr-tab-label"><font-awesome-icon fas icon="list-check"></font-awesome-icon>假设验证<span class="sr-tab-badge">{{ centerRangeCount }}</span></span>
				</template>

		<!-- 假设台账 -->
		<div class="sr-card">
			<div class="sr-card-title">
				<span class="sr-mini-ico tone-violet"><font-awesome-icon fas icon="list-check"></font-awesome-icon></span><span class="sr-title-text">假设台账</span>
				<ForecastScoreRules />
				<span class="sr-title-note">共 {{ filteredList.length }} 条假设 · 同股进行中再次保存将覆盖</span>
			</div>
			<div class="sr-filter">
				<el-select v-model="filterStatus" size="small" placeholder="全部状态" style="width: 118px">
					<el-option label="全部状态" value=""></el-option>
					<el-option label="进行中" :value="1"></el-option>
					<el-option label="已判定" :value="2"></el-option>
				</el-select>
				<el-select v-model="filterSource" size="small" placeholder="全部来源" style="width: 128px">
					<el-option label="全部来源" value=""></el-option>
					<el-option label="画图路径" :value="1"></el-option>
					<el-option label="表单快捷" :value="2"></el-option>
				</el-select>
				<el-select v-model="filterBasis" size="small" placeholder="全部口径" style="width: 200px">
					<el-option label="全部口径" :value="0"></el-option>
					<el-option label="日内最高价（超短线/打板）" :value="2"></el-option>
					<el-option label="收盘价（其他流派）" :value="1"></el-option>
				</el-select>
				<el-input v-model="filterKeyword" size="small" placeholder="股票名称 / 代码" clearable style="width: 190px"></el-input>
				<span class="sr-tip-inline">时间范围随全局时间线筛选 · 历史 = 今年之前</span>
			</div>
			<!-- 平均分走势（已判定假设按判定日聚合；随全局时间线联动） -->
			<div class="sr-score-wrap">
				<div class="sr-score-head">
					<span class="sr-mini-ico tone-violet"><font-awesome-icon fas icon="chart-line"></font-awesome-icon></span><span class="sr-title-text">平均分走势</span>
					<span class="sr-title-note">已判定假设按判定日平均分 · 点位超 60 按周聚合 · 随全局时间线联动</span>
				</div>
				<div v-if="scoreTrend.length" ref="scoreChartRef" class="chart-box sr-score-chart"></div>
				<el-empty v-else description="暂无已判定假设，验证后自动生成" :image-size="60"></el-empty>
			</div>
			<el-table v-loading="listLoading" :data="filteredList" size="small" class="sr-table" max-height="620">
				<el-table-column label="股票" width="170">
					<template #default="{ row }">
						<div class="tk-stock">
							<div class="tk-stock-top">
								<span class="tk-name">{{ row.StockName || '--' }}</span>
								<el-tag v-if="row.IsHeldWhenCreated" size="small" type="warning" effect="plain">持仓</el-tag>
							</div>
							<span class="tk-code">{{ row.StockCode }}</span>
						</div>
					</template>
				</el-table-column>
				<el-table-column label="假设摘要" min-width="260">
					<template #default="{ row }">
						<div class="tk-sum">
							<div class="tk-sum-top">
								<el-tag size="small" :type="directionTag(row)" effect="plain">{{ directionLabel(row) }}</el-tag>
								<span class="tk-path">{{ pathText(row) }}</span>
							</div>
							<div v-if="row.Reason" class="tk-reason" :title="row.Reason">{{ row.Reason }}</div>
						</div>
					</template>
				</el-table-column>
				<el-table-column label="来源 / 类型" width="150">
					<template #default="{ row }">
						<div class="tk-tags">
							<el-tag size="small" type="info" effect="plain">{{ zdxSources[row.Source] ?? '画图路径' }}</el-tag>
							<el-tag v-if="row.HypothesisType" size="small" effect="plain">{{ zdxTypes[row.HypothesisType] }}</el-tag>
						</div>
					</template>
				</el-table-column>
				<el-table-column label="期限" width="196">
					<template #default="{ row }">
						<span class="tk-range">{{ fmtTime(row.StartDate, 'YYYY-MM-DD') }} ~ {{ fmtTime(row.EndDate, 'YYYY-MM-DD') }}</span>
					</template>
				</el-table-column>
				<el-table-column label="状态 / 判定" min-width="200">
					<template #default="{ row }">
						<div v-if="row.Status === 1" class="tk-status">
							<el-tag size="small" type="primary" effect="plain">进行中</el-tag>
							<span class="tk-wait">{{ forecastWaitText(row) }}</span>
						</div>
						<div v-else class="tk-status">
							<el-tag size="small" :type="gradeTag(row.Score)" effect="plain">{{ gradeLabel(row.Score) }}</el-tag>
							<el-tooltip placement="top" popper-class="sr-tip-pop" :show-after="150">
								<template #content>
									<div class="stp-list">
										<div v-for="(line, i) in scoreDeductItems(row)" :key="i" class="stp-line">{{ line }}</div>
									</div>
								</template>
								<span class="tk-score">{{ fmtScore(row.Score) }} 分</span>
							</el-tooltip>
							<div class="tk-verdicts">
								<span :class="row.HitDirection ? 'up' : 'down'">方向{{ row.HitDirection ? '命中' : '未中' }}<el-tooltip :disabled="forecastDirectionScore(row.HitDirection) > 0" placement="top" popper-class="sr-tip-pop" :show-after="150" :content="dimReason(row, 'dir')"><b class="tk-pt" :class="{ 'is-zero': !forecastDirectionScore(row.HitDirection) }">+{{ forecastDirectionScore(row.HitDirection) }}</b></el-tooltip></span>
								<span>幅度{{ amplitudeText(row.AmplitudeClass) }}<el-tooltip :disabled="forecastAmplitudeScore(row.AmplitudeClass) > 0" placement="top" popper-class="sr-tip-pop" :show-after="150" :content="dimReason(row, 'amp')"><b class="tk-pt" :class="{ 'is-zero': !forecastAmplitudeScore(row.AmplitudeClass) }">+{{ forecastAmplitudeScore(row.AmplitudeClass) }}</b></el-tooltip></span>
								<span>路径{{ pathClassText(row.PathClass) }}<el-tooltip :disabled="forecastPathScore(row.PathClass) > 0" placement="top" popper-class="sr-tip-pop" :show-after="150" :content="dimReason(row, 'path')"><b class="tk-pt" :class="{ 'is-zero': !forecastPathScore(row.PathClass) }">+{{ forecastPathScore(row.PathClass) }}</b></el-tooltip></span>
							</div>
						</div>
					</template>
				</el-table-column>
				<el-table-column label="创建时间" width="140">
					<template #default="{ row }">
						<span class="tk-time">{{ fmtTime(row.CreateTime, 'MM-DD HH:mm') }}</span>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="88" fixed="right" align="center">
					<template #default="{ row }">
						<el-dropdown trigger="click" placement="bottom-end" @command="onRowCommand($event, row)">
							<el-button size="small" text type="primary" class="tk-act-btn">
								操作<font-awesome-icon fas icon="angle-down" class="tk-caret"></font-awesome-icon>
							</el-button>
							<template #dropdown>
								<el-dropdown-menu>
									<el-dropdown-item command="detail">详情</el-dropdown-item>
									<el-dropdown-item command="redraw">重画</el-dropdown-item>
									<el-dropdown-item command="delete" divided>删除</el-dropdown-item>
								</el-dropdown-menu>
							</template>
						</el-dropdown>
					</template>
				</el-table-column>
				<template #empty>
					<el-empty description="暂无假设，点击右上角“新建假设”开始你的第一条预判" :image-size="80"></el-empty>
				</template>
			</el-table>
		</div>

		<!-- 长线目标台账（里程碑式：N 个交易日内到达目标收盘价；收盘价口径自动判定） -->
		<div class="sr-card">
			<div class="sr-card-title">
				<span class="sr-mini-ico tone-teal"><font-awesome-icon fas icon="bullseye"></font-awesome-icon></span><span class="sr-title-text">长线目标台账</span>
				<span class="sr-title-note">共 {{ longFilteredList.length }} 条 · 已达成 {{ longHitCount }} · 进行中 {{ longActiveCount }} · 未达成 {{ longMissCount }} · 随全局时间线筛选 · 交易日口径（不复权收盘价自动判定）</span>
				<el-button size="small" class="lk-add-btn" @click="openLongCreate">
					<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新建目标
				</el-button>
			</div>
			<el-table v-loading="longLoading" :data="longFilteredList" size="small" max-height="420">
				<el-table-column label="股票" width="160">
					<template #default="{ row }">
						<div class="tk-stock">
							<div class="tk-stock-top">
								<span class="tk-name">{{ row.StockName || '--' }}</span>
							</div>
							<span class="tk-code">{{ row.StockCode }}</span>
						</div>
					</template>
				</el-table-column>
				<el-table-column label="验证状态" width="86" align="center">
					<template #default="{ row }">
						<el-tag size="small" :type="longStatusType(row.Status)" effect="plain">{{ ZDX_FORECAST_LONG_STATUSES[row.Status] ?? '--' }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="目标期限" width="150" align="center">
					<template #default="{ row }">
						<span class="lk-days">{{ longDeadlineText(row) }}</span>
					</template>
				</el-table-column>
				<el-table-column label="起点（收盘）" width="170">
					<template #default="{ row }">
						<span class="tk-range">{{ Number(row.BasePrice).toFixed(2) }}（{{ fmtTime(row.StartDate, 'YYYY-MM-DD') }}）</span>
					</template>
				</el-table-column>
				<el-table-column label="目标价" width="100" align="right">
					<template #default="{ row }">
						<b class="lk-target">{{ Number(row.TargetPrice).toFixed(2) }} 元</b>
					</template>
				</el-table-column>
				<el-table-column label="目标涨幅" width="96" align="right">
					<template #default="{ row }">
						<span class="lk-pct up">{{ (longPct(row) > 0 ? '+' : '') + longPct(row).toFixed(2) + '%' }}</span>
					</template>
				</el-table-column>
				<el-table-column label="最新收盘" width="122" align="right">
					<template #default="{ row }">
						<div v-if="row.LastClose !== null && row.LastClose !== undefined" class="lv-double lv-right">
							<span class="lv-line">{{ Number(row.LastClose).toFixed(2) }}</span>
							<span class="lv-sub">{{ fmtTime(row.LastCloseDate, 'MM-DD') }}</span>
						</div>
						<span v-else class="muted">--</span>
					</template>
				</el-table-column>
				<el-table-column label="当前涨幅" width="92" align="right">
					<template #default="{ row }">
						<span class="lk-pct" :class="toneCls(row.CurrentPct)">{{ fmtPct(row.CurrentPct) }}</span>
					</template>
				</el-table-column>
				<el-table-column label="验证结果" width="168">
					<template #default="{ row }">
						<span v-if="row.Status === 2" class="lv-ok">{{ longVerdictText(row) }}</span>
						<span v-else-if="row.Status === 3" class="lv-bad">{{ longVerdictText(row) }}</span>
						<span v-else class="muted">{{ longVerdictText(row) }}</span>
					</template>
				</el-table-column>
				<el-table-column label="更新时间" width="146">
					<template #default="{ row }">
						<span class="tk-time">{{ fmtTime(row.UpdateTime, 'YYYY-MM-DD HH:mm') }}</span>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="72" fixed="right" align="center">
					<template #default="{ row }">
						<el-button size="small" text type="danger" @click="onDeleteLong(row)">删除</el-button>
					</template>
				</el-table-column>
				<template #empty>
					<el-empty description="暂无长线目标，点击右上角“新建目标”登记中长线里程碑" :image-size="80"></el-empty>
				</template>
			</el-table>
		</div>

		</el-tab-pane>

		<!-- ⑤ 实盘验证：实盘目标台账 + 预测 vs 实盘对比 -->
		<el-tab-pane name="live" lazy>
			<template #label>
				<span class="sr-tab-label"><font-awesome-icon fas icon="money-check-dollar"></font-awesome-icon>实盘验证<span class="sr-tab-badge">{{ liveRangeFiltered.length }}</span></span>
			</template>

		<!-- 实盘目标台账（验证视图：达标状态 / 实际收益 / 最大浮盈浮亏 / 预测偏差） -->
		<div class="sr-card">
			<div class="sr-card-title">
				<span class="sr-mini-ico tone-orange"><font-awesome-icon fas icon="money-check-dollar"></font-awesome-icon></span><span class="sr-title-text">实盘目标台账</span>
				<span class="sr-title-note">共 {{ liveRangeFiltered.length }} 笔 · 随全局时间线筛选 · 达标判定：分钟K优先（盘中触达目标价）· 日K兜底（收盘价判定）</span>
			</div>
			<div class="sr-filter">
				<el-select v-model="liveFilterStatus" size="small" placeholder="全部状态" style="width: 130px">
					<el-option label="全部状态" value=""></el-option>
					<el-option v-for="(label, value) in ZDX_LIVE_TARGET_STATUSES" :key="value" :label="label" :value="Number(value)"></el-option>
				</el-select>
				<el-input v-model="liveFilterKeyword" size="small" placeholder="股票名称 / 代码" clearable style="width: 190px"></el-input>
				<span class="sr-tip-inline">达标判定：分钟K优先（盘中触达目标价）· 日K兜底（收盘价判定）</span>
			</div>
			<!-- 结果统计（随全局时间线联动）：达标率 = 达标 ÷（达标+未达标）；胜率与平均收益基于已了结 -->
			<div class="lv-stats">
				<div class="lv-stat"><span class="lv-s-label">总笔数</span><span class="lv-s-value">{{ liveRangeFiltered.length }}</span></div>
				<div class="lv-stat"><span class="lv-s-label">进行中</span><span class="lv-s-value">{{ liveRunningCount }}</span></div>
				<div class="lv-stat"><span class="lv-s-label">达标</span><span class="lv-s-value v-red">{{ liveHitCount }}</span></div>
				<div class="lv-stat"><span class="lv-s-label">未达标</span><span class="lv-s-value v-green">{{ liveMissCount }}</span></div>
				<div class="lv-stat"><span class="lv-s-label">达标率</span><span class="lv-s-value">{{ liveJudgedCount > 0 ? liveHitRate + '%' : '--' }}</span></div>
				<div class="lv-stat"><span class="lv-s-label">已了结</span><span class="lv-s-value">{{ liveSettledCount }}</span></div>
				<div class="lv-stat"><span class="lv-s-label">胜率</span><span class="lv-s-value">{{ liveSettledCount > 0 ? liveWinRate + '%' : '--' }}</span></div>
				<div class="lv-stat"><span class="lv-s-label">净盈亏</span><span class="lv-s-value" :class="toneCls(liveRealizedSum)">{{ fmtAmount(liveRealizedSum, true) }} 元</span></div>
				<div class="lv-stat"><span class="lv-s-label">平均收益</span><span class="lv-s-value" :class="toneCls(liveAvgProfit)">{{ liveSettledCount > 0 ? fmtAmount(liveAvgProfit, true) + ' 元' : '--' }}</span></div>
			</div>
			<el-table v-loading="liveLoading" :data="liveFilteredList" size="small" max-height="560">
				<el-table-column label="复盘日" width="102">
					<template #default="{ row }">
						<span class="tk-time">{{ fmtTime(row.ReviewDate, 'YYYY-MM-DD') }}</span>
					</template>
				</el-table-column>
				<el-table-column label="股票" width="150">
					<template #default="{ row }">
						<div class="tk-stock">
							<div class="tk-stock-top">
								<span class="tk-name">{{ row.StockName || '--' }}</span>
							</div>
							<span class="tk-code">{{ row.StockCode }}</span>
						</div>
					</template>
				</el-table-column>
				<el-table-column label="方向" width="64" align="center">
					<template #default="{ row }">
						<el-tag size="small" :type="row.Direction === 1 ? 'danger' : 'success'" effect="plain">{{ row.Direction === 1 ? '买入' : '卖出' }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="成本 / 目标" width="160">
					<template #default="{ row }">
						<div class="lv-double">
							<span class="lv-line">成本 {{ Number(row.BasePrice).toFixed(3) }}</span>
							<span class="lv-line">目标 <b class="lk-target">{{ Number(row.TargetPrice).toFixed(2) }}</b> <span class="lk-pct up">{{ fmtPct(row.TargetPct) }}</span></span>
						</div>
					</template>
				</el-table-column>
				<el-table-column label="期限 / 截止" width="150">
					<template #default="{ row }">
						<span class="lk-days">{{ liveDeadlineText(row) }}</span>
					</template>
				</el-table-column>
				<el-table-column label="验证状态" width="118">
					<template #default="{ row }">
						<div class="lv-status">
							<el-tag size="small" :type="liveStatusType(row.Status)" effect="plain">{{ ZDX_LIVE_TARGET_STATUSES[row.Status] ?? '--' }}</el-tag>
							<span v-if="liveHitDuration(row)" class="lv-sub">用时 {{ liveHitDuration(row) }}</span>
							<span v-else-if="row.Status === 1 && klinePendingText(row.DeadlineDate)" class="lv-sub">{{ klinePendingText(row.DeadlineDate) }}</span>
						</div>
					</template>
				</el-table-column>
				<el-table-column label="实际收益" width="112" align="right">
					<template #default="{ row }">
						<div v-if="row.ActualReturn !== null && row.ActualReturn !== undefined" class="lv-double lv-right">
							<span class="lk-pct" :class="toneCls(row.ActualReturn)">{{ fmtPct(row.ActualReturn) }}</span>
							<span class="lv-sub" :class="toneCls(row.ActualProfit)">{{ fmtAmount(row.ActualProfit, true) }}</span>
						</div>
						<span v-else class="muted">--</span>
					</template>
				</el-table-column>
				<el-table-column label="浮盈 / 浮亏" width="124" align="right">
					<template #default="{ row }">
						<div class="lv-double lv-right">
							<span class="lk-pct" :class="(row.MaxProfit ?? 0) > 0 ? 'up' : ''">{{ row.MaxProfit !== null && row.MaxProfit !== undefined ? fmtPct(row.MaxProfit) : '--' }}</span>
							<span class="lk-pct" :class="(row.MaxDrawdown ?? 0) < 0 ? 'down' : ''">{{ row.MaxDrawdown !== null && row.MaxDrawdown !== undefined ? fmtPct(row.MaxDrawdown) : '--' }}</span>
						</div>
					</template>
				</el-table-column>
				<el-table-column label="预测偏差" width="100" align="right">
					<template #default="{ row }">
						<span class="lk-pct" :class="toneCls(row.Deviation)">{{ fmtPct(row.Deviation) }}</span>
					</template>
				</el-table-column>
				<el-table-column label="操作说明" min-width="150">
					<template #default="{ row }">
						<div v-if="row.Note" class="tk-reason" :title="row.Note">{{ row.Note }}</div>
						<span v-else class="muted">--</span>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="72" fixed="right" align="center">
					<template #default="{ row }">
						<el-button size="small" text type="primary" @click="openLiveDetail(row)">详情</el-button>
					</template>
				</el-table-column>
				<template #empty>
					<el-empty description="暂无实盘目标：在个股复盘抽屉内对买卖操作填写“最低盈利预测”后自动汇总" :image-size="80"></el-empty>
				</template>
			</el-table>
		</div>

		<!-- 预测 vs 实盘对比（判断力 vs 执行力） -->
		<div class="sr-card">
			<div class="sr-card-title">
				<span class="sr-mini-ico tone-teal"><font-awesome-icon fas icon="scale-balanced"></font-awesome-icon></span><span class="sr-title-text">预测 vs 实盘</span>
				<span class="sr-title-note">假设侧已判定 {{ vsLive?.ForecastVerified ?? 0 }} 条 · 实盘侧已了结 {{ vsLive?.LiveSample ?? 0 }} 笔</span>
			</div>
			<div class="vs-grid">
				<el-table :data="vsLive?.Rows ?? []" size="small" class="vs-table">
					<el-table-column label="指标" prop="Metric" min-width="150"></el-table-column>
					<el-table-column label="假设侧（判断力）" width="160" align="center">
						<template #default="{ row }">
							<span class="vs-val">{{ row.Forecast }}</span>
						</template>
					</el-table-column>
					<el-table-column label="实盘侧（执行力）" width="160" align="center">
						<template #default="{ row }">
							<span class="vs-val">{{ row.Live }}</span>
						</template>
					</el-table-column>
					<el-table-column label="差异" width="110" align="center">
						<template #default="{ row }">
							<span v-if="row.Diff !== null && row.Diff !== undefined" class="lk-pct" :class="row.DiffTone === 1 ? 'up' : row.DiffTone === -1 ? 'down' : ''">{{ fmtPct(row.Diff) }}</span>
							<span v-else class="muted">--</span>
						</template>
					</el-table-column>
					<template #empty>
						<el-empty description="暂无对比数据：产生已判定假设与已了结实盘目标后自动生成" :image-size="70"></el-empty>
					</template>
				</el-table>
				<div v-if="vsLive?.Insights?.length" class="vs-insights">
					<div class="vs-insights-title"><font-awesome-icon fas icon="lightbulb"></font-awesome-icon>&nbsp;智能提示</div>
					<div v-for="(tip, idx) in vsLive.Insights" :key="idx" class="vs-tip">{{ tip }}</div>
				</div>
			</div>
		</div>

		</el-tab-pane>

		<!-- ⑥ 统计分析 -->
		<el-tab-pane name="stats" lazy>
			<template #label>
				<span class="sr-tab-label"><font-awesome-icon fas icon="chart-column"></font-awesome-icon>统计分析</span>
			</template>

		<!-- 统计分析（时间条件随全局时间线；月度趋势 / 滚动校准 / 分组对比 / 股票排行） -->
		<div v-loading="statsLoading" class="sr-stats-grid">
			<div class="sr-card">
				<div class="sr-card-title">
					<span class="sr-mini-ico tone-blue"><font-awesome-icon fas icon="chart-column"></font-awesome-icon></span><span class="sr-title-text">月度趋势</span>
					<span class="sr-title-note">柱 = 判定数 · 线 = 方向命中率</span>
				</div>
				<div v-if="stats?.Trend?.length" ref="trendChartRef" class="chart-box"></div>
				<el-empty v-else description="暂无已判定假设，验证后自动生成" :image-size="70"></el-empty>
			</div>
			<div class="sr-card">
				<div class="sr-card-title">
					<span class="sr-mini-ico tone-rose"><font-awesome-icon fas icon="chart-line"></font-awesome-icon></span><span class="sr-title-text">滚动校准</span>
					<span class="sr-title-note">近 {{ calibrationWindow }} 条判定窗口 · 折线 = 滚动命中率 / 平均分</span>
				</div>
				<div v-if="stats?.Calibration?.length" ref="calibChartRef" class="chart-box"></div>
				<el-empty v-else description="暂无已判定假设，验证后自动生成" :image-size="70"></el-empty>
			</div>
			<div class="sr-card">
				<div class="sr-card-title">
					<span class="sr-mini-ico tone-teal"><font-awesome-icon fas icon="layer-group"></font-awesome-icon></span><span class="sr-title-text">分组对比</span>
					<el-radio-group v-model="groupDim" size="small" class="gr-switch">
						<el-radio-button value="BySource">来源</el-radio-button>
						<el-radio-button value="ByType">类型</el-radio-button>
						<el-radio-button value="ByHeld">持仓</el-radio-button>
						<el-radio-button value="ByTerm">期限</el-radio-button>
						<el-radio-button value="ByDirection">方向</el-radio-button>
					</el-radio-group>
				</div>
				<el-table :data="groupRows" size="small" max-height="360">
					<el-table-column label="分组" prop="Label" min-width="140"></el-table-column>
					<el-table-column label="判定数" width="90" align="center">
						<template #default="{ row }">{{ row.Verified }}</template>
					</el-table-column>
					<el-table-column label="方向命中率" width="120" align="center">
						<template #default="{ row }">
							<span v-if="row.Verified > 0">{{ row.HitRate }}%</span>
							<span v-else class="muted">--</span>
						</template>
					</el-table-column>
					<el-table-column label="平均分" width="100" align="center">
						<template #default="{ row }">
							<span v-if="row.Verified > 0">{{ row.AvgScore }}</span>
							<span v-else class="muted">--</span>
						</template>
					</el-table-column>
				</el-table>
			</div>
			<div class="sr-card">
				<div class="sr-card-title">
					<span class="sr-mini-ico tone-orange"><font-awesome-icon fas icon="ranking-star"></font-awesome-icon></span><span class="sr-title-text">股票排行</span>
					<span class="sr-title-note">已判定假设按股票平均分 TOP20</span>
				</div>
				<el-table :data="stats?.Ranking ?? []" size="small" max-height="360">
					<el-table-column label="#" width="46" align="center">
						<template #default="{ $index }">
							<span class="rk-no" :class="rankCls($index)">{{ $index + 1 }}</span>
						</template>
					</el-table-column>
					<el-table-column label="股票" min-width="132">
						<template #default="{ row }">
							<div class="tk-stock">
								<div class="tk-stock-top">
									<span class="tk-name">{{ row.StockName || '--' }}</span>
								</div>
								<span class="tk-code">{{ row.StockCode }}</span>
							</div>
						</template>
					</el-table-column>
					<el-table-column label="假设" width="70" align="center">
						<template #default="{ row }">{{ row.Total }}</template>
					</el-table-column>
					<el-table-column label="已判定" width="80" align="center">
						<template #default="{ row }">{{ row.Verified }}</template>
					</el-table-column>
					<el-table-column label="方向命中率" width="110" align="center">
						<template #default="{ row }">
							<span class="rk-rate" :class="rateCls(row.HitRate)"><i class="rk-dot"></i>{{ row.HitRate }}%</span>
						</template>
					</el-table-column>
					<el-table-column label="平均分" width="90" align="center">
						<template #default="{ row }">
							<b class="rk-score" :class="scoreCls(row.AvgScore)">{{ row.AvgScore }}</b>
						</template>
					</el-table-column>
				</el-table>
			</div>
		</div>

		</el-tab-pane>
			</el-tabs>

			<!-- 时间线档位（悬浮于页签栏右侧；统一下方六页签口径：历史=今年之前，近N=自然日） -->
			<div class="sr-tl">
				<el-radio-group v-model="globalRange" size="small">
					<el-radio-button value="all">全部</el-radio-button>
					<el-radio-button value="history">历史</el-radio-button>
					<el-radio-button value="20">近20天</el-radio-button>
					<el-radio-button value="60">近60天</el-radio-button>
					<el-radio-button value="120">近120天</el-radio-button>
					<el-radio-button value="250">近250天</el-radio-button>
				</el-radio-group>
				<el-tooltip placement="bottom" effect="dark" content="六页签数据统一按此时间线筛选；历史 = 今年之前；近N天按自然日（假设按创建时间，实盘按卖出/买入/创建时间）">
					<span class="sr-tl-info"><font-awesome-icon fas icon="circle-info"></font-awesome-icon></span>
				</el-tooltip>
			</div>
		</div>

		<!-- 新建假设对话框 -->
		<el-dialog v-model="createVisible" title="新建假设" width="960px" top="5vh" destroy-on-close class="sr-dialog" @closed="onCreateClosed">
			<div class="cf-stock-row">
				<el-select
					v-model="dialogCode"
					filterable
					remote
					remote-show-suffix
					clearable
					placeholder="搜索全市场股票（名称 / 代码）"
					:remote-method="searchStocks"
					:loading="stockLoading"
					style="width: 320px"
					@change="onStockChange"
				>
					<el-option v-for="s in stockOptions" :key="s.Code" :label="`${s.Name}（${s.Code}）`" :value="s.Code"></el-option>
				</el-select>
				<span v-if="dialogStock" class="cf-stock-info">
					<b>{{ dialogStock.Name }}</b>
					<span class="cf-code">{{ dialogStock.Code }}</span>
					<span v-if="latestClose !== null" class="cf-price">最新收盘 {{ latestClose.toFixed(2) }}</span>
					<span v-else class="cf-loading">加载最新收盘价&hellip;</span>
				</span>
				<span v-if="activeExisting" class="cf-overwrite">该股已有进行中假设，保存将覆盖更新</span>
			</div>

			<el-radio-group v-model="createMode" class="cf-mode">
				<el-radio-button value="form">表单快捷</el-radio-button>
				<el-radio-button value="draw">画图路径</el-radio-button>
			</el-radio-group>

			<!-- 表单快捷 -->
			<el-form v-if="createMode === 'form'" label-width="90px" class="cf-form">
				<el-form-item label="方向">
					<el-radio-group v-model="formDirection" :disabled="!dialogCode" @change="applyDirection">
						<el-radio-button :value="1">看涨</el-radio-button>
						<el-radio-button :value="0">震荡</el-radio-button>
						<el-radio-button :value="-1">看跌</el-radio-button>
					</el-radio-group>
					<span class="cf-tip">切换方向将按基准价联动目标价（±5%）</span>
				</el-form-item>
				<el-form-item label="目标价">
					<el-input-number v-model="formTargetPrice" :min="0.01" :precision="2" :step="0.1" :disabled="!dialogCode" style="width: 150px" @change="syncAmpFromPrice"></el-input-number>
					<span class="cf-link">幅度</span>
					<el-input-number v-model="formAmpPct" :precision="2" :step="0.5" :min="-99" :max="999" :disabled="!dialogCode" style="width: 150px" @change="syncPriceFromAmp"></el-input-number>
					<span class="cf-unit">%</span>
				</el-form-item>
				<el-form-item label="目标日期">
					<el-date-picker v-model="formTargetDate" type="date" value-format="YYYY-MM-DD" :disabled-date="disabledTargetDate" :disabled="!dialogCode" style="width: 200px"></el-date-picker>
					<span class="cf-tip">需晚于今天且不超过 {{ maxHoldingDays }} 天（保存时起点自动校正为该股最新日K收盘）</span>
				</el-form-item>
				<el-form-item label="假设类型">
					<el-select v-model="formType" placeholder="可选" clearable style="width: 200px">
						<el-option v-for="(label, value) in zdxTypes" :key="value" :label="label" :value="Number(value)"></el-option>
					</el-select>
				</el-form-item>
				<el-form-item label="假设理由">
					<el-input v-model="formReason" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="为什么提出该假设（支撑压力/形态/量价/消息面等）"></el-input>
				</el-form-item>
			</el-form>

			<!-- 画图路径 -->
			<template v-else>
				<div v-if="dialogCode" class="cf-draw">
					<QuoteChart :key="dialogCode" :code="dialogCode" review-mode :forecasts="drawForecasts" @forecast-save="onDrawSave"></QuoteChart>
				</div>
				<el-empty v-else description="请先在上方搜索并选择股票" :image-size="70"></el-empty>
			</template>

			<template #footer>
				<el-button @click="createVisible = false">取消</el-button>
				<el-button v-if="createMode === 'form'" type="primary" :loading="saving" @click="submitForm">保存假设</el-button>
			</template>
		</el-dialog>

		<!-- 新建长线目标对话框（里程碑式：N 个交易日内到达目标收盘价；同股同期限覆盖更新） -->
		<el-dialog v-model="longVisible" title="新建长线目标" width="560px" destroy-on-close class="sr-dialog">
			<div class="cf-stock-row">
				<el-select
					v-model="longCode"
					filterable
					remote
					remote-show-suffix
					clearable
					placeholder="搜索全市场股票（名称 / 代码）"
					:remote-method="searchStocks"
					:loading="stockLoading"
					style="width: 320px"
					@change="onLongStockChange"
				>
					<el-option v-for="s in stockOptions" :key="s.Code" :label="`${s.Name}（${s.Code}）`" :value="s.Code"></el-option>
				</el-select>
				<span v-if="longStock" class="cf-stock-info">
					<b>{{ longStock.Name }}</b>
					<span class="cf-code">{{ longStock.Code }}</span>
					<span v-if="longClose !== null" class="cf-price">最新收盘 {{ longClose.toFixed(2) }}</span>
					<span v-else class="cf-loading">加载最新收盘价&hellip;</span>
				</span>
			</div>
			<el-form label-width="90px" class="cf-form">
				<el-form-item label="目标期限">
					<el-radio-group v-model="longChoice" :disabled="!longCode">
						<el-radio-button v-for="d in FC_LONG_PRESETS" :key="d" :value="d">{{ d }} 日</el-radio-button>
						<el-radio-button :value="0">自定义</el-radio-button>
					</el-radio-group>
					<el-input v-if="longChoice === 0" v-model="longCustomDays" :disabled="!longCode" size="default" class="lk-days-in" placeholder="天数" maxlength="3"></el-input>
					<span class="cf-tip">交易日口径：N 个交易日内到达目标收盘价（1~500）</span>
				</el-form-item>
				<el-form-item label="目标价">
					<el-input-number v-model="longPrice" :min="0.01" :precision="2" :step="0.1" :disabled="!longCode" style="width: 170px"></el-input-number>
					<span class="cf-unit">元（不复权）</span>
				</el-form-item>
				<el-form-item v-if="longPreviewText" label=" ">
					<span class="lk-preview" :class="longPreviewOk ? 'up' : 'warn'">{{ longPreviewText }}</span>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="longVisible = false">取消</el-button>
				<el-button type="primary" :loading="longSaving" @click="submitLong">保存目标</el-button>
			</template>
		</el-dialog>

		<!-- 假设详情 -->
		<el-dialog v-model="detailVisible" width="860px" top="5vh" destroy-on-close @opened="renderDetailChart">
			<template #header>
				<span>假设详情 · {{ detailItem?.StockName || detailItem?.StockCode || '' }}</span>
			</template>
			<div v-if="detailItem" class="dt-body">
				<div class="dt-head">
					<el-tag size="small" :type="detailItem.Status === 1 ? 'primary' : gradeTag(detailItem.Score)" effect="plain">
						{{ detailItem.Status === 1 ? '进行中' : gradeLabel(detailItem.Score) }}
					</el-tag>
					<el-tag size="small" :type="directionTag(detailItem)" effect="plain">{{ directionLabel(detailItem) }}</el-tag>
					<span class="dt-range">{{ detailItem.StartDate }} ~ {{ detailItem.EndDate }}</span>
					<span v-if="detailItem.Status === 2" class="dt-basis">{{ basisLabel(detailItem.VerifyPriceBasis) }}口径</span>
					<el-tooltip v-if="typeof detailItem.Score === 'number'" placement="top" popper-class="sr-tip-pop" :show-after="150">
						<template #content>
							<div class="stp-list">
								<div v-for="(line, i) in scoreDeductItems(detailItem)" :key="i" class="stp-line">{{ line }}</div>
							</div>
						</template>
						<span class="dt-score">{{ fmtScore(detailItem.Score) }} 分</span>
					</el-tooltip>
				</div>
				<div class="dt-verdicts">
					<div class="dt-v-card">
						<span class="dt-v-label">方向判定</span>
						<span v-if="detailItem.Status === 2" class="dt-v-value" :class="detailItem.HitDirection ? 'up' : 'down'">{{ detailItem.HitDirection ? '命中' : '未中' }}<el-tooltip :disabled="forecastDirectionScore(detailItem.HitDirection) > 0" placement="top" popper-class="sr-tip-pop" :show-after="150" :content="dimReason(detailItem, 'dir')"><b class="dt-pt" :class="{ 'is-zero': !forecastDirectionScore(detailItem.HitDirection) }">+{{ forecastDirectionScore(detailItem.HitDirection) }}</b></el-tooltip></span>
						<span v-else class="dt-v-value muted">待验证</span>
					</div>
					<div class="dt-v-card">
						<span class="dt-v-label">幅度判定</span>
						<span v-if="detailItem.Status === 2" class="dt-v-value">{{ amplitudeText(detailItem.AmplitudeClass) }}<el-tooltip :disabled="forecastAmplitudeScore(detailItem.AmplitudeClass) > 0" placement="top" popper-class="sr-tip-pop" :show-after="150" :content="dimReason(detailItem, 'amp')"><b class="dt-pt" :class="{ 'is-zero': !forecastAmplitudeScore(detailItem.AmplitudeClass) }">+{{ forecastAmplitudeScore(detailItem.AmplitudeClass) }}</b></el-tooltip></span>
						<span v-else class="dt-v-value muted">待验证</span>
					</div>
					<div class="dt-v-card">
						<span class="dt-v-label">路径判定</span>
						<span v-if="detailItem.Status === 2" class="dt-v-value">{{ pathClassText(detailItem.PathClass) }}<el-tooltip :disabled="forecastPathScore(detailItem.PathClass) > 0" placement="top" popper-class="sr-tip-pop" :show-after="150" :content="dimReason(detailItem, 'path')"><b class="dt-pt" :class="{ 'is-zero': !forecastPathScore(detailItem.PathClass) }">+{{ forecastPathScore(detailItem.PathClass) }}</b></el-tooltip></span>
						<span v-else class="dt-v-value muted">待验证</span>
					</div>
				</div>
				<div v-if="detailItem.Status === 2" class="dt-scoreline">
					<span class="dt-sl-title">得分构成</span>
					<span class="dt-sl-item dt-sl-click" @click.stop="openDetailRules('direction')">方向 <b>{{ forecastDirectionScore(detailItem.HitDirection) }}</b></span>
					<span class="dt-sl-op">+</span>
					<span class="dt-sl-item dt-sl-click" @click.stop="openDetailRules('amplitude')">幅度 <b>{{ forecastAmplitudeScore(detailItem.AmplitudeClass) }}</b></span>
					<span class="dt-sl-op">+</span>
					<span class="dt-sl-item dt-sl-click" @click.stop="openDetailRules('path')">路径 <b>{{ forecastPathScore(detailItem.PathClass) }}</b></span>
					<span class="dt-sl-op">=</span>
					<span class="dt-sl-total dt-sl-click" @click.stop="openDetailRules('')">{{ fmtScore(detailItem.Score) }} 分</span>
					<ForecastScoreRules ref="detailRulesRef" class="dt-sl-rules" />
				</div>
				<div v-if="detailItem.Status === 2 && detailItem.AltHitDirection !== null && detailItem.AltHitDirection !== undefined" class="dt-alt">
					<span class="dt-alt-title">对照口径 · {{ basisLabel(altBasis(detailItem)) }}</span>
					<span class="dt-alt-item">方向 <b :class="detailItem.AltHitDirection ? 'up' : 'down'">{{ detailItem.AltHitDirection ? '命中' : '未中' }}</b><el-tooltip :disabled="forecastDirectionScore(detailItem.AltHitDirection) > 0" placement="top" popper-class="sr-tip-pop" :show-after="150" :content="dimReason(detailItem, 'dir', true)"><i class="dt-pt" :class="{ 'is-zero': !forecastDirectionScore(detailItem.AltHitDirection) }">+{{ forecastDirectionScore(detailItem.AltHitDirection) }}</i></el-tooltip></span>
					<span class="dt-alt-item">幅度 <b>{{ amplitudeText(detailItem.AltAmplitudeClass) }}</b><el-tooltip :disabled="forecastAmplitudeScore(detailItem.AltAmplitudeClass) > 0" placement="top" popper-class="sr-tip-pop" :show-after="150" :content="dimReason(detailItem, 'amp', true)"><i class="dt-pt" :class="{ 'is-zero': !forecastAmplitudeScore(detailItem.AltAmplitudeClass) }">+{{ forecastAmplitudeScore(detailItem.AltAmplitudeClass) }}</i></el-tooltip></span>
					<span class="dt-alt-item">路径 <b>{{ pathClassText(detailItem.AltPathClass) }}</b><el-tooltip :disabled="forecastPathScore(detailItem.AltPathClass) > 0" placement="top" popper-class="sr-tip-pop" :show-after="150" :content="dimReason(detailItem, 'path', true)"><i class="dt-pt" :class="{ 'is-zero': !forecastPathScore(detailItem.AltPathClass) }">+{{ forecastPathScore(detailItem.AltPathClass) }}</i></el-tooltip></span>
					<el-tooltip placement="top" popper-class="sr-tip-pop" :show-after="150">
						<template #content>
							<div class="stp-list">
								<div v-for="(line, i) in scoreDeductItems(detailItem, true)" :key="i" class="stp-line">{{ line }}</div>
							</div>
						</template>
						<span class="dt-alt-item">得分 <b>{{ fmtScore(detailItem.AltScore) }}</b></span>
					</el-tooltip>
				</div>
				<div v-if="detailItem.Status === 2 && detailItem.VerifyItems?.length" class="dt-chart">
					<div class="dt-chart-title">预测 vs 实际（逐日收盘 + 日内最高）</div>
					<div ref="detailChartRef" class="chart-box dt-mini"></div>
				</div>
				<div class="dt-meta">
					<span>来源：{{ zdxSources[detailItem.Source] ?? '画图路径' }}</span>
					<span v-if="detailItem.HypothesisType">类型：{{ zdxTypes[detailItem.HypothesisType] }}</span>
					<span>创建：{{ fmtTime(detailItem.CreateTime) }}</span>
					<span v-if="detailItem.VerifyTime">验证：{{ fmtTime(detailItem.VerifyTime) }}</span>
					<span>创建时{{ detailItem.IsHeldWhenCreated ? '持仓中' : '空仓' }}</span>
				</div>
				<div v-if="detailItem.Reason" class="dt-reason">理由：{{ detailItem.Reason }}</div>
				<el-table v-if="detailItem.Status === 2 && detailItem.VerifyItems?.length" :data="detailItem.VerifyItems" size="small" max-height="260">
					<el-table-column label="交易日" prop="Date" width="112"></el-table-column>
					<el-table-column label="预测价" width="92">
						<template #default="{ row }">{{ Number(row.Predict).toFixed(2) }}</template>
					</el-table-column>
					<el-table-column label="实际收盘" width="92">
						<template #default="{ row }">{{ Number(row.Actual).toFixed(2) }}</template>
					</el-table-column>
					<el-table-column label="收盘偏差" width="92">
						<template #default="{ row }">
							<span :class="toneCls(row.Diff)">{{ fmtPct(row.Diff) }}</span>
						</template>
					</el-table-column>
					<el-table-column label="实际最高" width="92">
						<template #default="{ row }">{{ fmtPriceCell(row.High) }}</template>
					</el-table-column>
					<el-table-column label="最高偏差">
						<template #default="{ row }">
							<span v-if="(row.High ?? 0) > 0" :class="toneCls(row.DiffHigh)">{{ fmtPct(row.DiffHigh) }}</span>
							<span v-else>--</span>
						</template>
					</el-table-column>
				</el-table>
				<el-empty v-if="detailItem.Status === 1" description="进行中：到期后自动逐日验证并判定（日K收盘后晚间落库，未落库不结算、列表刷新/定时任务次日自动续判）" :image-size="70"></el-empty>
			</div>
		</el-dialog>
		<!-- 实盘目标详情（价格轨迹 + 验证结果） -->
		<el-dialog v-model="liveDetailVisible" width="880px" top="6vh" destroy-on-close @opened="renderLiveDetailChart">
			<template #header>
				<span>实盘目标详情 · {{ liveDetail?.Target?.StockName || liveDetail?.Target?.StockCode || '' }}</span>
			</template>
			<div v-if="liveDetail" class="dt-body">
				<div class="dt-head">
					<el-tag size="small" :type="liveStatusType(liveDetail.Target.Status)" effect="plain">{{ ZDX_LIVE_TARGET_STATUSES[liveDetail.Target.Status] ?? '--' }}</el-tag>
					<el-tag size="small" :type="liveDetail.Target.Direction === 1 ? 'danger' : 'success'" effect="plain">{{ liveDetail.Target.Direction === 1 ? '买入目标' : '卖出目标' }}</el-tag>
					<span class="dt-range">{{ fmtTime(liveDetail.Target.BuyTime || liveDetail.Target.SellTime, 'YYYY-MM-DD HH:mm') }} 起</span>
					<span v-if="liveHitDuration(liveDetail.Target)" class="dt-range">达标用时 {{ liveHitDuration(liveDetail.Target) }}</span>
					<span
						v-if="liveDetail.Target.ActualReturn !== null && liveDetail.Target.ActualReturn !== undefined"
						class="dt-score"
						:class="toneCls(liveDetail.Target.ActualReturn)"
					>
						实际 {{ fmtPct(liveDetail.Target.ActualReturn) }}
					</span>
				</div>
				<div class="dt-verdicts lv-verdicts">
					<div class="dt-v-card">
						<span class="dt-v-label">成本 / 目标</span>
						<span class="dt-v-value">{{ Number(liveDetail.Target.BasePrice).toFixed(3) }} → {{ Number(liveDetail.Target.TargetPrice).toFixed(2) }}</span>
						<span class="dt-v-label">目标涨幅 {{ fmtPct(liveDetail.Target.TargetPct) }} · {{ liveDetail.Target.TargetQty }} 股</span>
					</div>
					<div class="dt-v-card">
						<span class="dt-v-label">达标时间 / 价格</span>
						<span class="dt-v-value">{{ liveDetail.Target.HitTime ? fmtTime(liveDetail.Target.HitTime, 'MM-DD HH:mm') : '未达标' }}</span>
						<span class="dt-v-label">{{ liveDetail.Target.HitPrice !== null && liveDetail.Target.HitPrice !== undefined ? '触达 ' + Number(liveDetail.Target.HitPrice).toFixed(2) : '（分钟K/日K判定中）' }}</span>
					</div>
					<div class="dt-v-card">
						<span class="dt-v-label">最大浮盈 / 浮亏</span>
						<span class="dt-v-value up">{{ liveDetail.Target.MaxProfit !== null && liveDetail.Target.MaxProfit !== undefined ? fmtPct(liveDetail.Target.MaxProfit) : '--' }}</span>
						<span class="dt-v-label down">{{ liveDetail.Target.MaxDrawdown !== null && liveDetail.Target.MaxDrawdown !== undefined ? fmtPct(liveDetail.Target.MaxDrawdown) : '--' }}</span>
					</div>
					<div class="dt-v-card">
						<span class="dt-v-label">预测偏差</span>
						<span class="dt-v-value" :class="toneCls(liveDetail.Target.Deviation)">{{ fmtPct(liveDetail.Target.Deviation) }}</span>
						<span class="dt-v-label">实际收益 - 目标涨幅</span>
					</div>
				</div>
				<div class="dt-chart">
					<div class="dt-chart-title">价格轨迹（{{ liveDetail.DataSource === 'minute' ? '分时价格' : '日K收盘' }} · 采样 ≤400 点）· 虚线=目标价 / 点线=成本</div>
					<div ref="liveChartRef" class="chart-box dt-mini"></div>
				</div>
				<div class="dt-meta">
					<span>复盘日：{{ fmtTime(liveDetail.Target.ReviewDate, 'YYYY-MM-DD') }}</span>
					<span>期限：{{ liveDeadlineText(liveDetail.Target) }}</span>
					<span v-if="liveDetail.Target.SellTime">卖出：{{ fmtTime(liveDetail.Target.SellTime, 'YYYY-MM-DD HH:mm') }}</span>
					<span v-if="liveDetail.Target.VerifyTime">验证：{{ fmtTime(liveDetail.Target.VerifyTime) }}</span>
				</div>
				<div v-if="liveDetail.Target.Note" class="dt-reason">操作说明：{{ liveDetail.Target.Note }}</div>
			</div>
		</el-dialog>

	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { dayjs, ElMessage, ElMessageBox } from 'element-plus'
import {
	IZdxStockForecast,
	IZdxForecastAnchor,
	IZdxForecastCenterItem,
	IZdxForecastCenterStats,
	IZdxForecastGroupStat,
	IZdxStockForecastLong,
	IZdxLiveTarget,
	IZdxLiveTargetDetail,
	IZdxTradePerformance,
	IZdxTradeAttributionGroup,
	IZdxForecastVsLive,
	ZDX_FORECAST_SOURCES,
	ZDX_HYPOTHESIS_TYPES,
	ZDX_FORECAST_AMPLITUDE_CLASSES,
	ZDX_FORECAST_PATH_CLASSES,
	ZDX_LIVE_TARGET_STATUSES,
	ZDX_FORECAST_LONG_STATUSES,
	getForecastGrade,
	forecastDirectionScore,
	forecastAmplitudeScore,
	forecastPathScore
} from '@/interfaces/zhiduoxing/IZdxStockReview'
import { IZdxSchoolAlignment } from '@/interfaces/zhiduoxing/IZdxMyTrade'
import zdxApi from '@/apis/zdx-api'
import QuoteChart from './components/QuoteChart.vue'
import ForecastScoreRules from './components/ForecastScoreRules.vue'
import ReviewDiagnosisPanel from './components/ReviewDiagnosisPanel.vue'
import ReviewSchoolAlign from './components/ReviewSchoolAlign.vue'
import ReviewStyleBrief from './components/ReviewStyleBrief.vue'
import ExecutionConsistencyTable from './components/ExecutionConsistencyTable.vue'

// 股票选项（轻量结构，仅取搜索接口的 Code/Name）
interface StockOption {
	Code: string
	Name: string
}

const route = useRoute()
const router = useRouter()

// ---------- 六页签与策略诊断带 ----------
const activeTab = ref<'school' | 'style' | 'trade' | 'forecast' | 'live' | 'stats'>('forecast')

// 全局时间线（六个页签统一筛选口径；沿用后端 range 语义：all/history/20/60/120/250）
const globalRange = ref<'all' | 'history' | '20' | '60' | '120' | '250'>('all')

// 统一时间过滤：历史 = 今年之前；近N = 当前往前推 N 个自然日；全部 = 不过滤
function matchRange(time?: string | null) {
	if (!time) return true
	if (globalRange.value === 'all') return true
	const t = dayjs(time)
	if (globalRange.value === 'history') return t.isBefore(dayjs().startOf('year'))
	return !t.isBefore(dayjs().subtract(Number(globalRange.value), 'day'))
}

// 流派契合数据（父组件拉取一次：诊断带徽章 + 流派契合 Tab 共用）
const schoolAlign = ref<IZdxSchoolAlignment | null>(null)

const diagPanelRef = ref<InstanceType<typeof ReviewDiagnosisPanel>>()
const schoolAlignRef = ref<InstanceType<typeof ReviewSchoolAlign>>()
const styleBriefRef = ref<InstanceType<typeof ReviewStyleBrief>>()
const execTableRef = ref<InstanceType<typeof ExecutionConsistencyTable>>()

async function loadSchoolAlign() {
	try {
		schoolAlign.value = await zdxApi.getSchoolAlignment(globalRange.value)
	} catch {
		schoolAlign.value = null
	}
}

// 诊断带改进方向跳转：target = tab-xxx → 对应页签
function onDiagNavigate(target: string) {
	const map: Record<string, 'school' | 'style' | 'trade' | 'forecast' | 'live' | 'stats'> = {
		'tab-school': 'school',
		'tab-style': 'style',
		'tab-trade': 'trade',
		'tab-forecast': 'forecast',
		'tab-live': 'live',
		'tab-stats': 'stats'
	}
	const tab = map[target]
	if (tab) activeTab.value = tab
}

// 诊断带“持仓未写复盘”待办 → 跳转个股行情页复盘（不弹抽屉）
function onTodoOpenReview(v: { code: string; name: string }) {
	router.push({ name: 'ZdxPortalStock', query: { code: v.code } })
}

// ---------- 台账与统计 ----------
const listLoading = ref(false)
const statsLoading = ref(false)
const centerList = ref<IZdxForecastCenterItem[]>([])
const stats = ref<IZdxForecastCenterStats | null>(null)
const calibrationWindow = 10

// 筛选（初始支持 MyZone 等入口携带的 query.code 作为关键字；时间范围由全局时间线控制）
const initialCode = ((route.query.code as string) ?? '').trim()
const filterStatus = ref<number | ''>('')
const filterSource = ref<number | ''>('')
const filterBasis = ref<number>(0)
const filterKeyword = ref(initialCode)

watch(
	() => route.query.code,
	v => {
		filterKeyword.value = ((v as string) ?? '').trim()
		// 入口携带 query.code：定位到假设验证页签查看筛选结果
		activeTab.value = 'forecast'
	}
)

async function loadList() {
	listLoading.value = true
	try {
		centerList.value = (await zdxApi.getReviewCenterList()) ?? []
	} catch (err: any) {
		ElMessage.error(err?.message || '台账加载失败')
	} finally {
		listLoading.value = false
	}
}

async function loadStats() {
	statsLoading.value = true
	try {
		stats.value = await zdxApi.getReviewCenterStats(globalRange.value)
	} catch {
		stats.value = null
	} finally {
		statsLoading.value = false
		// 单页平铺：统计数据就绪后等待 DOM 更新再渲染图表
		nextTick(renderStatsCharts)
	}
}

// ---------- 长线目标台账（里程碑式；全量所有股票；收盘价口径自动判定） ----------
const longLoading = ref(false)
const centerLongList = ref<IZdxStockForecastLong[]>([])

// 随全局时间线筛选（按创建时间）
const longFilteredList = computed(() => centerLongList.value.filter(x => matchRange(x.CreateTime)))

// 汇总：已达成 / 进行中 / 未达成（基于时间线筛选结果）
const longHitCount = computed(() => longFilteredList.value.filter(x => x.Status === 2).length)
const longActiveCount = computed(() => longFilteredList.value.filter(x => x.Status === 1).length)
const longMissCount = computed(() => longFilteredList.value.filter(x => x.Status === 3).length)

async function loadCenterLong() {
	longLoading.value = true
	try {
		centerLongList.value = (await zdxApi.getReviewCenterLongList()) ?? []
	} catch (err: any) {
		ElMessage.error(err?.message || '长线目标加载失败')
	} finally {
		longLoading.value = false
	}
}

// 验证状态标签色调（进行中=主色 / 已达成=成功 / 未达成=危险）
function longStatusType(status: number) {
	return status === 2 ? 'success' : status === 3 ? 'danger' : 'primary'
}

// 到期但未出结论的标注（判定数据驱动：日K收盘后晚间才落库，未落库不结算、保持进行中自动续判）：截止日即今天=待收盘后判定；已过截止日=当日K线未落库待补录
function klinePendingText(d?: string | null) {
	if (!d) return ''
	const dd = dayjs(d)
	if (dd.isAfter(dayjs(), 'day')) return ''
	return dd.isBefore(dayjs(), 'day') ? '当日K线未落库 · 补录后自动判定' : '待当日收盘后判定'
}

// 假设台账进行中提示：未到期=待到期验证；到期/过期的数据未就绪场景见 klinePendingText
function forecastWaitText(row: IZdxForecastCenterItem) {
	return klinePendingText(row.EndDate) || '待到期验证'
}

// 目标期限文案（X 交易日 · 至 MM-DD；到期日未知时仅天数）
function longDeadlineText(row: IZdxStockForecastLong) {
	const deadline = row.DeadlineDate ? fmtTime(row.DeadlineDate, 'MM-DD') : null
	return deadline ? `${row.Days} 交易日 · 至 ${deadline}` : `${row.Days} 交易日`
}

// 验证结果文案（已达成=达标日期+用时 / 未达成=到期未达成 / 进行中=剩余交易日；到期未出结论=数据未就绪标注）
function longVerdictText(row: IZdxStockForecastLong) {
	if (row.Status === 2 && row.HitDate) return `${fmtTime(row.HitDate, 'MM-DD')} 达标 · 第 ${row.HitDays} 交易日`
	if (row.Status === 3) return '到期未达成'
	if (row.Status === 1) {
		const pending = klinePendingText(row.DeadlineDate)
		if (pending) return pending
	}
	return row.RemainDays !== null && row.RemainDays !== undefined ? `剩余 ${row.RemainDays} 交易日` : '--'
}

// ---------- 实盘目标台账（验证视图：折算同步 + 达标验证后的全量行） ----------
const liveLoading = ref(false)
const liveList = ref<IZdxLiveTarget[]>([])
const liveFilterStatus = ref<number | ''>('')
const liveFilterKeyword = ref('')

// 时间线过滤（按卖出时间 ?? 买入时间 ?? 创建时间；与后端实盘口径一致）
const liveRangeFiltered = computed(() => liveList.value.filter(x => matchRange(x.SellTime ?? x.BuyTime ?? x.CreateTime)))

// 状态 + 关键字过滤（表格展示用）
const liveFilteredList = computed(() => {
	const kw = liveFilterKeyword.value.trim().toLowerCase()
	return liveRangeFiltered.value.filter(x => {
		if (liveFilterStatus.value !== '' && x.Status !== liveFilterStatus.value) return false
		if (kw) {
			const name = (x.StockName ?? '').toLowerCase()
			const code = x.StockCode.toLowerCase()
			if (!name.includes(kw) && !code.includes(kw)) return false
		}
		return true
	})
})

// 结果统计（随全局时间线联动）：达标 = 分钟/收盘达标；未达标 = 到期未达标/先触发止损；进行中 = 进行中
const liveHitCount = computed(() => liveRangeFiltered.value.filter(x => x.Status === 2 || x.Status === 3).length)
const liveMissCount = computed(() => liveRangeFiltered.value.filter(x => x.Status === 4 || x.Status === 5).length)
const liveRunningCount = computed(() => liveRangeFiltered.value.filter(x => x.Status === 1).length)

// 已判定数（达标 + 未达标，达标率分母）与达标率（%）
const liveJudgedCount = computed(() => liveHitCount.value + liveMissCount.value)
const liveHitRate = computed(() => (liveJudgedCount.value > 0 ? Number(((liveHitCount.value / liveJudgedCount.value) * 100).toFixed(1)) : 0))

// 已了结笔数（实际盈亏已回填：买入笔匹配卖出 / 独立卖出笔）
const liveSettledCount = computed(() => liveRangeFiltered.value.filter(x => x.ActualProfit !== null && x.ActualProfit !== undefined).length)

// 净盈亏合计（元）
const liveRealizedSum = computed(() => liveRangeFiltered.value.reduce((sum, x) => sum + (Number(x.ActualProfit) || 0), 0))

// 胜率（已了结中盈利笔占比，%）与平均收益（净盈亏 ÷ 已了结）
const liveWinRate = computed(() => {
	const settled = liveRangeFiltered.value.filter(x => x.ActualProfit !== null && x.ActualProfit !== undefined)
	if (!settled.length) return 0
	return Number(((settled.filter(x => Number(x.ActualProfit) > 0).length / settled.length) * 100).toFixed(1))
})
const liveAvgProfit = computed(() => (liveSettledCount.value > 0 ? Number((liveRealizedSum.value / liveSettledCount.value).toFixed(2)) : 0))

async function loadLiveTargets() {
	liveLoading.value = true
	try {
		liveList.value = (await zdxApi.getLiveTargetList()) ?? []
	} catch (err: any) {
		ElMessage.error(err?.message || '实盘目标加载失败')
	} finally {
		liveLoading.value = false
	}
}

// 状态标签色（2/3=达标 success；4/5=失败 danger；6=提前卖出 warning；1=进行中 primary）
function liveStatusType(status: number): 'success' | 'primary' | 'warning' | 'danger' | 'info' {
	if (status === 2 || status === 3) return 'success'
	if (status === 1) return 'primary'
	if (status === 6) return 'warning'
	if (status === 4 || status === 5) return 'danger'
	return 'info'
}

// 达标用时（买入 → 达标；分钟/小时/天）
function liveHitDuration(row: IZdxLiveTarget) {
	if (!row.HitTime || !row.BuyTime) return ''
	const mins = dayjs(row.HitTime).diff(dayjs(row.BuyTime), 'minute')
	if (mins < 0) return ''
	if (mins < 60) return `${mins} 分钟`
	if (mins < 60 * 24) return `${(mins / 60).toFixed(1)} 小时`
	return `${(mins / 60 / 24).toFixed(1)} 天`
}

// 期限描述（N 交易日 + 截止日期）
function liveDeadlineText(row: IZdxLiveTarget) {
	if (!row.DeadlineDays) return '不限'
	const d = row.DeadlineDate ? dayjs(row.DeadlineDate).format('MM-DD') : '--'
	return `${row.DeadlineDays} 交易日 · 至 ${d}`
}

// ---------- 实盘目标详情（价格轨迹：分钟优先 / 日K兜底 + 目标价参考线） ----------
const liveDetailVisible = ref(false)
const liveDetail = ref<IZdxLiveTargetDetail | null>(null)
const liveChartRef = ref<HTMLElement>()
let liveChart: echarts.ECharts | null = null

async function openLiveDetail(row: IZdxLiveTarget) {
	try {
		const detail = await zdxApi.getLiveTargetDetail(row.Id)
		if (!detail) {
			ElMessage.warning('未找到该实盘目标详情')
			return
		}
		liveDetail.value = detail
		liveDetailVisible.value = true
	} catch (err: any) {
		ElMessage.error(err?.message || '详情加载失败')
	}
}

function renderLiveDetailChart() {
	const detail = liveDetail.value
	if (!detail || !liveChartRef.value || !detail.Trace?.length) return
	if (!liveChart) liveChart = echarts.init(liveChartRef.value)
	const t = detail.Target
	const series: any[] = [
		{
			name: '价格',
			type: 'line',
			showSymbol: false,
			lineStyle: { width: 2 },
			itemStyle: { color: '#409eff' },
			data: detail.Trace.map(e => e.Price),
			markLine: {
				silent: true,
				symbol: 'none',
				data: [
					{ yAxis: Number(t.TargetPrice), lineStyle: { color: '#f56c6c', type: 'dashed' }, label: { color: '#f56c6c', fontSize: 10, formatter: `目标 ${Number(t.TargetPrice).toFixed(2)}` } },
					{ yAxis: Number(t.BasePrice), lineStyle: { color: '#909399', type: 'dotted' }, label: { color: '#909399', fontSize: 10, formatter: `成本 ${Number(t.BasePrice).toFixed(3)}` } }
				]
			}
		}
	]
	// 分钟来源：叠加分时均价线
	if (detail.DataSource === 'minute' && detail.Trace.some(e => e.Avg !== null && e.Avg !== undefined)) {
		series.push({ name: '均价', type: 'line', showSymbol: false, lineStyle: { width: 1, type: 'dashed' }, itemStyle: { color: '#e6a23c' }, data: detail.Trace.map(e => e.Avg ?? null) })
	}
	liveChart.setOption(
		{
			grid: { left: 56, right: 26, top: 32, bottom: 26 },
			tooltip: { trigger: 'axis' },
			legend: { top: 2, itemWidth: 12, itemHeight: 8, textStyle: { fontSize: 11 } },
			xAxis: { type: 'category', data: detail.Trace.map(e => e.Time), axisLabel: { fontSize: 10, hideOverlap: true } },
			yAxis: { type: 'value', scale: true, axisLabel: { fontSize: 11, formatter: (v: number) => v.toFixed(2) } },
			series
		},
		true
	)
	liveChart.resize()
}

// ---------- 交易绩效（五子卡：核心指标 / 盈亏分布 / 盈亏单 / 单笔盈亏比 / 归因分组） ----------
const perfLoading = ref(false)
const perf = ref<IZdxTradePerformance | null>(null)

async function loadPerf() {
	perfLoading.value = true
	try {
		perf.value = await zdxApi.getTradePerformance(globalRange.value)
	} catch (err: any) {
		perf.value = null
		ElMessage.error(err?.message || '交易绩效加载失败')
	} finally {
		perfLoading.value = false
	}
}

// 归因维度切换（达标/持有周期/股票/时段）
const attrDim = ref<'ByHitStatus' | 'ByHoldingPeriod' | 'ByStock' | 'ByTradeTime'>('ByHitStatus')
const attrRows = computed<IZdxTradeAttributionGroup[]>(() => (perf.value ? (perf.value[attrDim.value] ?? []) : []))

// 盈亏分布条宽度（总盈利 / 总亏损占比）
const perfBarWin = computed(() => {
	const d = perf.value?.Distribution
	if (!d) return '50%'
	const total = d.TotalProfit + d.TotalLoss
	return total > 0 ? `${((d.TotalProfit / total) * 100).toFixed(1)}%` : '50%'
})
const perfBarLoss = computed(() => {
	const d = perf.value?.Distribution
	if (!d) return '50%'
	const total = d.TotalProfit + d.TotalLoss
	return total > 0 ? `${((d.TotalLoss / total) * 100).toFixed(1)}%` : '50%'
})

// ---------- 预测 vs 实盘对比（判断力 vs 执行力） ----------
const vsLive = ref<IZdxForecastVsLive | null>(null)

async function loadVsLive() {
	try {
		vsLive.value = await zdxApi.getForecastVsLive(globalRange.value)
	} catch {
		vsLive.value = null
	}
}

// 全局时间线切换：交易绩效 / 统计分析 / 预测 vs 实盘 / 流派契合 重新拉取；台账与走势图走 computed 自动联动
watch(globalRange, () => {
	loadPerf()
	loadStats()
	loadVsLive()
	loadSchoolAlign()
})

async function refreshAll() {
	await Promise.all([loadList(), loadStats(), loadCenterLong(), loadLiveTargets(), loadPerf(), loadVsLive(), loadSchoolAlign()])
	// 子组件各自拉取自身数据（诊断带 / 风格摘要 / 执行一致性；流派契合 Tab 通过 :initial 同步）
	diagPanelRef.value?.refresh()
	styleBriefRef.value?.refresh()
	execTableRef.value?.refresh()
}

// 统计分析页签 lazy 挂载后补一次图表渲染（容器此时才存在）；假设验证页签同理补平均分走势图
watch(activeTab, tab => {
	if (tab === 'stats') nextTick(renderStatsCharts)
	if (tab === 'forecast') nextTick(renderScoreChart)
})

onMounted(() => {
	refreshAll()
	window.addEventListener('resize', handleResizeAll)
})

onUnmounted(() => {
	window.removeEventListener('resize', handleResizeAll)
	trendChart?.dispose()
	calibChart?.dispose()
	detailChart?.dispose()
	liveChart?.dispose()
	scoreChart?.dispose()
})

function handleResizeAll() {
	trendChart?.resize()
	calibChart?.resize()
	detailChart?.resize()
	liveChart?.resize()
	scoreChart?.resize()
}

// ---------- 概览卡 ----------
const overviewCards = computed(() => {
	const o = stats.value?.Overview
	return [
		{ label: '假设总数', value: o ? String(o.Total) : '--', cls: '' },
		{ label: '进行中', value: o ? String(o.Active) : '--', cls: 'v-blue' },
		{ label: '已判定', value: o ? String(o.Verified) : '--', cls: 'v-violet' },
		{ label: '方向命中率', value: o && o.HitRate !== null && o.HitRate !== undefined ? `${o.HitRate}%` : '--', cls: o && (o.HitRate ?? 0) >= 50 ? 'v-red' : 'v-green' },
		{ label: '平均分', value: o && o.AvgScore !== null && o.AvgScore !== undefined ? String(o.AvgScore) : '--', cls: 'v-orange' }
	]
})

// ---------- 台账筛选与展示 ----------
// 时间线范围内的假设数量（假设验证页签徽章用；仅按创建时间口径，不受台账次级筛选影响）
const centerRangeCount = computed(() => centerList.value.filter(x => matchRange(x.CreateTime)).length)

const filteredList = computed(() => {
	const kw = filterKeyword.value.trim().toLowerCase()
	return centerList.value.filter(x => {
		if (filterStatus.value !== '' && x.Status !== filterStatus.value) return false
		if (filterSource.value !== '' && x.Source !== filterSource.value) return false
		// 判定口径：按主口径过滤（进行中无口径，选择具体口径时不展示）
		if (filterBasis.value !== 0 && x.VerifyPriceBasis !== filterBasis.value) return false
		// 时间条件：随全局时间线筛选（按创建时间；历史=今年之前；近N天=自然日窗口）
		if (!matchRange(x.CreateTime)) return false
		if (kw) {
			const name = (x.StockName ?? '').toLowerCase()
			const code = x.StockCode.toLowerCase()
			if (!name.includes(kw) && !code.includes(kw)) return false
		}
		return true
	})
})

const zdxSources = ZDX_FORECAST_SOURCES
const zdxTypes = ZDX_HYPOTHESIS_TYPES

// 锚点摘要（不复权：首 → 末 + 起终幅度）
function anchorBrief(row: { Anchors?: IZdxForecastAnchor[] }) {
	const list = row.Anchors ?? []
	if (!list.length) return { first: null, last: null, amp: 0 }
	const first = list[0]
	const last = list[list.length - 1]
	const amp = first.Price > 0 ? ((last.Price - first.Price) / first.Price) * 100 : 0
	return { first, last, amp }
}

function directionLabel(row: { Anchors?: IZdxForecastAnchor[] }): string {
	const { amp } = anchorBrief(row)
	if (amp > 0.5) return '看涨'
	if (amp < -0.5) return '看跌'
	return '震荡'
}

function directionTag(row: { Anchors?: IZdxForecastAnchor[] }) {
	const { amp } = anchorBrief(row)
	if (amp > 0.5) return 'danger'
	if (amp < -0.5) return 'success'
	return 'info'
}

function pathText(row: { Anchors?: IZdxForecastAnchor[] }) {
	const { first, last, amp } = anchorBrief(row)
	if (!first || !last) return '--'
	return `${first.Price.toFixed(2)} → ${last.Price.toFixed(2)}（${amp > 0 ? '+' : ''}${amp.toFixed(1)}%）`
}

function gradeLabel(score?: number | null) {
	if (typeof score !== 'number') return '已判定'
	return getForecastGrade(score).label
}

function gradeTag(score?: number | null) {
	if (typeof score !== 'number') return 'success'
	return getForecastGrade(score).tag
}

function amplitudeText(cls?: number | null) {
	return ZDX_FORECAST_AMPLITUDE_CLASSES[cls ?? 0] ?? '--'
}

function pathClassText(cls?: number | null) {
	return ZDX_FORECAST_PATH_CLASSES[cls ?? 0] ?? '--'
}

function fmtScore(score?: number | null) {
	return typeof score === 'number' ? score.toFixed(0) : '--'
}

function fmtTime(value?: string | null, pattern = 'YYYY-MM-DD HH:mm') {
	return value ? dayjs(value).format(pattern) : '--'
}

// ---------- 统计图表（统计数据更新后渲染） ----------
const trendChartRef = ref<HTMLElement>()
const calibChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let calibChart: echarts.ECharts | null = null

function renderStatsCharts() {
	const trend = stats.value?.Trend ?? []
	if (trendChartRef.value && trend.length) {
		// 时间条件切换后容器可能被 v-if 重建，旧实例需销毁后重新初始化
		if (!trendChart || trendChart.getDom() !== trendChartRef.value) {
			trendChart?.dispose()
			trendChart = echarts.init(trendChartRef.value)
		}
		trendChart.setOption(
			{
				grid: { left: 46, right: 46, top: 38, bottom: 28 },
				tooltip: { trigger: 'axis' },
				legend: { top: 4, itemWidth: 12, itemHeight: 8, textStyle: { fontSize: 11 } },
				xAxis: { type: 'category', data: trend.map(e => e.Month), axisLabel: { fontSize: 11 }, axisTick: { alignWithLabel: true } },
				yAxis: [
					{ type: 'value', name: '判定数', minInterval: 1, axisLabel: { fontSize: 11 }, nameTextStyle: { fontSize: 11 } },
					{ type: 'value', name: '命中率', min: 0, max: 100, axisLabel: { fontSize: 11, formatter: '{value}%' }, nameTextStyle: { fontSize: 11 } }
				],
				series: [
					{ name: '判定数', type: 'bar', barWidth: 18, itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] }, data: trend.map(e => e.Verified) },
					{ name: '命中率', type: 'line', yAxisIndex: 1, smooth: true, symbolSize: 6, lineStyle: { width: 2 }, itemStyle: { color: '#f56c6c' }, data: trend.map(e => e.HitRate) }
				]
			},
			true
		)
		trendChart.resize()
	} else if (trendChart) {
		trendChart.dispose()
		trendChart = null
	}
	const calib = stats.value?.Calibration ?? []
	if (calibChartRef.value && calib.length) {
		if (!calibChart || calibChart.getDom() !== calibChartRef.value) {
			calibChart?.dispose()
			calibChart = echarts.init(calibChartRef.value)
		}
		calibChart.setOption(
			{
				grid: { left: 46, right: 24, top: 38, bottom: 28 },
				tooltip: { trigger: 'axis' },
				legend: { top: 4, itemWidth: 12, itemHeight: 8, textStyle: { fontSize: 11 } },
				xAxis: { type: 'category', data: calib.map(e => dayjs(e.Date).format('MM-DD')), axisLabel: { fontSize: 11 } },
				yAxis: { type: 'value', min: 0, max: 100, axisLabel: { fontSize: 11 } },
				series: [
					{ name: '滚动命中率%', type: 'line', smooth: true, symbolSize: 4, lineStyle: { width: 2 }, itemStyle: { color: '#f56c6c' }, data: calib.map(e => e.HitRate) },
					{ name: '滚动平均分', type: 'line', smooth: true, symbolSize: 4, lineStyle: { width: 1.5, type: 'dashed' }, itemStyle: { color: '#409eff' }, data: calib.map(e => e.AvgScore) }
				]
			},
			true
		)
		calibChart.resize()
	} else if (calibChart) {
		calibChart.dispose()
		calibChart = null
	}
}

// ---------- 平均分走势图（假设台账内置：已判定假设按判定日聚合平均分；随全局时间线联动） ----------
const scoreChartRef = ref<HTMLElement>()
let scoreChart: echarts.ECharts | null = null

// 走势点位（判定日优先 VerifyTime、缺省 CreateTime；点位超 60 按周聚合，周标签为周一）
const scoreTrend = computed(() => {
	const map = new Map<string, { sum: number; count: number }>()
	for (const x of centerList.value) {
		if (x.Status !== 2 || x.Score === null || x.Score === undefined) continue
		const t = x.VerifyTime ?? x.CreateTime
		if (!matchRange(t)) continue
		const day = dayjs(t).format('YYYY-MM-DD')
		const e = map.get(day) ?? { sum: 0, count: 0 }
		e.sum += x.Score
		e.count += 1
		map.set(day, e)
	}
	const days = Array.from(map.keys()).sort()
	let points = days.map(d => ({ Date: d, AvgScore: Number((map.get(d)!.sum / map.get(d)!.count).toFixed(1)), Count: map.get(d)!.count }))
	if (points.length > 60) {
		const weekMap = new Map<string, { sum: number; count: number }>()
		for (const p of points) {
			const d0 = dayjs(p.Date)
			const monday = d0.subtract((d0.day() + 6) % 7, 'day').format('YYYY-MM-DD')
			const e = weekMap.get(monday) ?? { sum: 0, count: 0 }
			e.sum += p.AvgScore * p.Count
			e.count += p.Count
			weekMap.set(monday, e)
		}
		points = Array.from(weekMap.keys()).sort().map(k => ({ Date: k, AvgScore: Number((weekMap.get(k)!.sum / weekMap.get(k)!.count).toFixed(1)), Count: weekMap.get(k)!.count }))
	}
	return points
})

function renderScoreChart() {
	const points = scoreTrend.value
	if (scoreChartRef.value && points.length) {
		// 时间线切换后容器可能被 v-if 重建，旧实例需销毁后重新初始化
		if (!scoreChart || scoreChart.getDom() !== scoreChartRef.value) {
			scoreChart?.dispose()
			scoreChart = echarts.init(scoreChartRef.value)
		}
		scoreChart.setOption(
			{
				grid: { left: 46, right: 46, top: 36, bottom: 28 },
				tooltip: { trigger: 'axis' },
				legend: { top: 2, itemWidth: 12, itemHeight: 8, textStyle: { fontSize: 11 } },
				xAxis: { type: 'category', data: points.map(e => dayjs(e.Date).format('MM-DD')), axisLabel: { fontSize: 11 } },
				yAxis: [
					{ type: 'value', name: '平均分', min: 0, max: 100, axisLabel: { fontSize: 11 }, nameTextStyle: { fontSize: 11 } },
					{ type: 'value', name: '判定数', minInterval: 1, axisLabel: { fontSize: 11 }, nameTextStyle: { fontSize: 11 } }
				],
				series: [
					{ name: '平均分', type: 'line', smooth: true, symbolSize: 5, lineStyle: { width: 2 }, itemStyle: { color: '#7c5cf0' }, areaStyle: { opacity: 0.08 }, data: points.map(e => e.AvgScore) },
					{ name: '判定数', type: 'bar', yAxisIndex: 1, barWidth: 10, itemStyle: { color: '#c8d4f5', borderRadius: [3, 3, 0, 0] }, data: points.map(e => e.Count) }
				]
			},
			true
		)
		scoreChart.resize()
	} else if (scoreChart) {
		scoreChart.dispose()
		scoreChart = null
	}
}

// 假设列表或时间线变化后重渲染（图表容器仅存在于假设验证页签内）
watch(scoreTrend, () => {
	if (activeTab.value === 'forecast') nextTick(renderScoreChart)
})

// 分组对比（维度切换；仅展示有判定数据的分组）
const groupDim = ref<'BySource' | 'ByType' | 'ByHeld' | 'ByTerm' | 'ByDirection'>('BySource')
const groupRows = computed<IZdxForecastGroupStat[]>(() => {
	const groups = stats.value?.Groups
	if (!groups) return []
	return (groups[groupDim.value] ?? []).filter(e => e.Verified > 0)
})

// ---------- 详情弹层 ----------
const detailVisible = ref(false)
const detailItem = ref<IZdxForecastCenterItem | null>(null)
const detailChartRef = ref<HTMLElement>()
const detailRulesRef = ref<{ open: (sec?: string) => void } | null>(null)
let detailChart: echarts.ECharts | null = null

function openDetail(row: IZdxForecastCenterItem) {
	detailItem.value = row
	detailVisible.value = true
}

// 详情“得分构成”项点击 → 打开评分规则弹层并定位到对应维度
function openDetailRules(sec: string) {
	detailRulesRef.value?.open(sec)
}

function renderDetailChart() {
	const items = detailItem.value?.VerifyItems ?? []
	if (!detailChartRef.value || !items.length) return
	if (!detailChart) detailChart = echarts.init(detailChartRef.value)
	detailChart.setOption(
		{
			grid: { left: 54, right: 20, top: 34, bottom: 26 },
			tooltip: { trigger: 'axis' },
			legend: { top: 2, itemWidth: 12, itemHeight: 8, textStyle: { fontSize: 11 } },
			xAxis: { type: 'category', data: items.map(e => dayjs(e.Date).format('MM-DD')), axisLabel: { fontSize: 11 } },
			yAxis: { type: 'value', scale: true, axisLabel: { fontSize: 11, formatter: (v: number) => v.toFixed(2) } },
			series: [
				{ name: '预测价', type: 'line', symbolSize: 4, lineStyle: { type: 'dashed', width: 2 }, itemStyle: { color: '#409eff' }, data: items.map(e => e.Predict) },
				{ name: '实际收盘', type: 'line', symbolSize: 4, lineStyle: { width: 2 }, itemStyle: { color: '#f56c6c' }, data: items.map(e => e.Actual) },
				{ name: '实际最高', type: 'line', symbolSize: 3, lineStyle: { width: 1.5, type: 'dotted' }, itemStyle: { color: '#e6a23c' }, data: items.map(e => (e.High ?? 0) > 0 ? e.High : null) }
			]
		},
		true
	)
	detailChart.resize()
}

// ---------- 新建假设 ----------
const createVisible = ref(false)
const createMode = ref<'form' | 'draw'>('form')
const dialogCode = ref('')
const dialogStock = ref<StockOption | null>(null)
const stockOptions = ref<StockOption[]>([])
const stockLoading = ref(false)
const latestClose = ref<number | null>(null)
const drawForecasts = ref<IZdxStockForecast[]>([])
const saving = ref(false)

const formDirection = ref(1)
const formTargetPrice = ref<number | null>(null)
const formAmpPct = ref<number | null>(null)
const formTargetDate = ref('')
const formType = ref<number | null>(null)
const formReason = ref('')
const maxHoldingDays = 120

const minTargetMs = dayjs().add(1, 'day').startOf('day').valueOf()
const maxTargetMs = dayjs().add(maxHoldingDays, 'day').startOf('day').valueOf()

// 同股进行中假设（保存将覆盖）
const activeExisting = computed(() => !!dialogCode.value && centerList.value.some(e => e.StockCode === dialogCode.value && e.Status === 1))

function openCreate(presetCode?: string, mode: 'form' | 'draw' = 'form') {
	createVisible.value = true
	createMode.value = presetCode ? mode : 'form'
	dialogCode.value = ''
	dialogStock.value = null
	stockOptions.value = []
	latestClose.value = null
	drawForecasts.value = []
	formDirection.value = 1
	formTargetPrice.value = null
	formAmpPct.value = null
	formTargetDate.value = dayjs().add(7, 'day').format('YYYY-MM-DD')
	formType.value = null
	formReason.value = ''
	if (presetCode) {
		const known = centerList.value.find(e => e.StockCode === presetCode)
		dialogStock.value = { Code: presetCode, Name: known?.StockName || presetCode }
		stockOptions.value = [dialogStock.value]
		dialogCode.value = presetCode
		onStockChange(presetCode)
	}
}

function onCreateClosed() {
	drawForecasts.value = []
}

async function searchStocks(keyword: string) {
	const kw = (keyword ?? '').trim()
	if (!kw) {
		stockOptions.value = []
		return
	}
	stockLoading.value = true
	try {
		const page = await zdxApi.getPageStockDatas({ Keyword: kw }, 1, 30)
		stockOptions.value = (page?.Items ?? []).map(s => ({ Code: s.Code, Name: s.Name }))
	} catch {
		stockOptions.value = []
	} finally {
		stockLoading.value = false
	}
}

async function onStockChange(code: string) {
	latestClose.value = null
	dialogStock.value = stockOptions.value.find(s => s.Code === code) ?? null
	if (!code) return
	if (!dialogStock.value) {
		const known = centerList.value.find(e => e.StockCode === code)
		dialogStock.value = { Code: code, Name: known?.StockName || code }
	}
	// 最新收盘（日K倒序第一条；表单基准价/画图无该数据不影响）
	try {
		const page = await zdxApi.getKlineDatas('day', 'none', { Code: code }, 1, 1)
		const item = (page?.Items ?? [])[0]
		if (item && typeof item.ClosePrice === 'number') {
			latestClose.value = item.ClosePrice
			if (createMode.value === 'form') applyDirection()
		}
	} catch {
		latestClose.value = null
	}
	if (createMode.value === 'draw') {
		try {
			drawForecasts.value = (await zdxApi.getForecastList(code, 'day')) ?? []
		} catch {
			drawForecasts.value = []
		}
	}
}

// ---------- 表单快捷：方向/目标价/幅度联动 ----------
function round2(v: number) {
	return Math.round(v * 100) / 100
}

function applyDirection() {
	if (latestClose.value === null) return
	const base = latestClose.value
	if (formDirection.value === 1) formTargetPrice.value = round2(base * 1.05)
	else if (formDirection.value === -1) formTargetPrice.value = round2(base * 0.95)
	else formTargetPrice.value = round2(base)
	syncAmpFromPrice()
}

function syncAmpFromPrice() {
	if (latestClose.value && formTargetPrice.value) {
		formAmpPct.value = round2(((formTargetPrice.value - latestClose.value) / latestClose.value) * 100)
	}
}

function syncPriceFromAmp() {
	if (latestClose.value && formAmpPct.value !== null && formAmpPct.value !== undefined) {
		formTargetPrice.value = round2(latestClose.value * (1 + formAmpPct.value / 100))
	}
}

function disabledTargetDate(date: Date) {
	const t = dayjs(date).startOf('day').valueOf()
	return t < minTargetMs || t > maxTargetMs
}

async function submitForm() {
	if (!dialogCode.value) {
		ElMessage.warning('请先选择股票')
		return
	}
	if (latestClose.value === null) {
		ElMessage.warning('未取到该股最新收盘价，无法生成假设（请确认日K数据已同步）')
		return
	}
	if (!formTargetPrice.value || formTargetPrice.value <= 0) {
		ElMessage.warning('目标价必须大于 0')
		return
	}
	if (!formTargetDate.value || formTargetDate.value <= dayjs().format('YYYY-MM-DD')) {
		ElMessage.warning('目标日期需晚于今天')
		return
	}
	if ((formReason.value ?? '').length > 500) {
		ElMessage.warning('假设理由不能超过 500 字')
		return
	}
	if (activeExisting.value) {
		try {
			await ElMessageBox.confirm('该股票已有进行中假设，保存将覆盖更新（原假设的判定记录将被重置）。是否继续？', '覆盖进行中假设', {
				confirmButtonText: '覆盖保存',
				cancelButtonText: '取消',
				type: 'warning'
			})
		} catch {
			return
		}
	}
	saving.value = true
	try {
		await zdxApi.saveForecast({
			StockCode: dialogCode.value,
			Period: 'day',
			Anchors: [
				{ Date: dayjs().format('YYYY-MM-DD'), Price: latestClose.value },
				{ Date: formTargetDate.value, Price: formTargetPrice.value }
			],
			Source: 2,
			HypothesisType: formType.value ?? null,
			Reason: formReason.value?.trim() || undefined
		})
		ElMessage.success('假设已保存（表单快捷）')
		createVisible.value = false
		await refreshAll()
	} catch (err: any) {
		ElMessage.error(err?.message || '保存失败')
	} finally {
		saving.value = false
	}
}

// ---------- 画图路径：图上锚点编辑保存 ----------
async function onDrawSave(anchors: IZdxForecastAnchor[]) {
	if (!dialogCode.value) return
	try {
		await zdxApi.saveForecast({ StockCode: dialogCode.value, Period: 'day', Anchors: anchors, Source: 1 })
		ElMessage.success('假设已保存（画图路径）')
		createVisible.value = false
		await refreshAll()
	} catch (err: any) {
		ElMessage.error(err?.message || '保存失败')
	}
}

// ---------- 删除 ----------
async function onDelete(row: IZdxForecastCenterItem) {
	try {
		await ElMessageBox.confirm(`确认删除「${row.StockName || row.StockCode}」的该条假设（${row.StartDate} ~ ${row.EndDate}）？`, '删除假设', {
			confirmButtonText: '删除',
			cancelButtonText: '取消',
			type: 'warning'
		})
	} catch {
		return
	}
	try {
		await zdxApi.delForecast(row.Id)
		ElMessage.success('假设已删除')
		await refreshAll()
	} catch (err: any) {
		ElMessage.error(err?.message || '删除失败')
	}
}

// ---------- 假设台账：行操作（下拉菜单分发） ----------
function onRowCommand(cmd: string, row: IZdxForecastCenterItem) {
	if (cmd === 'detail') openDetail(row)
	else if (cmd === 'redraw') openCreate(row.StockCode, 'draw')
	else if (cmd === 'delete') onDelete(row)
}

// ---------- 长线目标：新建对话框 ----------
// 常用期限档位（交易日；0=自定义，用输入框天数）
const FC_LONG_PRESETS = [20, 60, 120, 250]
const longVisible = ref(false)
const longCode = ref('')
const longStock = ref<StockOption | null>(null)
const longClose = ref<number | null>(null)
const longChoice = ref<number>(60)
const longCustomDays = ref('')
const longPrice = ref<number | null>(null)
const longSaving = ref(false)

// 目标天数取值（自定义档解析输入，非法返回 0）
const longDaysValue = computed(() => (longChoice.value === 0 ? Math.floor(Number(longCustomDays.value)) || 0 : longChoice.value))

// 实时预览（涨幅提示；红=可保存，橙=须高于最新收盘）
const longPreviewText = computed(() => {
	if (longClose.value === null || !longPrice.value || longPrice.value <= 0) return ''
	const pct = ((longPrice.value - longClose.value) / longClose.value) * 100
	if (pct > 0) return `较最新收盘 +${pct.toFixed(2)}%`
	return `须高于最新收盘 ${longClose.value.toFixed(2)}`
})
const longPreviewOk = computed(() => longClose.value !== null && !!longPrice.value && longPrice.value > longClose.value)

function openLongCreate() {
	longVisible.value = true
	longCode.value = ''
	longStock.value = null
	longClose.value = null
	longChoice.value = 60
	longCustomDays.value = ''
	longPrice.value = null
	stockOptions.value = []
}

async function onLongStockChange(code: string) {
	longClose.value = null
	longStock.value = stockOptions.value.find(s => s.Code === code) ?? null
	if (!code) return
	if (!longStock.value) longStock.value = { Code: code, Name: code }
	// 最新收盘（日K倒序第一条；保存时后端还会再次按最新日K校正起点）
	try {
		const page = await zdxApi.getKlineDatas('day', 'none', { Code: code }, 1, 1)
		const item = (page?.Items ?? [])[0]
		if (item && typeof item.ClosePrice === 'number') longClose.value = item.ClosePrice
	} catch {
		longClose.value = null
	}
}

// 长线目标相对起点涨幅（%）
function longPct(row: IZdxStockForecastLong) {
	const base = Number(row.BasePrice)
	return base > 0 ? ((Number(row.TargetPrice) - base) / base) * 100 : 0
}

async function submitLong() {
	if (!longCode.value) {
		ElMessage.warning('请先选择股票')
		return
	}
	const days = longDaysValue.value
	if (!days || days < 1 || days > 500) {
		ElMessage.warning('目标天数需为 1~500 的整数')
		return
	}
	if (longClose.value === null) {
		ElMessage.warning('未取到该股最新收盘价，无法登记目标（请确认日K数据已同步）')
		return
	}
	if (!longPrice.value || longPrice.value <= longClose.value) {
		ElMessage.warning('目标价须高于最新收盘价')
		return
	}
	longSaving.value = true
	try {
		await zdxApi.saveForecastLong({ StockCode: longCode.value, Days: days, TargetPrice: longPrice.value })
		ElMessage.success('长线目标已保存（同股同期限已覆盖更新）')
		longVisible.value = false
		await loadCenterLong()
	} catch (err: any) {
		ElMessage.error(err?.message || '保存失败')
	} finally {
		longSaving.value = false
	}
}

async function onDeleteLong(row: IZdxStockForecastLong) {
	try {
		await ElMessageBox.confirm(`确认删除「${row.StockName || row.StockCode}」的 ${row.Days} 交易日目标（目标价 ${Number(row.TargetPrice).toFixed(2)} 元）？`, '删除长线目标', {
			confirmButtonText: '删除',
			cancelButtonText: '取消',
			type: 'warning'
		})
	} catch {
		return
	}
	try {
		await zdxApi.delForecastLong(row.Id)
		ElMessage.success('长线目标已删除')
		await loadCenterLong()
	} catch (err: any) {
		ElMessage.error(err?.message || '删除失败')
	}
}

// ---------- 数值格式化 ----------
// 金额（保留两位；sign=true 时正数带 + 号）
function fmtAmount(v?: number | null, sign = false) {
	const n = Number(v)
	if (!isFinite(n)) return '--'
	return (sign && n > 0 ? '+' : '') + n.toFixed(2)
}

// 百分比（保留两位；null 返回 --；sign=true 时正数带 + 号）
function fmtPct(v?: number | null, sign = true) {
	if (v === null || v === undefined) return '--'
	const n = Number(v)
	if (!isFinite(n)) return '--'
	return (sign && n > 0 ? '+' : '') + n.toFixed(2) + '%'
}

// 验证价格口径文案（1=收盘价 2=日内最高价）
function basisLabel(basis?: number | null) {
	return basis === 2 ? '日内最高价' : '收盘价'
}

// 对照口径（主口径的另一侧；未判定时按收盘价）
function altBasis(item: { VerifyPriceBasis?: number | null }) {
	return item.VerifyPriceBasis === 2 ? 1 : 2
}

// 价格单元格（存量明细无最高价字段时反序列化为 0；非正值视为缺失显示 --）
function fmtPriceCell(v?: number | null) {
	if (v === null || v === undefined) return '--'
	const n = Number(v)
	return isFinite(n) && n > 0 ? n.toFixed(2) : '--'
}

// ---------- 扣分说明（悬浮提示：按验证口径复算，不改变后端判定结果） ----------
interface ForecastDeductCtx {
	predictAmp: number
	actualAmp: number
	diffAmp: number
	maxOff: { v: number; date: string } | null
	adverse: { v: number; date: string } | null
}

// 价格口径（useAlt=对照口径时取另一侧；与后端双口径语义一致）
function rowBasis(row: IZdxForecastCenterItem, useAlt = false) {
	const main = row.VerifyPriceBasis === 2 ? 2 : 1
	return useAlt ? (main === 2 ? 1 : 2) : main
}

// 幅度方向文案（|幅度| ≤ 0.5% 视为持平，与后端一致）
function ampDirLabel(amp: number) {
	if (amp > 0.5) return '看涨'
	if (amp < -0.5) return '看跌'
	return '持平'
}

// 复算终端幅度与逐日偏移（明细缺失返回 null；公式与后端 EvaluatePriceBasis 一致）
function forecastDeductCtx(row: IZdxForecastCenterItem, useAlt = false): ForecastDeductCtx | null {
	const items = row.VerifyItems ?? []
	const anchors = row.Anchors ?? []
	if (!items.length || anchors.length < 2) return null
	const start = Number(anchors[0].Price)
	const endAnchor = Number(anchors[anchors.length - 1].Price)
	if (!(start > 0)) return null
	const byHigh = rowBasis(row, useAlt) === 2
	const last = items[items.length - 1]
	const actualEnd = byHigh && Number(last.High) > 0 ? Number(last.High) : Number(last.Actual)
	const predictAmp = ((endAnchor - start) / start) * 100
	const actualAmp = ((actualEnd - start) / start) * 100
	let maxOff: { v: number; date: string } | null = null
	let adverse: { v: number; date: string } | null = null
	for (const it of items) {
		const v = byHigh ? Number(it.DiffHigh ?? it.Diff) : Number(it.Diff)
		if (!isFinite(v)) continue
		if (!maxOff || Math.abs(v) > Math.abs(maxOff.v)) maxOff = { v, date: it.Date }
		// 逆向偏离：日内预测价不低于起点（看多）时实际低 5% 以上，反之同理
		const predict = Number(it.Predict)
		if (!adverse && (predict >= start ? v < -5 : v > 5)) adverse = { v, date: it.Date }
	}
	return { predictAmp, actualAmp, diffAmp: Math.abs(actualAmp) - Math.abs(predictAmp), maxOff, adverse }
}

// 总分扣分明细（悬浮分数：列出未满分维度及原因；明细缺失时退化提示）
function scoreDeductItems(row: IZdxForecastCenterItem, useAlt = false): string[] {
	const dir = useAlt ? row.AltHitDirection : row.HitDirection
	const ampCls = useAlt ? row.AltAmplitudeClass : row.AmplitudeClass
	const pathCls = useAlt ? row.AltPathClass : row.PathClass
	const dirScore = forecastDirectionScore(dir)
	const ctx = forecastDeductCtx(row, useAlt)
	const lines: string[] = []
	if (!ctx) return [`按${basisLabel(rowBasis(row, useAlt))}口径判定（明细缺失，仅展示结果）`]
	if (!dirScore) lines.push(`方向未中 −40：预测${ampDirLabel(ctx.predictAmp)}，实际${ampDirLabel(ctx.actualAmp)}`)
	const ampScore = forecastAmplitudeScore(ampCls)
	if (!dirScore) lines.push('幅度未计分：方向未中，本项 0 分')
	else if (ampScore > 0 && ampScore < 30) {
		const over = ctx.diffAmp > 0
		lines.push(`幅度${over ? '超越' : '不及'} −10：实际终端幅度较预测${over ? '多' : '少'} ${Math.abs(ctx.diffAmp).toFixed(1)}pp`)
	}
	const pathScore = forecastPathScore(pathCls)
	if (pathScore === 20 && ctx.maxOff) {
		lines.push(`路径轻微偏移 −10：${fmtTime(ctx.maxOff.date, 'MM-DD')} 实际较预测${ctx.maxOff.v > 0 ? '高' : '低'} ${Math.abs(ctx.maxOff.v).toFixed(2)}%`)
	} else if (pathScore === 10 && ctx.adverse) {
		lines.push(`路径不利偏移 −20：${fmtTime(ctx.adverse.date, 'MM-DD')} 实际较预测${ctx.adverse.v > 0 ? '高' : '低'} ${Math.abs(ctx.adverse.v).toFixed(2)}%`)
	} else if (pathScore === 0) {
		lines.push('路径反向 −30：终端方向与实际相反')
	}
	if (!lines.length) lines.push('三项满分，无扣分')
	return lines
}

// 单个维度零分原因（悬浮置灰分值）
function dimReason(row: IZdxForecastCenterItem, dim: 'dir' | 'amp' | 'path', useAlt = false): string {
	const dir = useAlt ? row.AltHitDirection : row.HitDirection
	const pathCls = useAlt ? row.AltPathClass : row.PathClass
	const ctx = forecastDeductCtx(row, useAlt)
	const basisName = basisLabel(rowBasis(row, useAlt))
	if (dim === 'dir') {
		if (!ctx) return '方向未中（明细缺失）'
		return `方向未中：预测${ampDirLabel(ctx.predictAmp)}，实际${ampDirLabel(ctx.actualAmp)}（${basisName}口径）`
	}
	if (dim === 'amp') {
		if (!forecastDirectionScore(dir)) return '幅度不计分：方向未中，本项 0 分'
		if (ctx) {
			const over = ctx.diffAmp > 0
			return `幅度${over ? '超越' : '不及'}：实际终端幅度较预测${over ? '多' : '少'} ${Math.abs(ctx.diffAmp).toFixed(1)}pp，得 20 分`
		}
		return '幅度未得满分（明细缺失）'
	}
	if (pathCls === 4) return '路径反向：终端方向与实际相反（0 分）'
	if (pathCls === 3 && ctx?.adverse) return `路径不利偏移：${fmtTime(ctx.adverse.date, 'MM-DD')} 实际较预测${ctx.adverse.v > 0 ? '高' : '低'} ${Math.abs(ctx.adverse.v).toFixed(2)}%，得 10 分`
	return '未得分（详见评分规则）'
}

// 股票排行：名次徽章与指标分档着色
function rankCls(idx: number) {
	return idx === 0 ? 'is-gold' : idx === 1 ? 'is-silver' : idx === 2 ? 'is-bronze' : ''
}

function rateCls(rate: number) {
	return rate >= 60 ? 'is-good' : rate >= 40 ? 'is-mid' : 'is-low'
}

function scoreCls(score: number) {
	return score >= 80 ? 'is-good' : score >= 60 ? 'is-mid' : 'is-low'
}

// 红涨绿跌色调（正=up 红 / 负=down 绿）
function toneCls(v?: number | null) {
	if (v === null || v === undefined) return ''
	const n = Number(v)
	if (n > 0) return 'up'
	if (n < 0) return 'down'
	return ''
}
</script>

<style lang="scss" scoped>
.stock-review {
	display: flex;
	flex-direction: column;
	gap: 16px;

	.up {
		color: var(--el-color-danger);
	}

	.down {
		color: var(--el-color-success);
	}

	.muted {
		color: var(--el-text-color-placeholder);
	}

	// ---------- 页头（蓝紫渐变横幅，与交易画像一致） ----------
	.sr-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 14px;
		padding: 20px 24px;
		border-radius: 18px;
		position: relative;
		overflow: hidden;
		background: linear-gradient(135deg, #4a7ef7 0%, #6c63f0 55%, #7c5cf0 100%);
		box-shadow: 0 8px 22px rgba(74, 126, 247, 0.26);

		// 装饰光斑（右上）
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

		// 装饰光斑（右下）
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

	.sr-head-left {
		display: flex;
		align-items: center;
		gap: 14px;
		min-width: 0;
		position: relative;
		z-index: 1;
	}

	.sr-head-badge {
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

	.sr-head-title {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.sr-title-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
	}

	.sr-title {
		font-size: 20px;
		font-weight: 700;
		color: #fff;
		letter-spacing: 0.5px;
	}

	// 标题横栏的闭环主题胶囊（渐变横幅上的半透明胶囊）
	.sr-style-chip {
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
	}

	.sr-sub {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.78);
	}

	.sr-head-right {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: none;
		position: relative;
		z-index: 1;
	}

	// 页头按钮：半透明玻璃描边
	.sr-ghost-btn {
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

	// 页头主按钮：白色实底
	.sr-new-btn {
		background: #fff;
		border-color: #fff;
		color: #5a6cf0;
		font-weight: 600;

		&:hover,
		&:focus {
			background: rgba(255, 255, 255, 0.9);
			border-color: rgba(255, 255, 255, 0.9);
			color: #4a7ef7;
		}
	}

	// 时间线（六页签统一口径切换；悬浮于页签头白卡右端）
	.sr-tl {
		position: absolute;
		top: 0;
		right: 18px;
		height: 46px;
		display: flex;
		align-items: center;
		gap: 8px;
		z-index: 2;

		.sr-tl-info {
			display: inline-flex;
			align-items: center;
			font-size: 13px;
			color: var(--el-text-color-placeholder);
			cursor: help;

			&:hover {
				color: var(--el-color-primary);
			}
		}
	}

	// 策略诊断带（常驻顶部：概览胶囊 + 改进方向 + 流派徽章 + 待办 + KPI 周趋势）
	.sr-diag {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	// 概览胶囊格（诊断带顶部白卡行）
	.sr-overview {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 8px;
		padding: 12px 14px;
		border: 1px solid rgba(228, 233, 245, 0.9);
		border-radius: 14px;
		background: #fff;
		box-shadow: 0 2px 12px rgba(31, 45, 61, 0.05);
	}

	// 六页签容器：页签头白卡化 + 内容区与页签头保持 16px 呼吸间距（时间线定位参照层）
	.sr-tabs-wrap {
		position: relative;
	}

	.sr-tabs {
		:deep(.el-tabs__header) {
			margin: 0;
			padding: 0 420px 0 18px;
			border: 1px solid rgba(228, 233, 245, 0.9);
			border-radius: 14px;
			background: #fff;
			box-shadow: 0 2px 12px rgba(31, 45, 61, 0.05);
		}

		:deep(.el-tabs__content) {
			margin-top: 16px;
		}

		:deep(.el-tabs__nav-wrap::after) {
			display: none;
		}

		:deep(.el-tabs__item) {
			height: 46px;
			line-height: 46px;
			padding: 0 16px;
			font-size: 13px;
		}

		:deep(.el-tab-pane) {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}
	}

	// 表格统一主题：淡边框 + 浅灰表头 + 柔和悬浮行（含子组件内表格）
	:deep(.el-table) {
		--el-table-border-color: #eef1f7;
		--el-table-header-bg-color: #fafbfd;
		--el-table-row-hover-bg-color: #f5f8ff;
		border-radius: 10px;

		.el-table__cell {
			padding: 8px 0;
		}
	}

	.sr-tab-label {
		display: inline-flex;
		align-items: center;
		gap: 6px;

		svg {
			font-size: 12px;
		}
	}

	.sr-tab-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		margin-left: 2px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 600;
		line-height: 1;
		color: #7c5cf0;
		background: rgba(124, 92, 240, 0.12);
	}

	.tkv {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
		padding: 12px 14px;
		border-radius: 10px;
		background: #f8faff;
		border: 1px solid #ecf1fa;
	}

	.t-k {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	.t-v {
		font-size: 16px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--el-text-color-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		&.v-blue {
			color: #409eff;
		}

		&.v-violet {
			color: #7c5cf0;
		}

		&.v-red {
			color: var(--el-color-danger);
		}

		&.v-green {
			color: var(--el-color-success);
		}

		&.v-orange {
			color: #e6a23c;
		}
	}

	// 通用白卡（参考交易画像 bp-card）
	.sr-card {
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

	.sr-card-title {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		row-gap: 8px;
		font-size: 14px;
		font-weight: 700;
		color: #303133;
		min-height: 26px;
	}

	// 卡片标题文字（防挤压折行）
	.sr-title-text {
		white-space: nowrap;
	}

	// 卡片标题右侧说明
	.sr-title-note {
		margin-left: auto;
		font-size: 12px;
		font-weight: 400;
		color: var(--el-text-color-secondary);
		white-space: nowrap;
	}

	// 卡片标题小图标（tone 色调，与交易画像一致）
	.sr-mini-ico {
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
	}

	// 台账：筛选行（浅色托盘，控件成组不散落）
	.sr-filter {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		padding: 10px 12px;
		border-radius: 10px;
		background: #f8fafd;
		border: 1px solid #eef1f8;
	}

	// 台账：列样式
	// 股票列（两行结构：名称 + 持仓标记 / 代码）
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
	}

	.tk-sum {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.tk-sum-top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 8px;
	}

	.tk-path {
		font-size: 12px;
		color: var(--el-text-color-regular);
		font-variant-numeric: tabular-nums;
	}

	.tk-reason {
		width: 100%;
		font-size: 12px;
		color: var(--el-text-color-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tk-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.tk-range {
		font-size: 12px;
		color: var(--el-text-color-regular);
		font-variant-numeric: tabular-nums;
	}

	.tk-status {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}

	.tk-score {
		font-size: 12px;
		font-weight: 600;
		color: var(--el-text-color-primary);
		font-variant-numeric: tabular-nums;
	}

	.tk-wait {
		font-size: 12px;
		color: var(--el-text-color-placeholder);
	}

	.tk-verdicts {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 10px;
		width: 100%;
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	// 假设台账：三维得分明细徽标（+40 等；零分置灰）
	.tk-pt {
		margin-left: 4px;
		font-weight: 600;
		color: var(--el-text-color-primary);
		font-variant-numeric: tabular-nums;

		&.is-zero {
			color: var(--el-text-color-placeholder);
		}
	}

	.tk-time {
		font-size: 12px;
		color: var(--el-text-color-secondary);
		font-variant-numeric: tabular-nums;
	}

	// 股票排行：名次徽章 / 命中率色点 / 平均分分档
	.rk-no {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 7px;
		font-size: 12px;
		font-weight: 600;
		color: #8f95a3;
		background: #f3f5f9;
		font-variant-numeric: tabular-nums;
	}

	.rk-no.is-gold {
		color: #8a5200;
		background: linear-gradient(135deg, #ffe3a3, #f7c948);
		box-shadow: 0 1px 4px rgba(247, 201, 72, 0.45);
	}

	.rk-no.is-silver {
		color: #5b6b82;
		background: linear-gradient(135deg, #eef2f8, #c9d4e3);
		box-shadow: 0 1px 4px rgba(160, 176, 198, 0.35);
	}

	.rk-no.is-bronze {
		color: #7a4a1e;
		background: linear-gradient(135deg, #f8ddc0, #e2a76f);
		box-shadow: 0 1px 4px rgba(226, 167, 111, 0.35);
	}

	.rk-rate {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.rk-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
		opacity: 0.85;
	}

	.rk-rate.is-good {
		color: var(--el-color-success);
	}

	.rk-rate.is-mid {
		color: var(--el-color-warning);
	}

	.rk-rate.is-low {
		color: var(--el-color-danger);
	}

	.rk-score {
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		color: #409eff;
	}

	.rk-score.is-good {
		color: var(--el-color-success);
	}

	.rk-score.is-mid {
		color: #409eff;
	}

	.rk-score.is-low {
		color: #e6a23c;
	}

	// 假设台账：操作下拉按钮（紧凑）
	.tk-act-btn {
		padding: 4px 6px;
	}

	.tk-caret {
		margin-left: 3px;
		font-size: 10px;
	}

	// 长线目标台账：标题行新建按钮
	.lk-add-btn {
		margin-left: 10px;
	}

	// 长线/实盘台账：辅助样式
	.lk-days {
		font-size: 12px;
		color: var(--el-text-color-regular);
		font-variant-numeric: tabular-nums;
	}

	.lk-target {
		font-size: 12px;
		font-weight: 600;
		color: #303133;
		font-variant-numeric: tabular-nums;
	}

	.lk-pct {
		font-size: 12px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.lk-num {
		font-size: 12px;
		color: var(--el-text-color-regular);
		font-variant-numeric: tabular-nums;
	}

	// 长线目标对话框：自定义天数输入
	.lk-days-in {
		width: 90px;
		margin-left: 10px;
	}

	// 长线目标对话框：涨幅预览（up=可保存 / warn=须高于收盘）
	.lk-preview {
		font-size: 13px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;

		&.warn {
			color: #e6a23c;
		}
	}

	// 统计分析网格（月度趋势 / 滚动校准 / 分组对比 / 股票排行）
	.sr-stats-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 14px;
	}

	.gr-switch {
		margin-left: auto;
	}

	.chart-box {
		width: 100%;
		height: 300px;
	}

	// 平均分走势（假设台账内置图表：浅托盘 + 标题行，随全局时间线联动）
	.sr-score-wrap {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 12px 14px;
		border-radius: 12px;
		background: #f8fafd;
		border: 1px solid #eef1f8;

		.sr-score-head {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.sr-score-chart {
			height: 240px;
		}
	}

	// 详情
	.dt-body {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.dt-head {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.dt-range {
		font-size: 12px;
		color: var(--el-text-color-secondary);
		font-variant-numeric: tabular-nums;
	}

	.dt-score {
		margin-left: auto;
		font-size: 13px;
		font-weight: 600;
		color: var(--el-text-color-primary);
	}

	.dt-basis {
		font-size: 12px;
		padding: 2px 8px;
		border-radius: 8px;
		color: var(--el-color-primary);
		background: var(--el-color-primary-light-9);
		border: 1px solid var(--el-color-primary-light-7);
	}

	.dt-alt {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 14px;
		padding: 8px 12px;
		font-size: 12px;
		color: var(--el-text-color-secondary);
		background: #fafbfc;
		border: 1px dashed var(--el-border-color-lighter);
		border-radius: 10px;
	}

	.dt-alt-title {
		font-weight: 600;
		color: var(--el-text-color-regular);
	}

	.dt-alt-item b {
		font-weight: 600;
		color: var(--el-text-color-primary);
	}

	.dt-verdicts {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
	}

	.dt-v-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 12px 6px;
		background: #f7f8fa;
		border-radius: 12px;
	}

	.dt-v-label {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	.dt-v-value {
		font-size: 16px;
		font-weight: 600;
		color: var(--el-text-color-primary);
	}

	// 详情：三维得分明细徽标（+40 等；零分置灰）
	.dt-pt {
		margin-left: 4px;
		font-size: 12px;
		font-style: normal;
		font-weight: 600;
		color: var(--el-text-color-primary);
		font-variant-numeric: tabular-nums;

		&.is-zero {
			color: var(--el-text-color-placeholder);
		}
	}

	// 详情：得分构成条（方向 + 幅度 + 路径 = 总分；右侧评分规则入口）
	.dt-scoreline {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 8px;
		padding: 8px 12px;
		font-size: 12px;
		color: var(--el-text-color-secondary);
		background: var(--el-color-primary-light-9);
		border: 1px solid var(--el-color-primary-light-8);
		border-radius: 10px;

		.dt-sl-title {
			margin-right: 4px;
			font-weight: 600;
			color: var(--el-text-color-regular);
		}

		.dt-sl-item b {
			font-size: 12px;
			color: var(--el-text-color-primary);
			font-variant-numeric: tabular-nums;
		}

		.dt-sl-op {
			color: var(--el-text-color-placeholder);
		}

		.dt-sl-total {
			font-size: 13px;
			font-weight: 700;
			color: var(--el-text-color-primary);
		}

		.dt-sl-rules {
			margin-left: auto;
		}

		// 点击定位到评分规则对应维度
		.dt-sl-click {
			cursor: pointer;
			padding: 1px 4px;
			margin: 0 -2px;
			border-radius: 6px;
			transition: background 0.2s;

			&:hover {
				background: rgba(64, 158, 255, 0.12);
			}
		}
	}

	.dt-chart-title {
		font-size: 12px;
		color: var(--el-text-color-secondary);
		margin-bottom: 6px;
	}

	.dt-mini {
		height: 220px;
	}

	.dt-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 16px;
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	.dt-reason {
		font-size: 13px;
		color: var(--el-text-color-regular);
		background: #f7f8fa;
		border-radius: 10px;
		padding: 8px 12px;
	}

	// 新建假设对话框
	.cf-stock-row {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
		margin-bottom: 12px;
	}

	.cf-stock-info {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;

		.cf-code {
			font-size: 12px;
			color: #a7abba;
		}

		.cf-price {
			color: #409eff;
			font-variant-numeric: tabular-nums;
		}

		.cf-loading {
			color: var(--el-text-color-placeholder);
			font-size: 12px;
		}
	}

	.cf-overwrite {
		font-size: 12px;
		color: #e6a23c;
		background: #fdf6ec;
		padding: 3px 10px;
		border-radius: 999px;
	}

	.cf-mode {
		margin-bottom: 14px;
	}

	.cf-form {
		:deep(.el-form-item) {
			margin-bottom: 14px;
		}
	}

	.cf-link {
		margin: 0 10px;
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	.cf-unit {
		margin-left: 6px;
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	.cf-tip {
		margin-left: 10px;
		font-size: 12px;
		color: var(--el-text-color-placeholder);
	}

	.cf-draw {
		:deep(.quote-chart) {
			margin-bottom: 0;

			.chart {
				height: 460px;
			}
		}
	}

	// ---------- 实盘台账：验证视图 ----------
	.sr-tip-inline {
		margin-left: auto;
		font-size: 12px;
		color: var(--el-text-color-placeholder);
	}

	// 结果统计面板（实盘台账：胶囊横排，随全局时间线联动）
	.lv-stats {
		display: grid;
		grid-template-columns: repeat(9, minmax(0, 1fr));
		gap: 8px;
		padding: 10px 12px;
		border-radius: 12px;
		background: #f8fafd;
		border: 1px solid #eef1f8;

		.lv-stat {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 2px;
			min-width: 0;
		}

		.lv-s-label {
			font-size: 12px;
			color: var(--el-text-color-secondary);
			white-space: nowrap;
		}

		.lv-s-value {
			font-size: 15px;
			font-weight: 700;
			font-variant-numeric: tabular-nums;
			color: var(--el-text-color-primary);
			white-space: nowrap;

			&.v-red {
				color: var(--el-color-danger);
			}

			&.v-green {
				color: var(--el-color-success);
			}

			&.up {
				color: var(--el-color-danger);
			}

			&.down {
				color: var(--el-color-success);
			}
		}
	}

	.lv-double {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;

		&.lv-right {
			align-items: flex-end;
			text-align: right;
		}
	}

	.lv-line {
		font-size: 12px;
		color: var(--el-text-color-regular);
		font-variant-numeric: tabular-nums;
	}

	.lv-status {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 3px;
	}

	.lv-sub {
		font-size: 12px;
		color: var(--el-text-color-secondary);
		font-variant-numeric: tabular-nums;
	}

	// 长线台账验证结果：已达成（翡翠绿反白徽标） / 到期未达成（红字）
	.lv-ok {
		display: inline-block;
		padding: 1px 8px;
		border-radius: 999px;
		font-size: 12px;
		color: #fff;
		background: linear-gradient(135deg, #34c38f, #2aa678);
		font-variant-numeric: tabular-nums;
	}

	.lv-bad {
		display: inline-block;
		padding: 1px 8px;
		border-radius: 999px;
		font-size: 12px;
		color: #cf1322;
		background: #fff1f0;
		font-variant-numeric: tabular-nums;
	}

	// 详情弹层：四格验证卡（宽内容）
	.lv-verdicts {
		grid-template-columns: repeat(4, 1fr);
	}

	// ---------- 交易绩效（五子卡） ----------
	// 卡1 核心指标（浅色托盘 + 白色子卡横排，与筛选托盘同系）
	.pf-hero {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 10px;
		padding: 12px;
		border-radius: 14px;
		background: #f8fafd;
		border: 1px solid #eef1f7;
	}

	.pf-hero-cell {
		display: flex;
		flex-direction: column;
		gap: 5px;
		min-width: 0;
		padding: 10px 12px;
		border-radius: 10px;
		background: #fff;
		border: 1px solid rgba(228, 233, 245, 0.95);
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.04);
	}

	.pf-h-label {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	.pf-h-value {
		font-size: 20px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: #303133;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.pf-h-sub {
		font-size: 12px;
		line-height: 1.5;
		color: #9aa3b5;
	}

	// 子卡双列网格
	.pf-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}

	.pf-panel {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px 14px;
		border-radius: 12px;
		background: #fafbfd;
		border: 1px solid rgba(228, 233, 245, 0.9);
	}

	.pf-span2 {
		grid-column: span 2;
	}

	.pf-panel-title {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 700;
		color: #303133;
	}

	.pf-panel-note {
		font-size: 12px;
		font-weight: 400;
		color: var(--el-text-color-secondary);
	}

	.pf-attr-switch {
		margin-left: auto;
	}

	// 卡2：盈亏分布指标格 + 分布条
	.pf-metrics {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}

	.pf-metric {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px 10px;
		border-radius: 9px;
		background: #fff;
		border: 1px solid rgba(228, 233, 245, 0.9);
	}

	.pf-m-label {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	.pf-m-value {
		font-size: 14px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: #303133;
	}

	.pf-bar {
		display: flex;
		height: 8px;
		border-radius: 999px;
		overflow: hidden;
		background: var(--el-fill-color-lighter);
	}

	.pf-bar-win {
		background: linear-gradient(90deg, #f78989, #f56c6c);
		transition: width 0.4s;
	}

	.pf-bar-loss {
		background: linear-gradient(90deg, #95d475, #67c23a);
		transition: width 0.4s;
	}

	.pf-bar-legend {
		display: flex;
		justify-content: space-between;
		font-size: 12px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.pf-ratio {
		font-size: 13px;
		font-variant-numeric: tabular-nums;
	}

	// ---------- 预测 vs 实盘 ----------
	.vs-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 320px;
		gap: 14px;
		align-items: start;
	}

	.vs-val {
		font-size: 12px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: #303133;
	}

	.vs-insights {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px 14px;
		border-radius: 12px;
		background: linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%);
		border: 1px solid rgba(64, 158, 255, 0.14);
	}

	.vs-insights-title {
		font-size: 12px;
		font-weight: 700;
		color: #409eff;
	}

	.vs-tip {
		position: relative;
		padding-left: 10px;
		font-size: 12px;
		line-height: 1.6;
		color: var(--el-text-color-regular);

		&::before {
			content: "•";
			position: absolute;
			left: 0;
			color: #7c5cf0;
		}
	}

	// 窄屏
	@media (max-width: 1300px) {
		.sr-overview {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.sr-stats-grid {
			grid-template-columns: minmax(0, 1fr);
		}

		.pf-hero {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.pf-grid {
			grid-template-columns: minmax(0, 1fr);
		}

		.pf-span2 {
			grid-column: span 1;
		}

		.vs-grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
}
</style>

<style lang="scss">
// el-tooltip teleport 到 body，需非 scoped 全局样式（扣分原因气泡）
.sr-tip-pop {
	max-width: 300px;

	.stp-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.stp-line {
		font-size: 12px;
		line-height: 1.6;
	}
}
</style>
