<template>
	<el-container class="wxpay-set-page">
		<el-header class="header">
			<span>
				<el-input enterable v-model="searchOption.key" placeholder="商户号 / 名称" style="width: 260px">
					<template #prefix>
						<font-awesome-icon fas icon="user"></font-awesome-icon>
					</template>
				</el-input>
				<el-button @click="search" type="primary" class="search-button">
					<font-awesome-icon fas icon="search"></font-awesome-icon>
					&nbsp;查询
				</el-button>
			</span>
			<span>
				<el-button @click="showDrawer()" type="primary">
					<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增配置
				</el-button>
			</span>
		</el-header>
		<el-main class="content">
			<div class="title-box">
				<span class="title">
					微信支付设置列表
					<span class="title-total">
						共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
					</span>
				</span>
			</div>
			<el-table v-loading="loading" :data="list" row-key="Id" class="ofa-table">
				<el-table-column prop="AppId" label="AppId"></el-table-column>
				<el-table-column prop="AppName" label="应用名称"></el-table-column>
				<el-table-column prop="Mchid" label="商户号">
					<template #default="scope">
						{{ scope.row.Mchid }}&nbsp;
						<span v-show="scope.row.Error">
							<font-awesome-icon fas icon="info" class="ofa-text-danger"></font-awesome-icon>&nbsp;{{ scope.row.Error }}
						</span>
					</template>
				</el-table-column>
				<el-table-column prop="APIv3Key" label="支付秘钥V3"></el-table-column>
				<el-table-column prop="OrderTimeExpire" label="订单失效" width="100">
					<template #default="scope">{{ scope.row.OrderTimeExpire }}分钟</template>
				</el-table-column>
				<el-table-column show-overflow-tooltips prop="CreateTime" label="最后修改时间" width="160">
					<template #default="scope">{{ dayjs(scope.row.CreateTime).format('YYYY-MM-DD HH:mm') }}</template>
				</el-table-column>
				<el-table-column prop="CreatorName" label="最后修改人" width="200"></el-table-column>
				<el-table-column label="操作" width="200" align="center" header-align="center">
					<template #default="scope">
						<el-upload action="#" :show-file-list="false" :before-upload="beforeFileUpload" :http-request="uploadCertificate">
							<el-button link @click="entity = scope.row" type="success"
								>{{ scope.row.IsUploadCert ? '更新' : '上传' }}商户证书
							</el-button>
						</el-upload>
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
	<el-drawer v-model="drawerVisiable" :modal="false" :show-close="false" direction="rtl" size="400px" class="ofa-drawer">
		<template #header>
			<span class="title">{{ isAdd ? '创建' : '编辑' }}设置</span>
		</template>
		<el-form status-icon ref="settingForm" :rules="validationRule" :model="entity" class="form" label-width="120px">
			<el-alert show-icon title="操作提示" type="warning" style="margin-bottom: 20px">
				<ul class="tips">
					<li>请确保填写数据与微信商户平台相关配置一致，详情请和开发人员了解</li>
				</ul>
			</el-alert>
			<el-form-item label="AppId" prop="AppId">
				<el-input v-model.trim="entity.AppId" placeholder="请输入微信应用Id"> </el-input>
			</el-form-item>
			<el-form-item label="应用名称" prop="AppName">
				<el-input v-model.trim="entity.AppName" placeholder="请输入微信应用名称"></el-input>
			</el-form-item>
			<el-form-item label="商户号" prop="Mchid">
				<el-input v-model.trim="entity.Mchid" placeholder="请输入微信商户号"></el-input>
			</el-form-item>
			<el-form-item label="支付秘钥V3" prop="APIv3Key">
				<el-input v-model.trim="entity.APIv3Key" :rows="4" type="textarea" placeholder="请输入微信支付回调校验秘钥v3"></el-input>
			</el-form-item>
			<el-form-item label="订单时效时长" prop="OrderTimeExpire">
				<el-input v-model.trim="entity.OrderTimeExpire" type="number" placeholder="请输入订单时效时长（分钟）"> </el-input>
			</el-form-item>
			<el-form-item label="支付回调地址" prop="CallbackUrl">
				<el-input v-model.trim="entity.CallbackUrl" :rows="4" type="textarea" placeholder="请输入支付回调地址"> </el-input>
			</el-form-item>
		</el-form>
		<div class="footer">
			<el-button type="primary" @click="submit"> <font-awesome-icon fas icon="save"></font-awesome-icon>&nbsp;保存 </el-button>
			<el-button type="warning" @click="drawerVisiable = false"> 取消 </el-button>
		</div>
	</el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { FormRules, ElMessageBox, FormInstance, dayjs } from 'element-plus'
