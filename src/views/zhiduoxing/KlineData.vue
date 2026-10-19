<template>
	<el-container class="kline-data-page">
		<el-header class="header">
			<span>
				<span class="search-box">
					<el-radio-group v-model="period" @change="onPeriodChange" :disabled="drawerVisiable" class="ofa-mr10">
						<el-radio-button v-for="item in ZDX_KLINE_PERIODS" :key="item.value" :value="item.value">{{ item.label }}</el-radio-button>
					</el-radio-group>
					<el-radio-group v-if="period !== 'minute'" v-model="fqt" @change="onFqtChange" :disabled="drawerVisiable" class="ofa-mr10">
						<el-radio-button v-for="item in ZDX_KLINE_FQTS" :key="item.value" :value="item.value">{{ item.label }}</el-radio-button>
					</el-radio-group>
					<el-input v-model="searchOption.code" placeholder="股票代码" clearable style="width: 140px" class="ofa-mr10"
						@keyup.enter="search"></el-input>
					<el-date-picker v-model="searchOption.begin" type="date" placeholder="开始日期" format="YYYY-MM-DD"
						value-format="YYYY-MM-DD" style="width: 180px" class="ofa-mr10"></el-date-picker>
					<el-date-picker v-model="searchOption.end" type="date" placeholder="结束日期" format="YYYY-MM-DD"
						value-format="YYYY-MM-DD" style="width: 180px" class="ofa-mr10"></el-date-picker>
					<el-button @click="search" type="primary" class="ofa-mr10">
						<font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
					</el-button>
				</span>
			</span>
			<span class="button-box">
				<el-button @click="showDrawer()" type="primary">
					<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增/补录
				</el-button>
			</span>
		</el-header>
		<el-main class="content">
			<!-- K线同步进度统计区（折叠面板：按周期分开统计——日频按交易日、周K按各周最后交易日、月K按各月最后交易日；默认收起避免遮挡下方列表） -->
			<div class="progress-box" v-loading="progressLoading">
				<div class="progress-head" @click="toggleProgress">
					<span class="progress-title">
						<font-awesome-icon fas icon="chart-line" class="progress-icon"></font-awesome-icon>&nbsp;K线同步进度
					</span>
					<span v-if="!progressOpen" class="progress-summary">
						股票池 {{ formatCount(stats.PoolCount) }} 只 · 数据截至 {{ stats.Daily?.length ? shortDate(stats.Daily[0].TradeDate) : '--' }}
					</span>
					<span class="progress-toggle" :class="{ 'is-open': progressOpen }">
						<font-awesome-icon fas icon="chevron-down"></font-awesome-icon>
					</span>
				</div>
				<el-collapse-transition>
					<div v-show="progressOpen" class="progress-body">
						<!-- 日频/周K/月K三组结构一致：组内每行=一个口径的日期 chips 序列 -->
						<div class="pg-group" v-for="group in PROGRESS_GROUPS" :key="group.key">
							<div class="pg-group-title">{{ group.title }}<span>{{ group.sub }}</span></div>
							<div class="pg-row" v-for="row in group.rows" :key="row.key">
								<span class="pg-label">{{ row.label }}</span>
								<div class="pg-chips">
									<span class="pg-chip" v-for="d in group.items" :key="d.TradeDate" :title="chipTitle(row.value(d))">
										<span class="pg-date">{{ shortDate(d.TradeDate) }}</span>
										<span class="pg-count" :class="rateClass(row.value(d))">{{ formatCount(row.value(d)) }}</span>
									</span>
								</div>
							</div>
						</div>
						<div class="pg-note">
							覆盖数=该周期锚定日（各周/月最后交易日）已同步的股票数，占比以股票池为基准；分时/日K为每交易日、周K为每周五、月K为每月底，均在盘后窗口（17:00-20:00）每10分钟一轮滚动补齐（缺口驱动、异常次轮自动续补、一般当晚收敛；未走完周期的临时周/月K不落库），最新一期在当日窗口内逐步爬升、收敛前偏低属正常；行情源故障或任务中断表现为覆盖数骤降；每次手动同步完成后自动刷新。
						</div>
					</div>
				</el-collapse-transition>
			</div>
			<!-- 手动数据同步区（填写上方股票代码=定向同步该股，未填写=全量批量执行；勾选去重同步=仅补缺数据个股；任务后台异步执行，进度自动刷新） -->
			<div class="sync-box">
				<div class="sync-head">
					<span class="sync-title">手动数据同步</span>
					<span class="sync-tip">对接东方财富/腾讯数据源；填写上方「股票代码」后定向同步该股票（日期取查询条件，留空=最近130根补齐；分时仅当日），未填写则全量批量执行（耗时可能较长）</span>
				</div>
				<div class="sync-controls">
					<el-checkbox v-model="secondSync" :disabled="syncBusy || clearing" class="ofa-mr10">去重同步</el-checkbox>
					<el-button v-for="item in SYNC_ACTIONS" :key="item.key" type="primary" plain
						:loading="activeKey === item.key" :disabled="clearing || (!!activeKey && activeKey !== item.key)"
						@click="runSync(item)">
						{{ item.name }}
					</el-button>
					<el-button type="danger" plain :loading="clearing" :disabled="syncBusy" @click="runClear">
						<font-awesome-icon fas icon="trash"></font-awesome-icon>&nbsp;清空数据
					</el-button>
				</div>
				<!-- 同步进度条（异步后台执行：提交后立即返回；可离开页面，任务继续运行，进度每2秒自动刷新） -->
				<div v-if="syncProgress && (syncProgress.Running || syncProgress.Name)" class="sync-progress-box">
					<div class="sp-head">
						<font-awesome-icon fas spin icon="spinner" v-if="syncProgress.Running" class="sp-icon"></font-awesome-icon>
						<font-awesome-icon fas icon="circle-check" v-else-if="syncProgress.Success" class="sp-icon sp-done"></font-awesome-icon>
						<font-awesome-icon fas icon="circle-exclamation" v-else class="sp-icon sp-fail"></font-awesome-icon>
						<span class="sp-name">{{ syncProgress.Name }}</span>
						<span class="sp-pct">{{ syncProgress.Percent }}%</span>
					</div>
					<el-progress :percentage="syncProgress.Percent" :indeterminate="syncProgress.Running && !syncProgress.Total"
						:stroke-width="10" :show-text="false" :status="progressStatus"></el-progress>
					<div class="sp-stage">
						<span>{{ syncProgress.Stage }}</span>
						<span v-if="syncProgress.Total > 0">&nbsp;（{{ formatCount(syncProgress.Done) }} / {{ formatCount(syncProgress.Total) }}）</span>
						<span v-if="!syncProgress.Running && syncProgress.Message" class="sp-msg">{{ syncProgress.Message }}</span>
					</div>
				</div>
				<div class="sync-note">
				去重同步只会同步没有对应K线数据的个股（版本发布暂停站点可能导致同步Job中断、造成个股漏同步）：勾选后按上方查询组合参数（复权口径、日期区间；周期以所点按钮为准）先检测缺数据的个股，仅对这些个股执行补齐，已有数据的个股不重复处理；日期区间留空时检测全表无数据的个股。
				「清空数据」按当前周期与复权口径、以上方查询条件为范围物理删除（不可恢复，仅作用于当前口径的表，清空后可用同步按钮重新补数）；条件全部留空=清空该表全量，请谨慎操作。
				</div>
			</div>
			<div class="title-box">
				<span class="title">
					K线数据（{{ periodLabel }}{{ period === 'minute' ? '' : '·' + fqtLabel }}）
					<span class="title-total">
						共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
					</span>
				</span>
			</div>
			<el-table v-loading="loading" :data="list" class="ofa-table">
				<el-table-column prop="StockCode" label="股票代码" width="100" align="center" fixed="left"></el-table-column>
				<el-table-column label="交易日期" min-width="110" align="center">
					<template #default="scope">{{ formatDate(scope.row.TradeDate) }}</template>
				</el-table-column>
				<!-- 分时K列 -->
				<el-table-column v-if="period === 'minute'" prop="Minute" label="时间点" min-width="90" align="center"></el-table-column>
				<el-table-column v-if="period === 'minute'" label="价格" min-width="100" align="right">
					<template #default="scope">{{ formatNumber(scope.row.Price) }}</template>
				</el-table-column>
				<el-table-column v-if="period === 'minute'" label="均价" min-width="100" align="right">
					<template #default="scope">{{ formatNumber(scope.row.AvgPrice) }}</template>
				</el-table-column>
				<!-- 日/周/月K列 -->
				<el-table-column v-if="period !== 'minute'" label="开盘价" min-width="100" align="right">
					<template #default="scope">{{ formatNumber(scope.row.OpenPrice) }}</template>
				</el-table-column>
				<el-table-column v-if="period !== 'minute'" label="收盘价" min-width="100" align="right">
					<template #default="scope">{{ formatNumber(scope.row.ClosePrice) }}</template>
				</el-table-column>
				<el-table-column v-if="period !== 'minute'" label="最高价" min-width="100" align="right">
					<template #default="scope">{{ formatNumber(scope.row.HighPrice) }}</template>
				</el-table-column>
				<el-table-column v-if="period !== 'minute'" label="最低价" min-width="100" align="right">
					<template #default="scope">{{ formatNumber(scope.row.LowPrice) }}</template>
				</el-table-column>
				<el-table-column v-if="period !== 'minute'" label="涨跌幅" min-width="100" align="center">
					<template #default="scope">
						<span :class="percentClass(scope.row.ChangePercent)">{{ formatPercent(scope.row.ChangePercent) }}</span>
					</template>
				</el-table-column>
				<!-- 成交量（共用） -->
				<el-table-column :label="period === 'minute' ? '累计成交量(万手)' : '成交量(万手)'"
					:min-width="period === 'minute' ? 150 : 120" align="right">
					<template #default="scope">{{ formatNumber(scope.row.Volume) }}</template>
				</el-table-column>
				<el-table-column v-if="period !== 'minute'" label="成交额(亿)" min-width="110" align="right">
					<template #default="scope">{{ formatNumber(scope.row.Amount) }}</template>
				</el-table-column>
				<el-table-column v-if="period !== 'minute'" label="换手率(%)" min-width="100" align="right">
					<template #default="scope">{{ formatNumber(scope.row.TurnoverRate) }}</template>
				</el-table-column>
				<el-table-column v-if="period !== 'minute'" label="市盈率" min-width="90" align="right">
					<template #default="scope">{{ formatNumber(scope.row.PERatio) }}</template>
				</el-table-column>
				<el-table-column v-if="period !== 'minute'" label="市净率" min-width="90" align="right">
					<template #default="scope">{{ formatNumber(scope.row.PBRatio) }}</template>
				</el-table-column>
				<el-table-column v-if="period !== 'minute'" label="总市值(亿)" min-width="110" align="right">
					<template #default="scope">{{ formatNumber(scope.row.TotalMarketValue) }}</template>
				</el-table-column>
				<el-table-column v-if="period !== 'minute'" label="流通市值(亿)" min-width="120" align="right">
					<template #default="scope">{{ formatNumber(scope.row.CirculatingMarketValue) }}</template>
				</el-table-column>
				<el-table-column label="操作" width="130" align="center" header-align="center" fixed="right">
					<template #default="scope">
						<el-button link type="primary" @click="showDrawer(scope.row)">修改</el-button>
						<el-button link type="danger" @click="del(scope.row)">删除</el-button>
					</template>
				</el-table-column>
			</el-table>
			<el-pagination background layout="total, sizes, prev, pager, next, jumper" v-model:current-page="pageIndex"
				:page-sizes="[20, 50, 100, 200]" v-model:page-size="pageSize" :total="total"
				@size-change="pageSizeChange" @current-change="pageIndexChange">
			</el-pagination>
		</el-main>
	</el-container>
	<!-- 表单 -->
	<el-drawer v-model="drawerVisiable" :modal="false" :show-close="false" direction="rtl" size="660" class="ofa-drawer">
		<template #header>
			<span class="title">{{ isAdd ? '新增/补录' : '修正' }}{{ periodLabel }}数据{{ period === 'minute' ? '' : '（' + fqtLabel + '）' }}</span>
		</template>
		<el-form status-icon ref="klineForm" :rules="validationRule" :model="entity" label-width="130px">
			<el-divider content-position="left">主键信息</el-divider>
			<el-form-item label="复权口径" v-if="period !== 'minute'">
				<el-tag type="warning" effect="plain">{{ fqtLabel }}</el-tag>
				<span class="fqt-tip">本次操作作用于{{ fqtLabel }}数据表，如需切换请关闭抽屉后在顶部切换</span>
			</el-form-item>
			<el-form-item label="股票代码" prop="StockCode">
				<el-input v-model="entity.StockCode" :disabled="!isAdd" placeholder="如 000001" style="width: 100%"></el-input>
			</el-form-item>
			<el-form-item label="交易日期" prop="TradeDate">
				<el-date-picker v-model="entity.TradeDate" type="date" placeholder="请选择交易日期" format="YYYY-MM-DD"
					value-format="YYYY-MM-DD" :disabled="!isAdd" :disabled-date="disabledFutureDate" style="width: 100%">
				</el-date-picker>
			</el-form-item>
			<el-form-item label="时间点" prop="Minute" v-if="period === 'minute'">
				<el-input v-model="entity.Minute" :disabled="!isAdd" placeholder="HH:mm，如 09:35" style="width: 100%"></el-input>
			</el-form-item>
			<template v-if="period === 'minute'">
				<el-divider content-position="left">分时行情</el-divider>
				<div class="row">
					<el-form-item label="价格" prop="Price">
						<el-input-number v-model="entity.Price" :precision="2" :controls="false"></el-input-number>
					</el-form-item>
					<el-form-item label="均价" prop="AvgPrice">
						<el-input-number v-model="entity.AvgPrice" :precision="2" :controls="false"></el-input-number>
					</el-form-item>
				</div>
				<el-form-item label="累计成交量(万手)" prop="Volume">
					<el-input-number v-model="entity.Volume" :precision="2" :controls="false" style="width: 100%"></el-input-number>
				</el-form-item>
			</template>
			<template v-else>
				<el-divider content-position="left">行情数据</el-divider>
				<div class="row">
					<el-form-item label="开盘价" prop="OpenPrice">
						<el-input-number v-model="entity.OpenPrice" :precision="2" :controls="false"></el-input-number>
					</el-form-item>
					<el-form-item label="收盘价" prop="ClosePrice">
						<el-input-number v-model="entity.ClosePrice" :precision="2" :controls="false"></el-input-number>
					</el-form-item>
					<el-form-item label="最高价" prop="HighPrice">
						<el-input-number v-model="entity.HighPrice" :precision="2" :controls="false"></el-input-number>
					</el-form-item>
					<el-form-item label="最低价" prop="LowPrice">
						<el-input-number v-model="entity.LowPrice" :precision="2" :controls="false"></el-input-number>
					</el-form-item>
					<el-form-item label="成交量(万手)" prop="Volume">
						<el-input-number v-model="entity.Volume" :precision="2" :controls="false"></el-input-number>
					</el-form-item>
					<el-form-item label="成交额(亿元)" prop="Amount">
						<el-input-number v-model="entity.Amount" :precision="2" :controls="false"></el-input-number>
					</el-form-item>
					<el-form-item label="涨跌幅(%)" prop="ChangePercent">
						<el-input-number v-model="entity.ChangePercent" :precision="2" :controls="false"></el-input-number>
					</el-form-item>
					<el-form-item label="换手率(%)" prop="TurnoverRate">
						<el-input-number v-model="entity.TurnoverRate" :precision="2" :controls="false"></el-input-number>
					</el-form-item>
					<el-form-item label="市盈率" prop="PERatio">
						<el-input-number v-model="entity.PERatio" :precision="2" :controls="false"></el-input-number>
					</el-form-item>
					<el-form-item label="市净率" prop="PBRatio">
						<el-input-number v-model="entity.PBRatio" :precision="2" :controls="false"></el-input-number>
					</el-form-item>
					<el-form-item label="总市值(亿元)" prop="TotalMarketValue">
						<el-input-number v-model="entity.TotalMarketValue" :precision="2" :controls="false"></el-input-number>
					</el-form-item>
					<el-form-item label="流通市值(亿元)" prop="CirculatingMarketValue">
						<el-input-number v-model="entity.CirculatingMarketValue" :precision="2" :controls="false"></el-input-number>
					</el-form-item>
				</div>
			</template>
		</el-form>
		<div class="footer">
			<el-button type="primary" @click="submit">提交</el-button>
			<el-button type="warning" @click="drawerVisiable = false">取消</el-button>
		</div>
	</el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { FormRules, ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import dayjs from '@/untils/dayjs'
import { IZdxStockKlineData, IZdxStockKlineDataForm, IZdxStockKlineDataQuery, IZdxKlineProgressStats, IZdxKlineProgressDaily, IZdxKlineProgressWeek, IZdxKlineProgressMonth, IZdxSyncProgress, ZDX_KLINE_PERIODS, ZDX_KLINE_FQTS } from '@/interfaces/zhiduoxing/IZdxStockKlineData'
import { IBaseMessage } from '@/interfaces/IBaseMessage'
import API from '@/apis/zdx-api'

// 同步项（按钮固定周期；点击时按查询条件分流：有股票代码=定向同步该股，勾选去重同步=仅补缺数据个股，无=全量批量执行）
interface SyncAction {
	key: string
	name: string
	period: string
	batch: () => Promise<IBaseMessage>
}

// 复权口径记忆 key（与个股详情页图表共用，切换后保持全站口径一致）
const FQT_STORAGE_KEY = 'zhiduoxing_kline_fqt'

const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const list = ref<IZdxStockKlineData[]>([]) // 列表
const period = ref('day') // 当前周期（minute/day/week/month）
const fqt = ref(localStorage.getItem(FQT_STORAGE_KEY) === 'none' ? 'none' : 'qfq') // 当前复权口径（qfq=前复权/none=不复权；分时K不区分）
const pageIndex = ref(1) // 页码
const pageSize = ref(20) // 每页数量
const drawerVisiable = ref(false) // 抽屉显示
const isAdd = ref(true) // 添加模式
const searchOption = ref({
	code: '', // 股票代码
	begin: '', // 开始日期
	end: '' // 结束日期
}) // 搜索条件

// K线同步进度统计（折叠面板：日频按交易日、周K按各周最后交易日、月K按各月最后交易日分开统计；挂载时与每次同步完成后刷新）
const PROGRESS_OPEN_KEY = 'zhiduoxing_kline_progress_open' // 面板展开状态记忆 key
const progressLoading = ref(false) // 进度统计加载中
const progressOpen = ref(localStorage.getItem(PROGRESS_OPEN_KEY) === '1') // 统计面板是否展开（默认收起，避免遮挡下方数据列表）
const stats = ref<IZdxKlineProgressStats>({ PoolCount: 0, Daily: [], Weekly: [], Monthly: [] }) // 进度统计

// 进度统计行配置（每行=一个口径的日期 chips 序列）
interface ProgressRow {
	key: string
	label: string
	value: (d: any) => number
}
const DAILY_ROWS: ProgressRow[] = [
	{ key: 'minute', label: '分时K', value: (d: IZdxKlineProgressDaily) => d.Minute },
	{ key: 'daily-qfq', label: '日K·前复权', value: (d: IZdxKlineProgressDaily) => d.DailyQfq },
	{ key: 'daily-raw', label: '日K·不复权', value: (d: IZdxKlineProgressDaily) => d.DailyRaw }
]
const WEEK_ROWS: ProgressRow[] = [
	{ key: 'week-qfq', label: '前复权', value: (d: IZdxKlineProgressWeek) => d.WeeklyQfq },
	{ key: 'week-raw', label: '不复权', value: (d: IZdxKlineProgressWeek) => d.WeeklyRaw }
]
const MONTH_ROWS: ProgressRow[] = [
	{ key: 'month-qfq', label: '前复权', value: (d: IZdxKlineProgressMonth) => d.MonthlyQfq },
	{ key: 'month-raw', label: '不复权', value: (d: IZdxKlineProgressMonth) => d.MonthlyRaw }
]
// 进度统计分组（日频/周K/月K三组结构一致；数组回退空数组防后端结构过渡期渲染异常）
const PROGRESS_GROUPS = computed(() => [
	{ key: 'daily', title: '日频同步', sub: `最近 ${stats.value.Daily?.length ?? 0} 个交易日`, rows: DAILY_ROWS, items: stats.value.Daily ?? [] },
	{ key: 'weekly', title: '周K同步', sub: `最近 ${stats.value.Weekly?.length ?? 0} 周（各周最后交易日）`, rows: WEEK_ROWS, items: stats.value.Weekly ?? [] },
	{ key: 'monthly', title: '月K同步', sub: `最近 ${stats.value.Monthly?.length ?? 0} 月（各月最后交易日）`, rows: MONTH_ROWS, items: stats.value.Monthly ?? [] }
])

// 手动同步（异步后台任务：提交后立即返回，进度经 Progress 接口轮询——刷新/重进页面可恢复展示）
const syncTriggering = ref(false) // 同步任务提交中（POST 请求在途）
const triggerKey = ref('') // 提交中的任务键（用于按钮加载态）
const syncProgress = ref<IZdxSyncProgress | null>(null) // 当前同步任务进度（含最近一次完成结果）
let syncTimer: number | undefined // 进度轮询定时器
const syncBusy = computed(() => syncTriggering.value || (syncProgress.value?.Running ?? false)) // 有同步任务（提交中或后台执行中）
const activeKey = computed(() => syncTriggering.value ? triggerKey.value : (syncProgress.value?.Running ? syncProgress.value.Key : '')) // 正在执行的任务键（按钮状态匹配）
const progressStatus = computed(() => {
	const p = syncProgress.value
	if (!p || p.Running) return undefined
	return p.Success ? 'success' : 'warning'
}) // 进度条状态（执行中=默认蓝、完成=成功绿/失败橙）
const secondSync = ref(false) // 去重同步（仅同步没有对应K线数据的个股；未填股票代码的全量路径生效）
const clearing = ref(false) // 清空数据操作进行中（请求在途）
const SYNC_ACTIONS: SyncAction[] = [
	{ key: 'minute', name: '分时同步', period: 'minute', batch: () => API.syncZdxMinute() },
	{ key: 'daily', name: '日K同步', period: 'day', batch: () => API.syncZdxDaily() },
	{ key: 'weekly', name: '周K同步', period: 'week', batch: () => API.syncZdxWeekly() },
	{ key: 'monthly', name: '月K同步', period: 'month', batch: () => API.syncZdxMonthly() }
] // 手动同步项（分时置首；有股票代码=定向同步该股，勾选去重同步=仅补缺数据个股，无=全量批量；股票池/快照同步在股票信息页，大盘/指数同步在行情数据页）

// 实体（空值默认0，编辑时由行数据填充）
function emptyEntity(): IZdxStockKlineData {
	return {
		StockCode: '',
		TradeDate: '',
		Minute: '',
		OpenPrice: 0,
		ClosePrice: 0,
		HighPrice: 0,
		LowPrice: 0,
		Volume: 0,
		Amount: 0,
		ChangePercent: 0,
		TurnoverRate: 0,
		PERatio: 0,
		PBRatio: 0,
		TotalMarketValue: 0,
		CirculatingMarketValue: 0,
		Price: 0,
		AvgPrice: 0
	}
}
const entity = ref<IZdxStockKlineData>(emptyEntity()) // 实体
const klineForm = ref<FormInstance>() // 表单
// 表单验证（分时K另需时间点）
const validationRule = computed<FormRules<any>>(() => ({
	StockCode: [{ required: true, message: '请输入股票代码', trigger: 'blur' }],
	TradeDate: [{ required: true, message: '请先选择交易日期', trigger: 'change' }],
	Minute: period.value === 'minute' ? [
		{ required: true, message: '请输入时间点（HH:mm）', trigger: 'blur' },
		{ pattern: /^([01]\d|2[0-3]):[0-5]\d$/, message: '时间点格式须为 HH:mm', trigger: 'blur' }
	] : []
}))
// 当前周期名称
const periodLabel = computed(() => ZDX_KLINE_PERIODS.find(w => w.value === period.value)?.label ?? '')
// 当前复权口径名称（默认前复权，与个股详情页图表一致；分时K不展示切换控件）
const fqtLabel = computed(() => ZDX_KLINE_FQTS.find(w => w.value === fqt.value)?.label ?? '前复权')

onMounted(() => {
	// 查询日期默认当日
	searchOption.value.begin = dayjs().format('YYYY-MM-DD')
	searchOption.value.end = dayjs().format('YYYY-MM-DD')
	get()
	getProgress()
	resumeSyncProgress() // 恢复后台同步任务进度展示（若有任务执行中则继续轮询）
})

// 卸载时停止进度轮询（任务在服务端继续执行，重进页面经 resumeSyncProgress 恢复展示）
onBeforeUnmount(() => {
	stopSyncPolling()
})

// 获取列表
function get() {
	loading.value = true
	const form: IZdxStockKlineDataQuery = {
		Code: searchOption.value.code,
		Begin: searchOption.value.begin,
		End: searchOption.value.end
	}
	API.getKlineDatas(period.value, fqt.value, form, pageIndex.value, pageSize.value).then(res => {
		list.value = res.Items
		total.value = res.Total
		loading.value = false
	})
}

// 获取K线同步进度统计（失败静默：仅统计区块展示，不阻塞列表；错误通知由响应拦截器统一处理）
function getProgress() {
	progressLoading.value = true
	API.getKlineProgressStats().then(res => {
		stats.value = res
		progressLoading.value = false
	}).catch(() => {
		progressLoading.value = false
	})
}

// 搜索（重置页码）
function search() {
	pageIndex.value = 1
	get()
}

// 切换周期（重置页码）
function onPeriodChange() {
	pageIndex.value = 1
	get()
}

// 切换复权口径（记忆选择并重置页码；分时K无此切换）
function onFqtChange() {
	localStorage.setItem(FQT_STORAGE_KEY, fqt.value)
	pageIndex.value = 1
	get()
}

// 改变每页数量
function pageSizeChange(value: number) {
	pageSize.value = value
	nextTick(() => get())
}

// 下一页
function pageIndexChange(value: number) {
	pageIndex.value = value
	nextTick(() => get())
}

// 日期展示（yyyy-MM-dd HH:mm:ss → yyyy-MM-dd）
function formatDate(value: string): string {
	return value ? value.substring(0, 10) : ''
}

// 数值展示（保留2位小数，空值显示--）
function formatNumber(value?: number | null): string {
	return value === null || value === undefined ? '--' : Number(value).toFixed(2)
}

// 涨跌幅格式（+1.23% / -1.23% / 0.00%）
function formatPercent(value?: number | null): string {
	if (value === null || value === undefined) return '--'
	const v = Number(value)
	return (v > 0 ? '+' : '') + v.toFixed(2) + '%'
}

// 涨跌颜色（涨红跌绿）
function percentClass(value?: number | null): string {
	if (value === null || value === undefined) return ''
	const v = Number(value)
	return v > 0 ? 'up' : v < 0 ? 'down' : ''
}

// 进度覆盖率展示（覆盖数/股票池总数，保留1位小数；池为空时不展示）
function progressRate(count: number): string {
	if (!stats.value.PoolCount) return ''
	return (count * 100 / stats.value.PoolCount).toFixed(1) + '%'
}

// 覆盖数颜色分档（0=灰、达到股票池90%以上=正常、其余=橙色警示）
function rateClass(count: number): string {
	if (!count) return 'zero'
	if (!stats.value.PoolCount) return ''
	return count * 100 / stats.value.PoolCount >= 90 ? '' : 'warn'
}

// 进度卡片悬浮提示（覆盖数与占比）
function chipTitle(count: number): string {
	const rate = progressRate(count)
	return rate ? `已同步 ${count} 只（占股票池 ${rate}）` : `已同步 ${count} 只`
}

// 数值千分位展示
function formatCount(value: number): string {
	return (value ?? 0).toLocaleString('zh-CN')
}

// 日期短展示（yyyy-MM-dd HH:mm:ss 或 ISO 格式 → MM-dd，忽略无意义的时间部分）
function shortDate(value: string): string {
	return value ? value.substring(5, 10) : ''
}

// 切换进度统计面板展开/收起（记忆用户选择；默认收起避免遮挡下方数据列表）
function toggleProgress() {
	progressOpen.value = !progressOpen.value
	localStorage.setItem(PROGRESS_OPEN_KEY, progressOpen.value ? '1' : '0')
}

// 不能选择未来日期
function disabledFutureDate(date: Date) {
	return dayjs(date).isAfter(dayjs(), 'day')
}

// 显示添加抽屉（传入行为编辑模式，空为新增/补录）
function showDrawer(item?: IZdxStockKlineData) {
	if (item) {
		isAdd.value = false
		entity.value = Object.assign(emptyEntity(), item, {
			TradeDate: formatDate(item.TradeDate),
			Minute: item.Minute ?? ''
		})
	} else {
		isAdd.value = true
		entity.value = emptyEntity()
	}
	drawerVisiable.value = true
}

// 提交（新增/补录为 upsert 语义；编辑仅可改数值，主键不可修改）
function submit() {
	klineForm.value?.validate((valid: boolean) => {
		if (!valid) return

		const form: IZdxStockKlineDataForm = {
			StockCode: entity.value.StockCode.trim(),
			TradeDate: entity.value.TradeDate,
			Minute: period.value === 'minute' ? (entity.value.Minute ?? '').trim() : undefined,
			OpenPrice: entity.value.OpenPrice ?? 0,
			ClosePrice: entity.value.ClosePrice ?? 0,
			HighPrice: entity.value.HighPrice ?? 0,
			LowPrice: entity.value.LowPrice ?? 0,
			Volume: entity.value.Volume ?? 0,
			Amount: entity.value.Amount ?? 0,
			ChangePercent: entity.value.ChangePercent ?? 0,
			TurnoverRate: entity.value.TurnoverRate ?? 0,
			PERatio: entity.value.PERatio ?? 0,
			PBRatio: entity.value.PBRatio ?? 0,
			TotalMarketValue: entity.value.TotalMarketValue ?? 0,
			CirculatingMarketValue: entity.value.CirculatingMarketValue ?? 0,
			Price: entity.value.Price ?? 0,
			AvgPrice: entity.value.AvgPrice ?? 0
		}

		if (isAdd.value) {
			API.addKlineData(period.value, form, fqt.value).then(res => {
				if (res.Status) {
					drawerVisiable.value = false
					get()
				}
			})
		} else {
			API.updateKlineData(period.value, form, fqt.value).then(res => {
				if (res.Status) {
					drawerVisiable.value = false
					get()
				}
			})
		}
	})
}

// 删除
function del(item: IZdxStockKlineData) {
	const tip = period.value === 'minute'
		? `${item.StockCode} ${formatDate(item.TradeDate)} ${item.Minute}`
		: `${item.StockCode} ${formatDate(item.TradeDate)}`
	const fqtTip = period.value === 'minute' ? '' : `（${fqtLabel.value}）`
	ElMessageBox.confirm(`确认要删除 ${tip} 的${periodLabel.value}${fqtTip}记录？删除后不可恢复，请谨慎操作！`, '敏感操作提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	}).then(() => {
		API.delKlineData(period.value, item.StockCode, formatDate(item.TradeDate), item.Minute ?? undefined, fqt.value).then(res => {
			if (res.Status) get()
		})
	})
}

