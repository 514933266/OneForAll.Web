<template>
  <div class="welcome-top">
    <div class="top-left">
      <div class="company-name">{{ user?.TenantName }}</div>
      <div class="company-hello">
        {{ today.Hello }}，{{ user?.Name }}，今天是{{ today.Date }}&nbsp;{{
          today.WeekDay
        }}
      </div>
    </div>
    <div class="top-right">
      <div class="right-item">
        <font-awesome-icon fas icon="id-badge"></font-awesome-icon>
        <div>
          <div class="item-tag">在职员工</div>
          <div class="item-num">{{ statistics?.TotalOnJobCount ?? 0 }}</div>
        </div>
      </div>
      <div class="right-item">
        <font-awesome-icon fas icon="stamp"></font-awesome-icon>
        <div>
          <div class="item-tag">全职员工</div>
          <div class="item-num">{{ statistics?.NormalCount ?? 0 }}</div>
        </div>
      </div>
      <div class="right-item">
        <font-awesome-icon fas icon="sitemap"></font-awesome-icon>
        <div>
          <div class="item-tag">部门成员</div>
          <div class="item-num">{{ statistics?.TeamCount ?? 0 }}</div>
        </div>
      </div>
      <div class="right-item">
        <font-awesome-icon fas icon="users"></font-awesome-icon>
        <div>
          <div class="item-tag">同组成员</div>
          <div class="item-num">{{ statistics?.GroupCount ?? 0 }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/userStore'
import { dayjs } from 'element-plus'
import { IPersonalPersonStatistics } from '@/interfaces/IPersonalPersonStatistics.ts'
import API from '@/apis/oa-api'

interface IToday {
  Hello: string
  Date: string
  WeekDay: string
}

const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const statistics = ref<IPersonalPersonStatistics>()

const today = computed(() => {
  const date = new Date()
  return {
    Hello: getHello(date),
    Date: dayjs(date).format('YYYY年MM月DD日'),
    WeekDay: getWeek(date)
  } as IToday
}) // 今天

// 获取待办事项统计
function getStatistics() {
  API.getStatistics().then(res => {
    statistics.value = res
  })
}

// 根据时间获取当日时段
function getHello(date: Date) {
  let hello = '你好'
  const hour = date.getHours()
  if (hour < 6) hello = '凌晨好'
  else if (hour < 9) hello = '早上好'
  else if (hour < 12) hello = '上午好'
  else if (hour < 14) hello = '中午好'
  else if (hour < 17) hello = '下午好'
  else if (hour < 19) hello = '傍晚好'
  else if (hour < 22) hello = '晚上好'
  else {
    hello = '夜深了'
  }
  return hello
}

// 根据时间获取今天是星期几
function getWeek(date: Date) {
  const mydate = date.getDay()
  const weekday = [
    '星期日',
    '星期一',
    '星期二',
    '星期三',
    '星期四',
    '星期五',
    '星期六'
  ]
  return weekday[mydate]
}

onMounted(() => {
  getStatistics()
})
</script>

<style lang="scss" scoped>
.welcome-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 30px 30px 20px;
  background: #ffffff;
  border-radius: 16px;
  margin-bottom: 28px;

  .top-left {
    margin-bottom: 10px;

    .company-name {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .company-hello {
      font-size: 14px;
    }
  }

  .top-right {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    width: 650px;

    .right-item {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 140px;
      height: 64px;
      background: #f7f8fc;
      border-radius: 8px;
      margin-bottom: 10px;

      svg {
        width: 16px;
        height: 16px;
        margin-right: 20px;
        color: #303133;
      }

      .item-tag {
        font-size: 12px;
        font-weight: 500;
        line-height: 18px;
        margin-bottom: 3px;
        color: #909399;
      }

      .item-num {
        font-size: 18px;
        font-weight: 500;
        color: #303133;
        line-height: 23px;
      }
    }
  }
}
</style>
