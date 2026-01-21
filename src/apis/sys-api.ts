import axios from '../untils/axios'
import { useClientStore } from '../stores/clientStore'
import { IBasePage } from '../interfaces/IBasePage'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { ISysClient } from '../interfaces/sys/ISysClient'
import { ISysWebsite, ISysWebsiteApi } from '../interfaces/sys/ISysWebsite'
import { ISysTenant } from '../interfaces/sys/ISysTenant'
import { ISysMenuTree } from '../interfaces/sys/ISysMenuTree'
import { ISysPermission } from '../interfaces/sys/ISysPermission'
import { ISysWxClient } from '../interfaces/sys/ISysWxClient'
import { ISysWxgzhReplySetting } from '../interfaces/sys/ISysWxgzhReplySetting'
import { ISysWxgzhSubscribeUser } from '../interfaces/sys/ISysWxgzhSubscribeUser'
import { ISysMenuPermission } from '../interfaces/sys/ISysMenuPermission'
import { ISysUser } from '../interfaces/sys/ISysUser'
import { ISysContactUs } from '../interfaces/sys/ISysContactUs'
import { ISysArea } from '../interfaces/sys/ISysArea'
import { ISysNotification } from '../interfaces/sys/ISysNotification'

const useClient = useClientStore()

// 系统日志
const API = {
	getHost() {
		return useClient.sysApi ?? ''
	},
	// 获取登录客户端
	getClients(): Promise<ISysClient[]> {
		const url = `${useClient.sysApi}/api/SysClients`
		return axios.get(url)
	},
	// 创建登录客户端
	addClient(data?: ISysClient): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysClients`
		return axios.post(url, data)
	},
	// 更新登录客户端
	updateClient(data?: ISysClient): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysClients`
		return axios.put(url, data)
	},
	// 删除登录客户端
	delClient(id: string): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysClients/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 获取站点列表
	getWebsites(pageIndex: number, pageSize: number, key?: string): Promise<IBasePage<ISysWebsite>> {
		const url = `${useClient.sysApi}/api/SysWebsiteSettings/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { key: key } })
	},
	// 创建站点
	addWebsite(data?: ISysWebsite): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysWebsiteSettings`
		return axios.post(url, data)
	},
	// 更新站点
	updateWebsite(data?: ISysWebsite): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysWebsiteSettings`
		return axios.put(url, data)
	},
	// 删除站点
	delWebsite(id: string): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysWebsiteSettings/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 获取站点api列表
	getWebsiteApis(wid: string): Promise<ISysWebsiteApi[]> {
		const url = `${useClient.sysApi}/api/SysWebsiteSettings/${wid}/Apis`
		return axios.get(url)
	},
	// 添加站点api列表
	addWebsiteApi(wid: string, data?: ISysWebsiteApi): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysWebsiteSettings/${wid}/Apis`
		return axios.post(url, data)
	},
	// 更新站点api列表
	updateWebsiteApi(wid: string, data?: ISysWebsiteApi): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysWebsiteSettings/${wid}/Apis`
		return axios.put(url, data)
	},
	// 删除站点api列表
	delWebsiteApi(wid: string, id: string): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysWebsiteSettings/${wid}/Apis/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 租户列表
	getPageTenants(pageIndex: number, pageSize: number, key?: string): Promise<IBasePage<ISysTenant>> {
		const url = `${useClient.sysApi}/api/SysTenants/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { key: key } })
	},
	// 获取指定租户
	getTenant(id: string): Promise<ISysTenant> {
		const url = `${useClient.sysApi}/api/SysTenants/${id}`
		return axios.get(url)
	},
	// 添加租户
	addTenant(data?: ISysTenant): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysTenants`
		return axios.post(url, data)
	},
	// 更新租户
	updateTenant(data?: ISysTenant): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysTenants`
		return axios.put(url, data)
	},
	// 删除租户
	delTenant(id: string): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysTenants/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 获取租户权限
	getTenantPermission(id: string): Promise<ISysMenuPermission[]> {
		const url = `${useClient.sysApi}/api/SysTenants/${id}/Permissions`
		return axios.get(url)
	},
	// 绑定租户权限
	bindTenantPermission(id: string, pids: string[]) {
		const url = `${useClient.sysApi}/api/SysTenants/${id}/Permissions`
		return axios.post(url, pids)
	},
	// 获取菜单树
	getTreeMenus(hasPerms?: boolean, parentId?: string, key?: string): Promise<ISysMenuTree[]> {
		const url = `${useClient.sysApi}/api/SysMenus`
		return axios.get(url, { params: { hasPerms: hasPerms, parentId: parentId, key: key } })
	},
	// 添加菜单
	addMenu(data?: ISysMenuTree): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysMenus`
		return axios.post(url, data)
	},
	// 更新菜单
	updateMenu(data?: ISysMenuTree): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysMenus`
		return axios.put(url, data)
	},
	// 删除菜单
	delMenu(id: string): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysMenus/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 启用菜单
	updateMenuIsEnabled(id: string, isEnabled: boolean): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysMenus/${id}/IsEnabled`
		return axios.patch(url, isEnabled)
	},
	// 克隆菜单子级
	copyMenu(id: string, ids: string[]): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysMenus/${id}/Children`
		return axios.post(url, ids)
	},
	// 菜单排序
	sortMenu(id: string, up: boolean): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysMenus/${id}/SortNumber?sortNumber=${up ? 1 : 0}`
		return axios.patch(url)
	},
	// 获取权限列表
	getPermissions(pageIndex: number, pageSize: number, menuId?: string, key?: string): Promise<IBasePage<ISysPermission>> {
		const url = `${useClient.sysApi}/api/SysPermissions/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { menuId: menuId, key: key } })
	},
	// 添加权限
	addPermission(data?: ISysPermission): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysPermissions`
		return axios.post(url, data)
	},
	// 更新权限
	updatePermission(data?: ISysPermission): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysPermissions`
		return axios.put(url, data)
	},
	// 删除权限
	delPermission(id: string): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysPermissions/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 账号列表
	getPageUsers(pageIndex: number, pageSize: number, key?: string): Promise<IBasePage<ISysUser>> {
		const url = `${useClient.sysApi}/api/SysUsers/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { key: key } })
	},
	// 添加账号
	addUser(data?: ISysUser): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysUsers`
		return axios.post(url, data)
	},
	// 更新账号
	updateUser(data?: ISysUser): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysUsers`
		return axios.put(url, data)
	},
	// 删除账号
	delUser(id: string): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysUsers/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 获取微信登录客户端
	getWxClients(): Promise<ISysWxClient[]> {
		const url = `${useClient.sysApi}/api/SysWxClients`
		return axios.get(url)
	},
	// 创建微信登录客户端
	addWxClient(data?: ISysWxClient): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysWxClients`
		return axios.post(url, data)
	},
	// 更新微信登录客户端
	updateWxClient(data?: ISysWxClient): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysWxClients`
		return axios.put(url, data)
	},
	// 删除微信登录客户端
	delWxClient(id: string): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysWxClients/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 获取微信公众号回复设置
	getWxgzhReplySettings(pageIndex: number, pageSize: number, appId?: string): Promise<IBasePage<ISysWxgzhReplySetting>> {
		const url = `${useClient.sysApi}/api/SysWxgzhReplySettings/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { appId: appId } })
	},
	// 创建微信公众号回复设置
	addWxgzhReplySetting(data?: ISysWxgzhReplySetting): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysWxgzhReplySettings`
		return axios.post(url, data)
	},
	// 更新微信公众号回复设置
	updateWxgzhReplySetting(data?: ISysWxgzhReplySetting): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysWxgzhReplySettings`
		return axios.put(url, data)
	},
	// 删除微信公众号回复设置
	delWxgzhReplySetting(id: string): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysWxgzhReplySettings/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 获取微信关注用户
	getSysWxgzhSubscribeUsers(pageIndex: number, pageSize: number, key?: string): Promise<IBasePage<ISysWxgzhSubscribeUser>> {
		const url = `${useClient.sysApi}/api/SysWxgzhSubscribeUsers/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { key: key } })
	},
	// 获取联系我们列表
	getContactUs (pageIndex: number, pageSize: number, key?: string): Promise<IBasePage<ISysContactUs>> {
		const url = `${useClient.sysApi}/api/SysContactUs/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { key: key } })
	},
	// 删除联系我们
	delContactUs(id: string): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysContactUs/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 获取地区列表
	getAreas (pageIndex: number, pageSize: number, key?: string, parentId?: number): Promise<IBasePage<ISysArea>> {
		const url = `${useClient.sysApi}/api/SysAreas/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { key: key, parentId: parentId } })
	},
	// 获取地区省列表
	getAreaProvinces (): Promise<ISysArea[]> {
		const url = `${useClient.sysApi}/api/SysAreas/Default/Provinces`
		return axios.get(url)
	},
	// 获取地区子级列表
	getAreaChildren (id: number): Promise<ISysArea[]> {
		const url = `${useClient.sysApi}/api/SysAreas/${id}/Children`
		return axios.get(url)
	},
	// 添加地区
	addArea(data?: ISysArea): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysAreas`
		return axios.post(url, data)
	},
	// 更新地区
	updateArea(data?: ISysArea): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysAreas`
		return axios.put(url, data)
	},
	// 删除地区
	delArea(id: number): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysAreas/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 获取系统通知列表
	getNotifications (pageIndex: number, pageSize: number, key?: string, startDate?: string, endDate?: string): Promise<IBasePage<ISysNotification>> {
		const url = `${useClient.sysApi}/api/SysNotifications/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { key: key, startDate: startDate, endDate: endDate } })
	},
	// 添加系统通知
	addNotification(data?: ISysNotification, toAccounts?: ISysUser[]): Promise<IBaseMessage> {
		const newData = Object.assign({}, data, { ToAccounts: toAccounts })
		const url = `${useClient.sysApi}/api/SysNotifications`
		return axios.post(url, newData)
	},
	// 更新系统通知
	updateNotification(data?: ISysNotification, toAccounts?: ISysUser[]): Promise<IBaseMessage> {
		const newData = Object.assign({}, data, { ToAccounts: toAccounts })
		const url = `${useClient.sysApi}/api/SysNotifications`
		return axios.put(url, newData)
	},
	// 删除系统通知
	delNotification(id: string): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysNotifications/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 发布系统通知
	publishNotification(id: string): Promise<IBaseMessage> {
		const url = `${useClient.sysApi}/api/SysNotifications/${id}/IsPublish`
		return axios.patch(url)
	},
	// 上传图片
	uploadNotificationImg(id: string, blob: any): Promise<IBaseMessage> {
		const formData = new FormData()
		// eslint-disable-next-line
      	formData.append('files', blob.blob(), blob.filename())
		const url = `${useClient.sysApi}/api/SysNotifications/${id}/Images`
		return axios.post(url)
	}
}

export default API