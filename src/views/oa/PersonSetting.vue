<template>
  <el-container v-loading="loading" class="person-setting-page">
    <el-header class="header">
      <div class="header-box">
        <label class="title">员工档案字段设置</label>
        <div>
          <el-button @click="showDialog()">新建分组</el-button>
          <el-button @click="sortDialogVisible = true">分组排序</el-button>
        </div>
      </div>
    </el-header>
    <el-main class="content">
      <div class="guide-box">
        <div class="card">
          <div class="icon icon-primary">
            <font-awesome-icon fas icon="folder"></font-awesome-icon>
          </div>
          <div class="text">
            <div class="title">员工档案</div>
            <div>可设置以下哪些字段，员工在「员工档案」中可见和可修改</div>
          </div>
        </div>
        <div class="card">
          <div class="icon icon-warning">
            <font-awesome-icon fas icon="file-alt"></font-awesome-icon>
          </div>
          <div class="text">
            <div class="title">入职登记表</div>
            <div>可设置以下哪些字段，员工在「入职登记表」中可见和可修改</div>
          </div>
        </div>
        <div class="card">
          <div class="icon icon-success">
            <font-awesome-icon fas icon="user"></font-awesome-icon>
          </div>
          <div class="text">
            <div class="title">个人信息展示</div>
            <div>可设置以下哪些字段，员工之间相互可见</div>
          </div>
        </div>
      </div>
      <el-alert
        show-icon
        :closable="false"
        title="温馨提示"
        type="warning"
        description="可根据企业实际情况自定义人员档案字段，字段设置后，员工可在「员工档案」看到"
      >
      </el-alert>
      <div v-for="(item, index) in list" :key="item.Id">
        <el-form status-icon :model="entity" class="form" label-width="80px">
          <div class="table-header">
            <span class="label">{{ item.Text }}</span>
            <el-button
              v-show="item.FieldSorting"
              @click="submitSortField(item)"
              type="primary"
              >完成调整</el-button
            >
            <el-dropdown
              v-show="!item.FieldSorting"
              @command="handleDropdownCommand"
            >
              <el-button link class="btn-setting">设置</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-if="item.IsEditable"
                    :command="{ key: 'edit', entity: item }"
                    >编辑分组</el-dropdown-item
                  >
                  <el-dropdown-item :command="{ key: 'addField', entity: item }"
                    >添加字段</el-dropdown-item
                  >
                  <el-dropdown-item
                    :command="{ key: 'sort', entity: item, index: index }"
                    >调整顺序</el-dropdown-item
                  >
                  <el-dropdown-item
                    v-if="!item.IsDefault"
                    :command="{ key: 'del', entity: item }"
                    ><el-text type="danger">删除分组</el-text></el-dropdown-item
                  >
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <el-alert
            v-show="item.FieldSorting"
            title="请上下拖拽移动字段调整位置"
            type="warning"
            :closable="false"
            class="fieldSorting-alert"
          ></el-alert>
          <el-table
            :data="item.Fields"
            :ref="setSortFieldTableRef"
            row-key="Id"
            class="ofa-table"
          >
            <el-table-column prop="Text" label="字段名称" align="left">
              <template #default="scope">
                <label>{{ scope.row.Text }}</label>
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="scope.row.Tips"
                  placement="top"
                >
                  <font-awesome-icon
                    v-show="scope.row.Tips"
                    fas
                    icon="info-circle"
                    style="margin-left: 2px"
                  >
                  </font-awesome-icon>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column
              prop="Type"
              label="类型"
              align="center"
              width="100"
            >
              <template #default="scope">
                {{ getTypeStr(scope.row.Type) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="IsRequired"
              label="必填"
              align="center"
              width="200"
            >
              <template #default="scope">
                <font-awesome-icon
                  v-show="scope.row.IsRequired"
                  fas
                  icon="check"
                  class="check-icon"
                >
                </font-awesome-icon>
              </template>
            </el-table-column>
            <el-table-column
              prop="IsEmployeeVisiable"
              label="员工在档案可见"
              align="center"
              width="200"
            >
              <template #default="scope">
                <font-awesome-icon
                  v-show="scope.row.IsEmployeeVisiable"
                  fas
                  icon="check"
                  class="check-icon"
                >
                </font-awesome-icon>
                <label v-show="scope.row.IsEnabledEmployeEdit"
                  >&nbsp;允许员工修改</label
                >
              </template>
            </el-table-column>
            <el-table-column
              prop="IsEmployeeVisiable"
              label="员工在入职登记可见"
              align="center"
              width="200"
            >
              <template #default="scope">
                <font-awesome-icon
                  v-show="scope.row.IsEntryFileVisiable"
                  fas
                  icon="check"
                  class="check-icon"
                >
                </font-awesome-icon>
                <label v-show="scope.row.IsEnabledEmployeEdit"
                  >&nbsp;允许员工修改</label
                >
              </template>
            </el-table-column>
            <el-table-column label="操作" align="left" width="200">
              <template #header>
                操作
                <el-tooltip
                  effect="dark"
                  content="部分系统默认设置字段不支持停用和删除"
                  placement="top"
                >
                  <el-button
                    link
                    v-show="
                      item.Fields.findIndex(
                        w => !w.IsShowEnabled || !w.IsDefault
                      ) > -1
                    "
                    type="info"
                    style="margin-left: 5px"
                  >
                    <font-awesome-icon
                      fas
                      icon="info-circle"
                    ></font-awesome-icon>
                  </el-button>
                </el-tooltip>
              </template>
              <template #default="scope">
                <el-button link v-show="item.FieldSorting">
                  <font-awesome-icon fas icon="bars"></font-awesome-icon>
                </el-button>
                <span v-show="!item.FieldSorting">
                  <el-button
                    link
                    @click="showFieldDrawer(item.Id, scope.row)"
                    type="primary"
                    >编辑</el-button
                  >
                  <el-button
                    link
                    v-if="scope.row.IsShowEnabled"
                    @click="enableField(item.Id, scope.row)"
                    type="warning"
                    >{{ scope.row.IsEnabled ? '停用' : '启用' }}
                  </el-button>
                  <el-popconfirm title="删除该字段？">
                    <template #reference>
                      <el-button
                        link
                        v-show="!scope.row.IsDefault"
                        @click="delField(item.Id, scope.row)"
                        type="danger"
                        >删除
                      </el-button>
                    </template>
                  </el-popconfirm>
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-form>
      </div>
    </el-main>
  </el-container>
  <!-- 分组弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    :title="isAdd ? '新建分组' : '编辑分组'"
    width="400"
    custom-class="ofa-dialog"
  >
    <el-form
      :model="entity"
      :rules="validationRule"
      label-position="top"
      label-width="120px"
      class="form"
      ref="settingFormRef"
    >
      <el-form-item prop="Text">
        <el-input
          v-model.trim="entity.Text"
          placeholder="请输入分组名称"
        ></el-input>
      </el-form-item>
      <el-form-item v-show="entity.IsShowGrouped" prop="IsGrouped">
        <el-checkbox v-model="entity.IsGrouped">支持分组添加</el-checkbox>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确 定</el-button>
      </span>
    </template>
  </el-dialog>
  <!-- 分组排序弹窗 -->
  <el-dialog
    v-model="sortDialogVisible"
    @opened="initSortTableRowDrop"
    class="ofa-dialog"
    width="400"
  >
    <template #header>
      <label class="ofa-ml10">分组排序</label>
      <el-text>&nbsp;拖动调整位置</el-text>
    </template>
    <el-table
      :data="list"
      :show-header="false"
      ref="sortTable"
      row-key="Id"
      class="sort-table"
      row-class-name="sort-table-row"
      cell-class-name="sort-table-cell"
    >
      <el-table-column prop="Text" label="名称" align="left">
        <template #default="scope">
          <div
            :class="[
              'sort-row-label',
              scope.row.IsSortable ? 'allowDrop' : 'disabled'
            ]"
          >
            <span>{{ scope.row.Text }}</span>
            <el-text
              v-show="!scope.row.IsSortable"
              class="ofa-ml4 tips"
              type="info"
              >系统默认分组，不支持调整排序</el-text
            >
          </div>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="sortDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitSort">确 定</el-button>
    </template>
  </el-dialog>
  <!-- 字段信息抽屉 -->
  <el-drawer
    v-model="drawerVisiable"
    :modal="false"
    :show-close="false"
    direction="rtl"
    size="480px"
    class="ofa-drawer"
  >
    <template #header>
      <span class="title"
        >{{ isAddField ? '添加[' : '编辑[' + fieldEntity.Text }}]字段</span
      >
    </template>
    <div>
      <el-alert
        v-show="fieldEntity.IsDefault"
        :closable="false"
        type="warning"
        style="margin-bottom: 10px"
      >
        系统默认字段，部分内容不支持修改</el-alert
      >
      <el-form
        :model="fieldEntity"
        label-width="160px"
        class="form"
        ref="fieldFormRef"
      >
        <el-form-item label="字段名称：" prop="Text">
          <el-input
            v-model.trim="fieldEntity.Text"
            :disabled="!fieldEntity.IsEnableText"
            placeholder="输入字段名称"
          >
          </el-input>
        </el-form-item>
        <el-form-item label="类型：" prop="Type">
          <el-select
            v-model.trim="fieldEntity.Type"
            @change="changeFieldType"
            :disabled="!fieldEntity.IsEnableType"
            placeholder="字段类型"
          >
            <el-option
              v-for="fieldType in PERSON_FIELD_TYPE"
              :key="fieldType.value"
              :label="fieldType.label"
              :value="fieldType.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="fieldEntity.Type === 5 || fieldEntity.Type === 6"
          label="选项内容："
          prop="TypeDetails"
        >
          <div>
            <el-button
              link
              v-show="fieldEntity.IsEnableAddTypeDetail"
              @click="addTypeDetail"
              type="primary"
              >新增选项</el-button
            >
          </div>
          <div
            v-for="(typeDetail, i) in fieldEntity.TypeDetails"
            :key="typeDetail.Name"
            class="type-detail-box"
          >
            <el-input
              :disabled="!fieldEntity.IsEnableType"
              v-model.trim="typeDetail.Name"
            ></el-input>
            <div v-show="fieldEntity.IsEnableAddTypeDetail" class="remove-item">
              <el-button link @click="removeTypeDetail(i)" type="danger">
                <font-awesome-icon fas icon="minus"></font-awesome-icon>
              </el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="提示：" prop="Placeholder">
          <el-input
            v-model.trim="fieldEntity.Placeholder"
            placeholder="请输入字段提示，以便员工理解"
          ></el-input>
        </el-form-item>
        <el-form-item label="要求员工必填：" prop="IsRequired">
          <template #label>
            要求员工必填
            <el-tooltip
              class="item"
              effect="dark"
              content="员工在填写入职登记表和编辑个人档案时，是否要求必填该字段"
              placement="top"
            >
              <i
                class="el-icon-warning-outline"
                style="margin-left: 2px"
              ></i> </el-tooltip
            >&nbsp;：
          </template>
          <el-radio-group
            v-model="fieldEntity.IsRequired"
            :disabled="!fieldEntity.IsEnableRequired"
          >
            <el-radio :value="true">必填</el-radio>
            <el-radio :value="false">选填</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="在入职登记中：" prop="IsEntryFileVisiable">
          <template #label>
            在入职登记中
            <el-tooltip
              class="item"
              effect="dark"
              :content="
                fieldEntity.IsEnableEntryFileVisiable
                  ? '在新员工入职的入职登记表中，是否显示该字段'
                  : `默认在入职登记表中${
                      fieldEntity.IsEmployeeVisiable ? '显示' : '隐藏'
                    }，不允许设置`
              "
              placement="top"
            >
              <i
                class="el-icon-warning-outline"
                style="margin-left: 2px"
              ></i> </el-tooltip
            >&nbsp;：
          </template>
          <el-radio-group
            v-model="fieldEntity.IsEntryFileVisiable"
            :disabled="!fieldEntity.IsEnableEntryFileVisiable"
          >
            <el-radio :value="true">显示</el-radio>
            <el-radio :value="false">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="在个人档案中：">
          <template #label>
            在个人档案中
            <el-tooltip
              class="item"
              effect="dark"
              :content="
                fieldEntity.IsEnableEmployeeVisiable
                  ? '在员工查看个人档案时，该字段是否对他可见'
                  : `默认在个人档案中对员工${
                      fieldEntity.IsEmployeeVisiable ? '可见' : '不可见'
                    }，不允许设置`
              "
              placement="top"
            >
              <i
                class="el-icon-warning-outline"
                style="margin-left: 2px"
              ></i> </el-tooltip
            >&nbsp;：
          </template>
          <el-radio-group
            v-model="fieldEntity.IsEmployeeVisiable"
            :disabled="!fieldEntity.IsEnableEmployeeVisiable"
          >
            <el-radio :value="true">对员工可见</el-radio>
            <el-radio :value="false">对员工隐藏</el-radio>
          </el-radio-group>
          <el-radio-group
            v-model="fieldEntity.IsEmployeeEditable"
            :disabled="!fieldEntity.IsEnableEmployeeEditable"
          >
            <el-radio :value="true">员工可修改</el-radio>
            <el-radio :value="false">员工不可修改</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </div>
    <div class="footer">
      <el-button type="primary" @click="submitField">
        <font-awesome-icon fas icon="save"></font-awesome-icon>&nbsp;{{
          isAddField ? '添加' : '保存'
        }}
      </el-button>
      <el-button type="warning" @click="drawerVisiable = false">
        取消
      </el-button>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessageBox, FormRules, FormInstance } from 'element-plus'
