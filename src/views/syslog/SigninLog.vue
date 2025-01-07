<template>
  <el-container class="login-log-page">
    <el-header class="header">
      <span class="search-box">
        <el-input enterable v-model="searchOption.key" placeholder="操作人" style="width: 200px" class="ofa-mr10">
          <template #prefix>
            <font-awesome-icon fas icon="user"></font-awesome-icon>
          </template>
        </el-input>
        <el-date-picker v-model="searchOption.startTime" type="datetime" placeholder="开始日期" format="YYYY-MM-DD"
          value-format="YYYY-MM-DD" style="width: 200px" class="ofa-mr10">
        </el-date-picker>
        <el-date-picker v-model="searchOption.endTime" type="datetime" placeholder="结束日期" format="YYYY-MM-DD"
          value-format="YYYY-MM-DD" style="width: 200px" class="ofa-mr10">
        </el-date-picker>
        <el-input v-model="searchOption.key" placeholder="模块代码" style="width: 200px" class="ofa-mr10"></el-input>
        <el-button @click="search" type="primary"><font-awesome-icon fas
            icon="search"></font-awesome-icon>&nbsp;查询</el-button>
      </span>
      <span> </span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          登录日志列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="UserName" label="登录账号" width="200"></el-table-column>
        <el-table-column prop="CreatorName" label="昵称" width="200"></el-table-column>
        <el-table-column prop="Source" label="来源" width="100"></el-table-column>
        <el-table-column prop="LoginType" label="登录方式" width="200"></el-table-column>
        <el-table-column prop="IPAddress" label="Ip地址" width="200"></el-table-column>
        <el-table-column prop="CreateTime" label="登录时间" width="200"></el-table-column>
      </el-table>
      <el-pagination background layout="total, sizes, prev, pager, next, jumper" v-model:current-page="pageIndex"
        :page-sizes="[10, 20, 50, 100]" v-model:page-size="pageSize" :total="total" @size-change="pageSizeChange"
        @current-change="pageIndexChange">
      </el-pagination>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { ISysLoginLog } from '@/interfaces/syslog/ISysLoginLog'
import API from '@/apis/syslog-api'

const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const list = ref<ISysLoginLog[]>([]) // 用户列表
const searchOption = ref({
  key: '', // 关键字
  startTime: '', // 开始日期
  endTime: '', // 结束日期
  userName: '' // 操作人
}) // 搜索条件

onMounted(() => {
  get()
})

// 获取列表
function get() {
  loading.value = true
  API.getLoginLogs(
    pageIndex.value,
    pageSize.value,
    searchOption.value.startTime,
    searchOption.value.endTime,
    searchOption.value.userName,
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
</script>

<style lang="scss" scoped>
.login-log-page {
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
      padding: 6px 4px;
    }

    .button-box {
      display: flex;
      align-items: flex-start;
    }
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
