<template>
  <el-dropdown class="index-schedule">
    <!-- 工作日程 -->
    <el-button text class="squre-btn">
      <el-badge is-dot class="item" :hidden="list.length < 1" size="small">
        <font-awesome-icon
          fas
          icon="calendar-minus"
          class="header-icon"
        ></font-awesome-icon>
      </el-badge>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-calendar
          style="width: 600px"
          class="header-calendar"
          v-model="date"
        >
          <template #date-cell="{ data }">
            <el-tooltip
              v-if="dates.includes(data.day)"
              :content="getScheduleData(data.day)"
              placement="top"
            >
              <div class="date-box">
                {{ data.day.split('-')[2] }}
                <font-awesome-icon
                  fas
                  icon="circle"
                  class="ofa-text-danger"
                ></font-awesome-icon>
              </div>
            </el-tooltip>
            <div v-else class="date-box">{{ data.day.split('-')[2] }}</div>
          </template>
        </el-calendar>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { dayjs } from 'element-plus'
import API from '@/apis/oa-api'
import { IOAPersonalSchedule } from '@/interfaces/oa/IOAPersonalSchedule'

const list = ref<IOAPersonalSchedule[]>([]) // 列表
const date = ref<Date>(new Date()) // 月份

// 获取点击日期的日程内容
function getScheduleData(day: string) {
  return list.value?.find(
    w => dayjs(w.SettingDate).format('YYYY-MM-DD') === day
  )?.Content
}

// 有日程的日期
const dates = computed(() => {
  return list.value?.map(w => {
    return dayjs(w.SettingDate).format('YYYY-MM-DD')
  })
})

// 获取日程列表
watch(
  () => date,
  (newDate, oldDate) => {
    if (dayjs(newDate.value).month !== dayjs(oldDate?.value).month) {
      API.getPersonalSchedules(date.value).then(res => {
        list.value = res
      })
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.squre-btn {
  height: 60px;
  width: 60px;
  border-radius: 0 !important;
}

.header-calendar {
  .dot {
    width: 6px;
    height: 6px;
    background: #409eff;
    border-radius: 50%;
    margin-right: 5px;
  }

  .is-selected {
    font-size: 12px;
    color: #409eff;
  }

  .calendar-text {
    display: flex;
    align-items: center;
    font-size: 12px;
  }

  .text-act {
    margin-left: 10px;
    color: #409eff;
    font-size: 12px;
  }

  .c409eff {
    color: #409eff;
  }
}

.header-calendar .el-calendar-table thead th:before {
  content: '周';
}

.header-calendar .el-calendar__body {
  padding: 0 15px 10px;
}

.header-calendar .el-calendar-table .el-calendar-day {
  box-sizing: border-box;
  height: 62px;
  width: 81px;
  padding: 0;

  .bg {
    box-sizing: border-box;
    height: 62px;
    width: 81px;
    padding: 6px 0 0 6px;
  }

  .setbg {
    background: #ecf5ff;
  }
}
</style>
