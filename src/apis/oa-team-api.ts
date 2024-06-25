import axios from '../untils/axios'
import { useClientStore } from '../stores/clientStore'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { IOATeamTree, IOATeamForm } from '../interfaces/oa/IOATeam'
import { IOATeamType } from '../interfaces/oa/IOATeamType'
import { IOATeamMember, IOATeamMemberForm } from '../interfaces/oa/IOATeamMember'

const useClient = useClientStore()
const API = {
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