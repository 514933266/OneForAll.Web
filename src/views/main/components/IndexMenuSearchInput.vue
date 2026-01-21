<template>
  <el-select
    v-model="text"
    filterable
    :filter-method="querySearch"
    :automatic-dropdown="true"
    @change="handleSelect"
    :teleported="false"
    placeholder="快速查找菜单"
    class="index-menu-search"
  >
    <template #prefix>
      <font-awesome-icon fas icon="search"></font-awesome-icon>
    </template>
    <el-option-group label="搜索结果" class="result-group">
      <el-option
        v-for="item in results"
        :key="item.Id"
        :label="item.Name"
        :value="item.Id"
      >
      </el-option>
    </el-option-group>
    <el-option-group label="历史记录" class="history-group">
      <el-option
        v-for="item in historys"
        :key="item.Id"
        :label="item.Name"
        :value="item.Id"
      >
      </el-option>
    </el-option-group>
  </el-select>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import router from '@/untils/router.ts'
import API from '@/apis/base-api.ts'
import { IPersonalMenuTree } from '@/interfaces/IPersonalMenuTree'
import { useMenuHistoryStore } from '@/stores/menuHistoryStore.ts'

const text = ref('')
const menus = ref<IPersonalMenuTree[]>([]) // 原始菜单列表
const results = ref<IPersonalMenuTree[]>([]) // 当前搜索记录
const menuHistoryStore = useMenuHistoryStore()

const historys = computed(() => {
  return menus.value?.filter(w => menuHistoryStore.historys.includes(w.Id))
}) // 历史搜索记录

// 查找菜单
function getMenus() {
  API.getSubMenus().then(res => {
    menus.value = res
  })
}

// 检索
function querySearch(name: string) {
  results.value =
    name === '' ? [] : menus.value?.filter(w => w.Name.includes(name))
}

// 选择菜单
function handleSelect(id: string) {
  const item = menus.value.find(w => w.Id === id)
  if (item && item?.Url.length > 0) {
    menuHistoryStore.add(item.Id)
    router.push({ path: item.Url })
  }
}

onMounted(() => {
  getMenus()
})
</script>

<style lang="scss" scoped>
.index-menu-search {
  width: 200px;

  :deep(.el-select__wrapper) {
    border-radius: 20px;
  }

  :deep(.el-input__suffix),
  :deep(.el-input__prefix) {
    display: flex;
    align-items: center;
  }

  :deep(.el-select-group) {
    width: 360px;
    padding: 0 20px;
    display: flex;
    flex-wrap: wrap;

    li {
      width: 120px;
      border-radius: 10px;
      text-align: center;

      &:hover {
        background-color: #409eff;
        color: #fff;
      }
    }
  }
}

.index-menu-search.cursor {
  .search-icon {
    cursor: pointer;

    &:hover {
      color: #409eff;
      transition: all 0.2s ease;
    }
  }
}
</style>
