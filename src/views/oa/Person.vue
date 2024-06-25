<template>
  <el-container class="person-page">
    <div class="header">
      <el-col class="count-box">
        <div class="count-item">
          <font-awesome-icon
            fas
            icon="users"
            class="icon icon-primary"
          ></font-awesome-icon>
          <div class="r-label">
            <h1>{{ statisticEntity?.TotalOnJobCount }}</h1>
            <label>在职员工</label>
          </div>
        </div>
      </el-col>
      <el-col class="count-box">
        <div class="count-item">
          <font-awesome-icon
            fas
            icon="user-tie"
            class="icon icon-warning"
          ></font-awesome-icon>
          <div class="r-label">
            <h1>{{ statisticEntity?.NormalCount }}</h1>
            <label>全职员工</label>
          </div>
        </div>
      </el-col>
      <el-col class="count-box">
        <div class="count-item">
          <font-awesome-icon
            fas
            icon="user-clock"
            class="icon icon-success"
          ></font-awesome-icon>
          <div class="r-label">
            <h1>{{ statisticEntity?.TrialCount }}</h1>
            <label>试用员工</label>
          </div>
        </div>
      </el-col>
      <el-col class="count-box">
        <div class="count-item">
          <font-awesome-icon
            fas
            icon="user-graduate"
            class="icon icon-danger"
          ></font-awesome-icon>
          <div class="r-label">
            <h1>{{ statisticEntity?.InternCount }}</h1>
            <label>实习生</label>
          </div>
        </div>
      </el-col>
    </div>
    <div class="w-p">
      <el-button link @click="toPersonSettingPage" type="primary">
        <font-awesome-icon fas icon="cog"></font-awesome-icon
        >&nbsp;自定义档案字段设置
      </el-button>
      <el-divider direction="vertical"></el-divider>
      <el-button link @click="exportExcelDialogVisiable = true" type="primary">
        <font-awesome-icon fas icon="file-export"></font-awesome-icon>&nbsp;导出
      </el-button>
      <el-divider direction="vertical"></el-divider>
      <el-upload
        :action="API.getImportPersonExcelUrl()"
        :show-file-list="false"
      >
        <el-button link type="primary">
          <font-awesome-icon fas icon="file-import"></font-awesome-icon
          >&nbsp;导入人员信息
        </el-button>
      </el-upload>
    </div>
    <div class="w-p-2">
      <span>
        <el-button @click="showDrawer" type="primary">
          <font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增人员
        </el-button>
      </span>
      <span class="search-box">
        <el-select v-model="searchOption.onJobStatus" class="type-select">
          <el-option :value="-1" label="全部"></el-option>
          <el-option :value="0" label="在职"></el-option>
          <el-option :value="1" label="离职"></el-option>
        </el-select>
        <el-input
          v-model="searchOption.key"
          class="search-input"
          placeholder="请输入名称搜索"
        >
        </el-input>
        <el-button type="primary" @click="search">
          <font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询
        </el-button>
      </span>
    </div>
    <!-- 主体内容 -->
    <el-table v-loading="loading" :data="list" class="ofa-table">
      <el-table-column width="50" align="center" fixed>
        <template #header>
          <el-tooltip
            class="item"
            effect="dark"
            content="设置表头"
            placement="top"
          >
            <font-awesome-icon
              @click="settingDrawerVisiable = true"
              fas
              icon="cog"
              style="cursor: pointer"
            >
            </font-awesome-icon>
          </el-tooltip>
        </template>
        <template #default="scope">{{
          scope.$index + 1 + (pageIndex - 1) * pageSize
        }}</template>
      </el-table-column>
      <el-table-column
        v-for="item in checkedFields"
        :key="item.Id"
        :prop="item.Name"
        :label="item.Text"
        min-width="200"
      >
        <template #default="scope">
          <div v-if="item.Name === 'Name'" class="person-name-box">
            <el-avatar
              :src="domain + scope.row.IconUrl"
              fit="contain"
              class="person-icon"
            >
              {{ getSubName(scope.row.Name) }}
            </el-avatar>
            <label style="margin-left: 8px">{{ scope.row.Name }}</label>
          </div>
          <label v-else-if="item.Type === 3">{{
            scope.row[item.Name]
              ? dayjs(scope.row[item.Name]).format('YYYY年MM月DD日')
              : ''
          }}</label>
          <label v-else>{{ scope.row[item.Name] }}</label>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right" align="center">
        <template #default="scope">
          <el-button link type="primary" @click="toPersonDetailPage(scope.row)"
            >修改
          </el-button>
          <el-button link type="danger" @click="del(scope.row)">删除</el-button>
        </template>
      </el-table-column>
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
  </el-container>
  <!-- 人员抽屉 -->
  <el-drawer
    v-model="drawerVisiable"
    :modal="false"
    :show-close="false"
    direction="rtl"
    size="380px"
    class="ofa-drawer"
  >
    <template #header>
      <span class="title">创建人员档案</span>
    </template>
    <el-form
      status-icon
      ref="personFormRef"
      :rules="validationRule"
      :model="entity"
      class="form"
      label-width="80px"
    >
      <el-form-item label="姓名" prop="Name">
        <el-input v-model.trim="entity.Name" placeholder="姓名"></el-input>
      </el-form-item>
      <el-form-item label="职级" prop="Job">
        <el-select clearable v-model="entity.Job" placeholder="岗位职级">
          <el-option
            v-for="item in jobs"
            :key="item.Id"
            :label="item.Name"
            :value="item.Name"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="手机" prop="MobilePhone">
        <el-input
          v-model.trim="entity.MobilePhone"
          placeholder="联系手机"
        ></el-input>
      </el-form-item>
      <el-form-item label="邮箱" prop="Email">
        <el-input v-model.trim="entity.Email" placeholder="电子邮箱"></el-input>
      </el-form-item>
      <el-form-item label="身份证" prop="IdCard">
        <el-input v-model="entity.IdCard" placeholder="身份证"></el-input>
      </el-form-item>
      <el-form-item label="性别" prop=" Sex">
        <el-radio-group v-model="entity.Sex">
          <el-radio :value="false">女</el-radio>
          <el-radio :value="true">男</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-divider content-position="left">入职信息</el-divider>
      <el-form-item label="工号" prop="WorkNumber">
        <el-input v-model="entity.WorkNumber" placeholder="工号"></el-input>
      </el-form-item>
      <el-form-item label="入职时间" prop="EntryDate">
        <el-date-picker
          v-model="entity.EntryDate"
          value-format="YYYY-MM-DD"
          type="date"
          placeholder="入职时间"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item label="员工类型" prop="EmployeeType">
        <el-select v-model="entity.EmployeeType" placeholder="员工类型">
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
        <el-select v-model="entity.EmployeeStatus" placeholder="员工状态">
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
        <el-input v-model="entity.Remark" placeholder="备注"></el-input>
      </el-form-item>
    </el-form>
    <div class="footer">
      <el-button type="primary" @click="submit">提交</el-button>
      <el-button type="warning" @click="drawerVisiable = false">取消</el-button>
    </div>
  </el-drawer>
  <!-- 字段抽屉 -->
  <el-drawer
    v-model="settingDrawerVisiable"
    :modal="false"
    :show-close="false"
    direction="rtl"
    size="380px"
    class="ofa-drawer"
  >
    <template #header>
      <span class="title">自定义表头</span>
    </template>
    <div class="field-pannel">
      <div class="title">
        已选择字段<el-text type="info" class="ofa-ml4"
          >可拖拽标签调整顺序</el-text
        >
      </div>
      <Draggable
        v-model="checkedFields"
        :animation="100"
        item-key="Id"
        class="field-checked-box"
      >
        <template #item="{ element }">
          <el-tag
            closable
            :key="element.Id"
            @close="removeCheckedSettingField(element)"
            @click.prevent
            effect="dark"
            class="field-checked-tag"
            >{{ element.Text }}</el-tag
          >
        </template>
      </Draggable>
      <div class="title">档案字段</div>
      <div v-for="item in fieldSettings" :key="item.Id" class="setting-box">
        <div class="group-title">
          <label>{{ item.Text }}</label>
          <font-awesome-icon
            fas
            :icon="item.Collapsed ? 'caret-up' : 'caret-down'"
            style="cursor: pointer"
            @click="item.Collapsed = !item.Collapsed"
          ></font-awesome-icon>
        </div>
        <el-collapse-transition>
          <div v-show="!item.Collapsed" class="checkbox-box">
            <el-checkbox
              v-for="field in item.Fields"
              :key="field.Id"
              v-model="field.Checked"
              :label="field.Text"
              :disabled="field.Disabled"
              @change="checkSettingField(field)"
            ></el-checkbox>
          </div>
        </el-collapse-transition>
      </div>
    </div>
    <div class="footer">
      <el-button type="primary" @click="updateTableColumnSetting">
        <font-awesome-icon fas icon="save"></font-awesome-icon>&nbsp;保存
      </el-button>
      <el-button type="warning" @click="settingDrawerVisiable = false">
        取消
      </el-button>
    </div>
  </el-drawer>
  <!-- 导出人员档案弹窗 -->
  <el-dialog
    custom-class="ofa-dialog"
    title="导出人员资料"
    v-model="exportExcelDialogVisiable"
    width="800"
  >
    <el-alert
      :closable="false"
      title="请选择要导出的人员信息字段，如不选择将会按照默认信息导出"
      type="warning"
    >
    </el-alert>
    <el-form
      :model="exportParameter"
      label-width="120px"
      class="export-form"
      style="margin-top: 10px"
    >
      <el-form-item label="员工类型" prop="EmployeeType">
        <el-select
          v-model="exportParameter.EmployeeType"
          placeholder="员工类型"
          style="width: 600px"
        >
          <el-option value="" label="全部"></el-option>
          <el-option
            v-for="item in PERSON_EMPLOYEE_TYPE"
            :key="item.value"
            :label="item.label"
            :value="item.label"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="员工状态" prop="EmployeeStatus">
        <el-select
          v-model="exportParameter.EmployeeStatus"
          placeholder="员工状态"
          style="width: 600px"
        >
          <el-option value="" label="全部"></el-option>
          <el-option
            v-for="item in PERSON_EMPLOYEE_STATUS"
            :key="item.value"
            :label="item.label"
            :value="item.label"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="在职状态" prop="OnJobStatus">
        <el-select v-model="exportParameter.OnJobStatus" style="width: 600px">
          <el-option :value="-1" label="全部"></el-option>
          <el-option :value="0" label="在职"></el-option>
          <el-option :value="1" label="离职"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="入职时间" prop="EntryDate">
        <el-date-picker
          v-model="exportParameter.StartEntryDate"
          value-format="YYYY-MM-DD"
          type="date"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 285px"
        >
        </el-date-picker>
        <label class="ofa-ml10 ofa-mr10">~</label>
        <el-date-picker
          v-model="exportParameter.EndEntryDate"
          value-format="YYYY-MM-DD"
          type="date"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 285px"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item label="职级" prop="Job">
        <el-select
          multiple
          filterable
          v-model="exportParameter.Jobs"
          style="width: 600px"
        >
          <el-option
            v-for="item in jobs"
            :key="item.Id"
            :value="item.Name"
            :label="item.Name"
            placeholder="岗位职级"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="导出字段" prop="Job">
        <div v-for="item in fieldSettings" :key="item.Id" class="field-box">
          <div class="field-check-box">
            <el-checkbox
              v-for="field in item.Fields"
              :key="field.Id"
              :label="field.Text"
              @change="checkExportExcelField(field)"
            ></el-checkbox>
          </div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="exportExcelDialogVisiable = false">取消</el-button>
      <el-button type="primary" @click="exportExcel">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import { dayjs, ElMessageBox, FormRules, FormInstance } from 'element-plus'
