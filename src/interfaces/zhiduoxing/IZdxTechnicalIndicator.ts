// 智多星（神策智投）：技术指标定义（数据中台管理页维护 + 图表指标选择列表数据源）
// 指标分类（与后端 ZdxIndicatorCategoryEnum 一致）
export const ZDX_INDICATOR_CATEGORIES = [
	{ value: 1, label: '趋势型', tag: 'primary' },
	{ value: 2, label: '摆动型', tag: 'warning' },
	{ value: 3, label: '成交量型', tag: 'success' },
	{ value: 4, label: '波动型', tag: 'info' }
]

// 展示位置（与后端 ZdxIndicatorPositionEnum 一致）
export const ZDX_INDICATOR_POSITIONS = [
	{ value: 1, label: '主图叠加' },
	{ value: 2, label: '副图' }
]

// 技术指标定义（zdx_technical_indicator；字段名与后端序列化（PascalCase）一致）
export interface IZdxTechnicalIndicatorManage {
	// 指标 Id
	Id: number
	// 指标编码（唯一；与图表计算/展示逻辑匹配，新增后不可修改）
	Code: string
	// 指标名称（管理页与图表选择列表显示文本）
	Name: string
	// 分类（1=趋势型 2=摆动型 3=成交量型 4=波动型）
	Category: number
	// 展示位置（1=主图叠加 2=副图）
	Position: number
	// 默认参数（逗号分隔的周期序列，如 "12,26,9"；可为空表示无参数）
	Params?: string
	// 指标说明（计算口径与研判用法）
	Description?: string
	// 排序号（升序）
	SortNumber: number
	// 是否启用（禁用后图表可选列表不再输出该指标）
	IsEnabled: boolean
	// 创建时间
	CreateTime: string
	// 更新时间
	UpdateTime: string
	// 最后修改人
	Modifier?: string
}

// 技术指标编辑表单（编码仅新增时使用；时间/修改人由服务端写入）
export interface IZdxTechnicalIndicatorForm {
	// 指标编码（仅新增时使用；必填且不可与现有重复，如 MA/MACD）
	Code: string
	// 指标名称（必填，≤50字）
	Name: string
	// 分类（1=趋势型 2=摆动型 3=成交量型 4=波动型）
	Category: number
	// 展示位置（1=主图叠加 2=副图）
	Position: number
	// 默认参数（选填，≤100字）
	Params?: string
	// 指标说明（选填，≤500字）
	Description?: string
	// 排序号（升序）
	SortNumber: number
	// 是否启用
	IsEnabled: boolean
}
