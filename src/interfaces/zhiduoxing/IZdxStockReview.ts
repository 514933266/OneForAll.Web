// 智多星（神策智投）：个股复盘（走势复盘：画图 + 手动预测 + 验证判定）
import { ZdxTagType } from './IZdxMyTrade'

// 画图图元类型（与画图引擎一致：趋势线/水平线/箭头/文字/矩形/振幅尺子）
export type ZdxDrawingType = 'trend' | 'hline' | 'arrow' | 'text' | 'rect' | 'ruler'

// 画图坐标点（数据坐标：日期 + 价格；不随缩放窗口变化，窗口滚动/缩放自适应重绘）
export interface IZdxChartPoint {
	// 日期（yyyy-MM-dd）
	Date: string
	// 价格（显示口径；持久化时后端/引擎按锚点口径处理）
	Price: number
}

// 画图图元（趋势线/箭头/矩形/振幅尺子=2点；水平线/文字=1点）
export interface IZdxChartShape {
	// 图元类型
	Type: ZdxDrawingType
	// 坐标点（数据坐标）
	Points: IZdxChartPoint[]
	// 文字内容（仅 text）
	Text?: string
	// 颜色（十六进制）
	Color?: string
}

// 个股画图（后端存储与回显）
export interface IZdxStockDrawing {
	// 股票代码
	StockCode: string
	// 周期（minute分时 day日K week周K month月K）
	Period: string
	// 图元 JSON 数组字符串（IZdxChartShape[]）
	Drawings?: string
	// 手动支撑位（不复权价；null=按最近未回补向上缺口自动计算）
	SupportPrice?: number | null
	// 手动压力位（不复权价；null=按最近未回补向下缺口自动计算）
	ResistPrice?: number | null
	// 更新时间
	UpdateTime: string
}

// 画图保存表单
export interface IZdxStockDrawingSaveForm {
	// 股票代码
	StockCode: string
	// 周期（minute分时 day日K week周K month月K）
	Period: string
	// 图元 JSON 数组字符串（空数组=清空）
	Drawings?: string
}

// 支撑/压力位保存表单（按 股票+周期 定位；null=恢复自动计算）
export interface IZdxStockPriceLevelSaveForm {
	// 股票代码
	StockCode: string
	// 周期（minute分时 day日K week周K month月K；一期仅day）
	Period: string
	// 手动支撑位（不复权价；>0；null=恢复自动计算）
	SupportPrice?: number | null
	// 手动压力位（不复权价；>0；null=恢复自动计算）
	ResistPrice?: number | null
}

// 预测锚点（日期 + OHLC 不复权价；四项组成一根预测K线，收盘价为预测路径口径；后端保存时首锚点由最新日K收盘校正）
export interface IZdxForecastAnchor {
	// 锚点日期（yyyy-MM-dd）
	Date: string
	// 锚点收盘价（不复权；预测路径与验证以收盘价为准）
	Price: number
	// 开盘价（不复权；缺省=收盘价）
	Open?: number
	// 最高价（不复权；缺省=收盘价）
	High?: number
	// 最低价（不复权；缺省=收盘价）
	Low?: number
}

// 预测逐日对比明细
export interface IZdxForecastVerifyItem {
	// 交易日
	Date: string
	// 预测价（插值；不复权）
	Predict: number
	// 实际收盘价（不复权；收盘口径）
	Actual: number
	// 偏差率（收盘口径：（实际收盘-预测）/预测*100）
	Diff: number
	// 实际最高价（不复权；日内最高口径）
	High: number
	// 最高偏差率（最高口径：（实际最高-预测）/预测*100）
	DiffHigh: number
}

