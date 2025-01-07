<template>
  <el-container class="role-detail-page">
    <el-main class="tab-container">
      <div class="title">【{{ `${entity?.Name}` }}】权限配置</div>
      <el-tabs v-model="activeName">
        <el-tab-pane label="全部权限" name="permTab">
          <div class="perm-box">
            <el-alert show-icon title="操作提示" type="warning">
              <ul class="tips">
                <li>对角色进行权限分配</li>
                <li>将用户加入角色，即可拥有对应系统权限</li>
                <li>勾选子权限默认拥有父级的查看权限</li>
              </ul>
            </el-alert>
            <div class="button-box">
              <el-button v-if="permission.Update" @click="bindPermission" type="primary">保存权限</el-button>
            </div>
            <PermissionTable v-model="selectionList"></PermissionTable>
          </div>
        </el-tab-pane>
        <el-tab-pane label="角色用户" name="userTab">
          <div class="role-member-box">
            <div class="header">
              <el-select multiple filterable v-model="memberIds" placeholder="在此处搜索要加入角色的账号" style="width: 400px">
                <el-option v-for="item in users" :key="item.Id" :label="item.Name" :value="item.Id"
                  style="height: 60px">
                  <div class="user-icon">
                    <el-avatar :src="domain + item.IconUrl">{{
                      getSubName(item.Name)
                    }}</el-avatar>
                    <label>{{ item.Name }}({{ item.UserName }})</label>
                  </div>
                </el-option>
              </el-select>
              <el-button v-if="permission.Update" @click="addMember" type="primary"
                class="submit-button">添加选中成员到角色</el-button>
            </div>
            <el-table border :data="members" class="member-table">
              <el-table-column prop="Name" label="名称">
                <template #default="scope">
                  <div class="user-icon">
                    <el-avatar :src="domain + scope.row.IconUrl">{{
                      getSubName(scope.row.Name)
                    }}</el-avatar>
                    <label>{{ scope.row.Name }}</label>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="UserName" label="账号"></el-table-column>
              <el-table-column prop="IsDefault" label="账号类型" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.IsDefault === true ? 'danger' : 'info'">
                    {{ scope.row.IsDefault ? '管理员' : '普通账号' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="LastLoginTime" label="最后登录时间" width="160">
                <template #default="scope">{{
                  scope.row.LastLoginTime ? scope.row.LastLoginTime : '未登录'
                }}</template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center" header-align="center">
                <template #default="scope">
                  <el-button v-if="permission.Delete" link type="danger" @click="delMember(scope.row)">移除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onActivated } from 'vue'
import { ElMessageBox } from 'element-plus'
import { ISysTenantRole } from '@/interfaces/base/ISysTenantRole'
import { useUserStore } from '@/stores/userStore'
import PermissionTable from './components/PermissionTable.vue'
import API from '@/apis/base-api'
import { ROLE } from '@/routers/base-router'
import { ISysMenuPermission } from '@/interfaces/base/ISysMenuPermission'
import { ISysRoleMember } from '@/interfaces/base/ISysRoleMember'

const userStore = useUserStore()
const domain = ref(API.getHost())
const entity = ref<ISysTenantRole>() // 实体
const activeName = ref('permTab') // 激活标签
const permissions = ref<ISysMenuPermission[]>([]) // 角色权限列表
const members = ref<ISysRoleMember[]>([]) // 角色成员列表
const users = ref<ISysRoleMember[]>([]) // 角色成员列表
const memberIds = ref<string[]>([]) // 选中的账号id列表
const selectionList = ref<string[]>([]) // 选中的权限列表

const permission = computed(() => {
  return userStore.getPermissions(ROLE.Url) // 权限列表
})

const roleId = computed(() => {
  return entity.value?.Id ?? ''
}) // 角色id

onActivated(() => {
  init()
})

function init() {
  entity.value = history.state.params
  if (roleId.value) {
    getPermissions()
    getMembers()
    getUsers()
  }
}

// 获取权限列表
function getPermissions() {
  API.getRolePermissions(roleId.value).then(res => {
    permissions.value = res
    selectionList.value = permissions.value.map(x => x.Id)
  })
}

// 获取角色列表
function getMembers() {
  API.getRoleMembers(roleId.value).then(res => {
    members.value = res
  })
}

// 获取非成员账号列表
function getUsers() {
  API.getRoleUsers(roleId.value).then(res => {
    users.value = res
  })
}

// 获取简略名字
function getSubName(str: string) {
  return str && str.length > 0 ? str.substring(0, 1) : 'User'
}

// 绑定权限
function bindPermission() {
  API.bindRolePermission(roleId.value, selectionList.value)
}

// 添加成员
function addMember() {
  if (memberIds.value.length < 1) return false
  API.addRoleMember(roleId.value, memberIds.value).then(res => {
    if (res.Status) {
      getMembers()
    }
  })
}

// 移除角色账号
function delMember(item: ISysRoleMember) {
  ElMessageBox.confirm(
    '确认要删除选中账号？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delRoleMember(roleId.value, item.Id).then(res => {
      if (res.Status) {
        getMembers()
      }
    })
  })
}
</script>

<style lang="scss" scoped>
.role-detail-page {
  padding: 20px;
  background-color: #fff;
  border-radius: 20px;
}

.header {
  display: flex;
  align-items: center;
  background-color: #fff;
  margin-bottom: 20px;
  border-radius: 10px;
}

.tab-container {
  .tab-name {
    font-size: 18px;
    margin-bottom: 10px;
  }

  :deep(.el-tabs__item) {
    font-size: 1rem !important;
    padding: 10px 20px !important;
    font-weight: bold;
    height: auto;
    min-width: 160px;
    text-align: center;
  }

  .title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #303133;
    margin-bottom: 20px;
  }
}

.perm-box {
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  align-items: flex-start;

  .button-box {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 10px 0;
    width: 100%;
  }
}

.role-member-box {
  height: 100%;

  .header {
    display: flex;
  }
}

.user-icon {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;

  label {
    margin-left: 10px;
  }

  .el-avatar {
    background-color: #409eff;
  }
}

.submit-button {
  margin-left: 10px;
}
</style>