import Draggable from 'vuedraggable'
import API from '@/apis/oa-api'
import { useBrowserStore } from '@/stores/browserStore'
import { PERSON_EMPLOYEE_TYPE, PERSON_EMPLOYEE_STATUS } from '@/consts/oa-const'
import { IOAJob } from '@/interfaces/oa/IOAJob'
import { IOAPerson } from '@/interfaces/oa/IOAPerson'
import { IOAPersonStatistic } from '@/interfaces/oa/IOAPersonStatistic'
import { IOATableColumnSetting } from '@/interfaces/oa/IOATableColumnSetting'
import {
  IOAPersonSetting,
  IOAPersonSettingField
} from '@/interfaces/oa/IOAPersonSetting'
import { PERSON_SETTING, PERSON_DETAIL } from '@/routers/oa-router'

// 档案字段设置
interface ICheckedFieldSetting extends IOAPersonSetting {
  Collapsed: boolean
  Fields: ICheckedFieldSettingItem[]
}

// 档案字段设置字段
interface ICheckedFieldSettingItem extends IOAPersonSettingField {
  Checked: boolean
  Disabled: boolean
  Tooltips: string
}

const browserStore = useBrowserStore()
const loading = ref(false) // 加载中
const drawerVisiable = ref(false)
const exportExcelDialogVisiable = ref(false) // 显示导出弹窗
const settingDrawerVisiable = ref(false) // 显示字段设置抽屉
const domain = ref(API.getHost())
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
// 搜索条件
const searchOption = ref({
  key: '',
  onJobStatus: -1
})
// 导出的请求参数
const exportParameter = ref({
  OnJobStatus: -1,
  EmployeeStatus: '',
  EmployeeType: '',
  Fields: [''],
  StartEntryDate: '',
  EndEntryDate: '',
  Jobs: []
})
// 用户列表
const list = ref<IOAPerson[]>([])
// 实体
const entity = ref<IOAPerson>(Object.assign({ Name: '' }))
// 表头设置实体
const tableColumnEntity = ref<IOATableColumnSetting>()
// 人员统计
const statisticEntity = ref<IOAPersonStatistic>()
// 选中显示的字段
const checkedFields = ref<ICheckedFieldSettingItem[]>([])
// 导出选中字段
const exportCheckedFields = ref<ICheckedFieldSettingItem[]>([])
// 职级列表
const jobs = ref<IOAJob[]>([])
// 档案字段设置
const fieldSettings = ref<ICheckedFieldSetting[]>([])
// 表单
const personFormRef = ref<FormInstance>()
// 表单验证
const validationRule = reactive<FormRules<any>>({
  Name: [
    { required: true, message: '请先填写员工姓名' },
    { min: 2, max: 20, message: '员工姓名长度在2~20之间' }
  ],
  Job: [
    { required: true, message: '请先填写岗位职级' },
    { min: 2, max: 20, message: '岗位职级长度在2~20之间' }
  ],
  MobilePhone: [{ min: 11, max: 20, message: '手机号码长度错误' }]
})

