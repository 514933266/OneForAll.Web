// 智多星（神策智投）：个股公告事件回测（事件驱动全景看板 + 关键事件时间轴 + AI 洞察）
// 字段名与后端序列化（PascalCase）一致

// 关键事件子类（与后端 EventRules.KeySubCategories 一致；公告流水高亮与回测视图筛选共用）
export const ZDX_EVENT_SUB_CATEGORIES = [
	{ value: 21, label: '业绩预告' },
	{ value: 23, label: '分红送转' },
	{ value: 24, label: '股东增减持' },
	{ value: 25, label: '回购' },
	{ value: 26, label: '股权激励' },
	{ value: 27, label: '重大合同中标' },
	{ value: 28, label: '重组并购' },
	{ value: 30, label: '风险警示' },
	{ value: 31, label: '解禁' },
	{ value: 33, label: '不分红' }
]

// 从属/过程性公告关键词（与后端 EventRules.SubordinateWords 同口径；命中不算关键事件）
const SUBORDINATE_WORDS = [
	'进展', '跟踪', '月度', '季度', '补充', '取消', '股东大会', '股东会',
	'章程', '法律意见', '问询', '回复', '提示性公告', '风险提示', '摘要', '更正', '延期'
]

// 是否关键事件（子类命中 + 标题不含从属词；口径与后端事件转写一致，仅用于公告流水高亮展示）
export function isKeyEvent(subCategory?: number, title?: string): boolean {
	if (!subCategory || !ZDX_EVENT_SUB_CATEGORIES.some(e => e.value === subCategory)) return false
	if (!title) return false
	return !SUBORDINATE_WORDS.some(w => title.includes(w))
}

// 子类中文标签（与后端 EventRules.SubLabel 一致）
export function eventSubLabel(subCategory: number): string {
	return ZDX_EVENT_SUB_CATEGORIES.find(e => e.value === subCategory)?.label ?? `子类${subCategory}`
}

// 事件窗口统计行（看板 T+5/T+20/T+60 之一；Sample<5 时 Reliable=false 且胜率/均值均为 null 防小样本误导）
export interface IZdxEventWindowStat {
	// 窗口（交易日数：5/20/60）
	Window: number
	// 有效样本数（该窗口超额已补齐的事件数）
	Sample: number
	// 历史胜率%（超额>0 占比；不可信样本为 null）
	WinRate?: number | null
	// 平均绝对收益%
	AvgAbs?: number | null
	// 平均超额收益%（跑赢上证口径）
	AvgExc?: number | null
	// 样本是否可信（Sample≥5）
	Reliable: boolean
}

// 事件-交易联动结构化条目（Tag 徽标 + 文案 + 日期/收益）
export interface IZdxEventLinkage {
	// 完整文案（含系统判定句）
	Text: string
	// 联动标签（左侧埋伏/右侧顺势跟进/吃满红利/过早兑现/部分兑现/未及时止损/持仓中/已兑现）
	Tag: string
	// 关联买入日（可空）
	BuyDate?: string | null
	// 关联卖出日（可空）
	SellDate?: string | null
	// 区间收益%（qfq 收盘口径）
	Ret?: number | null
	// 是否仍持仓
	Open: boolean
}

// 事件链从属公告行（折叠展示）
export interface IZdxEventSubNews {
	// 公告标题
	Title: string
	// 发布日期
	Date: string
	// 原文链接（可空）
	Url?: string | null
}

// 子类事件计数行（chips 区🔥高发角标与默认子类选择用）
export interface IZdxEventSubCount {
	// 事件子类
	SubCategory: number
	// 该子类事件数
	Count: number
}

