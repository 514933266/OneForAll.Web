<template>
  <el-container class="person-contract-page">
    <el-header class="header">
      <div class="title-box">
        <span class="title"> 员工合同 </span>
        <div class="title-total">
          近2个月即将到期和已到期员工（共<el-text type="primary"
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
        <el-button type="primary" @click="get" class="ofa-ml10">
          <font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
        </el-button>
      </span>
    </el-header>
    <el-main class="content">
      <el-table :data="list" class="ofa-table">
        <el-table-column prop="Name" label="姓名">
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
        <el-table-column prop="TeamName" label="部门"> </el-table-column>
        <el-table-column prop="ContractCompany" label="合同公司">
        </el-table-column>
        <el-table-column prop="ContractType" label="合同类型" width="160">
        </el-table-column>
        <el-table-column
          prop="ContractFirstDate"
          label="现合同起始日"
          width="160"
        >
          <template #default="scope">
            {{ dayjs(scope.row.ContractFirstDate).format('YYYY-MM-DD') }}
          </template>
        </el-table-column>
        <el-table-column
          prop="ContractEndDate"
          label="现合同到期日"
          width="160"
        >
          <template #default="scope">
            {{ dayjs(scope.row.ContractEndDate).format('YYYY-MM-DD') }}
          </template>
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
import { IOAPersonContract } from '@/interfaces/oa/IOAPersonContract'
import TeamCascader from './components/TeamCascader.vue'

const domain = ref(API.getHost())
const list = ref<IOAPersonContract[]>([]) // 用户列表
// 搜索条件
const searchOption = ref({
  teamId: GUID
})

onMounted(() => {
  get()
})

// 获取列表
function get() {
  API.getContractPersons(searchOption.value.teamId).then(res => {
    list.value = res
  })
}

// 获取简略名字
function getSubName(str: string) {
  return str && str.length > 0 ? str.substring(0, 1) : 'User'
}
</script>

<style lang="scss" scoped>
.person-contract-page {
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