import { IOmsWxpaySetting } from '@/interfaces/oms/IOmsWxpaySetting'
import API from '@/apis/oms-api'

const loading = ref(false) // 加载中
const drawerVisiable = ref(false)
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const searchOption = ref({
	key: ''
}) // 搜索条件
const isAdd = ref(true) // 添加模式
const list = ref<IOmsWxpaySetting[]>([]) // 用户列表
const entity = ref<IOmsWxpaySetting>(Object.assign({ Name: '', UserName: '', Status: 1 })) // 实体
const settingForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
	AppId: [
		{ required: true, message: '请先填写AppId', trigger: 'blur' },
		{ min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
	],
	AppName: [
		{ required: true, message: '请先填写应用名称', trigger: 'blur' },
		{ min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
	],
	Mchid: [
		{ required: true, message: '请先填写商户号', trigger: 'blur' },
		{ min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
	],
	APIv3Key: [
		{ required: true, message: '请先填写支付回调秘钥v3', trigger: 'blur' },
		{ min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
	],
	OrderTimeExpire: [{ required: true, message: '请先填写订单时效时长', trigger: 'blur' }]
}) // 表单验证

onMounted(() => {
	get()
})

// 获取列表
function get() {
	loading.value = true
	API.getPageWxpaySetting(pageIndex.value, pageSize.value, searchOption.value.key).then(res => {
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

// 显示添加抽屉
function showDrawer(item?: IOmsWxpaySetting) {
	if (item) {
		isAdd.value = false
		entity.value = item
	} else {
		isAdd.value = true
		entity.value = Object.assign({})
		nextTick(() => {
			settingForm.value?.resetFields()
		})
	}
	drawerVisiable.value = true
}

// 提交
function submit() {
	settingForm.value?.validate((valid: boolean) => {
		if (valid) {
			if (isAdd.value) {
				API.addWxpaySetting(entity.value).then(res => {
					if (res.Status) get()
				})
			} else {
				API.updateWxpaySetting(entity.value)
			}
		}
	})
}

// 删除
function del(item: IOmsWxpaySetting) {
	ElMessageBox.confirm('确认要删除选中客户端？删除后不可恢复，请谨慎操作！', '敏感操作提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	}).then(() => {
		API.delWxpaySetting(item.Id).then(res => {
			if (res.Status) {
				get()
			}
		})
	})
}

// 上传校验
function beforeFileUpload(file: any) {
	const isLt = file.size / 1024 / 1024 <= 2
	if (!isLt) {
		ElMessage.error('上传文件最大不能超过2MB')
	}
	return isLt
}

// 上传证书
async function uploadCertificate(upload: any) {
	const formData = new FormData()
	formData.append('files', upload.file)
	API.uploadWxpaySetting(entity.value.Id, formData).then(res => {
		if (res.Status) {
			get()
		}
	})
}
</script>

<style lang="scss" scoped>
.wxpay-set-page {
	background: #fff;
	border-radius: 20px;
	padding: 20px;
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.title-box {
		padding: 20px 0;
	}

	.title {
		color: #303133;
		font-size: 1.75rem;
		font-weight: bold;
	}
	.search-button {
		margin-left: 10px;
	}
}
</style>