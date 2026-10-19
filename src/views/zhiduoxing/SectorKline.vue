<template>
	<el-container class="sector-kline-page">
		<el-header class="header">
			<span>
				<span class="search-box">
					<el-radio-group v-model="period" @change="onPeriodChange" :disabled="drawerVisiable" class="ofa-mr10">
						<el-radio-button v-for="item in ZDX_SECTOR_KLINE_PERIODS" :key="item.value" :value="item.value">{{ item.label }}</el-radio-button>
					</el-radio-group>
					<el-select v-model="searchOption.name" placeholder="行业名称" clearable filterable allow-create default-first-option
						style="width: 180px" class="ofa-mr10">
						<el-option v-for="item in sectorOptions" :key="item" :label="item" :value="item"></el-option>
					</el-select>
					<el-select v-model="searchOption.dataSource" placeholder="数据来源" clearable style="width: 120px" class="ofa-mr10">
						<el-option v-for="item in ZDX_SECTOR_DATA_SOURCES" :key="item.value" :label="item.label" :value="item.value"></el-option>
					</el-select>
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
			<!-- 手动数据同步区（任务后台异步执行，进度自动刷新；填写上方开始日期=区间回补） -->
			<div class="sync-box">
				<div class="sync-head">
					<span class="sync-title">手动数据同步</span>
					<span class="sync-tip">东财板块指数与腾讯行业指数为两条独立渠道（数据来源：2=东财/4=腾讯），分渠道分别取数并按（数据来源+行业+日期）分行存底、互不覆盖：有东财板块代码的行业拉东财K，命中腾讯映射的行业拉腾讯K，两渠道均可取的各行业都落一行；日期留空=滚动同步增量补最新，填写上方「开始日期」=区间回补该区间（结束日期留空=截至今天）</span>
				</div>
				<div class="sync-controls">
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
					区间回补按上方查询条件中的日期区间拉取所有行业K线并覆盖落库（已存在行更新、缺失行插入）；滚动同步仅增量补最新数据（首次全量历史130根）。
					「清空数据」按当前周期、以上方查询条件为范围物理删除（不可恢复，仅作用于当前周期的表，清空后可用同步按钮重新补数）；条件全部留空=清空该表全量，请谨慎操作。
				</div>
			</div>
			<div class="title-box">
				<span class="title">
					板块K线数据（{{ periodLabel }}）
					<span class="title-total">
						共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
					</span>
				</span>
			</div>
			<el-table v-loading="loading" :data="list" class="ofa-table">
				<el-table-column prop="SectorName" label="行业名称" min-width="130" align="center" fixed="left"></el-table-column>
				<el-table-column label="数据来源" min-width="90" align="center">
					<template #default="scope">{{ zdxDataSourceLabel(scope.row.DataSource) || '--' }}</template>
				</el-table-column>
				<el-table-column label="交易日期" min-width="110" align="center">
					<template #default="scope">{{ formatDate(scope.row.TradeDate) }}</template>
				</el-table-column>
				<el-table-column label="开盘点位" min-width="100" align="right">
					<template #default="scope">{{ formatNumber(scope.row.OpenPrice) }}</template>
				</el-table-column>
				<el-table-column label="收盘点位" min-width="100" align="right">
					<template #default="scope">{{ formatNumber(scope.row.ClosePrice) }}</template>
				</el-table-column>
				<el-table-column label="最高点位" min-width="100" align="right">
					<template #default="scope">{{ formatNumber(scope.row.HighPrice) }}</template>
				</el-table-column>
				<el-table-column label="最低点位" min-width="100" align="right">
					<template #default="scope">{{ formatNumber(scope.row.LowPrice) }}</template>
				</el-table-column>
				<el-table-column label="涨跌幅" min-width="100" align="center">
					<template #default="scope">
						<span :class="percentClass(scope.row.ChangePercent)">{{ formatPercent(scope.row.ChangePercent) }}</span>
					</template>
				</el-table-column>
				<el-table-column label="成交量(万手)" min-width="120" align="right">
					<template #default="scope">{{ formatNumber(scope.row.Volume) }}</template>
				</el-table-column>
				<el-table-column label="成交额(亿)" min-width="110" align="right">
					<template #default="scope">{{ formatNumber(scope.row.Amount) }}</template>
				</el-table-column>
				<el-table-column label="振幅(%)" min-width="90" align="right">
					<template #default="scope">{{ formatNumber(scope.row.Amplitude) }}</template>
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
			<span class="title">{{ isAdd ? '新增/补录' : '修正' }}{{ periodLabel }}数据</span>
		</template>
		<el-form status-icon ref="sectorForm" :rules="validationRule" :model="entity" label-width="130px">
			<el-divider content-position="left">主键信息</el-divider>
			<el-form-item label="数据来源" prop="DataSource">
				<el-select v-if="isAdd" v-model="entity.DataSource" placeholder="选择数据来源（2=东财板块指数/4=腾讯行业指数）" style="width: 100%">
					<el-option v-for="item in ZDX_SECTOR_DATA_SOURCES" :key="item.value" :label="item.label" :value="item.value"></el-option>
				</el-select>
				<el-input v-else :model-value="zdxDataSourceLabel(entity.DataSource)" disabled></el-input>
			</el-form-item>
			<el-form-item label="行业名称" prop="SectorName">
				<el-select v-if="isAdd" v-model="entity.SectorName" filterable allow-create default-first-option
					placeholder="选择或输入行业名称（与板块行情数据名称口径一致）" style="width: 100%">
					<el-option v-for="item in sectorOptions" :key="item" :label="item" :value="item"></el-option>
				</el-select>
				<el-input v-else v-model="entity.SectorName" disabled></el-input>
			</el-form-item>
			<el-form-item label="交易日期" prop="TradeDate">
				<el-date-picker v-model="entity.TradeDate" type="date" placeholder="请选择交易日期" format="YYYY-MM-DD"
					value-format="YYYY-MM-DD" :disabled="!isAdd" :disabled-date="disabledFutureDate" style="width: 100%">
				</el-date-picker>
			</el-form-item>
			<el-divider content-position="left">行情数据</el-divider>
			<div class="row">
				<el-form-item label="开盘点位" prop="OpenPrice">
					<el-input-number v-model="entity.OpenPrice" :precision="2" :controls="false"></el-input-number>
				</el-form-item>
				<el-form-item label="收盘点位" prop="ClosePrice">
					<el-input-number v-model="entity.ClosePrice" :precision="2" :controls="false"></el-input-number>
				</el-form-item>
				<el-form-item label="最高点位" prop="HighPrice">
					<el-input-number v-model="entity.HighPrice" :precision="2" :controls="false"></el-input-number>
				</el-form-item>
				<el-form-item label="最低点位" prop="LowPrice">
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
				<el-form-item label="振幅(%)" prop="Amplitude">
					<el-input-number v-model="entity.Amplitude" :precision="2" :controls="false"></el-input-number>
				</el-form-item>
			</div>
		</el-form>
		<div class="footer">
			<el-button type="primary" @click="submit">提交</el-button>
			<el-button type="warning" @click="drawerVisiable = false">取消</el-button>
		</div>
	</el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { FormRules, ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import dayjs from '@/untils/dayjs'
import { IZdxSectorKlineData, IZdxSectorKlineDataForm, IZdxSectorKlineDataQuery, ZDX_SECTOR_KLINE_PERIODS, ZDX_SECTOR_DATA_SOURCES, ZDX_DATA_SOURCE, zdxDataSourceLabel } from '@/interfaces/zhiduoxing/IZdxSectorKlineData'
import { IZdxSyncProgress } from '@/interfaces/zhiduoxing/IZdxStockKlineData'
import { IBaseMessage } from '@/interfaces/IBaseMessage'
import API from '@/apis/zdx-api'

// 同步项（按钮固定周期；点击时按查询条件分流：填写开始日期=区间回补该区间，留空=滚动同步增量补最新）
interface SyncAction {
	key: string
	name: string
	period: string
	sync: (begin?: string, end?: string) => Promise<IBaseMessage>
}

const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const list = ref<IZdxSectorKlineData[]>([]) // 列表
const period = ref('day') // 当前周期（day/week/month）
const pageIndex = ref(1) // 页码
const pageSize = ref(20) // 每页数量
const drawerVisiable = ref(false) // 抽屉显示
const isAdd = ref(true) // 添加模式
const searchOption = ref({
	name: '', // 行业名称
	dataSource: undefined as number | undefined, // 数据来源（2=东财/4=腾讯，空=不限）
	begin: '', // 开始日期
	end: '' // 结束日期
}) // 搜索条件
const sectorOptions = ref<string[]>([]) // 行业名称下拉数据源（板块行情数据行业名单，与 zdx_sector.Name 口径一致）

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
const clearing = ref(false) // 清空数据操作进行中（请求在途）
const SYNC_ACTIONS: SyncAction[] = [
	{ key: 'sectordaily', name: '日K同步', period: 'day', sync: (begin, end) => API.syncZdxSectorDailyKline(begin, end) },
	{ key: 'sectorweekly', name: '周K同步', period: 'week', sync: (begin, end) => API.syncZdxSectorWeeklyKline(begin, end) },
	{ key: 'sectormonthly', name: '月K同步', period: 'month', sync: (begin, end) => API.syncZdxSectorMonthlyKline(begin, end) }
] // 手动同步项（任务键与后端一致，用于按钮加载态匹配）

// 实体（空值默认0，编辑时由行数据填充）
function emptyEntity(): IZdxSectorKlineData {
	return {
		DataSource: ZDX_DATA_SOURCE.EASTMONEY,
		SectorName: '',
		TradeDate: '',
		OpenPrice: 0,
		ClosePrice: 0,
		HighPrice: 0,
		LowPrice: 0,
		Volume: 0,
		Amount: 0,
		ChangePercent: 0,
		Amplitude: 0
	}
}
const entity = ref<IZdxSectorKlineData>(emptyEntity()) // 实体
const sectorForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
	DataSource: [{ required: true, message: '请选择数据来源', trigger: 'change' }],
	SectorName: [{ required: true, message: '请选择或输入行业名称', trigger: 'change' }],
	TradeDate: [{ required: true, message: '请先选择交易日期', trigger: 'change' }]
}) // 表单验证
// 当前周期名称
const periodLabel = computed(() => ZDX_SECTOR_KLINE_PERIODS.find(w => w.value === period.value)?.label ?? '')

