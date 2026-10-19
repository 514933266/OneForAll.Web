<template>
	<div class="candle-editor">
		<!-- 工具栏：K线根数与操作提示 -->
		<div class="ce-toolbar">
			<span class="ce-label">K线根数</span>
			<el-button-group>
				<el-button size="small" :disabled="items.length <= 1" @click="removeCandle">减少</el-button>
				<el-button size="small" disabled class="ce-count">{{ items.length }}</el-button>
				<el-button size="small" :disabled="items.length >= 8" @click="addCandle">增加</el-button>
			</el-button-group>
			<el-button size="small" type="primary" plain @click="openRecognize">
				<font-awesome-icon fas icon="wand-magic-sparkles"></font-awesome-icon>&nbsp;截图识别
			</el-button>
			<span class="ce-tip">拖动实体调整开盘/收盘，拖动圆点调整最高/最低；也可用下方数值精确设置（坐标系 0~100，红涨绿跌）</span>
		</div>

		<!-- K线画板（拖拽编辑；viewBox 固定 0 0 640 360） -->
		<svg ref="svgRef" class="ce-board" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid meet"
			@pointermove="onMove" @pointerup="onUp" @pointerleave="onUp">
			<!-- 参考线（25/50/75 三档） -->
			<line v-for="g in [25, 50, 75]" :key="g" x1="16" x2="624" :y1="cy(g)" :y2="cy(g)" stroke="#eef0f3" stroke-dasharray="4 4" />
			<line x1="16" x2="624" :y1="cy(0)" :y2="cy(0)" stroke="#e4e7ed" />
			<line x1="16" x2="624" :y1="cy(100)" :y2="cy(100)" stroke="#e4e7ed" />

			<!-- K线（悬停/选中显示调整手柄） -->
			<g v-for="(k, i) in items" :key="i" @mouseenter="hoverIndex = i" @mouseleave="hoverIndex = null">
				<line :x1="cx(i)" :x2="cx(i)" :y1="cy(k.h)" :y2="cy(k.l)" :stroke="color(k)" stroke-width="2" />
				<rect class="ce-body" :class="{ active: selectedIndex === i }" :x="cx(i) - barWidth / 2"
					:y="cy(Math.max(k.o, k.c))" :width="barWidth" :height="bodyHeight(k)" :fill="color(k)" rx="1"
					@pointerdown="onDown($event, i, 'body')" />
				<template v-if="hoverIndex === i || selectedIndex === i">
					<g class="ce-handle" @pointerdown="onDown($event, i, 'high')">
						<circle :cx="cx(i)" :cy="cy(k.h)" r="10" fill="transparent" />
						<circle :cx="cx(i)" :cy="cy(k.h)" r="4.5" fill="#fff" :stroke="color(k)" stroke-width="2" />
					</g>
					<g class="ce-handle" @pointerdown="onDown($event, i, 'low')">
						<circle :cx="cx(i)" :cy="cy(k.l)" r="10" fill="transparent" />
						<circle :cx="cx(i)" :cy="cy(k.l)" r="4.5" fill="#fff" :stroke="color(k)" stroke-width="2" />
					</g>
					<g class="ce-handle" @pointerdown="onDown($event, i, 'top')">
						<circle :cx="cx(i)" :cy="cy(Math.max(k.o, k.c))" r="10" fill="transparent" />
						<circle :cx="cx(i)" :cy="cy(Math.max(k.o, k.c))" r="4.5" fill="#fff" :stroke="color(k)" stroke-width="2" />
					</g>
					<g class="ce-handle" @pointerdown="onDown($event, i, 'bottom')">
						<circle :cx="cx(i)" :cy="cy(Math.min(k.o, k.c))" r="10" fill="transparent" />
						<circle :cx="cx(i)" :cy="cy(Math.min(k.o, k.c))" r="4.5" fill="#fff" :stroke="color(k)" stroke-width="2" />
					</g>
				</template>
			</g>
		</svg>

		<!-- 数值精确设置（每根K线一组：开盘/最高/最低/收盘） -->
		<div class="ce-inputs">
			<div v-for="(k, i) in items" :key="i" class="ce-cell" :class="{ active: selectedIndex === i }" @click="selectedIndex = i">
				<span class="ce-no" :style="{ background: color(k) }">{{ i + 1 }}</span>
				<span class="ce-field"><em>开盘</em><el-input-number v-model="k.o" :controls="false" :min="0" :max="100" :precision="1" size="small" @change="onInput()" /></span>
				<span class="ce-field"><em>最高</em><el-input-number v-model="k.h" :controls="false" :min="0" :max="100" :precision="1" size="small" @change="onInput()" /></span>
				<span class="ce-field"><em>最低</em><el-input-number v-model="k.l" :controls="false" :min="0" :max="100" :precision="1" size="small" @change="onInput()" /></span>
				<span class="ce-field"><em>收盘</em><el-input-number v-model="k.c" :controls="false" :min="0" :max="100" :precision="1" size="small" @change="onInput()" /></span>
			</div>
		</div>

		<!-- 截图识别对话框：上传/拖拽/粘贴截图，自动识别红涨绿跌K线后应用到画板 -->
		<el-dialog v-model="recVisible" title="截图识别形态" width="560px" top="6vh" append-to-body :close-on-click-modal="false">
			<div class="rec-body">
				<div class="rec-upload" :class="{ 'has-image': !!recImage }" @click="pickFile" @dragover.prevent @drop.prevent="onDrop">
					<template v-if="!recImage">
						<font-awesome-icon fas icon="image" class="rec-up-icon"></font-awesome-icon>
						<div class="rec-up-text">点击选择截图，或拖拽图片到此处，也支持 Ctrl+V 粘贴</div>
						<div class="rec-up-tip">请仅截取K线区域（1~8 根，红涨绿跌），避免包含均线 / 指标 / 文字等干扰元素</div>
					</template>
					<img v-else :src="recImage" class="rec-preview" alt="识别源图" />
				</div>
				<input ref="fileRef" type="file" accept="image/*" class="rec-file" @change="onFileChange" />

				<div v-if="recLoading" class="rec-status">正在识别，请稍候...</div>
				<el-alert v-else-if="recError" type="error" :title="recError" :closable="false" show-icon class="rec-alert"></el-alert>
				<template v-else-if="recCandles">
					<div class="rec-result">
						<el-tag type="success" size="small">识别到 {{ recCandles.length }} 根K线</el-tag>
						<span class="rec-result-tip">已按红涨绿跌解析开盘 / 最高 / 最低 / 收盘，应用后仍可在画板微调</span>
					</div>
					<CandlePatternChart :candles="recPreviewJson" :width="360" :height="120" class="rec-chart" />
				</template>
			</div>
			<template #footer>
				<el-button type="primary" :disabled="!recCandles" @click="applyRecognized">应用到画板</el-button>
				<el-button @click="recVisible = false">取消</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