// 关键事件行（时间轴卡片）
export interface IZdxStockEvent {
	// 事件主键
	Id: number
	// 关联公告主键
	NewsId: number
	// 公告标题
	Title: string
	// 公告原文链接（可空）
	Url?: string | null
	// 事件子类
	SubCategory: number
	// 影响方向（1利好 2利空 3中性，建行时快照）
	Direction: number
	// 公告发布日
	EventDate: string
	// 基准交易日（发布日后首个交易日，停牌/节假日顺延）
	BaseTradeDate: string
	// 核心数值实体 JSON（AI 提取+tag 复核，已剔除内部 subs；可空）
	KeyParams?: string | null
	// T+5 绝对涨跌幅%（未补齐为 null）
	Abs5?: number | null
	Abs20?: number | null
	Abs60?: number | null
	// T+5 超额涨跌幅%（个股-上证指数同期）
	Exc5?: number | null
	Exc20?: number | null
	Exc60?: number | null
	// 与当前用户交易的联动说明（空=无时空交集）
	Linkages: IZdxEventLinkage[]
	// T+0..T+20 绝对收益百分值序列（Sparkline 迷你线；缺K线为空数组）
	Series: (number | null)[]
	// 同一事件链从属公告（折叠展示）
	SubNews: IZdxEventSubNews[]
}

// 事件驱动全景看板（股 × 事件子类）
export interface IZdxStockEventBoard {
	// 股票代码
	StockCode: string
	// 股票名称
	StockName: string
	// 事件子类
	SubCategory: number
	// 事件总数（<5 前端提示样本不足）
	EventCount: number
	// 三窗口统计（5/20/60 顺序）
	Windows: IZdxEventWindowStat[]
	// 操作建议（规则文案；样本不足为空）
	Advice?: string | null
	// AI 深度洞察缓存（未生成为 null）
	Insight?: string | null
	// 洞察生成时间
	InsightTime?: string | null
	// 时间轴事件列表（按发布日倒序）
	Events: IZdxStockEvent[]
}

// KeyParams 解析结果（AI 提取实体，字段有则有；解析失败按空对象处理）
export interface IZdxEventKeyParams {
	// 金额区间下限（元）
	amtMin?: number
	// 金额区间上限（元）
	amtMax?: number
	// 单一金额（元）
	amt?: number
	// 百分比数值（1=1%）
	ratio?: number
	// 股数（股）
	vol?: number
	// 预测净利润下限（元）
	npMin?: number
	// 预测净利润上限（元）
	npMax?: number
	// 每10股派息金额（元）
	per10Cash?: number
	// 每10股送转合计股数（股）
	per10Bonus?: number
	// 力度标签（注销式回购/激励式回购/高送转/纯派现/不分红等，标题规则复核兼兜底）
	tag?: string
	// 要点（≤30字）
	notice?: string
}

// 金额友好文本（亿/万自适应；空返回 ''）
function fmtMoneyY(v?: number): string {
	if (v === undefined || v === null) return ''
	if (Math.abs(v) >= 1e8) return (v / 1e8).toFixed(2).replace(/\.?0+$/, '') + '亿'
	if (Math.abs(v) >= 1e4) return (v / 1e4).toFixed(2).replace(/\.?0+$/, '') + '万'
	return String(v)
}

// 解析事件核心数值实体为展示片段数组（如 ["金额 1.5亿~3亿", "净利 2亿~3亿", "要点…"]；失败/空返回 []）
export function parseKeyParams(keyParams?: string | null): string[] {
	if (!keyParams) return []
	let kp: IZdxEventKeyParams
	try {
		kp = JSON.parse(keyParams) as IZdxEventKeyParams
	} catch {
		return []
	}
	const parts: string[] =
		typeof kp.amtMin === 'number' || typeof kp.amtMax === 'number'
			? [`金额 ${fmtMoneyY(kp.amtMin) || '?'}~${fmtMoneyY(kp.amtMax) || '?'}`]
			: typeof kp.amt === 'number'
				? [`金额 ${fmtMoneyY(kp.amt)}`]
				: []
	if (typeof kp.ratio === 'number') parts.push(`比例 ${kp.ratio}%`)
	if (typeof kp.vol === 'number') parts.push(`数量 ${fmtMoneyY(kp.vol)}股`)
	if (typeof kp.per10Cash === 'number') parts.push(`每10股派 ${kp.per10Cash}元`)
	if (typeof kp.per10Bonus === 'number') parts.push(`每10股送转 ${kp.per10Bonus}股`)
	if (typeof kp.npMin === 'number' || typeof kp.npMax === 'number') parts.push(`净利 ${fmtMoneyY(kp.npMin) || '?'}~${fmtMoneyY(kp.npMax) || '?'}`)
	if (kp.notice) parts.push(kp.notice)
	return parts
}

