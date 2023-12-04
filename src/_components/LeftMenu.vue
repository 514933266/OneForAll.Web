<template>
  <el-menu :collapse="collapse" :unique-opened="true" :default-active="activeIndex" @select="clickNode" class="left-menu">
    <el-button type="primary" :icon="collapse ? 'el-icon-arrow-right' : 'el-icon-arrow-left'" circle size="mini"
      class="collapse-icon" @click="collapse = !collapse" />
    <div class="logo-title" v-show="!collapse">
      <el-image :src="require('../assets/img/logo-title.png')" />
    </div>
    <div class="login-title-min" v-show="collapse">
      <el-image :src="require('../assets/img/logo-title-min.png')" />
    </div>
    <div class="menu-box">
      <el-menu-item :index="homeItem.Id" ref="homeMenu">
        <font-awesome-icon fas :icon="homeItem.Icon" class="icon"></font-awesome-icon>
        <span class="menu-name">{{homeItem.Name}}</span>
      </el-menu-item>
      <menu-item :isModule="isModule" :list="list" :collapse="collapse"></menu-item>
    </div>
  </el-menu>
</template>

<script>
import MenuItem from './LeftMenuItem'
import { WELCOME } from '../router/base-router'
import { ADD_BREADCRUMB_HISTORY } from '../store/mutation-types'

// 左菜单
export default {
  name: 'LeftMenu',
  props: {
    value: {
      type: Array
    },
    // 是否组件模式
    isModule: { type: Boolean }
  },
  data () {
    return {
      collapse: false, // 菜单折叠
      loading: false, // 加载中
      list: [],
      homeItem: {
        Id: '0',
        Name: '首页',
        Type: 2,
        OpenType: 1,
        Icon: 'home',
        Url: WELCOME.name,
        IsDefault: true,
        Children: []
      }
    }
  },
  computed: {
    activeIndex () {
      return this.$store.state.activeMenuIndex
    }
  },
  watch: {
    value (newValue) {
      this.list = newValue
    }
  },
  methods: {
    init () {
      if (this.loading) return false
    },
    clickNode (index) {
      const path = (index === '0' ? [this.homeItem] : [])
      const menu = (index === '0' ? this.homeItem : this.findMenu(this.list, index, path))
      const mode = this.checkMode(menu)
      if (mode.moudle) {
        return false
      } else if (mode.location) {
        window.location.href = menu.Url
      } else {
        this.navigateTo(menu)
      }
      this.$nextTick(() => {
        this.$store.commit(ADD_BREADCRUMB_HISTORY, path.reverse())
      })
    },
    findMenu (menus, id, path) {
      let item
      if (!menus) return false
      for (let index = 0; index < menus.length; index++) {
        const element = menus[index]
        if (element.Id === id) {
          item = element
          path.push(element)
          break
        } else {
          const deep = this.findMenu(element.Children, id, path)
          if (deep) {
            item = deep
            path.push(element)
            break
          }
        }
      }
      return item
    },
    checkMode (menu) {
      const m1 = /^component:(http|https):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/gi
      const m2 = /^(http|https):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/gi
      // url有组件标识或类型为组件
      const isMoudle = m1.test(menu.Url) || menu.Type === 1
      if (isMoudle) return { moudle: true }
      const isLocation = m2.test(menu.Url)
      if (isLocation) return { location: true }
      return { route: true }
    },
    navigateTo (menu) {
      if (menu.Method) {
        menu.Method()
      } else {
        // 将菜单权限加入路由参数，实现控制页面按钮操作功能
        if (!menu.Params && menu.Permissions) {
          const perms = {}
          menu.Permissions.forEach(e => { perms[e] = true })
          Object.assign(menu, { Params: { Permissions: perms } })
        }
        this.postNavigate(menu)
      }
    },
    postNavigate (menu) {
      if (menu.Url && menu.Url.length > 0) {
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
  },
  components: { MenuItem }
}
</script>

<style lang="scss" scoped>
$left-width: 220px;
$left-collapse-width: 100px;

.left-menu {
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.05);
  height: 100%;

  .collapse-icon {
    position: absolute;
    top: 29px;
    right: -10px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    font-size: 12px;
    z-index: 99999;
  }

  .logo-title {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
    margin: 0 20px;
    border-bottom: 1px solid #eaebec;

    .el-image {
      height: 40px;
      width: 150px;
    }
  }

  .login-title-min {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 0 29px;

    .el-image {
      width: 43px;
      height: 29px;
    }
  }
}

.left-menu.close {
  display: none;
}

.el-menu {
  z-index: 1;

  &:not(.el-menu--collapse) {
    width: $left-width;
  }
}

.menu-box {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -ms-overflow-style: none;
  overflow: -moz-scrollbars-none;
  scrollbar-width: none;
}

.menu-box::-webkit-scrollbar {
  width: 0 !important;
}

.el-menu--collapse {
  width: $left-collapse-width;
}
</style>