// 个股走势预测（列表展示）
export interface IZdxStockForecast {
	// 预测 Id
	Id: number
	// 股票代码
	StockCode: string
	// 股票名称（复盘中心台账联查；其它入口可空）
	StockName?: string
	// 周期（一期固定 day）
	Period: string
	// 预测锚点列表（不复权价，按日期升序，首锚点=起点）
	Anchors: IZdxForecastAnchor[]
	// 预测起始日期
	StartDate: string
	// 预测截止日期
	EndDate: string
	// 状态（1进行中 2已判定）
	Status: number
	// 来源（1画图路径 2表单快捷；存量数据默认 1）
	Source?: number
	// 假设类型（1突破 2回调 3趋势延续 4震荡整理 5反转；空=未标记）
	HypothesisType?: number | null
	// 假设理由
	Reason?: string | null
	// 创建时点持仓标记（创建日及之前该股净持仓>0；复盘中心统计用）
	IsHeldWhenCreated?: boolean
	// 方向判定（null=未判定）
	HitDirection?: boolean
	// 幅度判定（1超越 2贴近 3不及；null=未判定）
	AmplitudeClass?: number
	// 路径判定（1贴合 2轻微偏移 3不利偏移 4反向；null=未判定）
	PathClass?: number
	// 综合得分（0~100；null=未判定）
	Score?: number
	// 验证价格口径（1=收盘价 2=日内最高价；正式判定口径；null=未判定）
	VerifyPriceBasis?: number | null
	// 副口径方向判定（另一价格口径下重算，对照用；null=未判定）
	AltHitDirection?: boolean | null
	// 副口径幅度判定（1超越 2贴近 3不及；null=未判定）
	AltAmplitudeClass?: number | null
	// 副口径路径判定（1贴合 2轻微偏移 3不利偏移 4反向；null=未判定）
	AltPathClass?: number | null
	// 副口径综合得分（0~100，对照用；null=未判定）
	AltScore?: number | null
	// 逐日对比明细（已判定时返回）
	VerifyItems: IZdxForecastVerifyItem[]
	// 验证时间（null=未判定）
	VerifyTime?: string
	// 创建时间
	CreateTime: string
	// 更新时间
	UpdateTime: string
}

// 预测保存表单（锚点 2~6 个、日期升序不重复、仅日K；即预测期限 1~5 个交易日）
export interface IZdxStockForecastSaveForm {
	// 股票代码
	StockCode: string
	// 周期（一期固定 day）
	Period: string
	// 预测锚点列表
	Anchors: IZdxForecastAnchor[]
	// 来源（1画图路径 2表单快捷；空=画图路径）
	Source?: number
	// 假设类型（1~5；空=未标记）
	HypothesisType?: number | null
	// 假设理由（表单快捷填写；最多500字）
	Reason?: string
}

// 长线目标预测（里程碑式：N 个交易日内到达目标收盘价；收盘价口径自动判定）
export interface IZdxStockForecastLong {
	// 记录 Id（删除用）
	Id: number
	// 股票代码
	StockCode: string
	// 股票名称（复盘中心台账联查；其它入口可空）
	StockName?: string
	// 目标交易日数（20/60/120/250/自定义）
	Days: number
	// 目标价（不复权）
	TargetPrice: number
	// 起点收盘价（保存时最新日K不复权收盘）
	BasePrice: number
	// 起点日期（yyyy-MM-dd）
	StartDate: string
	// 状态（1进行中 2已达成 3未达成）
	Status: number
	// 达标日期（未判定为空）
	HitDate?: string | null
	// 达标当日收盘价
	HitPrice?: number | null
	// 达标用时（起点后第几个交易日）
	HitDays?: number | null
	// 最新收盘价（进行中=最近收盘；判定后=达标日/到期日收盘）
	LastClose?: number | null
	// 最新收盘日期
	LastCloseDate?: string | null
	// 到期日（起点后第 N 个交易日；日历数据不足为空）
	DeadlineDate?: string | null
	// 剩余交易日（进行中；到期日未知为空）
	RemainDays?: number | null
	// 当前涨幅（%：最新收盘相对起点；判定后=达标/到期涨幅）
	CurrentPct?: number | null
	// 最近验证时间
	VerifyTime?: string | null
	// 创建时间
	CreateTime: string
	// 更新时间
	UpdateTime: string
}

// 长线目标验证状态文案（1进行中 2已达成 3未达成）
export const ZDX_FORECAST_LONG_STATUSES: Record<number, string> = {
	1: '进行中',
	2: '已达成',
	3: '未达成'
}

// 长线目标预测保存表单（同日数覆盖更新；起点由后端按最新日K校正；仅向上）
export interface IZdxStockForecastLongSaveForm {
	// 股票代码
	StockCode: string
	// 目标交易日数（1~500；常用档位 20/60/120/250）
	Days: number
	// 目标价（不复权；须高于最新收盘价）
	TargetPrice: number
}

// 幅度判定文案（与后端 AmplitudeClass 一致）
export const ZDX_FORECAST_AMPLITUDE_CLASSES: Record<number, string> = {
	1: '超越',
	2: '贴近',
	3: '不及'
}

// 路径判定文案（与后端 PathClass 一致）
export const ZDX_FORECAST_PATH_CLASSES: Record<number, string> = {
	1: '贴合',
	2: '轻微偏移',
	3: '不利偏移',
	4: '反向'
}

