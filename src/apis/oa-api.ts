import axios from '../untils/axios'
import qs from 'qs'
import { useClientStore } from '../stores/clientStore'
import { IBasePage } from '../interfaces/IBasePage'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { IPersonalPersonStatistics } from '../interfaces/IPersonalPersonStatistics'
import { INewPerson } from '../interfaces/INewPerson'
import { IOATeamMemberHistory } from '../interfaces/oa/IOATeamMemberHistory'
import { IOAPersonFile } from '../interfaces/oa/IOAPersonFile'
import { IOAPersonalSchedule } from '../interfaces/oa/IOAPersonalSchedule'
import { dayjs } from 'element-plus'
import { IOATableColumnSetting } from '../interfaces/oa/IOATableColumnSetting'
import { IOAPersonEntry, IOAPersonEntryForm, IOAPersonEntryConfirmForm } from '../interfaces/oa/IOAPersonEntry'
import { IOAPersonalEntryFile } from '../interfaces/oa/IOAPersonalEntryFile'
import { IOAPersonFormal, IOAPersonFormalConfirmForm } from '../interfaces/oa/IOAPersonFormal'
import { IOAPersonLeave, IOAPersonLeaveForm, IOAPersonLeaveConfirmForm } from '../interfaces/oa/IOAPersonLeave'
import { IOAPersonSetting, IOAPersonSettingField } from '../interfaces/oa/IOAPersonSetting'
import { IOAPersonHistory } from '../interfaces/oa/IOAPersonHistory'
import { IOAPersonContract } from '../interfaces/oa/IOAPersonContract'
import { IOAPerson } from '../interfaces/oa/IOAPerson'
import { IOAPersonStatistic } from '../interfaces/oa/IOAPersonStatistic'
import { IOAJobType } from '../interfaces/oa/IOAJobType'
import { IOAJobDuty } from '../interfaces/oa/IOAJobDuty'
import { IOAJobLevel } from '../interfaces/oa/IOAJobLevel'
import { IOAJob } from '../interfaces/oa/IOAJob'
import { IOAPersonBirthday } from '../interfaces/oa/IOAPersonBirthday'
import { IOAPersonCompany } from '../interfaces/oa/IOAPersonCompany'
import { IOATeamTree, IOATeamForm } from '../interfaces/oa/IOATeam'
import { IOATeamType } from '../interfaces/oa/IOATeamType'
import { IOATeamMember, IOATeamMemberForm } from '../interfaces/oa/IOATeamMember'

