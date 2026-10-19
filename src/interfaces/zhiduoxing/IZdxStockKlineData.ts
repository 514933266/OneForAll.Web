// 智多星（神策智投）：K线数据（管理页）
// K线周期（与后端 period 参数一致）
export const ZDX_KLINE_PERIODS = [
	{ value: 'minute', label: '分时K' },
	{ value: 'day', label: '日K' },
	{ value: 'week', label: '周K' },
	{ value: 'month', label: '月K' }
]

// K线复权口径（与后端 fqt 参数一致；分时K不区分口径，切换控件不展示）
export const ZDX_KLINE_FQTS = [
	{ value: 'qfq', label: '前复权' },
	{ value: 'none', label: '不复权' }
]

// K线数据（分时K/日K/周K/月K；字段为四周期并集，按周期带值，其余为 null；字段名与后端序列化（PascalCase）一致）
export interface IZdxStockKlineData {
	// 股票代码
	StockCode: string
	// 交易日期
	TradeDate: string
	// 时间点（HH:mm；仅分时K，K线为 null）
	Minute?: string | null
	// 开盘价（日/周/月K）
	OpenPrice?: number | null
	// 收盘价（日/周/月K）
	ClosePrice?: number | null
	// 最高价（日/周/月K）
	HighPrice?: number | null
	// 最低价（日/周/月K）
	LowPrice?: number | null
	// 成交量（万手；K线为区间成交量，分时为累计成交量）
	Volume?: number | null
	// 成交额（亿元，日/周/月K）
	Amount?: number | null
	// 涨跌幅（%，日/周/月K）
	ChangePercent?: number | null
	// 换手率（%，日/周/月K）
	TurnoverRate?: number | null
	// 市盈率（日/周/月K）
	PERatio?: number | null
	// 市净率（日/周/月K）
	PBRatio?: number | null
	// 总市值（亿元，日/周/月K）
	TotalMarketValue?: number | null
	// 流通市值（亿元，日/周/月K）
	CirculatingMarketValue?: number | null
	// 价格（分时K）
	Price?: number | null
	// 均价（分时K）
	AvgPrice?: number | null
}

// K线数据写入表单（新增/更新入参；主键为股票代码+交易日期，分时另需时间点）
export interface IZdxStockKlineDataForm {
	// 股票代码（主键，如 000001）
	StockCode: string
	// 交易日期（主键，yyyy-MM-dd；周/月K为该周期最后交易日）
	TradeDate: string
	// 时间点（主键，仅分时K必填，HH:mm）
	Minute?: string
	// 开盘价（日/周/月K）
	OpenPrice?: number
	// 收盘价（日/周/月K）
	ClosePrice?: number
	// 最高价（日/周/月K）
	HighPrice?: number
	// 最低价（日/周/月K）
	LowPrice?: number
	// 成交量（万手；K线为区间成交量，分时为累计成交量）
	Volume?: number
	// 成交额（亿元，日/周/月K）
	Amount?: number
	// 涨跌幅（%，日/周/月K）
	ChangePercent?: number
	// 换手率（%，日/周/月K）
	TurnoverRate?: number
	// 市盈率（日/周/月K）
	PERatio?: number
	// 市净率（日/周/月K）
	PBRatio?: number
	// 总市值（亿元，日/周/月K）
	TotalMarketValue?: number
	// 流通市值（亿元，日/周/月K）
	CirculatingMarketValue?: number
	// 价格（分时K）
	Price?: number
	// 均价（分时K）
	AvgPrice?: number
}

// K线数据查询条件
export interface IZdxStockKlineDataQuery {
	// 股票代码（精确匹配，空=不限）
	Code?: string
	// 起始日期（yyyy-MM-dd，空=不限）
	Begin?: string
	// 结束日期（yyyy-MM-dd，空=不限）
	End?: string
}

// K线同步进度统计（K线管理页：股票池总数 + 按周期分开统计的覆盖股票数；字段名与后端序列化（PascalCase）一致）
export interface IZdxKlineProgressStats {
	// 股票池总数（zdx_stock）
	PoolCount: number
	// 日频覆盖统计（最近N个交易日：分时K + 日K两口径，按交易日倒序）
	Daily: IZdxKlineProgressDaily[]
	// 周K覆盖统计（最近N周：各周最后交易日为锚定统计日，按日期倒序）
	Weekly: IZdxKlineProgressWeek[]
	// 月K覆盖统计（最近N月：各月最后交易日为锚定统计日，按日期倒序）
	Monthly: IZdxKlineProgressMonth[]
}

// K线同步进度日频统计（单交易日分时K/日K已同步的股票数）
export interface IZdxKlineProgressDaily {
	// 交易日期
	TradeDate: string
	// 分时K覆盖股票数
	Minute: number
	// 日K-前复权覆盖股票数
	DailyQfq: number
	// 日K-不复权覆盖股票数
	DailyRaw: number
}

// K线同步进度周K统计（单周最后交易日已同步的股票数；周K仅每周最后交易日收盘后更新，其余日期仅含新股补数）
export interface IZdxKlineProgressWeek {
	// 该周最后交易日（周K锚定日期）
	TradeDate: string
	// 周K-前复权覆盖股票数
	WeeklyQfq: number
	// 周K-不复权覆盖股票数
	WeeklyRaw: number
}

// K线同步进度月K统计（单月最后交易日已同步的股票数；月K仅每月最后交易日收盘后更新，其余日期仅含新股补数）
export interface IZdxKlineProgressMonth {
	// 当月最后交易日（月K锚定日期）
	TradeDate: string
	// 月K-前复权覆盖股票数
	MonthlyQfq: number
	// 月K-不复权覆盖股票数
	MonthlyRaw: number
}

// 手动同步任务进度（K线管理页：异步后台任务——提交后立即返回，前端每2秒轮询展示进度条；字段名与后端序列化（PascalCase）一致）
export interface IZdxSyncProgress {
	// 是否执行中（false=最近一次已结束，下面字段为最近一次执行结果）
	Running: boolean
	// 任务键（minute/daily/weekly/monthly；用于按钮状态匹配）
	Key: string
	// 任务名称（如 日K同步/分时去重同步）
	Name: string
	// 阶段说明（如 正在同步 12/500（000001））
	Stage: string
	// 已处理数（只）
	Done: number
	// 总数（只；0=总数未知）
	Total: number
	// 百分比（0~100；执行中最多99，完成后100）
	Percent: number
	// 开始时间
	StartedAt?: string | null
	// 结束时间（空=未结束）
	FinishedAt?: string | null
	// 最近一次是否成功
	Success: boolean
	// 最近一次结果消息
	Message: string
}
