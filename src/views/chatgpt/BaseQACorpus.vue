<template>
	<el-container class="website-page">
		<el-header class="header">
			<span>
				<el-input enterable v-model="searchOption.key" placeholder="问题 / 类型" style="width: 260px">
					<template #prefix>
						<font-awesome-icon fas icon="file"></font-awesome-icon>
					</template>
				</el-input>
				<el-select
					filterable
					remote
					:remote-method="getTenants"
					v-model.trim="searchOption.tenantId"
					placeholder="请搜索后选择所属租户"
					class="ofa-ml10"
					style="width: 200px"
				>
					<el-option v-for="item in tenants" :key="item.Id" :label="item.Name" :value="item.Id"> </el-option>
				</el-select>
				<el-button @click="search" type="primary" class="ofa-ml10">
					<font-awesome-icon fas icon="search"></font-awesome-icon>
					&nbsp;查询
				</el-button>
			</span>
			<span>
				<el-upload
					ref="uploader"
					action=""
					:http-request="uploadExcel"
					accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
					:limit="1"
					:show-file-list="false"
				>
					<el-button type="success"><font-awesome-icon fas icon="file-excel" />&nbsp;&nbsp;导入Excel</el-button>
				</el-upload>
				<el-button @click="showDrawer()" type="primary" class="ofa-ml10">
					<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增训练数据
				</el-button>
			</span>
		</el-header>
		<el-main class="content">
			<div class="title-box">
				<span class="title">
					知识库列表
					<span class="title-total">
						共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
					</span>
				</span>
			</div>
			<el-table v-loading="loading" :data="list" class="ofa-table">
				<el-table-column prop="Type" label="类型" width="100"></el-table-column>
				<el-table-column prop="Question" label="问题"></el-table-column>
				<el-table-column show-overflow-tooltip prop="Answer" label="答案"></el-table-column>
				<el-table-column prop="Tags" label="标签" width="200">
					<template #default="scope">
						<el-tag v-for="item in scope.row.Tags" :key="item" class="ofa-mr4">{{ item }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="LikeCount" label="点赞" width="100"></el-table-column>
				<el-table-column prop="DisLikeCount" label="点踩" width="100"></el-table-column>
				<el-table-column prop="CreateTime" label="创建时间" width="200">
					<template #default="scope">
						{{ dayjs(scope.row.CreateTime).format('YYYY-MM-DD HH:mm') }}
					</template>
				</el-table-column>
				<el-table-column label="操作" width="200" align="center" header-align="center">
					<template #default="scope">
						<el-button link type="primary" @click="showDrawer(scope.row)">修改</el-button>
						<el-button link type="danger" @click="del(scope.row)">删除</el-button>
					</template>
				</el-table-column>
			</el-table>
			<el-pagination
				background
				layout="total, sizes, prev, pager, next, jumper"
				v-model:current-page="pageIndex"
				:page-sizes="[10, 20, 50, 100]"
				v-model:page-size="pageSize"
				:total="total"
				@size-change="pageSizeChange"
				@current-change="pageIndexChange"
			>
			</el-pagination>
		</el-main>
	</el-container>
	<!-- 表单 -->
	<el-drawer v-model="drawerVisiable" :modal="false" :show-close="false" direction="rtl" size="460" class="ofa-drawer">
		<template #header>
			<span class="title">{{ isAdd ? '新增' : '编辑' }}训练数据</span>
		</template>
		<el-form status-icon ref="dataForm" :rules="validationRule" :model="entity" class="form" label-width="120px">
			<el-form-item label="所属机构" prop="Name" class="row-item">
				<el-select filterable remote :remote-method="getTenants" v-model.trim="entity.TenantId" placeholder="请搜索后选择">
					<el-option label="无" :value="GUID"> </el-option>
					<el-option v-for="item in tenants" :key="item.Id" :label="item.Name" :value="item.Id"> </el-option>
				</el-select>
			</el-form-item>
			<el-form-item label="类型" prop="Type" class="row-item">
				<el-input v-model.trim="entity.Type" placeholder="请输入训练数据的类型，如医疗"></el-input>
			</el-form-item>
			<el-form-item label="问题" prop="Question" class="row-item">
				<el-input v-model.trim="entity.Question" placeholder="请输入问题"> </el-input>
			</el-form-item>
			<el-form-item label="答案" prop="Answer" class="row-item">
				<el-input type="text" v-model.trim="entity.Answer" placeholder="请输入参考答案，AI将会根据此内容进行整理回答"></el-input>
			</el-form-item>
			<el-form-item label="标签" prop="Tags" class="row-item">
				<el-select filterable remote :remote-method="getTenants" v-model.trim="entity.TenantId" placeholder="请搜索后选择">
					<el-option label="无" :value="GUID"> </el-option>
					<el-option v-for="item in tenants" :key="item.Id" :label="item.Name" :value="item.Name"> </el-option>
				</el-select>
			</el-form-item>
		</el-form>
		<div class="footer">
			<el-button type="primary" @click="submit">提交</el-button>
			<el-button type="warning" @click="drawerVisiable = false">取消</el-button>
		</div>
	</el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { FormRules, ElMessageBox, FormInstance, ElUpload } from 'element-plus'
import dayjs from '@/untils/dayjs'
import API from '@/apis/chatgpt-api'
import SYS_API from '@/apis/sys-api'
import { ISysTenant } from '@/interfaces/sys/ISysTenant'
import { GUID } from '@/consts/const'
import { IBaseQACorpus } from '@/interfaces/chatgpt/IBaseQACorpus'

const loading = ref(false) // 加载中
const drawerVisiable = ref(false)
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const searchOption = ref({
	key: '',
	tenantId: ''
}) // 搜索条件
const isAdd = ref(true) // 添加模式
const list = ref<IBaseQACorpus[]>([]) // 用户列表
const tenants = ref<ISysTenant[]>([]) // 租户列表
const entity = ref<IBaseQACorpus>(Object.assign({ Id: GUID })) // 实体
const dataForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
	Type: [
		{ required: true, message: '请先填写类型', trigger: 'blur' },
		{ min: 2, max: 100, message: '长度在2到20个字符', trigger: 'blur' }
	],
	Question: [
		{ required: true, message: '请先填写问题', trigger: 'blur' },
		{ min: 2, max: 200, message: '长度在2到200个字符', trigger: 'blur' }
	],
	Answer: [{ required: true, message: '请先填写答案', trigger: 'blur' }],
	Tags: [{ required: true, message: '请先创建填写标签', trigger: 'blur' }]
}) // 表单验证