// 执行手动同步（点击时按查询条件分流：填写股票代码=定向同步该股，勾选去重同步=仅补缺数据个股，未填写=全量批量执行；任务后台异步执行，进度条轮询刷新）
async function runSync(item: SyncAction) {
	if (syncBusy.value) return
	const code = searchOption.value.code.trim()
	if (code) {
		await runCodeSync(item, code)
	} else if (secondSync.value) {
		await runSecondSync(item)
	} else {
		await runBatchSync(item)
	}
}

// 全量批量同步（确认后执行；成功/失败信息由响应拦截器统一弹出通知）
async function runBatchSync(item: SyncAction) {
	const isMinute = item.period === 'minute'
	// 全量批量走固定增量接口（不支持日期/口径参数）：分时=当日；日/周/月=双通道自动增量补最新（提示中如实注明，避免与上方查询日期混淆）
	const scopeTip = isMinute
		? '时间范围：当日分时（上方日期区间不参与）。'
		: '口径：不复权+前复权；时间范围：自动增量补最新数据（上方日期区间不参与）。'
	try {
		await ElMessageBox.confirm(
			`确认执行「${item.name}」（全量；任务提交后在服务端后台执行，可离开页面，进度自动刷新）？${scopeTip}`,
			'手动同步提示',
			{ type: 'warning', cancelButtonText: '放弃操作' }
		)
	} catch {
		return // 用户取消
	}

	await startBackgroundSync(() => item.batch(), item.key)
}

