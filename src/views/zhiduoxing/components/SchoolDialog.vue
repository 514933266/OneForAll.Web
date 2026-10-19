<template>
	<el-dialog :model-value="modelValue" title="流派评定" width="640px" :close-on-click-modal="false"
		@update:model-value="v => emit('update:modelValue', v)">
		<div class="dialog-tip">
			<span>选择最符合你的流派（随时可重新评定）</span>
			<span v-if="profile?.SchoolId" class="current-tag">当前：{{ profile.SchoolName }}</span>
		</div>

		<!-- 流派卡片单选（数据来自后台流派管理；仅启用项） -->
		<div v-loading="loading" class="card-grid">
			<div v-for="opt in options" :key="opt.Id" class="school-card"
				:class="['tone-' + opt.Tone, { active: selectedId === opt.Id }]" @click="selectedId = opt.Id">
				<font-awesome-icon v-if="opt.Icon" fas :icon="opt.Icon" class="sc-icon"></font-awesome-icon>
				<span class="sc-name">{{ opt.Name }}</span>
				<span class="sc-desc">{{ opt.Description || '--' }}</span>
				<font-awesome-icon v-if="selectedId === opt.Id" fas icon="circle-check" class="sc-check"></font-awesome-icon>
			</div>
			<el-empty v-if="!loading && !options.length" description="暂无可选流派，请先在后台维护" :image-size="60" class="card-empty" />
		</div>

		<!-- 一句话说明（可选） -->
		<div class="note-row">
			<span class="note-label">一句话说明（可选）</span>
			<el-input v-model="note" maxlength="200" show-word-limit placeholder="如：专注首板，只做最强票" style="width: 100%"></el-input>
		</div>

		<!-- 实测画像对照（有数据时展示） -->
		<div v-if="statsSummary" class="real-box">
			<div class="real-title">你的实测画像</div>
			<div class="real-line">{{ statsSummary }}</div>
			<div v-if="selectedOption?.CompareNote" class="real-compare">
				<font-awesome-icon fas icon="crosshairs"></font-awesome-icon>
				<span>对照说明：{{ selectedOption.CompareNote }}</span>
			</div>
		</div>

		<template #footer>
			<el-button v-if="profile?.SchoolId" type="info" plain @click="clearSchool">清除评定</el-button>
			<el-button type="warning" @click="emit('update:modelValue', false)">取消</el-button>
			<el-button type="primary" :loading="saving" @click="submit">保存流派</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { IZdxMyProfile, IZdxSchoolOption } from '@/interfaces/zhiduoxing/IZdxSchool'
import { IZdxBehaviorStats } from '@/interfaces/zhiduoxing/IZdxMyTrade'
import API from '@/apis/zdx-api'

const props = defineProps<{
	modelValue: boolean
	behaviorStats?: IZdxBehaviorStats | null
}>()

const emit = defineEmits<{
	(e: 'update:modelValue', v: boolean): void
	(e: 'saved'): void
}>()

const loading = ref(false) // 档案与选项加载中
const saving = ref(false) // 保存中
const profile = ref<IZdxMyProfile | null>(null) // 我的档案（打开时刷新）
const selectedId = ref<number | null>(null) // 选中的流派 Id
const note = ref('') // 一句话说明

// 可选流派列表（仅启用项）
const options = computed(() => profile.value?.Options ?? [])
// 选中的流派选项（展示对照说明）
const selectedOption = computed<IZdxSchoolOption | undefined>(() => options.value.find(o => o.Id === selectedId.value))

// 实测画像摘要（主风格 · 平均持有 · 高位买入占比；无数据时隐藏）
const statsSummary = computed(() => {
	const s = props.behaviorStats
	if (!s || !s.HasData || !s.TradeStyle) return null
	const parts: string[] = [`主风格：${s.TradeStyle}`]
	if (s.HoldPeriod?.AvgHoldDays) parts.push(`平均持有 ${s.HoldPeriod.AvgHoldDays} 天`)
	const valid = s.Timing?.ValidBuyCount ?? 0
	if (valid > 0) parts.push(`高位买入 ${Math.round((s.Timing.BuyHighCount / valid) * 100)}%`)
	return parts.join(' · ')
})

