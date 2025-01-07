// 站内信
export interface ISysMessage {
	Id: string
	Title: string
	Content: string
	Type: number
	IsRead: boolean
	CreateTime: Date
}
