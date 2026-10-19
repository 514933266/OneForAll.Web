<template>
	<div class="news-reports">
		<el-empty v-if="!hasData" description="暂无数据"></el-empty>
		<template v-else>
			<div class="list-column">
				<div class="column-title">{{ leftTitle }}</div>
				<div v-for="(item, index) in leftList" :key="index" class="list-item" :class="{ 'no-link': !item.Url }" @click="openItem(item)">
					<div class="item-title">{{ item.Title }}</div>
					<div class="item-meta">
						<span v-if="item.Source" class="source">{{ item.Source }}</span>
						<span v-if="item.Rating" :class="['rating', ratingClass(item.Rating)]">{{ item.Rating }}</span>
						<span class="date">{{ item.Date }}</span>
					</div>
				</div>
				<div v-if="!leftList.length" class="column-empty">暂无数据</div>
			</div>
			<div v-if="mode === 'report'" class="list-column">
				<div class="column-title">行业研报</div>
				<div v-for="(item, index) in rightList" :key="index" class="list-item" :class="{ 'no-link': !item.Url }" @click="openItem(item)">
					<div class="item-title">{{ item.Title }}</div>
					<div class="item-meta">
						<span v-if="item.Source" class="source">{{ item.Source }}</span>
						<span v-if="item.Rating" :class="['rating', ratingClass(item.Rating)]">{{ item.Rating }}</span>
						<span class="date">{{ item.Date }}</span>
					</div>
				</div>
				<div v-if="!rightList.length" class="column-empty">暂无数据</div>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IZdxStockNews, IZdxStockReports } from '@/interfaces/zhiduoxing/IZdxStockDetail'

const props = defineProps<{
	mode: 'news' | 'report' | 'notice'
	data?: IZdxStockNews | IZdxStockReports
}>()

// 列表项（资讯：Title/Source/Date/Url；研报：含 Rating；研报无链接不可跳转）
interface IDisplayItem {
	Title: string
	Source?: string
	Rating?: string
	Date: string
	Url?: string
}

// 左列标题（资讯=最新资讯、公告=公司公告、研报=个股研报）
const leftTitle = computed(() => {
	if (props.mode === 'report') return '个股研报'
	return props.mode === 'notice' ? '公司公告' : '最新资讯'
})

const leftList = computed<IDisplayItem[]>(() => {
	if (props.mode === 'report') {
		return (props.data as IZdxStockReports | undefined)?.StockReports ?? []
	}
	if (props.mode === 'notice') {
		return (props.data as IZdxStockNews | undefined)?.Announcements ?? []
	}
	return (props.data as IZdxStockNews | undefined)?.LatestNews ?? []
})

// 右列仅研报模式（个股研报/行业研报双列；资讯/公告为单列）
const rightList = computed<IDisplayItem[]>(() => {
	if (props.mode === 'report') {
		return (props.data as IZdxStockReports | undefined)?.IndustryReports ?? []
	}
	return []
})

const hasData = computed(() => leftList.value.length > 0 || rightList.value.length > 0)

// 评级配色（买入=红、增持=橙、其他=灰）
function ratingClass(rating: string) {
	if (rating.includes('买入') || rating.includes('推荐')) return 'buy'
	if (rating.includes('增持')) return 'hold'
	return 'neutral'
}

// 点击打开原文链接（资讯/公告跳转东财页面；研报无链接不限鼠标与悬浮效果）
function openItem(item: IDisplayItem) {
	if (item.Url) window.open(item.Url, '_blank')
}
</script>

<style lang="scss" scoped>
.news-reports {
	display: flex;
	min-height: 120px;

	.list-column {
		flex: 1;
		box-sizing: border-box;
		padding: 0 20px;

		& + .list-column {
			border-left: 1px solid #f5f6fb;
		}

		.column-title {
			font-size: 15px;
			font-weight: 600;
			color: #303133;
			padding: 16px 0 10px;
		}

		.column-empty {
			padding: 30px 0;
			text-align: center;
			font-size: 13px;
			color: #a7abba;
		}

		.list-item {
			padding: 12px 0;
			border-bottom: 1px solid #f5f6fb;
			cursor: pointer;

			&.no-link {
				cursor: default;

				&:hover .item-title {
					color: inherit;
				}
			}

			&:hover .item-title {
				color: #409eff;
			}

			.item-title {
				font-size: 14px;
				color: #2e3543;
				line-height: 22px;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				transition: color 0.2s;
			}

			.item-meta {
				display: flex;
				align-items: center;
				margin-top: 6px;
				font-size: 12px;
				color: #a7abba;

				.source {
					margin-right: 10px;
				}

				.rating {
					padding: 1px 8px;
					border-radius: 4px;
					font-size: 12px;
					margin-right: 10px;

					&.buy {
						color: var(--el-color-danger);
						background: rgba(245, 108, 108, 0.1);
					}

					&.hold {
						color: var(--el-color-warning);
						background: rgba(230, 162, 60, 0.1);
					}

					&.neutral {
						color: #909399;
						background: #f5f6fb;
					}
				}
			}
		}
	}
}
</style>
