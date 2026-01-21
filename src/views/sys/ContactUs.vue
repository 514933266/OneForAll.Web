<template>
  <el-container class="contact-us-page">
    <el-header class="header">
      <span>
        <el-input enterable v-model="searchOption.key" placeholder="名称 / 联系方式" style="width: 260px">
          <template #prefix>
            <font-awesome-icon fas icon="phone"></font-awesome-icon>
          </template>
        </el-input>
        <el-button @click="search" type="primary" class="ofa-ml10"><font-awesome-icon fas
            icon="search"></font-awesome-icon>&nbsp;查询</el-button>
      </span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          联系我们列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="Name" label="姓名/公司名称"></el-table-column>
        <el-table-column prop="Contact" label="邮箱/电话"></el-table-column>
        <el-table-column prop="Message" label="留言"></el-table-column>
        <el-table-column prop="CreateTime" label="留言时间" width="180"></el-table-column>
        <el-table-column label="操作" width="200" align="center" header-align="center">
          <template #default="scope">
            <el-button link v-if="permission.Delete" type="danger" @click="del(scope.row)">删除</el-button>
          </template>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { CONTACT_US } from '@/routers/sys-router'
import { ISysContactUs } from '@/interfaces/sys/ISysContactUs'
import API from '@/apis/sys-api'

const userStore = useUserStore()
const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const searchOption = ref({
  key: ''
}) // 搜索条件
const list = ref<ISysContactUs[]>([]) // 列表

const permission = computed(() => {
  return userStore.getPermissions(CONTACT_US.Url) // 权限列表
})

onMounted(() => {
  get()
})

// 获取列表
function get() {
  loading.value = true
  API.getContactUs(
    pageIndex.value,
    pageSize.value,
    searchOption.value.key
  ).then(res => {
    list.value = res.Items
    total.value = res.Total
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

// 删除
function del(item: ISysContactUs) {
  ElMessageBox.confirm(
    '确认要删除选中数据？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delWxClient(item.Id).then(res => {
      if (res.Status) {
        get()
      }
    })
  })
}
</script>

<style lang="scss" scoped>
.contact-us-page {
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