import Sortable from 'sortablejs'
import API from '@/apis/oa-api'
import {
  IOAPersonSetting,
  IOAPersonSettingField
} from '@/interfaces/oa/IOAPersonSetting'
import { PERSON_FIELD_TYPE } from '@/consts/oa-const'

// 档案字段设置
interface ISortFieldSetting extends IOAPersonSetting {
  FieldSorting: boolean
}

const loading = ref(false) // 加载中
const isAdd = ref(true) // 添加模式
const isAddField = ref(true) // 添加字段模式
const dialogVisible = ref(false) // 显示分组弹窗
const sortDialogVisible = ref(false) // 显示排序弹窗
const drawerVisiable = ref(false) // 显示抽屉
const list = ref<ISortFieldSetting[]>([]) // 列表
const entity = ref<ISortFieldSetting>(Object.assign({})) // 列表
// 字段实体
const fieldEntity = ref<IOAPersonSettingField>(Object.assign({}))
// 表单
const settingFormRef = ref<FormInstance>()
// 表单验证
const validationRule = reactive<FormRules<any>>({
  Text: [
    { required: true, message: '请先填写分组名称' },
    { min: 2, max: 20, message: '分组名称长度在2~20之间' }
  ]
})
// 表单
const fieldFormRef = ref<FormInstance>()
// 分组排序
const sortTable = ref()
// 分组字段排序
const sortFieldTables = ref<any[]>([])
const setSortFieldTableRef = function (el: any) {
  if (el) {
    sortFieldTables.value.push(el)
  }
}

