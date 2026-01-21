import axios from '../untils/axios'
import { Md5 } from 'ts-md5'
import { useClientStore } from '../stores/clientStore'
import { useUserStore } from '../stores/userStore'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { IBasePage } from '../interfaces/IBasePage'
import { IPersonalMenuTree } from '../interfaces/IPersonalMenuTree'
import { ILoginUser } from '../interfaces/ILoginUser'
import { ISysTenantUser } from '../interfaces/base/ISysTenantUser'
import { ISysTenantRole } from '../interfaces/base/ISysTenantRole'
import { ISysTenantMenuTree } from '../interfaces/base/ISysTenantMenuTree'
import { ISysMenuPermission } from '../interfaces/base/ISysMenuPermission'
import { ISysRoleMember } from '../interfaces/base/ISysRoleMember'
import { IArea } from '@/interfaces/IArea'

const useClient = useClientStore()

// 系统管理
const API = {
	getHost() {
		return useClient.baseApi ?? ''
	},
	// 登录日志
	logLogin() {
		const url = `${useClient.baseApi}/api/SysPersonal`
		return axios.post(url, {
			Source: 'PC',
			LoginType: 'Password'
		})
	},
	// 退出登录
	logout(): Promise<number> {
		const url = `${useClient.baseApi}/api/SysPersonal`
		return axios.delete(url)
	},
	// 获取菜单树
	getMenus(): Promise<IPersonalMenuTree[]> {
		const url = `${useClient.baseApi}/api/SysPersonal/Menus`
		return axios.get(url)
	},
	// 获取子菜单列表
	getSubMenus(): Promise<IPersonalMenuTree[]> {
		const url = `${useClient.baseApi}/api/SysPersonal/SubMenus`
		return axios.get(url)
	},
	// 获取个人信息
	getLoginUser(): Promise<ILoginUser> {
		const url = `${useClient.baseApi}/api/SysPersonal`
		return axios.get(url)
	},
	// 上传头像
	uploadHeader(file: any): Promise<IBaseMessage> {
		const formData = new FormData()
		formData.append('files', file.file, file.filename)
		const url = `${useClient.baseApi}/api/SysPersonal/Header`
		return axios.post(url, formData)
	},
	// 自动上传时，头像地址
	getUploadHeaderUrl(): string {
		return `${useClient.baseApi}/api/SysPersonal/Header`
	},
	// 修改密码
	changePwd(oldPwd: string, newPwd: string, repeatPwd: string): Promise<IBaseMessage> {
		const data = { old: Md5.hashStr(oldPwd), new: Md5.hashStr(newPwd), repeat: Md5.hashStr(repeatPwd) }
		const url = `${useClient.baseApi}/api/SysPersonal/Password`
		return axios.patch(url, data)
	},
	// 更新签名
	updateSignature(signature: string): Promise<IBaseMessage> {
		const userStore = useUserStore()
		const url = `${useClient.baseApi}/api/SysPersonal`
		return axios.put(url, { Name: userStore.user?.Name, Signature: signature })
	},
	// 获取账号分页列表
	getPageUser (pageIndex: number, pageSize: number, key?: string): Promise<IBasePage<ISysTenantUser>> {
		const url = `${useClient.baseApi}/api/SysTenantUsers/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { key: key }})
	},
	// 创建账号
	addUser(data?: ISysTenantUser): Promise<IBaseMessage> {
		const url = `${useClient.baseApi}/api/SysTenantUsers`
		return axios.post(url, data)
	},
	// 更新账号信息
	updateUser(data?: ISysTenantUser): Promise<IBaseMessage> {
		const url = `${useClient.baseApi}/api/SysTenantUsers`
		return axios.put(url, data)
	},
	// 删除账号
	delUser(id: string): Promise<IBaseMessage> {
		const url = `${useClient.baseApi}/api/SysTenantUsers/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 重置账号密码
	resetUserPwd(id: string): Promise<IBaseMessage> {
		const url = `${useClient.baseApi}/api/SysTenantUsers/Batch/Password`
		return axios.patch(url, [id])
	},
	// 获取角色分页列表
	getPageRole (pageIndex: number, pageSize: number, key?: string): Promise<IBasePage<ISysTenantRole>> {
		const url = `${useClient.baseApi}/api/SysTenantRoles/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { key: key }})
	},
	// 创建角色
	addRole(data?: ISysTenantRole): Promise<IBaseMessage> {
		const url = `${useClient.baseApi}/api/SysTenantRoles`
		return axios.post(url, data)
	},
	// 更新角色
	updateRole(data?: ISysTenantRole): Promise<IBaseMessage> {
		const url = `${useClient.baseApi}/api/SysTenantRoles`
		return axios.put(url, data)
	},
	// 删除角色
	delRole(id: string): Promise<IBaseMessage>{
		const url = `${useClient.baseApi}/api/SysTenantRoles/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 获取租户菜单权限树
	getTenantMenuTree(): Promise<ISysTenantMenuTree[]>  {
		const url = `${useClient.baseApi}/api/SysTenants/Current/MenuTrees`
		return axios.get(url)
	},
	// 获取角色权限列表
	getRolePermissions(id: string): Promise<ISysMenuPermission[]> {
		const url = `${useClient.baseApi}/api/SysTenantRoles/${id}/Permissions`
		return axios.get(url)
	},
	// 绑定角色权限
	bindRolePermission(id: string, pids: string[]) {
		const url = `${useClient.baseApi}/api/SysTenantRoles/${id}/Permissions`
		return axios.post(url, pids)
	},
	// 绑定角色权限
	getRoleMembers(id: string): Promise<ISysRoleMember[]> {
		const url = `${useClient.baseApi}/api/SysTenantRoles/${id}/Members`
		return axios.get(url)
	},
	// 获取角色非成员列表
	getRoleUsers(id: string): Promise<ISysRoleMember[]> {
		const url = `${useClient.baseApi}/api/SysTenantRoles/${id}/Users`
		return axios.get(url)
	},
	// 添加角色用户
	addRoleMember(id: string, uids: string[]): Promise<IBaseMessage> {
		const url = `${useClient.baseApi}/api/SysTenantRoles/${id}/Members`
		return axios.post(url, uids)
	},
	// 删除角色用户
	delRoleMember(id: string, uid: string): Promise<IBaseMessage> {
		const url = `${useClient.baseApi}/api/SysTenantRoles/${id}/Members/Batch/IsDeleted`
		return axios.patch(url, [uid])
	},
  // 获取地区列表
  getAreaList(): Promise<IArea[]> {
    const url = `${useClient.baseApi}/api/SysAreas/Provinces`
		return axios.get(url)
  },
  getAreaChildren(id: number): Promise<IArea[]> {
    const url = `${useClient.baseApi}/api/SysAreas/${id}/Children`
		return axios.get(url)
  },
}

export default API
