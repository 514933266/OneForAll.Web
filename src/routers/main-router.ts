import { IPersonalMenuTree } from '../interfaces/IPersonalMenuTree'

// 登录页
export const LOGIN = { Name: 'Login', Code: 'Login', Url: '/login' }
// 首页
export const INDEX = { Name: 'Index', Code: 'Index', Url: '/index' }
// 欢迎页
export const WELCOME: IPersonalMenuTree = { Id: 'MainWelcome', Code: 'MainWelcome', Name: '首页', Url: '/main/welcome', Type: 2, OpenType: 1, IsDefault: true, Icon: 'home', Children: [] }
// 个人中心
export const PERSONAL: IPersonalMenuTree = { Id: 'MainPersonalCenter', Code: 'MainPersonalCenter', Name: '个人中心', Url: '/main/personal-center', Type: 2, OpenType: 1, IsDefault: false, Icon: 'user', Children: [] }
// 个人档案
export const PERSONAL_FILE: IPersonalMenuTree = { Id: 'MainPersonalFile', Code: 'MainPersonalFile', Name: '人事档案', Url: '/main/personal-file', Type: 2, OpenType: 1, IsDefault: false, Icon: 'file', Children: [] }
// 修改密码
export const PERSONAL_PASSWORD: IPersonalMenuTree = { Id: 'MainPersonalPassword', Code: 'MainPersonalPassword', Name: '修改密码', Url: '/main/personal-password', Type: 2, OpenType: 1, IsDefault: false, Icon: 'lock', Children: [] }
// 消息中心
export const MESSAGE_CENTER: IPersonalMenuTree = { Id: 'MainMessageCenter', Code: 'MainMessageCenter', Name: '消息中心', Url: '/main/message-center', Type: 2, OpenType: 1, IsDefault: false, Icon: 'bell', Children: [] }
// 消息详情
export const MESSAGE_CENTER_DETAIL: IPersonalMenuTree = { Id: 'MainMessageDetail', Code: 'MainMessageDetail', Name: '站内信详情', Url: '/main/message-detail', Type: 2, OpenType: 1, IsDefault: false, Icon: 'file', Children: [] }
// 提示页
export const _400: IPersonalMenuTree = { Id: 'Main400', Code: 'Main400', Name: '400', Url: '/main/400', Type: 2, OpenType: 1, IsDefault: false, Icon: 'circle-exclamation', Children: [] }
export const _403: IPersonalMenuTree = { Id: 'Main403', Code: 'Main403', Name: '403', Url: '/main/403', Type: 2, OpenType: 1, IsDefault: false, Icon: 'circle-exclamation', Children: [] }
export const _404: IPersonalMenuTree = { Id: 'Main404', Code: 'Main404', Name: '404', Url: '/main/404', Type: 2, OpenType: 1, IsDefault: false, Icon: 'circle-exclamation', Children: [] }
export const _405: IPersonalMenuTree = { Id: 'Main405', Code: 'Main405', Name: '405', Url: '/main/405', Type: 2, OpenType: 1, IsDefault: false, Icon: 'circle-exclamation', Children: [] }
export const _415: IPersonalMenuTree = { Id: 'Main415', Code: 'Main415', Name: '415', Url: '/main/415', Type: 2, OpenType: 1, IsDefault: false, Icon: 'circle-exclamation', Children: [] }
export const _500: IPersonalMenuTree = { Id: 'Main500', Code: 'Main500', Name: '500', Url: '/main/500', Type: 2, OpenType: 1, IsDefault: false, Icon: 'circle-exclamation', Children: [] }
export const _503: IPersonalMenuTree = { Id: 'Main503', Code: 'Main503', Name: '503', Url: '/main/503', Type: 2, OpenType: 1, IsDefault: false, Icon: 'circle-exclamation', Children: [] }
// 入职档案填写
export const ENTRY_FILE = { name: 'EntryFile', path: '/entry-file', isBlank: true }
export const ENTRY_FILE_RESULT = { name: 'EntryFileResult', path: '/entry-file-result', isBlank: true }
// 通义千问
export const TONGYIQIANWEN: IPersonalMenuTree = { Id: 'MainTongYiQianWen', Code: 'MainTongYiQianWen', Name: '企小秘', Url: '/main/qixiaomi', Type: 2, OpenType: 1, IsDefault: false, Icon: 'robot', Children: [] }
