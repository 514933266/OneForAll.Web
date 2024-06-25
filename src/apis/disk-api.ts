import axios from '../untils/axios'
// import { useClientStore } from '../stores/clientStore'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { IDiskFolderTree, IDiskFolderForm } from '../interfaces/disk/IDiskFolder'
import { IDiskFile } from '../interfaces/disk/IDiskFile'

const api = 'https://disk.api.fengwoyun.net'
// const api = 'http://localhost:51512'

// 企业网盘
const API = {
	getHost() {
		return api
	},
	// 获取目录树
	getFolderTrees(parentId?: string, deep?: boolean, scope?: number): Promise<IDiskFolderTree[]> {
		const url = `${api}/api/DiskFolders`
		return axios.get(url, { params: { parentId: parentId, deep: deep, scope: scope ?? -1 } })
	},
	// 创建目录
	addFolder(data: IDiskFolderForm): Promise<IBaseMessage> {
		const url = `${api}/api/DiskFolders`
		return axios.post(url, data)
	},
	// 更新目录
	updateFolder(data: IDiskFolderForm): Promise<IBaseMessage> {
		const url = `${api}/api/DiskFolders`
		return axios.put(url, data)
	},
	// 删除目录
	delFolder(id: string, isTrue: boolean): Promise<IBaseMessage> {
		const url = `${api}/api/DiskFolders/${id}?isTrue=${isTrue}`
		return axios.delete(url)
	},
	// 上传地址
	getFolderUploadFileUrl(id: string) {
		return `${api}/api/DiskFolders/${id}/Files`
	},
	// 获取指定目录文件
	getFolderFiles(folderId: string): Promise<IDiskFile[]> {
		const url = `${api}/api/DiskFolders/${folderId}/Files`
		return axios.get(url)
	},
	// 修改指定目录文件
	updateFolderFile(folderId: string, item: IDiskFile): Promise<IBaseMessage> {
		const url = `${api}/api/DiskFolders/${folderId}/Files`
		return axios.put(url, item)
	},
	// 删除指定目录文件
	delFolderFile(folderId: string, id: string): Promise<IBaseMessage> {
		const url = `${api}/api/DiskFolders/${folderId}/Files/${id}`
		return axios.delete(url)
	},
	// 下载目录文件
	downloadFolderFile(item: IDiskFile) {
		const url = api + item.Url
		axios.get<BlobPart>(url, { responseType: 'blob' }).then(res => {
			const blob = new Blob([res.data])
			const downloadElement = document.createElement('a')
			const href = window.URL.createObjectURL(blob) // 创建下载的链接
			downloadElement.href = href
			downloadElement.download = item.Title + item.ExtensionName // 下载后文件名
			document.body.appendChild(downloadElement)
			downloadElement.click() // 点击下载
			document.body.removeChild(downloadElement) // 下载完成移除元素
			window.URL.revokeObjectURL(href) // 释放掉blob对象
		})
	}
}

export default API
