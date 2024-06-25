import axios from '../untils/axios'
import { useClientStore } from '../stores/clientStore'
import { IBasePage } from '../interfaces/IBasePage'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { IBaseQACorpus } from '../interfaces/chatgpt/IBaseQACorpus'
import { IAskForm } from '../interfaces/chatgpt/IAskForm'

const useClient = useClientStore()

// chatgpt
// const host = "http://localhost:51512"
const host = "https://chatgpt.api.fengwoyun.net"
const API = {
	// 获取知识库分页列表
	getPageBaseQACorpus(pageIndex: number, pageSize: number, key?: string, tenantId?: string): Promise<IBasePage<IBaseQACorpus>> {
		const url = `${useClient.chatApi}/api/BaseQACorpus/${pageIndex}/${pageSize}`
		return axios.get(url, { params: { key: key, tenantId: tenantId }})
	},
	// 创建知识库
	addBaseQACorpus(data?: IBaseQACorpus): Promise<IBaseMessage> {
		const url = `${useClient.chatApi}/api/BaseQACorpus`
		return axios.post(url, data)
	},
	// 更新知识库
	updateBaseQACorpus(data?: IBaseQACorpus): Promise<IBaseMessage> {
		const url = `${useClient.chatApi}/api/BaseQACorpus`
		return axios.put(url, data)
	},
	// 删除知识库
	delBaseQACorpus(id: string): Promise<IBaseMessage> {
		const url = `${useClient.chatApi}/api/BaseQACorpus/Batch/IsDeleted`
		return axios.patch(url, [id])
	},
	// 导入知识库
	uploadBaseQACorpus(data: any): Promise<IBaseMessage> {
		const url = `${useClient.chatApi}/api/BaseQACorpus/Excel`
		return axios.post(url, data, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		})
	},
	// 获取常见问题列表
	getListTopQACorpus(): Promise<IBaseQACorpus[]> {
		const url = `${host}/api/AiChats/ConstQA/${6}`
		return axios.get(url)
	},
	// 获取回答
	getAnswer(data: IAskForm): Promise<IBaseMessage> {
		const url = `${host}/api/AiChats`
		return axios.post(url, data)
	},
	// 点赞
	like(id: string): Promise<IBaseMessage> {
		const url = `${host}/api/AiChats/${id}/Like`
		return axios.patch(url)
	},
	// 点踩
	dislike(id: string): Promise<IBaseMessage> {
		const url = `${host}/api/AiChats/${id}/DisLike`
		return axios.patch(url)
	},
	// 修改答案
	changeAnswer(id: string, answer: string): Promise<IBaseMessage> {
		const url = `${host}/api/AiChats/${id}/Answer`
		return axios.patch(url, answer)
	}
}

export default API