onMounted(() => {
  get()
  // 解决表格拖拽弹出新网页问题
  document.body.ondrop = event => {
    event.preventDefault()
    event.stopPropagation()
  }
})

// 获取列表
function get() {
  loading.value = true
  API.getFieldSettings().then(res => {
    const data: ISortFieldSetting[] = []
    res.forEach(e => {
      const item: ISortFieldSetting = Object.assign({}, e, {
        FieldSorting: false
      })
      data.push(item)
    })
    list.value = data
    loading.value = false
  })
}

// 分组操作
function handleDropdownCommand(command: any) {
  switch (command.key) {
    case 'addField':
      showFieldDrawer(command.entity.Id)
      break
    case 'sort':
      showSortFieldButton(command.entity, true, command.index)
      break
    case 'edit':
      showDialog(command.entity)
      break
    case 'del':
      del(command.entity)
      break
  }
}

// 显示分组弹窗
function showDialog(item?: ISortFieldSetting) {
  if (item) {
    isAdd.value = false
    entity.value = item
  } else {
    isAdd.value = true
    entity.value = Object.assign({ Text: '', IsShowGrouped: true })
  }
  dialogVisible.value = true
}

// 提交
function submit() {
  settingFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAdd.value) {
        API.addFieldSetting(entity.value).then(res => {
          if (res.Status) get()
        })
      } else {
        API.updateFieldSetting(entity.value)
      }
    }
  })
}

