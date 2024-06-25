import axios from '../untils/axios'
import { useClientStore } from '../stores/clientStore'
import ENTRY_API from './oa-entry-api'
import FILE_API from './oa-file-api'
import PERSON_API from './oa-person-api'
import TEAM_API from './oa-team-api'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { IPersonalPersonStatistics } from '../interfaces/IPersonalPersonStatistics'
import { INewPerson } from '../interfaces/INewPerson'
import { IOATeamMemberHistory } from '../interfaces/oa/IOATeamMemberHistory'
import { IOAPersonFile } from '../interfaces/oa/IOAPersonFile'
import { IOAPersonalSchedule } from '../interfaces/oa/IOAPersonalSchedule'
import { dayjs } from 'element-plus'
import { IOATableColumnSetting } from '../interfaces/oa/IOATableColumnSetting'

const useClient = useClientStore()
const API = {
	...ENTRY_API,
	...FILE_API,
	...PERSON_API,
	...TEAM_API,
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
	}
}

export default API
