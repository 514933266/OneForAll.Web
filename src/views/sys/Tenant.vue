<template>
	<el-container class="tenant-page">
		<el-header class="header">
			<span class="search-box">
				<el-select v-model="searchOption.isEnabled" style="width: 260px">
					<el-option :value="-1" label="全部"></el-option>
					<el-option :value="1" label="启用"></el-option>
					<el-option :value="0" label="禁用"></el-option>
				</el-select>
				<el-input v-model="searchOption.key" placeholder="请根据选择的类型输入关键字" class="ofa-ml10" style="width: 260px">
				</el-input>
				<el-date-picker
					v-model="searchOption.startDate"
					type="date"
					class="ofa-ml10"
					style="width: 260px"
					placeholder="请选择注册开始日期"
					format="yyyy年MM月dd日"
					value-format="YYYY-MM-DD"
				>
				</el-date-picker>
				<el-date-picker
					v-model="searchOption.endDate"
					type="date"
					class="ofa-ml10"
					placeholder="请选择注册结束日期"
					format="yyyy年MM月dd日"
					value-format="YYYY-MM-DD"
					style="margin-right: 4px; width: 260px"
				>
				</el-date-picker>
				<el-button @click="search" type="primary" class="ofa-ml10"
					><font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询</el-button
				>
			</span>
			<span>
				<el-button v-if="permission.Add" @click="showDrawer()" type="primary">
					<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增租户
				</el-button>
			</span>
		</el-header>
		<el-main class="content">
			<div class="title-box">
				<span class="title">
					租户列表
					<span class="title-total">
						共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
					</span>
				</span>
			</div>
			<el-table v-loading="loading" :data="list" class="ofa-table">
				<el-table-column prop="Name" label="企业名称" min-width="250px"></el-table-column>
				<el-table-column prop="Code" label="机构代码" min-width="200px"></el-table-column>
				<el-table-column prop="Manager" label="联系人"></el-table-column>
				<el-table-column prop="Phone" label="联系方式"></el-table-column>
				<el-table-column label="注册日期" width="150" align="center">
					<template #default="scope">{{ dayjs(scope.row.CreateTime).format('YYYY年MM月DD日') }}</template>
				</el-table-column>
				<el-table-column label="状态" prop="IsEnabled" align="center" header-align="center" width="100">
					<template #default="scope">
						<el-tag :type="scope.row.IsEnabled ? 'success' : 'danger'">{{ scope.row.IsEnabled ? '合作中' : '已停用' }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="200" align="center" header-align="center">
					<template #default="scope">
						<el-button link type="primary" @click="toPermissionPage(scope.row)">权限</el-button>
						<el-button link v-if="permission.Update" type="primary" @click="showDrawer(scope.row)">修改</el-button>
						<el-button link v-if="permission.Delete" type="danger" @click="del(scope.row)">删除</el-button>
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
			<span class="title">{{ isAdd ? '新增' : '编辑' }}租户</span>
		</template>
		<el-form status-icon ref="tenantForm" :rules="validationRule" :model="entity" label-width="120px">
			<el-form-item label="机构名称" prop="Name">
				<el-input v-model.trim="entity.Name" placeholder="企业的名称"></el-input>
			</el-form-item>
			<el-form-item label="信用代码" prop="Code">
				<el-input v-model.trim="entity.Code" placeholder="机构社会同一信用代码/自定义代码"></el-input>
			</el-form-item>
			<el-form-item label="管理人" prop="Manager">
				<el-input v-model.trim="entity.Manager" placeholder="企业管理者名称/负责人"></el-input>
			</el-form-item>
			<div class="row">
				<el-form-item label="是否启用">
					<el-switch v-model="entity.IsEnabled"></el-switch>
				</el-form-item>
				<el-form-item label="是否默认">
					<el-switch v-model="entity.IsDefault"></el-switch>
				</el-form-item>
			</div>
			<el-form-item label="联系电话" prop="Phone">
				<el-input v-model.trim="entity.Phone" placeholder="负责人联系方式"></el-input>
			</el-form-item>
			<el-form-item label="企业地址" prop="Address" class="address-item">
				<el-input class="address-textarea" placeholder="请输入具体地址，详细到门牌号" v-model="entity.Address"></el-input>
			</el-form-item>
			<el-form-item label="描述" prop="Description" class="description-item">
				<el-input
					type="textarea"
					class="description-textarea"
					placeholder="请输入企业简要介绍"
					v-model="entity.Description"
				></el-input>
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
import { FormRules, ElMessageBox, FormInstance } from 'element-plus'
import dayjs from '@/untils/dayjs'
import { useUserStore } from '@/stores/userStore'
import { useBrowserStore } from '@/stores/browserStore'
import { TENANT, TENANT_PERMISSION } from '@/routers/sys-router'
import { ISysTenant } from '@/interfaces/sys/ISysTenant'
import API from '@/apis/sys-api'

const userStore = useUserStore()
const browserStore = useBrowserStore()
const loading = ref(false) // 加载中
const drawerVisiable = ref(false)
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const searchOption = ref({
	isEnabled: -1, // 合作状态
	key: '', // 关键字
	startDate: '', // 注册日期（开始）
	endDate: '' // 注册日期（结束）
}) // 搜索条件
const isAdd = ref(true) // 添加模式
const list = ref<ISysTenant[]>([]) // 列表
const entity = ref<ISysTenant>(Object.assign({ Name: '', UserName: '', Status: 1 })) // 实体
const tenantForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
	Name: [
		{ required: true, message: '请先填写租户名称', trigger: 'blur' },
		{ min: 2, max: 20, message: '长度在2到20个字符', trigger: 'blur' }
	],
	Manager: [{ max: 20, message: '不能超过20个字符', trigger: 'blur' }],
	Phone: [{ max: 20, message: '不能超过20个字符', trigger: 'blur' }],
	Code: [{ min: 0, max: 20, message: '长度不能超过50个字符', trigger: 'blur' }]
}) // 表单验证

const permission = computed(() => {
	return userStore.getPermissions(TENANT.Url) // 权限列表
})

onMounted(() => {
	get()
})

// 获取列表
function get() {
	loading.value = true
	API.getPageTenants(pageIndex.value, pageSize.value, searchOption.value.key).then(res => {
		list.value = res.Items
		total.value = res.Total
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
function showDrawer(item?: ISysTenant) {
	if (item) {
		isAdd.value = false
		entity.value = item
	} else {
		isAdd.value = true
		entity.value = Object.assign({})
		nextTick(() => {
			tenantForm.value?.resetFields()
		})
	}
	drawerVisiable.value = true
}

// 提交
function submit() {
	tenantForm.value?.validate((valid: boolean) => {
		if (valid) {
			if (isAdd.value) {
				API.addTenant(entity.value).then(res => {
					if (res.Status) get()
				})
			} else {
				API.updateTenant(entity.value)
			}
		}
	})
}

// 删除
function del(item: ISysTenant) {
	ElMessageBox.confirm('确认要删除选中租户？删除后不可恢复，请谨慎操作！', '敏感操作提示', {
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

// 跳转权限页
function toPermissionPage(item: ISysTenant) {
	browserStore.navigate(TENANT_PERMISSION, item)
}
</script>

<style lang="scss" scoped>
.tenant-page {
	background: #fff;
	border-radius: 20px;
	padding: 20px;

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;

		.search-box {
			display: flex;
			padding: 10px 0;
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