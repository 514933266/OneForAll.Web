<template>
	<div class="my-zone">
		<!-- 头部档案卡（头像/签名 + 双入口 + 流派与实测对照状态行） -->
		<div class="profile-card">
			<!-- 头像（点击上传，≤500KB；与个人中心同款上传服务） -->
			<el-upload
				:action="baseApi.getUploadHeaderUrl()"
				accept="image/*"
				:show-file-list="false"
				:before-upload="beforeAvatarUpload"
				:on-success="onAvatarSuccess"
				:on-error="onAvatarError"
				:headers="uploadHeaders"
				class="avatar-upload"
			>
				<el-avatar :size="72" :src="domain + (userStoreRef.user.value?.IconUrl || '')" class="pc-avatar">
					<font-awesome-icon fas icon="user"></font-awesome-icon>
				</el-avatar>
				<div class="avatar-mask"><font-awesome-icon fas icon="camera"></font-awesome-icon></div>
			</el-upload>

			<!-- 昵称 / 账号 / 签名 / 标签 / 状态行 -->
			<div class="pc-mid">
				<div class="pc-name-row">
					<span class="pc-name">{{ userStoreRef.user.value?.Name || '--' }}</span>
					<span class="pc-account">@{{ userStoreRef.user.value?.UserName }}</span>
				</div>
				<div class="pc-sign-row">
					<font-awesome-icon fas icon="signature" class="pc-sign-icon"></font-awesome-icon>
					<template v-if="!signEditing">
						<span class="pc-sign-text" :class="{ empty: !userStoreRef.user.value?.Signature }">
							{{ userStoreRef.user.value?.Signature || '写上你的交易格言…' }}
						</span>
						<el-button link type="primary" size="small" @click="openSignEdit">
							<font-awesome-icon fas icon="pen"></font-awesome-icon>
						</el-button>
					</template>
					<el-input
						v-else
						v-model="signInput"
						size="small"
						maxlength="50"
						class="pc-sign-input"
						placeholder="输入签名后回车保存"
						@keyup.enter="saveSign"
						@blur="saveSign"
					></el-input>
				</div>
				<!-- 第三行：行为标签（画像分析后展示前 4 个，悬浮查看说明） -->
				<div v-if="behaviorTags.length" class="pc-tags-row">
					<font-awesome-icon fas icon="tags" class="pc-tags-icon"></font-awesome-icon>
					<span v-for="t in behaviorTags" :key="t.Text" class="pc-tag" :class="'pt-' + (t.Tone || 'info')" :title="t.Description || t.Text">{{ t.Text }}</span>
					<span v-if="behaviorTagMore > 0" class="pc-tags-more">+{{ behaviorTagMore }}</span>
				</div>
				<!-- 第四行：流派 / 实测 / 对照 状态行 -->
				<div class="pc-status-row">
					<span class="pc-chip" :class="'tone-' + (myProfile?.SchoolTone || 'info')" @click="schoolDialogVisible = true">
						<font-awesome-icon v-if="myProfile?.SchoolId && myProfile.SchoolIcon" fas :icon="myProfile.SchoolIcon" class="pc-chip-ico"></font-awesome-icon>
						<span v-if="myProfile?.SchoolId" class="pc-chip-text">我的流派 · {{ myProfile.SchoolName }}</span>
						<span v-else class="pc-chip-text unrated">尚未评定流派 · 点击选择</span>
						<el-tag v-if="myProfile?.SchoolId && !myProfile.SchoolEnabled" size="small" type="info">已停用</el-tag>
					</span>
					<span class="pc-chip plain">
						<font-awesome-icon fas icon="chart-simple" class="pc-chip-ico"></font-awesome-icon>
						<span class="pc-chip-text">系统实测 · {{ behaviorStats?.TradeStyle || '暂无数据' }}</span>
					</span>
					<span class="pc-compare" :class="cmpTip.tone">
						<font-awesome-icon fas :icon="cmpTip.icon" class="pc-compare-ico"></font-awesome-icon>
						{{ cmpTip.text }}
					</span>
				</div>
			</div>

			<!-- 双入口（深蓝渐变卡上的白色系按钮） -->
			<div class="pc-right">
				<el-button class="btn-import" @click="triggerImport">
					<font-awesome-icon fas icon="file-excel"></font-awesome-icon>&nbsp;导入交易流水
				</el-button>
				<el-button class="btn-rate" @click="schoolDialogVisible = true">
					<font-awesome-icon fas icon="crosshairs"></font-awesome-icon>&nbsp;流派评定
				</el-button>
			</div>

			<!-- 右下角：前往复盘中心（小字文字链，自动携带当前选中股票） -->
			<span class="pc-review-link" @click="gotoReview()">前往复盘中心 &gt;&gt;&gt;</span>
		</div>

		<!-- 概览卡片行 -->
		<div class="overview-row">
			<div v-for="(c, i) in overviewCards" :key="i" class="overview-card">
				<div class="oc-top"><div class="card-label">{{ c.label }}</div><span class="card-icon" :class="c.tint"><font-awesome-icon fas :icon="c.icon"></font-awesome-icon></span></div>
				<div class="card-value" :class="c.cls">{{ c.value }}</div>
				<div class="card-sub" :title="c.sub">{{ c.sub }}</div>
			</div>
		</div>

		<!-- 自选/持仓区（点击列表个股跳转个股行情页面） -->
		<div class="watch-box">
			<div class="watch-left">
				<div class="box-title">自选 / 持仓</div>
				<el-select
					v-model="addCode"
					class="add-select"
					filterable
					remote
					reserve-keyword
					clearable
					:remote-method="searchStocks"
					:loading="searchLoading"
					placeholder="搜索代码/名称加自选"
					@change="onAddSelect"
				>
					<template #prefix>
						<font-awesome-icon fas icon="search" class="search-icon"></font-awesome-icon>
					</template>
					<el-option v-for="s in searchOptions" :key="s.Code" :label="`${s.Code} ${s.Name}`" :value="s.Code"></el-option>
				</el-select>
				<div v-loading="watchLoading" class="watch-list">
					<div
						v-for="w in watchRows"
						:key="w.StockCode"
						class="watch-item"
						:class="{ active: w.StockCode === watchCode }"
						@click="gotoStockDetail(w.StockCode)"
					>
						<div class="w-left">
							<div class="w-name-row">
								<span class="w-name">{{ w.StockName || '--' }}</span>
								<span v-if="w.HoldVolume" class="w-hold">持 {{ fmtVolume(w.HoldVolume) }}</span>
							</div>
							<div class="w-code">{{ w.StockCode }}</div>
						</div>
						<div class="w-right">
							<div class="w-price" :class="changeClass(w.ChangePercent)">{{ w.Price ? w.Price.toFixed(2) : '--' }}</div>
							<div class="w-change" :class="changeClass(w.ChangePercent)">{{ formatPercent(w.ChangePercent ?? 0) }}</div>
						</div>
						<span v-if="w.IsWatch" class="w-remove" title="移除自选" @click.stop="removeWatch(w.StockCode)">
							<font-awesome-icon fas icon="xmark"></font-awesome-icon>
						</span>
					</div>
					<div v-if="!watchLoading && !positionLoading && !watchRows.length" class="watch-empty">
						暂无自选与持仓<br />通过上方搜索添加自选
					</div>
				</div>
			</div>
		</div>

		<!-- 持仓区 -->
		<div class="box position-box">
			<div class="box-title-row">
				<span class="box-title">当前持仓</span>
				<span class="box-sub">成本按移动加权平均（买入费用计入成本），现价取最新行情快照；点击股票名称查看个股行情</span>
			</div>
			<el-table
				v-loading="positionLoading"
				:data="positions"
				empty-text="暂无持仓（导入交易记录后自动推导）"
				:row-class-name="positionRowClassName"
			>
				<el-table-column prop="StockCode" label="代码" width="100"></el-table-column>
				<el-table-column label="名称" min-width="130">
					<template #default="scope">
						<span class="pos-name-link" title="查看个股行情" @click="gotoStockDetail(scope.row.StockCode)">{{ scope.row.StockName }}</span>
						<span v-if="scope.row.IsClearedToday" class="tag-cleared" title="当天卖出且收盘无持仓，券商持仓页挂显一天">今日清仓</span>
					</template>
				</el-table-column>
				<el-table-column label="持仓数量" width="110" align="right">
					<template #default="scope">{{ fmtVolume(scope.row.Volume) }}</template>
				</el-table-column>
				<el-table-column label="成本价" width="100" align="right">
					<template #default="scope">{{ scope.row.IsClearedToday ? '--' : fmtPrice(scope.row.AvgCost, 4) }}</template>
				</el-table-column>
				<el-table-column label="现价" width="100" align="right">
					<template #default="scope">{{ scope.row.Price ? fmtPrice(scope.row.Price) : '--' }}</template>
				</el-table-column>
				<el-table-column label="涨跌幅" width="90" align="right">
					<template #default="scope">
						<span :class="changeClass(scope.row.ChangePercent)">{{ scope.row.Price ? formatPercent(scope.row.ChangePercent ?? 0) : '--' }}</span>
					</template>
				</el-table-column>
				<el-table-column label="持仓浮动盈亏" width="150" align="right">
					<template #default="scope">
						<template v-if="scope.row.IsClearedToday">
							<span :class="changeClass(scope.row.TodayProfit ?? 0)" title="当日盈亏（昨收价→卖出价变动−当日费用，与券商APP一致）">
								{{ fmtMoney(scope.row.TodayProfit ?? 0, true) }}
							</span>
							<span class="pos-cleared-hint">当日</span>
						</template>
						<span v-else-if="scope.row.Price" :class="changeClass(scope.row.FloatProfit)">
							{{ fmtMoney(scope.row.FloatProfit, true) }}（{{ formatPercent(scope.row.FloatProfitPercent) }}）
						</span>
						<span v-else>--</span>
					</template>
				</el-table-column>
				<el-table-column label="持仓市值" width="130" align="right">
					<template #default="scope">{{ scope.row.IsClearedToday || !scope.row.Price ? '--' : fmtMoney(scope.row.MarketValue) }}</template>
				</el-table-column>
				<el-table-column label="该股净盈亏" width="140" align="right">
					<template #default="scope">
						<span :class="changeClass(scope.row.RealizedProfit)">{{ fmtMoney(scope.row.RealizedProfit, true) }}</span>
					</template>
				</el-table-column>
			</el-table>
		</div>

		<!-- 收益日历区 -->
		<div v-loading="calendarLoading || yearLoading || overallLoading" class="box calendar-box">
			<div class="box-title-row">
				<span class="box-title">收益日历</span>
				<span class="box-sub">浮动盈亏口径：当日浮动盈亏（与券商APP一致，含浮盈浮亏与当日费用/红利/利息）；红盈绿亏；格内另示费用/红利/利息</span>
				<el-radio-group v-model="calendarMode" size="small" class="cal-mode-switch">
					<el-radio-button value="month">月视图</el-radio-button>
					<el-radio-button value="year">年视图</el-radio-button>
					<el-radio-button value="overall">至今</el-radio-button>
				</el-radio-group>
			</div>

			<!-- 月视图 -->
			<template v-if="calendarMode === 'month'">
				<div class="cal-stats">
					<div class="cal-stat stat-total">
						<div class="cs-label"><font-awesome-icon fas icon="gem" class="cs-icon ico-violet"></font-awesome-icon>当月浮动盈亏</div>
						<div class="cs-value" :class="changeClass(calendar?.MonthMarkProfit)">
							{{ calendar ? fmtMoney(calendar.MonthMarkProfit, true) : '--' }}
						</div>
						<div class="cs-sub" title="盯市口径：当日总资产变动−当日净转入，含浮盈浮亏与当日费用/红利/利息；与券商APP一致">盯市口径 · 与券商APP一致</div>
					</div>
					<div class="cal-stat">
						<div class="cs-label"><font-awesome-icon fas icon="chart-line" class="cs-icon"></font-awesome-icon>当月净盈亏</div>
						<div class="cs-value" :class="changeClass(calendar?.MonthProfit)">
							{{ calendar ? fmtMoney(calendar.MonthProfit, true) : '--' }}
						</div>
						<div class="cs-sub">卖出结算口径 · 卖出 {{ calendar?.MonthSellCount ?? 0 }} 笔 · 盈利 {{ calendar?.MonthWinCount ?? 0 }} 笔</div>
					</div>
					<div class="cal-stat">
						<div class="cs-label"><font-awesome-icon fas icon="gift" class="cs-icon ico-gold"></font-awesome-icon>红利收入</div>
						<div class="cs-value cs-dividend">{{ calendar ? fmtMoney(calendar.MonthDividendSum) : '--' }}</div>
						<div class="cs-sub">现金分红净额（入账-税补缴）· 已含盈亏</div>
					</div>
					<div class="cal-stat">
						<div class="cs-label"><font-awesome-icon fas icon="landmark" class="cs-icon ico-blue"></font-awesome-icon>利息收入</div>
						<div class="cs-value cs-interest">{{ calendar ? fmtMoney(calendar.MonthInterestSum) : '--' }}</div>
						<div class="cs-sub">利息归本净额 · 已含盈亏</div>
					</div>
					<div class="cal-stat">
						<div class="cs-label"><font-awesome-icon fas icon="calendar-check" class="cs-icon"></font-awesome-icon>盈亏天数</div>
						<div class="cs-value">
							<span class="up">{{ calendar?.ProfitDayCount ?? 0 }}</span>
							<span class="cs-slash">/</span>
							<span class="down">{{ calendar?.LossDayCount ?? 0 }}</span>
						</div>
						<div class="cs-sub">浮动盈亏口径 · 交易日 {{ calendar?.TradeDayCount ?? 0 }} 天</div>
					</div>
					<div class="cal-stat">
						<div class="cs-label"><font-awesome-icon fas icon="receipt" class="cs-icon ico-orange"></font-awesome-icon>费用支出</div>
						<div class="cs-value cs-fee">{{ calendar ? fmtMoney(calendar.MonthFeeSum) : '--' }}</div>
						<div class="cs-sub" :title="monthFeeText() ? monthFeeText() : '实际发生额，已含在浮动盈亏内'">{{ monthFeeText() ? monthFeeText() + ' · 已含盈亏' : '佣金 / 印花税 / 过户费 / 其他 · 已含盈亏' }}</div>
					</div>
				</div>
				<div v-if="monthCompare.has" class="cal-compare">
					<span class="cmp-side up">盈利日合计 {{ fmtMoney(monthCompare.win, true) }}</span>
					<div class="cmp-bar">
						<div v-show="monthCompare.win > 0" class="cmp-win" :style="{ flexGrow: monthCompare.win }"></div>
						<div v-show="monthCompare.loss > 0" class="cmp-loss" :style="{ flexGrow: monthCompare.loss }"></div>
					</div>
					<span class="cmp-side down">亏损日合计 {{ fmtMoney(-monthCompare.loss, true) }}</span>
				</div>
				<el-calendar ref="calendarRef" v-model="calendarDate">
					<template #header>
						<div class="calendar-header">
							<span class="calendar-title">
								{{ calendar ? `${calendar.Year} 年 ${calendar.Month} 月` : dayjs(calendarDate).format('YYYY 年 M 月') }}
								<el-tag v-if="isCurrentMonth" size="small" effect="plain">本月</el-tag>
							</span>
							<el-button-group>
								<el-button size="small" @click="selectCalDate('prev-month')">上个月</el-button>
								<el-button size="small" @click="selectCalDate('today')">本月</el-button>
								<el-button size="small" @click="selectCalDate('next-month')">下个月</el-button>
							</el-button-group>
						</div>
					</template>
					<template #date-cell="{ data }">
						<el-tooltip :content="calTooltip(data)" :disabled="!calTooltip(data)" placement="top">
							<div class="date-cell" :class="calCellClass(data)" @click="openDayDetail(data)">
								<span class="day-row"><span class="day-text">{{ calDayText(data) }}</span><i v-if="calSellDot(data)" class="sell-dot" :class="calSellDot(data)"></i><i v-if="isReviewDay(data)" class="review-flag" title="已复盘">复</i></span>
								<span v-if="calProfitText(data)" class="profit-text">{{ calProfitText(data) }}</span>
								<span v-if="calFeeShort(data) || calDividendShort(data) || calInterestShort(data)" class="fees-line">
									<span v-if="calFeeShort(data)" class="fee-text">{{ calFeeShort(data) }}</span>
									<span v-if="calDividendShort(data)" class="dividend-text">{{ calDividendShort(data) }}</span>
									<span v-if="calInterestShort(data)" class="interest-text">{{ calInterestShort(data) }}</span>
								</span>
							</div>
						</el-tooltip>
					</template>
				</el-calendar>
			</template>

			<!-- 年视图 -->
			<template v-else-if="calendarMode === 'year'">
				<div class="year-header">
					<span class="calendar-title">
						{{ calendarYear }} 年
						<el-tag v-if="isCurrentYear" size="small" effect="plain">本年</el-tag>
					</span>
					<el-button-group>
						<el-button size="small" @click="calendarYear--">上一年</el-button>
						<el-button size="small" @click="calendarYear = dayjs().year()">本年</el-button>
						<el-button size="small" @click="calendarYear++">下一年</el-button>
					</el-button-group>
				</div>
				<div class="cal-stats">
					<div class="cal-stat stat-total">
						<div class="cs-label"><font-awesome-icon fas icon="gem" class="cs-icon ico-violet"></font-awesome-icon>全年浮动盈亏</div>
						<div class="cs-value" :class="changeClass(yearCalendar?.MarkProfitSum)">
							{{ yearCalendar ? fmtMoney(yearCalendar.MarkProfitSum, true) : '--' }}
						</div>
						<div class="cs-sub" title="盯市口径：每日总资产变动−当日净转入逐日累加，含浮盈浮亏与费用/红利/利息；与券商APP一致">盯市口径 · 与券商APP一致</div>
					</div>
					<div class="cal-stat">
						<div class="cs-label"><font-awesome-icon fas icon="chart-line" class="cs-icon"></font-awesome-icon>全年净盈亏</div>
						<div class="cs-value" :class="changeClass(yearCalendar?.ProfitSum)">
							{{ yearCalendar ? fmtMoney(yearCalendar.ProfitSum, true) : '--' }}
						</div>
						<div class="cs-sub">卖出结算口径 · 卖出 {{ yearCalendar?.SellCount ?? 0 }} 笔 · 盈利 {{ yearCalendar?.WinCount ?? 0 }} 笔</div>
					</div>
					<div class="cal-stat">
						<div class="cs-label"><font-awesome-icon fas icon="gift" class="cs-icon ico-gold"></font-awesome-icon>红利收入</div>
						<div class="cs-value cs-dividend">{{ yearCalendar ? fmtMoney(yearCalendar.DividendSum) : '--' }}</div>
						<div class="cs-sub">现金分红净额（入账-税补缴）· 已含盈亏</div>
					</div>
					<div class="cal-stat">
						<div class="cs-label"><font-awesome-icon fas icon="landmark" class="cs-icon ico-blue"></font-awesome-icon>利息收入</div>
						<div class="cs-value cs-interest">{{ yearCalendar ? fmtMoney(yearCalendar.InterestSum) : '--' }}</div>
						<div class="cs-sub">利息归本净额 · 已含盈亏</div>
					</div>
					<div class="cal-stat">
						<div class="cs-label"><font-awesome-icon fas icon="calendar-check" class="cs-icon"></font-awesome-icon>盈亏天数</div>
						<div class="cs-value">
							<span class="up">{{ yearCalendar?.ProfitDayCount ?? 0 }}</span>
							<span class="cs-slash">/</span>
							<span class="down">{{ yearCalendar?.LossDayCount ?? 0 }}</span>
						</div>
						<div class="cs-sub">浮动盈亏口径 · 交易日 {{ yearCalendar?.TradeDayCount ?? 0 }} 天</div>
					</div>
					<div class="cal-stat">
						<div class="cs-label"><font-awesome-icon fas icon="receipt" class="cs-icon ico-orange"></font-awesome-icon>费用支出</div>
						<div class="cs-value cs-fee">{{ yearCalendar ? fmtMoney(yearCalendar.FeeSum) : '--' }}</div>
						<div class="cs-sub" title="实际发生额，已含在浮动盈亏内">全年佣金 / 印花税 / 过户费 · 已含盈亏</div>
					</div>
				</div>
				<div v-if="yearCompare.has" class="cal-compare">
					<span class="cmp-side up">盈利日合计 {{ fmtMoney(yearCompare.win, true) }}</span>
					<div class="cmp-bar">
						<div v-show="yearCompare.win > 0" class="cmp-win" :style="{ flexGrow: yearCompare.win }"></div>
						<div v-show="yearCompare.loss > 0" class="cmp-loss" :style="{ flexGrow: yearCompare.loss }"></div>
					</div>
					<span class="cmp-side down">亏损日合计 {{ fmtMoney(-yearCompare.loss, true) }}</span>
				</div>
				<div class="year-grid">
					<div
						v-for="m in yearMonths"
						:key="m.Month"
						class="year-cell"
						:class="yearCellClass(m)"
						@click="gotoMonth(m.Month)"
					>
						<div class="yc-head">
							<span class="yc-month">{{ m.Month }} 月</span>
							<el-tag v-if="isYearCurrentMonth(m.Month)" size="small" effect="plain">本月</el-tag>
							<i class="month-review-btn" :class="{ has: hasMonthReview(m.Month) }" title="月度复盘" @click.stop="openMonthReview(m.Month)">复</i>
						</div>
						<div class="yc-profit" :class="changeClass(m.HasData === false ? 0 : m.MarkProfit)">{{ m.HasData === false ? '--' : fmtMoney(m.MarkProfit, true) }}</div>
						<div class="yc-sub">卖 {{ m.SellCount }} 笔 · 盈亏 {{ m.ProfitDayCount }}/{{ m.LossDayCount }} 天</div>
						<div class="yc-meta">
							<span v-if="m.FeeSum" class="yc-fee">费 {{ fmtShort(m.FeeSum) }}</span>
							<span v-if="m.DividendSum" class="yc-dividend">红 {{ fmtShort(m.DividendSum) }}</span>
							<span v-if="!m.FeeSum && !m.DividendSum" class="yc-none">—</span>
						</div>
					</div>
				</div>
			</template>

			<!-- 至今视图（全历史按年汇总） -->
			<template v-else>
				<div class="cal-stats">
					<div class="cal-stat stat-total">
						<div class="cs-label"><font-awesome-icon fas icon="gem" class="cs-icon ico-violet"></font-awesome-icon>至今浮动盈亏</div>
						<div class="cs-value" :class="changeClass(overall?.MarkProfitSum)">
							{{ overall ? fmtMoney(overall.MarkProfitSum, true) : '--' }}
						</div>
						<div class="cs-sub" title="盯市口径：每日总资产变动−当日净转入逐日累加，含浮盈浮亏与费用/红利/利息；与券商APP一致">盯市口径 · 与券商APP一致</div>
					</div>
					<div class="cal-stat">
						<div class="cs-label"><font-awesome-icon fas icon="chart-line" class="cs-icon"></font-awesome-icon>至今净盈亏</div>
						<div class="cs-value" :class="changeClass(overall?.ProfitSum)">
							{{ overall ? fmtMoney(overall.ProfitSum, true) : '--' }}
						</div>
						<div class="cs-sub">卖出结算口径 · 卖出 {{ overall?.SellCount ?? 0 }} 笔 · 盈利 {{ overall?.WinCount ?? 0 }} 笔 · {{ overallYears.length }} 个年份</div>
					</div>
					<div class="cal-stat">
						<div class="cs-label"><font-awesome-icon fas icon="gift" class="cs-icon ico-gold"></font-awesome-icon>红利收入</div>
						<div class="cs-value cs-dividend">{{ overall ? fmtMoney(overall.DividendSum) : '--' }}</div>
						<div class="cs-sub">全历史现金分红净额 · 已含盈亏</div>
					</div>
					<div class="cal-stat">
						<div class="cs-label"><font-awesome-icon fas icon="landmark" class="cs-icon ico-blue"></font-awesome-icon>利息收入</div>
						<div class="cs-value cs-interest">{{ overall ? fmtMoney(overall.InterestSum) : '--' }}</div>
						<div class="cs-sub">全历史利息归本净额 · 已含盈亏</div>
					</div>
					<div class="cal-stat">
						<div class="cs-label"><font-awesome-icon fas icon="calendar-check" class="cs-icon"></font-awesome-icon>盈亏天数</div>
						<div class="cs-value">
							<span class="up">{{ overall?.ProfitDayCount ?? 0 }}</span>
							<span class="cs-slash">/</span>
							<span class="down">{{ overall?.LossDayCount ?? 0 }}</span>
						</div>
						<div class="cs-sub">浮动盈亏口径 · 交易日 {{ overall?.TradeDayCount ?? 0 }} 天</div>
					</div>
					<div class="cal-stat">
						<div class="cs-label"><font-awesome-icon fas icon="receipt" class="cs-icon ico-orange"></font-awesome-icon>费用支出</div>
						<div class="cs-value cs-fee">{{ overall ? fmtMoney(overall.FeeSum) : '--' }}</div>
						<div class="cs-sub" title="实际发生额，已含在浮动盈亏内">全历史佣金 / 印花税 / 过户费 · 已含盈亏</div>
					</div>
				</div>
				<div v-if="overallCompare.has" class="cal-compare">
					<span class="cmp-side up">盈利日合计 {{ fmtMoney(overallCompare.win, true) }}</span>
					<div class="cmp-bar">
						<div v-show="overallCompare.win > 0" class="cmp-win" :style="{ flexGrow: overallCompare.win }"></div>
						<div v-show="overallCompare.loss > 0" class="cmp-loss" :style="{ flexGrow: overallCompare.loss }"></div>
					</div>
					<span class="cmp-side down">亏损日合计 {{ fmtMoney(-overallCompare.loss, true) }}</span>
				</div>
				<div v-if="overallYears.length" class="year-grid">
					<div
						v-for="y in overallYears"
						:key="y.Year"
						class="year-cell"
						:class="yearCellClass(y)"
						@click="gotoYear(y.Year)"
					>
						<div class="yc-head">
							<span class="yc-month">{{ y.Year }} 年</span>
							<el-tag v-if="y.Year === dayjs().year()" size="small" effect="plain">本年</el-tag>
						</div>
						<div class="yc-profit" :class="changeClass(y.MarkProfit)">{{ fmtMoney(y.MarkProfit, true) }}</div>
						<div class="yc-sub">卖 {{ y.SellCount }} 笔 · 盈亏 {{ y.ProfitDayCount }}/{{ y.LossDayCount }} 天</div>
						<div class="yc-meta">
							<span v-if="y.FeeSum" class="yc-fee">费 {{ fmtShort(y.FeeSum) }}</span>
							<span v-if="y.DividendSum" class="yc-dividend">红 {{ fmtShort(y.DividendSum) }}</span>
							<span v-if="!y.FeeSum && !y.DividendSum" class="yc-none">—</span>
						</div>
					</div>
				</div>
				<el-empty v-else description="暂无交易数据（导入交易记录后自动生成）" :image-size="80"></el-empty>
			</template>
		</div>

		<!-- 收益趋势区 -->
		<div v-loading="trendLoading || trendCompareLoading" class="box trend-box">
			<div class="box-title-row">
				<span class="box-title">收益趋势</span>
				<span class="box-sub">按月浮动盈亏（累计/今年，与券商APP一致）；指数对比=我的收益率 vs 上证/深证/创业板/科创板指数（今年）</span>
				<el-radio-group v-model="trendMode" size="small" class="trend-switch">
					<el-radio-button value="cum">累计收益</el-radio-button>
					<el-radio-button value="year">今年走势</el-radio-button>
					<el-radio-button value="index">指数对比</el-radio-button>
				</el-radio-group>
			</div>
			<div v-if="trendChartVisible" ref="trendChartRef" class="trend-chart"></div>
			<el-empty v-else description="暂无收益数据（导入交易记录后自动生成）" :image-size="80"></el-empty>
		</div>

		<!-- 资产总览区 -->
		<div class="box asset-box">
			<div class="box-title-row">
				<span class="box-title">资产总览</span>
				<span class="box-sub">累计口径覆盖全部历史；持仓相关为当前快照，点击个股行可下钻流水</span>
			</div>
			<div class="asset-kpi-row">
				<div v-for="(k, i) in assetKpis" :key="i" class="asset-kpi">
					<div class="ak-label">{{ k.label }}</div>
					<div class="ak-value" :class="k.cls">{{ k.value }}</div>
					<div class="ak-sub" :title="k.sub">{{ k.sub }}</div>
				</div>
			</div>
			<div class="asset-grid">
				<!-- 总资产趋势（全历史按月度/年度聚合成期末快照折线 + 资金流向流程图） -->
				<div v-loading="assetTrendLoading" class="asset-cell asset-trend-cell">
					<div class="ac-title">
						总资产趋势
						<span class="ac-sub">期末快照 · 日终现金 + 持仓市值</span>
						<el-radio-group v-if="assetTrend?.HasData" v-model="assetGranularity" size="small" class="ac-toggle">
							<el-radio-button value="month">月度</el-radio-button>
							<el-radio-button value="year">年度</el-radio-button>
						</el-radio-group>
					</div>
					<div v-if="assetTrend?.HasData" class="at-kpis">
						<div class="at-kpi">
							<span class="at-kpi-label">总资产</span>
							<span class="at-kpi-value">{{ fmtMoney(assetTrend?.TotalAsset ?? 0) }}</span>
						</div>
						<div class="at-kpi">
							<span class="at-kpi-label">现金</span>
							<span class="at-kpi-value">{{ fmtMoney(assetTrend?.CashBalance ?? 0) }}</span>
						</div>
						<div class="at-kpi">
							<span class="at-kpi-label">持仓市值</span>
							<span class="at-kpi-value">{{ fmtMoney(assetTrend?.MarketValue ?? 0) }}</span>
						</div>
						<div class="at-kpi">
							<span class="at-kpi-label">总盈亏</span>
							<span class="at-kpi-value" :class="changeClass(assetTrend?.TotalProfit)">{{ fmtMoney(assetTrend?.TotalProfit ?? 0, true) }}</span>
						</div>
					</div>
					<div v-if="assetTrend?.HasData" class="at-wrap">
						<div ref="assetChartRef" class="at-chart"></div>
						<!-- 资金流向（纯 HTML/CSS 简洁清单：资金进出 → 净流入 → 账户盈亏 → 期末总资产） -->
						<div class="at-flow">
							<div class="af-title">资金流向（全历史）</div>
							<div class="af-inout">
								<div class="af-io">
									<span class="af-io-label">银行转入</span>
									<span class="af-io-value in">+{{ fmtMoney(assetTrend?.TransferIn ?? 0) }}</span>
								</div>
								<div class="af-io">
									<span class="af-io-label">银行转出</span>
									<span class="af-io-value out">-{{ fmtMoney(assetTrend?.TransferOut ?? 0) }}</span>
								</div>
								<div class="af-io">
									<span class="af-io-label">其他流入</span>
									<span class="af-io-value in">+{{ fmtMoney(assetTrend?.OtherInflow ?? 0) }}</span>
								</div>
							</div>
							<div class="af-divider"></div>
							<div class="af-row">
								<span class="af-row-label">净流入</span>
								<span class="af-row-formula">转入 − 转出 + 其他流入</span>
								<span class="af-row-value af-blue">{{ fmtMoney(assetTrend?.NetInflow ?? 0, true) }}</span>
							</div>
							<div class="af-divider"></div>
							<div class="af-row">
								<span class="af-row-label">账户盈亏</span>
								<span class="af-row-formula">期末总资产 − 净流入</span>
								<span class="af-row-value" :class="changeClass(afProfit)">{{ fmtMoney(afProfit, true) }}</span>
							</div>
							<div class="af-divider"></div>
							<div class="af-row af-row-final">
								<span class="af-row-label">期末总资产</span>
								<span class="af-row-formula">日终现金 + 持仓市值</span>
								<span class="af-row-value af-blue">{{ fmtMoney(assetTrend?.TotalAsset ?? 0) }}</span>
							</div>
						</div>
					</div>
					<el-empty v-else-if="!assetTrendLoading" description="暂无资产数据（导入交易记录后自动生成）" :image-size="70"></el-empty>
				</div>
				<!-- 盈亏 TOP 榜 -->
				<div class="asset-cell">
					<div class="ac-title">
						净盈亏 TOP 榜
						<span class="ac-sub">仅含卖出过的个股</span>
					</div>
					<div class="top-wrap">
						<div class="top-col">
							<div class="tc-head up">盈利 TOP10</div>
							<div v-for="t in profitTop" :key="t.StockCode" class="tc-row" @click="drillToStock(t)">
								<span class="tc-name" :title="`${t.StockCode} ${t.StockName}`">{{ t.StockName || t.StockCode }}</span>
								<span class="tc-value up">{{ fmtMoney(t.RealizedProfit, true) }}</span>
							</div>
							<div v-if="!profitTop.length" class="tc-empty">暂无盈利个股</div>
						</div>
						<div class="top-col">
							<div class="tc-head down">亏损 TOP10</div>
							<div v-for="t in lossTop" :key="t.StockCode" class="tc-row" @click="drillToStock(t)">
								<span class="tc-name" :title="`${t.StockCode} ${t.StockName}`">{{ t.StockName || t.StockCode }}</span>
								<span class="tc-value down">{{ fmtMoney(t.RealizedProfit, true) }}</span>
							</div>
							<div v-if="!lossTop.length" class="tc-empty">暂无亏损个股</div>
						</div>
					</div>
				</div>
				<!-- 费用月度趋势（近24月柱状 / 至今折线 切换） -->
				<div v-loading="feeLoading" class="asset-cell">
					<div class="ac-title">
						费用月度趋势
						<span class="ac-sub">{{ feeMode === 'recent' ? '近 24 个月' : '全部历史' }} · 悬停看分项</span>
						<el-radio-group v-model="feeMode" size="small" class="ac-toggle">
							<el-radio-button value="recent">近24月</el-radio-button>
							<el-radio-button value="all">至今</el-radio-button>
						</el-radio-group>
					</div>
					<div v-if="feeTrendMonths.length" ref="feeChartRef" class="fee-chart"></div>
					<el-empty v-else description="暂无费用数据" :image-size="70"></el-empty>
				</div>
				<!-- 持仓分布（环图 + 板块占比 + 持仓明细 + 剩余现金） -->
				<div v-loading="positionLoading" class="asset-cell pd-cell">
					<div class="ac-title">
						持仓分布
						<span class="ac-sub">按市值占比</span>
						<span v-if="latestCash !== null" class="pd-cash-chip">
							<font-awesome-icon fas icon="wallet"></font-awesome-icon>
							剩余现金 {{ fmtMoney(latestCash) }}<template v-if="cashRatio !== null"> · 占总资产 {{ cashRatio.toFixed(1) }}%</template>
						</span>
					</div>
					<div v-if="pieItems.length" class="pd-wrap">
						<div ref="pieChartRef" class="pie-chart"></div>
						<div class="pd-sectors">
							<div class="pd-sub-title">板块占比</div>
							<div class="pd-sector-list">
								<div v-for="s in sectorStats" :key="s.name" class="pd-sector-row">
									<div class="pd-sector-head">
										<span class="pd-sector-name" :title="s.name">{{ s.name }}</span>
										<span class="pd-sector-pct">{{ s.percent.toFixed(1) }}%</span>
									</div>
									<div class="pd-sector-bar"><span :style="{ width: `${Math.min(s.percent, 100)}%`, background: s.color }"></span></div>
								</div>
								<div v-if="latestCash !== null && cashRatio !== null" class="pd-sector-row">
									<div class="pd-sector-head">
										<span class="pd-sector-name">剩余现金</span>
										<span class="pd-sector-pct">{{ cashRatio.toFixed(1) }}%</span>
									</div>
									<div class="pd-sector-bar"><span :style="{ width: `${Math.min(cashRatio, 100)}%`, background: '#909399' }"></span></div>
								</div>
							</div>
						</div>
						<div class="pd-detail">
							<div class="pd-sub-title">持仓明细（{{ holdPositions.length }} 只）</div>
							<div class="pd-detail-list">
								<div
									v-for="p in holdPositions"
									:key="p.StockCode"
									class="pd-detail-row"
									:title="`${p.StockCode} ${p.StockName ?? ''}`"
									@click="drillToStock(p)"
								>
									<span class="pd-name">{{ p.StockName || p.StockCode }}</span>
									<span class="pd-sector-tag">{{ p.Sector?.trim() || '未分类' }}</span>
									<span class="pd-mv">{{ fmtMoney(p.MarketValue) }}</span>
									<span class="pd-change" :class="changeClass(p.FloatProfitPercent)">{{ formatPercent(p.FloatProfitPercent) }}</span>
								</div>
							</div>
						</div>
					</div>
					<el-empty v-else description="暂无持仓（导入交易记录后自动推导）" :image-size="70"></el-empty>
				</div>
				<!-- 红利 / 利息记录（跨双列，双列瀑布） -->
				<div v-loading="cashLoading" class="asset-cell cash-cell">
					<div class="ac-title">
						红利 / 利息记录
						<span class="ac-sub">最近 50 笔</span>
					</div>
					<div v-if="cashFlows.length" class="cash-list">
						<div v-for="(r, i) in cashFlows" :key="i" class="cash-row">
							<span class="cash-tag" :class="r.Category === 5 ? 'dividend' : 'interest'">{{ r.Category === 5 ? '红利' : '利息' }}</span>
							<span class="cash-date">{{ dayjs(r.TradeDate).format('YYYY-MM-DD') }}</span>
							<span class="cash-name" :title="`${r.StockCode} ${r.StockName ?? ''}`">{{ r.StockName || r.StockCode || '--' }}</span>
							<span class="cash-amount" :class="changeClass(r.CashAmount || r.Amount)">{{ fmtMoney(r.CashAmount || r.Amount, true) }}</span>
						</div>
					</div>
					<el-empty v-else description="暂无红利/利息记录" :image-size="70"></el-empty>
				</div>
			</div>
		</div>

		<!-- 调仓记录（近30天独立板块；按股票合并买卖；悬浮行展示逐笔明细；点击行下钻流水） -->
		<div v-if="adjustGroups.length" class="box adjust-box">
			<div class="box-title-row">
				<span class="box-title"><font-awesome-icon fas icon="arrows-rotate"></font-awesome-icon>&nbsp;调仓记录</span>
				<span class="box-sub">近 30 天 · 按股票合并（净额 = 卖出金额 − 买入金额）</span>
				<span class="adjust-summary">
					<span class="as-chip">涉及 <b>{{ adjustSummary.stockCount }}</b> 只</span>
					<span class="as-chip">共 <b>{{ adjustSummary.tradeCount }}</b> 笔</span>
					<span class="as-chip">买入 <b>{{ fmtMoney(adjustSummary.buyAmount) }}</b></span>
					<span class="as-chip">卖出 <b>{{ fmtMoney(adjustSummary.sellAmount) }}</b></span>
					<span class="as-chip" :class="changeClass(adjustSummary.netAmount)">净额 <b>{{ fmtMoney(adjustSummary.netAmount, true) }}</b></span>
				</span>
			</div>
			<el-table
				:data="adjustGroups"
				size="small"
				class="adjust-table clickable-table"
				max-height="320"
				@row-click="drillToStock"
			>
				<el-table-column label="股票" min-width="150">
					<template #default="scope">
						<div class="adj-stock">
							<span class="adj-name">{{ scope.row.StockName || scope.row.StockCode }}</span>
							<span class="adj-code">{{ scope.row.StockCode }}</span>
						</div>
					</template>
				</el-table-column>
				<el-table-column label="买卖" width="130">
					<template #default="scope">
						<span class="adj-badge buy">买 {{ scope.row.BuyCount }}</span>
						<span class="adj-badge sell">卖 {{ scope.row.SellCount }}</span>
					</template>
				</el-table-column>
				<el-table-column label="买入额" width="120" align="right">
					<template #default="scope">{{ scope.row.BuyAmount ? fmtMoney(scope.row.BuyAmount) : '--' }}</template>
				</el-table-column>
				<el-table-column label="卖出额" width="120" align="right">
					<template #default="scope">{{ scope.row.SellAmount ? fmtMoney(scope.row.SellAmount) : '--' }}</template>
				</el-table-column>
				<el-table-column label="净额" width="130" align="right">
					<template #default="scope">
						<span :class="changeClass(scope.row.NetAmount)">
							{{ scope.row.NetAmount ? fmtMoney(scope.row.NetAmount, true) : '--' }}
						</span>
					</template>
				</el-table-column>
				<el-table-column label="最近交易" width="150">
					<template #default="scope">{{ scope.row.LastTime }}</template>
				</el-table-column>
				<el-table-column label="明细" width="110" align="center">
					<template #default="scope">
						<el-popover placement="left" :width="440" trigger="hover" :show-after="120" popper-class="adj-popover">
							<template #reference>
								<span class="adj-detail-link">{{ scope.row.Details.length }} 笔明细</span>
							</template>
							<div class="adj-detail">
								<div class="adj-detail-title">
									<b>{{ scope.row.StockName || scope.row.StockCode }}</b>
									<span>{{ scope.row.StockCode }} · 近30天 {{ scope.row.Details.length }} 笔</span>
								</div>
								<div class="adj-detail-head">
									<span>时间</span>
									<span>方向</span>
									<span class="ta-r">数量</span>
									<span class="ta-r">均价</span>
									<span class="ta-r">金额</span>
								</div>
								<div class="adj-detail-list">
									<div v-for="(d, di) in scope.row.Details" :key="di" class="adj-detail-row">
										<span class="adr-time">{{ adjDetailTime(d) }}</span>
										<span class="adr-badge" :class="d.Category === 1 ? 'buy' : 'sell'">{{ d.Category === 1 ? '买入' : '卖出' }}</span>
										<span class="ta-r">{{ d.Volume ? fmtVolume(d.Volume) : '--' }}</span>
										<span class="ta-r">{{ d.Price ? fmtPrice(d.Price, 3) : '--' }}</span>
										<span class="ta-r" :class="changeClass(adjFlowAmount(d))">{{ fmtMoney(adjFlowAmount(d), true) }}</span>
									</div>
								</div>
							</div>
						</el-popover>
					</template>
				</el-table-column>
			</el-table>
		</div>

		<!-- 交易流水区 -->
		<div ref="tradeBoxRef" class="box trade-box">
			<div class="box-title-row">
				<span class="box-title">交易流水</span>
				<span class="filter-row">
					<el-date-picker
						v-model="dateRange"
						type="daterange"
						value-format="YYYY-MM-DD"
						start-placeholder="开始日期"
						end-placeholder="结束日期"
						style="width: 240px"
						clearable
					></el-date-picker>
					<el-select v-model="categoryFilter" placeholder="交易类别" style="width: 130px" clearable>
						<el-option v-for="c in ZDX_TRADE_CATEGORIES" :key="c.value" :label="c.label" :value="c.value"></el-option>
					</el-select>
					<el-input
						v-model="keywordFilter"
						placeholder="股票代码/名称"
						style="width: 160px"
						clearable
						@keyup.enter="applyTradeFilter"
					></el-input>
					<el-button type="primary" @click="applyTradeFilter">
						<font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
					</el-button>
					<el-upload
						ref="importUploadRef"
						class="import-upload"
						action=""
						accept=".xlsx"
						:http-request="uploadExcel"
						:show-file-list="false"
						:disabled="importing"
					>
						<el-button type="success" :loading="importing">
							<font-awesome-icon fas icon="file-excel"></font-awesome-icon>&nbsp;导入Excel
						</el-button>
					</el-upload>
				</span>
			</div>
			<!-- 券商费率摘要（账单分析：佣金费率/最低佣金/印花税率/过户费率；佣金费率支持手动校准） -->
			<div v-if="feeRateHasData" class="trade-fee-bar">
				<span class="tfb-title">
					<font-awesome-icon fas icon="circle-info" class="tfb-ico"></font-awesome-icon>
					券商费率
				</span>
				<span v-for="r in feeRateRows" :key="r.label" class="tfb-item">
					<span class="tfb-label">{{ r.label }}</span>
					<span class="tfb-value" :class="{ manual: r.manual }">{{ r.value }}</span>
					<span class="tfb-note">{{ r.note }}</span>
				</span>
				<span v-if="feeRateTimeText" class="tfb-time" :title="feeRateFootText">更新至 {{ feeRateTimeText }}</span>
				<span class="tfb-calibrate" :title="feeRateCalibrateTip" @click="openCalibrate">
					<font-awesome-icon fas icon="pen-to-square"></font-awesome-icon>
					{{ stats?.IsFeeRateManual ? '已校准' : '校准' }}
				</span>
			</div>
			<div v-else class="trade-fee-bar empty">
				<font-awesome-icon fas icon="circle-info" class="tfb-ico"></font-awesome-icon>
				暂无费率样本（导入交易流水后自动分析）
			</div>
			<!-- 佣金费率校准弹窗（与券商App"佣金费率"口径一致，含规费；填0保存恢复自动分析） -->
			<el-dialog v-model="calibrateVisible" width="420px" title="校准佣金费率">
				<div class="fc-tip">请填写券商App显示的"佣金费率"（含规费口径，与App一致；不含印花税/过户费）</div>
				<div class="fc-row">
					<span class="fc-label">万分之</span>
					<el-input-number v-model="calibrateRate" :min="0" :max="10" :step="0.1" :precision="3" controls-position="right" style="width: 150px" />
				</div>
				<div class="fc-tip small">示例：App显示 0.12‰ 即万分之1.2，填 1.2；填 0 保存恢复自动分析；保存后费率卡片与复盘的费用估算同步生效</div>
				<template #footer>
					<el-button @click="calibrateVisible = false">取消</el-button>
					<el-button type="primary" :loading="calibrateSaving" @click="saveCalibrate">保存</el-button>
				</template>
			</el-dialog>
			<el-table v-loading="tradeLoading" :data="trades.Items" class="trade-table" empty-text="暂无流水，点击右上角导入Excel">
				<el-table-column label="日期时间" width="150">
					<template #default="scope">{{ fmtTradeTime(scope.row) }}</template>
				</el-table-column>
				<el-table-column prop="StockCode" label="代码" width="90"></el-table-column>
				<el-table-column prop="StockName" label="名称" min-width="110"></el-table-column>
				<el-table-column label="类别" width="110">
					<template #default="scope">
						<el-tag :type="categoryItem(scope.row.Category)?.tag" size="small">
							{{ scope.row.CategoryName || categoryItem(scope.row.Category)?.label }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="数量" width="100" align="right">
					<template #default="scope">{{ scope.row.Volume ? fmtVolume(scope.row.Volume) : '' }}</template>
				</el-table-column>
				<el-table-column label="均价" width="90" align="right">
					<template #default="scope">{{ scope.row.Price ? fmtPrice(scope.row.Price, 3) : '' }}</template>
				</el-table-column>
				<el-table-column label="成交金额" width="110" align="right">
					<template #default="scope">{{ scope.row.Amount ? fmtMoney(scope.row.Amount) : '' }}</template>
				</el-table-column>
				<el-table-column label="费用" width="90" align="right">
					<template #default="scope">{{ fmtFee(scope.row) }}</template>
				</el-table-column>
				<el-table-column label="发生金额" width="120" align="right">
					<template #default="scope">
						<span :class="changeClass(scope.row.CashAmount)">{{ fmtMoney(scope.row.CashAmount, true) }}</span>
					</template>
				</el-table-column>
			</el-table>
			<el-pagination
				background
				class="trade-pagination"
				layout="total, sizes, prev, pager, next"
				:page-sizes="[20, 50, 100]"
				v-model:current-page="tradePage"
				v-model:page-size="tradePageSize"
				:total="trades.Total"
				@current-change="loadTrades"
				@size-change="onTradeSizeChange"
			></el-pagination>
		</div>

		<!-- 交易分析区 -->
		<div class="box analysis-box">
			<div class="box-title-row">
				<span class="box-title">交易分析</span>
				<span class="box-sub">按股票汇总（含已清仓）；行为得分为全部历史口径（与交易画像一致）；股票列表按最近交易倒序，可搜索</span>
				<span class="filter-row">
					<el-input
						v-model="statsKeyword"
						placeholder="股票代码/名称"
						size="small"
						style="width: 170px"
						clearable
					></el-input>
					<el-button size="small" @click="openBehaviorProfile">
						<font-awesome-icon fas icon="fingerprint"></font-awesome-icon>&nbsp;行为画像
					</el-button>
					<el-button size="small" :loading="auditLoading" @click="openAudit">
						<font-awesome-icon fas icon="scale-balanced"></font-awesome-icon>&nbsp;对账校验
					</el-button>
				</span>
			</div>

			<!-- 行为画像摘要（八维雷达；点击进入画像页） -->
			<div v-if="behaviorStats?.HasData" class="behavior-brief" @click="openBehaviorProfile">
				<div class="bb-radar-wrap">
					<div ref="briefRadarRef" class="bb-radar"></div>
					<div class="bb-total">
						<span class="bb-total-num">{{ behaviorStats?.Scores.Total.toFixed(1) }}</span>
						<span class="bb-total-label">综合得分</span>
					</div>
				</div>
				<div class="bb-dims">
					<div class="bb-dims-head">
						<span class="bb-dims-title">八维能力（全部历史）</span>
						<el-tooltip v-if="behaviorStats?.TradeStyle" content="交易风格（全历史累计）：由持仓周期 × 交易频率二维矩阵合成的六层画像主风格（如短线交易/中线波段/长线投资），详情见行为画像页" placement="top" effect="dark" :show-after="120">
							<span class="bb-style-chip">{{ behaviorStats?.TradeStyle }}</span>
						</el-tooltip>
						<span class="bb-verdict">{{ behaviorVerdict }}</span>
					</div>
					<el-tooltip v-for="d in behaviorDims" :key="d.name" placement="top" effect="dark" :show-after="120">
						<div class="bb-dim">
							<span class="bb-dim-name">{{ d.name }}</span>
							<div class="bb-dim-track"><div class="bb-dim-fill" :style="{ width: `${d.value}%` }"></div></div>
							<span class="bb-dim-val">{{ d.value.toFixed(0) }}</span>
						</div>
						<template #content><div style="max-width: 320px; line-height: 1.5">{{ d.formula }}</div></template>
					</el-tooltip>
				</div>
			</div>
			<el-table
				v-loading="statsLoading"
				:data="filteredStocks"
				class="clickable-table"
				empty-text="暂无交易数据"
				@row-click="drillToStock"
			>
				<el-table-column prop="StockCode" label="代码" width="100"></el-table-column>
				<el-table-column prop="StockName" label="名称" min-width="120"></el-table-column>
				<el-table-column label="板块" width="110">
					<template #default="scope">{{ scope.row.Sector || '--' }}</template>
				</el-table-column>
				<el-table-column prop="LastTradeDate" label="最近交易" width="120" sortable :sort-method="sortByLastTradeDate">
					<template #default="scope">{{ (scope.row.LastTradeDate || '').slice(0, 10) || '--' }}</template>
				</el-table-column>
				<el-table-column label="交易次数" width="100" align="right">
					<template #default="scope">{{ scope.row.TradeCount }}</template>
				</el-table-column>
				<el-table-column label="买入额" width="120" align="right">
					<template #default="scope">{{ fmtMoney(scope.row.BuyAmount) }}</template>
				</el-table-column>
				<el-table-column label="卖出额" width="120" align="right">
					<template #default="scope">{{ fmtMoney(scope.row.SellAmount) }}</template>
				</el-table-column>
				<el-table-column prop="RealizedProfit" label="净盈亏" width="140" align="right" sortable :sort-method="sortByRealizedProfit">
					<template #default="scope">
						<span :class="changeClass(scope.row.RealizedProfit)">{{ fmtMoney(scope.row.RealizedProfit, true) }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="ProfitRatio" label="盈亏比" width="120" align="right" sortable :sort-method="sortByProfitRatio">
					<template #default="scope">
						<el-tooltip :content="ratioTooltip(scope.row)" :disabled="!scope.row.SellCount" placement="top">
							<span :class="ratioClass(scope.row)">{{ fmtRatioText(scope.row) }}</span>
						</el-tooltip>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="160">
					<template #default="scope">
						<el-popover placement="left" :width="480" trigger="click" popper-class="trade-flow-popover" @show="openTradeDetail(scope.row)">
							<template #reference>
								<el-button link type="primary" @click.stop>查看流水</el-button>
							</template>
							<div class="tf-detail">
								<div class="tf-detail-title">
									<b>{{ scope.row.StockName || scope.row.StockCode }}</b>
									<span>{{ scope.row.StockCode }} · 最近 {{ tradeDetailItems.length }} 笔</span>
								</div>
								<div class="tf-detail-head">
									<span>时间</span>
									<span>类别</span>
									<span class="ta-r">数量</span>
									<span class="ta-r">均价</span>
									<span class="ta-r">发生金额</span>
								</div>
								<div v-loading="tradeDetailLoading" class="tf-detail-list">
									<div v-for="(d, di) in tradeDetailItems" :key="di" class="tf-detail-row">
										<span class="tdr-time">{{ adjDetailTime(d) }}</span>
										<span class="tdr-badge" :class="categoryBadgeCls(d.Category)">{{ d.CategoryName || categoryItem(d.Category)?.label || '--' }}</span>
										<span class="ta-r">{{ d.Volume ? fmtVolume(d.Volume) : '--' }}</span>
										<span class="ta-r">{{ d.Price ? fmtPrice(d.Price, 3) : '--' }}</span>
										<span class="ta-r" :class="changeClass(d.CashAmount)">{{ fmtMoney(d.CashAmount, true) }}</span>
									</div>
									<div v-if="!tradeDetailLoading && !tradeDetailItems.length" class="tf-detail-empty">暂无流水记录</div>
								</div>
							</div>
						</el-popover>
						<el-button link type="primary" @click.stop="gotoReview(scope.row.StockCode)">复盘</el-button>
					</template>
				</el-table-column>
			</el-table>
			<div v-if="stats?.Stocks?.length" class="stats-hint">
				<template v-if="statsKeyword.trim()">搜索到 {{ filteredStocks.length }} 只股票</template>
				<template v-else>共 {{ stats?.Stocks?.length ?? 0 }} 只股票，按最近交易倒序；输入股票代码/名称可搜索</template>
			</div>
		</div>

		<!-- 导入结果弹窗 -->
		<el-dialog v-model="importDialogVisible" width="560px" title="导入结果">
			<div v-if="importResult" class="import-result">
				<el-alert v-if="!importResult.Success" :title="importResult.Message" type="error" :closable="false" show-icon></el-alert>
				<template v-else>
					<div class="result-stats">
						<div class="stat-item">
							<span class="num">{{ importResult.TotalRows }}</span>
							<span class="label">总行数</span>
						</div>
						<div class="stat-item success">
							<span class="num">{{ importResult.ImportedRows }}</span>
							<span class="label">成功入库</span>
						</div>
						<div class="stat-item warning">
							<span class="num">{{ importResult.SkippedRows }}</span>
							<span class="label">重复跳过</span>
						</div>
						<div class="stat-item danger">
							<span class="num">{{ importResult.FailRows }}</span>
							<span class="label">解析失败</span>
						</div>
					</div>
					<div class="result-message">{{ importResult.Message }}</div>
					<div v-if="importResult.Errors?.length" class="error-list">
						<div class="error-title">失败明细（{{ importResult.Errors.length }}）</div>
						<div v-for="(e, i) in importResult.Errors" :key="i" class="error-item">{{ e }}</div>
					</div>
				</template>
			</div>
			<template #footer>
				<el-button type="primary" @click="importDialogVisible = false">知道了</el-button>
			</template>
		</el-dialog>

		<!-- 对账校验弹窗 -->
		<el-dialog v-model="auditDialogVisible" width="780px" title="交易对账校验">
			<div v-if="auditResult" class="audit-result">
				<el-alert
					:type="auditResult.IsConsistent ? 'success' : 'warning'"
					:title="auditResult.IsConsistent ? '核对通过：逐笔推导持仓与交割单股份余额一致' : '存在差异：请查看下方不一致明细'"
					:description="auditResult.IsConsistent ? '夜间委托可能造成中间行顺序差异，以期末推导与交割单余额一致为准' : ''"
					:closable="false"
					show-icon
				></el-alert>
				<div class="audit-stats">
					<div class="audit-item">
						<span class="num">{{ auditResult.TradeCount }}</span>
						<span class="label">核对笔数</span>
					</div>
					<div class="audit-item">
						<span class="num">{{ auditResult.StockCount }}</span>
						<span class="label">涉及股票</span>
					</div>
					<div class="audit-item" :class="{ danger: auditResult.FinalMismatchStockCount > 0 }">
						<span class="num">{{ auditResult.FinalMismatchStockCount }}</span>
						<span class="label">期末不一致股票</span>
					</div>
					<div class="audit-item" :class="{ danger: auditResult.NegativeStockCount > 0 }">
						<span class="num">{{ auditResult.NegativeStockCount }}</span>
						<span class="label">负持仓股票</span>
					</div>
				</div>
				<div v-if="auditResult.Items.length" class="audit-list">
					<div class="audit-list-title">不一致明细（{{ auditResult.Items.length }} 行）</div>
					<el-table :data="auditResult.Items" max-height="340" size="small">
						<el-table-column label="日期" width="150">
							<template #default="scope">{{ fmtTradeTime(scope.row) }}</template>
						</el-table-column>
						<el-table-column prop="StockCode" label="代码" width="90"></el-table-column>
						<el-table-column prop="StockName" label="名称" min-width="100"></el-table-column>
						<el-table-column prop="CategoryName" label="类别" width="70"></el-table-column>
						<el-table-column label="数量" width="90" align="right">
							<template #default="scope">{{ fmtVolume(scope.row.Volume) }}</template>
						</el-table-column>
						<el-table-column label="推导持仓" width="90" align="right">
							<template #default="scope">{{ fmtVolume(scope.row.DerivedBalance) }}</template>
						</el-table-column>
						<el-table-column label="交割单余额" width="100" align="right">
							<template #default="scope">{{ fmtVolume(scope.row.ShareBalance) }}</template>
						</el-table-column>
						<el-table-column label="差异" width="80" align="right">
							<template #default="scope">
								<span :class="changeClass(scope.row.Diff)">{{ scope.row.Diff > 0 ? '+' : '' }}{{ fmtVolume(scope.row.Diff) }}</span>
							</template>
						</el-table-column>
						<el-table-column label="期末" width="60" align="center">
							<template #default="scope">
								<el-tag v-if="scope.row.IsFinal" type="danger" size="small">期末</el-tag>
							</template>
						</el-table-column>
					</el-table>
				</div>
				<div v-else class="audit-empty">未发现不一致行</div>
			</div>
			<template #footer>
				<el-button type="primary" @click="auditDialogVisible = false">知道了</el-button>
			</template>
		</el-dialog>

		<!-- 复盘抽屉（日/周/月/个股） -->
		<ReviewDrawer
			v-model="reviewVisible"
			:type="reviewType"
			:date="reviewDate"
			:stock-code="reviewStockCode"
			:stock-name="reviewStockName"
			@saved="onReviewSaved"
		/>

		<!-- 当日明细抽屉（点击日历日期格：持仓浮动盈亏 / 净盈亏 / 费用明细） -->
		<DayDetailDrawer v-model="dayDetailVisible" :date="dayDetailDate" />

		<!-- 流派评定弹窗（选择流派 + 实测对照说明） -->
		<SchoolDialog v-model="schoolDialogVisible" :behavior-stats="behaviorStats" @saved="onSchoolSaved" />
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage, CalendarInstance } from 'element-plus'
import dayjs from '@/untils/dayjs'
import * as echarts from 'echarts'
import { formatPercent, formatThousands, getFavorites, saveFavorites } from '@/consts/zhiduoxing-const'
import { IPersonalMenuTree } from '@/interfaces/IPersonalMenuTree'
import { IBasePage } from '@/interfaces/IBasePage'
import { IZdxStockQuoteItem } from '@/interfaces/zhiduoxing/IZdxStockQuote'
import {
	ZDX_TRADE_CATEGORIES,
	IZdxTradeRecordData,
	IZdxTradeImportResult,
	IZdxTradePosition,
	IZdxTradeStats,
	IZdxTradeStockStat,
	IZdxProfitCalendar,
	IZdxProfitCalendarDay,
	IZdxProfitYear,
	IZdxProfitOverall,
	IZdxProfitTrend,
	IZdxTradeAudit,
	IZdxFeeTrend,
	IZdxReview,
	IZdxBehaviorStats,
	IZdxBehaviorScore,
	IZdxProfitTrendCompare,
	IZdxProfitTrendComparePoint,
	IZdxAssetTrend,
	IZdxAssetPoint
} from '@/interfaces/zhiduoxing/IZdxMyTrade'
import { IZdxWatchlistItem } from '@/interfaces/zhiduoxing/IZdxWatchlist'
import { storeToRefs } from 'pinia'
import zdxApi from '@/apis/zdx-api'
import baseApi from '@/apis/base-api'
import { useBrowserStore } from '@/stores/browserStore'
import { useUserStore } from '@/stores/userStore'
import { useTokenStore } from '@/stores/tokenStore'
import { IZdxMyProfile } from '@/interfaces/zhiduoxing/IZdxSchool'
import DayDetailDrawer from './components/DayDetailDrawer.vue'
import ReviewDrawer from './components/ReviewDrawer.vue'
import SchoolDialog from './components/SchoolDialog.vue'

const browserStore = useBrowserStore()

// 个股详情菜单（跳转个股详情页用；与 sys_menu 配置一致）
const STOCK_DETAIL_MENU: IPersonalMenuTree = {
	Id: '7E4B2C9A-1D5F-4A8B-9C0E-08DF07289DFB',
	Code: 'ZdxStockQuote',
	Name: '个股行情',
	Url: '/zhiduoxing/stock-detail',
	Type: 2,
	OpenType: 1,
	Icon: 'arrow-trend-up',
	IsDefault: false,
	Children: []
}

// 复盘中心菜单（跳转复盘中心页用；与 sys_menu 配置一致，携带股票代码获得个股复盘上下文）
const REVIEW_MENU: IPersonalMenuTree = {
	Id: 'ZdxStockReview',
	Code: 'ZdxStockReview',
	Name: '复盘中心',
	Url: '/zhiduoxing/stock-review',
	Type: 2,
	OpenType: 1,
	Icon: 'pen-to-square',
	IsDefault: false,
	Children: []
}

// 跳转复盘中心（默认携带最近查看的股票代码；无查看记录时进入空态页）
function gotoReview(code?: string) {
	const target = (code || watchCode.value || '').trim()
	browserStore.navigate(REVIEW_MENU, undefined, target ? { code: target } : undefined)
}

// 跳转个股行情页面（自选/持仓列表与当前持仓名称点击共用；记录最近查看股票，供“前往复盘中心”携带上下文）
function gotoStockDetail(code?: string) {
	const target = (code || '').trim()
	if (!target) return
	watchCode.value = target
	browserStore.navigate(STOCK_DETAIL_MENU, undefined, { code: target })
}

// ---------- 格式化 ----------
function changeClass(value?: number) {
	if (value === undefined || value === null || value === 0) return ''
	return value > 0 ? 'up' : 'down'
}
function fmtMoney(value: number, signed = false) {
	return formatThousands(value, signed)
}
// 价格千分位（默认两位小数，可指定成本价 4 位/均价 3 位）
function fmtPrice(value: number, digits = 2) {
	const fixed = Math.abs(value).toFixed(digits)
	const [int, dec] = fixed.split('.')
	const grouped = int.replace(/\B(?=(\d{3})+$)/g, ',')
	return `${value < 0 ? '-' : ''}${grouped}.${dec}`
}
function fmtVolume(value: number) {
	return Number.isInteger(value) ? value.toString() : value.toFixed(2)
}
function fmtTradeTime(row: IZdxTradeRecordData) {
	const date = dayjs(row.TradeDate).format('YYYY-MM-DD')
	return row.TradeTime ? `${date} ${row.TradeTime}` : date
}
function fmtFee(row: IZdxTradeRecordData) {
	const fee = (row.Commission ?? 0) + (row.OtherFee ?? 0) + (row.StampTax ?? 0) + (row.TransferFee ?? 0)
	return fee ? formatThousands(fee) : ''
}
function categoryItem(category: number) {
	return ZDX_TRADE_CATEGORIES.find(c => c.value === category)
}
// 短数字（格内小字用：≥1万显示万元缩写，否则取整）
function fmtShort(value: number) {
	if (Math.abs(value) >= 10000) return `${(value / 10000).toFixed(1)}万`
	return Math.round(value).toString()
}

// ---------- 持仓 ----------
const positions = ref<IZdxTradePosition[]>([])
const positionLoading = ref(false)
// 当前持仓（剔除今日清仓挂显行；合计/明细等逻辑以此为准）
const holdPositions = computed(() => positions.value.filter(p => !p.IsClearedToday))
const totalMarketValue = computed(() => holdPositions.value.reduce((sum, p) => sum + p.MarketValue, 0))
const totalFloatProfit = computed(() => holdPositions.value.reduce((sum, p) => sum + p.FloatProfit, 0))

async function loadPositions() {
	positionLoading.value = true
	try {
		positions.value = await zdxApi.getMyPositions()
	} catch {
		positions.value = []
	} finally {
		positionLoading.value = false
	}
}

// 持仓表行样式：今日清仓挂显行（券商持仓页行为）浅灰标识
function positionRowClassName({ row }: { row: IZdxTradePosition }) {
	return row.IsClearedToday ? 'cleared-row' : ''
}

// ---------- 统计 ----------
const stats = ref<IZdxTradeStats>()
const statsLoading = ref(false)
const statsKeyword = ref('')

// 分析表数据：全量展示（后端已按最近交易倒序），输入股票代码/名称时按关键字过滤
const filteredStocks = computed(() => {
	const list = stats.value?.Stocks ?? []
	const kw = statsKeyword.value.trim().toUpperCase()
	if (!kw) return list
	return list.filter(s => (s.StockCode || '').toUpperCase().includes(kw) || (s.StockName || '').toUpperCase().includes(kw))
})

// 最近交易列排序（按日期字符串；空值视为最早）
function sortByLastTradeDate(a: IZdxTradeStockStat, b: IZdxTradeStockStat) {
	return (a.LastTradeDate || '').localeCompare(b.LastTradeDate || '')
}

async function loadStats() {
	statsLoading.value = true
	try {
		stats.value = await zdxApi.getMyTradeStats()
	} catch {
		stats.value = undefined
	} finally {
		statsLoading.value = false
	}
}

// ---------- 收益日历 ----------
const calendarDate = ref(new Date())
const calendarRef = ref<CalendarInstance>()
const calendar = ref<IZdxProfitCalendar>()
// 概览卡“当月净盈亏”专用：固定当前自然月（不随日历浏览月份变化）
const currentCalendar = ref<IZdxProfitCalendar>()
const calendarLoading = ref(false)
// 月/年/至今视图切换与年历数据
const calendarMode = ref<'month' | 'year' | 'overall'>('month')
const calendarYear = ref(dayjs().year())
const yearCalendar = ref<IZdxProfitYear>()
const yearLoading = ref(false)
// 至今视图数据（全历史按年汇总）与年份列表
const overall = ref<IZdxProfitOverall>()
const overallLoading = ref(false)
const overallYears = computed(() => overall.value?.Years ?? [])
const yearMonths = computed(() => yearCalendar.value?.Months ?? [])
const isCurrentYear = computed(() => calendarYear.value === dayjs().year())
const calendarMap = computed(() => {
	const map = new Map<string, IZdxProfitCalendarDay>()
	;(calendar.value?.Days ?? []).forEach(d => map.set(dayjs(d.TradeDate).format('YYYY-MM-DD'), d))
	return map
})
const isCurrentMonth = computed(() => dayjs(calendarDate.value).year() === dayjs().year() && dayjs(calendarDate.value).month() === dayjs().month())
const todayStr = dayjs().format('YYYY-MM-DD')
// 当月盈亏对比（盈利日浮动盈亏合计 vs 亏损日浮动盈亏合计；从 Days 自算与格子口径一致）
const monthCompare = computed(() => {
	let win = 0
	let loss = 0
	for (const d of calendar.value?.Days ?? []) {
		if (!d.HasData) continue
		if (d.MarkProfit > 0) win += d.MarkProfit
		else if (d.MarkProfit < 0) loss -= d.MarkProfit
	}
	win = Math.round(win * 100) / 100
	loss = Math.round(loss * 100) / 100
	return { win, loss, has: win + loss > 0 }
})
// 全年盈亏对比（后端年历直接给出盈利日/亏损日合计）
const yearCompare = computed(() => {
	const win = yearCalendar.value?.WinProfitSum ?? 0
	const loss = yearCalendar.value?.LossProfitSum ?? 0
	return { win, loss, has: win + loss > 0 }
})
// 至今盈亏对比（后端直接给出全历史盈利日/亏损日合计）
const overallCompare = computed(() => {
	const win = overall.value?.WinProfitSum ?? 0
	const loss = overall.value?.LossProfitSum ?? 0
	return { win, loss, has: win + loss > 0 }
})
// 综合收益合计（净盈亏 + 红利 + 利息；三项均为资金净额口径，无数据为 undefined）
function sumIncome(profit?: number, dividend?: number, interest?: number) {
	if (profit === undefined) return undefined
	return Math.round((profit + (dividend ?? 0) + (interest ?? 0)) * 100) / 100
}
const statsTotalIncome = computed(() => {
	const s = stats.value
	return s ? sumIncome(s.RealizedProfit, s.DividendSum, s.InterestSum) : undefined
})

async function loadCalendar(year: number, month: number) {
	calendarLoading.value = true
	try {
		calendar.value = await zdxApi.getProfitCalendar(year, month)
		// 浏览月为当月时同步概览卡缓存，避免重复请求
		const now = dayjs()
		if (year === now.year() && month === now.month() + 1) currentCalendar.value = calendar.value
	} catch {
		calendar.value = undefined
	} finally {
		calendarLoading.value = false
	}
}

// 单独刷新概览卡当月缓存（浏览月非当月时的导入刷新场景）
async function loadCurrentCalendar() {
	const now = dayjs()
	try {
		currentCalendar.value = await zdxApi.getProfitCalendar(now.year(), now.month() + 1)
	} catch {
		// 失败保持旧值
	}
}

// 加载年历数据（12 个月汇总 + 年合计）
async function loadYear(year: number) {
	yearLoading.value = true
	try {
		yearCalendar.value = await zdxApi.getProfitYear(year)
	} catch {
		yearCalendar.value = undefined
	} finally {
		yearLoading.value = false
	}
}

// 加载至今数据（全历史按年盈亏/费用/红利汇总 + 总合计）
async function loadOverall() {
	overallLoading.value = true
	try {
		overall.value = await zdxApi.getProfitOverall()
	} catch {
		overall.value = undefined
	} finally {
		overallLoading.value = false
	}
}

// 年格子点击：切到该月月视图
function gotoMonth(month: number) {
	calendarDate.value = new Date(calendarYear.value, month - 1, 1)
	calendarMode.value = 'month'
}

function yearCellClass(m: { MarkProfit: number; HasData?: boolean; SellCount: number }) {
	if (m.HasData === false) return 'trade-flat'
	if (m.MarkProfit > 0) return 'profit-up'
	if (m.MarkProfit < 0) return 'profit-down'
	return m.SellCount > 0 ? 'profit-flat' : 'trade-flat'
}

// 至今格子点击：切到该年年视图
function gotoYear(year: number) {
	calendarYear.value = year
	calendarMode.value = 'year'
}

function isYearCurrentMonth(month: number) {
	const now = dayjs()
	return calendarYear.value === now.year() && month === now.month() + 1
}

// 日历切换月份自动加载（点击日期仅为选中，不重复加载）
watch(calendarDate, value => {
	const year = dayjs(value).year()
	const month = dayjs(value).month() + 1
	loadReviewDays(year, month)
	if (calendar.value && calendar.value.Year === year && calendar.value.Month === month) return
	loadCalendar(year, month)
})

// 月/年/至今视图切换：切到年视图加载年数据、切到至今加载全历史数据
watch(calendarMode, mode => {
	if (mode === 'year') {
		loadYear(calendarYear.value)
		loadReviewMonths(calendarYear.value)
	} else if (mode === 'overall') loadOverall()
})

// 年视图导航：上一年/下一年/本年切换后重新加载
watch(calendarYear, year => {
	if (calendarMode.value === 'year') {
		loadYear(year)
		loadReviewMonths(year)
	}
})

function selectCalDate(type: 'prev-month' | 'today' | 'next-month') {
	calendarRef.value?.selectDate(type)
}
function calDay(data: any): IZdxProfitCalendarDay | undefined {
	return calendarMap.value.get(data.day)
}
function calDayText(data: any) {
	return dayjs(data.day).format('D')
}
function calCellClass(data: any) {
	const classes: string[] = []
	if (data.day === todayStr) classes.push('day-today')
	if (data.type !== 'current-month') {
		classes.push('other-month')
		return classes.join(' ')
	}
	const d = calDay(data)
	if (!d) return classes.join(' ')
	if (d.HasData) {
		if (d.MarkProfit > 0) classes.push('profit-up')
		else if (d.MarkProfit < 0) classes.push('profit-down')
		else classes.push('profit-flat')
	} else if (!d.IsTradeDay) classes.push('non-trade')
	else classes.push('trade-flat')
	return classes.join(' ')
}
// 卖出标记圆点（仅当月且有卖出结算的日期显示；红盈/绿亏/灰平）
function calSellDot(data: any) {
	if (data.type !== 'current-month') return ''
	const d = calDay(data)
	if (!d || !d.SellCount) return ''
	if (d.Profit > 0) return 'up'
	if (d.Profit < 0) return 'down'
	return 'flat'
}
// 单元格文本：有落库数据显示浮动盈亏金额；交易日无数据显示“--”；休市显示“休”
function calProfitText(data: any) {
	if (data.type !== 'current-month') return ''
	const d = calDay(data)
	if (!d) return ''
	if (d.HasData) return fmtMoney(d.MarkProfit, true)
	return d.IsTradeDay ? '--' : '休'
}
// 当月费用分项文案（佣金/印花税/过户费/其他；为 0 的分项省略；无费用返回空串）
function monthFeeText() {
	const c = calendar.value
	if (!c || !c.MonthFeeSum) return ''
	const parts: string[] = []
	if (c.MonthCommissionSum) parts.push(`佣金 ${formatThousands(c.MonthCommissionSum)}`)
	if (c.MonthStampTaxSum) parts.push(`印花税 ${formatThousands(c.MonthStampTaxSum)}`)
	if (c.MonthTransferFeeSum) parts.push(`过户费 ${formatThousands(c.MonthTransferFeeSum)}`)
	if (c.MonthOtherFeeSum) parts.push(`其他 ${formatThousands(c.MonthOtherFeeSum)}`)
	return parts.join(' · ')
}
// 格内费用小字（当日费用非0时显示“费 X”）
function calFeeShort(data: any) {
	if (data.type !== 'current-month') return ''
	const d = calDay(data)
	return d && d.FeeSum ? `费 ${fmtShort(d.FeeSum)}` : ''
}
// 格内红利小字（当日红利非0时显示“红 X”；负数=税补缴）
function calDividendShort(data: any) {
	if (data.type !== 'current-month') return ''
	const d = calDay(data)
	return d && d.DividendSum ? `红 ${fmtShort(d.DividendSum)}` : ''
}
// 格内利息小字（当日利息非0时显示“息 X”）
function calInterestShort(data: any) {
	if (data.type !== 'current-month') return ''
	const d = calDay(data)
	return d && d.InterestSum ? `息 ${fmtShort(d.InterestSum)}` : ''
}
// 单日费用明细（tooltip 用；无费用返回空串）
function calDayFeeText(d: IZdxProfitCalendarDay) {
	if (!d.FeeSum) return ''
	const parts: string[] = []
	if (d.CommissionSum) parts.push(`佣金 ${formatThousands(d.CommissionSum)}`)
	if (d.StampTaxSum) parts.push(`印花税 ${formatThousands(d.StampTaxSum)}`)
	if (d.TransferFeeSum) parts.push(`过户费 ${formatThousands(d.TransferFeeSum)}`)
	if (d.OtherFeeSum) parts.push(`其他 ${formatThousands(d.OtherFeeSum)}`)
	return `费用 ${formatThousands(d.FeeSum)}${parts.length ? `（${parts.join(' · ')}）` : ''}`
}
function calTooltip(data: any) {
	if (data.type !== 'current-month') return ''
	const d = calDay(data)
	if (!d) return ''
	const date = dayjs(d.TradeDate).format('YYYY-MM-DD')
	const feeText = calDayFeeText(d)
	const dividendText = d.DividendSum ? `红利 ${formatThousands(d.DividendSum, true)}` : ''
	const interestText = d.InterestSum ? `利息 ${formatThousands(d.InterestSum, true)}` : ''
	const extra = [feeText, dividendText, interestText].filter(Boolean).join(' · ')
	const reviewTip = isReviewDay(data) ? '已复盘' : ''
	if (d.HasData) {
		const sellText = d.SellCount > 0 ? ` · 卖出净盈亏 ${fmtMoney(d.Profit, true)}（${d.SellCount} 笔 / 盈利 ${d.WinCount} 笔）` : ''
		const base = `${date} 浮动盈亏 ${formatThousands(d.MarkProfit, true)}（已含当日费用/红利/利息）${sellText}`
		const text = extra ? `${base} · ${extra}` : base
		return reviewTip ? `${text} · ${reviewTip}` : text
	}
	const closed = d.Remark || (d.DayType === 2 ? '周末休市' : '节假日休市')
	if (!d.IsTradeDay) {
		const text = extra ? `${date} ${closed} · ${extra}` : `${date} ${closed}`
		return reviewTip ? `${text} · ${reviewTip}` : text
	}
	const base = `${date} 交易日（暂无数据）`
	const text = extra ? `${base} · ${extra}` : base
	return reviewTip ? `${text} · ${reviewTip}` : text
}

// ---------- 盈亏比 ----------
type RatioRow = { SellCount: number; ProfitRatio: number; AvgProfit: number; AvgLoss: number; WinSellCount: number }
// 盈亏比展示文本（无卖出显示 --；纯盈利显示 ∞；无盈利且无亏损显示 --）
function fmtRatioText(row: RatioRow) {
	if (!row.SellCount) return '--'
	if (row.AvgLoss <= 0) return row.AvgProfit > 0 ? '∞' : '--'
	return row.ProfitRatio.toFixed(2)
}
// 盈亏比颜色（>1 红 / <1 绿 / ∞ 红 / 无有效值无色）
function ratioClass(row: RatioRow) {
	if (!row.SellCount) return ''
	if (row.AvgLoss <= 0) return row.AvgProfit > 0 ? 'up' : ''
	return row.ProfitRatio > 1 ? 'up' : row.ProfitRatio < 1 ? 'down' : ''
}
function ratioTooltip(row: RatioRow) {
	if (!row.SellCount) return '暂无卖出结算'
	return `盈利 ${row.WinSellCount} 笔 / 亏损 ${row.SellCount - row.WinSellCount} 笔；平均盈利 ${formatThousands(row.AvgProfit, true)} / 平均亏损 ${formatThousands(-row.AvgLoss, true)}`
}
function sortByRealizedProfit(a: IZdxTradeStockStat, b: IZdxTradeStockStat) {
	return a.RealizedProfit - b.RealizedProfit
}
// 盈亏比排序：无卖出最前；∞（无亏损且盈利）视为最大
function sortByProfitRatio(a: IZdxTradeStockStat, b: IZdxTradeStockStat) {
	return ratioSortValue(a) - ratioSortValue(b)
}
function ratioSortValue(row: RatioRow) {
	if (!row.SellCount) return -1
	if (row.AvgLoss <= 0) return row.AvgProfit > 0 ? Number.MAX_SAFE_INTEGER : -1
	return row.ProfitRatio
}

// ---------- 收益趋势 ----------
const trend = ref<IZdxProfitTrend>()
const trendLoading = ref(false)
// 收益趋势视图：cum=全历史累计；year=当年 1-12 月；index=近1年收益率指数对比
const trendMode = ref<'cum' | 'year' | 'index'>('cum')
const trendChartRef = ref<HTMLDivElement>()
let trendChart: echarts.ECharts | undefined
// 指数对比（今年：用户收益率 vs 上证/深证/创业板/科创板指数）
const trendCompare = ref<IZdxProfitTrendCompare>()
const trendCompareLoading = ref(false)

// 对比点（固定今年区间、区间基准重算）：用户收益率=区间净盈亏÷区间平均总资产（日均资产口径）；
// 基准=区间内首个总资产>0 的点（年初清零/重新入金时 Total 可能为 0，基准前为 null 断线）；指数为区间差值
const comparePoints = computed<IZdxProfitTrendComparePoint[]>(() => {
	const all = trendCompare.value?.Points ?? []
	if (!all.length) return all
	const now = dayjs()
	const begin = now.startOf('year').format('YYYY-MM-DD')
	const idx = all.findIndex(p => p.Date >= begin)
	if (idx < 0) return all.slice(-1)
	const range = all.slice(idx)
	// 基准点：区间内首个有资产的日终点（此前为清零区间，无可用分母）
	const baseIdx = range.findIndex(p => (p.Total ?? 0) > 0)
	if (baseIdx < 0) return range.map(p => ({ ...p, UserRate: null }))
	const base = range[baseIdx]
	const baseTotal = base.Total ?? 0
	const baseNet = base.NetInvest ?? 0
	// 区间平均总资产（自基准点起算；避免首日小基数放大收益率）
	const avgTotal = Math.max(range.slice(baseIdx).reduce((sum, p) => sum + (p.Total ?? 0), 0) / (range.length - baseIdx), 1)
	const diff = (v?: number, b?: number) => (v ?? 0) - (b ?? 0)
	return range.map((p, i) => ({
		...p,
		UserRate: i < baseIdx ? null : Number((((p.Total ?? 0) - baseTotal - ((p.NetInvest ?? 0) - baseNet)) / avgTotal * 100).toFixed(2)),
		ShRate: diff(p.ShRate, base.ShRate),
		SzRate: diff(p.SzRate, base.SzRate),
		CybRate: diff(p.CybRate, base.CybRate),
		KcbRate: diff(p.KcbRate, base.KcbRate)
	}))
})

// 趋势图容器可见性（指数对比模式以对比数据为准）
const trendChartVisible = computed(() => (trendMode.value === 'index' ? !!trendCompare.value?.HasData : !!trend.value?.Months?.length))

async function loadTrend() {
	trendLoading.value = true
	try {
		trend.value = await zdxApi.getProfitTrend()
	} catch {
		trend.value = undefined
	} finally {
		trendLoading.value = false
		if (trend.value?.Months?.length) nextTick(() => renderTrendChart())
	}
}

// 指数对比数据（首次切换到对比视图时懒加载；失败后可再次切换重试）
async function loadTrendCompare() {
	if (trendCompare.value || trendCompareLoading.value) return
	trendCompareLoading.value = true
	try {
		trendCompare.value = await zdxApi.getMyProfitTrendCompare()
	} catch {
		trendCompare.value = undefined
	} finally {
		trendCompareLoading.value = false
		nextTick(() => renderTrendChart())
	}
}

// 渲染趋势图：cum=全历史累计（面积线，缺失月份持平）；year=当年 1-12 月（柱=当月盈亏、线=当年累计）；index=收益率指数对比
function renderTrendChart() {
	if (!trendChartRef.value) return
	// 容器被 v-if 重建后旧实例指向已销毁 DOM，需销毁后重建
	if (trendChart && trendChart.getDom() !== trendChartRef.value) {
		trendChart.dispose()
		trendChart = undefined
	}
	if (!trendChart) trendChart = echarts.init(trendChartRef.value)
	if (trendMode.value === 'index') {
		renderCompareChart()
		return
	}
	const now = dayjs()
	const map = new Map((trend.value?.Months ?? []).map(m => [m.Year * 100 + m.Month, m]))
	const xData: string[] = []
	const barData: (number | null)[] = []
	const lineData: (number | null)[] = []
	const isYear = trendMode.value === 'year'
	if (isYear) {
		let cum = 0
		for (let m = 1; m <= 12; m++) {
			xData.push(`${m}月`)
			if (m > now.month() + 1) {
				barData.push(null)
				lineData.push(null)
				continue
			}
			const item = map.get(now.year() * 100 + m)
			cum += item?.Profit ?? 0
			barData.push(item ? Number(item.Profit.toFixed(2)) : 0)
			lineData.push(Number(cum.toFixed(2)))
		}
	} else {
		const first = trend.value?.FirstMonth
		let cur = first ? dayjs(first + '-01').startOf('month') : now.startOf('month')
		let cum = 0
		while (cur.isBefore(now, 'month') || cur.isSame(now, 'month')) {
			xData.push(cur.format('YYYY-MM'))
			const item = map.get(cur.year() * 100 + (cur.month() + 1))
			if (item) cum = item.CumulativeProfit
			barData.push(item ? Number(item.Profit.toFixed(2)) : null)
			lineData.push(Number(cum.toFixed(2)))
			cur = cur.add(1, 'month')
		}
	}
	const option: any = {
		grid: { left: 76, right: 30, top: 40, bottom: 30 },
		tooltip: {
			trigger: 'axis',
			formatter: (params: any[]) => {
				const lines = (params ?? []).map((p: any) => `${p.marker}${p.seriesName}：${typeof p.value === 'number' ? formatThousands(p.value, true) : '--'}`)
				return `${params?.[0]?.axisValue ?? ''}<br/>${lines.join('<br/>')}`
			}
		},
		legend: { top: 4, right: 10, data: isYear ? ['当月浮动盈亏', '当年累计'] : ['累计浮动盈亏'] },
		xAxis: { type: 'category', data: xData, boundaryGap: true },
		yAxis: {
			type: 'value',
			axisLabel: { formatter: (v: number) => (Math.abs(v) >= 10000 ? (v / 10000).toFixed(1) + '万' : String(v)) }
		},
		series: isYear
			? [
					{
						name: '当月浮动盈亏',
						type: 'bar',
						data: barData,
						barMaxWidth: 26,
						itemStyle: { color: (params: any) => (typeof params.value === 'number' && params.value < 0 ? '#67c23a' : '#f56c6c') }
					},
					{
						name: '当年累计',
						type: 'line',
						data: lineData,
						smooth: true,
						symbol: 'none',
						lineStyle: { width: 2, color: '#409eff' },
						itemStyle: { color: '#409eff' }
					}
				]
			: [
					{
						name: '累计浮动盈亏',
						type: 'line',
						data: lineData,
						smooth: true,
						symbol: 'none',
						lineStyle: { width: 2, color: '#409eff' },
						itemStyle: { color: '#409eff' },
						areaStyle: { color: 'rgba(64, 158, 255, 0.12)' }
					}
				]
	}
	trendChart.setOption(option, true)
}

// 渲染指数对比（固定今年；按区间基准重算，x 轴仅显示首尾日期）
function renderCompareChart() {
	if (!trendChart) return
	const points = comparePoints.value
	if (!points.length) return
	const pick = (p: IZdxProfitTrendComparePoint, get: (v: IZdxProfitTrendComparePoint) => number | null | undefined) => {
		const v = get(p)
		return typeof v === 'number' ? Number(v.toFixed(2)) : null
	}
	const line = (name: string, color: string, width: number, get: (v: IZdxProfitTrendComparePoint) => number | null | undefined) => ({
		name,
		type: 'line',
		data: points.map(p => pick(p, get)),
		smooth: true,
		symbol: 'none',
		connectNulls: true,
		lineStyle: { width, color },
		itemStyle: { color }
	})
	trendChart.setOption({
		grid: { left: 56, right: 20, top: 40, bottom: 30 },
		tooltip: {
			trigger: 'axis',
			formatter: (params: any[]) => {
				const lines = (params ?? []).map(
					(p: any) => `${p.marker}${p.seriesName}：${typeof p.value === 'number' ? `${p.value > 0 ? '+' : ''}${p.value.toFixed(2)}%` : '--'}`
				)
				return `${params?.[0]?.axisValueLabel ?? ''}<br/>${lines.join('<br/>')}`
			}
		},
		legend: { top: 4, right: 10, data: ['我的收益', '上证指数', '深证成指', '创业板指', '科创板指数'] },
		xAxis: {
			type: 'category',
			data: points.map(p => p.Date),
			boundaryGap: false,
			axisLabel: { interval: (i: number) => i === 0 || i === points.length - 1, fontSize: 11 }
		},
		yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${v}%` }, splitLine: { lineStyle: { color: '#eef0f6' } } },
		series: [
			line('我的收益', '#f56c6c', 2.4, p => p.UserRate),
			line('上证指数', '#409eff', 1.4, p => p.ShRate),
			line('深证成指', '#e6a23c', 1.4, p => p.SzRate),
			line('创业板指', '#67c23a', 1.4, p => p.CybRate),
			line('科创板指数', '#909399', 1.4, p => p.KcbRate)
		]
	} as any, true)
}

function handleTrendResize() {
	trendChart?.resize()
	feeChart?.resize()
	pieChart?.resize()
	briefRadarChart?.resize()
	assetChart?.resize()
}

watch(trendMode, () => {
	// 指数对比首次切换时懒加载数据（加载完成后自动渲染）；其余模式直接重渲染
	if (trendMode.value === 'index' && !trendCompare.value) {
		loadTrendCompare()
		return
	}
	nextTick(() => renderTrendChart())
})

// ---------- 资产总览 ----------
// 总资产趋势（全历史序列按月度/年度聚合 + 资金流向流程图：转入/转出/其他流入 → 净流入 → 账户盈亏 → 期末总资产）
const assetTrend = ref<IZdxAssetTrend>()
const assetTrendLoading = ref(false)
const assetChartRef = ref<HTMLDivElement>()
let assetChart: echarts.ECharts | undefined
// 总资产趋势聚合粒度：month=按月（取每月最后一点）、year=按年（取每年最后一点）
const assetGranularity = ref<'month' | 'year'>('month')
// 聚合后的趋势点（期末快照；Date 为原始日终日期，横轴标签按粒度截取）
const assetTrendPoints = computed<IZdxAssetPoint[]>(() => {
	const points = assetTrend.value?.Trend ?? []
	if (!points.length) return points
	const keyOf = (d: string) => (assetGranularity.value === 'year' ? d.slice(0, 4) : d.slice(0, 7))
	const map = new Map<string, IZdxAssetPoint>()
	points.forEach(p => map.set(keyOf(p.Date), p))
	return Array.from(map.values())
})
// 资金流向流程：账户盈亏 = 期末总资产 − 净流入
const afProfit = computed(() => Number(((assetTrend.value?.TotalAsset ?? 0) - (assetTrend.value?.NetInflow ?? 0)).toFixed(2)))

watch(assetGranularity, () => nextTick(() => renderAssetChart()))

async function loadAssetTrend() {
	assetTrendLoading.value = true
	try {
		assetTrend.value = await zdxApi.getMyAssetTrend()
	} catch {
		assetTrend.value = undefined
	} finally {
		assetTrendLoading.value = false
		if (assetTrend.value?.HasData) nextTick(() => renderAssetChart())
	}
}

// 渲染总资产变动趋势（总资产/持仓市值/现金三线；按月度/年度聚合成期末快照，横轴最多约 7 个刻度）
function renderAssetChart() {
	const el = assetChartRef.value
	const points = assetTrendPoints.value
	if (!el || !points.length) return
	if (!assetChart) assetChart = echarts.init(el)
	const isYear = assetGranularity.value === 'year'
	const labelOf = (d: string) => (isYear ? d.slice(0, 4) : d.slice(0, 7))
	assetChart.setOption({
		grid: { left: 64, right: 16, top: 34, bottom: 26 },
		tooltip: {
			trigger: 'axis',
			formatter: (params: any[]) => {
				const lines = (params ?? []).map((p: any) => `${p.marker}${p.seriesName}：${typeof p.value === 'number' ? formatThousands(p.value) : '--'}`)
				return `${params?.[0]?.axisValueLabel ?? ''}<br/>${lines.join('<br/>')}`
			}
		},
		legend: { top: 2, right: 8, data: ['总资产', '持仓市值', '现金'] },
		xAxis: {
			type: 'category',
			data: points.map(p => labelOf(p.Date)),
			boundaryGap: false,
			axisLabel: { interval: Math.max(Math.ceil(points.length / 7) - 1, 0), fontSize: 11 }
		},
		yAxis: { type: 'value', scale: true, axisLabel: { formatter: (v: number) => (Math.abs(v) >= 10000 ? (v / 10000).toFixed(1) + '万' : String(v)) } },
		series: [
			{ name: '总资产', type: 'line', data: points.map(p => Number(p.Total.toFixed(2))), smooth: true, symbol: 'none', lineStyle: { width: 2, color: '#4a7ef7' }, itemStyle: { color: '#4a7ef7' }, areaStyle: { color: 'rgba(74, 126, 247, 0.1)' } },
			{ name: '持仓市值', type: 'line', data: points.map(p => Number(p.MarketValue.toFixed(2))), smooth: true, symbol: 'none', lineStyle: { width: 1.5, color: '#e6a23c' }, itemStyle: { color: '#e6a23c' } },
			{ name: '现金', type: 'line', data: points.map(p => Number(p.Cash.toFixed(2))), smooth: true, symbol: 'none', lineStyle: { width: 1.5, color: '#67c23a' }, itemStyle: { color: '#67c23a' } }
		]
	} as any, true)
}

const feeTrend = ref<IZdxFeeTrend>()
const feeLoading = ref(false)
const feeChartRef = ref<HTMLDivElement>()
let feeChart: echarts.ECharts | undefined
// 费用趋势视图：recent=近 24 个月柱状；all=全部历史至今折线
const feeMode = ref<'recent' | 'all'>('recent')

const cashFlows = ref<IZdxTradeRecordData[]>([])
const cashLoading = ref(false)

const pieChartRef = ref<HTMLDivElement>()
let pieChart: echarts.ECharts | undefined

// 剩余现金（最新一条流水的资金余额；无流水为 null）
const latestCash = ref<number | null>(null)

// KPI 带：与顶部概览卡互补（累计买卖/持仓成本/红利利息/浮盈比例）
const assetKpis = computed(() => {
	const s = stats.value
	const cost = holdPositions.value.reduce((sum, p) => sum + p.Volume * p.AvgCost, 0)
	const percent = cost ? (totalFloatProfit.value / cost) * 100 : 0
	return [
		{ label: '累计买入总额', value: s ? fmtMoney(s.BuyAmount) : '--', cls: '', sub: s ? `${s.BuyCount} 笔成交` : '暂无数据' },
		{ label: '累计卖出总额', value: s ? fmtMoney(s.SellAmount) : '--', cls: '', sub: s ? `${s.SellCount} 笔成交` : '暂无数据' },
		{ label: '持仓成本', value: holdPositions.value.length ? fmtMoney(Number(cost.toFixed(2))) : '--', cls: '', sub: `当前持仓 ${holdPositions.value.length} 只` },
		{ label: '累计红利入账', value: s ? fmtMoney(s.DividendSum, true) : '--', cls: s ? changeClass(s.DividendSum) : '', sub: '资金流水类，不计入盈亏' },
		{ label: '累计利息归本', value: s ? fmtMoney(s.InterestSum, true) : '--', cls: s ? changeClass(s.InterestSum) : '', sub: '资金流水类，不计入盈亏' },
		{ label: '持仓浮盈比例', value: cost ? `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%` : '--', cls: changeClass(percent), sub: cost ? `浮盈 ${fmtMoney(totalFloatProfit.value, true)}` : '暂无持仓' }
	]
})

// 净盈亏 TOP（仅统计卖出过的个股；正=盈利榜、负=亏损榜）
const profitTop = computed(() =>
	(stats.value?.Stocks ?? [])
		.filter(s => s.SellCount > 0 && s.RealizedProfit > 0)
		.sort((a, b) => b.RealizedProfit - a.RealizedProfit)
		.slice(0, 10)
)
const lossTop = computed(() =>
	(stats.value?.Stocks ?? [])
		.filter(s => s.SellCount > 0 && s.RealizedProfit < 0)
		.sort((a, b) => a.RealizedProfit - b.RealizedProfit)
		.slice(0, 10)
)

// 费用月度趋势（recent=近 24 个月；all=全部历史至今）
const feeTrendMonths = computed(() => {
	const months = feeTrend.value?.Months ?? []
	return feeMode.value === 'all' ? months : months.slice(-24)
})

// 板块配色（框架常用色系：主蓝/紫/橙/绿/红/青/灰/紫罗兰/橙）
const SECTOR_COLORS = ['#409eff', '#7c5cf0', '#e6a23c', '#67c23a', '#f56c6c', '#41c5d8', '#909399', '#b37feb', '#ef8f4e']

// 总资产口径（持仓市值 + 剩余现金；板块/现金占比的分母）
const totalAsset = computed(() => totalMarketValue.value + (latestCash.value ?? 0))

// 板块占比（按持仓市值聚合；Sector 缺失归"未分类"；占比相对总资产）
const sectorStats = computed(() => {
	const base = totalAsset.value
	if (!base) return []
	const map = new Map<string, number>()
	for (const p of holdPositions.value) {
		const name = p.Sector?.trim() || '未分类'
		map.set(name, (map.get(name) ?? 0) + p.MarketValue)
	}
	return [...map.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([name, value], i) => ({ name, value, percent: (value / base) * 100, color: SECTOR_COLORS[i % SECTOR_COLORS.length] ?? '#909399' }))
})

// 剩余现金占总资产比例（无现金口径为 null）
const cashRatio = computed(() => {
	if (latestCash.value === null) return null
	const base = totalAsset.value
	if (!base) return null
	return (latestCash.value / base) * 100
})

async function loadFeeTrend() {
	feeLoading.value = true
	try {
		feeTrend.value = await zdxApi.getMyFeeTrend()
	} catch {
		feeTrend.value = undefined
	} finally {
		feeLoading.value = false
		if (feeTrendMonths.value.length) nextTick(() => renderFeeChart())
	}
}

// 渲染费用图（recent=近24月柱状；all=全部历史折线；悬停显示佣金/印花税/过户费/其他分项）
function renderFeeChart() {
	if (!feeChartRef.value) return
	if (!feeChart) feeChart = echarts.init(feeChartRef.value)
	const months = feeTrendMonths.value
	const isAll = feeMode.value === 'all'
	const option: any = {
		grid: { left: 56, right: 16, top: 24, bottom: 26 },
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: isAll ? 'line' : 'shadow' },
			formatter: (params: any[]) => {
				const p = params?.[0]
				if (!p) return ''
				const m = months[p.dataIndex]
				const lines = [
					`${p.marker}费用合计：${formatThousands(m.FeeSum)}`,
					`&nbsp;&nbsp;佣金：${formatThousands(m.CommissionSum)}`,
					`&nbsp;&nbsp;印花税：${formatThousands(m.StampTaxSum)}`,
					`&nbsp;&nbsp;过户费：${formatThousands(m.TransferFeeSum)}`
				]
				if (m.OtherFeeSum) lines.push(`&nbsp;&nbsp;其他：${formatThousands(m.OtherFeeSum)}`)
				return `${p.axisValue}<br/>${lines.join('<br/>')}`
			}
		},
		xAxis: { type: 'category', boundaryGap: !isAll, data: months.map(m => `${String(m.Year).slice(2)}-${String(m.Month).padStart(2, '0')}`), axisLabel: { fontSize: 10 } },
		yAxis: { type: 'value', axisLabel: { formatter: (v: number) => (Math.abs(v) >= 10000 ? (v / 10000).toFixed(1) + '万' : String(v)) } },
		series: [
			isAll
				? {
						name: '费用',
						type: 'line',
						smooth: true,
						symbol: 'circle',
						symbolSize: 5,
						data: months.map(m => Number(m.FeeSum.toFixed(2))),
						lineStyle: { width: 2, color: '#e6a23c' },
						itemStyle: { color: '#e6a23c' },
						areaStyle: { color: 'rgba(230, 162, 60, 0.14)' }
					}
				: {
						name: '费用',
						type: 'bar',
						data: months.map(m => Number(m.FeeSum.toFixed(2))),
						barMaxWidth: 18,
						itemStyle: { color: '#e6a23c', borderRadius: [3, 3, 0, 0] }
					}
		]
	}
	feeChart.setOption(option, true)
}

// 红利/利息记录（复用流水接口按类别拉取，合并后按日期倒序取最近 50 笔）
async function loadCashFlows() {
	cashLoading.value = true
	try {
		const [dividend, interest] = await Promise.all([
			zdxApi.getMyTrades({ Category: 5 }, 1, 50),
			zdxApi.getMyTrades({ Category: 6 }, 1, 50)
		])
		cashFlows.value = [...(dividend?.Items ?? []), ...(interest?.Items ?? [])]
			.sort((a, b) => (a.TradeDate < b.TradeDate ? 1 : -1))
			.slice(0, 50)
	} catch {
		cashFlows.value = []
	} finally {
		cashLoading.value = false
	}
}

// 环图数据（前 8 大 + 其他；仅含市值大于 0 的持仓）
const pieItems = computed(() => {
	const items = positions.value
		.filter(p => p.MarketValue > 0)
		.slice(0, 8)
		.map(p => ({ name: p.StockName || p.StockCode, value: Number(p.MarketValue.toFixed(2)) }))
	const rest = totalMarketValue.value - items.reduce((sum, it) => sum + it.value, 0)
	if (rest > 0.01) items.push({ name: '其他', value: Number(rest.toFixed(2)) })
	return items
})

// 渲染持仓分布环图（图例带市值占比）
function renderPieChart() {
	if (!pieChartRef.value) return
	if (!pieChart) pieChart = echarts.init(pieChartRef.value)
	const total = totalMarketValue.value
	const items = pieItems.value
	const option: any = {
		// 框架常用色系（替换 ECharts 默认蓝绿调色板）
		color: SECTOR_COLORS,
		tooltip: {
			trigger: 'item',
			formatter: (p: any) => `${p.marker}${p.name}<br/>市值：${formatThousands(p.value)}（${p.percent}%）`
		},
		legend: {
			bottom: 0,
			type: 'scroll',
			icon: 'circle',
			itemWidth: 8,
			itemHeight: 8,
			itemGap: 8,
			textStyle: { fontSize: 11 },
			formatter: (name: string) => {
				const it = items.find(x => x.name === name)
				return it ? `${name} ${(total ? (it.value / total) * 100 : 0).toFixed(1)}%` : name
			}
		},
		series: [
			{
				type: 'pie',
				radius: ['42%', '64%'],
				center: ['50%', '42%'],
				label: { show: false },
				itemStyle: { borderColor: '#fff', borderWidth: 2 },
				data: items
			}
		]
	}
	pieChart.setOption(option, true)
}

watch(positions, () => {
	nextTick(() => renderPieChart())
})

// 费用视图切换（近24月柱状 / 至今折线）：重渲染
watch(feeMode, () => {
	if (feeTrendMonths.value.length) nextTick(() => renderFeeChart())
})

// ---------- 概览卡片 ----------
const overviewCards = computed(() => {
	const s = stats.value
	const c = currentCalendar.value
	return [
		{
			label: '持仓市值', icon: 'coins', tint: 'blue',
			value: fmtMoney(totalMarketValue.value),
			cls: '',
			sub: `当前持仓 ${holdPositions.value.length} 只`
		},
		{
			label: '当月浮盈', icon: 'calendar-day', tint: 'violet',
			value: c ? fmtMoney(c.MonthMarkProfit, true) : '--',
			cls: changeClass(c?.MonthMarkProfit),
			sub: c ? `${c.Year}-${String(c.Month).padStart(2, '0')} 盯市口径 · 与券商APP一致` : '暂无数据'
		},
		{
			label: '累计净盈亏', icon: 'sack-dollar', tint: 'violet',
			value: s ? fmtMoney(s.RealizedProfit, true) : '--',
			cls: changeClass(s?.RealizedProfit),
			sub: s ? `买入 ${s.BuyCount} / 卖出 ${s.SellCount} 笔` : '暂无数据'
		},
		{
			label: '累计综合收益', icon: 'gem', tint: 'blue',
			value: s ? fmtMoney(statsTotalIncome.value ?? 0, true) : '--',
			cls: s ? changeClass(statsTotalIncome.value) : '',
			sub: s ? `净盈亏 + 红利 ${formatThousands(s.DividendSum)} + 利息 ${formatThousands(s.InterestSum)}` : '暂无数据'
		},
		{
			label: '累计红利入账', icon: 'hand-holding-dollar', tint: 'orange',
			value: s ? fmtMoney(s.DividendSum, true) : '--',
			cls: s ? changeClass(s.DividendSum) : '',
			sub: '分红送转入账净额，不计入盈亏'
		},
		{
			label: '累计利息归本', icon: 'piggy-bank', tint: 'orange',
			value: s ? fmtMoney(s.InterestSum, true) : '--',
			cls: s ? changeClass(s.InterestSum) : '',
			sub: '账户利息净额，不计入盈亏'
		},
		{
			label: '盈亏比', icon: 'scale-balanced', tint: 'violet',
			value: s ? fmtRatioText(s) : '--',
			cls: s ? ratioClass(s) : '',
			sub: s ? `平均盈利 ${formatThousands(s.AvgProfit)} / 平均亏损 ${formatThousands(s.AvgLoss)}` : '暂无数据'
		},
		{
			label: '交易笔数', icon: 'right-left', tint: 'blue',
			value: s ? String(s.TotalCount) : '--',
			cls: '',
			sub: s ? `覆盖 ${s.Stocks.length} 只股票` : '暂无数据'
		},
		{
			label: '总费用支出', icon: 'receipt', tint: 'orange',
			value: s ? fmtMoney(s.FeeSum) : '--',
			cls: '',
			sub: s ? feeSubText(s) : '暂无数据'
		}
	]
})

// 费用支出明细文案（佣金/印花税/过户费；其他费用非零时追加）
function feeSubText(s: IZdxTradeStats) {
	const parts = [
		`佣金 ${formatThousands(s.CommissionSum)}`,
		`印花税 ${formatThousands(s.StampTaxSum)}`,
		`过户费 ${formatThousands(s.TransferFeeSum)}`
	]
	if (s.OtherFeeSum) parts.push(`其他 ${formatThousands(s.OtherFeeSum)}`)
	return parts.join(' · ')
}

// ---------- 券商费率（账单分析） ----------
// 是否有费率样本（全部未识别时显示空态）
const feeRateHasData = computed(() => {
	const s = stats.value
	return !!(s && (s.CommissionRate || s.MinCommission || s.StampTaxRate || s.TransferFeeRate))
})

// 费率展示行（佣金费率/印花税率/过户费率；最低佣金并入佣金行备注；佣金费率区分手动校准）
const feeRateRows = computed(() => {
	const s = stats.value
	if (!s) return []
	return [
		{
			label: '佣金费率',
			value: s.CommissionRate ? `万${fmtRateNum(s.CommissionRate * 10000)}` : '未识别',
			manual: !!s.IsFeeRateManual,
			note: feeRateCommissionNote(s)
		},
		{
			label: '印花税率',
			value: s.StampTaxRate ? `千${fmtRateNum(s.StampTaxRate * 1000)}` : '未识别',
			note: '卖出单边'
		},
		{
			label: '过户费率',
			value: s.TransferFeeRate ? `万${fmtRateNum(s.TransferFeeRate * 10000)}` : '未识别',
			note: '买卖双向'
		}
	]
})

// 费率样本日期文案（1900年视为无样本）
const feeRateTimeText = computed(() => {
	const t = stats.value?.FeeRateTime
	if (!t) return ''
	const d = dayjs(t)
	return d.year() > 2000 ? d.format('YYYY-MM-DD') : ''
})

// 费率样本说明文案（含样本日期；手动校准时说明校准口径）
const feeRateFootText = computed(() => {
	const t = feeRateTimeText.value
	if (stats.value?.IsFeeRateManual) {
		return t ? `佣金费率已手动校准 · 样本更新至 ${t}` : '佣金费率已手动校准'
	}
	const base = '基于最近成交样本推导（最多 120 笔）'
	return t ? `${base} · 更新至 ${t}` : base
})

// 校准按钮提示文案
const feeRateCalibrateTip = computed(() =>
	stats.value?.IsFeeRateManual ? '佣金费率已按券商App手动校准，点击修改或恢复自动分析' : '按券商App显示的佣金费率校准（含规费口径）'
)

// 费率展示数字（最多3位小数并去掉末尾0：万2.5 / 万0.854）
function fmtRateNum(value: number) {
	return value.toFixed(3).replace(/\.?0+$/, '')
}

// 佣金费率行备注（手动校准/自动分析/可手动校准 + 最低佣金）
function feeRateCommissionNote(s: IZdxTradeStats) {
	const tag = s.IsFeeRateManual ? '手动校准' : s.CommissionRate ? '自动分析' : '可手动校准'
	return s.MinCommission ? `${tag} · 最低 ${fmtRateNum(s.MinCommission)} 元` : tag
}

// ---------- 佣金费率校准 ----------
const calibrateVisible = ref(false)
const calibrateRate = ref<number>(0)
const calibrateSaving = ref(false)

// 打开校准弹窗（回填当前生效费率，万分之口径）
function openCalibrate() {
	const s = stats.value
	calibrateRate.value = s && s.CommissionRate ? Number((s.CommissionRate * 10000).toFixed(3)) : 0
	calibrateVisible.value = true
}

// 保存校准（万分之输入转小数；0=清除校准恢复自动分析；校验与错误提示由服务端返回）
async function saveCalibrate() {
	const rate = Number(((calibrateRate.value || 0) / 10000).toFixed(7))
	calibrateSaving.value = true
	try {
		await zdxApi.setMyCommissionRate(rate)
		calibrateVisible.value = false
		loadStats()
	} finally {
		calibrateSaving.value = false
	}
}

// ---------- 自选股 ----------
const watchlist = ref<IZdxWatchlistItem[]>([])
const watchLoading = ref(false)
const watchCode = ref('')

// 自选 / 持仓合并行
interface WatchRow {
	StockCode: string
	StockName?: string
	Price?: number
	ChangePercent?: number
	// 是否自选（仅自选可移除）
	IsWatch: boolean
	// 持仓数量（有持仓时显示“持 N”标记）
	HoldVolume?: number
}

// 自选 + 持仓合并列表（自选在前；持仓股去重补入）
const watchRows = computed<WatchRow[]>(() => {
	const rows: WatchRow[] = watchlist.value.map(w => ({
		StockCode: w.StockCode,
		StockName: w.StockName,
		Price: w.Price,
		ChangePercent: w.ChangePercent,
		IsWatch: true
	}))
	const rowMap = new Map(rows.map(r => [r.StockCode, r]))
	for (const p of holdPositions.value) {
		const exists = rowMap.get(p.StockCode)
		if (exists) {
			exists.HoldVolume = p.Volume
			continue
		}
		rows.push({
			StockCode: p.StockCode,
			StockName: p.StockName,
			Price: p.Price,
			ChangePercent: p.ChangePercent,
			IsWatch: false,
			HoldVolume: p.Volume
		})
	}
	return rows
})

// 搜索加自选（远程搜索：代码/名称双字段并行查询合并）
const addCode = ref('')
const searchOptions = ref<IZdxStockQuoteItem[]>([])
const searchLoading = ref(false)
let searchSeq = 0
let searchTimer: ReturnType<typeof setTimeout> | undefined

function searchStocks(keyword: string) {
	if (searchTimer) clearTimeout(searchTimer)
	const kw = (keyword ?? '').trim()
	if (!kw) {
		searchOptions.value = []
		return
	}
	searchTimer = setTimeout(() => doSearchStocks(kw), 300)
}

async function doSearchStocks(kw: string) {
	const seq = ++searchSeq
	searchLoading.value = true
	const empty = { Items: [] as IZdxStockQuoteItem[], Total: 0, PageSize: 0, PageIndex: 1 }
	try {
		const [byCode, byName] = await Promise.all([
			zdxApi.getStocks({ Code: kw }, 1, 20).catch(() => empty),
			zdxApi.getStocks({ Name: kw }, 1, 20).catch(() => empty)
		])
		if (seq !== searchSeq) return
		const map = new Map<string, IZdxStockQuoteItem>()
		for (const item of [...byCode.Items, ...byName.Items]) {
			if (!map.has(item.Code)) map.set(item.Code, item)
		}
		searchOptions.value = [...map.values()].sort((a, b) => b.ChangePercent - a.ChangePercent)
	} finally {
		if (seq === searchSeq) searchLoading.value = false
	}
}

// 选中搜索结果即添加自选（提示由响应拦截器统一弹出）
async function onAddSelect(code: string) {
	if (!code) return
	addCode.value = ''
	searchOptions.value = []
	try {
		await zdxApi.addWatchlist(code)
		await loadWatchlist()
	} catch {
		// 失败提示已由拦截器弹出
	}
}

// 加载自选列表（首次进入且服务端为空时，尝试迁移 localStorage 旧自选）
async function loadWatchlist() {
	watchLoading.value = true
	try {
		let list = await zdxApi.getWatchlist()
		if (!list.length) {
			const legacy = getFavorites()
			if (legacy.length) {
				const migrated = await zdxApi.migrateWatchlist(legacy).catch(() => null)
				if (migrated && migrated.MigratedCount > 0) {
					// 迁移成功后清理本地旧数据，避免重复迁移
					saveFavorites([])
					list = await zdxApi.getWatchlist()
				}
			}
		}
		watchlist.value = list
	} catch {
		watchlist.value = []
	} finally {
		watchLoading.value = false
	}
}

// 移除自选
async function removeWatch(code: string) {
	try {
		await zdxApi.delWatchlist(code)
		await loadWatchlist()
	} catch {
		// 失败提示已由拦截器弹出
	}
}

// ---------- 交易流水 ----------
const trades = ref<IBasePage<IZdxTradeRecordData>>({ Total: 0, PageSize: 20, PageIndex: 1, Items: [] })
const tradeLoading = ref(false)
const tradePage = ref(1)
const tradePageSize = ref(20)
const dateRange = ref<[string, string] | null>(null)
const categoryFilter = ref<number | undefined>()
const keywordFilter = ref('')
// 交易流水卡片容器（分析区下钻后滚动定位用）
const tradeBoxRef = ref<HTMLElement>()

async function loadTrades() {
	tradeLoading.value = true
	try {
		trades.value = await zdxApi.getMyTrades(
			{
				Begin: dateRange.value?.[0],
				End: dateRange.value?.[1],
				Category: categoryFilter.value,
				Keyword: keywordFilter.value.trim() || undefined
			},
			tradePage.value,
			tradePageSize.value
		)
	} catch {
		trades.value = { Total: 0, PageSize: tradePageSize.value, PageIndex: tradePage.value, Items: [] }
	} finally {
		tradeLoading.value = false
	}
}

function applyTradeFilter() {
	tradePage.value = 1
	loadTrades()
}

function onTradeSizeChange() {
	tradePage.value = 1
	loadTrades()
}

// ---------- 近期调仓（近 30 天按股票合并；悬浮展示逐笔明细） ----------
const recentAdjusts = ref<IZdxTradeRecordData[]>([])

// 资金流金额（买入为负、卖出为正；发生金额缺失时按成交金额推导）
function adjFlowAmount(row: IZdxTradeRecordData) {
	const value = Math.abs(row.CashAmount || row.Amount || 0)
	return row.Category === 1 ? -value : value
}

// 调仓合并分组（买卖笔数/金额/净额/最近时间/逐笔明细）
interface IAdjGroup {
	StockCode: string
	StockName: string
	BuyCount: number
	SellCount: number
	BuyAmount: number
	SellAmount: number
	NetAmount: number
	LastTime: string
	Details: IZdxTradeRecordData[]
}
const adjustGroups = computed<IAdjGroup[]>(() => {
	const map = new Map<string, IAdjGroup>()
	recentAdjusts.value.forEach(r => {
		const code = r.StockCode || '--'
		let g = map.get(code)
		if (!g) {
			g = { StockCode: code, StockName: r.StockName || '', BuyCount: 0, SellCount: 0, BuyAmount: 0, SellAmount: 0, NetAmount: 0, LastTime: '', Details: [] }
			map.set(code, g)
		}
		const amt = Math.abs(r.CashAmount || r.Amount || 0)
		if (r.Category === 1) {
			g.BuyCount++
			g.BuyAmount += amt
		} else {
			g.SellCount++
			g.SellAmount += amt
		}
		g.Details.push(r)
	})
	const list = Array.from(map.values())
	list.forEach(g => {
		g.BuyAmount = Number(g.BuyAmount.toFixed(2))
		g.SellAmount = Number(g.SellAmount.toFixed(2))
		// 净额=卖出-买入（正=净卖出回笼）
		g.NetAmount = Number((g.SellAmount - g.BuyAmount).toFixed(2))
		// 明细按时间倒序（最近的在前）
		g.Details.sort((a, b) => adjDetailTime(b).localeCompare(adjDetailTime(a)) || b.Id - a.Id)
		g.LastTime = g.Details.length ? adjDetailTime(g.Details[0]) : ''
	})
	// 分组按最近交易倒序
	list.sort((a, b) => b.LastTime.localeCompare(a.LastTime))
	return list
})

// 调仓汇总（近30天：股票数/笔数/买入总额/卖出总额/净额合计）
const adjustSummary = computed(() => {
	const list = adjustGroups.value
	const buy = list.reduce((s, g) => s + g.BuyAmount, 0)
	const sell = list.reduce((s, g) => s + g.SellAmount, 0)
	return {
		stockCount: list.length,
		tradeCount: recentAdjusts.value.length,
		buyAmount: Number(buy.toFixed(2)),
		sellAmount: Number(sell.toFixed(2)),
		netAmount: Number((sell - buy).toFixed(2))
	}
})

// 明细时间（日期 + 时间）
function adjDetailTime(r: IZdxTradeRecordData) {
	return fmtTradeTime(r)
}

async function loadRecentAdjust() {
	try {
		const now = dayjs()
		const page = await zdxApi.getMyTrades(
			{ Begin: now.subtract(30, 'day').format('YYYY-MM-DD'), End: now.format('YYYY-MM-DD') },
			1,
			300
		)
		recentAdjusts.value = (page?.Items ?? []).filter(r => r.Category === 1 || r.Category === 2)
	} catch {
		recentAdjusts.value = []
	}
}

// 最新一条流水的资金余额（剩余现金口径；无流水为 null）
async function loadLatestCash() {
	try {
		const page = await zdxApi.getMyTrades(undefined, 1, 1)
		const item = page?.Items?.[0]
		latestCash.value = item ? item.CashBalance : null
	} catch {
		latestCash.value = null
	}
}

// 分析区点击行：下钻到该股流水（筛选后滚动到交易流水卡片，否则当前视口无感知）
function drillToStock(row: { StockCode: string }) {
	if (!row?.StockCode) return
	keywordFilter.value = row.StockCode
	categoryFilter.value = undefined
	dateRange.value = null
	tradePage.value = 1
	loadTrades()
	nextTick(() => tradeBoxRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

// ---------- 查看流水悬浮明细（点击弹层就地查看，不跳转滚动） ----------
const tradeDetailLoading = ref(false)
const tradeDetailItems = ref<IZdxTradeRecordData[]>([])

// 类别徽标配色：买入红 / 卖出绿 / 其他灰
function categoryBadgeCls(category: number) {
	return category === 1 ? 'buy' : category === 2 ? 'sell' : 'other'
}

// 弹层显示时按股票代码拉取最近 50 笔流水
async function openTradeDetail(row: { StockCode: string }) {
	tradeDetailItems.value = []
	tradeDetailLoading.value = true
	try {
		const page = await zdxApi.getMyTrades({ Keyword: row.StockCode }, 1, 50)
		tradeDetailItems.value = page?.Items ?? []
	} catch {
		tradeDetailItems.value = []
	} finally {
		tradeDetailLoading.value = false
	}
}

// ---------- 导入 ----------
const importResult = ref<IZdxTradeImportResult>()
const importDialogVisible = ref(false)
const importing = ref(false)

async function uploadExcel(upload: any) {
	const file: File | undefined = upload?.file
	if (!file) return
	if (!/\.xlsx$/i.test(file.name)) {
		ElMessage.error('仅支持 xlsx 格式（xls 请另存为 xlsx 后导入）')
		return
	}
	importing.value = true
	try {
		importResult.value = await zdxApi.importMyTrade(file)
		importDialogVisible.value = true
		// 导入成功后刷新流水/持仓/统计/日历/趋势
		tradePage.value = 1
		loadTrades()
		loadPositions()
		loadStats()
		loadBehavior()
		loadTrend()
		loadFeeTrend()
		loadCashFlows()
		loadAssetTrend()
		loadRecentAdjust()
		loadLatestCash()
		const now = dayjs()
		const cur = dayjs(calendarDate.value)
		loadCalendar(cur.year(), cur.month() + 1)
		if (cur.year() !== now.year() || cur.month() !== now.month()) loadCurrentCalendar()
		if (calendarMode.value === 'year') loadYear(calendarYear.value)
		if (calendarMode.value === 'overall') loadOverall()
	} catch (error: any) {
		ElMessage.error(error?.Message ?? '导入失败，请稍后重试')
	} finally {
		importing.value = false
	}
}

// ---------- 对账校验 ----------
const auditResult = ref<IZdxTradeAudit>()
const auditDialogVisible = ref(false)
const auditLoading = ref(false)

// 逐笔推导持仓 vs 交割单股份余额（幂等校验：期末一致且无负持仓视为通过）
async function openAudit() {
	auditLoading.value = true
	try {
		auditResult.value = await zdxApi.getMyTradeAudit()
		auditDialogVisible.value = true
	} catch {
		// 失败提示已由拦截器弹出
	} finally {
		auditLoading.value = false
	}
}

// ---------- 交易行为画像 ----------
// 行为画像菜单（跳转独立页面用；与自动路由 /zhiduoxing/behavior-profile 一致）
const BEHAVIOR_MENU: IPersonalMenuTree = {
	Id: 'ZdxBehaviorProfile',
	Code: 'ZdxBehaviorProfile',
	Name: '交易画像',
	Url: '/zhiduoxing/behavior-profile',
	Type: 2,
	OpenType: 1,
	Icon: 'fingerprint',
	IsDefault: false,
	Children: []
}

function openBehaviorProfile() {
	browserStore.navigate(BEHAVIOR_MENU)
}

// 行为画像摘要（八维雷达·全部历史）：与独立画像页同源同口径，仅取评分用于概览
const behaviorStats = ref<IZdxBehaviorStats>()
const briefRadarRef = ref<HTMLDivElement>()
let briefRadarChart: echarts.ECharts | undefined

// 八维评分维度定义（展示顺序与雷达一致；评分依据按评分标准（流派参数优先，无可用流派回退默认宽松标准）动态生成，与画像页口径一致）
const BRIEF_SCORE_DIMS: { key: keyof IZdxBehaviorScore; name: string }[] = [
	{ key: 'ProfitRatio', name: '盈亏比' },
	{ key: 'WinRate', name: '胜率' },
	{ key: 'Timing', name: '择时' },
	{ key: 'CostControl', name: '成本' },
	{ key: 'RiskControl', name: '风控' },
	{ key: 'Patience', name: '耐心' },
	{ key: 'DrawdownControl', name: '回撤控制' },
	{ key: 'Profitability', name: '收益能力' }
]

// 维度评分依据文案（基础数值参照：实际值 + 流派参照阈值 + 换算口径；ScoreBasis 缺失时回退通用口径）
function briefDimFormula(key: keyof IZdxBehaviorScore): string {
	const b = behaviorStats.value?.ScoreBasis
	switch (key) {
		case 'ProfitRatio':
			return b
				? `得分：盈亏比 ${b.ProfitRatio.toFixed(2)} vs 达标线 ${b.ProfitRatioTarget}（软饱和：达标=85、${b.ProfitRatioCapMult ?? 3}×达标封顶 100；全胜计 100）`
				: '得分 = 软饱和映射（盈亏比 ÷ 流派达标线）：达标=85、封顶倍数×达标封顶 100（倍数默认 3；全胜计 100）'
		case 'WinRate':
			return b ? `得分 = 盈利 ${b.WinSellCount} 笔 ÷ 总平仓 ${b.SellCount} 笔 × 100（全流派通用）` : '得分 = 盈利平仓笔数 ÷ 总平仓笔数 × 100'
		case 'Timing':
			return b
				? `得分 = 0.6 × 买入后${b.TimingWindow}日 ${b.AvgBuyWindowChange.toFixed(2)}% 映射 + 0.4 × 卖出后${b.TimingWindow}日 ${b.AvgSellWindowChange.toFixed(2)}% 反向映射（软饱和居中：0=50、±${b.TimingSpan}%=85/15、±${b.TimingCapMult ?? 3}×幅度=100/0；样本不足按 50）`
				: '得分 = 0.6 × 买入后均涨幅映射 + 0.4 × 卖出后均涨幅反向映射（软饱和居中：0=50、±标准幅度=85/15、±封顶倍数×幅度=100/0，倍数默认 3；样本不足按 50）'
		case 'CostControl':
			return b
				? b.GrossProfitSum !== undefined
					? b.GrossProfitSum > 0
						? `得分 = 100 − 费用侵蚀比 ${b.FeeErosionRatio.toFixed(1)}% ÷ 零分线 ${b.FeeErosionTolerance}% × 100（侵蚀比 = 费用 ÷ 盈利平仓毛利合计 ${formatThousands(b.GrossProfitSum)} 元）`
						: `无止盈样本（盈利平仓毛利合计 ${formatThousands(b.GrossProfitSum)} 元 ≤ 0）：费用侵蚀无从评估，按中性 50 分（不以固定低分惩罚亏损账户）`
					: `得分 = 100 − 费用侵蚀比 ${b.FeeErosionRatio.toFixed(1)}% ÷ 零分线 ${b.FeeErosionTolerance}% × 100（侵蚀比 = 费用 ÷ 净盈利；盈利 ≤ 0 记 0；本次评定为旧口径快照）`
				: '得分 = 100 − 费用侵蚀比 ÷ 标准零分线 × 100（侵蚀比 = 费用 ÷ 盈利平仓毛利合计；全亏无止盈样本按中性 50 无法评估）'
		case 'RiskControl':
			return b
				? b.StreakPenaltyStart
					? `得分 = 100 − 大亏烈度扣分（大亏合计 ${formatThousands(b.BigLossAmountSum ?? 0)} 元 = 资金基准的 ${(b.BigLossCapitalRatio ?? 0).toFixed(1)}%，每 1% 扣 1.5 分封顶 60） − 连亏惩罚（最大连亏 ${b.MaxLossStreak} 笔，期望 ${(b.ExpectMaxLossStreak ?? 0).toFixed(1)} 笔，超起扣 ${b.StreakPenaltyStart} 笔每笔 6 分，期望 k*=ln(n·q̂)÷ln(1/p̂)、p̂=(亏损笔数+1)÷(总笔数+2) Laplace 平滑；下限 5）`
					: b.BigLossAmount > 0
						? `得分 = 100 − 大亏占比 ${b.BigLossRatio.toFixed(1)}% × 60 − 连亏惩罚（大亏 = 单笔亏损低于 -平均单笔买入 ${formatThousands(b.AvgBuyAmount)} 元 × ${b.BigLossThreshold}% = ${formatThousands(b.BigLossAmount)} 元；最大连亏 ${b.MaxLossStreak} 笔，超 ${b.ConsecutiveLossStart} 笔每笔 6 分；本次评定为旧口径快照）`
						: `得分 = 100 − 大亏占比 ${b.BigLossRatio.toFixed(1)}% × 60 − 连亏惩罚（大亏阈值 ${formatThousands(b.BigLossThreshold)} 元；最大连亏 ${b.MaxLossStreak} 笔，超 ${b.ConsecutiveLossStart} 笔每笔 6 分；本次评定为旧口径快照）`
				: '得分 = 100 − 大亏烈度（大亏合计 ÷ 资金基准）− 连亏惩罚（起扣取标准阈值与期望最大连亏的大者）；下限 5 分'
		case 'Patience':
			return b
				? `得分：平均持有 ${b.AvgHoldDays.toFixed(1)} 天 vs 达标 ${b.HoldDaysTarget} 天（软饱和：达标=85、${b.PatienceCapMult ?? 3}×达标封顶 100）− 处置扣分（下限 0）`
				: '得分 = 软饱和映射（平均持有天数 ÷ 流派达标天数）：达标=85、封顶倍数×达标封顶 100（倍数默认 3）− 处置效应扣分（下限 0）'
		case 'DrawdownControl':
			return b
				? b.CumulativeReturn > 0
					? `得分 = 100 − 最大回撤 ${formatThousands(b.MaxDrawdown)} 元 ÷ 基准 ${formatThousands(b.DrawdownScale)} 元 × 100（基准 = max(曲线峰值, 单笔均幅×${b.AvgAmplitudeMultiplier}, 资金基准 ${formatThousands(b.CapitalBase)} 元)；无卖出按 50 计）`
					: b.ReboundAmount !== undefined
						? `亏损账户按止血度：得分 = 50 × 期末反弹 ${formatThousands(b.ReboundAmount)} 元 ÷ 最大回撤 ${formatThousands(b.MaxDrawdown)} 元（单调阴跌记 0）`
						: `得分 = 100 − 最大回撤 ${formatThousands(b.MaxDrawdown)} 元 ÷ 基准 ${formatThousands(b.DrawdownScale)} 元 × 100（本次评定为旧口径快照）`
				: '得分 = 盈利账户 100 − 最大回撤 ÷ 基准 × 100；亏损账户止血度 = 50 × 期末反弹 ÷ 最大回撤（单调阴跌记 0）'
		case 'Profitability':
			return b
				? `得分：年化 ${b.AnnualRate.toFixed(2)}% vs 达标线 ${b.AnnualRateTarget}%（软饱和居中：0=50、达标=85、${b.ProfitCapMult ?? 3}×达标封顶 100，负方向对称；累计收益率 ${b.CumulativeReturn.toFixed(2)}%；活跃 ${b.TradeDays} 天）`
				: '得分 = 软饱和居中映射（年化收益率 ÷ 流派达标线）：0=50、达标=85、封顶倍数×达标=100（倍数默认 3）'
		default:
			return ''
	}
}

async function loadBehavior() {
	try {
		behaviorStats.value = await zdxApi.getMyBehaviorStats()
	} catch {
		behaviorStats.value = undefined
	} finally {
		if (behaviorStats.value?.HasData) nextTick(() => renderBriefRadar())
	}
}

// ---------- 头部档案卡（头像/签名/流派状态行） ----------
const userStore = useUserStore()
const userStoreRef = storeToRefs(userStore)
const tokenStore = useTokenStore()
const domain = ref(baseApi.getHost())
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${tokenStore.bearToken}` })) // 原生上传不走 axios 拦截器，需手动带 Bearer 前缀
const signEditing = ref(false) // 签名编辑中
const signInput = ref('') // 签名输入
const myProfile = ref<IZdxMyProfile | null>(null) // 我的流派档案
const schoolDialogVisible = ref(false) // 评定弹窗
const importUploadRef = ref() // 交易流水区上传组件（头部导入入口转发）

// 加载我的流派档案（评定弹窗保存后刷新）
async function loadProfile() {
	try {
		myProfile.value = await zdxApi.getMyProfile()
	} catch {
		myProfile.value = null
	}
}

// 头像上传前置校验（≤500KB，与服务端限制一致）
function beforeAvatarUpload(file: File) {
	if (file.size > 500 * 1024) {
		ElMessage.error('头像文件不能超过 500KB')
		return false
	}
	return true
}

// 头像上传成功（服务端返回 Url；同步全局用户信息）
function onAvatarSuccess(res: any) {
	if (res?.Status && res.Data?.Result?.Url) {
		userStore.setUserHeader(res.Data.Result.Url)
		ElMessage.success('头像已更新')
	} else {
		ElMessage.error(res?.Message || '头像上传失败')
	}
}

// 头像上传失败（401/网络异常等；原生上传不走 axios 拦截器，需自行提示）
function onAvatarError() {
	ElMessage.error('头像上传失败，请稍后重试')
}

// 打开签名编辑（回填当前签名）
function openSignEdit() {
	signInput.value = userStore.user?.Signature ?? ''
	signEditing.value = true
}

// 保存签名（复用工作签名，与个人中心同接口）
async function saveSign() {
	const val = signInput.value.trim()
	if (val === (userStore.user?.Signature ?? '')) {
		signEditing.value = false
		return
	}
	try {
		const res = await baseApi.updateSignature(val)
		if (res.Status) {
			userStore.setUserSignature(val)
			signEditing.value = false
		}
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	}
}

// 头部导入入口：转发到交易流水区上传组件
function triggerImport() {
	const input = importUploadRef.value?.$el?.querySelector('input[type=file]')
	if (input) input.click()
	else ElMessage.warning('导入组件未就绪，请稍后重试')
}

// 流派与实测画像对照提示（按流派名关键词的轻量启发式；无规则时引导查看对照说明）
const cmpTip = computed<{ text: string; tone: string; icon: string }>(() => {
	const p = myProfile.value
	if (!p?.SchoolId) return { text: '评定流派后查看与实测画像的对照', tone: '', icon: 'circle-info' }
	const s = behaviorStats.value
	if (!s || !s.HasData || !s.TradeStyle) return { text: '导入交易流水后生成实测对照', tone: '', icon: 'circle-info' }
	const name = p.SchoolName || ''
	const style = s.TradeStyle || ''
	const tags = (s.Tags ?? []).map(t => t.Text).join(' ')
	const timing = s.Timing
	if (/打板|涨停|龙头|超短/.test(name)) {
		const ok = /高频|超短/.test(style) || /超短线偏好/.test(tags)
		return ok
			? { text: '与实测「超短线高换手」特征高度吻合', tone: 'ok', icon: 'circle-check' }
			: { text: '与实测风格存在差异，详见对照说明', tone: 'warn', icon: 'triangle-exclamation' }
	}
	if (/低吸|潜伏|左侧/.test(name)) {
		const lowRatio = timing && timing.ValidBuyCount > 0 ? timing.BuyLowCount / timing.ValidBuyCount : 0
		const ok = /低吸/.test(tags) || lowRatio >= 0.5
		return ok
			? { text: '与实测「低位布局」特征高度吻合', tone: 'ok', icon: 'circle-check' }
			: { text: '与实测风格存在差异，详见对照说明', tone: 'warn', icon: 'triangle-exclamation' }
	}
	if (/波段/.test(name)) {
		return /波段/.test(style)
			? { text: '与实测主风格高度吻合', tone: 'ok', icon: 'circle-check' }
			: { text: '与实测主风格存在差异，详见对照说明', tone: 'warn', icon: 'triangle-exclamation' }
	}
	if (/价值|长线|投资/.test(name)) {
		return /中长线|长线/.test(style)
			? { text: '与实测主风格高度吻合', tone: 'ok', icon: 'circle-check' }
			: { text: '与实测主风格存在差异，详见对照说明', tone: 'warn', icon: 'triangle-exclamation' }
	}
	return { text: '对照说明见评定弹窗', tone: '', icon: 'circle-info' }
})

// 行为标签（画像已分析且有条目时，档案卡展示前 4 个）
const behaviorTags = computed(() => (behaviorStats.value?.HasData ? (behaviorStats.value.Tags ?? []).slice(0, 4) : []))
const behaviorTagMore = computed(() => (behaviorStats.value?.HasData ? Math.max((behaviorStats.value.Tags?.length ?? 0) - 4, 0) : 0))

// 评定保存后刷新档案（头部状态行联动）
function onSchoolSaved() {
	loadProfile()
}

// 渲染摘要雷达（小尺寸；数值靠八维条展示，图中不重复标注；图内不提供悬浮说明）
function renderBriefRadar() {
	const el = briefRadarRef.value
	const s = behaviorStats.value?.Scores
	if (!el || !s) return
	if (!briefRadarChart) briefRadarChart = echarts.init(el)
	briefRadarChart.setOption({
		// 不提供鼠标悬浮说明（评分数值与评分公式见右侧八维条与行为画像页）
		tooltip: { show: false },
		radar: {
			indicator: [
				{ name: '盈亏比', max: 100 },
				{ name: '胜率', max: 100 },
				{ name: '择时', max: 100 },
				{ name: '成本', max: 100 },
				{ name: '风控', max: 100 },
				{ name: '耐心', max: 100 },
				{ name: '回撤控制', max: 100 },
				{ name: '收益能力', max: 100 }
			],
			radius: '66%',
			center: ['50%', '50%'],
			// 轴名贴轴间距收紧（默认 15 时右侧「回撤控制」四字超出画布右缘被裁剪）
			axisNameGap: 8,
			splitNumber: 4,
			axisName: { color: '#737b93', fontSize: 12 },
			splitArea: { areaStyle: { color: ['rgba(240, 245, 255, 0.7)', 'rgba(255, 255, 255, 0)'] } },
			axisLine: { lineStyle: { color: '#e6eaf5' } },
			splitLine: { lineStyle: { color: '#e6eaf5' } }
		},
		series: [
			{
				type: 'radar',
				symbolSize: 5,
				data: [
					{
						value: [s.ProfitRatio, s.WinRate, s.Timing, s.CostControl, s.RiskControl, s.Patience, s.DrawdownControl ?? 0, s.Profitability ?? 0],
						areaStyle: {
							color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
								{ offset: 0, color: 'rgba(124, 92, 240, 0.34)' },
								{ offset: 1, color: 'rgba(74, 126, 247, 0.1)' }
							])
						},
						lineStyle: { color: '#4a7ef7', width: 2 },
						itemStyle: { color: '#4a7ef7', borderColor: '#fff', borderWidth: 1 }
					}
				]
			}
		]
	})
}

