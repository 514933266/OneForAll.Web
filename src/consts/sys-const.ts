// 菜单类型
export const MENU_TYPE = [
    { value: 0, label: '节点' },
    { value: 1, label: '远程组件' },
    { value: 2, label: '页面' }
  ]
  
// 菜单打开方式
export const MNUE_OPEN_TYPE = [
    { value: 0, label: '标签内打开' },
    { value: 1, label: '新标签打开' },
    { value: 2, label: '新窗口打开' }
]
  
// 菜单打开方式
export const NOTIFICATION_TYPE = [
    { value: 0, label: '所有账号' },
    { value: 1, label: '主账号' },
    { value: 2, label: '指定账号' }
]
  
// 用户状态
export const USER_STATUS = [
    { value: 1, label: '正常', type: 'success' },
    { value: 2001, label: '冻结30分钟', type: 'warning' },
    { value: 2002, label: '冻结1小时', type: 'warning' },
    { value: 2003, label: '冻结3小时', type: 'warning' },
    { value: 2004, label: '冻结1天', type: 'warning' },
    { value: 2005, label: '冻结3天', type: 'warning' },
    { value: 2006, label: '冻结7天', type: 'danger' },
    { value: 2007, label: '冻结1个月', type: 'danger' },
    { value: 2008, label: '冻结3个月', type: 'danger' },
    { value: 2099, label: '永久封禁', type: 'danger' },
    { value: 99, label: '异常', type: 'danger' }
]
  
// 客户端类型
export const CLIENT_TYPE = [
    { value: 1000, label: '网站' },
    { value: 2000, label: 'App' },
    { value: 3000, label: '微信公众号' },
    { value: 3001, label: '微信小程序' }
]

// 微信公众号消息类型
export const WX_GZH_MSG_TYPE = [
    { value: 1000, label: '公众号关注' },
    { value: 1001, label: '公众号取消关注' },
    { value: 1002, label: '二维码关注' },
    { value: 1003, label: '二维码取消关注' },
    { value: 1004, label: '菜单点击' },
    { value: 1005, label: '文本回复' }
]

// 微信公众号回复类型
export const WX_GZH_REPLY_TYPE = [
    { value: 0, label: '文本' },
    { value: 1, label: '视频类型' },
    { value: 2, label: '图片' },
    { value: 3, label: '语音消息' },
    { value: 4, label: '音乐' },
    { value: 5, label: '图文' },
    { value: 6, label: '客服消息' }
]

// 微信公众号关注类型
export const WX_GZH_SUBSCRIBE_TYPE = [
    { value: 1000, label: '公众号搜索' },
    { value: 1001, label: '公众号迁移' },
    { value: 1002, label: '二维码' },
    { value: 1003, label: '公众号名片' },
    { value: 1004, label: '图文页内名称点击' },
    { value: 1005, label: '图文页右上角菜单' },
    { value: 1005, label: '支付后关注' },
    { value: 1005, label: '微信广告' },
    { value: 1005, label: '他人转载' },
    { value: 1005, label: '视频号直播' },
    { value: 1005, label: '视频号' },
    { value: 1005, label: '其他' }
]

// 地区等会类型
export const AREA_LEVEL_TYPE = [
    { value: 0, label: '省' },
    { value: 1, label: '市' },
    { value: 2, label: '县区' },
    { value: 3, label: '镇街' }
]
