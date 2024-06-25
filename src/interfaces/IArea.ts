export interface IArea {
	ParentId: number | null
	Code: string
	Name: string
	ShortName: string
	Level: number
	Id: number
	value?: string
	label?: string
	Children?: IArea[]
}
