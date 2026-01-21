<template>
  <el-container class="role-page">
    <el-header class="header">
      <span>
        <el-input enterable v-model="searchOption.key" placeholder="角色名称" style="width: 260px" class="ofa-mr10">
          <template #prefix>
            <font-awesome-icon fas icon="user"></font-awesome-icon>
          </template>
        </el-input>
        <el-button @click="search" type="primary" class="search-button"><font-awesome-icon fas
            icon="search"></font-awesome-icon>&nbsp;查询</el-button>
      </span>
      <span>
        <el-button v-if="permission.Add" @click="showDrawer()" type="primary">
          <font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增角色</el-button>
      </span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          角色列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="Name" label="名称"></el-table-column>
        <el-table-column prop="MemberCount" label="成员人数">
          <template #default="scope">{{ scope.row.MemberCount }}&nbsp;（人）</template>
        </el-table-column>
        <el-table-column prop="Remark" label="备注"></el-table-column>
        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="toDetailPage(scope.row)">成员&权限</el-button>
            <el-button v-if="permission.Update" link type="primary" @click="showDrawer(scope.row)">修改
            </el-button>
            <el-button v-if="permission.Delete" link type="danger" @click="del(scope.row)">
              删除</el-button>
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
      <span class="title">{{ isAdd ? '创建' : '编辑' }}角色</span>
    </template>
    <el-form status-icon ref="roleForm" :rules="validationRule" :model="entity" class="form" label-width="80px">
      <el-alert title="操作提示" type="warning" style="margin-bottom: 20px" :closable="false"
        description="创建后对角色分配权限，再将用户加入到该角色中，用户将会拥有对应的操作权限"></el-alert>
      <div class="row">
        <el-form-item label="名称" prop="Name">
          <el-input v-model.trim="entity.Name" placeholder="请输入用户名称"></el-input>
        </el-form-item>
      </div>
      <div class="row">
        <el-form-item label="备注" prop="Remark">
          <el-input show-word-limit v-model="entity.Remark" type="textarea" maxlength="100" size="small"
            placeholder="请输入备注">
          </el-input>
        </el-form-item>
      </div>
    </el-form>
    <div class="footer">
      <el-button type="primary" @click="submit">提交</el-button>
      <el-button type="warning" @click="drawerVisiable = false">取消</el-button>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, reactive, nextTick, onMounted } from 'vue'
import { FormRules, ElMessageBox, FormInstance } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { useBrowserStore } from '@/stores/browserStore'
import { ROLE, ROLE_DETAIL } from '@/routers/base-router'
import { ISysTenantRole } from '@/interfaces/base/ISysTenantRole'
import API from '@/apis/base-api'

const userStore = useUserStore()
const browserStore = useBrowserStore()
const loading = ref(false) // 加载中
const drawerVisiable = ref(false)
const isAdd = ref(true) // 添加模式
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const searchOption = ref({
  key: ''
}) // 搜索条件
const list = ref<ISysTenantRole[]>([]) // 用户列表
const entity = ref<ISysTenantRole>(Object.assign({ Name: '', Remark: '' })) // 实体
const roleForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
  Name: [
    { required: true, message: '请先填写角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2到20个字符', trigger: 'blur' }
  ]
}) // 表单验证

const permission = computed(() => {
  return userStore.getPermissions(ROLE.Url) // 权限列表
})

onMounted(() => {
  get()
})

// 获取分页列表
function get() {
  loading.value = true
  API.getPageRole(pageIndex.value, pageSize.value, searchOption.value.key).then(
    res => {
      total.value = res.Total
      list.value = res.Items
      loading.value = false
    }
  )
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
function showDrawer(item?: ISysTenantRole) {
  if (item) {
    isAdd.value = false
    entity.value = item
  } else {
    entity.value = Object.assign({})
    isAdd.value = true
    nextTick(() => {
      roleForm.value?.resetFields()
    })
  }
  drawerVisiable.value = true
}

// 提交
function submit() {
  roleForm.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAdd.value) {
        API.addRole(entity.value).then(res => {
          if (res.Status) get()
        })
      } else {
        API.updateRole(entity.value)
      }
    }
  })
}

// 删除
function del(item: ISysTenantRole) {
  ElMessageBox.confirm(
    '确认要删除选中角色？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delRole(item.Id).then(res => {
      if (res.Status) {
        get()
      }
    })
  })
}

// 跳转详情页
function toDetailPage(item: ISysTenantRole) {
  browserStore.navigate(ROLE_DETAIL, item)
}
</script>

<style lang="scss" scoped>
.role-page {
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

  .search-button {
    margin-left: 10px;
  }
}
</style>
