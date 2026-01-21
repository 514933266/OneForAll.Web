<template>
  <el-container class="index-page">
    <IndexLeftMenu @click="clickMenu"></IndexLeftMenu>
    <el-container class="right-container">
      <el-header class="header">
        <div class="breadcrumb-box">
          <font-awesome-icon fas icon="house-user" class="icon breadcrumb"></font-awesome-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="breadcrumb in breadcrumbStore.breadcrumbs" :key="breadcrumb" class="is-link">{{
              breadcrumb }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="personal-box">
          <IndexMenuSearchInput style="margin-right: 10px"></IndexMenuSearchInput>
          <IndexMessage></IndexMessage>
          <IndexSchedule></IndexSchedule>
          <IndexUserCard></IndexUserCard>
        </div>
      </el-header>
      <IndexBrowser></IndexBrowser>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useBrowserStore } from '@/stores/browserStore'
import { usebreadcrumbStore } from '@/stores/breadcrumbStore'
import { IPersonalMenuTree } from '@/interfaces/IPersonalMenuTree'
import IndexLeftMenu from './components/IndexLeftMenu.vue'
import IndexMessage from './components/IndexMessage.vue'
import IndexUserCard from './components/IndexUserCard.vue'
import IndexSchedule from './components/IndexSchedule.vue'
import IndexBrowser from './components/IndexBrowser.vue'
import IndexMenuSearchInput from './components/IndexMenuSearchInput.vue'

const browserStore = useBrowserStore()
const breadcrumbStore = usebreadcrumbStore()

// 点击菜单
function clickMenu(menu: IPersonalMenuTree, paths: IPersonalMenuTree[]) {
  if (menu) {
    // 1. 更新面包屑
    breadcrumbStore.setBreadcrumbs(paths.map(x => x.Name))
    // 2. 添加浏览器标签
    const mode = checkMode(menu)
    if (mode.location) {
      window.location.href = menu.Url
    } else {
      browserStore.navigate(menu)
    }
  }
}

// 检查菜单类型
function checkMode(menu: IPersonalMenuTree) {
  const regx =
    /^(http|https):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/gi
  return {
    moudle: menu.Type === 1,
    location: regx.test(menu.Url),
    route: true
  }
}
</script>

<style lang="scss" scoped>
.header {
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .breadcrumb-box {
    display: flex;
    color: #409eff;
    font-size: 12px;
  }

  :deep(.el-breadcrumb__separator),
  :deep(.el-breadcrumb__inner) {
    color: #a7abba;
  }

  .squre-btn {
    height: 60px;
    width: 60px;
    border-radius: 0 !important;
  }

  .title {
    display: flex;
    align-items: center;
    font-size: 1.25rem;
    width: 300px;
    background-color: #303133;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    margin-right: 4px;

    :deep(.el-breadcrumb__item) {
      display: flex;
      align-items: center;
    }

    .icon {
      width: 20px;
      height: 20px;
    }
  }

  .personal-box {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}

.date-box {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
}

.date-yuan {
  width: 8px;
  height: 8px;
  background: #409eff;
  border-radius: 50%;
}

.right-container {
  overflow: hidden;
  background: #f7f8fc;
}
</style>
