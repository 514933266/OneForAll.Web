// 订单
export interface IOmsOrder {
	Id: string
    // 订单编号
	OrderNo: string
    // 第三方订单编号（微信/支付宝/其他）
	PlatformOrderNo: string
    // 订单来源
	Source: string
    // 购买用户id
	UserId: string
    // 购买账号
	UserName: string
	// 支付平台的用户id
	PlatformPayerId: string
	// 商品名称
	ProductName: string
	// 订单状态
	State: number
	// 付款状态
	PayState: number
	// 发货状态
	ShippingState: number
	// 总价
	TotalPrice: number
	// 实付
	PaidAmount: number
	// CNY：人民币，境内商户号仅支持人民币
	Currency: string
	// 折扣
	Discount: number
	// 抵扣金额
	OffsetAmount: number
	// 支付方式
	PayType: string
	// 支付时间
	PayTime?: Date
	// 配送方式
	ShippingMethod: string
	// 快递费
	ShippingPrice: number
	// 已开发票
	IssuedInvoice: boolean
	// 下单时间
	CreateTime: Date
	// 最后修改时间
	UpdateTime?: Date
	// 预计失效时间
	MayFailureTime?: Date
	// 订单备注
	Remark: string
	// 收货人信息Json
	Receiver: IOmsOrderReceiver
	// 其他费用明细
	OtherPrices: IOmsOrderOtherPrice[]
	// 订单明细
	Items: IOmsOrderItem[]
}

// 收货人信息
export interface IOmsOrderReceiver {
	// 收货人姓名
	Name: string
	// 电话
	PhoneNumber: string
	// 收货地址
	Address: IOmsOrderReceiverAddress
}

// 收货人信息
export interface IOmsOrderReceiverAddress {
	// 省份
	Province: string
	// 城市
	City: string
	// 区县
	District: string
	// 详细地址
	Address: string
}

// 其他费用
export interface IOmsOrderOtherPrice {
	// 费用名称
	Name: string
	// 金额
	Amount: number
	// 描述
	Remark: string
}

// 订单明细
export interface IOmsOrderItem {
	// 明细id
	Id: string
	// 商品编号/id
	ProductNo: string
	// 商品名称
	ProductName: string
	// 商品图片
	ImageUrl: string
	// 商品数量
	Quantity: number
	// 单价
	UnitPrice: number
	// 总价
	TotalPrice: number
	// 折扣
	Discount: number
	// 抵扣金额
	OffsetAmount: number
	// 其他费用明细
	OtherPrices: IOmsOrderOtherPrice[]
	// 其他费用明细
	ProductSnapshots: IOmsOrderProductSnapshot[]
}

// 订单明细快照
export interface IOmsOrderProductSnapshot {
	// 属性名称
	Name: string
	// 属性值
	Value: string
}