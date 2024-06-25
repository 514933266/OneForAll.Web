import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ISysWebsite } from '../interfaces/sys/ISysWebsite'

// 全局登录客户端信息
const CACHE_NAME = 'client'
const BASE_KEY = 'OneForAll.Base'
const OA_KEY = 'OneForAll.OA'
const SYS_LOG = 'OneForAll.SysLog'
const SYS = 'OneForAll.Sys'
const UMS = 'OneForAll.Ums'
const JOB = 'OneForAll.ScheduleJob'
const CHAT = 'OneForAll.Api.ChatGPT'

export const useClientStore = defineStore('clientStore', () => {
	const client = ref<ISysWebsite>()
	// 基础服务api
	const baseApi = computed(() => getApi(BASE_KEY))
	// oa服务api
	const oaApi = computed(() => getApi(OA_KEY))
	// syslog服务api
	const syslogApi = computed(() => getApi(SYS_LOG))
	// sys服务api
	const sysApi = computed(() => getApi(SYS))
	// ums服务api
	const umsApi = computed(() => getApi(UMS))
	// job服务api
	const jobApi = computed(() => getApi(JOB))
	// chatgpt服务api
	const chatApi = computed(() => getApi(CHAT))
	// 更新客户端数据
	function setClient(data: ISysWebsite) {
		client.value = data
		localStorage.setItem(CACHE_NAME, JSON.stringify(data))
	}
	// 根据api key获取对应的请求host
	function getApi(key: string) {
		if (client.value === undefined) {
			const cache = localStorage.getItem(CACHE_NAME)
			if (cache && cache !== 'undefined' && cache !== '') {
				const data = JSON.parse(cache) as ISysWebsite
				return data.Apis?.find(w => w.Code === key)?.Host
			}
		}
		return client.value?.Apis.find(w => w.Code === key)?.Host
	}

	// 清除客户端信息
	function clearClient() {
		client.value = undefined
		localStorage.removeItem(CACHE_NAME)
	}

	return { client, baseApi, oaApi, syslogApi, sysApi, umsApi, jobApi, chatApi, setClient, getApi, clearClient }
})
