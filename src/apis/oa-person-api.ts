import axios from '../untils/axios'
import qs from 'qs'
import { useClientStore } from '../stores/clientStore'
import { IBasePage } from '../interfaces/IBasePage'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { IOAPerson } from '../interfaces/oa/IOAPerson'
import { IOAPersonStatistic } from '../interfaces/oa/IOAPersonStatistic'
import { IOAJobType } from '../interfaces/oa/IOAJobType'
import { IOAJobDuty } from '../interfaces/oa/IOAJobDuty'
import { IOAJobLevel } from '../interfaces/oa/IOAJobLevel'
import { IOAJob } from '../interfaces/oa/IOAJob'
import { IOAPersonBirthday } from '../interfaces/oa/IOAPersonBirthday'
import { IOAPersonCompany } from '../interfaces/oa/IOAPersonCompany'

const useClient = useClientStore()
const API = {
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
	}
}

export default API