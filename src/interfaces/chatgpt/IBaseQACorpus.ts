// AI语料库
export interface IBaseQACorpus {
	// id
	Id: string
	// 所属租户id
	TenantId: string
	// 类型
	Type: string
	// 问题
	Question: string
	// 答案
	Answer: string
	// 标签
	Tags: string[]
	// 创建时间
	CreateTime: string
	// 点赞数
	LikeCount: number
	// 点踩数
	DisLikeCount: number
	// 创建人id
	CreatorId: string
	// 创建人姓名
	CreatorName: string
}
