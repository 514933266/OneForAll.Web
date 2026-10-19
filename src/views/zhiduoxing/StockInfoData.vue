<template>
	<el-container class="stock-info-page">
		<el-main class="content">
			<!-- 数据统计概览 -->
			<div class="stats-box">
				<div class="stats-head">
					<span class="stats-title">数据概览</span>
					<span class="stats-tip">股票池共 {{ stats?.PoolCount ?? 0 }} 只；数据由同步任务从东方财富公开接口写入本地库</span>
				</div>
				<div class="stats-cards">
					<div class="stat-card" v-for="item in STAT_CARDS" :key="item.key">
						<div class="stat-name">{{ item.name }}</div>
						<div class="stat-value-row">
							<span class="stat-num">{{ getStat(item.key).RowCount }}</span>
							<span class="stat-unit">行</span>
						</div>
						<div class="stat-sub">
							覆盖 <b>{{ getStat(item.key).StockCount }}</b> 只
							<span class="stat-time">{{ formatStatTime(getStat(item.key).LastTime) }}</span>
						</div>
					</div>
				</div>
			</div>
			<!-- 手动数据同步区 -->
			<div class="sync-box">
				<div class="sync-head">
					<span class="sync-title">手动数据同步</span>
					<span class="sync-tip">对接东方财富数据源；数量留空为全量执行（全池耗时可能较长），执行结果将弹窗展示</span>
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
			<!-- 五类数据列表 -->
			<el-tabs v-model="activeTab" @tab-change="onTabChange">
				<!-- 资讯/公告 -->
				<el-tab-pane label="资讯/公告" name="news">
					<div class="table-head">
						<el-input v-model="newsQuery.Code" placeholder="股票代码" clearable style="width: 140px" class="ofa-mr10"
							@keyup.enter="search"></el-input>
						<el-select v-model="newsQuery.ItemType" placeholder="全部类型" clearable style="width: 140px" class="ofa-mr10"
							@change="search">
							<el-option v-for="t in ZDX_STOCK_NEWS_TYPES" :key="t.value" :label="t.label" :value="t.value"></el-option>
						</el-select>
						<el-button @click="search" type="primary">
							<font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
						</el-button>
						<span class="table-total">共 {{ total }} 条</span>
					</div>
					<el-table v-loading="loading" :data="newsList" class="ofa-table">
						<el-table-column prop="StockCode" label="股票代码" width="100" align="center"></el-table-column>
						<el-table-column label="类型" width="90" align="center">
							<template #default="scope">
								<el-tag :type="newsTypeTag(scope.row.ItemType)" size="small">{{ newsTypeLabel(scope.row.ItemType) }}</el-tag>
							</template>
						</el-table-column>
						<el-table-column prop="Title" label="标题" min-width="320" show-overflow-tooltip></el-table-column>
						<el-table-column prop="Source" label="来源" width="130" show-overflow-tooltip></el-table-column>
						<el-table-column label="发布时间" width="150" align="center">
							<template #default="scope">{{ formatMinute(scope.row.PublishTime) }}</template>
						</el-table-column>
						<el-table-column label="原文" width="80" align="center">
							<template #default="scope">
								<a v-if="scope.row.Url" :href="scope.row.Url" target="_blank" class="link">查看</a>
								<span v-else>--</span>
							</template>
						</el-table-column>
					</el-table>
				</el-tab-pane>
				<!-- 研报 -->
				<el-tab-pane label="研报" name="reports">
					<div class="table-head">
						<el-input v-model="reportQuery.Code" placeholder="股票代码" clearable style="width: 140px" class="ofa-mr10"
							@keyup.enter="search"></el-input>
						<el-select v-model="reportQuery.ItemType" placeholder="全部类型" clearable style="width: 140px" class="ofa-mr10"
							@change="search">
							<el-option v-for="t in ZDX_STOCK_REPORT_TYPES" :key="t.value" :label="t.label" :value="t.value"></el-option>
						</el-select>
						<el-button @click="search" type="primary">
							<font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
						</el-button>
						<span class="table-total">共 {{ total }} 条</span>
					</div>
					<el-table v-loading="loading" :data="reportList" class="ofa-table">
						<el-table-column prop="StockCode" label="股票代码" width="100" align="center"></el-table-column>
						<el-table-column label="类型" width="100" align="center">
							<template #default="scope">
								<el-tag :type="reportTypeTag(scope.row.ItemType)" size="small">{{ reportTypeLabel(scope.row.ItemType) }}</el-tag>
							</template>
						</el-table-column>
						<el-table-column prop="Title" label="标题" min-width="300" show-overflow-tooltip></el-table-column>
						<el-table-column prop="OrgName" label="机构" width="140" show-overflow-tooltip></el-table-column>
						<el-table-column prop="Researcher" label="研究员" width="110" show-overflow-tooltip></el-table-column>
						<el-table-column prop="Rating" label="评级" width="90" align="center"></el-table-column>
						<el-table-column prop="IndustryName" label="行业" width="130" show-overflow-tooltip></el-table-column>
						<el-table-column label="发布日期" width="120" align="center">
							<template #default="scope">{{ formatDay(scope.row.PublishDate) }}</template>
						</el-table-column>
						<el-table-column label="原文" width="80" align="center">
							<template #default="scope">
								<a v-if="scope.row.Url" :href="scope.row.Url" target="_blank" class="link">查看</a>
								<span v-else>--</span>
							</template>
						</el-table-column>
					</el-table>
				</el-tab-pane>
				<!-- 公司资料 -->
				<el-tab-pane label="公司资料" name="company">
					<div class="table-head">
						<el-input v-model="companyCode" placeholder="股票代码" clearable style="width: 140px" class="ofa-mr10"
							@keyup.enter="search"></el-input>
						<el-button @click="search" type="primary">
							<font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
						</el-button>
						<span class="table-total">共 {{ total }} 条</span>
					</div>
					<el-table v-loading="loading" :data="companyList" class="ofa-table">
						<el-table-column prop="StockCode" label="股票代码" width="100" align="center"></el-table-column>
						<el-table-column prop="Profile" label="公司简介" min-width="480" show-overflow-tooltip></el-table-column>
						<el-table-column label="更新时间" width="160" align="center">
							<template #default="scope">{{ formatMinute(scope.row.UpdateTime) }}</template>
						</el-table-column>
						<el-table-column label="操作" width="90" align="center" header-align="center" fixed="right">
							<template #default="scope">
								<el-button link type="primary" @click="showCompany(scope.row)">详情</el-button>
							</template>
						</el-table-column>
					</el-table>
				</el-tab-pane>
				<!-- 财务指标 -->
				<el-tab-pane label="财务指标" name="finance">
					<div class="table-head">
						<el-input v-model="financeCode" placeholder="股票代码" clearable style="width: 140px" class="ofa-mr10"
							@keyup.enter="search"></el-input>
						<el-button @click="search" type="primary">
							<font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
						</el-button>
						<span class="table-total">共 {{ total }} 条</span>
					</div>
					<el-table v-loading="loading" :data="financeList" class="ofa-table">
						<el-table-column prop="StockCode" label="股票代码" width="100" align="center" fixed="left"></el-table-column>
						<el-table-column label="报告期" width="110" align="center">
							<template #default="scope">{{ formatDay(scope.row.ReportDate) }}</template>
						</el-table-column>
						<el-table-column label="基本每股收益" width="110" align="right">
							<template #default="scope">{{ formatNumber(scope.row.Eps) }}</template>
						</el-table-column>
						<el-table-column label="扣非每股收益" width="110" align="right">
							<template #default="scope">{{ formatNumber(scope.row.EpsDeduct) }}</template>
						</el-table-column>
						<el-table-column label="稀释每股收益" width="110" align="right">
							<template #default="scope">{{ formatNumber(scope.row.EpsDiluted) }}</template>
						</el-table-column>
						<el-table-column label="每股净资产" width="100" align="right">
							<template #default="scope">{{ formatNumber(scope.row.Bps) }}</template>
						</el-table-column>
						<el-table-column label="每股公积金" width="100" align="right">
							<template #default="scope">{{ formatNumber(scope.row.CapitalReserve) }}</template>
						</el-table-column>
						<el-table-column label="每股未分配利润" width="120" align="right">
							<template #default="scope">{{ formatNumber(scope.row.UndistProfit) }}</template>
						</el-table-column>
						<el-table-column label="每股经营现金流" width="120" align="right">
							<template #default="scope">{{ formatNumber(scope.row.OpCashFlow) }}</template>
						</el-table-column>
						<el-table-column label="营业总收入(亿)" width="120" align="right">
							<template #default="scope">{{ formatYi(scope.row.Revenue) }}</template>
						</el-table-column>
						<el-table-column label="归属净利润(亿)" width="120" align="right">
							<template #default="scope">{{ formatYi(scope.row.NetProfit) }}</template>
						</el-table-column>
						<el-table-column label="扣非净利润(亿)" width="120" align="right">
							<template #default="scope">{{ formatYi(scope.row.DeductNetProfit) }}</template>
						</el-table-column>
						<el-table-column label="营收同比(%)" width="105" align="right">
							<template #default="scope">{{ formatNumber(scope.row.RevenueYoy) }}</template>
						</el-table-column>
						<el-table-column label="净利同比(%)" width="105" align="right">
							<template #default="scope">{{ formatNumber(scope.row.NetProfitYoy) }}</template>
						</el-table-column>
						<el-table-column label="扣非同比(%)" width="105" align="right">
							<template #default="scope">{{ formatNumber(scope.row.DeductNetProfitYoy) }}</template>
						</el-table-column>
						<el-table-column label="净资产收益率(%)" width="120" align="right">
							<template #default="scope">{{ formatNumber(scope.row.Roe) }}</template>
						</el-table-column>
						<el-table-column label="更新时间" width="150" align="center">
							<template #default="scope">{{ formatMinute(scope.row.UpdateTime) }}</template>
						</el-table-column>
					</el-table>
				</el-tab-pane>
				<!-- 十大流通股东 -->
				<el-tab-pane label="十大流通股东" name="holders">
					<div class="table-head">
						<el-input v-model="holderCode" placeholder="股票代码" clearable style="width: 140px" class="ofa-mr10"
							@keyup.enter="search"></el-input>
						<el-button @click="search" type="primary">
							<font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
						</el-button>
						<span class="table-total">共 {{ total }} 条</span>
					</div>
					<el-table v-loading="loading" :data="holderList" class="ofa-table">
						<el-table-column prop="StockCode" label="股票代码" width="100" align="center"></el-table-column>
						<el-table-column label="报告期" width="110" align="center">
							<template #default="scope">{{ formatDay(scope.row.EndDate) }}</template>
						</el-table-column>
						<el-table-column prop="HolderRank" label="排名" width="70" align="center"></el-table-column>
						<el-table-column prop="HolderName" label="股东名称" min-width="240" show-overflow-tooltip></el-table-column>
						<el-table-column label="持股数(股)" width="150" align="right">
							<template #default="scope">{{ formatThousands(scope.row.Shares) }}</template>
						</el-table-column>
						<el-table-column label="占流通股比(%)" width="125" align="right">
							<template #default="scope">{{ formatNumber(scope.row.Ratio) }}</template>
						</el-table-column>
						<el-table-column label="环比增减" width="110" align="right">
							<template #default="scope">
								<span :class="changeClass(scope.row.ChangeType)">{{ scope.row.Change ?? '--' }}</span>
							</template>
						</el-table-column>
						<el-table-column label="更新时间" width="150" align="center">
							<template #default="scope">{{ formatMinute(scope.row.UpdateTime) }}</template>
						</el-table-column>
					</el-table>
				</el-tab-pane>
			</el-tabs>
			<el-pagination background layout="total, sizes, prev, pager, next, jumper" v-model:current-page="pageIndex"
				:page-sizes="[20, 50, 100, 200]" v-model:page-size="pageSize" :total="total"
				@size-change="pageSizeChange" @current-change="pageIndexChange">
			</el-pagination>
		</el-main>
	</el-container>
	<!-- 公司资料详情抽屉 -->
	<el-drawer v-model="companyVisiable" :modal="false" :show-close="false" direction="rtl" size="720" class="ofa-drawer">
		<template #header>
			<span class="title">公司资料详情（{{ companyDetail?.StockCode }}）</span>
		</template>
		<div class="company-detail" v-if="companyDetail">
			<el-divider content-position="left">公司简介</el-divider>
			<div class="profile-text">{{ companyDetail.Profile || '--' }}</div>
			<el-divider content-position="left">基本信息</el-divider>
			<el-table :data="companyRows" class="ofa-table" size="small">
				<el-table-column prop="Label" label="字段" width="140"></el-table-column>
				<el-table-column prop="Value" label="内容" min-width="160" show-overflow-tooltip></el-table-column>
				<el-table-column prop="SubLabel" label="字段" width="140"></el-table-column>
				<el-table-column prop="SubValue" label="内容" min-width="160" show-overflow-tooltip></el-table-column>
			</el-table>
			<div class="detail-footer">
				<span>更新时间：{{ formatMinute(companyDetail.UpdateTime) }}</span>
			</div>
		</div>
	</el-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import {
	IZdxStockNewsData,
	IZdxStockReport,
	IZdxStockCompany,
	IZdxStockFinanceData,
	IZdxStockHolder,
	IZdxStockInfoCategoryStats,
	IZdxStockInfoStats,
	IZdxStockNewsQuery,
	IZdxStockReportQuery,
	ZDX_STOCK_NEWS_TYPES,
	ZDX_STOCK_REPORT_TYPES
} from '@/interfaces/zhiduoxing/IZdxStockInfo'
import { IBaseMessage } from '@/interfaces/IBaseMessage'
import API from '@/apis/zdx-api'

