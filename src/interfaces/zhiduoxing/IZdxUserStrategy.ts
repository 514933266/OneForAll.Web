// 智多星（神策智投）：用户交易策略（人工录入策略正文 + 按流派周期分级验证 + 大验证 AI 归因）
// 说明：字段名与后端序列化（PascalCase）一致；窗口指标口径与复盘中心 KPI 趋势同源（IZdxKpiTrendItem）
import { IZdxKpiTrendItem } from './IZdxStockReview'

// 验证级别（1=小验证 轻量行，只落指标与判定；2=大验证 完整三组对比 + AI 归因）
export const ZDX_VERIFY_LEVELS = [
	{ value: 1, label: '小验证', tag: 'info' },
	{ value: 2, label: '大验证', tag: 'primary' }
]

// 验证判定（样本数小于 5 记 deferred，不下结论）
export const ZDX_VERIFY_VERDICTS = [
	{ value: 'improved', label: '改善', tag: 'success' },
	{ value: 'flat', label: '持平', tag: 'info' },
	{ value: 'worse', label: '恶化', tag: 'danger' },
	{ value: 'deferred', label: '样本不足', tag: 'warning' }
]

// 策略状态（1=进行中 2=已结束）
export const ZDX_STRATEGY_STATUS = [
	{ value: 1, label: '进行中', tag: 'primary' },
	{ value: 2, label: '已结束', tag: 'info' }
]

// 规则可自动评估类型（与后端 ZdxRuleEvalKind 对齐：0=仅定义不自动评估）
export const ZDX_RULE_EVAL_LABELS: Record<number, string> = {
	0: '仅定义',
	1: '时间窗',
	2: '止损',
	3: '止盈',
	4: '持有期'
}

// 五子策略维度展示名（与后端目录 Group 对齐）
export const ZDX_SUBRULE_GROUPS = [
	{ key: 'stock', label: '选股' },
	{ key: 'timing', label: '择时' },
	{ key: 'position', label: '仓位' },
	{ key: 'takeprofit', label: '止盈' },
	{ key: 'stoploss', label: '止损' }
]

// 五子策略单条规则定义（目录元素）
export interface IZdxRuleDef {
	// 规则编码
	Key: string
	// 所属维度
	Group: string
	// 规则名称
	Name: string
	// 参数单位（空=无数值参数）
	Unit: string
	// 默认参数值
	DefaultParam: number
	// 可自动评估类型（0=仅定义 1=时间窗 2=止损 3=止盈 4=持有期）
	Eval: number
	// 参数下限
	Min: number
	// 参数上限
	Max: number
}

// 五子策略维度目录
export interface IZdxRuleGroupCatalog {
	// 维度键
	Group: string
	// 维度名称
	Name: string
	// 规则清单
	Rules: IZdxRuleDef[]
}

// 用户勾选的单条五子策略规则
export interface IZdxSubRule {
	// 规则编码
	Key: string
	// 是否启用
	Enabled: boolean
	// 参数值
	Param: number
}

// 用户勾选的五子策略维度分组
export interface IZdxSubRuleGroup {
	// 维度键
	Group: string
	// 勾选规则
	Rules: IZdxSubRule[]
}

// 单维度执行率
export interface IZdxDimensionRate {
	// 维度键
	Group: string
	// 维度名称
	Name: string
	// 该维度执行率（%；无可自动评估规则 null）
	Rate?: number | null
	// 应评估笔数
	EvaluableCount: number
	// 违规笔数
	ViolationCount: number
	// 仅定义不自动评估的启用规则数
	SkippedCount: number
	// 该维度是否已配置启用规则
	Configured: boolean
}

// 单笔违规明细
export interface IZdxViolation {
	// 违规发生日（不可得 null）
	TradeDate?: string | null
	// 股票代码
	StockCode: string
	// 股票名称
	StockName?: string | null
	// 命中规则编码
	RuleKey: string
	// 命中规则名称
	RuleName: string
	// 所属维度
	Group: string
	// 影响度（%；时间窗类 null）
	ImpactPct?: number | null
}

// 执行度对比分组指标
export interface IZdxExecGroup {
	// 样本数
	Count: number
	// 胜率（%；无样本 null）
	WinRate?: number | null
	// 盈亏比（无亏损样本 null）
	ProfitLossRatio?: number | null
	// 期望值（元/笔；无样本 null）
	Expectancy?: number | null
}

// 执行 vs 不执行对比
export interface IZdxExecCompare {
	Compliant: IZdxExecGroup
	Violated: IZdxExecGroup
}

