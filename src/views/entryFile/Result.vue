<template>
  <el-container class="container">
    <el-main class="content">
      <div class="icon ofa-bg-success">
        <i class="el-icon-check"></i>
      </div>
      <div class="text">
        <div class="title">入职登记已提交</div>
      </div>
    </el-main>
  </el-container>
</template>

<script>
import { ENTRY_FILE_RESULT } from '../../router/base-router'

// 员工入职登记填写结果
export default {
  name: ENTRY_FILE_RESULT.name
}

</script>

<style lang="scss" scoped>
.container {
  background: #fff;
  height: 100%;
  width: 100%;

  .content {
    display: flex;
    justify-content: center;

    .icon {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      font-size: 1.75rem;
      font-weight: bold;
      color: #fff;
    }

    .text {
      display: flex;
      align-items: center;
      margin-left: 10px;
      height: 80px;
      font-size: 1.75rem;
      font-weight: bold;
    }
  }
}
</style>
