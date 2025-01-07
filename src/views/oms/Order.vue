<template>
	<div class="panle-box">
		<div class="center-item">
			<div class="center-title">
				<span class="ofa-title">今日订单数量</span>
				<el-text type="primary"><font-awesome-icon fas icon="chart-line"></font-awesome-icon></el-text>
			</div>
			<div class="center-bottom">
				<div class="center-num">
					<span class="num-text">{{ todayAmount.DealCount }}</span>
					<span class="num-type">单</span>
				</div>
			</div>
		</div>
		<div class="center-item">
			<div class="center-title">
				<span class="ofa-title">今日订单金额</span>
				<el-text type="success"><font-awesome-icon fas icon="yen-sign"></font-awesome-icon></el-text>
			</div>
			<div class="center-bottom">
				<div class="center-num">
					<span class="num-text">{{ todayAmount.TotalAmount }}</span>
					<span class="num-type">元</span>
				</div>
			</div>
		</div>
		<div class="center-item">
			<div class="center-title">
				<span class="ofa-title">今日实收金额</span>
				<el-text type="danger"><font-awesome-icon fas icon="dollar-sign"></font-awesome-icon></el-text>
			</div>
			<div class="center-bottom">
				<div class="center-num">
					<span class="num-text">{{ todayAmount.TotalPaidAmount }}</span>
					<span class="num-type">元</span>
				</div>
			</div>
		</div>
		<div class="center-item">
			<div class="center-title">
				<span class="ofa-title">今日取消订单数量</span>
				<el-text type="warning"><font-awesome-icon fas icon="bell"></font-awesome-icon></el-text>
			</div>
			<div class="center-bottom">
				<div class="center-num">
					<span class="num-text">{{ todayAmount.CancelCount }}</span>
					<span class="num-type">单</span>
				</div>
			</div>
		</div>
	</div>
	<el-container class="order-page">
		<el-header class="header">
			<span>
				<el-input v-model="searchOption.orderNo" class="ofa-mr20" placeholder="订单号" clearable style="width: 200px"> </el-input>
				<el-input
					v-model="searchOption.platformOrderNo"
					class="ofa-mr20"
					placeholder="第三方平台订单号"
					clearable
					style="width: 200px"
				>
				</el-input>
				<el-input v-model="searchOption.productName" class="ofa-mr20" placeholder="商品名称" clearable style="width: 200px">
				</el-input>
				<el-input
					v-model="searchOption.userName"
					class="ofa-mr20"
					placeholder="买家账号"
					clearable
					style="width: 200px"
				></el-input>
				<el-select v-model="searchOption.state" placeholder="订单状态" clearable class="ofa-mr20" style="width: 100px">
					<el-option v-for="item in ORDER_STATE" :key="item.value" :label="item.label" :value="item.value"> </el-option>
				</el-select>
				<el-select v-model="searchOption.payState" placeholder="支付状态" clearable class="ofa-mr20" style="width: 100px">
					<el-option v-for="item in ORDER_PAY_STATE" :key="item.value" :label="item.label" :value="item.value"> </el-option>
				</el-select>
				<el-select v-model="searchOption.shippingState" placeholder="发货状态" clearable class="ofa-mr20" style="width: 100px">
					<el-option v-for="item in ORDER_SHIPPING_STATE" :key="item.value" :label="item.label" :value="item.value"> </el-option>
				</el-select>
				<el-button @click="search" type="primary" class="search-button"
					><font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;查询</el-button
				>
			</span>
			<span> </span>
		</el-header>
		<el-main class="content">
			<div class="title-box">
				<span class="title">
					订单列表
					<span class="title-total">
						共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
					</span>
				</span>
			</div>
			<el-table :data="list" class="ofa-table">
				<el-table-column prop="ProductName" label="商品信息" fixed width="480">
					<template #default="scope">
						<div class="name-box">
							<el-image
								preview-teleported
								:src="scope.row.imageUrl"
								:preview-src-list="scope.row.previewList"
								class="img-box"
								fit="fill"
							>
							</el-image>
							<div class="name-content">
								<div class="ofa-title ofa-l">{{ scope.row.ProductName }}</div>
								<div>订单号：{{ scope.row.OrderNo }}</div>
								<div v-if="scope.row.PlatformOrderNo">平台单号：{{ scope.row.PlatformOrderNo }}</div>
								<div class="tag-box">
									<el-tag class="ofa-mr10" effect="plain" :type="scope.row.stateTagType"> {{ scope.row.stateStr }}</el-tag>
									<el-tag class="ofa-mr10" effect="plain" :type="scope.row.shippingStateTagType">
										{{ scope.row.shippingStateStr }}</el-tag
									>
									<el-tag class="ofa-mr10" effect="plain">{{ scope.row.ShippingMethod }} </el-tag>
								</div>
							</div>
						</div>
					</template>
				</el-table-column>
				<el-table-column prop="TotalPrice" label="价格" width="150">
					<template #default="scope">
						<div class="ofa-mb10">￥{{ scope.row.TotalPrice.toLocaleString() }}</div>
						<div v-if="scope.row.Discount > 0">折扣：{{ scope.row.Discount }}</div>
						<el-text v-if="scope.row.OffsetAmount > 0" type="warning">
							<font-awesome-icon fas icon="gift"></font-awesome-icon>&nbsp;已优惠：￥{{ scope.row.OffsetAmount }}
						</el-text>
					</template>
				</el-table-column>
				<el-table-column label="其他费用" width="150">
					<template #default="scope">
						<div class="ofa-mb10">运费：{{ scope.row.ShippingPrice }}</div>
						<div v-for="item in scope.row.OtherPrices" :key="item.id">
							<el-tooltip class="item" effect="dark" :content="item.Remark" placement="top-start">
								{{ item.Name }}：{{ item.Amount }}
							</el-tooltip>
						</div>
					</template>
				</el-table-column>
				<el-table-column prop="PaidAmount" label="实收金额" width="150">
					<template #default="scope">
						<div class="ofa-mb10">￥{{ scope.row.PaidAmount.toLocaleString() }}</div>
						<div>
							<el-tag effect="dark">{{ scope.row.Currency }}</el-tag>
						</div>
					</template>
				</el-table-column>
				<el-table-column prop="UserName" label="购买账号" width="150">
					<template #default="scope">
						{{ scope.row.UserName }}
					</template>
				</el-table-column>
				<el-table-column prop="PayState" label="支付状态" min-width="100">
					<template #default="scope">
						<span :class="scope.row.payStateClass">{{ scope.row.payStateStr }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="CreateTime" label="下单时间" min-width="200">
					<template #default="scope">
						{{ scope.row.CreateTime }}
					</template>
				</el-table-column>
				<el-table-column prop="PayTime" label="支付时间" min-width="200">
					<template #default="scope">
						{{ scope.row.PayTime ? scope.row.PayTime : ' - ' }}
					</template>
				</el-table-column>
				<el-table-column prop="PayType" label="支付方式" min-width="200">
					<template #default="scope">
						{{ scope.row.PayType }}
					</template>
				</el-table-column>
				<el-table-column prop="Source" label="订单来源" min-width="200">
					<template #default="scope">
						{{ scope.row.Source }}
					</template>
				</el-table-column>
				<el-table-column show-overflow-tooltip prop="Remark" label="订单备注" width="200"></el-table-column>
			</el-table>
			<el-pagination
				background
				layout="total, sizes, prev, pager, next, jumper"
				:current-page="pageIndex"
				:page-sizes="[10, 20, 50, 100]"
				:page-size="pageSize"
				:total="total"
				@size-change="pageSizeChange"
				@current-change="pageIndexChange"
			>
			</el-pagination>
		</el-main>
	</el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { dayjs } from 'element-plus'
import { IOmsOrder } from '@/interfaces/oms/IOmsOrder'
import { IOmsOrderTodayAmount } from '@/interfaces/oms/IOmsOrderTodayAmount'
import API from '@/apis/oms-api'
import { ORDER_STATE, ORDER_PAY_STATE, ORDER_SHIPPING_STATE } from '@/consts/oms-const'

const loading = ref(false) // 加载中
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const searchOption = ref({
	orderNo: '',
	platformOrderNo: '',
	userName: '',
	state: '',
	payState: '',
	shippingState: ''
}) // 搜索条件
const list = ref<IOmsOrder[]>([]) // 用户列表
const todayAmount = ref<IOmsOrderTodayAmount>({})

onMounted(() => {
	getTodayAmount()
	get()
})

// 获取今日订单统计
function getTodayAmount() {
	const today = dayjs().format('YYYY-MM-DD')
	API.getTodayAmount(today).then(res => {
		todayAmount.value = res
	})
}

// 获取列表
function get() {
	loading.value = true
	getTodayAmount()
	API.getPageOrder(pageIndex.value, pageSize.value, searchOption.value).then(res => {
		total.value = res.Total
		const arr = []
		res.Items.forEach(e => {
			const state = ORDER_STATE.find(w => w.value === e.State)
			const payState = ORDER_PAY_STATE.find(w => w.value === e.PayState)
			const shippingState = ORDER_SHIPPING_STATE.find(w => w.value === e.ShippingState)
			arr.push({
				...e,
				stateStr: state?.label ?? '异常',
				stateTagType: state?.tagType ?? 'danger',
				payStateStr: payState?.label ?? '异常',
				payStateClass: payState?.class ?? 'danger',
				shippingStateStr: shippingState?.label ?? '异常',
				shippingStateTagType: shippingState?.tagType ?? 'danger',
				imageUrl: e.Items[0].ImageUrl,
				previewList: e.Items.map(m => {
					return m.ImageUrl
				})
			})
		})
		list.value = arr
		loading.value = false
	})
}

// 搜索
function search() {
	pageIndex.value = 1
	nextTick(() => get())
}

// 改变每页数量
function pageSizeChange(value: number) {
	pageSize.value = value
	nextTick(() => get())
}

// 下一页
function pageIndexChange(value: number) {
	pageIndex.value = value
	nextTick(() => get())
}
</script>

<style lang="scss" scoped>
.order-page {
	background: #fff;
	border-radius: 20px;
	padding: 20px;
	.header {
		display: flex;
		align-items: center;
	}
}

.panle-box {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	justify-content: space-between;
	margin-bottom: 20px;
	> div {
		width: 22%;
		min-width: 259px;
		height: 150px;
		background: #fff;
		border-radius: 16px;
		margin-bottom: 10px;
		.center-title {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin: 20px 30px 10px;

			svg {
				width: 20px;
				height: 20px;
			}

			span {
				font-size: 1.75rem;
				font-weight: 600;
			}
		}
		.center-bottom {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin: 20px 30px 10px 0;
		}
		.center-num {
			margin-left: 30px;
			color: #303133;

			.num-text {
				font-size: 1.75rem;
				font-weight: bold;
				margin-right: 8px;
			}

			.num-type {
				font-size: 1.2rem;
				font-weight: 500;
			}
		}
	}
}
.select-div {
	display: flex;
	align-items: center;
	justify-content: space-evenly;
	.select-img {
		text-align: center;
		cursor: pointer;
		img {
			width: 76px;
			height: 76px;
			margin-bottom: 10px;
		}
	}
}
.name-box {
	display: flex;
	.img-box {
		margin-right: 20px;
		width: 150px;
		height: 120px;
		border-radius: 8px 8px 8px 8px;
	}
	.name-content {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		flex: 1;
	}
}
.title-box {
	display: flex;
	justify-content: space-between;
	padding: 20px 0;
	.title {
		font-size: 1.5rem;
		font-weight: 600;
	}
}
</style>