<template>
  <div class="browser">
    <div v-if="showBar" class="browser-toolbar">
      <div class="page-tabs">
        <div class="page-tabs-content">
          <div v-for="tab in tabs" :key="tab.num" :class="['tab', { active: tab.active }]" @click.stop="active(tab)">
            <font-awesome-icon v-if="tab.icon" fas :icon="tab.icon"></font-awesome-icon>
            <label>{{tab.label}}</label>
            <font-awesome-icon class="fork-btn" v-if="!tab.isDefault" fas icon="times-circle" @click.stop="closeTab(tab)"></font-awesome-icon>
          </div>
        </div>
      </div>
    </div>
    <div class="page-box">
      <transition v-show="!loading" name="fade">
        <keep-alive v-if="routerAlive">
          <router-view></router-view>
        </keep-alive>
      </transition>
    </div>
  </div>
</template>

<script>
import { SET_ACTIVE_MENU_INDEX, SET_BREADCRUMB } from '../store/mutation-types'
// 浏览器
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
        this.active(tab)
      } else if (!exists) {
        this.redirect(tab)
        this.active(tab)
      } else if (exists) {
        this.update(tab)
        this.active(tab)
      }
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
      const index = this.tabs.findIndex(w => w.id === tab.id)
      const oldTab = tab
      const newTab = { ...tab, label: tab.label && tab.label.length > 0 ? tab.label : oldTab.label }
      this.$set(this.tabs, index, newTab)
    },
    active (tab) {
      const obj = this.get(tab)
      if (obj) {
        this.inactive()
        obj.active = true
        this.redirect(obj)
        this.$store.commit(SET_BREADCRUMB, obj.id) // 通知激活面包屑
        this.$store.commit(SET_ACTIVE_MENU_INDEX, obj.id) // 通知激活对应菜单
      }
    },
    inactive () {
      const tab = this.tabs.find(w => w.active === true)
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
$toolbar-height: 44px;

.browser {
  flex: 1;
  display: flex;
  flex-direction: column;
  font-size: 1rem;

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
        width: 100%;
        padding-left: 20px;
        box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.05);
        .tab {
          min-width: 106px;
          padding: 0 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          font-size: 1rem;

          label {
            cursor: pointer;
            padding: 0 10px 0 5px;
          }

          svg {
            width: 16px;
            height: 16px;
          }

          .fork-btn {
            width: 12px;
            height: 12px;
          }
        }
      }
    }

    .el-button-group {
      display: flex;
    }
  }

  .page-box {
    box-sizing: border-box;
    padding: 26px 30px;
    background: #f7f8fc;
    height: calc(100vh - 122px);
    overflow-x: hidden;
    overflow-y: auto;
  }
}

.fade-enter-active,
.fade-leave-avtive {
  transition: opacity 1s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
