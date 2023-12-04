<template>
  <el-container class="ofa-container column">
    <el-header class="header">个人资料</el-header>
    <el-main class="content">
      <el-form ref="form" :model="entity" label-width="80px" class="info-form">
        <el-form-item label="登录账号" prop="Name">
          {{entity.UserName}}
        </el-form-item>
        <el-form-item label="所属机构">
          {{tenant.Name}}
        </el-form-item>
        <el-form-item label="昵称" prop="Name">
          <el-input v-model="entity.Name" size="small"></el-input>
        </el-form-item>
        <el-form-item label="个性签名" prop="Name">
          <el-input show-word-limit type="textarea" placeholder="写点什么吧..." v-model="entity.Signature" maxlength="300"
            size="small">
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="update" size="small">
            <font-awesome-icon fas icon="save"></font-awesome-icon>&nbsp;保存
          </el-button>
        </el-form-item>
      </el-form>
    </el-main>
  </el-container>
</template>

<script>
import API from '../../apis/base-api'
import { SET_USER } from '../../store/mutation-types'

export default {
  name: 'PersonalInfo',
  data () {
    return {
      loading: false, // 加载中
      entity: {}, // 实体
      tenant: this.$store.state.tenant // 所属机构
    }
  },
  computed: {
    domain () {
      return this.$root.getApiDomain(API.KEY)
    }
  },
  methods: {
    init () {
      this.entity = {
        ...this.$store.state.user,
        IconUrl: this.domain + this.$store.state.user.IconUrl
      }
    },
    uploadHeader (upload) {
      const formData = new FormData()
      const url = this.$root.getApi(API.KEY, API.PERSONAL.HEADER)
      formData.append('files', upload.file, upload.filename)
      this.axios.post(url, formData)
        .then(response => {
          if (response.Status) {
            this.$set(this.entity, 'IconUrl', `${this.domain}${response.Data.Result.Url}`)
            this.$store.commit(SET_USER, this.entity)
          }
        })
    },
    update () {
      const url = this.$root.getApi(API.KEY, API.PERSONAL.URL)
      this.axios.put(url, this.entity).then(response => {
        this.isUpdating = false
        if (response.Status) this.$store.commit(SET_USER, this.entity)
      })
    }
  },
  created () {
    this.init()
  }
}
</script>

<style lang="scss"scoped>
/deep/.info-form {

.el-form-item__label {
  color: #99a9bf;
}
}

.el-input,
.el-textarea {
  width: 300px;
}
</style>
