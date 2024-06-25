<template>
	<div class="personal-liveness">
		<div class="liveness-top">
			<div class="title-box">
				<div class="icon icon-danger">
					<font-awesome-icon fas icon="fire"></font-awesome-icon>
				</div>
				<span>工作活跃度</span>
			</div>
		</div>
		<div style="height: 236px" ref="chart"></div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dayjs } from 'element-plus'
import * as echarts from 'echarts'
import API from '@/apis/syslog-api'
import { IPersonalLiveness } from '@/interfaces/IPersonalLiveness'

const chart = ref(null)
const liveness = ref<IPersonalLiveness>()

// 获取个人工作活跃度
function getPersonalLiveness() {
	const date = dayjs(new Date()).subtract(5, 'days').format('YYYY-MM-DD')
	API.getPersonalLiveness(new Date(date), new Date())
		.then(res => {
			liveness.value = res
		})
		.finally(() => {
			initChart()
		})
}

// 初始化图表
function initChart() {
	const myEchart = echarts.init(chart.value)
	const option = {
		legend: {
			itemWidth: 15,
			itemHeight: 10,
			itemGap: 12,
			left: '3%',
			top: '3%',
			textStyle: {
				color: '#8C8C8C'
			},
			data: [
				{
					icon: 'roundRect',
					name: '我的'
				},
				{
					icon: 'roundRect',
					name: '同事'
				}
			]
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: 'none'
			},
			backgroundColor: '#909399',
			borderRadius: 8
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '3%',
			top: '15%',
			containLabel: true
		},
		xAxis: {
			boundaryGap: false, // x 轴折线图从头开始
			type: 'category',
			data: liveness.value?.Dates.map(m => {
				return dayjs(m.Date).format('MM-DD')
			}),
			axisLine: {
				show: false // 不显示 x 轴轴线
			},
			axisTick: {
				show: false // 不显示 x 轴刻度
			},
			splitLine: {
				show: true, // 显示 x 轴网格线
				lineStyle: {
					type: 'dashed' // 设置 x 轴网格线为虚线
				}
			}
		},
		yAxis: {
			type: 'value',
			axisLine: {
				show: false // 不显示 x 轴轴线
			},
			axisTick: {
				show: false // 不显示 x 轴刻度
			},
			splitLine: {
				show: true, // 显示 y 轴网格线
				lineStyle: {
					type: 'dashed' // 设置 y 轴网格线为虚线
				}
			}
		},
		series: [
			{
				name: '我的',
				type: 'line',
				showSymbol: false, // 是否显示圆点
				symbolSize: 7, // 圆点尺寸
				color: ['#409eff'],
				areaStyle: {
					color: new echarts.graphic.LinearGradient(
						0,
						0,
						0,
						0.8,
						[
							{ offset: 0, color: '#409eff' },
							{ offset: 1, color: 'rgba(64, 158, 255, 0)' }
						],
						false
					)
				},
				data: liveness.value?.Dates.map(m => {
					return m.Value
				})
			},
			{
				name: '同事',
				type: 'line',
				showSymbol: false,
				symbolSize: 7,
				color: ['#ffd966'],
				areaStyle: {
					color: new echarts.graphic.LinearGradient(
						0,
						0,
						0,
						0.8,
						[
							{ offset: 0, color: '#ffd966' },
							{ offset: 1, color: 'rgba(255, 217, 102, 0)' }
						],
						false
					)
				},
				data: liveness.value?.Dates.map(m => {
					return m.AvgValue
				})
			}
		]
	}
	myEchart.setOption(option)
	window.onresize = () => {
		myEchart.resize()
	}
}

onMounted(() => {
	getPersonalLiveness()
})
</script>

<style lang="scss" scoped>
.personal-liveness {
	background-color: #fff;
	border-radius: 20px;
	margin-top: 20px;

	.liveness-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px;

		.title-box {
			display: flex;
			align-items: center;
			span {
				font-size: 18px;
				font-weight: 500;
				color: rgba(0, 0, 0, 0.85);
			}

			.icon {
				display: flex;
				justify-content: center;
				align-items: center;
				width: 24px;
				height: 24px;
				border-radius: 50%;
				color: #fff;

				&-danger {
					background-color: #f56c6c;
					margin-right: 4px;
				}
			}
		}
	}
}
</style>