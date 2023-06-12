## **OneForAll.Admin：微服务架构 - SaaS后台管理系统**
免费开源，可商用<br/>
有问题可留言<br/>
本项目为单体架构版，会不定期更新版本，具体每个模块最新版可到对应的项目中获取<br/>

### 后端框架（.net Core7）
| 模块名称 | 描述 | 仓库地址 |
| ------- | ------- | ------- |
| OneForAll.Core | 核心类库封装 | https://github.com/514933266/OneForAll.Core |
| OneForAll.File | 文件操作类库 | https://github.com/514933266/OneForAll.File |
| OneForAll.EFCore | 基于EFCore的封装 | https://github.com/514933266/OneForAll.EFCore |

### 后端（.net Core7）

| 模块名称 | 描述 | 仓库地址 |
| ------- | ------- | ------- |
| 授权服务 | 基于OAuth2的授权服务 | https://github.com/514933266/OneForAll.Api.OAuth |
| 开发人员功能 | 开发人员相关功能（租户、菜单、权限、站点授权） | https://github.com/514933266/OneForAll.Api.Sys |
| 系统管理 | 租户的权限、角色管理功能 | https://github.com/514933266/OneForAll.Api.Base |
| 日志服务 | 简单的日志服务 | https://github.com/514933266/OneForAll.Api.SysLog |
| 消息服务 | 包含系统消息、邮件、钉钉推送、微信推送、短信等 | https://github.com/514933266/OneForAll.Api.Ums |
| 项目协作 | 包含项目管理、需求、迭代、任务、bug等开发协同功能 | https://github.com/514933266/OneForAll.Api.Pms |

### 前端（Vue2 + Element-ui）

| 模块名称 | 描述 | 仓库地址 |
| ------- | ------- | ------- |
| 主框架UI | 项目的主框架UI | https://github.com/514933266/OneForAll.Web |
| 开发人员功能 | 开发人员相关功能（租户、菜单、权限、站点授权） | https://github.com/514933266/OneForAll.Web.Sys |
| 系统管理 | 租户的权限、角色管理功能 | https://github.com/514933266/OneForAll.Web.Base |
| 日志服务 | 简单的日志服务 | https://github.com/514933266/OneForAll.Web.SysLog |
| 项目协作 | 包含项目管理、需求、迭代、任务、bug等开发协同功能 | https://github.com/514933266/OneForAll.Web.Pms |

### 如何部署？

### 一、部署后端服务
1. 部署[OneForAll.Api.Sys]、[OneForAll.Api.Base]、[OneForAll.Api.OAuth]三个服务
2. 执行脚本base.sql到数据库OneForAll.Base生成基础数据
3. 默认支持https://localhost:8080/访问

### 二、部署前端UI
1. 下载开发工具：[Visual Studio Code](https://code.visualstudio.com/)
2. 安装Node.js 版本： >= 14.0 && <= 16.0（如果使用高版本，需要自行解决SSL的问题）
3. npm run build后将dist目录放到服务器部署前端站点

### 三、如何开发新页面功能
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
