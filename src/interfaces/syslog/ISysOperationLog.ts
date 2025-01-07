// 操作日志
export interface ISysOperationLog {
	// 所属模块名称
	MoudleName: string
	// 模块代码
	MoudleCode: string
	// 控制器
	Controller: string
	// 控制器方法
	Action: string
	// 操作类型
	Type: string
	// 详细内容
	Content: string
	// 备注
	Remark: string
	// 创建人名称
	CreatorName: string
	// 创建时间
	CreateTime: Date
	// 消耗时间
	TimeSpan: string
}
