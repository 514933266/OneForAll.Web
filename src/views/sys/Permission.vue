<template>
  <el-container class="perm-page">
    <el-header class="header">
      <span>
        <el-input
          enterable
          v-model="searchOption.key"
          placeholder="权限名称 / 代码"
          style="width: 260px"
        >
          <template #prefix>
            <font-awesome-icon fas icon="user-check"></font-awesome-icon>
          </template>
        </el-input>
        <el-cascader
          clearable
          v-model="treePath"
          :props="{
            children: 'Children',
            value: 'Id',
            label: 'Name',
            checkStrictly: true
          }"
          :show-all-levels="false"
          :options="menus"
          class="ofa-ml10"
          placeholder="请选择所属菜单"
        ></el-cascader>
        <el-button @click="search" type="primary" class="ofa-ml10"
          ><font-awesome-icon fas icon="search"></font-awesome-icon
          >&nbsp;查询</el-button
        >
      </span>
      <span>
        <el-button v-if="permission.Add" @click="showDrawer()" type="primary">
          <font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增权限
        </el-button>
      </span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          权限列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="Name" label="名称"></el-table-column>
        <el-table-column prop="Code" label="代码">
          <template #default="scope">
            <el-tag>{{ scope.row.Code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="MenuName" label="所属菜单"></el-table-column>
        <el-table-column prop="SortCode" label="排序代码"></el-table-column>
        <el-table-column
          show-overflow-tooltips
          prop="Remark"
          label="备注"
          width="200"
        ></el-table-column>
        <el-table-column
          label="操作"
          width="200"
          align="center"
          header-align="center"
        >
          <template #default="scope">
            <el-button
              link
              v-if="permission.Update"
              type="primary"
              @click="showDrawer(scope.row)"
              >修改</el-button
            >
            <el-button
              link
              v-if="permission.Delete"
              type="danger"
              @click="del(scope.row)"
              >删除</el-button
            >
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
    </el-main>
  </el-container>
  <!-- 表单 -->
  <el-drawer
    v-model="drawerVisiable"
    :modal="false"
    :show-close="false"
    direction="rtl"
    size="460"
    class="ofa-drawer"
  >
    <template #header>
      <span class="title">{{ isAdd ? '新增' : '编辑' }}权限</span>
    </template>
    <el-form
      status-icon
      ref="permForm"
      :rules="validationRule"
      :model="entity"
      label-width="120px"
    >
      <el-form-item label="所属菜单" prop="MenuId" class="menu-item">
        <el-cascader
          v-model="treePath2"
          :props="{
            children: 'Children',
            value: 'Id',
            label: 'Name',
            checkStrictly: true
          }"
          :show-all-levels="false"
          :options="menus"
          placeholder="请选择所属菜单"
        ></el-cascader>
      </el-form-item>
      <el-form-item label="名称" prop="Name">
        <el-input
          v-model.trim="entity.Name"
          placeholder="请输入权限名称"
        ></el-input>
      </el-form-item>
      <el-form-item label="代码" prop="Code">
        <el-input
          v-model.trim="entity.Code"
          placeholder="请输入权限代码"
        ></el-input>
      </el-form-item>
      <el-form-item label="排序" prop="SortCode">
        <el-input
          v-model.trim="entity.SortCode"
          placeholder="请输入排序代码"
        ></el-input>
      </el-form-item>
      <el-form-item label="备注" prop="Remark" class="remark-item">
        <el-input
          show-word-limit
          v-model="entity.Remark"
          type="textarea"
          maxlength="100"
          class="remark-textarea"
          placeholder="请输入权限备注"
        >
        </el-input>
      </el-form-item>
    </el-form>
    <div class="footer">
      <el-button type="primary" @click="submit">提交</el-button>
      <el-button type="warning" @click="drawerVisiable = false">取消</el-button>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, nextTick, onActivated } from 'vue'
