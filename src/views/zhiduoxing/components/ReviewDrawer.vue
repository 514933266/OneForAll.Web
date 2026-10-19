<template>
	<el-drawer v-model="visible" size="50%" :destroy-on-close="true" direction="rtl" class="ofa-drawer review-drawer">
		<template #header>
			<div class="rd-header">
				<span class="rd-badge"><font-awesome-icon fas icon="pen-ruler"></font-awesome-icon></span>
				<div class="rd-head-info">
					<span class="rd-title">{{ titleText }}</span>
					<span v-if="ctx" class="rd-range">{{ rangeText }}</span>
				</div>
			</div>
		</template>

		<div v-loading="loading" class="rd-body">
			<!-- 类型与日期切换（个股复盘固定，不显示） -->
			<div v-if="!isStock" class="rd-toolbar">
				<el-radio-group v-model="curType" size="small" @change="load">
					<el-radio-button v-for="t in ZDX_REVIEW_TYPES.filter(t => t.value !== 4)" :key="t.value" :value="t.value">{{ t.label }}</el-radio-button>
				</el-radio-group>
				<el-date-picker
					v-model="curDate"
					type="date"
					size="small"
					placeholder="选择日期"
					format="YYYY-MM-DD"
					value-format="YYYY-MM-DD"
					:clearable="false"
					:disabled-date="disabledFutureDate"
					style="width: 150px"
					@change="load"
				></el-date-picker>
			</div>

			<!-- 上期复盘（时间上最近的一条更早笔记；展示上期计划并手动触发 AI 回归验证，验证结果落库上期笔记；无则隐藏） -->
			<div v-if="ctx?.PrevNote?.Id" class="rd-prev-plan">
				<div class="rpp-head">
					<font-awesome-icon fas icon="clipboard-list" class="rpp-icon"></font-awesome-icon>
					<span class="rpp-title">上期复盘</span>
					<span v-if="ctx.PrevNote.ReviewDate" class="rpp-date">{{ fmtDate(ctx.PrevNote.ReviewDate) }}</span>
					<span v-if="!prevScoreData" class="rd-tpl-btn" @click="onScorePrev">{{ prevScoreLoading ? 'AI 验证中...' : 'AI 回归验证' }}</span>
				</div>
				<div v-if="ctx.PrevNote.PlanContent" class="rpp-text">{{ ctx.PrevNote.PlanContent }}</div>
				<div v-else class="rpp-text is-empty">（上期未填写后续计划）</div>
				<div v-if="prevScoreData" class="rd-score" :class="scoreCls(prevScoreData.Score)">
					<div class="rds-head">
						<span class="rds-num">{{ prevScoreData.Score }}</span>
						<span class="rds-unit">分</span>
						<span class="rds-grade">{{ scoreGradeText(prevScoreData.Score) }}</span>
						<span class="rds-tag">AI 回归验证</span>
						<span v-if="prevScoreData.Time" class="rds-time">{{ fmtScoreTime(prevScoreData.Time) }}</span>
					</div>
					<div class="rds-text">{{ prevScoreData.Text || '--' }}</div>
				</div>
			</div>

			<!-- 当日行情（个股复盘：复盘日不复权开/收/高/低/涨跌幅/全天振幅；无该日行情不显示） -->
			<div v-if="isStock && dayQuote" class="rd-section">
				<div class="rd-sec-title">
					当日行情
					<span class="rd-sec-note">不复权</span>
				</div>
				<div class="rd-quote">
					<div class="rq-group">
						<div class="rq-grid">
							<div class="rq-item">
								<span class="rq-label">开盘价</span>
								<span class="rq-value">{{ dayQuote.Open.toFixed(2) }}</span>
							</div>
							<div class="rq-item">
								<span class="rq-label">收盘价</span>
								<span class="rq-value">{{ dayQuote.Close.toFixed(2) }}</span>
							</div>
							<div class="rq-item">
								<span class="rq-label">最高价</span>
								<span class="rq-value">{{ dayQuote.High.toFixed(2) }}</span>
							</div>
							<div class="rq-item">
								<span class="rq-label">最低价</span>
								<span class="rq-value">{{ dayQuote.Low.toFixed(2) }}</span>
							</div>
							<div class="rq-item">
								<span class="rq-label">当日均价</span>
								<span class="rq-value">{{ dayExtra.Avg > 0 ? dayExtra.Avg.toFixed(2) : '--' }}</span>
							</div>
						</div>
					</div>
					<div class="rq-group">
						<div class="rq-grid">
							<div class="rq-item">
								<span class="rq-label">当日涨跌幅</span>
								<span class="rq-value" :class="changeClass(dayQuote.Change ?? undefined)">{{ fmtPct(dayQuote.Change) }}</span>
							</div>
							<div class="rq-item">
								<span class="rq-label">全天振幅</span>
								<span class="rq-value">{{ fmtPct(dayQuote.Amp, false) }}</span>
							</div>
							<div class="rq-item">
								<span class="rq-label">近5日涨跌幅</span>
								<span class="rq-value" :class="changeClass(dayExtra.Chg5 ?? undefined)">{{ fmtPct(dayExtra.Chg5) }}</span>
							</div>
							<div class="rq-item">
								<span class="rq-label">近20日涨跌幅</span>
								<span class="rq-value" :class="changeClass(dayExtra.Chg20 ?? undefined)">{{ fmtPct(dayExtra.Chg20) }}</span>
							</div>
						</div>
					</div>
					<div class="rq-group">
						<div class="rq-grid">
							<div class="rq-item">
								<span class="rq-label">成交量</span>
								<span class="rq-value">{{ dayExtra.Vol > 0 ? dayExtra.Vol.toFixed(2) + ' 万手' : '--' }}</span>
							</div>
							<el-tooltip placement="top" effect="light" :show-after="100">
								<template #content>
									<div class="rq-vol-tip">
										<div class="rvt-title">量能档位评定规则<span>复盘日成交量 ÷ 近N日均量</span></div>
										<div v-for="r in VOL_LEVEL_RULES" :key="r.label" class="rvt-row" :class="{ cur: r.label === dayExtra.VolLevel.label }">
											<span class="rvt-range">{{ r.range }}</span>
											<span class="rvt-name" :class="r.cls">{{ r.label }}</span>
										</div>
										<div class="rvt-now">当前：较5日均量 {{ dayExtra.VolRatio5 > 0 ? dayExtra.VolRatio5.toFixed(2) + ' 倍' : '--' }}（{{ dayExtra.VolLevel.label }}） · 较20日均量 {{ dayExtra.VolRatio20 > 0 ? dayExtra.VolRatio20.toFixed(2) + ' 倍' : '--' }}</div>
									</div>
								</template>
								<div class="rq-item rq-vol">
									<span class="rq-label">量能档位 <font-awesome-icon fas icon="circle-info" class="rq-vol-icon"></font-awesome-icon></span>
									<span class="rq-value" :class="dayExtra.VolLevel.cls">{{ dayExtra.VolLevel.label }}</span>
									<span class="rq-sub">{{ dayExtra.VolLevel.sub }}</span>
								</div>
							</el-tooltip>
						</div>
					</div>
				</div>
			</div>

			<!-- 支撑/压力位（个股复盘；手动设置优先，未手动时按最近未回补缺口自动计算；可调整/恢复自动） -->
			<div v-if="isStock && priceLevel" class="rd-section">
				<div class="rd-sec-title">
					支撑 / 压力位
					<span class="rd-sec-note">不复权口径 · {{ priceLevel.supportManual || priceLevel.resistManual ? '含手动设置' : '缺口自动计算' }}</span>
					<span v-if="!lvEditing" class="rd-lv-edit" @click="startLvEdit">
						<font-awesome-icon fas icon="pen" class="rd-lv-edit-icon"></font-awesome-icon>
						调整
					</span>
				</div>
				<div v-if="!lvEditing" class="rd-level">
					<div class="rl-item">
						<span class="rl-label">
							支撑位
							<em class="rl-badge" :class="{ auto: !priceLevel.supportManual }">{{ priceLevel.supportManual ? '手动' : '自动' }}</em>
						</span>
						<span class="rl-value">{{ priceLevel.support > 0 ? priceLevel.support.toFixed(2) : '--' }}</span>
						<span class="rl-sub" :class="changeClass(priceLevel.supportPct ?? undefined)">距现价 {{ fmtPct(priceLevel.supportPct) }}</span>
					</div>
					<div class="rl-item">
						<span class="rl-label">
							压力位
							<em class="rl-badge" :class="{ auto: !priceLevel.resistManual }">{{ priceLevel.resistManual ? '手动' : '自动' }}</em>
						</span>
						<span class="rl-value">{{ priceLevel.resist > 0 ? priceLevel.resist.toFixed(2) : '--' }}</span>
						<span class="rl-sub" :class="changeClass(priceLevel.resistPct ?? undefined)">距现价 {{ fmtPct(priceLevel.resistPct) }}</span>
					</div>
				</div>
				<div v-else class="rd-level-edit">
					<div class="rle-row">
						<span class="rle-label">支撑位</span>
						<el-input v-model="lvSupportInput" size="small" style="width: 150px" :placeholder="lvAutoValue(true) > 0 ? '自动 ' + lvAutoValue(true).toFixed(2) : '留空=自动'" />
					</div>
					<div class="rle-row">
						<span class="rle-label">压力位</span>
						<el-input v-model="lvResistInput" size="small" style="width: 150px" :placeholder="lvAutoValue(false) > 0 ? '自动 ' + lvAutoValue(false).toFixed(2) : '留空=自动'" />
					</div>
					<div class="rle-tip">按不复权价格填写；留空保存=恢复按缺口自动计算</div>
					<div class="rle-actions">
						<el-button size="small" type="primary" :loading="lvSaving" @click="saveLvEdit">保存</el-button>
						<el-button size="small" :disabled="lvSaving" @click="lvEditing = false">取消</el-button>
						<el-button size="small" plain :disabled="lvSaving" @click="resetLvToAuto">恢复自动</el-button>
					</div>
				</div>
			</div>

			<!-- 日内分时走势（复盘日；含当天买卖点；无分时数据时提示） -->
			<div v-if="isStock && dayQuote" class="rd-section">
				<div class="rd-sec-title">
					日内分时
					<span class="rd-sec-note">含当天买卖点</span>
				</div>
				<div class="rd-trend">
					<div v-if="hasTrend" ref="trendEl" class="rd-trend-chart"></div>
					<div v-else class="rd-trend-empty">该日暂无分时数据（分时数据自 2026-09-29 起全量存底）</div>
				</div>
			</div>

			<!-- 成交汇总（个股=当日口径，无成交不显示；日/周/月=区间口径） -->
			<div v-if="summaryItems.length" class="rd-summary">
				<div v-for="it in summaryItems" :key="it.label" class="rs-item">
					<span class="rs-label">{{ it.label }}</span>
					<span class="rs-value" :class="it.cls">{{ it.value }}</span>
					<span v-if="it.sub" class="rs-sub">{{ it.sub }}</span>
				</div>
			</div>

			<!-- 区间交易记录（日/周/月复盘；个股复盘由下方“当日操作复盘”呈现） -->
			<div v-if="!isStock" class="rd-section">
				<div class="rd-sec-title">区间交易（{{ ctx?.Records.length ?? 0 }} 笔）</div>
				<div v-if="ctx?.Records.length" class="rd-records">
					<div v-for="r in ctx.Records" :key="r.Id" class="rd-record">
						<span class="rr-date">{{ fmtDate(r.TradeDate) }}</span>
						<el-tag size="small" :type="catTag(r.Category)" effect="plain">{{ r.CategoryName || catLabel(r.Category) }}</el-tag>
						<span class="rr-stock">{{ r.StockCode }} {{ r.StockName }}</span>
						<span class="rr-vol">{{ r.Volume ? fmtVolume(r.Volume) + ' 股' : '' }}</span>
						<span class="rr-amount">{{ r.Amount ? fmtMoney(r.Amount) : fmtMoney(r.CashAmount, true) }}</span>
					</div>
				</div>
				<el-empty v-else description="本区间无交易记录" :image-size="60"></el-empty>
			</div>

			<!-- 个股交易数据（交易画像口径：胜率/盈亏比/平均盈亏/累计盈亏；无交易记录不显示） -->
			<div v-if="isStock && hasStat" class="rd-section">
				<div class="rd-sec-title">
					个股交易数据
					<span class="rd-sec-note">来自交易画像</span>
				</div>
				<div class="rd-stats">
					<div class="rs-item">
						<span class="rs-label">累计净盈亏</span>
						<span class="rs-value" :class="changeClass(tradeStat.RealizedProfit)">{{ fmtMoney(tradeStat.RealizedProfit, true) }}</span>
						<span class="rs-sub">最近成交 {{ tradeStat.LastTradeDate ? fmtDate(tradeStat.LastTradeDate) : '--' }}</span>
					</div>
					<div class="rs-item">
						<span class="rs-label">胜率</span>
						<span class="rs-value" :class="tradeStat.SellCount ? (tradeStat.WinRate >= 50 ? 'up' : 'down') : ''">
							{{ tradeStat.SellCount ? tradeStat.WinRate.toFixed(1) + '%' : '--' }}
						</span>
						<span class="rs-sub">盈利 {{ tradeStat.WinSellCount }} / 亏损 {{ tradeStat.SellCount - tradeStat.WinSellCount }} 笔</span>
					</div>
					<div class="rs-item">
						<span class="rs-label">盈亏比</span>
						<span class="rs-value">{{ profitRatioText }}</span>
						<span class="rs-sub">均盈 {{ fmtMoney(tradeStat.AvgProfit) }} / 均亏 {{ fmtMoney(tradeStat.AvgLoss) }}</span>
					</div>
					<div class="rs-item">
						<span class="rs-label">买入 / 卖出总额</span>
						<span class="rs-value">{{ fmtMoney(tradeStat.BuyAmount) }} / {{ fmtMoney(tradeStat.SellAmount) }}</span>
						<span class="rs-sub">共 {{ tradeStat.TradeCount }} 笔（买 {{ tradeStat.BuyCount }} / 卖 {{ tradeStat.SellCount }}）</span>
					</div>
				</div>
			</div>

			<!-- 当日买卖与成本（个股复盘：当天有买卖才显示；按方向合并成块 + 逐笔说明与最低盈利预测） -->
			<div v-if="isStock && dealNotes.length" class="rd-section">
				<div class="rd-sec-title">
					当日买卖与成本（{{ dealNotes.length }} 笔）
					<span v-if="mpTotal.Filled" class="rd-mp-total">
						预测盈利合计 <b :class="changeClass(mpTotal.Sum)">{{ fmtMoney(mpTotal.Sum, true) }} 元</b>
						<span v-if="mpTotal.Filled < mpTotal.Total" class="rd-mp-total-sub">（{{ mpTotal.Filled }}/{{ mpTotal.Total }} 笔）</span>
					</span>
					<el-radio-group v-model="curMpMode" size="small" class="rd-mp-switch">
						<el-radio-button value="pct">收益率 %</el-radio-button>
						<el-radio-button value="amount">金额 ¥</el-radio-button>
					</el-radio-group>
				</div>

				<!-- 当前持仓成本参考（有持仓时显示；复盘历史日期时为最新持仓口径） -->
				<div v-if="position && position.Volume > 0" class="rd-pos">
					<span class="rp-title">当前持仓</span>
					<span class="rp-item"><b>{{ fmtVolume(position.Volume) }}</b> 股</span>
					<span class="rp-item">成本 <b>{{ position.AvgCost.toFixed(3) }}</b></span>
					<span class="rp-item">现价 <b>{{ position.Price ? position.Price.toFixed(2) : '--' }}</b></span>
					<span class="rp-item">
						浮盈 <b :class="changeClass(position.FloatProfit)">{{ fmtMoney(position.FloatProfit, true) }}</b>
						<i class="rp-pct" :class="changeClass(position.FloatProfitPercent)">{{ position.FloatProfitPercent > 0 ? '+' : '' }}{{ position.FloatProfitPercent.toFixed(2) }}%</i>
					</span>
				</div>

				<!-- 买入（当天多笔买入合并为一块展示） -->
				<div v-if="buyDeals.length" class="rd-deal-group is-buy">
					<div class="rdg-head">
						<span class="rdg-badge">买入</span>
						<span class="rdg-sum">
							{{ buyDeals.length }} 笔 · 共 {{ fmtVolume(buySum.Volume) }} 股 · 金额 {{ fmtMoney(buySum.Amount) }} 元 · 费用 {{ fmtMoney(buySum.Fee) }} 元
						</span>
					</div>
					<div v-for="d in buyDeals" :key="d.Record.Id" class="rdg-row">
						<div class="rdg-info">
							<span class="rdg-time">{{ fmtTime(d.Record) }}</span>
							<span>{{ d.Record.Price.toFixed(2) }} × {{ fmtVolume(d.Record.Volume) }} 股 ≈ {{ fmtMoney(d.Record.Amount) }} 元</span>
							<span class="rdg-fee">费用 {{ fmtMoney(feeOf(d.Record)) }} 元</span>
							<span class="rdg-cost">含费成本 <b>{{ buyUnitCost(d.Record).toFixed(3) }}</b> 元/股</span>
							<span class="rdg-bal">成交后持仓 {{ fmtVolume(d.Record.ShareBalance) }} 股</span>
						</div>
						<div class="rdg-form">
							<el-input v-model="d.Note" size="small" maxlength="200" placeholder="操作说明：买入依据、时机把握、执行情况..."></el-input>
							<div class="rdg-mp">
								<el-input v-model="d.MinProfit" size="small" class="rdg-mp-input" :placeholder="mpMode === 'amount' ? '最低盈利（元）' : '最低盈利（%）'"></el-input>
								<el-input v-model="d.Days" size="small" class="rdg-mp-days" placeholder="天数" maxlength="3"></el-input>
								<span v-if="mpConvText(d)" class="rdg-mp-conv">{{ mpConvText(d) }}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- 卖出（当天多笔卖出合并为一块展示） -->
				<div v-if="sellDeals.length" class="rd-deal-group is-sell">
					<div class="rdg-head">
						<span class="rdg-badge">卖出</span>
						<span class="rdg-sum">
							{{ sellDeals.length }} 笔 · 共 {{ fmtVolume(sellSum.Volume) }} 股 · 金额 {{ fmtMoney(sellSum.Amount) }} 元 · 费用 {{ fmtMoney(sellSum.Fee) }} 元
							<b v-if="refCost > 0" :class="changeClass(sellSum.RefProfit)">浮动盈亏 {{ fmtMoney(sellSum.RefProfit, true) }} 元</b>
						</span>
					</div>
					<div v-for="d in sellDeals" :key="d.Record.Id" class="rdg-row">
						<div class="rdg-info">
							<span class="rdg-time">{{ fmtTime(d.Record) }}</span>
							<span>{{ d.Record.Price.toFixed(2) }} × {{ fmtVolume(d.Record.Volume) }} 股 ≈ {{ fmtMoney(d.Record.Amount) }} 元</span>
							<span class="rdg-fee">费用 {{ fmtMoney(feeOf(d.Record)) }} 元</span>
							<template v-if="refCost > 0">
								<span class="rdg-cost">参考成本 <b>{{ refCost.toFixed(3) }}</b> 元/股</span>
								<span class="rdg-ref" :class="changeClass(sellRefProfit(d.Record))">浮动盈亏 {{ fmtMoney(sellRefProfit(d.Record), true) }} 元</span>
							</template>
							<span v-else class="rdg-fee">暂无持仓成本参考</span>
							<span class="rdg-bal">成交后持仓 {{ fmtVolume(d.Record.ShareBalance) }} 股</span>
						</div>
						<div class="rdg-form">
							<el-input v-model="d.Note" size="small" maxlength="200" placeholder="操作说明：卖出依据、时机把握、执行情况..."></el-input>
							<div class="rdg-mp">
								<el-input v-model="d.MinProfit" size="small" class="rdg-mp-input" :placeholder="mpMode === 'amount' ? '最低盈利（元）' : '最低盈利（%）'"></el-input>
								<el-input v-model="d.Days" size="small" class="rdg-mp-days" placeholder="天数" maxlength="3"></el-input>
								<span v-if="mpConvText(d)" class="rdg-mp-conv">{{ mpConvText(d) }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 盈利预测（基于持仓成本与复盘日收盘的隔天情景；结合进行中走势预测；无持仓仍展示档位目标价） -->
			<div v-if="forecastModel" class="rd-section">
				<div class="rd-sec-title">
					盈利预测
					<span class="rd-sec-note">{{ forecastModel.HasPos ? '按当前持仓口径估算' : '未持仓 · 档位目标价参考' }}</span>
					<span class="rd-tpl-btn" @click="openSteps">档位设置</span>
				</div>
				<div class="rd-pf">
					<div class="rd-pf-head">
						<template v-if="forecastModel.HasPos">
							<span>持仓 <b>{{ fmtVolume(forecastModel.Vol) }}</b> 股</span>
							<span>含费成本 <b>{{ forecastModel.Cost.toFixed(3) }}</b></span>
						</template>
						<span v-else>当前未持仓（仅展示档位目标价）</span>
						<span>复盘日收盘 <b>{{ forecastModel.Close.toFixed(2) }}</b></span>
					</div>
					<div v-if="forecastModel.HasPos" class="rd-pf-be" :class="forecastModel.BePct > 0 ? 'is-need-up' : 'is-profit'">
						<template v-if="forecastModel.BePct > 0">
							<font-awesome-icon fas icon="arrow-trend-up" class="rd-pf-be-icon"></font-awesome-icon>
							回本最低涨幅 <b>+{{ forecastModel.BePct.toFixed(2) }}%</b>
							<span class="rd-pf-be-sub">含费回本价 {{ forecastModel.BePrice.toFixed(2) }} 元（见下方走势预测图虚线）</span>
						</template>
						<template v-else>
							<font-awesome-icon fas icon="circle-check" class="rd-pf-be-icon"></font-awesome-icon>
							当前净浮盈 <b :class="changeClass(forecastModel.FloatProfit)">{{ fmtMoney(forecastModel.FloatProfit, true) }} 元</b>
							<span class="rd-pf-be-sub">成本低于收盘 {{ Math.abs(forecastModel.BePct).toFixed(2) }}%，已含卖出费用估算</span>
						</template>
					</div>
					<div class="rd-pf-list">
						<div v-for="r in forecastModel.Rows" :key="r.Pct" class="rd-pf-row">
							<span class="rd-pf-pct" :class="changeClass(r.Pct)">{{ r.Pct > 0 ? '+' : '' }}{{ r.Pct }}%</span>
							<span class="rd-pf-price">目标价 {{ r.Price.toFixed(2) }}</span>
							<span class="rd-pf-gross">浮盈 <b :class="changeClass(r.Gross)">{{ r.Gross === undefined ? '--' : fmtMoney(r.Gross, true) }}</b></span>
							<span class="rd-pf-profit">净盈亏 <b :class="changeClass(r.Profit)">{{ r.Profit === undefined ? '--' : fmtMoney(r.Profit, true) }}</b></span>
						</div>
					</div>
					<div v-if="forecastModel.Forecast" class="rd-pf-fc">
						<font-awesome-icon fas icon="chart-line" class="rd-pf-fc-icon"></font-awesome-icon>
						进行中预测目标 {{ forecastModel.Forecast.Price.toFixed(2) }} 元（{{ fmtPct(forecastModel.Forecast.Pct) }}）
						<template v-if="forecastModel.Forecast.Profit !== undefined">
							→ 预估净盈利 <b :class="changeClass(forecastModel.Forecast.Profit)">{{ fmtMoney(forecastModel.Forecast.Profit, true) }} 元</b>
						</template>
					</div>
					<div class="rd-pf-note">
						{{ forecastModel.HasPos ? `净盈亏已扣卖出费用估算（${rateText}）：净盈亏 =（目标价 − 含费成本）× 持仓数量 − 卖出费用，仅供参考` : '未持仓暂不测算盈亏；持仓后自动按含费成本计算浮盈与净盈亏' }}
					</div>
				</div>
			</div>

			<!-- 走势预测 × 技术形态（合并卡：近20日K线 + 预测K线虚线 + AI形态识别；形态附K线小图） -->
			<div v-if="isStock && dayQuote" class="rd-section">
				<div class="rd-sec-title">
					走势预测 × 技术形态
					<span class="rd-sec-note">近 20 个交易日 · 预测K线虚线</span>
					<span v-if="!fcEditing" class="rd-tpl-btn" @click="openForecastEdit">{{ activeForecast ? '修改预测' : '画走势预测' }}</span>
				</div>
				<div class="rd-tech">
					<!-- 组合K线图：近期日K（红涨绿跌）+ 预测K线（虚线）+ 回本价参考线 -->
					<template v-if="dayKlines.length">
						<div ref="techChartEl" class="rd-tech-chart"></div>
						<div class="rd-tech-legend">
							<span class="rtl-item"><i class="rtl-ic rtl-candle"></i>近期日K（红涨绿跌）</span>
							<span class="rtl-item"><i class="rtl-ic rtl-dash"></i>预测走势（实体K线·「预」标记）</span>
							<span v-if="forecastModel && forecastModel.BePct > 0" class="rtl-item">
								<i class="rtl-ic rtl-line"></i>回本价 {{ forecastModel.BePrice.toFixed(2) }}（最低需涨 +{{ forecastModel.BePct.toFixed(2) }}%）
							</span>
							<span v-if="priceLevel && priceLevel.support > 0" class="rtl-item">
								<i class="rtl-ic rtl-line-sup"></i>支撑 {{ priceLevel.support.toFixed(2) }}
							</span>
							<span v-if="priceLevel && priceLevel.resist > 0" class="rtl-item">
								<i class="rtl-ic rtl-line-res"></i>压力 {{ priceLevel.resist.toFixed(2) }}
							</span>
						</div>
					</template>
					<div v-else class="rd-tech-empty">暂无日K数据，无法绘制走势图</div>

					<!-- 进行中预测摘要（存在进行中预测时） -->
					<div v-if="activeForecast && !fcEditing" class="rd-fc-now">
						<span class="rfn-badge">进行中</span>
						<span class="rfn-range">{{ fmtDate(activeForecast.StartDate) }} ~ {{ fmtDate(activeForecast.EndDate) }}</span>
						<span class="rfn-target">终点目标价 <b>{{ fcEndTarget.Price.toFixed(2) }}</b> 元</span>
						<b class="rfn-pct" :class="changeClass(fcEndTarget.Pct)">{{ fmtPct(fcEndTarget.Pct) }}</b>
						<el-button size="small" type="danger" plain class="rfn-del" :loading="fcDeleting" @click="onDelForecast">删除</el-button>
					</div>
					<div v-else-if="!fcEditing" class="rd-fc-empty">暂无进行中预测：点击「画走势预测」人工绘制，或进入编辑用 AI 生成</div>

					<!-- 预测编辑（预测 1~5 天可选；逐日填写预测K线四价：开/高/低/收；右侧形态小图可拖拽调整K线） -->
					<div v-if="fcEditing" class="rd-fc-edit">
						<div class="rfe-base">
							<span class="rfe-base-label">起点（最新收盘）</span>
							<b>{{ fcBasePrice.toFixed(2) }} 元</b>
							<span class="rfe-days">
								<span class="rfe-days-label">预测天数</span>
								<el-radio-group v-model="fcDays" size="small" @change="onFcDaysChange">
									<el-radio-button v-for="d in 5" :key="d" :value="d">{{ d }} 日</el-radio-button>
								</el-radio-group>
							</span>
							<span class="rfe-base-note">首点由最新日K收盘自动校正 · 虚线随输入实时更新</span>
						</div>
						<div class="rfe-grid">
							<div class="rfe-head">
								<span class="rfe-day">日</span>
								<span class="rfe-date">日期</span>
								<span class="rfe-col">开盘</span>
								<span class="rfe-col">最高</span>
								<span class="rfe-col">最低</span>
								<span class="rfe-col">收盘</span>
								<span class="rfe-pct">较基准</span>
								<span class="rfe-mini-h">形态</span>
							</div>
							<div v-for="(r, i) in fcRows" :key="r.Date" class="rfe-row" :class="{ 'is-bad': fcRowBad(r) }" :title="fcRowBad(r) ? '需四项齐全且 最低 ≤ 开盘/收盘 ≤ 最高（均为正数）' : ''">
								<span class="rfe-day">第{{ i + 1 }}日</span>
								<span class="rfe-date">{{ fmtDate(r.Date) }}</span>
								<el-input v-model="r.O" size="small" class="rfe-input" placeholder="开盘"></el-input>
								<el-input v-model="r.H" size="small" class="rfe-input" placeholder="最高"></el-input>
								<el-input v-model="r.L" size="small" class="rfe-input" placeholder="最低"></el-input>
								<el-input v-model="r.C" size="small" class="rfe-input" placeholder="收盘"></el-input>
								<span class="rfe-pct" :class="changeClass(fcRowPct(r))">{{ fcPctText(r) }}</span>
								<span class="rfe-mini" :title="fcMiniAt(i).valid ? '拖动K线实体平移整根 · 拖动上下影线端点调最高/最低' : '四项齐全后显示形态小图（可拖拽调整）'">
									<svg v-if="fcMiniAt(i).valid" class="rfm-svg" viewBox="0 0 44 44" @mousedown="onFcMiniDown($event, i)">
										<line x1="22" :y1="fcMiniAt(i).wickTop" x2="22" :y2="fcMiniAt(i).wickBottom" :class="fcMiniAt(i).up ? 'rfm-up' : 'rfm-down'"></line>
										<rect x="16" :y="fcMiniAt(i).bodyY" width="12" :height="fcMiniAt(i).bodyH" rx="1.5" :class="fcMiniAt(i).up ? 'rfm-up' : 'rfm-down'"></rect>
										<circle cx="22" :cy="fcMiniAt(i).wickTop" r="2.6" class="rfm-handle"></circle>
										<circle cx="22" :cy="fcMiniAt(i).wickBottom" r="2.6" class="rfm-handle"></circle>
									</svg>
									<span v-else class="rfm-empty">--</span>
								</span>
							</div>
						</div>
						<div v-if="aiForecastComment" class="rfe-ai-comment">AI：{{ aiForecastComment }}</div>
						<div class="rfe-foot">
							<span class="rfe-tip">开/高/低/收四项组成一根预测K线，可只填部分日；右侧形态小图可拖拽调整（拖实体平移整根K线、拖上下端点调最高/最低）</span>
							<div class="rfe-btns">
								<el-button size="small" :loading="aiForecastLoading" @click="onAiForecast">
									<font-awesome-icon fas icon="wand-magic-sparkles" class="rd-btn-icon"></font-awesome-icon>
									AI 生成
								</el-button>
								<el-button size="small" @click="fcEditing = false">取消</el-button>
								<el-button size="small" type="primary" :loading="fcSaving" @click="onSaveForecast">保存预测</el-button>
							</div>
						</div>
					</div>

					<!-- 长线目标价（里程碑式：N 个交易日内到达目标收盘价；收盘价口径自动判定） -->
					<div class="rd-fl">
						<div class="rd-fl-head">
							<span class="rd-fl-title">长线目标价</span>
							<span class="rd-fl-note">里程碑 · 交易日口径 · 收盘价自动判定</span>
						</div>
						<div v-if="forecastLongs.length" class="rd-fl-list">
							<div v-for="f in forecastLongs" :key="f.Id" class="rd-fl-row">
								<span class="rd-fl-days">{{ f.Days }} 个交易日内</span>
								<b class="rd-fl-price">{{ f.TargetPrice.toFixed(2) }} 元</b>
								<span class="rd-fl-pct" :class="changeClass(flPct(f))">{{ fmtPct(flPct(f)) }}</span>
								<span class="rd-fl-base">起点 {{ f.BasePrice.toFixed(2) }}（{{ fmtDate(f.StartDate) }}）</span>
								<span v-if="f.Status === 2" class="rd-fl-st" :title="f.HitDate ? `${fmtDate(f.HitDate)} 达标 · 第 ${f.HitDays} 交易日` : '已达成'">已达成</span>
								<span v-else-if="f.Status === 3" class="rd-fl-st is-bad">未达成</span>
								<span class="rd-fl-del" @click="onDelForecastLong(f)">删除</span>
							</div>
						</div>
						<div v-else class="rd-fl-empty">暂无长线目标：选择期限并填写目标收盘价，记录中长线预期（收盘价达标自动判定，复盘中心可查历史）</div>
						<div class="rd-fl-add">
							<el-radio-group v-model="flChoice" size="small">
								<el-radio-button v-for="d in FC_LONG_PRESETS" :key="d" :value="d">{{ d }} 日</el-radio-button>
								<el-radio-button :value="0">自定义</el-radio-button>
							</el-radio-group>
							<el-input v-if="flChoice === 0" v-model="flCustomDays" size="small" class="rd-fl-in is-days" placeholder="天数" maxlength="3"></el-input>
							<el-input v-model="flPrice" size="small" class="rd-fl-in is-price" placeholder="目标收盘价" maxlength="10"></el-input>
							<span v-if="flPreviewText" class="rd-fl-preview">{{ flPreviewText }}</span>
							<el-button size="small" type="primary" :loading="flSaving" @click="onSaveForecastLong">保存目标</el-button>
						</div>
					</div>

					<!-- AI 形态识别子块（近 20 个交易日；附对应K线小图；结果保存到云端，支持人工调整/删除） -->
					<div class="rd-tech-patterns">
						<div class="rd-tp-head">
							<span class="rd-tp-title"><font-awesome-icon fas icon="shapes" class="rd-tp-icon"></font-awesome-icon>AI 形态识别</span>
							<span class="rd-tp-note">对照形态知识库 · 附对应K线小图</span>
							<span class="rd-tpl-btn" @click="onAiPattern">{{ aiPatternLoading ? '识别中...' : (aiPatternDone ? '重新识别' : 'AI 识别') }}</span>
						</div>
						<div v-if="aiPatternLoading" class="rd-patterns-tip">AI 正在识别近 20 个交易日的 K 线形态...</div>
						<div v-else-if="aiPatternItems.length" class="rd-patterns">
							<div v-for="(p, i) in aiPatternItems" :key="p.Id" class="rdp-row">
								<svg v-if="patternMini(i).candles.length" class="rdp-k" :viewBox="`0 0 ${patternMini(i).viewW} 44`" preserveAspectRatio="xMidYMid meet">
									<rect v-if="patternMini(i).bandX >= 0" :x="patternMini(i).bandX" y="1" :width="patternMini(i).bandW" height="42" rx="3" class="rdp-k-band"></rect>
									<template v-for="(c, ci) in patternMini(i).candles" :key="ci">
										<line :x1="c.cx" :y1="c.wickTop" :x2="c.cx" :y2="c.wickBottom" :class="c.up ? 'rdp-k-up' : 'rdp-k-down'"></line>
										<rect :x="c.x" :y="c.bodyY" width="7" :height="c.bodyH" rx="1" :class="c.up ? 'rdp-k-up' : 'rdp-k-down'"></rect>
									</template>
								</svg>
								<div class="rdp-main">
									<div class="rdp-line">
										<span class="rdp-name">{{ p.Name }}</span>
										<el-tag size="small" :type="p.Direction === 1 ? 'danger' : p.Direction === 2 ? 'success' : 'info'" effect="plain">{{ patternDirText(p.Direction) }}</el-tag>
										<span v-if="p.Source === 2" class="rdp-src">人工</span>
										<span class="rdp-date">{{ patternDateText(p) }}</span>
										<span class="rdp-acts">
											<span class="rdp-act" @click="openPatternEdit(p)">编辑</span>
											<span class="rdp-act is-del" @click="onDelPattern(p)">删除</span>
										</span>
									</div>
									<div class="rdp-desc" :title="p.Description">{{ p.Description || '--' }}</div>
								</div>
							</div>
							<div v-if="aiPatternAt" class="rd-patterns-tip">识别时间 {{ aiPatternAt }} · 结果已保存到云端，可调整或删除</div>
							<div v-else class="rd-patterns-tip">识别结果已保存到云端，可调整或删除（重新识别会替换 AI 识别项）</div>
						</div>
						<div v-else-if="aiPatternDone" class="rd-patterns-tip">近 20 个交易日未识别出明显 K 线形态</div>
						<div v-else class="rd-patterns-tip">点击「AI 识别」分析近 20 个交易日出现的 K 线形态（识别结果自动保存，可调整或删除）</div>
					</div>
				</div>
			</div>

			<!-- 技术面复盘（个股复盘；「AI 复盘分析」一键生成技术面/情绪面/复盘笔记/后续计划四段初稿） -->
			<div v-if="isStock" class="rd-section">
				<div class="rd-sec-title">
					技术面复盘
					<span class="rd-tpl-btn" @click="onAiAnalyze">{{ aiAnalyzeLoading ? 'AI 分析中...' : 'AI 复盘分析（自动填充四段）' }}</span>
				</div>
				<el-input
					v-model="techText"
					type="textarea"
					:rows="3"
					maxlength="2000"
					show-word-limit
					placeholder="K线形态、均线/量价关系、支撑与压力位、指标信号等技术面观察..."
				></el-input>
			</div>

			<!-- 情绪面（可多选 + AI 分析总结；总结支持人工修正） -->
			<div class="rd-section">
				<div class="rd-sec-title">
					情绪面（可多选）
					<span v-if="isStock" class="rd-tpl-btn" @click="onAiMood">{{ aiMoodLoading ? 'AI 分析中...' : 'AI 分析总结' }}</span>
				</div>
				<div class="rd-moods">
					<span
						v-for="m in ZDX_REVIEW_MOODS"
						:key="m"
						class="rd-mood"
						:class="{ active: moods.includes(m) }"
						@click="toggleMood(m)"
					>
						{{ m }}
					</span>
				</div>
				<el-input
					v-if="isStock"
					v-model="moodText"
					type="textarea"
					:rows="2"
					maxlength="500"
					show-word-limit
					placeholder="AI 情绪分析总结（可人工修正，随复盘保存）"
				></el-input>
			</div>

			<!-- 复盘笔记（内容编辑；AI 回归验证入口在顶部"上期复盘"卡，仅下一次复盘可触发） -->
			<div class="rd-section">
				<div class="rd-sec-title">
					复盘笔记
					<span class="rd-tpl-btn" @click="insertTemplate">插入模板</span>
				</div>
				<el-input
					v-model="content"
					type="textarea"
					:rows="8"
					maxlength="5000"
					show-word-limit
					placeholder="记录操作逻辑、情绪变化、失误与改进计划..."
				></el-input>
			</div>

			<!-- 后续计划（放在最末：保存后下期复盘自动回显到顶部"上期复盘"卡） -->
			<div class="rd-section">
				<div class="rd-sec-title">后续计划</div>
				<el-input
					v-model="planContent"
					type="textarea"
					:rows="3"
					maxlength="2000"
					show-word-limit
					:placeholder="planPlaceholder"
				></el-input>
			</div>
		</div>

		<template #footer>
			<div class="rd-footer">
				<el-button v-if="ctx?.Note?.Id" type="danger" plain :loading="deleting" @click="onDelete">删除笔记</el-button>
				<div class="rd-footer-right">
					<span v-if="ctx?.Note?.Id" class="rd-updated">上次更新 {{ dayjs(ctx.Note.UpdateTime).format('MM-DD HH:mm') }}</span>
					<el-button type="primary" :loading="saving" @click="onSave">
						<font-awesome-icon fas icon="floppy-disk" class="rd-btn-icon"></font-awesome-icon>
						保存复盘
					</el-button>
				</div>
			</div>
		</template>
	</el-drawer>

	<!-- 盈利预测档位设置（常用涨跌幅档位；localStorage 记忆，未设置时用默认值） -->
	<el-dialog v-model="stepsVisible" title="盈利预测档位设置" width="420px" append-to-body class="rd-steps-dialog">
		<div class="rd-steps-tip">输入常用涨跌幅档位（%），以逗号分隔，例如：-5,-3,-1,1,3,5,10；范围 -20 ~ 20，最少 2 个、最多 10 个。</div>
		<el-input v-model="stepsInput" placeholder="-3,-2,-1,1,2,3,5"></el-input>
		<template #footer>
			<el-button @click="resetSteps">恢复默认</el-button>
			<el-button @click="stepsVisible = false">取消</el-button>
			<el-button type="primary" @click="saveSteps">保存</el-button>
		</template>
	</el-dialog>

	<!-- 形态编辑（人工修正 AI 识别结果：日期/名称/方向/说明；保存后标记为人工） -->
	<el-dialog v-model="patternEditVisible" title="编辑 K 线形态" width="420px" append-to-body class="rd-pattern-dialog">
		<el-form label-width="72px" size="small">
			<el-form-item label="形态日期">
				<el-date-picker v-model="patternEditRange" type="daterange" range-separator="至" start-placeholder="起始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" :clearable="false" style="width: 100%"></el-date-picker>
			</el-form-item>
			<el-form-item label="形态名称">
				<el-input v-model="patternEditForm.Name" maxlength="50" placeholder="如：早晨之星、红三兵"></el-input>
			</el-form-item>
			<el-form-item label="信号方向">
				<el-radio-group v-model="patternEditForm.Direction">
					<el-radio-button :value="1">看涨</el-radio-button>
					<el-radio-button :value="2">看跌</el-radio-button>
					<el-radio-button :value="3">中性</el-radio-button>
				</el-radio-group>
			</el-form-item>
			<el-form-item label="构成说明">
				<el-input v-model="patternEditForm.Description" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="形态构成与量价含义（可空）"></el-input>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="patternEditVisible = false">取消</el-button>
			<el-button type="primary" :loading="patternSaving" @click="onSavePatternEdit">保存</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from '@/untils/dayjs'
import { formatThousands } from '@/consts/zhiduoxing-const'
import {
	ZDX_REVIEW_TYPES,
	ZDX_REVIEW_MOODS,
	ZDX_TRADE_CATEGORIES,
	IZdxReviewContext,
	IZdxTradeNoteItem,
	IZdxTradePosition,
	IZdxTradeRecordData,
	IZdxTradeStockStat,
	IZdxTradeStats
} from '@/interfaces/zhiduoxing/IZdxMyTrade'
import { IZdxStockDetail, IZdxStockKlinePoint, IZdxStockTrend } from '@/interfaces/zhiduoxing/IZdxStockDetail'
import { IZdxTradeDay } from '@/interfaces/zhiduoxing/IZdxTradeDay'
import { IZdxAiPatternItem, IZdxAiPatternSaveForm, IZdxForecastAnchor, IZdxStockForecast, IZdxStockForecastLong } from '@/interfaces/zhiduoxing/IZdxStockReview'
import zdxApi from '@/apis/zdx-api'

// 复盘抽屉（日/周/月/个股复盘共用）
// 用法：<ReviewDrawer v-model="visible" :type="1" date="2026-10-03" @saved="onSaved" />
// 个股复盘：:type="4" :stock-code="code" :stock-name="name" :position="position"（隐藏类型/日期切换）
const props = defineProps<{
	modelValue: boolean
	type: number
	date?: string
	stockCode?: string
	stockName?: string
	// 当前持仓（个股复盘：持仓成本条/卖出参考成本/盈利预测；可空）
	position?: IZdxTradePosition | null
	// 个股交易统计（交易画像口径：胜率/盈亏比/平均盈亏等；可空）
	stat?: IZdxTradeStockStat | null
	// 个股行情快照（当日盘中 K 线未落库时回退展示实时开/收/高/低；可空）
	detail?: IZdxStockDetail | null
	// 公告事件引用块（事件回测[关联我的复盘]入口打开时预填笔记正文；其他入口为空）
	eventQuote?: string | null
}>()

const emit = defineEmits<{
	(e: 'update:modelValue', v: boolean): void
	(e: 'saved'): void
	(e: 'level-saved'): void
}>()

const visible = computed({
	get: () => props.modelValue,
	set: v => emit('update:modelValue', v)
})

const ctx = ref<IZdxReviewContext>()
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const curType = ref(props.type)
const curDate = ref(props.date ?? dayjs().format('YYYY-MM-DD'))
const moods = ref<string[]>([])
const content = ref('')
const planContent = ref('')
const techText = ref('')
const newsText = ref('')
// 情绪面 AI 分析总结（支持人工修正，随复盘保存）
const moodText = ref('')
// 复盘日日K（不复权；当日行情卡与盈利预测的收盘价基准）
const dayKlines = ref<IZdxStockKlinePoint[]>([])
// 手动支撑位/压力位（不复权价；null=按最近未回补缺口自动计算；随画图数据一并加载）
const manualSupport = ref<number | null>(null)
const manualResist = ref<number | null>(null)
// 支撑/压力位编辑态（标题行“调整”进入；空输入=恢复自动）
const lvEditing = ref(false)
const lvSupportInput = ref('')
const lvResistInput = ref('')
const lvSaving = ref(false)
// 个股预测列表（盈利预测结合进行中预测目标）
const forecasts = ref<IZdxStockForecast[]>([])
// 长线目标预测列表（里程碑式：N 个交易日内到达目标收盘价；按目标天数升序）
const forecastLongs = ref<IZdxStockForecastLong[]>([])
// 交易统计（账户真实费率来源：佣金/最低佣金/印花税/过户费）
const tradeStats = ref<IZdxTradeStats>()
// 复盘日分时走势（含当天买卖点；空序列=该日无存底分时）
const trendData = ref<IZdxStockTrend>()
const trendEl = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null

// 当日操作明细编辑项（个股复盘：成交记录 + 操作说明 + 最低盈利预测输入 + 预测期限）
interface IDealNoteEdit {
	Record: IZdxTradeRecordData
	Note: string
	MinProfit: string
	// 预测期限输入（交易日：N 个交易日内到达目标价；空=不限）
	Days: string
}
const dealNotes = ref<IDealNoteEdit[]>([])

const isStock = computed(() => curType.value === 4)

// 当前持仓成本价（卖出参考成本；无持仓为0）
const refCost = computed(() => props.position?.AvgCost ?? 0)

// ---------- 当日行情 / 交易统计 / 盈利预测 ----------
// 盈利预测情景涨幅档位（%）：默认值，支持在“档位设置”中自定义（localStorage 记忆）
const DEFAULT_STEPS = [-3, -2, -1, 1, 2, 3, 5]
const STEPS_KEY = 'zhiduoxing_review_profit_steps'
const MP_MODE_KEY = 'zhiduoxing_review_mp_mode_v2'
// 日K加载根数（与K线图日K口径一致）
const KLINE_LOAD_COUNT = 600

// 读取自定义档位（脏数据/越界自动回退默认值）
function readSteps(): number[] {
	try {
		const raw = localStorage.getItem(STEPS_KEY)
		if (!raw) return DEFAULT_STEPS
		const list = (JSON.parse(raw) as unknown[]).filter(
			(v): v is number => typeof v === 'number' && isFinite(v) && v !== 0 && Math.abs(v) <= 20
		)
		const uniq = Array.from(new Set(list)).sort((a, b) => a - b)
		return uniq.length >= 2 && uniq.length <= 10 ? uniq : DEFAULT_STEPS
	} catch {
		// 脏数据回退默认档位
		return DEFAULT_STEPS
	}
}
const profitSteps = ref<number[]>(readSteps())
const stepsVisible = ref(false)
const stepsInput = ref('')
// 最低盈利预测输入单位（amount=金额元 / pct=收益率%；默认收益率，切换时逐笔按成本基准换算）
const mpMode = ref<'amount' | 'pct'>(localStorage.getItem(MP_MODE_KEY) === 'amount' ? 'amount' : 'pct')

// 单位切换（radio 绑定：set 走逐笔换算逻辑，保证输入值随单位切换自动换算）
const curMpMode = computed({
	get: () => mpMode.value,
	set: (v: 'amount' | 'pct') => setMpMode(v)
})

// 复盘日行情（OHLC/涨跌幅/振幅；优先日K落库数据，当日盘中未落库时回退实时快照）
const dayQuote = computed(() => {
	if (!isStock.value) return null
	const d = curDate.value
	const k = dayKlines.value.find(x => (x.Date ?? '').slice(0, 10) === d)
	if (k) {
		return { Open: k.Open, Close: k.Close, High: k.High, Low: k.Low, Change: k.ChangePercent ?? null, Amp: k.Amplitude ?? null }
	}
	const dt = props.detail
	const isWeekday = [1, 2, 3, 4, 5].includes(dayjs(d).day())
	if (dt && isWeekday && d === dayjs().format('YYYY-MM-DD') && dt.Price > 0) {
		return { Open: dt.Open, Close: dt.Price, High: dt.High, Low: dt.Low, Change: dt.ChangePercent ?? null, Amp: dt.Amplitude ?? null }
	}
	return null
})

// 个股交易统计（交易画像口径）
const tradeStat = computed(() => props.stat as IZdxTradeStockStat)
const hasStat = computed(() => !!tradeStat.value && tradeStat.value.TradeCount > 0)

// 盈亏比文案（无卖出显示 --；有盈利无亏损显示 ∞）
const profitRatioText = computed(() => {
	const s = tradeStat.value
	if (!s || s.SellCount <= 0) return '--'
	if (s.AvgLoss <= 0) return s.AvgProfit > 0 ? '∞' : '--'
	return s.ProfitRatio.toFixed(2)
})

// 卖出费率估算（优先账户真实费率[交易画像统计，含手动校准值，含最低佣金]，无则按复盘日成交推算，再回退默认值）
const DEFAULT_RATES = { Commission: 0.00012, MinCommission: 5, Stamp: 0.0005, Transfer: 0.00001 }
const feeRates = computed(() => {
	const s = tradeStats.value
	if (s && s.CommissionRate > 0) {
		return {
			Commission: s.CommissionRate,
			MinCommission: s.MinCommission > 0 ? s.MinCommission : DEFAULT_RATES.MinCommission,
			Stamp: s.StampTaxRate > 0 ? s.StampTaxRate : DEFAULT_RATES.Stamp,
			Transfer: s.TransferFeeRate > 0 ? s.TransferFeeRate : DEFAULT_RATES.Transfer
		}
	}
	const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
	const recs = ctx.value?.Records ?? []
	let amount = 0
	let comm = 0
	let stamp = 0
	let transfer = 0
	recs.forEach(r => {
		amount += r.Amount || 0
		comm += r.Commission || 0
		stamp += r.StampTax || 0
		transfer += r.TransferFee || 0
	})
	const commission = amount > 0 && comm > 0 ? clamp(comm / amount, 0.00003, 0.0008) : DEFAULT_RATES.Commission
	const stampRate = amount > 0 && stamp > 0 ? clamp(stamp / amount, 0.0001, 0.001) : DEFAULT_RATES.Stamp
	const transferRate = amount > 0 && transfer > 0 ? clamp(transfer / amount, 0.000001, 0.00005) : DEFAULT_RATES.Transfer
	return { Commission: commission, MinCommission: 0, Stamp: stampRate, Transfer: transferRate }
})

// 费率说明文案（万分位：万1.2/万5/万0.1；含最低佣金时标注）
const rateText = computed(() => {
	const r = feeRates.value
	const w = (v: number) => `万${Math.round(v * 10000 * 100) / 100}`
	const minPart = r.MinCommission > 0 ? `（最低 ${r.MinCommission} 元）` : ''
	return `佣金 ${w(r.Commission)}${minPart} · 印花税 ${w(r.Stamp)} · 过户费 ${w(r.Transfer)}`
})

// 盈利预测模型（无收盘价不显示；无持仓仍展示档位目标价[盈亏列 --]；净盈亏扣卖出费用估算 + 分档情景 + 结合进行中预测目标）
const forecastModel = computed(() => {
	if (!isStock.value || !dayQuote.value) return null
	const close = dayQuote.value.Close
	if (close <= 0) return null
	const cost = refCost.value
	const vol = props.position?.Volume ?? 0
	// 持仓口径标记：无持仓/无成本时仅展示档位目标价
	const hasPos = cost > 0 && vol > 0
	const rate = feeRates.value
	// 卖出费用（含最低佣金）与净盈亏
	const sellFee = (price: number) => {
		const amt = price * vol
		return Math.max(amt * rate.Commission, rate.MinCommission) + amt * (rate.Stamp + rate.Transfer)
	}
	const netProfit = (price: number) => (price - cost) * vol - sellFee(price)
	const rows: { Pct: number; Price: number; Gross?: number; Profit?: number }[] = profitSteps.value.map(p => {
		const price = close * (1 + p / 100)
		return hasPos
			? { Pct: p, Price: price, Gross: (price - cost) * vol, Profit: netProfit(price) }
			: { Pct: p, Price: price, Gross: undefined, Profit: undefined }
	})
	const f = forecasts.value.find(x => x.Status === 1 && (x.Anchors?.length ?? 0) > 0)
	const target = f ? f.Anchors[f.Anchors.length - 1].Price : 0
	const forecast: { Price: number; Pct: number; Profit?: number } | null =
		f && target > 0 ? { Price: target, Pct: ((target - close) / close) * 100, Profit: hasPos ? netProfit(target) : undefined } : null
	// 含费回本价：卖出费用后盈亏为0；佣金按比例段/最低佣段分两段解析（无持仓不计算）
	let bePrice = 0
	if (hasPos) {
		const rAll = rate.Commission + rate.Stamp + rate.Transfer
		const pProportional = cost / (1 - rAll)
		bePrice =
			pProportional * vol * rate.Commission >= rate.MinCommission
				? pProportional
				: (cost * vol + rate.MinCommission) / (1 - rate.Stamp - rate.Transfer) / vol
	}
	return {
		Close: close,
		Cost: cost,
		Vol: vol,
		HasPos: hasPos,
		BePct: hasPos ? ((bePrice - close) / close) * 100 : 0,
		BePrice: bePrice,
		FloatProfit: hasPos ? netProfit(close) : 0,
		Rows: rows,
		Forecast: forecast
	}
})

// 量能档位（相对近 5 个交易日均量倍率；八档：极致缩量 ~ 天量）
function volLevelOf(ratio: number): { label: string; cls: string } {
	if (ratio >= 3) return { label: '天量', cls: 'up' }
	if (ratio >= 2.2) return { label: '极致放量', cls: 'up' }
	if (ratio >= 1.5) return { label: '放量', cls: 'up' }
	if (ratio >= 1.15) return { label: '略微放量', cls: 'up' }
	if (ratio > 0.85) return { label: '持平', cls: '' }
	if (ratio > 0.65) return { label: '略微缩量', cls: 'down' }
	if (ratio > 0.45) return { label: '缩量', cls: 'down' }
	return { label: '极致缩量', cls: 'down' }
}

// 量能档位评定规则（悬浮说明展示；当前档位高亮）
const VOL_LEVEL_RULES = [
	{ range: '≥ 3.0 倍', label: '天量', cls: 'up' },
	{ range: '≥ 2.2 倍', label: '极致放量', cls: 'up' },
	{ range: '≥ 1.5 倍', label: '放量', cls: 'up' },
	{ range: '≥ 1.15 倍', label: '略微放量', cls: 'up' },
	{ range: '0.85 ~ 1.15 倍', label: '持平', cls: '' },
	{ range: '0.65 ~ 0.85 倍', label: '略微缩量', cls: 'down' },
	{ range: '0.45 ~ 0.65 倍', label: '缩量', cls: 'down' },
	{ range: '0.45 倍以下', label: '极致缩量', cls: 'down' }
]

// 当日行情扩展（复盘日口径：均价/近5日/近20日涨跌幅/成交量/量能与5日20日量比；无行情时返回空值）
const dayExtra = computed(() => {
	const empty = { Avg: 0, Chg5: null as number | null, Chg20: null as number | null, Vol: 0, VolRatio5: 0, VolRatio20: 0, VolLevel: { label: '--', cls: '', sub: '' } }
	if (!isStock.value || !dayQuote.value) return empty
	// 复盘日在日K中的位置（盘中当天未落库时取末尾虚拟位）
	const ki = dayKlines.value.findIndex(k => (k.Date ?? '').slice(0, 10) === curDate.value)
	const idx = ki >= 0 ? ki : curDate.value === dayjs().format('YYYY-MM-DD') ? dayKlines.value.length : -1
	if (idx < 0) return empty
	const close = dayQuote.value.Close
	// 涨跌幅：复盘日收盘 vs 前第 n 根收盘（不足 n 根返回 null）
	const chg = (n: number) => {
		if (idx < n) return null
		const prev = dayKlines.value[idx - n].Close
		return prev > 0 && close > 0 ? (close - prev) / prev * 100 : null
	}
	// 均价：复盘日分时累计均值的最后值
	const avgArr = trendData.value?.Avg ?? []
	const avg = avgArr.length ? avgArr[avgArr.length - 1] : 0
	// 成交量与量能档位（量能基准=复盘日前 5 日均量；同时给出近 20 日均量倍率）
	const vol = ki >= 0 ? dayKlines.value[ki].Volume || 0 : 0
	// 前 N 日均量（不含复盘日）
	const avgOf = (n: number) => {
		const seg = dayKlines.value.slice(Math.max(0, ki - n), ki)
		return seg.length ? seg.reduce((s, x) => s + (x.Volume || 0), 0) / seg.length : 0
	}
	let volLevel = empty.VolLevel
	let ratio5 = 0
	let ratio20 = 0
	if (ki > 0 && vol > 0) {
		const base5 = avgOf(5)
		const base20 = avgOf(20)
		ratio5 = base5 > 0 ? vol / base5 : 0
		ratio20 = base20 > 0 ? vol / base20 : 0
		if (ratio5 > 0) {
			const lv = volLevelOf(ratio5)
			const parts: string[] = [`较5日 ${ratio5.toFixed(2)} 倍`]
			if (ratio20 > 0) parts.push(`较20日 ${ratio20.toFixed(2)} 倍`)
			volLevel = { label: lv.label, cls: lv.cls, sub: parts.join(' · ') }
		}
	}
	return { Avg: avg, Chg5: chg(5), Chg20: chg(20), Vol: vol, VolRatio5: ratio5, VolRatio20: ratio20, VolLevel: volLevel }
})

// ---------- 支撑/压力位（手动优先；自动=最近未回补缺口） ----------
// 最近一条未回补跳空缺口（不复权日K；与K线图 findAllGaps 同规则：
// 向上缺口=当根最低>前根最高且其后无一根最低重返前根最高；向下镜像）
function lastUnfilledGap(up: boolean): { low: number; high: number } | null {
	const data = dayKlines.value
	for (let i = data.length - 1; i >= 1; i--) {
		const prev = data[i - 1]
		const cur = data[i]
		if (up ? cur.Low <= prev.High : cur.High >= prev.Low) continue
		let filled = false
		for (let j = i + 1; j < data.length; j++) {
			if (up ? data[j].Low <= prev.High : data[j].High >= prev.Low) {
				filled = true
				break
			}
		}
		if (filled) continue
		return up ? { low: prev.High, high: cur.Low } : { low: cur.High, high: prev.Low }
	}
	return null
}

// 编辑框 placeholder 的自动基准值（缺口自动计算结果；无缺口为 0）
function lvAutoValue(up: boolean): number {
	const g = lastUnfilledGap(up)
	return g ? (up ? g.low : g.high) : 0
}

// 支撑/压力位展示（手动优先；距现价%=（价位-现价）÷现价；现价=复盘日收盘，不复权口径）
const priceLevel = computed(() => {
	if (!isStock.value || !dayKlines.value.length) return null
	const close = dayQuote.value?.Close ?? 0
	const supGap = lastUnfilledGap(true)
	const resGap = lastUnfilledGap(false)
	const supManual = manualSupport.value != null && manualSupport.value > 0
	const resManual = manualResist.value != null && manualResist.value > 0
	const support = supManual ? (manualSupport.value as number) : supGap ? supGap.low : 0
	const resist = resManual ? (manualResist.value as number) : resGap ? resGap.high : 0
	const pct = (p: number) => (p > 0 && close > 0 ? ((p - close) / close) * 100 : null)
	return {
		support,
		resist,
		supportManual: supManual,
		resistManual: resManual,
		supportPct: pct(support),
		resistPct: pct(resist)
	}
})

// 进入编辑（回填手动值；留空=恢复自动，placeholder 提示自动基准）
function startLvEdit() {
	lvSupportInput.value = manualSupport.value != null && manualSupport.value > 0 ? String(manualSupport.value) : ''
	lvResistInput.value = manualResist.value != null && manualResist.value > 0 ? String(manualResist.value) : ''
	lvEditing.value = true
}

// 保存支撑/压力位（空=恢复自动；非正数提示；成功后通知父组件刷新K线参考线）
async function saveLvEdit() {
	const code = props.stockCode as string
	if (!code) return
	const sRaw = lvSupportInput.value.trim()
	const rRaw = lvResistInput.value.trim()
	const sVal = sRaw ? Number(sRaw) : null
	const rVal = rRaw ? Number(rRaw) : null
	if ((sVal !== null && (!isFinite(sVal) || sVal <= 0)) || (rVal !== null && (!isFinite(rVal) || rVal <= 0))) {
		ElMessage.warning('价格需为正数；留空保存=恢复自动计算')
		return
	}
	lvSaving.value = true
	try {
		await zdxApi.saveStockPriceLevel({ StockCode: code, Period: 'day', SupportPrice: sVal, ResistPrice: rVal })
		manualSupport.value = sVal
		manualResist.value = rVal
		lvEditing.value = false
		ElMessage.success(sVal === null && rVal === null ? '已恢复自动计算' : '支撑/压力位已保存')
		emit('level-saved')
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		lvSaving.value = false
	}
}

// 恢复自动（清空两输入后提交）
async function resetLvToAuto() {
	lvSupportInput.value = ''
	lvResistInput.value = ''
	await saveLvEdit()
}

// 买卖分组（当天多笔按方向合并成块展示）
const buyDeals = computed(() => dealNotes.value.filter(d => d.Record.Category === 1))
const sellDeals = computed(() => dealNotes.value.filter(d => d.Record.Category === 2))

// 分组汇总（股数/金额/费用/浮动盈亏）
function sumDeals(list: IDealNoteEdit[]) {
	const acc = { Volume: 0, Amount: 0, Fee: 0, RefProfit: 0 }
	list.forEach(d => {
		acc.Volume += d.Record.Volume || 0
		acc.Amount += d.Record.Amount || 0
		acc.Fee += feeOf(d.Record)
		acc.RefProfit += sellRefProfit(d.Record)
	})
	return acc
}
const buySum = computed(() => sumDeals(buyDeals.value))
const sellSum = computed(() => sumDeals(sellDeals.value))

// 成交汇总项（个股=当日口径，无成交不显示；日/周/月=区间口径）
const summaryItems = computed(() => {
	const c = ctx.value
	if (!c) return []
	if (isStock.value && dealNotes.value.length === 0) return []
	const items: { label: string; value: string; cls?: string; sub?: string }[] = [
		{
			label: isStock.value ? '当日盈亏' : '区间盈亏',
			value: c.SellCount ? fmtMoney(c.ProfitSum, true) : '--',
			cls: changeClass(c.SellCount ? c.ProfitSum : undefined)
		},
		{
			label: isStock.value ? '成交笔数' : '交易笔数',
			value: String(c.Records.length),
			sub: `买 ${c.BuyCount} / 卖 ${c.SellCount}`
		},
		{ label: '费用合计', value: c.FeeSum ? fmtMoney(c.FeeSum) : '--' }
	]
	if (c.DividendSum || c.InterestSum) {
		items.push({ label: '红利 / 利息', value: `${fmtMoney(c.DividendSum)} / ${fmtMoney(c.InterestSum)}` })
	}
	if (c.BuyAmount || c.SellAmount) {
		items.push({ label: '买入 / 卖出额', value: `${fmtMoney(c.BuyAmount)} / ${fmtMoney(c.SellAmount)}` })
	}
	return items
})

const titleText = computed(() => {
	const t = ZDX_REVIEW_TYPES.find(t => t.value === curType.value)?.label ?? '复盘'
	if (isStock.value) return `${props.stockCode ?? ''} ${props.stockName ?? ''} ${t}`
	return t
})

const rangeText = computed(() => {
	const c = ctx.value
	if (!c) return ''
	const begin = dayjs(c.RangeBegin).format('YYYY-MM-DD')
	const end = dayjs(c.RangeEnd).format('YYYY-MM-DD')
	return begin === end ? begin : `${begin} ~ ${end}`
})

// 后续计划占位文案（按复盘类型区分）
const planPlaceholder = computed(() => {
	switch (curType.value) {
		case 4:
			return '后续操作计划：对该股接下来的买卖思路、关注价位与应对预案...'
		case 1:
			return '明日计划：明日关注方向、仓位与操作纪律...'
		case 2:
			return '下周计划：下周关注方向、仓位与操作纪律...'
		case 3:
			return '下月计划：下月关注方向、仓位与操作纪律...'
		default:
			return '后续计划...'
	}
})

// 抽屉打开状态（区分“首次打开”与“打开中切换日期/类型”两种触发）
let drawerOpen = false

// 抽屉打开时重置并加载；关闭时释放分时图实例（destroy-on-close 会移除容器）
// 打开状态下同步监听 date/type：双击K线切换日期时抽屉保持打开，需重新加载（否则数据停留在旧日期）
watch(
	[() => props.modelValue, () => props.date, () => props.type],
	([v]) => {
		if (!v) {
			if (!drawerOpen) return
			drawerOpen = false
			endFcMiniDrag()
			trendChart?.dispose()
			trendChart = null
			techChart?.dispose()
			techChart = null
			return
		}
		const nextDate = props.date ?? dayjs().format('YYYY-MM-DD')
		// 已打开且日期/类型未变化时不重复加载
		if (drawerOpen && curDate.value === nextDate && curType.value === props.type) return
		drawerOpen = true
		curType.value = props.type
		curDate.value = nextDate
		load()
	}
)

// 加载请求序号（快速切换日期/类型时丢弃过期响应，避免旧数据覆盖新数据）
let loadSeq = 0

async function load() {
	const seq = ++loadSeq
	loading.value = true
	try {
		// 个股复盘并行加载：复盘上下文 + 日K（不复权，行情/收盘基准）+ 预测列表 + 长线目标 + 分时（含买卖点）+ 账户费率 + 画图（手动支撑/压力位）
		const stockCode = isStock.value ? (props.stockCode as string) : ''
		const [context, klines, forecastList, forecastLongList, trend, feeStats, futureDays, drawing] = await Promise.all([
			zdxApi.getReviewContext(curType.value, curDate.value, isStock.value ? props.stockCode : undefined).catch(() => undefined),
			stockCode
				? zdxApi.getStockKlines(stockCode, 'day', KLINE_LOAD_COUNT, 'none').catch(() => [] as IZdxStockKlinePoint[])
				: Promise.resolve([] as IZdxStockKlinePoint[]),
			stockCode
				? zdxApi.getForecastList(stockCode).catch(() => [] as IZdxStockForecast[])
				: Promise.resolve([] as IZdxStockForecast[]),
			stockCode
				? zdxApi.getForecastLongList(stockCode).catch(() => [] as IZdxStockForecastLong[])
				: Promise.resolve([] as IZdxStockForecastLong[]),
			stockCode
				? zdxApi.getStockTrend(stockCode, curDate.value).catch(() => undefined)
				: Promise.resolve(undefined),
			stockCode
				? zdxApi.getMyTradeStats().catch(() => undefined)
				: Promise.resolve(undefined),
			stockCode
				? zdxApi.getTradeDays(dayjs().format('YYYY-MM-DD'), dayjs().add(45, 'day').format('YYYY-MM-DD')).catch(() => [] as IZdxTradeDay[])
				: Promise.resolve([] as IZdxTradeDay[]),
			stockCode
				? zdxApi.getStockDrawing(stockCode, 'day').catch(() => null)
				: Promise.resolve(null)
		])
		// 过期响应丢弃（已切换到新上下文，由新请求接管状态）
		if (seq !== loadSeq) return
		ctx.value = context
		const kl = klines ?? []
		dayKlines.value = kl
		manualSupport.value = drawing?.SupportPrice ?? null
		manualResist.value = drawing?.ResistPrice ?? null
		lvEditing.value = false
		forecasts.value = forecastList ?? []
		forecastLongs.value = forecastLongList ?? []
		trendData.value = trend
		tradeStats.value = feeStats
		// 未来交易日（最新日K日期之后的最近 5 个交易日；供走势预测编辑行）
		const lastDate = (kl[kl.length - 1]?.Date ?? dayjs().format('YYYY-MM-DD')).slice(0, 10)
		tradeFutureDays.value = (futureDays ?? [])
			.filter(d => d.IsTradeDay && (d.TradeDate ?? '').slice(0, 10) > lastDate)
			.slice(0, 5)
			.map(d => d.TradeDate.slice(0, 10))
		const note = ctx.value?.Note
		moods.value = (note?.MoodTags ?? '').split(',').filter(Boolean)
		content.value = note?.Content ?? ''
		// 公告事件引用预填（仅携带 eventQuote 打开时；正文已有同一引用块不重复追加；用户续写后照常保存）
		if (props.eventQuote && !content.value.includes('【公告事件】')) {
			content.value = content.value.trim() ? `${content.value.trim()}\n\n${props.eventQuote}` : `${props.eventQuote}\n`
		}
		planContent.value = note?.PlanContent ?? ''
		techText.value = note?.TechnicalText ?? ''
		newsText.value = note?.NewsText ?? ''
		moodText.value = note?.MoodText ?? ''
		// 形态识别结果回显（读取服务端落库数据）
		await loadPatterns(seq)
		if (seq !== loadSeq) return
		// 当日买卖操作明细（个股复盘上下文为复盘当天；说明/预测从 TradeNotes JSON 按 RecordId 回显）
		const savedMap = new Map<number, IZdxTradeNoteItem>()
		if (note?.TradeNotes) {
			try {
				(JSON.parse(note.TradeNotes) as IZdxTradeNoteItem[]).forEach(s => {
					if (s && typeof s.RecordId === 'number') savedMap.set(s.RecordId, s)
				})
			} catch {
				// 脏数据忽略
			}
		}
		dealNotes.value = (ctx.value?.Records ?? [])
			.filter(r => r.Category === 1 || r.Category === 2)
			.map(r => {
				const s = savedMap.get(r.Id)
				return {
					Record: r,
					Note: s?.Note ?? '',
					MinProfit: s?.MinProfit === undefined || s?.MinProfit === null ? '' : String(s.MinProfit),
					Days: s?.Days === undefined || s?.Days === null ? '' : String(s.Days)
				}
			})
		// 预测输入按当前单位回显（数据层存金额；比例模式换算填充）
		applyMpModeToDeals()
		await nextTick()
		if (seq !== loadSeq) return
		renderTrendChart()
		renderTechChart()
	} catch {
		// 过期请求的异常不处理（新请求已接管状态）
		if (seq !== loadSeq) return
		ctx.value = undefined
		dealNotes.value = []
		dayKlines.value = []
		manualSupport.value = null
		manualResist.value = null
		forecasts.value = []
		forecastLongs.value = []
		trendData.value = undefined
		tradeStats.value = undefined
		tradeFutureDays.value = []
		moodText.value = ''
	} finally {
		if (seq === loadSeq) loading.value = false
	}
}

// 日历选日期（禁用未来日期）
function disabledFutureDate(date: Date) {
	return dayjs(date).isAfter(dayjs(), 'day')
}

function toggleMood(m: string) {
	const i = moods.value.indexOf(m)
	if (i >= 0) moods.value.splice(i, 1)
	else moods.value.push(m)
}

async function onSave() {
	saving.value = true
	try {
		await zdxApi.saveReview({
			Type: curType.value,
			Date: curDate.value,
			StockCode: isStock.value ? props.stockCode : undefined,
			MoodTags: moods.value.join(','),
			Content: content.value,
			TechnicalText: isStock.value ? techText.value : undefined,
			NewsText: isStock.value ? newsText.value : undefined,
			MoodText: isStock.value ? moodText.value : undefined,
			TradeNotes: isStock.value ? buildTradeNotes() : undefined,
			PlanContent: planContent.value
		})
		await load()
		emit('saved')
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		saving.value = false
	}
}

// 当日操作说明/预测序列化（仅保留有内容的项；预测统一换算为金额存储，为空或非法不提交）
function buildTradeNotes() {
	const list = dealNotes.value
		.filter(d => d.Note.trim() || d.MinProfit.trim())
		.map(d => {
			const raw = Number(d.MinProfit)
			const base = dealBase(d)
			const vol = d.Record.Volume || 0
			const amount = mpMode.value === 'pct' ? (base > 0 && vol > 0 ? (raw / 100) * base * vol : NaN) : raw
			const minProfit = d.MinProfit.trim() === '' || isNaN(raw) || isNaN(amount) ? undefined : Math.round(amount * 100) / 100
			// 目标价（浮盈口径 = 成本基准 + 预测盈利 ÷ 数量；落库用于后续复盘回测验证）
			const minPrice = minProfit === undefined || base <= 0 || vol <= 0 ? undefined : Math.round((base + minProfit / vol) * 1000) / 1000
			// 预测期限（交易日，1~500 整数；未填盈利预测时不落库；用于后期回测验证评估）
			const daysRaw = Number(d.Days)
			const days = minProfit === undefined || d.Days.trim() === '' || isNaN(daysRaw) || daysRaw < 1 || daysRaw > 500 ? undefined : Math.floor(daysRaw)
			return {
				RecordId: d.Record.Id,
				Note: d.Note.trim() || undefined,
				MinProfit: minProfit,
				MinPrice: minPrice,
				Days: days
			}
		})
	return JSON.stringify(list)
}

async function onDelete() {
	const note = ctx.value?.Note
	if (!note) return
	deleting.value = true
	try {
		await zdxApi.deleteReview(note.Id)
		await load()
		emit('saved')
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		deleting.value = false
	}
}

// 插入笔记模板（【操作回顾】含区间自动摘要 + 【操作依据】+【情绪与执行】；已含模板时不重复插入）
function insertTemplate() {
	if (content.value.includes('【操作回顾】')) {
		ElMessage.info('笔记已包含模板内容，可直接补充')
		return
	}
	const c = ctx.value
	const scopeWord = isStock.value ? '本日' : '本区间'
	const summary = c
		? `${scopeWord}买入 ${c.BuyCount} 笔、卖出 ${c.SellCount} 笔，净盈亏 ${fmtMoney(c.ProfitSum, true)} 元，费用合计 ${fmtMoney(c.FeeSum)} 元。`
		: `${scopeWord}暂无交易记录。`
	const tpl = `【操作回顾】\n${summary}\n\n【操作依据】\n\n【情绪与执行】\n`
	content.value = content.value.trim() ? `${content.value.trim()}\n\n${tpl}` : tpl
}

// ---------- 格式化 ----------
function fmtMoney(value: number, signed = false) {
	return formatThousands(value, signed)
}
function fmtVolume(value: number) {
	return value.toLocaleString('zh-CN')
}
function fmtDate(value: string) {
	return dayjs(value).format('MM-DD')
}
function changeClass(value?: number) {
	if (value === undefined || value === null || !isFinite(value) || value === 0) return ''
	return value > 0 ? 'up' : 'down'
}
function catLabel(category: number) {
	return ZDX_TRADE_CATEGORIES.find(c => c.value === category)?.label ?? '其他'
}
function catTag(category: number) {
	return ZDX_TRADE_CATEGORIES.find(c => c.value === category)?.tag ?? 'info'
}

// 百分比文案（null/undefined 显示 --；signed=true 时正数带 +）
function fmtPct(value?: number | null, signed = true) {
	if (value === null || value === undefined) return '--'
	return (signed && value > 0 ? '+' : '') + value.toFixed(2) + '%'
}

// ---------- 当日操作 ----------
// 成交费用合计（佣金+其他费用+印花税+过户费）
function feeOf(r: IZdxTradeRecordData) {
	return (r.Commission || 0) + (r.OtherFee || 0) + (r.StampTax || 0) + (r.TransferFee || 0)
}

// 买入含费单位成本（（成交金额+费用）÷数量；元/股）
function buyUnitCost(r: IZdxTradeRecordData) {
	return r.Volume > 0 ? (r.Amount + feeOf(r)) / r.Volume : 0
}

// 卖出浮动盈亏（按当前持仓成本估算，未扣卖出费用；仅供复盘参考）
function sellRefProfit(r: IZdxTradeRecordData) {
	if (!refCost.value || !r.Volume) return 0
	return (r.Price - refCost.value) * r.Volume
}

// 最低盈利预测的换算基准（买入=含费成本单价；卖出=当前持仓成本；无基准返回0）
function dealBase(d: IDealNoteEdit) {
	if (d.Record.Category === 1) return buyUnitCost(d.Record)
	return refCost.value > 0 ? refCost.value : 0
}

// 预测输入单位换算文案（金额⇄比例近似值 + 目标价；目标价=成本基准+预测盈利÷数量，浮盈口径）
function mpConvText(d: IDealNoteEdit) {
	const raw = Number(d.MinProfit)
	if (d.MinProfit.trim() === '' || isNaN(raw)) return ''
	const base = dealBase(d)
	const vol = d.Record.Volume || 0
	if (base <= 0 || vol <= 0) return ''
	const amount = mpMode.value === 'amount' ? raw : (raw / 100) * base * vol
	const minPrice = (base + amount / vol).toFixed(2)
	if (mpMode.value === 'amount') {
		const pct = (raw / (base * vol)) * 100
		return `≈ ${pct > 0 ? '+' : ''}${pct.toFixed(2)}% · 目标价 ${minPrice}`
	}
	return `≈ ${fmtMoney(amount, true)} 元 · 目标价 ${minPrice}`
}

// 最低盈利预测合计（金额口径累加：pct 模式按各笔成本基准换算；仅统计已填笔数）
const mpTotal = computed(() => {
	let sum = 0
	let filled = 0
	dealNotes.value.forEach(d => {
		const raw = Number(d.MinProfit)
		if (d.MinProfit.trim() === '' || isNaN(raw)) return
		const base = dealBase(d)
		const vol = d.Record.Volume || 0
		const amount = mpMode.value === 'pct' ? (base > 0 && vol > 0 ? (raw / 100) * base * vol : NaN) : raw
		if (isNaN(amount)) return
		sum += amount
		filled++
	})
	return { Sum: sum, Filled: filled, Total: dealNotes.value.length }
})

// 切换预测输入单位（金额⇄收益率；逐笔按成本基准换算，无基准的清空）
function setMpMode(to: 'amount' | 'pct') {
	if (to === mpMode.value) return
	dealNotes.value.forEach(d => {
		const raw = Number(d.MinProfit)
		if (d.MinProfit.trim() === '' || isNaN(raw)) return
		const base = dealBase(d)
		const vol = d.Record.Volume || 0
		if (base <= 0 || vol <= 0) d.MinProfit = ''
		else if (to === 'pct') d.MinProfit = ((raw / (base * vol)) * 100).toFixed(2)
		else d.MinProfit = ((raw / 100) * base * vol).toFixed(2)
	})
	mpMode.value = to
	localStorage.setItem(MP_MODE_KEY, to)
}

// 回显换算：库中金额 → 当前输入单位（金额模式直接展示）
function applyMpModeToDeals() {
	if (mpMode.value !== 'pct') return
	dealNotes.value.forEach(d => {
		const raw = Number(d.MinProfit)
		if (d.MinProfit.trim() === '' || isNaN(raw)) return
		const base = dealBase(d)
		const vol = d.Record.Volume || 0
		d.MinProfit = base > 0 && vol > 0 ? ((raw / (base * vol)) * 100).toFixed(2) : ''
	})
}

// 成交时间（优先成交时间 HH:mm，缺失时取发生日期时分）
function fmtTime(r: IZdxTradeRecordData) {
	if (r.TradeTime) return r.TradeTime.slice(0, 5)
	return dayjs(r.TradeDate).format('HH:mm')
}

// ---------- 日内分时（含当天买卖点） ----------
const hasTrend = computed(() => (trendData.value?.Times?.length ?? 0) > 0)

// 渲染复盘日分时图（价格线涨红跌绿/均价线/前收虚线/B、S 买卖点标记/下方成交量柱）
function renderTrendChart() {
	const el = trendEl.value
	const t = trendData.value
	if (!el || !t || !t.Times.length) return
	if (!trendChart || trendChart.getDom() !== el) {
		trendChart?.dispose()
		trendChart = echarts.init(el)
	}
	const prices = [...t.Prices]
	const avg = [...t.Avg]
	// 收盘补齐：最后点到 14:57 后仍未收满 15:00 时补一个 15:00 点（取最后一点值；修复定格 14:57）
	const times = [...t.Times]
	const volsRaw = [...(t.Volumes ?? [])]
	const lastTime = times[times.length - 1]
	if (lastTime && lastTime >= '14:57' && lastTime < '15:00') {
		times.push('15:00')
		prices.push(prices[prices.length - 1])
		avg.push(avg[avg.length - 1])
		if (volsRaw.length) volsRaw.push(volsRaw[volsRaw.length - 1])
	}
	// 前收（涨跌基准/对称轴）：复盘日的前一根日K收盘
	const ki = dayKlines.value.findIndex(k => (k.Date ?? '').slice(0, 10) === curDate.value)
	const prevClose = ki > 0 ? dayKlines.value[ki - 1].Close : prices[0]
	// 涨红跌绿（整体口径：复盘日现价相对前收；与个股K线/其它分时图一致）
	const upColor = '#f56c6c'
	const downColor = '#67c23a'
	const lineColor = prices[prices.length - 1] >= prevClose ? upColor : downColor
	// 分时量为累计值，量柱需转区间增量（首点为开盘首段）；无量或长度不齐时不显示量柱
	const hasVol = (t.Volumes?.length ?? 0) === t.Times.length
	const volDeltas = hasVol ? volsRaw.map((v, i) => (i === 0 ? v : Math.max(0, +(v - volsRaw[i - 1]).toFixed(2)))) : []
	const volTop = volDeltas.length ? Math.max(...volDeltas) : 0
	let maxDev = 0
	prices.forEach(p => {
		maxDev = Math.max(maxDev, Math.abs(p - prevClose))
	})
	avg.forEach(p => {
		maxDev = Math.max(maxDev, Math.abs(p - prevClose))
	})
	if (maxDev <= 0) maxDev = prevClose * 0.01 || 1
	// 当天买卖点（成交时间对齐到最近分时点）
	const marks: any[] = dealNotes.value.map(d => {
		const tt = fmtTime(d.Record)
		let mi = 0
		for (let i = 0; i < times.length; i++) {
			if (times[i] <= tt) mi = i
			else break
		}
		const isBuy = d.Record.Category === 1
		return {
			value: [mi, d.Record.Price],
			itemStyle: { color: isBuy ? upColor : downColor },
			label: {
				show: true,
				formatter: isBuy ? 'B' : 'S',
				position: isBuy ? 'bottom' : 'top',
				color: isBuy ? upColor : downColor,
				fontSize: 10,
				fontWeight: 'bold'
			}
		}
	})
	// 时间轴基础配置（仅显示 09:30 / 11:30[显示为 11:30/13:00] / 15:00 三个刻度；其余悬浮查看）
	const xAxisBase = {
		type: 'category',
		data: times,
		boundaryGap: false,
		axisLine: { lineStyle: { color: '#dcdfe6' } },
		axisTick: { show: false },
		axisLabel: {
			fontSize: 10,
			color: '#909399',
			interval: (_index: number, value: string) => value === '09:30' || value === '11:30' || value === '15:00',
			formatter: (value: string) => (value === '11:30' ? '11:30/13:00' : value)
		}
	}
	// 价格轴（对称于前收）与量轴（仅量图）
	const priceAxis = {
		type: 'value',
		min: prevClose - maxDev * 1.08,
		max: prevClose + maxDev * 1.08,
		axisLabel: { fontSize: 10, color: '#909399', formatter: (v: number) => v.toFixed(2) },
		splitLine: { lineStyle: { color: '#f0f2f5' } }
	}
	const volAxis = {
		type: 'value',
		gridIndex: 1,
		min: 0,
		max: volTop > 0 ? volTop : undefined,
		axisLabel: { show: false },
		splitLine: { show: false }
	}
	const series: any[] = [
		{
			name: '分时价格',
			type: 'line',
			data: prices,
			showSymbol: false,
			lineStyle: { width: 1.4, color: lineColor },
			itemStyle: { color: lineColor },
			areaStyle: {
				color: new echarts.graphic.LinearGradient(0, 0, 0, 0.8, [
					{ offset: 0, color: lineColor + '33' },
					{ offset: 1, color: lineColor + '00' }
				])
			},
			z: 3,
			markLine: {
				silent: true,
				symbol: 'none',
				label: { show: true, position: 'insideEndTop', formatter: `前收 ${prevClose.toFixed(2)}`, fontSize: 10, color: '#909399' },
				lineStyle: { type: 'dashed', color: '#c0c4cc', width: 1 },
				data: [{ yAxis: prevClose }]
			}
		},
		{ name: '均价', type: 'line', data: avg, showSymbol: false, lineStyle: { width: 1, color: '#e6a23c' }, z: 2 },
		{ name: '买卖点', type: 'scatter', data: marks, symbolSize: 7, z: 5 }
	]
	if (hasVol) {
		series.push({
			name: '成交量',
			type: 'bar',
			xAxisIndex: 1,
			yAxisIndex: 1,
			barWidth: '60%',
			data: volDeltas.map((v, i) => ({
				value: v,
				itemStyle: { color: i > 0 && prices[i] >= prices[i - 1] ? upColor : downColor }
			}))
		})
	}
	trendChart.setOption(
		{
			animation: false,
			grid: hasVol
				? [
					{ left: 52, right: 16, top: 12, height: '56%' },
					{ left: 52, right: 16, bottom: 22, height: '18%' }
				]
				: { left: 52, right: 16, top: 12, bottom: 24 },
			tooltip: {
				trigger: 'axis',
				formatter: (ps: any) => {
					const p = Array.isArray(ps) ? ps[0] : ps
					if (!p || p.dataIndex === undefined) return ''
					const i = p.dataIndex as number
					if (prices[i] === undefined) return ''
					const color = prices[i] >= prevClose ? upColor : downColor
					const diff = ((prices[i] - prevClose) / prevClose) * 100
					return `${times[i]}<br/>价格 <b style="color:${color}">${prices[i].toFixed(2)}</b>（${diff > 0 ? '+' : ''}${diff.toFixed(2)}%）<br/>均价 ${avg[i].toFixed(2)}`
				}
			},
			xAxis: hasVol ? [{ ...xAxisBase, axisLabel: { show: false } }, { ...xAxisBase, gridIndex: 1 }] : xAxisBase,
			yAxis: hasVol ? [priceAxis, volAxis] : priceAxis,
			series
		},
		true
	)
	trendChart.resize()
}

// 窗口尺寸变化时自适应（抽屉按 50% 定宽，兼容窗口缩放）
function onWindowResize() {
	trendChart?.resize()
	techChart?.resize()
}
onMounted(() => window.addEventListener('resize', onWindowResize))
onBeforeUnmount(() => {
	endFcMiniDrag()
	window.removeEventListener('resize', onWindowResize)
	trendChart?.dispose()
	trendChart = null
	techChart?.dispose()
	techChart = null
})

// ---------- 盈利预测档位设置 ----------
function openSteps() {
	stepsInput.value = profitSteps.value.join(',')
	stepsVisible.value = true
}

// 保存自定义档位（去重升序；2~10 个，范围 -20~20 不含 0）
function saveSteps() {
	const parts = stepsInput.value.split(/[,，\s]+/).map(s => Number(s)).filter(v => isFinite(v) && v !== 0 && Math.abs(v) <= 20)
	const list = Array.from(new Set(parts)).sort((a, b) => a - b)
	if (list.length < 2 || list.length > 10) {
		ElMessage.warning('请输入 2~10 个档位（范围 -20 ~ 20，不含 0），以逗号分隔')
		return
	}
	profitSteps.value = list
	localStorage.setItem(STEPS_KEY, JSON.stringify(list))
	stepsVisible.value = false
	ElMessage.success('档位已保存')
}

// 恢复默认档位
function resetSteps() {
	localStorage.removeItem(STEPS_KEY)
	profitSteps.value = DEFAULT_STEPS
	stepsInput.value = DEFAULT_STEPS.join(',')
	ElMessage.success('已恢复默认档位')
}

// ---------- 走势预测（隔日路径：人工画/改最多 5 个交易日 + AI 生成） ----------
// 未来交易日（当前日期之后的最近 5 个交易日；load 时从交易日历加载）
const tradeFutureDays = ref<string[]>([])
// 编辑态（fcEditing 展开编辑区；fcSaving/fcDeleting 保存与删除中）
const fcEditing = ref(false)
const fcSaving = ref(false)
const fcDeleting = ref(false)
const aiForecastLoading = ref(false)
const aiForecastComment = ref('')
// 预测天数（1~5 可选，默认 5；切换时按交易日历重建编辑行并保留已填内容）
const fcDays = ref(5)

// 预测编辑行（日期 + 预测K线四价输入：开/高/低/收）
interface IFcRow {
	Date: string
	O: string
	H: string
	L: string
	C: string
}
const fcRows = ref<IFcRow[]>([])

// 进行中预测（Status=1 且有锚点）
const activeForecast = computed(() => forecasts.value.find(x => x.Status === 1 && (x.Anchors?.length ?? 0) > 0))

// 预测基准价（最新日K收盘；盘中未落库时回退实时快照）
const fcBasePrice = computed(() => {
	const last = dayKlines.value[dayKlines.value.length - 1]
	if (last && last.Close > 0) return last.Close
	return props.detail?.Price ?? 0
})

// 进行中预测终点目标（目标价 + 相对基准涨跌幅）
const fcEndTarget = computed(() => {
	const f = activeForecast.value
	const base = fcBasePrice.value
	if (!f || base <= 0) return { Price: 0, Pct: 0 }
	const last = f.Anchors[f.Anchors.length - 1]
	return { Price: last.Price, Pct: (last.Price - base) / base * 100 }
})

// 单元格数值（空串/非法返回 NaN）
function fcNum(s: string) {
	const v = Number(s)
	return s.trim() !== '' && isFinite(v) ? v : NaN
}

// 行是否已开始填写（任一非空）
function fcRowFilled(r: IFcRow) {
	return [r.O, r.H, r.L, r.C].some(s => s.trim() !== '')
}

// 行是否有效（四价齐全>0，且 最低 ≤ 开/收 ≤ 最高）
function fcRowValid(r: IFcRow) {
	const o = fcNum(r.O)
	const h = fcNum(r.H)
	const l = fcNum(r.L)
	const c = fcNum(r.C)
	if (![o, h, l, c].every(v => isFinite(v) && v > 0)) return false
	return h >= Math.max(o, c) && l <= Math.min(o, c)
}

// 行非法态（已填写但不完整/不合法；用于红框提示）
function fcRowBad(r: IFcRow) {
	return fcRowFilled(r) && !fcRowValid(r)
}

// 行收盘较基准（最新收盘）涨跌幅（%；空/非法返回 NaN）
function fcRowPct(r: IFcRow) {
	const c = fcNum(r.C)
	const base = fcBasePrice.value
	return isFinite(c) && base > 0 ? (c / base - 1) * 100 : NaN
}

// 行涨幅文案（有效时 +/-x.xx%，否则 --）
function fcPctText(r: IFcRow) {
	const p = fcRowPct(r)
	return isFinite(p) ? `${p > 0 ? '+' : ''}${p.toFixed(2)}%` : '--'
}

// 切换预测天数（按交易日历截取；已填行内容保留）
function onFcDaysChange() {
	const byDate = new Map(fcRows.value.map(r => [r.Date, r]))
	fcRows.value = tradeFutureDays.value
		.slice(0, fcDays.value)
		.map(date => byDate.get(date) ?? { Date: date, O: '', H: '', L: '', C: '' })
}

// ---------- 预测行迷你K线（档位预测后的形态小图；拖动实体整体平移、拖动上下影线端点调最高/最低） ----------
// 迷你图渲染项（viewBox 0 0 44 44：wickTop/wickBottom=影线上下端点，bodyY/bodyH=实体）
interface IFcMini {
	valid: boolean
	wickTop: number
	wickBottom: number
	bodyY: number
	bodyH: number
	up: boolean
}

const FC_MINI_H = 44
const FC_MINI_PAD = 5
const EMPTY_FC_MINI: IFcMini = { valid: false, wickTop: FC_MINI_H / 2, wickBottom: FC_MINI_H / 2, bodyY: FC_MINI_H / 2, bodyH: 0, up: true }

// 拖动状态（row=行索引；mode=body整体平移/high调最高/low调最低；min/max=拖动期间冻结的价格映射范围防跳变）
interface IFcMiniDrag {
	row: number
	mode: 'body' | 'high' | 'low'
	startClientY: number
	pxPerPrice: number
	orig: { O: number; H: number; L: number; C: number }
	min: number
	max: number
}
const fcMiniDrag = ref<IFcMiniDrag | null>(null)
let fcMiniWinBound = false

// 行迷你K线数据（拖动行用冻结范围渲染，其余行按自身高低价自适应）
const fcMinis = computed<IFcMini[]>(() => {
	const drag = fcMiniDrag.value
	return fcRows.value.map((r, i) => {
		if (!fcRowValid(r)) return EMPTY_FC_MINI
		const o = fcNum(r.O)
		const h = fcNum(r.H)
		const l = fcNum(r.L)
		const c = fcNum(r.C)
		let min: number
		let max: number
		if (drag && drag.row === i) {
			min = drag.min
			max = drag.max
		} else {
			const pad = Math.max(h - l, Math.abs(h) * 0.01, 0.01) * 0.08
			min = l - pad
			max = h + pad
		}
		const y = (v: number) => FC_MINI_PAD + ((max - v) / (max - min)) * (FC_MINI_H - FC_MINI_PAD * 2)
		const top = y(Math.max(o, c))
		const bottom = y(Math.min(o, c))
		return { valid: true, wickTop: y(h), wickBottom: y(l), bodyY: top, bodyH: Math.max(bottom - top, 1.5), up: c >= o }
	})
})

function fcMiniAt(i: number): IFcMini {
	return fcMinis.value[i] ?? EMPTY_FC_MINI
}

// 开始拖动（命中判定：距上端点≤6px 调最高、距下端点≤6px 调最低、否则整根平移）
function onFcMiniDown(e: MouseEvent, row: number) {
	const r = fcRows.value[row]
	if (!r || !fcRowValid(r)) return
	const rect = (e.currentTarget as SVGGraphicsElement).getBoundingClientRect()
	if (rect.height <= 0) return
	const m = fcMiniAt(row)
	const vy = (e.clientY - rect.top) * (FC_MINI_H / rect.height)
	const o = fcNum(r.O)
	const h = fcNum(r.H)
	const l = fcNum(r.L)
	const c = fcNum(r.C)
	const mode: IFcMiniDrag['mode'] = Math.abs(vy - m.wickTop) <= 6 ? 'high' : Math.abs(vy - m.wickBottom) <= 6 ? 'low' : 'body'
	const pad = Math.max(h - l, Math.abs(h) * 0.01, 0.01) * 0.08
	const min = l - pad
	const max = h + pad
	fcMiniDrag.value = {
		row,
		mode,
		startClientY: e.clientY,
		pxPerPrice: (max - min) / ((rect.height * (FC_MINI_H - FC_MINI_PAD * 2)) / FC_MINI_H),
		orig: { O: o, H: h, L: l, C: c },
		min,
		max
	}
	bindFcMiniDrag()
	e.preventDefault()
}

// 拖动中（像素位移换算价格位移；high/low 调整对应端点且不越过实体；body 四价平移且最低价>0）
function onFcMiniMove(e: MouseEvent) {
	const d = fcMiniDrag.value
	if (!d) return
	const r = fcRows.value[d.row]
	if (!r) return
	const delta = Math.round(((d.startClientY - e.clientY) / d.pxPerPrice) * 100) / 100
	const fmt = (v: number) => (Math.round(v * 100) / 100).toFixed(2)
	if (d.mode === 'high') {
		r.H = fmt(Math.max(d.orig.H + delta, Math.max(d.orig.O, d.orig.C)))
	} else if (d.mode === 'low') {
		r.L = fmt(Math.min(d.orig.L + delta, Math.min(d.orig.O, d.orig.C)))
	} else {
		let dl = delta
		if (d.orig.L + dl < 0.01) dl = 0.01 - d.orig.L
		r.O = fmt(d.orig.O + dl)
		r.H = fmt(d.orig.H + dl)
		r.L = fmt(d.orig.L + dl)
		r.C = fmt(d.orig.C + dl)
	}
	// 内容超出冻结范围时按需扩展（保证拖动中始终可见；界内拖动不缩放）
	const h = fcNum(r.H)
	const l = fcNum(r.L)
	const pad = Math.max(h - l, Math.abs(h) * 0.01, 0.01) * 0.08
	if (h + pad > d.max) d.max = h + pad
	if (l - pad < d.min) d.min = l - pad
}

// 结束拖动（切回实时范围渲染；移除 window 监听）
function endFcMiniDrag() {
	if (fcMiniWinBound) {
		fcMiniWinBound = false
		window.removeEventListener('mousemove', onFcMiniMove)
		window.removeEventListener('mouseup', endFcMiniDrag)
	}
	fcMiniDrag.value = null
}

// 绑定 window 级拖拽监听（鼠标移出小图仍可连续调整）
function bindFcMiniDrag() {
	if (fcMiniWinBound) return
	fcMiniWinBound = true
	window.addEventListener('mousemove', onFcMiniMove)
	window.addEventListener('mouseup', endFcMiniDrag)
}

// ---------- 组合K线图（近20日日K + 预测K线虚线 + 回本价参考线；编辑时随输入实时预览） ----------
const techChartEl = ref<HTMLElement | null>(null)
let techChart: echarts.ECharts | null = null

// 预测K线序列（编辑态=编辑行已填且合法的部分；否则=进行中预测锚点；均不含起点）
const fcChartPoints = computed(() => {
	const pts: { Date: string; O: number; H: number; L: number; C: number }[] = []
	if (fcBasePrice.value <= 0) return pts
	if (fcEditing.value) {
		fcRows.value.forEach(r => {
			if (!fcRowValid(r)) return
			pts.push({ Date: r.Date, O: fcNum(r.O), H: fcNum(r.H), L: fcNum(r.L), C: fcNum(r.C) })
		})
		return pts
	}
	const f = activeForecast.value
	if (f) {
		f.Anchors.forEach((a, i) => {
			if (i === 0) return
			const price = a.Price
			pts.push({
				Date: (a.Date ?? '').slice(0, 10),
				O: a.Open && a.Open > 0 ? a.Open : price,
				H: a.High && a.High > 0 ? a.High : price,
				L: a.Low && a.Low > 0 ? a.Low : price,
				C: price
			})
		})
	}
	return pts
})

// 渲染组合图（红涨绿跌：A股规范；预测K线=OHLC 实体虚影蜡烛；回本价橙色虚线）
function renderTechChart() {
	const el = techChartEl.value
	const hist = dayKlines.value.slice(-20)
	const base = fcBasePrice.value
	if (!el) return
	if (!hist.length || base <= 0) {
		techChart?.dispose()
		techChart = null
		return
	}
	if (!techChart || techChart.getDom() !== el) {
		techChart?.dispose()
		techChart = echarts.init(el)
	}
	const upColor = '#f56c6c'
	const downColor = '#67c23a'
	const pts = fcChartPoints.value
	const dates = [...hist.map(k => dayjs(k.Date).format('MM-DD')), ...pts.map(p => dayjs(p.Date).format('MM-DD'))]
	// 历史K线占位 + 预测K线（[索引, 开, 收, 低, 高]；空位用数组占位——混合标量会使维度推断错误导致取不到预测价）
	const fcData: number[][] = hist.map((_, i) => [i, NaN, NaN, NaN, NaN])
	pts.forEach((p, i) => {
		fcData.push([hist.length + i, p.O, p.C, p.L, p.H])
	})
	const bePrice = forecastModel.value && forecastModel.value.BePct > 0 ? forecastModel.value.BePrice : 0
	// 支撑/压力位（手动优先，不复权口径与日K一致；绘制参考线并纳入 y 轴范围）
	const lv = priceLevel.value
	const supPrice = lv && lv.support > 0 ? lv.support : 0
	const resPrice = lv && lv.resist > 0 ? lv.resist : 0
	// y 轴范围：历史 + 预测段 + 回本价 + 支撑/压力（上下留 6% 间隙；显式固定，预测K线始终可见）
	const yLows = hist.map(k => k.Low)
	const yHighs = hist.map(k => k.High)
	pts.forEach(p => {
		yLows.push(p.L)
		yHighs.push(p.H)
	})
	if (bePrice > 0) {
		yLows.push(bePrice)
		yHighs.push(bePrice)
	}
	if (supPrice > 0) {
		yLows.push(supPrice)
		yHighs.push(supPrice)
	}
	if (resPrice > 0) {
		yLows.push(resPrice)
		yHighs.push(resPrice)
	}
	let yMin = Math.min(...yLows)
	let yMax = Math.max(...yHighs)
	const yPad = (yMax - yMin) * 0.06 || yMax * 0.02
	yMin = Math.max(0, yMin - yPad)
	yMax = yMax + yPad
	techChart.setOption(
		{
			animation: false,
			grid: [
				{ left: 48, right: 14, top: 14, height: 168 },
				{ left: 48, right: 14, top: 206, height: 44 }
			],
			axisPointer: { link: [{ xAxisIndex: 'all' }] },
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'cross', label: { fontSize: 10 } },
				formatter: (ps: any) => {
					const arr = Array.isArray(ps) ? ps : [ps]
					const idx = arr.find((x: any) => x && x.dataIndex !== undefined)?.dataIndex as number
					if (idx === undefined || idx === null) return ''
					if (idx < hist.length) {
						const k = hist[idx]
						const d = idx > 0 ? ((k.Close - hist[idx - 1].Close) / hist[idx - 1].Close) * 100 : 0
						const color = k.Close >= k.Open ? upColor : downColor
						return `${dayjs(k.Date).format('YYYY-MM-DD')}<br/>开 ${k.Open.toFixed(2)} 高 ${k.High.toFixed(2)}<br/>低 ${k.Low.toFixed(2)} 收 <b style="color:${color}">${k.Close.toFixed(2)}</b><br/>涨跌幅 <b style="color:${color}">${d > 0 ? '+' : ''}${d.toFixed(2)}%</b><br/>量 ${Number(k.Volume || 0).toFixed(2)} 万手`
					}
					const j = idx - hist.length
					const p = pts[j]
					if (!p) return ''
					const prev = j === 0 ? base : pts[j - 1].C
					const d = (p.C - prev) / prev * 100
					const color = p.C >= p.O ? upColor : downColor
					return `${dayjs(p.Date).format('YYYY-MM-DD')}（预测）<br/>开 ${p.O.toFixed(2)} 高 ${p.H.toFixed(2)}<br/>低 ${p.L.toFixed(2)} 收 <b style="color:${color}">${p.C.toFixed(2)}</b><br/>较前日 <b style="color:${color}">${d > 0 ? '+' : ''}${d.toFixed(2)}%</b>`
				}
			},
			xAxis: [
				{
					type: 'category',
					gridIndex: 0,
					data: dates,
					axisLine: { lineStyle: { color: '#dcdfe6' } },
					axisTick: { show: false },
					axisLabel: { show: false }
				},
				{
					type: 'category',
					gridIndex: 1,
					data: dates,
					axisLine: { lineStyle: { color: '#dcdfe6' } },
					axisTick: { show: false },
					// 仅显示首尾日期标签（起始/结束日期；其余鼠标悬浮查看）
					axisLabel: {
						fontSize: 10,
						color: '#909399',
						interval: (index: number) => index === 0 || index === dates.length - 1
					}
				}
			],
			yAxis: [
				{
					gridIndex: 0,
					scale: true,
					min: yMin,
					max: yMax,
					axisLabel: { fontSize: 10, color: '#909399', formatter: (v: number) => v.toFixed(2) },
					splitLine: { lineStyle: { color: '#f0f2f5' } }
				},
				{
					gridIndex: 1,
					min: 0,
					axisLabel: { show: false },
					splitLine: { show: false }
				}
			],
			series: [
				{
					name: '日K',
					type: 'candlestick',
					data: hist.map(k => [k.Open, k.Close, k.Low, k.High]),
					itemStyle: { color: upColor, color0: downColor, borderColor: upColor, borderColor0: downColor },
					// 参考线：回本价（橙）+ 支撑位（绿）+ 压力位（红）；无则 undefined
					markLine: (() => {
						const marks: any[] = []
						if (bePrice > 0) {
							marks.push({
								yAxis: bePrice,
								label: { show: true, position: 'insideEndTop', formatter: `回本价 ${bePrice.toFixed(2)}`, fontSize: 10, color: '#b88230' },
								lineStyle: { type: 'dashed', color: '#e6a23c', width: 1.2 }
							})
						}
						if (supPrice > 0) {
							marks.push({
								yAxis: supPrice,
								label: { show: true, position: 'insideEndTop', formatter: `支撑 ${supPrice.toFixed(2)}`, fontSize: 10, color: '#529b2e' },
								lineStyle: { type: 'dashed', color: '#67c23a', width: 1.2 }
							})
						}
						if (resPrice > 0) {
							marks.push({
								yAxis: resPrice,
								label: { show: true, position: 'insideEndTop', formatter: `压力 ${resPrice.toFixed(2)}`, fontSize: 10, color: '#c45656' },
								lineStyle: { type: 'dashed', color: '#f56c6c', width: 1.2 }
							})
						}
						return marks.length
							? {
									silent: true,
									symbol: 'none',
									label: { show: true, fontSize: 10 },
									data: marks
								}
							: undefined
					})()
				},
				{
					name: '预测K线',
					type: 'custom',
					z: 5,
					data: fcData,
					renderItem: (_params: any, apiL: any) => {
						const oV = apiL.value(1)
						const cV = apiL.value(2)
						const lV = apiL.value(3)
						const hV = apiL.value(4)
						// 历史段占位项（NaN）不绘制
						if (![oV, cV, lV, hV].every((v: number) => isFinite(v))) return null
						const pHigh = apiL.coord([apiL.value(0), hV])
						const pLow = apiL.coord([apiL.value(0), lV])
						const pOpen = apiL.coord([apiL.value(0), oV])
						const pClose = apiL.coord([apiL.value(0), cV])
						const c = cV >= oV ? upColor : downColor
						const top = Math.min(pOpen[1], pClose[1])
						const h = Math.max(Math.abs(pOpen[1] - pClose[1]), 1.6)
						return {
							type: 'group',
							children: [
								// 影线（最高~最低；实体蜡烛）
								{
									type: 'line',
									shape: { x1: pHigh[0], y1: pHigh[1], x2: pLow[0], y2: pLow[1] },
									style: { stroke: c, lineWidth: 1.2 }
								},
								// 实体（开~收；实心填充，以「预」标注区分预测走势）
								{
									type: 'rect',
									shape: { x: pOpen[0] - 4.5, y: top, width: 9, height: h, r: 1 },
									style: { stroke: c, fill: c, lineWidth: 1.2 }
								}
							]
						}
					}
				},
				// 预测走势标注（每根预测K线上方「预」标记，形式类似 B/S/T 买卖点标记）
				...(pts.length
					? [
							{
								name: '预测走势',
								type: 'scatter' as const,
								data: pts.map((p, i) => [hist.length + i, p.H]),
								symbol: 'triangle',
								symbolSize: 8,
								symbolOffset: [0, -16],
								itemStyle: { color: '#409eff' },
								label: { show: true, position: 'top', formatter: '预', color: '#409eff', fontSize: 10, fontWeight: 'bold' },
								silent: true,
								z: 6
							}
						]
					: []),
				// 成交量
				{
					name: '成交量',
					type: 'bar',
					xAxisIndex: 1,
					yAxisIndex: 1,
					barWidth: '55%',
					data: hist.map(k => ({ value: k.Volume || 0, itemStyle: { color: k.Close >= k.Open ? upColor : downColor } }))
				}
			]
		},
		true
	)
	techChart.resize()
}

