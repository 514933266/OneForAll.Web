<template>
	<el-container class="personal-file-page">
		<el-header class="header">
			<el-row type="flex" justify="space-between">
				<div class="title ofa-text-title">员工档案</div>
				<div class="button-box">
					<span v-if="disabled">
						<el-button round @click="disabled = false" type="primary">
							<font-awesome-icon fas icon="edit"></font-awesome-icon>&nbsp;编辑
						</el-button>
					</span>
					<span v-else>
						<el-button round @click="submit" type="primary">
							<font-awesome-icon fas icon="save"></font-awesome-icon>&nbsp;保存
						</el-button>
					</span>
				</div>
			</el-row>
		</el-header>
		<el-main class="content">
			<div class="person-box">
				<el-avatar :src="domain + entity?.IconUrl" fit="contain" class="person-icon">
					{{ getSubName(entity?.Name ?? '') }}
				</el-avatar>
				<div class="person-name">
					<label>{{ entity?.Name }}</label>
					<el-tag effect="dark" class="tag" style="margin-left: 4px"> {{ entity?.EmployeeType }}</el-tag>
				</div>
				<div v-for="item in entity?.Teams" :key="item.Name" class="person-team">
					<label>{{ item.Name }}</label>
					<el-tag effect="plain" class="tag" style="margin-left: 4px"> {{ item.Type }}</el-tag>
				</div>
			</div>
			<div v-for="fieldSetting in fieldSettings" :key="fieldSetting.Id">
				<el-form status-icon :model="fieldSetting" class="person-info-box" label-width="140px" :ref="setPersonFormRef">
					<el-divider content-position="left">{{ fieldSetting.Text }}</el-divider>
					<!-- 默认的分组字段 -->
					<div class="field-box">
						<el-form-item
							v-for="(field, fIndex) in fieldSetting.Fields"
							:key="field.Id"
							:label="field.Text"
							:rules="[
								{
									required: field.IsRequired,
									message: `请输入${field.Text}`,
									trigger: 'blur'
								}
							]"
							:prop="'Fields.' + fIndex + '.Value'"
						>
							<div v-show="disabled" class="field-item">
								<label v-if="field.Type === 0">{{ field.Value }}</label>
								<label v-if="field.Type === 3">{{ field.Value ? dayjs(field.Value).format('YYYY年MM月DD日') : '' }}</label>
								<label v-if="field.Type === 5 || field.Type === 6">{{
									getFieldSelectName(field.TypeDetails, field.Value)
								}}</label>
								<img
									v-if="field.Type === 7 && field.Value.length > 0"
									style="width: 200px; height: 100px"
									:src="`${domain}${field.Value}`"
								/>
								<span v-if="field.Type === 8">
									<font-awesome-icon fas :icon="field.Value === 'true' ? 'check-square' : 'square'"></font-awesome-icon>
								</span>
							</div>
							<div v-show="!disabled" class="field-item">
								<el-input v-if="field.Type === 0" v-model="field.Value" :placeholder="field.Placeholder"></el-input>
								<el-date-picker
									v-if="field.Type === 3"
									v-model="field.Value"
									type="date"
									:placeholder="field.Placeholder"
									value-format="YYYY-MM-DD"
								>
								</el-date-picker>
								<el-select v-if="field.Type === 5" :placeholder="field.Placeholder" v-model="field.Value">
									<el-option
										v-for="typeDetail in field.TypeDetails"
										:key="typeDetail.Value"
										:label="typeDetail.Name"
										:value="typeDetail.Value"
									></el-option>
								</el-select>
								<el-radio-group v-if="field.Type === 6" v-model="field.Value">
									<el-radio v-for="typeDetail in field.TypeDetails" :key="typeDetail.Value" :value="typeDetail.Value">
										{{ typeDetail.Name }}</el-radio
									>
								</el-radio-group>
								<el-upload
									v-if="field.Type === 7"
									:action="API.getPersonUploadFileUrl(entity.Id)"
									:headers="uploadHeaders"
									:show-file-list="false"
									:data="field"
									:before-upload="beforeFileUpload"
									:on-success="onUploadSuccess"
								>
									<el-button>选择文件</el-button>
								</el-upload>
								<el-image
									v-if="field.Type === 7 && field.Value"
									style="width: 200px; height: 100px; margin-top: 10px"
									:src="domain + field.Value"
								>
								</el-image>
								<el-tooltip
									v-if="field.Type === 8"
									class="item"
									effect="dark"
									:content="field.Placeholder ? field.Placeholder : field.Text"
									placement="top"
								>
									<el-checkbox v-model="field.Value" true-value="true" false-value="false"> </el-checkbox>
								</el-tooltip>
							</div>
						</el-form-item>
					</div>
					<!-- 追加的分组的字段 -->
					<div v-if="fieldSetting.IsGrouped">
						<div v-for="(group, gIndex) in fieldSetting.Groups" v-show="fieldSetting.IsGrouped" :key="gIndex" class="field-box">
							<el-divider></el-divider>
							<el-form-item
								v-for="(field, fIndex) in group.Fields"
								:key="field.Id"
								:label="field.Text"
								:rules="[
									{
										required: field.IsRequired,
										message: `请输入${field.Text}`,
										trigger: 'blur'
									}
								]"
								:prop="'Fields.' + fIndex + '.Value'"
							>
								<div v-show="disabled" class="field-item">
									<label v-if="field.Type === 0">{{ field.Value }}</label>
									<label v-if="field.Type === 3">{{ field.Value ? dayjs(field.Value).format('YYYY年MM月DD日') : '' }}</label>
									<label v-if="field.Type === 5 || field.Type === 6">{{
										getFieldSelectName(field.TypeDetails, field.Value)
									}}</label>
									<img
										v-if="field.Type === 7 && field.Value.length > 0"
										style="width: 200px; height: 100px"
										:src="`${domain}${field.Value}`"
									/>
									<span v-if="field.Type === 8">
										<font-awesome-icon fas :icon="field.Value === 'true' ? 'check-square' : 'square'"></font-awesome-icon>
									</span>
								</div>
								<div v-show="!disabled" class="field-item">
									<el-input v-if="field.Type === 0" v-model="field.Value" :placeholder="field.Placeholder"></el-input>
									<el-date-picker
										v-if="field.Type === 3"
										v-model="field.Value"
										type="date"
										:placeholder="field.Placeholder"
										value-format="YYYY-MM-DD"
									>
									</el-date-picker>
									<el-select v-if="field.Type === 5" :placeholder="field.Placeholder" v-model="field.Value">
										<el-option
											v-for="typeDetail in field.TypeDetails"
											:key="typeDetail.Value"
											:label="typeDetail.Name"
											:value="typeDetail.Value"
										></el-option>
									</el-select>
									<el-radio-group v-if="field.Type === 6" v-model="field.Value">
										<el-radio v-for="typeDetail in field.TypeDetails" :key="typeDetail.Value" :value="typeDetail.Value">
											{{ typeDetail.Name }}</el-radio
										>
									</el-radio-group>
									<el-upload
										v-if="field.Type === 7"
										:action="API.getPersonUploadFileUrl(entity.Id)"
										:headers="uploadHeaders"
										:data="field"
										:before-upload="beforeFileUpload"
										:on-success="onUploadSuccess"
									>
										<el-button>选择文件</el-button>
									</el-upload>
									<el-image
										v-if="field.Type === 7 && field.Value"
										style="width: 200px; height: 100px; margin-top: 10px"
										:src="domain + field.Value"
									>
									</el-image>
									<el-tooltip
										v-if="field.Type === 8"
										class="item"
										effect="dark"
										:content="field.Placeholder ? field.Placeholder : field.Text"
										placement="top"
									>
										<el-checkbox v-model="field.Value" true-value="true" false-value="false"> </el-checkbox>
									</el-tooltip>
								</div>
							</el-form-item>
							<div v-show="!disabled" class="group-del-button">
								<el-button link @click="removeSettingGroup(fieldSetting, gIndex)" type="danger">
									<font-awesome-icon fas icon="trash"></font-awesome-icon>&nbsp;删除该条
								</el-button>
							</div>
						</div>
						<el-button v-show="!disabled" @click="addSettingGroup(fieldSetting)" class="group-add-button ofa-text-grey">
							<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;添加
						</el-button>
					</div>
				</el-form>
			</div>
		</el-main>
	</el-container>
