// 登录客户端
export interface ISysClient {
	Id: string
    // 系统客户端id
	ClientId: string
    // 系统客户端密码
	ClientSecret: string
    // 系统客户端名称
	ClientName: string
    // 允许自动创建账号
	AutoCreateAccount: boolean
    // 类型
	Type: number
    // 角色
	Role: string
    // 创建时间
	CreateTime: Date
}
