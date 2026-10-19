<template>
	<el-container class="market-data-page">
		<el-main class="content">
			<!-- 手动数据同步区 -->
			<div class="sync-box">
				<div class="sync-head">
					<span class="sync-title">手动数据同步</span>
					<span class="sync-tip">大盘成交额/成交量取腾讯两市指数快照优先、东财汇总兜底（含 AI 解读生成），涨跌家数腾讯不提供时按本地股票池快照统计，指数行情同步对接腾讯行情（四大指数快照+当日分时），行业行情同步仍对接东财板块口径（行业快照提供涨跌家数，未匹配行业以股票池等权聚合兜底）；行业K线取数已改为腾讯行业指数优先；指数K线/板块K线同步请在对应K线菜单页执行；执行结果将弹窗展示</span>
				</div>
				<div class="sync-controls">
					<el-button v-for="item in SYNC_ACTIONS" :key="item.key" type="primary" plain
						:loading="syncing && syncKey === item.key" :disabled="syncing && syncKey !== item.key"
						@click="runSync(item)">
						{{ item.name }}
					</el-button>
				</div>
			</div>
			<!-- 数据列表（Tab 切换：大盘行情 / 行业行情，避免双表格上下堆叠需长滚动） -->
			<el-tabs v-model="activeTab" class="data-tabs">
				<!-- 大盘行情（每日大盘整体数据统计快照；支持日期筛选与人工补录/修正） -->
				<el-tab-pane label="大盘行情" name="daily">
					<div class="title-box">
						<span class="title">
							每日大盘行情数据
							<span class="title-total">
								共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
							</span>
						</span>
						<span class="tab-tools">
							<el-date-picker v-model="searchOption.begin" type="date" placeholder="开始日期" format="YYYY-MM-DD"
								value-format="YYYY-MM-DD" style="width: 180px" class="ofa-mr10"></el-date-picker>
							<el-date-picker v-model="searchOption.end" type="date" placeholder="结束日期" format="YYYY-MM-DD"
								value-format="YYYY-MM-DD" style="width: 180px" class="ofa-mr10"></el-date-picker>
							<el-button @click="search" type="primary" class="ofa-mr10">
								<font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
							</el-button>
							<el-button @click="showDrawer()" type="primary">
								<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增/补录
							</el-button>
						</span>
					</div>
					<el-table v-loading="loading" :data="list" class="ofa-table">
						<el-table-column label="交易日期" width="120" align="center" fixed="left">
							<template #default="scope">{{ formatDate(scope.row.TradeDate) }}</template>
						</el-table-column>
						<el-table-column prop="Amount" label="成交额(亿)" width="110" align="right"></el-table-column>
						<el-table-column prop="Volume" label="成交量(亿手)" width="110" align="right"></el-table-column>
						<el-table-column prop="UpCount" label="上涨" width="90" align="center"></el-table-column>
						<el-table-column prop="DownCount" label="下跌" width="90" align="center"></el-table-column>
						<el-table-column prop="FlatCount" label="平盘" width="90" align="center"></el-table-column>
						<el-table-column prop="LimitUpCount" label="涨停" width="90" align="center">
							<template #default="scope">
								<el-text type="danger">{{ scope.row.LimitUpCount }}</el-text>
							</template>
						</el-table-column>
						<el-table-column prop="LimitDownCount" label="跌停" width="90" align="center">
							<template #default="scope">
								<el-text type="success">{{ scope.row.LimitDownCount }}</el-text>
							</template>
						</el-table-column>
						<el-table-column label="数据来源" width="110" align="center">
							<template #default="scope">
								<el-tag :type="getSource(scope.row.DataSource).tag">{{ getSource(scope.row.DataSource).label }}</el-tag>
							</template>
						</el-table-column>
						<el-table-column label="修改人" width="110" align="center">
							<template #default="scope">{{ scope.row.Modifier || '--' }}</template>
						</el-table-column>
						<el-table-column prop="UpdateTime" label="更新时间" width="170" align="center"></el-table-column>
						<el-table-column label="操作" width="130" align="center" header-align="center" fixed="right">
							<template #default="scope">
								<el-button link type="primary" @click="showDrawer(scope.row)">修改</el-button>
								<el-button link type="danger" @click="del(scope.row)">删除</el-button>
							</template>
						</el-table-column>
					</el-table>
				</el-tab-pane>
				<!-- 行业行情（原板块数据管理页并入：只读库内行业行情快照，按涨跌幅降序；同步按钮见上方「行业行情同步」） -->
				<el-tab-pane label="行业行情" name="sector">
					<div class="title-box">
						<span class="title">
							行业行情数据
							<span class="title-total">
								共有<el-text type="primary">&nbsp;{{ filteredSectors.length }}&nbsp;</el-text>条数据
							</span>
						</span>
						<span class="tab-tools">
							<el-input v-model.trim="sectorKeyword" placeholder="行业名称" clearable style="width: 200px" class="ofa-mr10">
								<template #prefix>
									<font-awesome-icon fas icon="search"></font-awesome-icon>
								</template>
							</el-input>
							<el-button @click="getSectors" type="primary">
								<font-awesome-icon fas icon="refresh"></font-awesome-icon>&nbsp;刷新
							</el-button>
						</span>
					</div>
					<el-table v-loading="sectorLoading" :data="filteredSectors" class="ofa-table">
						<el-table-column prop="Name" label="行业名称" width="200" fixed="left"></el-table-column>
						<el-table-column label="指数点位" width="140" align="right">
							<template #default="scope">{{ scope.row.Value != null ? scope.row.Value.toFixed(2) : '--' }}</template>
						</el-table-column>
						<el-table-column label="涨跌幅" width="120" align="right">
							<template #default="scope">
								<span :class="percentClass(scope.row.Change)">{{ formatPercent(scope.row.Change) }}</span>
							</template>
						</el-table-column>
						<el-table-column prop="Up" label="上涨(家)" width="110" align="center">
							<template #default="scope">
								<el-text type="danger">{{ scope.row.Up }}</el-text>
							</template>
						</el-table-column>
						<el-table-column prop="Flat" label="平盘(家)" width="110" align="center"></el-table-column>
						<el-table-column prop="Down" label="下跌(家)" width="110" align="center">
							<template #default="scope">
								<el-text type="success">{{ scope.row.Down }}</el-text>
							</template>
						</el-table-column>
						<el-table-column prop="Total" label="成份总数" width="110" align="center"></el-table-column>
					</el-table>
				</el-tab-pane>
			</el-tabs>
		</el-main>
	</el-container>
	<!-- 表单 -->
	<el-drawer v-model="drawerVisiable" :modal="false" :show-close="false" direction="rtl" size="660" class="ofa-drawer">
		<template #header>
			<span class="title">{{ isAdd ? '新增/补录' : '修正' }}大盘行情</span>
		</template>
		<el-form status-icon ref="dailyForm" :rules="validationRule" :model="entity" label-width="130px">
			<el-divider content-position="left">基本信息</el-divider>
			<el-form-item label="交易日期" prop="TradeDate">
				<el-date-picker v-model="entity.TradeDate" type="date" placeholder="请选择交易日期" format="YYYY-MM-DD"
					value-format="YYYY-MM-DD" :disabled="!isAdd" :disabled-date="disabledFutureDate" style="width: 100%">
				</el-date-picker>
			</el-form-item>
			<el-form-item label="成交额(亿元)" prop="Amount">
				<el-input-number v-model="entity.Amount" :min="0" :precision="2" :controls="false"
					placeholder="沪深两市合计成交额" style="width: 100%"></el-input-number>
			</el-form-item>
			<el-form-item label="成交量(亿手)" prop="Volume">
				<el-input-number v-model="entity.Volume" :min="0" :precision="2" :controls="false"
					placeholder="沪深两市合计成交量" style="width: 100%"></el-input-number>
			</el-form-item>
			<el-divider content-position="left">涨跌家数</el-divider>
			<div class="row">
				<el-form-item label="上涨(家)" prop="UpCount">
					<el-input-number v-model="entity.UpCount" :min="0" :controls="false"></el-input-number>
				</el-form-item>
				<el-form-item label="下跌(家)" prop="DownCount">
					<el-input-number v-model="entity.DownCount" :min="0" :controls="false"></el-input-number>
				</el-form-item>
				<el-form-item label="平盘(家)" prop="FlatCount">
					<el-input-number v-model="entity.FlatCount" :min="0" :controls="false"></el-input-number>
				</el-form-item>
				<el-form-item label="涨停(家)" prop="LimitUpCount">
					<el-input-number v-model="entity.LimitUpCount" :min="0" :controls="false"></el-input-number>
				</el-form-item>
				<el-form-item label="跌停(家)" prop="LimitDownCount">
					<el-input-number v-model="entity.LimitDownCount" :min="0" :controls="false"></el-input-number>
				</el-form-item>
			</div>
			<el-divider content-position="left">涨跌分布</el-divider>
			<div class="row">
				<el-form-item label="涨幅5%以上(家)" prop="UpGt5Count">
					<el-input-number v-model="entity.UpGt5Count" :min="0" :controls="false"></el-input-number>
				</el-form-item>
				<el-form-item label="涨幅1~5%(家)" prop="Up1To5Count">
					<el-input-number v-model="entity.Up1To5Count" :min="0" :controls="false"></el-input-number>
				</el-form-item>
				<el-form-item label="涨幅0~1%(家)" prop="Up0To1Count">
					<el-input-number v-model="entity.Up0To1Count" :min="0" :controls="false"></el-input-number>
				</el-form-item>
				<el-form-item label="跌幅0~1%(家)" prop="Down0To1Count">
					<el-input-number v-model="entity.Down0To1Count" :min="0" :controls="false"></el-input-number>
				</el-form-item>
				<el-form-item label="跌幅1~5%(家)" prop="Down1To5Count">
					<el-input-number v-model="entity.Down1To5Count" :min="0" :controls="false"></el-input-number>
				</el-form-item>
				<el-form-item label="跌幅5%以上(家)" prop="DownGt5Count">
					<el-input-number v-model="entity.DownGt5Count" :min="0" :controls="false"></el-input-number>
				</el-form-item>
			</div>
			<el-divider content-position="left">AI 解读</el-divider>
			<el-form-item label="AI 行情解读" prop="AiAnalysis">
				<el-input type="textarea" :rows="6" v-model="entity.AiAnalysis"
					placeholder="收盘后自动生成；人工修正时直接覆盖，留空表示不修改"></el-input>
			</el-form-item>
		</el-form>
		<div class="footer">
			<el-button type="primary" @click="submit">提交</el-button>
			<el-button type="warning" @click="drawerVisiable = false">取消</el-button>
		</div>
	</el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { FormRules, ElMessageBox, FormInstance } from 'element-plus'
