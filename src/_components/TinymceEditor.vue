<template>
  <div class="tinymce-editor">
    <editor v-model="myValue" :init="init" :disabled="disabled"></editor>
  </div>
</template>

<script>
// tinymce富文本编辑器封装组件
import tinymce from 'tinymce/tinymce'
import Editor from '@tinymce/tinymce-vue'
import 'tinymce/themes/silver'
import 'tinymce/icons/default/icons' // 图标
import 'tinymce/plugins/advlist' // 扩展了原生核心bullist和numlist工具栏控件。
import 'tinymce/plugins/anchor' // 添加作者信息
import 'tinymce/plugins/autolink' // 自动创建超链接,补全www.example.com为http://www.example.com
// import 'tinymce/plugins/autoresize' // 自适应内容高度，可以拖拽文本框大小
import 'tinymce/plugins/autosave' // 自动保存
import 'tinymce/plugins/charmap' // unicode特殊符号，通过配置charmap: [[0x2615, 'morning coffee']] 或 charmap_append: [[0x2600, 'sun'],[0x2601, 'cloud']] 来设置或追加
import 'tinymce/plugins/code' // 编辑源代码
import 'tinymce/plugins/codesample' // 代码输入
import 'tinymce/plugins/emoticons' // 表情
import 'tinymce/plugins/fullpage' // 允许用户编辑某些元数据和文档属性，如标题、关键字和描述
import 'tinymce/plugins/fullscreen' // 全屏编辑功能
import 'tinymce/plugins/hr' // 水平线
import 'tinymce/plugins/image' // 图片
// import 'tinymce/plugins/imagetools' // 图片工具
import 'tinymce/plugins/insertdatetime' // 日期时间
import 'tinymce/plugins/link' // 外链
import 'tinymce/plugins/lists' // 排序
// import 'tinymce/plugins/media' // 向可编辑区域添加HTML5视频和音频元素
import 'tinymce/plugins/pagebreak' // 允许用户在可编辑区域中插入分页符
import 'tinymce/plugins/preview' // 预览
import 'tinymce/plugins/print' // 打印
// import 'tinymce/plugins/paste' // 粘贴
// import 'tinymce/plugins/save' // 保存
import 'tinymce/plugins/searchreplace' // 查找和替换
import 'tinymce/plugins/table' // 表格
import 'tinymce/plugins/template' // 模板 templates: [{title: 'Some title 1', description: 'Some desc 1', content: 'Mine content'},]
import 'tinymce/plugins/wordcount'

export default {
  props: {
    value: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    toolbar: {
      type: [String, Array],
      default:
      `undo redo | 
      fontselect fontsizeselect formatselect | 
      bold italic underline strikethrough forecolor backcolor charmap emoticons | 
      alignleft aligncenter alignright alignjustify | 
      bullist numlist link hr | 
      image table codesample pagebreak | 
      searchreplace code | 
      removeformat fullscreen`
    },
    maxImageSize: {
      type: Number,
      default: 512000 // 图片最大500KB
    },
    imageTypes: {
      type: Array,
      default: () => { return ['image/jpeg', 'image/png', 'image/gif'] }
    }
  },
  data () {
    return {
      init: {
        language_url: '../tinymce/langs/zh_CN.js',
        language: 'zh_CN',
        skin_url: '../tinymce/skins/ui/oxide', // 皮肤
        paste_data_images: true, // 允许粘贴图像
        branding: false, // 去水印
        font_formats: `
        微软雅黑=微软雅黑;
        宋体=宋体;
        黑体=黑体;
        仿宋=仿宋;
        楷体=楷体;
        隶书=隶书;
        幼圆=幼圆;
        Andale Mono=andale mono,times;
        Arial=arial, helvetica,
        sans-serif;
        Arial Black=arial black, avant garde;
        Book Antiqua=book antiqua,palatino;
        Comic Sans MS=comic sans ms,sans-serif;
        Courier New=courier new,courier;
        Georgia=georgia,palatino;
        Helvetica=helvetica;
        Impact=impact,chicago;
        Symbol=symbol;
        Tahoma=tahoma,arial,helvetica,sans-serif;
        Terminal=terminal,monaco;
        Times New Roman=times new roman,times;
        Trebuchet MS=trebuchet ms,geneva;
        Verdana=verdana,geneva;
        Webdings=webdings;
        Wingdings=wingdings,zapf dingbats`,
        fontsize_formats: '9px 10px 12px 13px 14px 16px 18px 21px 24px 28px 32px 36px',
        height: 500,
        // 功能插件：/node_modules/tinymce/plugins/
        plugins: ['advlist', 'anchor', 'autolink',
          // 'autoresize',
          'autosave', 'charmap', 'code',
          'codesample',
          // 'emoticons',
          'fullpage', 'fullscreen', 'hr', 'image',
          // 'imagetools',
          'insertdatetime', 'link', 'lists',
          // 'media',
          'pagebreak', 'preview', 'print', 'paste',
          // 'save',
          'searchreplace', 'table', 'template', 'wordcount'
        ],
        // 工具栏
        toolbar: this.toolbar,
        // 颜色选择
        color_map: [
          '000000', 'Black', '993300', 'Burnt orange', '333300', 'Dark olive',
          '003300', 'Dark green', '003366', 'Dark azure', '000080', 'Navy Blue',
          '333399', 'Indigo', '333333', 'Very dark gray', '800000', 'Maroon',
          'FF6600', 'Orange', '808000', 'Olive', '008000', 'Green',
          '008080', 'Teal', '0000FF', 'Blue', '666699', 'Grayish blue',
          '808080', 'Gray', 'FF0000', 'Red', 'FF9900', 'Amber',
          '99CC00', 'Yellow green', '339966', 'Sea green', '33CCCC', 'Turquoise',
          '3366FF', 'Royal blue', '800080', 'Purple', '999999', 'Medium gray',
          'FF00FF', 'Magenta', 'FFCC00', 'Gold', 'FFFF00', 'Yellow', '00FF00', 'Lime',
          '00FFFF', 'Aqua', '00CCFF', 'Sky blue', '993366', 'Red violet',
          'FFFFFF', 'White', 'FF99CC', 'Pink', 'FFCC99', 'Peach',
          'FFFF99', 'Light yellow', 'CCFFCC', 'Pale green',
          'CCFFFF', 'Pale cyan', '99CCFF', 'Light sky blue', 'CC99FF', 'Plum'
        ],
        // 图片
        images_upload_handler: (blobInfo, success, failure) => {
          const blob = blobInfo.blob()
          if (this.validateImage(blob, failure)) {
            this.$emit('uploadImage', {
              file: blob,
              filename: blob.name,
              success: success,
              failure: failure
            })
          }
        }
      },
      myValue: this.value
    }
  },
  watch: {
    value (newValue) {
      this.myValue = newValue
      this.initEditor()
    },
    myValue (newValue) {
      this.$emit('input', newValue)
    }
  },
  methods: {
    initEditor () {
      tinymce.init({})
    },
    validateImage (blob, failure) {
      const isInType = this.imageTypes.find(w => w === blob.type) !== undefined
      const isInLimit = blob.size < this.maxImageSize
      if (!isInType) {
        failure('图片只能是 JPG/PNG/GIF 格式!')
      }
      if (!isInLimit) {
        failure(`图片大小不能超过${this.maxImageSize / 1024}KB!`)
      }
      return isInType && isInLimit
    },
    // 光标插入文本
    insertText (insertText) {
      tinymce.execCommand('mceInsertContent', false, insertText)
    }
  },
  mounted () {
    this.myValue = this.value
    this.initEditor()
  },
  components: { Editor }
}

</script>
