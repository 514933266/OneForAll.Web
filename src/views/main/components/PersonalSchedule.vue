<template>
	<div class="personal-schedule">
		<div class="top-box">
			<div class="title-box">
				<div class="icon icon-primary">
					<font-awesome-icon fas icon="paper-plane"></font-awesome-icon>
				</div>
				<span>{{ dayjs(entity.SettingDate).format('M月份') }}日程安排</span>
			</div>
			<div class="btn-box">
				<el-button link :type="activeNum == 0 ? 'primary' : ''" @click="activeNum = 0">
					<font-awesome-icon fas icon="calendar"></font-awesome-icon>
				</el-button>
				<el-button link :type="activeNum == 1 ? 'primary' : ''" @click="activeNum = 1">
					<font-awesome-icon fas icon="list-ul"></font-awesome-icon>
				</el-button>
				<el-button link @click="getPrevDate">
					<font-awesome-icon fas icon="circle-arrow-left"></font-awesome-icon>
				</el-button>
				<el-button link @click="getNextDate">
					<font-awesome-icon fas icon="circle-arrow-right"></font-awesome-icon>
				</el-button>
			</div>
		</div>
		<!-- 日历模式 -->
		<div v-show="activeNum == 0" class="calendar-box">
			<el-calendar v-model="entity.SettingDate">
				<template #date-cell="{ data }">
					<el-tooltip v-if="dates.includes(data.day)" :content="getScheduleData(data.day)" placement="top">
						<div class="date-box">
							{{ data.day.split('-')[2] }}
							<font-awesome-icon fas icon="circle" class="icon-danger" style="font-size: 10px"></font-awesome-icon>
						</div>
					</el-tooltip>
					<el-dropdown v-else @handleOpen="changeDate" placement="bottom" trigger="click" class="schedule-add-box">
						<div class="date-box">
							<div>{{ data.day.split('-')[2] }}</div>
						</div>
						<template #dropdown>
							<el-dropdown-menu>
								<div class="schedule-add-box">
									<div class="title-box">
										<font-awesome-icon fas icon="pen"></font-awesome-icon>
										<span>备注内容</span>
									</div>
									<el-input
										show-word-limit
										type="textarea"
										placeholder="20个字符以内的简短提醒内容"
										v-model="entity.Content"
										class="textarea-input"
										maxlength="20"
									></el-input>
									<div class="title-box">
										<font-awesome-icon fas icon="volume-off"></font-awesome-icon>
										<span>提醒方式</span>
									</div>
									<el-radio-group v-model="entity.NotifyTimeType">
										<el-radio :value="0">提前3天提醒</el-radio>
										<el-radio :value="1">提前1天提醒</el-radio>
										<el-radio :value="99"
											>提前<el-input v-model="entity.NotifyTimeSpan" style="width: 40px" class="num-input"></el-input
											>小时提醒</el-radio
										>
									</el-radio-group>
									<div class="bottom-box">
										<div>
											<img src="@/assets/images/wechat.svg" alt="" />
											<span>接收微信提醒需要关注</span>
											<el-text @click="dialogVisible = true" type="warning">微信公众号</el-text>
										</div>
										<div class="btn-box">
											<el-button type="primary" @click="add">确定</el-button>
										</div>
									</div>
									<el-dialog title="微信扫码关注" v-model="dialogVisible" width="318px" center class="ewm-dialog">
										<div class="ewm-box-div">
											<label>关注后请发送内容：<label class="ofa-text-danger">绑定账号:账号</label></label>
											<div class="ewm-box ofa-mt10">
												<img src="@/assets/images/wxgzh-qrcode.jpg" alt="" />
											</div>
										</div>
									</el-dialog>
								</div>
							</el-dropdown-menu>
						</template>
					</el-dropdown>
				</template>
			</el-calendar>
		</div>
		<!-- 列表模式 -->
		<div v-show="activeNum == 1" class="list-box">
			<div class="title-box">
				<span class="tips">共有&nbsp;{{ list.length }}&nbsp;条提醒</span>
			</div>
			<div v-for="item in list" :key="item.Id" class="item-box">
				<div class="icon">
					<font-awesome-icon fas icon="envelope"></font-awesome-icon>
				</div>
				<div class="content">
					<div class="content-top">
						<span class="content-date">{{ dayjs(item.SettingDate).format('MM月DD日') }}</span>
						<span class="content-tips">{{ getNotifyTimeTips(item) }}</span>
					</div>
					<div class="content-bottom">
						<span>{{ item.Content }}</span>
					</div>
				</div>
				<el-dropdown v-if="!item.IsClosed" placement="bottom-start">
					<el-button link>
						<font-awesome-icon fas icon="angle-down"></font-awesome-icon>
					</el-button>
					<template #dropdown>
						<el-dropdown-menu>
							<el-dropdown-item :disabled="item.IsClosed" @click="close(item.Id)">关闭</el-dropdown-item>
							<el-dropdown-item @click="del(item.Id)" class="ofa-text-danger">删除</el-dropdown-item>
						</el-dropdown-menu>
					</template>
				</el-dropdown>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { dayjs } from 'element-plus'
