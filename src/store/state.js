const GUID = '00000000-0000-0000-0000-000000000000'
const state = {
  guid: GUID, // 默认数据id
  token_refreshing: false, // token刷新中
  tenant: {}, // 登录机构
  user: {}, // 登录用户
  auth: {}, // oauth授权认证
  client: {}, // 客户端登录信息
  axiosUrls: [], // axios请求过的url，用于过滤重复请求
  modules: [] // 加载的菜单模块
}

export default state
