<template>
  <el-container class="person-company-page">
    <el-header class="header">
      <div class="title-box">
        <span class="title"> 员工周年 </span>
        <div class="title-total">
          入职满周年员工（共<el-text type="primary"
            >&nbsp;{{ list.length }}&nbsp;</el-text
          >人）
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
          v-model="searchOption.date"
          type="month"
          placeholder="日期"
          value-format="YYYY-MM-DD"
          class="date-picker ofa-ml10"
        >
        </el-date-picker>
        <el-button type="primary" @click="get" class="ofa-ml10">
          <font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
        </el-button>
      </span>
    </el-header>
    <el-main class="content">
      <el-table :data="list" class="ofa-table">
        <el-table-column type="index" width="50" align="center">
        </el-table-column>
        <el-table-column label="姓名" prop="Name">
          <template #default="scope">
            <div class="person-name-box">
              <el-avatar
                :src="domain + scope.row.IconUrl"
                fit="contain"
                class="person-icon"
              >
                {{ getSubName(scope.row.Name) }}
              </el-avatar>
              <label style="margin-left: 8px">{{ scope.row.Name }}</label>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="职级" prop="Job"></el-table-column>
        <el-table-column label="部门" prop="Teams">
          <template #default="scope">
            <div v-for="item in scope.row.Teams" :key="item.Id">
              {{ item.Name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="员工类型"
          prop="EmployeeType"
          width="200"
        ></el-table-column>
        <el-table-column
          label="员工状态"
          prop="EmployeeStatus"
          width="200"
        ></el-table-column>
        <el-table-column label="入职日期" prop="EntryDate" width="200">
          <template #default="scope">{{
            scope.row.EntryDate
              ? dayjs(scope.row.EntryDate).format('YYYY年MM月DD日')
              : ''
          }}</template>
        </el-table-column>
        <el-table-column label="入职周年" prop="JoinAge" width="100">
          <template #default="scope">{{ scope.row.JoinAge }}年 </template>
        </el-table-column>
      </el-table>
    </el-main>
  </el-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { dayjs } from 'element-plus'
import API from '@/apis/oa-api'
import { GUID } from '@/consts/const'
import { IOAPersonCompany } from '@/interfaces/oa/IOAPersonCompany'
import TeamCascader from './components/TeamCascader.vue'

const domain = ref(API.getHost())
const list = ref<IOAPersonCompany[]>([]) // 用户列表
// 搜索条件
const searchOption = ref({
  teamId: GUID,
  date: dayjs().format('YYYY-MM-DD')
})

onMounted(() => {
  get()
})

// 获取列表
function get() {
  API.getCompanyPersons(
    searchOption.value.teamId,
    searchOption.value.date
  ).then(res => {
    list.value = res
  })
}

// 获取简略名字
function getSubName(str: string) {
  return str && str.length > 0 ? str.substring(0, 1) : 'User'
}
</script>

<style lang="scss" scoped>
.person-company-page {
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

.person-name-box {
  display: flex;
  align-items: center;

  .person-icon {
    margin-right: 10px;
    border-radius: 50%;
    width: 45px;
    height: 45px;
    background: rgba(27, 154, 247, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
  }
}
</style>