// 编辑态/预测点/支撑压力位变化时刷新组合图（即时预览）
watch([fcEditing, fcChartPoints, manualSupport, manualResist], () => {
	nextTick(() => renderTechChart())
})

// 补渲染：图表区块由 dayQuote/dayKlines 控制 v-if，数据晚到时容器才出现（如盘中实时快照晚到），
// 容器出现后需补画图表（仅当容器已就绪而图表缺失/未绑定该容器时渲染，避免行情刷新时重复重绘）
watch([dayQuote, () => trendData.value, () => dayKlines.value, () => trendEl.value, () => techChartEl.value], async () => {
	await nextTick()
	if (!props.modelValue) return
	if (trendEl.value && trendEl.value !== trendChart?.getDom() && hasTrend.value) renderTrendChart()
	if (techChartEl.value && techChartEl.value !== techChart?.getDom() && dayKlines.value.length) renderTechChart()
})

// 打开预测编辑（按预测天数重建行；已有进行中预测时预填其锚点 OHLC 并同步天数）
function openForecastEdit() {
	const base = fcBasePrice.value
	if (base <= 0) {
		ElMessage.warning('暂无收盘基准价，无法编辑预测')
		return
	}
	const f = activeForecast.value
	const anchorMap = new Map<string, { O: number; H: number; L: number; C: number }>()
	if (f) {
		f.Anchors.forEach((a, i) => {
			if (i === 0) return
			const c = a.Price
			anchorMap.set((a.Date ?? '').slice(0, 10), {
				O: a.Open && a.Open > 0 ? a.Open : c,
				H: a.High && a.High > 0 ? a.High : c,
				L: a.Low && a.Low > 0 ? a.Low : c,
				C: c
			})
		})
		// 已有预测天数回显（锚点数不含起点，1~5）
		if (anchorMap.size > 0) fcDays.value = Math.min(5, Math.max(1, anchorMap.size))
	}
	fcRows.value = tradeFutureDays.value.slice(0, fcDays.value).map(date => {
		const a = anchorMap.get(date)
		return a
			? { Date: date, O: a.O.toFixed(2), H: a.H.toFixed(2), L: a.L.toFixed(2), C: a.C.toFixed(2) }
			: { Date: date, O: '', H: '', L: '', C: '' }
	})
	if (!fcRows.value.length) ElMessage.warning('未获取到未来交易日历，可点击 AI 生成自动补全日期')
	aiForecastComment.value = ''
	fcEditing.value = true
}