// 策略执行度（逐笔对照五子策略勾选规则的纪律评估）
export interface IZdxExecutionDegree {
	// 总体执行率（%；无任何可评估规则 null）
	OverallRate?: number | null
	// 各维度执行率（五维全列出）
	Dimensions: IZdxDimensionRate[]
	// 违规明细（按影响降序）
	Violations: IZdxViolation[]
	// 执行 vs 不执行对比
	Compared: IZdxExecCompare
	// 参与评估的已了结样本数
	SampleCount: number
	// 是否存在任一可自动评估的启用规则
	HasEvaluable: boolean
}

// 策略窗口指标（基线期与各验证期同一形状；与复盘中心 KPI 同口径）
export interface IZdxStrategyMetrics {
	// 实盘已了结样本数（判定 deferred 的依据）
	LiveCount: number
	// 实盘已了结胜率（%；无样本 null）
	WinRate?: number | null
	// 实盘盈亏比（无亏损样本 null）
	ProfitLossRatio?: number | null
	// 实盘期望值（元/笔；无样本 null）
	Expectancy?: number | null
	// 已判定假设数
	ForecastCount: number
	// 假设方向命中率（%；无已判定假设 null）
	HitRate?: number | null
	// 成交笔数（交易频率主指标）
	TradeCount: number
	// 窗口内费用合计（元）
	FeeSum: number
	// 费用侵蚀率（%；窗口毛利≤0 不可评估 null）
	FeeErosion?: number | null
}

// 策略验证点（时间线元素；小验证轻量行，大验证带 AI 归因）
export interface IZdxUserStrategyVerify {
	// 验证点 Id
	Id: number
	// 验证级别（1=小验证 2=大验证）
	Level: number
	// 该级别第几个验证期
	VerifyNo: number
	// 本期窗口起始日
	WindowBegin: string
	// 本期窗口结束日
	WindowEnd: string
	// 本期指标
	Metrics: IZdxStrategyMetrics
	// 判定（improved/flat/worse/deferred）
	Verdict: string
	// AI 归因评语（仅大验证；小验证为空）
	AiNote?: string | null
	// 生成时间
	GeneratedAt: string
}

// 用户交易策略（列表/详情；详情另含 BucketTrend）
export interface IZdxUserStrategy {
	// 策略 Id
	Id: number
	// 策略名称
	Name: string
	// 策略内容与执行要点
	Content: string
	// 关联改进方向规则编码（逗号串，如 "P5,E3"；可空）
	LinkedRuleKeys?: string | null
	// 小验证周期天数（创建时从流派快照）
	MinorDays: number
	// 大验证周期天数（创建时从流派快照）
	MajorDays: number
	// 策略起始日
	StartDate: string
	// 策略结束日（空=进行中）
	EndDate?: string | null
	// 状态（1=进行中 2=已结束）
	Status: number
	// 基线期指标快照（StartDate 前 MajorDays 窗口）
	Baseline: IZdxStrategyMetrics
	// 五子策略勾选（未配置为空数组）
	SubRules?: IZdxSubRuleGroup[]
	// 当前处于第几个小验证期
	CurrentMinorNo: number
	// 距下个大验证点剩余天数（已结束为 0）
	NextMajorInDays: number
	// 最近大验证判定（尚无大验证为空）
	LastMajorVerdict?: string | null
	// 验证点时间线（窗口升序）
	Verifies: IZdxUserStrategyVerify[]
	// 周期走势（按小验证周期分桶，最多 26 桶；仅详情接口返回）
	BucketTrend?: IZdxKpiTrendItem[]
}

// 策略录入表单（Id 0=新建；编辑仅 Name/Content/LinkedRuleKeys/SubRules 生效）
export interface IZdxUserStrategyForm {
	// 策略 Id（0=新建）
	Id: number
	// 策略名称（必填，≤100字）
	Name: string
	// 策略内容与执行要点（必填，≤2000字）
	Content: string
	// 关联改进方向规则编码（逗号串；诊断带"定为策略目标"预填）
	LinkedRuleKeys?: string
	// 小验证周期天数（0=按流派默认）
	MinorDays: number
	// 大验证周期天数（0=按流派默认）
	MajorDays: number
	// 策略起始日（yyyy-MM-dd；空=今天）
	StartDate?: string
	// 五子策略勾选（新建可空；编辑传则覆盖五子策略）
	SubRules?: IZdxSubRuleGroup[]
}