// K线形态示意图形画板编辑器：拖拽/输入绘制 1~8 根K线的形态图形
// 数据契约：props.modelValue 为 JSON 数组字符串 [{"o":18,"h":34,"l":14,"c":32},...]
// 坐标系：0~100 固定值域（0=底部 100=顶部，与真实价格无关）；几何不变量：h≥max(o,c)、l≤min(o,c)
// 交互：拖动实体=整体平移；拖动实体上/下沿手柄=调整收盘/开盘方向极值；拖动圆点=调整最高/最低
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { IZdxCandleShape } from '@/interfaces/zhiduoxing/IZdxCandlePattern'
import { recognizeCandlesFromImage, IRecognizedCandle } from '@/untils/candleRecognize'
import CandlePatternChart from './CandlePatternChart.vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

// 画板 viewBox 尺寸与边距（值 0~100 映射到纵向 332 单位）
const VBW = 640
const VBH = 360
const PADX = 16
const PADY = 14
const INNER = VBH - 2 * PADY

// 涨红跌绿（与行情页一致）
const upColor = '#f56c6c'
const downColor = '#67c23a'

const svgRef = ref<SVGSVGElement>()
const items = ref<IZdxCandleShape[]>([])
const hoverIndex = ref<number | null>(null)
const selectedIndex = ref<number>(0)
// 当前拖拽会话（记录起始快照，按 originals 计算不累积误差）
const drag = ref<{ index: number; part: string; startY: number; orig: IZdxCandleShape } | null>(null)