</template>

<script setup lang="ts">
import { ref, computed, onActivated } from 'vue'
import { dayjs, ElMessage, FormInstance } from 'element-plus'
import API from '@/apis/oa-api'
import { useTokenStore } from '@/stores/tokenStore'
import { IOAPersonFile } from '@/interfaces/oa/IOAPersonFile'
import { IOAPersonSetting } from '@/interfaces/oa/IOAPersonSetting'
import { IOAPersonSettingField } from '@/interfaces/oa/IOAPersonSetting'
import { IOAPersonSettingFieldTypeDetail } from '@/interfaces/oa/IOAPersonSetting'

interface IOAPersonSettingGroup extends IOAPersonSetting {
	Groups: IOAPersonSettingGroupItem[]
}
interface IOAPersonSettingGroupItem {
	Fields: IOAPersonSettingField[]
}

const tokenStore = useTokenStore()
const disabled = ref(true) // 允许编辑
const entity = ref<IOAPersonFile>(Object.assign({}))
const domain = ref(API.getHost())
const fieldSettings = ref<IOAPersonSettingGroup[]>([]) // 档案设置
// 档案表单
const personFormRefs = ref<FormInstance[]>([])
const setPersonFormRef = function (el: any) {
	if (el) {
		personFormRefs.value.push(el)
	}
}

