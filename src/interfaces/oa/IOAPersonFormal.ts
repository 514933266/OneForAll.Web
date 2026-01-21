// 待转正员工
export interface IOAPersonFormal {
    Id: string
	// 名称
	Name: string
	// 职级
	Job: string
	// 员工类型
	EmployeeType: string
	// 员工状态
	EmployeeStatus: string
	// 头像
	IconUrl: string
	// 性别 0女 1男
	Sex: boolean
	// 年龄
	Age: number
	// 部门
	TeamName: string
	// 入职日期
	EntryDate: Date
	// 计划转正日期
	PlanEntryDate: Date
	// 实际转正日期
	ActualEntryDate: Date
    // 试用期
	TryDate: string
}

// 待转正员工确认表单
export interface IOAPersonFormalConfirmForm {
    // 人员id
	Id: string
	// 实际转正日期
	ActualEntryDate: string
}
