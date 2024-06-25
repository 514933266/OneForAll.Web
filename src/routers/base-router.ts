import { IPersonalMenuTree } from '../interfaces/IPersonalMenuTree'

// 用户
export const USER = { Name: 'BaseUser', Code: 'SysTenantUsers', Url: '/base/user' }

// 角色
export const ROLE = { Name: 'BaseRole', Code: 'SysTenantRoles', Url: '/base/role' }
export const ROLE_DETAIL: IPersonalMenuTree = { Id: 'BaseRoleDetail', Code: 'BaseRoleDetail', Name: '角色管理', Url: '/base/role-detail', Type: 2, OpenType: 1, IsDefault: false, Icon: 'user-cog', Children: [] }