// 外部值同步（内部 emit 后值相同的跳过，避免重复解析）
watch(() => props.modelValue, (v) => {
	const arr = parseCandles(v)
	if (JSON.stringify(arr) === JSON.stringify(items.value)) return
	items.value = arr
	if (selectedIndex.value >= arr.length) selectedIndex.value = 0
}, { immediate: true })

// 解析 JSON（非法或空时返回默认单根K线；键统一小写 o/h/l/c）
function parseCandles(v: string): IZdxCandleShape[] {
	try {
		const arr = JSON.parse(v || '[]')
		if (Array.isArray(arr) && arr.length) {
			return arr.slice(0, 8).map((k: any) => ({
				o: num(k?.o, 30),
				h: num(k?.h, 60),
				l: num(k?.l, 25),
				c: num(k?.c, 55)
			}))
		}
	} catch {
		// 解析失败按空处理
	}
	return [{ o: 30, h: 60, l: 25, c: 55 }]
}

// 数值兜底（非法回退默认值，截断到 0~100 并保留1位小数）
function num(v: any, def: number): number {
	const n = Number(v)
	return r1(clamp(Number.isFinite(n) ? n : def, 0, 100))
}

// ---------- 渲染坐标与样式 ----------

// 每根K线槽位宽度
const slot = () => (VBW - 2 * PADX) / items.value.length
// 实体宽度
const barWidth = Math.min(44, (VBW - 2 * PADX) / 8 * 0.55)

// X 坐标：槽位中点
function cx(i: number): number {
	return PADX + slot() * (i + 0.5)
}

// Y 坐标：值（0~100）→ 纵向像素（0=底部、100=顶部）
function cy(v: number): number {
	return VBH - PADY - v / 100 * INNER
}

// 实体高度（至少 2 保证小实体可见）
function bodyHeight(k: IZdxCandleShape): number {
	return Math.max(2, cy(Math.min(k.o, k.c)) - cy(Math.max(k.o, k.c)))
}

// 实体颜色（阳线红、阴线绿、平盘红）
function color(k: IZdxCandleShape): string {
	return k.c >= k.o ? upColor : downColor
}

// ---------- 拖拽交互 ----------

function onDown(e: PointerEvent, index: number, part: string) {
	e.preventDefault()
	e.stopPropagation()
	selectedIndex.value = index
	const target = e.target as Element
	try {
		target.setPointerCapture(e.pointerId)
	} catch {
		// 捕获失败不阻断拖拽（pointermove 仍冒泡至 svg）
	}
	drag.value = { index, part, startY: e.clientY, orig: { ...items.value[index] } }
}

function onMove(e: PointerEvent) {
	if (!drag.value || !svgRef.value) return
	const rect = svgRef.value.getBoundingClientRect()
	if (!rect.height) return
	// 像素位移 → 值位移（向上为增）
	const dval = -(e.clientY - drag.value.startY) * (VBH / rect.height) / INNER * 100
	applyDrag(dval)
}

function onUp() {
	if (!drag.value) return
	drag.value = null
	emitModel()
}

// 按拖拽部位应用位移（基于起始快照计算；统一维护几何不变量）
function applyDrag(dval: number) {
	const d = drag.value
	if (!d) return
	const it = items.value[d.index]
	if (!it) return
	const o = d.orig
	const top = Math.max(o.o, o.c)
	const bottom = Math.min(o.o, o.c)

	if (d.part === 'body') {
		// 整体平移：不越 2~98
		let shift = Math.min(dval, 98 - o.h)
		shift = Math.max(shift, 2 - o.l)
		it.o = r1(o.o + shift)
		it.c = r1(o.c + shift)
		it.h = r1(o.h + shift)
		it.l = r1(o.l + shift)
	} else if (d.part === 'top') {
		// 实体上沿 = max(o,c)：阳线调整收盘、阴线调整开盘
		const nt = r1(clamp(top + dval, bottom, o.h))
		if (o.c >= o.o) it.c = nt
		else it.o = nt
	} else if (d.part === 'bottom') {
		// 实体下沿 = min(o,c)：阳线调整开盘、阴线调整收盘
		const nb = r1(clamp(bottom + dval, o.l, top))
		if (o.c >= o.o) it.o = nb
		else it.c = nb
	} else if (d.part === 'high') {
		// 最高：不低于实体上沿
		it.h = r1(clamp(o.h + dval, top, 98))
	} else if (d.part === 'low') {
		// 最低：不高于实体下沿
		it.l = r1(clamp(o.l + dval, 2, bottom))
	}
	emitModel()
}

