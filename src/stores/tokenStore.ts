import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { IOAuthToken } from '../interfaces/IOAuthToken'

// 全局登录授权信息
const CACHE_NAME = 'token'
export const useTokenStore = defineStore('tokenStore', () => {
	const token = ref<IOAuthToken>()
	// jwt 令牌
	const bearToken = computed(() => {
		if (token.value === undefined) {
			const cache = localStorage.getItem(CACHE_NAME)
			if (cache) {
				const data = JSON.parse(cache) as IOAuthToken
				return `bearer ${data.access_token}`
			}
		}
		return `bearer ${token.value?.access_token}`
	})

	// 更新令牌
	function setToken(data: IOAuthToken) {
		token.value = data
		localStorage.setItem(CACHE_NAME, JSON.stringify(data))
	}
	// 清除令牌
	function clearToken() {
		token.value = undefined
		localStorage.removeItem(CACHE_NAME)
	}
	return { token, bearToken, setToken, clearToken }
})
