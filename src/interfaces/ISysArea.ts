// 地区
export interface ISysArea {
	Id: number
	// 父级id
	ParentId: number
	// 地区代码（下级地区继承上级，如00,0021,002133）
	Code: string
	// 名称
	Name: string
	// 简称
	ShortName: string
	// 1省 2市 3县区 4镇街
	Level: number
}