// 数值输入变更（四个值任意变更后统一修正几何并回写）
function onInput() {
	emitModel()
}

// K线根数增减
function addCandle() {
	if (items.value.length >= 8) return
	const last = items.value[items.value.length - 1]
	const base = last ? last.c : 45
	const o = clamp(base, 2, 90)
	const c = clamp(base + 10, 10, 98)
	const h = clamp(Math.max(o, c) + 8, 12, 98)
	const l = clamp(Math.min(o, c) - 8, 2, 88)
	items.value.push({ o: r1(o), h: r1(h), l: r1(l), c: r1(c) })
	selectedIndex.value = items.value.length - 1
	emitModel()
}

function removeCandle() {
	if (items.value.length <= 1) return
	items.value.pop()
	if (selectedIndex.value >= items.value.length) selectedIndex.value = items.value.length - 1
	emitModel()
}

// 统一回写：值取整到位 + 几何不变量修正（h≥max(o,c)、l≤min(o,c)），再向外 emit
function emitModel() {
	for (const k of items.value) {
		k.o = r1(k.o)
		k.h = r1(k.h)
		k.l = r1(k.l)
		k.c = r1(k.c)
		const top = Math.max(k.o, k.c)
		const bottom = Math.min(k.o, k.c)
		if (k.h < top) k.h = top
		if (k.l > bottom) k.l = bottom
	}
	emit('update:modelValue', JSON.stringify(items.value))
}

// 保留1位小数
function r1(v: number): number {
	return Math.round(v * 10) / 10
}

// 区间钳制
function clamp(v: number, lo: number, hi: number): number {
	return Math.min(Math.max(v, lo), hi)
}

// ---------- 截图识别 ----------

const recVisible = ref(false) // 识别对话框显示
const recImage = ref('') // 识别源图（dataURL 预览）
const recLoading = ref(false) // 识别中
const recCandles = ref<IRecognizedCandle[] | null>(null) // 识别结果
const recError = ref('') // 识别失败原因
const fileRef = ref<HTMLInputElement>()

// 识别结果预览（供 CandlePatternChart 渲染）
const recPreviewJson = computed(() => (recCandles.value ? JSON.stringify(recCandles.value) : ''))

function openRecognize() {
	recImage.value = ''
	recCandles.value = null
	recError.value = ''
	recLoading.value = false
	recVisible.value = true
}

function pickFile() {
	fileRef.value?.click()
}

function onFileChange(e: Event) {
	const input = e.target as HTMLInputElement
	const file = input.files && input.files[0]
	if (file) loadImageFile(file)
	input.value = '' // 允许重复选择同一文件
}

function onDrop(e: DragEvent) {
	const file = e.dataTransfer?.files && e.dataTransfer.files[0]
	if (file) loadImageFile(file)
}

// 对话框打开期间监听全局粘贴（Ctrl+V 直接贴图）
function onPaste(e: ClipboardEvent) {
	const clipItems = e.clipboardData?.items
	if (!clipItems) return
	for (let i = 0; i < clipItems.length; i++) {
		if (clipItems[i].type.startsWith('image/')) {
			const file = clipItems[i].getAsFile()
			if (file) {
				loadImageFile(file)
				e.preventDefault()
			}
			return
		}
	}
}

watch(recVisible, v => {
	if (v) window.addEventListener('paste', onPaste)
	else window.removeEventListener('paste', onPaste)
})

onBeforeUnmount(() => window.removeEventListener('paste', onPaste))

// 读取图片文件 → dataURL 预览 → 自动识别
function loadImageFile(file: File) {
	if (!file.type.startsWith('image/')) {
		ElMessage.warning('请选择图片文件')
		return
	}
	const reader = new FileReader()
	reader.onload = () => {
		recImage.value = String(reader.result || '')
		runRecognize()
	}
	reader.onerror = () => {
		recError.value = '图片读取失败，请重新选择'
	}
	reader.readAsDataURL(file)
}

