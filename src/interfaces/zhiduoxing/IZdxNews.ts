// 智多星（神策智投）：资讯（消息面）
// 消息大类（与后端 ZdxNewsCategory 一致）
export const ZDX_NEWS_CATEGORIES = [
	{ value: 0, label: '未分类', tag: 'info' },
	{ value: 1, label: '国家政策', tag: 'danger' },
	{ value: 2, label: '公告', tag: 'warning' },
	{ value: 3, label: '常规资讯', tag: 'primary' },
	{ value: 9, label: '其他', tag: 'info' }
]

// 消息子类（与后端 ZdxNewsSubCategory 一致，按大类分段）
export const ZDX_NEWS_SUB_CATEGORIES = [
	// 国家政策（1x）
	{ value: 11, label: '货币政策', parent: 1 },
	{ value: 12, label: '财政政策', parent: 1 },
	{ value: 13, label: '产业政策', parent: 1 },
	{ value: 14, label: '监管政策', parent: 1 },
	{ value: 15, label: '区域政策', parent: 1 },
	{ value: 16, label: '外交贸易', parent: 1 },
	{ value: 19, label: '其他政策', parent: 1 },
	// 公告（2x）
	{ value: 21, label: '业绩预告', parent: 2 },
	{ value: 22, label: '定期报告', parent: 2 },
	{ value: 23, label: '分红送转', parent: 2 },
	{ value: 24, label: '股东增减持', parent: 2 },
	{ value: 25, label: '回购', parent: 2 },
	{ value: 26, label: '股权激励', parent: 2 },
	{ value: 27, label: '重大合同中标', parent: 2 },
	{ value: 28, label: '重组并购', parent: 2 },
	{ value: 29, label: '停复牌', parent: 2 },
	{ value: 30, label: '风险警示', parent: 2 },
	{ value: 31, label: '解禁', parent: 2 },
	{ value: 32, label: '人事变动', parent: 2 },
	{ value: 39, label: '其他公告', parent: 2 },
	// 常规资讯（4x）
	{ value: 41, label: '公司动态', parent: 3 },
	{ value: 42, label: '行业资讯', parent: 3 },
	{ value: 43, label: '市场评论', parent: 3 },
	{ value: 44, label: '机构观点', parent: 3 },
	{ value: 49, label: '其他资讯', parent: 3 }
]

// 影响方向（与后端 ZdxNewsDirection 一致）
export const ZDX_NEWS_DIRECTIONS = [
	{ value: 0, label: '未判定', tag: 'info' },
	{ value: 1, label: '利好', tag: 'danger' },
	{ value: 2, label: '利空', tag: 'success' },
	{ value: 3, label: '中性', tag: 'info' }
]

// 影响强度（与后端 ZdxNewsStrength 一致）
export const ZDX_NEWS_STRENGTHS = [
	{ value: 0, label: '未判定', tag: 'info' },
	{ value: 1, label: '高', tag: 'danger' },
	{ value: 2, label: '中', tag: 'warning' },
	{ value: 3, label: '低', tag: 'info' }
]

// 消息域（与后端 ZdxNewsKind 一致）
export const ZDX_NEWS_KINDS = [
	{ value: 1, label: '全局快讯' },
	{ value: 2, label: '个股资讯' }
]

// 数据来源（快讯/资讯：2=东财 4=腾讯）
export const ZDX_NEWS_DATA_SOURCES = [
	{ value: 2, label: '东财', tag: 'success' },
	{ value: 4, label: '腾讯', tag: 'primary' }
]

// 消息 AI 分析简要（列表内联徽标；字段名与后端序列化（PascalCase）一致）
export interface IZdxNewsAiBrief {
	// 消息大类（0未分类 1国家政策 2公告 3常规资讯 9其他）
	Category: number
	// 消息子类（政策1x/公告2x/资讯4x，0未细分）
	SubCategory: number
	// 影响方向（0未判定 1利好 2利空 3中性）
	Direction: number
	// 影响强度（0未判定 1高 2中 3低）
	Strength: number
	// AI 摘要
	AiSummary?: string
	// 是否人工修正
	IsManual: boolean
}

// 全局快讯（资讯页列表；AI 分类结果内联填充，未分析为空）
export interface IZdxNewsFlashData {
	// 主键
	Id: number
	// 标题
	Title: string
	// 摘要/正文
	Summary?: string
	// 来源媒体
	SourceName?: string
	// 渠道标记（腾讯指数代码/东财fastNews）
	Channel?: string
	// 原文链接
	Url?: string
	// 发布时间
	PublishTime: string
	// 数据来源（2=东财 4=腾讯）
	DataSource: number
	// AI 分析结果（未分析为空）
	Ai?: IZdxNewsAiBrief
}