onMounted(() => {
	// 默认查询最近一个月
	searchOption.value.begin = dayjs().subtract(1, 'month').format('YYYY-MM-DD')
	searchOption.value.end = dayjs().format('YYYY-MM-DD')
	get()
	getSectorOptions()
	resumeSyncProgress() // 恢复后台同步任务进度展示（若有任务执行中则继续轮询）
})

// 卸载时停止进度轮询（任务在服务端继续执行，重进页面经 resumeSyncProgress 恢复展示）
onBeforeUnmount(() => {
	stopSyncPolling()
})

// 获取列表
function get() {
	loading.value = true
	const form: IZdxSectorKlineDataQuery = {
		Name: searchOption.value.name,
		DataSource: searchOption.value.dataSource,
		Begin: searchOption.value.begin,
		End: searchOption.value.end
	}
	API.getSectorKlineDatas(period.value, form, pageIndex.value, pageSize.value).then(res => {
		list.value = res.Items
		total.value = res.Total
		loading.value = false
	})
}

// 获取行业名称下拉数据源（与板块行情数据行业名单口径一致；失败静默，不影响列表主体功能）
function getSectorOptions() {
	API.getMarketSectors().then(res => {
		sectorOptions.value = (res ?? []).map(e => e.Name)
	}).catch(() => {
		// 静默处理：下拉为空时仍可手工输入行业名称（allow-create）
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

// 数值千分位展示
function formatCount(value: number): string {
	return (value ?? 0).toLocaleString('zh-CN')
}

// 不能选择未来日期
function disabledFutureDate(date: Date) {
	return dayjs(date).isAfter(dayjs(), 'day')
}

// 显示添加抽屉（传入行为编辑模式，空为新增/补录）
function showDrawer(item?: IZdxSectorKlineData) {
	if (item) {
		isAdd.value = false
		entity.value = Object.assign(emptyEntity(), item, { TradeDate: formatDate(item.TradeDate) })
	} else {
		isAdd.value = true
		entity.value = emptyEntity()
	}
	drawerVisiable.value = true
}

// 提交（新增/补录为 upsert 语义；编辑仅可改数值，主键不可修改）
function submit() {
	sectorForm.value?.validate((valid: boolean) => {
		if (!valid) return

		const form: IZdxSectorKlineDataForm = {
			DataSource: entity.value.DataSource,
			SectorName: entity.value.SectorName.trim(),
			TradeDate: entity.value.TradeDate,
			OpenPrice: entity.value.OpenPrice ?? 0,
			ClosePrice: entity.value.ClosePrice ?? 0,
			HighPrice: entity.value.HighPrice ?? 0,
			LowPrice: entity.value.LowPrice ?? 0,
			Volume: entity.value.Volume ?? 0,
			Amount: entity.value.Amount ?? 0,
			ChangePercent: entity.value.ChangePercent ?? 0,
			Amplitude: entity.value.Amplitude ?? null
		}

		if (isAdd.value) {
			API.addSectorKlineData(period.value, form).then(res => {
				if (res.Status) {
					drawerVisiable.value = false
					get()
				}
			})
		} else {
			API.updateSectorKlineData(period.value, form).then(res => {
				if (res.Status) {
					drawerVisiable.value = false
					get()
				}
			})
		}
	})
}

// 删除
function del(item: IZdxSectorKlineData) {
	ElMessageBox.confirm(`确认要删除「${item.SectorName}」${formatDate(item.TradeDate)} 的${zdxDataSourceLabel(item.DataSource)}${periodLabel.value}记录？删除后不可恢复，请谨慎操作！`, '敏感操作提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	}).then(() => {
		API.delSectorKlineData(period.value, item.SectorName, formatDate(item.TradeDate), item.DataSource).then(res => {
			if (res.Status) get()
		})
	})
}

// 执行手动同步（点击时按查询条件分流：填写开始日期=区间回补该区间；留空=滚动同步增量补最新；任务后台异步执行，进度条轮询刷新）
async function runSync(item: SyncAction) {
	if (syncBusy.value) return
	const begin = searchOption.value.begin
	let end = searchOption.value.end
	if (!begin && end) {
		ElMessage.warning('仅填结束日期无法确定同步范围，请填写开始日期或两者全部留空（滚动增量补最新）')
		return
	}
	if (begin && !end) end = dayjs().format('YYYY-MM-DD') // 只填开始日期时结束日期补到今天
	if (begin && end && dayjs(begin).isAfter(dayjs(end), 'day')) {
		ElMessage.warning('开始日期不能晚于结束日期')
		return
	}
	const scopeTip = begin
		? `范围：区间回补 ${begin} ~ ${end}（按数据来源+行业+日期分行存底、同来源已存在行覆盖更新；东财/腾讯双渠道各拉各的互不覆盖，超出各渠道可取历史深度的部分无法回补）。`
		: '范围：滚动增量补最新数据（上方日期区间不参与）。'

	try {
		await ElMessageBox.confirm(
			`确认执行「${item.name}」？${scopeTip}任务提交后在服务端后台执行，可离开页面，进度自动刷新。`,
			'手动同步提示',
			{ type: 'warning', cancelButtonText: '放弃操作' }
		)
	} catch {
		return // 用户取消
	}

	await startBackgroundSync(() => item.sync(begin || undefined, begin ? end : undefined), item.key)
}

// 清空数据（按上方查询条件批量物理删除当前周期的表数据；条件全部留空=清空该表全量；完成后刷新列表）
async function runClear() {
	if (syncBusy.value || clearing.value) return
	const name = searchOption.value.name
	const dataSource = searchOption.value.dataSource
	const begin = searchOption.value.begin
	const end = searchOption.value.end
	if (begin && end && dayjs(begin).isAfter(dayjs(end), 'day')) {
		ElMessage.warning('开始日期不能晚于结束日期')
		return
	}
	const sourceTip = dataSource ? `${zdxDataSourceLabel(dataSource)}渠道` : '全部渠道'
	const scopeTip = !name && !dataSource && !begin && !end
		? '未填写行业名称/数据来源/日期区间，将清空该表全部数据'
		: `范围：行业名称 ${name || '全部'}；数据来源 ${sourceTip}；日期区间 ${begin ? `${begin} ~ ${end || '不限'}` : (end ? `不限 ~ ${end}` : '不限')}`
	try {
		await ElMessageBox.confirm(
			`确认清空「${periodLabel.value}」数据？${scopeTip}。删除后不可恢复（可用同步按钮重新补数），请谨慎操作！`,
			'清空数据提示',
			{ type: 'warning', cancelButtonText: '放弃操作' }
		)
	} catch {
		return // 用户取消
	}

	clearing.value = true
	try {
		const res = await API.clearSectorKlineDatas(period.value, { Name: name, DataSource: dataSource, Begin: begin, End: end })
		if (res.Status) get()
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

// 拉取同步进度（任务从执行中转为结束时：刷新列表并弹出结果通知；first=本轮轮询的首个请求）
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
.sector-kline-page {
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
</style>
