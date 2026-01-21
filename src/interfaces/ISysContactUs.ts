// 联系我们
export interface ISysContactUs {
	Id: string
	// 姓名/公司名称
	Name: string
	// 邮箱/电话
	Contact: string
	// 留言
	Message: string
    // 创建日期
    CreateTime: Date
}