// 执行识别（同步计算前先让 loading 状态渲染一帧）
function runRecognize() {
	recCandles.value = null
	recError.value = ''
	recLoading.value = true
	window.setTimeout(() => {
		const img = new Image()
		img.onload = () => {
			try {
				const result = recognizeCandlesFromImage(img)
				if (result.ok) recCandles.value = result.candles
				else recError.value = result.message
			} catch {
				recError.value = '识别失败：请更换截图重试'
			} finally {
				recLoading.value = false
			}
		}
		img.onerror = () => {
			recLoading.value = false
			recError.value = '图片加载失败，请重新选择'
		}
		img.src = recImage.value
	}, 30)
}

// 应用识别结果到画板（可继续手动微调）
function applyRecognized() {
	if (!recCandles.value) return
	items.value = recCandles.value.map(k => ({ ...k }))
	selectedIndex.value = 0
	hoverIndex.value = null
	emitModel()
	recVisible.value = false
	ElMessage.success(`已应用识别结果（${items.value.length} 根K线），可在画板上继续微调`)
}
</script>

<style lang="scss" scoped>
.candle-editor {
	.ce-toolbar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		margin-bottom: 10px;

		.ce-label {
			color: #606266;
			font-size: 13px;
		}

		.ce-count {
			pointer-events: none;
			min-width: 36px;
		}

		.ce-tip {
			color: #909399;
			font-size: 12px;
			line-height: 1.6;
		}
	}

	.ce-board {
		display: block;
		width: 100%;
		height: 260px;
		background: #fafbfc;
		border: 1px solid #e4e7ed;
		border-radius: 8px;
		touch-action: none;

		.ce-body {
			cursor: move;

			&.active {
				stroke: #303133;
				stroke-width: 1;
			}
		}

		.ce-handle {
			cursor: ns-resize;
		}
	}

	.ce-inputs {
		display: grid;
		grid-template-columns: 1fr;
		gap: 8px 14px;
		margin-top: 10px;

		.ce-cell {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 6px 8px;
			border: 1px solid #e4e7ed;
			border-radius: 6px;
			background: #fff;

			&.active {
				border-color: #409eff;
				background: #f5f9ff;
			}

			.ce-no {
				width: 18px;
				height: 18px;
				border-radius: 50%;
				color: #fff;
				font-size: 11px;
				line-height: 18px;
				text-align: center;
				flex-shrink: 0;
			}

			.ce-field {
				display: flex;
				align-items: center;
				gap: 3px;

				em {
					font-style: normal;
					color: #909399;
					font-size: 12px;
				}

				:deep(.el-input-number) {
					width: 76px;
				}

				:deep(.el-input__inner) {
					text-align: center;
					padding: 0 4px;
				}
			}
		}
	}
}

/* 截图识别对话框 */
.rec-body {
	.rec-upload {
		border: 1px dashed #dcdfe6;
		border-radius: 8px;
		padding: 20px 16px;
		text-align: center;
		cursor: pointer;
		transition: border-color 0.2s, background 0.2s;

		&:hover {
			border-color: #409eff;
			background: #f5f9ff;
		}

		&.has-image {
			padding: 8px;
		}

		.rec-up-icon {
			font-size: 30px;
			color: #c0c4cc;
			margin-bottom: 10px;
		}

		.rec-up-text {
			color: #606266;
			font-size: 13px;
			margin-bottom: 6px;
		}

		.rec-up-tip {
			color: #909399;
			font-size: 12px;
			line-height: 1.6;
		}

		.rec-preview {
			display: block;
			max-width: 100%;
			max-height: 170px;
			margin: 0 auto;
			border-radius: 4px;
		}
	}

	.rec-file {
		display: none;
	}

	.rec-status {
		text-align: center;
		color: #909399;
		font-size: 13px;
		padding: 12px 0;
	}

	.rec-alert {
		margin-top: 12px;
	}

	.rec-result {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 12px 0 10px;

		.rec-result-tip {
			color: #909399;
			font-size: 12px;
		}
	}

	.rec-chart {
		margin: 0 auto;
	}
}
</style>
