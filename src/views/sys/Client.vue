<template>
	<el-container class="client-page">
		<el-header class="header">
			<span> </span>
			<span>
				<el-button v-if="permission.Add" @click="showDrawer()" type="primary">
					<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增客户端
				</el-button>
			</span>
		</el-header>
		<el-main class="content">
			<div class="title-box">
				<span class="title">
					客户端列表
					<span class="title-total">
						共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
					</span>
				</span>
			</div>
			<el-table v-loading="loading" :data="list" class="ofa-table">
				<el-table-column prop="ClientId" label="客户端Id" width="200"></el-table-column>
				<el-table-column prop="ClientSecret" label="客户端密码" width="200"></el-table-column>
				<el-table-column prop="ClientName" label="客户端名称" width="200"></el-table-column>
				<el-table-column prop="Type" label="客户端类型" width="160">
					<template #default="scope">
						<el-tag>{{ getTypeStr(scope.row.Type) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="Role" label="登录角色" width="160"></el-table-column>
				<el-table-column prop="AutoCreateAccount" label="自动注册" align="center" width="160">
					<template #header>
						<label>
							<el-tooltip class="box-item" effect="dark" content="如果勾选，则在登录时自动创建系统账号，否则需要走注册流程"
								placement="top">
								<font-awesome-icon fas icon="info-circle"
									class="ofa-mr4 color-warning"></font-awesome-icon>
							</el-tooltip>
							自动注册
						</label>
					</template>
					<template #default="scope"><font-awesome-icon fas
							:icon="scope.row.AutoCreateAccount ? 'check' : 'times'"
							:class="scope.row.AutoCreateAccount ? 'color-success' : 'color-danger'"></font-awesome-icon>&nbsp;
					</template>
				</el-table-column>
				<el-table-column prop="CreateTime" label="创建时间" width="200px">
					<template #default="scope">
						{{ dayjs(scope.row.CreateTime).format('YYYY-MM-DD HH:mm') }}
					</template>
				</el-table-column>
				<el-table-column label="操作" width="200" align="center" header-align="center" fixed="right">
					<template #default="scope">
						<el-button link v-if="permission.Update" type="primary"
							@click="showDrawer(scope.row)">修改</el-button>
						<el-button link v-if="permission.Delete" type="danger" @click="del(scope.row)">删除</el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-main>
	</el-container>
	<!-- 表单 -->
	<el-drawer v-model="drawerVisiable" :modal="false" :show-close="false" direction="rtl" size="460"
		class="ofa-drawer">
		<template #header>
			<span class="title">{{ isAdd ? '新增' : '编辑' }}客户端</span>
		</template>
		<el-form status-icon ref="clientForm" :rules="validationRule" :model="entity" label-width="120px">
			<el-form-item label="客户端Id" prop="ClientId">
				<el-input v-model.trim="entity.ClientId" placeholder="客户端Id"></el-input>
			</el-form-item>
			<el-form-item label="客户端密码" prop="ClientSecret">
				<el-input v-model.trim="entity.ClientSecret" placeholder="客户端密码"></el-input>
			</el-form-item>
			<el-form-item label="客户端名称" prop="ClientName">
				<el-input v-model.trim="entity.ClientName" placeholder="客户端名称"></el-input>
			</el-form-item>
			<el-form-item label="客户端类型" prop="Type">
				<el-select v-model="entity.Type">
					<el-option v-for="item in CLIENT_TYPE" :key="item.value" :label="item.label" :value="item.value">
					</el-option>
				</el-select>
			</el-form-item>
			<el-form-item label="登录角色" prop="Role">
				<el-input v-model.trim="entity.Role" placeholder="用户登录后的权限角色"></el-input>
			</el-form-item>
			<el-form-item label="自动注册" prop="AutoCreateAccount">
				<template #label>
					<label>
						<el-tooltip class="box-item" effect="dark" content="如果勾选，则在登录时自动创建系统账号，否则需要走注册流程"
							placement="top">
							<font-awesome-icon fas icon="info-circle" class="ofa-mr4 color-warning"></font-awesome-icon>
						</el-tooltip>
						自动注册
					</label>
				</template>
				<el-checkbox v-model="entity.AutoCreateAccount"></el-checkbox>
			</el-form-item>
		</el-form>
		<div class="footer">
			<el-button type="primary" @click="submit">提交</el-button>
			<el-button type="warning" @click="drawerVisiable = false">取消</el-button>
		</div>
	</el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, nextTick } from 'vue'
import { FormRules, ElMessageBox, FormInstance, dayjs } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { CLIENT } from '@/routers/sys-router'
import { ISysClient } from '@/interfaces/sys/ISysClient'
import API from '@/apis/sys-api'
import { CLIENT_TYPE } from '@/consts/sys-const'

const userStore = useUserStore()
const loading = ref(false) // 加载中
const drawerVisiable = ref(false)
const total = ref(0) // 总数据量
const isAdd = ref(true) // 添加模式
const list = ref<ISysClient[]>([]) // 用户列表
const entity = ref<ISysClient>(Object.assign({ Name: '', UserName: '', Status: 1 })) // 实体
const clientForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
	ClientId: [
		{ required: true, message: '请先填写权客户端Id', trigger: 'blur' },
		{ min: 2, max: 100, message: '长度在2~100之间', trigger: 'blur' }
	],
	ClientSecret: [
		{ required: true, message: '请先填写权客户端密码', trigger: 'blur' },
		{ min: 2, max: 100, message: '长度在2~100之间', trigger: 'blur' }
	],
	ClientName: [
		{ required: true, message: '请先填写权客户端名称', trigger: 'blur' },
		{ min: 2, max: 20, message: '长度在2~20之间', trigger: 'blur' }
	],
	Role: [{ min: 0, max: 20, message: '长度在2~20之间', trigger: 'blur' }]
}) // 表单验证

const permission = computed(() => {
	return userStore.getPermissions(CLIENT.Url) // 权限列表
})

onMounted(() => {
	get()
})

// 获取列表
function get() {
	loading.value = true
	API.getClients().then(res => {
		list.value = res
		total.value = res.length
		loading.value = false
	})
}

// 获取状态
function getTypeStr(type: number): any {
	let str = '异常'
	const item = CLIENT_TYPE.find(w => w.value === type)
	if (item) {
		str = item.label
	}
	return str
}

// 显示添加抽屉
function showDrawer(item?: ISysClient) {
	if (item) {
		isAdd.value = false
		entity.value = item
	} else {
		isAdd.value = true
		entity.value = Object.assign({})
		nextTick(() => {
			clientForm.value?.resetFields()
		})
	}
	drawerVisiable.value = true
}

// 提交
function submit() {
	clientForm.value?.validate((valid: boolean) => {
		if (valid) {
			if (isAdd.value) {
				API.addClient(entity.value).then(res => {
					if (res.Status) get()
				})
			} else {
				API.updateClient(entity.value)
			}
		}
	})
}

// 删除
function del(item: ISysClient) {
	ElMessageBox.confirm('确认要删除选中客户端？删除后不可恢复，请谨慎操作！', '敏感操作提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	}).then(() => {
		API.delClient(item.Id).then(res => {
			if (res.Status) {
				get()
			}
		})
	})
}
</script>

<style lang="scss" scoped>
.client-page {
	background: #fff;
	border-radius: 20px;
	padding: 20px;

	.header {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		height: auto;

		.search-box {
			display: flex;
			align-items: center;
			padding: 6px 4px;
		}

		.button-box {
			display: flex;
			align-items: flex-start;
		}
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
</style>