// 预测得分分档（≥80 优秀 / 60~79 良好 / 40~59 一般 / <40 较差）
export function getForecastGrade(score: number): { label: string; tag: ZdxTagType } {
	if (score >= 80) return { label: '优秀', tag: 'success' }
	if (score >= 60) return { label: '良好', tag: 'primary' }
	if (score >= 40) return { label: '一般', tag: 'warning' }
	return { label: '较差', tag: 'danger' }
}

// 预测计分口径（与后端 ZdxStockReviewManager 常量一致：方向 40 / 幅度贴近 30·超越不及 20 / 路径贴合 30·轻微 20·不利 10·反向 0）
export const ZDX_FORECAST_SCORE_DIRECTION = 40
export const ZDX_FORECAST_SCORE_AMPLITUDE_NEAR = 30
export const ZDX_FORECAST_SCORE_AMPLITUDE_OFF = 20
export const ZDX_FORECAST_SCORE_PATH_FIT = 30
export const ZDX_FORECAST_SCORE_PATH_SLIGHT = 20
export const ZDX_FORECAST_SCORE_PATH_ADVERSE = 10

// 方向维度得分（命中 40 / 未中 0）
export function forecastDirectionScore(hit?: boolean | null): number {
	return hit ? ZDX_FORECAST_SCORE_DIRECTION : 0
}

// 幅度维度得分（贴近 30 / 超越·不及各 20 / 未判定 0）
export function forecastAmplitudeScore(cls?: number | null): number {
	if (cls === 2) return ZDX_FORECAST_SCORE_AMPLITUDE_NEAR
	if (cls === 1 || cls === 3) return ZDX_FORECAST_SCORE_AMPLITUDE_OFF
	return 0
}

// 路径维度得分（贴合 30 / 轻微 20 / 不利 10 / 反向·未判定 0）
export function forecastPathScore(cls?: number | null): number {
	if (cls === 1) return ZDX_FORECAST_SCORE_PATH_FIT
	if (cls === 2) return ZDX_FORECAST_SCORE_PATH_SLIGHT
	if (cls === 3) return ZDX_FORECAST_SCORE_PATH_ADVERSE
	return 0
}

// AI 形态识别单项（近 20 个交易日 K 线；落库保存）
export interface IZdxAiPatternItem {
	// 记录 Id（落库主键；编辑/删除用）
	Id: number
	// 出现日期（yyyy-MM-dd；多根K线组合形态为起始日）
	Date: string
	// 形态结束日期（多根K线组合形态的末根日期；空=单日形态）
	EndDate?: string
	// 形态名称（来自形态知识库）
	Name: string
	// 信号方向（1看涨 2看跌 3中性）
	Direction: number
	// 简短说明（该日期 K 线如何构成该形态）
	Description?: string
	// 来源（1=AI 识别 2=人工修正）
	Source: number
}

// AI 形态识别结果（落库；含人工修正条目）
export interface IZdxAiPatternResult {
	// 股票代码
	StockCode?: string
	// 识别出的形态列表（按日期升序；无形态时为空）
	Items: IZdxAiPatternItem[]
}

// 形态人工保存表单（编辑后来源标记为人工修正）
export interface IZdxAiPatternSaveForm {
	// 记录 Id（必填）
	Id: number
	// 形态出现日期（yyyy-MM-dd；多根K线组合形态为起始日）
	Date: string
	// 形态结束日期（yyyy-MM-dd；多根K线组合形态的末根日期；空=单日形态）
	EndDate?: string
	// 形态名称（必填）
	Name: string
	// 信号方向（1看涨 2看跌 3中性）
	Direction: number
	// 简短说明（可空）
	Description?: string
}

// AI 走势预测生成锚点（未来交易日；OHLC 为按涨跌幅合成的预测K线）
export interface IZdxAiForecastAnchor {
	// 锚点日期（yyyy-MM-dd）
	Date: string
	// 收盘价（不复权）
	Price: number
	// 相对基准涨跌幅（%）
	Pct: number
	// 开盘价（不复权；=前一交易日收盘，首日=基准）
	Open?: number
	// 最高价（不复权）
	High?: number
	// 最低价（不复权）
	Low?: number
}