// 保存走势预测（起点=最新收盘 + 各已填日预测K线；至少填 1 日；OHLC 不完整的行阻止保存）
async function onSaveForecast() {
	const base = fcBasePrice.value
	const baseDate = (dayKlines.value[dayKlines.value.length - 1]?.Date ?? curDate.value).slice(0, 10)
	const badIndex = fcRows.value.findIndex(r => fcRowBad(r))
	if (badIndex >= 0) {
		ElMessage.warning(`第 ${badIndex + 1} 日预测K线填写不完整或价格不合法（需四项齐全且 最低 ≤ 开/收 ≤ 最高）`)
		return
	}
	const anchors: IZdxForecastAnchor[] =
		base > 0 ? [{ Date: baseDate, Price: base, Open: base, High: base, Low: base }] : []
	fcRows.value.forEach(r => {
		if (!fcRowValid(r)) return
		anchors.push({ Date: r.Date, Price: fcNum(r.C), Open: fcNum(r.O), High: fcNum(r.H), Low: fcNum(r.L) })
	})
	if (anchors.length < 2) {
		ElMessage.warning('请至少填写第 1 日的预测K线（开盘/最高/最低/收盘）')
		return
	}
	fcSaving.value = true
	try {
		// 来源标记「表单快捷」（表格填写 / AI 生成，区别于复盘中心画图路径）
		await zdxApi.saveForecast({ StockCode: props.stockCode as string, Period: 'day', Anchors: anchors, Source: 2 })
		fcEditing.value = false
		ElMessage.success('走势预测已保存')
		await load()
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		fcSaving.value = false
	}
}

