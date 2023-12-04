<template>
  <div>
    <div class="message-top">
      <div>
        <font-awesome-icon fas icon="message" class="header-icon"></font-awesome-icon>
        <span class="message-top-name">站内信</span>
      </div>
      <div @click="toMessageCenterPage" class="message-top-right">
        <span>查看全部</span>
        <i class="el-icon-arrow-right"></i>
      </div>
    </div>
    <div class="message-list">
      <div class="none-box">
        <el-empty v-if="list.length < 1" description="暂无站内信" :image-size="100"></el-empty>
      </div>
      <div class="message-list-item" v-for="item in list" :key="item.id">
        <div class="message-list-top">
          <div class="message-list-top-left">
            <span>{{ item.Title }}</span>
          </div>
          <div class="message-list-top-right">
            <span>{{new Date(item.CreateTime).toString('yyyy年MM月dd日 hh:mm')}}</span>
          </div>
        </div>
        <div class="message-list-desc">{{ item.Content }}</div>
        <div class="message-list-pol">发件人：{{ item.CreatorName }}</div>
        <div class="message-list-line"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { MESSAGE_CENTER } from '../../../router/base-router'
import API from '../../../apis/base-api'

// 站内信
export default {
  name: 'PersonalMessage',
  data () {
    return {
      list: []
    }
  },
  methods: {
    getUserMessage () {
      const url = this.$root.getApi(API.KEY, API.PERSONAL_MESSAGE.URL)
      this.axios.get(`${url}/5`)
        .then(response => {
          this.list = response
        })
    },
    toMessageCenterPage () {
      this.$refs.browser.navigate(MESSAGE_CENTER)
    }
  },
  created () {
    this.getUserMessage()
  }
}
</script>

<style lang="scss" scoped>
.message-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 19px 0 14px;
  padding: 16px 0 15px;
  > div {
    display: flex;
    align-items: center;
  }
  &-name {
    font-size: 18px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
    line-height: 24px;
    margin-right: 7px;
  }
  img {
    width: 24px;
    height: 24px;
    margin-right: 9px;
  }
  &-right {
    font-size: 14px;
    font-weight: 400;
    color: #409eff;
    line-height: 22px;
    cursor: pointer;
  }
}
.message-list {
  height: 215px;
  overflow-x: hidden;
  overflow-y: auto;
  .none-box {
    .el-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
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
      > span {
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
.message-list-item:last-child .message-list-line {
  background: transparent;
}
</style>
