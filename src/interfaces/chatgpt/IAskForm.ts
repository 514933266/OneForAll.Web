// 提问表单
export interface IAskForm {
	// 当前问题
    Question: string
    // 问答历史
    Historys: IAskHistoryForm[]
}

export interface IAskHistoryForm {
	// 角色，暂时为 user robot
    Role: string
    // 内容
    Content: string
}
