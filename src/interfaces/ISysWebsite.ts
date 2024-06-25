// 站点
export interface ISysWebsite {
	Id: string
	// 网站名称
	Name: string
	// 域名
	Host: string
	// 客户端
	OAuthClientId: string
	// 客户端密码
	OAuthClientSecret: string
	// 客户端名称
	OAuthClientName: string
	// 授权地址
	OAuthUrl: string
	// 登录背景图地址
	LoginBackgroundUrl: string
	Apis: ISysWebsiteApi[]
}

// 网站设置-Api
export interface ISysWebsiteApi {
	Id: string
	// 名称
	Name: string
	// 代码
	Code: string
	// 请求的域名
	Host: string
}