// 八维条（展示顺序与雷达一致；formula=评分依据悬浮文案）
const behaviorDims = computed(() => {
	const s = behaviorStats.value?.Scores
	if (!s) return []
	return BRIEF_SCORE_DIMS.map(e => ({ name: e.name, value: Number(s[e.key] ?? 0), formula: briefDimFormula(e.key) }))
})

// 综合评语（按总分分档）
const behaviorVerdict = computed(() => {
	const t = behaviorStats.value?.Scores.Total
	if (t === undefined) return ''
	if (t >= 80) return '优秀 · 攻守均衡'
	if (t >= 65) return '良好 · 稳步进阶'
	if (t >= 50) return '中规中矩 · 尚有提升空间'
	return '亟待改进 · 优先控制风险'
})

// ---------- 复盘笔记 ----------
const reviewVisible = ref(false)
const reviewType = ref(1)
const reviewDate = ref<string>()
const reviewStockCode = ref<string>()
const reviewStockName = ref<string>()

// ---------- 当日明细（点击日历日期格） ----------
const dayDetailVisible = ref(false)
const dayDetailDate = ref<string>()

// 当月已复盘日期集合（yyyy-MM-dd，日历标记与 tooltip 用）
const reviewDays = ref<Set<string>>(new Set())
// 当年已复盘月份集合（yyyy-MM，年视图月格子标记用）
const reviewMonths = ref<Set<string>>(new Set())

