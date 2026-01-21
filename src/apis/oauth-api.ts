import axios from '../untils/axios'
import { Md5 } from "ts-md5"
import { useClientStore } from '../stores/clientStore'
import { ISysWebsite } from '../interfaces/sys/ISysWebsite'
import { IBaseMessage } from '@/interfaces/IBaseMessage'

const defaultHost = 'http://localhost:5081'
const clientStore = useClientStore()

const API = {
	// 获取登录客户端
	getClient(): Promise<ISysWebsite> {
		const url = `${defaultHost}/api/SysWebsiteSettingResources/Current`
		return axios.get(url)
	},
	// 登录
	login(username: string, password: string, code?: string, codeKey?: string): Promise<IBaseMessage> {
		const url = clientStore.client?.OAuthUrl ?? `${defaultHost}/api/Tokens`
		return axios.post(url, {
			username: username,
			password: Md5.hashStr(password),
			clientId: clientStore.client?.OAuthClientId,
			clientSecret: clientStore.client?.OAuthClientSecret,
			captcha: code,
			captchaKey: codeKey
		})
	},
	// 生成验证码
	getVerifyCodeBase64(key: string): Promise<string> {
		const url = `${defaultHost}/api/Captchas/ImageBase64`
		return axios.get(url, { params: { key: key } })
	}
}

export default API
