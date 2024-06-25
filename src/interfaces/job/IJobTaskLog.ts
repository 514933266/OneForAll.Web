// 定时任务日志
export interface IJobTaskLog {
    // 主键
	Id: string
    // 应用程序id
	AppId: string
    // 任务名称
	TaskName: string
    // 日志内容
	Content: string
    // 类型
	Type: number
    // 创建时间
	CreateTime: Date
}
