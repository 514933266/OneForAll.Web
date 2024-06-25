<template>
  <div v-for="item in list" :key="item.Id">
    <div v-if="item.Type === 1">
      <div class="menu-name-disabled">{{ item.Name }}</div>
      <IndexLeftMenuItem
        :list="item.Children"
        :collapse="collapse"
        @click="clickItem"
      >
      </IndexLeftMenuItem>
    </div>
    <!-- 有子元素的item -->
    <el-sub-menu v-else-if="item.Type === 0" :index="item.Id">
      <template #title>
        <font-awesome-icon
          fas
          :icon="item.Icon"
          class="icon"
        ></font-awesome-icon>
        <label class="menu-name">{{ item.Name }}</label>
      </template>
      <!-- 侧边弹出title -->
      <div v-if="collapse" class="popup-name">{{ item.Name }}</div>
      <IndexLeftMenuItem
        :list="item.Children"
        :collapse="collapse"
        @click="clickItem"
      >
      </IndexLeftMenuItem>
    </el-sub-menu>
    <!-- 单个item -->
    <el-menu-item v-else :index="item.Id" @click="clickItem" class="ofa-text">
      <font-awesome-icon fas :icon="item.Icon" class="icon"></font-awesome-icon>
      <label class="menu-name" style="cursor: pointer">{{ item.Name }}</label>
    </el-menu-item>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { IPersonalMenuTree } from '@/interfaces/IPersonalMenuTree'

interface IMenuItemProp {
  list: IPersonalMenuTree[]
  collapse: boolean
}

const props = defineProps<IMenuItemProp>()
const { list, collapse } = props
const emit = defineEmits(['click'])

// 点击菜单
function clickItem(item: any) {
  emit('click', item)
}
</script>

<style lang="scss" scoped>
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  color: #606266;
  border-radius: 10px;
  margin: 0 10px;

  .icon {
    width: 16px;
    height: 16px;
  }
}

.menu-name-disabled {
  font-size: 0.85rem;
  padding-left: 30px;
  margin: 20px 0 20px 4px;
  font-weight: 500;
  color: #99a9bf;
}

.popup-name {
  text-align: left;
  font-size: 1rem;
  color: #99a9bf;
  margin: 10px;
}

.menu-name {
  margin-left: 4px;
}
</style>
