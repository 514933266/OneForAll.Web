<template>
	<el-container class="stock-data-page">
		<el-header class="header">
			<span>
				<span class="search-box">
					<el-input v-model.trim="searchOption.keyword" placeholder="股票代码/名称" style="width: 200px"
						class="ofa-mr10" @keyup.enter="search">
						<template #prefix>
							<font-awesome-icon fas icon="search"></font-awesome-icon>
						</template>
					</el-input>
					<el-select v-model="searchOption.marketType" style="width: 140px" class="ofa-mr10">
						<el-option :value="-1" label="全部板块"></el-option>
						<el-option v-for="item in ZDX_STOCK_MARKET_TYPES" :key="item.value" :label="item.label"
							:value="item.value"></el-option>
					</el-select>
					<el-select v-model="searchOption.dataSource" style="width: 140px" class="ofa-mr10">
						<el-option :value="-1" label="全部来源"></el-option>
						<el-option :value="2" label="东财"></el-option>
						<el-option :value="4" label="腾讯"></el-option>
						<el-option :value="3" label="人工维护"></el-option>
					</el-select>
					<!-- 交易状态筛选（池同步自动维护；-1=不限） -->
					<el-select v-model="searchOption.tradeStatus" style="width: 120px" class="ofa-mr10">
						<el-option :value="-1" label="全部状态"></el-option>
						<el-option v-for="item in ZDX_STOCK_TRADE_STATUSES" :key="item.value" :label="item.label"
							:value="item.value"></el-option>
					</el-select>
					<el-button @click="search" type="primary" class="ofa-mr10">
						<font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
					</el-button>
				</span>
			</span>
			<span class="button-box">
				<el-button @click="showDrawer()" type="primary">
					<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增股票
				</el-button>
			</span>
		</el-header>
		<el-main class="content">
			<!-- 手动数据同步区 -->
			<div class="sync-box">
				<div class="sync-head">
					<span class="sync-title">手动数据同步</span>
					<span class="sync-tip">对接腾讯行情快照优先（东财全市场列表降为低频兜底，仅用于新股入库与退市复核）；数量留空为全量执行（全池耗时可能较长），执行结果将弹窗展示</span>
				</div>
				<div class="sync-controls">
					<el-input-number v-model="syncLimit" :min="0" :precision="0" :controls="false" :disabled="syncing"
						placeholder="数量(空=全量)" style="width: 150px"></el-input-number>
					<el-button v-for="item in SYNC_ACTIONS" :key="item.key" type="primary" plain
						:loading="syncing && syncKey === item.key" :disabled="syncing && syncKey !== item.key"
						@click="runSync(item)">
						{{ item.name }}
					</el-button>
				</div>
			</div>
			<div class="title-box">
				<span class="title">
					股票基础数据
					<span class="title-total">
						共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
					</span>
				</span>
			</div>
			<el-table v-loading="loading" :data="list" class="ofa-table">
				<el-table-column prop="Code" label="代码" width="90" align="center" fixed="left"></el-table-column>
				<el-table-column prop="Name" label="名称" width="110"></el-table-column>
				<el-table-column label="简称" width="100">
					<template #default="scope">{{ scope.row.ShortName || '--' }}</template>
				</el-table-column>
				<el-table-column label="板块" width="100" align="center">
					<template #default="scope">{{ getMarketTypeText(scope.row.MarketType) }}</template>
				</el-table-column>
				<el-table-column label="行业" width="110">
					<template #default="scope">{{ scope.row.Sector || '--' }}</template>
				</el-table-column>
				<el-table-column label="标记" width="110" align="center">
					<template #default="scope">
						<el-tag v-if="scope.row.IsSpecialST" type="danger" size="small" class="ofa-mr4">*ST</el-tag>
						<el-tag v-else-if="scope.row.IsST" type="warning" size="small" class="ofa-mr4">ST</el-tag>
						<el-tag v-if="scope.row.IsLeader" type="primary" size="small">龙头</el-tag>
						<span v-if="!scope.row.IsST && !scope.row.IsSpecialST && !scope.row.IsLeader">--</span>
					</template>
				</el-table-column>
				<el-table-column label="状态" width="80" align="center">
					<template #default="scope">
						<el-tag :type="getTradeStatus(scope.row.TradeStatus).tag" size="small">
							{{ getTradeStatus(scope.row.TradeStatus).label }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="最新价" width="90" align="right">
					<template #default="scope">{{ scope.row.Price > 0 ? scope.row.Price.toFixed(2) : '--' }}</template>
				</el-table-column>
				<el-table-column label="涨跌幅" width="90" align="right">
					<template #default="scope">
						<span :class="percentClass(scope.row.ChangePercent)">{{ formatPercent(scope.row.ChangePercent) }}</span>
					</template>
				</el-table-column>
				<el-table-column label="数据来源" width="110" align="center">
					<template #default="scope">
						<el-tag :type="getSource(scope.row.DataSource).tag">{{ getSource(scope.row.DataSource).label }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="修改人" width="100" align="center">
					<template #default="scope">{{ scope.row.Modifier || '--' }}</template>
				</el-table-column>
				<el-table-column label="修改时间" width="160" align="center">
					<template #default="scope">{{ scope.row.ModifyTime || '--' }}</template>
				</el-table-column>
				<el-table-column label="操作" width="130" align="center" header-align="center" fixed="right">
					<template #default="scope">
						<el-button link type="primary" @click="showDrawer(scope.row)">修改</el-button>
						<el-button link type="danger" @click="del(scope.row)">删除</el-button>
					</template>
				</el-table-column>
			</el-table>
			<el-pagination background layout="total, sizes, prev, pager, next, jumper" v-model:current-page="pageIndex"
				:page-sizes="[10, 20, 50, 100]" v-model:page-size="pageSize" :total="total"
				@size-change="pageSizeChange" @current-change="pageIndexChange">
			</el-pagination>
		</el-main>
	</el-container>
	<!-- 表单 -->
	<el-drawer v-model="drawerVisiable" :modal="false" :show-close="false" direction="rtl" size="660" class="ofa-drawer">
		<template #header>
			<span class="title">{{ isAdd ? '新增' : '修改' }}股票基础数据</span>
		</template>
		<el-form status-icon ref="stockForm" :rules="validationRule" :model="entity" label-width="130px">
			<el-divider content-position="left">基础信息</el-divider>
			<el-form-item label="股票代码" prop="Code">
				<el-input v-model.trim="entity.Code" placeholder="6位数字，如 600000" :disabled="!isAdd"></el-input>
			</el-form-item>
			<el-form-item label="股票名称" prop="Name">
				<el-input v-model.trim="entity.Name" placeholder="股票全称，如 浦发银行"></el-input>
			</el-form-item>
			<el-form-item label="股票简称" prop="ShortName">
				<el-input v-model.trim="entity.ShortName" placeholder="可为空"></el-input>
			</el-form-item>
			<div class="row">
				<el-form-item label="所属板块" prop="MarketType">
					<el-select v-model="entity.MarketType">
						<el-option v-for="item in ZDX_STOCK_MARKET_TYPES" :key="item.value" :label="item.label"
							:value="item.value"></el-option>
					</el-select>
				</el-form-item>
				<el-form-item label="上市时间" prop="IpoDate">
					<el-date-picker v-model="entity.IpoDate" type="date" placeholder="可为空" format="YYYY-MM-DD"
						value-format="YYYY-MM-DD"></el-date-picker>
				</el-form-item>
			</div>
			<el-form-item label="所属行业" prop="Sector">
				<el-input v-model.trim="entity.Sector" placeholder="行业板块，可为空"></el-input>
			</el-form-item>
			<el-form-item label="公司描述" prop="Description">
				<el-input type="textarea" :rows="4" v-model="entity.Description" placeholder="公司简介，可为空"></el-input>
			</el-form-item>
			<el-divider content-position="left">状态标记</el-divider>
			<div class="row">
				<el-form-item label="是否ST">
					<el-switch v-model="entity.IsST"></el-switch>
				</el-form-item>
				<el-form-item label="是否*ST">
					<el-switch v-model="entity.IsSpecialST"></el-switch>
				</el-form-item>
				<el-form-item label="是否龙头股">
					<el-switch v-model="entity.IsLeader"></el-switch>
				</el-form-item>
			</div>
			<el-alert v-if="!isAdd" title="修改后数据来源将标记为人工维护，同步任务不再覆盖该股票的基础信息" type="warning"
				:closable="false" show-icon></el-alert>
		</el-form>
		<div class="footer">
			<el-button type="primary" @click="submit">提交</el-button>
			<el-button type="warning" @click="drawerVisiable = false">取消</el-button>
		</div>
	</el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { FormRules, ElMessageBox, FormInstance } from 'element-plus'
import { IZdxStockData, IZdxStockDataForm, IZdxStockDataQuery, ZDX_STOCK_MARKET_TYPES, ZDX_STOCK_DATA_SOURCES, ZDX_STOCK_TRADE_STATUSES } from '@/interfaces/zhiduoxing/IZdxStockData'
import { IBaseMessage } from '@/interfaces/IBaseMessage'
import API from '@/apis/zdx-api'

// 同步项（limit 为是否支持数量限制；数量留空为全量执行）
interface SyncAction {
	key: string
	name: string
	limit: boolean
	run: (limit?: number) => Promise<IBaseMessage>
}

const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(20) // 页数
const drawerVisiable = ref(false) // 抽屉显示
const isAdd = ref(true) // 添加模式
const list = ref<IZdxStockData[]>([]) // 列表
const searchOption = ref({
	keyword: '', // 关键字
	marketType: -1, // 板块（-1=不限）
	dataSource: -1, // 来源（-1=不限；2=东财 3=人工维护 4=腾讯）
	tradeStatus: -1 // 交易状态（-1=不限；0=正常 1=停牌 2=退市）
}) // 搜索条件

// 手动同步
const syncing = ref(false) // 同步执行中
const syncKey = ref('') // 正在执行的同步项
const syncLimit = ref<number>() // 限制数量（空=全量）
const SYNC_ACTIONS: SyncAction[] = [
	{ key: 'pool', name: '股票池同步', limit: true, run: (limit?: number) => API.syncZdxPool(limit) },
	{ key: 'snapshot', name: '快照同步', limit: true, run: (limit?: number) => API.syncZdxSnapshot(limit) }
] // 手动同步项（仅股票池/快照相关；K线同步在K线数据页，大盘/指数同步在行情数据页）

// 实体
function emptyEntity(): IZdxStockDataForm {
	return Object.assign({
		Id: undefined,
		Code: '',
		Name: '',
		ShortName: '',
		MarketType: 0,
		Sector: '',
		IpoDate: null,
		Description: '',
		IsST: false,
		IsSpecialST: false,
		IsLeader: false
	})
}
const entity = ref<IZdxStockDataForm>(emptyEntity()) // 实体
const stockForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
	Code: [
		{ required: true, message: '请先填写股票代码', trigger: 'blur' },
		{ pattern: /^\d{6}$/, message: '股票代码为6位数字', trigger: 'blur' }
	],
	Name: [{ required: true, message: '请先填写股票名称', trigger: 'blur' }]
}) // 表单验证

