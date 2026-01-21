// 团队
export interface IOATeamTree {
	Id: string
	// 父级id
    ParentId: string
    // 直属主管id
    LeaderId:string
	// 直属主管姓名
	LeaderName: string
	// 名称
	Name: string
	// 分类
	Type: string
	// 成员数量
	MemberNumber: number
	// 是否删除
    IsDeleted: boolean
	// 创建时间
    CreateTime: Date
	// 子级
	Children: IOATeamTree[]
}


// 团队
export interface IOATeam {
	Id: string
	// 父级id
    ParentId: string
    // 直属主管id
    LeaderId:string
	// 名称
	Name: string
	// 分类
	Type: string
	// 是否删除
    IsDeleted: boolean
	// 创建时间
    CreateTime: Date
}

// 团队表单
export interface IOATeamForm {
	Id: string
	// 父级id
    ParentId: string
    // 直属主管id
    LeaderId:string
	// 名称
	Name: string
	// 分类
	Type: string
}