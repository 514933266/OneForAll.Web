// 网盘文件
export interface IDiskFile {
	Id: string
	// 目录id
	FolderId: string
	// 文件地址
	Url: string
	// 文件名
	Title: string
	// 源文件名
	Original: string
	// 扩展名
	ExtensionName: string
	// 创建时间
	CreateTime: Date
	// 创建人id
	CreatorId: string
	// 创建人姓名
	CreatorName: string
}