// 删除
function del(item: IOAPersonSetting) {
  ElMessageBox.confirm(
    '确认要删除选中分组？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delFieldSetting(item.Id).then(res => {
      if (res.Status) get()
    })
  })
}

// 获取类型文本
function getTypeStr(type: number) {
  return PERSON_FIELD_TYPE.find(w => w.value === type)?.label ?? ''
}

// 初始化分组排序
function initSortTableRowDrop() {
  const table = sortTable.value.$el.querySelector(
    '.el-table__body-wrapper tbody'
  )
  Sortable.create(table, {
    handle: '.allowDrop', // 允许拖拽的类名
    animation: 180,
    delay: 0,
    onEnd(evt: any) {
      const curRow = list.value.splice(evt.oldIndex, 1)[0]
      list.value.splice(evt.newIndex, 0, curRow)
    }
  })
}

// 提交分组排序
function submitSort() {
  const ids = list.value.map(e => {
    return e.Id
  })
  API.sortFieldSetting(ids).then(res => {
    if (res.Status) {
      sortDialogVisible.value = false
    }
  })
}

// 显示字段抽屉
function showFieldDrawer(settingId: string, item?: IOAPersonSettingField) {
  entity.value.Id = settingId
  if (item) {
    isAddField.value = false
    fieldEntity.value = item
  } else {
    isAddField.value = true
    fieldEntity.value = Object.assign({
      Text: '',
      Placeholder: '',
      TypeDetails: [],
      IsEnableText: true,
      IsEnableType: true,
      IsShowEnabled: true,
      IsEnableRequired: true,
      IsEnableEmployeeEditable: true,
      IsEnableEmployeeVisiable: true,
      IsEnableEntryFileVisiable: true
    })
  }
  drawerVisiable.value = true
}

