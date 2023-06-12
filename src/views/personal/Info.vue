<template>
  <div class="base-info-box">
    <div class="header">基础信息</div>
    <div class="content">
      <div class="user-icon">
        <crop-uploader round v-model="entity.IconUrl" @upload="uploadHeader"></crop-uploader>
        <div class="tips">点击上方修改头像</div>
      </div>
      <el-form ref="form" :model="entity" label-width="80px" class="info-form">
        <el-form-item label="登录账号" prop="Name">
          {{entity.UserName}}&nbsp;<el-button type="text" @click="isUpdating = true">修改资料</el-button>
        </el-form-item>
        <el-form-item label="所属机构">
          {{tenant.Name}}
        </el-form-item>
        <el-form-item label="昵称" prop="Name">
          <span v-if="!isUpdating">{{entity.Name}}</span>
          <el-input v-else v-model="entity.Name"></el-input>
        </el-form-item>
        <el-form-item label="个性签名" prop="Name">
          <span v-if="!isUpdating">{{entity.Signature}}
            <span v-show="!entity.Signature" class="tips">还没有自己的个性签名哟(*^▽^*)</span>
          </span>
          <el-input v-else show-word-limit type="textarea" placeholder="写点什么吧..." v-model="entity.Signature"
            maxlength="300">
          </el-input>
        </el-form-item>
        <el-form-item v-show="isUpdating">
          <el-button type="text" @click="isUpdating = false">取消</el-button>
          <el-button type="text" @click="update">保存</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
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
      isUpdating: false, // 修改中
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

<style lang="scss" scoped>
.base-info-box {
  .tips {
    color: #aaa;
  }

  .user-icon {
    padding-right: 1rem;
    text-align: center;
    width: 120px;

    /deep/.crop-uploader {
      width: 120px;
      height: 120px;
    }

    img {
      border-radius: 4px;
      width: 80px;
      height: 80px;
      border: 1px solid #ebeef5;
    }
  }

  /deep/.info-form {

    .el-form-item {
      margin-bottom: 0;
    }

    .el-form-item__label {
      font-size: .75rem;
      color: #99a9bf;
    }

    .el-form-item__content {
      font-size: .75rem;
    }

    .el-textarea {
      margin-top: 10px;
    }

    .el-textarea__inner {
      width: 450px;
      height: 150px;
    }
  }
}
</style>
