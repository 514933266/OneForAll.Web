<template>
  <el-container class="person-entry-page">
    <!-- 头部条 -->
    <div class="title">
      <div class="title-text">入职管理</div>
      <div>
        <el-button link @click="notSupported" type="primary"
          ><font-awesome-icon fas icon="cog"></font-awesome-icon>&nbsp;
          设置新员工入职培训
        </el-button>
        <span class="right-line">|</span>
        <el-button link @click="notSupported" type="primary"
          ><font-awesome-icon fas icon="bell"></font-awesome-icon>&nbsp;
          新员工欢迎公告
        </el-button>
        <span class="right-line">|</span>
        <el-button link @click="notSupported" type="primary"
          ><font-awesome-icon fas icon="users"></font-awesome-icon>&nbsp;
          查看最近入职的人
        </el-button>
      </div>
    </div>
    <!-- desc -->
    <div class="title-desc">
      待入职员工（共<el-text type="primary"
        >&nbsp;{{ list.length }}&nbsp;</el-text
      >人）
    </div>
    <!-- 搜索 -->
    <div class="search-box">
      <div>
        <el-input
          placeholder="搜索姓名"
          suffix-icon="el-icon-search"
          v-model="searchOption.name"
          style="width: 200px"
        >
        </el-input>
        <el-input
          class="ofa-ml10"
          placeholder="手机号码"
          suffix-icon="el-icon-search"
          v-model="searchOption.mobilePhone"
          style="width: 200px"
        >
        </el-input>
        <el-date-picker
          class="ofa-ml10"
          v-model="searchOption.dates"
          type="daterange"
          range-separator="~"
          start-placeholder="入职日期"
          end-placeholder="入职日期"
          style="width: 300px"
          value-format="YYYY-MM-DD"
        >
        </el-date-picker>
        <el-select
          clearable
          class="ofa-ml10"
          v-model="searchOption.submit"
          placeholder="入职登记表"
          style="width: 200px"
        >
          <el-option label="是" value="1"></el-option>
          <el-option label="否" value="0"></el-option>
        </el-select>
        <el-input
          class="ofa-ml10"
          placeholder="办理人"
          suffix-icon="el-icon-search"
          v-model="searchOption.creatorName"
          style="width: 200px"
        >
        </el-input>
        <el-button type="primary" @click="get" class="ofa-ml10">
          <font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
        </el-button>
      </div>
      <div>
        <el-button type="primary" @click="showDrawer">办理入职</el-button>
      </div>
    </div>
    <!-- 表格区域 -->
    <el-table
      :data="list"
      @cell-mouse-enter="row => (hoverIndex = row.index)"
      @cell-mouse-leave="() => (hoverIndex = -1)"
      class="ofa-table"
    >
      <el-table-column prop="Name" label="姓名"> </el-table-column>
      <el-table-column prop="TeamName" label="部门"> </el-table-column>
      <el-table-column prop="Job" label="职位"> </el-table-column>
      <el-table-column prop="IsSubmitEntryFile" label="入职登记表">
        <template #default="scope">
          <div class="date-box">
            <div class="ofa-mr10">
              <div>{{ scope.row.IsSubmitEntryFile ? '是' : '否' }}</div>
            </div>
            <el-button
              link
              @click="invite(scope.row)"
              v-show="hoverIndex == scope.row.index"
              type="primary"
              >邀请</el-button
            >
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="EstimateEntryDate" label="预计入职时间">
        <template #default="scope">
          <div class="date-box">
            <div class="mr10">
              <div>
                {{ dayjs(scope.row.EstimateEntryDate).format('YYYY-MM-DD') }}
              </div>
              <div v-show="scope.row.IsOverdue" class="color-red">
                已超期{{ scope.row.OverdueDays }}天
              </div>
            </div>
            <el-button
              link
              @click="showUpdadteDialog(scope.row)"
              v-show="hoverIndex == scope.row.index"
              type="primary"
              >调整
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="CreatorName" label="办理人"> </el-table-column>
      <el-table-column
        prop="address"
        label="操作"
        width="200"
        align="center"
        header-align="center"
      >
        <template #default="scope">
          <el-button link @click="showConfirmDrawer(scope.row)" type="success"
            >确认到岗</el-button
          >
          <el-button link @click="del(scope.row)" type="danger">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-container>
  <!-- 办理入职 抽屉 -->
  <el-drawer
    v-model="drawerVisiable"
    :modal="false"
    :show-close="false"
    direction="rtl"
    size="400px"
    class="ofa-drawer"
  >
    <template #header>
      <span class="title">办理入职</span>
    </template>
    <el-form
      :model="entity"
      :rules="validationRule"
      label-width="120px"
      class="form"
      ref="personFormRef"
    >
      <el-alert
        :closable="false"
        title="添加待入职员工后邀请员工补充入职信息"
        type="warning"
        show-icon
        class="ofa-mb10"
      >
      </el-alert>
      <el-form-item label="姓名" prop="Name">
        <el-input v-model="entity.Name" placeholder="请输入员工姓名"></el-input>
      </el-form-item>
      <el-form-item label="手机号码" prop="MobilePhone">
        <el-input
          v-model="entity.MobilePhone"
          placeholder="请输入手机号码"
        ></el-input>
      </el-form-item>
      <el-form-item label="预计入职日期" prop="EstimateEntryDate">
        <el-date-picker
          v-model="entity.EstimateEntryDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择日期"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item label="部门" prop="TeamId">
        <TeamCascader
          v-model="entity.TeamId"
          placeholder="请选择入职部门"
        ></TeamCascader>
      </el-form-item>
      <el-form-item label="职位" prop="Job">
        <el-select clearable v-model="entity.Job" placeholder="岗位职级">
          <el-option
            v-for="item in jobs"
            :key="item.Id"
            :label="item.Name"
            :value="item.Name"
          ></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div class="footer">
      <el-button type="primary" @click="submit">
        <font-awesome-icon fas icon="save"></font-awesome-icon>&nbsp;确认
      </el-button>
      <el-button type="warning" @click="drawerVisiable = false">
        取消
      </el-button>
    </div>
  </el-drawer>
  <!-- 调整预计入职日期 -->
  <el-dialog
    title="调整预计入职日期"
    v-model="dialogVisiable"
    width="400"
    custom-class="ofa-dialog"
  >
    <el-form
      :model="entity"
      :rules="validationRule"
      ref="form"
      label-position="right"
      label-width="150px"
    >
      <el-form-item label="姓名">
        {{ entity.Name }}
      </el-form-item>
      <el-form-item label="预计入职时间" prop="EstimateEntryDate">
        <el-date-picker
          v-model="entity.EstimateEntryDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择日期"
        >
        </el-date-picker>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisiable = false">取消</el-button>
        <el-button type="primary" @click="updateEstimateEntryDate"
          >确 定</el-button
        >
      </span>
    </template>
  </el-dialog>
  <!-- 确认到岗 抽屉 -->
  <el-drawer
    v-model="confirmDrawerVisiable"
    :modal="false"
    :show-closeSearchTag="false"
    direction="rtl"
    size="380px"
    class="ofa-drawer"
  >
    <template #header>
      <span class="title">确认到岗</span>
    </template>
    <el-form
      :model="confirmEntity"
      label-width="120px"
      class="form"
      ref="confirmForm"
    >
      <el-form-item label="姓名" prop="Name">
        <el-input
          disabled
          v-model.trim="entity.Name"
          placeholder="姓名"
        ></el-input>
      </el-form-item>
      <el-form-item label="职级" prop="Job">
        <el-input
          disabled
          v-model.trim="entity.Job"
          placeholder="岗位职级"
        ></el-input>
      </el-form-item>
      <el-form-item label="手机" prop="MobilePhone">
        <el-input
          disabled
          v-model.trim="entity.MobilePhone"
          placeholder="联系手机"
        ></el-input>
      </el-form-item>
      <el-divider content-position="left">入职信息</el-divider>
      <el-form-item label="工号" prop="WorkNumber">
        <el-input
          v-model="confirmEntity.WorkNumber"
          placeholder="工号"
        ></el-input>
      </el-form-item>
      <el-form-item label="员工类型" prop="EmployeeType">
        <el-select v-model="confirmEntity.EmployeeType" placeholder="员工类型">
          <el-option
            v-for="item in PERSON_EMPLOYEE_TYPE"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="员工状态" prop="EmployeeStatus">
        <el-select
          v-model="confirmEntity.EmployeeStatus"
          placeholder="员工状态"
        >
          <el-option
            v-for="item in PERSON_EMPLOYEE_STATUS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="Remark">
        <el-input v-model="confirmEntity.Remark" placeholder="备注"></el-input>
      </el-form-item>
    </el-form>
    <div class="footer">
      <el-button type="primary" @click="confirm">
        <font-awesome-icon fas icon="save"></font-awesome-icon>&nbsp;确认
      </el-button>
      <el-button type="warning" @click="confirmDrawerVisiable = false">
        取消
      </el-button>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import {
  ElMessageBox,
  ElMessage,
  dayjs,
  FormRules,
  FormInstance
} from 'element-plus'
import API from '@/apis/oa-api'
import { PERSON_EMPLOYEE_TYPE, PERSON_EMPLOYEE_STATUS } from '@/consts/oa-const'
import { IOAJob } from '@/interfaces/oa/IOAJob'
import {
  IOAPersonEntry,
  IOAPersonEntryForm,
  IOAPersonEntryConfirmForm
} from '@/interfaces/oa/IOAPersonEntry'
import TeamCascader from './components/TeamCascader.vue'

