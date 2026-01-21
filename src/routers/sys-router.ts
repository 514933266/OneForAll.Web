import { IPersonalMenuTree } from '../interfaces/IPersonalMenuTree'

// 菜单
export const MENU = { Name: 'SysMenu', Code: 'SysMenus', Url: '/sys/menu' }
// 权限
export const PERMISSION: IPersonalMenuTree = { Id: 'SysPermission', Name: '权限管理', Code: 'SysPermissions', Url: '/sys/permission', Type: 2, OpenType: 1, IsDefault: false, Icon: 'user-check', Children: [] }
// 租户
export const TENANT = { Name: 'SysTenant', Code: 'SysTenants', Url: '/sys/tenant' }
// 租户详情
export const TENANT_PERMISSION: IPersonalMenuTree = { Id: 'SysTenantPermission', Name: '租户权限', Code: 'SysTenantPermission', Url: '/sys/tenant-permission', Type: 2, OpenType: 1, IsDefault: false, Icon: 'user-check', Children: [] }
// 用户账号
export const USER = { Name: 'SysUser', Code: 'SysUsers', Url: '/sys/user' }
// 微信客户端
export const WX_CLIENT = { Name: 'SysWxClient', Code: 'SysWxClients', Url: '/sys/wx-client' }
// 微信公众号回复设置
export const WX_GZH_REPLY =  { Name: 'SysWxgzhReplySetting', Code: 'SysWxClients', Url: '/sys/wxgzh-reply-setting' }
// 微信关注用户
export const WX_GZH_USER =  { Name: 'SysWxgzhSubscribeUser', Code: 'SysWxgzhSubscribeUsers', Url: '/sys/wxgzh-subscribe-user' }
// 登录客户端
export const CLIENT = { Name: 'SysClient', Code: 'SysClients', Url: '/sys/client' }
// 登录站点
export const WEBSITE = { Name: 'SysWebsite', Code: 'SysWebsiteSettings', Url: '/sys/website' }
// 登录站点api
export const WEBSITE_API: IPersonalMenuTree = { Id: 'SysWebsiteApi', Code: 'SysWebsiteApi', Name: '站点Api', Url: '/sys/website-api', Type: 2, OpenType: 1, IsDefault: false, Icon: 'user-cog', Children: [] }
// 联系我们
export const CONTACT_US = { Name: 'SysContactUs', Code: 'SysContactUs', Url: '/sys/contact-us' }
// 地区
export const AREA = { Name: 'SysArea', Code: 'SysAreas', Url: '/sys/area' }
// 系统通知
export const NOTIFICATION = { Name: 'SysNotification', Code: 'SysNotifications', Url: '/sys/notification' }
