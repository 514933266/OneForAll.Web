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

export const baseError = {
    data:[
        { value: SERVER_ERROR, label: '服务器错误' },
        { value: NOT_ALLOWED, label: '禁止操作' },
        { value: FROZEN, label: '已被冻结' },
        { value: PERMS_NOTENOUGH, label: '权限不足' },
        { value: AUTHCODE_INVALID, label: '验证码无效' },
        { value: ACCOUNT_NOTFOUND, label: '用户不存在' },
        { value: PASSWORD_INVALID, label: '密码无效' },
        { value: TOKEN_INVALID, label: '令牌无效' },
        { value: TIMESTAMP_INVALID, label: '时间戳无效' },
        { value: DATA_EMPTY, label: '数据为空' },
        { value: DATA_NOTMATCH, label: '数据不匹配' },
        { value: DATA_NOTFOUND, label: '数据不存在' },
        { value: DATA_EXISTS, label: '数据已存在' },
        { value: DATA_ERROR, label: '数据异常' },
        { value: FAIL, label: '操作失败' },
        { value: SUCCESS, label: '操作成功' }
    ],
    toString: function (err: number) {
        return this.data.find(w => w.value === err)?.label
    }
}
