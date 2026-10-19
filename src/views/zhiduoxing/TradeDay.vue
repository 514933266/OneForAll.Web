<template>
	<el-container class="trade-day-page">
		<el-header class="header">
			<span class="search-box">
				<span class="label">生成区间</span>
				<el-date-picker v-model="generateOption.begin" type="month" placeholder="起始月份" format="YYYY-MM"
					value-format="YYYY-MM-DD" style="width: 140px"></el-date-picker>
				<span class="sep">至</span>
				<el-date-picker v-model="generateOption.end" type="month" placeholder="结束月份" format="YYYY-MM"
					value-format="YYYY-MM-DD" style="width: 140px"></el-date-picker>
				<el-button type="primary" :loading="generating" @click="runGenerate">
					<font-awesome-icon fas icon="calendar-plus"></font-awesome-icon>&nbsp;生成交易日
				</el-button>
			</span>
			<span class="button-box">
				<el-button type="warning" :loading="syncingHoliday" @click="runSyncHolidays">
					<font-awesome-icon fas icon="gift"></font-awesome-icon>&nbsp;获取节假日
				</el-button>
				<el-button @click="loadMonth">
					<font-awesome-icon fas icon="rotate-right"></font-awesome-icon>&nbsp;刷新
				</el-button>
			</span>
		</el-header>
		<el-main class="content">
			<!-- 说明与图例 -->
			<div class="tip-box">
				<div class="tip-head">
					<span class="tip-title">交易日说明</span>
					<span class="tip-text">交易日按“周一至周五”规则由定时任务每月25日预生成下月记录（仅工作日生成，周末固定非交易日）；法定节假日由定时任务调用 DeepSeek 获取下月休市安排自动标记为休市，也可点击“获取节假日”按当前月份手动获取标记（AI 结果供参考，可人工核对）；特殊调整可点击对应日期人工标注，休市日期概览页日期选择将自动跳过</span>
				</div>
				<div class="legend">
					<span class="legend-item"><i class="dot dot-trade"></i>交易日</span>
					<span class="legend-item"><i class="dot dot-closed"></i>休市（人工标注 / 自动假期）</span>
					<span class="legend-item"><i class="dot dot-weekend"></i>周末（固定非交易日）</span>
					<span class="legend-item"><i class="dot dot-missing"></i>未生成</span>
					<span class="legend-tip">点击已生成的工作日可标注假期 / 恢复交易日</span>
				</div>
			</div>
			<el-calendar ref="calendarRef" v-model="calendarDate" v-loading="loading">
				<template #header>
					<div class="calendar-header">
						<span class="calendar-title">{{ monthTitle }}</span>
						<el-button-group>
							<el-button size="small" @click="selectDate('prev-month')">上个月</el-button>
							<el-button size="small" :type="isCurrentMonth ? 'primary' : ''" @click="selectDate('today')">本月</el-button>
							<el-button size="small" @click="selectDate('next-month')">下个月</el-button>
						</el-button-group>
					</div>
				</template>
				<template #date-cell="{ data }">
					<el-tooltip :content="tooltipOf(data)" :disabled="!tooltipOf(data)" placement="top">
						<div class="date-cell" :class="cellClass(data)" @click="onDateClick(data)">
							<span class="day-text">{{ dayText(data) }}</span>
							<span v-if="cellStatus(data)" class="status-tag" :class="cellStatus(data)?.class">
								{{ cellStatus(data)?.text }}
							</span>
							<span v-if="cellRemark(data)" class="remark-text">{{ cellRemark(data) }}</span>
						</div>
					</el-tooltip>
				</template>
			</el-calendar>
		</el-main>
	</el-container>
	<!-- 调整对话框 -->
	<el-dialog v-model="dialogVisible" width="480px" title="调整交易日">
		<div class="dialog-body">
			<div class="dialog-row">
				<span class="row-label">日期</span>
				<span class="row-value">{{ dialogEntity.TradeDate }}（{{ weekdayName(dialogEntity.TradeDate) }}）</span>
			</div>
			<div class="dialog-row">
				<span class="row-label">状态</span>
				<el-radio-group v-model="dialogEntity.IsTradeDay">
					<el-radio :value="true">交易日</el-radio>
					<el-radio :value="false">休市（非交易日）</el-radio>
				</el-radio-group>
			</div>
			<div class="dialog-row">
				<span class="row-label">备注</span>
				<el-input v-model="dialogEntity.Remark" maxlength="200" show-word-limit
					placeholder="标注原因，如：国庆假期" style="width: 100%"></el-input>
			</div>
		</div>
		<template #footer>
			<el-button type="primary" @click="submitDialog">提交</el-button>
			<el-button type="warning" @click="dialogVisible = false">取消</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, CalendarInstance } from 'element-plus'
