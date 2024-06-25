import { IOAPersonTeam } from './IOAPersonTeam'
import { IOAPersonExtenInformationField } from './IOAPersonExtenInformationField'

export interface IOAPerson {
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
	// 年龄
	Age: number
	// 身份证号
	IdCard: string
	// 生日
	Birthday: Date | undefined
	// 入职日期
	EntryDate: Date | undefined
	// 离职日期
	LeaveDate: Date | undefined
	// 手机号码
	MobilePhone: string
	// 邮箱
	Email: string
	// 司龄
	JoinAge: string
	// 备注
	Remark: string
	// 扩展信息
	ExtendInformations: IOAPersonExtenInformationField[]
}