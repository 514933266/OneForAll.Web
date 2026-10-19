// 智多星（神策智投）：交易日历（管理页维护 + 概览页日期选择）
// 记录来源（与后端 ZdxTradeDaySource 一致）
export const ZDX_TRADE_DAY_SOURCES = [
	{ value: 1, label: '系统生成', tag: 'info' },
	{ value: 2, label: '人工调整', tag: 'warning' },
	{ value: 3, label: '自动标记', tag: 'danger' }
]

// 交易日历记录（zdx_trade_day；字段名与后端序列化（PascalCase）一致）
export interface IZdxTradeDay {
	// 日期（yyyy-MM-dd HH:mm:ss）
	TradeDate: string
	// 是否交易日（工作日默认true，法定节假日自动标记或人工标注为false）
	IsTradeDay: boolean
	// 记录来源（1=系统生成 2=人工调整 3=自动标记节假日）
	Source: number
	// 备注（人工标注假期原因等，可为空）
	Remark?: string
	// 修改人（为空表示未经人工修改）
	Modifier?: string
	// 更新时间
	UpdateTime: string
}

// 交易日人工调整表单（标注假期/恢复交易日；记录来源/修改人/更新时间由服务端写入）
export interface IZdxTradeDayForm {
	// 是否交易日（false=标注为休市，true=恢复为交易日）
	IsTradeDay: boolean
	// 备注（覆盖写入，可为空）
	Remark?: string
}

// 节假日同步表单（按月通过 DeepSeek 获取法定休市安排并比对标记）
export interface IZdxTradeDayHolidayForm {
	// 年份（如 2026）
	Year: number
	// 月份（1~12）
	Month: number
}

// 概览默认展示日期（依据交易日历计算）
export interface IZdxTradeDayDefault {
	// 默认展示日期（yyyy-MM-dd HH:mm:ss）
	TradeDate: string
	// 今日是否交易日
	IsTodayTradeDay: boolean
	// 今日为交易日但尚未收盘（true 时提示"当天未收盘，数据等待收盘后显示"）
	IsTodayNotClosed: boolean
}
