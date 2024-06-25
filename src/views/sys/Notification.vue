<template>
	<el-container class="notification-page">
		<el-header class="header">
			<span>
				<el-input enterable v-model="searchOption.key" placeholder="标题" style="width: 260px">
					<template #prefix>
						<font-awesome-icon fas icon="user"></font-awesome-icon>
					</template>
				</el-input>
				<el-button @click="search" type="primary" class="ofa-ml10"
					><font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询</el-button
				>
			</span>
			<span>
				<el-button v-if="permission.Add" @click="showDrawer()" type="primary">
					<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增系统通知
				</el-button>
			</span>
		</el-header>
		<el-main class="content">
			<div class="title-box">
				<span class="title">
					系统通知列表
					<span class="title-total">
						共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
					</span>
				</span>
			</div>
			<el-table v-loading="loading" :data="list" class="ofa-table">
				<el-table-column prop="Title" label="标题"></el-table-column>
				<el-table-column prop="IsPublish" label="状态" width="80">
					<template #default="scope">
						{{ scope.row.IsPublish ? '已发布' : '草稿' }}
					</template>
				</el-table-column>
				<el-table-column prop="Type" label="目标" width="80">
					<template #default="scope">
						{{ getTypeStr(scope.row.Type) }}
					</template>
				</el-table-column>
				<el-table-column prop="CreateTime" label="创建时间" width="180">
					<template #default="scope">
						{{ dayjs(scope.row.CreateTime).format('YYYY年MM月DD日 hh:mm') }}
					</template>
				</el-table-column>
				<el-table-column prop="UpdateTime" label="最后更新时间" width="180">
					<template #default="scope">
						{{ dayjs(scope.row.UpdateTime).format('YYYY年MM月DD日 hh:mm') }}
					</template>
				</el-table-column>
				<el-table-column label="操作" width="200" align="center" header-align="center">
					<template #default="scope">
						<el-button link v-if="permission.Update" @click="showDrawer(scope.row)" type="primary">修改</el-button>
						<el-button link v-if="permission.Update && !scope.row.IsPublish" @click="publish(scope.row)" type="primary"
							>发布</el-button
						>
						<el-button link v-if="permission.Delete" @click="del(scope.row)" type="danger">删除</el-button>
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
	<el-dialog v-model="drawerVisiable" :title="isAdd ? '新增系统通知' : '编辑系统通知'" width="60%">
		<el-form status-icon ref="notificationForm" :rules="validationRule" :model="entity" label-width="120px">
			<el-form-item label="标题" prop="Title">
				<el-input v-model.trim="entity.Title" style="width: 100%" placeholder="请输入通知标题"></el-input>
			</el-form-item>
			<el-form-item label="类型" prop="Content">
				<el-radio-group v-model="entity.Type">
					<el-radio v-for="item in NOTIFICATION_TYPE" :key="item.value" :value="item.value">{{ item.label }}</el-radio>
				</el-radio-group>
			</el-form-item>
			<el-form-item
				v-show="entity.Type === 2"
				label="账号列表"
				prop="ToAccounts"
				:rules="{
					required: entity.Type === 2,
					message: '请先选择通知账号',
					trigger: 'blur'
				}"
			>
				<div class="fix-account-box">
					<el-select
						filterable
						remote
						reserve-keyword
						:remote-method="getUsers"
						placeholder="输入用户名称或账号搜索"
						style="width: 300px"
					>
						<template #prefix>
							<font-awesome-icon fas icon="user"></font-awesome-icon>
						</template>
						<el-option
							v-for="item in users"
							:key="item.Id"
							:label="item.Name"
							:value="item.Id"
							@click="selectAccount(item)"
						></el-option>
					</el-select>
					<div class="user-tags">
						<el-tag
							closable
							v-for="item in userSelections"
							:key="item.Id"
							@close="removeAccount(item)"
							effect="dark"
							class="ofa-ml4"
							>{{ item.Name }}</el-tag
						>
					</div>
				</div>
			</el-form-item>
			<el-form-item label="内容" prop="Content">
				<tinymce-editor v-model:value="entity.Content" @upload="upload" />
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button type="primary" @click="submit">提交</el-button>
			<el-button type="warning" @click="drawerVisiable = false">取消</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, nextTick } from 'vue'
