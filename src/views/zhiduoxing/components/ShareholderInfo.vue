<template>
	<div class="shareholder-info">
		<el-empty v-if="!data" description="暂无数据"></el-empty>
		<template v-else>
			<!-- 十大流通股东 -->
			<div class="holder-header">
				<span class="table-title">十大流通股东</span>
				<el-select v-model="date" size="small" style="width: 130px">
					<el-option v-for="d in data.Dates" :key="d" :label="d" :value="d"></el-option>
				</el-select>
			</div>
			<el-table :data="data.TopHolders" class="ofa-table" size="small">
				<el-table-column prop="Name" label="股东名称" min-width="380"></el-table-column>
				<el-table-column prop="Shares" label="持股数(股)" width="170" align="right"></el-table-column>
				<el-table-column prop="Ratio" label="占流通股比" width="110" align="right"></el-table-column>
				<el-table-column prop="Change" label="环比增减" width="110" align="right">
					<template #default="scope">
						<span :class="changeClass(scope.row)">{{ scope.row.Change }}</span>
					</template>
				</el-table-column>
			</el-table>
			<!-- 股东人数 -->
			<div class="table-title">股东人数</div>
			<div ref="chart" class="holder-chart"></div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { IZdxShareholderInfo, IZdxHolder } from '@/interfaces/zhiduoxing/IZdxStockDetail'

const props = defineProps<{
	data?: IZdxShareholderInfo
}>()

// 报告期（后端暂只返回当期一份数据，以 Dates 为准）
const date = ref('')
watch(
	() => props.data,
	() => {
		date.value = props.data?.Dates?.[0] ?? ''
	},
	{ immediate: true }
)

function changeClass(row: IZdxHolder) {
	if (row.ChangeType === 'up') return 'up'
	if (row.ChangeType === 'down') return 'down'
	return 'flat'
}

// ---------- 股东人数图表（柱=股东人数，线=股价，浅色虚线柱=预测值） ----------
const chart = ref(null)
let myEchart: echarts.ECharts | null = null

// 图表初始化（tab 懒加载 + 数据晚到场景：容器出现后再初始化）
function ensureChart() {
	if (!myEchart && chart.value) myEchart = echarts.init(chart.value)
	return myEchart
}

function renderChart() {
	if (!myEchart) return
	const trend = props.data?.HolderCountTrend ?? []
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
				data: ['股东人数（万户）', '股价（元）', '预测股东人数'],
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
			yAxis: {
				type: 'value',
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: { color: '#a7abba' },
				splitLine: { show: true, lineStyle: { type: 'dashed', color: '#f0f2f7' } }
			},
			series: [
				{
					name: '股东人数（万户）',
					type: 'bar',
					barWidth: 18,
					itemStyle: { borderRadius: [4, 4, 0, 0], color: '#409eff' },
					data: trend.map(d => (d.IsForecast ? null : d.Count))
				},
				{
					name: '股价（元）',
					type: 'line',
					showSymbol: true,
					symbolSize: 5,
					color: ['#ffd966'],
					lineStyle: { width: 2 },
					data: trend.map(d => d.Price)
				},
				{
					name: '预测股东人数',
					type: 'bar',
					barWidth: 18,
					itemStyle: {
						borderRadius: [4, 4, 0, 0],
						color: 'rgba(64, 158, 255, 0.4)',
						borderColor: '#409eff',
						borderType: 'dashed'
					},
					data: trend.map(d => (d.IsForecast ? d.Count : null))
				}
			]
		},
		true
	)
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

function handleResize() {
	myEchart?.resize()
}

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
.shareholder-info {
	padding: 10px 20px;
	min-height: 120px;

	.holder-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 0 12px;
	}

	.table-title {
		font-size: 15px;
		font-weight: 600;
		color: #303133;
		padding: 16px 0 10px;
	}

	.holder-chart {
		height: 300px;
		margin-top: 10px;
	}

	.up {
		color: var(--el-color-danger);
	}

	.down {
		color: var(--el-color-success);
	}

	.flat {
		color: #606266;
	}
}
</style>
