<template>
  <el-container class="operation-log-page">
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
          操作日志列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="MoudleName" label="模块名称" width="200"></el-table-column>
        <el-table-column prop="MoudleCode" label="模块代码" width="200"></el-table-column>
        <el-table-column prop="Controller" label="控制器" width="160"></el-table-column>
        <el-table-column prop="Action" label="方法" width="200"></el-table-column>
        <el-table-column prop="Type" label="类型" width="100"></el-table-column>
        <el-table-column show-overflow-tooltip prop="Remark" label="备注" width="300"></el-table-column>
        <el-table-column prop="CreatorName" label="操作人" width="200"></el-table-column>
        <el-table-column prop="CreateTime" label="操作时间" width="200"></el-table-column>
        <el-table-column label="操作" width="120" align="center" header-align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="showDrawer(scope.row)">查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination background layout="total, sizes, prev, pager, next, jumper" v-model:current-page="pageIndex"
        :page-sizes="[10, 20, 50, 100]" v-model:page-size="pageSize" :total="total" @size-change="pageSizeChange"
        @current-change="pageIndexChange">
      </el-pagination>
    </el-main>
  </el-container>
  <!-- 表单 -->
  <el-drawer v-model="drawerVisiable" direction="rtl" size="660" class="ofa-drawer">
    <template #header>
      <span class="title">日志详情</span>
    </template>
    <el-form status-icon ref="messageForm" :model="entity" label-width="120px">
      <el-form-item label="模块名称：">
        <label>{{ entity.MoudleName }}</label>
      </el-form-item>
      <el-form-item label="模块代码：">
        <label>{{ entity.MoudleCode }}</label>
      </el-form-item>
      <el-form-item label="控制器：">
        <label>{{ entity.Controller }}</label>
      </el-form-item>
      <el-form-item label="方法：">
        <label>{{ entity.Action }}</label>
      </el-form-item>
      <el-form-item label="操作人：">
        <label>{{ entity.CreatorName }}</label>
      </el-form-item>
      <el-form-item label="消耗时间：">
        <label>{{ entity.TimeSpan }}</label>
      </el-form-item>
      <el-form-item label="操作时间：">
        <label>{{ entity.CreateTime }}</label>
      </el-form-item>
      <el-form-item label="类型：">
        <label>{{ entity.Type }}</label>
      </el-form-item>
      <el-form-item label="备注：">
        <label>{{ entity.Remark }}</label>
      </el-form-item>
      <el-form-item label="内容：">
        <label>{{ entity.Content }}</label>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { ISysOperationLog } from '@/interfaces/syslog/ISysOperationLog'
import API from '@/apis/syslog-api'

const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const list = ref<ISysOperationLog[]>([]) // 用户列表
const drawerVisiable = ref(false)
const searchOption = ref({
  key: '', // 关键字
  startTime: '', // 开始日期
  endTime: '', // 结束日期
  userName: '' // 操作人
}) // 搜索条件
const entity = ref<ISysOperationLog>(
  Object.assign({})
) // 实体

onMounted(() => {
  get()
})

// 获取列表
function get() {
  loading.value = true
  API.getOperationLogs(
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

// 显示添加抽屉
function showDrawer(item: ISysOperationLog) {
  entity.value = item
  drawerVisiable.value = true
}
</script>

<style lang="scss" scoped>
.operation-log-page {
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
