import axios from '../untils/axios'
import { IBasePage } from '../interfaces/IBasePage'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { useClientStore } from '../stores/clientStore'
import { IUmsMessageRecord } from '../interfaces/ums/IUmsMessageRecord'
import { IUmsSmsRecord } from '../interfaces/ums/IUmsSmsRecord'
import { IUmsNotificationConfig } from '../interfaces/ums/IUmsNotificationConfig'
import { ISysMessage } from '../interfaces/ums/ISysMessage'

const useClient = useClientStore()

// 消息服务
const API = {
	// 获取站内信
	getTopMessages(top?: number): Promise<ISysMessage[]> {
		const url = `${useClient.umsApi}/api/UmsPersonalMessages/${top ?? 10}`
		return axios.get(url)
	},
	// 获取站内信
	getMessages(day?: number): Promise<ISysMessage[]> {
		const url = `${useClient.umsApi}/api/UmsPersonalMessages/${day ?? 3}/UnReads`
		return axios.get(url)
	},
	// 获取站内信分页
	getPageMessage(pageIndex: number, pageSize: number, status: number, key?: string): Promise<IBasePage<ISysMessage>> {
		const url = `${useClient.umsApi}/api/UmsPersonalMessages/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { key: key, status: status } })
	},
	// 获取未读消息数量
	getMessageCount(): Promise<number> {
		const url = `${useClient.umsApi}/api/UmsPersonalMessages/UnReadCount`
		return axios.get(url)
	},
	// 设置消息已读
	readMessage(ids: string[], isQuiet?: boolean): Promise<IBaseMessage> {
		const url = `${useClient.umsApi}/api/UmsPersonalMessages/Batch/IsRead?isQuiet=${isQuiet}`
		return axios.patch(url, ids)
	},
	// 清空消息
	deleteMessage(ids: string[]): Promise<IBaseMessage> {
		const url = `${useClient.umsApi}/api/UmsPersonalMessages/Batch/IsDeleted`
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
	},
	// 获取消息通知配置分页列表
	getNotificationConfigs(
		pageIndex: number,
		pageSize: number,
		clientId?: string
	): Promise<IBasePage<IUmsNotificationConfig>> {
		const url = `${useClient.umsApi}/api/UmsNotificationConfigs/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { clientId: clientId } })
	},
	// 添加消息通知配置
	addNotificationConfig(data: any): Promise<IBaseMessage> {
		const url = `${useClient.umsApi}/api/UmsNotificationConfigs`
		return axios.post(url, data)
	},
	// 修改消息通知配置
	updateNotificationConfig(id: string, data: any): Promise<IBaseMessage> {
		const url = `${useClient.umsApi}/api/UmsNotificationConfigs/${id}`
		return axios.put(url, data)
	},
	// 删除消息通知配置
	deleteNotificationConfig(id: string): Promise<IBaseMessage> {
		const url = `${useClient.umsApi}/api/UmsNotificationConfigs/${id}`
		return axios.delete(url)
	}
}

export default API
