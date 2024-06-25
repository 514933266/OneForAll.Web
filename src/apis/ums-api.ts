import axios from '../untils/axios'
import { IBasePage } from '../interfaces/IBasePage'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { useClientStore } from '../stores/clientStore'
import { IUmsMessageRecord } from '../interfaces/ums/IUmsMessageRecord'
import { IUmsSmsRecord } from '../interfaces/ums/IUmsSmsRecord'

const useClient = useClientStore()

// 消息服务
const API = {
	// 获取消息队列日志列表
	getUmsMessageLogs(pageIndex: number, pageSize: number, startTime?: string, endTime?: string, exChangeName?: string, queueName?: string, routeKey?: string): Promise<IBasePage<IUmsMessageRecord>> {
		const url = `${useClient.umsApi}/api/UmsMessageLogs/${pageIndex}/${pageSize}`
		return axios.get(url, {
			params: {
				startTime: startTime,
				endTime: endTime,
				exChangeName: exChangeName,
				queueName: queueName,
				routeKey: routeKey
			}
		})
	},
	// 重新发送消息队列日志
	retryUmsMessage(data: IUmsMessageRecord): Promise<IBaseMessage>{
		return axios.post(data.RequestUrl, data.OriginalMessage)
	},
	// 获取短信发送日志列表
	getSmsRecords(pageIndex: number, pageSize: number, startTime?: string, endTime?: string, platformName?: string): Promise<IBasePage<IUmsSmsRecord>> {
		const url = `${useClient.umsApi}/api/UmsSmsRecords/${pageIndex}/${pageSize}`
		return axios.get(url, {
			params: {
				startTime: startTime,
				endTime: endTime,
				platformName: platformName
			}
		})
	}
}

export default API
