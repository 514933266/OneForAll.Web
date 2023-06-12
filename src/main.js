/* eslint-disable */
import App from './App.vue'
import Error from './untils/error'
import { INDEX, WELCOME } from './router/base-router'
import { SET_MODULE_LOADDONE } from './store/mutation-types'

// Vue全家桶
import Vue from 'vue'
import VueCookies from 'vue-cookies'
import VueRouter from 'vue-router'
import VueAxios from 'vue-axios'
import Router from './router/router'
import Store from './store/store'
import Axios from './untils/axios'

// js支持
import 'jquery'
import './assets/js/string-helper.js'
import './assets/js/date-helper.js'
import './assets/js/drag-dialog'

// UI框架 ElementUI
import ElementUI from 'element-ui'
import '../src/assets/css/default-theme.scss'

// 字体库 Fontawesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// e-charts图表
import ECharts from 'vue-echarts'
import 'echarts/lib/chart/bar'
import 'echarts/lib/chart/line'
import 'echarts/lib/chart/pie'
import 'echarts/lib/component/tooltip'

// 打印
import Print from 'vue-print-nb'

// 全局默认配置
ElementUI.Dialog.props.closeOnClickModal.default = false
ElementUI.Dialog.props.modalAppendToBody = true
ElementUI.Select.props.popperAppendToBody = false

// 公共组件
library.add(fas)
Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.component('nodata', () => import('./_components/NoData.vue'))
Vue.component('spinner', () => import('./_components/Spinner.vue'))
Vue.component('crop-uploader', () => import('./_components/CropUploader.vue'))
Vue.component('area-cascader', () => import('./_components/AreaCascader.vue'))
Vue.component('tinymce-editor', () => import('./_components/TinymceEditor.vue'))
Vue.component('excel-uploader', () => import('./_components/ExcelUploader.vue'))
Vue.component('search-input', () => import('./_components/SearchInput.vue'))
Vue.component('v-chart', ECharts)

// 加载组件
Vue.use(VueRouter)
Vue.use(VueCookies)
Vue.use(ElementUI)
Vue.use(VueAxios, Axios)
Vue.use(Print)
Vue.config.productionTip = false

const router = Router
const store = Store
var RootVue = new Vue({
  router,
  store,
  name: 'Master',
  computed: {
    browser () {
      return this.$children[0].$children[0].$refs.browser
    }
  },
  methods: {
    navigate (route) {
      const browser = this.$children[0].$children[0].$refs.browser
      if (!browser) {
        const interval = setInterval(() => {
          if (browser) {
            clearInterval(interval)
            browser.navigate(route)
          }
        }, 500)
      } else {
        browser.navigate(route)
      }
    },
    loading () {
      const browser = this.$children[0].$children[0].$refs.browser
      browser.loadingView()
    },
    loadDone () {
      const browser = this.$children[0].$children[0].$refs.browser
      browser.loadViewDone()
    },
    getPermissions (routeName) {
      // 通过路由名称获取对应的权限对象
      if (this.$store.state.user.Menus) {
        const result = {}
        const perms = this.findPermissions(routeName, this.$store.state.user.Menus)
        perms.forEach(e => { result[e] = true })
        return result
      } else {
        return {}
      }
    },
    findPermissions (routeName, menus) {
      let perms = []
      for (let i = 0; i < menus.length; i++) {
        const item = menus[i]
        if (item.Url === routeName) {
          return item.Permissions
        } else {
          if (item.Children) {
            perms = this.findPermissions(routeName, item.Children)
            if (perms.length > 0) return perms
          }
        }
      }
      return perms
    },
    getApiDomain (code) {
      if (this.$store.getters.client.Apis) {
        const data = this.$store.getters.client.Apis.find(w => w.Code === code)
        if (data) return data.Host
      }
      return ''
    },
    getApi (code, api) {
      return this.getApiDomain(code) + api
    }
  },
  render: h => h(App)
})

RootVue.$mount('#app')

// 全局
window.AppData = {
  error: Error, // 默认错误页
  welComePage: WELCOME, // 默认欢迎页
  router: router,
  // 注册主路由
  registerRoutes: (routes) => {
    routes.forEach(e => {
      if (router.options.routes.findIndex(w => w.name === e.name) < 0) {
        router.options.routes.push(e)
      }
    })
  },
  // 注册子路由
  registerChildRoutes: (routes) => {
    const index = router.options.routes.find(w => w.name === INDEX.name)
    if (index) {
      routes.forEach(e => {
        if (index.children.findIndex(w => w.name === e.name) < 0) {
          index.children.push(e)
        }
      })
      const newRouter = new VueRouter(router.options)
      router.matcher = newRouter.matcher
    }
  },
  // 跳转页面
  navigate (route) {
    RootVue.navigate(route)
  },
  // 跳转到欢迎页
  navigateWelcome () {
    RootVue.navigate(this.welComePage)
  },
  // 服务组件注册
  registerModule (key) {
    if (key && key.length > 0) {
      let module = store.state.modules.find(w => w.Code === key)
      if (!module) module = store.state.modules.find(w => key.indexOf(w.Code) > -1)
      if (module) {
        store.commit(SET_MODULE_LOADDONE, module)
        console.log(`系统模块：${key}已加载!`)
      }
    }
  }
}
