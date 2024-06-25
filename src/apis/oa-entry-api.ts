import axios from '../untils/axios'
import { useClientStore } from '../stores/clientStore'
import { IBasePage } from '../interfaces/IBasePage'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { IOAPersonEntry, IOAPersonEntryForm, IOAPersonEntryConfirmForm } from '../interfaces/oa/IOAPersonEntry'
import { IOAPersonalEntryFile } from '../interfaces/oa/IOAPersonalEntryFile'
import { IOAPersonFormal, IOAPersonFormalConfirmForm } from '../interfaces/oa/IOAPersonFormal'
import { IOAPersonLeave, IOAPersonLeaveForm, IOAPersonLeaveConfirmForm } from '../interfaces/oa/IOAPersonLeave'
import { IOAPersonSetting } from '../interfaces/oa/IOAPersonSetting'
import { IOAPersonHistory } from '../interfaces/oa/IOAPersonHistory'
import { IOAPersonContract } from '../interfaces/oa/IOAPersonContract'

const useClient = useClientStore()
const API = {
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
	}
}

export default API