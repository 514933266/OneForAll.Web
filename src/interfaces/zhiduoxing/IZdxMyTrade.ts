// 智多星（神策智投）：我的地盘（个人交易记录导入/流水/持仓/统计/收益日历）
// 标签颜色类型（与 el-tag type 一致）
export type ZdxTagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

// 交易类别（与后端 ZdxTradeCategoryEnum 一致）
export const ZDX_TRADE_CATEGORIES: { value: number; label: string; tag: ZdxTagType }[] = [
	{ value: 1, label: '买入', tag: 'danger' },
	{ value: 2, label: '卖出', tag: 'success' },
	{ value: 3, label: '银行转证券', tag: 'info' },
	{ value: 4, label: '证券转银行', tag: 'warning' },
	{ value: 5, label: '红利入账', tag: 'warning' },
	{ value: 6, label: '利息归本', tag: 'info' },
	{ value: 0, label: '其他', tag: 'info' }
]

// 个人交易记录（流水行/个股交易记录行；字段名与后端序列化（PascalCase）一致）
export interface IZdxTradeRecordData {
	// 记录 Id
	Id: number
	// 发生日期（yyyy-MM-dd HH:mm:ss）
	TradeDate: string
	// 发生时间（HH:mm:ss，可空）
	TradeTime?: string
	// 证券代码
	StockCode: string
	// 证券名称
	StockName?: string
	// 交易类别（1买入 2卖出 3银行转证券 4证券转银行 5红利入账 6利息归本 0其他）
	Category: number
	// 原始交易类别文本（导入文件原文）
	CategoryName?: string
	// 成交数量（股）
	Volume: number
	// 成交均价（元）
	Price: number
	// 成交金额（元）
	Amount: number
	// 发生金额（元；正=资金流入，负=资金流出）
	CashAmount: number
	// 佣金（元）
	Commission: number
	// 其他费用（元）
	OtherFee: number
	// 印花税（元）
	StampTax: number
	// 过户费（元）
	TransferFee: number
	// 股份余额（股）
	ShareBalance: number
	// 资金余额（元）
	CashBalance: number
	// 成交编号
	TradeNo?: string
	// 股东账号
	ShareholderNo?: string
	// 流水号
	SerialNo?: string
	// 交易市场
	Market?: string
	// 币种
	Currency?: string
}

// 交易记录导入结果（导入弹窗展示）
export interface IZdxTradeImportResult {
	// 导入流程是否正常执行（false=格式级失败，仅 Message 有值）
	Success: boolean
	// 结果说明（成功概要或失败原因）
	Message: string
	// 导入批次 Id（0=未产生批次）
	BatchId: number
	// 数据总行数
	TotalRows: number
	// 成功入库行数
	ImportedRows: number
	// 跳过行数（库内已存在）
	SkippedRows: number
	// 失败行数（解析失败）
	FailRows: number
	// 失败明细（第N行 + 原因）
	Errors: string[]
}

// 持仓项（移动加权平均成本；现价取行情快照；末位可能附带今日清仓挂显行）
export interface IZdxTradePosition {
	// 股票代码
	StockCode: string
	// 股票名称
	StockName: string
	// 所属行业板块（行情快照；无快照为空）
	Sector?: string
	// 持仓数量（股）
	Volume: number
	// 成本价（移动加权平均，买入费用计入成本）
	AvgCost: number
	// 现价（行情快照；无快照为0）
	Price: number
	// 涨跌幅（%，行情快照；无快照为0）
	ChangePercent: number
	// 持仓市值（现价×数量；无现价为0）
	MarketValue: number
	// 持仓浮动盈亏（无现价为0）
	FloatProfit: number
	// 持仓浮动盈亏比例（%，无现价或成本价缺失为0）
	FloatProfitPercent: number
	// 该股净盈亏（含已清仓部分）
	RealizedProfit: number
	// 是否今日清仓（今日有卖出且收盘无持仓；券商持仓页行为：当天卖出的股票挂显一天）
	IsClearedToday?: boolean
	// 今日清仓行的当日盈亏（券商口径：卖出净额 + 今收剩余市值 − 昨收市值 − 今日买入成本；仅 IsClearedToday 时有效）
	TodayProfit?: number
}

// 收益日历日明细（点击日历某日弹出的"当日明细"）
export interface IZdxTradeDayDetail {
	// 目标日期
	TradeDate: string
	// 该日是否有数据（早于导入起点的日期为false，前端提示无数据）
	HasData: boolean
	// 持仓浮动明细（目标日日终持仓；无行情时 ClosePrice=0、FloatProfit=0）
	Positions: IZdxTradeDayPositionItem[]
	// 持仓浮动盈亏合计
	FloatProfitSum: number
	// 卖出净盈亏明细（逐笔，按时间升序）
	Sells: IZdxTradeDaySellItem[]
	// 卖出净盈亏合计
	SellProfitSum: number
	// 卖出费用合计（卖出明细行费用之和）
	SellFeeSum: number
	// 费用分项（当日买卖实际发生额）
	Fees: IZdxTradeDayFee
}

// 持仓浮动明细项（目标日日终持仓）
export interface IZdxTradeDayPositionItem {
	// 股票代码
	StockCode: string
	// 股票名称
	StockName: string
	// 持仓数量（股）
	Volume: number
	// 含费成本价（移动加权平均，买入费用计入成本）
	AvgCost: number
	// 当日收盘价（当天=最新行情价；无行情为0）
	ClosePrice: number
	// 持仓浮动盈亏=（收盘价−含费成本）×数量（无行情为0）
	FloatProfit: number
}

// 卖出净盈亏明细项（逐笔）
export interface IZdxTradeDaySellItem {
	// 成交时间（HH:mm:ss，可空）
	TradeTime?: string
	// 股票代码
	StockCode: string
	// 股票名称
	StockName: string
	// 卖出均价（元）
	Price: number
	// 卖出数量（股）
	Volume: number
	// 成交金额（元）
	Amount: number
	// 含费成本价（卖出时点移动加权）
	AvgCost: number
	// 卖出费用（元；佣金+印花税+过户费+其他）
	Fee: number
	// 净盈亏=卖出净额−含费成本×数量−卖出费用（移动加权口径）
	Profit: number
}

// 当日费用分项（买卖实际发生额）
export interface IZdxTradeDayFee {
	// 佣金合计
	CommissionSum: number
	// 印花税合计（仅卖出）
	StampTaxSum: number
	// 过户费合计
	TransferFeeSum: number
	// 其他费用合计
	OtherFeeSum: number
	// 费用合计（佣金+印花税+过户费+其他）
	FeeSum: number
	// 买入费用合计
	BuyFeeSum: number
	// 卖出费用合计
	SellFeeSum: number
	// 逐笔明细（当日买入+卖出各笔，按时间升序）
	Items: IZdxTradeDayFeeItem[]
}

// 费用逐笔明细项（当日一笔买入或卖出）
export interface IZdxTradeDayFeeItem {
	// 成交时间（HH:mm:ss，可空）
	TradeTime?: string
	// 股票代码
	StockCode: string
	// 股票名称
	StockName: string
	// 是否买入（false=卖出）
	IsBuy: boolean
	// 成交金额（元）
	Amount: number
	// 佣金（元）
	Commission: number
	// 印花税（元；仅卖出）
	StampTax: number
	// 过户费（元）
	TransferFee: number
	// 其他费用（元）
	OtherFee: number
	// 费用合计（元）
	FeeSum: number
}

// 单只股票交易统计（交易分析按股票汇总行）
export interface IZdxTradeStockStat {
	// 股票代码
	StockCode: string
	// 股票名称
	StockName: string
	// 所属行业板块（行情快照；无快照为空）
	Sector?: string
	// 交易次数（买入+卖出笔数）
	TradeCount: number
	// 买入笔数
	BuyCount: number
	// 卖出笔数
	SellCount: number
	// 盈利卖出笔数
	WinSellCount: number
	// 胜率（%，盈利卖出笔数÷卖出笔数；无卖出为0）
	WinRate: number
	// 盈亏比（平均盈利÷平均亏损；无亏损或无盈利为0，前端可显示∞）
	ProfitRatio: number
	// 平均盈利（盈利卖出利润合计÷盈利笔数；无盈利为0）
	AvgProfit: number
	// 平均亏损（亏损卖出利润合计绝对值÷亏损笔数；无亏损为0）
	AvgLoss: number
	// 买入总额（成交金额，不含费用）
	BuyAmount: number
	// 卖出总额（成交金额，不含费用）
	SellAmount: number
	// 净盈亏（含已清仓部分）
	RealizedProfit: number
	// 最近一次成交日期（交易分析个股列表按此倒序）
	LastTradeDate: string
}

