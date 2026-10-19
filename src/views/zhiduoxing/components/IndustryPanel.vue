<template>
	<div v-loading="loading" class="industry-panel">
		<div class="panel-header">
			<span class="panel-title">行业行情 {{ data?.Name || sector }}</span>
			<span class="panel-link" @click="$emit('detail')">详情 ></span>
		</div>
		<el-empty v-if="!loading && !data" description="暂无行业行情数据" :image-size="80"></el-empty>
		<div v-else class="panel-content">
			<div class="index-box">
				<div class="index-value" :class="changeCls">{{ data ? data.Value.toFixed(2) : '--' }}</div>
				<div class="index-change" :class="changeCls">
					<template v-if="data">{{ formatAmount(data.Change) }} {{ formatPercent(data.Change) }}</template>
					<template v-else>--</template>
				</div>
				<div class="index-stats">
					<span>上涨 <label class="up">{{ data?.Up ?? 0 }}家</label></span>
					<span>平盘 <label class="flat">{{ data?.Flat ?? 0 }}家</label></span>
					<span>下跌 <label class="down">{{ data?.Down ?? 0 }}家</label></span>
				</div>
				<div class="ratio-bar">
					<div class="ratio-up" :style="{ width: upRatio + '%' }"></div>
					<div class="ratio-flat" :style="{ width: flatRatio + '%' }"></div>
					<div class="ratio-down" :style="{ width: downRatio + '%' }"></div>
				</div>
				<div class="ratio-text">
					<span class="up">{{ upRatio }}%</span>
					<span class="flat">{{ flatRatio }}%</span>
					<span class="down">{{ downRatio }}%</span>
				</div>
			</div>
			<div class="chart-box">
				<div ref="chart" class="chart"></div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { formatPercent, formatAmount } from '@/consts/zhiduoxing-const'
import { IZdxSectorDetail } from '@/interfaces/zhiduoxing/IZdxStockDetail'
import zdxApi from '@/apis/zdx-api'

const props = defineProps<{
	sector: string
}>()

defineEmits<{
	detail: []
}>()

const upColor = '#f56c6c'
const downColor = '#67c23a'

const data = ref<IZdxSectorDetail>()
const loading = ref(false)

// 涨跌样式（指数与涨跌行共用）
const changeCls = computed(() => {
	const change = data.value?.Change
	if (change === undefined || change === null || change === 0) return 'flat'
	return change > 0 ? 'up' : 'down'
})
const upRatio = computed(() => {
	const total = data.value?.Total ?? 0
	return total ? Math.round(((data.value?.Up ?? 0) / total) * 100) : 0
})
const downRatio = computed(() => {
	const total = data.value?.Total ?? 0
	return total ? Math.round(((data.value?.Down ?? 0) / total) * 100) : 0
})
// 平盘占比=剩余部分（保证比例条三段合计100%）
const flatRatio = computed(() => Math.max(0, 100 - upRatio.value - downRatio.value))

// ---------- 数据加载（序号防竞态：快速切换股票时丢弃过期响应） ----------
let loadSeq = 0
async function loadSector(name: string) {
	if (!name) {
		data.value = undefined
		return
	}
	const seq = ++loadSeq
	loading.value = true
	try {
		const res = await zdxApi.getSectorDetail(name)
		if (seq !== loadSeq) return
		data.value = res
	} catch {
		if (seq !== loadSeq) return
		data.value = undefined
	} finally {
		if (seq === loadSeq) loading.value = false
	}
}

watch(
	() => props.sector,
	name => {
		loadSector(name)
	},
	{ immediate: true }
)

// ---------- 近1月走势 + 成交量小图 ----------
const chart = ref(null)
let myEchart: echarts.ECharts | null = null

// 图表初始化（数据晚到场景：容器出现后再初始化）
function ensureChart() {
	if (!myEchart && chart.value) myEchart = echarts.init(chart.value)
	return myEchart
}

