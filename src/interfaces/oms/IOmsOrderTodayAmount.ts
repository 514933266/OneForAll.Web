// 今日订单销售额
export interface IOmsOrderTodayAmount {
    // 成交订单数量
    DealCount: number
    // 订单总金额
    TotalAmount: number
    // 实收金额
    TotalPaidAmount: number
    // 取消订单数量
    CancelCount: number
}