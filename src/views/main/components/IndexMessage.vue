<template>
  <!-- 站内信 -->
  <el-dropdown class="index-message">
    <el-button text class="squre-btn">
      <el-badge is-dot class="item" :hidden="unReadCount < 1" size="small">
        <font-awesome-icon
          fas
          icon="bell"
          class="header-icon"
        ></font-awesome-icon>
      </el-badge>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu class="message-card" size="small">
        <div class="message-box">
          <div class="header">
            <el-tabs v-model="activeName" v-loading="loading">
              <el-tab-pane name="1">
                <template #label>
                  <div class="label" @click="get99Messages">
                    <font-awesome-icon
                      fas
                      icon="bell"
                      class="icon"
                    ></font-awesome-icon>
                    <span>未读</span>
                  </div>
                </template>
              </el-tab-pane>
              <el-tab-pane name="2">
                <template #label>
                  <div class="label" @click="getMessages(3)">
                    <font-awesome-icon
                      fas
                      icon="message"
                      class="icon"
                    ></font-awesome-icon>
                    <span>近三天</span>
                  </div>
                </template>
              </el-tab-pane>
              <el-tab-pane name="3">
                <template #label>
                  <div class="label" @click="getMessages(7)">
                    <font-awesome-icon
                      fas
                      icon="envelope"
                      class="icon"
                    ></font-awesome-icon>
                    <span>近一周</span>
                  </div>
                </template>
              </el-tab-pane>
            </el-tabs>
          </div>
          <div class="content">
            <el-empty v-if="!list" description="暂时没有站内通知" />
            <div
              v-for="item in list"
              :key="item.Id"
              @click="toCenterPage"
              class="message-item"
            >
              <el-avatar
                ><font-awesome-icon fas icon="envelope"></font-awesome-icon
              ></el-avatar>
              <div class="message-info">
                <div class="message-title">{{ item.Title }}</div>
                <div class="message-time">{{ item.CreateTime }}</div>
              </div>
            </div>
          </div>
          <div class="bottom">
            <el-button text type="primary">全部已读</el-button>
            <el-button text type="info" @click="toCenterPage"
              >查看全部</el-button
            >
          </div>
        </div>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBrowserStore } from '@/stores/browserStore'
import API from '@/apis/base-api.ts'
import { ISysMessage } from '@/interfaces/sys/ISysMessage'
import { MESSAGE_CENTER } from '@/routers/main-router'

const browserStore = useBrowserStore()
const loading = ref(false) // 加载中
const unReadCount = ref(1) // 未读数量
const activeName = ref('1') // 激活标签
const list = ref<ISysMessage[]>([]) // 消息列表

// 前10条未读
function get99Messages() {
  loading.value = true
  API.getTopMessages(99).then(res => {
    list.value = res
    loading.value = false
  })
}
// 近x天未读消息列表
function getMessages(day?: number) {
  loading.value = true
  API.getMessages(day).then(res => {
    list.value = res
    loading.value = false
  })
}
// 未读数量
function getUnReadCount() {
  API.getMessageCount().then(res => {
    unReadCount.value = res
  })
}

// 跳转消息中心页
function toCenterPage() {
  return browserStore.navigate(MESSAGE_CENTER)
}

onMounted(() => {
  get99Messages()
  getUnReadCount()
})
</script>

<style lang="scss" scoped>
.squre-btn {
  height: 60px;
  width: 60px;
  border-radius: 0 !important;
}

.message-card {
  padding: 0;
}

.message-box {
  box-sizing: border-box;
  width: 400px;
  font-size: 0.75rem;
  padding: 10px 0 30px;

  .el-tabs__item {
    height: 60px;
    line-height: 60px;
  }

  .label {
    display: flex;
    align-items: center;

    img {
      margin-right: 10px;
    }
  }

  .icon {
    margin-right: 4px;
  }

  .content {
    box-sizing: border-box;
    padding: 30px;
    height: 360px;
    margin-bottom: 20px;
    overflow-y: auto;
    overflow-x: hidden;
    -ms-overflow-style: none;
    overflow: -moz-scrollbars-none;
    scrollbar-width: none;
  }

  .content::-webkit-scrollbar {
    width: 0 !important;
  }

  .message-item {
    display: flex;
    padding: 10px;
    cursor: pointer;
    transition: all 0.2s ease-in;
    border-radius: 16px;

    &:hover {
      background: #f7f8fc;
    }

    svg {
      color: #fff;
    }
  }

  .message-info {
    margin-left: 20px;
  }

  .message-title {
    font-size: 16px;
    font-weight: 500;
    color: #2e3543;
    line-height: 24px;
    margin-bottom: 6px;
  }

  .message-con {
    font-size: 14px;
    font-weight: 500;
    color: #a7abba;
    line-height: 20px;
    margin-bottom: 24px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    -o-text-overflow: ellipsis;
  }

  .message-time {
    font-size: 12px;
    font-weight: 500;
    color: #a7abba;
    line-height: 18px;
  }

  .header {
    padding: 0 30px;
  }

  .message-empty {
    text-align: center;
    padding: 20px;
    color: #999;
  }

  .bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30px;

    .more-btn {
      padding: 10px 20px;
      background: #f7f8fc;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      color: #69708b;
      line-height: 20px;
      cursor: pointer;
    }
  }
}
</style>