// AI 生成走势预测（结果按日期对齐填充到编辑行；行缺失时以 AI 返回日期建行）
async function onAiForecast() {
	aiForecastLoading.value = true
	try {
		const res = await zdxApi.aiReviewForecast(props.stockCode as string, fcDays.value)
		const base = fcBasePrice.value
		if (!res || !res.Anchors?.length || base <= 0) {
			ElMessage.warning('AI 未生成有效预测，请稍后重试')
			return
		}
		const map = new Map<string, { O: number; H: number; L: number; C: number }>()
		res.Anchors.forEach(a => {
			const c = a.Price
			map.set((a.Date ?? '').slice(0, 10), {
				O: a.Open && a.Open > 0 ? a.Open : c,
				H: a.High && a.High > 0 ? a.High : c,
				L: a.Low && a.Low > 0 ? a.Low : c,
				C: c
			})
		})
		if (!fcRows.value.length) {
			fcRows.value = res.Anchors.map(a => ({ Date: (a.Date ?? '').slice(0, 10), O: '', H: '', L: '', C: '' }))
		}
		let filled = 0
		fcRows.value.forEach(r => {
			const a = map.get(r.Date)
			if (!a) return
			r.O = a.O.toFixed(2)
			r.H = a.H.toFixed(2)
			r.L = a.L.toFixed(2)
			r.C = a.C.toFixed(2)
			filled++
		})
		aiForecastComment.value = res.Comment ?? ''
		ElMessage.success(filled ? 'AI 预测已生成，可调整后保存' : 'AI 预测与交易日历未对齐，请重试')
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		aiForecastLoading.value = false
	}
}

