<template>
	<el-container class="tech-indicator-page">
		<el-header class="header">
			<span class="search-box">
				<el-button type="primary" @click="openAdd">
					<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增指标
				</el-button>
			</span>
			<span class="button-box">
				<el-button @click="load">
					<font-awesome-icon fas icon="rotate-right"></font-awesome-icon>&nbsp;刷新
				</el-button>
			</span>
		</el-header>
		<el-main class="content">
			<!-- 说明与图例 -->
			<div class="tip-box">
				<div class="tip-head">
					<span class="tip-title">指标说明</span>
					<span class="tip-text">技术指标为蜡烛图等图表的指标目录：编码为系统标识（如 MA/MACD），新建后不可修改；分类与展示位置决定指标在图表中的归属（主图叠加/副图）；禁用后图表可选列表不再输出该指标</span>
				</div>
				<div class="legend">
					<span class="legend-item"><el-tag size="small" type="primary">趋势型</el-tag>判断价格运行方向</span>
					<span class="legend-item"><el-tag size="small" type="warning">摆动型</el-tag>超买超卖与动量</span>
					<span class="legend-item"><el-tag size="small" type="success">成交量型</el-tag>量能分析</span>
					<span class="legend-item"><el-tag size="small" type="info">波动型</el-tag>波动通道与幅度</span>
				</div>
			</div>

			<el-table :data="list" v-loading="loading" row-key="Id" class="indicator-table">
				<el-table-column prop="Code" label="编码" width="110">
					<template #default="{ row }">
						<span class="code-text">{{ row.Code }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="Name" label="指标名称" width="190" show-overflow-tooltip />
				<el-table-column prop="Category" label="分类" width="100" align="center">
					<template #default="{ row }">
						<el-tag size="small" :type="categoryTagType(row.Category)">{{ categoryLabel(row.Category) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="Position" label="展示位置" width="100" align="center">
					<template #default="{ row }">
						<el-tag v-if="row.Position === 1" size="small">{{ positionLabel(row.Position) }}</el-tag>
						<el-tag v-else size="small" type="info">{{ positionLabel(row.Position) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="Params" label="默认参数" width="110" align="center">
					<template #default="{ row }">
						<span class="params-text">{{ row.Params || '--' }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="Description" label="说明" min-width="260" show-overflow-tooltip>
					<template #default="{ row }">
						<span class="desc-text">{{ row.Description || '--' }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="SortNumber" label="排序" width="70" align="center" />
				<el-table-column prop="IsEnabled" label="启用" width="80" align="center">
					<template #default="{ row }">
						<el-tag size="small" :type="row.IsEnabled ? 'success' : 'info'">{{ row.IsEnabled ? '启用' : '禁用' }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="Modifier" label="修改人" width="110">
					<template #default="{ row }">
						<span class="modifier-text">{{ row.Modifier || '--' }}</span>
					</template>
				</el-table-column>
				<el-table-column label="更新时间" width="150">
					<template #default="{ row }">
						<span class="time-text">{{ fmtTime(row.UpdateTime) }}</span>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="130" align="center" fixed="right">
					<template #default="{ row }">
						<el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
						<el-button link type="danger" size="small" @click="removeRow(row)">删除</el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-main>
	</el-container>

	<!-- 编辑对话框 -->
	<el-dialog v-model="dialogVisible" width="560px" :title="isEdit ? '编辑指标' : '新增指标'" :close-on-click-modal="false">
		<div class="dialog-body">
			<div class="dialog-row">
				<span class="row-label">编码</span>
				<el-input v-model="form.Code" maxlength="30" :disabled="isEdit" placeholder="系统标识（如：MA、MACD），新建后不可修改" style="width: 100%" @input="onCodeInput"></el-input>
			</div>
			<div class="dialog-row">
				<span class="row-label">指标名称</span>
				<el-input v-model="form.Name" maxlength="50" show-word-limit placeholder="如：移动平均线" style="width: 100%"></el-input>
			</div>
			<div class="dialog-row">
				<span class="row-label">分类</span>
				<el-select v-model="form.Category" style="width: 100%">
					<el-option v-for="opt in ZDX_INDICATOR_CATEGORIES" :key="opt.value" :label="opt.label" :value="opt.value" />
				</el-select>
			</div>
			<div class="dialog-row">
				<span class="row-label">展示位置</span>
				<el-select v-model="form.Position" style="width: 100%">
					<el-option v-for="opt in ZDX_INDICATOR_POSITIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
				</el-select>
			</div>
			<div class="dialog-row">
				<span class="row-label">默认参数</span>
				<el-input v-model="form.Params" maxlength="100" placeholder="逗号分隔的周期序列，如：12,26,9（可空）" style="width: 100%"></el-input>
			</div>
			<div class="dialog-row align-top">
				<span class="row-label">说明</span>
				<el-input v-model="form.Description" type="textarea" :rows="3" maxlength="500" show-word-limit
					placeholder="计算口径与研判用法（如：金叉死叉、超买超卖）" style="width: 100%"></el-input>
			</div>
			<div class="dialog-row">
				<span class="row-label">排序号</span>
				<el-input-number v-model="form.SortNumber" :min="0" :max="9999" style="width: 160px"></el-input-number>
				<span class="row-tip">数值越小越靠前</span>
			</div>
			<div class="dialog-row">
				<span class="row-label">启用</span>
				<el-switch v-model="form.IsEnabled"></el-switch>
				<span class="row-tip">禁用后图表可选列表不再输出该指标</span>
			</div>
		</div>
		<template #footer>
			<el-button type="primary" :loading="saving" @click="submit">提交</el-button>
			<el-button type="warning" @click="dialogVisible = false">取消</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from '@/untils/dayjs'
import { IZdxTechnicalIndicatorManage, IZdxTechnicalIndicatorForm, ZDX_INDICATOR_CATEGORIES, ZDX_INDICATOR_POSITIONS } from '@/interfaces/zhiduoxing/IZdxTechnicalIndicator'
import API from '@/apis/zdx-api'

const loading = ref(false) // 加载中
const saving = ref(false) // 保存中
const list = ref<IZdxTechnicalIndicatorManage[]>([]) // 指标列表

// 编辑对话框
const dialogVisible = ref(false)
const isEdit = ref(false) // 编辑模式（编码禁用修改）
const editId = ref(0) // 编辑目标 Id
const form = ref<IZdxTechnicalIndicatorForm>({ Code: '', Name: '', Category: 1, Position: 1, Params: '', Description: '', SortNumber: 1, IsEnabled: true })

onMounted(() => {
	load()
})

// 加载指标列表（失败时清空；提示由拦截器统一弹出）
async function load() {
	loading.value = true
	try {
		list.value = await API.getTechnicalIndicatorList()
	} catch {
		list.value = []
	} finally {
		loading.value = false
	}
}

// 编码输入自动转大写（统一为系统标识风格，如 MA、MACD）
function onCodeInput(val: string) {
	form.value.Code = (val || '').toUpperCase()
}

// 打开新增对话框（排序号默认取列表最大值 +1）
function openAdd() {
	const maxSort = list.value.reduce((max, item) => Math.max(max, item.SortNumber), 0)
	isEdit.value = false
	editId.value = 0
	form.value = { Code: '', Name: '', Category: 1, Position: 2, Params: '', Description: '', SortNumber: maxSort + 1, IsEnabled: true }
	dialogVisible.value = true
}

// 打开编辑对话框（编码仅展示不可修改）
function openEdit(row: IZdxTechnicalIndicatorManage) {
	isEdit.value = true
	editId.value = row.Id
	form.value = {
		Code: row.Code,
		Name: row.Name,
		Category: row.Category,
		Position: row.Position,
		Params: row.Params ?? '',
		Description: row.Description ?? '',
		SortNumber: row.SortNumber,
		IsEnabled: row.IsEnabled
	}
	dialogVisible.value = true
}

// 提交（新增/编辑；成功信息由拦截器统一弹出，关闭对话框并刷新）
async function submit() {
	if (!isEdit.value && !form.value.Code?.trim()) {
		ElMessage.warning('请输入指标编码')
		return
	}
	if (!form.value.Name?.trim()) {
		ElMessage.warning('请输入指标名称')
		return
	}
	if (saving.value) return

	saving.value = true
	try {
		const res = isEdit.value
			? await API.updateTechnicalIndicator(editId.value, form.value)
			: await API.addTechnicalIndicator(form.value)
		if (res.Status) {
			dialogVisible.value = false
			load()
		}
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		saving.value = false
	}
}

// 删除（确认后删除；删除后图表可选列表不再输出该指标）
function removeRow(row: IZdxTechnicalIndicatorManage) {
	ElMessageBox.confirm(`确认删除指标「${row.Name}（${row.Code}）」？删除后图表可选列表将不再输出该指标。`,
		'删除指标提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	})
		.then(async () => {
			try {
				const res = await API.delTechnicalIndicator(row.Id)
				if (res.Status) load()
			} catch {
				// 失败信息由响应拦截器统一弹出通知
			}
		})
		.catch(() => {
			// 用户取消
		})
}

// 分类展示文案
function categoryLabel(category: number): string {
	const opt = ZDX_INDICATOR_CATEGORIES.find(e => e.value === category)
	return opt ? opt.label : '未知'
}

// 分类标签类型（趋势=蓝 摆动=橙 成交量=绿 波动=灰）
function categoryTagType(category: number): 'primary' | 'warning' | 'success' | 'info' {
	const opt = ZDX_INDICATOR_CATEGORIES.find(e => e.value === category)
	return (opt ? opt.tag : 'info') as 'primary' | 'warning' | 'success' | 'info'
}

// 展示位置文案
function positionLabel(position: number): string {
	const opt = ZDX_INDICATOR_POSITIONS.find(e => e.value === position)
	return opt ? opt.label : '未知'
}

// 时间格式化（yyyy-MM-dd HH:mm）
function fmtTime(time?: string): string {
	return time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '--'
}
</script>

<style lang="scss" scoped>
.tech-indicator-page {
	background: #fff;
	border-radius: 20px;
	padding: 20px;

	.header {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		height: auto;

		.search-box {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 6px 4px;
		}

		.button-box {
			display: flex;
			align-items: flex-start;
		}
	}

	.content {
		padding: 0;

		.tip-box {
			border: 1px solid #e4e7ed;
			border-radius: 8px;
			background: #fafafa;
			padding: 12px 16px;
			margin-bottom: 16px;

			.tip-head {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				margin-bottom: 10px;
			}

			.tip-title {
				color: #303133;
				font-weight: bold;
				margin-right: 12px;
			}

			.tip-text {
				color: #909399;
				font-size: 13px;
				line-height: 1.7;
			}

			.legend {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 16px;

				.legend-item {
					display: flex;
					align-items: center;
					gap: 6px;
					color: #606266;
					font-size: 13px;
				}
			}
		}

		.indicator-table {
			.code-text {
				font-weight: 600;
				color: #303133;
			}

			.params-text {
				color: #606266;
				font-variant-numeric: tabular-nums;
			}

			.desc-text {
				color: #606266;
			}

			.modifier-text,
			.time-text {
				color: #909399;
				font-size: 13px;
				font-variant-numeric: tabular-nums;
			}
		}
	}
}

.dialog-body {
	.dialog-row {
		display: flex;
		align-items: center;
		margin-bottom: 18px;

		&.align-top {
			align-items: flex-start;

			.row-label {
				line-height: 32px;
			}
		}

		.row-label {
			width: 70px;
			color: #606266;
			flex-shrink: 0;
		}

		.row-tip {
			margin-left: 10px;
			color: #909399;
			font-size: 12px;
		}
	}
}
</style>
