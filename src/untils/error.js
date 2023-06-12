export const SERVER_ERROR = -30000
export const NOT_ALLOWED = -20007
export const FROZEN = -20006
export const PERMS_NOTENOUGH = -20005
export const AUTHCODE_INVALID = -20004
export const ACCOUNT_NOTFOUND = -20003
export const PASSWORD_INVALID = -20002
export const TOKEN_INVALID = -20001
export const TIMESTAMP_INVALID = -20000
export const DATA_EMPTY = -10004
export const DATA_NOTMATCH = -10003
export const DATA_NOTFOUND = -10002
export const DATA_EXISTS = -10001
export const DATA_ERROR = -10000
export const FAIL = 0
export const SUCCESS = 1

const ERR_ENUMS = [
  { Code: SERVER_ERROR, String: '服务器错误' },
  { Code: NOT_ALLOWED, String: '禁止操作' },
  { Code: FROZEN, String: '已被冻结' },
  { Code: PERMS_NOTENOUGH, String: '权限不足' },
  { Code: AUTHCODE_INVALID, String: '验证码无效' },
  { Code: ACCOUNT_NOTFOUND, String: '用户不存在' },
  { Code: PASSWORD_INVALID, String: '密码无效' },
  { Code: TOKEN_INVALID, String: '令牌无效' },
  { Code: TIMESTAMP_INVALID, String: '时间戳无效' },
  { Code: DATA_EMPTY, String: '数据为空' },
  { Code: DATA_NOTMATCH, String: '数据不匹配' },
  { Code: DATA_NOTFOUND, String: '数据不存在' },
  { Code: DATA_EXISTS, String: '数据已存在' },
  { Code: DATA_ERROR, String: '数据异常' },
  { Code: FAIL, String: '操作失败' },
  { Code: SUCCESS, String: '操作成功' }
]

const ERROR = {
  toString: (err) => {
    return ERR_ENUMS.map(w => { return w.Code === err }).String
  }
}

export default ERROR
