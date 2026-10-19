// 智多星（神策智投）：板块K线数据（行业日K/周K/月K 管理页）
// K线周期（与后端 period 参数一致；无分时口径）
export const ZDX_SECTOR_KLINE_PERIODS = [
	{ value: 'day', label: '日K' },
	{ value: 'week', label: '周K' },
	{ value: 'month', label: '月K' }
]

// 数据来源（与后端 ZdxMarketDataSourceEnum 一致：2=东财板块指数、4=腾讯行业指数；行业K线双渠道分行存底）
export const ZDX_SECTOR_DATA_SOURCES = [
	{ value: 2, label: '东财' },
	{ value: 4, label: '腾讯' }
]
// 数据来源枚举值（避免魔法数字）
export const ZDX_DATA_SOURCE = {
	EASTMONEY: 2,
	TENCENT: 4
} as const

// 数据来源标签（空/未知返回空串）
export function zdxDataSourceLabel(source?: number | null): string {
	if (source === ZDX_DATA_SOURCE.EASTMONEY) return '东财'
	if (source === ZDX_DATA_SOURCE.TENCENT) return '腾讯'
	return ''
}

// 板块K线数据（三周期字段一致；字段名与后端序列化（PascalCase）一致）
export interface IZdxSectorKlineData {
	// 数据来源（主键首列，2=东财板块指数、4=腾讯行业指数）
	DataSource: number
	// 行业名称（与 zdx_sector.Name 口径一致）
	SectorName: string
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

// 板块K线数据写入表单（新增/更新入参；主键为 数据来源+行业名称+交易日期）
export interface IZdxSectorKlineDataForm {
	// 数据来源（主键首列，2=东财板块指数、4=腾讯行业指数）
	DataSource: number
	// 行业名称（主键，与 zdx_sector.Name 口径一致）
	SectorName: string
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

// 板块K线数据查询条件
export interface IZdxSectorKlineDataQuery {
	// 行业名称（精确匹配，空=不限）
	Name?: string
	// 起始日期（yyyy-MM-dd，空=不限）
	Begin?: string
	// 结束日期（yyyy-MM-dd，空=不限）
	End?: string
	// 数据来源（2=东财/4=腾讯，空=不限）
	DataSource?: number
}
