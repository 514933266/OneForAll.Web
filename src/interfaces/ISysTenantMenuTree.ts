import { ISysMenuPermission } from './ISysMenuPermission'

// 租户菜单权限树
export interface ISysTenantMenuTree {
	Id: string
	// 父级id
	ParentId: string
	// 名称
	Name: string
	// 菜单代码（由开发人员填写，值为Controller名称）
	Code: string
	// 页面路由
	Url: string
	// 图标
	ICon: string
	// 类型 0节点 1远程组件 2页面
	Type: number
	// 打开方式 0标签内打开 1新标签打开 2新窗口打开
	OpenType: number
	// 菜单代码（由开发人员填写，值为Controller名称）
	Icon: string
	// 是否默认
	IsDefault: boolean
	// 是否新窗口菜单（如果为True，则打开新标签访问）
	IsBlank: boolean
	// 备注
	Remark: string
	// 子级
	Children: ISysTenantMenuTree[]
	// 权限集合
	Permissions: ISysMenuPermission[]
}