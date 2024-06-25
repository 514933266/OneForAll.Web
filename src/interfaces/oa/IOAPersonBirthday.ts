import { IOAPersonTeam } from './IOAPersonTeam'

// 员工生日
export interface IOAPersonBirthday {
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
	// 生日
	Birthday: Date
}