// 删除进行中预测
async function onDelForecast() {
	const f = activeForecast.value
	if (!f) return
	fcDeleting.value = true
	try {
		await zdxApi.delForecast(f.Id)
		ElMessage.success('已删除进行中预测')
		await load()
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		fcDeleting.value = false
	}
}

// ---------- 长线目标价（里程碑式：N 个交易日内到达目标收盘价；收盘价口径自动判定；仅向上） ----------
// 常用期限档位（交易日；另有「自定义」档位：flChoice=0 时用输入框天数）
const FC_LONG_PRESETS = [20, 60, 120, 250]
// 添加区状态（flChoice=选中档位天数；flCustomDays=自定义天数输入；flPrice=目标收盘价输入）
const flChoice = ref<number>(20)
const flCustomDays = ref('')
const flPrice = ref('')
const flSaving = ref(false)

// 长线目标相对起点涨幅（%）
function flPct(f: IZdxStockForecastLong) {
	return f.BasePrice > 0 ? (f.TargetPrice - f.BasePrice) / f.BasePrice * 100 : 0
}

// 当前选择的目标天数（自定义时取输入值；非法返回 0）
function flDaysValue() {
	if (flChoice.value > 0) return flChoice.value
	const v = Number(flCustomDays.value)
	return flCustomDays.value.trim() !== '' && isFinite(v) ? Math.floor(v) : 0
}

