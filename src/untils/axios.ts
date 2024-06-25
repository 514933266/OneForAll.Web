import axios from 'axios'
import router from './router'
import { useTokenStore } from '../stores/tokenStore'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { baseError } from '../consts/baseError'
import { _403, _404, _405, _415, _500, _503, LOGIN } from '../routers/main-router'
import { ElNotification, NotificationParams } from 'element-plus'
import qs from 'qs'

// var cancelToken = axios.CancelToken
// var source = cancelToken.source()
const useToken = useTokenStore()

axios.defaults.timeout = 3 * 60 * 1000 // 30s请求超时

axios.interceptors.request.use(
	config => {
		// jwt
		config.headers.Authorization = useToken.bearToken

		if (config.method === 'get') {
			// 数组格式化 arr[0] = a & arr[1] = b
			config.paramsSerializer = params => {
				return qs.stringify(params, { indices: false })
			}
		}

		return config
	},
	error => {
		return Promise.reject(error.request.data)
	}
)

axios
  .interceptors
  .response
  .use(response => {
    if (response === undefined) {
      // 后台没有返回任何数据
      return ''
    }

    // 后台返回BaseMessage格式时，弹出右上角消息框
    const data = response.data as IBaseMessage
    if (data && data.ErrType !== undefined && response.data.Message) {
      const config: NotificationParams = {
        type: data.Status ? 'success' : 'error',
        message: response.data.Message ?? '',
        title: baseError.toString(data.ErrType)
      }
      ElNotification(config)
    }
    return response.data
  }, error => {
    if (error.response) {
    const err = error?.response?.status
      switch (err) {
        case 401: router.push({ path: LOGIN.Url }); break
        case 403: router.push({ path: _403.Url }); break
        case 404: router.push({ path: _404.Url }); break
        case 405: router.push({ path: _405.Url }); break
        case 415: router.push({ path: _415.Url }); break
        case 500: router.push({ path: _500.Url }); break
        case 503: router.push({ path: _503.Url }); break
      }
    }
    return Promise.reject(error.response.data)
  })

  
export default axios
