<template>
  <div>
    <el-upload ref="uploader" :class="[{ 'circle': round }, 'crop-uploader']" action='#' list-type="picture"
      :show-file-list="false" :auto-upload="false" :on-change="showCropper" :http-request="cropImage">
      <el-image v-if="imgUrl" :src="imgUrl"></el-image>
      <i v-else class="el-icon-plus crop-uploader-icon"></i>
    </el-upload>
    <el-dialog append-to-body :close-on-click-modal="false" :title="title" :visible.sync="dialogVisible">
      <div class="cropper-content">
        <!-- 裁剪框 -->
        <div class="cropper">
          <vue-cropper ref="cropper" :img="option.img" :outputSize="option.size" :outputType="option.outputType"
            :info="true" :full="option.full" :canMove="option.canMove" :canMoveBox="option.canMoveBox"
            :original="option.original" :autoCrop="option.autoCrop" :fixed="option.fixed" :canScale="option.canScale"
            :fixedNumber="option.fixedNumber" :centerBox="option.centerBox" :infoTrue="option.infoTrue"
            :fixedBox="option.fixedBox" @realTime="realTime"></vue-cropper>
          <div class="cropper-tool">
            <el-slider @input="changeScale"></el-slider>
            <el-button-group>
              <el-button type="text" @click="rotateLeft">
                <el-tooltip content="左转 90°" placement="bottom">
                  <font-awesome-icon fas icon="undo"></font-awesome-icon>
                </el-tooltip>
              </el-button>
              <el-button type="text" @click="rotateRight">
                <el-tooltip content="右转 90°" placement="bottom">
                  <font-awesome-icon fas icon="redo"></font-awesome-icon>
                </el-tooltip>
              </el-button>
            </el-button-group>
          </div>
        </div>
        <!-- 预览框 -->
        <div class="cropper-preview">
          <el-alert v-show="errMsg" show-icon :title="errMsg" type="error">
          </el-alert>
          <div>
            <h2>预览</h2>
          </div>
          <div :style="previews.div" :class="[{ 'circle': round }, 'preview']">
            <img :src="previews.url" :style="previews.img" />
          </div>
          <el-image v-show="!previews.url" :class="[{ 'circle': round }, 'preview-error']">
            <div slot="error" class="image-slot">
              <i class="el-icon-picture-outline"></i>
            </div>
          </el-image>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="upload">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// 图片裁剪上传
import { VueCropper } from 'vue-cropper'
export default {
  props: {
    imgUrl: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: '图片裁剪'
    },
    round: {
      type: Boolean,
      default: false
    },
    aspectRatio: {
      type: Array
    },
    maxSize: {
      type: Number,
      default: 512000
    }
  },
  data () {
    return {
      errMsg: '', //                    错误提示
      previews: {}, //                  实时预览
      sliderNum: 0, //                  滑块的数值
      dialogVisible: false,
      option: {
        circle: false, //               圆形裁剪（需要配合）fixedNumber设置比例为1：1
        img: '', //                     裁剪图片的地址/blob/base64
        info: true, //                  裁剪框的大小信息
        outputSize: 1, //               裁剪生成图片的质量
        outputType: 'jpeg', //          裁剪生成图片的格式
        canScale: true, //              图片是否允许滚轮缩放
        autoCrop: true, //              是否默认生成截图框
        fixedBox: false, //             固定截图框大小 不允许改变
        fixed: true, //                 是否开启截图框宽高固定比例
        fixedNumber: [16, 9], //        截图框的宽高比例
        full: true, //                  是否输出原图比例的截图
        canMoveBox: true, //            截图框能否拖动
        original: false, //             上传图片按照原始比例渲染
        centerBox: true, //             截图框是否被限制在图片里面
        infoTrue: true // true          为展示真实输出图片宽高 false 展示看到的截图框宽高
      }
    }
  },
  methods: {
    init () {
      // 圆形裁剪模式限制比例为1:1
      if (this.round) this.option.fixedNumber = [1, 1]
      if (this.aspectRatio) this.option.fixedNumber = this.aspectRatio
    },
    showCropper (file) {
      this.errMsg = ''
      this.dialogVisible = true
      this.option.img = file.url
      this.validateFileName(file.name)
    },
    validateFileName (filename) {
      if (!/\.(gif|jpg|jpeg|png|bmp)$/.test(filename.toLowerCase())) {
        this.errMsg = '图片格式错误!'
        return false
      }
      return true
    },
    rotateLeft () {
      this.$refs.cropper.rotateLeft()
    },
    rotateRight () {
      this.$refs.cropper.rotateRight()
    },
    changeScale (num) {
      let step = 0
      if (num < this.sliderNum) {
        // 左移
        step = -1
      } else {
        // 右移
        step = 1
      }
      this.$refs.cropper.changeScale(step)
      this.$nextTick(() => {
        this.sliderNum = num
      })
    },
    realTime (data) {
      // 实时预览
      this.previews = data
    },
    beforeUpload (file) {
      if (file.size > this.maxSize) {
        this.errMsg = '图片超出限制大小'
        return false
      }
      return true
    },
    cropImage (file) {
      this.$refs.cropper.getCropBlob((blob) => {
        if (this.beforeUpload(blob)) {
          this.$emit('upload', {
            file: blob,
            filename: file.file.name
          })
          this.dialogVisible = false
          this.$refs.uploader.clearFiles()
        }
      })
    },
    upload () {
      this.$refs.uploader.submit()
    }
  },
  created () {
    this.init()
  },
  components: { VueCropper }
}
</script>

<style lang="scss" scoped>
/deep/.crop-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  width: 180px;
  height: 180px;
  cursor: pointer;

  &:hover {
    border-color: #409EFF;
  }

  .el-upload {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    overflow: hidden;

    .crop-uploader-icon {
      font-size: 28px;
      color: #8c939d;
      text-align: center;
    }
  }
}

.circle {
  border-radius: 50%;
}

/deep/.crop-uploader.circle {
  .el-upload {
    border-radius: 50%;
  }
}

/deep/.cropper-content {
  display: flex;
  justify-content: flex-start;

  // 截图
  .cropper {
    flex: 1;
    width: 50%;
    width: 250px;
    height: 250px;
  }

  .cropper-preview {
    width: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-left: 10px;

    .preview {
      overflow: hidden;
    }

    .preview-error {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 50%;
      height: 50%;
      font-size: 24px;
      background-color: #f5f7fa;
    }
  }

  .cropper-tool {
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: 50px;

    .el-slider {
      flex: 1;
      line-height: 100%;
    }

    .el-button {
      margin-left: 10px;
    }
  }
}
</style>