// AI 走势预测生成结果（编辑草稿；确认后走保存预测接口落库）
export interface IZdxAiForecastResult {
	// 股票代码
	StockCode?: string
	// 预测基准（最新日K不复权收盘）
	Close: number
	// 预测锚点列表（未来交易日，按日期升序）
	Anchors: IZdxAiForecastAnchor[]
	// 预测理由（一句话）
	Comment?: string
}

// AI 情绪分析结果（标签建议 + 总结；支持人工修正后随复盘保存）
export interface IZdxAiMoodResult {
	// 情绪标签建议（均来自候选标签）
	Tags: string[]
	// 情绪分析总结
	Summary?: string
}

// AI 综合分析结果（近 20 日K线一次性生成技术面/情绪面/复盘笔记/后续计划四段复盘初稿）
export interface IZdxAiAnalyzeResult {
	// 技术面复盘文本（K线形态/趋势结构/量价关系）
	Technical?: string
	// 情绪标签建议（均来自候选标签）
	MoodTags: string[]
	// 情绪面总结
	MoodSummary?: string
	// 复盘笔记
	Note?: string
	// 后续计划
	Plan?: string
}

// ==================== 复盘中心（全个股：假设台账 + 统计分析） ====================

// 复盘中心假设台账列表行（全量所有股票；含元信息/锚点/判定结果/逐日明细）
export interface IZdxForecastCenterItem {
	// 假设 Id
	Id: number
	// 股票代码
	StockCode: string
	// 股票名称（联查 zdx_stock；查不到为空）
	StockName?: string
	// 周期（一期固定 day）
	Period: string
	// 假设锚点列表（不复权价，按日期升序，首锚点=起点）
	Anchors: IZdxForecastAnchor[]
	// 起始日期（=首锚点日期）
	StartDate: string
	// 截止日期（=末锚点日期）
	EndDate: string
	// 状态（1进行中 2已判定）
	Status: number
	// 来源（1画图路径 2表单快捷）
	Source: number
	// 假设类型（1突破 2回调 3趋势延续 4震荡整理 5反转；null=未标记）
	HypothesisType?: number | null
	// 假设理由
	Reason?: string | null
	// 创建时点持仓标记（创建日及之前该股净持仓>0）
	IsHeldWhenCreated: boolean
	// 方向判定（null=未判定）
	HitDirection?: boolean | null
	// 幅度判定（1超越 2贴近 3不及；null=未判定）
	AmplitudeClass?: number | null
	// 路径判定（1贴合 2轻微偏移 3不利偏移 4反向；null=未判定）
	PathClass?: number | null
	// 综合得分（0~100；null=未判定）
	Score?: number | null
	// 验证价格口径（1=收盘价 2=日内最高价；正式判定口径；null=未判定）
	VerifyPriceBasis?: number | null
	// 副口径方向判定（另一价格口径下重算，对照用；null=未判定）
	AltHitDirection?: boolean | null
	// 副口径幅度判定（1超越 2贴近 3不及；null=未判定）
	AltAmplitudeClass?: number | null
	// 副口径路径判定（1贴合 2轻微偏移 3不利偏移 4反向；null=未判定）
	AltPathClass?: number | null
	// 副口径综合得分（0~100，对照用；null=未判定）
	AltScore?: number | null
	// 逐日对比明细（详情弹层小折线用）
	VerifyItems: IZdxForecastVerifyItem[]
	// 验证时间（null=未判定）
	VerifyTime?: string | null
	// 创建时间
	CreateTime: string
	// 更新时间
	UpdateTime: string
}

// 复盘中心统计概览
export interface IZdxForecastOverview {
	// 假设总数
	Total: number
	// 进行中数
	Active: number
	// 已判定数
	Verified: number
	// 方向命中率（%；无判定为 null）
	HitRate?: number | null
	// 平均分（无判定为 null）
	AvgScore?: number | null
}

// 复盘中心月度趋势项
export interface IZdxForecastTrendItem {
	// 月份（yyyy-MM）
	Month: string
	// 判定数
	Verified: number
	// 方向命中率（%）
	HitRate: number
	// 平均分
	AvgScore: number
}

// 复盘中心滚动校准项（窗口滚动命中率/平均分）
export interface IZdxForecastCalibrationItem {
	// 序号（按验证时间升序，从 1 开始）
	Seq: number
	// 该条验证时间
	Date: string
	// 窗口滚动方向命中率（%）
	HitRate: number
	// 窗口滚动平均分
	AvgScore: number
}

// 复盘中心分组统计项
export interface IZdxForecastGroupStat {
	// 分组键
	Key: string
	// 分组名称（展示文案）
	Label: string
	// 已判定数
	Verified: number
	// 方向命中率（%）
	HitRate: number
	// 平均分
	AvgScore: number
}

