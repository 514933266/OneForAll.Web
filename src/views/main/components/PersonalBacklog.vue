<template>
  <div class="personal-backlog">
    <div class="backlog-top">
      <div class="title-box">
        <div class="icon icon-success">
          <font-awesome-icon fas icon="clock"></font-awesome-icon>
        </div>
        <span>待办事项</span>
      </div>
      <div class="btn-box">
        <el-button link type="primary"
          >查看全部<font-awesome-icon
            fas
            icon="chevron-right"
          ></font-awesome-icon
        ></el-button>
      </div>
    </div>
    <div class="backlog-list">
      <el-empty
        v-if="list.length < 1"
        description="暂无待办事项"
        :image-size="100"
      ></el-empty>
      <div class="item-box" v-for="item in list" :key="item">
        <div class="backlog-list-top">
          <div class="backlog-list-top-left">
            <span>入职处理事项</span>
            <font-awesome-icon fas icon="new"></font-awesome-icon>
          </div>
          <div class="backlog-list-top-right">
            <span>2023-09-12 12:00</span>
            <el-dropdown trigger="click">
              <font-awesome-icon fas icon="chevron-right"></font-awesome-icon>
              <el-dropdown-menu>
                <template #dropdown>
                  <div class="menu-box">
                    <div>去处理</div>
                    <div>关闭</div>
                  </div>
                </template>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>
        <div class="backlog-list-desc"></div>
        <div class="backlog-list-line"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const list = ref([])
</script>

<style lang="scss" scoped>
.personal-backlog {
  background-color: #fff;
  border-radius: 20px;

  .backlog-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;

    > div {
      display: flex;
      align-items: center;
    }

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
        &-success {
          background-color: #67c23a;
          margin-right: 4px;
        }
      }
    }

    .btn-box {
      font-size: 14px;
      font-weight: 400;
      color: #409eff;
      line-height: 22px;
      cursor: pointer;
    }
  }

  .backlog-list {
    max-height: 300px;
    overflow-x: hidden;
    overflow-y: auto;

    &-item {
      margin: 0 19px 0 14px;
    }

    &-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 15px 0 7px;

      &-left {
        display: flex;
        align-items: center;

        > span {
          font-size: 14px;
          font-weight: 500;
          color: #354052;
          line-height: 22px;
        }

        > img {
          width: 26px;
          height: 16px;
          margin-left: 6px;
        }
      }

      &-right {
        display: flex;
        align-items: center;
        font-size: 14px;
        font-weight: 400;
        color: #7f8fa4;
        line-height: 22px;

        img {
          margin-left: 14px;
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
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
      margin-bottom: 14px;
    }

    &-line {
      margin: 0 11px 0 16px;
      height: 1px;
      background: #e9e9e9;
    }
  }
}
.dropdown-back.el-dropdown-menu {
  padding: 0;
  border-radius: 0px;
  box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.15);
}

.backlog-list-item:last-child .backlog-list-line {
  background: transparent;
}
</style>
