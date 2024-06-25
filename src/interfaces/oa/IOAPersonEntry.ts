// 员工入职
export interface IOAPersonEntry {
    Id: string
	// 部门id
	TeamId: string
	// 部门
	TeamName: string
	// 人员姓名
	Name: string
	// 岗位
	Job: string
    // 性别 0女 1男
	Sex: boolean
	// 身份证号
	IdCard: string
	// 手机号码
	MobilePhone: string
	// 邮箱
	Email: string
	// 已交入职档案
	IsSubmitEntryFile: boolean
	// 预计入职时间
	EstimateEntryDate: Date
	// 创建人id
	CreatorName: string
    // 创建时间
	CreateTime: Date
    // 是否超期
	IsOverdue: boolean
    // 超期天数
	OverdueDays: number
}

// 办理入职表单
export interface IOAPersonEntryForm {
    Id: string
	// 部门id
	TeamId: string
	// 人员姓名
	Name: string
	// 岗位
	Job: string
	// 手机号码
	MobilePhone: string
	// 预计入职时间
	EstimateEntryDate: Date
}

// 确认员工到岗
export interface IOAPersonEntryConfirmForm  {
	Id: string
	// 部门id
	WorkNumber: string
	// 部门
	EmployeeType: string
	// 人员姓名
	EmployeeStatus: string
	// 岗位
	Remark: string
    // 性别 0女 1男
	Sex: boolean
}
