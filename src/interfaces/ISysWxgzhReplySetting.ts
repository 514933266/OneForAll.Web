// 微信公众号回复设置
export interface ISysWxgzhReplySetting {
	Id: string
    // 应用id
	AppId: string
    // 所属公众号名称
	ClientName: string
    // 消息类型
	MsgType: number
    // 消息类型
	ReplyType: number
    // xml模板
    XmlContent: string
    // 回复内容json
    ContentJson: string
}

// 微信公众号消息返回内容设置
export interface ISysWxgzhReplySettingContent {
    Name: string
    Value: string
}