// 个股资讯/公告（资讯页列表；AI 分类结果内联填充，未分析为空）
export interface IZdxNewsStockItem {
	// 主键
	Id: number
	// 股票代码
	StockCode: string
	// 条目类型（1资讯 2公告）
	ItemType: number
	// 标题
	Title: string
	// 来源（资讯=媒体名）
	Source?: string
	// 原文链接
	Url?: string
	// 发布时间
	PublishTime: string
	// 数据来源（2=东财 4=腾讯；存量NULL视为东财）
	DataSource?: number
	// AI 分析结果（未分析为空）
	Ai?: IZdxNewsAiBrief
}

// 消息 AI 分析完整（详情抽屉）
export interface IZdxNewsAiData extends IZdxNewsAiBrief {
	// 更新时间
	UpdateTime: string
}

// 消息影响面明细（详情抽屉：受影响板块/个股）
export interface IZdxNewsImpact {
	// 主键
	Id: number
	// 目标类型（1=板块 2=个股）
	TargetType: number
	// 目标代码（板块=行业名称，未匹配为NULL；个股=股票代码）
	TargetCode?: string
	// 目标名称
	TargetName: string
	// 影响方向
	Direction: number
	// 影响强度
	Strength: number
	// 影响理由
	Reason?: string
	// 排序号
	SortNumber: number
}

// 消息详情聚合（详情抽屉：消息本体+AI分析+影响面明细）
export interface IZdxNewsDetail {
	// 消息域（1全局快讯 2个股资讯公告）
	NewsKind: number
	// 消息主键
	NewsId: number
	// 股票代码（个股资讯公告；快讯为空）
	StockCode?: string
	// 条目类型（个股资讯公告；快讯为空）
	ItemType?: number
	// 标题
	Title: string
	// 摘要/正文
	Summary?: string
	// 来源媒体
	SourceName?: string
	// 原文链接
	Url?: string
	// 发布时间
	PublishTime: string
	// 数据来源（2=东财 4=腾讯；存量NULL视为东财）
	DataSource?: number
	// AI 分析结果（未分析为空）
	Ai?: IZdxNewsAiData
	// 影响面明细（未分析为空列表）
	Impacts: IZdxNewsImpact[]
}

// 消息面统计（资讯页顶部统计卡）
export interface IZdxNewsStats {
	// 今日全局快讯条数
	TodayFlashCount: number
	// 今日个股资讯/公告条数
	TodayStockNewsCount: number
	// 今日国家政策条数
	TodayPolicyCount: number
	// 今日公告条数
	TodayAnnouncementCount: number
	// 今日常规资讯条数
	TodayNewsCount: number
	// 今日高影响消息条数
	TodayHighCount: number
	// 待分析消息条数
	PendingCount: number
}

// 消息面日报
export interface IZdxNewsDaily {
	// 日期
	TradeDate: string
	// AI 总结正文
	AiSummary: string
	// 更新时间
	UpdateTime: string
}

// 消息面列表查询条件（空值=不限）
export interface IZdxNewsQuery {
	// 股票代码（精确筛选，仅个股资讯/公告列表用）
	StockCode?: string
	// 消息大类
	Category?: number
	// 消息子类
	SubCategory?: number
	// 影响方向
	Direction?: number
	// 影响强度
	Strength?: number
	// 数据来源（2东财 4腾讯）
	DataSource?: number
	// 标题关键词
	Key?: string
	// 起始时间（yyyy-MM-dd）
	Begin?: string
	// 结束时间（yyyy-MM-dd）
	End?: string
}

// 公告提示最新条目（tab 徒标 tooltip / 顶栏 chip 展示）
export interface INoticeHintItem {
	// 公告主键
	Id: number
	// 公告标题
	Title: string
	// 发布时间
	PublishTime: string
	// 是否回购生命周期公告
	IsBuyback: boolean
}

// 个股近期公告提示（近 7 天公告数 + 回购进行中）
export interface INoticeHint {
	// 股票代码
	StockCode: string
	// 是否展示提示
	Show: boolean
	// 近 7 天公告条数
	RecentCount: number
	// 回购进行中（方案已披露未完成）
	BuybackActive: boolean
	// 最新公告时间
	LatestTime?: string
	// 提示条目（最多 6 条）
	Items: INoticeHintItem[]
}
