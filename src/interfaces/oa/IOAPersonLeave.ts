// 待离职员工
export interface IOAPersonLeave {
    Id: string
	// 人员id
	PersonId: string
	// 人员姓名
	PersonName: string
	// 人员职级
	PersonJob: string
	// 员工类型
	EmployeeType: string
	// 离职原因
	Reason: string
	// 备注
	Remark: string
	// 创建人id
	CreatorName: string
	// 创建时间
	CreateTime: Date
}

// 待离职员工提交表单
export interface IOAPersonLeaveForm {
    Id: string
	// 人员id
	PersonId: string
	// 预计离职时间
	EstimateLeaveDate: string
	// 离职原因
	Reasons: string[]
	// 备注
	Remark: string
	// 是否生成异动记录
	CanCreateHistory: boolean
}

// 待离职员工确认表单
export interface IOAPersonLeaveConfirmForm {
    Id: string
	// 人员id
	PersonId: string
}
