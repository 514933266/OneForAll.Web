## **OneForAll.Admin：后台管理系统**
帮助开发人员快速搭建后台管理系统，专注业务功能，实现快速交付<br/>
Vue3版本已将常用模块集成到主框架中，降低复杂度<br/>

### 后端服务（.net Core）

| 模块名称 | 描述 | 仓库地址 |
| ------- | ------- | ------- |
| 授权服务 | 基于OAuth2的授权服务 | https://github.com/514933266/OneForAll.Api.OAuth |
| 开发人员功能 | 开发人员相关功能（租户、菜单、权限、站点授权） | https://github.com/514933266/OneForAll.Api.Sys |
| 系统管理 | 租户的权限、角色管理功能 | https://github.com/514933266/OneForAll.Api.Base |
| 日志中心 | 各类日志服务 | https://github.com/514933266/OneForAll.Api.SysLog |
| 消息中心 | 包含系统消息、邮件、钉钉推送、微信推送、短信等 | https://github.com/514933266/OneForAll.Api.Ums |
| 任务中心 | 基于Quartz实现的定时任务管理服务 | https://github.com/514933266/OneForAll.Api.ScheduleJob |
| 商户中心 | 基于Quartz实现的定时任务管理服务 | https://github.com/514933266/OneForAll.Api.Oms |
| 智能人事 | 常用OA系统功能 | https://github.com/514933266/OneForAll.Api.OA |

### 开发说明
1. 在/src/apis/目录下，创建对应的模块api.js文件，如：admin-api.js
2. 在/src/router/目录下，创建对应的模块router.js文件，如：admin-router.js
3. 在/src/assets/js/目录下，创建对应的模块const.js文件，如：admin-const.js
4. 在/src/views/目录下，创建对应的模块Vue文件，如：

### 自动注册路由
1. 只需要将页面文件和目录创建在views目录下即可自动创建
2. 如果文件名称是驼峰式，则会将路由注册为router-name格式
3. 你可以根据自己的喜好修改规则，在router.js文件中

### 主要目录说明
--src
|--- components（全局公共组件）
|--- apis（子模块api文件）
|--- assets（资源文件）
|--- routers（子模块路由文件）
|--- stores（vuex相关文件）
|--- untils（工具封装js文件）
|--- views（页面文件）

### 单体项目
1. 你也可以把其他页面服务集成到当前项目中，只需要把页面和相关样式、js按照目录规范存放即可
2. 通过后台菜单管理，将对应的菜单类型由远程组件改为节点或不填写URL值

### 微前端项目
1. 将各个模块Web单独部署
2. 通过后台菜单管理，将菜单类型设置为远程组件，并在Url中设置对应站点地址，子模块通过main.ts入口调用window.AppData将路由注册
```js
import ChildRoutes from './untils/router'

// 全局
interface Window  {
  AppData: any
}
declare const window: Window & typeof globalThis
window.AppData.registerChildRoutes(ChildRoutes)
console.log('The child module is loaded')
```
3. 主框架通过在/views/main/Index页面下通过Provide暴露了多个公共属性，子模块通过inject引入使用即可
```js
// 依赖注入全局对象提供给子模块加载后调用
provide('browserStore', useBrowserStore())
provide('clientStore', useClientStore())
provide('userStore', useUserStore())
provide('tokenStore', useTokenStore())
provide('router', router)
provide('axios', axios)
```
4. 打包工具请使用webpack，不建议使用vite（暂时未解决vite的打包导致无法加载组件的问题）
5. 子模块打包时请注意忽略devDependencies的依赖库，避免和主框架造成版本冲突
```js
// webpack.config.js
const packageJson = require('./package.json')

module.exports = {
	// 排除devDependencies的打包
	externals: Object.keys(packageJson.devDependencies).reduce((externals, dependency) => {
		externals[dependency] = `commonjs ${dependency}`
		return externals
	}, {})
}

```
