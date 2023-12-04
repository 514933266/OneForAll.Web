<template>
  <el-container class="ofa-container column">
    <el-header class="header">
      {{entity.Name}} - 入职信息登记
    </el-header>
    <el-main class="content">
      <div class="person-info-box">
        <div v-for="fieldSetting in fieldSettings" :key="fieldSetting.Id">
          <el-divider content-position="left">{{fieldSetting.Text}}</el-divider>
          <el-form status-icon :model="fieldSetting" class="form" label-width="140px" size="mini"
            ref="personForm">
            <!-- 默认的分组字段 -->
            <div class="field-box">
              <el-form-item v-for="field in fieldSetting.Fields" :key="field.Id"
                :rules="[{ required: field.IsRequired, message: `请输入${field.Text}`, trigger: 'blur' }]">
                <template slot="label">
                  <label>{{field.Text}}</label>
                  <el-tooltip class="item" effect="dark" :content="field.Tips" placement="top">
                    <font-awesome-icon v-show="field.Tips" fas icon="info-circle" style="margin-left:2px;">
                    </font-awesome-icon>
                  </el-tooltip>
                </template>
                <div>
                  <el-input v-if="field.Type === 0" v-model="field.Value" :placeholder="field.Placeholder"></el-input>
                  <el-date-picker v-if="field.Type === 3" v-model="field.Value" type="date"
                    :placeholder="field.Placeholder" value-format="yyyy-MM-dd">
                  </el-date-picker>
                  <el-select v-if="field.Type === 5" :placeholder="field.Placeholder" v-model="field.Value">
                    <el-option v-for="typeDetail in field.TypeDetails" :key="typeDetail.Value" :label="typeDetail.Name"
                      :value="typeDetail.Value"></el-option>
                  </el-select>
                  <el-radio-group v-if="field.Type === 6" v-model="field.Value">
                    <el-radio v-for="typeDetail in field.TypeDetails" :key="typeDetail.Value"
                      :label="typeDetail.Value.toString()">
                      {{typeDetail.Name}}</el-radio>
                  </el-radio-group>
                  <el-upload v-if="field.Type === 7" action='#' list-type="picture" show-file-list="false"
                    :http-request="uploadFile" :data="field" :before-upload="beforeFileUpload">
                    <el-button size="mini">选择文件</el-button>
                  </el-upload>
                  <el-tooltip class="item" effect="dark" :content="field.Placeholder ? field.Placeholder : field.Text"
                    placement="top">
                    <el-checkbox v-if="field.Type === 8" v-model="field.Value" true-label="true" false-label="false">
                    </el-checkbox>
                  </el-tooltip>
                </div>
              </el-form-item>
            </div>
            <!-- 追加的分组的字段 -->
            <div v-if="fieldSetting.IsGrouped">
              <div v-for="(group, gIndex) in fieldSetting.Groups" :key="group.id" class="field-box">
                <el-divider v-if="gIndex > 0"></el-divider>
                <el-form-item v-for="field in group.Fields" :key="field.Id"
                  :rules="[{ required: field.IsRequired, message: `请输入${field.Text}`, trigger: 'blur' }]">
                  <template slot="label">
                    <label>{{field.Text}}</label>
                    <el-tooltip class="item" effect="dark" :content="field.Tips" placement="top">
                      <font-awesome-icon v-show="field.Tips" fas icon="info-circle" style="margin-left:2px;">
                      </font-awesome-icon>
                    </el-tooltip>
                  </template>
                  <div>
                    <el-input v-if="field.Type === 0" v-model="field.Value" :placeholder="field.Placeholder">
                    </el-input>
                    <el-date-picker v-if="field.Type === 3" v-model="field.Value" type="date"
                      :placeholder="field.Placeholder" value-format="yyyy-MM-dd">
                    </el-date-picker>
                    <el-select v-if="field.Type === 5" :placeholder="field.Placeholder" v-model="field.Value">
                      <el-option v-for="typeDetail in field.TypeDetails" :key="typeDetail.Value"
                        :label="typeDetail.Name" :value="typeDetail.Value"></el-option>
                    </el-select>
                    <el-radio-group v-if="field.Type === 6" v-model="field.Value">
                      <el-radio v-for="typeDetail in field.TypeDetails" :key="typeDetail.Value"
                        :label="typeDetail.Value.toString()">
                        {{typeDetail.Name}}</el-radio>
                    </el-radio-group>
                    <el-upload v-if="field.Type === 7" action='#' list-type="picture" show-file-list="false"
                      :http-request="uploadFile" :data="field" :before-upload="beforeFileUpload">
                      <el-button size="mini">选择文件</el-button>
                    </el-upload>
                  </div>
                </el-form-item>
                <div class="group-del-button">
                  <el-button @click="removeSettingGroup(fieldSetting, gIndex)" class="ofa-text-danger" type="text">
                    <font-awesome-icon fas icon="trash"></font-awesome-icon>&nbsp;删除该条
                  </el-button>
                </div>
              </div>
              <el-button @click="addSettingGroup(fieldSetting)"
                class="group-add-button ofa-text-grey" size="mini">
                <font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;添加
              </el-button>
            </div>
          </el-form>
        </div>
      </div>
    </el-main>
    <el-footer>
      <el-button type="primary" @click="submit">确认提交</el-button>
    </el-footer>
  </el-container>
