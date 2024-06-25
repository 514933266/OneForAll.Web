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
          v-model="searchOption.nodeName"
          placeholder="运行节点"
          style="width: 200px"
          class="ofa-ml10"
        ></el-input>
        <el-input
          v-model="searchOption.groupName"
          placeholder="所属分组"
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
          定时任务列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="Status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-text :type="getStatusClass(scope.row)"
              ><font-awesome-icon fas icon="circle"></font-awesome-icon
            ></el-text>
          </template>
        </el-table-column>
        <el-table-column
          prop="Name"
          label="任务名称"
          min-width="240"
        ></el-table-column>
        <el-table-column
          prop="Cron"
          label="表达式"
          width="200"
        ></el-table-column>
        <el-table-column
          prop="GroupName"
          label="所属分组"
          width="200"
        ></el-table-column>
        <el-table-column
          prop="NodeName"
          label="运行节点"
          width="200"
        ></el-table-column>
        <el-table-column
          show-overflow-tooltips
          prop="Remark"
          label="备注"
          min-width="400"
        ></el-table-column>
        <el-table-column
          prop="UpdateTime"
          label="最后修改时间"
          width="200"
        ></el-table-column>
        <el-table-column
          prop="RunningTime"
          label="最后运行时间"
          width="200"
        ></el-table-column>
        <el-table-column
          prop="HeartbeatTime"
          label="心跳时间"
          width="200"
        ></el-table-column>
        <el-table-column
          label="操作"
          width="280"
          align="center"
          header-align="center"
          fixed="right"
        >
          <template #default="scope">
            <el-button link type="primary" @click="toLogPage(scope.row)"
              >查看日志</el-button
            >
            <el-button link type="primary" @click="excute(scope.row)"
              >执行一次</el-button
            >
            <el-button link type="warning">设置负责人</el-button>
            <el-button
              link
              :type="scope.row.IsEnabled ? 'danger' : 'success'"
              @click="enable(scope.row)"
            >
              {{ scope.row.IsEnabled ? '禁用' : '启用' }}
            </el-button>
            <el-button
              link
              type="success"
              v-show="scope.row.Status === 0"
              @click="changeStaus(scope.row, 1)"
              >启动</el-button
            >
            <el-button
              link
              type="warning"
              v-show="scope.row.Status === 1"
              @click="changeStaus(scope.row, 0)"
              >暂停</el-button
            >
            <el-button link type="danger" @click="del(scope.row)"
              >删除</el-button
            >
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
import { ElMessageBox } from 'element-plus'
import API from '@/apis/job-api'
import { useBrowserStore } from '@/stores/browserStore'
import { IJobTask } from '@/interfaces/job/IJobTask'
import { TASK_LOG } from '@/routers/job-router'

const browserStore = useBrowserStore()
const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const list = ref<IJobTask[]>([]) // 用户列表
const searchOption = ref({
  startTime: '', // 开始日期
  endTime: '', // 结束日期
  nodeName: '', // 运行节点
  groupName: '', // 所属分组
  key: '' // 关键字
}) // 搜索条件

onMounted(() => {
  get()
})

// 获取列表
function get() {
  loading.value = true
  API.getTasks(
    pageIndex.value,
    pageSize.value,
    searchOption.value.nodeName,
    searchOption.value.groupName,
    searchOption.value.key
  ).then(res => {
    total.value = res.Total
    list.value = res.Items
    loading.value = false
  })
}

// 获取状态类型样式
function getStatusClass(data: IJobTask) {
  return data.Status === 99
    ? 'danger'
    : data.Status === 1
      ? 'success'
      : 'warning'
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

// 执行一次
function excute(data: IJobTask) {
  API.excuteTask(data.Id).then(res => {
    if (res.Status) get()
  })
}

// 启用/禁用
function enable(data: IJobTask) {
  API.enableTask(data.Id).then(res => {
    if (res.Status) get()
  })
}

// 改变任务状态
function changeStaus(data: IJobTask, status: number) {
  API.changeTaskStatus(data.Id, status).then(res => {
    if (res.Status) get()
  })
}

// 删除
function del(data: IJobTask) {
  ElMessageBox.confirm(
    '确认要删除选中定时任务？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delTask(data.Id).then(res => {
      if (res.Status) get()
    })
  })
}

// 跳转日志页
function toLogPage(data: IJobTask) {
  browserStore.navigate(TASK_LOG, data)
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