import { FormRules, ElMessageBox, FormInstance } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { PERMISSION } from '@/routers/sys-router'
import { ISysPermission } from '@/interfaces/sys/ISysPermission'
import { ISysMenuTree } from '@/interfaces/sys/ISysMenuTree'
import { GUID } from '@/consts/const'
import API from '@/apis/sys-api'

const userStore = useUserStore()
const loading = ref(false) // 加载中
const drawerVisiable = ref(false)
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const isAdd = ref(true) // 添加模式
const list = ref<ISysPermission[]>([]) // 用户列表
const menus = ref<ISysMenuTree[]>([]) // 菜单列表
const entity = ref<ISysPermission>(
  Object.assign({ Name: '', UserName: '', Status: 1 })
) // 实体
const treePath = ref<string[]>([]) // 选中的父级菜单路径
const treePath2 = ref<string[]>([]) // 选中的父级菜单路径
const permForm = ref<FormInstance>() // 表单
const searchOption = ref({
  key: '',
  menuId: GUID
}) // 搜索条件
const validationRule = reactive<FormRules<any>>({
  Name: [
    { required: true, message: '请先填写权限名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2~20之间', trigger: 'blur' }
  ],
  Code: [
    { required: true, message: '请先填写权限代码', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在2~50之间', trigger: 'blur' }
  ],
  MenuId: [{ required: true, message: '请先选择所属菜单', trigger: 'blur' }]
}) // 表单验证

const permission = computed(() => {
  return userStore.getPermissions(PERMISSION.Url) // 权限列表
})

// 监控选择上级菜单
watch(
  () => treePath.value,
  newValue => {
    if (newValue) {
      const val = newValue[newValue.length - 1]
      if (searchOption.value.menuId !== val)
        searchOption.value.menuId = newValue[newValue.length - 1] ?? GUID
    } else {
      searchOption.value.menuId = GUID
    }
  }
)

// 监控选择上级菜单
watch(
  () => treePath2.value,
  newValue => {
    if (newValue) {
      const val = newValue[newValue.length - 1]
      if (entity.value.MenuId !== val)
        entity.value.MenuId = newValue[newValue.length - 1] ?? GUID
    } else {
      entity.value.MenuId = GUID
    }
  }
)

onActivated(() => {
  if (history.state.params?.Id) {
    searchOption.value.menuId = history.state.params?.Id
    treePath.value = getTreePath(history.state.params?.Id)
  }
  get()
  getMenus()
})

// 获取列表
function get() {
  loading.value = true
  API.getPermissions(
    pageIndex.value,
    pageSize.value,
    searchOption.value.menuId,
    searchOption.value.key
  ).then(res => {
    total.value = res.Total
    list.value = res.Items
    loading.value = false
  })
}

// 获取菜单列表
function getMenus() {
  API.getTreeMenus(false).then(res => {
    menus.value = res
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
function showDrawer(item?: ISysPermission) {
  if (item) {
    isAdd.value = false
    entity.value = item
    treePath2.value = getTreePath(item.MenuId)
  } else {
    isAdd.value = true
    entity.value = Object.assign({})
    nextTick(() => {
      permForm.value?.resetFields()
    })
  }
  drawerVisiable.value = true
}

// 获取父级路径
function getTreePath(id: string) {
  let result = [id]
  const option = findMenu(id, menus.value)
  if (option && option.ParentId !== GUID) {
    result = getTreePath(option.ParentId).concat(result)
  }
  return result
}

// 查找指定id菜单
function findMenu(
  id: string,
  sources: ISysMenuTree[]
): ISysMenuTree | undefined {
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

// 提交
function submit() {
  permForm.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAdd.value) {
        API.addPermission(entity.value).then(res => {
          if (res.Status) get()
        })
      } else {
        API.updatePermission(entity.value)
      }
    }
  })
}

// 删除
function del(item: ISysPermission) {
  ElMessageBox.confirm(
    '确认要删除选中权限？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delPermission(item.Id).then(res => {
      if (res.Status) {
        get()
      }
    })
  })
}
</script>

<style lang="scss" scoped>
.perm-page {
  background: #fff;
  border-radius: 20px;
  padding: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
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