import dayjs from '@/untils/dayjs'
import { IZdxTradeDay } from '@/interfaces/zhiduoxing/IZdxTradeDay'
import API from '@/apis/zdx-api'

// 星期名称（dayjs().day()：0=周日 ~ 6=周六）
const WEEK_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const loading = ref(false) // 加载中
const generating = ref(false) // 生成执行中
const syncingHoliday = ref(false) // 节假日获取中
const monthDays = ref<IZdxTradeDay[]>([]) // 当前月交易日记录
const calendarDate = ref(new Date()) // 日历当前日期（v-model，切换月份驱动加载）
const calendarRef = ref<CalendarInstance>() // 日历实例（selectDate 切换月份）
const generateOption = ref({
	begin: '', // 起始月份（value-format=YYYY-MM-DD，取月首日）
	end: '' // 结束月份
}) // 生成区间

// 当前月记录映射（yyyy-MM-dd → 记录）
const monthMap = computed(() => {
	const map = new Map<string, IZdxTradeDay>()
	monthDays.value.forEach(d => map.set(dayjs(d.TradeDate).format('YYYY-MM-DD'), d))
	return map
})

// 当前月标题
const monthTitle = computed(() => dayjs(calendarDate.value).format('YYYY 年 M 月'))

// 当前月字符串（yyyy-MM；监听变化切换月份加载）
const currentMonth = computed(() => dayjs(calendarDate.value).format('YYYY-MM'))

// 日历视图是否为当前自然月（“本月”按钮高亮标识）
const isCurrentMonth = computed(() => currentMonth.value === dayjs().format('YYYY-MM'))

// 调整对话框
const dialogVisible = ref(false)
const dialogEntity = ref({
	TradeDate: '', // 日期（yyyy-MM-dd）
	IsTradeDay: true, // 是否交易日
	Remark: '' // 备注
})

onMounted(() => {
	// 默认生成区间为当前月（可改为任意月份区间）
	generateOption.value.begin = dayjs().startOf('month').format('YYYY-MM-DD')
	generateOption.value.end = dayjs().startOf('month').format('YYYY-MM-DD')
	loadMonth()
})

// 月份切换（含点击跨月格）时加载对应月数据
watch(currentMonth, () => {
	loadMonth()
})

// 加载当前月交易日（按整月区间查询；失败时清空，序号防竞态）
let monthSeq = 0
async function loadMonth() {
	const seq = ++monthSeq
	const begin = currentMonth.value + '-01'
	const end = dayjs(begin).endOf('month').format('YYYY-MM-DD')
	loading.value = true
	try {
		const res = await API.getTradeDays(begin, end)
		if (seq !== monthSeq) return
		monthDays.value = res
	} catch {
		if (seq !== monthSeq) return
		monthDays.value = []
	} finally {
		if (seq === monthSeq) loading.value = false
	}
}

// 日历月份切换（selectDate 联动 v-model）
function selectDate(type: 'prev-month' | 'next-month' | 'today') {
	calendarRef.value?.selectDate(type)
}

// 日期数字（yyyy-MM-dd → d）
function dayText(data: any): string {
	return String(Number(data.day.substring(8)))
}

// 星期名称
function weekdayName(day: string): string {
	return day ? WEEK_NAMES[dayjs(day).day()] : ''
}

