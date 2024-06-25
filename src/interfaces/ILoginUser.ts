// 登录客户端
export interface ILoginUser {
	Id: string
	TenantId: string
	TenantName: string
	Name: string
	UserName: string
	IconUrl: string
	Signature: string
	IsDefault: boolean
	CreateTime: string
	Menus: ILoginUserMenu[]
}


export interface ILoginUserMenu {
	// 匹配前端路由的path
	Url: string
	// 菜单Api控制器名称，用于通过此Code判断是否拥有对应的操作权限
	Code: string
	// 权限列表
	Permissions: string[]
}