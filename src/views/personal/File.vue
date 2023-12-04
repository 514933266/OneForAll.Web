<template>
  <el-container v-loading="loading" class="ofa-container column">
    <el-header class="header">
      <el-row type="flex" justify="space-between">
        <div class="title ofa-text-title">人事档案</div>
        <div class="button-box">
          <span v-if="disabled">
            <el-button round @click="disabled = false" type="primary" size="small">
              <font-awesome-icon fas icon="edit"></font-awesome-icon>&nbsp;编辑
            </el-button>
          </span>
          <span v-else>
            <el-button round @click="submit" type="primary" size="small">
              <font-awesome-icon fas icon="save"></font-awesome-icon>&nbsp;保存
            </el-button>
            <el-button round v-show="!isAdd" @click="disabled = true" type="warning" size="small">
              <font-awesome-icon fas icon="reply"></font-awesome-icon>&nbsp;取消
            </el-button>
          </span>
        </div>
      </el-row>
    </el-header>
    <el-main class="content">
      <div class="person-box">
        <el-avatar :src="headerUrl" fit="contain" class="person-icon">
          {{getSubName(entity.Name)}}
        </el-avatar>
        <div class="person-name">
          <label>{{entity.Name}}</label>
          <el-tag effect="dark" class="tag" style="margin-left: 4px;" size="small">
            {{ entity.EmployeeType }}</el-tag>
        </div>
        <div v-for="item in entity.Teams" :key="item.Name" class="person-team">
          <label>{{item.Name}}</label>
          <el-tag effect="plain" class="tag" style="margin-left: 4px;" size="small">
            {{ item.Type }}</el-tag>
        </div>
        <div class="person-workage">
          <label class="ofa-text-grey">已在公司工作了{{ joinsDays }}天</label>
        </div>
      </div>
      <div class="person-info-box">
        <div v-for="fieldSetting in fieldSettings" :key="fieldSetting.Id">
          <el-divider content-position="left">{{fieldSetting.Text}}</el-divider>
          <el-form status-icon :model="fieldSetting" :disabled="disabled" class="form" label-width="140px"
            ref="personForm" size="small">
            <!-- 默认的分组字段 -->
            <div class="field-box">
              <el-form-item v-for="(field, fIndex) in fieldSetting.Fields" :key="field.Id"
                v-show="field.IsEmployeeVisiable"
                :rules="[{ required: field.IsRequired, message: `请输入${field.Text}`, trigger: 'blur' }]"
                :prop="'Fields.' + fIndex + '.Value'">
                <template slot="label">
                  <label>{{field.Text}}:</label>
                </template>
                <div v-show="disabled">
                  <label v-if="field.Type === 0">{{field.Value}}</label>
                  <label
                    v-if="field.Type === 3">{{ field.Value ? new Date(field.Value).toString('yyyy年MM月dd日'): '' }}</label>
                  <label
                    v-if="field.Type === 5 || field.Type === 6">{{ getFieldSelectName(field.TypeDetails, field.Value) }}</label>
                  <el-image v-if="field.Type === 7 && field.Value.length > 0" style="width: 100px; height: 100px"
                    :src="`${domain}${field.Value}`" :preview-src-list="[`${domain}${field.Value}`]" fit="contain">
                  </el-image>
                  <span v-if="field.Type === 8">
                    <font-awesome-icon fas :icon="(field.Value === 'true' ? 'check-square' : 'square')">
                    </font-awesome-icon>
                  </span>
                </div>
                <div v-show="!disabled">
                  <el-input v-if="field.Type === 0" v-model="field.Value" :disabled="!field.IsEmployeeEditable"
                    :placeholder="field.Placeholder" size="small">
                  </el-input>
                  <el-date-picker v-if="field.Type === 3" v-model="field.Value" :disabled="!field.IsEmployeeEditable"
                    type="date" :placeholder="field.Placeholder" value-format="yyyy-MM-dd" size="small">
                  </el-date-picker>
                  <el-select v-if="field.Type === 5" :disabled="!field.IsEmployeeEditable"
                    :placeholder="field.Placeholder" v-model="field.Value" size="small">
                    <el-option v-for="typeDetail in field.TypeDetails" :key="typeDetail.Value" :label="typeDetail.Name"
                      :value="typeDetail.Value"></el-option>
                  </el-select>
                  <el-radio-group v-if="field.Type === 6" v-model="field.Value" :disabled="!field.IsEmployeeEditable"
                    size="small">
                    <el-radio v-for="typeDetail in field.TypeDetails" :key="typeDetail.Value"
                      :label="typeDetail.Value.toString()">
                      {{typeDetail.Name}}</el-radio>
                  </el-radio-group>
                  <el-upload v-if="field.Type === 7" :disabled="!field.IsEmployeeEditable" action='#'
                    list-type="picture" :show-file-list="false" :http-request="uploadFile" :data="field"
                    :before-upload="beforeFileUpload" size="small">
                    <el-button>选择文件</el-button>
                  </el-upload>
                  <el-tooltip class="item" effect="dark" :content="field.Placeholder ? field.Placeholder : field.Text"
                    placement="top">
                    <el-checkbox v-if="field.Type === 8" v-model="field.Value" true-label="true" false-label="false"
                      size="small">
                    </el-checkbox>
                  </el-tooltip>
                </div>
              </el-form-item>
            </div>
            <!-- 追加的分组的字段 -->
            <div v-if="fieldSetting.IsGrouped">
              <div v-for="(group, gIndex) in fieldSetting.Groups" :key="group.id" class="field-box">
                <el-divider></el-divider>
                <el-form-item v-for="(field, fIndex) in group.Fields" :key="field.Id" v-show="field.IsEmployeeVisiable"
                  :rules="[{ required: field.IsRequired, message: `请输入${field.Text}`, trigger: 'blur' }]"
                  :prop="'Fields.' + fIndex + '.Value'">
                  <template slot="label">
                    <label>{{field.Text}}:</label>
                  </template>
                  <div v-show="disabled">
                    <label v-if="field.Type === 0">{{field.Value}}</label>
                    <label
                      v-if="field.Type === 3">{{ field.Value ? new Date(field.Value).toString('yyyy年MM月dd日'): '' }}</label>
                    <label
                      v-if="field.Type === 5 || field.Type === 6">{{ getFieldSelectName(field.TypeDetails, field.Value) }}</label>
                    <el-image v-if="field.Type === 7 && field.Value.length > 0" style="width: 100px; height: 100px"
                      :src="`${domain}${field.Value}`" :preview-src-list="[`${domain}${field.Value}`]" fit="contain">
                    </el-image>
                    <span v-if="field.Type === 8">
                      <font-awesome-icon fas :icon="(field.Value === 'true' ? 'check-square' : 'square')">
                      </font-awesome-icon>
                    </span>
                  </div>
                  <div v-show="!disabled">
                    <el-input v-if="field.Type === 0" v-model="field.Value" :disabled="!field.IsEmployeeEditable"
                      :placeholder="field.Placeholder" size="small"></el-input>
                    <el-date-picker v-if="field.Type === 3" v-model="field.Value" :disabled="!field.IsEmployeeEditable"
                      type="date" :placeholder="field.Placeholder" value-format="yyyy-MM-dd" size="small">
                    </el-date-picker>
                    <el-select v-if="field.Type === 5" :disabled="!field.IsEmployeeEditable"
                      :placeholder="field.Placeholder" v-model="field.Value" size="small">
                      <el-option v-for="typeDetail in field.TypeDetails" :key="typeDetail.Value"
                        :label="typeDetail.Name" :value="typeDetail.Value"></el-option>
                    </el-select>
                    <el-radio-group v-if="field.Type === 6" v-model="field.Value" :disabled="!field.IsEmployeeEditable"
                      size="small">
                      <el-radio v-for="typeDetail in field.TypeDetails" :key="typeDetail.Value"
                        :label="typeDetail.Value.toString()">
                        {{typeDetail.Name}}</el-radio>
                    </el-radio-group>
                    <el-upload v-if="field.Type === 7" :disabled="!field.IsEmployeeEditable" action='#'
                      list-type="picture" :show-file-list="false" :http-request="uploadFile" :data="field"
                      :before-upload="beforeFileUpload" size="small">
                      <el-button>选择文件</el-button>
                    </el-upload>
                    <el-tooltip class="item" effect="dark" :content="field.Placeholder ? field.Placeholder : field.Text"
                      placement="top">
                      <el-checkbox v-if="field.Type === 8" v-model="field.Value" true-label="true" false-label="false"
                        size="small">
                      </el-checkbox>
                    </el-tooltip>
                  </div>
                </el-form-item>
                <div v-show="!disabled" class="group-del-button">
                  <el-button @click="removeSettingGroup(fieldSetting, gIndex)" class="ofa-text-danger" type="text"
                    size="small">
                    <font-awesome-icon fas icon="trash"></font-awesome-icon>&nbsp;删除该条
                  </el-button>
                </div>
              </div>
              <el-button v-show="!disabled" @click="addSettingGroup(fieldSetting)"
                class="group-add-button ofa-text-grey" size="small">
                <font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;添加
              </el-button>
            </div>
          </el-form>
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<script>
import API from '../../apis/oa-api'
import BASE_API from '../../apis/base-api'
import { PERSONAL_FILE } from '../../router/base-router'
import { PERSON_FIELD_TYPE, PERSON_EMPLOYEE_TYPE, PERSON_EMPLOYEE_STATUS } from '../../assets/js/oa-const'

