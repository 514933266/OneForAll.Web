<template>
	<div class="personal-info">
		<div class="top-box">
			<div class="header-box">
				<el-upload ref="uploadRef" accept="image/*" :action="API.getUploadHeaderUrl()" list-type="picture"
					:show-file-list="false" :before-upload="beforeUpload" :on-success="onUploadSuccess"
					:headers="uploadHeaders" class="avatar-upload">
					<el-avatar :src="domain + userStoreRef.user.value?.IconUrl" class="avatar-box">
						<font-awesome-icon fas icon="plus"></font-awesome-icon>
					</el-avatar>
					<div class="image-wrapper">
						<font-awesome-icon fas icon="camera" class="thumbnail"></font-awesome-icon>
					</div>
				</el-upload>
				<div class="section-text">
					<div class="section-text-name">
						{{ userStoreRef.user.value?.Name }}({{ userStoreRef.user.value?.UserName }})
						<el-button v-show="!isShowSignatureInput" link @click="isShowSignatureInput = true"
							type="primary">
							写工作签名
						</el-button>
					</div>
					<div class="section-text-desc">
						<font-awesome-icon fas icon="signature" class="ofa-text-label"></font-awesome-icon>
						<label class="ofa-text-label signature-label ofa-ml4">签名：</label>
						<label v-show="!isShowSignatureInput" class="ofa-text-title ofa-mr10">{{
							userStoreRef.user.value?.Signature }}</label>
						<el-input v-show="isShowSignatureInput" v-model="signature" @blur="updateSignature"></el-input>
					</div>
				</div>
			</div>
			<div class="btn-box">
				<el-button link disabled type="primary"><font-awesome-icon fas
						icon="clock"></font-awesome-icon>&nbsp;个人考勤
				</el-button>
				<el-dropdown placement="bottom">
					<el-button link type="primary"><font-awesome-icon fas icon="calendar"></font-awesome-icon>&nbsp;人事历程
					</el-button>
					<template #dropdown>
						<el-dropdown-menu>
							<el-timeline class="time-box">
								<el-timeline-item v-show="personalHistories?.length < 1"
									type="info">暂无人事历程</el-timeline-item>
								<el-timeline-item v-for="(item, index) in personalHistories" :key="index"
									type="primary">
									<div class="primary-box">
										<span>{{ item.PersonJob }}</span>
									</div>
									<div class="success-box">
										<span>{{ dayjs(item.CreateTime).format('YYYY-MM-DD HH:mm') }}</span>
										<span>{{ item.Remark }}</span>
									</div>
								</el-timeline-item>
							</el-timeline>
						</el-dropdown-menu>
					</template>
				</el-dropdown>
				<el-button link @click="toPersonalFilePage" type="primary">
					<font-awesome-icon fas icon="id-badge"></font-awesome-icon>&nbsp;OA档案
				</el-button>
				<el-button link @click="toPasswordPage" type="primary">
					<font-awesome-icon fas icon="lock"></font-awesome-icon>&nbsp;修改密码
				</el-button>
			</div>
		</div>
		<div class="info-box">
			<div v-if="personalFile?.WorkNumber" class="left-box">
				<div class="col">
					<div class="ofa-mb10">
						工号：<label>{{ personalFile?.WorkNumber }}</label>
					</div>
					<div class="ofa-mb10">
						状态：<label>{{ personalFile?.EmployeeStatus }}</label>
					</div>
				</div>
				<div class="col">
					<div class="ofa-mb10">
						所属部门：<label>{{ teamName }}</label>
					</div>
					<div class="ofa-mb10">
						入职时间：<label>{{ dayjs(personalFile?.EntryDate).format('YYYY-MM-DD') }}</label>
					</div>
				</div>
				<div class="col">
					<div class="ofa-mb10">
						职级：<label>{{ personalFile?.Job }}</label>
					</div>
				</div>
			</div>
			<div class="right-box">
				<div class="col">
					<div class="text-top">入职天数</div>
					<div class="text-num">{{ joinDay }}</div>
				</div>
				<el-divider direction="vertical" />
				<div class="col">
					<div class="text-top">司龄</div>
					<div class="text-num">{{ joinAge }}</div>
				</div>
				<el-divider direction="vertical" />
				<div class="col">
					<div class="text-top">工作年限</div>
					<div class="text-num">{{ workAge }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { dayjs, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { useTokenStore } from '@/stores/tokenStore'
import { useBrowserStore } from '@/stores/browserStore'
import API from '@/apis/base-api'
import OA_API from '@/apis/oa-api'
import { IOATeamMemberHistory } from '@/interfaces/oa/IOATeamMemberHistory'
import { IOAPersonFile } from '@/interfaces/oa/IOAPersonFile'
import { GUID } from '@/consts/const'
import { PERSONAL_FILE, PERSONAL_PASSWORD } from '@/routers/main-router'

let isBindFile = false // 已绑定OA档案
const userStore = useUserStore()
const userStoreRef = storeToRefs(userStore)
const tokenStore = useTokenStore()
const browserStore = useBrowserStore()
const domain = ref(API.getHost())
const signature = ref('') // 用户签名
const isShowSignatureInput = ref(false) // 显示用户签名输入
const personalHistories = ref<IOATeamMemberHistory[]>([])
const personalFile = ref<IOAPersonFile>()
const joinDay = computed(() => {
	if (personalFile.value?.EntryDate) {
		const date1 = new Date()
		const date2 = new Date(personalFile.value?.EntryDate)
		const timeDiff = Math.abs(date2.getTime() - date1.getTime())
		const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))
		return diffDays
	}
	return 0
}) // 入职天数

