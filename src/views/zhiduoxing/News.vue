<template>
	<el-container class="news-page">
		<el-header class="header">
			<span>
				<span class="search-box">
					<el-input v-model.trim="searchOption.key" placeholder="标题关键词" style="width: 180px" class="ofa-mr10"
						@keyup.enter="search">
						<template #prefix>
							<font-awesome-icon fas icon="search"></font-awesome-icon>
						</template>
					</el-input>
					<el-select v-model="searchOption.category" style="width: 130px" class="ofa-mr10">
						<el-option :value="-1" label="全部大类"></el-option>
						<el-option v-for="item in categoryOptions" :key="item.value" :label="item.label"
							:value="item.value"></el-option>
					</el-select>
					<el-select v-model="searchOption.subCategory" style="width: 130px" class="ofa-mr10">
						<el-option :value="-1" label="全部子类"></el-option>
						<el-option v-for="item in subOptions" :key="item.value" :label="item.label"
							:value="item.value"></el-option>
					</el-select>
					<el-select v-model="searchOption.direction" style="width: 110px" class="ofa-mr10">
						<el-option :value="-1" label="全部方向"></el-option>
						<el-option v-for="item in directionOptions" :key="item.value" :label="item.label"
							:value="item.value"></el-option>
					</el-select>
					<el-select v-model="searchOption.strength" style="width: 110px" class="ofa-mr10">
						<el-option :value="-1" label="全部强度"></el-option>
						<el-option v-for="item in strengthOptions" :key="item.value" :label="item.label"
							:value="item.value"></el-option>
					</el-select>
					<el-select v-if="activeKind === 2" v-model="searchOption.itemType" style="width: 110px"
						class="ofa-mr10">
						<el-option :value="-1" label="全部类型"></el-option>
						<el-option v-for="item in ITEM_TYPES" :key="item.value" :label="item.label"
							:value="item.value"></el-option>
					</el-select>
					<el-select v-model="searchOption.dataSource" style="width: 110px" class="ofa-mr10">
						<el-option :value="-1" label="全部来源"></el-option>
						<el-option v-for="item in ZDX_NEWS_DATA_SOURCES" :key="item.value" :label="item.label"
							:value="item.value"></el-option>
					</el-select>
					<el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
						end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 240px"
						class="ofa-mr10"></el-date-picker>
					<el-button @click="search" type="primary" class="ofa-mr10">
						<font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
					</el-button>
				</span>
			</span>
			<span class="button-box">
				<el-button @click="runSyncFlash" :loading="syncing === 'flash'" :disabled="syncing !== '' && syncing !== 'flash'">
					<font-awesome-icon fas icon="bolt"></font-awesome-icon>&nbsp;快讯同步
				</el-button>
				<el-button @click="runSyncClassify" :loading="syncing === 'classify'" :disabled="syncing !== '' && syncing !== 'classify'">
					<font-awesome-icon fas icon="wand-magic-sparkles"></font-awesome-icon>&nbsp;批量分类
				</el-button>
			</span>
		</el-header>
		<el-main class="content">
			<!-- 顶部统计卡（今日消息概览 + 待分析数） -->
			<div class="stats-box">
				<div class="stat-card">
					<div class="stat-value">{{ stats.TodayFlashCount }}</div>
					<div class="stat-label">今日快讯</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{{ stats.TodayStockNewsCount }}</div>
					<div class="stat-label">今日个股资讯</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{{ stats.TodayPolicyCount }}</div>
					<div class="stat-label">今日政策</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{{ stats.TodayAnnouncementCount }}</div>
					<div class="stat-label">今日公告</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{{ stats.TodayNewsCount }}</div>
					<div class="stat-label">今日资讯</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{{ stats.TodayHighCount }}</div>
					<div class="stat-label">高影响消息</div>
				</div>
				<div class="stat-card">
					<div class="stat-value pending">{{ stats.PendingCount }}</div>
					<div class="stat-label">待分析</div>
				</div>
			</div>
			<!-- 消息域切换（全局快讯 / 个股资讯公告） -->
			<el-tabs v-model="activeKind" class="kind-tabs" @tab-change="switchKind">
				<el-tab-pane label="全局快讯" :name="1"></el-tab-pane>
				<el-tab-pane label="个股资讯公告" :name="2"></el-tab-pane>
			</el-tabs>
			<!-- 消息流列表（按发布时间倒序；点击打开详情抽屉） -->
			<div v-loading="loading" class="news-list">
				<div v-for="item in list" :key="item.Id" class="news-item" @click="openDetail(item)">
					<div class="item-head">
						<span class="item-title">{{ item.Title }}</span>
						<span class="item-time">{{ formatTime(item.PublishTime) }}</span>
					</div>
					<div class="item-tags">
						<el-tag v-if="activeKind === 2" type="primary" size="small" class="ofa-mr4">{{ item.StockCode }}</el-tag>
						<el-tag v-if="activeKind === 2" :type="itemTypeTag(item.ItemType)" size="small" effect="plain"
							class="ofa-mr4">{{ itemTypeLabel(item.ItemType) }}</el-tag>
						<template v-if="item.Ai">
							<el-tag :type="categoryTag(item.Ai.Category)" size="small" class="ofa-mr4">
								{{ categoryLabel(item.Ai.Category) }}</el-tag>
							<el-tag v-if="item.Ai.SubCategory" type="info" size="small" effect="plain"
								class="ofa-mr4">{{ subLabel(item.Ai.SubCategory) }}</el-tag>
							<el-tag :type="directionTag(item.Ai.Direction)" size="small" effect="plain"
								class="ofa-mr4">{{ directionLabel(item.Ai.Direction) }}</el-tag>
							<el-tag :type="strengthTag(item.Ai.Strength)" size="small" effect="plain"
								class="ofa-mr4">{{ strengthLabel(item.Ai.Strength) }}</el-tag>
							<el-tag v-if="item.Ai.IsManual" type="warning" size="small" effect="dark"
								class="ofa-mr4">人工修正</el-tag>
						</template>
						<el-tag v-else type="info" size="small" effect="plain" class="ofa-mr4">未分析</el-tag>
						<el-tag :type="sourceTag(item.DataSource)" size="small" effect="plain">
							{{ sourceLabel(item.DataSource) }}</el-tag>
						<!-- 无法自动识别（无结果/未分类/其他）：行内直达人工触发 AI 识别（日常由每2小时定时批量分类，此处仅处理漏网行） -->
						<el-button v-if="needRecognize(item)" link type="primary" size="small" class="recognize-btn"
							:loading="recognizing === item.Id" @click.stop="runRecognize(item)">
							<font-awesome-icon fas icon="wand-magic-sparkles"></font-awesome-icon>&nbsp;AI识别
						</el-button>
					</div>
					<div v-if="item.Ai?.AiSummary" class="item-summary">{{ item.Ai.AiSummary }}</div>
				</div>
				<el-empty v-if="!loading && !list.length" description="暂无消息数据（可先执行快讯同步/个股资讯同步采集）"
					:image-size="80"></el-empty>
			</div>
			<el-pagination background layout="total, sizes, prev, pager, next, jumper" v-model:current-page="pageIndex"
				:page-sizes="[10, 20, 50, 100]" v-model:page-size="pageSize" :total="total" @size-change="pageSizeChange"
				@current-change="pageIndexChange">
			</el-pagination>
			<!-- 消息面日报面板（三段式 AI 总结：政策面/公告面/资讯面） -->
			<div class="daily-box">
				<div class="daily-head">
					<span class="daily-title">
						<font-awesome-icon fas icon="newspaper"></font-awesome-icon>&nbsp;消息面日报
					</span>
					<span class="daily-ops">
						<el-date-picker v-model="dailyDate" type="date" value-format="YYYY-MM-DD" style="width: 150px"
							class="ofa-mr10"></el-date-picker>
						<el-button @click="viewDaily" :loading="dailyLoading">查看</el-button>
						<el-button @click="genDaily" type="primary" :loading="dailyGenning">生成/重新生成</el-button>
					</span>
				</div>
				<div v-loading="dailyLoading" class="daily-body">
					<div v-if="daily" class="daily-content">
						<div class="daily-meta">更新于 {{ formatTime(daily.UpdateTime) }}</div>
						{{ daily.AiSummary }}
					</div>
					<el-empty v-else-if="!dailyLoading" description="当日消息面日报尚未生成" :image-size="60"></el-empty>
				</div>
			</div>
		</el-main>
	</el-container>
	<!-- 详情抽屉（消息本体+AI分析+影响面明细+人工修正） -->
	<el-drawer v-model="drawerVisiable" :modal="false" :show-close="false" direction="rtl" size="780"
		class="ofa-drawer">
		<template #header>
			<span class="title">消息详情</span>
		</template>
		<div v-loading="detailLoading" class="detail-box">
			<template v-if="detail">
				<!-- 标题与元信息 -->
				<div class="detail-title">{{ detail.Title }}</div>
				<div class="detail-meta">
					<el-tag :type="kindTag(detail.NewsKind)" size="small" class="ofa-mr4">{{ kindLabel(detail.NewsKind) }}</el-tag>
					<el-tag v-if="detail.ItemType" :type="itemTypeTag(detail.ItemType)" size="small" effect="plain"
						class="ofa-mr4">{{ itemTypeLabel(detail.ItemType) }}</el-tag>
					<el-tag :type="sourceTag(detail.DataSource)" size="small" effect="plain" class="ofa-mr4">
						{{ sourceLabel(detail.DataSource) }}</el-tag>
					<span class="meta-text">{{ formatTime(detail.PublishTime) }}</span>
					<span v-if="detail.SourceName" class="meta-text">来源：{{ detail.SourceName }}</span>
					<el-link v-if="detail.Url" :href="detail.Url" target="_blank" type="primary" class="ofa-ml4">
						<font-awesome-icon fas icon="up-right-from-square"></font-awesome-icon>&nbsp;原文
					</el-link>
				</div>
				<!-- 个股域：股票代码快捷跳转 -->
				<div v-if="detail.StockCode" class="detail-stock">
					<el-button link type="primary" @click="openStockByCode(detail.StockCode)">
						<font-awesome-icon fas icon="arrow-trend-up"></font-awesome-icon>&nbsp;{{ detail.StockCode }} 个股详情
					</el-button>
				</div>
				<!-- 消息正文 -->
				<div v-if="detail.Summary" class="detail-summary">{{ detail.Summary }}</div>
				<!-- AI 分析结果 -->
				<el-divider content-position="left">
					<span class="section-title">
						AI 分析
						<el-button v-if="detail.Ai" link type="primary" size="small" :loading="analyzing"
							@click="runAnalyze">
							<font-awesome-icon fas icon="wand-magic-sparkles"></font-awesome-icon>&nbsp;重新分析
						</el-button>
					</span>
				</el-divider>
				<template v-if="detail.Ai">
					<div class="ai-tags">
						<el-tag :type="categoryTag(detail.Ai.Category)" size="small" class="ofa-mr4">
							{{ categoryLabel(detail.Ai.Category) }}</el-tag>
						<el-tag v-if="detail.Ai.SubCategory" type="info" size="small" effect="plain" class="ofa-mr4">
							{{ subLabel(detail.Ai.SubCategory) }}</el-tag>
						<el-tag :type="directionTag(detail.Ai.Direction)" size="small" effect="plain" class="ofa-mr4">
							{{ directionLabel(detail.Ai.Direction) }}</el-tag>
						<el-tag :type="strengthTag(detail.Ai.Strength)" size="small" effect="plain" class="ofa-mr4">
							{{ strengthLabel(detail.Ai.Strength) }}</el-tag>
						<el-tag v-if="detail.Ai.IsManual" type="warning" size="small" effect="dark" class="ofa-mr4">
							人工修正</el-tag>
						<span class="meta-text">更新于 {{ formatTime(detail.Ai.UpdateTime) }}</span>
					</div>
					<div v-if="detail.Ai.AiSummary" class="ai-summary">{{ detail.Ai.AiSummary }}</div>
				</template>
				<div v-else class="ai-empty">
					<el-empty description="尚未分析" :image-size="60"></el-empty>
					<el-button type="primary" :loading="analyzing" @click="runAnalyze">
						<font-awesome-icon fas icon="wand-magic-sparkles"></font-awesome-icon>&nbsp;AI 分析
					</el-button>
				</div>
				<!-- 影响面明细 -->
				<el-divider content-position="left">
					<span class="section-title">
						影响面分析
						<el-button link type="primary" size="small" :loading="impacting" @click="runImpact">
							<font-awesome-icon fas icon="magnifying-glass-chart"></font-awesome-icon>&nbsp;重新分析
						</el-button>
					</span>
				</el-divider>
				<div v-if="sectorImpacts.length" class="impact-block">
					<div class="impact-subtitle">受影响板块（点击跳转板块行情）</div>
					<div class="impact-cards">
						<div v-for="item in sectorImpacts" :key="item.Id" class="impact-card sector"
							@click="openSector(item)">
							<div class="impact-head">
								<span class="impact-name">{{ item.TargetName }}</span>
								<span class="impact-tags">
									<el-tag :type="directionTag(item.Direction)" size="small" effect="plain"
										class="ofa-mr4">{{ directionLabel(item.Direction) }}</el-tag>
									<el-tag :type="strengthTag(item.Strength)" size="small" effect="plain">
										{{ strengthLabel(item.Strength) }}</el-tag>
								</span>
							</div>
							<div v-if="item.Reason" class="impact-reason">{{ item.Reason }}</div>
						</div>
					</div>
				</div>
				<div v-if="stockImpacts.length" class="impact-block">
					<div class="impact-subtitle">受影响个股（点击跳转个股详情）</div>
					<div class="impact-cards">
						<div v-for="item in stockImpacts" :key="item.Id" class="impact-card stock"
							@click="openStock(item)">
							<div class="impact-head">
								<span class="impact-name">{{ item.TargetName }}</span>
								<span class="impact-tags">
									<el-tag :type="directionTag(item.Direction)" size="small" effect="plain"
										class="ofa-mr4">{{ directionLabel(item.Direction) }}</el-tag>
									<el-tag :type="strengthTag(item.Strength)" size="small" effect="plain">
										{{ strengthLabel(item.Strength) }}</el-tag>
								</span>
							</div>
							<div v-if="item.Reason" class="impact-reason">{{ item.Reason }}</div>
						</div>
					</div>
				</div>
				<div v-if="!detail.Impacts.length" class="impact-empty">暂无影响面明细，可点击「重新分析」生成</div>
				<!-- 人工修正分类 -->
				<el-divider content-position="left"><span class="section-title">人工修正分类</span></el-divider>
				<div class="manual-box">
					<el-select v-model="manualForm.category" style="width: 130px" class="ofa-mr10"
						@change="onManualCategoryChange">
						<el-option v-for="item in categoryOptions" :key="item.value" :label="item.label"
							:value="item.value"></el-option>
					</el-select>
					<el-select v-model="manualForm.subCategory" style="width: 140px" class="ofa-mr10"
						:disabled="manualForm.category === 9">
						<el-option v-for="item in manualSubOptions" :key="item.value" :label="item.label"
							:value="item.value"></el-option>
					</el-select>
					<el-select v-model="manualForm.direction" style="width: 110px" class="ofa-mr10">
						<el-option v-for="item in directionOptions" :key="item.value" :label="item.label"
							:value="item.value"></el-option>
					</el-select>
					<el-select v-model="manualForm.strength" style="width: 110px" class="ofa-mr10">
						<el-option v-for="item in strengthOptions" :key="item.value" :label="item.label"
							:value="item.value"></el-option>
					</el-select>
					<el-button type="primary" :loading="savingManual" @click="saveManual">
						<font-awesome-icon fas icon="floppy-disk"></font-awesome-icon>&nbsp;保存修正
					</el-button>
					<div class="manual-tip">修正后标记人工修正，批量 AI 分类将跳过该消息</div>
				</div>
			</template>
		</div>
		<div class="footer">
			<el-button type="primary" @click="drawerVisiable = false">关闭</el-button>
		</div>
	</el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessageBox } from 'element-plus'
