<template>
  <el-container class="user-page">
    <el-header class="header">
      <span class="search-box">
        <el-input enterable v-model="searchOption.key" placeholder="用户账号 / 名称" style="width: 260px" class="ofa-mr10">
          <template #prefix>
            <font-awesome-icon fas icon="user"></font-awesome-icon>
          </template>
        </el-input>
        <el-button @click="search" type="primary"><font-awesome-icon fas
            icon="search"></font-awesome-icon>&nbsp;查询</el-button>
      </span>
      <span class="button-box">
        <el-button v-if="permission.Add" @click="showDrawer()" type="primary">
          <font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;创建账号
        </el-button>
      </span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          账号列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="Name" label="名称" width="200">
          <template #default="scope">
            <div class="user-icon">
              <el-avatar :src="domain + scope.row.IconUrl">
                {{ getSubName(scope.row.Name) }}
              </el-avatar>
              <label class="ofa-ml10">{{ scope.row.Name }}</label>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="UserName" label="账号" width="200"></el-table-column>
        <el-table-column prop="TenantName" label="所属企业" width="300"></el-table-column>
        <el-table-column label="账号类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.IsDefault ? 'primary' : 'info'">
              {{ scope.row.IsDefault ? '管理员' : '普通账号' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后登录时间" width="180">
          <template #default="scope">{{
            scope.row.LastLoginTime ? scope.row.LastLoginTime : '未登录'
          }}</template>
        </el-table-column>
        <el-table-column label="最后登录Ip" width="140">
          <template #default="scope">{{
            scope.row.LastLoginIp ? scope.row.LastLoginIp : '未登录'
          }}</template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <el-tag effect="dark" :type="scope.row.Status !== 1 ? 'danger' : 'success'">{{
              getStatusStr(scope.row.Status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" fixed="right" width="140">
          <template #default="scope">
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
  <!-- 用户表单 -->
  <el-drawer v-model="drawerVisiable" :modal="false" :show-close="false" direction="rtl" size="460" class="ofa-drawer">
    <template #header>
      <span class="title">{{ isAdd ? '创建' : '编辑' }}账号</span>
    </template>
    <el-form status-icon ref="userForm" :rules="validationRule" :model="entity" class="form" label-width="80px">
      <el-alert title="操作提示" type="warning" style="margin-bottom: 20px" :closable="false"
        description="创建账号后密码默认与账号相同，默认用户权限和租户同步"></el-alert>
      <el-form-item label="是否默认">
        <el-switch v-model="entity.IsDefault"></el-switch>
      </el-form-item>
      <el-form-item label="所属机构" prop="TenantId">
        <el-select filterable remote v-model="entity.TenantId" :remote-method="getTenants" placeholder="请输入机构名称进行查询">
          <el-option v-for="item in tenants" :key="item.Id" :label="item.Name" :value="item.Id">
            <span class="float-left">{{ item.Name }}</span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="账号" prop="UserName">
        <el-input v-model.trim="entity.UserName" :disabled="!isAdd" placeholder="请输入用户账号">
        </el-input>
      </el-form-item>
      <el-form-item label="名称" prop="Name">
        <el-input v-model.trim="entity.Name" placeholder="请输入用户名称"></el-input>
      </el-form-item>
      <el-form-item label="手机号码" prop="Mobile">
        <el-input v-model.trim="entity.Mobile" placeholder="请输入用户手机号码"></el-input>
      </el-form-item>
      <el-form-item label="状态" prop="Status">
        <el-select v-model="entity.Status" placeholder="请选择账号初始状态">
          <el-option label="正常" :value="1"></el-option>
          <el-option label="停用" :value="2099"></el-option>
        </el-select>
      </el-form-item>
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
import { USER } from '@/routers/sys-router'
import { ISysUser } from '@/interfaces/sys/ISysUser'
import { ISysTenant } from '@/interfaces/sys/ISysTenant'
import API from '@/apis/sys-api'
import { USER_STATUS } from '@/consts/base-const'

const userStore = useUserStore()
const loading = ref(false) // 加载中
const drawerVisiable = ref(false)
const isAdd = ref(true) // 添加模式
const domain = ref(API.getHost())
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const searchOption = ref({
  key: ''
}) // 搜索条件
const list = ref<ISysUser[]>([]) // 用户列表
const tenants = ref<ISysTenant[]>([]) // 用户列表
const entity = ref<ISysUser>(
  Object.assign({ Name: '', UserName: '', Status: 1 })
) // 实体
const userForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
  TenantId: [
    { required: true, message: '请先选择用户所属机构', trigger: 'change' }
  ],
  Name: [
    { required: true, message: '请先填写用户名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2到8个字符', trigger: 'blur' }
  ],
  UserName: [
    { required: true, message: '请先填写用户登录账号', trigger: 'blur' },
    { min: 4, max: 20, message: '长度在4到20个字符', trigger: 'blur' }
  ],
  Mobile: [{ max: 20, message: '长度在0到20个字符', trigger: 'blur' }]
}) // 表单验证

const permission = computed(() => {
  return userStore.getPermissions(USER.Url) // 权限列表
})

onMounted(() => {
  get()
})

// 获取分页列表
function get() {
  loading.value = true
  API.getPageUsers(
    pageIndex.value,
    pageSize.value,
    searchOption.value.key
  ).then(res => {
    total.value = res.Total
    list.value = res.Items
    loading.value = false
  })
}

// 获取指定租户
function getTenant() {
  API.getTenant(entity.value.TenantId).then(res => {
    tenants.value = [res]
  })
}

// 获取租户列表
function getTenants(key: string) {
  API.getPageTenants(1, 10, key).then(res => {
    tenants.value = res.Items
  })
}

// 获取状态
function getStatusStr(status: number): any {
  let statusName = '异常'
  const item = USER_STATUS.find(w => w.value === status)
  if (item) {
    statusName = item.label
  }
  return statusName
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
function showDrawer(item?: ISysUser) {
  if (item) {
    isAdd.value = false
    entity.value = item
    getTenant()
  } else {
    isAdd.value = true
    entity.value = Object.assign({ Status: 1 })
    nextTick(() => {
      userForm.value?.resetFields()
    })
  }
  drawerVisiable.value = true
}

// 提交
function submit() {
  userForm.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAdd.value) {
        API.addUser(entity.value).then(res => {
          if (res.Status) get()
        })
      } else {
        API.updateUser(entity.value)
      }
    }
  })
}

// 删除账号
function del(item: ISysUser) {
  ElMessageBox.confirm(
    '确认要删除选中账号？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delUser(item.Id).then(res => {
      if (res.Status) {
        get()
      }
    })
  })
}
</script>

<style lang="scss" scoped>
.user-page {
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

  .user-icon {
    display: flex;
    align-items: center;

    .el-avatar {
      background-color: #409eff;
    }
  }
}
</style>
