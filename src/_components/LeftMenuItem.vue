<template>
  <div>
    <div v-for="item in list" :key="item.Id">
      <div v-if="item.Type === 1">
        <div class="menu-name-disabled">{{item.Name}}</div>
        <left-menu-item :list="item.Children" :collapse="collapse"></left-menu-item>
      </div>
      <!-- 有子元素的item -->
      <el-submenu v-else-if="item.Children.length > 0" v-show="checkVisiable(item)" :index="item.Id">
        <template slot="title">
          <font-awesome-icon fas :icon="item.Icon" class="icon"></font-awesome-icon>
          <span class="menu-name">{{ item.Name}}</span>
        </template>
        <!-- 侧边弹出title -->
        <div v-if="collapse" class="popup-name">{{ item.Name}}</div>
        <left-menu-item :list="item.Children" :showIcon="false" :collapse="collapse">
        </left-menu-item>
      </el-submenu>
      <!-- 单个item -->
      <el-menu-item v-else :index="item.Id">
        <font-awesome-icon fas :icon="item.Icon" class="icon" v-if="showIcon"></font-awesome-icon>
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
    isModule: { type: Boolean },
    showIcon: { type: Boolean, default: true }
  },
  computed: {
    modules () {
      return this.$store.state.modules
    }
  },
  methods: {
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
.menu-name-disabled {
  font-size: .85rem;
  padding-left: 30px;
  margin: 20px 0;
  font-weight: 500;
  color: #99a9bf;
  line-height: 18px;
}

.popup-name {
  text-align: left;
  margin-left: 30px;
  font-size: 1rem;
  color: #99a9bf;
  margin-top: 10px;
  margin-bottom: 20px;
}
</style>
