// 全局异常日志
export interface ISysGlobalExceptionLog {
    // 所属模块名称
	MoudleName: string
    // 模块代码
	MoudleCode: string
    // 异常名称
	Name: string
    // 详细内容
	Content: string
    // 创建时间
	CreateTime: Date
}
