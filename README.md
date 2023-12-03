## **OneForAll.Admin：后台管理系统**
基于Apache License, 2.0 (Apache-2.0 )开源，可商用<br/>
帮助开发人员快速搭建后台管理系统，专注业务功能，实现快速交付<br/>

### 后端服务（.net Core）

| 模块名称 | 描述 | 仓库地址 |
| ------- | ------- | ------- |
| 授权服务 | 基于OAuth2的授权服务 | https://github.com/514933266/OneForAll.Api.OAuth |
| 开发人员功能 | 开发人员相关功能（租户、菜单、权限、站点授权） | https://github.com/514933266/OneForAll.Api.Sys |
| 系统管理 | 租户的权限、角色管理功能 | https://github.com/514933266/OneForAll.Api.Base |
| 日志服务 | 简单的日志服务 | https://github.com/514933266/OneForAll.Api.SysLog |
| 消息服务 | 包含系统消息、邮件、钉钉推送、微信推送、短信等 | https://github.com/514933266/OneForAll.Api.Ums |

### 演示地址
https://yanshi.fengwoyun.net
账号：yanshi_admin
密码：yanshi_admin

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

### 问题