// 定向同步单只股票（周期=按钮周期，口径=顶部当前口径，日期=查询条件；仅补缺失；分时忽略日期）
async function runCodeSync(item: SyncAction, code: string) {
	const isMinute = item.period === 'minute'
	const begin = isMinute ? '' : searchOption.value.begin
	let end = isMinute ? '' : searchOption.value.end
	let scopeTip = '分时仅当日数据（日期不参与）'
	if (!isMinute) {
		if (!begin && end) {
			ElMessage.warning('仅填结束日期无法确定同步范围，请填写开始日期或两者全部留空（最近130根补齐）')
			return
		}
		if (begin && !end) end = dayjs().format('YYYY-MM-DD') // 只填开始日期时结束日期补到今天
		if (begin && end && dayjs(begin).isAfter(dayjs(end), 'day')) {
			ElMessage.warning('开始日期不能晚于结束日期')
			return
		}
		scopeTip = `口径：${fqtLabel.value}；范围：${begin ? `日期区间 ${begin} ~ ${end}` : '最近130根补齐'}`
	}

	try {
		await ElMessageBox.confirm(
			`确认对「${code}」执行「${item.name}」？${scopeTip}，仅补缺失行、已存在行保持不变。`,
			'按代码同步提示',
			{ type: 'warning', cancelButtonText: '放弃操作' }
		)
	} catch {
		return // 用户取消
	}

	await startBackgroundSync(() => API.syncZdxByCode(item.period, code, isMinute ? 'none' : fqt.value, begin || undefined, end || undefined), item.key)
}

