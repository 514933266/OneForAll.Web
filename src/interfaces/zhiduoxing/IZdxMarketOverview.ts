// 智多星（神策智投）：中国市场大盘概览
// 涨跌分布区间
export interface IZdxChangeDistribution {
	// 区间名称（涨停/涨停-5%/5-1%等）
	Name: string
	// 家数
	Value: number
}

// 中国市场大盘概览（成交额、涨跌家数、涨停跌停、涨跌分布；字段名与后端序列化（PascalCase）一致）
export interface IZdxMarketOverview {
	// 是否存在该日数据（历史日期无记录时为 false）
	HasData: boolean
	// 当日沪深两市成交额（亿元）
	TotalAmount: number
	// 昨日沪深两市成交额（亿元）
	YesterdayAmount: number
	// 上涨家数
	UpCount: number
	// 下跌家数
	DownCount: number
	// 平盘家数
	FlatCount: number
	// 涨停家数
	LimitUpCount: number
	// 跌停家数
	LimitDownCount: number
	// 昨日上涨家数
	YesterdayUpCount: number
	// 昨日下跌家数
	YesterdayDownCount: number
	// 涨跌分布
	Distribution: IZdxChangeDistribution[]
	// AI 行情解读（收盘后生成；为空表示未生成）
	AiAnalysis?: string
}
