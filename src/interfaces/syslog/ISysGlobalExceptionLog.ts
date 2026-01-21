// 全局异常日志
export interface ISysGlobalExceptionLog {
    // 所属模块名称
	ModuleName: string
    // 模块代码
	ModuleCode: string
    // 异常名称
	Name: string
    // 详细内容
	Content: string
    // 创建时间
	CreateTime: Date
}