import API from '@/apis/oa-api'
import { IOAPersonalSchedule } from '@/interfaces/oa/IOAPersonalSchedule'

const activeNum = ref(0) // 激活标签
const dialogVisible = ref(false) // 绑定弹窗显示
const list = ref<IOAPersonalSchedule[]>([])
const entity = ref<IOAPersonalSchedule>(
	Object.assign({
		SettingDate: new Date(),
		Content: '',
		NotifyTimeType: 99,
		NotifyTimeSpan: 0
	})
)

// 有日程的日期
const dates = computed(() => {
	return list.value?.map(w => {
		return dayjs(w.SettingDate).format('YYYY-MM-DD')
	})
})

// 获取日程列表
function get() {
	API.getPersonalSchedules(entity.value.SettingDate).then(res => {
		list.value = res
	})
}

// 获取点击日期的日程内容
function getScheduleData(day: string) {
	return list.value?.find(w => dayjs(w.SettingDate).format('YYYY-MM-DD') === day)?.Content
}

// 上个月
function getPrevDate() {
	entity.value.SettingDate = dayjs(entity.value.SettingDate).subtract(1, 'month').startOf('month').toDate()
	get()
}

// 下个月
function getNextDate() {
	entity.value.SettingDate = dayjs(entity.value.SettingDate).add(1, 'month').startOf('month').toDate()
	get()
}

// 改变日期
function changeDate() {
	entity.value.NotificationTypes = [0, 3]
	entity.value.NotifyTimeType = 99
	entity.value.NotifyTimeSpan = 0
}

// 添加任务日程
function add() {
	const data = { ...entity.value, NotificationTypes: [0, 3] }
	API.addPersonalSchedule(data).then(res => {
		if (res.Status) {
			get()
		}
	})
}

// 删除日程
function del(id: string) {
	API.deletePersonalSchedule(id).then(res => {
		if (res.Status) {
			get()
		}
	})
}

// 关闭日程
function close(id: string) {
	API.closePersonalSchedule(id).then(res => {
		if (res.Status) {
			get()
		}
	})
}

// 返回提示提示
function getNotifyTimeTips(item: IOAPersonalSchedule) {
	if (item.IsClosed) return '已关闭'
	if (dayjs(new Date()).diff(item.NotifyTime, 'day') > 0) return '已提醒'
	return '预计在' + dayjs(item.NotifyTime).format('YYYY-MM-DD') + '提醒'
}

onMounted(() => {
	get()
})
</script>

