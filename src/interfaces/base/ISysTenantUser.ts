// 系统账号
export interface ISysTenantUser {
	Id: string
	TenantId: string
	// 名称
	Name: string
	// 账号
	UserName: string
	// 手机号码
	Mobile: string
	// 用户状态
	Status: number
	// 头像路径
	IconUrl: string
	// 最后登录时间
	LastLoginTime: Date
	// 最后登录Ip
	LastLoginIp: string
	// 是否默认（默认用户禁止删除）
	IsDefault: boolean
}