import { dayjs } from 'element-plus'
import {
	ZDX_NEWS_CATEGORIES,
	ZDX_NEWS_SUB_CATEGORIES,
	ZDX_NEWS_DIRECTIONS,
	ZDX_NEWS_STRENGTHS,
	ZDX_NEWS_KINDS,
	ZDX_NEWS_DATA_SOURCES,
	IZdxNewsStats,
	IZdxNewsQuery,
	IZdxNewsDetail,
	IZdxNewsDaily,
	IZdxNewsImpact
} from '@/interfaces/zhiduoxing/IZdxNews'
import { IPersonalMenuTree } from '@/interfaces/IPersonalMenuTree'
import { useBrowserStore } from '@/stores/browserStore'
import API from '@/apis/zdx-api'

const browserStore = useBrowserStore()

// 板块行情菜单（与 sys_menu 配置一致；点击影响板块卡片跳转并携带行业名称）
const SECTOR_MENU: IPersonalMenuTree = {
	Id: 'C4F8E2A1-7D35-4B96-B8E2-08E01C3D5F6A',
	Code: 'ZdxSectorQuote',
	Name: '板块行情',
	Url: '/zhiduoxing/sector-quote',
	Type: 2,
	OpenType: 1,
	Icon: 'object-group',
	IsDefault: false,
	Children: []
}

