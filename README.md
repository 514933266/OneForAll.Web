## **OneForAll.Admin：后台管理系统**
基于Apache License, 2.0 (Apache-2.0 )开源，可商用<br/>
帮助开发人员快速搭建后台管理系统，专注业务功能，实现快速交付<br/>

### 后端服务（.net Core）

| 模块名称 | 描述 | 仓库地址 |
| ------- | ------- | ------- |
| 授权服务 | 基于OAuth2的授权服务 | https://github.com/514933266/OneForAll.Api.OAuth |
| 开发人员功能 | 开发人员相关功能（租户、菜单、权限、站点授权） | https://github.com/514933266/OneForAll.Api.Sys |
| 开发人员功能 | 开发人员相关功能界面 | https://github.com/514933266/OneForAll.Web.Sys |
| 系统管理 | 租户的权限、角色管理功能 | https://github.com/514933266/OneForAll.Api.Base |
| 系统管理 | 系统管理界面 | https://github.com/514933266/OneForAll.Web.Base |
| 日志中心 | 各类日志服务 | https://github.com/514933266/OneForAll.Api.SysLog |
| 日志中心 | 日志中心界面 | https://github.com/514933266/OneForAll.Web.SysLog |
| 消息中心 | 包含系统消息、邮件、钉钉推送、微信推送、短信等 | https://github.com/514933266/OneForAll.Api.Ums |
| 消息中心 | 消息中心界面 | https://github.com/514933266/OneForAll.Web.Ums |
| 任务中心 | 基于Quartz实现的定时任务管理服务 | https://github.com/514933266/OneForAll.Api.ScheduleJob |
| 任务中心 | 任务中心界面 | https://github.com/514933266/OneForAll.Web.ScheduleJob |
| 商户中心 | 基于Quartz实现的定时任务管理服务 | https://github.com/514933266/OneForAll.Api.ScheduleJob |
| 商户中心 | 商户中心界面 | https://github.com/514933266/OneForAll.Web.ScheduleJob |

### 演示地址
https://yanshi.fengwoyun.net<br/>
账号：yanshi_admin<br/>
密码：yanshi_admin<br/>

### 开发说明
1. 在/src/apis/目录下，创建对应的模块api.js文件，如：admin-api.js
```
const API = {
  // KEY需要对应菜单的Code以及Api授权的Code
  KEY: 'OneForAll.Admin',
  PROJECT: {
    URL: '/api/Projects'
  }
}

export default API

```
2. 在/src/router/目录下，创建对应的模块router.js文件，如：admin-router.js
```
// 用户管理：name对应路由名称，需要与后台的Code匹配，isBlank决定是否打开新标签访问（默认根据菜单配置），label为内置浏览器标签（默认使用菜单名）
export const USER = { name: 'SysUserApp', isBlank: true, label: '需求历史'  }
```
3. 在/src/assets/js/目录下，创建对应的模块const.js文件，如：admin-const.js
```
// 根据业务创建常量即可
export const MESSAGE_TYPE = ['系统通知']
```
4. 在/src/views/目录下，创建对应的模块Vue文件，如：
```
export default {
  name: USER.name,
  data () {
    return {
      loading: false
      }
   }
}
```

### 自动注册路由
1. 只需要将页面文件和目录创建在views目录下即可自动创建
2. 如果文件名称是驼峰式，则会将路由注册为router-name格式
3. 你可以根据自己的喜好修改规则，在router.js文件中

### 单体项目
1. 你也可以把其他页面服务集成到当前项目中，只需要把页面和相关样式、js按照规范存放即可
2. 还需要在后台菜单管理，将对应的菜单类型由远程组件改为节点