function renderChart() {
	if (!myEchart) return
	const trends = data.value?.Trends ?? []
	if (!trends.length) {
		myEchart.clear()
		return
	}
	const lineColor = (data.value?.Change ?? 0) >= 0 ? upColor : downColor
	myEchart.setOption(
		{
			animation: false,
			tooltip: {
				trigger: 'axis',
				backgroundColor: 'rgba(50, 50, 50, 0.85)',
				borderColor: 'rgba(50, 50, 50, 0.85)',
				borderRadius: 8,
				textStyle: { color: '#fff', fontSize: 12 }
			},
			legend: {
				data: ['近1月走势', '成交量'],
				top: 4,
				left: 10,
				itemWidth: 15,
				itemHeight: 10,
				textStyle: { color: '#8C8C8C' }
			},
			grid: [
				{ left: 50, right: 16, top: 34, height: '42%' },
				{ left: 50, right: 16, top: '68%', height: '20%' }
			],
			xAxis: [
				{
					type: 'category',
					data: trends.map(d => d.Date),
					axisLine: { show: false },
					axisTick: { show: false },
					// 刻度标签：首尾交易日必显（末位=最新交易日）；中间按约6枚均匀分布，且距末位至少 step 个点距避免与末位重叠
					axisLabel: {
						color: '#a7abba',
						hideOverlap: true,
						interval: (index: number) => {
							const total = trends.length
							if (index === 0 || index === total - 1) return true
							const step = Math.max(1, Math.ceil(total / 6))
							return index % step === 0 && total - 1 - index >= step
						}
					}
				},
				{
					type: 'category',
					gridIndex: 1,
					data: trends.map(d => d.Date),
					axisLine: { show: false },
					axisTick: { show: false },
					axisLabel: { show: false }
				}
			],
			yAxis: [
				{
					type: 'value',
					scale: true,
					axisLine: { show: false },
					axisTick: { show: false },
					axisLabel: { color: '#a7abba' },
					splitLine: { show: true, lineStyle: { type: 'dashed', color: '#f0f2f7' } }
				},
				{
					type: 'value',
					gridIndex: 1,
					axisLine: { show: false },
					axisTick: { show: false },
					splitLine: { show: false },
					axisLabel: { show: false }
				}
			],
			series: [
				{
					name: '近1月走势',
					type: 'line',
					showSymbol: false,
					color: [lineColor],
					lineStyle: { width: 1.5 },
					areaStyle: {
						color: new echarts.graphic.LinearGradient(
							0,
							0,
							0,
							0.8,
							[
								{ offset: 0, color: lineColor + '44' },
								{ offset: 1, color: lineColor + '00' }
							],
							false
						)
					},
					data: trends.map(d => d.Close)
				},
				{
					name: '成交量',
					type: 'bar',
					xAxisIndex: 1,
					yAxisIndex: 1,
					data: trends.map((d, i) => ({
						value: d.Volume,
						itemStyle: { color: d.Close >= (trends[i - 1]?.Close ?? d.Close) ? upColor : downColor }
					}))
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

// 数据到达/切换行业后重新渲染；数据重置时销毁实例（图表容器随空态移除）
watch(() => data.value, value => {
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
.industry-panel {
	background: #fff;
	border-radius: 16px;
	min-height: 120px;
	margin-bottom: 20px;

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 24px;
		border-bottom: 1px solid #f5f6fb;

		.panel-title {
			font-size: 16px;
			font-weight: 600;
			color: #303133;
		}

		.panel-link {
			font-size: 13px;
			color: #409eff;
			cursor: pointer;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	.panel-content {
		display: flex;
		padding: 16px 24px;

		.index-box {
			width: 260px;
			margin-right: 24px;

			.index-value {
				font-size: 2rem;
				font-weight: bold;
			}

			.index-change {
				font-size: 14px;
				margin-top: 6px;
			}

			.index-stats {
				display: flex;
				align-items: center;
				font-size: 13px;
				color: #606266;
				margin-top: 14px;

				span {
					margin-right: 16px;
				}
			}

			.ratio-bar {
				display: flex;
				height: 10px;
				border-radius: 5px;
				overflow: hidden;
				margin-top: 14px;

				.ratio-up {
					background: var(--el-color-danger);
				}

				.ratio-flat {
					background: #dcdfe6;
				}

				.ratio-down {
					background: var(--el-color-success);
				}
			}

			.ratio-text {
				display: flex;
				justify-content: space-between;
				font-size: 12px;
				margin-top: 6px;
			}
		}

		.chart-box {
			flex: 1;
			min-width: 0;

			.chart {
				height: 250px;
			}
		}
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