// 同步项（limit 为是否支持数量限制；数量留空为全量执行）
interface SyncAction {
	key: string
	name: string
	limit: boolean
	run: (limit?: number) => Promise<IBaseMessage>
}

// 统计卡片配置（key 与 ZdxStockInfoStats 属性名一致）
const STAT_CARDS = [
	{ key: 'News', name: '资讯/公告' },
	{ key: 'Reports', name: '研报' },
	{ key: 'Company', name: '公司资料' },
	{ key: 'Finance', name: '财务指标' },
	{ key: 'Holders', name: '十大流通股东' }
]

const activeTab = ref('news') // 当前数据页签
const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(20) // 每页数量
const stats = ref<IZdxStockInfoStats>() // 五类统计

// 各类列表
const newsList = ref<IZdxStockNewsData[]>([])
const reportList = ref<IZdxStockReport[]>([])
const companyList = ref<IZdxStockCompany[]>([])
const financeList = ref<IZdxStockFinanceData[]>([])
const holderList = ref<IZdxStockHolder[]>([])

// 查询条件
const newsQuery = ref<IZdxStockNewsQuery>({ Code: '', ItemType: undefined })
const reportQuery = ref<IZdxStockReportQuery>({ Code: '', ItemType: undefined })
const companyCode = ref('')
const financeCode = ref('')
const holderCode = ref('')

