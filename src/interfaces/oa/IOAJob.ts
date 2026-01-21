// 人员职级
export interface IOAJob {
    Id:string
    // 名称
    Name: string
    // 类别id
    TypeId:string
    // 类别
    TypeName: string
    // 职级id
    LevelId: string
    // 职级
    LevelName: string
    // 职务id
    DutyId: string
    // 职务
    DutyName: string
    // 所属部门
    TeamId: string
    // 团队
    TeamName: string
    // 是否启用
    IsEnabled: string
}
