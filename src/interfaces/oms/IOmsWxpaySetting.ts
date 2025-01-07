// 微信商户支付设置
export interface IOmsWxpaySetting {
    Id: string
    // 微信的AppId
    AppId: string
    // App的名称
    AppName: string
    // 微信的商户号
    Mchid: string
    // 未支付订单的失效时间：分钟
    OrderTimeExpire: number
    // 微信支付回调解密秘钥V3
    APIv3Key: string
    // 已上传v3商户证书路径
    IsUploadCert: boolean
    // 异常提示
    Error: string
    // 创建时间（最后更改时间）
    CreateTime: Date
    // 创建人名称（最后修改人）
    CreatorName: string
}