import VueCookies from 'vue-cookies'
import {
  SET_TOKEN, CLEAR_TOKEN, SET_OAUTH_REFRESHING,
  SET_USER, CLEAR_LOGIN, SET_TENANT, SET_AXIOS_URL,
  SET_CLIENT, ADD_MODULE, SET_MODULE_LOADDONE
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
  }
}

export default mutations
