// 消息通知配置
export interface IUmsNotificationConfig {
	Id: string
	// 客户端id
	ClientId: string
	// 代码（唯一）
	Code: string
	// 通知类型
	NotificationType: number
	// 目标值json
	TargetJson: string
	// 备注
	Remark: string
	// 是否启用
	IsEnabled: boolean
	// 创建时间
	CreateTime: string
}
