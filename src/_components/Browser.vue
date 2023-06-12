<template>
  <div class="browser">
    <div v-if="showBar" class="browser-toolbar">
      <el-button-group class="btn-group">
        <el-button @click="goHome">
          <font-awesome-icon fas icon="home"></font-awesome-icon>
        </el-button>
        <el-button @click="refresh">
          <font-awesome-icon fas icon="redo"></font-awesome-icon>
        </el-button>
        <el-button @click="scrollTabLeft">
          <font-awesome-icon fas icon="angle-double-left"></font-awesome-icon>
        </el-button>
      </el-button-group>
      <div class="page-tabs">
        <div class="page-tabs-content">
          <div v-for="tab in tabs" :key="tab.num" :class="['tab', { active: tab.active }]" @click.stop="active(tab)">
            <font-awesome-icon v-if="tab.icon" fas :icon="tab.icon">
            </font-awesome-icon>
            <label>{{tab.label}}</label>
            <font-awesome-icon class="fork-btn" v-if="!tab.isDefault" fas icon="times" @click.stop="closeTab(tab);">
            </font-awesome-icon>
          </div>
        </div>
      </div>
      <el-button-group class="btn-group">
        <el-button @click="scrollTabRight">
          <font-awesome-icon fas icon="angle-double-right"></font-awesome-icon>
        </el-button>
        <el-dropdown trigger="click">
          <el-button type="primary">
            标签&nbsp;<font-awesome-icon fas icon="angle-down"></font-awesome-icon>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item @click.native="closeCurrentTab">关闭当前</el-dropdown-item>
            <el-dropdown-item @click.native="closeAllTabs">全部关闭</el-dropdown-item>
            <el-dropdown-item divided @click.native="closeOtherTabs">除此之外全部关闭</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-button @click="toggleFullScreen">
          <font-awesome-icon fas icon="expand-arrows-alt"></font-awesome-icon>
        </el-button>
      </el-button-group>
    </div>
    <div class="page-box">
      <spinner v-show="loading"></spinner>
      <transition v-show="!loading" name="fade">
        <keep-alive v-if="routerAlive">
          <router-view></router-view>
        </keep-alive>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Browser',
  props: {
    showBar: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      loading: false, // 页面加载中
      tabs: [],
      isfullscreen: false,
      html: '',
      routerAlive: true // 激活路由（重载UI）
    }
  },
  methods: {
    navigate (tab) {
      const exists = this.get(tab)
      if (!exists && tab.isBlank) {
        this.add(tab)
      } else {
        this.update(tab)
      }
      this.$nextTick(() => {
        this.active(tab)
      })
    },
    locationTo (url, callback) {
      // 页面跳转
      window.open(url, '_blank')
    },
    redirect (tab) {
      if (this.$router.currentRoute.name === tab.name) {
        this.$router.push({ params: { ...tab.params, tt: new Date().getTime() } })
      } else {
        this.$router.push(tab)
      }
    },
    load () {
      this.loading = true
    },
    loadDone () {
      this.loading = false
    },
    get (tab) {
      return this.tabs.find(w => w.name === tab.name)
    },
    add (tab) {
      this.tabs.push(tab)
    },
    update (tab) {
      let index = this.tabs.findIndex(w => w.name === tab.name)
      if (index < 0) {
        index = this.tabs.findIndex(w => w.active)
      }
      if (index > -1) {
        const oldTab = this.tabs[index]
        const newTab = { ...tab, label: tab.label && tab.label.length > 0 ? tab.label : oldTab.label }
        this.$set(this.tabs, index, newTab)
      } else {
        this.add(tab)
      }
    },
    active (tab) {
      this.inactive()
      const obj = this.get(tab)
      if (obj) {
        obj.active = true
        this.redirect(obj)
      }
    },
    inactive () {
      const tab = this.tabs.find(w => w.active)
      if (tab) tab.active = false
    },
    refresh () {
      this.routerAlive = false
      this.$nextTick(() => (this.routerAlive = true))
    },
    goHome () {
      const home = this.tabs[0]
      if (home) {
        this.active(home)
        this.scrollToTab($('.tab:first'))
      }
    },
    toggleFullScreen () {
      if (this.isfullscreen) {
        this.exitFullscreen()
        this.isfullscreen = false
      } else {
        this.requestFullScreen()
        this.isfullscreen = true
      }
    },
    requestFullScreen () {
      const de = document.documentElement
      if (de.requestFullscreen) {
        de.requestFullscreen()
      } else if (de.mozrequestFullScreen) {
        de.mozrequestFullScreen()
      } else if (de.webkitrequestFullScreen) {
        de.webkitrequestFullScreen()
      }
    },
    exitFullscreen () {
      const de = document
      if (de.exitFullscreen) {
        de.exitFullscreen()
      } else if (de.mozCancelFullScreen) {
        de.mozCancelFullScreen()
      } else if (de.webkitCancelFullScreen) {
        de.webkitCancelFullScreen()
      }
    },
    closeOtherTabs () {
      const tab = this.tabs.find(w => w.active)
      this.closeAllTabs()
      this.$nextTick(() => {
        $('.page-tabs').css('margin-left', '0')
        this.navigate(tab)
      })
    },
    closeAllTabs () {
      this.tabs.splice(0, this.tabs.length)
      $('.page-tabs').css('margin-left', '0')
    },
    closeCurrentTab () {
      const tab = this.tabs.find(w => w.active)
      this.closeTab(tab)
    },
    closeTab (tab) {
      let activeIndex = -1
      const del = this.tabs.findIndex(w => w.name === tab.name)

      if (tab.active) {
        if (this.tabs.length - 1 > del) {
          activeIndex = del // 激活后一位元素
        } else if (this.tabs.length - 2 >= 0) {
          activeIndex = del - 1 // 激活前一位元素
        }
      }
      this.tabs.splice(del, 1)
      this.$nextTick(() => {
        if (activeIndex > -1) this.active(this.tabs[activeIndex])
        this.scrollToTab($('.tab.active'))
      })
    },
    scrollTabLeft () {
      const scroll = this.getScrollBar()
      const marginLeftVal = Math.abs(scroll.tabBarOffset)
      let scrollVal = 0
      if (scroll.tabsWidth > 0) {
        let offsetVal = 0
        let overOffset = 0
        let tabElement = $('.tab:first')
        while (overOffset <= marginLeftVal || overOffset <= scroll.tabBarWidth) {
          offsetVal += $(tabElement).outerWidth(true)
          tabElement = $(tabElement).next()
          overOffset = offsetVal + $(tabElement).outerWidth(true)
        }
        scrollVal = 0 - this.calSumWidth($(tabElement).prevAll())
        this.scrollTab(scrollVal)
      }
    },
    scrollTabRight () {
      let scrollVal = 0
      const scroll = this.getScrollBar()
      const marginLeftVal = Math.abs(scroll.tabBarOffset)
      if (scroll.tabsWidth < 1 || marginLeftVal < 1) {
        let offsetVal = 0
        let tabElement = $('.tab:first')
        while (
          offsetVal + $(tabElement).outerWidth(true) < scroll.tabBarWidth &&
          tabElement.length > 0
        ) {
          offsetVal += $(tabElement).outerWidth(true)
          tabElement = $(tabElement).next()
        }
        scrollVal = marginLeftVal - this.calSumWidth($(tabElement).prevAll())
        this.scrollTab(scrollVal)
      }
    },
    scrollToTab (element) {
      const scroll = this.getScrollBar()
      const marginLeftVal = Math.abs(parseInt(scroll.tabBarOffset))
      if (scroll.tabsWidth < scroll.tabBarWidth) {
        return false
      } else {
        let tabElement = $('.tab:first')
        let offsetVal = 0
        while (!tabElement.is(element) && tabElement.length > 0) {
          offsetVal += $(tabElement).outerWidth(true)
          tabElement = $(tabElement).next()
        }
        if (offsetVal <= marginLeftVal) this.scrollTabRight()
        else this.scrollTabLeft()
      }
    },
    getScrollBar () {
      return {
        tabsWidth: this.calSumWidth($('.page-tabs').find('.tab')),
        tabBarWidth: $('.page-tabs').outerWidth(true),
        tabBarOffset: parseInt($('.page-tabs-content').css('margin-left'))
      }
    },
    scrollTab (offset) {
      $('.page-tabs-content').animate({ marginLeft: offset + 'px' }, 'fast')
    },
    calSumWidth (elements) {
      let width = 0
      elements.each((i, e) => {
        width += $(e).outerWidth(true)
      })
      return width
    }
  }
}
</script>

