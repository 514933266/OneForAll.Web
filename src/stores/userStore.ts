import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ILoginUser } from '../interfaces/ILoginUser'

// 登录用户
export const useUserStore = defineStore('userStore', () => {
	const user = ref<ILoginUser>(Object.assign({}))

	// 更新用户
	function setUser(data: ILoginUser) {
		user.value = data
	}

	// 更新用户头像
	function setUserHeader(url: string) {
		user.value.IconUrl = url
	}

	// 更新个性签名
	function setUserSignature(signature: string) {
		user.value.Signature = signature
	}

	// 获取权限列表
	function getPermissions(url: string): any {
		const result: { [key: string]: boolean } = {}
		const items = user.value?.Menus.find(w => w.Url === url)?.Permissions ?? []
		items.forEach(e => result[e] = true )
		return result ?? {}
	}
	return { user, setUser, setUserHeader, setUserSignature, getPermissions }
})
