import axios from '../untils/axios'
import { useClientStore } from '../stores/clientStore'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { IBasePage } from '../interfaces/IBasePage'
import { IOmsWxpaySetting } from '../interfaces/oms/IOmsWxpaySetting'
import { IOmsOrder } from '../interfaces/oms/IOmsOrder'
import { IOmsOrderTodayAmount } from '../interfaces/oms/IOmsOrderTodayAmount'

const useClient = useClientStore()

// 商户中心
const API = {
	getHost() {
		return useClient.omsApi ?? ''
	},
    // 获取微信商户支付设置分页
	getPageWxpaySetting(pageIndex: number, pageSize: number, key?: string): Promise<IBasePage<IOmsWxpaySetting>> {
		const url = `${useClient.omsApi}/api/OmsWxPaySettings/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { key: key } })
	},
	// 添加微信商户支付设置
	addWxpaySetting(data?: IOmsWxpaySetting): Promise<IBaseMessage> {
		const url = `${useClient.omsApi}/api/OmsWxPaySettings`
		return axios.post(url, data)
	},
	// 更新微信商户支付设置
	updateWxpaySetting(data?: IOmsWxpaySetting): Promise<IBaseMessage> {
		const url = `${useClient.omsApi}/api/OmsWxPaySettings`
		return axios.put(url, data)
	},
	// 删除微信商户支付设置
	delWxpaySetting(id: string): Promise<IBaseMessage> {
		const url = `${useClient.omsApi}/api/OmsWxPaySettings/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 上传证书
	uploadWxpaySetting(id: string, data: any): Promise<IBaseMessage> {
		const url = `${useClient.omsApi}/api/OmsWxPaySettings/${id}/Certificates`
		return axios.post(url, data, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		})
	},
	// 获取订单分页
	getPageOrder(pageIndex: number, pageSize: number, searchOption?: any): Promise<IBasePage<IOmsOrder>> {
		const url = `${useClient.omsApi}/api/OmsOrders/${pageIndex}/${pageSize}`
		return axios.get(url, { params: searchOption })
	},
	// 获取金额
	getTodayAmount (day: string): Promise<IOmsOrderTodayAmount> {
		const url =`${useClient.omsApi}/api/OmsOrders/${day}/TodayAmount`
		return axios.get(url)
	}
}

export default API