// 个股行情菜单（与 sys_menu 配置一致；点击影响个股卡片跳转并携带股票代码）
const STOCK_MENU: IPersonalMenuTree = {
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

// 条目类型（个股资讯公告；与后端 ZdxStockNewsTypeEnum 一致）
const ITEM_TYPES = [
	{ value: 1, label: '资讯', tag: 'primary' },
	{ value: 2, label: '公告', tag: 'warning' }
]

// ---------- 列表状态 ----------
const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(20) // 页数
const activeKind = ref(1) // 消息域（1全局快讯 2个股资讯公告）
const list = ref<any[]>([]) // 消息流列表
const dateRange = ref<string[] | null>(null) // 发布时间区间
const searchOption = ref({
	key: '', // 标题关键词
	category: -1, // 消息大类（-1=不限）
	subCategory: -1, // 消息子类（-1=不限）
	direction: -1, // 影响方向（-1=不限）
	strength: -1, // 影响强度（-1=不限）
	itemType: -1, // 条目类型（-1=不限；仅个股域）
	dataSource: -1 // 数据来源（-1=不限；2=东财 4=腾讯）
}) // 搜索条件

// ---------- 统计与手动同步 ----------
function emptyStats(): IZdxNewsStats {
	return {
		TodayFlashCount: 0,
		TodayStockNewsCount: 0,
		TodayPolicyCount: 0,
		TodayAnnouncementCount: 0,
		TodayNewsCount: 0,
		TodayHighCount: 0,
		PendingCount: 0
	}
}
const stats = ref<IZdxNewsStats>(emptyStats()) // 顶部统计卡
const syncing = ref('') // 正在执行的同步项（flash/classify）

// ---------- 详情抽屉 ----------
const drawerVisiable = ref(false) // 抽屉显示
const detailLoading = ref(false) // 详情加载中
const detail = ref<IZdxNewsDetail>() // 详情聚合
const analyzing = ref(false) // AI 分析执行中
const impacting = ref(false) // 影响面分析执行中
const savingManual = ref(false) // 人工修正保存中
const manualForm = ref({ category: 1, subCategory: 11, direction: 1, strength: 3 }) // 人工修正表单

// ---------- 消息面日报 ----------
const dailyDate = ref(dayjs().format('YYYY-MM-DD')) // 日报日期
const daily = ref<IZdxNewsDaily>() // 日报数据
const dailyLoading = ref(false) // 日报查看中
const dailyGenning = ref(false) // 日报生成中

// 下拉选项（过滤未分类/未判定项）
const categoryOptions = ZDX_NEWS_CATEGORIES.filter(w => w.value > 0)
const directionOptions = ZDX_NEWS_DIRECTIONS.filter(w => w.value > 0)
const strengthOptions = ZDX_NEWS_STRENGTHS.filter(w => w.value > 0)
// 子类选项（筛选栏：大类不限=全部子类，否则联动过滤）
const subOptions = computed(() =>
	searchOption.value.category > 0
		? ZDX_NEWS_SUB_CATEGORIES.filter(w => w.parent === searchOption.value.category)
		: ZDX_NEWS_SUB_CATEGORIES
)
// 人工修正子类选项（联动大类）
const manualSubOptions = computed(() => ZDX_NEWS_SUB_CATEGORIES.filter(w => w.parent === manualForm.value.category))
// 影响面分组（详情抽屉）
const sectorImpacts = computed(() => detail.value?.Impacts.filter(w => w.TargetType === 1) ?? [])
const stockImpacts = computed(() => detail.value?.Impacts.filter(w => w.TargetType === 2) ?? [])

onMounted(() => {
	loadStats()
	get()
})

// 加载统计卡
function loadStats() {
	API.getZdxNewsStats().then(res => {
		stats.value = res
	})
}

// 组装查询条件（-1/空值=不限）
function buildForm(): IZdxNewsQuery {
	const form: IZdxNewsQuery = {
		Category: searchOption.value.category > 0 ? searchOption.value.category : undefined,
		SubCategory: searchOption.value.subCategory > 0 ? searchOption.value.subCategory : undefined,
		Direction: searchOption.value.direction > 0 ? searchOption.value.direction : undefined,
		Strength: searchOption.value.strength > 0 ? searchOption.value.strength : undefined,
		DataSource: searchOption.value.dataSource > 0 ? searchOption.value.dataSource : undefined,
		Key: searchOption.value.key || undefined
	}
	// 结束日加一天（后端 end 为含当天边界，避免漏掉结束日全天数据）
	form.Begin = dateRange.value?.[0] || undefined
	form.End = dateRange.value?.[1] ? dayjs(dateRange.value[1]).add(1, 'day').format('YYYY-MM-DD') : undefined
	return form
}

// 获取列表（按当前消息域）
function get() {
	loading.value = true
	const form = buildForm()
	if (activeKind.value === 1) {
		API.getZdxNewsFlash(form, pageIndex.value, pageSize.value).then(res => {
			list.value = res.Items
			total.value = res.Total
			loading.value = false
		})
	} else {
		const itemType = searchOption.value.itemType > 0 ? searchOption.value.itemType : undefined
		API.getZdxNewsStockNews(form, itemType, pageIndex.value, pageSize.value).then(res => {
			list.value = res.Items
			total.value = res.Total
			loading.value = false
		})
	}
}

// 搜索
function search() {
	pageIndex.value = 1
	nextTick(() => get())
}

// 切换消息域（重置条目类型筛选与页码）
function switchKind() {
	searchOption.value.itemType = -1
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

// 时间格式（yyyy-MM-ddTHH:mm:ss → yyyy-MM-dd HH:mm）
function formatTime(value?: string): string {
	if (!value) return '--'
	return value.length >= 16 ? value.substring(0, 16).replace('T', ' ') : value
}

// ---------- 徽标映射 ----------
function categoryLabel(value: number): string {
	return ZDX_NEWS_CATEGORIES.find(w => w.value === value)?.label ?? '--'
}
function categoryTag(value: number): string {
	return ZDX_NEWS_CATEGORIES.find(w => w.value === value)?.tag ?? 'info'
}
function subLabel(value: number): string {
	return ZDX_NEWS_SUB_CATEGORIES.find(w => w.value === value)?.label ?? '--'
}
function directionLabel(value: number): string {
	return ZDX_NEWS_DIRECTIONS.find(w => w.value === value)?.label ?? '--'
}
function directionTag(value: number): string {
	return ZDX_NEWS_DIRECTIONS.find(w => w.value === value)?.tag ?? 'info'
}
function strengthLabel(value: number): string {
	return ZDX_NEWS_STRENGTHS.find(w => w.value === value)?.label ?? '--'
}
function strengthTag(value: number): string {
	return ZDX_NEWS_STRENGTHS.find(w => w.value === value)?.tag ?? 'info'
}
function kindLabel(value: number): string {
	return ZDX_NEWS_KINDS.find(w => w.value === value)?.label ?? '--'
}
function kindTag(value: number): string {
	return value === 1 ? 'primary' : 'warning'
}
function sourceLabel(value?: number): string {
	// 存量 NULL 视为东财
	return ZDX_NEWS_DATA_SOURCES.find(w => w.value === (value ?? 2))?.label ?? '--'
}
function sourceTag(value?: number): string {
	return ZDX_NEWS_DATA_SOURCES.find(w => w.value === (value ?? 2))?.tag ?? 'info'
}
function itemTypeLabel(value: number): string {
	return ITEM_TYPES.find(w => w.value === value)?.label ?? '--'
}
function itemTypeTag(value: number): string {
	return ITEM_TYPES.find(w => w.value === value)?.tag ?? 'info'
}

// ---------- 详情抽屉 ----------
// 打开详情抽屉
async function openDetail(item: any) {
	drawerVisiable.value = true
	detailLoading.value = true
	detail.value = undefined
	detail.value = await API.getZdxNewsDetail(activeKind.value, item.Id)
	detailLoading.value = false
	initManualForm()
}

// 初始化人工修正表单（有 AI 结果回填，否则默认值）
function initManualForm() {
	const ai = detail.value?.Ai
	if (ai && ai.Category > 0) {
		manualForm.value = {
			category: ai.Category,
			subCategory: ai.SubCategory,
			direction: ai.Direction,
			strength: ai.Strength
		}
	} else {
		manualForm.value = { category: 1, subCategory: 11, direction: 1, strength: 3 }
	}
}

// 人工修正大类变化时重置子类为该大类首项
function onManualCategoryChange(value: number) {
	const first = ZDX_NEWS_SUB_CATEGORIES.find(w => w.parent === value)
	manualForm.value.subCategory = first ? first.value : 0
}

// ---------- 列表行人工触发 AI 识别（定时批量只处理未分类行；无结果/归类为"其他"的漏网行在此单条重跑） ----------
const recognizing = ref<number | null>(null) // 正在识别的消息 Id（行内按钮 loading）
function needRecognize(item: any): boolean {
	return !item.Ai || !item.Ai.Category || item.Ai.Category === 9
}
async function runRecognize(item: any) {
	if (recognizing.value !== null) return
	recognizing.value = item.Id
	try {
		const res = await API.analyzeZdxNews(activeKind.value, item.Id)
		ElMessage.success(res?.Message ?? '识别完成')
		loadStats()
		get()
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		recognizing.value = null
	}
}

// AI 分析（分类+摘要；政策/高强度自动追加影响面；完成后刷新详情与列表）
async function runAnalyze() {
	if (!detail.value) return
	analyzing.value = true
	try {
		await API.analyzeZdxNews(detail.value.NewsKind, detail.value.NewsId)
		await refreshDetail()
		loadStats()
		get()
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		analyzing.value = false
	}
}

// 影响面分析（完成后刷新详情）
async function runImpact() {
	if (!detail.value) return
	impacting.value = true
	try {
		await API.analyzeZdxNewsImpact(detail.value.NewsKind, detail.value.NewsId)
		await refreshDetail()
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		impacting.value = false
	}
}

// 重新加载详情聚合
async function refreshDetail() {
	if (!detail.value) return
	detailLoading.value = true
	detail.value = await API.getZdxNewsDetail(detail.value.NewsKind, detail.value.NewsId)
	detailLoading.value = false
	initManualForm()
}

// 保存人工修正分类
async function saveManual() {
	if (!detail.value) return
	const category = manualForm.value.category
	const subCategory = category === 9 ? 0 : manualForm.value.subCategory
	savingManual.value = true
	try {
		await API.classifyZdxNews(
			detail.value.NewsKind,
			detail.value.NewsId,
			category,
			subCategory,
			manualForm.value.direction,
			manualForm.value.strength
		)
		await refreshDetail()
		loadStats()
		get()
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		savingManual.value = false
	}
}

// ---------- 页面跳转 ----------
// 跳转板块行情页（行业名称对齐 zdx_sector 口径；未匹配仍展示但使用目标名称）
function openSector(item: IZdxNewsImpact) {
	const name = item.TargetCode || item.TargetName
	if (!name) return
	browserStore.navigate(SECTOR_MENU, undefined, { name })
}

// 跳转个股详情页（目标代码命中股票池才可跳转）
function openStock(item: IZdxNewsImpact) {
	if (!item.TargetCode) return
	browserStore.navigate(STOCK_MENU, undefined, { code: item.TargetCode })
}

// 按代码跳转个股详情页（详情抽屉股票代码快捷入口）
function openStockByCode(code: string) {
	if (!code) return
	browserStore.navigate(STOCK_MENU, undefined, { code })
}

// ---------- 消息面日报 ----------
// 查看日报
async function viewDaily() {
	dailyLoading.value = true
	try {
		daily.value = await API.getZdxNewsDailyReport(dailyDate.value)
	} finally {
		dailyLoading.value = false
	}
}

// 生成/重新生成日报
async function genDaily() {
	try {
		await ElMessageBox.confirm(
			`确认生成 ${dailyDate.value} 的消息面日报？生成内容为当日政策/公告/资讯三段式 AI 总结，耗时数秒至数十秒。`,
			'日报生成提示',
			{ type: 'warning', cancelButtonText: '放弃操作' }
		)
	} catch {
		return // 用户取消
	}
	dailyGenning.value = true
	try {
		await API.syncZdxNewsDailyReport(dailyDate.value)
		await viewDaily()
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		dailyGenning.value = false
	}
}

// ---------- 手动同步 ----------
// 快讯同步（腾讯指数新闻流优先→东财兜底→去重落库）
async function runSyncFlash() {
	if (syncing.value) return
	try {
		await ElMessageBox.confirm('确认执行「快讯同步」？腾讯指数新闻流优先，东财 7x24 快讯兜底。', '手动同步提示', {
			type: 'warning',
			cancelButtonText: '放弃操作'
		})
	} catch {
		return // 用户取消
	}
	syncing.value = 'flash'
	try {
		await API.syncZdxInfoFlash()
		loadStats()
		get()
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		syncing.value = ''
	}
}

// 批量分类（未分类消息限量处理；政策/高强度自动追加影响面分析）
async function runSyncClassify() {
	if (syncing.value) return
	try {
		await ElMessageBox.confirm('确认执行「批量分类」？未分类消息单轮限量 50 条并限速处理，耗时可能较长。', '手动同步提示', {
			type: 'warning',
			cancelButtonText: '放弃操作'
		})
	} catch {
		return // 用户取消
	}
	syncing.value = 'classify'
	try {
		await API.syncZdxNewsClassify()
		loadStats()
		get()
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		syncing.value = ''
	}
}
</script>

<style lang="scss" scoped>
.news-page {
	background: #fff;
	border-radius: 20px;
	padding: 20px;

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: auto;
		padding: 0 0 16px;
		border-bottom: 1px solid var(--el-border-color-lighter);

		.search-box {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 4px 0;
		}
	}

	.content {
		padding: 16px 0 0;
	}

	// 顶部统计卡
	.stats-box {
		display: flex;
		gap: 12px;
		margin-bottom: 8px;

		.stat-card {
			flex: 1;
			text-align: center;
			padding: 12px 8px;
			border-radius: 12px;
			background: var(--el-fill-color-light);

			.stat-value {
				font-size: 22px;
				font-weight: 600;
				color: var(--el-text-color-primary);

				&.pending {
					color: var(--el-color-warning);
				}
			}

			.stat-label {
				font-size: 12px;
				color: var(--el-text-color-secondary);
				margin-top: 4px;
			}
		}
	}

	// 消息流列表
	.news-list {
		min-height: 200px;

		.news-item {
			padding: 12px 16px;
			border-bottom: 1px solid var(--el-border-color-lighter);
			cursor: pointer;
			transition: background 0.2s;

			&:hover {
				background: var(--el-fill-color-light);
			}

			.item-head {
				display: flex;
				align-items: center;
				justify-content: space-between;

				.item-title {
					font-size: 15px;
					font-weight: 500;
					color: var(--el-text-color-primary);
					flex: 1;
					margin-right: 16px;
				}

				.item-time {
					font-size: 12px;
					color: var(--el-text-color-secondary);
					flex-shrink: 0;
				}
			}

			.item-tags {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				margin-top: 6px;
			}

			.item-summary {
				margin-top: 6px;
				font-size: 13px;
				color: var(--el-text-color-secondary);
				line-height: 1.6;
				overflow: hidden;
				text-overflow: ellipsis;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
			}
		}
	}

	// 消息面日报面板
	.daily-box {
		margin-top: 20px;
		border: 1px solid var(--el-border-color-lighter);
		border-radius: 12px;

		.daily-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px 16px;
			border-bottom: 1px solid var(--el-border-color-lighter);

			.daily-title {
				font-size: 15px;
				font-weight: 600;
				color: var(--el-text-color-primary);
			}

			.daily-ops {
				display: flex;
				align-items: center;
			}
		}

		.daily-body {
			padding: 16px;
			min-height: 120px;

			.daily-content {
				font-size: 14px;
				color: var(--el-text-color-primary);
				line-height: 1.8;
				white-space: pre-wrap;

				.daily-meta {
					font-size: 12px;
					color: var(--el-text-color-secondary);
					margin-bottom: 8px;
				}
			}
		}
	}
}

