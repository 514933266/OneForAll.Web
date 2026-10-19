// 智多星（神策智投）：股票基础数据（管理页）
// 所属板块（与后端 ZdxStockMarketType 一致）
export const ZDX_STOCK_MARKET_TYPES = [
	{ value: 0, label: '上证主板' },
	{ value: 1, label: '深证主板' },
	{ value: 2, label: '创业板' },
	{ value: 3, label: '科创板' }
]

// 数据来源（与后端 ZdxMarketDataSource 一致）
export const ZDX_STOCK_DATA_SOURCES = [
	{ value: 0, label: '未知', tag: 'info' },
	{ value: 1, label: 'AI 生成', tag: 'info' },
	{ value: 2, label: '东财', tag: 'success' },
	{ value: 3, label: '人工维护', tag: 'warning' },
	{ value: 4, label: '腾讯', tag: 'primary' }
]

// 交易状态（与后端 ZdxTradeStatus 一致）
export const ZDX_STOCK_TRADE_STATUSES = [
	{ value: 0, label: '正常', tag: 'success' },
	{ value: 1, label: '停牌', tag: 'warning' },
	{ value: 2, label: '退市', tag: 'danger' }
]

// 股票基础数据（zdx_stock；含最新行情只读字段与人工维护标记；字段名与后端序列化（PascalCase）一致）
export interface IZdxStockData {
	// 主键
	Id: number
	// 股票代码
	Code: string
	// 股票名称
	Name: string
	// 股票简称
	ShortName: string
	// 所属板块（0=上证主板 1=深证主板 2=创业板 3=科创板）
	MarketType: number
	// 所属行业板块
	Sector: string
	// 上市时间（可为空）
	IpoDate?: string | null
	// 公司描述（可为空）
	Description: string
	// 是否ST
	IsST: boolean
	// 是否*ST
	IsSpecialST: boolean
	// 是否龙头股
	IsLeader: boolean
	// 最新价（只读，同步任务维护）
	Price: number
	// 涨跌幅%（只读，同步任务维护）
	ChangePercent: number
	// 数据来源（2=东财 3=人工维护 4=腾讯）
	DataSource: number
	// 交易状态（0=正常 1=停牌 2=退市；池同步任务维护）
	TradeStatus: number
	// 修改人（为空表示未经人工修改）
	Modifier?: string
	// 人工修改时间（仅人工维护时写入）
	ModifyTime?: string | null
	// 行情数据更新时间（同步任务刷新）
	UpdateTime: string
}

// 股票基础数据写入表单（仅含可编辑基础字段，行情快照字段由同步任务维护）
export interface IZdxStockDataForm {
	// 主键（编辑时必填；新增时忽略）
	Id?: number
	// 股票代码（新增必填；编辑时不可修改）
	Code: string
	// 股票名称（新增必填）
	Name: string
	// 股票简称
	ShortName?: string
	// 所属板块（0=上证主板 1=深证主板 2=创业板 3=科创板）
	MarketType: number
	// 所属行业板块
	Sector?: string
	// 上市时间（可为空）
	IpoDate?: string | null
	// 公司描述（可为空）
	Description?: string
	// 是否ST
	IsST: boolean
	// 是否*ST
	IsSpecialST: boolean
	// 是否龙头股
	IsLeader: boolean
}

// 股票基础数据查询条件
export interface IZdxStockDataQuery {
	// 关键字（股票代码/名称模糊匹配）
	Keyword?: string
	// 所属板块（空=不限）
	MarketType?: number
	// 数据来源（空=不限；2=东财 3=人工维护 4=腾讯）
	DataSource?: number
	// 交易状态（空=不限；0=正常 1=停牌 2=退市）
	TradeStatus?: number
}
