<template>
  <div>
    <div v-for="item in list" :key="item.Id">
      <el-submenu v-if="item.Children.length > 0" v-show="checkVisiable(item)" :class="['left-menu-item', { collapse: collapse }]" :index="item.Id"
        @click.native="clickNode(item)">
        <template slot="title">
          <font-awesome-icon fas :icon="item.Icon" class="icon"></font-awesome-icon>
          <span class="menu-name">{{ item.Name}}</span>
        </template>
        <left-menu-item :list="item.Children" @select="clickNode"></left-menu-item>
      </el-submenu>
      <el-menu-item v-else :class="['left-menu-item', { collapse: collapse }]" :index="item.Id"
        @click.native="clickNode(item)">
        <font-awesome-icon fas :icon="item.Icon" class="icon"></font-awesome-icon>
        <span class="menu-name">{{item.Name}}</span>
      </el-menu-item>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LeftMenuItem',
  props: {
    // 数据源
    list: {
      type: Array
    },
    // 是否折叠
    collapse: {
      type: Boolean,
      default: false
    },
    // 是否组件模式
    isModule: { type: Boolean }
  },
  computed: {
    modules () {
      return this.$store.state.modules
    }
  },
  methods: {
    clickNode (item) {
      this.$emit('select', item)
    },
    checkVisiable (item) {
      // 每个模块加载会向全局注册菜单，如果存在则代表加载完成
      if (this.isModule && item.Type === 1) {
        const index = this.modules.findIndex(w => w.Id === item.Id && !w.loading)
        if (index < 0) {
          return false
        }
      }
      return true
    }
  }
}
</script>

<style lang="scss" scoped>
.el-submenu__title,
.el-menu-item {
  height: 50px;
  line-height: 50px;

  .icon {
    width: 20px;
    height: 20px;
  }
}

.menu-name {
  margin-left: 10px;
}
/deep/ .collapse {
  .menu-name,
  .el-icon-arrow-right {
    display: none;
  }
}
</style>
