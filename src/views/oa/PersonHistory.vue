<template>
  <el-container class="person-history-page">
    <el-header class="header">
      <div class="title-box">
        <span class="title"> 人员异动记录 </span>
        <div class="title-total">
          异动员工记录（共<el-text type="primary"
            >&nbsp;{{ total }}&nbsp;</el-text
          >条数据）
        </div>
      </div>
      <span>
        <TeamCascader
          showRoot
          v-model="searchOption.teamId"
          rootName="全部"
          placeholder="部门"
        ></TeamCascader>
        <el-date-picker
          v-model="searchOption.dates"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="date-picker ofa-ml10"
        >
        </el-date-picker>
        <el-input
          v-model="searchOption.key"
          class="search-input ofa-ml10"
          placeholder="请输入名称搜索"
          style="width: 200px"
        ></el-input>
        <el-button type="primary" @click="search" class="ofa-ml10">
          <font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
        </el-button>
      </span>
    </el-header>
    <el-main class="content">
      <el-table :data="list" class="ofa-table">
        <el-table-column label="员工姓名" prop="PersonName"></el-table-column>
        <el-table-column label="职级" prop="PersonJob"></el-table-column>
        <el-table-column label="所在部门" prop="TeamName"></el-table-column>
        <el-table-column
          label="目标部门"
          prop="TargetTeamName"
        ></el-table-column>
        <el-table-column label="时间" prop="CreateTime">
          <template #default="scope">{{
            scope.row.CreateTime
              ? dayjs(scope.row.CreateTime).format('YYYY年MM月DD日')
              : ''
          }}</template>
        </el-table-column>
        <el-table-column label="备注" prop="Remark"></el-table-column>
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

<script lang="ts" setup>
import { ref, nextTick, onMounted } from 'vue'
import { dayjs } from 'element-plus'
import API from '@/apis/oa-api'
import { GUID } from '@/consts/const'
import { IOAPersonHistory } from '@/interfaces/oa/IOAPersonHistory'
import TeamCascader from './components/TeamCascader.vue'

const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const list = ref<IOAPersonHistory[]>([]) // 用户列表
// 搜索条件
const searchOption = ref({
  teamId: GUID,
  dates: '',
  key: ''
})

onMounted(() => {
  get()
})

// 获取列表
function get() {
  let startDate = ''
  let endDate = ''
  if (searchOption.value.dates) {
    startDate = searchOption.value.dates[0]
    endDate = searchOption.value.dates[1]
  }
  API.getPagePersonHistory(
    pageIndex.value,
    pageSize.value,
    searchOption.value.teamId,
    startDate,
    endDate,
    searchOption.value.key
  ).then(res => {
    list.value = res.Items
    total.value = res.Total
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
.person-history-page {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 20px;
  padding: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .title-box {
    padding: 20px 0;
  }
  .title {
    color: #303133;
    font-size: 1.75rem;
    font-weight: bold;
  }
  .title-total {
    color: rgba(0, 0, 0, 0.65);
    font-size: 16px;
    margin-top: 10px;
  }
}
</style>
