<template>
  <el-drawer title="我是标题" :visible.sync="drawerVisiable" size="70%" :with-header="false" :modal-append-to-body="false"
    custom-class="left-menu-v2" ref="drawer" direction="ltr" style="margin-top:50px;">
    <div class="main-pannel">
      <el-menu class="left-pannel" :default-openeds="openIndexs">
        <el-submenu index="1">
          <template slot="title">
            <font-awesome-icon fas icon="th" class="icon"></font-awesome-icon>
            <span class="menu-name">我的工作台</span>
          </template>
          <el-menu-item v-for="item in value" :key="item.Id" :index="item.Id" @click.native="select(item)">
            <font-awesome-icon fas :icon="item.Icon" class="icon"></font-awesome-icon>
            <label class="menu-name">{{item.Name}}</label>
          </el-menu-item>
        </el-submenu>
      </el-menu>
      <!-- 右边二级菜单内容 -->
      <div class="right-pannel">
        <div class="search-pannel">
          <el-input size="small" placeholder="请输入关键词" class="search-input">
            <i slot="prefix" class="el-input__icon el-icon-search"></i>
          </el-input>
        </div>
        <div class="recent-pannel sub-menu-pannel">
          <div class="title">最近访问</div>
          <div class="menu-box">
            <div class="menu-item">访问菜单1<font-awesome-icon fas icon="star" class="star ofa-text-warning">
              </font-awesome-icon>
            </div>
            <div class="menu-item">访问菜单2<font-awesome-icon fas icon="star" class="star ofa-text-warning">
              </font-awesome-icon>
            </div>
            <div class="menu-item">访问菜单2<font-awesome-icon fas icon="star" class="star ofa-text-warning">
              </font-awesome-icon>
            </div>
            <div class="menu-item">访问菜单2<font-awesome-icon fas icon="star" class="star ofa-text-warning">
              </font-awesome-icon>
            </div>
            <div class="menu-item">访问菜单2<font-awesome-icon fas icon="star" class="star ofa-text-warning">
              </font-awesome-icon>
            </div>
            <div class="menu-item">访问菜单2<font-awesome-icon fas icon="star" class="star ofa-text-warning">
              </font-awesome-icon>
            </div>
            <div class="menu-item">访问菜单2<font-awesome-icon fas icon="star" class="star ofa-text-warning">
              </font-awesome-icon>
            </div>
            <div class="menu-item">访问菜单2<font-awesome-icon fas icon="star" class="star ofa-text-warning">
              </font-awesome-icon>
            </div>
            <div class="menu-item">访问菜单2<font-awesome-icon fas icon="star" class="star ofa-text-warning">
              </font-awesome-icon>
            </div>
            <div class="menu-item">访问菜单2<font-awesome-icon fas icon="star" class="star ofa-text-warning">
              </font-awesome-icon>
            </div>
          </div>
        </div>
        <div class="sub-pannel sub-menu-pannel">
          <div v-for="item in subMenus" :key="item.Id" class="sub-menu-item">
            <div class="title">{{item.Name}}</div>
            <div class="menu-box">
              <div v-for="item2 in item.Children" :key="item2.Id" class="menu-item">
                {{item2.Name}}
                <font-awesome-icon fas icon="star" class="star ofa-text-warning"></font-awesome-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script>

export default {
  name: 'LeftMenuV2',
  props: {
    value: {
      type: Array
    },
    // 是否折叠
    collapse: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      loading: false, // 加载中
      openIndexs: ['1'],
      moudles: [] // 加载的模块
    }
  },
  computed: {
    drawerVisiable () {
      return (!this.collapse)
    },
    subMenus () {
      var data = this.findsubMenus(this.value)
      console.log(data)
      return data
    }
  },
  methods: {
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
      let item = ''
      if (!menus) return false
      menus.forEach(e => {
        if (e.Id === id) {
          return (item = e)
        } else {
          const deep = this.findMenu(e.Children, id)
          if (deep) return (item = deep)
        }
      })
      return item
    },
    findsubMenus (menus) {
      let subMenus = []
      menus.forEach(e => {
        subMenus.push(e)
        if (e.Children.length > 0) {
          var items = this.findsubMenus(e.Children)
          console.log(items)
          if (items.length > 0) {
            subMenus = subMenus.concat(items)
          }
        }
      })
      return subMenus
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
  }
}
</script>

<style lang="scss" scoped>
.left-menu-v2 {

  .icon {
    width: 16px;
    height: 16px;
  }

  .menu-name {
    margin-left: 16px;
    font-size: 0.75rem;
  }
}

.main-pannel {
  display: flex;
  justify-content: flex-start;
  height: 100%;
}

.left-pannel {
  width: 250px;
  height: 100%;
  flex: 0 0 auto;
}

.right-pannel {
  padding: 30px;
  flex: 1;

  /deep/ .search-input {
    width: 100%;

    .el-input,
    input {
      width: 100%;
      border-top: 0;
      border-left: 0;
      border-right: 0;
      border-radius: 0;
    }
  }
}

.recent-pannel {
  margin-bottom: 30px;

  .menu-box {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

.sub-menu-pannel {

  .title {
    font-size: 0.75rem;
    font-weight: bold;
    color: #333;
    padding: 20px 0;
  }

  .menu-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    padding: 8px;
    margin-right: 10px;
    width: 210px;
    cursor: pointer;
    transition: all .1s ease-in;
    color: #666;

    .star {
      display: none;
    }

    &:hover {
      color: #303133;
      background: rgb(236, 245, 255);

      .star {
        display: block;
      }
    }
  }
}

.sub-pannel {
  display: flex;
  flex-wrap: wrap;
}

.sub-menu-item {
  display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
  .menu-box {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
  }
}
</style>