// 去重同步（补漏：按上方查询组合参数检测缺K线数据的个股，仅对这些个股执行补齐；用于站点暂停导致同步Job中断后的定向补漏；任务后台异步执行）
async function runSecondSync(item: SyncAction) {
	const isMinute = item.period === 'minute'
	const begin = searchOption.value.begin
	let end = searchOption.value.end
	if (!begin && end) {
		ElMessage.warning('仅填结束日期无法确定检测范围，请填写开始日期或两者全部留空（留空=检测全表无数据的个股）')
		return
	}
	if (begin && !end) end = dayjs().format('YYYY-MM-DD') // 只填开始日期时结束日期补到今天
	if (begin && end && dayjs(begin).isAfter(dayjs(end), 'day')) {
		ElMessage.warning('开始日期不能晚于结束日期')
		return
	}
	const scopeTip = isMinute
		? (begin ? `检测区间：${begin} ~ ${end}（分时仅当日数据）` : '检测全表无分时的个股（分时仅当日数据）')
		: (begin ? `口径：${fqtLabel.value}；检测区间：${begin} ~ ${end}` : `口径：${fqtLabel.value}；检测全表无数据的个股`)

	try {
		await ElMessageBox.confirm(
			`确认执行「${item.name}」去重同步？仅同步没有对应K线数据的个股（${scopeTip}），已存在行保持不变。`,
			'去重同步提示',
			{ type: 'warning', cancelButtonText: '放弃操作' }
		)
	} catch {
		return // 用户取消
	}

	await startBackgroundSync(() => API.syncZdxSecond(item.period, isMinute ? 'none' : fqt.value, begin || undefined, end || undefined), item.key)
}

