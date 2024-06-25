<template>
  <el-container class="login-log-page">
    <el-header class="header">
      <span>
        <el-date-picker
          v-model="searchOption.startTime"
          type="datetime"
          placeholder="开始日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 200px"
        >
        </el-date-picker>
        <el-date-picker
          v-model="searchOption.endTime"
          type="datetime"
          placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 200px"
          class="ofa-ml10"
        >
        </el-date-picker>
        <el-input
          v-model="searchOption.exChangeName"
          placeholder="交换机名"
          style="width: 200px"
          class="ofa-ml10"
        ></el-input>
        <el-input
          v-model="searchOption.queueName"
          placeholder="队列名"
          style="width: 200px"
          class="ofa-ml10"
        ></el-input>
        <el-input
          v-model="searchOption.routeKey"
          placeholder="路由名"
          style="width: 200px"
          class="ofa-ml10"
        ></el-input>
        <el-button @click="search" type="primary" class="ofa-ml10"
          ><font-awesome-icon fas icon="search"></font-awesome-icon
          >&nbsp;查询</el-button
        >
      </span>
      <span> </span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          消息队列日志列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column type="expand">
          <template #default="props">
            <el-form
              status-icon
              ref="form"
              class="tenant-form"
              label-width="120px"
            >
              <el-card content-position="left" shadow="never">
                <template #header>
                  <span>原始消息</span>
                </template>
                <el-form-item label="内容：">
                  <label>{{ props.row.OriginalMessage }}</label>
                </el-form-item>
              </el-card>
            </el-form>
          </template>
        </el-table-column>
        <el-table-column
          show-overflow-tooltip
          prop="Status"
          label="状态"
          width="100"
          align="center"
          header-align="center"
        >
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.Status)" effect="dark">{{
              getStatusStr(scope.row.Status)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ExChangeName" label="交换机"></el-table-column>
        <el-table-column prop="QueueName" label="队列名称"></el-table-column>
        <el-table-column prop="RouteKey" label="路由"></el-table-column>
        <el-table-column
          show-overflow-tooltip
          prop="OriginalMessage"
          label="原始消息"
        ></el-table-column>
        <el-table-column
          prop="CreateTime"
          label="发送时间"
          width="200"
        ></el-table-column>
        <el-table-column
          show-overflow-tooltip
          prop="Result"
          label="结果"
        ></el-table-column>
        <el-table-column
          label="操作"
          width="120"
          align="center"
          header-align="center"
        >
          <template #default="scope">
            <el-button
              link
              v-if="['Error', 'Fail'].includes(scope.row.Result)"
              @click="retry(scope.row)"
              >重新发送
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        v-model:current-page="pageIndex"
        :page-sizes="[10, 20, 50, 100]"
        v-model:page-size="pageSize"
        :total="total"
        @size-change="pageSizeChange"
        @current-change="pageIndexChange"
      >
      </el-pagination>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { IUmsMessageRecord } from '@/interfaces/ums/IUmsMessageRecord'
import API from '@/apis/ums-api'
import { MESAGE_LOG_STATUS } from '@/consts/ums-const'

const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const list = ref<IUmsMessageRecord[]>([]) // 用户列表
const searchOption = ref({
  startTime: '', // 开始日期
  endTime: '', // 结束日期
  exChangeName: '', // 交换机名
  queueName: '', // 队列名
  routeKey: '' // 路由名
}) // 搜索条件

onMounted(() => {
  get()
})

// 获取列表
function get() {
  loading.value = true
  API.getUmsMessageLogs(
    pageIndex.value,
    pageSize.value,
    searchOption.value.startTime,
    searchOption.value.endTime,
    searchOption.value.exChangeName,
    searchOption.value.queueName,
    searchOption.value.routeKey
  ).then(res => {
    total.value = res.Total
    list.value = res.Items
    loading.value = false
  })
}

// 获取状态类型样式
function getStatusType(
  status: number
): 'info' | 'danger' | 'success' | 'warning' {
  const matchedStatus = MESAGE_LOG_STATUS.find(w => w.value === status)
  return matchedStatus ? matchedStatus.type : 'info' // 默认为 'info' 如果没有匹配到
}

// 获取状态类型样式
function getStatusStr(status: number) {
  return MESAGE_LOG_STATUS.find(w => w.value == status)?.label ?? '未知'
}

// 搜索
function search() {
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

// 重新发送
function retry(data: IUmsMessageRecord) {
  API.retryUmsMessage(data).then(response => {
    if (response.Status) get()
  })
}
</script>

<style lang="scss" scoped>
.login-log-page {
  background: #fff;
  border-radius: 20px;
  padding: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }

  .title-box {
    padding: 20px 0;
  }

  .title {
    color: #303133;
    font-size: 1.75rem;
    font-weight: bold;
  }
}
</style>
