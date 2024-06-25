<template>
  <el-container class="login-log-page">
    <el-header class="header">
      <span>
        <el-input
          enterable
          v-model="searchOption.key"
          placeholder="关键字"
          style="width: 200px"
        >
          <template #prefix>
            <font-awesome-icon fas icon="key"></font-awesome-icon>
          </template>
        </el-input>
        <el-date-picker
          v-model="searchOption.startTime"
          type="datetime"
          placeholder="开始日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 200px"
          class="ofa-ml10"
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
          v-model="searchOption.appId"
          placeholder="应用程序Id"
          style="width: 200px"
          class="ofa-ml10"
        ></el-input>
        <el-input
          v-model="searchOption.taskName"
          placeholder="任务名称"
          style="width: 200px"
          class="ofa-ml10"
        ></el-input>
        <el-select
          v-model="searchOption.type"
          :clearable="true"
          placeholder="日志类型"
          style="width: 200px"
          class="ofa-ml10"
        >
          <el-option :value="-1" label="全部类型"></el-option>
          <el-option
            v-for="item in TASK_LOG_TYPE"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          ></el-option>
        </el-select>
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
          定时任务日志列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="Type" label="类型" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getTypeClass(scope.row)" size="small">{{
              getTypeName(scope.row)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="AppId" label="应用程序id"></el-table-column>
        <el-table-column prop="TaskName" label="任务名称"></el-table-column>
        <el-table-column
          show-overflow-tooltips
          prop="Content"
          label="备注"
        ></el-table-column>
        <el-table-column
          prop="CreateTime"
          label="创建时间"
          width="200"
        ></el-table-column>
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
import { ref, nextTick, onMounted, onActivated } from 'vue'
import { IJobTaskLog } from '@/interfaces/job/IJobTaskLog'
import API from '@/apis/job-api.ts'
import { TASK_LOG_TYPE } from '@/consts/job-const'

const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const list = ref<IJobTaskLog[]>([]) // 用户列表
const searchOption = ref({
  startTime: '', // 开始日期
  endTime: '', // 结束日期
  appId: '', // 应用程序Id
  taskName: '', // 任务名称
  type: -1, // 日志类型
  key: ''
}) // 搜索条件

onMounted(() => {
  get()
})

onActivated(() => {
  const data = history.state.params
  if (data.AppId) {
    searchOption.value.appId = data.AppId
    searchOption.value.taskName = data.Name
  }
  get()
})

// 获取列表
function get() {
  loading.value = true
  API.getTaskLogs(
    pageIndex.value,
    pageSize.value,
    searchOption.value.appId,
    searchOption.value.taskName,
    searchOption.value.type,
    searchOption.value.key,
    searchOption.value.startTime,
    searchOption.value.endTime
  ).then(res => {
    total.value = res.Total
    list.value = res.Items
    loading.value = false
  })
}

// 获取日志类型
function getTypeClass(data: IJobTaskLog) {
  switch (data.Type) {
    case 0:
      return 'success'
    case 1:
      return 'success'
    case 2:
      return 'warning'
    case 3:
      return 'primary'
    case 4:
      return 'info'
    case 99:
      return 'danger'
  }
}

// 获取类型名称
function getTypeName(data: IJobTaskLog) {
  return TASK_LOG_TYPE.find(w => w.value === data.Type)?.label
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