// 清空数据（按上方查询条件批量物理删除当前周期×口径的表数据；条件全部留空=清空该表全量；完成后刷新列表与统计）
async function runClear() {
	if (syncBusy.value || clearing.value) return
	const code = searchOption.value.code.trim()
	const begin = searchOption.value.begin
	const end = searchOption.value.end
	if (begin && end && dayjs(begin).isAfter(dayjs(end), 'day')) {
		ElMessage.warning('开始日期不能晚于结束日期')
		return
	}
	const fqtTip = period.value === 'minute' ? '' : `（${fqtLabel.value}）`
	const scopeTip = !code && !begin && !end
		? '未填写股票代码与日期区间，将清空该表全部数据'
		: `范围：股票代码 ${code || '全部'}；日期区间 ${begin ? `${begin} ~ ${end || '不限'}` : (end ? `不限 ~ ${end}` : '不限')}`
	try {
		await ElMessageBox.confirm(
			`确认清空「${periodLabel.value}${fqtTip}」数据？${scopeTip}。删除后不可恢复（可用同步按钮重新补数），请谨慎操作！`,
			'清空数据提示',
			{ type: 'warning', cancelButtonText: '放弃操作' }
		)
	} catch {
		return // 用户取消
	}

	clearing.value = true
	try {
		const res = await API.clearKlineDatas(period.value, fqt.value, { Code: code, Begin: begin, End: end })
		if (res.Status) {
			get()
			getProgress()
		}
	} finally {
		clearing.value = false
	}
}

