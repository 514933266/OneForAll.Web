// 员工合同到期
export interface IOAPersonContract {
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
	// 合同开始日期
	ContractFirstDate: Date
	// 合同结束日期
	ContractEndDate: Date
	// 合同类型
	ContractType: string
}