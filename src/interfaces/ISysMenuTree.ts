import { ISysMenuPermission } from "./ISysMenuPermission"

// 个人菜单
export interface ISysMenuTree {
	Id: string
	// 父级id
    ParentId: string
	// 名称
	Name: string
	// 菜单代码（由开发人员填写，值为Controller名称）
	Code: string
	// 页面路由
	Url: string
	// Api地址
	ApiUrl: string
	// 类型 0节点 1远程组件 2页面
	Type: number
	// 打开方式 0标签内打开 1新标签打开 2新窗口打开
	OpenType: number
	// 图标
	Icon: string
	// 是否默认（默认菜单不可删除）
	IsDefault: boolean
	// 排序
    SortNumber: number
	// 是否启用（启用的菜单才能被加载出来）
    IsEnabled: boolean
	// 备注
    Remark: string
	// 子级
	Children: ISysMenuTree[]
	// 权限列表
	Permissions: ISysMenuPermission[]
}