// 提交后台同步任务（POST 立即返回受理结果；随后启动进度轮询；失败信息由响应拦截器统一弹出通知）
async function startBackgroundSync(run: () => Promise<IBaseMessage>, key: string) {
	syncTriggering.value = true
	triggerKey.value = key
	try {
		await run()
		startSyncPolling()
	} catch {
		resumeSyncProgress() // 受理失败（如已有任务执行中）：拉取一次进度纠正展示状态
	} finally {
		syncTriggering.value = false
		triggerKey.value = ''
	}
}

// 启动进度轮询（2秒一次；首轮立即拉取，用于检测短任务是否已结束）
function startSyncPolling() {
	stopSyncPolling()
	pollSyncProgress(true)
	syncTimer = window.setInterval(() => pollSyncProgress(false), 2000)
}

// 停止进度轮询
function stopSyncPolling() {
	if (syncTimer) {
		clearInterval(syncTimer)
		syncTimer = undefined
	}
}

// 拉取同步进度（任务从执行中转为结束时：刷新列表与统计并弹出结果通知；first=本轮轮询的首个请求）
async function pollSyncProgress(first: boolean) {
	try {
		const wasRunning = syncProgress.value?.Running ?? false
		const p = await API.getZdxSyncProgress()
		syncProgress.value = p
		if (!p.Running) {
			stopSyncPolling()
			if (wasRunning || first) {
				ElMessage({ type: p.Success ? 'success' : 'warning', message: p.Message || p.Stage || '同步任务已结束', duration: 8000, showClose: true })
				get()
				getProgress()
			}
		}
	} catch {
		// 轮询失败静默处理（网络抖动等），下次轮询自动继续
	}
}

