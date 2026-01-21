// 后端统一返回对象
export interface IBaseMessage {
	Status: boolean
	ErrType: number
	Message: string
	Data: any
}