// 手动同步
const syncing = ref(false) // 同步执行中
const syncKey = ref('') // 正在执行的同步项
const syncLimit = ref<number>() // 限制数量（空=全量）
const SYNC_ACTIONS: SyncAction[] = [
	{ key: 'news', name: '资讯/公告同步', limit: true, run: (limit?: number) => API.syncZdxInfoNews(limit) },
	{ key: 'reports', name: '研报同步', limit: true, run: (limit?: number) => API.syncZdxInfoReports(limit) },
	{ key: 'company', name: '公司资料同步', limit: true, run: (limit?: number) => API.syncZdxInfoCompany(limit) },
	{ key: 'finance', name: '财务指标同步', limit: true, run: (limit?: number) => API.syncZdxInfoFinance(limit) },
	{ key: 'holders', name: '股东数据同步', limit: true, run: (limit?: number) => API.syncZdxInfoHolders(limit) }
]

// 公司详情抽屉
const companyVisiable = ref(false)
const companyDetail = ref<IZdxStockCompany>()
const companyRows = ref<{ Label: string; Value: string; SubLabel: string; SubValue: string }[]>([])

onMounted(() => {
	getStats()
	get()
})

// 获取统计（执行失败由响应拦截器统一弹出通知）
function getStats() {
	API.getStockInfoStats().then(res => {
		stats.value = res
	})
}

