// 个人菜单
export interface IPersonalMenuTree {
	Id: string
	Name: string
	Code: string
	Url: string
	Type: number
	OpenType: number
	Icon: string
	IsDefault: boolean
	Children: IPersonalMenuTree[]
}
