import axios from '../untils/axios'
import { IBasePage } from '../interfaces/IBasePage'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { useClientStore } from '../stores/clientStore'
import { IJobTask } from '../interfaces/job/IJobTask'
import { IJobTaskLog } from '../interfaces/job/IJobTaskLog'

const useClient = useClientStore()

// 消息服务
const API = {
	// 获取定时任务列表
	getTasks(pageIndex: number, pageSize: number, groupName?: string, nodeName?: string, key?: string): Promise<IBasePage<IJobTask>> {
		const url = `${useClient.jobApi}/api/JobTasks/${pageIndex}/${pageSize}`
		return axios.get(url, {
			params: {
				groupName: groupName,
				nodeName: nodeName,
				key: key
			}
		})
	},
	// 执行一次定时任务
	excuteTask(id: string): Promise<IBaseMessage> {
		const url = `${useClient.jobApi}/api/JobTasks/${id}/Excute`
		return axios.post(url)
	},
	// 改变定时任务状态
	changeTaskStatus(id: string, status: number): Promise<IBaseMessage> {
		const url = `${useClient.jobApi}/api/JobTasks/${id}/Status`
		return axios.patch(url, { params: { status: status }})
	},
	// 启动/禁用定时任务
	enableTask(id: string): Promise<IBaseMessage> {
		const url = `${useClient.jobApi}/api/JobTasks/${id}/IsEnabled`
		return axios.patch(url, [id])
	},
	// 删除定时任务
	delTask(id: string): Promise<IBaseMessage> {
		const url = `${useClient.jobApi}/api/JobTasks/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 获取定时任务日志列表
	getTaskLogs(pageIndex: number, pageSize: number, appId?: string, taskName?: string, type?: number, key?: string, startTime?: string, endTime?: string): Promise<IBasePage<IJobTaskLog>> {
		const url = `${useClient.jobApi}/api/JobTaskLogs/${pageIndex}/${pageSize}`
		return axios.get(url, {
			params: {
				startTime: startTime,
				endTime: endTime,
				appId: appId,
				taskName: taskName,
				type: type,
				key: key
			}
		})
	}
}

export default API
