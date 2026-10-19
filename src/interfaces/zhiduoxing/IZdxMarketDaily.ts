// 智多星（神策智投）：每日大盘行情（管理页）
// 数据来源（与后端 ZdxMarketDataSource 一致）
export const ZDX_MARKET_DATA_SOURCES = [
	{ value: 0, label: '未知', tag: 'info' },
	{ value: 1, label: 'AI 生成', tag: 'info' },
	{ value: 2, label: '东财', tag: 'success' },
	{ value: 3, label: '人工维护', tag: 'warning' }
]

// 每日大盘行情记录（zdx_market_daily；字段名与后端序列化（PascalCase）一致）
export interface IZdxMarketDaily {
	// 交易日期（yyyy-MM-dd HH:mm:ss）
	TradeDate: string
	// 成交额（亿元，沪深两市合计）
	Amount: number
	// 成交量（亿手，沪深两市合计）
	Volume: number
	// 上涨家数
	UpCount: number
	// 下跌家数
	DownCount: number
	// 平盘家数
	FlatCount: number
	// 涨停家数
	LimitUpCount: number
	// 涨幅5%以上未涨停家数
	UpGt5Count: number
	// 涨幅1%~5%家数
	Up1To5Count: number
	// 涨幅0~1%家数（不含平盘）
	Up0To1Count: number
	// 跌幅0~1%家数（不含平盘）
	Down0To1Count: number
	// 跌幅1%~5%家数
	Down1To5Count: number
	// 跌幅5%以上未跌停家数
	DownGt5Count: number
	// 跌停家数
	LimitDownCount: number
	// 数据来源（0=未知 1=AI生成 2=东财 3=人工维护）
	DataSource: number
	// AI 行情解读（可为空表示未生成）
	AiAnalysis?: string
	// 修改人（为空表示未经人工修改）
	Modifier?: string
	// 更新时间
	UpdateTime: string
}

// 每日大盘行情写入表单（新增/修正；数据来源/修改人/更新时间由服务端落库时写入）
export interface IZdxMarketDailyForm {
	// 交易日期（yyyy-MM-dd）
	TradeDate: string
	// 成交额（亿元，沪深两市合计）
	Amount: number
	// 成交量（亿手，沪深两市合计）
	Volume: number
	// 上涨家数
	UpCount: number
	// 下跌家数
	DownCount: number
	// 平盘家数
	FlatCount: number
	// 涨停家数
	LimitUpCount: number
	// 涨幅5%以上未涨停家数
	UpGt5Count: number
	// 涨幅1%~5%家数
	Up1To5Count: number
	// 涨幅0~1%家数（不含平盘）
	Up0To1Count: number
	// 跌幅0~1%家数（不含平盘）
	Down0To1Count: number
	// 跌幅1%~5%家数
	Down1To5Count: number
	// 跌幅5%以上未跌停家数
	DownGt5Count: number
	// 跌停家数
	LimitDownCount: number
	// AI 行情解读（留空表示不修改）
	AiAnalysis?: string
}
