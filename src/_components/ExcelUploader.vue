<template>
  <div class="excel-uploader">
    <el-alert title="错误" type="error" v-show="errMsg">{{errMsg}}</el-alert>
    <el-steps align-center :active="active" :finish-status="finishStatus">
      <el-step>
        <div slot="icon">
          <font-awesome-icon fas icon="file-download"></font-awesome-icon>
        </div>
        <div slot="title" @click="downTemplate">
          <span style="cursor: pointer;">下载模板</span>
        </div>
      </el-step>
      <el-step>
        <div slot="icon">
          <font-awesome-icon fas icon="file-excel"></font-awesome-icon>
        </div>
        <div slot="title">
          <el-upload ref="uploader" action='#' :auto-upload="false" :http-request="upload" :show-file-list="false"
            :on-change="change" @click="clearFiles">
            选择文件
          </el-upload>
        </div>
      </el-step>
      <el-step>
        <div slot="icon">
          <font-awesome-icon fas icon="file-upload"></font-awesome-icon>
        </div>
        <div slot="title" @click="confirm">
          <span style="cursor: pointer;">
            <font-awesome-icon v-show="uploading" fas icon="spinner" spin></font-awesome-icon>
            {{uploading ? '正在上传' : '确认上传'}}
          </span>
        </div>
      </el-step>
    </el-steps>
  </div>
</template>

<script>
export default {
  name: 'ExcelUploader',
  props: {
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
    // 是否上传中
    uploading: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      active: 1, // 当前激活的步骤
      errMsg: '', // 错误提示
      hasDownloaded: false, // 是否下载过模板
      isMatch: true // 是否合法文件
    }
  },
  computed: {
    finishStatus () {
      switch (this.active) {
        case 1: if (this.hasDownloaded) return 'success'; break
        case 2: return this.isMatch ? 'success' : 'error'
        case 3: return 'success'
      }
      return 'finish'
    },
    hasFile () {
      return this.$refs.uploader.uploadFiles.length > 0
    }
  },
  methods: {
    downTemplate () {
      this.active = 1
      window.open(this.templateUrl)
    },
    clearFiles () {
      this.$refs.uploader.clearFiles()
    },
    change (file, files) {
      this.errMsg = ''
      this.isMatch = false
      this.active = 1
      if (this.beforeUpload(file)) {
        this.isMatch = true
      }
      this.$nextTick(() => { this.active = 2 })
    },
    confirm () {
      if (this.uploading) {
        this.setErrMessage('文件正在上传中，请稍后再试')
        return false
      }
      if (this.hasFile) {
        this.active = 3
        this.$refs.uploader.submit()
        this.$refs.uploader.clearFiles()
      } else {
        this.setErrMessage('请先选择文件')
        this.isMatch = false
        this.$nextTick(() => { this.active = 2 })
      }
    },
    beforeUpload (file) {
      const isXLS = file.name.substr(file.name.lastIndexOf('.')) === '.xls'
      const isXLSX = file.name.substr(file.name.lastIndexOf('.')) === '.xlsx'
      if (!isXLS && !isXLSX) {
        this.setErrMessage('只能导入xls或xlsx格式文件!')
        return false
      }
      if (file.size > this.maxSize) {
        this.setErrMessage(`只能导入小于${this.maxSize / 1024 / 100}MB的Excel文件`)
        return false
      }
      return true
    },
    upload (data) {
      this.$emit('upload', {
        file: data.file,
        filename: data.file.name
      })
    },
    setErrMessage (msg) {
      this.errMsg = msg
      setTimeout(() => {
        this.errMsg = ''
      }, 5000)
    },
    uploadError (msg) {
      this.setErrMessage(msg)
    }
  }
}
</script>

<style lang="scss" scoped>
.excel-uploader {
  .el-step {
    width: 100%;
    margin-top: 10px;
  }

  /deep/ .el-step__title {
    font-size: .75rem;
  }
}
</style>
