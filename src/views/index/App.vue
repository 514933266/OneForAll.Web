<template>
  <el-container class="container">
    <el-header class="header">
      <el-row type="flex" justify="space-between">
        <el-col>
          <div :class="['title', menuCollapse ? 'collapse': '']">
          <el-button @click="menuCollapse=!menuCollapse" type="primary" class="toggle-button">
            <font-awesome-icon fas icon="bars"></font-awesome-icon>
          </el-button>
          <svg t="1682349186880" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
            p-id="2987" width="200" height="200">
            <path
              d="M487.5 596.9c-63.2-37.1-126.3-74.3-189.4-111.6-3.2-1.9-5.5-2-8.9-0.1-63.1 37.3-126.2 74.6-189.4 111.7-3.4 2-4.8 4-4.8 8.1 0.2 37.2 0.1 74.3 0.1 111.5 0 37.5 0.1 75-0.1 112.5 0 3.6 0.9 5.6 4.1 7.4 63.5 37.3 126.9 74.7 190.3 112.2 3.2 1.9 5.3 1.8 8.4 0 63.4-37.5 126.8-74.9 190.3-112.2 3.2-1.9 4.2-3.8 4.2-7.4-0.1-74.5-0.1-149 0-223.4 0-4.3-1.2-6.5-4.8-8.7z m-25.3 214.9c0 3.6-1 5.5-4.2 7.4-53.6 31.5-107.2 63.1-160.7 94.7-2.7 1.6-4.7 1.8-7.5 0.1-53.6-31.8-107.3-63.4-161.1-95-2.8-1.6-3.8-3.4-3.8-6.6 0.1-31.8 0.1-63.7 0.1-95.5 0-31.8 0.1-63.7-0.1-95.5 0-3.5 1.1-5.3 4.1-7 53.5-31.4 106.9-62.9 160.2-94.5 3.1-1.8 5.3-1.9 8.5 0 53.3 31.6 106.8 63.1 160.2 94.4 3.1 1.8 4.2 3.8 4.2 7.4 0 63.4 0 126.7 0.1 190.1zM710.5 419.7c-0.1-75-0.1-150 0-224.9 0-3.4-1-5.2-4-7-63.6-37.4-127.2-74.9-190.7-112.4-2.7-1.6-4.6-1.8-7.5-0.1C444.7 113 380.9 150.5 317.2 188c-3.1 1.8-3.8 3.8-3.8 7.1 0.1 37.3 0.1 74.6 0.1 112 0 37.7 0 75.3-0.1 113 0 3.3 1 5 3.8 6.6 63.8 37.5 127.5 75 191.1 112.7 2.9 1.7 4.8 1.6 7.5-0.1 63.5-37.6 127.1-75 190.7-112.4 2.9-1.9 4-3.8 4-7.2z m-34.5-9.8c-53.3 31.3-106.6 62.7-159.8 94.2-3.1 1.9-5.3 1.9-8.5 0-53.3-31.6-106.7-63.1-160.2-94.5-3.1-1.8-4.2-3.8-4.2-7.4 0.1-63.3 0.1-126.6 0-190 0-3.6 1-5.5 4.2-7.4 53.6-31.5 107.2-63.1 160.7-94.7 2.7-1.6 4.7-1.7 7.5-0.1 53.5 31.7 107 63.3 160.6 94.7 3.2 1.9 4.2 3.8 4.2 7.4-0.2 31.7-0.1 63.3-0.1 95 0 31.7-0.1 63.3 0.1 95 0.1 3.9-1.3 5.9-4.5 7.8zM928.9 716.9c0-37.5 0-75 0.1-112.5 0-3.1-0.6-5-3.6-6.8-63.8-37.5-127.5-75-191.2-112.7-2.4-1.4-4.2-2.1-7.1-0.4-63.8 37.8-127.7 75.4-191.6 113-2.9 1.7-3.7 3.5-3.7 6.7 0.1 75 0.1 150 0 225 0 3.4 1 5.3 4 7 63.6 37.4 127.2 74.9 190.8 112.4 2.7 1.6 4.7 1.8 7.6 0.1C797.9 911 861.6 873.5 925.4 836c2.8-1.7 3.7-3.4 3.7-6.7-0.2-37.4-0.2-74.9-0.2-112.4z m-30 0c0 31.7 0 63.3 0.1 95 0 3.3-0.8 5.3-3.8 7.1-53.8 31.5-107.4 63.2-161.1 95-2.9 1.7-4.8 1.5-7.5-0.1-53.5-31.7-107-63.2-160.7-94.7-3.2-1.9-4.1-3.9-4.1-7.5 0.1-63.3 0.1-126.6 0-189.9 0-3.6 1.1-5.6 4.2-7.4 53.3-31.3 106.6-62.7 159.8-94.2 3.6-2.1 6-1.8 9.3 0.2C788 551.6 841 582.8 894 613.9c3.6 2.1 5 4.2 5 8.5-0.2 31.5-0.1 63-0.1 94.5z"
              p-id="2988" :fill="menuCollapse ? '#409eff' : '#fff'"></path>
          </svg>
          <el-divider direction="vertical"></el-divider>
          <el-button @click="toWelcomePage" type="text" class="title-name">蜂窝办公</el-button>
          </div>
        </el-col>
        <el-col class="tool-bar">
          <!-- 站内信 -->
          <el-dropdown>
            <el-button class="squre-btn">
              <el-badge is-dot class="item" :hidden="msgCount < 1">
                <font-awesome-icon fas icon="bell"></font-awesome-icon>
              </el-badge>
            </el-button>
            <el-dropdown-menu slot="dropdown" class="message-card">
              <div class="message-box">
                <div class="message-box-header">
                  站内消息通知
                </div>
                <div v-show="messageList.length == 0" class="message-empty">
                  暂无消息
                </div>
                <div v-for="item in messageList" :key="item.Id" @click="toMessageCenterPage" class="message-item">
                  <span class="message-title">{{item.Title}}</span>
                  <span
                    class="message-time ofa-text-grey">{{ new Date(item.CreateTime).toString('yyyy年MM月dd日 hh:mm')}}</span>
                </div>
                <div class="message-box-bottom">
                  <el-button @click="toMessageCenterPage" type="text" class="ofa-button">查看更多</el-button>
                </div>
              </div>
            </el-dropdown-menu>
          </el-dropdown>
          <el-button-group>
            <!-- 工作日程 -->
            <el-button class="squre-btn">
              <el-badge is-dot class="item" :hidden="scheduleCount < 1">
                <font-awesome-icon fas icon="calendar-alt"></font-awesome-icon>
              </el-badge>
            </el-button>
          </el-button-group>
          <el-image :src="domain + user.IconUrl" @click="toPersonalPage" class="user-icon">
            <div slot="error" class="image-slot">
              <img src="../../assets/img/user-icon.png" />
            </div>
          </el-image>
          <el-dropdown>
            <el-button class="el-dropdown-link user-btn">
              {{user.Name}}<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown" class="user-card">
              <div class="card-header">
                <label>我的名片</label>
                <el-button type="text" @click="toPersonalPage">个人中心</el-button>
              </div>
              <div class="card-content">
                <el-image :src="domain + user.IconUrl">
                  <div slot="error" class="image-slot">
                    <img src="../../assets/img/user-icon.png" />
                  </div>
                </el-image>
                <ul class="user-info">
                  <li>
                    <font-awesome-icon fas icon="building"></font-awesome-icon><label>{{user.TenantName}}</label>
                  </li>
                  <li>
                    <font-awesome-icon fas icon="user"></font-awesome-icon><label>{{user.Name}}
                      ({{user.UserName}})</label>
                  </li>
                  <li>
                    <font-awesome-icon fas icon="signature"></font-awesome-icon>
                    <label>{{user.Signature}}</label>
                  </li>
                </ul>
              </div>
              <div class="card-bottom">
                <el-button @click="logout">{{logouting ? '安全退出中...' : '退出登录'}}</el-button>
              </div>
            </el-dropdown-menu>
          </el-dropdown>
        </el-col>
      </el-row>
    </el-header>
    <el-container class="main-container">
      <div class="left-content">
      <left-menu isModule :value="menus" :collapse="menuCollapse" ref="leftMenu"></left-menu>
      </div>
      <el-main class="right-content">
        <browser ref="browser"></browser>
        <el-backtop :bottom="40" target=".main-container"></el-backtop>
      </el-main>
    </el-container>
    <!-- 远程模块 -->
    <moudle v-for="item in modules" :key="item.Id" :id="item.Id" :jss="item.scripts" :csss="item.csss"></moudle>
  </el-container>