// 目标价相对最新收盘的预览（未填/非法返回空；低于最新收盘提示仅向上限制）
const flPreviewText = computed(() => {
	const p = Number(flPrice.value)
	const base = fcBasePrice.value
	if (flPrice.value.trim() === '' || !isFinite(p) || p <= 0) return ''
	if (base <= 0) return '暂无收盘基准价，无法校验'
	const pct = (p / base - 1) * 100
	return p > base ? `较最新收盘 ${fmtPct(pct)}` : `须高于最新收盘 ${base.toFixed(2)}`
})

// 保存长线目标（校验：天数 1~500、目标价高于最新收盘；同日数后端覆盖更新）
async function onSaveForecastLong() {
	const days = flDaysValue()
	if (days < 1 || days > 500) {
		ElMessage.warning('目标天数为 1~500 的交易日数')
		return
	}
	const p = Number(flPrice.value)
	if (flPrice.value.trim() === '' || !isFinite(p) || p <= 0) {
		ElMessage.warning('请输入有效的目标收盘价')
		return
	}
	const base = fcBasePrice.value
	if (base > 0 && p <= base) {
		ElMessage.warning(`目标价须高于最新收盘 ${base.toFixed(2)}（仅向上目标）`)
		return
	}
	flSaving.value = true
	try {
		await zdxApi.saveForecastLong({ StockCode: props.stockCode as string, Days: days, TargetPrice: p })
		ElMessage.success(`${days} 个交易日目标已保存`)
		flPrice.value = ''
		await load()
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		flSaving.value = false
	}
}

// 删除长线目标（确认后删除并刷新）
async function onDelForecastLong(f: IZdxStockForecastLong) {
	try {
		await ElMessageBox.confirm(`删除「${f.Days} 个交易日内 ${f.TargetPrice.toFixed(2)} 元」目标？`, '删除长线目标', { type: 'warning' })
	} catch {
		return
	}
	try {
		await zdxApi.delForecastLong(f.Id)
		ElMessage.success('已删除长线目标')
		await load()
	} catch {
		// 失败提示已由拦截器弹出
	}
}

// ---------- AI 形态识别（近 20 个交易日；结果落库保存，支持人工调整/删除） ----------
const aiPatternLoading = ref(false)
const aiPatternDone = ref(false)
const aiPatternAt = ref('')
const aiPatternItems = ref<IZdxAiPatternItem[]>([])

// 从服务端加载已保存的形态（打开抽屉/增删改后回显；未识别过返回空；seq 传入时丢弃过期响应）
async function loadPatterns(seq?: number) {
	aiPatternItems.value = []
	aiPatternDone.value = false
	aiPatternAt.value = ''
	const code = props.stockCode
	if (!code || !isStock.value) return
	try {
		const res = await zdxApi.getAiPatternList(code, curDate.value)
		if (seq !== undefined && seq !== loadSeq) return
		aiPatternItems.value = res?.Items ?? []
		aiPatternDone.value = true
	} catch {
		// 读取失败静默（不影响复盘编辑）
	}
}

// AI 识别（点击触发；结果由后端落库后返回完整列表）
async function onAiPattern() {
	if (aiPatternLoading.value) return
	aiPatternLoading.value = true
	try {
		const res = await zdxApi.aiReviewPattern(props.stockCode as string, curDate.value)
		aiPatternItems.value = res?.Items ?? []
		aiPatternAt.value = dayjs().format('MM-DD HH:mm')
		aiPatternDone.value = true
		ElMessage.success(aiPatternItems.value.length ? `识别出 ${aiPatternItems.value.length} 个形态，已保存` : '近 20 个交易日未识别出明显形态')
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		aiPatternLoading.value = false
	}
}