// 单元格状态（仅当前月显示；周末固定非交易日；无记录=未生成）
function cellStatus(data: any): { text: string; class: string } | null {
	if (data.type !== 'current-month') return null
	const weekday = dayjs(data.day).day()
	if (weekday === 0 || weekday === 6) return { text: '周末', class: 'weekend' }
	const record = monthMap.value.get(data.day)
	if (!record) return { text: '未生成', class: 'missing' }
	return record.IsTradeDay ? { text: '交易日', class: 'trade' } : { text: '休市', class: 'closed' }
}

// 单元格备注（休市记录的备注文本，如“国庆假期”；仅当前月显示，适用于人工标注与自动标记休市）
function cellRemark(data: any): string {
	if (data.type !== 'current-month') return ''
	const record = monthMap.value.get(data.day)
	return record && !record.IsTradeDay ? record.Remark ?? '' : ''
}

// 单元格样式（跨月灰色不可点；周末不可点）
function cellClass(data: any): string {
	if (data.type !== 'current-month') return 'other-month'
	const weekday = dayjs(data.day).day()
	if (weekday === 0 || weekday === 6) return 'is-weekend'
	const record = monthMap.value.get(data.day)
	return record ? 'is-clickable' : 'is-missing'
}

// 单元格悬浮提示（日期 + 状态 + 人工调整信息）
function tooltipOf(data: any): string {
	const status = cellStatus(data)
	if (!status) return ''
	const parts = [`${data.day}（${weekdayName(data.day)}）· ${status.text}`]
	const record = monthMap.value.get(data.day)
	if (record && record.Source === 2) {
		parts.push(`已人工调整${record.Modifier ? '（' + record.Modifier + '）' : ''}`)
	}
	if (record && record.Source === 3) {
		parts.push('系统自动标记节假日休市')
	}
	if (record?.Remark) parts.push(`备注：${record.Remark}`)
	if (status.class === 'missing') parts.push('请通过顶部“生成交易日”补充')
	return parts.join('；')
}

// 点击单元格（已生成的工作日打开调整对话框；跨月格由日历默认行为切换月份）
function onDateClick(data: any) {
	if (data.type !== 'current-month') return
	const weekday = dayjs(data.day).day()
	if (weekday === 0 || weekday === 6) {
		ElMessage.info('周末固定非交易日，无需调整')
		return
	}
	const record = monthMap.value.get(data.day)
	if (!record) {
		ElMessage.warning('该日期暂无交易日记录，请先通过顶部“生成交易日”补充')
		return
	}
	openDialog(record)
}

// 打开调整对话框（以当前记录填充）
function openDialog(record: IZdxTradeDay) {
	dialogEntity.value = {
		TradeDate: dayjs(record.TradeDate).format('YYYY-MM-DD'),
		IsTradeDay: record.IsTradeDay,
		Remark: record.Remark ?? ''
	}
	dialogVisible.value = true
}

// 提交调整（标注假期/恢复交易日；服务端记录修改人并标记来源为人工调整）
function submitDialog() {
	const form = {
		IsTradeDay: dialogEntity.value.IsTradeDay,
		Remark: dialogEntity.value.Remark
	}
	API.updateTradeDay(dialogEntity.value.TradeDate, form).then(res => {
		if (res.Status) {
			dialogVisible.value = false
			loadMonth()
		}
	})
}

// 执行生成（确认后执行；成功/失败信息由响应拦截器统一弹出通知，执行后刷新当前月）
async function runGenerate() {
	if (!generateOption.value.begin || !generateOption.value.end) {
		ElMessage.warning('请选择生成区间（月份）')
		return
	}
	if (generating.value) return

	const rangeText = `${dayjs(generateOption.value.begin).format('YYYY-MM')} ~ ${dayjs(generateOption.value.end).format('YYYY-MM')}`
	try {
		await ElMessageBox.confirm(`确认生成 ${rangeText} 区间的交易日？按整月生成（含区间内全部周一至周五），已存在的日期将跳过（人工调整不会被覆盖）。`,
			'生成交易日提示', {
			type: 'warning',
			cancelButtonText: '放弃操作'
		})
	} catch {
		return // 用户取消
	}

	generating.value = true
	try {
		await API.generateTradeDays(generateOption.value.begin, generateOption.value.end)
		loadMonth()
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		generating.value = false
	}
}

