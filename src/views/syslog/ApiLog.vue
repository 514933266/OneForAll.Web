<template>
  <el-container class="api-log-page">
    <el-header class="header">
      <span>
        <el-input
          enterable
          v-model="searchOption.userName"
          placeholder="操作人"
          style="width: 200px"
        >
          <template #prefix>
            <font-awesome-icon fas icon="user"></font-awesome-icon>
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
          v-model="searchOption.controller"
          placeholder="控制器"
          style="width: 200px"
          class="ofa-ml10"
        ></el-input>
        <el-input
          v-model="searchOption.action"
          placeholder="方法"
          style="width: 200px"
          class="ofa-ml10"
        ></el-input>
        <el-input
          v-model="searchOption.key"
          placeholder="模块代码"
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
          Api日志列表
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
                  <span>基本信息</span>
                </template>
                <el-form-item label="模块名称：">
                  <label>{{ props.row.MoudleName }}</label>
                </el-form-item>
                <el-form-item label="模块代码：">
                  <label>{{ props.row.MoudleCode }}</label>
                </el-form-item>
                <el-form-item label="控制器：">
                  <label>{{ props.row.Controller }}</label>
                </el-form-item>
                <el-form-item label="方法：">
                  <label>{{ props.row.Action }}</label>
                </el-form-item>
                <el-form-item label="耗时：">
                  <label>{{ props.row.TimeSpan }}</label>
                </el-form-item>
                <el-form-item label="Ip地址：">
                  <label>{{ props.row.IPAddress }}</label>
                </el-form-item>
                <el-form-item label="浏览器信息：">
                  <label>{{ props.row.UserAgent }}</label>
                </el-form-item>
                <el-form-item label="操作人：">
                  <label>{{ props.row.CreatorName }}</label>
                </el-form-item>
                <el-form-item label="消耗时间：">
                  <label>{{ props.row.TimeSpan }}</label>
                </el-form-item>
                <el-form-item label="操作时间：">
                  <label>{{ props.row.CreateTime }}</label>
                </el-form-item>
              </el-card>
              <el-card content-position="left" shadow="never" class="ofa-mt10">
                <template #header>
                  <span class="card-header-label">请求信息</span>
                </template>
                <el-form-item label="状态码：">
                  <label>{{ props.row.StatusCode }}</label>
                </el-form-item>
                <el-form-item label="请求方法：">
                  <label>{{ props.row.Method }}</label>
                </el-form-item>
                <el-form-item label="请求类型：">
                  <label>{{ props.row.ContentType }}</label>
                </el-form-item>
                <el-form-item label="请求域名：">
                  <label>{{ props.row.Host }}</label>
                </el-form-item>
                <el-form-item label="请求地址：">
                  <label>{{ props.row.Url }}</label>
                </el-form-item>
                <el-form-item label="请求参数：">
                  <label>{{ props.row.RequestBody }}</label>
                </el-form-item>
                <el-form-item label="响应：">
                  <label>{{ props.row.ReponseBody }}</label>
                </el-form-item>
              </el-card>
            </el-form>
          </template>
        </el-table-column>
        <el-table-column prop="MoudleName" label="模块名称"></el-table-column>
        <el-table-column prop="MoudleCode" label="模块代码"></el-table-column>
        <el-table-column prop="Controller" label="控制器"></el-table-column>
        <el-table-column prop="Action" label="方法"></el-table-column>
        <el-table-column prop="TimeSpan" label="耗时"></el-table-column>
        <el-table-column prop="Method" label="请求方法" width="100">
          <template #default="scope">
            <el-tag :type="getMethodType(scope.row)">{{
              scope.row.Method
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="IPAddress"
          label="Ip地址"
          width="200"
        ></el-table-column>
        <el-table-column prop="StatusCode" label="状态码" width="100">
          <template #default="scope">
            <el-text>{{ scope.row.StatusCode }}</el-text>
          </template>
        </el-table-column>
        <el-table-column
          prop="CreatorName"
          label="操作人"
          width="200"
        ></el-table-column>
        <el-table-column
          prop="CreateTime"
          label="操作时间"
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
import { ref, nextTick, onMounted } from 'vue'
import { ISysApiLog } from '@/interfaces/syslog/ISysApiLog'
import API from '@/apis/syslog-api'

const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const list = ref<ISysApiLog[]>([]) // 用户列表
const searchOption = ref({
  key: '', // 关键字
  startTime: '', // 开始日期
  endTime: '', // 结束日期
  userName: '', // 操作人
  controller: '', // 控制器
  action: '' // 方法
}) // 搜索条件

onMounted(() => {
  get()
})

// 获取列表
function get() {
  loading.value = true
  API.getApiLogs(
    pageIndex.value,
    pageSize.value,
    searchOption.value.startTime,
    searchOption.value.endTime,
    searchOption.value.userName,
    searchOption.value.controller,
    searchOption.value.action,
    searchOption.value.key
  ).then(res => {
    total.value = res.Total
    list.value = res.Items
    loading.value = false
  })
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

// 获取请求方法的组件类型效果
function getMethodType(data: ISysApiLog) {
  switch (data.Method) {
    case 'GET':
      return 'success'
    case 'PUT':
      return 'primary'
    case 'POST':
      return 'primary'
    case 'PATCH':
      return 'primary'
  }
  return 'info'
}
</script>

<style lang="scss" scoped>
.api-log-page {
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