const hoverIndex = ref(-1) // 鼠标当前行下标
const dialogVisiable = ref(false) // 调整入职日期弹窗
const drawerVisiable = ref(false) // 显示办理入职抽屉
const confirmDrawerVisiable = ref(false) // 显示确认到岗抽屉
const jobs = ref<IOAJob[]>([]) // 职级列表
const list = ref<IOAPersonEntry[]>([]) // 列表
const entity = ref<IOAPersonEntryForm>(Object.assign({})) // 表单
const confirmEntity = ref<IOAPersonEntryConfirmForm>(Object.assign({})) // 表单
const searchOption = ref({
  name: '', // 员工姓名
  mobilePhone: '', //手机号码
  submit: '', // 已提交
  dates: '', //入职日期
  startDate: '', // 开始入职日期
  endDate: '', // 结束入职日期
  creatorName: '' // 办理人
})
// 表单
const personFormRef = ref<FormInstance>()
// 表单条件
const validationRule = reactive<FormRules<any>>({
  Name: [
    { required: true, message: '请先填写员工姓名' },
    { min: 2, max: 20, message: '员工姓名长度在2~20之间' }
  ],
  Job: [
    { required: true, message: '请先填写岗位职级' },
    { min: 2, max: 20, message: '岗位职级长度在2~20之间' }
  ],
  MobilePhone: [
    { required: true, message: '请先填写手机号码' },
    { min: 11, max: 20, message: '手机号码长度错误' }
  ],
  TeamId: [{ required: true, message: '请先选择入职部门' }],
  EstimateEntryDate: [{ required: true, message: '请先选择预计入职时间' }]
})

