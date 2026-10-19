import axios from 'axios'
import router from './router'
import { useTokenStore } from '../stores/tokenStore'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { baseError } from '../consts/baseError'
import { _403, _404, _405, _415, _500, _503, LOGIN } from '../routers/main-router'
import { ZDX_LOGIN, inZdxPortal } from '../consts/zdx-portal'
import { ElNotification, NotificationParams } from 'element-plus'
import qs from 'qs'

// var cancelToken = axios.CancelToken
// var source = cancelToken.source()
const useToken = useTokenStore()

axios.defaults.timeout = 3 * 60 * 1000 // 30s请求超时

axios.interceptors.request.use(
	config => {
		// jwt
		config.headers.Authorization = `Bearer ${useToken.bearToken}`

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
      // 智多星独立站上下文：不劫持到办公门户登录页/错误页，站内处理
      const inPortal = inZdxPortal(router.currentRoute.value.path)
      switch (err) {
        case 401: 
        useToken.clearToken()
        router.push({ path: inPortal ? ZDX_LOGIN.Url : LOGIN.Url });
        break
        case 403: 
        case 404:
        case 405:
        case 415:
        case 500:
        case 503:
          if (inPortal) {
            // 独立站内仅提醒，避免被踢出外壳；已在专用登录页时（退出后的残余请求）不再弹噪提示
            if (router.currentRoute.value.path !== ZDX_LOGIN.Url) {
              ElNotification({ type: 'error', title: '请求异常', message: '服务响应异常（HTTP ' + err + '）' })
            }
          } else {
            // 已在登录页时（退出后的残余请求）不再跳转错误页，避免盖掉登录界面
            if (router.currentRoute.value.path !== LOGIN.Url) {
              const errRouterMap: Record<number, { Url: string }> = { 403: _403, 404: _404, 405: _405, 415: _415, 500: _500, 503: _503 }
              router.push({ path: errRouterMap[err].Url });
            }
          }
          break
      }
    }
    return Promise.reject(error.response ? error.response.data : error)
  })

  
export default axios
