// const SERVICE_DOMAIN = '//localhost:51512'
import axios from '../untils/axios'
import { Md5 } from "ts-md5"
import { useClientStore } from '../stores/clientStore'
import { ISysWebsite } from '../interfaces/sys/ISysWebsite'
import { IOAuthToken } from '../interfaces/IOAuthToken'

const defaultHost = 'https://oauth.api.fengwoyun.net'
const clientStore = useClientStore()

const API = {
	// 获取登录客户端
	getClient(): Promise<ISysWebsite> {
		const url = `${defaultHost}/api/SysWebsiteSettingResources/Current`
		return axios.get(url)
	},
	// 登录
	login(username: string, password: string, code?: string, codeKey?: string): Promise<IOAuthToken> {
		const url = clientStore.client?.OAuthUrl ?? 'defaultHost/connect/token'
		const query = `grant_type=password&username=${username}&password=${Md5.hashStr(password)}&client_Id=${clientStore.client?.OAuthClientId}&client_secret=${clientStore.client?.OAuthClientSecret}&captcha=${code}&captcha_key=${codeKey}`
		return axios.post(url, query, {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
		})
	},
	// 生成验证码
	getVerifyCodeBase64(key: string): Promise<string> {
		const url = `${defaultHost}/api/Captchas/ImageBase64`
		return axios.get(url, { params: { key: key } })
	}
}

export default API
