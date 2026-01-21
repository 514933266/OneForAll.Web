import { IOAPersonTeam } from './IOAPersonTeam'

// 员工入职周年
export interface IOAPersonCompany {
    Id: string
	// 名称
	Name: string
	// 团队信息
	Teams: IOAPersonTeam[]
	// 工号
	WorkNumber: string
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
	// 入职日期
	EntryDate: Date
    // 司龄
    JoinAge: number
}