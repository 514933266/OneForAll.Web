<template>
  <el-container class="role-detail-page">
    <el-main class="tab-container">
      <div class="title">【{{ `${entity?.Name}` }}】权限配置</div>
      <el-tabs v-model="activeName">
        <el-tab-pane label="全部权限" name="permTab">
          <div class="perm-box">
            <el-alert show-icon title="操作提示" type="warning">
              <ul class="tips">
                <li>对租户进行权限分配</li>
                <li>租户的默认账号的权限会保持与租户同步</li>
              </ul>
            </el-alert>
            <div class="button-box">
              <el-button v-if="permission.Update" @click="bindPermission" type="primary">保存权限</el-button>
            </div>
            <PermissionTable v-model="selectionList"></PermissionTable>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onActivated } from 'vue'
import { ISysTenant } from '@/interfaces/sys/ISysTenant'
import { useUserStore } from '@/stores/userStore'
import PermissionTable from './components/PermissionTable.vue'
import API from '@/apis/sys-api'
import { TENANT } from '@/routers/sys-router'
import { ISysMenuPermission } from '@/interfaces/sys/ISysMenuPermission'

const userStore = useUserStore()
const entity = ref<ISysTenant>() // 实体
const activeName = ref('permTab') // 激活标签
const permissions = ref<ISysMenuPermission[]>([]) // 租户权限列表
const selectionList = ref<string[]>([]) // 选中的权限列表

const permission = computed(() => {
  return userStore.getPermissions(TENANT.Url) // 权限列表
})

const tenantId = computed(() => {
  return entity.value?.Id ?? ''
}) // 租户id

onActivated(() => {
  entity.value = history.state.params
  if (tenantId.value) {
    getPermissions()
  }
})

// 获取权限列表
function getPermissions() {
  API.getTenantPermission(tenantId.value).then(res => {
    permissions.value = res
    selectionList.value = permissions.value.map(x => x.Id)
  })
}

// 绑定权限
function bindPermission() {
  API.bindTenantPermission(tenantId.value, selectionList.value)
}
</script>

<style lang="scss" scoped>
.role-detail-page {
  padding: 20px;
  background-color: #fff;
  border-radius: 20px;

  .title {
    font-size: 1.75rem;
    font-weight: bold;
    margin-bottom: 10px;
  }
}

.header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
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
</style>
