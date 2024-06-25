// 系统通知
export interface ISysNotification {
	Id: string
    // 标题
	Title: string
    // 消息内容
	Content: string
    // 已发布
	IsPublish: boolean
    // 类型
	Type: number
    // 创建时间
	CreateTime: Date
    // 修改时间
	UpdateTime: Date
}