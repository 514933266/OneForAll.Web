<template>
  <el-container class="person-leave-page">
    <!-- 头部条 -->
    <div class="entry-title">
      <div class="entry-title-text">离职管理</div>
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
      离职流程中的员工（共<el-text type="primary"
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
          placeholder="搜索员工"
          v-model="searchOption.name"
          style="width: 200px"
          class="ofa-ml10"
        >
        </el-input>
        <el-date-picker
          class="ofa-ml10"
          v-model="searchOption.dates"
          type="daterange"
          range-separator="~"
          start-placeholder="离职日期"
          end-placeholder="离职日期"
          style="width: 300px"
          value-format="YYYY-MM-DD"
        >
        </el-date-picker>
        <el-button type="primary" @click="get" class="ofa-ml10">
          <font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
        </el-button>
      </div>
      <div>
        <el-button type="primary" @click="showDrawer">办理离职</el-button>
      </div>
    </div>
    <el-main class="content">
      <el-table :data="list" class="ofa-table">
        <el-table-column prop="PersonName" label="姓名"> </el-table-column>
        <el-table-column prop="TeamName" label="部门"> </el-table-column>
        <el-table-column prop="PersonJob" label="职位"> </el-table-column>
        <el-table-column prop="EmployeeType" label="员工类型" width="100">
        </el-table-column>
        <el-table-column
          prop="EstimateLeaveDate"
          label="预计离职日期"
          width="200"
        >
          <template #default="scope">
            {{ dayjs(scope.row.EstimateLeaveDate).format('YYYY-MM-DD') }}
          </template>
        </el-table-column>
        <el-table-column prop="Reasons" label="离职原因">
          <template #default="scope">
            <el-tag
              v-for="item in scope.row.Reasons"
              :key="item"
              type="danger"
              class="ofa-ml4"
              >{{ item }}</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column prop="Remark" label="备注" show-overflow-tooltip>
        </el-table-column>
        <el-table-column prop="CreatorName" label="办理人"> </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="scope">
            <el-button link @click="confirm(scope.row)" type="primary"
              >确认离职</el-button
            >
            <el-button link @click="del(scope.row)" type="danger"
              >删除</el-button
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
      <span class="title">办理离职</span>
    </template>
    <el-form
      ref="personFormRef"
      :model="entity"
      :rules="validationRule"
      label-width="120px"
      label-position="right"
    >
      <el-alert
        :closable="false"
        title="选择员工办理离职，提交后所选员工将进入待离职状态"
        type="warning"
        show-icon
        class="ofa-mb10"
      >
      </el-alert>
      <el-form-item label="姓名">
        <el-text>{{ selectedPerson?.Name }}</el-text>
        <el-button link @click="showPersonDialog" type="primary">{{
          entity.PersonId ? '重新选择' : '选择'
        }}</el-button>
      </el-form-item>
      <el-form-item label="预计离职日期" prop="EstimateLeaveDate">
        <el-date-picker
          type="date"
          placeholder="选择日期"
          v-model="entity.EstimateLeaveDate"
          value-format="YYYY-MM-DD"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item label="离职原因" prop="Reasons">
        <el-select v-model="entity.Reasons" multiple placeholder="离职原因">
          <el-option-group label="主动原因">
            <el-option label="家庭原因" value="家庭原因"></el-option>
            <el-option label="个人原因" value="个人原因"></el-option>
            <el-option label="发展原因" value="发展原因"></el-option>
            <el-option
              label="合同到期不续签"
              value="合同到期不续签"
            ></el-option>
            <el-option label="其他" value="其他"></el-option>
          </el-option-group>
          <el-option-group label="被动原因">
            <el-option label="协议解除" value="协议解除"></el-option>
            <el-option label="无法胜任工作" value="无法胜任工作"></el-option>
            <el-option label="经济性裁员" value="经济性裁员"></el-option>
            <el-option label="严重违法违纪" value="严重违法违纪"></el-option>
          </el-option-group>
        </el-select>
      </el-form-item>
      <el-form-item label="离职备注" prop="Remark">
        <el-input
          v-model="entity.Remark"
          placeholder="请输离离职备注"
          type="textarea"
        >
        </el-input>
      </el-form-item>
    </el-form>
    <div class="footer">
      <el-button type="primary" @click="submit">
        <font-awesome-icon fas icon="save"></font-awesome-icon>&nbsp;办理离职
      </el-button>
      <el-button type="warning" @click="drawerVisiable = false">
        取消
      </el-button>
    </div>
  </el-drawer>
  <!-- 人员选择弹窗 -->
  <el-dialog
    v-model="personDialogVisible"
    custom-class="ofa-dialog"
    title="选择离职人员"
    width="1080"
  >
    <div class="ofa-mb10">
      <el-input
        enterable
        v-model="searchPersonOption.key"
        style="width: 200px"
        placeholder="搜索"
      >
        <template #prefix>
          <font-awesome-icon fas icon="search"></font-awesome-icon>
        </template>
      </el-input>
      <el-button @click="getPersons" type="primary" class="ofa-ml10"
        ><font-awesome-icon fas icon="search"></font-awesome-icon
        >&nbsp;查询</el-button
      >
    </div>
    <el-table border :data="persons" max-height="400">
      <el-table-column label="姓名" prop="Name"></el-table-column>
      <el-table-column label="手机" prop="MobilePhone"></el-table-column>
      <el-table-column label="职级" prop="Job"></el-table-column>
      <el-table-column label="状态" prop="EmployeeStatus"></el-table-column>
      <el-table-column label="入职日期" prop="EntryDate" width="120">
        <template #default="scope">
          {{ dayjs(scope.row.EntryDate).format('YYYY-MM-DD') }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center">
        <template #default="scope">
          <el-button link @click="selectPerson(scope.row)" type="primary"
            >选择</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue'
import {
  ElMessageBox,
  ElMessage,
  dayjs,
  FormRules,
  FormInstance
} from 'element-plus'
import API from '@/apis/oa-api'
import { GUID } from '@/consts/const'
import TeamCascader from './components/TeamCascader.vue'
import { IOAPerson } from '@/interfaces/oa/IOAPerson'
import {
  IOAPersonLeave,
  IOAPersonLeaveForm
} from '@/interfaces/oa/IOAPersonLeave'

const drawerVisiable = ref(false) // 显示抽屉
const personDialogVisible = ref(false) // 显示人员选择弹窗
const entity = ref<IOAPersonLeaveForm>(Object.assign({})) // 实体
const list = ref<IOAPersonLeave[]>([]) // 用户列表
const persons = ref<IOAPerson[]>([]) // 人员列表
const selectedPerson = ref<IOAPerson>() // 选中的人员姓名
// 搜索条件
const searchOption = ref({
  teamId: GUID, // 部门
  name: '', // 姓名
  dates: '' // 离职日期
})
// 搜索在职员工条件
const searchPersonOption = ref({
  key: '' // 人员姓名
})
// 表单
const personFormRef = ref<FormInstance>()
// 表单验证规则
const validationRule = reactive<FormRules<any>>({
  PersonName: [
    { required: true, message: '请先填写员工姓名' },
    { min: 2, max: 20, message: '员工姓名长度在2~20之间' }
  ],
  Reasons: [{ required: true, message: '请先选择离职原因' }],
  EstimateLeaveDate: [{ required: true, message: '请先选择预计入职时间' }]
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
  API.getPersonLeaves(
    searchOption.value.name,
    searchOption.value.teamId,
    startDate,
    endDate
  ).then(res => {
    list.value = res
  })
}

// 显示抽屉
function showDrawer() {
  entity.value = Object.assign({
    Id: GUID,
    PersonId: '',
    PersonName: '',
    Reasons: [],
    EstimateLeaveDate: '',
    CanCreateHistory: false
  })
  drawerVisiable.value = true
}

// 显示离职人员选择弹窗
function showPersonDialog() {
  personDialogVisible.value = true
}

// 获取人员档案列表
function getPersons() {
  API.getPersons(searchPersonOption.value.key).then(res => {
    persons.value = res
  })
}

// 选中离职人员
function selectPerson(data: IOAPerson) {
  entity.value.PersonId = data.Id
  selectedPerson.value = data
  personDialogVisible.value = false
}

// 提交
function submit() {
  personFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      API.addPersonLeave(entity.value).then(res => {
        if (res.Status) get()
      })
    }
  })
}

// 删除
function del(item: IOAPersonLeave) {
  ElMessageBox.confirm(
    '确认要删除选中待办离职数据？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delPersonLeave(item.Id).then(res => {
      if (res.Status) get()
    })
  })
}

// 确认到岗
function confirm(item: IOAPersonLeave) {
  API.confirmPersonLeave({ Id: item.Id, PersonId: item.PersonId }).then(res => {
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
.person-leave-page {
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

.dia-title {
  padding: 15px 20px;
  background-color: #f7f7f7;
}
</style>
