<template>
	<div class="company-info">
		<el-empty v-if="!data" description="暂无数据"></el-empty>
		<template v-else>
			<div class="intro-box">
				<div class="section-title">简介</div>
				<div class="intro-text" :class="{ collapse: !expanded && tooLong }">
					{{ data.Profile }}
				</div>
				<div v-if="tooLong" class="expand-btn" @click="expanded = !expanded">
					{{ expanded ? '收起' : '展开' }}
					<font-awesome-icon :icon="expanded ? 'chevron-up' : 'chevron-down'"></font-awesome-icon>
				</div>
			</div>
			<div class="intro-box">
				<div class="section-title">公司介绍</div>
				<table class="info-table">
					<tr v-for="(row, index) in data.Rows" :key="index">
						<td class="label">{{ row.Label }}</td>
						<td class="value">{{ row.Value }}</td>
						<td class="sub-label">{{ row.SubLabel }}</td>
						<td class="sub-value">{{ row.SubValue }}</td>
					</tr>
				</table>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { IZdxCompanyInfo } from '@/interfaces/zhiduoxing/IZdxStockDetail'

const props = defineProps<{
	data?: IZdxCompanyInfo
}>()

// 简介超长折叠
const expanded = ref(false)
const tooLong = computed(() => (props.data?.Profile?.length ?? 0) > 150)

// 切换股票后重置展开状态
watch(
	() => props.data,
	() => {
		expanded.value = false
	}
)
</script>

<style lang="scss" scoped>
.company-info {
	padding: 10px 20px;
	min-height: 120px;

	.intro-box {
		margin-bottom: 24px;

		.section-title {
			font-size: 15px;
			font-weight: 600;
			color: #303133;
			padding: 6px 0 12px;
		}

		.intro-text {
			font-size: 14px;
			color: #606266;
			line-height: 26px;
			text-align: justify;

			&.collapse {
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 5;
				overflow: hidden;
			}
		}

		.expand-btn {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			margin-top: 6px;
			font-size: 13px;
			color: #409eff;
			cursor: pointer;

			svg {
				width: 10px;
				height: 10px;
			}
		}
	}

	.info-table {
		width: 100%;
		border-collapse: collapse;

		tr {
			border-bottom: 1px solid #f5f6fb;

			td {
				padding: 14px 10px;
				font-size: 14px;
				vertical-align: top;

				&.label {
					width: 14%;
					color: #a7abba;
					text-align: right;
				}

				&.value {
					width: 32%;
					color: #2e3543;
				}

				&.sub-label {
					width: 14%;
					color: #a7abba;
					text-align: right;
				}

				&.sub-value {
					color: #2e3543;
				}
			}
		}
	}
}
</style>
