// 智多星（神策智投）：个股信息数据管理（资讯/研报/公司/财务/股东 五类同步数据）
// 条目类型（与后端 ZdxStockNewsTypeEnum 一致）
export const ZDX_STOCK_NEWS_TYPES = [
	{ value: 1, label: '资讯', tag: 'primary' },
	{ value: 2, label: '公告', tag: 'warning' }
]

// 研报类型（与后端 ZdxStockReportTypeEnum 一致）
export const ZDX_STOCK_REPORT_TYPES = [
	{ value: 1, label: '个股研报', tag: 'primary' },
	{ value: 2, label: '行业研报', tag: 'warning' }
]

// 资讯/公告（zdx_stock_news；字段名与后端序列化（PascalCase）一致）
export interface IZdxStockNewsData {
	// 主键
	Id: number
	// 股票代码
	StockCode: string
	// 条目类型（1资讯 2公告）
	ItemType: number
	// 标题
	Title: string
	// 来源（资讯=媒体名；公告无来源）
	Source?: string
	// 原文链接
	Url?: string
	// 发布时间
	PublishTime: string
	// 入库时间
	CreateTime: string
}

// 研报（zdx_stock_report）
export interface IZdxStockReport {
	// 主键
	Id: number
	// 股票代码
	StockCode: string
	// 研报类型（1个股研报 2行业研报）
	ItemType: number
	// 标题
	Title: string
	// 机构简称
	OrgName?: string
	// 研究员
	Researcher?: string
	// 评级（买入/增持/中性等；行业研报无）
	Rating?: string
	// 行业名称
	IndustryName?: string
	// 东财研报唯一编码
	InfoCode?: string
	// 原文链接
	Url?: string
	// 发布日期
	PublishDate: string
	// 入库时间
	CreateTime: string
}

// 公司资料（zdx_stock_company）
export interface IZdxStockCompany {
	// 股票代码
	StockCode: string
	// 公司简介
	Profile?: string
	// 基本信息行（ZdxCompanyRowDto 列表的 JSON 序列化）
	RowsJson?: string
	// 更新时间
	UpdateTime: string
}

// 财务指标（zdx_stock_finance；金额字段单位为元）
export interface IZdxStockFinanceData {
	// 股票代码
	StockCode: string
	// 报告期
	ReportDate: string
	// 基本每股收益（元）
	Eps: number
	// 扣非每股收益（元）
	EpsDeduct: number
	// 稀释每股收益（元）
	EpsDiluted: number
	// 每股净资产（元）
	Bps: number
	// 每股公积金（元）
	CapitalReserve: number
	// 每股未分配利润（元）
	UndistProfit: number
	// 每股经营现金流（元）
	OpCashFlow: number
	// 营业总收入（元）
	Revenue: number
	// 归属净利润（元）
	NetProfit: number
	// 扣非净利润（元）
	DeductNetProfit: number
	// 营业总收入同比（%）
	RevenueYoy: number
	// 归属净利润同比（%）
	NetProfitYoy: number
	// 扣非净利润同比（%）
	DeductNetProfitYoy: number
	// 净资产收益率（加权，%）
	Roe: number
	// 更新时间
	UpdateTime: string
}

// 十大流通股东（zdx_stock_holder）
export interface IZdxStockHolder {
	// 股票代码
	StockCode: string
	// 报告期
	EndDate: string
	// 股东排名（1-10）
	HolderRank: number
	// 股东名称
	HolderName: string
	// 持股数（股）
	Shares: number
	// 占流通股比（%）
	Ratio: number
	// 环比增减文本（不变/新进/-11.14%/11.85%等）
	Change?: string
	// 增减方向（up/down/flat）
	ChangeType?: string
	// 更新时间
	UpdateTime: string
}

// 资讯/公告查询条件
export interface IZdxStockNewsQuery {
	// 股票代码（空=不限）
	Code?: string
	// 条目类型（空=不限；1资讯 2公告）
	ItemType?: number
}

// 研报查询条件
export interface IZdxStockReportQuery {
	// 股票代码（空=不限）
	Code?: string
	// 研报类型（空=不限；1个股研报 2行业研报）
	ItemType?: number
}

// 分类统计（单类）
export interface IZdxStockInfoCategoryStats {
	// 已覆盖股票数
	StockCount: number
	// 数据行数
	RowCount: number
	// 最近数据时间（无数据为空）
	LastTime?: string
}

// 五类数据统计（管理页概览）
export interface IZdxStockInfoStats {
	// 股票池总数（覆盖率分母）
	PoolCount: number
	// 资讯（含公告）
	News: IZdxStockInfoCategoryStats
	// 研报（含行业研报）
	Reports: IZdxStockInfoCategoryStats
	// 公司资料
	Company: IZdxStockInfoCategoryStats
	// 财务指标
	Finance: IZdxStockInfoCategoryStats
	// 十大流通股东
	Holders: IZdxStockInfoCategoryStats
}
