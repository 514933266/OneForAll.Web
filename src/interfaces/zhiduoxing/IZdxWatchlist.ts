// 智多星（神策智投）：自选股（服务端落库，按登录用户隔离）
// 自选股列表项（含行情快照；股票池未收录的代码快照字段以空串/0 兜底）
export interface IZdxWatchlistItem {
	// 股票代码
	StockCode: string
	// 股票名称（股票池未收录时为空串）
	StockName: string
	// 最新价（无快照为0）
	Price: number
	// 涨跌幅（%，无快照为0）
	ChangePercent: number
	// 涨跌额（无快照为0）
	ChangeAmount: number
	// 排序号（升序展示）
	SortNumber: number
	// 添加时间
	CreateTime: string
}

// 自选股本地迁移结果（localStorage 旧自选一次性同步）
export interface IZdxWatchlistMigrateResult {
	// 提交总数（清洗去重后的代码数）
	TotalCount: number
	// 成功迁移数
	MigratedCount: number
	// 跳过数（股票池未收录或服务端已存在）
	SkippedCount: number
}