onMounted(() => {
  getStatistic()
  getJobs()
  getTableColumnSetting()
  // 解决表格拖拽弹出新网页问题
  document.body.ondrop = event => {
    event.preventDefault()
    event.stopPropagation()
  }
})

// 获取人员统计
function getStatistic() {
  API.getPersonStatistic().then(res => {
    statisticEntity.value = res
  })
}

// 获取职级列表
function getJobs() {
  API.getJobs().then(res => {
    jobs.value = res
  })
}

// 获取缓存的表头字段
function getTableColumnSetting() {
  API.getTableColumnSetting(0).then(res => {
    tableColumnEntity.value = res
    getFieldSettings(res)
  })
}

// 获取档案设计字段列表
function getFieldSettings(columnSetting: IOATableColumnSetting) {
  const defaults = [
    'Name',
    'Job',
    'MobilePhone',
    'Email',
    'EmployeeStatus',
    'EntryDate'
  ]
  API.getFieldSettings().then(res => {
    res.forEach(e => {
      const item: ICheckedFieldSetting = Object.assign({}, e, {
        Collapsed: false,
        Fields: []
      })
      if (e.IsGrouped || e.Fields.findIndex(w => w.Type !== 7) < 0) return
      e.Fields.forEach(e2 => {
        const item2: ICheckedFieldSettingItem = Object.assign({}, e2, {
          Tooltips: e2.Text,
          Disabled: false,
          Checked: false
        })
        const isDefault = defaults.indexOf(item2.Name) > -1
        if (e2.Type === 7) return
        const checkIndex = columnSetting.VisiableFields.findIndex(
          w => w === e2.Name
        )
        if (checkIndex > -1 || isDefault) {
          item2.Checked = true
          checkedFields.value.push(item2) // 添加默认显示列
        }
        item.Fields.push(item2)
      })
      fieldSettings.value.push(item)
    })
    get()
  })
}

