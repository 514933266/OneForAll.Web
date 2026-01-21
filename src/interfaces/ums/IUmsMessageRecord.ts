// 系统消息发送记录
export interface IUmsMessageRecord {
	// 请求地址
	RequestUrl: string
	// 结果
	Result: string
	// 交换机名称
	ExChangeName: string
	// 队列名称
	QueueName: string
	// 路由键名称
	RouteKey: string
	// 原始消息
	OriginalMessage: string
	// 创建时间
	CreateTime: Date
	// 状态
	Status: number
}
