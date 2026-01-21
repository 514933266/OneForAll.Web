// 订单状态
export const ORDER_STATE = [
    { value: 0, label: '待支付', tagType: 'warning' },
    { value: 1, label: '已支付', tagType: 'primary' },
    { value: 2, label: '已发货', tagType: 'primary' },
    { value: 3, label: '确认收货', tagType: 'primary' },
    { value: 4, label: '退款中', tagType: 'warning' },
    { value: 5, label: '已完成', tagType: 'success' },
    { value: 6, label: '关闭', tagType: 'info' },
    { value: 98, label: '已取消', tagType: 'info' },
    { value: 99, label: '异常', tagType: 'danger' }
  ]
// 订单支付状态
export const ORDER_PAY_STATE = [
    { value: 0, label: '待支付', class: 'ofa-text-warning' },
    { value: 1, label: '已支付', class: 'ofa-text-success' },
    { value: 99, label: '已退款', class: 'ofa-text-danger' }
]
// 订单发货状态
export const ORDER_SHIPPING_STATE = [
    { value: 0, label: '待发货', tagType: 'warning' },
    { value: 1, label: '已发货', tagType: 'primary' },
    { value: 2, label: '已收货', tagType: 'success' },
    { value: 99, label: '已退货', tagType: 'danger' }
]
// 订单支付方式
export const ORDER_PAY_TYPE = [
    { value: '公众号/小程序支付', label: '公众号/小程序支付' },
    { value: '扫码支付', label: '扫码支付' },
    { value: 'App支付', label: 'App支付' },
    { value: '付款码支付', label: '付款码支付' },
    { value: 'H5支付', label: 'H5支付' },
    { value: '刷脸支付', label: '刷脸支付' },
    { value: '其他', label: '其他' }
]