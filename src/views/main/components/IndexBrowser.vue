<template>
  <div class="index-browser">
    <el-tabs
      v-model="refBrowserStore.activeName.value"
      type="card"
      class="browser-tabs"
      @tab-remove="removeTab"
      @tab-change="clickTab"
    >
      <el-tab-pane
        v-for="item in refBrowserStore.tabs.value"
        :key="item.Name"
        :name="item.Name"
        :closable="!item.IsDefault"
      >
        <template #label>
          <font-awesome-icon
            v-if="item.Icon"
            fas
            :icon="item.Icon"
          ></font-awesome-icon>
          <label class="tab-name">{{ item.Name }}</label>
        </template>
      </el-tab-pane>
    </el-tabs>
    <div class="browser-page">
      <router-view v-slot="{ Component }">
        <keep-alive><component :is="Component" /></keep-alive>
      </router-view>
      <el-backtop :right="100" :bottom="100" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useBrowserStore } from '@/stores/browserStore'
import { usebreadcrumbStore } from '@/stores/breadcrumbStore'

const browserStore = useBrowserStore()
const breadcrumbStore = usebreadcrumbStore()
const refBrowserStore = storeToRefs(browserStore)

// 切换
function clickTab(tabName: any) {
  browserStore.activeTab(tabName)
  breadcrumbStore.toHistorys(tabName)
}

// 移除
function removeTab(tabName: any) {
  browserStore.removeTab(tabName)
  breadcrumbStore.removeHistory(tabName)
}
</script>

<style lang="scss" scoped>
$toolbar-height: 44px;

.index-browser {
  overflow: hidden;
  .browser-tabs {
    flex: 1;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    background-color: #fff;

    :deep(.el-tabs__nav-scroll) {
      margin-left: 20px;
    }

    :deep(.el-tabs__header) {
      border: 0;
      box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.05);
      margin: 0 !important;
    }

    :deep(.el-tabs__nav) {
      border: 0 !important;

      svg {
        width: 14px;
        height: 14px;
      }
    }

    :deep(.el-tabs__item) {
      border-radius: 8px 8px 0 0;
      margin-right: 10px;
      border: 0;
      font-weight: bold;
      color: #606266;

      &.is-active {
        background-color: #ebeef5;
        color: #409eff;
        border-bottom-color: #ebeef5;
        transition: all 0.2s ease-in;
      }

      label {
        cursor: pointer;
      }
    }

    :deep(.el-tabs__content) {
      display: none;
    }

    :deep(.tab-name) {
      margin-left: 4px;
    }
  }

  .browser-page {
    background: #f7f8fc;
    height: 100%;
    padding: 20px;
    overflow: hidden;
    overflow-y: auto;
    :deep(.el-container) {
      margin-bottom: 100px;
    }
  }
}
</style>
