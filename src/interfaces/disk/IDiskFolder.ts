// 网盘文件
export interface IDiskFolderTree {
	Id: string
	// 父级id
    ParentId: string
	// 名称
	Name: string
	// 是否删除
    IsDeleted: boolean
	// 创建时间
    CreateTime: Date
	// 子级
	Children: IDiskFolderTree[]
}


// 网盘文件
export interface IDiskFolder {
	Id: string
	// 父级id
    ParentId: string
	// 名称
	Name: string
	// 是否删除
    IsDeleted: boolean
	// 创建时间
    CreateTime: Date
}

// 网盘文件表单
export interface IDiskFolderForm {
	Id: string
	// 父级id
    ParentId: string
	// 名称
	Name: string
}