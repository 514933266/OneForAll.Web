<template>
  <el-menu class="left-menu" :collapse="collapse" :unique-opened="true">
    <menu-item :isModule="isModule" :list="list" @select="select" :collapse="collapse"></menu-item>
  </el-menu>
</template>

<script>
import MenuItem from './LeftMenuItem'

// 左菜单
export default {
  name: 'LeftMenu',
  props: {
    value: {
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
  data () {
    return {
      guid: '00000000-0000-0000-0000-000000000000',
      loading: false, // 加载中
      list: []
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
    select (menu) {
      const mode = this.checkMode(menu)
      if (mode.moudle) {
        return false
      } else if (mode.location) {
        window.location.href = menu.Url
      } else {
        this.navigateTo(menu)
      }
    },
    findMenu (menus, id) {
      let item
      if (!menus) return false
      for (let index = 0; index < menus.length; index++) {
        const element = menus[index]
        if (element.Id === id) {
          item = element
          break
        } else {
          const deep = this.findMenu(element.Children, id)
          if (deep) {
            item = deep
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
          url: menu.Url,
          name: menu.Url,
          label: menu.Name,
          isBlank: menu.IsBlank || menu.OpenType === 1,
          params: menu.Params,
          icon: menu.Icon
        })
      }
    }
  },
  components: { MenuItem }
}
</script>

<style lang="scss" scoped>
$left-width: 300px;
$left-collapse-width: 60px;

.left-menu.close {
  display: none;
}

.el-menu--collapse {
  width: $left-collapse-width;
  >.left-menu-item {
    .menu-name {
      display: none;
    }
  }
}

.left-menu {
  z-index: 1;
  height: 100%;
  box-sizing: border-box;

  &:not(.el-menu--collapse):not(.close) {
    width: $left-width;
  }
}
</style>