onMounted(() => {
  get()
  getJobs()
})

// 获取职级列表
function getJobs() {
  API.getJobs().then(res => {
    jobs.value = res
  })
}

// 获取待入职列表
function get() {
  let startDate = ''
  let endDate = ''
  if (searchOption.value.dates) {
    startDate = searchOption.value.dates[0]
    endDate = searchOption.value.dates[1]
  }
  API.getPersonEntrys(
    searchOption.value.name,
    searchOption.value.creatorName,
    searchOption.value.mobilePhone,
    startDate,
    endDate
  ).then(res => {
    list.value = res
  })
}

// 显示添加抽屉
function showDrawer() {
  drawerVisiable.value = true
  entity.value = Object.assign({})
}

// 提交
function submit() {
  personFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      API.addPersonEntry(entity.value).then(res => {
        if (res.Status) get()
      })
    }
  })
}

// 删除
function del(item: IOAPersonEntry) {
  ElMessageBox.confirm(
    '确认要删除选中待办入职数据？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delPersonEntry(item.Id).then(res => {
      if (res.Status) get()
    })
  })
}

// 显示调整入职日期弹窗
function showUpdadteDialog(item: IOAPersonEntry) {
  entity.value = item
  dialogVisiable.value = true
}

// 更新预计入职日期
function updateEstimateEntryDate() {
  API.updatePersonEntry(entity.value).then(res => {
    if (res.Status) {
      get()
      dialogVisiable.value = false
    }
  })
}

// 邀请员工填写入职档案
function invite(item: IOAPersonEntry) {
  const url = window.location.host + `/#/entry-file?Id=${item.Id}`
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('填写地址已复制到粘贴板，可发送给员工查看填写')
  })
}

// 确认到岗
function showConfirmDrawer(item: IOAPersonEntry) {
  entity.value = item
  confirmEntity.value = Object.assign({
    Id: item.Id,
    WorkNumber: '',
    Remark: '',
    EmployeeType: PERSON_EMPLOYEE_TYPE[0].label,
    EmployeeStatus: PERSON_EMPLOYEE_STATUS[0].label
  })
  confirmDrawerVisiable.value = true
}

// 确认到岗
function confirm() {
  API.confirmPersonEntry(confirmEntity.value).then(res => {
    if (res.Status) {
      get()
      confirmDrawerVisiable.value = false
    }
  })
}

// 暂未开放
function notSupported() {
  ElMessage.warning('功能暂未开放')
}
</script>

<style lang="scss" scoped>
.person-entry-page {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 20px;
  padding: 20px;

  .title {
    display: flex;
    justify-content: space-between;
  }
  .title-text {
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

:deep(.el-select__tags) {
  white-space: nowrap;
  overflow: hidden;
  flex-wrap: nowrap;
}
.select-btn {
  margin: 10px 0 15px;
}
:deep(.el-dialog__header) {
  border-bottom: 1px solid #e8e8e8;
}
:deep(.el-dialog__footer) {
  border-top: 1px solid #e8e8e8;
}
.dialog-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 16px;
}
.line-from {
  background-color: #e8e8e8;
  height: 1px;
  margin: 30px 0 16px;
  width: 100%;
}
.date-box {
  display: flex;
  align-items: center;
}
.color-red {
  color: #ff4141;
}

.tag-box .mr10 {
  margin-bottom: 5px;
}
:deep(.el-tabs__item) {
  height: 50px;
  line-height: 50px;
}
.content-box {
  padding: 0 20px 0;
}
.qr-title {
  text-align: center;
  color: #171a1d;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  margin-bottom: 20px;
  margin-top: 8px;
}
.mb10 {
  margin-bottom: 10px;
}
.drawer-box {
  position: relative;
}
.job-desc {
  width: 80%;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  line-height: 1.5;
}
.form-box {
  box-sizing: border-box;
  position: relative;
  height: calc(100vh - 66px);
  padding: 20px 0 50px;
  overflow-y: scroll;
}
.btn-box {
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
  border-top: 1px solid #e8e8e8;
  background: #fff;
  height: 40px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 10px 24px 10px 12px;
}
</style>
