<template>
  <el-container class="entry-file-page">
    <el-header class="header"> {{ entity.Name }} - 入职信息登记 </el-header>
    <el-main class="content">
      <div v-for="fieldSetting in fieldSettings" :key="fieldSetting.Id">
        <el-form
          v-if="fieldSetting.Fields.length > 0"
          status-icon
          :model="fieldSetting"
          class="person-info-box"
          label-width="140px"
          :ref="setPersonFormRef"
        >
          <el-divider content-position="left">{{
            fieldSetting.Text
          }}</el-divider>
          <!-- 默认的分组字段 -->
          <div class="field-box">
            <el-form-item
              v-for="(field, fIndex) in fieldSetting.Fields"
              :key="field.Id"
              :rules="[
                {
                  required: field.IsRequired,
                  message: `请输入${field.Text}`,
                  trigger: 'blur'
                }
              ]"
              :prop="'Fields.' + fIndex + '.Value'"
            >
              <template #label>
                <label>{{ field.Text }}</label>
                <el-tooltip
                  v-if="field.Tips"
                  class="item"
                  effect="dark"
                  :content="field.Tips"
                  placement="top"
                >
                  <font-awesome-icon
                    fas
                    icon="info-circle"
                    style="margin-left: 2px"
                  >
                  </font-awesome-icon>
                </el-tooltip>
              </template>
              <el-input
                v-if="field.Type === 0"
                v-model="field.Value"
                :placeholder="field.Placeholder"
              ></el-input>
              <el-date-picker
                v-if="field.Type === 3"
                v-model="field.Value"
                type="date"
                :placeholder="field.Placeholder"
                value-format="YYYY-MM-DD"
              >
              </el-date-picker>
              <el-select
                v-if="field.Type === 5"
                :placeholder="field.Placeholder"
                v-model="field.Value"
              >
                <el-option
                  v-for="typeDetail in field.TypeDetails"
                  :key="typeDetail.Value"
                  :label="typeDetail.Name"
                  :value="typeDetail.Value"
                ></el-option>
              </el-select>
              <el-radio-group v-if="field.Type === 6" v-model="field.Value">
                <el-radio
                  v-for="typeDetail in field.TypeDetails"
                  :key="typeDetail.Value"
                  :value="typeDetail.Value.toString()"
                >
                  {{ typeDetail.Name }}</el-radio
                >
              </el-radio-group>
              <el-upload
                v-if="field.Type === 7"
                :action="API.getPersonalEntryFileUploadUrl(id)"
                :data="field"
                :show-file-list="false"
                :limit="1"
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
                <el-checkbox
                  v-model="field.Value"
                  true-value="true"
                  false-value="false"
                >
                </el-checkbox>
              </el-tooltip>
            </el-form-item>
          </div>
          <!-- 追加的分组的字段 -->
          <div v-if="fieldSetting.IsGrouped">
            <div
              v-for="(group, gIndex) in fieldSetting.Groups"
              :key="gIndex"
              class="field-box"
            >
              <el-divider></el-divider>
              <el-form-item
                v-for="(field, fIndex) in group.Fields"
                :key="field.Id"
                :rules="[
                  {
                    required: field.IsRequired,
                    message: `请输入${field.Text}`,
                    trigger: 'blur'
                  }
                ]"
                :prop="'Fields.' + fIndex + '.Value'"
              >
                <template #label>
                  <label>{{ field.Text }}</label>
                  <el-tooltip
                    class="item"
                    effect="dark"
                    :content="field.Tips"
                    placement="top"
                  >
                    <font-awesome-icon
                      v-show="field.Tips"
                      fas
                      icon="info-circle"
                      style="margin-left: 2px"
                    >
                    </font-awesome-icon>
                  </el-tooltip>
                </template>
                <el-input
                  v-if="field.Type === 0"
                  v-model="field.Value"
                  :placeholder="field.Placeholder"
                >
                </el-input>
                <el-date-picker
                  v-if="field.Type === 3"
                  v-model="field.Value"
                  type="date"
                  :placeholder="field.Placeholder"
                  value-format="YYYY-MM-DD"
                >
                </el-date-picker>
                <el-select
                  v-if="field.Type === 5"
                  :placeholder="field.Placeholder"
                  v-model="field.Value"
                >
                  <el-option
                    v-for="typeDetail in field.TypeDetails"
                    :key="typeDetail.Value"
                    :label="typeDetail.Name"
                    :value="typeDetail.Value"
                  ></el-option>
                </el-select>
                <el-radio-group v-if="field.Type === 6" v-model="field.Value">
                  <el-radio
                    v-for="typeDetail in field.TypeDetails"
                    :key="typeDetail.Value"
                    :value="typeDetail.Value.toString()"
                  >
                    {{ typeDetail.Name }}</el-radio
                  >
                </el-radio-group>
                <el-upload
                  v-if="field.Type === 7"
                  :action="API.getPersonalEntryFileUploadUrl(id)"
                  :data="field"
                  :show-file-list="false"
                  :limit="1"
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
              </el-form-item>
              <div class="group-del-button">
                <el-button
                  link
                  @click="removeSettingGroup(fieldSetting, gIndex)"
                  type="danger"
                >
                  <font-awesome-icon fas icon="trash"></font-awesome-icon
                  >&nbsp;删除该条
                </el-button>
              </div>
            </div>
            <el-button
              @click="addSettingGroup(fieldSetting)"
              class="group-add-button"
            >
              <font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;添加
            </el-button>
          </div>
        </el-form>
      </div>
    </el-main>
    <el-footer>
      <el-button type="primary" @click="submit">确认提交</el-button>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, FormInstance } from 'element-plus'