// 每次打开时刷新档案与选项，并回填当前评定
watch(() => props.modelValue, v => {
	if (v) init()
})

async function init() {
	loading.value = true
	note.value = ''
	selectedId.value = null
	try {
		profile.value = await API.getMyProfile()
		selectedId.value = profile.value.SchoolId ?? null
		note.value = profile.value.SchoolNote ?? ''
	} catch {
		profile.value = null
	} finally {
		loading.value = false
	}
}

// 保存评定（成功信息由拦截器统一弹出；通知父组件刷新）
async function submit() {
	if (!selectedId.value) {
		ElMessage.warning('请选择一个流派')
		return
	}
	if (saving.value) return

	saving.value = true
	try {
		const res = await API.saveMySchool({ SchoolId: selectedId.value, SchoolNote: note.value })
		if (res.Status) {
			emit('update:modelValue', false)
			emit('saved')
		}
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		saving.value = false
	}
}

// 清除评定（确认后清除；流派与说明一并清空）
function clearSchool() {
	ElMessageBox.confirm('确认清除当前流派评定？清除后可随时重新评定。', '清除评定提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	})
		.then(async () => {
			try {
				const res = await API.saveMySchool({ SchoolId: null, SchoolNote: '' })
				if (res.Status) {
					emit('update:modelValue', false)
					emit('saved')
				}
			} catch {
				// 失败信息由响应拦截器统一弹出通知
			}
		})
		.catch(() => {
			// 用户取消
		})
}
</script>

<style lang="scss" scoped>
.dialog-tip {
	display: flex;
	align-items: center;
	justify-content: space-between;
	color: #606266;
	font-size: 13px;
	margin-bottom: 12px;

	.current-tag {
		color: #409eff;
		background: #ecf5ff;
		border-radius: 10px;
		padding: 2px 10px;
		font-size: 12px;
	}
}

.card-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 12px;
	min-height: 80px;
	margin-bottom: 16px;

	.card-empty {
		grid-column: 1 / -1;
		padding: 0;
	}
}

.school-card {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 6px;
	border: 2px solid #e4e7ed;
	border-radius: 10px;
	padding: 14px 10px;
	cursor: pointer;
	transition: border-color .2s, box-shadow .2s, background .2s;

	&:hover {
		border-color: #c0c4cc;
	}

	.sc-icon {
		font-size: 22px;
	}

	.sc-name {
		font-weight: 600;
		color: #303133;
	}

	.sc-desc {
		font-size: 12px;
		color: #909399;
		line-height: 1.5;
	}

	.sc-check {
		position: absolute;
		top: 6px;
		right: 6px;
		font-size: 14px;
	}
}

// 选中态与色调（图标/边框/勾选颜色随流派色调）
.school-card.active {
	box-shadow: 0 2px 10px rgba(0, 0, 0, .08);
}

.school-card {
	&.tone-info {
		.sc-icon, .sc-check { color: #409eff; }
		&.active { border-color: #409eff; background: #ecf5ff; }
	}

	&.tone-good {
		.sc-icon, .sc-check { color: #67c23a; }
		&.active { border-color: #67c23a; background: #f0f9eb; }
	}

	&.tone-warn {
		.sc-icon, .sc-check { color: #e6a23c; }
		&.active { border-color: #e6a23c; background: #fdf6ec; }
	}

	&.tone-danger {
		.sc-icon, .sc-check { color: #f56c6c; }
		&.active { border-color: #f56c6c; background: #fef0f0; }
	}
}

.note-row {
	display: flex;
	align-items: center;
	margin-bottom: 14px;

	.note-label {
		width: 130px;
		flex-shrink: 0;
		color: #606266;
		font-size: 13px;
	}
}

.real-box {
	border: 1px dashed #dcdfe6;
	border-radius: 8px;
	background: #fafafa;
	padding: 10px 14px;

	.real-title {
		color: #909399;
		font-size: 12px;
		margin-bottom: 6px;
	}

	.real-line {
		color: #303133;
		font-size: 13px;
		font-variant-numeric: tabular-nums;
	}

	.real-compare {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		margin-top: 6px;
		color: #606266;
		font-size: 12px;
		line-height: 1.6;

		svg {
			margin-top: 3px;
			color: #409eff;
			flex-shrink: 0;
		}
	}
}
</style>
