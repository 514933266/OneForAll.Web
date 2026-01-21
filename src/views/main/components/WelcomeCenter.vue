<template>
  <div class="welcome-center">
    <div class="center-item">
      <div class="center-title">
        <span class="title">待办事项</span>
        <div class="circle circle-danger">
          <font-awesome-icon
            fas
            icon="file"
            class="icon-danger"
          ></font-awesome-icon>
        </div>
      </div>
      <div class="center-num">
        <span class="num-text">0</span>
        <span class="num-type">项</span>
      </div>
    </div>
    <div class="center-item">
      <div class="center-title">
        <span class="title">任务日程</span>
        <div class="circle circle-success">
          <font-awesome-icon
            fas
            icon="calendar-check"
            class="icon-success"
          ></font-awesome-icon>
        </div>
      </div>
      <div class="center-num">
        <span class="num-text">0</span>
        <span class="num-type">个</span>
      </div>
    </div>
    <div class="center-item">
      <div class="center-title">
        <span class="title">备忘录</span>
        <div class="circle circle-warning">
          <font-awesome-icon
            fas
            icon="bookmark"
            class="icon-warning"
          ></font-awesome-icon>
        </div>
      </div>
      <div class="center-num">
        <span class="num-text">0</span>
        <span class="num-type">个</span>
      </div>
    </div>
    <div class="center-item">
      <div class="center-title">
        <span class="title">我的出勤</span>
        <div class="circle circle-primary">
          <font-awesome-icon
            fas
            icon="user-clock"
            class="icon-primary"
          ></font-awesome-icon>
        </div>
      </div>
      <div class="center-num">
        <span class="num-text">0</span>
        <span class="num-type">天</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.welcome-center {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 20px;

  .center-item {
    width: 22%;
    min-width: 259px;
    height: 125px;
    background: #ffffff;
    border-radius: 16px;
    margin-bottom: 10px;

    .center-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 20px 30px 10px;
      .circle {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        &-danger {
          background-color: rgba(255, 67, 81, 0.1);
        }
        &-success {
          background-color: rgba(103, 194, 58, 0.1);
        }
        &-warning {
          background-color: rgba(254, 174, 27, 0.1);
        }
        &-primary {
          background-color: rgba(64, 158, 255, 0.1);
        }
      }

      .icon {
        &-danger {
          color: #f56c6c;
          background-color: rgba(255, 67, 81, 0.1);
        }
        &-success {
          color: #67c23a;
          background-color: rgba(103, 194, 58, 0.1);
        }
        &-warning {
          color: #e6a23c;
          background-color: rgba(254, 174, 27, 0.1);
        }
        &-primary {
          color: #409eff;
          background-color: rgba(64, 158, 255, 0.1);
        }
      }

      svg {
        font-size: 16px;
        right: 10px;
      }

      span {
        font-size: 14px;
        font-weight: 500;
        line-height: 20px;
      }
      .title {
        color: #303133;
        font-size: 1.25rem;
        font-weight: 600;
      }
    }

    .center-num {
      margin-left: 30px;

      .num-text {
        color: #303133;
        font-size: 24px;
        font-weight: bold;
        line-height: 31px;
        margin-right: 8px;
      }

      .num-type {
        color: #303133;
        font-size: 16px;
        font-weight: 500;
        line-height: 24px;
      }
    }
  }
}
</style>
