// 智多星（神策智投）：个股复盘画图引擎 - 类型与常量
// 图元持久化模型（IZdxChartShape）见 interfaces/zhiduoxing/IZdxStockReview.ts；
// 坐标口径：内存与持久化统一使用数据坐标 { Date, Price }（Price 存不复权价、显示时经宿主折算），
// 不用类目索引（dataZoom 窗口滚动会使索引失效）
import type { Ref } from 'vue'
import type * as echarts from 'echarts'
import { IZdxChartShape, IZdxForecastAnchor } from '@/interfaces/zhiduoxing/IZdxStockReview'

// 画图模式（select=选择；trend~ruler=图元绘制；forecast=预测锚点编辑）
export type ChartDrawMode = 'select' | 'trend' | 'hline' | 'arrow' | 'text' | 'rect' | 'ruler' | 'forecast'

// 可持久化图元类型（forecast 为预测链路，不落画图图元）
export type ChartShapeType = Exclude<ChartDrawMode, 'select' | 'forecast'>

// 图元默认颜色（按类型区分；rect=区域色、ruler=测量色）
export const DRAW_SHAPE_COLORS: Record<ChartShapeType, string> = {
	trend: '#f7ba2a',
	hline: '#409eff',
	arrow: '#a76af0',
	text: '#ff922b',
	rect: '#36cfc9',
	ruler: '#eb2f96'
}

// 画图工具栏（顺序即展示顺序；图为 FontAwesome 6 solid 图标名；预测按钮由宿主单独渲染）
export const DRAW_TOOLS: { mode: ChartDrawMode; label: string; icon: string }[] = [
	{ mode: 'select', label: '选择', icon: 'arrow-pointer' },
	{ mode: 'trend', label: '趋势线', icon: 'chart-line' },
	{ mode: 'hline', label: '水平线', icon: 'minus' },
	{ mode: 'arrow', label: '箭头', icon: 'location-arrow' },
	{ mode: 'text', label: '文字', icon: 'font' },
	{ mode: 'rect', label: '矩形', icon: 'square' },
	{ mode: 'ruler', label: '振幅尺子', icon: 'ruler' }
]

// 预测渲染色（蓝色虚线路径 + 锚点圆点，与买卖点标记区分）
export const FORECAST_COLOR = '#409eff'

// 引擎选项（宿主 QuoteChart 注入；坐标换算与价格折算口径由宿主提供）
export interface ChartDrawingOptions {
	// 获取 echarts 实例（未创建时返回 null）
	getChart: () => echarts.ECharts | null
	// 当前 x 轴类目序列（K线=周期根日期数组；分时=时分数组）
	getCategories: () => string[]
	// 未来区起始索引（=历史数据根数；索引不小于该值即未来段，预测锚点仅可落此区间）
	getHistoryCount: () => number
	// 持久化日期 → 当前类目（分时：yyyy-MM-dd HH:mm → HH:mm；其余原样）
	parseCategory: (date: string) => string
	// 当前类目 → 持久化日期（分时补当天日期前缀）
	formatCategory: (category: string) => string
	// 不复权价 → 显示口径价（前复权时按当日比率折算）
	toDisplayPrice: (date: string, rawPrice: number) => number
	// 显示口径价 → 不复权价（图元与预测锚点持久化用）
	toRawPrice: (date: string, displayPrice: number) => number
	// 当前画图模式（宿主工具栏控制；select 时恢复图表交互）
	mode: { readonly value: ChartDrawMode }
	// 是否启用（reviewMode 时启用；未启用时引擎不接管任何事件与绘制）
	enabled: { readonly value: boolean }
	// 画图图元读写（状态由宿主持有，引擎只经回调修改）
	getShapes: () => IZdxChartShape[]
	setShapes: (shapes: IZdxChartShape[]) => void
	// 预测锚点读写（不复权价升序；起点锚点由宿主初始化且不可拖动/删除）
	getForecastAnchors: () => IZdxForecastAnchor[]
	setForecastAnchors: (anchors: IZdxForecastAnchor[]) => void
	// 变更回调（宿主标记未保存状态用）
	onShapesChange?: () => void
	onForecastChange?: () => void
}

// 引擎实例（宿主调用）
export interface ChartDrawingInstance {
	// 挂载图表事件（图表实例创建后调用一次）
	attach: () => void
	// 全量重绘（数据/尺寸/缩放/图元与预测变化后调用）
	redraw: () => void
	// 删除选中图元
	deleteSelected: () => void
	// 当前选中图元索引（-1=未选中）
	selectedIndex: Ref<number>
}