// 复盘中心分组对比（来源/类型/持仓/期限/方向）
export interface IZdxForecastGroups {
	// 按来源（画图路径/表单快捷）
	BySource: IZdxForecastGroupStat[]
	// 按假设类型（突破/回调/趋势延续/震荡整理/反转/未标记）
	ByType: IZdxForecastGroupStat[]
	// 按创建时持仓状态（持仓中/空仓）
	ByHeld: IZdxForecastGroupStat[]
	// 按期限档（短期/中期/长期）
	ByTerm: IZdxForecastGroupStat[]
	// 按方向（看涨/看跌/震荡）
	ByDirection: IZdxForecastGroupStat[]
}

// 复盘中心股票排行项
export interface IZdxForecastRankItem {
	// 股票代码
	StockCode: string
	// 股票名称（查不到为空）
	StockName?: string
	// 假设总数
	Total: number
	// 已判定数
	Verified: number
	// 方向命中率（%）
	HitRate: number
	// 平均分
	AvgScore: number
}

// 复盘中心统计（概览 + 月度趋势 + 滚动校准 + 分组对比 + 股票排行）
export interface IZdxForecastCenterStats {
	// 概览（总数/进行中/已判定/方向命中率/平均分）
	Overview: IZdxForecastOverview
	// 月度趋势（按验证月份升序）
	Trend: IZdxForecastTrendItem[]
	// 滚动校准序列（已判定按验证时间升序，窗口10）
	Calibration: IZdxForecastCalibrationItem[]
	// 分组对比（来源/类型/持仓/期限/方向）
	Groups: IZdxForecastGroups
	// 股票排行（按平均分降序前20）
	Ranking: IZdxForecastRankItem[]
}

// 假设来源文案（与后端 Source 一致）
export const ZDX_FORECAST_SOURCES: Record<number, string> = {
	1: '画图路径',
	2: '表单快捷'
}

// 假设类型文案（与后端 HypothesisType 一致；0=未标记）
export const ZDX_HYPOTHESIS_TYPES: Record<number, string> = {
	1: '突破',
	2: '回调',
	3: '趋势延续',
	4: '震荡整理',
	5: '反转'
}

// ==================== 复盘中心（实盘目标台账：复盘笔记 TradeNotes 折算） ====================

// 复盘中心实盘目标明细（复盘笔记 TradeNotes 逐笔折算；口径与复盘笔记面板一致）
export interface IZdxLiveTargetItem {
	// 交易记录 Id
	RecordId: number
	// 记录类别（1买入 2卖出）
	Category: number
	// 操作说明（可空）
	Note?: string | null
	// 成交数量（股）
	Volume: number
	// 成本基准（买入=含费成本单价；卖出=按目标价-盈利/数量反推）
	Cost: number
	// 目标价（元）
	Target: number
	// 相对成本目标涨幅（%）
	Pct: number
	// 预期盈利（元）
	Profit: number
	// 预测期限（交易日：N 个交易日内到达目标价；可空）
	Days?: number | null
}

// 复盘中心实盘目标笔记（来源：个股复盘笔记 TradeNotes 逐笔折算；仅展示）
export interface IZdxLiveTargetNote {
	// 复盘笔记 Id
	ReviewId: number
	// 股票代码
	StockCode: string
	// 股票名称（联查 zdx_stock；查不到为空）
	StockName?: string
	// 复盘日期（yyyy-MM-dd）
	ReviewDate: string
	// AI 评分（0~100；null=未评分）
	AiScore?: number | null
	// 实盘目标明细（逐笔折算）
	Items: IZdxLiveTargetItem[]
}

// ==================== 复盘中心（实盘目标验证视图 + 交易绩效 + 预测对比） ====================

// 实盘目标达标状态文案（与后端 Status 一致）
export const ZDX_LIVE_TARGET_STATUSES: Record<number, string> = {
	1: '进行中',
	2: '已达标',
	3: '收盘达标',
	4: '到期未达标',
	5: '先触发止损',
	6: '提前卖出',
	9: '无效'
}