// 交易统计（总体口径 + 按股票维度汇总；仅统计买卖成交类，胜率按笔）
export interface IZdxTradeStats {
	// 成交类总笔数（买入+卖出）
	TotalCount: number
	// 买入笔数
	BuyCount: number
	// 卖出笔数
	SellCount: number
	// 盈利卖出笔数
	WinSellCount: number
	// 胜率（%，盈利卖出笔数÷卖出总笔数；无卖出为0）
	WinRate: number
	// 盈亏比（平均盈利÷平均亏损；无亏损或无盈利为0，前端可显示∞）
	ProfitRatio: number
	// 平均盈利（盈利卖出利润合计÷盈利笔数；无盈利为0）
	AvgProfit: number
	// 平均亏损（亏损卖出利润合计绝对值÷亏损笔数；无亏损为0）
	AvgLoss: number
	// 买入总额（成交金额，不含费用）
	BuyAmount: number
	// 卖出总额（成交金额，不含费用）
	SellAmount: number
	// 累计净盈亏
	RealizedProfit: number
	// 总费用支出（佣金+其他费用+印花税+过户费；仅成交类，按交割单实际发生额全额汇总）
	FeeSum: number
	// 佣金合计
	CommissionSum: number
	// 印花税合计
	StampTaxSum: number
	// 过户费合计
	TransferFeeSum: number
	// 其他费用合计
	OtherFeeSum: number
	// 红利入账净额（入账为正、税补缴为负；资金流水类，不计入盈亏）
	DividendSum: number
	// 利息归本净额（资金流水类，不计入盈亏）
	InterestSum: number
	// 佣金费率（(佣金+规费)÷成交金额，小数；实收合计口径；0=未识别；导入账单时从最近成交样本推导，有手动校准时为校准值）
	CommissionRate: number
	// 最低佣金（元；0=未识别；按最近成交样本中的小额固定佣金探测）
	MinCommission: number
	// 印花税率（印花税÷卖出金额，小数；0=未识别；仅卖出样本）
	StampTaxRate: number
	// 过户费率（过户费÷成交金额，小数；0=未识别）
	TransferFeeRate: number
	// 费率样本最新成交日期（无成交样本为1900年）
	FeeRateTime: string
	// 佣金费率是否来自手动校准（true=用户按券商App费率设定，展示与估算优先使用校准值）
	IsFeeRateManual: boolean
	// 按股票维度汇总（含已清仓，按净盈亏倒序）
	Stocks: IZdxTradeStockStat[]
}

// 收益日历单日项（主口径=当日浮动盈亏；并行保留净盈亏口径）
export interface IZdxProfitCalendarDay {
	// 交易日（yyyy-MM-dd HH:mm:ss）
	TradeDate: string
	// 当日净盈亏（正=盈，负=亏；卖出结算口径）
	Profit: number
	// 当日浮动盈亏（盯市口径：当日总资产变动−当日净转入，含浮盈浮亏与当日费用/红利/利息；与券商APP一致）
	MarkProfit: number
	// 当日是否有落库数据（导入起始日之前的交易日为false，显示“--”）
	HasData: boolean
	// 当日卖出笔数
	SellCount: number
	// 当日盈利卖出笔数
	WinCount: number
	// 当日费用合计（佣金+其他费用+印花税+过户费；买卖均计入）
	FeeSum: number
	// 当日佣金合计
	CommissionSum: number
	// 当日印花税合计
	StampTaxSum: number
	// 当日过户费合计
	TransferFeeSum: number
	// 当日其他费用合计
	OtherFeeSum: number
	// 当日红利入账净额（入账为正、税补缴为负；不计入盈亏）
	DividendSum: number
	// 当日利息归本净额（不计入盈亏）
	InterestSum: number
	// 是否交易日（周末/法定节假日为false）
	IsTradeDay: boolean
	// 日期类型（1=交易日 2=周末 3=节假日/休市；非交易日收益恒为0）
	DayType: number
	// 备注（节假日名称或人工标注原因，可空）
	Remark?: string
}

// 收益日历（指定年月每日盈亏；主口径=浮动盈亏；Days 含当月全部自然日）
export interface IZdxProfitCalendar {
	// 年份
	Year: number
	// 月份（1~12）
	Month: number
	// 当月净盈亏合计（卖出结算口径）
	MonthProfit: number
	// 当月浮动盈亏合计（盯市口径：当月各交易日浮动盈亏之和；与券商APP一致）
	MonthMarkProfit: number
	// 当月费用支出合计（佣金+其他费用+印花税+过户费；买卖均计入）
	MonthFeeSum: number
	// 当月佣金合计
	MonthCommissionSum: number
	// 当月印花税合计
	MonthStampTaxSum: number
	// 当月过户费合计
	MonthTransferFeeSum: number
	// 当月其他费用合计
	MonthOtherFeeSum: number
	// 当月红利入账净额（入账为正、税补缴为负；不计入盈亏）
	MonthDividendSum: number
	// 当月利息归本净额（不计入盈亏）
	MonthInterestSum: number
	// 当月卖出笔数
	MonthSellCount: number
	// 当月盈利卖出笔数
	MonthWinCount: number
	// 当月交易日数（含无卖出的交易日）
	TradeDayCount: number
	// 当月盈利天数（当日浮动盈亏为正）
	ProfitDayCount: number
	// 当月亏损天数（当日浮动盈亏为负）
	LossDayCount: number
	// 每日盈亏（当月全部自然日，按日期升序）
	Days: IZdxProfitCalendarDay[]
}

// 收益年历单月项（主口径=浮动盈亏；当年 12 个月月度汇总）
export interface IZdxProfitYearMonth {
	// 月份（1~12）
	Month: number
	// 当月净盈亏合计（卖出结算口径）
	Profit: number
	// 当月浮动盈亏合计（盯市口径：当月各交易日浮动盈亏之和；与券商APP一致）
	MarkProfit: number
	// 当月是否有落库数据（导入起始日之前的月份为false，显示“--”）
	HasData: boolean
	// 当月盈利日浮动盈亏合计（仅正数部分；对比条用）
	WinProfit: number
	// 当月亏损日浮动盈亏合计（仅负数部分取正；对比条用）
	LossProfit: number
	// 当月卖出笔数
	SellCount: number
	// 当月盈利卖出笔数
	WinCount: number
	// 当月交易日数
	TradeDayCount: number
	// 当月盈利天数（当日浮动盈亏为正）
	ProfitDayCount: number
	// 当月亏损天数（当日浮动盈亏为负）
	LossDayCount: number
	// 当月费用支出合计
	FeeSum: number
	// 当月红利入账净额（入账为正、税补缴为负；已含在浮动盈亏内）
	DividendSum: number
	// 当月利息归本净额（已含在浮动盈亏内）
	InterestSum: number
}

// 收益年历（指定年份 12 个月月度汇总 + 年合计；主口径=浮动盈亏）
export interface IZdxProfitYear {
	// 年份
	Year: number
	// 全年净盈亏合计（卖出结算口径）
	ProfitSum: number
	// 全年浮动盈亏合计（盯市口径：全年各交易日浮动盈亏之和；与券商APP一致）
	MarkProfitSum: number
	// 全年盈利日浮动盈亏合计（仅正数部分；对比条用）
	WinProfitSum: number
	// 全年亏损日浮动盈亏合计（仅负数部分取正；对比条用）
	LossProfitSum: number
	// 全年卖出笔数
	SellCount: number
	// 全年盈利卖出笔数
	WinCount: number
	// 全年交易日数
	TradeDayCount: number
	// 全年盈利天数（当日浮动盈亏为正）
	ProfitDayCount: number
	// 全年亏损天数（当日浮动盈亏为负）
	LossDayCount: number
	// 全年费用支出合计
	FeeSum: number
	// 全年红利入账净额（入账为正、税补缴为负；已含在浮动盈亏内）
	DividendSum: number
	// 全年利息归本净额（已含在浮动盈亏内）
	InterestSum: number
	// 12 个月度项（1~12 月固定返回，无数据月为 0）
	Months: IZdxProfitYearMonth[]
}

