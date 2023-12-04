import VueCookies from 'vue-cookies'
import {
  SET_TOKEN, CLEAR_TOKEN, SET_OAUTH_REFRESHING,
  SET_USER, CLEAR_LOGIN, SET_TENANT, SET_AXIOS_URL,
  SET_CLIENT, ADD_MODULE, SET_MODULE_LOADDONE,
  SET_ACTIVE_MENU_INDEX, ADD_BREADCRUMB_HISTORY, SET_BREADCRUMB,
  ADD_MENU_HISTORY, SET_MENUS
} from './mutation-types'

const mutations = {
  [SET_TOKEN] (state, e) {
    state.auth = { ...e, refreshing: false }
    VueCookies.set('refresh_token', e.refresh_token)
    VueCookies.set('access_token', e.access_token)
  },
  [CLEAR_TOKEN] (state) {
    state.auth = { refreshing: false }
    VueCookies.set('refresh_token', null)
    VueCookies.set('access_token', null)
  },
  [SET_OAUTH_REFRESHING] (state, e) {
    state.token_refreshing = e
  },
  [SET_USER] (state, e) {
    state.user = e
  },
  [CLEAR_LOGIN] (state) {
    state.user = {}
    state.tenant = {}
    state.client = {}
    VueCookies.set('refresh_token', null)
    VueCookies.set('access_token', null)
    VueCookies.set('client', null)
  },
  [SET_TENANT] (state, e) {
    state.tenant = e
  },
  [SET_AXIOS_URL] (state, e) {
    state.axiosUrls = e
  },
  [SET_CLIENT] (state, e) {
    state.client = e
    VueCookies.set('client', e)
  },
  [ADD_MODULE] (state, e) {
    state.modules.push(e)
  },
  [SET_MODULE_LOADDONE] (state, e) {
    const m = state.modules.find(w => w.Id === e.Id)
    if (m) {
      m.loading = false
    }
  },
  [SET_ACTIVE_MENU_INDEX] (state, e) {
    state.activeMenuIndex = e
  },
  [ADD_BREADCRUMB_HISTORY] (state, e) {
    const item = e[e.length - 1]
    const index = state.breadcrumbHistorys.findIndex(w => w.key === item.Id)
    state.breadcrumbHistorys.unshift({ key: item.Id, value: e })
    if (index > -1) {
      state.breadcrumbHistorys.splice((index + 1), 1)
    }
  },
  [SET_BREADCRUMB]  (state, id) {
    const index = state.breadcrumbHistorys.findIndex(w => w.key === id)
    if (index > -1) {
      const item = state.breadcrumbHistorys[index]
      state.breadcrumbHistorys.unshift({ key: item.key, value: item.value })
      state.breadcrumbHistorys.splice((index + 1), 1)
    }
  },
  [ADD_MENU_HISTORY] (state, e) {
    const arr = Object.assign([], state.menuHistorys)
    const index = arr.findIndex(w => w.Id === e.Id)
    if (index > -1) {
      arr.splice(index, 1)
    }
    arr.unshift(e)
    if (arr.length > 10) {
      arr.pop()
    }
    state.menuHistorys = arr
    VueCookies.set('menuHistorys', arr)
  },
  [SET_MENUS] (state, e) {
    const arr = convertMenuTreeToArray(e).filter(w => w.Type === 2)
    state.menus = arr
  }
}

/* 将树形数据转换为一维数组 */
function convertMenuTreeToArray (treeArray) {
  return [].concat(...treeArray.map(item => [].concat(item, ...convertMenuTreeToArray(item.Children))))
}

export default mutations