onMounted(() => {
	get()
})

// 获取列表
function get() {
	loading.value = true
	const form: IZdxStockDataQuery = {
		Keyword: searchOption.value.keyword,
		MarketType: searchOption.value.marketType >= 0 ? searchOption.value.marketType : undefined,
		DataSource: searchOption.value.dataSource >= 0 ? searchOption.value.dataSource : undefined,
		TradeStatus: searchOption.value.tradeStatus >= 0 ? searchOption.value.tradeStatus : undefined
	}
	API.getPageStockDatas(form, pageIndex.value, pageSize.value).then(res => {
		list.value = res.Items
		total.value = res.Total
		loading.value = false
	})
}

// 搜索
function search() {
	pageIndex.value = 1
	nextTick(() => get())
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

// 板块展示
function getMarketTypeText(value: number): string {
	return ZDX_STOCK_MARKET_TYPES.find(w => w.value === value)?.label ?? '--'
}

// 数据来源展示
function getSource(value: number) {
	return ZDX_STOCK_DATA_SOURCES.find(w => w.value === value) ?? { value: 0, label: '未知', tag: 'info' }
}

// 交易状态展示（池同步自动维护；0=正常 1=停牌 2=退市）
function getTradeStatus(value: number) {
	return ZDX_STOCK_TRADE_STATUSES.find(w => w.value === value) ?? { value: 0, label: '未知', tag: 'info' }
}

// 涨跌幅格式（+1.23% / -1.23% / 0.00%）
function formatPercent(value: number): string {
	const v = value ?? 0
	return (v > 0 ? '+' : '') + v.toFixed(2) + '%'
}

// 涨红跌绿
function percentClass(value: number): string {
	if (value > 0) return 'up'
	if (value < 0) return 'down'
	return ''
}

// 显示添加抽屉（传入行为编辑模式，空为新增）
function showDrawer(item?: IZdxStockData) {
	if (item) {
		isAdd.value = false
		entity.value = Object.assign(emptyEntity(), {
			Id: item.Id,
			Code: item.Code,
			Name: item.Name,
			ShortName: item.ShortName ?? '',
			MarketType: item.MarketType,
			Sector: item.Sector ?? '',
			IpoDate: item.IpoDate ? item.IpoDate.substring(0, 10) : null,
			Description: item.Description ?? '',
			IsST: item.IsST,
			IsSpecialST: item.IsSpecialST,
			IsLeader: item.IsLeader
		})
	} else {
		isAdd.value = true
		entity.value = emptyEntity()
		nextTick(() => {
			stockForm.value?.resetFields()
		})
	}
	drawerVisiable.value = true
}

// 提交（新增/修改后服务端标记人工维护；代码不可修改）
function submit() {
	stockForm.value?.validate((valid: boolean) => {
		if (!valid) return

		const form: IZdxStockDataForm = {
			Id: entity.value.Id,
			Code: entity.value.Code,
			Name: entity.value.Name,
			ShortName: entity.value.ShortName,
			MarketType: entity.value.MarketType,
			Sector: entity.value.Sector,
			IpoDate: entity.value.IpoDate || null,
			Description: entity.value.Description,
			IsST: entity.value.IsST,
			IsSpecialST: entity.value.IsSpecialST,
			IsLeader: entity.value.IsLeader
		}

		if (isAdd.value) {
			API.addStockData(form).then(res => {
				if (res.Status) {
					drawerVisiable.value = false
					get()
				}
			})
		} else {
			API.updateStockData(form.Id!, form).then(res => {
				if (res.Status) {
					drawerVisiable.value = false
					get()
				}
			})
		}
	})
}

// 删除
function del(item: IZdxStockData) {
	ElMessageBox.confirm(`确认要删除股票 ${item.Code} ${item.Name}？仅删除本地记录，同步任务再次采集到该股票时会重新入库。`, '敏感操作提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	}).then(() => {
		API.delStockData(item.Id).then(res => {
			if (res.Status) get()
		})
	})
}

// 执行手动同步（确认后执行；成功/失败信息由响应拦截器统一弹出通知，执行后刷新列表）
async function runSync(item: SyncAction) {
	if (syncing.value) return

	const limit = syncLimit.value
	const withLimit = item.limit && typeof limit === 'number' && limit > 0
	try {
		await ElMessageBox.confirm(
			`确认执行「${item.name}」${withLimit ? `（限定 ${limit} 只）` : '（全量，耗时可能较长，请耐心等待）'}？`,
			'手动同步提示',
			{ type: 'warning', cancelButtonText: '放弃操作' }
		)
	} catch {
		return // 用户取消
	}

	syncing.value = true
	syncKey.value = item.key
	try {
		await item.run(withLimit ? limit : undefined)
		get()
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		syncing.value = false
		syncKey.value = ''
	}
}
</script>

<style lang="scss" scoped>
.stock-data-page {
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
