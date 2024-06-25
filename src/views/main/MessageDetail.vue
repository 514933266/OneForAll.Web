<template>
  <el-container class="message-detail-page">
    <el-header class="title-box">
      <div class="title">{{ entity.Title }}</div>
      <div class="date">
        {{ dayjs(entity?.CreateTime).format('YYYY年MM月DD日 HH:mm') }}
      </div>
    </el-header>
    <el-divider></el-divider>
    <el-main>
      <div v-html="entity.Content"></div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dayjs } from 'element-plus'
import { ISysMessage } from '@/interfaces/base/ISysMessage'

const entity = ref<ISysMessage>(Object.assign({ Title: '', Content: '' }))

onMounted(() => {
  entity.value = history.state.params as ISysMessage
})
</script>

<style lang="scss" scoped>
.message-detail-page {
  background: #fff;
  border-radius: 20px;
  padding: 20px;
  .title-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #606266;
    }

    .date {
      margin-top: 10px;
      font-size: 0.85rem;
      color: #99a9bf;
    }
  }
}
</style>
