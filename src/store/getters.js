import VueCookies from 'vue-cookies'

const getters = {
  access_token: state => {
    if (state.auth.access_token) {
      return state.auth.access_token
    } else {
      const cookie = VueCookies.get('access_token')
      if (cookie && cookie !== 'null') return cookie
    }
    return ''
  },
  refresh_token: state => {
    if (state.auth.refresh_token) {
      return state.auth.refresh_token
    } else {
      const cookie = VueCookies.get('refresh_token')
      if (cookie && cookie !== 'null') return cookie
    }
    return ''
  },
  client: state => {
    if (state.client.OAuthClientId) {
      return state.client
    } else {
      const cookie = VueCookies.get('client')
      if (cookie && cookie !== 'null') return cookie
    }
    return {}
  },
  token_refreshing: state => {
    return state.token_refreshing
  }
}

export default getters
