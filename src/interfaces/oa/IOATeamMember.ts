// 部门人员
export interface IOATeamMember {
	Id: string
    // 部门id
	TeamId: string
    // 名称
	Name: string
    // 岗位
	Job: string
    // 头像
	IconUrl: string
    // 性别
	Sex: boolean
    // 邮箱
	Email: string
    // 手机
	MobilePhone: string
    // 是否管理者
	IsLeader: boolean
    // 入职日期
	EntryDate: Date
    // 是否已离职
	IsLeave: boolean
    // 加入时间
	CreateTime: Date
}

// 部门人员新增
export interface IOATeamMemberForm {
	Id: string
    // 部门id
	TeamId: string
    // 名称
	Name: string
    // 岗位
	Job: string
    // 性别
	Sex: boolean
    // 邮箱
	Email: string
    // 手机
	MobilePhone: string
    // 是否管理者
	IsLeader: boolean
    // 身份证
    IdCard: string
    // 工号
    WorkNumber: string
    // 入职时间
    EntryDate:Date
    // 员工类型
    EmployeeType: string
    // 员工状态
    EmployeeStatus: string
    // 备注
    Remark: string
}