// 形态编辑弹窗（人工修正 AI 识别结果；保存后标记为人工；多根K线组合形态可选日期范围）
const patternEditVisible = ref(false)
const patternSaving = ref(false)
const patternEditForm = ref<IZdxAiPatternSaveForm>({ Id: 0, Date: '', Name: '', Direction: 3, Description: '' })
// 形态日期范围（[起始, 结束]；单日形态两端相同）
const patternEditRange = ref<[string, string]>(['', ''])

// 形态日期范围文案（单日=MM-DD；多日=MM-DD ~ MM-DD）
function patternDateText(p: IZdxAiPatternItem) {
	const d = (p.Date ?? '').slice(0, 10)
	const e = (p.EndDate ?? '').slice(0, 10)
	return e && e > d ? `${fmtDate(d)} ~ ${fmtDate(e)}` : fmtDate(d)
}

// 打开编辑弹窗
function openPatternEdit(p: IZdxAiPatternItem) {
	const d = (p.Date ?? '').slice(0, 10)
	const e = (p.EndDate ?? '').slice(0, 10)
	patternEditForm.value = {
		Id: p.Id,
		Date: d,
		EndDate: e && e > d ? e : undefined,
		Name: p.Name,
		Direction: p.Direction,
		Description: p.Description ?? ''
	}
	patternEditRange.value = [d, e && e > d ? e : d]
	patternEditVisible.value = true
}

// 保存人工修正（后端起效后将来源置为人工修正；结束日期晚于起始时提交，否则按单日）
async function onSavePatternEdit() {
	const f = patternEditForm.value
	const start = (patternEditRange.value?.[0] ?? '').slice(0, 10)
	const end = (patternEditRange.value?.[1] ?? '').slice(0, 10)
	if (!f.Id || !start || !f.Name.trim()) {
		ElMessage.warning('形态日期与名称不能为空')
		return
	}
	if (end && end < start) {
		ElMessage.warning('结束日期不能早于起始日期')
		return
	}
	patternSaving.value = true
	try {
		await zdxApi.saveAiPatternItem({
			Id: f.Id,
			Date: start,
			EndDate: end && end !== start ? end : undefined,
			Name: f.Name.trim(),
			Direction: f.Direction,
			Description: f.Description?.trim() || undefined
		})
		patternEditVisible.value = false
		ElMessage.success('形态已保存')
		await loadPatterns()
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		patternSaving.value = false
	}
}

// 删除形态（人工删除落库）
async function onDelPattern(p: IZdxAiPatternItem) {
	try {
		await ElMessageBox.confirm(`确定删除形态「${p.Name}」（${patternDateText(p)}）吗？`, '删除形态', {
			type: 'warning',
			confirmButtonText: '删除',
			cancelButtonText: '取消'
		})
	} catch {
		return
	}
	try {
		await zdxApi.delAiPatternItem(p.Id)
		ElMessage.success('已删除')
		await loadPatterns()
	} catch {
		// 失败提示已由拦截器弹出
	}
}

// ---------- 形态K线小图（每条形态截取日K窗口中对应片段，突出形态K线） ----------
interface IMiniCandle {
	x: number
	cx: number
	wickTop: number
	wickBottom: number
	bodyY: number
	bodyH: number
	up: boolean
}

interface IMiniChart {
	viewW: number
	candles: IMiniCandle[]
	bandX: number
	bandW: number
}

// 形态通常跨几根K线（用于小图高亮窗口宽度）
function patternSpan(name: string): number {
	if (/三兵|三只乌鸦|早晨之星|黄昏之星/.test(name)) return 3
	if (/吞没|乌云盖顶|曙光初现|孕线/.test(name)) return 2
	return 1
}

const MINI_SLOT = 13
const MINI_BODY = 7
const MINI_H = 44
const MINI_PAD = 4

// 形态对应的K线小图数据（取形态日期范围前后各 2 根作上下文；无法定位日期或数据不足返回 null）
const patternMinis = computed<(IMiniChart | null)[]>(() => {
	return aiPatternItems.value.map(p => {
		const d = (p.Date ?? '').slice(0, 10)
		const idx = dayKlines.value.findIndex(k => (k.Date ?? '').slice(0, 10) === d)
		if (idx < 0) return null
		// 形态结束索引：优先按 EndDate 定位（多根K线组合形态）；无/非法时按形态名跨度推测
		const dEnd = (p.EndDate ?? '').slice(0, 10)
		let endIdx = dEnd && dEnd > d ? dayKlines.value.findIndex(k => (k.Date ?? '').slice(0, 10) === dEnd) : -1
		if (endIdx < idx) endIdx = idx + patternSpan(p.Name) - 1
		endIdx = Math.min(endIdx, dayKlines.value.length - 1)
		const start = Math.max(0, idx - 2)
		const end = Math.min(dayKlines.value.length - 1, endIdx + 2)
		const win = dayKlines.value.slice(start, end + 1)
		if (win.length < 2) return null
		let min = Infinity
		let max = -Infinity
		win.forEach(k => {
			min = Math.min(min, k.Low)
			max = Math.max(max, k.High)
		})
		if (!isFinite(min) || !isFinite(max) || max <= min) return null
		const y = (v: number) => MINI_PAD + ((max - v) / (max - min)) * (MINI_H - MINI_PAD * 2)
		const candles: IMiniCandle[] = win.map((k, i) => {
			const top = y(Math.max(k.Open, k.Close))
			const bottom = y(Math.min(k.Open, k.Close))
			return {
				x: i * MINI_SLOT + (MINI_SLOT - MINI_BODY) / 2,
				cx: i * MINI_SLOT + MINI_SLOT / 2,
				wickTop: y(k.High),
				wickBottom: y(k.Low),
				bodyY: top,
				bodyH: Math.max(bottom - top, 1.2),
				up: k.Close >= k.Open
			}
		})
		const bandStart = Math.max(idx, start) - start
		const bandEnd = Math.min(endIdx, end) - start
		return {
			viewW: win.length * MINI_SLOT,
			candles,
			bandX: bandStart >= 0 ? bandStart * MINI_SLOT : -1,
			bandW: (bandEnd - bandStart + 1) * MINI_SLOT
		}
	})
})

const EMPTY_MINI: IMiniChart = { viewW: 84, candles: [], bandX: -1, bandW: 0 }
function patternMini(i: number): IMiniChart {
	return patternMinis.value[i] ?? EMPTY_MINI
}

// 形态方向文案（1看涨 2看跌 3中性）
function patternDirText(direction: number) {
	if (direction === 1) return '看涨'
	if (direction === 2) return '看跌'
	return '中性'
}

// ---------- AI 综合分析（近20日K线一键生成技术面/情绪面/复盘笔记/后续计划四段复盘初稿） ----------
const aiAnalyzeLoading = ref(false)

// AI 复盘分析（四块任一已有内容时确认覆盖；结果填充后可人工修正再保存）
async function onAiAnalyze() {
	if (!isStock.value) return
	const hasDraft = !!(techText.value.trim() || moods.value.length || moodText.value.trim() || content.value.trim() || planContent.value.trim())
	if (hasDraft) {
		try {
			await ElMessageBox.confirm('AI 复盘分析将覆盖当前的技术面、情绪面、复盘笔记、后续计划内容，确定继续吗？', 'AI 复盘分析', {
				type: 'warning',
				confirmButtonText: '覆盖并生成',
				cancelButtonText: '取消'
			})
		} catch {
			return
		}
	}
	aiAnalyzeLoading.value = true
	try {
		const res = await zdxApi.aiReviewAnalyze({
			StockCode: props.stockCode as string,
			Date: curDate.value,
			CandidateTags: [...ZDX_REVIEW_MOODS]
		})
		if (!res) {
			ElMessage.warning('AI 未返回分析结果，请稍后重试')
			return
		}
		let filled = 0
		if (res.Technical) {
			techText.value = res.Technical
			filled++
		}
		if (res.MoodTags?.length) {
			moods.value = Array.from(new Set(res.MoodTags))
			filled++
		}
		if (res.MoodSummary) {
			moodText.value = res.MoodSummary
			filled++
		}
		if (res.Note) {
			content.value = res.Note
			filled++
		}
		if (res.Plan) {
			planContent.value = res.Plan
			filled++
		}
		ElMessage.success(filled ? `AI 复盘分析完成（已填充 ${filled} 项），可人工修正后保存` : 'AI 未生成有效内容，请重试')
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		aiAnalyzeLoading.value = false
	}
}

// ---------- AI 情绪分析（标签建议 + 总结；总结支持人工修正） ----------
const aiMoodLoading = ref(false)

// AI 情绪分析（候选标签取本地常量，后端校验回传标签在候选内）
async function onAiMood() {
	aiMoodLoading.value = true
	try {
		const res = await zdxApi.aiReviewMood({
			StockCode: props.stockCode as string,
			Date: curDate.value,
			TechnicalText: techText.value || undefined,
			NewsText: newsText.value || undefined,
			CandidateTags: [...ZDX_REVIEW_MOODS]
		})
		if (!res) {
			ElMessage.warning('AI 未返回分析结果')
			return
		}
		if (res.Tags?.length) moods.value = Array.from(new Set(res.Tags))
		moodText.value = res.Summary ?? ''
		ElMessage.success('AI 情绪分析完成，已更新标签与总结，可人工修正')
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		aiMoodLoading.value = false
	}
}

// ---------- 上期复盘 AI 回归验证（仅下一次复盘可触发：对照上期之后的实际走势逐项验证走势预测/实盘目标价/后续计划，结果落库上期笔记） ----------
const prevScoreLoading = ref(false)

// 上期评分数据（读自上期笔记实体；尚未验证返回 null）
const prevScoreData = computed(() => {
	const n = ctx.value?.PrevNote
	if (!n || n.AiScore === undefined || n.AiScore === null) return null
	return { Score: n.AiScore, Text: n.AiScoreText ?? '', Time: n.AiScoreTime ?? '' }
})

// 评分分档文案
function scoreGradeText(score: number) {
	if (score >= 90) return '优秀'
	if (score >= 75) return '良好'
	if (score >= 60) return '及格'
	return '待改进'
}

// 评分分档样式（高分绿 / 低分红）
function scoreCls(score: number) {
	if (score >= 75) return 'is-good'
	if (score >= 60) return 'is-mid'
	return 'is-bad'
}

// 评分时间文案
function fmtScoreTime(t: string) {
	return t ? dayjs(t).format('MM-DD HH:mm') : ''
}

// AI 回归验证（对上期笔记评分；一次调用输出评分 + 逐项验证评语并落库上期笔记）
async function onScorePrev() {
	const n = ctx.value?.PrevNote
	if (!n) {
		ElMessage.warning('暂无上期复盘可验证')
		return
	}
	if (prevScoreLoading.value) return
	prevScoreLoading.value = true
	try {
		const res = await zdxApi.scoreReview(n.Id)
		if (!res) {
			ElMessage.warning('AI 回归验证失败，请稍后重试')
			return
		}
		n.AiScore = res.Score
		n.AiScoreText = res.Verify ?? ''
		n.AiScoreTime = res.ScoreTime
		emit('saved')
		ElMessage.success('AI 回归验证完成')
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		prevScoreLoading.value = false
	}
}
</script>

