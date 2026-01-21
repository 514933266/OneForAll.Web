// 我的登录日志
export interface IPersonalLoginLog {
	Id: string
	TenantId: string
	UserName: string
	Source: string
    LoginType: string
    IPAddress: string
	CreatorId: string
	CreatorName: string
	CreateTime: Date
}
