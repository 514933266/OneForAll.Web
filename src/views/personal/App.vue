<template>
  <div class="personal-box">
    <!-- 面板 -->
    <panel class="container-box"></panel>
    <div class="container-bottom">
      <!-- 日程 -->
      <schedule class="container-box schedule-box"></schedule>
      <div class="container-right">
        <!-- 待办事项 -->
        <backlog class="container-right-box"></backlog>
        <!-- 活跃度 -->
        <liveness class="container-right-box"></liveness>
        <!-- 站内信 -->
        <message class="container-right-box"></message>
      </div>
    </div>
  </div>
</template>

<script>
import Panel from './_components/Panel'
import Schedule from './_components/Schedule'
import Backlog from './_components/Backlog'
import Liveness from './_components/Liveness'
import Message from './_components/Message'
import { PERSONAL } from '../../router/base-router'

export default {
  name: PERSONAL.name,
  components: { Panel, Schedule, Backlog, Liveness, Message }
}
</script>

<style lang="scss" scoped>
.personal-box {
  /deep/.el-tabs {
    width: 100%;
    font-size: 0.75rem;

    .el-tabs__item {
      font-size: 0.75rem;
    }

    svg {
      width: 0.75rem;
      height: 0.75rem;
    }

    .header {
      padding: 0.75rem 0;
      font-size: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #ebeef5;
    }

    .content {
      display: flex;
      margin-top: 25px;
    }
  }
}
.container-box {
  background: #ffffff;
  border-radius: 20px;
}

.container-bottom {
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}
.container-right {
  flex: 1;
  min-width: 403px;
  .container-right-box {
    background: #ffffff;
    border-radius: 20px;
    min-width: 403px;
    margin-bottom: 30px;
  }
  .container-right-box:last-child {
    margin-bottom: 0px;
  }
}
.schedule-box {
  flex: 2;
  // min-width: 781px;
  // max-height: 884px;
}
</style>
