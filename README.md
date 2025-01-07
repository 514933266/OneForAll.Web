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