// 实盘目标台账行（验证视图：达标状态/实际收益/最大浮盈浮亏/预测偏差）
export interface IZdxLiveTarget {
	// 记录 Id
	Id: number
	// 复盘笔记 Id（跳转复盘笔记）
	ReviewId: number
	// 所属轮次 Id（zdx_trade_cycle.Id；null/0=未关联）
	CycleId?: number | null
	// 所属轮次序号（第 N 轮；0=未关联）
	CycleSeq: number
	// 交易记录 Id
	TradeRecordId: number
	// 股票代码
	StockCode: string
	// 股票名称
	StockName?: string
	// 方向（1=买入 2=卖出）
	Direction: number
	// 成本基准（含费成本单价）
	BasePrice: number
	// 目标价（元）
	TargetPrice: number
	// 目标涨幅（%）
	TargetPct: number
	// 目标数量（股）
	TargetQty: number
	// 预期盈利（元）
	TargetAmount: number
	// 期限（交易日；0=不限）
	DeadlineDays: number
	// 买入时间（买入笔=成交时间；卖出笔=null）
	BuyTime?: string | null
	// 卖出时间（买入笔匹配到卖出回填；卖出笔=成交时间）
	SellTime?: string | null
	// 到期日（买入日+期限交易日；0=不限时为 null）
	DeadlineDate?: string | null
	// 状态（1进行中 2达标 3收盘达标 4到期未达标 5先触发止损 6提前卖出 9无效）
	Status: number
	// 达标时间（精确到分钟；日K兜底=当日收盘时刻）
	HitTime?: string | null
	// 达标价（=目标价）
	HitPrice?: number | null
	// 实际收益率（%；提前卖出后回填）
	ActualReturn?: number | null
	// 实际盈亏（元；提前卖出后回填）
	ActualProfit?: number | null
	// 区间最大浮盈（%；验证区间内最高价相对成本）
	MaxProfit?: number | null
	// 区间最大浮亏（%；≤0）
	MaxDrawdown?: number | null
	// 预测偏差（%=实际收益（未卖出取最大浮盈）-目标涨幅）
	Deviation?: number | null
	// 复盘日期（笔记日期）
	ReviewDate?: string | null
	// 操作说明（笔记逐笔说明）
	Note?: string | null
	// 验证时间（null=未验证）
	VerifyTime?: string | null
	// 创建时间（首次同步时间）
	CreateTime: string
}

// 实盘目标详情轨迹点（价格轨迹：分钟优先、日K兜底）
export interface IZdxLiveTargetTraceItem {
	// 时间标签（分钟来源“MM-dd HH:mm”；日K来源“MM-dd”）
	Time: string
	// 价格（元）
	Price: number
	// 分时均价（分钟来源有值）
	Avg?: number | null
}

// 实盘目标详情（验证结果 + 价格轨迹）
export interface IZdxLiveTargetDetail {
	// 目标主体
	Target: IZdxLiveTarget
	// 价格轨迹（采样后，最多 400 点）
	Trace: IZdxLiveTargetTraceItem[]
	// 轨迹数据来源（minute=分钟K，day=日K）
	DataSource: string
}

// 交易绩效核心指标（卡1）
export interface IZdxTradePerfCore {
	// 净盈亏（元）
	RealizedProfit: number
	// 持仓浮动盈亏（元）
	FloatingProfit: number
	// 卖出胜率（%）
	WinRate?: number | null
	// 盈利笔数
	WinCount: number
	// 亏损笔数
	LossCount: number
	// 已了结笔数
	TotalSold: number
	// 盈亏比（平均盈利÷平均亏损）
	ProfitLossRatio?: number | null
	// 期望值（元/笔）
	Expectancy?: number | null
}

// 交易绩效盈亏分布（卡2）
export interface IZdxTradePerfDistribution {
	// 平均盈利（元）
	AvgProfit?: number | null
	// 平均亏损（元；正值）
	AvgLoss?: number | null
	// 最大盈利（元）
	MaxProfit?: number | null
	// 最大亏损（元；正值）
	MaxLoss?: number | null
	// 盈利中位数（元）
	MedianProfit?: number | null
	// 亏损中位数（元；正值）
	MedianLoss?: number | null
	// 总盈利（元）
	TotalProfit: number
	// 总亏损（元；正值）
	TotalLoss: number
}

