'use strict'

import axios from 'axios'
import qs from 'qs'
import store from '../store/store'
import { SET_TOKEN, SET_OAUTH_REFRESHING } from '../store/mutation-types'

const instance = axios.create({
  baseURL: '',
  timeout: 90000,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
})

const auth = {
  getToken (username, password, successMethod, failMethod) {
    const params = {
      grant_type: 'password',
      client_Id: store.getters.client.OAuthClientId,
      client_secret: store.getters.client.OAuthClientSecret,
      username: username,
      password: password
    }
    this.requestAuth(params, successMethod, failMethod)
  },
  refreshToken (successMethod, failMethod) {
    if (store.getters.refresh_token) {
      this.requestAuth({
        grant_type: 'refresh_token',
        refresh_token: store.getters.refresh_token,
        client_Id: store.getters.client.OAuthClientId,
        client_secret: store.getters.client.OAuthClientSecret
      }, successMethod, failMethod)
    } else {
      if (failMethod) failMethod()
    }
  },
  requestAuth (params, successMethod, failMethod) {
    store.commit(SET_OAUTH_REFRESHING, true)
    instance.post(store.getters.client.OAuthUrl, qs.stringify(params))
      .then(response => {
        store.commit(SET_TOKEN, response.data)
        store.commit(SET_OAUTH_REFRESHING, false)
        if (successMethod) successMethod()
      })
      .catch(error => {
        let err = error.response ? error.response.data : ''
        if (err && err.error === 'invalid_client' && !err.result) {
          err = '客户端未授权，请先注册'
        }
        if (failMethod) failMethod(err)
      }).finally(() => store.commit(SET_OAUTH_REFRESHING, false))
  }
}

export default auth