import { useRouter } from 'vue-router'
import API from '@/apis/oa-api'
import OAUTH_API from '@/apis/oauth-api'
import { useClientStore } from '@/stores/clientStore'
import { IOAPersonalEntryFile } from '@/interfaces/oa/IOAPersonalEntryFile'
import { IOAPersonSetting } from '@/interfaces/oa/IOAPersonSetting'
import { IOAPersonSettingField } from '@/interfaces/oa/IOAPersonSetting'

interface IOAPersonSettingGroup extends IOAPersonSetting {
  Groups: IOAPersonSettingGroupItem[]
}
interface IOAPersonSettingGroupItem {
  Fields: IOAPersonSettingField[]
}

const router = useRouter()
const clientStore = useClientStore()
const domain = ref(API.getHost())
const disabled = ref(true) // 允许编辑
const entity = ref<IOAPersonalEntryFile>(Object.assign({ Name: '' }))
const fieldSettings = ref<IOAPersonSettingGroup[]>([]) // 档案设置
// 档案表单
const personFormRefs = ref<FormInstance[]>([])
const setPersonFormRef = function (el: any) {
  if (el) {
    personFormRefs.value.push(el)
  }
}
// 入职档案id
const id = computed(() => {
  return router.currentRoute.value.query.Id?.toString() ?? ''
})

onMounted(() => {
  if (clientStore.oaApi) {
    get()
  } else {
    initGet()
  }
})

// 初始化客户端信息
function initGet() {
  OAUTH_API.getClient().then(res => {
    clientStore.setClient(res)
    get()
  })
}

// 获取个人档案
function get() {
  API.getPersonalEntryFile(id.value).then(res => {
    entity.value = res
    getSettings()
  })
}

// 获取档案设置
function getSettings() {
  API.getPersonalEntryFileSettings(id.value).then(res => {
    const data: IOAPersonSettingGroup[] = []
    res.forEach(e => {
      // 赋值
      e.Fields.forEach(field => {
        const item = entity.value?.ExtendInformations.find(
          w => w.Name === field.Name
        )
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
          const fields = entity.value?.ExtendInformations.filter(w =>
            reg.test(w.Name)
          )
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
        entity.value?.ExtendInformations.push({ Name: e.Name, Value: e.Value })
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
  API.updatePersonalEntryFile(entity.value).then(res => {
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
      const item = entity.value?.ExtendInformations.find(
        w => w.Name === field.Name
      )
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
function removeSettingGroup(setting: any, gIndex: number) {
  setting.Groups.splice(gIndex, 1)
}

// 图片校验
function beforeFileUpload(file: any) {
  const isIMG =
    file.type === 'image/jpg' ||
    file.type === 'image/jpeg' ||
    file.type === 'image/png'
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
.entry-file-page {
  .header {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #fff;
    font-size: 1.5rem;
    font-weight: 600;
    .el-row {
      flex: 1;
      align-items: center;
    }
  }
}

.el-footer {
  text-align: center;
}

.person-info-box {
  margin-top: 25px;
  display: flex;
  flex-direction: column;
}

.content {
  .field-box {
    display: flex;
    flex-wrap: wrap;
  }

  :deep(.el-form-item) {
    width: 320px;

    .el-select,
    .el-input {
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

.upload-content-box {
  display: flex;
  flex-direction: column;
}
</style>