<style lang="scss" scoped>
.review-drawer {
	.rd-header {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	// 头部图标徽章（渐变底 + 白色图标）
	.rd-badge {
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

	.rd-head-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.rd-title {
		font-size: 16px;
		font-weight: 700;
		color: var(--el-text-color-primary);
	}

	.rd-range {
		font-size: 12px;
		color: var(--el-text-color-secondary);
		font-variant-numeric: tabular-nums;
	}

	.rd-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
		min-height: 200px;
	}

	.rd-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.rd-prev-plan {
		padding: 10px 12px;
		background: linear-gradient(135deg, #f0f7ff, #e8f3ff);
		border: 1px solid #d9ecff;
		border-left: 3px solid #409eff;
		border-radius: 10px;
	}

	.rpp-icon {
		font-size: 12px;
		color: #409eff;
	}

	.rpp-head {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.rpp-title {
		font-size: 12px;
		font-weight: 600;
		color: #409eff;
	}

	.rpp-date {
		font-size: 11px;
		color: var(--el-text-color-secondary);
		font-variant-numeric: tabular-nums;
	}

	.rpp-text {
		font-size: 12px;
		color: var(--el-text-color-regular);
		white-space: pre-wrap;
		word-break: break-all;
		max-height: 96px;
		overflow-y: auto;

		&.is-empty {
			color: var(--el-text-color-placeholder);
		}
	}

	.rd-summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 8px;
		padding: 14px 16px;
		background: linear-gradient(180deg, #f8fafd, #f2f6fc);
		border: 1px solid #eef2fa;
		border-radius: 12px;
	}

	.rs-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.rs-label {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	.rs-value {
		font-size: 14px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.rs-sub {
		font-size: 11px;
		color: var(--el-text-color-secondary);
	}

	// 区块标题右侧小注（口径/来源说明）
	.rd-sec-note {
		font-size: 11px;
		font-weight: 400;
		color: var(--el-text-color-secondary);
	}

	// 支撑/压力位“调整”入口（标题行右侧）
	.rd-lv-edit {
		display: flex;
		align-items: center;
		gap: 3px;
		margin-left: auto;
		font-size: 12px;
		font-weight: 400;
		color: #409eff;
		cursor: pointer;

		&:hover {
			opacity: 0.8;
		}
	}

	// 支撑/压力位展示卡（手动优先；距现价涨跌幅）
	.rd-level {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 8px 12px;
		padding: 12px 14px;
		background: linear-gradient(180deg, #f8fafd, #f2f6fc);
		border: 1px solid #eef2fa;
		border-radius: 12px;

		.rl-item {
			display: flex;
			flex-direction: column;
			gap: 2px;
			min-width: 0;
		}

		.rl-label {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 12px;
			color: var(--el-text-color-secondary);
		}

		.rl-badge {
			font-style: normal;
			padding: 0 5px;
			font-size: 10px;
			line-height: 16px;
			border-radius: 8px;
			color: #409eff;
			background: rgba(64, 158, 255, 0.12);

			&.auto {
				color: var(--el-text-color-secondary);
				background: rgba(144, 147, 153, 0.12);
			}
		}

		.rl-value {
			font-size: 15px;
			font-weight: 600;
			font-variant-numeric: tabular-nums;
		}

		.rl-sub {
			font-size: 11px;
			color: var(--el-text-color-secondary);
			font-variant-numeric: tabular-nums;
		}
	}

	// 支撑/压力位编辑区（调整态）
	.rd-level-edit {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px 14px;
		background: linear-gradient(180deg, #f8fafd, #f2f6fc);
		border: 1px solid #eef2fa;
		border-radius: 12px;

		.rle-row {
			display: flex;
			align-items: center;
			gap: 10px;
		}

		.rle-label {
			font-size: 12px;
			color: var(--el-text-color-secondary);
		}

		.rle-tip {
			font-size: 11px;
			color: var(--el-text-color-secondary);
		}
	}

	// 当日行情卡（价格 / 涨跌幅 / 量能 三行平铺）
	.rd-quote {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 12px 14px;
		background: linear-gradient(180deg, #f8fafd, #f2f6fc);
		border: 1px solid #eef2fa;
		border-radius: 12px;

		.rq-group {
			display: flex;
			flex-direction: column;
		}

		.rq-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
			gap: 8px 12px;
		}

		.rq-item {
			display: flex;
			flex-direction: column;
			gap: 2px;
			min-width: 0;
		}

		.rq-label {
			font-size: 12px;
			color: var(--el-text-color-secondary);
		}

		.rq-value {
			font-size: 14px;
			font-weight: 600;
			font-variant-numeric: tabular-nums;
		}

		.rq-sub {
			font-size: 11px;
			color: var(--el-text-color-secondary);
			font-variant-numeric: tabular-nums;
		}

		// 量能档位（可悬浮查看评定规则）
		.rq-vol {
			cursor: help;
		}

		.rq-vol-icon {
			font-size: 11px;
			color: #b6c6e3;
		}
	}

	// 个股交易数据卡（与汇总卡同款栅格）
	.rd-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 8px 12px;
		padding: 14px 16px;
		background: linear-gradient(180deg, #f8fafd, #f2f6fc);
		border: 1px solid #eef2fa;
		border-radius: 12px;
	}

	.rd-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.rd-sec-title {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 600;
		color: var(--el-text-color-primary);

		// 左侧渐变竖条（区块视觉锚点）
		&::before {
			content: '';
			width: 3px;
			height: 13px;
			flex: none;
			border-radius: 2px;
			background: linear-gradient(180deg, #6ba4ff, #409eff);
		}
	}

	// 插入模板按钮（复盘笔记标题行右侧）
	.rd-tpl-btn {
		margin-left: auto;
		font-size: 12px;
		font-weight: 400;
		color: #409eff;
		cursor: pointer;

		&:hover {
			opacity: 0.8;
		}
	}

	// 预测单位切换（买卖与成本标题行右侧；radio 明显可感知可切换）
	.rd-mp-switch {
		margin-left: auto;

		:deep(.el-radio-button__inner) {
			padding: 4px 10px;
			font-size: 12px;
		}
	}

	// 预测盈利合计（当日买卖与成本标题行；仅统计已填最低盈利预测的笔）
	.rd-mp-total {
		font-size: 12px;
		font-weight: 400;
		color: var(--el-text-color-secondary);

		b {
			font-weight: 600;
			font-variant-numeric: tabular-nums;
		}

		.rd-mp-total-sub {
			margin-left: 2px;
			color: var(--el-text-color-placeholder);
		}
	}

	.rd-records {
		max-height: 240px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.rd-record {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 5px 0;
		font-size: 12px;
		border-bottom: 1px dashed var(--el-border-color-lighter);

		&:last-child {
			border-bottom: none;
		}
	}

	.rr-date {
		color: var(--el-text-color-secondary);
		font-variant-numeric: tabular-nums;
		width: 44px;
		flex: none;
	}

	.rr-stock {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.rr-vol {
		color: var(--el-text-color-secondary);
		font-variant-numeric: tabular-nums;
	}

	.rr-amount {
		font-variant-numeric: tabular-nums;
		width: 76px;
		text-align: right;
		flex: none;
	}

	// 当日操作复盘：持仓成本参考条
	.rd-pos {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
		padding: 8px 12px;
		font-size: 12px;
		color: var(--el-text-color-regular);
		background: linear-gradient(135deg, #f0f7ff, #e8f3ff);
		border: 1px solid #d9ecff;
		border-radius: 10px;

		.rp-title {
			font-weight: 600;
			color: #409eff;
		}

		.rp-item {
			font-variant-numeric: tabular-nums;

			b {
				font-weight: 600;
			}
		}

		.rp-pct {
			margin-left: 4px;
			font-style: normal;
		}
	}

	// 日内分时卡（浅色底 + 图表容器 + 空态）
	.rd-trend {
		padding: 8px 10px 4px;
		background: linear-gradient(180deg, #f8fafd, #f2f6fc);
		border: 1px solid #eef2fa;
		border-radius: 12px;
	}

	.rd-trend-chart {
		width: 100%;
		height: 240px;
	}

	.rd-trend-empty {
		height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	// 买卖合并块（买入红系 / 卖出绿系；头部徽标 + 逐笔行）
	.rd-deal-group {
		border: 1px solid #eef2fa;
		border-radius: 10px;
		background: #fbfcfe;
		overflow: hidden;

		&.is-buy {
			border-color: #fde2e2;

			.rdg-head {
				background: linear-gradient(135deg, #fef0f0, #fde6e6);
			}

			.rdg-badge {
				background: linear-gradient(135deg, #f78989, #f56c6c);
			}

			.rdg-time {
				color: #d4574a;
			}
		}

		&.is-sell {
			border-color: #e1f3d8;

			.rdg-head {
				background: linear-gradient(135deg, #f0f9eb, #e7f5db);
			}

			.rdg-badge {
				background: linear-gradient(135deg, #85ce61, #67c23a);
			}

			.rdg-time {
				color: #529b2e;
			}
		}
	}

	.rdg-head {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		padding: 8px 12px;
	}

	.rdg-badge {
		padding: 1px 10px;
		border-radius: 10px;
		font-size: 12px;
		font-weight: 600;
		color: #fff;
		flex: none;
	}

	.rdg-sum {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		font-size: 12px;
		color: var(--el-text-color-regular);
		font-variant-numeric: tabular-nums;

		b {
			font-weight: 600;
		}
	}

	.rdg-row {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 8px 12px;
		border-top: 1px dashed var(--el-border-color-lighter);
	}

	.rdg-info {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		font-size: 12px;
		font-variant-numeric: tabular-nums;
	}

	.rdg-time {
		font-weight: 600;
	}

	.rdg-fee,
	.rdg-bal {
		color: var(--el-text-color-secondary);
	}

	.rdg-cost b {
		font-weight: 600;
	}

	.rdg-ref {
		font-weight: 600;
	}

	.rdg-form {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;

		// 操作说明占满剩余宽度（抽屉较窄时预测输入区整体折行，避免被挤压）
		.el-input:first-child {
			flex: 1;
			min-width: 180px;
		}
	}

	.rdg-mp {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
		flex: none;
		max-width: 100%;

		.rdg-mp-input {
			width: 112px;
		}

		// 预测期限输入（交易日：N 个交易日内到达目标价；宽度对齐长线目标卡天数输入）
		.rdg-mp-days {
			width: 72px;
		}

		.rdg-mp-conv {
			min-width: 84px;
			font-size: 12px;
			color: var(--el-color-primary);
			white-space: nowrap;
			font-variant-numeric: tabular-nums;
		}
	}

	// 盈利预测卡
	.rd-pf {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px 14px;
		background: linear-gradient(180deg, #f8fafd, #f2f6fc);
		border: 1px solid #eef2fa;
		border-radius: 12px;
	}

	.rd-pf-head {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 14px;
		font-size: 12px;
		color: var(--el-text-color-regular);
		font-variant-numeric: tabular-nums;

		b {
			font-weight: 600;
		}
	}

	// 回本行（按语义配色：需上涨回本=红系；已浮盈=绿系；A股红涨绿跌）
	.rd-pf-be {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px 8px;
		font-size: 12px;
		padding: 8px 12px;
		border-radius: 10px;
		color: var(--el-text-color-regular);
		font-variant-numeric: tabular-nums;

		b {
			font-weight: 700;
			font-size: 14px;
		}

		// 需要上涨才能回本：涨幅是"涨"方向 → 红色（danger）
		&.is-need-up {
			background: linear-gradient(135deg, #fef0f0, #fde9e9);
			border: 1px solid #fde2e2;

			.rd-pf-be-icon,
			b {
				color: var(--el-color-danger);
			}
		}

		// 已浮盈：状态已达成 → 绿色主题（金额仍按涨跌红绿着色）
		&.is-profit {
			background: linear-gradient(135deg, #f0f9eb, #e9f6df);
			border: 1px solid #e1f3d8;

			.rd-pf-be-icon {
				color: var(--el-color-success);
			}
		}
	}

	.rd-pf-be-icon {
		font-size: 13px;
	}

	// 回本行说明小字（换行展示在下方）
	.rd-pf-be-sub {
		width: 100%;
		font-size: 11px;
		color: var(--el-text-color-secondary);
	}

	.rd-pf-list {
		display: flex;
		flex-direction: column;
	}

	.rd-pf-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 5px 2px;
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		border-bottom: 1px dashed var(--el-border-color-lighter);

		&:last-child {
			border-bottom: none;
		}
	}

	.rd-pf-pct {
		width: 48px;
		flex: none;
		font-weight: 600;
	}

	.rd-pf-price {
		color: var(--el-text-color-secondary);
	}

	// 未扣卖出费用的浮盈（毛盈亏）
	.rd-pf-gross {
		margin-left: auto;
		width: 130px;
		text-align: right;
		color: var(--el-text-color-secondary);

		b {
			font-weight: 600;
		}
	}

	// 净盈亏（已扣卖出费用）
	.rd-pf-profit {
		width: 138px;
		text-align: right;
		color: var(--el-text-color-secondary);

		b {
			font-weight: 600;
		}
	}

	// 结合进行中预测目标行
	.rd-pf-fc {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
		font-size: 12px;
		padding: 6px 10px;
		border-radius: 8px;
		background: rgba(230, 162, 60, 0.1);
		color: var(--el-text-color-regular);
		font-variant-numeric: tabular-nums;

		b {
			font-weight: 600;
		}
	}

	.rd-pf-fc-icon {
		font-size: 12px;
		color: #e6a23c;
	}

	.rd-pf-note {
		font-size: 11px;
		color: var(--el-text-color-secondary);
	}

	// 走势预测卡：进行中摘要条
	.rd-fc-now {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		padding: 8px 12px;
		font-size: 12px;
		color: var(--el-text-color-regular);
		background: linear-gradient(135deg, #fff8ec, #fdf1dd);
		border: 1px solid #f8e3c0;
		border-radius: 10px;
		font-variant-numeric: tabular-nums;

		.rfn-badge {
			padding: 1px 10px;
			border-radius: 10px;
			font-size: 12px;
			font-weight: 600;
			color: #fff;
			background: linear-gradient(135deg, #f0b25f, #e6a23c);
			flex: none;
		}

		.rfn-range {
			color: var(--el-text-color-secondary);
		}

		b {
			font-weight: 600;
		}

		.rfn-del {
			margin-left: auto;
		}
	}

	// 走势预测空态
	.rd-fc-empty {
		padding: 10px 12px;
		font-size: 12px;
		color: var(--el-text-color-secondary);
		background: #fbfcfe;
		border: 1px dashed var(--el-border-color-lighter);
		border-radius: 10px;
		text-align: center;
	}

	// 长线目标价卡（里程碑式：N 个交易日内到达目标收盘价；绿系与短线橙色卡区分）
	.rd-fl {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px 12px;
		background: linear-gradient(135deg, #f2fbf6, #e9f7f0);
		border: 1px solid #cdeadd;
		border-radius: 10px;

		.rd-fl-head {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 8px;

			.rd-fl-title {
				font-size: 12px;
				font-weight: 600;
				color: #2e7d5b;
			}

			.rd-fl-note {
				font-size: 11px;
				color: var(--el-text-color-secondary);
			}
		}

		.rd-fl-list {
			display: flex;
			flex-direction: column;
			gap: 6px;
		}

		.rd-fl-row {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 10px;
			padding: 6px 10px;
			font-size: 12px;
			color: var(--el-text-color-regular);
			background: #fff;
			border: 1px solid #d9efe4;
			border-radius: 8px;
			font-variant-numeric: tabular-nums;

			.rd-fl-days {
				flex: none;
				padding: 1px 8px;
				border-radius: 8px;
				font-size: 11px;
				color: #fff;
				background: linear-gradient(135deg, #52b788, #40916c);
			}

			.rd-fl-price {
				font-weight: 600;
				color: #2e7d5b;
			}

			.rd-fl-base {
				font-size: 11px;
				color: var(--el-text-color-secondary);
			}

			.rd-fl-st {
				flex: none;
				padding: 1px 7px;
				border-radius: 6px;
				font-size: 10px;
				color: #1f9254;
				background: #e6f7ee;
			}

			.rd-fl-st.is-bad {
				color: #cf1322;
				background: #fff1f0;
			}

			.rd-fl-del {
				margin-left: auto;
				font-size: 11px;
				color: var(--el-color-danger);
				cursor: pointer;
			}
		}

		.rd-fl-empty {
			padding: 8px 10px;
			font-size: 12px;
			color: var(--el-text-color-secondary);
			background: #fff;
			border: 1px dashed #cdeadd;
			border-radius: 8px;
			text-align: center;
		}

		.rd-fl-add {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 8px;

			.rd-fl-in {
				width: 100px;

				&.is-days {
					width: 64px;
				}
			}

			.rd-fl-preview {
				font-size: 11px;
				color: var(--el-text-color-secondary);
			}
		}
	}

	// 走势预测编辑区
	.rd-fc-edit {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px 14px;
		background: #fff;
		border: 1px solid var(--el-border-color-lighter);
		border-radius: 10px;
	}

	.rfe-base {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		font-size: 12px;
		color: var(--el-text-color-regular);
		font-variant-numeric: tabular-nums;

		b {
			font-weight: 600;
		}

		// 预测天数选择（1~5 日）
		.rfe-days {
			display: inline-flex;
			align-items: center;
			gap: 6px;

			.rfe-days-label {
				font-size: 12px;
				color: var(--el-text-color-secondary);
			}
		}

		.rfe-base-note {
			margin-left: auto;
			font-size: 11px;
			color: var(--el-text-color-secondary);
		}
	}

	// 列头与数据行共享列宽（保证纵向对齐）
	.rfe-head,
	.rfe-row {
		display: flex;
		align-items: center;
		gap: 8px;

		.rfe-day {
			width: 48px;
			flex: none;
		}

		.rfe-date {
			width: 48px;
			flex: none;
		}

		.rfe-pct {
			width: 56px;
			flex: none;
			text-align: right;
		}

		.rfe-mini-h,
		.rfe-mini {
			width: 44px;
			flex: none;
		}
	}

	.rfe-head {
		padding: 0 2px 2px;
		font-size: 11px;
		color: var(--el-text-color-placeholder);

		.rfe-col {
			flex: 1;
			min-width: 0;
			text-align: center;
		}
	}

	.rfe-row {
		font-size: 12px;
		font-variant-numeric: tabular-nums;

		.rfe-day {
			font-weight: 600;
		}

		.rfe-date {
			color: var(--el-text-color-secondary);
		}

		.rfe-input {
			flex: 1;
			min-width: 0;
		}

		.rfe-pct {
			font-weight: 600;
		}

		// 填写不完整/不合法时红框提示
		&.is-bad :deep(.el-input__wrapper) {
			box-shadow: 0 0 0 1px var(--el-color-danger) inset;
		}
	}

	// 行迷你K线（形态小图：拖动实体平移整根K线、拖动上下影线端点调最高/最低）
	.rfe-mini {
		display: flex;
		align-items: center;
		justify-content: center;

		.rfm-svg {
			display: block;
			width: 44px;
			height: 44px;
			cursor: ns-resize;
			user-select: none;
		}

		.rfm-up {
			fill: #f56c6c;
			stroke: #f56c6c;
		}

		.rfm-down {
			fill: #67c23a;
			stroke: #67c23a;
		}

		.rfm-handle {
			fill: #fff;
			stroke: #409eff;
			stroke-width: 1.4;
		}

		.rfm-empty {
			font-size: 12px;
			color: var(--el-text-color-placeholder);
		}
	}

	.rfe-ai-comment {
		padding: 6px 10px;
		font-size: 12px;
		color: var(--el-color-primary);
		background: rgba(64, 158, 255, 0.08);
		border-radius: 8px;
	}

	.rfe-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;

		.rfe-tip {
			font-size: 11px;
			color: var(--el-text-color-secondary);
		}

		.rfe-btns {
			display: flex;
			align-items: center;
		}
	}

	// 预测编辑栅格（单列：列头 + 逐日行；四价输入与列头对齐）
	.rfe-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 6px;
	}

	// 走势预测 × 技术形态 合并卡
	.rd-tech {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 12px 14px;
		background: linear-gradient(180deg, #f8fafd, #f2f6fc);
		border: 1px solid #eef2fa;
		border-radius: 12px;
	}

	.rd-tech-chart {
		width: 100%;
		height: 280px;
		background: #fff;
		border: 1px solid var(--el-border-color-lighter);
		border-radius: 10px;
	}

	.rd-tech-empty {
		height: 110px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		color: var(--el-text-color-secondary);
		background: #fff;
		border: 1px dashed var(--el-border-color-lighter);
		border-radius: 10px;
	}

	// 图例（红绿K线 / 预测走势 / 回本价参考线）
	.rd-tech-legend {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px 16px;
		font-size: 11px;
		color: var(--el-text-color-secondary);

		.rtl-item {
			display: inline-flex;
			align-items: center;
			gap: 5px;
		}

		.rtl-ic {
			display: inline-block;
			width: 16px;
			height: 10px;
			flex: none;
		}

		// 红涨绿跌双色块
		.rtl-candle {
			background: linear-gradient(90deg, #f56c6c 50%, #67c23a 50%);
			border-radius: 2px;
		}

		// 预测走势实体块（呼应「预」标记）
		.rtl-dash {
			background: #409eff;
			border-radius: 2px;
		}

		// 回本价参考线
		.rtl-line {
			height: 0;
			border-top: 2px dashed #e6a23c;
		}

		// 支撑位参考线（绿）
		.rtl-line-sup {
			height: 0;
			border-top: 2px dashed #67c23a;
		}

		// 压力位参考线（红）
		.rtl-line-res {
			height: 0;
			border-top: 2px dashed #f56c6c;
		}
	}

	// AI 形态识别子块（内嵌合并卡）
	.rd-tech-patterns {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-top: 10px;
		border-top: 1px dashed #e4ebf7;
	}

	.rd-tp-head {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		font-size: 12px;
		font-weight: 600;
		color: var(--el-text-color-primary);
	}

	.rd-tp-icon {
		margin-right: 4px;
		color: #409eff;
	}

	.rd-tp-note {
		font-size: 11px;
		font-weight: 400;
		color: var(--el-text-color-secondary);
	}

	// AI 形态识别列表（含对应K线小图）
	.rd-patterns {
		display: flex;
		flex-direction: column;
		padding: 4px 10px;
		background: #fff;
		border: 1px solid var(--el-border-color-lighter);
		border-radius: 10px;
	}

	.rdp-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 0;
		font-size: 12px;
		border-bottom: 1px dashed var(--el-border-color-lighter);

		&:last-of-type {
			border-bottom: none;
		}
	}

	// 形态对应K线小图（SVG；形态区间带高亮）
	.rdp-k {
		width: 108px;
		height: 44px;
		flex: none;
		background: #fafcff;
		border: 1px solid #eef2fa;
		border-radius: 6px;

		.rdp-k-band {
			fill: rgba(64, 158, 255, 0.09);
		}

		.rdp-k-up {
			fill: #f56c6c;
			stroke: #f56c6c;
			stroke-width: 1.2;
		}

		.rdp-k-down {
			fill: #67c23a;
			stroke: #67c23a;
			stroke-width: 1.2;
		}
	}

	.rdp-main {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}

	.rdp-line {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.rdp-date {
		color: var(--el-text-color-secondary);
		font-variant-numeric: tabular-nums;
	}

	.rdp-name {
		font-weight: 600;
	}

	// 人工修正标记
	.rdp-src {
		padding: 0 6px;
		font-size: 11px;
		color: #b88230;
		background: #fdf6ec;
		border: 1px solid #f5dab1;
		border-radius: 8px;
	}

	// 形态操作（编辑/删除）
	.rdp-acts {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.rdp-act {
		font-size: 12px;
		color: var(--el-color-primary);
		cursor: pointer;
		user-select: none;

		&:hover {
			opacity: 0.8;
		}

		&.is-del {
			color: var(--el-color-danger);
		}
	}

	.rdp-desc {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--el-text-color-regular);
	}

	.rd-patterns-tip {
		padding: 10px 12px;
		font-size: 12px;
		color: var(--el-text-color-secondary);
		background: #fbfcfe;
		border: 1px dashed var(--el-border-color-lighter);
		border-radius: 10px;
		text-align: center;
	}

	.rd-moods {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.rd-mood {
		padding: 3px 12px;
		font-size: 12px;
		border-radius: 14px;
		border: 1px solid var(--el-border-color);
		color: var(--el-text-color-regular);
		cursor: pointer;
		user-select: none;
		transition: all 0.15s;

		&:hover {
			border-color: var(--el-color-primary-light-5);
			color: var(--el-color-primary);
		}

		&.active {
			background: linear-gradient(135deg, #6ba4ff, #409eff);
			border-color: #409eff;
			color: #fff;
			box-shadow: 0 3px 8px rgba(64, 158, 255, 0.28);
		}
	}

	// 上期复盘 AI 回归验证卡（高分绿、低分红）
	.rd-score {
		margin-top: 6px;
		padding: 10px 12px;
		border: 1px solid var(--el-border-color-lighter);
		border-radius: 10px;
		background: #fbfcfe;

		.rds-head {
			display: flex;
			align-items: baseline;
			gap: 8px;
			margin-bottom: 4px;
		}

		.rds-num {
			font-size: 26px;
			font-weight: 700;
			line-height: 1;
			font-variant-numeric: tabular-nums;
		}

		.rds-unit {
			font-size: 12px;
			color: var(--el-text-color-secondary);
		}

		.rds-grade {
			font-size: 12px;
			font-weight: 600;
		}

		.rds-tag {
			margin-left: auto;
			padding: 1px 8px;
			font-size: 11px;
			color: #409eff;
			background: rgba(64, 158, 255, 0.1);
			border-radius: 8px;
		}

		.rds-time {
			font-size: 11px;
			color: var(--el-text-color-secondary);
		}

		.rds-text {
			font-size: 12px;
			line-height: 1.7;
			color: var(--el-text-color-regular);
			white-space: pre-wrap;
			word-break: break-all;
		}

		&.is-good .rds-num,
		&.is-good .rds-grade {
			color: #67c23a;
		}

		&.is-mid .rds-num,
		&.is-mid .rds-grade {
			color: #e6a23c;
		}

		&.is-bad .rds-num,
		&.is-bad .rds-grade {
			color: #f56c6c;
		}
	}

	.rd-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-top: 1px solid var(--el-border-color-lighter);
		padding-top: 12px;
	}

	// 按钮内图标（保存复盘）
	.rd-btn-icon {
		margin-right: 5px;
	}

	// 输入区圆角统一
	:deep(.el-textarea__inner) {
		border-radius: 8px;
	}

	.rd-footer-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.rd-updated {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	.up {
		color: var(--el-color-danger);
	}

	.down {
		color: var(--el-color-success);
	}
}

// 档位设置弹窗（teleport 到 body，独立于抽屉作用域）
.rd-steps-dialog {
	.rd-steps-tip {
		margin-bottom: 10px;
		font-size: 12px;
		line-height: 1.7;
		color: var(--el-text-color-secondary);
	}
}

// 量能档位规则气泡（tooltip teleport 到 body，独立于抽屉作用域）
.rq-vol-tip {
	width: 238px;
	display: flex;
	flex-direction: column;
	gap: 3px;
	font-size: 12px;
	color: var(--el-text-color-regular);

	.rvt-title {
		display: flex;
		flex-direction: column;
		gap: 1px;
		margin-bottom: 3px;
		font-size: 12px;
		font-weight: 600;
		color: var(--el-text-color-primary);

		span {
			font-size: 11px;
			font-weight: 400;
			color: var(--el-text-color-secondary);
		}
	}

	.rvt-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 2px 6px;
		border-radius: 5px;
		font-variant-numeric: tabular-nums;

		&.cur {
			background: rgba(64, 158, 255, 0.12);
			font-weight: 600;
		}

		.rvt-range {
			font-size: 11px;
			color: var(--el-text-color-secondary);
		}

		.rvt-name {
			&.up {
				color: var(--el-color-danger);
			}

			&.down {
				color: var(--el-color-success);
			}
		}
	}

	.rvt-now {
		margin-top: 3px;
		padding-top: 6px;
		border-top: 1px dashed var(--el-border-color-lighter);
		font-size: 11px;
		line-height: 1.6;
		color: var(--el-text-color-secondary);
		font-variant-numeric: tabular-nums;
	}
}
</style>
