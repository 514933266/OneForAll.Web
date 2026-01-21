<template>
	<el-container class="disk-personal-page">
		<!-- 组织架构 -->
		<el-aside class="tree">
			<div class="header">
				<el-input enterable v-model="searchOption.key" placeholder="检索目录">
					<template #prefix>
						<font-awesome-icon fas icon="search"></font-awesome-icon>
					</template>
				</el-input>
				<el-button-group>
					<el-button type="primary" @click="showDrawer()">
						<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新建
					</el-button>
					<el-button :disabled="!currentNode.Name" @click="delTrue" type="danger">
						<font-awesome-icon fas icon="trash-alt"></font-awesome-icon>&nbsp;删除
					</el-button>
				</el-button-group>
			</div>
			<el-tree
				highlight-current
				accordion
				:expand-on-click-node="false"
				:data="list"
				:filter-node-method="filterFolderNode"
				:props="{ children: 'Children', label: 'Name' }"
				@node-click="clickTreeNode"
				ref="folderTree"
				class="ofa-tree"
				node-key="Id"
				empty-text="暂无目录"
			>
				<template #default="{ data }">
					<span class="tree-node">
						<span>
							<font-awesome-icon fas icon="folder" style="margin-right: 5px"></font-awesome-icon>
							<label>{{ data.Name }}&nbsp;</label>
						</span>
						<span v-show="data.Id === currentNode.Id">
							<el-button link @click="showDrawer(data)" type="primary">
								<font-awesome-icon fas icon="edit"></font-awesome-icon>
							</el-button>
						</span>
					</span>
				</template>
			</el-tree>
		</el-aside>
		<!-- 右侧面板 -->
		<el-main class="right-content">
			<div class="file-box">
				<div class="title">
					<font-awesome-icon fas icon="list"></font-awesome-icon>&nbsp; 文件列表&nbsp;
					<el-tag v-show="currentNode?.Name" class="tag" effect="dark">{{ currentNode?.Name }}</el-tag>
				</div>
				<div class="btn-title">
					<el-upload
						:action="getUploadFileUrl()"
						:headers="uploadHeaders"
						:before-upload="beforeFileUpload"
						:on-success="onUploadSuccess"
						:show-file-list="false"
					>
						<el-button :disabled="!currentNode?.Name">
							<font-awesome-icon fas icon="cloud-arrow-up"></font-awesome-icon>&nbsp;上传文件</el-button
						>
					</el-upload>
					<el-button :disabled="fileSelections.length < 1" @click="bulkDownloadFile" class="ofa-ml10">
						<font-awesome-icon fas icon="download"></font-awesome-icon>
						&nbsp;下载选中文件
					</el-button>
				</div>
				<el-table
					:data="files"
					@row-dblclick="updateFileName"
					@selection-change="fileSelectionChange"
					row-key="Id"
					empty-text="还没有上传任何文件，目录是空的"
				>
					<el-table-column type="selection" width="50" align="center"></el-table-column>
					<el-table-column label="预览" prop="Title" width="200">
						<template #default="scope">
							<el-image preview-teleported :src="domain + scope.row.Url" :preview-src-list="[domain + scope.row.Url]"></el-image>
						</template>
					</el-table-column>
					<el-table-column label="标题" prop="Title"></el-table-column>
					<el-table-column label="上传日期" prop="CreateTime" width="160">
						<template #default="scope">
							{{ dayjs(scope.row.CreateTime).format('YYYY-MM-DD HH:mm') }}
						</template>
					</el-table-column>
					<el-table-column label="上传人员" prop="CreatorName" width="100"></el-table-column>
					<el-table-column label="操作" width="100" header-align="center" align="center">
						<template #default="scope">
							<el-button link @click="delFile(scope.row)" type="danger">
								<font-awesome-icon fas icon="times"></font-awesome-icon>&nbsp;
							</el-button>
							<el-button link @click="previewFile(scope.row)" type="primary">
								<font-awesome-icon fas icon="eye"></font-awesome-icon>&nbsp;
							</el-button>
						</template>
					</el-table-column>
				</el-table>
			</div>
		</el-main>
	</el-container>
	<!-- 目录抽屉 -->
	<el-drawer v-model="drawerVisiable" :modal="false" :show-close="false" direction="rtl" size="400" class="ofa-drawer">
		<template #header>
			<span class="title">{{ isAdd ? '创建' : '编辑' }}目录</span>
		</template>
		<el-form :model="entity" :rules="validationRule" label-width="120px" ref="teamFormRef">
			<el-form-item label="目录名称" prop="Name">
				<el-input v-model.trim="entity.Name" placeholder="请输入目录名称"></el-input>
			</el-form-item>
			<el-form-item label="上级" prop="ParentId">
				<el-cascader
					v-model="treePath"
					:props="{
						children: 'Children',
						value: 'Id',
						label: 'Name',
						checkStrictly: true
					}"
					:show-all-levels="false"
					:options="trees"
					placeholder="请选择上级目录"
				></el-cascader>
			</el-form-item>
		</el-form>
		<div class="footer">
			<el-button v-show="!currentNode?.IsDeleted" type="primary" @click="submit">
				<font-awesome-icon fas icon="save"></font-awesome-icon>&nbsp;{{ isAdd ? '创建' : '保存' }}
			</el-button>
			<el-button type="warning" @click="drawerVisiable = false"> 取消 </el-button>
		</div>
	</el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, watch, computed } from 'vue'
