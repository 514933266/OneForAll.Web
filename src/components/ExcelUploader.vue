<template>
  <div class="excel-uploader">
    <el-alert type="error" v-show="errMsg">{{ errMsg }}</el-alert>
    <el-steps align-center :active="active" :finish-status="finishStatus">
      <el-step>
        <template #icon>
          <font-awesome-icon fas icon="file-download"></font-awesome-icon>
        </template>
        <template #title>
          <span @click="downTemplate" style="cursor: pointer">下载模板</span>
        </template>
      </el-step>
      <el-step>
        <template #icon>
          <font-awesome-icon fas icon="file-excel"></font-awesome-icon>
        </template>
        <template #title>
          <el-upload
            ref="uploaderRef"
            :action="uploadUrl"
            :auto-upload="false"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :on-change="change"
            :on-success="uploadSuccess"
            :on-error="uploadError"
            :headers="uploadHeaders"
          >
            选择文件
          </el-upload>
        </template>
      </el-step>
      <el-step>
        <template #icon>
          <font-awesome-icon fas icon="file-upload"></font-awesome-icon>
        </template>
        <template #title>
          <span @click="confirm" style="cursor: pointer">
            <font-awesome-icon
              v-show="uploading"
              fas
              icon="spinner"
              spin
            ></font-awesome-icon>
            {{ uploading ? '正在上传' : '确认上传' }}
          </span>
        </template>
      </el-step>
    </el-steps>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { UploadFile, UploadRawFile } from 'element-plus'
import { useTokenStore } from '../stores/tokenStore'

const props = defineProps({
  // 允许上传最大长度
  maxSize: {
    type: Number,
    default: 512000
  },
  // 模板下载地址
  templateUrl: {
    type: String,
    default: '#'
  },
  // 上传地址
  uploadUrl: {
    type: String,
    default: '#'
  }
})
const { maxSize, templateUrl } = props

const emit = defineEmits(['onSuccess'])

const tokenStore = useTokenStore()
const active = ref(1) // 当前激活的步骤
const errMsg = ref('') // 错误提示
const uploading = ref(false) // 上传中
const isMatch = ref(false) // 文件类型是否匹配
const hasDownloaded = ref(false) // 是否下载过模板
const hasFile = ref(false) // 是否已选择文件
const uploaderRef = ref() // 上传组件
// 结束状态
const finishStatus = computed(() => {
  switch (active.value) {
    case 1:
      if (hasDownloaded.value) return 'success'
      break
    case 2:
      return isMatch.value ? 'success' : 'error'
    case 3:
      return isMatch.value ? 'success' : 'error'
  }
  return 'finish'
})

// 上传token
const uploadHeaders = computed(() => {
  return { Authorization: `${tokenStore.bearToken}` }
})

// 下载模板
function downTemplate() {
  active.value = 1
  window.open(templateUrl)
}

// 更改上传文件
function change(file: UploadFile) {
  if (file) hasFile.value = true
  if (active.value === 1) selectFile()
}

// 更改上传文件
function selectFile() {
  active.value = 2
  isMatch.value = true
  errMsg.value = ''
}

// 确认上传
function confirm() {
  if (uploading.value) {
    setErrMessage('文件正在上传中，请稍后再试')
    return false
  }
  if (hasFile.value) {
    active.value = 3
    uploading.value = true
    uploaderRef.value.submit()
  }
  return false
}

// 上传前
function beforeUpload(file: UploadRawFile) {
  const isXLS = file.name.includes('xls')
  const isXLSX = file.name.includes('xlsx')
  if (!(isXLS && isXLSX)) {
    setErrMessage('只能导入xls或xlsx格式文件!')
    isMatch.value = false
  } else if ((file.size ?? 0) > maxSize) {
    setErrMessage(`只能导入小于${maxSize / 1024 / 100}MB的Excel文件`)
    isMatch.value = false
  } else {
    isMatch.value = true
  }
  if (!isMatch.value) uploading.value = false
  return isMatch.value
}

// 上传成功
function uploadSuccess(res: any) {
  uploading.value = false
  if (!res.Status) {
    isMatch.value = false
    active.value = 1
    uploaderRef.value.clearFiles()
    setErrMessage(`上传失败：${res.Message}`)
  }
  emit('onSuccess', res)
}

// 上传失败
function uploadError(error: Error) {
  setErrMessage(error.message)
}

// 显示错误消息
function setErrMessage(msg: string) {
  errMsg.value = msg
}
</script>

<style lang="scss" scoped>
.excel-uploader {
  .el-step {
    width: 100%;
    margin-top: 10px;
  }

  :deep(.el-step__title) {
    font-size: 0.75rem;
  }
}
</style>
