// const SERVICE_DOMAIN = '//localhost:51512'
import axios from '../untils/axios'
import { Md5 } from "ts-md5"
import { useClientStore } from '../stores/clientStore'
import { ISysWebsite } from '../interfaces/sys/ISysWebsite'
import { IOAuthToken } from '../interfaces/IOAuthToken'

const clientStore = useClientStore()

const API = {
	// 获取登录客户端
	getClient(): Promise<ISysWebsite> {
		const url = `https://oauth.api.fengwoyun.net/api/SysWebsiteSettingResources/Current`
		return axios.get(url)
	},
	// 登录
	login(username: string, password: string): Promise<IOAuthToken> {
		const url = clientStore.client?.OAuthUrl ?? ''
		const query = `grant_type=password&username=${username}&password=${Md5.hashStr(password)}&client_Id=${clientStore.client?.OAuthClientId}&client_secret=${clientStore.client?.OAuthClientSecret}`
		return axios.post(url, query, {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
		})
	}
}

export default API