// 获取分页列表
function get() {
  loading.value = true
  API.getPagePerson(
    pageIndex.value,
    pageSize.value,
    searchOption.value.key,
    searchOption.value.onJobStatus
  ).then(res => {
    total.value = res.Total
    list.value = res.Items
    loading.value = false
  })
}

// 获取简略名字
function getSubName(str: string) {
  return str && str.length > 0 ? str.substring(0, 1) : 'User'
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
function showDrawer() {
  entity.value = Object.assign({
    Sex: true,
    EntryDate: dayjs().format('YYYY-MM-DD'),
    EmployeeType: PERSON_EMPLOYEE_TYPE[0].label,
    EmployeeStatus: PERSON_EMPLOYEE_STATUS[0].label
  })
  drawerVisiable.value = true
}

// 提交
function submit() {
  personFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      API.addPerson(entity.value).then(res => {
        if (res.Status) get()
      })
    }
  })
}

// 删除账号
function del(item: IOAPerson) {
  ElMessageBox.confirm(
    '确认要删除选中人员档案？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delPerson(item.Id).then(res => {
      if (res.Status) get()
    })
  })
}

// 选中表头字段
function checkSettingField(item: ICheckedFieldSettingItem) {
  if (item.Checked) {
    checkedFields.value.push(item)
  } else {
    removeCheckedSettingField(item)
  }
}

