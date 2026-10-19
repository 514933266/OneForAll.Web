// 智多星（神策智投）：指数K线数据（四大指数日K/周K/月K 管理页）
// K线周期（与后端 period 参数一致；无分时口径）
export const ZDX_MARKET_KLINE_PERIODS = [
	{ value: 'day', label: '日K' },
	{ value: 'week', label: '周K' },
	{ value: 'month', label: '月K' }
]

// 四大指数板块代码（下拉选择数据源，顺序与后端 ZdxMarketConsts.SecIds 一致）
export const ZDX_MARKET_KLINE_CODES = [
	{ value: '000001', label: '上证指数' },
	{ value: '399001', label: '深证成指' },
	{ value: '399006', label: '创业板指' },
	{ value: '000680', label: '科创板（科创综指）' }
]

// 指数K线数据（三周期字段一致；字段名与后端序列化（PascalCase）一致）
export interface IZdxMarketKlineData {
	// 板块代码（000001上证/399001深成/399006创业板/000680科创综指）
	MarketCode: string
	// 交易日期（yyyy-MM-dd；周/月K为该周期最后交易日）
	TradeDate: string
	// 开盘点位
	OpenPrice: number
	// 收盘点位
	ClosePrice: number
	// 最高点位
	HighPrice: number
	// 最低点位
	LowPrice: number
	// 成交量（万手；周/月K为区间成交量）
	Volume: number
	// 成交额（亿元；周/月K为区间成交额）
	Amount: number
	// 涨跌幅（%）
	ChangePercent: number
	// 振幅（%（最高-最低）/前收盘；首根无前值为空）
	Amplitude?: number | null
}

// 指数K线数据写入表单（新增/更新入参；主键为板块代码+交易日期）
export interface IZdxMarketKlineDataForm {
	// 板块代码（主键，如 000001）
	MarketCode: string
	// 交易日期（主键，yyyy-MM-dd；周/月K为该周期最后交易日）
	TradeDate: string
	// 开盘点位
	OpenPrice?: number
	// 收盘点位
	ClosePrice?: number
	// 最高点位
	HighPrice?: number
	// 最低点位
	LowPrice?: number
	// 成交量（万手；周/月K为区间成交量）
	Volume?: number
	// 成交额（亿元；周/月K为区间成交额）
	Amount?: number
	// 涨跌幅（%）
	ChangePercent?: number
	// 振幅（%；留空为空）
	Amplitude?: number | null
}

// 指数K线数据查询条件
export interface IZdxMarketKlineDataQuery {
	// 板块代码（精确匹配，空=不限）
	Code?: string
	// 起始日期（yyyy-MM-dd，空=不限）
	Begin?: string
	// 结束日期（yyyy-MM-dd，空=不限）
	End?: string
}