const workAge = computed(() => {
	if (personalFile.value?.ExtendInformations) {
		return personalFile.value?.ExtendInformations.find(w => w.Name === 'WorkAge')?.Value ?? 0
	}
	return 0
}) // 工龄

const joinAge = computed(() => {
	if (personalFile.value?.JoinAge) {
		return personalFile.value?.JoinAge ?? 0
	}
	return 0
}) // 司龄

const teamName = computed(() => {
	if (personalFile.value?.ExtendInformations) {
		return personalFile.value?.ExtendInformations.find(w => w.Name === 'Team')?.Value ?? ''
	}
	return ''
}) // 直属团队

// 上传token
const uploadHeaders = computed(() => {
	return { Authorization: `${tokenStore.bearToken}` }
})

// 更改个性签名
function updateSignature() {
	API.updateSignature(signature.value).then(res => {
		if (res.Status) {
			userStore.setUserSignature(signature.value)
			isShowSignatureInput.value = false
			signature.value = ''
		}
	})
}

// 只能上传小于2M图片
function beforeUpload(file: File) {
	return file.size < 1024 * 1024 * 2
}

// 上传成功
function onUploadSuccess(res: any) {
	if (res.Status) {
		userStore.setUserHeader(res.Data.Result.Url)
	}
}

// 获取入职历程
function getPersonalHistories() {
	OA_API.getPersonalHistories().then(res => {
		personalHistories.value = res
	})
}

// 获取个人档案
function getPersonalFile() {
	OA_API.getPersonalFile().then(res => {
		personalFile.value = res
		if (res.Id !== GUID) {
			isBindFile = true
		}
	})
}

// 绑定个人档案
function bindOAFile(key: string) {
	OA_API.bindPersonalFiles(key).then(res => {
		if (res.Status) {
			getPersonalFile
		}
	})
}

function toPasswordPage() {
	browserStore.navigate(PERSONAL_PASSWORD)
}

// 跳转个人档案页
function toPersonalFilePage() {
	if (!isBindFile) {
		ElMessageBox.prompt('账号未绑定档案，请输入身份证或手机号码查找绑定', '绑定个人档案', {
			confirmButtonText: '确定',
			cancelButtonText: '取消'
		}).then(({ value }) => {
			bindOAFile(value)
		})
	} else {
		browserStore.navigate(PERSONAL_FILE)
	}
}

onMounted(() => {
	getPersonalHistories()
	getPersonalFile()
})
</script>

<style lang="scss" scoped>
.personal-info {
	display: flex;
	flex-direction: column;
	background: #fff;
	border-radius: 20px;
	padding: 20px;
}

.top-box {
	display: flex;
	justify-content: space-between;
	margin-bottom: 20px;

	.header-box {
		display: flex;
	}

	.avatar-upload {
		position: relative;
	}

	.avatar-box {
		height: 100px;
		width: 100px;
	}

	.image-wrapper {
		background-color: rgba(229, 239, 255, 1);
		border-radius: 50%;
		height: 22px;
		width: 22px;
		position: absolute;
		right: 0;
		bottom: 0;

		.thumbnail {
			width: 16px;
			height: 16px;
			margin: 3px 0 0 3px;
			color: #409eff;
		}
	}

	.section-text {
		margin: 6px 0 0 21px;

		&-name {
			font-size: 1.25rem;
			font-weight: bold;
		}
	}

	.section-text-desc {
		display: flex;
		align-items: center;
		margin-top: 10px;

		.signature-label {
			display: block;
			white-space: nowrap;
		}

		:deep(.el-input__wrapper) {
			box-shadow: none;
		}

		:deep(input) {
			border: none;
			border-bottom: 1px solid #dcdfe6;
		}
	}

	.btn-box {
		display: flex;
		justify-content: right;
		gap: 40px;
		height: 20px;
	}
}

.info-box {
	display: flex;
	justify-content: space-between;

	.left-box {
		display: flex;
		flex-wrap: wrap;
		flex: 2.5;
		gap: 15%;
		background-color: rgba(247, 248, 252, 1);
		border-radius: 8px;
		padding: 20px 23px 14px 23px;
		font-size: 14px;
		font-weight: 400;
		line-height: 22px;
		white-space: nowrap;
	}

	.right-box {
		display: flex;
		justify-content: flex-end;
		gap: 30px;
		flex: 1;
		margin: 0 20px;
		align-items: center;

		.el-divider {
			height: 40px;
		}

		.col {
			margin-top: 10px;

			.text-top {
				font-size: 14px;
				font-weight: 400;
				margin-bottom: 5px;
				white-space: nowrap;
			}

			.text-num {
				font-size: 30px;
				white-space: nowrap;
				text-align: center;
			}
		}
	}
}

.time-box {
	padding: 25px 50px 0;

	img {
		width: 16px;
		height: 16px;
		margin-right: 6px;
	}

	.primary-box {
		display: flex;
		align-items: center;

		span {
			font-size: 14px;
			font-weight: 500;
			color: #354052;
			line-height: 22px;
		}
	}

	.success-box {
		font-size: 14px;
		font-weight: 400;
		color: #7f8fa4;
		line-height: 22px;

		:nth-child(1) {
			margin-right: 12px;
		}

		:nth-child(2) {
			color: #354052;
			margin-right: 5px;
		}

		:nth-child(3) {
			color: #409eff;
		}
	}

	:deep(.el-timeline-item__node--normal) {
		left: 0px;
		width: 10px;
		height: 10px;
	}

	:deep(.el-timeline-item__node--normal.el-timeline-item__node--success) {
		box-sizing: border-box;
		left: 0px;
		width: 10px;
		height: 10px;
		background: #ffffff;
		border: 2px solid #409eff;
	}
}
</style>