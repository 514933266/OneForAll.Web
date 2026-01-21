<template>
  <el-container class="ofa-container column">
    <el-header class="header"
      ><div class="title ofa-text-title">修改密码</div></el-header
    >
    <el-main class="content">
      <el-form
        :model="entity"
        status-icon
        :rules="validationRule"
        ref="pwdForm"
        class="password-form"
        label-width="120px"
      >
        <el-form-item label="旧密码" prop="OldPwd">
          <el-input
            show-password
            type="password"
            v-model="entity.OldPwd"
            placeholder="请输入旧密码"
          >
          </el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="NewPwd">
          <el-input
            show-password
            type="password"
            v-model="entity.NewPwd"
            placeholder="请输入新密码"
            @change="checkPwdStrength"
          >
          </el-input>
          <span class="pwd-strength-box">
            <el-rate
              disabled
              show-text
              v-model="entity.Strength"
              :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
              :texts="['弱', '中', '强', '很强']"
              :max="4"
            >
            </el-rate>
          </span>
        </el-form-item>
        <el-form-item label="确认密码" prop="Repeat">
          <el-input
            show-password
            type="password"
            v-model="entity.Repeat"
            placeholder="请确认密码"
          >
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submit">
            <font-awesome-icon fas icon="save"></font-awesome-icon>&nbsp;确定
          </el-button>
        </el-form-item>
      </el-form>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormRules } from 'element-plus'
import API from '@/apis/base-api'

interface IChangePwd {
  OldPwd: string
  NewPwd: string
  Repeat: string
  Strength: number
}

const pwdForm = ref()
const entity = ref<IChangePwd>({
  OldPwd: '',
  NewPwd: '',
  Repeat: '',
  Strength: 0
})

const validatePassword = (_rule: any, value: string, callback: any) => {
  if (value !== entity.value.NewPwd) {
    callback(new Error('两次输入密码不一致!'))
  } else if (entity.value.Strength < 3) {
    callback(
      new Error('密码强度不足，请确保密码长度6位以上，且包含数字、字母组合!')
    )
  } else {
    callback()
  }
}

const validationRule = reactive<FormRules<IChangePwd>>({
  OldPwd: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  NewPwd: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '长度必须大于等于6', trigger: 'blur' }
  ],
  Repeat: [
    { required: true, message: '请输入重复密码', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' }
  ]
})

// 检查密码强度
function checkPwdStrength(value: string) {
  let level = 0
  if (value.length > 5) {
    level++
  }
  if (/\d/.test(value)) {
    level++
  }
  if (/[a-z]/.test(value)) {
    level++
  }
  if (/[A-Z]/.test(value)) {
    level++
  }
  if (/\W/.test(value)) {
    level++
  }
  entity.value.Strength = level
}

// 提交
function submit() {
  pwdForm.value.validate((valid: boolean) => {
    if (valid) {
      API.changePwd(
        entity.value.OldPwd,
        entity.value.NewPwd,
        entity.value.Repeat
      )
    }
  })
}
</script>

<style lang="scss" scoped>
.title {
  font-size: 1.5rem;
  font-weight: 600;
}
.password-form {
  :deep(.el-form-item__label) {
    color: #99a9bf;
  }
}

.el-input {
  width: 250px;
}
</style>