// 至今单年项（全历史中某一年的浮动盈亏/净盈亏/费用/红利/天数汇总）
export interface IZdxProfitYearItem {
	// 年份
	Year: number
	// 当年净盈亏合计（卖出结算口径）
	Profit: number
	// 当年浮动盈亏合计（盯市口径：当年各交易日浮动盈亏之和；与券商APP一致）
	MarkProfit: number
	// 当年盈利日浮动盈亏合计（仅正数部分；对比条用）
	WinProfit: number
	// 当年亏损日浮动盈亏合计（仅负数部分取正；对比条用）
	LossProfit: number
	// 当年卖出笔数
	SellCount: number
	// 当年盈利卖出笔数
	WinCount: number
	// 当年交易日数
	TradeDayCount: number
	// 当年盈利天数（当日浮动盈亏为正）
	ProfitDayCount: number
	// 当年亏损天数（当日浮动盈亏为负）
	LossDayCount: number
	// 当年费用支出合计
	FeeSum: number
	// 当年红利入账净额（入账为正、税补缴为负；已含在浮动盈亏内）
	DividendSum: number
	// 当年利息归本净额（已含在浮动盈亏内）
	InterestSum: number
}

// 至今收益总览（全历史总合计 + 按年列表；主口径=浮动盈亏；Years 按年份降序）
export interface IZdxProfitOverall {
	// 至今净盈亏合计（卖出结算口径）
	ProfitSum: number
	// 至今浮动盈亏合计（盯市口径：全历史各交易日浮动盈亏之和；与券商APP一致）
	MarkProfitSum: number
	// 至今盈利日浮动盈亏合计（仅正数部分；对比条用）
	WinProfitSum: number
	// 至今亏损日浮动盈亏合计（仅负数部分取正；对比条用）
	LossProfitSum: number
	// 至今卖出笔数
	SellCount: number
	// 至今盈利卖出笔数
	WinCount: number
	// 至今交易日数（有数据年份范围内）
	TradeDayCount: number
	// 至今盈利天数（当日浮动盈亏为正）
	ProfitDayCount: number
	// 至今亏损天数（当日浮动盈亏为负）
	LossDayCount: number
	// 至今费用支出合计
	FeeSum: number
	// 至今红利入账净额（入账为正、税补缴为负；已含在浮动盈亏内）
	DividendSum: number
	// 至今利息归本净额（已含在浮动盈亏内）
	InterestSum: number
	// 按年列表（降序：新年份在前；仅含有数据的年份）
	Years: IZdxProfitYearItem[]
}

// 收益趋势（全历史按月浮动盈亏 + 累计曲线；含无成交的持仓月份）
export interface IZdxProfitTrend {
	// 历史累计浮动盈亏
	TotalProfit: number
	// 首笔收益月份（yyyy-MM；无数据为空）
	FirstMonth?: string
	// 按月趋势（按年月升序）
	Months: IZdxProfitMonth[]
}

// 收益趋势单月项
export interface IZdxProfitMonth {
	// 年份
	Year: number
	// 月份（1~12）
	Month: number
	// 当月浮动盈亏（盯市口径）
	Profit: number
	// 截至当月的累计浮动盈亏
	CumulativeProfit: number
	// 当月卖出笔数
	SellCount: number
	// 当月盈利卖出笔数
	WinCount: number
}

// 交易对账校验（逐笔推导持仓 vs 交割单股份余额）
export interface IZdxTradeAudit {
	// 核对记录数（成交类：买入+卖出）
	TradeCount: number
	// 涉及股票数
	StockCount: number
	// 逐笔推导余额与交割单余额不一致的行数
	MismatchCount: number
	// 期末推导持仓与交割单余额不一致的股票数
	FinalMismatchStockCount: number
	// 推导持仓曾出现负数的股票数
	NegativeStockCount: number
	// 是否通过校验（无负持仓且期末全部一致）
	IsConsistent: boolean
	// 不一致明细
	Items: IZdxTradeAuditItem[]
}

// 交易对账不一致明细行
export interface IZdxTradeAuditItem {
	// 股票代码
	StockCode: string
	// 股票名称
	StockName?: string
	// 发生日期
	TradeDate: string
	// 发生时间（HH:mm:ss，可空）
	TradeTime?: string
	// 类别名称（买入/卖出）
	CategoryName: string
	// 成交数量（股）
	Volume: number
	// 逐笔推导持仓
	DerivedBalance: number
	// 交割单股份余额
	ShareBalance: number
	// 差异（推导-交割单）
	Diff: number
	// 是否该股票期末行
	IsFinal: boolean
}

// 清仓轮次项（个股：空仓→建仓→清仓为一个轮次；与券商"清仓盈亏"口径一致）
export interface IZdxTradeCycle {
	// 建仓日期（该轮首笔买入日）
	StartDate: string
	// 清仓日期（持仓归零的卖出日；持仓中为 null）
	EndDate?: string | null
	// 是否已清仓（持仓归零结算完成）
	IsClosed: boolean
	// 买入笔数
	BuyCount: number
	// 卖出笔数
	SellCount: number
	// 买入成交金额合计（不含费用）
	BuyAmount: number
	// 买入成本合计（成交金额+费用；收益率分母）
	BuyCost: number
	// 卖出成交金额合计（不含费用）
	SellAmount: number
	// 轮次费用合计（买入+卖出：佣金/印花税/过户费/其他）
	FeeSum: number
	// 清仓盈亏（已清仓=轮内卖出净盈亏合计；持仓中=已卖出部分盈亏合计）
	Profit: number
	// 收益率%（清仓盈亏÷买入成本×100）
	ProfitRate: number
	// 持仓自然日天数
	HoldDays: number
	// 已落库轮次主键（zdx_trade_cycle.Id；未落库/持仓中为0；AI 评语重生成定位用）
	CycleId: number
	// 轮次序号（第 N 轮；1-based）
	CycleSeq: number
	// 归因时流派快照 Id（0=未评定）
	SchoolId: number
	// 归因使用的择时窗口天数快照
	TimingWindow: number
	// 归因标签（sell_fly/reverse_t/escape_top/optimal/short_term/normal；持仓中为空）
	AttributionTag?: string | null
	// 买点表现标签（fly_high=买入后大涨/fall_low=买入后大跌/normal=正常；持仓中/历史未回填为空）
	BuyTag?: string | null
	// 操作质量 0~100（持仓中为0）
	QualityScore: number
	// 操作质量评分五项明细 JSON（旧公式未回填/持仓中为 null；评分明细弹层数据源）
	ScoreDetail?: string | null
	// T+N 前复权走势（清仓后各窗口涨跌；持仓中为空）
	TrendData: IZdxTradeCycleTrend[]
	// AI 买卖评语（未生成为空）
	AiComment?: string | null
	// 关联复盘笔记引用（±1 天边界扫描）
	ReviewRefs: IZdxTradeCycleReviewRef[]
}

// 清仓轮次操作质量评分五项明细（后端 AttributionScoreDetail 序列化；总分=钳制(基础+收益+择时+耐心+费用,0,100)）
export interface ICycleScoreDetail {
	// 基础分（固定 50）
	Base: number
	// 收益贡献（收益率×1.5，封顶 ±30）
	Profit: number
	// 择时归因（精准止盈 +20 / 逃顶 +15 / 卖飞 −10 / 其余 0）
	Timing: number
	// 耐心达标（收益率>5% 或持有天数在目标±30%内 +10）
	Patience: number
	// 费用侵蚀（费用/成本>0.5% 扣 5）
	Fee: number
	// 最终得分 0~100
	Final: number
	// 流派耐心目标天数快照（0=未评定流派）
	HoldDaysTarget: number
}

// 清仓轮次 T+N 走势项（前复权口径；窗口=交易日数）
export interface IZdxTradeCycleTrend {
	// 观察窗口（清仓后第 N 个交易日）
	Window: number
	// 该窗口前复权收盘价
	ClosePrice: number
	// 相对清仓日（同前复权基准）涨跌幅%
	ChangePct: number
	// 同期大盘涨跌幅%（上证指数同日历交易日对齐；无数据为0）
	MarketChangePct: number
	// 超额涨跌幅%（ChangePct − MarketChangePct；无大盘数据为0）
	ExcessPct: number
}

// 清仓轮次关联复盘笔记引用
export interface IZdxTradeCycleReviewRef {
	// 笔记主键
	Id: number
	// 是否边界笔记（建仓前夜/清仓当晚的 ±1 天边界）
	IsBoundary: boolean
}

// 清仓轮次 AI 评语生成结果
export interface IZdxTradeCycleAiResult {
	// 是否生成成功
	Success: boolean
	// 评语正文（失败为 null）
	AiComment?: string | null
}

