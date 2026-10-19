<template>
	<svg class="candle-pattern-chart" :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`">
		<g v-for="(k, i) in items" :key="i">
			<!-- 影线 -->
			<line :x1="cx(i)" :x2="cx(i)" :y1="cy(k.h)" :y2="cy(k.l)" :stroke="barColor(k)" stroke-width="1.4" />
			<!-- 实体（高度至少 1.5 保证小实体可见） -->
			<rect :x="cx(i) - barWidth / 2" :y="cy(Math.max(k.o, k.c))" :width="barWidth" :height="bodyHeight(k)" :fill="barColor(k)" rx="0.5" />
		</g>
	</svg>
</template>

<script setup lang="ts">
// 形态示意图形缩略渲染（只读）：解析 Candles JSON（o/h/l/c 0~100 固定坐标系）绘制迷你K线图
// 配色与行情页一致：涨红跌绿
import { computed } from 'vue'
import { IZdxCandleShape } from '@/interfaces/zhiduoxing/IZdxCandlePattern'

const props = withDefaults(defineProps<{
	// 示意图形 JSON 字符串（[{"o":18,"h":34,"l":14,"c":32},...]）
	candles?: string
	// 渲染宽度（px）
	width?: number
	// 渲染高度（px）
	height?: number
}>(), {
	candles: '',
	width: 150,
	height: 56
})

// 涨红跌绿（与行情页一致）
const upColor = '#f56c6c'
const downColor = '#67c23a'

// 解析示意图形（非法时渲染为空）
const items = computed<IZdxCandleShape[]>(() => {
	try {
		const arr = JSON.parse(props.candles || '[]')
		return Array.isArray(arr) ? arr : []
	} catch {
		return []
	}
})

// 每根K线槽位宽度
const slot = computed(() => (items.value.length ? props.width / items.value.length : 0))
// 实体宽度（不超过槽位 60%）
const barWidth = computed(() => Math.min(slot.value * 0.6, 12))

// X 坐标：槽位中点
function cx(i: number): number {
	return slot.value * (i + 0.5)
}

// Y 坐标：值（0~100）→ 像素（0=底部、100=顶部；上下各留 3px 边距）
function cy(v: number): number {
	const inner = props.height - 6
	return 3 + (100 - v) / 100 * inner
}

// 实体高度（至少 1.5px）
function bodyHeight(k: IZdxCandleShape): number {
	return Math.max(1.5, cy(Math.min(k.o, k.c)) - cy(Math.max(k.o, k.c)))
}

// 实体颜色（阳线红、阴线绿；平盘红）
function barColor(k: IZdxCandleShape): string {
	return k.c >= k.o ? upColor : downColor
}
</script>

<style lang="scss" scoped>
.candle-pattern-chart {
	display: block;
	background: #fafbfc;
	border: 1px solid #e4e7ed;
	border-radius: 6px;
}
</style>