// 加载指定月的日复盘日期集合（日历"复"标记）
async function loadReviewDays(year: number, month: number) {
	try {
		const begin = dayjs(new Date(year, month - 1, 1)).format('YYYY-MM-DD')
		const end = dayjs(begin).endOf('month').format('YYYY-MM-DD')
		const list: IZdxReview[] = await zdxApi.getReviewList({ type: 1, begin, end, max: 31 })
		reviewDays.value = new Set(list.map(r => dayjs(r.ReviewDate).format('YYYY-MM-DD')))
	} catch {
		reviewDays.value = new Set()
	}
}

// 加载指定年的月复盘月份集合（年视图月格子标记）
async function loadReviewMonths(year: number) {
	try {
		const list: IZdxReview[] = await zdxApi.getReviewList({ type: 3, begin: `${year}-01-01`, end: `${year}-12-31`, max: 12 })
		reviewMonths.value = new Set(list.map(r => dayjs(r.ReviewDate).format('YYYY-MM')))
	} catch {
		reviewMonths.value = new Set()
	}
}

// 日历日期格"复"标记（仅当月日期）
function isReviewDay(data: any) {
	if (data.type !== 'current-month') return false
	return reviewDays.value.has(dayjs(data.day).format('YYYY-MM-DD'))
}