// 轮次迷你 K 线（展开轮次卡片时按需拉取：前复权蜡烛 + B/S 买卖点 + 上证基准）
export interface ICycleKline {
	Success: boolean
	// 本股前复权日K（交易日升序）
	Candles: { Date: string, Open: number, High: number, Low: number, Close: number }[]
	// 买卖点（价格已折算前复权口径；Category 1买 2卖，同日双向前端合并为T）
	Marks: { Date: string, Category: number, Price: number, Volume: number }[]
	// 上证指数收盘基准（按日升序，前端按首日归一化）
	Bench: { Date: string, Close: number }[]
}

// 个股交易汇总（个股详情"我的交易"卡片；无记录时接口返回null）
export interface IZdxStockTradeSummary {
	// 股票代码
	StockCode: string
	// 股票名称
	StockName: string
	// 当前持仓（未清仓时返回；已清仓为null）
	Position?: IZdxTradePosition
	// 该股交易统计
	Stats: IZdxTradeStockStat
	// 该股交易记录（按日期/时间倒序，最新在前）
	Records: IZdxTradeRecordData[]
	// 清仓轮次（券商口径：空仓→建仓→清仓为一轮；按建仓时间升序；仅含买入的轮次）
	Cycles: IZdxTradeCycle[]
}

// 交易流水查询条件
export interface IZdxTradeRecordQuery {
	// 起始日期（yyyy-MM-dd；空=不限）
	Begin?: string
	// 结束日期（yyyy-MM-dd；空=不限）
	End?: string
	// 股票代码（空=不限）
	StockCode?: string
	// 交易类别（空=不限；与 ZDX_TRADE_CATEGORIES 取值一致）
	Category?: number
	// 关键字（股票代码/名称模糊匹配）
	Keyword?: string
}

// 费用月度趋势（全历史按月费用支出汇总；Months 按年月升序，仅含有费用发生的月份）
export interface IZdxFeeTrend {
	// 历史费用合计（全部月份之和）
	TotalFee: number
	// 按月费用（按年月升序）
	Months: IZdxFeeMonth[]
}

// 费用月度趋势单月项
export interface IZdxFeeMonth {
	// 年份
	Year: number
	// 月份（1~12）
	Month: number
	// 当月费用合计（佣金+其他费用+印花税+过户费；买卖均计入）
	FeeSum: number
	// 当月佣金合计
	CommissionSum: number
	// 当月印花税合计
	StampTaxSum: number
	// 当月过户费合计
	TransferFeeSum: number
	// 当月其他费用合计
	OtherFeeSum: number
}

// ---------- 交易行为画像 ----------

// 交易行为画像统计（节奏/持仓周期/盈亏结构/仓位/成本/四象限/择时/标签/八维评分/基础数值参照/总体战绩）
// 说明：持仓周期为 FIFO 配对口径；择时结合日K；八维评分按主风格流派标准换算；无成交记录时 HasData=false
export interface IZdxBehaviorStats {
	// 是否有成交数据（false=无任何买卖记录）
	HasData: boolean
	// 交易节奏（月份分布与时段分布）
	Rhythm: IZdxBehaviorRhythm
	// 持仓周期（FIFO 配对口径）
	HoldPeriod: IZdxBehaviorHold
	// 盈亏结构（连赢亏/单笔极值/分布/集中度）
	ProfitStructure: IZdxBehaviorProfit
	// 仓位与集中度
	Position: IZdxBehaviorPosition
	// 成本结构（费用视角）
	Cost: IZdxBehaviorCost
	// 个股四象限（胜率 × 盈亏比）
	Quadrant: IZdxBehaviorQuadrant
	// 择时分析（买入位置分位 + 买入后 20 日 + 卖出后表现）
	Timing: IZdxBehaviorTiming
	// 行为标签墙
	Tags: IZdxBehaviorTag[]
	// 交易风格主风格名（六层合成：持仓周期×交易频率矩阵；全历史累计口径读落库快照，无配对交易时为空）
	TradeStyle?: string
	// 八维评分（0-100 雷达图用；按主风格流派评分标准换算）
	Scores: IZdxBehaviorScore
	// 八维评分基础数值参照（各维实际值与流派参照阈值；雷达图悬浮“实际值 vs 参照值”与评定留档口径）
	ScoreBasis: IZdxBehaviorScoreBasis
	// 评定时间（最近一次「评定/重新评定」落库时间；未评定为空）
	EvaluatedAt?: string
	// 评分标准是否已变更（评定后流派评分参数被调整：实时标准与评定快照不一致；true=前端提示建议重新评定）
	StandardChanged: boolean
	// 评分标准变更说明（列示变更参数明细；StandardChanged=true 时有效）
	StandardChangedNote?: string
	// 总体战绩（卖出笔数/胜率/盈亏比/平均盈亏/净盈亏/费用）
	Overall: IZdxBehaviorOverall
	// 交易风格（六层维度合成：主风格 + 策略类型/风险等级/标的偏好/执行方式标签与一句话总结）
	Style: IZdxBehaviorStyle
	// 选股风格（8 维：市值/估值/成长价值/行业/动量/波动率/质量/集中度）
	StockStyle: IZdxBehaviorStockStyle
	// 交易性格（10 维：风险偏好/持仓周期/交易频率/盈亏处理/仓位变化/情绪反应/决策一致性/集中度/成本敏感度/耐心）
	Persona: IZdxBehaviorPersona
}

// 交易节奏（成交月份分布与日内时段分布）
export interface IZdxBehaviorRhythm {
	// 有成交的月份数
	TradeMonthCount: number
	// 月均成交笔数
	MonthlyAvgCount: number
	// 最活跃月份（yyyy-MM）
	BusiestMonth?: string
	// 最活跃月份成交笔数
	BusiestMonthCount: number
	// 最活跃股票代码
	TopStockCode?: string
	// 最活跃股票名称
	TopStockName?: string
	// 最活跃股票成交笔数
	TopStockCount: number
	// 早盘成交笔数（11:30 前）
	MorningCount: number
	// 午后成交笔数（11:30 后）
	AfternoonCount: number
}

// 持仓周期（FIFO 配对口径）
export interface IZdxBehaviorHold {
	// 配对数
	PairCount: number
	// 平均持有天数
	AvgHoldDays: number
	// 中位持有天数
	MedianHoldDays: number
	// 短线配对数（持有 ≤5 天）
	ShortCount: number
	// 波段配对数（持有 6~30 天）
	SwingCount: number
	// 长线配对数（持有 >30 天）
	LongCount: number
	// 盈利配对平均持有天数
	WinAvgHoldDays: number
	// 亏损配对平均持有天数
	LossAvgHoldDays: number
}

// 盈亏结构（按卖出时间序的单笔盈亏统计）
export interface IZdxBehaviorProfit {
	// 最大连续盈利卖出笔数
	MaxWinStreak: number
	// 最大连续亏损卖出笔数
	MaxLossStreak: number
	// 最大单笔盈利（元）
	MaxSingleProfit: number
	// 最大单笔亏损（元，正数存储）
	MaxSingleLoss: number
	// 盈利 TOP3 占盈利总额比例（%）
	Top3ProfitRatio: number
	// 大亏笔数（单笔 < -1万）
	BigLossCount: number
	// 小亏笔数（-1万~0）
	SmallLossCount: number
	// 小赚笔数（0~1万）
	SmallWinCount: number
	// 大赚笔数（>1万）
	BigWinCount: number
}

// 仓位与集中度
export interface IZdxBehaviorPosition {
	// 平均单笔买入金额（元）
	AvgBuyAmount: number
	// 最大单笔买入金额（元）
	MaxBuyAmount: number
	// 前 3 持仓成本占比（%）
	Top3HoldRatio: number
	// 资金周转比（%：卖出总额÷买入总额）
	Turnover: number
}

// 成本结构（费用视角）
export interface IZdxBehaviorCost {
	// 累计费用（元）
	FeeSum: number
	// 费用 ÷ 净盈亏绝对值（%）
	FeeProfitRatio: number
	// 费用 ÷ 总成交额（万分比）
	FeeAmountRatio: number
	// 单笔卖出均摊费用（元）
	AvgFeePerSell: number
}

// 个股四象限（胜率 × 盈亏比）
export interface IZdxBehaviorQuadrant {
	// 顶尖（胜率≥50% 且 盈亏比≥1）个股数
	ExpertCount: number
	// 稳健（胜率≥50% 且 盈亏比<1）个股数
	SteadyCount: number
	// 激进（胜率<50% 且 盈亏比≥1）个股数
	AggressiveCount: number
	// 待改进（胜率<50% 且 盈亏比<1）个股数
	ImproveCount: number
	// 个股明细（按净盈亏降序）
	Stocks: IZdxBehaviorQuadrantItem[]
}