import dayjs from '@/untils/dayjs'
import { formatPercent } from '@/consts/zhiduoxing-const'
import { IZdxMarketDaily, IZdxMarketDailyForm, ZDX_MARKET_DATA_SOURCES } from '@/interfaces/zhiduoxing/IZdxMarketDaily'
import { IZdxSectorSummary } from '@/interfaces/zhiduoxing/IZdxStockQuote'
import { IBaseMessage } from '@/interfaces/IBaseMessage'
import API from '@/apis/zdx-api'

// 同步项
interface SyncAction {
	key: string
	name: string
	run: () => Promise<IBaseMessage>
}

const activeTab = ref('daily') // 当前 Tab（daily=大盘行情 / sector=行业行情）
const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const drawerVisiable = ref(false) // 抽屉显示
const isAdd = ref(true) // 添加模式
const list = ref<IZdxMarketDaily[]>([]) // 列表
const searchOption = ref({
	begin: '', // 开始日期
	end: '' // 结束日期
}) // 搜索条件

// 行业行情数据（原板块数据管理页并入：只读库内行业行情快照，按涨跌幅降序）
const sectorLoading = ref(false) // 行业行情加载中
const sectorKeyword = ref('') // 行业名称关键字（本地过滤）
const sectors = ref<IZdxSectorSummary[]>([]) // 行业行情列表
// 行业关键字过滤（本地）
const filteredSectors = computed(() => {
	const text = sectorKeyword.value.trim()
	if (!text) return sectors.value
	return sectors.value.filter(e => e.Name?.includes(text))
})