// 日历日期格点击：打开该日"当日明细"（持仓浮动盈亏 / 净盈亏 / 费用；仅当月日期）
function openDayDetail(data: any) {
	if (data.type !== 'current-month') return
	dayDetailDate.value = dayjs(data.day).format('YYYY-MM-DD')
	dayDetailVisible.value = true
}

// 年视图月格子复盘标记
function hasMonthReview(month: number) {
	return reviewMonths.value.has(`${calendarYear.value}-${String(month).padStart(2, '0')}`)
}

// 年视图月格子"复"入口：打开该月月复盘
function openMonthReview(month: number) {
	reviewType.value = 3
	reviewDate.value = dayjs(new Date(calendarYear.value, month - 1, 1)).format('YYYY-MM-DD')
	reviewStockCode.value = undefined
	reviewStockName.value = undefined
	reviewVisible.value = true
}

// 复盘保存成功：刷新日历/年视图标记
function onReviewSaved() {
	const cur = dayjs(calendarDate.value)
	loadReviewDays(cur.year(), cur.month() + 1)
	if (calendarMode.value === 'year') loadReviewMonths(calendarYear.value)
}

// ---------- 初始化 ----------
onMounted(() => {
	loadWatchlist()
	loadPositions()
	loadStats()
	loadBehavior()
	loadProfile()
	loadTrades()
	loadTrend()
	loadFeeTrend()
	loadCashFlows()
	loadAssetTrend()
	loadRecentAdjust()
	loadLatestCash()
	loadCalendar(dayjs().year(), dayjs().month() + 1)
	loadReviewDays(dayjs().year(), dayjs().month() + 1)
	window.addEventListener('resize', handleTrendResize)
})