onMounted(() => {
	get()
})

// 获取列表
function get() {
	loading.value = true
	const tenantId = searchOption.value.tenantId === '' ? GUID : searchOption.value.tenantId
	API.getPageBaseQACorpus(pageIndex.value, pageSize.value, searchOption.value.key, tenantId).then(res => {
		total.value = res.Total
		list.value = res.Items
		loading.value = false
	})
}

// 搜索
function search() {
	pageIndex.value = 1
	nextTick(() => get())
}

// 改变每页数量
function pageSizeChange(value: number) {
	pageSize.value = value
	nextTick(() => get())
}

// 下一页
function pageIndexChange(value: number) {
	pageIndex.value = value
	nextTick(() => get())
}

// 获取租户列表
function getTenants(key: string) {
	SYS_API.getPageTenants(1, 10, key).then(res => {
		tenants.value = res.Items
	})
}

// 显示添加抽屉
function showDrawer(item?: IBaseQACorpus) {
	if (item) {
		isAdd.value = false
		entity.value = item
	} else {
		isAdd.value = true
		entity.value = Object.assign({
			Id: GUID,
			Type: '',
			Question: '',
			Answer: ''
		})
		nextTick(() => {
			dataForm.value?.resetFields()
		})
	}
	drawerVisiable.value = true
}

// 提交
function submit() {
	dataForm.value?.validate((valid: boolean) => {
		if (valid) {
			if (isAdd.value) {
				API.addBaseQACorpus(entity.value).then(res => {
					if (res.Status) get()
				})
			} else {
				API.updateBaseQACorpus(entity.value)
			}
		}
	})
}

// 删除
function del(item: IBaseQACorpus) {
	ElMessageBox.confirm('确认要删除选中数据源？删除后不可恢复，请谨慎操作！', '敏感操作提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	}).then(() => {
		API.delBaseQACorpus(item.Id).then(res => {
			if (res.Status) {
				get()
			}
		})
	})
}

// 上传Excel
async function uploadExcel(upload: any) {
	const formData = new FormData()
	formData.append('files', upload.file)
	API.uploadBaseQACorpus(formData).then(res => {
		if (res.Status) {
			get()
		}
	})
}
</script>

<style lang="scss" scoped>
.website-page {
	background: #fff;
	border-radius: 20px;
	padding: 20px;

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;

		span {
			display: flex;
		}
	}

	.title-box {
		padding: 20px 0;
	}

	.title {
		font-size: 1.75rem;
		font-weight: bold;
	}
}
</style>