// 四象限个股明细行
export interface IZdxBehaviorQuadrantItem {
	// 股票代码
	StockCode: string
	// 股票名称
	StockName?: string
	// 卖出笔数
	SellCount: number
	// 胜率（%）
	WinRate: number
	// 盈亏比（无亏损为0，全胜时前端显示 ∞）
	ProfitRatio: number
	// 净盈亏
	RealizedProfit: number
	// 象限（1顶尖 2稳健 3激进 4待改进）
	Quadrant: number
}

// 择时分析（买入位置分位 + 多窗口买卖后表现；评分择时按标准窗口取值）
export interface IZdxBehaviorTiming {
	// 有效买入样本数
	ValidBuyCount: number
	// 低位买入笔数（分位 <30%）
	BuyLowCount: number
	// 中位买入笔数（分位 30~70%）
	BuyMidCount: number
	// 高位买入笔数（分位 >70%）
	BuyHighCount: number
	// 多窗口买卖后表现（评分择时按标准窗口取值；含各窗口有效样本数与平均涨跌幅）
	Windows: IZdxTimingWindow[]
	// 卖出后 5 日平均涨跌幅（%；展示用，固定 5 日口径）
	AvgSellAfter5: number
	// 卖飞笔数（卖出后 20 日涨幅 >5%）
	SellFlyCount: number
	// 逃顶笔数（卖出后 20 日跌幅 >5%）
	EscapeCount: number
}

// 择时单窗口表现（买入后/卖出后第 N 个交易日收盘对比成交价）
export interface IZdxTimingWindow {
	// 窗口（第 N 个交易日；1~60）
	Window: number
	// 买入后 N 日有效样本数
	BuyValidCount: number
	// 买入后 N 日平均涨跌幅（%；正=买入后上涨）
	AvgBuyChange: number
	// 卖出后 N 日有效样本数
	SellValidCount: number
	// 卖出后 N 日平均涨跌幅（%；正=卖出后上涨）
	AvgSellChange: number
}

// 行为标签（Tone=good/warn/info）
export interface IZdxBehaviorTag {
	// 触发键（系统判定输出标识，如"高频交易"；供流派判定规则引用；无定义回退=触发键本身）
	Name: string
	// 标签文案
	Text: string
	// 色调（good=优势 warn=风险 info=中性）
	Tone: string
	// 说明（标签含义与触发条件，管理端维护；悬浮提示展示）
	Description?: string
}

// 风格标签（交易风格/选股风格/交易性格模块的维度判定结果；Text/Tone/Description 取管理端定制，库无定义时回退 Name + info）
export interface IZdxStyleTag {
	// 判定键（运行时原始档位名，如"短线交易"）
	Name: string
	// 展示文案（管理端定制的 Title；无定义回退=Name）
	Text: string
	// 色调（good=优势 warn=风险 info=中性）
	Tone: string
	// 说明（标签含义与判定条件；悬浮提示展示）
	Description?: string
}

// 交易行为八维评分（0-100，雷达图用；按评分标准换算（流派参数优先，无可用流派回退默认宽松标准），实际值与参照阈值见 ScoreBasis；样本不足的维度按中性 50 分）
export interface IZdxBehaviorScore {
	// 胜率得分（盈利平仓笔数÷总平仓笔数×100；全流派通用）
	WinRate: number
	// 盈亏比得分（软饱和映射：达标=85 分、K×达标封顶 100 分，K=盈亏比封顶倍数默认 3；全胜计 100）
	ProfitRatio: number
	// 择时得分（买入后 N 日均涨幅软饱和居中映射×0.6 + 卖出后 N 日均涨幅反向软饱和居中映射×0.4；0=50、±幅度=85/15、±K×幅度=100/0，K=择时封顶倍数默认 3）
	Timing: number
	// 持仓耐心得分（软饱和映射：达标=85、K×达标封顶 100（K=耐心封顶倍数默认 3）− 处置效应扣分，下限 0）
	Patience: number
	// 风控得分（100 − 大亏烈度扣分（大亏合计÷资金基准）− 连亏惩罚（起扣=max(标准阈值, 期望最大连亏)）；下限 5）
	RiskControl: number
	// 成本意识得分（100 − 费用侵蚀比÷标准零分线×100；侵蚀比=费用÷盈利平仓毛利合计；全亏无止盈样本按中性 50 无法评估、无平仓亦 50，下限 0）
	CostControl: number
	// 回撤控制得分（盈利账户 100 − 最大回撤÷基准×100；亏损账户按止血度=50×期末反弹÷最大回撤；下限 0）
	DrawdownControl: number
	// 收益能力得分（软饱和居中映射：0=50、达标=85、K×达标=100（K=收益能力封顶倍数默认 3），负方向对称）
	Profitability: number
	// 综合得分（八维均值）
	Total: number
}

// 八维评分基础数值参照（先落位各维实际值，再按评分标准换算分值；雷达图悬浮与评定留档口径）
export interface IZdxBehaviorScoreBasis {
	// 评分标准名（流派名；无可用流派为"默认"宽松标准）
	Standard: string
	// 主风格判定键（如“短线交易”；无配对交易为空）
	MainStyle?: string
	// 盈利平仓笔数（胜率与盈亏比样本）
	WinSellCount: number
	// 总平仓笔数（胜率与盈亏比样本）
	SellCount: number
	// 实际胜率（%）
	WinRate: number
	// 实际盈亏比（平均盈利÷平均亏损；无亏损样本为 0）
	ProfitRatio: number
	// 盈亏比达标线（流派参照；默认宽松 1.8）
	ProfitRatioTarget: number
	// 盈亏比封顶倍数（软饱和触顶倍数；旧快照无此字段时按默认 3 展示）
	ProfitRatioCapMult?: number | null
	// 平均盈利（元）
	AvgProfit: number
	// 平均亏损（元；绝对值）
	AvgLoss: number
	// 择时窗口（标准参照：买入后/卖出后 N 个交易日；默认宽松 60 日）
	TimingWindow: number
	// 买入后窗口有效样本数
	BuyWindowValidCount: number
	// 买入后窗口平均涨跌幅（%；正=买入后上涨）
	AvgBuyWindowChange: number
	// 卖出后窗口有效样本数
	SellWindowValidCount: number
	// 卖出后窗口平均涨跌幅（%；正=卖出后上涨）
	AvgSellWindowChange: number
	// 择时映射幅度（±% 标准参照：各流派配置值；±封顶倍数×幅度=100/0；默认宽松 ±3%）
	TimingSpan: number
	// 择时封顶倍数（软饱和触顶倍数；旧快照无此字段时按默认 3 展示）
	TimingCapMult?: number | null
	// FIFO 配对数（耐心样本）
	PairCount: number
	// 平均持有天数（FIFO 配对口径）
	AvgHoldDays: number
	// 耐心达标天数（流派参照；软饱和：达标记 85 分、封顶倍数×达标封顶 100；默认宽松 3 天）
	HoldDaysTarget: number
	// 耐心封顶倍数（旧快照无此字段时按默认 3 展示）
	PatienceCapMult?: number | null
	// 盈利配对平均持有天数（处置效应对比）
	WinAvgHoldDays: number
	// 亏损配对平均持有天数（处置效应对比）
	LossAvgHoldDays: number
	// 大亏阈值（% 标准参照：相对平均单笔买入额；单笔亏损低于 -平均单笔买入额×阈值% 计入大亏；默认宽松 60%）
	BigLossThreshold: number
	// 平均单笔买入额（元；大亏金额线换算基数；无买入样本时回退平均卖出额）
	AvgBuyAmount: number
	// 大亏金额线（元；平均单笔买入额×标准阈值%，单笔亏损低于 -该值 计入大亏；旧快照为 0 时前端回退旧文案）
	BigLossAmount: number
	// 大亏占比（%；按标准大亏阈值统计的大亏笔数÷总平仓笔数×100；展示统计用，扣分已改用大亏烈度）
	BigLossRatio: number
	// 大亏金额合计（元；风控烈度扣分分子；旧快照无此字段）
	BigLossAmountSum?: number
	// 大亏烈度（%；大亏金额合计÷资金基准×100；每 1% 扣 1.5 分、封顶 60）
	BigLossCapitalRatio?: number
	// 最大连续亏损卖出笔数
	MaxLossStreak: number
	// 连亏起扣笔数（标准参照：与期望最大连亏取大后为实际起扣笔数，超过后每多 1 笔扣 6 分；默认宽松 5 笔）
	ConsecutiveLossStart: number
	// 期望最大连亏笔数（统计极值期望 k*=ln(n·q̂)÷ln(1/p̂)，p̂=(亏损笔数+1)÷(总笔数+2) Laplace 平滑；连亏扣分只对超出期望部分生效；旧快照无此字段）
	ExpectMaxLossStreak?: number
	// 实际连亏起扣笔数（max(流派阈值, ⌈期望最大连亏⌉)；旧快照无此字段时回退按阈值笔数展示）
	StreakPenaltyStart?: number
	// 费用侵蚀比（%；费用÷盈利平仓毛利合计×100；毛利口径与盈亏符号无关）
	FeeErosionRatio: number
	// 盈利平仓毛利合计（元；费用侵蚀比分母；旧快照无此字段时回退旧文案）
	GrossProfitSum?: number
	// 费用侵蚀零分线（% 标准参照：费用侵蚀比达到该值记 0 分；默认宽松 20%）
	FeeErosionTolerance: number
	// 银证转账净投入（元；窗口内合计：转证券为正、转银行为负；资金基准第一优先口径，与资产趋势模块口径一致）
	NetInvest: number
	// 持仓成本峰值（元；窗口内持仓成本合计峰值；资金基准第二优先口径）
	CostPeak: number
	// 资金基准（元；收益能力分母与回撤基准第三项：三级优先 净投入>成本峰值>累计买入额）
	CapitalBase: number
	// 逐笔累计盈亏曲线最大回撤（元）
	MaxDrawdown: number
	// 期末反弹（元；谷底到期末末值的回血额；亏损账户回撤维按止血度=50×期末反弹÷最大回撤计分；旧快照无此字段）
	ReboundAmount?: number
	// 回撤均幅倍数（标准参照：回撤基准 = max(曲线峰值, 单笔均幅×倍数, 资金基准, 1)；默认宽松 ×8）
	AvgAmplitudeMultiplier: number
	// 回撤基准（元；max(曲线峰值, 单笔均幅×标准倍数, 资金基准, 1)）
	DrawdownScale: number
	// 累计收益率（%；净盈亏÷资金基准×100）
	CumulativeReturn: number
	// 年化收益率（%；累计收益率×365÷活跃天数）
	AnnualRate: number
	// 年化收益达标线（% 标准参照：各流派配置值；软饱和：达标=85 分、封顶倍数×达标=100 分，负方向对称；默认宽松 20%）
	AnnualRateTarget: number
	// 收益能力封顶倍数（旧快照无此字段时按默认 3 展示）
	ProfitCapMult?: number | null
	// 活跃天数（窗口首笔至末笔成交间隔，至少 1 天）
	TradeDays: number
}