// 手动同步
const syncing = ref(false) // 同步执行中
const syncKey = ref('') // 正在执行的同步项
const SYNC_ACTIONS: SyncAction[] = [
	{ key: 'marketDaily', name: '大盘同步', run: () => API.syncZdxMarketDaily() },
	{ key: 'market', name: '指数行情同步', run: () => API.syncZdxMarket() },
	{ key: 'sector', name: '行业行情同步', run: () => API.syncZdxSector() }
] // 手动同步项（大盘/指数快照/行业快照；股票池/快照同步在股票信息页，个股K线同步在K线数据页，指数K线/板块K线同步在对应K线菜单页）

// 实体（空值默认0，编辑时由行数据填充）
function emptyEntity(): IZdxMarketDaily {
	return Object.assign({
		TradeDate: '',
		Amount: 0,
		Volume: 0,
		UpCount: 0,
		DownCount: 0,
		FlatCount: 0,
		LimitUpCount: 0,
		UpGt5Count: 0,
		Up1To5Count: 0,
		Up0To1Count: 0,
		Down0To1Count: 0,
		Down1To5Count: 0,
		DownGt5Count: 0,
		LimitDownCount: 0,
		DataSource: 3,
		AiAnalysis: '',
		UpdateTime: ''
	})
}
const entity = ref<IZdxMarketDaily>(emptyEntity()) // 实体
const dailyForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
	TradeDate: [{ required: true, message: '请先选择交易日期', trigger: 'change' }]
}) // 表单验证

onMounted(() => {
	// 默认查询最近一个月
	searchOption.value.begin = dayjs().subtract(1, 'month').format('YYYY-MM-DD')
	searchOption.value.end = dayjs().format('YYYY-MM-DD')
	get()
	getSectors()
})