// 详情抽屉
.detail-box {
	.detail-title {
		font-size: 17px;
		font-weight: 600;
		color: var(--el-text-color-primary);
		line-height: 1.5;
		margin-bottom: 10px;
	}

	.detail-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px 0;

		.meta-text {
			font-size: 12px;
			color: var(--el-text-color-secondary);
			margin-right: 12px;
		}
	}

	.detail-stock {
		margin-top: 10px;
	}

	.detail-summary {
		margin-top: 12px;
		padding: 12px;
		border-radius: 8px;
		background: var(--el-fill-color-light);
		font-size: 13px;
		color: var(--el-text-color-regular);
		line-height: 1.8;
		white-space: pre-wrap;
		max-height: 300px;
		overflow-y: auto;
	}

	.section-title {
		font-size: 14px;
		font-weight: 600;
	}

	.ai-tags {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px 0;

		.meta-text {
			font-size: 12px;
			color: var(--el-text-color-secondary);
		}
	}

	.ai-summary {
		margin-top: 10px;
		font-size: 13px;
		color: var(--el-text-color-regular);
		line-height: 1.8;
		white-space: pre-wrap;
	}

	.ai-empty {
		text-align: center;
	}

	.impact-block {
		.impact-subtitle {
			font-size: 13px;
			color: var(--el-text-color-secondary);
			margin-bottom: 8px;
		}

		.impact-cards {
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
		}

		.impact-card {
			width: calc(50% - 5px);
			padding: 10px 12px;
			border: 1px solid var(--el-border-color-lighter);
			border-radius: 8px;
			cursor: pointer;
			transition: all 0.2s;

			&:hover {
				border-color: var(--el-color-primary);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
			}

			.impact-head {
				display: flex;
				align-items: center;
				justify-content: space-between;

				.impact-name {
					font-size: 14px;
					font-weight: 500;
					color: var(--el-text-color-primary);
				}
			}

			.impact-reason {
				margin-top: 6px;
				font-size: 12px;
				color: var(--el-text-color-secondary);
				line-height: 1.6;
			}
		}
	}

	.impact-empty {
		font-size: 13px;
		color: var(--el-text-color-secondary);
		padding: 8px 0;
	}

	.manual-box {
		display: flex;
		align-items: center;
		flex-wrap: wrap;

		.manual-tip {
			width: 100%;
			margin-top: 8px;
			font-size: 12px;
			color: var(--el-text-color-secondary);
		}
	}
}
</style>
