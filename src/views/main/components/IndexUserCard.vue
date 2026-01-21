<template>
  <el-dropdown class="index-usercard">
    <el-button text @click="toPersonalPage" class="squre-btn">
      <el-avatar :src="domain + user?.IconUrl" class="user-icon">
        <template #default>
          <font-awesome-icon fas icon="user"></font-awesome-icon>
        </template>
      </el-avatar>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu class="user-card">
        <div class="card-header">
          <label>我的名片</label>
          <el-link :underline="false" type="info" @click="toPersonalPage"
            >个人中心</el-link
          >
        </div>
        <div class="card-content">
          <el-avatar
            :src="domain + user?.IconUrl"
            :size="88"
            @click="toPersonalPage"
          >
            <template #default>
              <font-awesome-icon fas icon="user"></font-awesome-icon>
            </template>
          </el-avatar>
          <ul class="user-info">
            <li>
              <font-awesome-icon fas icon="building"></font-awesome-icon
              ><label>{{ user?.TenantName }}</label>
            </li>
            <li>
              <font-awesome-icon fas icon="user"></font-awesome-icon
              ><label>{{ user?.Name }}</label>
              <label>&nbsp;({{ user?.UserName }})</label>
            </li>
            <li>
              <font-awesome-icon fas icon="signature"></font-awesome-icon>
              <label>{{
                user?.Signature ?? '暂时还没有签名，快去个人中心写一个吧~'
              }}</label>
            </li>
          </ul>
        </div>
        <div class="card-bottom">
          <el-button plain type="danger" @click="logout">
            <font-awesome-icon fas icon="power-off"></font-awesome-icon>&nbsp;{{
              logouting ? '安全退出中...' : '退出登录'
            }}
          </el-button>
        </div>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import router from '@/untils/router.ts'
import API from '@/apis/base-api.ts'
import { LOGIN, PERSONAL } from '@/routers/main-router.ts'
import { ILoginUser } from '@/interfaces/ILoginUser.ts'
import { useTokenStore } from '@/stores/tokenStore.ts'
import { useClientStore } from '@/stores/clientStore'
import { useUserStore } from '@/stores/userStore'
import { useBrowserStore } from '@/stores/browserStore'

const user = ref<ILoginUser>()
const logouting = ref(false)
const domain = ref(API.getHost())
const tokenStore = useTokenStore()
const clientStore = useClientStore()
const userStore = useUserStore()
const browserStore = useBrowserStore()

// 跳转个人中心
function toPersonalPage() {
  browserStore.navigate(PERSONAL)
}
// 退出登录
function logout() {
  logouting.value = true
  API.logout()
    .then(res => {
      if (res == 1) {
        tokenStore.clearToken()
        clientStore.clearClient()
        logouting.value = false
      }
    })
    .finally(() => {
      router.push({ path: LOGIN.Url })
    })
}

onMounted(() => {
  // 获取登录用户信息
  API.getLoginUser().then(res => {
    user.value = res
    userStore.setUser(res)
  })
})
</script>

<style lang="scss" scoped>
.squre-btn {
  height: 60px;
  border-radius: 0 !important;
}

.user-name {
  color: #2e3543;
  margin-left: 4px;
}

.user-icon {
  height: 36px;
  width: 36px;
  border-radius: 50%;
  cursor: pointer;
}

.user-card {
  width: 400px;
  font-size: 0.75rem;

  .card-header {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #ebeef5;
    align-items: center;
    padding: 10px;
  }

  .card-content {
    display: flex;
    padding: 10px;

    :deep(.user-info) {
      margin-left: 20px;
      li {
        list-style: none;
        margin-bottom: 10px;
      }

      svg {
        margin-right: 10px;
        color: #909399;
      }
    }
  }

  .card-bottom {
    border-top: 1px solid #ebeef5;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: right;
  }
}
</style>
