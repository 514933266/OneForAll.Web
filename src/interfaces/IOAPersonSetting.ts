// 人员档案设置
export interface IOAPersonSetting {
	Id: string
    // 显示文本
	Text: string
    // 类型（用来识别系统默认模板）
	Type: number
    // 排序编号
	SortNumber: any
    // 是否可排序
    IsSortable: boolean
    // 是否默认(默认不可删除)
    IsDefault: boolean
    // 是否默认(默认不可删除)
    IsEditable: boolean
    // 是否启用
    IsEnabled: boolean
    // 是否分组（分组即可填写多栏信息）
    IsGrouped: boolean
    // 是否显示可分组（分组即可填写多栏信息）
    IsShowGrouped: boolean
    // 字段明细
    Fields: IOAPersonSettingField[]
}

// 人员档案字段明细
export interface IOAPersonSettingField {
    Id: string
    // 显示文本
	Text: string
    // 字段名称
    Name: string
    // 字段名称
    Value: string
    // 是否启用文本（不启用无法编辑）
    IsEnableText: boolean
    // 类型
    Type: number
    // 是否启用类型（不启用无法编辑）
    IsEnableType: boolean
    // 针对类型的Json配置
    TypeDetails:IOAPersonSettingFieldTypeDetail[]
    // 是否启用类型添加（不启用无法添加或删除）
    IsEnableAddTypeDetail: boolean
    // 是否默认字段
    IsDefault: boolean
    // 是否启用
    IsEnabled: boolean
    // 是否显示启用
    IsShowEnabled: boolean
    // 是否必填
    IsRequired: boolean
    // 是否启用必填（不启用无法编辑）
    IsEnableRequired: boolean
    // 员工可编辑
    IsEmployeeEditable: boolean
    // 是否启用员工可编辑（不启用无法编辑）
    IsEnableEmployeeEditable: boolean
    // 员工可见
    IsEmployeeVisiable: boolean
    // 是否启用显示员工可见（不启用无法编辑）
    IsEnableEmployeeVisiable: boolean
    // 是否启用员工入职登记表显示
    IsEntryFileVisiable: boolean
    // 是否启用员工入职登记表显示（不启用无法编辑）
    IsEnableEntryFileVisiable: boolean
    // 水印提示
    Placeholder: string
    // 字段提示
    Tips: string
    // 排序
    SortNumber  : number
}

export interface IOAPersonSettingFieldTypeDetail {
    // 字段名称
    Name: string
    // 字段名称
    Value: string
}
