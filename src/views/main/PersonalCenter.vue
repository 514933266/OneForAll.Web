<template>
  <el-container class="personal-page">
    <PersonalBaseInfo></PersonalBaseInfo>
    <div class="main-content">
      <el-container class="left-container">
        <PersonalSchedule></PersonalSchedule>
      </el-container>
      <el-container class="right-container">
        <PersonalBacklog></PersonalBacklog>
        <PersonalLiveness></PersonalLiveness>
        <PersonalMessage></PersonalMessage>
      </el-container>
    </div>
  </el-container>
</template>

<script setup lang="ts">
import PersonalBaseInfo from './components/PersonalBaseInfo.vue'
import PersonalSchedule from './components/PersonalSchedule.vue'
import PersonalBacklog from './components/PersonalBacklog.vue'
import PersonalLiveness from './components/PersonalLiveness.vue'
import PersonalMessage from './components/PersonalMessage.vue'
</script>

<style lang="scss" scoped>
.personal-page {
  flex-direction: column;
  .main-content {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin: 20px 0 20px 0;
    .left-container {
      flex: 2;
    }
    .right-container {
      flex: 1;
      min-width: 400px;
      flex-direction: column;
      justify-content: space-between;
    }
  }
}
</style>
