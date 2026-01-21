// 微信关注用户
export interface ISysWxgzhSubscribeUser {
	Id: string
    // OpenId
	OpenId: string
    // 应用id
	AppId: string
    // 用户名
	UserName: string
    // 用户名
	UserNickName: string
    // 客户端名称
	ClientName: string
    // 订阅时间
	CreateTime: string
    // 关注方式
	SubscribeType: number
}
