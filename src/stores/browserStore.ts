import { ref, toRaw } from 'vue'
import { defineStore } from 'pinia'
import router from '../untils/router'
import { IPersonalMenuTree } from '../interfaces/IPersonalMenuTree'

// 浏览器标签
export interface IBrowserTab {
	Id: string
	Name: string
	Code: string
	Url: string
	Icon: string
	IsDefault: boolean
	IsBlank: boolean
	Params: any
	Query: any
}

// 浏览器标签
export const useBrowserStore = defineStore('browserStore', () => {
	const tabs = ref<IBrowserTab[]>([])
	const activeName = ref('')

	// 跳转
	function routerPush(tab: IBrowserTab) {
		const exists = getTab(tab.Name)
		if (!exists) {
			addTab(tab)
		}
		activeName.value = tab.Name
		if (tab.Params) {
			// 1. vue3的params传参会丢失参数，此处改用state传递，通过history.state获取
			// 2. tab.Params是proxy对象，此处通过toRaw转成原生对象
			router.push({ path: tab.Url, state: { params: toRaw(tab.Params) } })
		} else if(tab.Query) {
			router.push({ path: tab.Url, query: toRaw(tab.Query) })
		} else {
			router.push({ path: tab.Url })
		}
	}

	// 根据菜单跳转
	function navigate(menu: IPersonalMenuTree, params?: any, query?: any) {
		const tab: IBrowserTab = {
			Id: menu.Id,
			Name: menu.Name,
			Code: menu.Code,
			Url: menu.Url,
			Icon: menu.Icon,
			IsBlank: menu.OpenType === 1,
			IsDefault: menu.IsDefault,
			Params: params,
			Query: query
		}
		routerPush(tab)
	}

	// 根据名称获取标签
	function getTab(name: string) {
		return tabs.value.find(w => w.Name === name)
	}

	// 添加标签
	function addTab(tab: IBrowserTab) {
		const data = getTab(tab.Name)
		if (!data && tab.IsBlank) {
			tabs.value.push(tab)
		}
	}

	// 关闭标签
	function removeTab(name: string) {
		const index = tabs.value.findIndex(w => w.Name === name)
		tabs.value.splice(index, 1)
		if (tabs.value.length > 0) {
			// 激活最后一个标签
			const tab = tabs.value[tabs.value.length - 1]
			activeName.value = tab.Name
			routerPush(tab)
		}
	}
	
	// 激活指定标签
	function activeTab(name: string) {
		const tab = getTab(name)
		if (tab) {
			activeName.value = tab.Name
			routerPush(tab)
		}
	}
	return { activeName, tabs, navigate, removeTab, activeTab }
})