// 移除选中表头字段
function removeCheckedSettingField(item: ICheckedFieldSettingItem) {
  const index = checkedFields.value.findIndex(w => w.Id === item.Id)
  if (index > -1) {
    checkedFields.value.splice(index, 1)
  }
}

// 保存表头设置
function updateTableColumnSetting() {
  const fields = checkedFields.value.map(x => x.Name)
  API.updateTableColumnSetting(
    Object.assign({}, tableColumnEntity.value, { VisiableFields: fields })
  )
}

// 选中导出字段
function checkExportExcelField(item: ICheckedFieldSettingItem) {
  const index = exportCheckedFields.value.findIndex(w => w.Id === item.Id)
  const checked = index > -1
  if (checked) {
    exportCheckedFields.value.splice(index, 1)
  } else {
    exportCheckedFields.value.push(item)
  }
}

// 导出excel
function exportExcel() {
  exportParameter.value.Fields = exportCheckedFields.value.map(x => x.Name)
  API.exportPersonExcel(exportParameter.value).then(res => {
    const blob = new Blob([res], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8'
    })
    const downloadElement = document.createElement('a')
    const href = window.URL.createObjectURL(blob) // 创建下载的链接
    downloadElement.href = href
    downloadElement.download = '人员档案资料.xlsx' // 下载后文件名
    document.body.appendChild(downloadElement)
    downloadElement.click() // 点击下载
    document.body.removeChild(downloadElement) // 下载完成移除元素
    window.URL.revokeObjectURL(href) // 释放掉blob对象
  })
}

// 跳转人员档案设置页
function toPersonSettingPage() {
  browserStore.navigate(PERSON_SETTING)
}

// 跳转人员详情页
function toPersonDetailPage(item: IOAPerson) {
  browserStore.navigate(PERSON_DETAIL, item)
}
</script>

<style lang="scss" scoped>
.person-page {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 20px;
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  padding: 20px;

  .count-box {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-right: 10px;

    .count-item {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      height: 60px;
    }

    .r-label {
      margin-left: 20px;
      min-width: 60px;

      h1 {
        margin: 0;
        font-size: 28px;
        color: #333;
      }

      label {
        color: #666;
      }
    }

    .icon {
      padding: 10px;
      font-size: 32px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      color: #fff;
      &-primary {
        background-color: #409eff;
      }
      &-warning {
        background-color: #e6a23c;
      }
      &-success {
        background-color: #67c23a;
      }
      &-danger {
        background-color: #f56c6c;
      }
    }
  }
}

.content {
  background: #fff;
}

.w-p {
  display: flex;
  flex-wrap: nowrap;
  justify-content: right;
  align-items: center;
  margin-bottom: 10px;
  padding: 0 20px;
}

.w-p-2 {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  .search-input {
    width: 200px;
    margin-right: 0.75rem;
  }

  .type-select {
    width: 100px;
    margin-right: 0.75rem;
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

.field-checked-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 10px;

  .field-checked-tag {
    margin: 10px 10px 0 0;
  }
}

.field-pannel {
  padding: 0 10px;
  overflow-y: auto;
  .title {
    padding: 14px 0;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .field-box {
    margin-bottom: 20px;
  }

  .group-title {
    padding: 10px 20px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 20px;
    font-weight: 600;
    background-color: #ecf5ff;
    color: #303133;
  }

  .checkbox-box {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-start;
    padding: 6px 20px;

    .el-checkbox {
      width: 100px;
      margin-bottom: 10px;
    }
  }
}

.export-form {
  .field-check-box {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    padding: 0 6px;
  }

  .el-checkbox {
    width: 100px;
  }
}
</style>
