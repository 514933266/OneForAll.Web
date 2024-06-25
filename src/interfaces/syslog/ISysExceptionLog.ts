// 异常日志
export interface ISysExceptionLog {
    // 所属模块名称
	MoudleName: string
    // 模块代码
	MoudleCode: string
    // 控制器
	Controller: string
    // 控制器方法
	Action: string
    // 异常名称
	Name: string
    // 详细内容
	Content: string
    // 创建人名称
	CreatorName: string
    // 创建时间
	CreateTime: Date
}