// 交易总体战绩（行为画像页总览）
export interface IZdxBehaviorOverall {
	// 卖出笔数
	SellCount: number
	// 胜率（%）
	WinRate: number
	// 盈亏比（无亏损为 0，全胜显示∞）
	ProfitRatio: number
	// 平均盈利（元）
	AvgProfit: number
	// 平均亏损（元；绝对值）
	AvgLoss: number
	// 净盈亏（元）
	RealizedProfit: number
	// 累计费用（元）
	FeeSum: number
}

// ---------- 交易风格 / 选股风格 / 交易性格 ----------

// 交易风格（六层维度合成：L1 持仓周期 + L2 交易频率 → 主风格矩阵；L3 盈亏结构 → 策略类型；L4 仓位 → 风险等级；L5 选股 → 标的偏好；L6 决策 → 执行方式）
export interface IZdxBehaviorStyle {
	// 主风格标签（日内高频/超短线高频/短线交易/短线波段/波段交易/中线波段/中长线持有/长线投资；无配对交易为 null）
	MainStyle?: IZdxStyleTag
	// L1 持仓周期辅助标签（日内/超短线/短线/波段/中线/中长线/长线）
	HoldCycleTag?: IZdxStyleTag
	// L2 交易频率辅助标签（极低频/低频/中频/高频/超高频）
	FrequencyTag?: IZdxStyleTag
	// 策略类型标签（趋势型/反转型/震荡型/系统型/情绪型/亏损型）
	StrategyType?: IZdxStyleTag
	// 风险等级标签（保守/稳健/激进/赌徒）
	RiskLevel?: IZdxStyleTag
	// 标的偏好标签（大盘价值/大盘成长/中盘均衡/小盘成长/小盘价值/微盘反转/行业集中/行业分散）
	TargetTag?: IZdxStyleTag
	// 执行方式标签（系统化/半系统化/主观交易/情绪化）
	ExecutionTag?: IZdxStyleTag
	// 一句话总结（如"短线交易 · 趋势型 · 稳健 · 中盘成长 · 半系统化"；空维度自动跳过）
	Summary?: string
	// 平均持有天数（FIFO 配对口径）
	AvgHoldDays: number
	// 月均成交笔数
	MonthlyAvgCount: number
	// 平均仓位（%；逐笔交易时点近似）
	AvgPosition: number
}

// 选股风格（8 维：市值/估值/成长价值/行业/动量/波动率/质量/集中度；按买入金额加权）
export interface IZdxBehaviorStockStyle {
	// 加权平均总市值（亿元）
	WeightedMarketValue: number
	// 市值风格标签（大盘/中盘/小盘/微盘）
	MarketCapTag?: IZdxStyleTag
	// 大盘占比（%）
	BigCapRatio: number
	// 中盘占比（%）
	MidCapRatio: number
	// 小盘占比（%）
	SmallCapRatio: number
	// 微盘占比（%）
	MicroCapRatio: number
	// 加权平均 PE（TTM；亏损股剔除；无有效样本为 0）
	WeightedPe: number
	// 加权平均 PB（无有效样本为 0）
	WeightedPb: number
	// 亏损股占比（%；PE≤0 的买入金额占比）
	LossStockRatio: number
	// 估值风格标签（低估值/均衡/高估值）
	ValuationTag?: IZdxStyleTag
	// 成长价值标签（成长型/价值型/均衡型/GARP/投机型）
	GrowthValueTag?: IZdxStyleTag
	// 加权平均 ROE（%；EPS÷BPS 快照近似）
	WeightedRoe: number
	// 前三大行业占比（%）
	Top3SectorRatio: number
	// 行业集中度标签（分散/偏集中/高度集中）
	IndustryTag?: IZdxStyleTag
	// 前三大行业名（按买入金额降序）
	TopSectorNames: string[]
	// 平均买入前 20 日涨幅（%）
	AvgPre20Change: number
	// 动量风格标签（强追涨/偏动量/中性/偏反转/强抄底）
	MomentumTag?: IZdxStyleTag
	// 买入高位占比（%；前 60 根日K区间分位 >70%）
	BuyHighRatio: number
	// 买入低位占比（%；分位 <30%）
	BuyLowRatio: number
	// 加权年化波动率（%）
	WeightedVolatility: number
	// 波动率风格标签（低波/中波/高波）
	VolatilityTag?: IZdxStyleTag
	// 质量风格标签（高质量/均衡/低质量）
	QualityTag?: IZdxStyleTag
	// 最新时点持股数量
	HoldStockCount: number
	// 单票最大占比（%）
	MaxSingleRatio: number
	// 集中度标签（高度分散/适度分散/集中/押注）
	ConcentrationTag?: IZdxStyleTag
}

// 交易性格（10 维：风险偏好/持仓周期/交易频率/盈亏处理/仓位变化/情绪反应/决策一致性/集中度/成本敏感度/耐心）
export interface IZdxBehaviorPersona {
	// 风险偏好标签（保守/稳健/激进/赌徒）
	RiskTag?: IZdxStyleTag
	// 平均仓位（%）
	AvgPosition: number
	// 最大仓位（%）
	MaxPosition: number
	// 单票最大仓位（%）
	MaxSinglePosition: number
	// 持仓周期标签（超短线/短线/波段/中线/长线）
	HoldCycleTag?: IZdxStyleTag
	// 平均持有天数
	AvgHoldDays: number
	// 交易频率标签（极低频/低频/中频/高频/超高频）
	FrequencyTag?: IZdxStyleTag
	// 月均成交笔数
	MonthlyAvgCount: number
	// 年化换手率（%）
	AnnualTurnover: number
	// 换手标签（低换手/中换手/高换手/极高换手）
	TurnoverTag?: IZdxStyleTag
	// 盈亏处理标签（严重赚跑亏扛/有处置效应/中性/让利润奔跑）
	ProfitLossTag?: IZdxStyleTag
	// 处置效应（盈利均持天数÷亏损均持天数；无亏损对为 0）
	DispositionEffect: number
	// 仓位变化标签（报复交易/风险收缩/过度自信/纪律止盈/仓位稳定）
	PositionChangeTag?: IZdxStyleTag
	// 情绪反应标签（情绪冲动/报复交易/冲动交易/追涨型/情绪稳定）
	EmotionTag?: IZdxStyleTag
	// 决策一致性标签（高度自律/基本自律/有时偏离/随意交易）
	ConsistencyTag?: IZdxStyleTag
	// 集中度偏好标签（高度分散/适度分散/集中/押注）
	ConcentrationTag?: IZdxStyleTag
	// 成本敏感度标签（成本控制好/一般/偏差/成本失控）
	CostSenseTag?: IZdxStyleTag
	// 费用侵蚀比（%；费用÷净盈亏绝对值）
	FeeErosionRatio: number
	// 耐心程度标签（耐心/中性/拿不住/赚一点就跑）
	PatienceTag?: IZdxStyleTag
	// 买入后 3 日内短卖占比（%）
	ShortSellRatio: number
}

