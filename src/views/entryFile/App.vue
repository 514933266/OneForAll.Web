<template>
  <el-container class="container">
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
                <el-divider></el-divider>
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
import { ENTRY_FILE, ENTRY_FILE_RESULT } from '../../router/base-router'

// 员工入职登记填写
export default {
  name: ENTRY_FILE.name,
  data () {
    return {
      fieldTypeList: [
        { value: 0, label: '文本' },
        // { value: 1, label: '文本域（可输入多行文本）' },
        // { value: 2, label: '富文本（拥有更多丰富的文本内容，如图片、网页）' },
        { value: 3, label: '日期' },
        // { value: 4, label: '日期（含时间）' },
        { value: 5, label: '下拉选项' },
        { value: 6, label: 'Radio选项' },
        { value: 7, label: '附件' },
        { value: 8, label: 'Check选项' }
      ], // 字段类型
      employeeTypes: [
        { value: '全职', label: '全职' },
        { value: '实习生', label: '实习生' },
        { value: '兼职', label: '兼职' },
        { value: '劳务派遣', label: '劳务派遣' },
        { value: '退休返聘', label: '退休返聘' }
      ], // 员工类型
      employeeStatus: [
        { value: '正式员工', label: '正式员工' },
        { value: '试用员工', label: '试用员工' }
      ], // 员工状态
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
        this.get()
      }
    },
    get () {
      const id = this.$route.query.Id ? this.$route.query.Id : this.$route.query.id
      const url = this.$root.getApi(API.KEY, API.PERSONAL_ENTRY.URL) + '/' + id
      this.axios.get(url).then(response => {
        this.entity = { ExtendInformations: [], ...response }
        this.getFieldSettings()
      })
    },
    getFieldSettings () {
      const url = this.$root.getApi(API.KEY, API.PERSONAL_ENTRY.SETTING).replace(/{id}/, this.entity.Id)
      this.axios.get(url).then(response => {
        response.forEach(e => {
          if (e.IsGrouped) {
            // 分组字段，需要重新组装
            const firstField = e.Fields[0]
            const groupCount = this.entity.ExtendInformations.filter(w => w.Name.includes(firstField.Name)).length
            for (let index = 1; index < groupCount; index++) {
              const copyFields = JSON.parse(JSON.stringify(e.Fields))
              copyFields.forEach(e => { e.Name = e.Name + index })
              if (index === 1) {
                this.$set(e, 'Groups', [{ Fields: copyFields }])
              } else {
                e.Groups.push({ Fields: copyFields })
              }
            }
            if (e.Groups) {
              e.Groups.forEach(group => {
                group.Fields.forEach(field => {
                  const item = this.entity.ExtendInformations.find(w => w.Name === field.Name)
                  if (item != null) {
                    this.$set(field, 'Value', item.Value)
                  }
                })
              })
            }
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
      const url = this.$root.getApi(API.KEY, API.PERSONAL_ENTRY.UPLOAD_FILE.replace(/{id}/, this.entity.Id))
      this.axios.post(url, formData)
        .then(response => {
          if (response.Status) {
            this.$set(upload.data, 'Value', `${response.Data.Result.Url}`)
          }
        })
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
.container {
  background: #fff;
  height: 100%;
  width: 100%;

  .header {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #fff;
    font-size: 1.25rem;

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
