// 登录日志
export interface ISysLoginLog {
    // 用户名
	UserName: string
    // 来源
	Source: string
    // 登录方式
	LoginType: string
    // Ip地址
	IPAddress: string
    // 创建人名称
	CreatorName: string
    // 创建时间
	CreateTime: Date
}