// 上传token
const uploadHeaders = computed(() => {
	return { Authorization: `${tokenStore.bearToken}` }
})

onActivated(() => {
	get()
})

// 获取档案
function get() {
	API.getPerson(history.state.params.Id).then(res => {
		entity.value = res
		getSettings()
	})
}

// 获取档案设置
function getSettings() {
	API.getFieldSettings().then(res => {
		const data: IOAPersonSettingGroup[] = []
		res.forEach(e => {
			// 赋值
			e.Fields.forEach(field => {
				const item = entity.value?.ExtendInformations.find(w => w.Name === field.Name)
				if (item) {
					field.Value = item.Value
				}
			})
			const settingGroup: IOAPersonSettingGroup = Object.assign(e, {
				Groups: []
			})
			if (e.IsGrouped) {
				// 分组字段，需要重新组装
				e.Fields.forEach(field => {
					const reg = new RegExp(`^${field.Name}[0-9]`, 'g')
					const fields = entity.value?.ExtendInformations.filter(w => reg.test(w.Name))
					if (fields) {
						for (let i = 0; i < fields.length; i++) {
							const newField = Object.assign({}, field, fields[i])
							if (settingGroup.Groups[i]) {
								settingGroup.Groups[i].Fields.push(newField)
							} else {
								settingGroup.Groups.push({ Fields: [newField] })
							}
						}
					}
				})
			}
			data.push(settingGroup)
		})
		fieldSettings.value = data
	})
}

// 获取姓名第一个字
function getSubName(str: string) {
	return str && str.length > 0 ? str.substring(0, 1) : 'P'
}

// 获取下拉列表
function getFieldSelectName(typeDetails: IOAPersonSettingFieldTypeDetail[], value: string) {
	const item = typeDetails.find(w => w.Value === value)
	return item ? item.Name : ''
}

