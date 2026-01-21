import axios from '../untils/axios'
import { IBasePage } from '../interfaces/IBasePage'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { useClientStore } from '../stores/clientStore'
import { IUmsMessageRecord } from '../interfaces/ums/IUmsMessageRecord'
import { IUmsSmsRecord } from '../interfaces/ums/IUmsSmsRecord'
import { ISysMessage } from '../interfaces/ums/ISysMessage'

const useClient = useClientStore()

// 消息服务
const API = {
	// 获取站内信
	getTopMessages(top?: number): Promise<ISysMessage[]> {
		const url = `${useClient.umsApi}/api/SysPersonalMessages/${top ?? 10}`
		return axios.get(url)
	},
	// 获取站内信
	getMessages(day?: number): Promise<ISysMessage[]> {
		const url = `${useClient.umsApi}/api/SysPersonalMessages/${day ?? 3}/UnReads`
		return axios.get(url)
	},
	// 获取站内信分页
	getPageMessage(pageIndex: number, pageSize: number, status: number, key?: string): Promise<IBasePage<ISysMessage>> {
		const url = `${useClient.umsApi}/api/SysPersonalMessages/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { key: key, status: status } })
	},
	// 获取未读消息数量
	getMessageCount(): Promise<number> {
		const url = `${useClient.umsApi}/api/SysPersonalMessages/UnReadCount`
		return axios.get(url)
	},
	// 设置消息已读
	readMessage(ids: string[], isQuiet?: boolean): Promise<IBaseMessage> {
		const url = `${useClient.umsApi}/api/SysPersonalMessages/Batch/IsRead?isQuiet=${isQuiet}`
		return axios.patch(url, ids)
	},
	// 清空消息
	deleteMessage(ids: string[]): Promise<IBaseMessage> {
		const url = `${useClient.umsApi}/api/SysPersonalMessages/Batch/IsDeleted`
		return axios.patch(url, ids)
	},
	// 获取消息队列日志列表
	getUmsMessageLogs(
		pageIndex: number,
		pageSize: number,
		startTime?: string,
		endTime?: string,
		exChangeName?: string,
		queueName?: string,
		routeKey?: string
	): Promise<IBasePage<IUmsMessageRecord>> {
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
	retryUmsMessage(data: IUmsMessageRecord): Promise<IBaseMessage> {
		return axios.post(data.RequestUrl, data.OriginalMessage)
	},
	// 获取短信发送日志列表
	getSmsRecords(
		pageIndex: number,
		pageSize: number,
		startTime?: string,
		endTime?: string,
		platformName?: string
	): Promise<IBasePage<IUmsSmsRecord>> {
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