// 交易行为 AI 分析结果（BaseMessage.Data）
export interface IZdxBehaviorAiData {
	// AI 分析正文（纯文本，可含换行）
	Analysis: string
	// 生成时间
	GeneratedAt: string
}

// 交易行为评定结果（POST Evaluate 返回：评定统计 + AI 诊断；AI 生成失败时 Ai 为空不影响评定）
export interface IZdxBehaviorEvaluateData {
	// 评定后行为统计（含风格总结/八维评分/基础数值参照/评定时间）
	Stats: IZdxBehaviorStats
	// AI 诊断（随评定自动生成并落库；模型未返回内容时为空）
	Ai?: IZdxBehaviorAiData
}

// 交易行为评定进度（评定期间前端轮询展示步骤说明；内存态按登录用户隔离）
export interface IZdxBehaviorEvalProgress {
	// 是否正在评定
	Running: boolean
	// 当前进度百分比（0-100）
	Percent: number
	// 当前阶段说明（正在执行哪方面的计算）
	Stage: string
}

// 行为标签管理项（后台标签管理页列表；Name=触发键与画像判定逻辑绑定，仅展示不可修改）
export interface IZdxBehaviorTagManage {
	// 标签 Id
	Id: number
	// 触发键（唯一；与画像判定逻辑绑定，新增后不可修改）
	Name: string
	// 标签文案（画像页标签墙展示）
	Title: string
	// 说明（标签含义与触发条件，画像页悬浮提示）
	Description?: string
	// 色调（good=优势 warn=风险 info=中性）
	Tone: string
	// 排序号（升序）
	SortNumber: number
	// 是否启用（禁用后画像页不再输出该标签）
	IsEnabled: boolean
	// 创建时间
	CreateTime: string
	// 更新时间
	UpdateTime: string
	// 最后修改人
	Modifier?: string
}

// 行为标签编辑表单（新增/编辑共用；Name 仅新增时使用，编辑不可改触发键）
export interface IZdxBehaviorTagForm {
	// 触发键（仅新增时使用；必填且不可与现有重复）
	Name?: string
	// 标签文案（必填，≤50字）
	Title: string
	// 说明（选填，≤500字）
	Description?: string
	// 色调（good/warn/info）
	Tone: string
	// 排序号（升序）
	SortNumber: number
	// 是否启用
	IsEnabled: boolean
}

// 风格标签管理项（后台管理页列表；Module+Layer+Name=判定键与画像判定逻辑绑定，仅展示不可修改）
export interface IZdxStyleTagManage {
	// 标签 Id
	Id: number
	// 所属模块（style=交易风格 / stock=选股风格 / persona=交易性格）
	Module: string
	// 维度层（与统计判定维度一一对应）
	Layer: string
	// 判定键（唯一；与画像判定逻辑绑定，新增后不可修改）
	Name: string
	// 标签文案（画像页模块标签展示）
	Title: string
	// 说明（标签含义与判定条件，画像页悬浮提示）
	Description?: string
	// 色调（good=优势 warn=风险 info=中性）
	Tone: string
	// 排序号（升序）
	SortNumber: number
	// 是否启用（禁用后画像页不再输出该标签）
	IsEnabled: boolean
	// 创建时间
	CreateTime: string
	// 更新时间
	UpdateTime: string
	// 最后修改人
	Modifier?: string
}

// 风格标签编辑表单（新增/编辑共用；编辑时模块/层/判定键不可改）
export interface IZdxStyleTagForm {
	// 所属模块（style/stock/persona；仅新增时使用）
	Module?: string
	// 维度层（仅新增时使用）
	Layer?: string
	// 判定键（仅新增时使用；必填且不可与现有重复）
	Name?: string
	// 标签文案（必填，≤50字）
	Title: string
	// 说明（选填，≤500字）
	Description?: string
	// 色调（good/warn/info）
	Tone: string
	// 排序号（升序）
	SortNumber: number
	// 是否启用
	IsEnabled: boolean
}

// 交易行为得分（近1/3/6个自然月 + 今年八维得分 + 月度趋势点；窗口内无成交时对应 HasData=false；各窗口基础数值参照同步返回）
export interface IZdxBehaviorScores {
	// 是否有成交数据（false=无任何买卖记录）
	HasData: boolean
	// 近1个月窗口是否有成交
	Month1HasData: boolean
	// 近3个月窗口是否有成交
	Month3HasData: boolean
	// 近6个月窗口是否有成交
	Month6HasData: boolean
	// 今年窗口是否有成交（窗口=今年1月1日至今）
	YearHasData: boolean
	// 近1个月得分
	Month1: IZdxBehaviorScore
	// 近3个月得分
	Month3: IZdxBehaviorScore
	// 近6个月得分
	Month6: IZdxBehaviorScore
	// 今年得分（窗口=今年1月1日至今；雷达图「今年」切换口径）
	Year: IZdxBehaviorScore
	// 近1个月窗口基础数值参照（评分依据按窗口展示）
	Month1Basis: IZdxBehaviorScoreBasis
	// 近3个月窗口基础数值参照
	Month3Basis: IZdxBehaviorScoreBasis
	// 近6个月窗口基础数值参照
	Month6Basis: IZdxBehaviorScoreBasis
	// 今年窗口基础数值参照
	YearBasis: IZdxBehaviorScoreBasis
	// 月度得分趋势（按月份升序；口径=该月末往前滚动近1个月，窗口内无成交的月份跳过）
	Trend: IZdxBehaviorScoreTrend[]
}

// 单个月度得分趋势点（月份 + 八维得分与综合分；口径=该月末往前滚动近1个月）
export interface IZdxBehaviorScoreTrend {
	// 月份（yyyy-MM）
	Month: string
	// 八维得分与综合分
	Scores: IZdxBehaviorScore
}

// ---------- 总资产趋势与指数对比 ----------

// 总资产趋势（全历史日度日终资产序列 + 区间分布 + 资金流向 + 最新资产构成）
export interface IZdxAssetTrend {
	// 是否有数据（无交易流水时 false）
	HasData: boolean
	// 最新现金余额（元）
	CashBalance: number
	// 最新持仓市值（元）
	MarketValue: number
	// 最新总资产（元）
	TotalAsset: number
	// 累计净投入（银行转证券-证券转银行，元）
	NetInvest: number
	// 总盈亏（最新总资产-累计净投入，元）
	TotalProfit: number
	// 期初总资产（元；全历史起点为0）
	InitialAsset: number
	// 累计资金转入（银行转证券合计，元）
	TransferIn: number
	// 累计资金转出（证券转银行合计绝对值，元）
	TransferOut: number
	// 累计其他流入（红利入账+利息归本+其他，元）
	OtherInflow: number
	// 累计净流入（转入-转出+其他流入，元；账户盈亏=期末总资产-本值）
	NetInflow: number
	// 日度资产序列（全历史，按日期升序）
	Trend: IZdxAssetPoint[]
	// 总资产区间分布（按区间升序）
	Distribution: IZdxAssetBucket[]
}

// 单日资产点（日终口径）
export interface IZdxAssetPoint {
	// 日期
	Date: string
	// 日终现金（元）
	Cash: number
	// 日终持仓市值（元）
	MarketValue: number
	// 日终总资产（元）
	Total: number
	// 截至当日累计净投入（元）
	NetInvest: number
	// 截至当日总盈亏（元）
	Profit: number
}

// 总资产区间分布桶
export interface IZdxAssetBucket {
	// 区间下限（元，含）
	RangeStart: number
	// 区间上限（元）
	RangeEnd: number
	// 落入天数
	Days: number
	// 天数占比（%）
	Percent: number
}

