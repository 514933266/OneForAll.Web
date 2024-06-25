<template>
	<div class="welcome-bottom">
		<div class="left-bottom">
			<div class="bottom-header">
				<div class="left-header">
					<span class="left-header-title">工作活跃度</span>
					<span class="left-header-desc">（近{{ livenessDateTypes[livenessDateIndex] }}）</span>
				</div>
				<div class="right-header">
					<div
						v-for="(item, index) in livenessDateTypes"
						:key="item"
						:class="{ active: livenessDateIndex === index }"
						@click="changeLivenessType(index)"
					>
						{{ item }}
					</div>
				</div>
			</div>
			<div style="height: 406px" ref="chart"></div>
		</div>
		<div class="right-bottom">
			<div class="bottom-header">
				<div class="left-header">
					<span class="left-header-title">动态</span>
				</div>
				<div class="right-header">
					<div
						v-for="(item, index) in activityTypes"
						:key="item"
						:class="{ active: activityTypeIndex === index }"
						@click="activityTypeIndex = index"
					>
						{{ item }}
					</div>
				</div>
			</div>
			<div v-if="activityTypeIndex == 0" class="transition-box">
				<div class="activityTypeIndex-item" v-for="item in persons" :key="item.Id">
					<el-avatar class="pic-box" shape="square" :size="50" :src="domain + item.IconUrl">
						<font-awesome-icon fas icon="image"></font-awesome-icon>
					</el-avatar>
					<div class="activityTypeIndex-item-right-box">
						<div class="activityTypeIndex-item-right">
							<span class="pople-name">{{ item.Name }}</span>
							<div class="pople-name-right">
								<div class="pople-name-right-tag"></div>
								<div class="pople-name">
									{{ item.EmployeeType ? item.EmployeeType : '全职' }}
								</div>
							</div>
						</div>
						<div class="activityTypeIndex-item-right pople-name-time">
							<div>{{ item.Job }}</div>
							<div>{{ dayjs(item.EntryDate).format('YYYY-MM-DD') }}</div>
						</div>
					</div>
				</div>
			</div>
			<div v-if="activityTypeIndex == 1" class="transition-box">
				<el-timeline>
					<el-timeline-item
						v-for="(item, index) in loginLogs"
						:key="index"
						type="primary"
						:timestamp="dayjs(item?.CreateTime).format('YYYY-MM-DD')"
					>
						<span class="line-name">
							{{ item?.CreatorName }}&nbsp;<label class="line-name-remark">({{ item?.UserName }})</label>
						</span>
						<span class="line-name line-name-success">登录了系统</span>
					</el-timeline-item>
				</el-timeline>
			</div>
			<div v-if="activityTypeIndex == 2" class="transition-box">
				<!-- <el-timeline>
					<el-timeline-item v-for="(activity, index) in activity" :key="index" :timestamp="activity.timestamp">
						<span class="line-name">{{ activity.name }}</span>
						<span class="line-name" style="color: #a7abba">{{ activity.act }}</span>
						<span class="line-name">{{ activity.content }}</span>
					</el-timeline-item>
				</el-timeline> -->
			</div>
			<div v-if="activityTypeIndex == 3" class="transition-box">
				<!-- <el-timeline>
					<el-timeline-item v-for="(activity, index) in activityThree" :key="index" :timestamp="activity.timestamp">
						<div class="three-line">
							<div class="pic-box"></div>
							<div class="mr5">
								<div class="line-name">{{ activity.name }}</div>
								<div class="line-desc">{{ activity.content }}</div>
							</div>
							<span class="mr5 line-desc">在</span>
							<span class="mr5 line-name">提交代码</span>
							<span class="line-name">@我</span>
						</div>
					</el-timeline-item>
				</el-timeline> -->
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dayjs } from 'element-plus'
import * as echarts from 'echarts'
import SYSLOG_API from '@/apis/syslog-api'
import OA_API from '@/apis/oa-api'
import { IPersonalLiveness } from '@/interfaces/IPersonalLiveness'
import { INewPerson } from '@/interfaces/INewPerson'
import { IPersonalLoginLog } from '@/interfaces/IPersonalLoginLog'