// 事件力度标签（KeyParams.tag；无则空串，卡片标题前置用）
export function eventTag(keyParams?: string | null): string {
	if (!keyParams) return ''
	try {
		const kp = JSON.parse(keyParams) as IZdxEventKeyParams
		return typeof kp.tag === 'string' ? kp.tag : ''
	} catch {
		return ''
	}
}

// 走势三元组文本（如 "(T+5)+2.1% | (T+20)+5.3% | (T+60)--"；绝对收益口径，未补齐显示 --）
export function trendTriple(ev: IZdxStockEvent): string {
	const fmt = (v?: number | null) => (v === undefined || v === null ? '--' : (v > 0 ? '+' : '') + v + '%')
	return `(T+5)${fmt(ev.Abs5)} | (T+20)${fmt(ev.Abs20)} | (T+60)${fmt(ev.Abs60)}`
}

// 个股回购方案单条（东财F10权威快照；金额/价格单位=元，数量=股；无值为 null）
export interface IZdxBuybackPlan {
	PriceCap?: number | null
	PriceLower?: number | null
	AmtLower?: number | null
	AmtUpper?: number | null
	VolLower?: number | null
	VolUpper?: number | null
	RatioLower?: number | null
	RatioUpper?: number | null
	ProgressCode?: string
	ProgressText?: string
	IsOngoing: boolean
	StartDate?: string
	EndDate?: string
	NoticeDate?: string
	UpdateDate?: string
	BoughtVol?: number | null
	BoughtAmt?: number | null
	BoughtPriceLower?: number | null
	BoughtPriceUpper?: number | null
	BoughtAvgPrice?: number | null
	Remark?: string
}

// 个股回购上下文（全部历史回购方案 + 是否有未完成方案）
export interface IZdxBuybackContext {
	StockCode?: string
	StockName?: string
	Plans: IZdxBuybackPlan[]
	HasOngoing: boolean
}

// 取日期部分（后端 DateTime 序列化为 "YYYY-MM-DD..."，默认零值 "0001-01-01..."）；零值当空处理
function dpart(s?: string | null): string {
	if (!s) return ''
	const d = String(s).slice(0, 10)
	return d === '0001-01-01' ? '' : d
}

// 为回购事件匹配所属回购方案（优先：方案公告日≤事件日且不早于回购结束的最近方案；否则取方案公告日最近的一条）
export function matchBuybackPlan(plans: IZdxBuybackPlan[] | undefined | null, eventDate?: string): IZdxBuybackPlan | null {
	if (!plans || !plans.length || !eventDate) return null
	const d = dpart(eventDate)
	let best: IZdxBuybackPlan | null = null
	for (const p of plans) {
		const nd = dpart(p.NoticeDate)
		if (!nd || nd > d) continue
		const ed = dpart(p.EndDate)
		if (ed && ed < d) continue
		if (!best || nd > dpart(best.NoticeDate)) best = p
	}
	if (best) return best
	let nb: IZdxBuybackPlan | null = null
	let min = Infinity
	for (const p of plans) {
		const nd = dpart(p.NoticeDate)
		if (!nd) continue
		const diff = Math.abs(new Date(nd).getTime() - new Date(d).getTime())
		if (diff < min) {
			min = diff
			nb = p
		}
	}
	return nb
}