// 获取当前页签列表
function get() {
	loading.value = true
	const idx = pageIndex.value
	const size = pageSize.value
	if (activeTab.value === 'news') {
		API.getStockInfoNews(newsQuery.value, idx, size).then(res => {
			newsList.value = res.Items
			total.value = res.Total
			loading.value = false
		})
	} else if (activeTab.value === 'reports') {
		API.getStockInfoReports(reportQuery.value, idx, size).then(res => {
			reportList.value = res.Items
			total.value = res.Total
			loading.value = false
		})
	} else if (activeTab.value === 'company') {
		API.getStockInfoCompany(companyCode.value, idx, size).then(res => {
			companyList.value = res.Items
			total.value = res.Total
			loading.value = false
		})
	} else if (activeTab.value === 'finance') {
		API.getStockInfoFinance(financeCode.value, idx, size).then(res => {
			financeList.value = res.Items
			total.value = res.Total
			loading.value = false
		})
	} else if (activeTab.value === 'holders') {
		API.getStockInfoHolders(holderCode.value, idx, size).then(res => {
			holderList.value = res.Items
			total.value = res.Total
			loading.value = false
		})
	}
}

// 搜索（重置页码）
function search() {
	pageIndex.value = 1
	get()
}

// 切换页签（重置页码）
function onTabChange() {
	pageIndex.value = 1
	get()
}

// 改变每页数量
function pageSizeChange(value: number) {
	pageSize.value = value
	pageIndex.value = 1
	get()
}

// 改变页码
function pageIndexChange(value: number) {
	pageIndex.value = value
	get()
}

