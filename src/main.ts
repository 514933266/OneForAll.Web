import App from './App.vue'

// Vue全家桶
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './untils/router'

// UI框架 ElementUI
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '../src/assets/css/default.scss'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

// 字体库 Fontawesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
library.add(fas)

// e-charts图表
import 'echarts/lib/chart/bar'
import 'echarts/lib/chart/line'
import 'echarts/lib/chart/pie'
import 'echarts/lib/component/tooltip'

// 富文本tinymce
import TinymceEditor from '../src/components/TinymceEditor.vue'
// 自定义excel上传组件
import ExcelUploader from '../src/components/ExcelUploader.vue'

// 打印
// import Print from 'vue-print-nb'

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.component('tinymce-editor', TinymceEditor)
app.component('excel-uploader', ExcelUploader)
app.use(createPinia())
app.use(ElementPlus, {
    locale: zhCn,
})
app.use(router)
app.mount('#app')

// 全局
interface Window  {
    AppData: any
}
declare const window: Window & typeof globalThis
window.AppData = {
    // 注册子路由
    registerChildRoutes: (routes: any[]) => {
      const index = router.options.routes.find(w => w.name === 'Index')
      if (index) {
        routes.forEach(e => {
            router.addRoute('Index', e)
        })
      }
    }
  }
  