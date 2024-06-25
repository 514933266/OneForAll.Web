// 后端统一返回分页对象
export interface IBasePage<T> {
	Total: number
	PageSize: number
	PageIndex: number
	Items: T[]
}
