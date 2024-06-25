<template>
  <main class="ofa-tinymce-editor">
    <Editor v-model="model" :init="init" :disabled="disabled" ref="editorRef" />
  </main>
</template>

<script lang="ts" setup>
import { ref, reactive, defineProps, defineModel, defineEmits } from 'vue'
import Editor from '@tinymce/tinymce-vue'
//引入tinymce开启本地模式
import 'tinymce/tinymce'
//引入图标和主题等
import 'tinymce/themes/silver/theme'
import 'tinymce/icons/default/icons'
// import 'tinymce/models/dom'

//引入插件
import 'tinymce/plugins/codesample'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/advlist'
import 'tinymce/plugins/link'
import 'tinymce/plugins/autolink'
import 'tinymce/plugins/charmap'
import 'tinymce/plugins/emoticons'
import 'tinymce/plugins/fullscreen'
import 'tinymce/plugins/preview'
import 'tinymce/plugins/code'
import 'tinymce/plugins/searchreplace'
import 'tinymce/plugins/table'
import 'tinymce/plugins/visualblocks'
import 'tinymce/plugins/wordcount'
import 'tinymce/plugins/insertdatetime'
import 'tinymce/plugins/image'

const editorRef = ref(null)
const model = defineModel()
const props = defineProps({
  disabled: Boolean,
  toolbar: Array,
  plugins: String,
  minHeight: Number
})
const { disabled, toolbar, plugins, minHeight } = props
const emit = defineEmits(['upload'])

const init = reactive({
  // 选择器
  selector: 'textarea',
  // 设置本地主题
  skin_url: '/tinymce/skins/ui/oxide',
  // 设置本地css
  content_css: '/tinymce/skins/content/default/content.css',
  // 设置本地plugins中emojis的位置，用来获取表情,不用这个插件不用设置
  emoticons_database_url: '/tinymce/plugins/emoticons/js/emojis.js',
  // 设置本地语言
  language_url: '/tinymce/langs/zh_CN.js',
  // 设置本地语言
  language: 'zh_CN',
  // 设置工具栏
  toolbar: toolbar ?? [
    'undo redo | accordion accordionremove | blocks fontfamily fontsize | bold italic underline strikethrough | align numlist bullist | link image | table media | lineheight outdent indent| forecolor backcolor removeformat | charmap emoticons | code fullscreen preview | save print | pagebreak anchor codesample | ltr rtl'
  ],
  // 设置插件
  plugins:
    plugins ??
    'codesample lists advlist link autolink charmap emoticons fullscreen preview code searchreplace table visualblocks wordcount insertdatetime image',
  // 字号
  font_size_formats:
    '9pt 10pt 12pt 13pt 14pt 16pt 18pt 21pt 24pt 28pt 32pt 36pt',
  // 字体
  font_family_formats: `
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
  // 允许粘贴图像
  paste_data_images: true,
  // 去水印
  branding: false,
  // 去除升级提示按钮
  promotion: false,
  //最小高度
  min_height: minHeight ?? 600,
  file_picker_types: 'file image media',
  images_upload_handler: uploadHandler
})

// 上传图片
function uploadHandler(blobInfo: any, success: any, failure: any) {
  emit('upload', blobInfo, success, failure)
}
</script>

<style lang="scss" scoped>
.ofa-tinymce-editor {
  display: flex;
  flex-direction: column;
  place-items: center;
  width: 100%;
  :deep(.tox-tinymce) {
    width: 100%;
  }
}
</style>
