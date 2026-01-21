// 短信发送记录
export interface IUmsSmsRecord {
    // 平台名称
	PlatformName: string
    // 国家（或地区）码
	NationCode: string
    // 手机号码
	PhoneNumber: string
    // 原始消息
	Content: string
    // 发送状态
	Status: number
    // 错误消息
	ErrMsg: string
    // 创建时间
	CreateTime: Date
}