// 提交
function submit() {
	const validateForm = (form: FormInstance) => {
		return new Promise((resolve, reject) => {
			form.validate((valid: boolean) => {
				if (valid) {
					resolve('验证通过')
				} else {
					reject('验证失败')
				}
			})
		})
	}
	Promise.all(personFormRefs.value.map(item => validateForm(item))).then(() => {
		entity.value.ExtendInformations.length = 0 // 清理旧档案值
		fieldSettings.value.forEach(e => {
			e.Fields.forEach(e => {
				entity.value?.ExtendInformations.push({
					Name: e.Name,
					Value: e.Value
				})
			})
			if (e.IsGrouped && e.Groups) {
				e.Groups.forEach(group => {
					group.Fields.forEach(e => {
						entity.value?.ExtendInformations.push({
							Name: e.Name,
							Value: e.Value
						})
					})
				})
			}
		})
		update()
	})
}

// 更新
function update() {
	setExtendInformation()
	API.updatePerson(entity.value).then(res => {
		if (res.Status) {
			get()
			disabled.value = true
		}
	})
}

// 设置扩展信息值
function setExtendInformation() {
	fieldSettings.value.forEach(e => {
		e.Fields.forEach(field => {
			const item = entity.value?.ExtendInformations.find(w => w.Name === field.Name)
			if (item != null) {
				item.Value = field.Value
			} else {
				entity.value?.ExtendInformations.push({
					Name: field.Name,
					Value: field.Value
				})
			}
		})
	})
}

// 设置分组
function addSettingGroup(setting: IOAPersonSettingGroup) {
	const newItems: IOAPersonSettingField[] = []
	const seed = setting.Groups ? setting.Groups.length + 1 : 1
	if (seed > 8) {
		ElMessage.error('每个分组最多只能存在9条数据!')
		return
	}
	for (let i = 0; i < setting.Fields.length; i++) {
		const field = setting.Fields[i]
		const newField = Object.assign({}, field)
		newField.Name = newField.Name + seed
		newItems.push(newField)
	}
	if (setting.Groups) {
		setting.Groups.push({ Fields: newItems })
	} else {
		setting = Object.assign(setting, { Groups: [{ Fields: newItems }] })
	}
}

// 移除分组设置
function removeSettingGroup(setting: IOAPersonSettingGroup, gIndex: number) {
	setting.Groups.splice(gIndex, 1)
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
		fieldSettings.value.forEach(e => {
			const item = e.Fields.find(w => w.Id === res.Data.Field.Id)
			if (item) {
				item.Value = res.Data.Result.Url
			}
		})
	}
}
</script>

<style lang="scss" scoped>
.personal-file-page {
	.header {
		display: flex;
		align-items: center;
		background: #fff;

		.el-row {
			flex: 1;
			align-items: center;
		}

		.title {
			font-size: 1.5rem;
			font-weight: 600;
		}
	}

	.content {
		background: #fff;
	}
}

.person-box {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: #333;

	.person-icon {
		margin-right: 10px;
		border-radius: 50%;
		width: 90px;
		height: 90px;
		font-size: 1.75rem;
		background: rgba(27, 154, 247, 0.8);
		display: flex;
		justify-content: center;
		align-items: center;
		color: #fff;
	}

	.person-name {
		margin-top: 20px;
		font-size: 1.25rem;
		font-weight: bold;
	}

	.person-team {
		margin-top: 10px;
		font-size: 1rem;
	}

	.person-workage {
		margin-top: 10px;
		font-size: 1rem;
	}
}

.person-info-box {
	margin-top: 25px;
	display: flex;
	flex-direction: column;
}

.content {
	.el-divider__text {
		font-weight: bold;
		font-size: 1rem;
	}

	.field-box {
		display: flex;
		flex-wrap: wrap;

		img {
			width: 220px;
			height: 120px;
		}
	}

	:deep(.el-form-item) {
		width: 320px;

		.field-item,
		.el-input,
		.el-select {
			width: 100% !important;
		}
	}
}

.group-add-button {
	width: 100%;
	border-style: dashed;
}

.group-del-button {
	width: 100%;
	display: flex;
	justify-content: right;

	button {
		margin-right: 20px;
	}
}
</style>