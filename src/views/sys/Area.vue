<template>
  <el-container class="website-page">
    <el-header class="header">
      <span>
        <el-input enterable v-model="searchOption.key" placeholder="地区名称 / 域名" style="width: 260px">
          <template #prefix>
            <font-awesome-icon fas icon="globe"></font-awesome-icon>
          </template>
        </el-input>
        <el-cascader clearable v-model="treePath2" :options="treeNodes" placeholder="上级地区" :props="{
          children: 'Children',
          value: 'Id',
          label: 'Name',
          checkStrictly: true,
          lazy: true,
          lazyLoad: getChildren
        }" class="ofa-ml10">
          <template #default="{ data }">
            <label>{{ data.Name }}</label>
            <label v-if="data.ShortName">（{{ data.ShortName }}）</label>
          </template>
        </el-cascader>
        <el-button @click="search" type="primary" class="ofa-ml10"><font-awesome-icon fas
            icon="search"></font-awesome-icon>&nbsp;查询</el-button>
      </span>
      <span>
        <el-button v-if="permission.Add" @click="showDrawer()" type="primary">
          <font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增地区
        </el-button>
      </span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          地区列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="Name" label="名称"></el-table-column>
        <el-table-column prop="ShortName" label="简称">
          <template #default="scope">
            <el-tag v-if="scope.row.ShortName">{{
              scope.row.ShortName
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="Code" label="代码"></el-table-column>
        <el-table-column label="等级">
          <template #default="scope">{{
            getLevelTypeStr(scope.row.Level)
          }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" header-align="center">
          <template #default="scope">
            <el-button link v-if="permission.Update" type="primary" @click="showDrawer(scope.row)">修改</el-button>
            <el-button link v-if="permission.Delete" type="danger" @click="del(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination background layout="total, sizes, prev, pager, next, jumper" v-model:current-page="pageIndex"
        :page-sizes="[10, 20, 50, 100]" v-model:page-size="pageSize" :total="total" @size-change="pageSizeChange"
        @current-change="pageIndexChange">
      </el-pagination>
    </el-main>
  </el-container>
  <!-- 表单 -->
  <el-drawer v-model="drawerVisiable" :modal="false" :show-close="false" direction="rtl" size="460" class="ofa-drawer">
    <template #header>
      <span class="title">{{ isAdd ? '新增' : '编辑' }}地区</span>
    </template>
    <el-form status-icon ref="areaForm" :rules="validationRule" :model="entity" class="form" label-width="120px">
      <el-alert title="操作提示" type="warning" style="margin-bottom: 20px" :closable="false"
        description="代码规则为上级代码叠加2位数字，如0101"></el-alert>
      <el-form-item label="上级地区" prop="ParentId" v-if="isAdd">
        <el-cascader clearable v-model="treePath" :options="rootTree" placeholder="请选择上级地区" :props="{
          children: 'Children',
          value: 'Id',
          label: 'Name',
          checkStrictly: true,
          lazy: true,
          lazyLoad: getChildren
        }">
          <template #default="{ data }">
            <label>{{ data.Name }}</label>
            <label v-if="data.ShortName">（{{ data.ShortName }}）</label>
          </template>
        </el-cascader>
      </el-form-item>
      <el-form-item label="名称" prop="Name">
        <el-input v-model.trim="entity.Name" placeholder="请输入地区名称"></el-input>
      </el-form-item>
      <el-form-item label="代码" prop="Code">
        <el-input v-model.trim="entity.Code" placeholder="请输入地区代码"></el-input>
      </el-form-item>
      <el-form-item label="简称" prop="ShortName">
        <el-input v-model.trim="entity.ShortName" placeholder="请输入行政地区的简称，如：粤"></el-input>
      </el-form-item>
    </el-form>
    <div class="footer">
      <el-button type="primary" @click="submit">提交</el-button>
      <el-button type="warning" @click="drawerVisiable = false">取消</el-button>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted, nextTick } from 'vue'
