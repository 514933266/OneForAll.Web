// 人员异动记录
export interface IOAPersonHistory {
	// 名称
	PersonName: string
	// 人员职级
	PersonJob: string
	// 部门名称
	TeamName: string
	// 目标部门名称
	TargetTeamName: string
	// 类型
	Type: number
	// 创建时间
	CreateTime: Date
	// 备注
	Remark: string
}