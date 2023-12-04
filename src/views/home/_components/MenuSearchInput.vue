<template>
  <el-select v-model="text" remote filterable :remote-method="querySearch" :loading="loading" :automatic-dropdown="true"
    @change="handleSelect" :popper-append-to-body="false" placeholder="快速查找" class="search-input" size="small">
    <template slot="prefix">
      <font-awesome-icon fas icon="search"></font-awesome-icon>
    </template>
    <el-option-group label="搜索结果" class="result-group">
      <el-option v-for="item in results" :key="item.Id" :label="item.Name" :value="item.Id">
      </el-option>
    </el-option-group>
    <el-option-group label="历史记录" class="history-group">
      <el-option v-for="item in historys" :key="item.Id" :label="item.Name" :value="item.Id">
      </el-option>
    </el-option-group>
  </el-select>
</template>

<script>
import { ADD_MENU_HISTORY } from '../../../store/mutation-types'

// 菜单搜索
export default {
  name: 'MenuSearchInput',
  data () {
    return {
      text: '', // 文本值
      loading: false, // 加载中
      results: [] // 搜索结果
    }
  },
  computed: {
    menus () {
      return this.$store.state.menus
    },
    historys () {
      return this.$store.getters.searchMenuHistorys
    }
  },
  methods: {
    querySearch (queryString) {
      if (this.loading) return false
      this.loading = true
      this.results = queryString ? this.menus.filter(this.createFilter(queryString)) : []
      this.$nextTick(() => { this.loading = false })
    },
    createFilter (queryString) {
      return (menu) => {
        return (menu.Name.indexOf(queryString) === 0)
      }
    },
    handleSelect (id) {
      const menu = this.menus.find(w => w.Id === id)
      if (menu.Url && menu.Url.length > 0) {
        this.$store.commit(ADD_MENU_HISTORY, menu)
        this.$root.navigate({
          id: menu.Id,
          url: menu.Url,
          name: menu.Url,
          label: menu.Name,
          isBlank: menu.IsBlank || menu.OpenType === 1,
          params: menu.Params,
          icon: menu.Icon,
          isDefault: menu.IsDefault
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.search-input {
  /deep/ .el-input__inner {
    border-radius: 20px;

    &:hover {
      border-color: #409EFF;
    }
  }

  /deep/ .el-input__suffix,
  /deep/ .el-input__prefix {
    display: flex;
    align-items: center;
  }

  /deep/ .el-select-group {
      width: 360px;
      padding: 0 20px;
      display: flex;
      flex-wrap: wrap;

      li {
        width: 140px;
        border-radius: 10px;
        &:hover {
          background-color: #409EFF;
          color: #fff;
        }
      }
    }
}

.search-input.cursor {
  .search-icon {
    cursor: pointer;

    &:hover {
      color: #409EFF;
      transition: all .3s ease;
    }
  }
}
</style>
