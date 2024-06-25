import axios from '../untils/axios'
import { IBasePage } from '../interfaces/IBasePage'
import { useClientStore } from '../stores/clientStore'
import { IPersonalLiveness } from '../interfaces/IPersonalLiveness'
import { IPersonalLoginLog } from '../interfaces/IPersonalLoginLog'
import { ISysApiLog } from '../interfaces/syslog/ISysApiLog'
import { ISysExceptionLog } from '../interfaces/syslog/ISysExceptionLog'
import { ISysGlobalExceptionLog } from '../interfaces/syslog/ISysGlobalExceptionLog'
import { ISysLoginLog } from '../interfaces/syslog/ISysLoginLog'
import { ISysOperationLog } from '../interfaces/syslog/ISysOperationLog'

const useClient = useClientStore()

// 系统日志
const API = {
	// 获取个人工作活跃度
	getPersonalLiveness(startTime: Date, endTime: Date): Promise<IPersonalLiveness> {
		const url = `${useClient.syslogApi}/api/Liveness`
		return axios.get(url, {
			params: {
				startTime: startTime,
				endTime: endTime
			}
		})
	},
	// 获取登录日志
	getPersonalLoginLogs(top?: number): Promise<IPersonalLoginLog[]> {
		const url = `${useClient.syslogApi}/api/Activitys/Login/Logs/${top ?? 10}`
		return axios.get(url)
	},
	// 获取Api日志列表
	getApiLogs(pageIndex: number, pageSize: number, startTime?: string, endTime?: string, userName?: string, controller?: string, action?: string, key?: string): Promise<IBasePage<ISysApiLog>> {
		const url = `${useClient.syslogApi}/api/SysApiLogs/${pageIndex}/${pageSize}`
		return axios.get(url, {
			params: {
				startTime: startTime,
				endTime: endTime,
				userName: userName,
				controller: controller,
				action: action,
				key: key
			}
		})
	},
	// 获取异常日志列表
	getExceptionLogs(pageIndex: number, pageSize: number, startTime?: string, endTime?: string, userName?: string, controller?: string, action?: string, key?: string): Promise<IBasePage<ISysExceptionLog>> {
		const url = `${useClient.syslogApi}/api/SysExceptionLogs/${pageIndex}/${pageSize}`
		return axios.get(url, {
			params: {
				startTime: startTime,
				endTime: endTime,
				userName: userName,
				controller: controller,
				action: action,
				key: key
			}
		})
	},
	// 获取全局异常日志列表
	getGlobalExceptionLogs(pageIndex: number, pageSize: number, startTime?: string, endTime?: string, key?: string): Promise<IBasePage<ISysGlobalExceptionLog>> {
		const url = `${useClient.syslogApi}/api/SysGlobalExceptionLogs/${pageIndex}/${pageSize}`
		return axios.get(url, {
			params: {
				startTime: startTime,
				endTime: endTime,
				key: key
			}
		})
	},
	// 获取登录日志列表
	getLoginLogs(pageIndex: number, pageSize: number, startTime?: string, endTime?: string, userName?: string, key?: string): Promise<IBasePage<ISysLoginLog>> {
		const url = `${useClient.syslogApi}/api/SysLoginLogs/${pageIndex}/${pageSize}`
		return axios.get(url, {
			params: {
				startTime: startTime,
				endTime: endTime,
				userName: userName,
				key: key
			}
		})
	},
	// 获取操作日志列表
	getOperationLogs(pageIndex: number, pageSize: number, startTime?: string, endTime?: string, userName?: string, key?: string): Promise<IBasePage<ISysOperationLog>> {
		const url = `${useClient.syslogApi}/api/SysOperationLogs/${pageIndex}/${pageSize}`
		return axios.get(url, {
			params: {
				startTime: startTime,
				endTime: endTime,
				userName: userName,
				key: key
			}
		})
	}
}

export default API