// 获取列表
function get() {
	loading.value = true
	API.getMarketDailys(searchOption.value.begin, searchOption.value.end).then(res => {
		list.value = res
		total.value = res.length
		loading.value = false
	})
}

// 搜索
function search() {
	get()
}

// 获取行业行情列表（只读库内行业行情快照，按涨跌幅降序；失败信息由响应拦截器统一弹出通知）
async function getSectors() {
	sectorLoading.value = true
	try {
		const res = await API.getMarketSectors()
		sectors.value = res ?? []
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		sectorLoading.value = false
	}
}

// 行业涨跌颜色（涨红跌绿）
function percentClass(value: number): string {
	if (value > 0) return 'up'
	if (value < 0) return 'down'
	return ''
}

// 日期展示（yyyy-MM-dd HH:mm:ss → yyyy-MM-dd）
function formatDate(value: string): string {
	return value ? value.substring(0, 10) : ''
}

// 数据来源展示
function getSource(value: number) {
	return ZDX_MARKET_DATA_SOURCES.find(w => w.value === value) ?? { value: 0, label: '未知', tag: 'info' }
}

// 不能选择未来日期
function disabledFutureDate(date: Date) {
	return dayjs(date).isAfter(dayjs(), 'day')
}

// 显示添加抽屉（传入行为编辑模式，空为新增/补录）
function showDrawer(item?: IZdxMarketDaily) {
	if (item) {
		isAdd.value = false
		entity.value = Object.assign(emptyEntity(), item, {
			TradeDate: formatDate(item.TradeDate),
			AiAnalysis: item.AiAnalysis ?? ''
		})
	} else {
		isAdd.value = true
		entity.value = emptyEntity()
	}
	drawerVisiable.value = true
}

// 提交（新增/补录为 upsert 语义；编辑仅可改数值与解读，日期不可改）
function submit() {
	dailyForm.value?.validate((valid: boolean) => {
		if (!valid) return

		const form: IZdxMarketDailyForm = {
			TradeDate: entity.value.TradeDate,
			Amount: entity.value.Amount ?? 0,
			Volume: entity.value.Volume ?? 0,
			UpCount: entity.value.UpCount ?? 0,
			DownCount: entity.value.DownCount ?? 0,
			FlatCount: entity.value.FlatCount ?? 0,
			LimitUpCount: entity.value.LimitUpCount ?? 0,
			UpGt5Count: entity.value.UpGt5Count ?? 0,
			Up1To5Count: entity.value.Up1To5Count ?? 0,
			Up0To1Count: entity.value.Up0To1Count ?? 0,
			Down0To1Count: entity.value.Down0To1Count ?? 0,
			Down1To5Count: entity.value.Down1To5Count ?? 0,
			DownGt5Count: entity.value.DownGt5Count ?? 0,
			LimitDownCount: entity.value.LimitDownCount ?? 0,
			AiAnalysis: entity.value.AiAnalysis
		}

		if (isAdd.value) {
			API.addMarketDaily(form).then(res => {
				if (res.Status) {
					drawerVisiable.value = false
					get()
				}
			})
		} else {
			API.updateMarketDaily(form.TradeDate, form).then(res => {
				if (res.Status) {
					drawerVisiable.value = false
					get()
				}
			})
		}
	})
}

// 删除
function del(item: IZdxMarketDaily) {
	const tradeDate = formatDate(item.TradeDate)
	ElMessageBox.confirm(`确认要删除 ${tradeDate} 的大盘行情记录？删除后不可恢复，请谨慎操作！`, '敏感操作提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	}).then(() => {
		API.delMarketDaily(tradeDate).then(res => {
			if (res.Status) get()
		})
	})
}

// 执行手动同步（确认后执行；成功/失败信息由响应拦截器统一弹出通知，执行后刷新列表）
async function runSync(item: SyncAction) {
	if (syncing.value) return

	try {
		await ElMessageBox.confirm(`确认执行「${item.name}」？执行耗时可能较长，请耐心等待。`, '手动同步提示', {
			type: 'warning',
			cancelButtonText: '放弃操作'
		})
	} catch {
		return // 用户取消
	}

	syncing.value = true
	syncKey.value = item.key
	try {
		await item.run()
		get()
		getSectors()
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		syncing.value = false
		syncKey.value = ''
	}
}
</script>

<style lang="scss" scoped>
.market-data-page {
	background: #fff;
	border-radius: 20px;
	padding: 20px;

	// 数据列表 Tab（大盘行情 / 行业行情切换）
	.data-tabs {
		:deep(.el-tabs__header) {
			margin-bottom: 0;
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
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		padding: 20px 0;
	}

	.tab-tools {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
	}

	.title {
		color: #303133;
		font-size: 1.75rem;
		font-weight: bold;
	}
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

.up {
	color: #f56c6c;
}

.down {
	color: #67c23a;
}
</style>
