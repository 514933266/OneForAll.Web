// 智多星（神策智投）：个股详情页（详情/分时/K线/资讯/研报/公司/财务/股东/行业行情）
// 命名说明：接口字段名与后端序列化（PascalCase）一致

// 个股详情（报价指标；含列表项全部字段）
export interface IZdxStockDetail {
	// 股票代码
	Code: string
	// 股票名称
	Name: string
	// 所属行业板块
	Sector: string
	// 所属市场（shMain/szMain/cyb/kcb）
	Market: string
	// 最新价
	Price: number
	// 涨跌幅（%）
	ChangePercent: number
	// 涨跌额
	ChangeAmount: number
	// 成交量（万手）
	Volume: number
	// 成交额（亿元）
	Amount: number
	// 振幅（%）
	Amplitude: number
	// 是否涨停
	IsLimitUp: boolean
	// 是否跌停
	IsLimitDown: boolean
	// 是否龙头
	IsLeader: boolean
	// 是否ST
	IsST: boolean
	// 是否*ST
	IsSpecialST: boolean
	// 交易状态（0=正常 1=停牌 2=退市；池同步任务维护）
	TradeStatus: number
	// 今开
	Open: number
	// 最高
	High: number
	// 最低
	Low: number
	// 昨收
	PrevClose: number
	// 换手率（%）
	Turnover: number
	// 量比
	VolumeRatio: number
	// 市盈率（静态）
	PE: number
	// 市净率
	PB: number
	// 总市值（亿元）
	MarketCap: number
	// 涨停价
	LimitUp: number
	// 跌停价
	LimitDown: number
	// 总股本（亿股）
	TotalShares: number
	// 流通股本（亿股）
	FreeFloat: number
	// 发行数量（万股）
	IssuedShares: number
	// 每股收益（元）
	EPS: number
	// 每股净资产（元）
	BPS: number
	// 均价
	AvgPrice: number
	// 主力流入（亿元）
	MainInflow: number
	// 主力流出（亿元）
	MainOutflow: number
}

// 个股分时走势（Times/Prices/Avg/Volumes 四个平行序列，各49点）
export interface IZdxStockTrend {
	// 时间轴（HH:mm，上午25点 + 下午24点）
	Times: string[]
	// 价格序列（个股最新价）
	Prices: number[]
	// 均价线（截至各点的累计均值）
	Avg: number[]
	// 分时成交量（万手）
	Volumes: number[]
}

// 个股K线数据点（日/周/月K通用，按日期升序）
export interface IZdxStockKlinePoint {
	// 日期（yyyy-MM-dd）
	Date: string
	// 开盘价
	Open: number
	// 收盘价
	Close: number
	// 最高价
	High: number
	// 最低价
	Low: number
	// 成交量（万手）
	Volume: number
	// 涨跌幅（%，相对前一周期收盘；首根为0）
	ChangePercent?: number | null
	// 振幅（%（最高-最低）/前收盘；首根为空）
	Amplitude?: number | null
	// 5日均线（不足5根为空）
	Ma5?: number | null
	// 20日均线（不足20根为空）
	Ma20?: number | null
	// 120日均线（不足120根为空）
	Ma120?: number | null
	// 250日均线（不足250根为空）
	Ma250?: number | null
	// 4周均线（不足4根为空）
	Ma4?: number | null
	// 3月均线（不足3根为空）
	Ma3?: number | null
	// 6月均线（不足6根为空）
	Ma6?: number | null
	// 12周/12月均线（不足周期为空）
	Ma12?: number | null
	// 24周均线（不足24根为空）
	Ma24?: number | null
	// 48周均线（不足48根为空）
	Ma48?: number | null
	// 5周期量均线（万手；不足5根为空）
	VolMa5?: number | null
	// 10周期量均线（万手；不足10根为空）
	VolMa10?: number | null
	// 20周期量均线（万手；不足20根为空）
	VolMa20?: number | null
	// 4周量均线（不足4根为空）
	VolMa4?: number | null
	// 12周量均线（不足12根为空）
	VolMa12?: number | null
	// 3月量均线（不足3根为空）
	VolMa3?: number | null
	// 6月量均线（不足6根为空）
	VolMa6?: number | null
}