// 获取节假日（按日历当前月份通过 DeepSeek 获取法定休市安排并比对标记）
async function runSyncHolidays() {
	if (syncingHoliday.value) return
	const year = dayjs(calendarDate.value).year()
	const month = dayjs(calendarDate.value).month() + 1
	const monthText = dayjs(calendarDate.value).format('YYYY 年 M 月')
	try {
		await ElMessageBox.confirm(`确认通过 DeepSeek 获取 ${monthText} 的法定休市安排并标记休市？系统将比对现有记录：缺失日期补建休市行、系统生成的交易日更新为休市，人工调整不会被覆盖；AI 获取结果供参考，可在日历中人工核对调整。`,
			'获取节假日提示', {
			type: 'warning',
			cancelButtonText: '放弃操作'
		})
	} catch {
		return // 用户取消
	}

	syncingHoliday.value = true
	try {
		await API.syncTradeDayHolidays({ Year: year, Month: month })
		loadMonth()
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		syncingHoliday.value = false
	}
}
</script>

<style lang="scss" scoped>
.trade-day-page {
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
			gap: 10px;
			padding: 6px 4px;

			.label {
				color: #606266;
			}

			.sep {
				color: #909399;
			}
		}

		.button-box {
			display: flex;
			align-items: flex-start;
		}
	}

	.content {
		padding: 0;

		.tip-box {
			border: 1px solid #e4e7ed;
			border-radius: 8px;
			background: #fafafa;
			padding: 12px 16px;
			margin-bottom: 16px;

			.tip-head {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				margin-bottom: 10px;
			}

			.tip-title {
				color: #303133;
				font-weight: bold;
				margin-right: 12px;
			}

			.tip-text {
				color: #909399;
				font-size: 12px;
			}

			.legend {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 16px;

				.legend-item {
					display: flex;
					align-items: center;
					color: #606266;
					font-size: 12px;

					.dot {
						width: 8px;
						height: 8px;
						border-radius: 50%;
						margin-right: 6px;
					}

					.dot-trade {
						background: #67c23a;
					}

					.dot-closed {
						background: #f56c6c;
					}

					.dot-weekend {
						background: #c0c4cc;
					}

					.dot-missing {
						background: #e6a23c;
					}
				}

				.legend-tip {
					color: #909399;
					font-size: 12px;
					margin-left: auto;
				}
			}
		}

		.calendar-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;

			.calendar-title {
				color: #303133;
				font-size: 1.25rem;
				font-weight: bold;
			}
		}

		:deep(.el-calendar-day) {
			height: 74px;
			padding: 4px;
			border-radius: 8px;
		}

		.date-cell {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 5px;
			height: 100%;

			.day-text {
				font-size: 16px;
				font-weight: 600;
				color: #303133;
			}

			.status-tag {
				font-size: 11px;
				line-height: 16px;
				padding: 0 6px;
				border-radius: 4px;
			}

			.status-tag.trade {
				color: #67c23a;
				background: #f0f9eb;
			}

			.status-tag.closed {
				color: #f56c6c;
				background: #fef0f0;
			}

			.status-tag.weekend {
				color: #909399;
				background: #f4f4f5;
			}

			.status-tag.missing {
				color: #e6a23c;
				background: #fdf6ec;
			}

			.remark-text {
				font-size: 11px;
				line-height: 14px;
				color: #f56c6c;
				max-width: 100%;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}

		.date-cell.other-month {
			cursor: default;
			opacity: 0.35;
		}

		.date-cell.is-weekend {
			cursor: not-allowed;
		}

		.date-cell.is-clickable {
			cursor: pointer;
		}

		.date-cell.is-missing {
			cursor: pointer;
		}
	}
}

.dialog-body {
	.dialog-row {
		display: flex;
		align-items: center;
		margin-bottom: 18px;

		.row-label {
			width: 60px;
			color: #606266;
			flex-shrink: 0;
		}

		.row-value {
			color: #303133;
			font-weight: 600;
		}
	}
}
</style>