// 交易绩效单笔样本（卡3 盈亏单列表 / 卡4 单笔盈亏比排序）
export interface IZdxTradeItem {
	// 实盘目标 Id
	Id: number
	// 复盘笔记 Id（跳转复盘笔记）
	ReviewId: number
	// 交易记录 Id
	TradeRecordId: number
	// 股票代码
	StockCode: string
	// 股票名称
	StockName?: string
	// 买入时间（卖出笔可能为空）
	BuyTime?: string | null
	// 卖出时间
	SellTime?: string | null
	// 成本基准（含费成本）
	BasePrice: number
	// 数量（股）
	Qty: number
	// 实际收益率（%）
	ActualReturn?: number | null
	// 实际盈亏（元）
	ActualProfit?: number | null
	// 目标涨幅（%）
	TargetPct: number
	// 状态（2达标 3收盘达标 4到期未达标 5止损 6提前卖出）
	HitStatus: number
	// 达标时间（可空）
	HitTime?: string | null
	// 区间最大浮盈（%）
	MaxProfit?: number | null
	// 区间最大浮亏（%；≤0）
	MaxDrawdown?: number | null
	// 最大浮亏金额（元；为正=回撤额）
	MaxDrawdownAmount?: number | null
	// 单笔盈亏比=实际盈亏÷最大浮亏金额
	Ratio?: number | null
}

// 交易绩效归因分组（卡5）
export interface IZdxTradeAttributionGroup {
	// 分组键
	GroupKey: string
	// 分组名
	GroupName: string
	// 笔数
	Count: number
	// 胜率（%）
	WinRate?: number | null
	// 盈亏比
	ProfitLossRatio?: number | null
	// 平均盈利（元）
	AvgProfit?: number | null
	// 平均亏损（元；正值）
	AvgLoss?: number | null
	// 期望值（元/笔）
	Expectancy?: number | null
	// 总盈亏（元）
	TotalProfit: number
}

// 交易绩效（五张子卡）
export interface IZdxTradePerformance {
	// 时间范围（all/month/week/custom）
	Range: string
	// 起始日期
	StartDate?: string | null
	// 结束日期
	EndDate?: string | null
	// 已了结样本笔数
	SampleSize: number
	// 样本是否充足（≥10 笔）
	SampleEnough: boolean
	// 卡1 核心指标
	Core: IZdxTradePerfCore
	// 卡2 盈亏分布
	Distribution: IZdxTradePerfDistribution
	// 卡3 盈利单列表（TOP10）
	ProfitTrades: IZdxTradeItem[]
	// 卡3 亏损单列表（TOP10）
	LossTrades: IZdxTradeItem[]
	// 卡4 单笔盈亏比排序（升序 TOP10）
	RatioRanking: IZdxTradeItem[]
	// 卡5 归因·目标达标
	ByHitStatus: IZdxTradeAttributionGroup[]
	// 卡5 归因·持有周期
	ByHoldingPeriod: IZdxTradeAttributionGroup[]
	// 卡5 归因·股票
	ByStock: IZdxTradeAttributionGroup[]
	// 卡5 归因·买卖时段
	ByTradeTime: IZdxTradeAttributionGroup[]
}

// 预测 vs 实盘对比行
export interface IZdxForecastVsLiveRow {
	// 指标名
	Metric: string
	// 假设侧展示值
	Forecast: string
	// 实盘侧展示值
	Live: string
	// 差异（百分点）
	Diff?: number | null
	// 差异色调（1=正 0=中性 -1=负）
	DiffTone?: number | null
}

// 预测 vs 实盘对比（判断力 vs 执行力）
export interface IZdxForecastVsLive {
	// 已判定假设数
	ForecastVerified: number
	// 实盘已了结样本数
	LiveSample: number
	// 对比行
	Rows: IZdxForecastVsLiveRow[]
	// 智能提示
	Insights: string[]
}

// ==================== 策略诊断带（StrategyDiagnosis） ====================

// 策略诊断改进方向（一条问题 = 分组 + 标题 + 证据 + 严重度 + 改进动作 + 跳转目标 + 台账回归状态）
export interface IZdxStrategyIssue {
	// 分组键（judgement=判断力 execution=执行力 performance=绩效退化）
	Group: string
	// 问题标题（结论直达）
	Title: string
	// 证据（数值/样本）
	Evidence: string
	// 严重度（high/mid/low）
	Severity: string
	// 改进动作（可执行文案）
	Action: string
	// 跳转目标（tab-forecast/tab-trade）
	LinkTarget: string
	// 规则编码（J1~J5/E1~E5/P1~P5；台账唯一键）
	RuleKey?: string
	// 回归指标键（feeErosion/expectancy 等；空=计数型）
	MetricKey?: string
	// 回归状态（1未改善 2改善中 3已解决 4恶化）
	Status: number
	// 基线值（首次触发时窗口指标值）
	BaselineValue: number
	// 当前值（最近一次诊断重算的窗口指标值）
	CurrentValue: number
	// 首次检出时间
	FirstDetectedAt: string
	// 最近触发时间
	LastSeenAt: string
	// 回归一句话评语（如"基线 18.2 → 当前 9.6，改善中"）
	RegressionNote?: string
}