import { FormRules, ElMessageBox, FormInstance, dayjs } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { NOTIFICATION } from '@/routers/sys-router'
import { ISysNotification } from '@/interfaces/sys/ISysNotification'
import { NOTIFICATION_TYPE } from '@/consts/sys-const'
import API from '@/apis/sys-api'
import { ISysUser } from '@/interfaces/sys/ISysUser'
import { GUID } from '@/consts/const'

onMounted(() => {
	get()
})

const userStore = useUserStore()
const domain = ref(API.getHost())
const loading = ref(false) // 加载中
const drawerVisiable = ref(false)
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const searchOption = ref({
	key: '',
	startDate: '',
	endDate: ''
}) // 搜索条件
const isAdd = ref(true) // 添加模式
const list = ref<ISysNotification[]>([]) // 列表
const users = ref<ISysUser[]>([]) // 账号列表
const userSelections = ref<ISysUser[]>([]) // 选中账号列表
const entity = ref<ISysNotification>(Object.assign({ Id: GUID, Name: '', UserName: '', Status: 1 })) // 实体
const notificationForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
	Title: [
		{ required: true, message: '请先填写通知标题', trigger: 'blur' },
		{ min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
	],
	Content: [{ required: true, message: '请先填写内容', trigger: 'blur' }]
}) // 表单验证

const permission = computed(() => {
	return userStore.getPermissions(NOTIFICATION.Url) // 权限列表
})

// 获取列表
function get() {
	loading.value = true
	API.getNotifications(pageIndex.value, pageSize.value, searchOption.value.startDate, searchOption.value.endDate).then(res => {
		list.value = res.Items
		total.value = res.Total
		loading.value = false
	})
}

// 获取状态
function getTypeStr(type: number): any {
	let str = '未知'
	const item = NOTIFICATION_TYPE.find(w => w.value === type)
	if (item) {
		str = item.label
	}
	return str
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
function showDrawer(item?: ISysNotification) {
	if (item) {
		isAdd.value = false
		entity.value = item
	} else {
		isAdd.value = true
		entity.value = Object.assign({ Id: GUID })
		nextTick(() => {
			notificationForm.value?.resetFields()
		})
	}
	drawerVisiable.value = true
}

// 提交
function submit() {
	notificationForm.value?.validate((valid: boolean) => {
		if (valid) {
			if (isAdd.value) {
				API.addNotification(entity.value, userSelections.value).then(res => {
					if (res.Status) get()
				})
			} else {
				API.updateNotification(entity.value, userSelections.value)
			}
		}
	})
}

// 删除
function del(item: ISysNotification) {
	ElMessageBox.confirm('确认要删除选中系统通知？删除后不可恢复，请谨慎操作！', '敏感操作提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	}).then(() => {
		API.delNotification(item.Id).then(res => {
			if (res.Status) {
				get()
			}
		})
	})
}

// 发布
function publish(item: ISysNotification) {
	ElMessageBox.confirm('确认要发布选中系统通知？', '温馨提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	}).then(() => {
		API.publishNotification(item.Id).then(res => {
			if (res.Status) {
				get()
			}
		})
	})
}

// 获取用户列表
function getUsers(key: string) {
	API.getPageUsers(1, 10, key).then(res => {
		users.value = res.Items
	})
}

// 选中账号
function selectAccount(item: ISysUser) {
	const index = userSelections.value.findIndex(w => w.Id === item.Id)
	if (index < 0) userSelections.value.push(item)
}

// 移除选中账号
function removeAccount(item: ISysUser) {
	const index = userSelections.value.findIndex(w => w.Id === item.Id)
	if (index > -1) userSelections.value.splice(index, 1)
}

// 上传文件
function upload(blob: any, success: any, failure: any) {
	API.uploadNotificationImg(entity.value.Id, blob).then(res => {
		if (res.Status) {
			entity.value.Id = res.Data.Id
			success(domain.value + res.Data.Result.Url)
		} else {
			failure(res.Message)
		}
	})
}
</script>

<style lang="scss" scoped>
.notification-page {
	background: #fff;
	border-radius: 20px;
	padding: 20px;

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
	}

	.title-box {
		padding: 20px 0;
	}

	.title {
		color: #303133;
		font-size: 1.75rem;
		font-weight: bold;
	}
}

.user-tags {
	display: flex;
	flex-wrap: wrap;
	margin-top: 10px;
}
</style>