onUnmounted(() => {
	window.removeEventListener('resize', handleTrendResize)
	trendChart?.dispose()
	trendChart = undefined
	feeChart?.dispose()
	feeChart = undefined
	pieChart?.dispose()
	pieChart = undefined
	briefRadarChart?.dispose()
	briefRadarChart = undefined
	assetChart?.dispose()
	assetChart = undefined
})
</script>

<style lang="scss" scoped>
.my-zone {
	// 涨红跌绿
	.up {
		color: var(--el-color-danger);
	}

	.down {
		color: var(--el-color-success);
	}

	// 头部档案卡（蓝紫渐变，与交易画像页头一致）
	.profile-card {
		display: flex;
		align-items: center;
		gap: 20px;
		position: relative;
		overflow: hidden;
		background: linear-gradient(135deg, #4a7ef7 0%, #6c63f0 55%, #7c5cf0 100%);
		border: none;
		border-radius: 16px;
		padding: 18px 24px;
		margin-bottom: 16px;
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

		// 内容层压在装饰光斑之上
		.avatar-upload,
		.pc-mid,
		.pc-right {
			position: relative;
			z-index: 1;
		}

		// 头像（悬停显示相机遮罩）
		.avatar-upload {
			flex-shrink: 0;

			.pc-avatar {
				background: #fff;
				border: 2px solid rgba(255, 255, 255, 0.9);
				box-shadow: 0 4px 14px rgba(15, 23, 42, 0.22);
				color: #b9c2d6;
				font-size: 24px;
			}

			.avatar-mask {
				position: absolute;
				left: 2px;
				top: 2px;
				width: 68px;
				height: 68px;
				border-radius: 50%;
				background: rgba(15, 23, 42, 0.42);
				color: #fff;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 18px;
				opacity: 0;
				transition: opacity .2s;
				pointer-events: none;
			}

			&:hover .avatar-mask {
				opacity: 1;
			}
		}

		.pc-mid {
			flex: 1;
			min-width: 0;

			// 第一行：昵称 + 账号 + 所属机构
			.pc-name-row {
				display: flex;
				align-items: baseline;
				gap: 10px;
				min-width: 0;

				.pc-name {
					font-size: 19px;
					font-weight: 600;
					color: #fff;
					line-height: 1.3;
					letter-spacing: 0.3px;
					flex-shrink: 0;
				}

				.pc-account {
					font-size: 13px;
					color: rgba(255, 255, 255, 0.72);
					flex-shrink: 0;
				}
			}

			// 第二行：签名（可编辑）
			.pc-sign-row {
				display: flex;
				align-items: center;
				gap: 6px;
				margin-top: 6px;
				min-height: 24px;

				.pc-sign-icon {
					color: rgba(255, 255, 255, 0.62);
					font-size: 13px;
				}

				.pc-sign-text {
					color: rgba(255, 255, 255, 0.88);
					font-size: 13px;

					&.empty {
						color: rgba(255, 255, 255, 0.5);
					}
				}

				.pc-sign-input {
					width: 320px;
				}

				// 编辑按钮（深底上转为白色系）
				.el-button {
					color: rgba(255, 255, 255, 0.75);

					&:hover {
						color: #fff;
					}
				}
			}

			// 第四行：流派 / 实测 / 对照 状态行
			.pc-status-row {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 10px;
				margin-top: 8px;

				.pc-chip {
					display: inline-flex;
					align-items: center;
					gap: 5px;
					border-radius: 12px;
					padding: 5px 12px;
					background: rgba(255, 255, 255, 0.16);
					border: 1px solid rgba(255, 255, 255, 0.28);
					cursor: pointer;
					transition: background .2s, border-color .2s;

					&:hover {
						background: rgba(255, 255, 255, 0.24);
					}

					&.plain {
						cursor: default;
					}

					// 图标与文字统一字号（12px），两枚胶囊观感一致
					.pc-chip-ico {
						font-size: 12px;
						line-height: 1;
						color: rgba(255, 255, 255, 0.85);
					}

					.pc-chip-text {
						font-size: 12px;
						line-height: 1;
						color: rgba(255, 255, 255, 0.92);
					}

					&.tone-info .pc-chip-ico {
						color: #cfe0ff;
					}

					&.tone-good .pc-chip-ico {
						color: #baf0d2;
					}

					&.tone-warn .pc-chip-ico {
						color: #ffe2a8;
					}

					&.tone-danger .pc-chip-ico {
						color: #ffc9c9;
					}

					.el-tag {
						background: rgba(255, 255, 255, 0.2);
						border-color: rgba(255, 255, 255, 0.35);
						color: #fff;
					}
				}

				.pc-compare {
					display: inline-flex;
					align-items: center;
					gap: 5px;
					font-size: 12px;
					line-height: 1;
					padding: 5px 12px;
					border-radius: 12px;
					background: rgba(255, 255, 255, 0.1);
					color: rgba(255, 255, 255, 0.82);

					&.ok {
						color: #baf0d2;
					}

					&.warn {
						color: #ffe2a8;
					}
				}
			}

			// 第三行：行为标签（画像分析后展示，置于流派行上方）
			.pc-tags-row {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 8px;
				margin-top: 8px;

				.pc-tags-icon {
					font-size: 11px;
					color: rgba(255, 255, 255, 0.55);
				}

				.pc-tag {
					font-size: 12px;
					line-height: 1;
					padding: 4px 10px;
					border-radius: 10px;
					background: rgba(255, 255, 255, 0.12);
					color: rgba(255, 255, 255, 0.85);
					cursor: default;

					&.pt-good {
						color: #baf0d2;
					}

					&.pt-warn {
						color: #ffe2a8;
					}
				}

				.pc-tags-more {
					font-size: 12px;
					color: rgba(255, 255, 255, 0.6);
				}
			}
		}

		// 卡片右下角：前往复盘中心（小字文字链，白色系 + 悬浮胶囊反馈）
		.pc-review-link {
			position: absolute;
			right: 20px;
			bottom: 10px;
			z-index: 1;
			padding: 4px 10px;
			border-radius: 10px;
			font-size: 12px;
			line-height: 1;
			letter-spacing: 0.5px;
			color: rgba(255, 255, 255, 0.78);
			cursor: pointer;
			transition: color .2s, background-color .2s;

			&:hover {
				color: #fff;
				background: rgba(255, 255, 255, 0.16);
			}
		}

		.pc-right {
			display: flex;
			align-items: center;
			gap: 10px;
			flex-shrink: 0;

			.el-button {
				margin-left: 0;
				border: none;
			}

			// 次要按钮：白透底
			.btn-import {
				background: rgba(255, 255, 255, 0.16);
				border: 1px solid rgba(255, 255, 255, 0.32);
				color: #fff;

				&:hover,
				&:focus,
				&:active {
					background: rgba(255, 255, 255, 0.26);
					border-color: rgba(255, 255, 255, 0.45);
					color: #fff;
				}
			}

			// 主按钮：白底蓝字
			.btn-rate {
				background: #fff;
				color: #4a7ef7;
				box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);

				&:hover,
				&:focus,
				&:active {
					background: #eef4ff;
					color: #3d6ef0;
				}
			}
		}
	}

	// 通用白卡
	.box {
		background: #fff;
		border-radius: 16px;
		padding: 16px 20px 20px;
		margin-bottom: 20px;
		box-shadow: 0 2px 12px rgba(31, 45, 61, 0.06);
	}

	.box-title-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 14px;

		.box-title {
			font-size: 15px;
			font-weight: 600;
			color: #303133;
		}

		.box-sub {
			font-size: 12px;
			color: #a7abba;
		}

		.filter-row {
			display: flex;
			align-items: center;
			gap: 10px;
			margin-left: auto;

			.import-upload {
				display: inline-flex;
			}
		}
	}

	// 可点击行
	.clickable-table {
		:deep(.el-table__row) {
			cursor: pointer;
		}
	}

	// 今日清仓挂显行（券商持仓页行为：当天卖出的股票挂显一天；持仓表专用，与行点击无关）
	:deep(.cleared-row) {
		td.el-table__cell {
			background: rgba(144, 147, 153, 0.06);
		}

		&:hover td.el-table__cell {
			background: rgba(144, 147, 153, 0.12);
		}
	}

	// 持仓表名称链接（点击跳转个股行情页面）
	.pos-name-link {
		color: #409eff;
		cursor: pointer;
		transition: color 0.2s;

		&:hover {
			color: #79bbff;
		}
	}

	// 今日清仓标签（持仓表名称列）
	.tag-cleared {
		margin-left: 6px;
		padding: 0 4px;
		font-size: 11px;
		color: #909399;
		background: rgba(144, 147, 153, 0.12);
		border-radius: 4px;
		line-height: 16px;
		white-space: nowrap;
	}

	// 清仓行“当日”口径小字
	.pos-cleared-hint {
		margin-left: 4px;
		font-size: 11px;
		color: #909399;
	}

	// 分析表底部提示（默认行数说明）
	.stats-hint {
		margin-top: 8px;
		font-size: 12px;
		color: #a3a9c0;
	}

	// ---------- 行为画像摘要（八维雷达） ----------
	.behavior-brief {
		display: flex;
		align-items: center;
		gap: 28px;
		margin-bottom: 14px;
		padding: 14px 20px;
		border-radius: 14px;
		cursor: pointer;
		background: linear-gradient(135deg, rgba(74, 126, 247, 0.06), rgba(124, 92, 240, 0.07));
		border: 1px solid rgba(124, 92, 240, 0.12);
		transition: box-shadow 0.2s, transform 0.2s;

		&:hover {
			box-shadow: 0 6px 20px rgba(64, 158, 255, 0.14);
			transform: translateY(-1px);
		}

		.bb-radar-wrap {
			position: relative;
			width: 280px;
			height: 240px;
			flex: none;
		}

		.bb-radar {
			width: 100%;
			height: 100%;
		}

		.bb-total {
			position: absolute;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
			width: 72px;
			height: 72px;
			border-radius: 50%;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			pointer-events: none;
			background: radial-gradient(circle at 50% 36%, #ffffff 30%, #f4f7ff 100%);
			box-shadow: 0 2px 8px rgba(74, 126, 247, 0.16), 0 0 0 5px rgba(74, 126, 247, 0.06);

			.bb-total-num {
				font-size: 22px;
				font-weight: 700;
				line-height: 1.1;
				color: #5a6cf0;
				font-variant-numeric: tabular-nums;
			}

			.bb-total-label {
				font-size: 11px;
				color: #a7abba;
			}
		}

		.bb-dims {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.bb-dims-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 10px;

			.bb-dims-title {
				font-size: 13px;
				font-weight: 700;
				color: #303133;
			}

			.bb-style-chip {
				margin-left: auto;
				flex: none;
				padding: 1px 8px;
				border-radius: 9px;
				font-size: 11px;
				font-weight: 600;
				color: #7c5cf0;
				background: rgba(124, 92, 240, 0.1);
				border: 1px solid rgba(124, 92, 240, 0.25);
			}

			.bb-verdict {
				font-size: 12px;
				font-weight: 600;
				color: #6c4ae8;
			}
		}

		.bb-dim {
			display: flex;
			align-items: center;
			gap: 10px;
			font-size: 12px;
		}

		.bb-dim-name {
			width: 52px;
			flex: none;
			white-space: nowrap;
			color: #a7abba;
		}

		.bb-dim-track {
			flex: 1;
			height: 7px;
			border-radius: 4px;
			overflow: hidden;
			background: rgba(255, 255, 255, 0.85);
		}

		.bb-dim-fill {
			height: 100%;
			border-radius: 4px;
			background: linear-gradient(90deg, #4a7ef7, #7c5cf0);
			transition: width 0.4s ease;
		}

		.bb-dim-val {
			width: 26px;
			flex: none;
			text-align: right;
			font-weight: 600;
			color: #303133;
			font-variant-numeric: tabular-nums;
		}
	}

	// ---------- 概览卡片行 ----------
	.overview-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 20px;
		margin-bottom: 20px;

		.overview-card {
			background: #fff;
			border-radius: 16px;
			padding: 18px 20px;
			min-width: 0;
			box-shadow: 0 2px 12px rgba(31, 45, 61, 0.06);
			transition: box-shadow 0.2s, transform 0.2s;

			&:hover {
				box-shadow: 0 6px 20px rgba(64, 158, 255, 0.14);
				transform: translateY(-2px);
			}

			.oc-top {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 8px;

				.card-label {
					font-size: 13px;
					color: #a7abba;
				}

				.card-icon {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					width: 30px;
					height: 30px;
					border-radius: 9px;
					font-size: 13px;

					&.blue {
						color: #409eff;
						background: rgba(64, 158, 255, 0.12);
					}

					&.violet {
						color: #7c5cff;
						background: rgba(124, 92, 255, 0.12);
					}

					&.orange {
						color: #e6a23c;
						background: rgba(230, 162, 60, 0.14);
					}
				}
			}

			.card-value {
				font-size: 1.45rem;
				font-weight: bold;
				color: #303133;
				margin: 8px 0 6px;
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

			.card-sub {
				font-size: 12px;
				color: #a7abba;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}
	}

	// ---------- 自选股区（点击列表个股跳转个股行情页面） ----------
	.watch-box {
		margin-bottom: 20px;

		.watch-left {
			background: #fff;
			border-radius: 16px;
			padding: 16px 12px 8px;
			box-shadow: 0 2px 12px rgba(31, 45, 61, 0.06);

			.box-title {
				font-size: 15px;
				font-weight: 600;
				color: #303133;
				padding: 0 8px;
				margin-bottom: 12px;
			}

			.add-select {
				width: calc(100% - 16px);
				margin: 0 8px 10px;

				.search-icon {
					color: #a7abba;
					font-size: 12px;
				}
			}

			.watch-list {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
				gap: 2px;
				max-height: 520px;
				overflow-y: auto;
				min-height: 120px;

				.watch-item {
					position: relative;
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding: 10px 12px;
					border-radius: 10px;
					cursor: pointer;
					transition: background 0.2s;

					&:hover {
						background: #f7f8fc;

						.w-remove {
							display: flex;
						}
					}

					&.active {
						background: #ecf5ff;

						&::before {
							content: '';
							position: absolute;
							left: 0;
							top: 22%;
							bottom: 22%;
							width: 3px;
							border-radius: 2px;
							background: #409eff;
						}

						.w-name {
							color: #409eff;
						}
					}

					.w-left {
						min-width: 0;
						margin-right: 8px;

						.w-name-row {
							display: flex;
							align-items: center;
							gap: 6px;
							min-width: 0;

							.w-name {
								font-size: 14px;
								font-weight: 500;
								color: #2e3543;
								white-space: nowrap;
								overflow: hidden;
								text-overflow: ellipsis;
							}

							.w-hold {
								flex-shrink: 0;
								font-size: 11px;
								color: #d48806;
								background: rgba(212, 136, 6, 0.1);
								border-radius: 4px;
								padding: 0 4px;
								line-height: 16px;
							}
						}

						.w-code {
							font-size: 12px;
							color: #a7abba;
							margin-top: 2px;
						}
					}

					.w-right {
						text-align: right;
						flex-shrink: 0;
						margin-right: 14px;

						.w-price {
							font-size: 14px;
							font-weight: 600;
							color: #2e3543;

							&.up {
								color: var(--el-color-danger);
							}

							&.down {
								color: var(--el-color-success);
							}
						}

						.w-change {
							font-size: 12px;
							margin-top: 2px;
						}
					}

					.w-remove {
						display: none;
						position: absolute;
						right: 6px;
						top: 50%;
						transform: translateY(-50%);
						align-items: center;
						justify-content: center;
						width: 18px;
						height: 18px;
						border-radius: 50%;
						font-size: 11px;
						color: #a7abba;
						background: #eceff5;

						&:hover {
							color: #fff;
							background: var(--el-color-danger);
						}
					}
				}

				.watch-empty {
					padding: 40px 12px;
					text-align: center;
					font-size: 13px;
					color: #a7abba;
					line-height: 22px;
				}
			}
		}
	}

	// ---------- 收益日历 ----------
	.calendar-box {
		.cal-mode-switch {
			margin-left: auto;
		}

		// 统计卡行（月/年视图共用）
		.cal-stats {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
			gap: 14px;
			margin: 2px 0 12px;

			.cal-stat {
				background: #f7f8fc;
				border-radius: 12px;
				padding: 12px 16px;
				min-width: 0;

				&.stat-total {
					background: #eef3ff;
					box-shadow: inset 0 0 0 1px #dbe6ff;
				}

				.cs-label {
					display: flex;
					align-items: center;
					gap: 4px;
					font-size: 12px;
					color: #a7abba;

					.cs-icon {
						font-size: 11px;

						&.ico-gold {
							color: #d48806;
						}

						&.ico-blue {
							color: #409eff;
						}

						&.ico-orange {
							color: #e6a23c;
						}

						&.ico-violet {
							color: #7c5cff;
						}
					}
				}

				.cs-value {
					font-size: 1.25rem;
					font-weight: bold;
					color: #303133;
					margin: 6px 0 4px;
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

				.cs-slash {
					margin: 0 4px;
					color: #c8ccd4;
					font-weight: 400;
				}

				.cs-fee {
					color: #e6a23c;
				}

				.cs-dividend {
					color: #d48806;
				}

				.cs-interest {
					color: #409eff;
				}

				.cs-sub {
					font-size: 12px;
					color: #a7abba;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}
			}
		}

		// 盈亏对比条（盈利日/亏损日金额横向占比）
		.cal-compare {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 14px;

			.cmp-side {
				font-size: 12px;
				flex-shrink: 0;
				white-space: nowrap;
			}

			.cmp-bar {
				flex: 1;
				display: flex;
				height: 10px;
				min-width: 0;
				border-radius: 2px;
				overflow: hidden;
				background: #eef0f5;

				.cmp-win {
					min-width: 2px;
					background: #f56c6c;
					transition: flex-grow 0.3s;
				}

				.cmp-loss {
					min-width: 2px;
					background: #67c23a;
					transition: flex-grow 0.3s;
				}
			}
		}

		.calendar-header {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			justify-content: space-between;
			gap: 6px 12px;
			width: 100%;
		}

		.calendar-title {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			color: #303133;
			font-size: 1.25rem;
			font-weight: bold;

			:deep(.el-tag) {
				height: 18px;
				padding: 0 6px;
				font-size: 11px;
			}
		}

		// 年视图头部（标题 + 年导航）
		.year-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 6px 12px;
			margin-bottom: 12px;
		}

		// 年视图 12 月格子
		.year-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
			gap: 14px;

			.year-cell {
				border-radius: 12px;
				padding: 12px 14px;
				background: #f7f8fc;
				cursor: pointer;
				transition: box-shadow 0.2s, transform 0.2s;

				&:hover {
					box-shadow: 0 4px 14px rgba(64, 158, 255, 0.18);
					transform: translateY(-1px);
				}

				.yc-head {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 8px;

					.yc-month {
						font-size: 13px;
						font-weight: 600;
						color: #606266;
					}

					.month-review-btn {
						font-size: 11px;
						font-style: normal;
						line-height: 1.4;
						padding: 1px 5px;
						border-radius: 4px;
						background: var(--el-fill-color-light);
						color: #a7abba;
						cursor: pointer;
						margin-left: auto;
						font-weight: 600;
						transition: all 0.15s;

						&:hover {
							background: rgba(124, 92, 240, 0.14);
							color: #7c5cf0;
						}

						&.has {
							background: rgba(124, 92, 240, 0.14);
							color: #7c5cf0;
						}
					}

					:deep(.el-tag) {
						height: 18px;
						padding: 0 6px;
						font-size: 11px;
					}
				}

				.yc-profit {
					font-size: 1.3rem;
					font-weight: bold;
					color: #303133;
					margin: 8px 0 4px;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.yc-sub {
					font-size: 12px;
					color: #a7abba;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.yc-meta {
					display: flex;
					align-items: center;
					gap: 8px;
					margin-top: 6px;
					min-height: 14px;
					font-size: 11px;

					.yc-fee {
						color: #e6a23c;
					}

					.yc-dividend {
						color: #d48806;
					}

					.yc-none {
						color: #d5d8e0;
					}
				}

				&.profit-up {
					background: rgba(245, 108, 108, 0.08);

					.yc-profit {
						color: var(--el-color-danger);
					}
				}

				&.profit-down {
					background: rgba(103, 194, 58, 0.08);

					.yc-profit {
						color: var(--el-color-success);
					}
				}

				&.profit-flat {
					background: #f5f6fb;

					.yc-profit {
						color: #909399;
					}
				}

				&.trade-flat {
					.yc-profit {
						color: #c8ccd4;
					}
				}
			}
		}

		:deep(.el-calendar-day) {
			height: 92px;
			padding: 4px;
			border-radius: 8px;
		}

		.date-cell {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 2px;
			height: 100%;
			border-radius: 8px;

			.day-row {
				display: inline-flex;
				align-items: center;
				gap: 3px;

				.review-flag {
					font-size: 11px;
					font-style: normal;
					line-height: 1.4;
					padding: 0 3px;
					border-radius: 3px;
					background: rgba(124, 92, 240, 0.14);
					color: #7c5cf0;
					font-weight: 600;
				}

				.sell-dot {
					display: inline-block;
					width: 6px;
					height: 6px;
					border-radius: 50%;

					&.up {
						background: var(--el-color-danger);
					}

					&.down {
						background: var(--el-color-success);
					}

					&.flat {
						background: #c8ccd4;
					}
				}

				.day-text {
					font-size: 13px;
					font-weight: 600;
					color: #303133;
				}
			}

			.profit-text {
				font-size: 15px;
				font-weight: 700;
				line-height: 1.1;
			}

			.fees-line {
				display: flex;
				align-items: center;
				gap: 6px;
				font-size: 11px;
				line-height: 1;

				.fee-text {
					color: #e6a23c;
				}

				.dividend-text {
					color: #d48806;
				}

				.interest-text {
					color: #409eff;
				}
			}

			&.profit-up {
				background: rgba(245, 108, 108, 0.1);

				.profit-text {
					color: var(--el-color-danger);
				}
			}

			&.profit-down {
				background: rgba(103, 194, 58, 0.1);

				.profit-text {
					color: var(--el-color-success);
				}
			}

			&.profit-flat {
				background: #f5f6fb;

				.profit-text {
					color: #909399;
				}
			}

			&.day-today {
				box-shadow: inset 0 0 0 2px var(--el-color-primary);
			}

			&.non-trade {
				background: #fafbfd;

				.profit-text {
					color: #c8ccd4;
				}
			}

			&.trade-flat {
				.profit-text {
					color: #c8ccd4;
				}
			}

			&.other-month {
				opacity: 0.35;
			}
		}
	}

	// ---------- 收益趋势 ----------
	.trend-box {
		.trend-switch {
			margin-left: auto;
		}

		.trend-chart {
			height: 320px;
		}
	}

	// ---------- 交易流水 ----------
	.trade-box {
		.trade-table {
			margin-bottom: 16px;
		}

		.trade-pagination {
			justify-content: flex-end;
		}

		// 券商费率摘要（账单分析：佣金费率/最低佣金/印花税率/过户费率）
		.trade-fee-bar {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 8px 20px;
			margin-bottom: 14px;
			padding: 10px 14px;
			background: #f7f9fd;
			border-radius: 10px;
			font-size: 12px;

			.tfb-title {
				display: inline-flex;
				align-items: center;
				gap: 5px;
				font-weight: 600;
				color: #5b637a;

				.tfb-ico {
					font-size: 12px;
					color: #409eff;
				}
			}

			.tfb-item {
				display: inline-flex;
				align-items: baseline;
				gap: 6px;

				.tfb-label {
					color: #909399;
				}

				.tfb-value {
					font-size: 13px;
					font-weight: 600;
					color: #303133;
					font-variant-numeric: tabular-nums;

					&.manual {
						color: #4a7ef7;
					}
				}

				.tfb-note {
					color: #a7abba;
				}
			}

			.tfb-time {
				margin-left: auto;
				color: #a7abba;
			}

			.tfb-calibrate {
				display: inline-flex;
				align-items: center;
				gap: 4px;
				color: #4a7ef7;
				cursor: pointer;
				user-select: none;

				&:hover {
					color: #2f66e8;
					text-decoration: underline;
				}
			}

			&.empty {
				gap: 6px;
				color: #a7abba;

				.tfb-ico {
					color: #c0c4cc;
				}
			}
		}

		// 佣金费率校准弹窗
		.fc-tip {
			font-size: 12px;
			color: #909399;
			line-height: 1.7;

			&.small {
				margin-top: 12px;
				color: #a7abba;
			}
		}

		.fc-row {
			display: flex;
			align-items: center;
			gap: 10px;
			margin-top: 12px;

			.fc-label {
				font-size: 13px;
				color: #5b637a;
			}
		}

	}

	// ---------- 调仓记录（近30天独立板块） ----------
	.adjust-box {
		background: linear-gradient(180deg, #fbfcff 0%, #fff 120px);
		border: 1px solid #eef0f6;
		box-shadow: 0 2px 12px rgba(74, 126, 247, 0.07);

		.adjust-summary {
			margin-left: auto;
			display: inline-flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 8px;

			.as-chip {
				display: inline-flex;
				align-items: center;
				gap: 4px;
				background: #f5f7fd;
				border: 1px solid #e8ecf7;
				border-radius: 999px;
				padding: 3px 10px;
				font-size: 12px;
				color: #7a819d;

				b {
					font-weight: 600;
					color: #303133;
					font-variant-numeric: tabular-nums;
				}

				&.up b {
					color: var(--el-color-danger);
				}

				&.down b {
					color: var(--el-color-success);
				}
			}
		}

		.adjust-table {
			width: 100%;
		}

		// 合并行：股票名称 + 代码双行
		.adj-stock {
			display: flex;
			flex-direction: column;
			line-height: 1.35;

			.adj-name {
				font-weight: 600;
				color: #303133;
			}

			.adj-code {
				font-size: 11px;
				color: #a3a9c0;
			}
		}

		// 买/卖笔数徽标
		.adj-badge {
			display: inline-block;
			padding: 1px 8px;
			border-radius: 9px;
			font-size: 11px;
			margin-right: 6px;

			&.buy {
				color: var(--el-color-danger);
				background: rgba(245, 108, 108, 0.1);
			}

			&.sell {
				color: var(--el-color-success);
				background: rgba(103, 194, 58, 0.12);
			}
		}

		// 明细入口（悬浮展示逐笔）
		.adj-detail-link {
			color: var(--el-color-primary);
			cursor: pointer;
			border-bottom: 1px dashed rgba(64, 158, 255, 0.4);

			&:hover {
				color: #337ecc;
				border-bottom-color: rgba(64, 158, 255, 0.7);
			}
		}
	}

	// ---------- 导入结果弹窗 ----------
	.import-result {
		.result-stats {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 12px;
			margin-bottom: 14px;

			.stat-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				padding: 14px 0;
				border-radius: 10px;
				background: #f7f8fc;

				.num {
					font-size: 1.4rem;
					font-weight: bold;
					color: #303133;
				}

				.label {
					font-size: 12px;
					color: #a7abba;
					margin-top: 4px;
				}

				&.success .num {
					color: var(--el-color-success);
				}

				&.warning .num {
					color: var(--el-color-warning);
				}

				&.danger .num {
					color: var(--el-color-danger);
				}
			}
		}

		.result-message {
			font-size: 13px;
			color: #606266;
			line-height: 20px;
		}

		.error-list {
			margin-top: 12px;
			max-height: 220px;
			overflow-y: auto;
			border-radius: 8px;
			background: #fdf6f6;
			padding: 10px 14px;

			.error-title {
				font-size: 13px;
				font-weight: 600;
				color: var(--el-color-danger);
				margin-bottom: 6px;
			}

			.error-item {
				font-size: 12px;
				color: #909399;
				line-height: 20px;
			}
		}
	}

	// ---------- 对账校验弹窗 ----------
	.audit-result {
		.audit-stats {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 12px;
			margin: 14px 0;

			.audit-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				padding: 14px 0;
				border-radius: 10px;
				background: #f7f8fc;

				.num {
					font-size: 1.4rem;
					font-weight: bold;
					color: #303133;
				}

				.label {
					font-size: 12px;
					color: #a7abba;
					margin-top: 4px;
				}

				&.danger .num {
					color: var(--el-color-danger);
				}
			}
		}

		.audit-list {
			max-height: 360px;
			overflow-y: auto;

			.audit-list-title {
				font-size: 13px;
				font-weight: 600;
				color: var(--el-color-warning);
				margin-bottom: 6px;
			}
		}

		.audit-empty {
			padding: 30px 0;
			text-align: center;
			font-size: 13px;
			color: #67c23a;
		}
	}

	// ---------- 资产总览区 ----------
	.asset-kpi-row {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 12px;
		margin-bottom: 16px;

		.asset-kpi {
			background: #f7f8fc;
			border-radius: 10px;
			padding: 12px 14px;

			.ak-label {
				font-size: 12px;
				color: #a7abba;
			}

			.ak-value {
				font-size: 18px;
				font-weight: 600;
				color: #303133;
				margin: 6px 0 2px;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.ak-sub {
				font-size: 12px;
				color: #a7abba;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}
	}

	.asset-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;

		.asset-cell {
			border: 1px solid #eef0f6;
			border-radius: 12px;
			padding: 12px 14px;
			min-height: 280px;
			transition: box-shadow 0.2s;

			&:hover {
				box-shadow: 0 2px 10px rgba(31, 45, 61, 0.08);
			}

			// 跨双列大卡（总资产趋势 / 持仓分布 / 红利利息）
			&.pd-cell,
			&.cash-cell,
			&.asset-trend-cell {
				grid-column: 1 / -1;
			}

			.ac-title {
				font-size: 13px;
				font-weight: 600;
				color: #303133;
				margin-bottom: 10px;

				.ac-sub {
					font-size: 12px;
					font-weight: 400;
					color: #a7abba;
					margin-left: 8px;
				}

				.ac-toggle {
					margin-left: 10px;
					vertical-align: middle;
				}
			}

			.at-wrap {
				display: grid;
				grid-template-columns: minmax(0, 1.55fr) minmax(280px, 1fr);
				gap: 16px;
				align-items: center;

				.at-chart {
					height: 300px;
				}

				// 资金流向（纯 HTML/CSS 简洁清单：资金进出 → 净流入 → 账户盈亏 → 期末总资产）
				.at-flow {
					display: flex;
					flex-direction: column;
					border: 1px solid #eef2fb;
					border-radius: 12px;
					background: linear-gradient(180deg, #fbfcff, #f5f8fd);
					padding: 12px 14px;

					.af-title {
						font-size: 12px;
						font-weight: 600;
						color: #5b637a;
						margin-bottom: 10px;
					}

					.af-inout {
						display: grid;
						grid-template-columns: repeat(3, minmax(0, 1fr));
						gap: 8px;

						.af-io {
							display: flex;
							flex-direction: column;
							gap: 2px;

							.af-io-label {
								font-size: 11px;
								color: #8a91a8;
							}

							.af-io-value {
								font-size: 13px;
								font-weight: 600;
								font-variant-numeric: tabular-nums;

								&.in {
									color: var(--el-color-danger);
								}

								&.out {
									color: var(--el-color-success);
								}
							}
						}
					}

					.af-divider {
						height: 0;
						border-top: 1px dashed #e3e9f5;
						margin: 10px 0;
					}

					.af-row {
						display: flex;
						align-items: baseline;
						gap: 8px;

						.af-row-label {
							font-size: 12px;
							font-weight: 600;
							color: #303133;
							white-space: nowrap;
						}

						.af-row-formula {
							flex: 1;
							min-width: 0;
							font-size: 11px;
							color: #a7abba;
							white-space: nowrap;
							overflow: hidden;
							text-overflow: ellipsis;
						}

						.af-row-value {
							font-size: 14px;
							font-weight: 600;
							font-variant-numeric: tabular-nums;
							white-space: nowrap;

							&.af-blue {
								color: var(--el-color-primary);
							}
						}

						&.af-row-final {
							margin: 2px -6px 0;
							padding: 6px;
							border-radius: 8px;
							background: rgba(74, 126, 247, 0.07);

							.af-row-value {
								font-size: 15px;
							}
						}
					}
				}
			}

			.fee-chart {
				height: 210px;
			}

			.pie-chart {
				height: 226px;
			}
		}

		// 总资产趋势大卡（标题行 + KPI 摘要条）
		.asset-cell.asset-trend-cell {
			.ac-title {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 8px;

				.ac-sub {
					margin-left: 0;
				}

				.ac-toggle {
					margin-left: auto;
				}
			}

			.at-kpis {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
				gap: 10px;
				margin-bottom: 12px;

				.at-kpi {
					display: flex;
					flex-direction: column;
					gap: 2px;
					padding: 8px 12px;
					border: 1px solid #eef2fb;
					border-radius: 10px;
					background: linear-gradient(180deg, #fbfcff, #f5f7fd);

					.at-kpi-label {
						font-size: 11px;
						color: #8a91a8;
					}

					.at-kpi-value {
						font-size: 15px;
						font-weight: 600;
						color: #303133;
						font-variant-numeric: tabular-nums;

						&.up {
							color: var(--el-color-danger);
						}

						&.down {
							color: var(--el-color-success);
						}
					}
				}
			}
		}

		// 持仓分布大卡（环图 | 板块占比 | 持仓明细）
		.asset-cell.pd-cell {
			.ac-title {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 8px;

				.ac-sub {
					margin-left: 0;
				}

				.pd-cash-chip {
					margin-left: auto;
					display: inline-flex;
					align-items: center;
					gap: 6px;
					font-size: 12px;
					font-weight: 400;
					color: #b88230;
					background: rgba(230, 162, 60, 0.1);
					border: 1px solid rgba(230, 162, 60, 0.28);
					border-radius: 999px;
					padding: 3px 10px;
				}
			}

			.pd-wrap {
				display: grid;
				grid-template-columns: minmax(280px, 1.05fr) minmax(220px, 0.85fr) minmax(260px, 1.1fr);
				gap: 18px;
				align-items: stretch;

				.pie-chart {
					height: 268px;
				}
			}

			.pd-sub-title {
				font-size: 12px;
				font-weight: 600;
				color: #5b637a;
				margin-bottom: 10px;
			}

			.pd-sectors {
				border-left: 1px dashed #eef0f6;
				border-right: 1px dashed #eef0f6;
				padding: 0 16px;

				.pd-sector-list {
					display: flex;
					flex-direction: column;
					gap: 10px;
					max-height: 236px;
					overflow-y: auto;
					padding-right: 4px;
				}

				.pd-sector-head {
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-bottom: 4px;

					.pd-sector-name {
						font-size: 12px;
						color: #606266;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						margin-right: 8px;
					}

					.pd-sector-pct {
						font-size: 12px;
						font-weight: 600;
						color: #303133;
						font-variant-numeric: tabular-nums;
					}
				}

				.pd-sector-bar {
					height: 6px;
					border-radius: 3px;
					background: #f2f4fa;
					overflow: hidden;

					span {
						display: block;
						height: 100%;
						border-radius: 3px;
						transition: width 0.3s;
					}
				}
			}

			.pd-detail {
				.pd-detail-list {
					display: flex;
					flex-direction: column;
					gap: 2px;
					max-height: 236px;
					overflow-y: auto;
				}

				.pd-detail-row {
					display: flex;
					align-items: center;
					gap: 8px;
					padding: 6px 8px;
					border-radius: 8px;
					cursor: pointer;
					transition: background 0.2s;

					&:hover {
						background: #f5f7fb;
					}

					.pd-name {
						flex: 1;
						min-width: 0;
						font-size: 12px;
						font-weight: 500;
						color: #303133;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}

					.pd-sector-tag {
						flex: none;
						max-width: 90px;
						font-size: 11px;
						color: #7c5cf0;
						background: rgba(124, 92, 240, 0.1);
						border-radius: 4px;
						padding: 1px 6px;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}

					.pd-mv {
						flex: none;
						font-size: 12px;
						color: #606266;
						font-variant-numeric: tabular-nums;
					}

					.pd-change {
						flex: none;
						width: 64px;
						text-align: right;
						font-size: 12px;
						font-weight: 600;
						font-variant-numeric: tabular-nums;
					}
				}
			}
		}
	}

	// 盈亏 TOP 榜
	.top-wrap {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 14px;

		.top-col {
			.tc-head {
				font-size: 12px;
				margin-bottom: 6px;
			}

			.tc-row {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 5px 8px;
				border-radius: 6px;
				cursor: pointer;
				transition: background 0.2s;

				&:hover {
					background: #f5f7fb;
				}

				.tc-name {
					font-size: 12px;
					color: #606266;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					margin-right: 8px;
				}

				.tc-value {
					font-size: 12px;
					font-weight: 600;
					flex-shrink: 0;
				}
			}

			.tc-empty {
				font-size: 12px;
				color: #c0c4cc;
				padding: 8px;
			}
		}
	}

	// 红利 / 利息记录（双列瀑布）
	.cash-list {
		max-height: 236px;
		overflow-y: auto;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		column-gap: 24px;

		.cash-row {
			display: flex;
			align-items: center;
			padding: 6px 4px;
			border-bottom: 1px dashed #f0f2f7;

			&:last-child {
				border-bottom: none;
			}

			.cash-tag {
				flex-shrink: 0;
				font-size: 11px;
				border-radius: 4px;
				padding: 1px 6px;
				margin-right: 8px;

				&.dividend {
					color: var(--el-color-warning);
					background: rgba(230, 162, 60, 0.12);
				}

				&.interest {
					color: var(--el-color-primary);
					background: rgba(64, 158, 255, 0.12);
				}
			}

			.cash-date {
				flex-shrink: 0;
				font-size: 12px;
				color: #a7abba;
				margin-right: 8px;
			}

			.cash-name {
				flex: 1;
				font-size: 12px;
				color: #606266;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				margin-right: 8px;
			}

			.cash-amount {
				flex-shrink: 0;
				font-size: 12px;
				font-weight: 600;
			}
		}
	}

	// 响应式：窄屏降列
	@media (max-width: 1200px) {
		.asset-kpi-row {
			grid-template-columns: repeat(3, 1fr);
		}

		.asset-grid {
			grid-template-columns: 1fr;

			.asset-cell.asset-trend-cell {
				.at-wrap {
					grid-template-columns: 1fr;
				}
			}

			.asset-cell.pd-cell {
				.pd-wrap {
					grid-template-columns: 1fr;
				}

				.pd-sectors {
					border-left: none;
					border-right: none;
					padding: 12px 0 0;
					border-top: 1px dashed #eef0f6;
				}
			}
		}
	}
}
</style>

<style lang="scss">
// 调仓明细悬浮卡（el-popover teleport 到 body，需非 scoped 全局样式）
.adj-popover {
	padding: 10px 12px;

	.adj-detail {
		.adj-detail-title {
			display: flex;
			align-items: baseline;
			justify-content: space-between;
			margin-bottom: 8px;

			b {
				font-size: 13px;
				color: #303133;
			}

			span {
				font-size: 11px;
				color: #a3a9c0;
			}
		}

		.adj-detail-head,
		.adj-detail-row {
			display: grid;
			grid-template-columns: 100px 44px 1fr 1fr 1fr;
			gap: 6px;
			align-items: center;
			padding: 4px 0;
			font-size: 12px;
		}

		.adj-detail-head {
			color: #a3a9c0;
			border-bottom: 1px solid #eef0f6;
			padding-bottom: 6px;
			margin-bottom: 2px;
		}

		.adj-detail-row {
			color: #4b5563;
			border-bottom: 1px dashed #f2f4fa;

			&:last-child {
				border-bottom: none;
			}
		}

		.adr-time {
			color: #7a819d;
			font-size: 11px;
		}

		.adr-badge {
			justify-self: start;
			padding: 0 8px;
			border-radius: 8px;
			font-size: 11px;
			line-height: 18px;

			&.buy {
				color: var(--el-color-danger);
				background: rgba(245, 108, 108, 0.1);
			}

			&.sell {
				color: var(--el-color-success);
				background: rgba(103, 194, 58, 0.12);
			}
		}

		.ta-r {
			text-align: right;
		}

		.up {
			color: var(--el-color-danger);
		}

		.down {
			color: var(--el-color-success);
		}
	}
}

// 查看流水悬浮明细卡（el-popover teleport 到 body，需非 scoped 全局样式）
.trade-flow-popover {
	padding: 10px 12px;

	.tf-detail {
		.tf-detail-title {
			display: flex;
			align-items: baseline;
			justify-content: space-between;
			margin-bottom: 8px;

			b {
				font-size: 13px;
				color: #303133;
			}

			span {
				font-size: 11px;
				color: #a3a9c0;
			}
		}

		.tf-detail-head,
		.tf-detail-row {
			display: grid;
			grid-template-columns: 118px 48px 1fr 1fr 1fr;
			gap: 6px;
			align-items: center;
			padding: 4px 0;
			font-size: 12px;
		}

		.tf-detail-head {
			color: #a3a9c0;
			border-bottom: 1px solid #eef0f6;
			padding-bottom: 6px;
			margin-bottom: 2px;
		}

		.tf-detail-list {
			min-height: 72px;
			max-height: 380px;
			overflow-y: auto;
		}

		.tf-detail-row {
			color: #4b5563;
			border-bottom: 1px dashed #f2f4fa;

			&:last-child {
				border-bottom: none;
			}
		}

		.tdr-time {
			color: #7a819d;
			font-size: 11px;
		}

		.tdr-badge {
			justify-self: start;
			padding: 0 8px;
			border-radius: 8px;
			font-size: 11px;
			line-height: 18px;

			&.buy {
				color: var(--el-color-danger);
				background: rgba(245, 108, 108, 0.1);
			}

			&.sell {
				color: var(--el-color-success);
				background: rgba(103, 194, 58, 0.12);
			}

			&.other {
				color: #7a819d;
				background: #f2f4fa;
			}
		}

		.tf-detail-empty {
			padding: 20px 0;
			text-align: center;
			font-size: 12px;
			color: #a3a9c0;
		}

		.ta-r {
			text-align: right;
		}
	}
}
</style>
