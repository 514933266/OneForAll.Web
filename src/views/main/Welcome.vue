<template>
  <el-container class="welcome-page">
    <WelcomeTop></WelcomeTop>
    <WelcomeCenter></WelcomeCenter>
    <WelcomeBottom></WelcomeBottom>
  </el-container>
</template>

<script setup lang="ts">
import WelcomeTop from './components/WelcomeTop.vue'
import WelcomeCenter from './components/WelcomeCenter.vue'
import WelcomeBottom from './components/WelcomeBottom.vue'
</script>

<style lang="scss" scoped>
.welcome-page {
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>
