// 智多星（神策智投）：K线形态指标定义（数据中台管理页维护 + 图表形态标注参考数据源）
// 形态方向（与后端 ZdxPatternDirectionEnum 一致；中国市场配色语义：看涨红、看跌绿、中性灰）
export const ZDX_PATTERN_DIRECTIONS = [
	{ value: 1, label: '看涨', tag: 'danger' },
	{ value: 2, label: '看跌', tag: 'success' },
	{ value: 3, label: '中性', tag: 'info' }
]

// 形态分类（与后端 ZdxPatternCategoryEnum 一致）
export const ZDX_PATTERN_CATEGORIES = [
	{ value: 1, label: '反转形态', tag: 'primary' },
	{ value: 2, label: '持续形态', tag: 'warning' },
	{ value: 3, label: '缺口形态', tag: 'success' },
	{ value: 4, label: '其他形态', tag: 'info' }
]

// 示意图形单根K线（0~100 固定坐标系：0=底部 100=顶部；与画板/后端 JSON 契约一致）
export interface IZdxCandleShape {
	// 开盘价（0~100）
	o: number
	// 最高价（0~100；须 ≥ max(o,c)）
	h: number
	// 最低价（0~100；须 ≤ min(o,c)）
	l: number
	// 收盘价（0~100）
	c: number
}

// K线形态指标（zdx_candle_pattern；字段名与后端序列化（PascalCase）一致）
export interface IZdxCandlePatternManage {
	// 形态 Id
	Id: number
	// 形态编码（唯一；与图表形态识别/标注逻辑匹配，新增后不可修改，如 THREE_WHITE_SOLDIERS）
	Code: string
	// 形态名称（管理页与图表说明显示文本，如：红三兵、乌云盖顶）
	Name: string
	// 信号方向（1=看涨 2=看跌 3=中性）
	Direction: number
	// 形态分类（1=反转形态 2=持续形态 3=缺口形态 4=其他形态）
	Category: number
	// 示意图形数据（JSON 数组：[{"o":18,"h":34,"l":14,"c":32},...]；解析后用于缩略图与画板回显）
	Candles: string
	// 形态说明（形态结构特征与研判用法）
	Description?: string
	// 排序号（升序）
	SortNumber: number
	// 是否启用（禁用后图表标注参考不再输出该形态）
	IsEnabled: boolean
	// 创建时间
	CreateTime: string
	// 更新时间
	UpdateTime: string
	// 最后修改人
	Modifier?: string
}

// 形态指标编辑表单（编码仅新增时使用；时间/修改人由服务端写入）
export interface IZdxCandlePatternForm {
	// 形态编码（仅新增时使用；必填且不可与现有重复，如 DARK_CLOUD_COVER）
	Code: string
	// 形态名称（必填，≤50字）
	Name: string
	// 信号方向（1=看涨 2=看跌 3=中性）
	Direction: number
	// 形态分类（1=反转形态 2=持续形态 3=缺口形态 4=其他形态）
	Category: number
	// 示意图形数据（JSON 数组字符串；由K线画板生成，1~8 根）
	Candles: string
	// 形态说明（选填，≤500字）
	Description?: string
	// 排序号（升序）
	SortNumber: number
	// 是否启用
	IsEnabled: boolean
}
