<template>
  <el-container class="wxgzh-user-page">
    <el-header class="header">
      <span class="search-box">
        <el-input enterable v-model="searchOption.key" placeholder="用户名 / 账号" style="width: 260px">
          <template #prefix>
            <font-awesome-icon fas icon="user"></font-awesome-icon>
          </template>
        </el-input>
        <el-button @click="search" type="primary" class="ofa-ml10"><font-awesome-icon fas
            icon="search"></font-awesome-icon>&nbsp;查询</el-button>
      </span>
      <span></span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          微信关注用户列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="ClientName" label="微信客户端名称"></el-table-column>
        <el-table-column prop="UserName" label="用户名"></el-table-column>
        <el-table-column prop="UserNickName" label="昵称"></el-table-column>
        <el-table-column prop="CreateTime" label="关注时间">
          <template #default="scope">{{
            dayjs(scope.row.CreateTime).format('YYYY-MM-DD HH:mm')
          }}</template>
        </el-table-column>
        <el-table-column prop="ReplyType" label="关注方式">
          <template #default="scope">{{
            getTypeStr(scope.row.SubscribeType)
          }}</template>
        </el-table-column>
      </el-table>
      <el-pagination background layout="total, sizes, prev, pager, next, jumper" v-model:current-page="pageIndex"
        :page-sizes="[10, 20, 50, 100]" v-model:page-size="pageSize" :total="total" @size-change="pageSizeChange"
        @current-change="pageIndexChange">
      </el-pagination>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import dayjs from '@/untils/dayjs'
import { ISysWxgzhSubscribeUser } from '@/interfaces/sys/ISysWxgzhSubscribeUser'
import { WX_GZH_SUBSCRIBE_TYPE } from '@/consts/sys-const'
import API from '@/apis/sys-api'

const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const searchOption = ref({
  key: ''
}) // 搜索条件
const list = ref<ISysWxgzhSubscribeUser[]>([]) // 列表

onMounted(() => {
  get()
})

// 获取列表
function get() {
  loading.value = true
  API.getSysWxgzhSubscribeUsers(
    pageIndex.value,
    pageSize.value,
    searchOption.value.key
  ).then(res => {
    list.value = res.Items
    total.value = res.Total
    loading.value = false
  })
}

// 获取
function getTypeStr(type: number) {
  return WX_GZH_SUBSCRIBE_TYPE.find(w => w.value == type)?.label ?? '未知'
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
.wxgzh-user-page {
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