</template>

<script>
import API from '../../apis/oa-api'
import SYS_API from '../../apis/sys-api'
import { ENTRY_FILE, ENTRY_FILE_RESULT } from '../../router/base-router'
import { SET_CLIENT } from '../../store/mutation-types'
import { PERSON_FIELD_TYPE, PERSON_EMPLOYEE_TYPE, PERSON_EMPLOYEE_STATUS } from '../../assets/js/oa-const'

// 员工入职登记填写
export default {
  name: ENTRY_FILE.name,
  data () {
    return {
      fieldTypeList: PERSON_FIELD_TYPE, // 字段类型
      employeeTypes: PERSON_EMPLOYEE_TYPE, // 员工类型
      employeeStatus: PERSON_EMPLOYEE_STATUS, // 员工状态
      loading: false, // 加载中
      entity: { ExtendInformations: [] }, // 实体
      fieldSettings: [] // 字段设置
    }
  },
  computed: {
    domain () {
      return this.$root.getApiDomain(API.KEY)
    }
  },
  methods: {
    init () {
      if (!this.loading) {
        this.loading = true
        // 由于架构配置，需要先拿到client的host列表
        if (this.$store.getters.client && this.$store.getters.client.OAuthClientId) {
          this.get()
        } else {
          this.getClient()
        }
      }
    },
    getClient () {
      this.axios.get(SYS_API.WEBSITE_SETTING_RESOURCE.URL)
        .then(response => {
          this.$store.commit(SET_CLIENT, response)
          this.get()
        })
    },
    get () {
      const id = this.$route.query.Id ? this.$route.query.Id : this.$route.query.id
      const url = this.$root.getApi(API.KEY, API.PERSONAL_ENTRY.URL) + '/' + id
      this.axios.get(url).then(response => {
        this.entity = { ExtendInformations: [], ...response }
        this.getFieldSettings(id)
      })
    },
    getFieldSettings (id) {
      const url = this.$root.getApi(API.KEY, API.PERSONAL_ENTRY.SETTING).replace(/{id}/, id)
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
      const url = this.$root.getApi(API.KEY, API.PERSONAL_ENTRY.URL)
      this.axios.put(url, this.entity)
        .then(response => {
          if (response.Status) {
            this.toResultPage()
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
      const isLt = file.size / 1024 / 1024 <= 1
      if (!isLt) {
        this.$message.error('上传图片最大不能超过1MB')
      }
      return isIMG && isLt
    },
    uploadFile (upload) {
      const formData = new FormData()
      formData.append('files', upload.file, upload.file.name)
      const url = this.$root.getApi(API.KEY, API.PERSONAL_ENTRY.UPLOAD_FILE(this.entity.Id))
      this.axios.post(url, formData)
        .then(response => {
          if (response.Status) {
            this.$set(upload.data, 'Value', `${response.Data.Result.Url}`)
          }
        })
    },
    addSettingGroup (setting) {
      const newItems = []
      const seed = setting.Groups ? setting.Groups.length + 1 : 1
      if (seed > 8) {
        this.$message.error('每个分组最多只能存在9条数据!')
        return
      }
      for (var i = 0; i < setting.Fields.length; i++) {
        const field = setting.Fields[i]
        const newField = Object.assign({}, field)
        newField.Name = newField.Name + seed
        newItems.push(newField)
      }
      if (setting.Groups) {
        setting.Groups.push({ Fields: newItems })
      } else {
        this.$set(setting, 'Groups', [{ Fields: newItems }])
      }
    },
    removeSettingGroup (setting, gIndex) {
      setting.Groups.splice(gIndex, 1)
    },
    toResultPage () {
      this.$router.push(ENTRY_FILE_RESULT)
    }
  },
  created () {
    this.init()
  }
}
</script>

<style lang="scss" scoped>
.ofa-container {
  background: #fff;
  height: 100%;
  width: 100%;

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

  .content {
    margin-top: 20px;
    background: #fff;
  }

  .el-footer {
    text-align: center;
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
