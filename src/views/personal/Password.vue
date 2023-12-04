<template>
  <el-container class="ofa-container column">
    <el-header class="header">修改密码</el-header>
    <el-main class="content">
      <el-form :model="entity" status-icon :rules="validationRules" ref="form" class="info-form" label-width="120px"
        size="small">
        <el-form-item label="旧密码" prop="old">
          <el-input :type="show.old ? 'text' : 'password'" v-model="entity.old" placeholder="请输入旧密码">
            <font-awesome-icon slot="prefix" fas :icon="show.old ? 'eye' : 'eye-slash'" @click="show.old = !show.old">
            </font-awesome-icon>
          </el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="new">
          <el-input :type="show.new ? 'text' : 'password'" v-model="entity.new" placeholder="请输入新密码"
            @change="checkPwdStrength">
            <font-awesome-icon slot="prefix" fas :icon="show.new ? 'eye' : 'eye-slash'" @click="show.new = !show.new">
            </font-awesome-icon>
          </el-input>
          <span class="pwd-strength-box" v-show="entity.strength > 0">
            <el-rate disabled show-text v-model="entity.strength" :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
              :texts="['弱', '中', '强', '很强']" :max="4">
            </el-rate>
          </span>
        </el-form-item>
        <el-form-item label="确认密码" prop="repeat">
          <el-input :type="show.repeat ? 'text' : 'password'" v-model="entity.repeat" placeholder="请确认密码">
            <font-awesome-icon slot="prefix" fas :icon="show.repeat ? 'eye' : 'eye-slash'"
              @click="show.repeat = !show.repeat"></font-awesome-icon>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submit" size="small">
            <font-awesome-icon fas icon="save"></font-awesome-icon>&nbsp;确定
          </el-button>
        </el-form-item>
      </el-form>
    </el-main>
  </el-container>
</template>

<script>
import md5 from 'js-md5'
import API from '../../apis/base-api'
import { LOGIN } from '../../router/base-router'
import { CLEAR_TOKEN } from '../../store/mutation-types'

export default {
  name: 'PersonalPassword',
  data () {
    const validatePassword = (rule, value, callback) => {
      if (value !== this.entity.new) {
        callback(new Error('两次输入密码不一致!'))
      } else if (this.entity.strength < 3) {
        callback(new Error('密码强度不足，请确保密码长度6位以上，且包含数字、字母组合!'))
      } else {
        callback()
      }
    }
    return {
      entity: {
        old: '',
        new: '',
        repeat: '',
        strength: 0
      },
      show: {
        old: false,
        new: false,
        repeat: false
      },
      validationRules: {
        old: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
        new: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '长度必须大于等于6', trigger: 'blur' }],
        repeat: [{ required: true, message: '请输入重复密码', trigger: 'blur' }, { validator: validatePassword, trigger: 'blur' }]
      }
    }
  },
  methods: {
    submit () {
      this.$refs.form.validate((valid) => {
        if (valid) {
          const url = this.$root.getApi(API.KEY, API.PERSONAL.PASSWORD)
          const password = { old: md5(this.entity.old), new: md5(this.entity.new), repeat: md5(this.entity.repeat) }
          this.axios.patch(url, password).then(response => {
            if (response.Status) this.logout()
          })
        }
      })
    },
    checkPwdStrength (value) {
      let level = 0
      if (value.length > 5) { level++ }
      if (/\d/.test(value)) { level++ }
      if (/[a-z]/.test(value)) { level++ }
      if (/[A-Z]/.test(value)) { level++ }
      if (/\W/.test(value)) { level++ }
      this.entity.strength = level
    },
    logout () {
      setTimeout(() => {
        this.$store.commit(CLEAR_TOKEN)
        this.$router.push(LOGIN)
      }, 3000)
    }
  }
}
</script>

<style lang="scss" scoped>
/deep/.info-form {

  .el-form-item__label {
    color: #99a9bf;
  }
}

.el-input {
  width: 250px;
}
</style>
