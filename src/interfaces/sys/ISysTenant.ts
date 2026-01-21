// 租户
export interface ISysTenant {
	Id: string
    // 父级id
    ParentId: string
	// 网站名称
	Name: string
	// 代码
	Code: string
	// 企业Logo
	LogoUrl: string
	// 负责人
	Manager: string
	// 电话
	Phone: string
	// 地址
	Address: string
	// 状态（0待审核 1已开通）
	Status: number
    // 是否默认（默认租户禁止删除）
	IsDefault: boolean
    // 是否启用（未启用租户用户禁止登录）
    IsEnabled: boolean
    // 描述
    Description:string
    // 创建时间
    CreateTime: Date
    // 修改时间
    UpdateTime: Date
}
