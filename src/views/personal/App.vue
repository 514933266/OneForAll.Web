<template>
  <div class="personal-box">
    <el-tabs tab-position="left" type="border-card">
      <el-tab-pane>
        <span slot="label">
          <font-awesome-icon fas icon="user-tag"></font-awesome-icon>&nbsp;个人资料
        </span>
        <info></info>
      </el-tab-pane>
      <el-tab-pane>
        <span slot="label">
          <font-awesome-icon fas icon="unlock-alt"></font-awesome-icon>&nbsp;修改密码
        </span>
        <password></password>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import Info from './Info'
import Password from './Password'
import { PERSONAL } from '../../router/base-router'

export default {
  name: PERSONAL.name,
  components: { Info, Password }
}
</script>

<style lang="scss" scoped>
.personal-box {
  display: flex;
  min-height: 980px;
  width: 100%;

  /deep/.el-tabs {
    width: 100%;
    font-size: .75rem;

    .el-tabs__item {
      font-size: .75rem;
    }

    svg {
      width: .75rem;
      height: .75rem;
    }

    .header {
      padding: 0.75rem 0;
      font-size: .75rem;
      text-align: left;
      border-bottom: 1px solid #ebeef5;
    }

    .content {
      display: flex;
      margin-top: 25px;
    }
  }
}
</style>