// 收益趋势指数对比（全历史：用户收益率 vs 上证/深证/创业板/科创板指数）
export interface IZdxProfitTrendCompare {
	// 是否有数据
	HasData: boolean
	// 对比点序列（按日期升序）
	Points: IZdxProfitTrendComparePoint[]
}

// 指数对比单日点（收益率均为 %）
export interface IZdxProfitTrendComparePoint {
	// 日期
	Date: string
	// 用户收益率（%；区间首个有资产基准点之前为 null，图表断线处理）
	UserRate: number | null
	// 上证指数收益率（%）
	ShRate?: number
	// 深证成指收益率（%）
	SzRate?: number
	// 创业板指收益率（%）
	CybRate?: number
	// 科创板指数收益率（%）
	KcbRate?: number
	// 当日总资产（元；区间基准重算用）
	Total: number
	// 截至当日累计净投入（元；区间基准重算用）
	NetInvest: number
}

// ---------- 复盘笔记 ----------

// 复盘类型（与后端 ZdxReviewTypeEnum 一致）
export const ZDX_REVIEW_TYPES: { value: number; label: string }[] = [
	{ value: 1, label: '日复盘' },
	{ value: 2, label: '周复盘' },
	{ value: 3, label: '月复盘' },
	{ value: 4, label: '个股复盘' }
]

// 情绪标签候选（复盘时的心理状态标记）
export const ZDX_REVIEW_MOODS = ['冷静', '果断', '自律', '耐心', '贪婪', '恐惧', '犹豫', '冲动', '后悔', '焦虑', '侥幸', '兴奋']

// 当日操作复盘明细项（个股复盘：对单笔买卖的操作说明与最低盈利预测；存于 TradeNotes JSON）
export interface IZdxTradeNoteItem {
	// 交易记录 Id
	RecordId: number
	// 操作说明（可空）
	Note?: string
	// 最低盈利预测（元；可空）
	MinProfit?: number
	// 目标价（浮盈口径 = 成本基准 + 预测盈利 ÷ 数量；落库用于后续复盘回测验证；可空）
	MinPrice?: number
	// 预测期限（交易日：N 个交易日内到达目标价；用于后期回测验证评估；可空）
	Days?: number
}

// 复盘笔记（保存表单）
export interface IZdxReviewSaveForm {
	// 复盘类型（1日 2周 3月 4个股）
	Type: number
	// 复盘日期（空=今天；日/周/月=归一化到所在周期，个股=当天）
	Date?: string
	// 股票代码（个股复盘必填）
	StockCode?: string
	// 情绪标签（逗号分隔；可空）
	MoodTags?: string
	// 情绪分析总结（个股复盘；AI 生成后支持人工修正；可空）
	MoodText?: string
	// 复盘笔记内容（可空）
	Content?: string
	// 技术面复盘（个股复盘；可空）
	TechnicalText?: string
	// 消息面复盘（个股复盘；可空）
	NewsText?: string
	// 当日操作复盘明细 JSON（个股复盘；IZdxTradeNoteItem[] 字符串，可空）
	TradeNotes?: string
	// 后续计划（可空；四区块之一，下期复盘自动回显）
	PlanContent?: string
}

// 复盘笔记（展示与列表）
export interface IZdxReview {
	// 笔记 Id
	Id: number
	// 复盘类型（1日 2周 3月 4个股）
	ReviewType: number
	// 复盘日期（归一化：周=周一、月=月初）
	ReviewDate: string
	// 股票代码（仅个股复盘有值）
	StockCode?: string
	// 情绪标签（逗号分隔）
	MoodTags?: string
	// 情绪分析总结（个股复盘；AI 生成后支持人工修正）
	MoodText?: string
	// 笔记内容
	Content?: string
	// 技术面复盘（个股复盘）
	TechnicalText?: string
	// 消息面复盘（个股复盘）
	NewsText?: string
	// 当日操作复盘明细 JSON（个股复盘；IZdxTradeNoteItem[] 字符串）
	TradeNotes?: string
	// 后续计划（四区块之一）
	PlanContent?: string
	// AI 评分（0~100；null=未评分）
	AiScore?: number
	// AI 评分评语（含回归验证结论）
	AiScoreText?: string
	// AI 评分时间（null=未评分）
	AiScoreTime?: string
	// 创建时间
	CreateTime: string
	// 更新时间
	UpdateTime: string
}

// 复盘笔记 AI 评分结果（回归验证 + 评分；评分后落库）
export interface IZdxReviewScoreResult {
	// 笔记 Id
	Id: number
	// AI 评分（0~100）
	Score: number
	// 回归验证与评语（400字内，含逐项结论）
	Verify?: string
	// 评分时间
	ScoreTime: string
}

// 复盘笔记 AI 评分表单
export interface IZdxReviewScoreForm {
	// 笔记 Id
	Id: number
}

// 复盘上下文（打开复盘抽屉时加载：区间交易记录 + 区间汇总 + 已有笔记）
export interface IZdxReviewContext {
	// 复盘类型（1日 2周 3月 4个股）
	ReviewType: number
	// 区间起始（含；个股复盘=复盘日期）
	RangeBegin: string
	// 区间结束（含；个股复盘=复盘日期）
	RangeEnd: string
	// 股票代码（个股复盘时返回）
	StockCode?: string
	// 区间交易记录（按日期/时间/主键倒序）
	Records: IZdxTradeRecordData[]
	// 区间买入笔数
	BuyCount: number
	// 区间卖出笔数
	SellCount: number
	// 区间净盈亏（移动加权口径）
	ProfitSum: number
	// 区间费用合计（买卖均计入）
	FeeSum: number
	// 区间红利入账净额
	DividendSum: number
	// 区间利息归本净额
	InterestSum: number
	// 区间买入金额合计（成交金额，不含费用）
	BuyAmount: number
	// 区间卖出金额合计（成交金额，不含费用）
	SellAmount: number
	// 已有笔记（日/周/月=该周期笔记，个股=该股当日笔记；无则 null）
	Note?: IZdxReview
	// 笔记列表（仅个股复盘返回：该股全部历史复盘笔记）
	Notes: IZdxReview[]
	// 上期复盘（时间上最近的一条更早笔记；供下次复盘展示计划并手动触发 AI 回归验证；无则 null）
	PrevNote?: IZdxReview
}

// ==================== 流派契合度（SchoolAlignment） ====================

// 流派契合单维对照行
export interface IZdxSchoolAlignDim {
	// 维度键
	Dim: string
	// 维度名
	DimName: string
	// 流派要求
	Expect: string
	// 近期实测
	Recent: string
	// 累计实测
	Total: string
	// 状态（meet=达标 near=接近 off=偏离）
	Status: string
	// 调整建议
	Advice: string
}

// 风格漂移（近期窗口 vs 累计窗口）
export interface IZdxSchoolDrift {
	// 近期主风格
	RecentMainStyle: string
	// 累计主风格
	TotalMainStyle: string
	// 近期选股风格摘要
	RecentStockStyle: string
	// 累计选股风格摘要
	TotalStockStyle: string
	// 主风格是否漂移
	MainStyleDrift: boolean
	// 选股风格是否漂移
	StockStyleDrift: boolean
}

// 流派契合度分析（当前流派 vs 近期/累计实测逐维对照 + 风格漂移 + 重新评定建议）
export interface IZdxSchoolAlignment {
	// 近期窗口是否有成交数据
	HasData: boolean
	// 当前流派 Id（无可用流派为 null）
	CurrentSchoolId?: number | null
	// 当前流派名
	CurrentSchoolName: string
	// 流派来源（user=自选 ai=AI 判定 none=无）
	SchoolSource: string
	// AI 判定流派名（与自选不一致时前端展示对照提示）
	AiJudgedSchoolName: string
	// AI 判定流派与当前流派是否不一致
	AiDiffers: boolean
	// 契合度总分（0~100）
	Overall: number
	// 契合等级（high=高度契合 good=基本契合 drift=偏离）
	Level: string
	// 一句话结论
	Conclusion: string
	// 逐维对照
	Dims: IZdxSchoolAlignDim[]
	// 风格漂移（近期 vs 累计）
	Drift: IZdxSchoolDrift
	// 是否建议重新评定流派
	SuggestChange: boolean
	// 建议流派名
	SuggestSchoolName: string
	// 建议原因
	SuggestReason: string
}

// ==================== 流派契合 AI 深度建议（SchoolAiAdvice） ====================

// 流派契合 AI 深度建议（实时生成不落库）
export interface IZdxSchoolAiAdvice {
	// 建议正文（纯文本，换行分段）
	Advice: string
	// 生成时间
	GeneratedAt: string
}
