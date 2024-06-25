import { ref } from 'vue'
import { defineStore } from 'pinia'

interface IbHistory {
	Key: string
	Breadcrumbs: string[]
}
// 面包屑
export const usebreadcrumbStore = defineStore('breadcrumbStore', () => {
	const breadcrumbs = ref<string[]>([])
	const historys = ref<IbHistory[]>([])
	// 更新面包屑
	function setBreadcrumbs(data: string[]) {
		breadcrumbs.value = data
		historys.value.push({
			Key: data[data.length - 1],
			Breadcrumbs: data
		})
	}

	// 返回历史
	function toHistorys(key: string) {
		const data = historys.value.find(w => w.Key === key)
		if (data) {
			breadcrumbs.value = data.Breadcrumbs
		}
	}

	// 删除历史记录
	function removeHistory(key: string) {
		const index = historys.value.findIndex(w => w.Key === key)
		if (index > -1) {
			historys.value.splice(index, 1)
		}
	}

	return { breadcrumbs, setBreadcrumbs, toHistorys, removeHistory }
})