import { dayjs, ElMessageBox, FormRules, FormInstance, ElMessage } from 'element-plus'
import JSZip from 'jszip'
import FileSaver from 'file-saver'
import API from '@/apis/disk-api'
import { GUID } from '@/consts/const'
import { useTokenStore } from '@/stores/tokenStore'
import { IDiskFolderTree, IDiskFolderForm } from '@/interfaces/disk/IDiskFolder'
import { IDiskFile } from '@/interfaces/disk/IDiskFile'

const tokenStore = useTokenStore()
const domain = ref(API.getHost()) // 域名
const IsValidlist = ref(true) // 显示未删除目录
const isSortableChildFolder = ref(false) // 子目录排序
const drawerVisiable = ref(false) // 显示目录抽屉
const isAdd = ref(false) // 添加模式
const list = ref<IDiskFolderTree[]>([]) // 目录列表
const files = ref<IDiskFile[]>([]) // 目录文件列表
const fileSelections = ref<IDiskFile[]>([]) // 选中的目录文件列表
const trees = ref<IDiskFolderTree[]>([]) // 目录树列表
const childFolders = ref<IDiskFolderTree[]>([]) // 目录列表
const currentNode = ref<IDiskFolderTree>(Object.assign({ Id: GUID })) // 目录列表
const entity = ref<IDiskFolderForm>(Object.assign({ Id: GUID })) // 当前操作目录
const folderTree = ref() // 目录树
const treePath = ref<string[]>([]) // 选中的父级目录路径
// 搜索条件
const searchOption = ref({
	key: ''
})
// 表单
const teamFormRef = ref<FormInstance>()
// 表单验证
const validationRule = reactive<FormRules<any>>({
	ParentId: [{ required: true, message: '请先选择上级' }],
	Name: [
		{ required: true, message: '请先填写目录名称' },
		{ min: 2, max: 20, message: '目录名称长度在2~20之间' }
	]
})
// 上传token
const uploadHeaders = computed(() => {
	return { Authorization: `${tokenStore.bearToken}` }
})
// 监控目录名称检索
watch(
	() => searchOption.value.key,
	newValue => {
		folderTree.value.filter(newValue)
	}
)
// 监控选择上级菜单
watch(
	() => treePath.value,
	newValue => {
		if (newValue) {
			const val = newValue[newValue.length - 1]
			if (entity.value.ParentId !== val) entity.value.ParentId = newValue[newValue.length - 1] ?? GUID
		} else {
			entity.value.ParentId = GUID
		}
	}
)
onMounted(() => {
	get()
})

// 获取目录列表
function get(isValidlist?: boolean) {
	IsValidlist.value = isValidlist === undefined ? true : isValidlist
	const scope = IsValidlist.value ? 0 : 1
	API.getFolderTrees(GUID, true, scope).then(res => {
		const node: IDiskFolderTree = Object.assign({
			Id: GUID,
			ParentId: '',
			Name: '根节点',
			Children: res
		})
		trees.value = [node]
		list.value = res
	})
}

// 树节点过滤
function filterFolderNode(value: string, data: any) {
	if (!value) return true
	return data.Name.indexOf(value) !== -1
}

// 树节点点击
function clickTreeNode(_event: any, node: any) {
	isSortableChildFolder.value = false
	currentNode.value = node.data
	childFolders.value = node.data.Children
	getFiles()
}

// 显示添加抽屉
function showDrawer(item?: IDiskFolderTree) {
	drawerVisiable.value = true
	if (item) {
		isAdd.value = false
		entity.value = Object.assign({
			Id: item.Id,
			Name: item.Name,
			ParentId: item.ParentId
		})
		treePath.value = getTreePath(item?.ParentId)
	} else {
		isAdd.value = true
		entity.value = Object.assign({ Id: GUID, Name: '' })
		// 添加子级目录自动选中上级
		treePath.value = getTreePath(currentNode.value.Id)
		nextTick(() => {
			teamFormRef.value?.resetFields()
		})
	}
}

// 获取父级路径
function getTreePath(id: string) {
	if (id === '') return []
	let result = [id]
	const option = findFolder(id, list.value)
	if (option) {
		result = getTreePath(option.ParentId).concat(result)
	}
	return result
}

// 查找指定id目录
function findFolder(id: string, sources: IDiskFolderTree[]): IDiskFolderTree | undefined {
	for (let i = 0; i < sources.length; i++) {
		const e = sources[i]
		if (e.Id === id) {
			return e
		} else {
			const option = findFolder(id, e.Children)
			if (option) return option
		}
	}
	return undefined
}