const chart = ref(null)
const activityTypeIndex = ref(0) // 活跃度激活下标
const livenessDateIndex = ref(0)
const liveness = ref<IPersonalLiveness>()

const persons = ref<INewPerson[]>([])
const loginLogs = ref<IPersonalLoginLog[]>([])
const livenessDateTypes = ref(['7日', '14日', '30日'])
const activityTypes = ref(['新同事', '登录', '活动', '@我'])
const domain = ref(OA_API.getHost())

// 获取个人工作活跃度
function getPersonalLiveness() {
	const seed = livenessDateIndex.value === 0 ? 7 : livenessDateIndex.value === 1 ? 14 : 30
	const date = dayjs(new Date()).subtract(seed, 'days').format('YYYY-MM-DD')
	SYSLOG_API.getPersonalLiveness(new Date(date), new Date())
		.then(res => {
			liveness.value = res
		})
		.finally(() => {
			initChart()
		})
}

// 获取近10条登录日志
function getLoginLogs() {
	SYSLOG_API.getPersonalLoginLogs().then(res => {
		loginLogs.value = res
	})
}

// 获取近三个月新入职同事
function getNewPersons() {
	OA_API.getNewPersons().then(res => {
		persons.value = res
	})
}

// 切换活跃度统计类型
function changeLivenessType(index: number) {
	livenessDateIndex.value = index
	getPersonalLiveness()
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
	getNewPersons()
	getLoginLogs()
})
</script>

<style lang="scss" scoped>
.welcome-bottom {
	display: flex;
	flex-wrap: nowrap;
	margin-bottom: 20px;

	.left-bottom {
		flex: 1;
		background-color: #ffffff;
		border-radius: 16px;
		margin-right: 20px;
	}

	.left-bottom,
	.right-bottom {
		height: 480px;

		.bottom-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 20px 0 20px;
			margin: 0 30px;
			border-bottom: 1px solid #f5f6fb;

			.left-header-title {
				font-size: 16px;
				font-weight: 600;
				line-height: 24px;
			}

			.left-header-desc {
				color: #909399;
				font-size: 0.85rem;
			}

			.right-header {
				display: flex;
				align-content: center;

				div {
					padding: 5px 12px;
					font-size: 14px;
					font-weight: 500;
					color: #a7abba;
					line-height: 20px;
					border-radius: 6px;
					border: 1px solid #a7abba;
					cursor: pointer;
					margin-right: 8px;
				}

				.active {
					background: #409eff;
					border: 1px solid #409eff;
					color: #fff;
				}
			}
		}
	}

	.right-bottom {
		display: flex;
		flex-direction: column;
		width: 400px;
		background-color: #fff;
		border-radius: 16px;

		.transition-box {
			box-sizing: border-box;
			height: 434px;
			padding: 10px 20px;
			overflow-y: auto;

			.activityTypeIndex-item {
				display: flex;
				align-items: center;
				padding: 10px 0;
				border-bottom: 1px solid #eaebec;

				.activityTypeIndex-item-right-box {
					flex: 1;
				}

				.activityTypeIndex-item-right {
					display: flex;
					align-items: center;
					justify-content: space-between;

					&.pople-name-time {
						font-size: 12px;
						font-weight: 500;
						color: #a7abba;
						line-height: 18px;
					}

					.pople-name {
						font-size: 14px;
						font-weight: 500;
						color: #2e3543;
						line-height: 20px;
					}

					.pople-name-right {
						display: flex;
						align-items: center;

						.pople-name-right-tag {
							width: 20px;
							height: 7px;
							border-radius: 10px 10px 10px 10px;
							margin-right: 6px;
						}
					}
				}
			}

			:deep(.el-timeline-item__tail) {
				top: 18px;
				height: 60%;
			}
		}

		.line-name {
			font-size: 14px;
			font-weight: 500;
			color: #2e3543;
			margin-right: 5px;

			&-remark {
				color: #909399;
			}

			&-success {
				color: #67c23a;
			}
		}

		.line-desc {
			font-size: 14px;
			color: #a7abba;
		}
	}
}

.pic-box {
	width: 44px;
	height: 44px;
	margin-right: 12px;
}

.three-line {
	display: flex;
	align-items: center;

	.mr5 {
		margin-right: 5px;
	}
}
</style>