'use strict'

import axios from 'axios'
import router from '../router/router'
import store from '../store/store'
import baseErrType from './error'
import auth from './oauth'
import { SET_AXIOS_URL } from '../store/mutation-types'
import { _403, _404, _405, _500, LOGIN } from '../router/base-router'
import { Notification } from 'element-ui'
import qs from 'qs'

var cancelToken = axios.CancelToken
var source = cancelToken.source()
axios.defaults.timeout = 5 * 60 * 1000

axios
  .interceptors
  .request
  .use(config => {
    // 过滤重复请求
    filterRequest(config)

    // 刷新token时拒绝请求
    if (store.getters.token_refreshing) {
      rejectRequest('正在尝试重新登录...')
    }

    // bearer
    if (store.getters.access_token) {
      config.headers.Authorization = `bearer ${store.getters.access_token}`
    }

    if (config.method === 'get') {
      // tt
      config.params = { ...config.params, _tt: new Date().getTime() }
      // 数组格式化 arr[0] = a & arr[1] = b
      config.paramsSerializer = params => {
        return qs.stringify(params, { indices: false })
      }
    }

    return config
  }, error => {
    return Promise.reject(error)
  })

axios
  .interceptors
  .response
  .use(response => {
    showMessage(response)
    return response.data
  }, error => {
    let err = 500
    if (error.response) {
      err = error.response.status
    } else {
      // 取消请求时返回
      if (error.message.response) {
        err = error.message.response.status
        showMessage(error.message.response)
      }
    }
    if (router.currentRoute.name !== LOGIN.name) {
      switch (err) {
        case 401: auth.refreshToken(() => axios(err.config), authFailed); break
        case 403: if (router.currentRoute.name !== _403.name) router.push(_403); break
        case 404: if (router.currentRoute.name !== _404.name) router.push(_404); break
        case 405: if (router.currentRoute.name !== _405.name) router.push(_405); break
        case 500: if (router.currentRoute.name !== _500.name) router.push(_500); break
        default: router.push(LOGIN); break
      }
    }
    return Promise.reject(error)
  })

// 全局消息
function showMessage (response) {
  if (response.data && response.data.ErrType !== undefined) {
    const err = parseInt(response.data.ErrType)
    const config = {
      type: err === 1 ? 'success' : 'error',
      message: response.data.Message,
      title: baseErrType.toString(err)
    }
    if (!config.message || config.message.length < 1) config.message = config.title
    Notification(config)
  }
}

// 授权失败
function authFailed () {
  router.push(LOGIN)
}

// 防抖
function filterRequest (config) {
  if (config.method === 'get') return
  const exists = checkAxiosUrlExists(config.url)
  if (exists) {
    // data参数格式参考后端响应格式
    config.cancelToken = source.token
    source.cancel()
  } else {
    setTimeout(() => {
      removeAxiosUrl(config.url)
    }, 500)
  }
}

// 设置url用于过滤
function checkAxiosUrlExists (url) {
  const arr = Object.assign([], ...store.state.axiosUrls)
  if (arr.findIndex(w => w === url) > -1) {
    return true
  }
  arr.push(url)
  store.commit(SET_AXIOS_URL, arr)
  return false
}

// 移除url
function removeAxiosUrl (url) {
  const arr = Object.assign([], ...store.state.axiosUrls)
  for (let i = 0; i < arr.length; i++) {
    if (url === arr[i]) {
      arr.splice(i, 1)
    }
  }
  store.commit(SET_AXIOS_URL, arr)
}

// 拒绝axios请求，并使请求不报错
function rejectRequest (msg) {
  source.cancel({
    response: {
      status: 200,
      data: {
        Status: false,
        ErrType: 0,
        Message: msg
      }
    }
  })
}

export default axios