// 提交
function submit() {
	teamFormRef.value?.validate((valid: boolean) => {
		if (valid) {
			if (isAdd.value) {
				API.addFolder(entity.value).then(res => {
					if (res.Status) get()
				})
			} else {
				API.updateFolder(entity.value).then(res => {
					if (res.Status) get()
				})
			}
		}
	})
}

// 彻底删除
function delTrue() {
	ElMessageBox.confirm(`确认要彻底删除${currentNode.value.Name}?删除后不可恢复`, '敏感操作提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	}).then(() => {
		API.delFolder(currentNode.value.Id, false).then(res => {
			if (res.Status) {
				currentNode.value = Object.assign({ Id: GUID })
				get()
			}
		})
	})
}

// 图片校验
function beforeFileUpload(file: any) {
	const isIMG = file.type === 'image/jpg' || file.type === 'image/jpeg' || file.type === 'image/png'
	if (!isIMG) {
		ElMessage.error('上传图片只支持jpg、jpeg、png格式!')
	}
	const isLt = file.size / 1024 / 1024 <= 2
	if (!isLt) {
		ElMessage.error('上传图片最大不能超过2MB')
	}
	return isIMG && isLt
}

// 上传成功
function onUploadSuccess(res: any) {
	if (res.Status) {
		getFiles()
	}
}

// 获取上传路径
function getUploadFileUrl() {
	return API.getFolderUploadFileUrl(currentNode.value.Id)
}

// 获取目录文件列表
function getFiles() {
	API.getFolderFiles(currentNode.value.Id).then(res => {
		files.value = res
	})
}

// 修改文件名
function updateFileName(item: IDiskFile) {
	ElMessageBox.prompt('请输入要修改的新文件名，最多50个字符', '修改文件名', {
		confirmButtonText: '确定',
		cancelButtonText: '取消'
	}).then(({ value }) => {
		API.updateFolderFile(currentNode.value.Id, Object.assign({ Id: item.Id, Title: value })).then(res => {
			if (res.Status) {
				getFiles()
			}
		})
	})
}

// 删除文件
function delFile(item: IDiskFile) {
	ElMessageBox.confirm(`确认要删除${item.Title}?删除后不可恢复`, '敏感操作提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	}).then(() => {
		API.delFolderFile(currentNode.value.Id, item.Id).then(res => {
			if (res.Status) {
				getFiles()
			}
		})
	})
}

// 预览文件
function previewFile(item: IDiskFile) {
	window.open(`${domain.value + item.Url}`)
}

// 选中的文件
function fileSelectionChange(rows: IDiskFile[]) {
	fileSelections.value = rows
}

// 批量下载
function bulkDownloadFile() {
	filesToRar(fileSelections.value, `${currentNode.value.Name}-附件.zip`)
}

// 压缩文件
function filesToRar(arr: IDiskFile[], filename: string) {
	const zip = new JSZip()
	const cache: { [key: string]: any } = {}
	const promises = []
	for (const item of arr) {
		const promise = getImgArrayBuffer(domain.value + item.Url).then((data: any) => {
			// 下载文件, 并存成ArrayBuffer对象(blob)
			zip.file(item.Title + item.ExtensionName, data, {
				binary: true
			}) // 逐个添加文件
			cache[item.Title] = data
		})
		promises.push(promise)
	}
	Promise.all(promises)
		.then(() => {
			zip
				.generateAsync({
					type: 'blob'
				})
				.then(content => {
					// 生成二进制流
					FileSaver.saveAs(content, filename) // 利用file-saver保存文件  自定义文件名
				})
		})
		.catch(() => {
			ElMessage.error('文件压缩失败')
		})
}

// 压缩文件
function getImgArrayBuffer(url: string) {
	return new Promise((resolve, reject) => {
		// 通过请求获取文件blob格式
		const xmlhttp = new XMLHttpRequest()
		xmlhttp.open('GET', url, true)
		xmlhttp.responseType = 'blob'
		xmlhttp.onload = function () {
			if (this.status === 200) {
				resolve(this.response)
			} else {
				reject(this.status)
			}
		}
		xmlhttp.send()
	})
}
</script>

<style lang="scss" scoped>
.disk-personal-page {
	display: flex;
	background: #fff;
	border-radius: 20px;
	padding: 20px;
}

.tree {
	width: 300px;
	min-height: 650px;
	border-right: 1px solid #ebeef5;

	.header {
		display: flex;
		flex-direction: column;
		padding: 0.75rem;
		border-bottom: 1px solid #ebeef5;

		.el-button-group {
			margin-top: 10px;

			button {
				width: 50%;
			}
		}
	}
}

.right-content {
	flex: 1;
	padding: 0 20px;
	position: relative;
	overflow: hidden;

	.btn-box {
		display: flex;
		align-items: center;

		.name {
			font-size: 1.75rem;
			font-weight: 600;
		}

		.tag {
			margin-left: 10px;
		}
	}

	.file-box {
		.title {
			font-size: 1.25rem;
			margin-bottom: 20px;
		}

		.btn-title {
			padding: 10px;
			background: #f2f6fc;
			display: flex;
			align-items: center;
			border-radius: 10px;
			margin-bottom: 10px;
		}
	}
}
</style>