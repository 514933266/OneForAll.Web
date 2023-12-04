<template>
  <el-container class="container">
    <!-- 侧边栏 -->
    <left-menu isModule :value="menus" ref="leftMenu"></left-menu>
    <!-- 右侧内容 -->
    <el-container class="main-container">
      <!-- 头部条 -->
      <el-header class="header">
        <el-row type="flex" justify="space-between" align="center">
          <el-col class="left-breadcrumb">
            <font-awesome-icon fas icon="house-user" class="icon breadcrumb"></font-awesome-icon>
            <el-breadcrumb separator="/" style="min-width:300px">
              <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.Id" class="is-link">{{item.Name}}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </el-col>
          <el-col class="tool-bar">
            <menu-search-input></menu-search-input>
            <!-- 站内信 -->
            <el-dropdown>
              <el-button class="squre-btn">
                <el-badge is-dot class="item" :hidden="msgCount < 1" size="small">
                  <font-awesome-icon fas icon="bell" class="header-icon"></font-awesome-icon>
                </el-badge>
              </el-button>
              <el-dropdown-menu slot="dropdown" class="message-card" size="small">
                <div class="message-box">
                  <div class="message-box-header">
                    <el-tabs v-model="activeName">
                      <el-tab-pane name="first">
                        <div slot="label">
                          <div class="label-box">
                            <img src="../../assets/img/infoactive.svg" v-if="activeName=='first'" />
                            <img src="../../assets/img/info.svg" v-else />
                            <span>未读</span>
                          </div>
                        </div>
                      </el-tab-pane>
                      <el-tab-pane label="配置管理" name="second">
                        <div slot="label">
                          <div class="label-box">
                            <img src="../../assets/img/infoallactive.svg" v-if="activeName=='second'" />
                            <img src="../../assets/img/infoall.svg" v-else />
                            <span>全部</span>
                          </div>
                        </div>
                      </el-tab-pane>
                    </el-tabs>
                  </div>
                  <div class="message-content">
                    <div v-for="item in messageList" :key="item.Id" @click="toMessageCenterPage" class="message-item">
                      <img src="../../assets/img/music.svg" />
                      <div style="flex:1">
                        <div class="message-title">{{item.Title}}</div>
                        <div class="message-time">{{ new Date(item.CreateTime).toString('yyyy年MM月dd日 hh:mm')}}</div>
                      </div>
                    </div>
                  </div>
                  <div class="message-box-bottom">
                    <el-button type="text">全部已读</el-button>
                    <div @click="toMessageCenterPage" class="more-btn">查看全部</div>
                  </div>
                </div>
              </el-dropdown-menu>
            </el-dropdown>
            <el-dropdown>
              <!-- 工作日程 -->
              <el-button class="squre-btn">
                <el-badge is-dot class="item" :hidden="calendarDatas.length < 1" size="small">
                  <font-awesome-icon fas icon="calendar-minus" class="header-icon"></font-awesome-icon>
                </el-badge>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-calendar style="width:600px" class="header-calendar" v-model="scheduleDate">
                  <!-- 这里使用的是 2.5 slot 语法，对于新项目请使用 2.6 slot 语法-->
                  <template slot="dateCell" slot-scope="{date, data}">
                    <el-tooltip v-if="getScheduleData(data.day)" :content="getScheduleData(data.day)" placement="top">
                      <div class="date-box">{{ data.day.split('-')[2] }}
                        <font-awesome-icon fas icon="flag" class="ofa-text-warning"></font-awesome-icon>
                      </div>
                    </el-tooltip>
                    <div v-else class="date-box">{{ data.day.split('-')[2] }} </div>
                  </template>
                </el-calendar>
              </el-dropdown-menu>
            </el-dropdown>
            <user-card></user-card>
          </el-col>
        </el-row>
      </el-header>
      <!-- 内容区域 -->
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
import OA_API from '../../apis/oa-api'
import auth from '../../untils/oauth'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import Browser from '../../_components/Browser'
import LeftMenu from '../../_components/LeftMenu'
import MenuSearchInput from './_components/MenuSearchInput'
import UserCard from './_components/UserCard'
import Moudle from '../../_components/RemoteMoudleLoader'
import { LOGIN, INDEX, MESSAGE_CENTER, WELCOME } from '../../router/base-router'
import { ADD_MODULE, SET_MENUS } from '../../store/mutation-types'