// 员工档案
export default {
  name: PERSONAL_FILE.name,
  data () {
    return {
      fieldTypeList: PERSON_FIELD_TYPE, // 字段类型
      employeeTypes: PERSON_EMPLOYEE_TYPE, // 员工类型
      employeeStatus: PERSON_EMPLOYEE_STATUS, // 员工状态
      loading: false, // 加载中
      disabled: true, // 禁止编辑
      entity: {}, // 实体
      fieldSettings: [] // 字段设置
    }
  },
  computed: {
    headerUrl () {
      return this.$root.getApiDomain(BASE_API.KEY) + this.entity.IconUrl
    },
    domain () {
      return this.$root.getApiDomain(API.KEY)
    },
    joinsDays () {
      if (this.entity.EntryDate) {
        var date1 = new Date()
        var date2 = new Date(this.entity.EntryDate)
        var timeDiff = Math.abs(date2.getTime() - date1.getTime())
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))
        return diffDays
      }
      return 0
    }
  },
  methods: {
    init () {
      if (!this.loading) {
        this.loading = true
        this.get()
      }
    },
    get () {
      const url = this.$root.getApi(API.KEY, API.PERSONAL_FILE.URL)
      this.axios.get(url).then(response => {
        this.entity = response
        this.loading = false
        this.getFieldSettings()
      })
    },
    getFieldSettings () {
      const url = this.$root.getApi(API.KEY, API.SETTING.URL)
      this.axios.get(url).then(response => {
        response.forEach(e => {
          if (e.IsGrouped) {
            // 分组字段，需要重新组装
            const groups = []
            e.Fields.forEach(field => {
              const reg = new RegExp(`^${field.Name}[0-9]`, 'g')
              const fields = this.entity.ExtendInformations.filter(w => reg.test(w.Name))
              for (var i = 0; i < fields.length; i++) {
                const newField = Object.assign({}, field, fields[i])
                if (groups[i]) {
                  groups[i].Fields.push(newField)
                } else {
                  groups.push({ Fields: [newField] })
                }
              }
            })
            this.$set(e, 'Groups', groups)
          }
          // 赋值
          e.Fields.forEach(field => {
            const item = this.entity.ExtendInformations.find(w => w.Name === field.Name)
            if (item != null) {
              this.$set(field, 'Value', item.Value)
            }
          })
        })
        this.fieldSettings = response
        this.loading = false
      })
    },
    getSubName (str) {
      return (str && str.length > 0) ? str.substring(0, 1) : 'P'
    },
    getFieldSelectName (typeDetails, value) {
      const item = typeDetails.find(w => w.Value === value)
      return item ? item.Name : ''
    },
    submit () {
      let isValid = true
      this.entity.ExtendInformations = []
      this.$refs.personForm.forEach(form => {
        form.validate((valid) => {
          if (!valid) isValid = false
        })
      })
      if (isValid) {
        this.fieldSettings.forEach(e => {
          const items = e.Fields.map(s => { return { Name: s.Name, Value: s.Value } })
          this.entity.ExtendInformations = this.entity.ExtendInformations.concat(items)
          if (e.IsGrouped && e.Groups) {
            let groupItems = []
            e.Groups.forEach(group => {
              groupItems = groupItems.concat(group.Fields.map(s => { return { Name: s.Name, Value: s.Value } }))
            })
            this.entity.ExtendInformations = this.entity.ExtendInformations.concat(groupItems)
          }
        })
        this.update()
      } else {
        this.$message.error('请先填写必要的信息')
      }
    },
    update () {
      this.setExtendInformation()
      const url = this.$root.getApi(API.KEY, API.PERSON.URL)
      this.axios.put(url, this.entity)
        .then(response => {
          if (response.Status) {
            this.get()
            this.disabled = true
          }
        })
    },
    setExtendInformation () {
      this.fieldSettings.forEach(e => {
        e.Fields.forEach(field => {
          const item = this.entity.ExtendInformations.find(w => w.Name === field.Name)
          if (item != null) {
            item.Value = field.Value
          } else {
            this.entity.ExtendInformations.push({ Name: field.Name, Value: field.Value })
          }
        })
      })
    },
    beforeFileUpload (file) {
      const isIMG = file.type === 'image/jpg' || file.type === 'image/jpeg' || file.type === 'image/png'
      if (!isIMG) {
        this.$message.error('上传图片只支持jpg、jpeg、png格式!')
      }
      const isLt = file.size / 1024 / 1024 <= 2
      if (!isLt) {
        this.$message.error('上传图片最大不能超过2MB')
      }
      return isIMG && isLt
    },
    uploadFile (upload) {
      const formData = new FormData()
      formData.append('files', upload.file, upload.file.name)
      const url = this.$root.getApi(API.KEY, API.PERSON.UPLOAD_FILE.replace(/{id}/, this.entity.Id))
      this.axios.post(url, formData)
        .then(response => {
          if (response.Status) {
            this.$set(upload.data, 'Value', `${response.Data.Result.Url}`)
          }
        })
    }
  },
  mounted () {
    this.init()
  }
}
</script>

<style lang="scss" scoped>
.ofa-container {
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
      margin-top: 20px;
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
    .form {
      margin-top: 40px;
    }

    .el-divider__text {
      font-weight: bold;
      font-size: 1rem;
    }

    .field-box {
      display: flex;
      flex-wrap: wrap;
    }

    /deep/ .el-form-item {
      width: 320px;
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
  </style>