<style lang="scss" scoped>
.personal-schedule {
	background: #fff;
	border-radius: 20px;
	height: 100%;
	width: 100%;

	.top-box {
		display: flex;
		justify-content: space-between;
		padding: 20px;
		.icon {
			display: flex;
			justify-content: center;
			align-items: center;
			width: 24px;
			height: 24px;
			border-radius: 50%;
			color: #fff;
			&-primary {
				margin-right: 4px;
				background-color: #409eff;
			}
		}
		.title-box {
			display: flex;
			align-items: center;
			margin-left: 20px;
			span {
				font-size: 18px;
				font-weight: 500;
				color: rgba(0, 0, 0, 0.85);
				line-height: 24px;
			}
		}
		.btn-box {
			margin-top: 9px;
			display: flex;
			align-items: center;
			margin-right: 31px;
		}
	}

	.calendar-box {
		margin-top: 60px;
		:deep(.el-calendar__header) {
			display: none;
		}
		:deep(.el-calendar-table) {
			table-layout: auto;
		}
		:deep(.el-calendar-table tr td:first-child) {
			border: none;
		}
		:deep(.el-calendar-table td) {
			border: none;
		}
		:deep(.el-calendar-day) {
			position: relative;
			z-index: 2;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		:deep(.el-calendar-table td.is-selected) {
			background: transparent;
			position: relative;
		}
		:deep(.el-calendar-table td.is-selected .el-calendar-day .el-dropdown) {
			color: #fff;
		}
		:deep(.el-calendar-table .el-calendar-day::before) {
			content: '';
			position: absolute;
			width: 50px;
			height: 50px;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
			background: transparent;
			border-radius: 50%;
			opacity: 0;
			transition: all 0.3s;
		}
		:deep(.el-calendar-table td.is-selected .el-calendar-day::before) {
			opacity: 1;
			background: #409eff;
		}
		:deep(.el-calendar-table .el-calendar-day:hover) {
			background: transparent;
		}
		:deep(.el-calendar-table td.is-selected .el-calendar-day .date-box) {
			color: #fff;
		}
		:deep(.el-calendar-table .el-calendar-day:hover::before) {
			background: #f2f8ff;
			opacity: 1;
		}
	}

	.date-box {
		position: relative;
		display: flex;
		align-items: center;
		flex-direction: column;

		.icon-danger {
			color: #f56c6c;
		}
	}

	.date-yuan {
		width: 8px;
		height: 8px;
		background: #409eff;
		border-radius: 50%;
	}

	.is-selected {
		.date-yuan {
			background: #fff;
		}
	}
}

.list-box {
	.title-box {
		display: flex;
		align-items: center;
		margin: 20px 0 0 30px;

		.tips {
			font-weight: 400;
			color: #606266;
		}
	}
	.item-box {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #f7f8fc;
		border-radius: 41px;
		padding: 15px 30px;
		margin: 20px;
		.content {
			flex: 1;
		}
		.icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 42px;
			height: 42px;
			border-radius: 50%;
			margin-right: 23px;
			background: #409eff;
			color: #fff;
			svg {
				width: 20px;
				height: 20px;
			}
		}
		.content {
			&-top {
				display: flex;
				align-items: center;
				margin-bottom: 9px;
				span {
					white-space: nowrap;
				}
			}
			&-date {
				font-weight: 500;
				color: #303133;
				line-height: 22px;
				margin-right: 16px;
			}
			&-tips {
				font-weight: 400;
				color: #ecf5ff;
				line-height: 22px;
				margin-right: 22px;
			}
			&-bottom {
				display: flex;
				align-items: center;
				svg {
					width: 16px;
					height: 16px;
					margin-right: 6px;
				}
				font-weight: 400;
				color: #606266;
				line-height: 22px;
			}
		}
	}
}

.schedule-add-box {
	padding: 10px 20px 15px;
	.title-box {
		display: flex;
		align-items: center;
		margin-bottom: 10px;
		color: #303133;
		svg {
			margin-right: 10px;
			font-weight: 500;
		}
	}
	.textarea-input {
		margin-bottom: 10px;
		:deep(.el-textarea__inner) {
			width: 465px;
			border: none;
			background: #f5f7fa;
			border-radius: 4px;
			padding: 10px 15px;
		}
	}
	.num-input {
		width: 43px;
		margin: 0 10px;
	}
	.type-box {
		margin-top: 20px;
		margin-bottom: 25px;
		display: flex;
		align-items: center;
		gap: 12px;
		.act {
			border: 1px solid #409eff;
			color: #409eff;
		}
	}
	.bottom-box {
		> div {
			display: flex;
			align-items: center;
			img {
				width: 16px;
				height: 16px;
				margin-right: 4px;
			}
		}

		.btn-box {
			justify-content: flex-end;
		}
	}
}
:deep(.ewm-dialog .el-dialog) {
	box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.15);
	border-radius: 10px;
}
.ewm-box-div {
	text-align: center;
	font-size: 14px;
	font-weight: 400;
	color: #333333;
	line-height: 21px;
}
.ewm-box {
	box-sizing: border-box;
	padding: 10px;
	background: #ffffff;
	border: 1px solid #e4e7ed;
	margin-bottom: 20px;
}
</style>