export default {
  name: INDEX.name,
  data () {
    return {
      loading: false, // 加载中
      logining: false, // 重新登录中
      menus: [], // 菜单列表
      activeName: 'first',
      searchMenuName: '', // 搜索的菜单名称
      messageList: [], // 消息列表
      moudleLoadNum: 0, // 模块加载完成数量
      refreshTokenInterval: {}, // token刷新间隔
      scheduleDate: new Date(), // 日程日期
      calendarDatas: [], // 日程
      tabtext: '（今天）'
    }
  },
  computed: {
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
    },
    breadcrumbs () {
      return this.$store.getters.breadcrumbs
    }
  },
  watch: {
    modules () {
      this.$refs.leftMenu.init()
    }
  },
  methods: {
    init () {
      if (!this.$store.getters.access_token ||
        this.$store.getters.access_token.length < 1 ||
        this.domain === '') {
        this.$router.push(LOGIN)
        return
      }
      if (!this.loading) {
        this.loading = true
        NProgress.start()
        this.refreshToken()
        this.getMenus()
        this.getUserMessage()
        this.getPersonalSchedules()
      }
    },
    getMenus () {
      const url = this.$root.getApi(API.KEY, API.PERSONAL.MENU)
      this.axios.get(url)
        .then(response => {
          this.menus = response
          this.$store.commit(SET_MENUS, response)
          this.loadMoudles()
          this.loadMoudleDone(0)
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
    refreshToken () {
      clearInterval(this.refreshTokenInterval)
      this.refreshTokenInterval = setInterval(() => {
        auth.refreshToken()
      }, 1000 * 60 * 2)
    },
    loadingDone () {
      NProgress.done()
      this.loading = false
      this.$nextTick(() => {
        this.$refs.leftMenu.clickNode(WELCOME.id)
      })
    },
    getPersonalSchedules () {
      const url = this.$root.getApi(OA_API.KEY, OA_API.PERSONAL_SCHEDULE.DATE(this.scheduleDate))
      this.axios.get(url).then(response => {
        this.calendarDatas = response
      })
    },
    getScheduleData (day) {
      return this.calendarDatas.find(w => new Date(w.SettingDate).toString('yyyy-MM-dd') === day)?.Content
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
    this.$nextTick(() => {
      // 点击上个月
      const prevBtn1 = document.querySelector('.el-calendar__button-group .el-button-group>button:nth-child(1)')
      prevBtn1.addEventListener('click', () => {
        this.tabtext = '（上个月）'
      })
      // 点击今天
      const prevBtn2 = document.querySelector('.el-calendar__button-group .el-button-group>button:nth-child(2)')
      prevBtn2.addEventListener('click', () => {
        this.tabtext = '（今天）'
      })
      // 点击下个月
      const prevBtn3 = document.querySelector('.el-calendar__button-group .el-button-group>button:nth-child(3)')
      prevBtn3.addEventListener('click', () => {
        this.tabtext = '（下个月）'
      })
    })
  },
  components: { Browser, LeftMenu, Moudle, MenuSearchInput, UserCard }
}
</script>

<style lang="scss" scoped>
$top-height: 78px;

.container {
  height: 100%;
}

.header {
  background: #fff;
  padding: 0 30px;
  height: $top-height !important;

  .breadcrumb {
    margin-right: 10px;
    color: #409eff;
    vertical-align: middle;
  }

  /deep/ .el-breadcrumb__separator,
  /deep/ .el-breadcrumb__inner {
    color: #a7abba;
  }

  .title {
    display: flex;
    align-items: center;
    font-size: 1.25rem;
    width: 300px;
    background-color: #303133;
  }

  .left-breadcrumb {
    display: flex;
    align-items: center;

    .el-breadcrumb__item {
      display: flex;
      align-items: center;
    }

    .icon {
      width: 20px;
      height: 20px;
    }
  }

  .tool-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: $top-height;

    .inline-input {
      box-sizing: border-box;
      margin-right: 18px;

      /deep/ .el-input__inner {
        border-radius: 100px;
        width: 220px;
        height: 38px;
      }

      /deep/ .el-input__icon {
        line-height: 38px;
      }
    }

    .squre-btn {
      padding: 12px;
      border: none;
      border-radius: 0;
      background: transparent;
    }
  }
}

.date-box {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
}
.date-yuan {
    width: 8px;
    height: 8px;
    background: #409eff;
    border-radius: 50%;
  }

.el-popover {
  padding: 0 !important;
}

.message-card {
  padding: 0;
}

.message-box {
  box-sizing: border-box;
  width: 470px;
  font-size: 0.75rem;
  padding: 10px 0 30px;

  /deep/ .el-tabs__item {
    height: 60px;
    line-height: 60px;
  }

  .label-box {
    display: flex;
    align-items: center;

    img {
      margin-right: 10px;
    }
  }

  .message-content {
    box-sizing: border-box;
    padding: 30px;
    height: 430px;
    margin-bottom: 20px;
    overflow-y: auto;
    overflow-x: hidden;
    -ms-overflow-style: none;
    overflow: -moz-scrollbars-none;
    scrollbar-width: none;
  }

  .message-content::-webkit-scrollbar {
    width: 0 !important;
  }

  .message-item {
    display: flex;
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s ease-in;
    border-radius: 16px;

    &:hover {
      background: #f7f8fc;
    }

    img {
      width: 50px;
      height: 50px;
      margin-right: 20px;
    }
  }

  .message-title {
    font-size: 16px;
    font-weight: 500;
    color: #2e3543;
    line-height: 24px;
    margin-bottom: 6px;
  }

  .message-con {
    font-size: 14px;
    font-weight: 500;
    color: #a7abba;
    line-height: 20px;
    margin-bottom: 24px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    -o-text-overflow: ellipsis;
  }

  .message-time {
    font-size: 12px;
    font-weight: 500;
    color: #a7abba;
    line-height: 18px;
  }

  .message-box-header {
    padding: 0 30px;
  }

  .message-empty {
    text-align: center;
    padding: 20px;
    color: #999;
  }

  .message-box-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30px;

    .more-btn {
      padding: 10px 20px;
      background: #f7f8fc;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      color: #69708b;
      line-height: 20px;
      cursor: pointer;
    }
  }
}

.main-container {
  overflow-x: hidden;
  overflow-y: auto;

  .right-content {
    overflow: hidden;
    padding: 0;
  }
}

.header-calendar {
  .dot {
    width: 6px;
    height: 6px;
    background: #409eff;
    border-radius: 50%;
    margin-right: 5px;
  }

  .is-selected {
    font-size: 12px;
    color: #409eff;
  }

  .calendar-text {
    display: flex;
    align-items: center;
    font-size: 12px;
  }

  .text-act {
    margin-left: 10px;
    color: #409eff;
    font-size: 12px;
  }

  .c409eff {
    color: #409eff;
  }
}

/deep/ .header-calendar .el-calendar-table thead th:before {
  content: '周';
}

/deep/ .header-calendar .el-calendar__body {
  padding: 0 15px 10px;
}

/deep/ .header-calendar .el-calendar-table .el-calendar-day {
  box-sizing: border-box;
  height: 62px;
  width: 81px;
  padding: 0;

  .bg {
    box-sizing: border-box;
    height: 62px;
    width: 81px;
    padding: 6px 0 0 6px;
  }

  .setbg {
    background: #ecf5ff;
  }
}
</style>
