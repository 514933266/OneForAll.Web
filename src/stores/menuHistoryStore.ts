import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 菜单使用历史
const CACHE_NAME = 'menuHistorys'
export const useMenuHistoryStore = defineStore('useMenuHistoryStore', () => {
	const menus = ref<string[]>([])
	const historys = computed(() => {
		const cache = localStorage.getItem(CACHE_NAME)
		if (cache) {
			return JSON.parse(cache) as string[]
		} else {
			return menus.value
		}
	})
	// 添加历史记录
	function add(id: string) {
		if (!exists(id)) {
			menus.value.push(id)
			const cache = localStorage.getItem(CACHE_NAME)
			if (cache) {
				const data = JSON.parse(cache) as string[]
				const newData = [...new Set(data.concat(menus.value))]
				localStorage.setItem(CACHE_NAME, JSON.stringify(newData))
			}
		}
	}

	// 是否存在
	function exists(id: string) {
		return menus.value.includes(id)
	}

	// 清空历史
	function clearHistorys() {
		menus.value = []
		localStorage.removeItem(CACHE_NAME)
	}
	return { historys, add, clearHistorys }
})