// 改变字段类型
function changeFieldType(type: number) {
  if (type === 5 || type === 6) {
    fieldEntity.value.IsEnableAddTypeDetail = true
  } else {
    fieldEntity.value.IsEnableAddTypeDetail = false
  }
}

// 添加字段选项内容
function addTypeDetail() {
  ElMessageBox.prompt(
    '请输入要新增的选项内容,多个值可用逗号（,）隔开',
    '新增类型选项',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^[\S]+$/,
      inputErrorMessage: '请输入选项值'
    }
  ).then(({ value }) => {
    const arr = value.split(',')
    let num = fieldEntity.value.TypeDetails.length
    arr.forEach(item => {
      fieldEntity.value.TypeDetails.push({ Name: item, Value: num.toString() })
      num++
    })
  })
}

// 移除字段选项内容
function removeTypeDetail(index: number) {
  fieldEntity.value.TypeDetails.splice(index, 1)
}

// 提交字段排序
function submitField() {
  fieldFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAddField.value) {
        API.addFieldSettingItem(entity.value.Id, fieldEntity.value).then(
          res => {
            if (res.Status) get()
          }
        )
      } else {
        API.updateFieldSettingItem(entity.value.Id, fieldEntity.value)
      }
    }
  })
}

// 删除字段
function delField(settingId: string, item: IOAPersonSettingField) {
  API.delFieldSettingItem(settingId, item.Id).then(res => {
    if (res.Status) {
      get()
    }
  })
}

