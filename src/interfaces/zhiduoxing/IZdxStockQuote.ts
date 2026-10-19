// 智多星（神策智投）：市场板块与个股行情（行情页）
// 命名说明：接口字段名与后端序列化（PascalCase）一致

// 市场板块快照（4大板块，腾讯渠道同步落库后读库）
export interface IZdxMarketQuote {
	// 板块代码（000001上证/399001深成/399006创业板/000680科创板〔科创综指〕）
	Code: string
	// 板块名称
	Name: string
	// 当前点位
	Value: number
	// 涨跌幅（%）
	Percent: number
	// 成交额（亿元）
	Amount: number
}

// 市场板块分时走势（Times/Prices/Avg/Volumes 四个平行序列）
export interface IZdxMarketTrend {
	// 时间轴（HH:mm）
	Times: string[]
	// 价格序列（板块点位）
	Prices: number[]
	// 均价线（截至各点的累计均值）
	Avg: number[]
	// 分时成交量（累计，手）
	Volumes: number[]
}

// 市场板块K线数据点（日/周/月K通用，按日期升序）
export interface IZdxMarketKlinePoint {
	// 交易日期（yyyy-MM-dd）
	Date: string
	// 开盘价
	Open: number
	// 收盘价
	Close: number
	// 最高价
	High: number
	// 最低价
	Low: number
	// 成交量（百手口径：数值×100=实际手数，展示层换算为口语化量词）
	Volume: number
	// 涨跌幅（%，相对前一周期收盘；首根为0；后端落库字段）
	ChangePercent?: number | null
	// 振幅（%（最高-最低）/前收盘；首根无前值为空；后端落库字段）
	Amplitude?: number | null
	// 5日均线（不足5根为空；仅日K带值）
	Ma5?: number | null
	// 20日均线（不足20根为空；仅日K带值）
	Ma20?: number | null
	// 120日均线（不足120根为空；仅日K带值）
	Ma120?: number | null
	// 250日均线（不足250根为空；仅日K带值）
	Ma250?: number | null
	// 4周均线（不足4根为空；仅周K带值）
	Ma4?: number | null
	// 3月均线（不足3根为空；仅月K带值）
	Ma3?: number | null
	// 6月均线（不足6根为空；仅月K带值）
	Ma6?: number | null
	// 12周/12月均线（不足周期为空；周K请求=12周均线、月K请求=12月均线）
	Ma12?: number | null
	// 24周均线（不足24根为空；仅周K带值）
	Ma24?: number | null
	// 48周均线（不足48根为空；仅周K带值）
	Ma48?: number | null
	// 5周期量均线（成交量滑窗均值，百手口径；不足5根为空；三周期均带值；后端落库字段）
	VolMa5?: number | null
	// 10周期量均线（百手口径；不足10根为空；三周期均带值；后端落库字段）
	VolMa10?: number | null
	// 20周期量均线（百手口径；不足20根为空；三周期均带值；后端落库字段）
	VolMa20?: number | null
	// 4周量均线（百手口径；不足4根为空；仅周K带值；后端落库字段；周K量MA4）
	VolMa4?: number | null
	// 12周量均线（百手口径；不足12根为空；仅周K带值；后端落库字段；周K量MA12）
	VolMa12?: number | null
	// 3月量均线（百手口径；不足3根为空；仅月K带值；后端落库字段；月K量MA3）
	VolMa3?: number | null
	// 6月量均线（百手口径；不足6根为空；仅月K带值；后端落库字段；月K量MA6）
	VolMa6?: number | null
}

// 个股行情列表项（当日快照）
export interface IZdxStockQuoteItem {
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
}

// 个股行情查询条件（对应后端 ZdxStockQueryForm）
export interface IZdxStockQuoteQuery {
	// 股票代码（模糊）
	Code?: string
	// 股票名称（模糊）
	Name?: string
	// 所属市场（shMain/szMain/cyb/kcb）
	Market?: string
	// 行业板块
	Sector?: string
	// 涨跌幅下限（%）
	PercentMin?: number
	// 涨跌幅上限（%）
	PercentMax?: number
	// 市值下限（亿元）
	MarketCapMin?: number
	// 市值上限（亿元）
	MarketCapMax?: number
	// 只看涨停
	LimitUp?: boolean
	// 只看跌停
	LimitDown?: boolean
	// 只看龙头
	Leader?: boolean
	// 不看ST（含*ST）
	HideST?: boolean
	// 不看*ST
	HideSpecialST?: boolean
	// 显示退市股（默认隐藏；停牌股始终显示）
	ShowDelisted?: boolean
}

// 市场Tab（上证主板/深证主板/创业板/科创板及市场家数）
export interface IZdxStockMarketTab {
	// 市场标识（shMain/szMain/cyb/kcb）
	Key: string
	// 市场名称
	Label: string
	// 市场股票家数（全市场口径）
	Count: number
}

// 行业板块摘要（只读库内行业行情快照 zdx_sector：东财板块口径优先、股票池等权聚合兜底；按涨跌幅降序）
export interface IZdxSectorSummary {
	// 行业名称
	Name: string
	// 成份股总数
	Total: number
	// 上涨家数
	Up: number
	// 下跌家数
	Down: number
	// 平盘家数
	Flat: number
	// 板块指数点位（东财板块口径有点位；股票池聚合兜底口径为 null）
	Value?: number | null
	// 板块涨跌幅（%；东财板块口径或股票池等权平均）
	Change: number
}

// 市场资讯（24小时滚动：含关联股票；要闻精华：无单一关联股票）
export interface IZdxMarketNews {
	// 关联股票代码（要闻精华为空）
	StockCode?: string | null
	// 关联股票名称（要闻精华为空）
	StockName?: string | null
	// 标题
	Title: string
	// 来源（媒体名）
	Source?: string | null
	// 原文链接
	Url?: string | null
	// 发布时间
	PublishTime: string
}

// 龙虎榜上榜个股（最新交易日，按净买额降序；同一股票可因多个上榜原因出现多条）
export interface IZdxMarketLhb {
	// 股票代码
	StockCode: string
	// 股票名称
	StockName: string
	// 交易日期
	TradeDate: string
	// 上榜原因
	Explanation?: string | null
	// 补充说明（如：2家机构买入）
	Remark?: string | null
	// 收盘价（元）
	ClosePrice: number
	// 涨跌幅（%）
	ChangeRate: number
	// 龙虎榜净买额（元）
	NetAmount: number
	// 龙虎榜买入额（元）
	BuyAmount: number
	// 龙虎榜卖出额（元）
	SellAmount: number
	// 龙虎榜成交额（元）
	DealAmount: number
	// 当日总成交额（元）
	TotalAmount: number
	// 净买额占总成交比（%）
	NetRatio: number
	// 换手率（%）
	TurnoverRate: number
}