// 资讯条目
export interface IZdxNewsItem {
	// 标题
	Title: string
	// 来源（公司公告无来源）
	Source: string
	// 发布时间（yyyy-MM-dd HH:mm）
	Date: string
	// 原文链接（资讯为东财新闻页；公告为东财公告详情页；可能为空=不可跳转）
	Url?: string
}

// 个股资讯（最新资讯 + 公司公告）
export interface IZdxStockNews {
	// 最新资讯
	LatestNews: IZdxNewsItem[]
	// 公司公告
	Announcements: IZdxNewsItem[]
}

// 研报条目
export interface IZdxReportItem {
	// 标题
	Title: string
	// 机构来源（行业研报无）
	Source: string
	// 评级（买入/增持/中性等，行业研报无）
	Rating: string
	// 发布日期（yyyy-MM-dd）
	Date: string
}

// 个股研报（个股研报 + 行业研报）
export interface IZdxStockReports {
	// 个股研报
	StockReports: IZdxReportItem[]
	// 行业研报
	IndustryReports: IZdxReportItem[]
}

// 公司信息行（label/value 与 subLabel/subValue 成对展示）
export interface IZdxCompanyRow {
	// 字段名
	Label: string
	// 字段值
	Value: string
	// 第二字段名
	SubLabel: string
	// 第二字段值
	SubValue: string
}

// 公司资料（简介 + 基本信息表）
export interface IZdxCompanyInfo {
	// 公司简介
	Profile: string
	// 基本信息行
	Rows: IZdxCompanyRow[]
}

// 财务指标行（行对象平铺，"name" 为指标名，其余键=报告期短列头）
export type IZdxFinanceRow = Record<string, string>

// 净利润趋势点
export interface IZdxProfitTrendPoint {
	// 报告期（yyyy-MM-dd）
	Date: string
	// 归属净利润（亿元）
	Value: number
	// 同比（%）
	Yoy: number
}

// 财务数据（净利润趋势 + 每股指标 + 成长能力）
export interface IZdxStockFinance {
	// 表格报告期列（倒序短列头，如 26-06-30 ... 25-03-31）
	Periods: string[]
	// 每股指标
	PerShareRows: IZdxFinanceRow[]
	// 成长能力指标
	GrowthRows: IZdxFinanceRow[]
	// 净利润趋势
	ProfitTrend: IZdxProfitTrendPoint[]
}

// 十大股东条目
export interface IZdxHolder {
	// 股东名称
	Name: string
	// 持股数（股，千分位文本）
	Shares: string
	// 占流通股比（百分比文本）
	Ratio: string
	// 环比增减文本（不变/新进/-11.14%/11.85%等）
	Change: string
	// 增减方向（up/down/flat）
	ChangeType: string
}

// 股东人数趋势点
export interface IZdxHolderCountPoint {
	// 统计日期（yyyy/MM/dd）
	Date: string
	// 股东人数（万户）
	Count: number
	// 股价（元）
	Price: number
	// 是否预测值
	IsForecast: boolean
}

// 股东信息（十大流通股东 + 股东人数趋势）
export interface IZdxShareholderInfo {
	// 可选报告期（用于切换下拉）
	Dates: string[]
	// 十大流通股东（指定报告期）
	TopHolders: IZdxHolder[]
	// 股东人数趋势
	HolderCountTrend: IZdxHolderCountPoint[]
}

// 行业走势点（近22个交易日）
export interface IZdxSectorTrendPoint {
	// 日期标签（dd日）
	Date: string
	// 收盘点位
	Close: number
	// 成交量
	Volume: number
}

// 行业行情详情（指数点位 + 涨跌家数 + 本月走势）
export interface IZdxSectorDetail {
	// 行业名称
	Name: string
	// 行业指数点位
	Value: number
	// 板块涨跌幅（%）
	Change: number
	// 成份股总数
	Total: number
	// 上涨家数
	Up: number
	// 平盘家数
	Flat: number
	// 下跌家数
	Down: number
	// 本月走势（近22个交易日）
	Trends: IZdxSectorTrendPoint[]
}
