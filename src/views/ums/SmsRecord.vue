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
          v-model="searchOption.platformName"
          placeholder="平台名称"
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
          短信日志列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="PlatformName" label="短信平台"></el-table-column>
        <el-table-column prop="PhoneNumber" label="手机号码"></el-table-column>
        <el-table-column
          prop="NationCode"
          label="国家（或地区）码"
          width="200"
        ></el-table-column>
        <el-table-column
          show-overflow-tooltip
          prop="Content"
          label="原始消息"
        ></el-table-column>
        <el-table-column
          prop="CreateTime"
          label="发送时间"
          width="200"
        ></el-table-column>
        <el-table-column prop="ErrMsg" label="发送结果">
          <template #default="scope">
            <el-text v-if="scope.row.Status === 1" type="success">{{
              scope.row.ErrMsg
            }}</el-text>
            <el-text v-else-if="scope.row.Status === 99" class="danger">{{
              scope.row.ErrMsg
            }}</el-text>
            <el-text v-else>{{ scope.row.ErrMsg }}</el-text>
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
import { IUmsSmsRecord } from '@/interfaces/ums/IUmsSmsRecord'
import API from '@/apis/ums-api'

const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const list = ref<IUmsSmsRecord[]>([]) // 用户列表
const searchOption = ref({
  key: '', // 关键字
  startTime: '', // 开始日期
  endTime: '', // 结束日期
  platformName: '' // 平台名称
}) // 搜索条件

onMounted(() => {
  get()
})

// 获取列表
function get() {
  loading.value = true
  API.getSmsRecords(
    pageIndex.value,
    pageSize.value,
    searchOption.value.startTime,
    searchOption.value.endTime,
    searchOption.value.platformName
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
