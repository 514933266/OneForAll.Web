import { IOAPersonExtenInformationField } from './IOAPersonExtenInformationField'

// 员工入职-个人填写
export interface IOAPersonalEntryFile {
    Id: string
	// 人员姓名
	Name: string
    // 扩展信息
	ExtendInformations: IOAPersonExtenInformationField[]
}