// 执行手动同步（确认后执行；成功/失败信息由响应拦截器统一弹出通知，执行后刷新统计与列表）
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
		getStats()
		get()
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		syncing.value = false
		syncKey.value = ''
	}
}

// 获取分类统计（无数据返回空对象）
function getStat(key: string): IZdxStockInfoCategoryStats {
	const value = (stats.value as any)?.[key]
	return value ?? { StockCount: 0, RowCount: 0, LastTime: undefined }
}

// 统计时间展示（yyyy-MM-dd HH:mm:ss → yyyy-MM-dd HH:mm）
function formatStatTime(value?: string): string {
	return value ? value.substring(0, 16).replace('T', ' ') : '最新：--'
}

// 资讯类型标签
function newsTypeLabel(value: number): string {
	return ZDX_STOCK_NEWS_TYPES.find(w => w.value === value)?.label ?? String(value)
}
function newsTypeTag(value: number): any {
	return ZDX_STOCK_NEWS_TYPES.find(w => w.value === value)?.tag ?? 'info'
}

// 研报类型标签
function reportTypeLabel(value: number): string {
	return ZDX_STOCK_REPORT_TYPES.find(w => w.value === value)?.label ?? String(value)
}
function reportTypeTag(value: number): any {
	return ZDX_STOCK_REPORT_TYPES.find(w => w.value === value)?.tag ?? 'info'
}

// 日期展示（截取 yyyy-MM-dd）
function formatDay(value?: string): string {
	return value ? value.substring(0, 10) : '--'
}

// 时间展示（截取 yyyy-MM-dd HH:mm）
function formatMinute(value?: string): string {
	return value ? value.substring(0, 16).replace('T', ' ') : '--'
}

// 数值展示（保留2位小数，空值显示--）
function formatNumber(value?: number | null): string {
	return value === null || value === undefined ? '--' : Number(value).toFixed(2)
}

// 金额转亿元展示（保留2位小数）
function formatYi(value?: number | null): string {
	return value === null || value === undefined ? '--' : (Number(value) / 1e8).toFixed(2)
}

// 整数千分位展示
function formatThousands(value?: number | null): string {
	return value === null || value === undefined ? '--' : Math.round(Number(value)).toLocaleString('en-US')
}

// 环比颜色（增红减绿）
function changeClass(changeType?: string): string {
	return changeType === 'up' ? 'up' : changeType === 'down' ? 'down' : ''
}

// 显示公司详情（解析基本信息行 JSON）
function showCompany(row: IZdxStockCompany) {
	companyDetail.value = row
	try {
		companyRows.value = row.RowsJson ? JSON.parse(row.RowsJson) : []
	} catch {
		companyRows.value = []
	}
	companyVisiable.value = true
}
</script>

<style lang="scss" scoped>
.stock-info-page {
	background: #fff;
	border-radius: 20px;
	padding: 20px;

	.content {
		padding: 0;
	}

	.stats-box {
		border: 1px solid #e4e7ed;
		border-radius: 8px;
		background: #fafafa;
		padding: 12px 16px;
		margin-bottom: 16px;

		.stats-head {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			margin-bottom: 10px;
		}

		.stats-title {
			color: #303133;
			font-weight: bold;
			margin-right: 12px;
		}

		.stats-tip {
			color: #909399;
			font-size: 12px;
		}

		.stats-cards {
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
		}

		.stat-card {
			flex: 1;
			min-width: 180px;
			background: #fff;
			border: 1px solid #e4e7ed;
			border-radius: 8px;
			padding: 10px 14px;

			.stat-name {
				color: #909399;
				font-size: 12px;
			}

			.stat-value-row {
				margin: 4px 0;

				.stat-num {
					color: #409eff;
					font-size: 1.5rem;
					font-weight: bold;
				}

				.stat-unit {
					color: #909399;
					font-size: 12px;
					margin-left: 4px;
				}
			}

			.stat-sub {
				color: #606266;
				font-size: 12px;

				b {
					color: #303133;
				}

				.stat-time {
					margin-left: 8px;
					color: #909399;
				}
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
	}

	.table-head {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		padding: 4px 0 12px;

		.table-total {
			color: #909399;
			font-size: 12px;
			margin-left: auto;
		}
	}

	.company-detail {
		.profile-text {
			color: #303133;
			line-height: 1.8;
			white-space: pre-wrap;
		}

		.detail-footer {
			color: #909399;
			font-size: 12px;
			margin-top: 12px;
			text-align: right;
		}
	}
}

.link {
	color: #409eff;
	text-decoration: none;

	&:hover {
		text-decoration: underline;
	}
}

.up {
	color: #f56c6c;
}

.down {
	color: #67c23a;
}
</style>
