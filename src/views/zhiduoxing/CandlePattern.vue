<template>
	<el-container class="candle-pattern-page">
		<el-header class="header">
			<span class="search-box">
				<el-button type="primary" @click="openAdd">
					<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增形态
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
					<span class="tip-title">形态说明</span>
					<span class="tip-text">K线形态指标为蜡烛图经典形态的知识库：编码为系统标识（如 THREE_WHITE_SOLDIERS），新建后不可修改；示意图形由内置K线画板图形化绘制（拖动实体/圆点或输入数值）；禁用后图表形态标注参考不再输出该形态</span>
				</div>
				<div class="legend">
					<span class="legend-item"><el-tag size="small" type="danger">看涨</el-tag>底部反转/上涨信号</span>
					<span class="legend-item"><el-tag size="small" type="success">看跌</el-tag>顶部反转/下跌信号</span>
					<span class="legend-item"><el-tag size="small" type="info">中性</el-tag>多空待确认</span>
					<span class="legend-item"><el-tag size="small" type="primary">反转形态</el-tag>趋势转折</span>
					<span class="legend-item"><el-tag size="small" type="warning">持续形态</el-tag>趋势中继</span>
					<span class="legend-item"><el-tag size="small" type="success">缺口形态</el-tag>跳空缺口</span>
					<span class="legend-item"><el-tag size="small" type="info">其他形态</el-tag>单K线提示</span>
				</div>
			</div>

			<el-table :data="list" v-loading="loading" row-key="Id" class="pattern-table">
				<el-table-column prop="Code" label="编码" width="180">
					<template #default="{ row }">
						<span class="code-text">{{ row.Code }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="Name" label="形态名称" width="130" show-overflow-tooltip />
				<el-table-column prop="Direction" label="方向" width="80" align="center">
					<template #default="{ row }">
						<el-tag size="small" :type="directionTagType(row.Direction)">{{ directionLabel(row.Direction) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="Category" label="分类" width="100" align="center">
					<template #default="{ row }">
						<el-tag size="small" :type="categoryTagType(row.Category)">{{ categoryLabel(row.Category) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="形态图形" width="170" align="center">
					<template #default="{ row }">
						<CandlePatternChart :candles="row.Candles" :width="150" :height="52" />
					</template>
				</el-table-column>
				<el-table-column prop="Description" label="说明" min-width="240" show-overflow-tooltip>
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
				<el-table-column prop="Modifier" label="修改人" width="100">
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

	<!-- 编辑对话框（含K线画板图形化设置） -->
	<el-dialog v-model="dialogVisible" width="780px" :title="isEdit ? '编辑形态' : '新增形态'" :close-on-click-modal="false" top="3vh" class="pattern-dialog">
		<div class="dialog-body">
			<div class="dialog-row">
				<span class="row-label">编码</span>
				<el-input v-model="form.Code" maxlength="30" :disabled="isEdit" placeholder="系统标识（如：THREE_WHITE_SOLDIERS），新建后不可修改" style="width: 320px" @input="onCodeInput"></el-input>
				<span class="row-label ml">形态名称</span>
				<el-input v-model="form.Name" maxlength="50" placeholder="如：红三兵、乌云盖顶" style="width: 240px"></el-input>
			</div>
			<div class="dialog-row">
				<span class="row-label">方向</span>
				<el-select v-model="form.Direction" style="width: 150px">
					<el-option v-for="opt in ZDX_PATTERN_DIRECTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
				</el-select>
				<span class="row-label ml">分类</span>
				<el-select v-model="form.Category" style="width: 170px">
					<el-option v-for="opt in ZDX_PATTERN_CATEGORIES" :key="opt.value" :label="opt.label" :value="opt.value" />
				</el-select>
				<span class="row-label ml">排序号</span>
				<el-input-number v-model="form.SortNumber" :min="0" :max="9999" style="width: 130px"></el-input-number>
			</div>
			<div class="dialog-row align-top">
				<span class="row-label">形态图形</span>
				<div class="draw-box">
					<CandlePatternEditor v-model="form.Candles" />
				</div>
			</div>
			<div class="dialog-row align-top">
				<span class="row-label">说明</span>
				<el-input v-model="form.Description" type="textarea" :rows="2" maxlength="500" show-word-limit
					placeholder="形态结构特征与研判用法（如：连续三根阳线、收盘逐日抬高等）" style="width: 100%"></el-input>
			</div>
			<div class="dialog-row">
				<span class="row-label">启用</span>
				<el-switch v-model="form.IsEnabled"></el-switch>
				<span class="row-tip">禁用后图表形态标注参考不再输出该形态</span>
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
import { IZdxCandlePatternManage, IZdxCandlePatternForm, ZDX_PATTERN_DIRECTIONS, ZDX_PATTERN_CATEGORIES } from '@/interfaces/zhiduoxing/IZdxCandlePattern'
import CandlePatternChart from './components/CandlePatternChart.vue'
import CandlePatternEditor from './components/CandlePatternEditor.vue'
import API from '@/apis/zdx-api'

const loading = ref(false) // 加载中
const saving = ref(false) // 保存中
const list = ref<IZdxCandlePatternManage[]>([]) // 形态列表

// 编辑对话框
const dialogVisible = ref(false)
const isEdit = ref(false) // 编辑模式（编码禁用修改）
const editId = ref(0) // 编辑目标 Id
const form = ref<IZdxCandlePatternForm>({ Code: '', Name: '', Direction: 1, Category: 1, Candles: '', Description: '', SortNumber: 1, IsEnabled: true })

// 默认示意图形（三根阳线示意，打开新增时初始化）
const DEFAULT_CANDLES = JSON.stringify([{ o: 30, h: 42, l: 26, c: 40 }, { o: 36, h: 54, l: 34, c: 52 }, { o: 48, h: 66, l: 46, c: 64 }])

onMounted(() => {
	load()
})

// 加载形态列表（失败时清空；提示由拦截器统一弹出）
async function load() {
	loading.value = true
	try {
		list.value = await API.getCandlePatternList()
	} catch {
		list.value = []
	} finally {
		loading.value = false
	}
}

// 编码输入自动转大写（统一为系统标识风格，如 THREE_WHITE_SOLDIERS）
function onCodeInput(val: string) {
	form.value.Code = (val || '').toUpperCase()
}

// 打开新增对话框（排序号默认取列表最大值 +1）
function openAdd() {
	const maxSort = list.value.reduce((max, item) => Math.max(max, item.SortNumber), 0)
	isEdit.value = false
	editId.value = 0
	form.value = { Code: '', Name: '', Direction: 1, Category: 1, Candles: DEFAULT_CANDLES, Description: '', SortNumber: maxSort + 1, IsEnabled: true }
	dialogVisible.value = true
}

// 打开编辑对话框（编码仅展示不可修改；画板回显已保存的示意图形）
function openEdit(row: IZdxCandlePatternManage) {
	isEdit.value = true
	editId.value = row.Id
	form.value = {
		Code: row.Code,
		Name: row.Name,
		Direction: row.Direction,
		Category: row.Category,
		Candles: row.Candles,
		Description: row.Description ?? '',
		SortNumber: row.SortNumber,
		IsEnabled: row.IsEnabled
	}
	dialogVisible.value = true
}

// 提交（新增/编辑；成功信息由拦截器统一弹出，关闭对话框并刷新）
async function submit() {
	if (!isEdit.value && !form.value.Code?.trim()) {
		ElMessage.warning('请输入形态编码')
		return
	}
	if (!form.value.Name?.trim()) {
		ElMessage.warning('请输入形态名称')
		return
	}
	if (saving.value) return

	saving.value = true
	try {
		const res = isEdit.value
			? await API.updateCandlePattern(editId.value, form.value)
			: await API.addCandlePattern(form.value)
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

// 删除（确认后删除；删除后图表形态标注参考不再输出该形态）
function removeRow(row: IZdxCandlePatternManage) {
	ElMessageBox.confirm(`确认删除形态「${row.Name}（${row.Code}）」？删除后图表形态标注参考将不再输出该形态。`,
		'删除形态提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	})
		.then(async () => {
			try {
				const res = await API.delCandlePattern(row.Id)
				if (res.Status) load()
			} catch {
				// 失败信息由响应拦截器统一弹出通知
			}
		})
		.catch(() => {
			// 用户取消
		})
}

// 方向展示文案
function directionLabel(direction: number): string {
	const opt = ZDX_PATTERN_DIRECTIONS.find(e => e.value === direction)
	return opt ? opt.label : '未知'
}

// 方向标签类型（看涨=红 看跌=绿 中性=灰）
function directionTagType(direction: number): 'primary' | 'warning' | 'success' | 'info' | 'danger' {
	const opt = ZDX_PATTERN_DIRECTIONS.find(e => e.value === direction)
	return (opt ? opt.tag : 'info') as 'primary' | 'warning' | 'success' | 'info' | 'danger'
}

// 分类展示文案
function categoryLabel(category: number): string {
	const opt = ZDX_PATTERN_CATEGORIES.find(e => e.value === category)
	return opt ? opt.label : '未知'
}

// 分类标签类型
function categoryTagType(category: number): 'primary' | 'warning' | 'success' | 'info' {
	const opt = ZDX_PATTERN_CATEGORIES.find(e => e.value === category)
	return (opt ? opt.tag : 'info') as 'primary' | 'warning' | 'success' | 'info'
}

// 时间格式化（yyyy-MM-dd HH:mm）
function fmtTime(time?: string): string {
	return time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '--'
}
</script>

<style lang="scss" scoped>
.candle-pattern-page {
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
				gap: 14px;

				.legend-item {
					display: flex;
					align-items: center;
					gap: 6px;
					color: #606266;
					font-size: 13px;
				}
			}
		}

		.pattern-table {
			.code-text {
				font-weight: 600;
				color: #303133;
				font-size: 13px;
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
		flex-wrap: wrap;
		margin-bottom: 14px;

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

			&.ml {
				margin-left: 14px;
				width: auto;
				padding-right: 10px;
			}
		}

		.row-tip {
			margin-left: 10px;
			color: #909399;
			font-size: 12px;
		}

		.draw-box {
			flex: 1;
			min-width: 0;
		}
	}
}
</style>

<style lang="scss">
/* 编辑对话框：内容超高时弹窗内部滚动，防止下方控件穿出弹窗 */
.pattern-dialog {
	.el-dialog__body {
		max-height: calc(94vh - 150px);
		overflow-y: auto;
		overflow-x: hidden;
	}
}
</style>