// 恢复后台同步任务进度展示（页面加载/刷新后：有任务执行中则继续轮询；无任务时展示最近一次结果）
async function resumeSyncProgress() {
	try {
		const p = await API.getZdxSyncProgress()
		syncProgress.value = p
		if (p.Running) startSyncPolling()
	} catch {
		// 静默处理（不影响页面主体功能）
	}
}
</script>

<style lang="scss" scoped>
.kline-data-page {
	background: #fff;
	border-radius: 20px;
	padding: 20px;

	.header {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		height: auto;

		.search-box {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			padding: 6px 4px;
		}

		.button-box {
			display: flex;
			align-items: flex-start;
		}
	}

	.progress-box {
		border: 1px solid #e4e7ed;
		border-radius: 10px;
		background: #fafafa;
		padding: 10px 16px;
		margin-bottom: 16px;

		.progress-head {
			display: flex;
			align-items: center;
			cursor: pointer;
			user-select: none;
			padding: 4px 0;

			&:hover .progress-title {
				color: #409eff;
			}

			.progress-title {
				display: flex;
				align-items: center;
				color: #303133;
				font-weight: bold;
				font-size: 14px;
				transition: color 0.2s;

				.progress-icon {
					color: #409eff;
					margin-right: 6px;
				}
			}

			.progress-summary {
				margin-left: 12px;
				color: #909399;
				font-size: 12px;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.progress-toggle {
				display: flex;
				align-items: center;
				margin-left: auto;
				color: #909399;
				transition: transform 0.25s;

				&.is-open {
					transform: rotate(180deg);
				}
			}
		}

		.progress-body {
			padding-top: 2px;

			.pg-group {
				border-top: 1px dashed #ebeef5;
				padding: 10px 0 2px;

				&:first-child {
					border-top: 0;
					padding-top: 6px;
				}

				.pg-group-title {
					position: relative;
					display: flex;
					align-items: baseline;
					padding-left: 9px;
					margin-bottom: 8px;
					color: #303133;
					font-weight: 600;
					font-size: 13px;

					&::before {
						content: '';
						position: absolute;
						left: 0;
						top: 2px;
						width: 3px;
						height: 13px;
						border-radius: 2px;
						background: #409eff;
					}

					span {
						margin-left: 8px;
						color: #909399;
						font-weight: 400;
						font-size: 12px;
					}
				}

				.pg-row {
					display: flex;
					align-items: center;
					margin-bottom: 8px;

					&:last-child {
						margin-bottom: 0;
					}

					.pg-label {
						width: 84px;
						flex-shrink: 0;
						color: #606266;
						font-size: 12px;
					}

					.pg-chips {
						display: flex;
						flex-wrap: wrap;
						gap: 8px;
						flex: 1;
						min-width: 0;
					}
				}

				.pg-chip {
					display: inline-flex;
					flex-direction: column;
					align-items: center;
					min-width: 78px;
					padding: 5px 10px;
					border: 1px solid #ebeef5;
					border-radius: 8px;
					background: #fff;
					cursor: default;
					transition: all 0.2s;

					&:hover {
						border-color: #409eff;
						box-shadow: 0 2px 8px rgba(64, 158, 255, 0.16);
						transform: translateY(-1px);
					}

					.pg-date {
						color: #909399;
						font-size: 11px;
						line-height: 1.5;
					}

					.pg-count {
						color: #303133;
						font-size: 15px;
						font-weight: 600;
						line-height: 1.4;
						font-variant-numeric: tabular-nums;

						&.warn {
							color: #e6a23c;
						}

						&.zero {
							color: #c0c4cc;
							font-weight: 400;
						}
					}
				}
			}

			.pg-note {
				margin-top: 8px;
				padding-top: 8px;
				border-top: 1px dashed #ebeef5;
				color: #909399;
				font-size: 12px;
				line-height: 1.7;
			}
		}
	}

	.sync-box {
		border: 1px solid #e4e7ed;
		border-radius: 8px;
		background: #fafafa;
		padding: 12px 16px;
		margin-bottom: 16px;

		.sync-head {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			margin-bottom: 10px;
		}

		.sync-title {
			color: #303133;
			font-weight: bold;
			margin-right: 12px;
		}

		.sync-tip {
			color: #909399;
			font-size: 12px;
		}

		.sync-controls {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 8px;
		}

		.sync-progress-box {
			margin-top: 10px;
			padding: 10px 12px;
			border: 1px solid #e4e7ed;
			border-radius: 8px;
			background: #fff;

			.sp-head {
				display: flex;
				align-items: center;
				margin-bottom: 6px;
				font-size: 13px;

				.sp-icon {
					margin-right: 6px;
					color: #409eff;

					&.sp-done {
						color: #67c23a;
					}

					&.sp-fail {
						color: #e6a23c;
					}
				}

				.sp-name {
					color: #303133;
				}

				.sp-pct {
					margin-left: auto;
					color: #909399;
				}
			}

			.sp-stage {
				margin-top: 6px;
				color: #909399;
				font-size: 12px;
				line-height: 1.6;
				word-break: break-all;

				.sp-msg {
					display: block;
					margin-top: 2px;
					color: #606266;
				}
			}
		}

		.sync-note {
			margin-top: 8px;
			color: #909399;
			font-size: 12px;
			line-height: 1.6;
		}
	}

	.title-box {
		padding: 20px 0;
	}

	.title {
		color: #303133;
		font-size: 1.75rem;
		font-weight: bold;
	}
}

.up {
	color: #f56c6c;
}

.down {
	color: #67c23a;
}

.row {
	display: flex;
	flex-wrap: wrap;

	.el-form-item {
		width: 48%;
		margin-right: 2%;

		:deep(.el-input-number) {
			width: 100%;
		}
	}
}

.fqt-tip {
	margin-left: 8px;
	color: #909399;
	font-size: 12px;
}
</style>
