<template>
  <el-container class="person-formal-page">
    <!-- 头部条 -->
    <div class="entry-title">
      <div class="entry-title-text">转正管理</div>
      <div>
        <el-button link @click="notSupported" type="primary"
          ><font-awesome-icon fas icon="user-tie"></font-awesome-icon>&nbsp;
          待退出员工
        </el-button>
        <span class="right-line">|</span>
        <el-button link @click="notSupported" type="primary"
          ><font-awesome-icon fas icon="user-slash"></font-awesome-icon>&nbsp;
          查看最近离职的人
        </el-button>
        <span class="right-line">|</span>
        <el-button link @click="notSupported" type="primary"
          ><font-awesome-icon fas icon="users-slash"></font-awesome-icon
          >&nbsp;已离职员工
        </el-button>
      </div>
    </div>
    <!-- desc -->
    <div class="title-desc">
      试用期员工（共<el-text type="primary"
        >&nbsp;{{ list.length }}&nbsp;</el-text
      >人）
    </div>
    <div class="search-box">
      <div>
        <TeamCascader
          showRoot
          v-model="searchOption.teamId"
          rootName="全部"
          placeholder="部门"
        ></TeamCascader>
        <el-input
          v-model="searchOption.name"
          class="ofa-ml10"
          placeholder="员工姓名"
          style="width: 200px"
        ></el-input>
        <el-date-picker
          v-model="searchOption.actualDates"
          class="ofa-ml10"
          type="daterange"
          range-separator="~"
          start-placeholder="实际转正"
          end-placeholder="实际转正"
          style="width: 300px"
          value-format="YYYY-MM-DD"
        >
        </el-date-picker>
        <el-date-picker
          v-model="searchOption.planDates"
          class="ofa-ml10"
          type="daterange"
          range-separator="~"
          start-placeholder="计划转正"
          end-placeholder="计划转正"
          style="width: 300px"
          value-format="YYYY-MM-DD"
        >
        </el-date-picker>
        <el-button type="primary" @click="get" class="ofa-ml10">
          <font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
        </el-button>
      </div>
    </div>
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
        <el-table-column prop="Job" label="职位"> </el-table-column>
        <el-table-column prop="EmployeeType" label="员工类型">
        </el-table-column>
        <el-table-column prop="EntryDate" label="入职日期" width="160">
          <template #default="scope">{{
            dayjs(scope.row.EntryDate).format('YYYY-MM-DD')
          }}</template>
        </el-table-column>
        <el-table-column prop="TryDate" label="试用期" width="160">
        </el-table-column>
        <el-table-column prop="PlanEntryDate" label="计划转正日期" width="160">
          <template #default="scope">{{
            dayjs(scope.row.PlanEntryDate).format('YYYY-MM-DD')
          }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="scope">
            <el-button link @click="showDrawer(scope.row)" type="primary"
              >办理转正</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-main>
  </el-container>
  <!-- 抽屉 -->
  <el-drawer
    v-model="drawerVisiable"
    :modal="false"
    :show-closeSearchTag="false"
    direction="rtl"
    size="380px"
    class="ofa-drawer"
  >
    <template #header>
      <span class="title">办理转正</span>
    </template>
    <el-form
      ref="personFormRef"
      :model="confirmEntity"
      :rules="validationRule"
      label-width="120px"
      label-position="right"
    >
      <el-form-item label="姓名：">
        <div>{{ entity.Name }}</div>
      </el-form-item>
      <el-form-item label="入职日期：">
        <div>{{ dayjs(entity.EntryDate).format('YYYY-MM-DD') }}</div>
      </el-form-item>
      <el-form-item label="实际转正日期：">
        <el-date-picker
          type="date"
          placeholder="选择日期"
          v-model="confirmEntity.ActualEntryDate"
          value-format="YYYY-MM-DD"
        >
        </el-date-picker>
      </el-form-item>
    </el-form>
    <div class="footer">
      <el-button type="primary" @click="submit">
        <font-awesome-icon fas icon="save"></font-awesome-icon>&nbsp;确认转正
      </el-button>
      <el-button type="warning" @click="drawerVisiable = false">
        取消
      </el-button>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, dayjs, FormRules, FormInstance } from 'element-plus'
import API from '@/apis/oa-api'
import { GUID } from '@/consts/const'
import {
  IOAPersonFormal,
  IOAPersonFormalConfirmForm
} from '@/interfaces/oa/IOAPersonFormal'
import TeamCascader from './components/TeamCascader.vue'

const domain = ref(API.getHost())
const drawerVisiable = ref(false) // 显示抽屉
const entity = ref<IOAPersonFormal>(Object.assign({})) // 实体
const confirmEntity = ref<IOAPersonFormalConfirmForm>(Object.assign({})) // 实体
const list = ref<IOAPersonFormal[]>([]) // 用户列表
// 搜索条件
const searchOption = ref({
  teamId: GUID, // 部门
  name: '', // 姓名
  planDates: '', // 计划转正
  actualDates: '' // 实际转正
})
// 表单
const personFormRef = ref<FormInstance>()
// 表单验证规则
const validationRule = reactive<FormRules<any>>({
  ActualEntryDate: [{ required: true, message: '请先选择实际转正日期' }]
})

onMounted(() => {
  get()
})

// 获取列表
function get() {
  let planStartDate = ''
  let planEndDate = ''
  let actualStartDate = ''
  let actualEndDate = ''
  if (searchOption.value.planDates) {
    planStartDate = searchOption.value.planDates[0]
    planEndDate = searchOption.value.planDates[1]
  }
  if (searchOption.value.actualDates) {
    actualStartDate = searchOption.value.actualDates[0]
    actualEndDate = searchOption.value.actualDates[1]
  }
  API.getPersonFormals(
    searchOption.value.name,
    searchOption.value.teamId,
    planStartDate,
    planEndDate,
    actualStartDate,
    actualEndDate
  ).then(res => {
    list.value = res
  })
}

// 获取简略名字
function getSubName(str: string) {
  return str && str.length > 0 ? str.substring(0, 1) : 'User'
}

// 显示抽屉
function showDrawer(item: IOAPersonFormal) {
  entity.value = item
  confirmEntity.value = Object.assign({ Id: item.Id, ActualEntryDate: '' })
  drawerVisiable.value = true
}

// 提交
function submit() {
  personFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      confirm(confirmEntity.value)
    }
  })
}

// 确认到岗
function confirm(item: IOAPersonFormalConfirmForm) {
  API.confirmPersonalFormal(item).then(res => {
    if (res.Status) {
      get()
      drawerVisiable.value = false
    }
  })
}

// 暂未开放
function notSupported() {
  ElMessage.warning('功能暂未开放')
}
</script>

<style lang="scss" scoped>
.person-formal-page {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 20px;
  padding: 20px;

  .entry-title {
    display: flex;
    justify-content: space-between;
  }
  .entry-title-text {
    color: #303133;
    font-size: 1.75rem;
    font-weight: bold;
  }
  .right-line {
    margin-left: 15px;
    margin-right: 15px;
    color: rgb(216, 216, 216);
  }
  .title-desc {
    color: rgba(0, 0, 0, 0.65);
    font-size: 16px;
    margin-top: 10px;
  }
  .search-box {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    margin-bottom: 20px;
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
