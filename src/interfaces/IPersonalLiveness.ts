// 我的工作活跃度
export interface IPersonalLiveness {
	UserId: string
	StartDate: Date
	EndDate: Date
	Dates: IPersonalLivnessDate[]
}

// 我的工作活跃度 - 具体日期数值
export interface IPersonalLivnessDate {
	Date: Date
	Value: number
	AvgValue: number
}
