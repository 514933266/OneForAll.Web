// 个人日程
export interface IOAPersonalSchedule {
	Id: string
    // 提醒内容
	Content: string
    // 通知类型
	NotificationTypes: number[]
    // 提醒时间类型
	NotifyTimeType: number
    // 提前多少小时
	NotifyTimeSpan: number
    // 日程时间
	SettingDate: Date
    // 提醒时间
	NotifyTime: Date
    // 已关闭
	IsClosed: boolean
    // 创建人id
	CreatorId: string
    // 创建人
	CreatorName: string
    // 创建时间
    CreateTime: Date
}