// 今日待办
export interface IZdxReviewTodo {
	// 待办类型（forecast=假设到期 review=持仓未写复盘 long=长线临期 live=实盘到期未了结）
	Type: string
	// 待办文案
	Text: string
	// 股票代码（可空）
	StockCode?: string
	// 股票名称（可空）
	StockName?: string
	// 截止日（可空）
	Deadline?: string
	// 跳转目标（tab-forecast/tab-live；review 类为空）
	LinkTarget?: string
}

// KPI 趋势点（按流派小验证周期分桶：实盘胜率/盈亏比/期望值 + 假设命中率 + 成交频率与费用侵蚀）
export interface IZdxKpiTrendItem {
	// 分桶起始日（周桶为周一）
	WeekBegin: string
	// 实盘已了结胜率（%）
	WinRate?: number | null
	// 实盘盈亏比
	ProfitLossRatio?: number | null
	// 实盘期望值（元/笔）
	Expectancy?: number | null
	// 假设方向命中率（%）
	HitRate?: number | null
	// 实盘已了结样本数
	LiveCount: number
	// 已判定假设数
	ForecastCount: number
	// 成交笔数（桶内买入/卖出成交类流水计数）
	TradeCount: number
	// 桶内费用合计（元）
	FeeSum: number
	// 费用侵蚀率（%；桶内毛利≤0 为 null）
	FeeErosion?: number | null
}

// KPI 最新桶环比
export interface IZdxKpiDelta {
	// 胜率差值（pp）
	WinRate?: number | null
	// 盈亏比差值
	ProfitLossRatio?: number | null
	// 期望值差值（元）
	Expectancy?: number | null
	// 命中率差值（pp）
	HitRate?: number | null
	// 成交笔数差值（笔）
	TradeCount?: number | null
	// 费用侵蚀率差值（pp）
	FeeErosion?: number | null
}

// 策略诊断（改进方向含台账回归状态 + 今日待办 + KPI 分桶趋势）
export interface IZdxStrategyDiagnosis {
	// 是否有可诊断数据
	HasData: boolean
	// 改进方向
	Issues: IZdxStrategyIssue[]
	// 今日待办
	Todos: IZdxReviewTodo[]
	// KPI 趋势（近 8 桶，按流派小验证周期分桶）
	KpiTrend: IZdxKpiTrendItem[]
	// KPI 最新桶环比
	KpiDelta: IZdxKpiDelta
	// KPI 分桶天数（流派小验证周期；未评定流派回退 7）
	KpiBucketDays: number
}

// ==================== 执行一致性（ExecutionConsistency） ====================

// 执行一致性行（股票 × 假设期间 × 实盘动作对照）
export interface IZdxExecutionConsistencyItem {
	// 股票代码
	StockCode: string
	// 股票名称
	StockName: string
	// 假设 Id
	ForecastId: number
	// 假设摘要（方向 + 期限）
	ForecastSummary: string
	// 假设起始日期
	ForecastStartDate: string
	// 假设截止日期
	ForecastEndDate: string
	// 假设方向判定
	HitDirection?: boolean | null
	// 假设幅度判定（1超越 2贴近 3不及）
	AmplitudeClass?: number | null
	// 假设综合得分（0~100）
	ForecastScore?: number | null
	// 假设期间买入笔数
	BuyCount: number
	// 假设期间卖出笔数
	SellCount: number
	// 期间首次买入时间
	FirstBuyTime?: string
	// 期间最后卖出时间
	LastSellTime?: string
	// 期间已了结盈亏（元）
	RealizedProfit?: number | null
	// 期间已了结平均实际收益（%）
	ActualReturn?: number | null
	// 一致性标签（plan=按计划执行 reverse=反向操作 early=提前离场 late=止损延误 none=到期未动作）
	Consistency: string
	// 该股已判定假设平均分
	AvgForecastScore: number
}

// ==================== AI 策略周报（StrategyAi） ====================

// AI 策略周报（本周策略归因 + 下周调整建议；落库缓存）
export interface IZdxStrategyAi {
	// 周报正文（纯文本，换行分段）
	Analysis: string
	// 生成时间
	GeneratedAt: string
}