// 启用停用字段
function enableField(settingId: string, item: IOAPersonSettingField) {
  API.enableFieldSettingItem(settingId, item.Id).then(res => {
    if (res.Status) {
      item.IsEnabled = !item.IsEnabled
    }
  })
}

// 显示字段排序
function showSortFieldButton(
  item: ISortFieldSetting,
  fieldSorting: boolean,
  index: number
) {
  item.FieldSorting = fieldSorting
  initFieldTableRowDrop(item, index)
}

// 初始化字段表格排序功能
function initFieldTableRowDrop(item: ISortFieldSetting, index: number) {
  const table = sortFieldTables.value[index].$el.querySelector(
    '.el-table__body-wrapper tbody'
  )
  Sortable.create(table, {
    animation: 180,
    delay: 0,
    onEnd(evt: any) {
      const curRow = item.Fields.splice(evt.oldIndex, 1)[0]
      item.Fields.splice(evt.newIndex, 0, curRow)
    }
  })
}

// 提交字段排序
function submitSortField(item: ISortFieldSetting) {
  const ids = item.Fields.map(e => {
    return e.Id
  })
  API.sortFieldSettingItem(item.Id, ids).then(res => {
    if (res.Status) {
      sortDialogVisible.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.person-setting-page {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 20px;
  padding: 20px;

  .header {
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .content {
    margin-top: 20px;
    background: #fff;
  }

  .header-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .title {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }
  }

  .content {
    .form {
      margin-top: 40px;
    }

    .btn-setting {
      vertical-align: middle;
    }

    .table-header {
      position: relative;
      font-size: 16px;
      color: #666;
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;

      &:before {
        content: ' ';
        background: #409eff;
        padding: 2px;
        width: 2px;
        height: 17px;
        display: inline-block;
        left: 0;
        position: absolute;
      }

      .label {
        margin-left: 10px;
      }
    }

    :deep(th) {
      background: rgba(192, 196, 204, 0.1);
      color: #666;
    }

    .check-icon {
      color: #909399;
    }

    .guide-box {
      display: flex;
      justify-content: space-around;
      align-items: center;
      margin-bottom: 20px;

      .card {
        padding: 20px;
        display: flex;
        justify-content: flex-start;
      }

      .text {
        margin-left: 10px;
        color: #909399;
      }

      .icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 60px;
        height: 60px;
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

        svg {
          width: 20px;
          height: 20px;
        }
      }

      .title {
        font-size: 1.25rem;
        margin-bottom: 10px;
        color: #333;
      }
    }
  }

  .fieldSorting-alert {
    margin: 10px 0;
  }
}

.sort-table {
  :deep(.el-table__body) {
    border-collapse: separate !important;
    border-spacing: 0 10px !important;
    table-layout: auto !important;
  }

  :deep(.sort-table-row) {
    padding: 0;
  }

  :deep(.sort-table-cell) {
    background-color: #ebeef5;
    border-bottom: transparent;
    border-radius: 4px;
  }

  :deep(.sort-row-label) {
    display: flex;
    justify-content: space-between;

    .tips {
      font-size: 12px;
    }

    &.disabled {
      color: #909399;
    }
  }
}

.type-detail-box {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 6px;

  &:hover {
    .remove-item {
      button {
        display: block;
      }
    }
  }

  .remove-item {
    margin-left: 4px;
    width: 14px;

    button {
      display: none;
    }
  }
}
</style>