</template>

<script>
import API from '../../apis/base-api'
import auth from '../../untils/oauth'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import Browser from '../../_components/Browser'
import LeftMenu from '../../_components/LeftMenu'
import Moudle from '../../_components/RemoteMoudleLoader'
import { INDEX, LOGIN, MESSAGE_CENTER, PERSONAL } from '../../router/base-router'
import { CLEAR_LOGIN, SET_USER, SET_TENANT, ADD_MODULE } from '../../store/mutation-types'

export default {
  name: INDEX.name,
  data () {
    return {
      loading: false, // 加载中
      logouting: false, // 退出中
      menuCollapse: false, // 菜单折叠
      logining: false, // 重新登录中
      menus: [], // 菜单列表
      messageList: [], // 消息列表
      moudleLoadNum: 0, // 模块加载完成数量
      scheduleCount: 0, // 日程数量
      refreshTokenInterval: {}
    }
  },
  computed: {
    user () {
      return this.$store.state.user
    },
    tenant () {
      return this.$store.state.tenant
    },
    domain () {
      return this.$root.getApiDomain(API.KEY)
    },
    msgCount () {
      return this.messageList.length
    },
    modules () {
      return this.$store.state.modules
    }
  },
  watch: {
    modules () {
      this.$refs.leftMenu.init()
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => vm.init())
  },
  methods: {
    init () {
      if (!this.$store.getters.access_token || this.$store.getters.access_token.length < 1) {
        this.loadingDone()
        this.logout()
      }
      if (this.loading) return false
      this.loading = true
      NProgress.start()
      this.refreshToken()
      this.getUser()
      this.getMenus()
      this.getUserMessage()
    },
    getMenus () {
      const url = this.$root.getApi(API.KEY, API.PERSONAL.MENU)
      this.axios.get(url)
        .then(response => {
          this.menus = response
          this.loadMoudles()
          this.loadMoudleDone(0)
        })
    },
    getUser () {
      const url = this.$root.getApi(API.KEY, API.PERSONAL.URL)
      this.axios.get(url)
        .then(response => {
          this.$store.commit(SET_USER, response)
          this.$store.commit(SET_TENANT, {
            Id: response.TenantId,
            Name: response.TenantName
          })
        })
    },
    getUserMessage () {
      const url = this.$root.getApi(API.KEY, API.PERSONAL_MESSAGE.URL)
      this.axios.get(`${url}/10`)
        .then(response => {
          this.messageList = response
        })
    },
    loadMoudles () {
      const ms = this.findMoudles()
      if (ms.length > 0) {
        ms.forEach(e => { this.loadMoudle(e) })
      } else {
        this.loadingDone()
      }
    },
    findMoudles () {
      const arr = []
      this.menus.forEach(e => {
        if (this.checkMode(e)) {
          arr.push(e)
        }
      })
      return arr
    },
    loadMoudle (menu) {
      const index = this.modules.findIndex(w => w.Id === menu.Id)
      if (index < 0) {
        const url = menu.Url.replace('component:', '')
        this.axios.get(url).then((html) => {
          const page = this.parsingHtml(url, html)
          const m = {
            loading: true,
            ...menu,
            ...page
          }
          this.$store.commit(ADD_MODULE, m)
        })
      }
    },
    checkMode (menu) {
      const m1 = /^component:(http|https):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/gi
      return m1.test(menu.Url) || menu.Type === 1
    },
    parsingHtml (url, html) {
      // 解析内容页中的css/js引用，并插入父页面文档底部
      let temp = []
      let text = html
      const page = { url: url, content: html, scripts: [], csss: [] }
      const regScript = /<script[\s]+(?:[^>]+=[\s]*[^>]+)*(?:src[\s]*=[\s]*['|"]?([^>]+(?:\.js))['|"]?)><\/script>/i
      while ((temp = regScript.exec(text)) != null) {
        text = text.replace(temp[0], '')
        if (temp[1] && temp[1].length > 0) {
          const src = url + temp[1]
          const index = page.scripts.findIndex(w => w === src)
          if (index < 0) {
            page.scripts.push(src)
          }
        }
      }
      const regCss = /<link[^>]+(?:href=['|"]?([^>]+(?:\.css))['|"]?)[^>]*>/i
      temp = []
      text = html
      while ((temp = regCss.exec(text)) != null) {
        text = text.replace(temp[0], '')
        if (temp[1] && temp[1].length > 0) {
          const href = url + temp[1]
          const index = page.csss.findIndex(w => w === href)
          if (index < 0) {
            page.csss.push(href)
          }
        }
      }
      return page
    },
    loadMoudleDone (nprogressTryCount) {
      if (this.modules.findIndex(w => w.loading) > -1 && nprogressTryCount < 6) {
        setTimeout(() => {
          // 每5秒检查一次模块是否全部加载完成
          nprogressTryCount++
          this.loadMoudleDone(nprogressTryCount)
        }, 3000)
      } else {
        this.loadingDone()
      }
    },
    logout () {
      if (!this.logouting) {
        this.logouting = true
        this.$store.commit(CLEAR_LOGIN)
        this.$router.push(LOGIN)
        const url = this.$root.getApi(API.KEY, API.PERSONAL.URL)
        this.axios.delete(url).then(response => {
          this.logouting = false
        })
      }
    },
    refreshToken () {
      clearInterval(this.refreshTokenInterval)
      this.refreshTokenInterval = setInterval(() => {
        auth.refreshToken()
      }, 1000 * 60 * 2)
    },
    loadingDone () {
      NProgress.done()
      this.loading = false
    },
    toPersonalPage () {
      this.$refs.browser.navigate(PERSONAL)
    },
    toWelcomePage () {
      if (window.AppData) window.AppData.navigateWelcome()
    },
    toMessageCenterPage () {
      this.$refs.browser.navigate(MESSAGE_CENTER)
    }
  },
  created () {
    this.init()
  },
  components: { Browser, LeftMenu, Moudle }
}
</script>

<style lang="scss" scoped>
$top-height:60px;

.container {
  height: 100%;
}

.header {
  padding: 0;
  border-bottom: 1px solid #ebeef5;
  background: #fff;

  .title {
    display: flex;
    align-items: center;
    font-size: 1.25rem;
    width: 300px;
    background-color: #303133;

    .toggle-button {
      width: $top-height;
      height: $top-height;
      border-radius: 0;
      border: none;
      transition: all 0.2s ease-in;
      background-color: #303133;
    }

    .icon {
      margin-left: 10px;
      height: 46px;
      width: 46px;
      color: #fff;
    }

    .title-name {
      color: #fff;
      font-size: 1.25rem !important;
    }
  }

  .title.collapse {
    background-color:#fff;
    transition: all 0.2s ease-in;

    .title-name {
      color: #409EFF;
    }
  }

  .tool-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 10px;

    .squre-btn {
      width: $top-height;
      height: $top-height;
      border: none;
      border-radius: 0;
      background: transparent;
    }

    .user-icon {
      margin-left: 10px;
      height: 40px;
      width: 40px;
      border-radius: 50%;
      cursor: pointer;

      img {
        width: 100%;
        height: 100%;
      }
    }

    .user-btn {
      padding: 0 10px 0 6px;
      height: 100%;
      border: none;
      border-radius: 0;
      background: transparent;
      cursor: pointer;
    }
  }
}

.user-card {
  width: 400px;
  font-size: .75rem;

  .card-header {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #ebeef5;
    align-items: center;
    padding: 0 10px;
  }

  .card-content {
    display: flex;
    padding: 10px;

    .el-image {
      margin-right: 15px;
      height: 25%;
      width: 25%;
      border-radius: 50%;
      border: 1px solid #ebeef5;
      vertical-align: middle;

      img {
        width: 100%;
        height: 100%;
      }
    }

    .user-info {
      li {
        list-style: none;
        padding-top: .75rem;
      }

      svg {
        margin-right: 10px;
        color: #888;
      }
    }
  }

  .card-bottom {
    border-top: 1px solid #ebeef5;

    button {
      width: 100%;
      border: none;
    }
  }
}

.el-popover {
  padding: 0 !important;
}

.message-card {
  padding: 0;
}

.message-box {
  width: 300px;
  font-size: .75rem;

  .message-item {
    display: flex;
    flex-direction: column;
    padding: 10px 0;
    border-bottom: 1px solid #EBEEF5;
    cursor: pointer;
    transition: all 0.2s ease-in;

    &:hover {
      background: #F2F6FC;
    }
  }

  .message-title {
    padding: 0 10px;
    color: #666;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    -o-text-overflow: ellipsis;
  }

  .message-time {
    padding: 0 10px;
    margin-top: 6px;
  }

  .message-box-header {
    padding: 16px 10px;
    background: #F2F6FC;
    font-size: 16px;
    border-bottom: 1px solid #EBEEF5;
  }

  .message-empty {
    text-align: center;
    padding: 20px;
    color: #999;
    border-bottom: 1px solid #EBEEF5;
  }

  .message-box-bottom {
    display: flex;
    align-items: center;
    padding: 10px;
  }
}

.main-container {
  overflow-x: hidden;
  overflow-y: auto;
  .left-content {
    height: 100%;
    background: #fff;
  }

  .right-content {
    overflow-x: hidden;
    overflow-y: auto;
    padding: 0;
  }
}
</style>
