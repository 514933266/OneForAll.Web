import axios from '../untils/axios'
import { useClientStore } from '../stores/clientStore'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { IOAPersonSetting, IOAPersonSettingField } from '../interfaces/oa/IOAPersonSetting'

const useClient = useClientStore()
const API = {
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
	}
}

export default API