const useClient = useClientStore()
const API = {
	getHost() {
		return useClient.oaApi ?? ''
	},
	// 获取个人日程
	getPersonalSchedules(date?: Date): Promise<IOAPersonalSchedule[]> {
		const str = dayjs(date ?? new Date()).format('YYYY-MM-DD')
		const url = `${useClient.oaApi}/api/OAPersonalSchedules/${str}`
		return axios.get(url)
	},
	// 添加个人日程
	addPersonalSchedule(data?: IOAPersonalSchedule): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonalSchedules`
		return axios.post(url, data)
	},
	// 删除个人日程
	deletePersonalSchedule(id: string): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonalSchedules/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 关闭个人日程
	closePersonalSchedule(id: string): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonalSchedules/${id}/IsClosed`
		return axios.patch(url)
	},
	// 获取待办事项统计
	getStatistics(): Promise<IPersonalPersonStatistics> {
		const url = `${useClient.oaApi}/api/OADashboard/Statistics`
		return axios.get(url)
	},
	// 获取新入职同事列表
	getNewPersons(): Promise<INewPerson[]> {
		const url = `${useClient.oaApi}/api/OADashboard/NewPersons`
		return axios.get(url)
	},
	// 获取个人入职历程
	getPersonalHistories(): Promise<IOATeamMemberHistory[]> {
		const url = `${useClient.oaApi}/api/OAPersonalTeamHistories`
		return axios.get(url)
	},
	// 获取OA档案
	getPersonalFile(): Promise<IOAPersonFile> {
		const url = `${useClient.oaApi}/api/OAPersonalFiles`
		return axios.get(url)
	},
	// 绑定OA档案
	bindPersonalFiles(key: string): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonalFiles`
		return axios.post(url, { key })
	},
	// 更新OA档案
	updatePersonalFile(data?: IOAPersonFile): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonalFiles`
		return axios.patch(url, data)
	},
	// 上传OA档案图片地址
	getUploadHeaderUrl() { 
		return `${useClient.oaApi}/api/OAPersonalFiles/Default/Images`
	},
	// 获取表头字段设置
	getTableColumnSetting(target: number): Promise<IOATableColumnSetting> {
		const url = `${useClient.oaApi}/api/OATableColumnSettings`
		return axios.get(url, { params: { target: target }})
	},
	// 更新表头字段设置
	updateTableColumnSetting (data: IOATableColumnSetting): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OATableColumnSettings`
		return axios.post(url, data)
	},
	// 获取办理入职员工
	getPersonEntrys(name: string, creatorName: string, mobilePhone: string, startDate: string, endDate: string): Promise<IOAPersonEntry[]> {
		const url = `${useClient.oaApi}/api/OAPersonEntrys`
		return axios.get(url, {
			params: {
				name: name,
				creatorName: creatorName,
				mobilePhone: mobilePhone,
				startDate: startDate,
				endDate: endDate
			}
		})
	},
    // 创建办理入职员工
	addPersonEntry(data?: IOAPersonEntryForm): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonEntrys`
		return axios.post(url, data)
	},
	// 更新办理入职员工
	updatePersonEntry(data?: IOAPersonEntryForm): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonEntrys`
		return axios.put(url, data)
	},
	// 删除办理入职员工
	delPersonEntry(id: string): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonEntrys/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 确认员工到岗
	confirmPersonEntry(data: IOAPersonEntryConfirmForm): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonEntrys/${data.Id}/IsConfirm`
		return axios.patch(url, data)
	},
	// 获取入职档案
	getPersonalEntryFile(id: string): Promise<IOAPersonalEntryFile> {
		const url = `${useClient.oaApi}/api/OAPersonalEntryFiles/${id}`
		return axios.get(url)
	},
	// 获取入职档案字段设置
	getPersonalEntryFileSettings(id: string): Promise<IOAPersonSetting[]> {
		const url = `${useClient.oaApi}/api/OAPersonalEntryFiles/${id}/Settings`
		return axios.get(url)
	},
	// 更新办理入职员工
	updatePersonalEntryFile(data?: IOAPersonalEntryFile): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonalEntryFiles`
		return axios.put(url, data)
	},
	// 入职档案填写上传头像地址
	getPersonalEntryFileUploadUrl(id: string) {
		return `${useClient.oaApi}/api/OAPersonalEntryFiles/${id}/Files`
	},
	// 获取待转正员工列表
	getPersonFormals(name?:string, teamId?:string, planStartDate?:string, planEndDate?:string, actualStartDate?:string, actualEndDate?:string): Promise<IOAPersonFormal[]>{
		const url = `${useClient.oaApi}/api/OAPersonFormals`
		return axios.get(url, {
			params: {
				name: name,
				teamId: teamId,
				planStartDate: planStartDate,
				planEndDate: planEndDate,
				actualStartDate: actualStartDate,
				actualEndDate: actualEndDate
			}
		})
	},
	// 确认待转正员工
	confirmPersonalFormal(data: IOAPersonFormalConfirmForm): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonFormals/${data.Id}/IsConfirm`
		return axios.patch(url, data)
	},
	// 获取待离职员工列表
	getPersonLeaves(name?:string, teamId?:string, startDate?:string, endDate?:string): Promise<IOAPersonLeave[]>{
		const url = `${useClient.oaApi}/api/OAPersonLeaves`
		return axios.get(url, {
			params: {
				name: name,
				teamId: teamId,
				startDate: startDate,
				endDate: endDate
			}
		})
	},
	// 办理员工离职
	addPersonLeave(data: IOAPersonLeaveForm): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonLeaves`
		return axios.post(url, data)
	},
	// 删除待办员工离职
	delPersonLeave(id: string): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonLeaves/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 确认待办员工离职
	confirmPersonLeave(data: IOAPersonLeaveConfirmForm): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonLeaves/${data.Id}/IsConfirm`
		return axios.patch(url, data)
	},
    // 获取人员异动历史
	getPagePersonHistory(pageIndex: number, pageSize: number,teamId: string, startDate: string, endDate: string, key: string): Promise<IBasePage<IOAPersonHistory>> {
		const url = `${useClient.oaApi}/api/OATeamMemberHistorys/${pageIndex}/${pageSize}`
		return axios.get(url, {
			params: {
				teamId: teamId,
				startDate: startDate,
				endDate: endDate,
				key: key
			}
		})
	},
	// 获取合同到期员工
	getContractPersons(teamId: string): Promise<IOAPersonContract[]> {
		const url = `${useClient.oaApi}/api/OAPersonContracts`
		return axios.get(url, {
			params: {
				teamId: teamId
			}
		})
	},
	// 获取档案设置
	getFieldSettings(): Promise<IOAPersonSetting[]> {
		const url = `${useClient.oaApi}/api/OAPersonSettings`
		return axios.get(url)
	},
	// 档案字段排序
	sortFieldSetting(ids: string[]): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonSettings/Batch/SortNumber`
		return axios.patch(url, ids)
	},
	// 创建档案设置
	addFieldSetting(data?: IOAPersonSetting): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonSettings`
		return axios.post(url, data)
	},
	// 更新档案设置
	updateFieldSetting(data?: IOAPersonSetting): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonSettings`
		return axios.put(url, data)
	},
	// 删除档案设置
	delFieldSetting(id: string): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonSettings/${id}`
		return axios.delete(url)
	},
	// 创建档案设置字段
	addFieldSettingItem(id: string, data?: IOAPersonSettingField): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonSettings/${id}/Fields`
		return axios.post(url, data)
	},
	// 更新档案设置字段
	updateFieldSettingItem(id: string, data?: IOAPersonSettingField): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonSettings/${id}/Fields`
		return axios.put(url, data)
	},
	// 删除档案设置字段
	delFieldSettingItem(id: string, fieldId: string): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonSettings/${id}/Fields/${fieldId}`
		return axios.delete(url)
	},
	// 启用停用档案设置字段
	enableFieldSettingItem(id: string, fieldId: string): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonSettings/${id}/Fields/${fieldId}/IsEnabled`
		return axios.patch(url)
	},
	// 排序档案设置字段
	sortFieldSettingItem(id: string, fieldIds: string[]): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersonSettings/${id}/Fields/Batch/SortNumber`
		return axios.patch(url, fieldIds)
	},
	// 获取人员统计
	getPersonStatistic(): Promise<IOAPersonStatistic> {
		const url = `${useClient.oaApi}/api/OAPersons/Default/Statistic`
		return axios.get(url)
	},
	// 获取人员档案分页
	getPagePerson(pageIndex: number, pageSize: number, key?: string, onJobStatus?: number): Promise<IBasePage<IOAPerson>> {
		const url = `${useClient.oaApi}/api/OAPersons/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { key: key, onJobStatus: onJobStatus }})
	},
	// 获取人员档案列表
	getPersons(key?: string, onJobStatus?: number): Promise<IOAPerson[]> {
		const url = `${useClient.oaApi}/api/OAPersons`
		return axios.get(url, { params: { key: key, onJobStatus: onJobStatus }})
	},
	// 获取指定人员档案
	getPerson(id: string): Promise<IOAPerson> {
		const url = `${useClient.oaApi}/api/OAPersons/${id}`
		return axios.get(url)
	},
	// 创建人员档案
	addPerson(data?: IOAPerson): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersons`
		return axios.post(url, data)
	},
	// 更新人员档案信息
	updatePerson(data?: IOAPerson): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersons`
		return axios.put(url, data)
	},
	// 删除人员档案
	delPerson(id: string): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAPersons/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 上传人员档案图片地址
	getPersonUploadFileUrl(id: string) { 
		return `${useClient.oaApi}/api/OAPersons/${id}/Files`
	},
	// 导出人员档案
	exportPersonExcel(exportParameter: any): Promise<any> {
		const paras = qs.stringify(exportParameter)
		const url = `${useClient.oaApi}/api/OAPersons/Default/Excel?${paras}`
		return axios.get(url,  {
			responseType: 'blob'
		})
	},
	// 导入人员档案
	getImportPersonExcelUrl() {
		return `${useClient.oaApi}/api/OAPersons/Default/Excel`
	},
	// 获取职位类型列表
	getJobTypes(key?: string): Promise<IOAJobType[]> {
		const url = `${useClient.oaApi}/api/OAJobTypes`
		return axios.get(url, { params: { key: key }})
	},
	// 添加职位类型
	addJobType(data: IOAJobType): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAJobTypes`
		return axios.post(url, data)
	},
	// 修改职位类型
	updateJobType(data: IOAJobType): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAJobTypes`
		return axios.put(url, data)
	},
	// 删除职位类型
	delJobType(id: string): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAJobTypes/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 获取职务列表
	getJobDutys(key?: string): Promise<IOAJobDuty[]> {
		const url = `${useClient.oaApi}/api/OAJobDutys`
		return axios.get(url, { params: { key: key }})
	},
	// 添加职务
	addJobDuty(data: IOAJobDuty): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAJobDutys`
		return axios.post(url, data)
	},
	// 修改职务
	updateJobDuty(data: IOAJobDuty): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAJobDutys`
		return axios.put(url, data)
	},
	// 删除职务
	delJobDuty(id: string): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAJobDutys/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 获取职级列表
	getJobLevels(key?: string): Promise<IOAJobLevel[]> {
		const url = `${useClient.oaApi}/api/OAJobLevels`
		return axios.get(url, { params: { key: key }})
	},
	// 添加职级
	addJobLevel(data: IOAJobLevel): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAJobLevels`
		return axios.post(url, data)
	},
	// 修改职级
	updateJobLevel(data: IOAJobLevel): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAJobLevels`
		return axios.put(url, data)
	},
	// 删除职级
	delJobLevel(id: string): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAJobLevels/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 获取职位列表
	getJobs(isEnabled?: boolean, key?: string): Promise<IOAJob[]> {
		const url = `${useClient.oaApi}/api/OAJobs`
		return axios.get(url, { params: { isEnabled: isEnabled, key: key }})
	},
	// 添加职位
	addJob(data: IOAJob): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAJobs`
		return axios.post(url, data)
	},
	// 修改职位
	updateJob(data: IOAJob): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAJobs`
		return axios.put(url, data)
	},
	// 启用/停用职位
	enableJob(id: string): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAJobs/${id}/IsEnabled`
		return axios.patch(url)
	},
	// 删除职位
	delJob(id: string): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OAJobs/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 获取生日员工
	getBirthPersons(teamId: string, startDate: string, endDate: string): Promise<IOAPersonBirthday[]> {
		const url = `${useClient.oaApi}/api/OAPersonCares/Birthday`
		return axios.get(url, {
			params: {
				teamId: teamId,
				startDate: startDate,
				endDate: endDate
			}
		})
	},
	// 获取入职周年员工
	getCompanyPersons(teamId: string, date: string): Promise<IOAPersonCompany[]> {
		const url = `${useClient.oaApi}/api/OAPersonCares/Company`
		return axios.get(url, {
			params: {
				teamId: teamId,
				date: date
			}
		})
	},
	// 获取部门树
	getTeamTrees(parentId?: string, type?: string, deep?: boolean, scope?: number): Promise<IOATeamTree[]> {
		const url = `${useClient.oaApi}/api/OATeams`
		return axios.get(url, { params: { parentId: parentId, type: type, deep: deep, scope: scope ?? -1 }})
	},
	// 创建部门
	addTeam(data: IOATeamForm): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OATeams`
		return axios.post(url, data)
	},
	// 更新部门
	updateTeam(data: IOATeamForm): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OATeams`
		return axios.put(url, data)
	},
	// 删除部门
	delTeam(id: string, isTrue:boolean): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OATeams/${id}?isTrue=${isTrue}`
		return axios.delete(url)
	},
	// 排序部门
	sortTeam(ids: string[]): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OATeams/Batch/SortNumber`
		return axios.patch(url, ids)
	},
	// 获取部门列表
	getTeamTypes(name?: string): Promise<IOATeamType[]> {
		const url = `${useClient.oaApi}/api/OATeamTypes`
		return axios.get(url, { params: { name: name }})
	},
	// 添加部门类型
	addTeamType(data: IOATeamType): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OATeamTypes`
		return axios.post(url, data)
	},
	// 删除部门类型
	delTeamType(id: string): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OATeamTypes/${id}`
		return axios.delete(url)
	},
	// 获取部门成员列表
	getTeamMembers(id: string): Promise<IOATeamMember[]> {
		const url = `${useClient.oaApi}/api/OATeamMembers?teamId=${id}&deep=false`
		return axios.get(url)
	},
	// 获取部门成员列表
	getNoTeamPersons(): Promise<IOATeamMember[]> {
		const url = `${useClient.oaApi}/api/OANoTeamPersons`
		return axios.get(url)
	},
	// 批量添加成员加入部门
	addTeamMember(id: string, personIds: string[]): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OATeams/${id}/Members`
		return axios.post(url, personIds)
	},
	// 添加成员加入部门
	addTeamMember2(data: IOATeamMemberForm): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OATeamMembers`
		return axios.post(url, data)
	},
	// 导入部门成员
	getImportTeamMemberExcelUrl(teamId: string) {
		return `${useClient.oaApi}/api/OATeamMembers/Default/Excel?teamId=${teamId}`
	},
	// 导入部门成员模板
	getImportTeamMemberExcelTempUrl() {
		return `${useClient.oaApi}/resources/templates/导入模板-部门成员.xlsx`
	},
	// 调动成员加入部门
	transferTeamMember(id: string, targetId: string, personIds: string[]): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OATeamMembers/Batch/TeamId`
		return axios.patch(url, {
			Ids: personIds,
			TeamId: id,
			TargetTeamId: targetId
		})
	},
	// 人员离职
	leaveTeamMember(id: string, personIds: string[]): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OATeamMembers/Batch/IsDeleted`
		return axios.patch(url, {
			Ids: personIds,
			TeamId: id,
			IsLeave: true
		})
	},
	// 移除部门成员
	delTeamMember(id: string, personIds: string[]): Promise<IBaseMessage> {
		const url = `${useClient.oaApi}/api/OATeamMembers/Batch/IsDeleted`
		return axios.patch(url, {
			Ids: personIds,
			TeamId: id,
			IsLeave: false
		})
	}
}

export default API
