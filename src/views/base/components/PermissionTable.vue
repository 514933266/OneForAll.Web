<template>
  <el-table
    border
    v-loading="loading"
    :data="list"
    :tree-props="{ children: 'Children' }"
    :indent="0"
    ref="permTable"
    row-key="Id"
  >
    <el-table-column width="60" align="center"></el-table-column>
    <el-table-column prop="Checked" width="60" align="center">
      <template #header>
        <el-checkbox
          v-model="checkedAll"
          @change="selectAllRow($event)"
        ></el-checkbox>
      </template>
      <template #default="scope">
        <el-checkbox
          v-model="scope.row.Checked"
          @change="selectRow($event, scope.row)"
        ></el-checkbox>
      </template>
    </el-table-column>
    <el-table-column label="名称" prop="Name" width="300">
      <template #default="scope">
        <el-tooltip
          class="item"
          effect="dark"
          :content="scope.row.Remark ? scope.row.Remark : '无'"
          placement="top"
        >
          <label>{{ scope.row.Name }}</label>
        </el-tooltip>
      </template>
    </el-table-column>
    <el-table-column label="功能权限" prop="Permissions">
      <template #default="scope">
        <el-checkbox
          v-for="item in scope.row.Permissions"
          :key="item.Id"
          v-model="item.Checked"
          @change="changeCheckPerm($event, item, scope.row)"
          class="perm-checkbox"
        >
          {{ item.Name }}
        </el-checkbox>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { ref, defineModel, nextTick, watch } from 'vue'
import API from '@/apis/base-api'
import { ISysTenantMenuTree } from '@/interfaces/base/ISysTenantMenuTree'
import { ISysMenuPermission } from '@/interfaces/base/ISysMenuPermission'
import { GUID } from '@/consts/const'

interface ISysTenantMenuTreeModel extends ISysTenantMenuTree {
  Checked: boolean
  Children: ISysTenantMenuTreeModel[]
  Permissions: ISysMenuPermissionModel[]
}

interface ISysMenuPermissionModel extends ISysMenuPermission {
  Checked: boolean
}

const model = defineModel<string[]>()
const checkedAll = ref(false) // 全选
const loading = ref(false) // 加载中
const permTable = ref() // 表格
const list = ref<ISysTenantMenuTreeModel[]>([]) // 数据源
const checkedRows: string[] = [] // 选中菜单id

watch(
  () => model.value,
  () => {
    get()
  }
)

// 获取列表
function get() {
  loading.value = true
  API.getTenantMenuTree().then(res => {
    list.value = initTree(res)
    nextTick(() => {
      loading.value = false
    })
  })
}

// 初始化选中
function initTree(rows: ISysTenantMenuTree[]): ISysTenantMenuTreeModel[] {
  const models: ISysTenantMenuTreeModel[] = []
  rows.forEach(row => {
    let children: ISysTenantMenuTreeModel[] = []
    const permissions: ISysMenuPermissionModel[] = []
    if (row.Children) {
      children = initTree(row.Children)
    }
    let rowChecked = false
    if (row.Permissions) {
      row.Permissions.forEach(item => {
        let checked = false
        const index = model.value?.findIndex(w => w === item.Id) || -1
        if (index > -1) {
          checked = true
          rowChecked = true
        }
        permissions.push({ Checked: checked, ...item })
      })
      if (rowChecked) checkedRows.push(row.Id)
    }
    models.push({
      ...row,
      Checked: rowChecked,
      Children: children,
      Permissions: permissions,
    })
  })
  return models
}

// 设置选中行
function setCheckedRow(row: ISysTenantMenuTreeModel) {
  const checked =
    row.Permissions.findIndex(w => model.value?.includes(w.Id)) > -1
  if (row.Checked != checked) {
    row.Checked = checked
    const index = checkedRows.findIndex(w => w === row.Id)
    if (checked && index < 0) {
      checkedRows.push(row.Id)
    } else if (!checked && index > -1) {
      checkedRows.splice(index, 1)
    }
  }
}

// 选中权限
function changeCheckPerm(
  checked: any,
  item: ISysMenuPermissionModel,
  row: ISysTenantMenuTreeModel
) {
  const index = model.value?.findIndex(w => w === item.Id) ?? -1
  if (checked && index < 0) {
    model.value?.push(item.Id)
  } else if (!checked && index > -1) {
    model.value?.splice(index, 1)
  }
  setCheckedRow(row)
  // 选中权限时，检测并自动选中上级菜单EnterView权限
  if (checked) setCheckedRowParent(row.ParentId)
}

// 递归选中上级
function setCheckedRowParent(parentId: string) {
  const item = findMenu(parentId, list.value)
  if (item) {
    const enterView = item.Permissions.find(w => w.Code === 'EnterView')
    if (enterView && !enterView.Checked) {
      // 选中上级EnterView权限
      const index = model.value?.findIndex(w => w === enterView.Id) ?? -1
      if (index < 0) {
        enterView.Checked = true
        model.value?.push(enterView.Id)
        setCheckedRow(item)
      }
    }
    if (item.ParentId !== GUID) setCheckedRowParent(item.ParentId)
  }
}

// 查找指定id菜单
function findMenu(
  id: string,
  sources: ISysTenantMenuTreeModel[]
): ISysTenantMenuTreeModel | undefined {
  for (let i = 0; i < sources.length; i++) {
    const e = sources[i]
    if (e.Id === id) {
      return e
    } else {
      const option = findMenu(id, e.Children)
      if (option) return option
    }
  }
  return undefined
}

// 选中行
function selectRow(checked: any, row: ISysTenantMenuTreeModel) {
  if (row.Checked != checked) row.Checked = checked
  if (checked) {
    // 全选权限
    row.Permissions.forEach(item => {
      const index = model.value?.findIndex(w => w === item.Id) || -1
      if (index < 0) model.value?.push(item.Id)
      item.Checked = true
    })
  } else {
    // 反选权限
    row.Permissions.forEach(item => {
      const index = model.value?.findIndex(w => w === item.Id) || -1
      if (index > -1) model.value?.splice(index, 1)
      item.Checked = false
    })
  }
  row.Children.forEach(item => {
    selectRow(checked, item)
  })
}

// 全选
function selectAllRow(checked: any) {
  list.value.forEach(row => {
    selectRow(checked, row)
  })
}
</script>

<style lang="scss" scoped>
.perm-checkbox {
  width: 120px;
  overflow: hidden;
}
</style>
