<template>
	<div class="finance-info">
		<el-empty v-if="!data" description="暂无数据"></el-empty>
		<template v-else>
			<!-- 净利润图表 -->
			<div ref="chart" class="profit-chart"></div>
			<!-- 报告期类型筛选（纯前端列过滤） -->
			<div class="filter-row">
				<el-radio-group v-model="reportType" size="small">
					<el-radio-button v-for="r in REPORT_TYPES" :key="r.value" :value="r.value">{{ r.label }}</el-radio-button>
				</el-radio-group>
			</div>
			<!-- 指标表格 -->
			<div class="table-title">每股指标</div>
			<el-table :data="data.PerShareRows" class="ofa-table finance-table" size="small">
				<el-table-column prop="name" label="指标" width="180" fixed></el-table-column>
				<el-table-column v-for="p in filteredPeriods" :key="p" :prop="p" :label="p" align="right" min-width="110"></el-table-column>
			</el-table>
			<div class="table-title">成长能力指标</div>
			<el-table :data="data.GrowthRows" class="ofa-table" size="small">
				<el-table-column prop="name" label="指标" width="180" fixed></el-table-column>
				<el-table-column v-for="p in filteredPeriods" :key="p" :prop="p" :label="p" align="right" min-width="110"></el-table-column>
			</el-table>
		</template>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { IZdxStockFinance } from '@/interfaces/zhiduoxing/IZdxStockDetail'

const props = defineProps<{
	data?: IZdxStockFinance
}>()

// 报告期类型（按日期后缀过滤列）
const REPORT_TYPES = [
	{ label: '全部', value: 'all' },
	{ label: '年报', value: 'year' },
	{ label: '三季报', value: 'q3' },
	{ label: '中报', value: 'half' },
	{ label: '季报', value: 'q1' }
]
const PERIOD_SUFFIX: Record<string, string> = { year: '12-31', q3: '09-30', half: '06-30', q1: '03-31' }
const reportType = ref('all')

const filteredPeriods = computed(() => {
	const periods = props.data?.Periods ?? []
	if (reportType.value === 'all') return periods
	const suffix = PERIOD_SUFFIX[reportType.value]
	return periods.filter(p => p.endsWith(suffix))
})

// 净利润图表（柱=归属净利润，线=同比）
const chart = ref(null)
let myEchart: echarts.ECharts | null = null

function renderChart() {
	if (!myEchart) return
	const trend = props.data?.ProfitTrend ?? []
	if (!trend.length) {
		myEchart.clear()
		return
	}
	myEchart.setOption(
		{
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'shadow' },
				backgroundColor: 'rgba(50, 50, 50, 0.85)',
				borderColor: 'rgba(50, 50, 50, 0.85)',
				borderRadius: 8,
				textStyle: { color: '#fff', fontSize: 12 }
			},
			legend: {
				data: ['归属净利润（亿元）', '同比'],
				top: 6,
				left: 10,
				itemWidth: 15,
				itemHeight: 10,
				textStyle: { color: '#8C8C8C' }
			},
			grid: { left: '3%', right: '5%', bottom: '3%', top: '14%', containLabel: true },
			xAxis: {
				type: 'category',
				data: trend.map(d => d.Date),
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: { color: '#a7abba' },
				splitLine: { show: true, lineStyle: { type: 'dashed', color: '#f0f2f7' } }
			},
			yAxis: [
				{
					type: 'value',
					axisLine: { show: false },
					axisTick: { show: false },
					axisLabel: { color: '#a7abba' },
					splitLine: { show: true, lineStyle: { type: 'dashed', color: '#f0f2f7' } }
				},
				{
					type: 'value',
					axisLine: { show: false },
					axisTick: { show: false },
					axisLabel: { color: '#a7abba', formatter: '{value}%' },
					splitLine: { show: false }
				}
			],
			series: [
				{
					name: '归属净利润（亿元）',
					type: 'bar',
					barWidth: 20,
					itemStyle: { borderRadius: [4, 4, 0, 0], color: '#409eff' },
					data: trend.map(d => d.Value)
				},
				{
					name: '同比',
					type: 'line',
					yAxisIndex: 1,
					showSymbol: true,
					symbolSize: 5,
					color: ['#ffd966'],
					lineStyle: { width: 2 },
					data: trend.map(d => d.Yoy)
				}
			]
		},
		true
	)
}

function handleResize() {
	myEchart?.resize()
}

// 图表初始化（tab 懒加载 + 数据晚到场景：容器出现后再初始化）
function ensureChart() {
	if (!myEchart && chart.value) myEchart = echarts.init(chart.value)
	return myEchart
}

// 重渲染（等待容器挂载并校准尺寸）
async function refreshChart() {
	await nextTick()
	const chartIns = ensureChart()
	if (!chartIns) return
	if (chartIns.getWidth() === 0) chartIns.resize()
	renderChart()
}

// 数据到达/切换股票后重新渲染；数据重置时销毁实例（图表容器随空态移除）
watch(() => props.data, value => {
	if (!value) {
		myEchart?.dispose()
		myEchart = null
		return
	}
	refreshChart()
})

onMounted(() => {
	refreshChart()
	window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
	window.removeEventListener('resize', handleResize)
	myEchart?.dispose()
})
</script>

<style lang="scss" scoped>
.finance-info {
	padding: 10px 20px;
	min-height: 120px;

	.profit-chart {
		height: 300px;
	}

	.filter-row {
		display: flex;
		align-items: center;
		padding: 16px 0;
		border-bottom: 1px solid #f5f6fb;
	}

	.table-title {
		font-size: 15px;
		font-weight: 600;
		color: #303133;
		padding: 16px 0 10px;
	}

	.finance-table {
		margin-bottom: 10px;
	}
}
</style>