<style lang="scss" scoped>
$toolbar-height:50px;
$rem: .75rem;

.browser {
  flex: 1;
  display: flex;
  flex-direction: column;
  font-size: $rem;

  /deep/ .browser-toolbar {
    height: $toolbar-height;
    display: flex;
    justify-content: space-between;

    button {
      min-width: $toolbar-height;
      height: $toolbar-height;
      border-radius: 0;
      border: 0;
      margin: 0;
    }

    .btn-group {
      z-index: 99;
    }

    .page-tabs {
      flex-grow: 1;
      height: $toolbar-height;
      position: relative;

      .page-tabs-content {
        position: absolute;
        left: 0;
        display: inline-flex;
        justify-content: flex-start;
        align-items: flex-end;
        height: 100%;
        width: 9999px;

        .tab {
          padding: 0 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 100%;
          cursor: pointer;

          label {
            cursor: pointer;
            padding: 0 10px 0 5px;
          }

          .fork-btn {
            padding-left: 0.25rem;
          }
        }
      }
    }

    .el-button-group {
      display: flex;
    }
  }

  .page-box {
    flex: 1;
    padding: 20px;
  }
}

.fade-enter-active,
.fade-leave-avtive {
  transition: opacity 1s
}

.fade-enter,
.fade-leave-to {
  opacity: 0
}
</style>
