<template>
  <div class="personal-message">
    <div class="message-top">
      <div class="title-box">
        <div class="icon ofa-bg-warning ofa-mr10">
          <font-awesome-icon fas icon="envelope"></font-awesome-icon>
        </div>
        <span>站内信</span>
      </div>
      <div class="btn-box">
        <el-button link @click="toMessageCenterPage" type="primary">查看全部<font-awesome-icon fas
            icon="chevron-right"></font-awesome-icon></el-button>
      </div>
    </div>
    <div class="message-list">
      <div class="message-list-item" v-for="item in list" :key="item.Id">
        <div class="message-list-top">
          <div class="message-list-top-left ofa-text-title">
            <span>{{ item.Title }}</span>
          </div>
          <div class="message-list-top-right">
            <span>{{
              dayjs(item.CreateTime).format('YYYY年MM月DD日 HH:mm')
            }}</span>
          </div>
        </div>
        <div class="message-list-desc">{{ item.Content }}</div>
        <div class="message-list-pol">发件人：{{ getTypeStr(item.Type) }}</div>
        <div class="message-list-line"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dayjs } from 'element-plus'
import { useBrowserStore } from '@/stores/browserStore'
import { ISysMessage } from '@/interfaces/ums/ISysMessage'
import API from '@/apis/ums-api'
import { MESSAGE_TYPE } from '@/consts/ums-const'
import { MESSAGE_CENTER } from '@/routers/main-router'

const browserStore = useBrowserStore()
const list = ref<ISysMessage[]>([])

// 获取站内信列表
function get() {
  API.getPageMessage(1, 10, -1).then(res => {
    list.value = res.Items
  })
}

// 获取消息类型
function getTypeStr(type: number) {
  return MESSAGE_TYPE.find(w => w.value === type)?.label ?? '未知'
}

// 去消息中心页
function toMessageCenterPage() {
  browserStore.navigate(MESSAGE_CENTER)
}

onMounted(() => {
  get()
})
</script>

<style lang="scss" scoped>
.personal-message {
  background-color: #fff;
  border-radius: 20px;
  margin-top: 20px;

  .message-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;

    .title-box {
      display: flex;
      align-items: center;

      span {
        font-size: 18px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.85);
      }

      .icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        color: #fff;
      }
    }
  }

  .message-list {
    max-height: 300px;
    overflow-x: hidden;
    overflow-y: auto;

    .el-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    &-item {
      margin: 0 19px 0 14px;
    }

    &-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 12px 0 8px;

      &-left {
        display: flex;
        align-items: center;

        >span {
          font-size: 14px;
          font-weight: 500;
          color: #354052;
          line-height: 22px;
        }
      }

      &-right {
        display: flex;
        align-items: center;
        font-size: 14px;
        font-weight: 400;
        color: #7f8fa4;
        line-height: 22px;
      }
    }

    &-desc {
      padding-right: 20px;
      font-size: 14px;
      font-weight: 400;
      color: #354052;
      line-height: 22px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 8px;
    }

    &-pol {
      font-size: 14px;
      font-weight: 400;
      color: #7f8fa4;
      line-height: 22px;
      margin-bottom: 8px;
    }

    &-line {
      margin: 0 11px 0 16px;
      height: 1px;
      background: #e9e9e9;
    }
  }
}

.message-list-item:last-child .message-list-line {
  background: transparent;
}
</style>
