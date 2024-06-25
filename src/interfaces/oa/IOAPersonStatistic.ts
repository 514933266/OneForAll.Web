// 人员统计
export interface IOAPersonStatistic {
    // 在职员工数量
	TotalOnJobCount: number
    // 正式员工数量
	NormalCount: number
    // 试用员工数量
	TrialCount: number
    // 实习生数量
	InternCount: number
    // 当前部门员工数量
    TeamCount: number
    // 当前组员工数量
    GroupCount: number
}