import { FormRules, ElMessageBox, FormInstance } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { AREA } from '@/routers/sys-router'
import { ISysArea } from '@/interfaces/sys/ISysArea'
import { AREA_LEVEL_TYPE } from '@/consts/sys-const'
import API from '@/apis/sys-api'

interface ISysAreaTree extends ISysArea {
  Children: ISysAreaTree[]
}

const userStore = useUserStore()
const loading = ref(false) // 加载中
const drawerVisiable = ref(false)
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const searchOption = ref({
  key: '',
  parentId: 0
}) // 搜索条件
const isAdd = ref(true) // 添加模式
const list = ref<ISysArea[]>([]) // 用户列表
const entity = ref<ISysArea>(Object.assign({ Name: '' })) // 实体
const treeNodes = ref<ISysAreaTree[]>([]) // 选中的父级菜单路径
const treePath = ref<string[]>([]) // 选中的父级菜单路径
const treePath2 = ref<string[]>([]) // 选中的父级菜单路径
const areaForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
  Name: [
    { required: true, message: '请先填写地区名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2~20之间', trigger: 'blur' }
  ],
  Code: [
    { required: true, message: '请先填写地区代码', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在2~20之间', trigger: 'blur' }
  ],
  ParentId: [{ required: true, message: '请先选择上级', trigger: 'blur' }]
}) // 表单验证

const permission = computed(() => {
  return userStore.getPermissions(AREA.Url) // 权限列表
})

// 含有根节点的菜单树
const rootTree = computed(() => {
  return [{ Id: 0, Name: '根节点' }].concat(treeNodes.value)
})

// 监控选择上级菜单
watch(
  () => treePath.value,
  newValue => {
    if (newValue) {
      const val = parseInt(newValue[newValue.length - 1])
      if (entity.value.ParentId !== val) entity.value.ParentId = val
    } else {
      entity.value.ParentId = 0
    }
  }
)

// 监控选择上级菜单
watch(
  () => treePath2.value,
  newValue => {
    if (newValue) {
      const val = parseInt(newValue[newValue.length - 1])
      if (searchOption.value.parentId !== val) searchOption.value.parentId = val
    } else {
      searchOption.value.parentId = -1
    }
  }
)

onMounted(() => {
  get()
  getProvinces()
})

// 获取列表
function get() {
  loading.value = true
  API.getAreas(
    pageIndex.value,
    pageSize.value,
    searchOption.value.key,
    searchOption.value.parentId
  ).then(res => {
    total.value = res.Total
    list.value = res.Items
    loading.value = false
  })
}

// 获取省份列表
function getProvinces() {
  API.getAreaProvinces().then(res => {
    treeNodes.value = res.map(x => {
      return { ...x, Children: [] }
    })
  })
}

// 获取下级
function getChildren(node: any, resolve: any) {
  if (!node.data.Id) return []
  API.getAreaChildren(node.data.Id).then(res => {
    resolve(res)
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

// 获取登记类型字符串
function getLevelTypeStr(type: number) {
  return AREA_LEVEL_TYPE.find(w => w.value == type)?.label ?? '未知'
}

// 显示添加抽屉
function showDrawer(item?: ISysArea) {
  if (item) {
    isAdd.value = false
    entity.value = item
  } else {
    isAdd.value = true
    entity.value = Object.assign({})
    nextTick(() => {
      areaForm.value?.resetFields()
    })
  }
  drawerVisiable.value = true
}

// 提交
function submit() {
  areaForm.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAdd.value) {
        API.addArea(entity.value).then(res => {
          if (res.Status) get()
        })
      } else {
        API.updateArea(entity.value)
      }
    }
  })
}

// 删除
function del(item: ISysArea) {
  ElMessageBox.confirm(
    '确认要删除选中地区？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delArea(item.Id).then(res => {
      if (res.Status) {
        get()
      }
    })
  })
}
</script>

<style lang="scss" scoped>
.website-page {
  background: #fff;
  border-radius: 20px;
  padding: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    height: auto;

    .search-box {
      display: flex;
      align-items: center;
      padding: 6px 4px;
    }

    .button-box {
      display: flex;
      align-items: flex-start;
    }
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
