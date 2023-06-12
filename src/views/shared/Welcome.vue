<template>
  <div>
    <el-card>
      <h4>欢迎你</h4>
      <p>今天是</p>
      <p>{{new Date().toString('yyyy年MM月dd日')}}</p>
    </el-card>
  </div>
</template>

<script>
import { WELCOME } from '../../router/base-router'
export default {
  name: WELCOME.name
}
</script>

<style lang="scss" scoped>
.el-card {
  margin-bottom: .75rem;
}
</style>
