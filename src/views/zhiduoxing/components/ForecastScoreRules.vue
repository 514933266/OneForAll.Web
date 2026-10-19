<template>
	<el-popover v-model:visible="visible" :width="440" trigger="click" placement="bottom-start" popper-class="fsr-popper">
		<template #reference>
			<span class="fsr-link"><font-awesome-icon fas icon="circle-info"></font-awesome-icon>评分规则</span>
		</template>
		<div ref="bodyRef" class="fsr-body">
			<div class="fsr-head">
				<b>预测评分规则</b>
				<span>得分 = 方向 40 + 幅度 30 + 路径 30（满分 100）</span>
			</div>
			<div class="fsr-sec" :class="{ 'is-active': active === 'basis' }" data-sec="basis">
				<b>验证口径 · 先看按哪个价格算</b>
				<p>主口径按流派：超短线 / 打板 = <b>日内最高价</b>；其余 = <b>收盘价</b>。</p>
				<p>对照口径按另一价格重算，仅作对照展示，不参与命中率与平均分。</p>
			</div>
			<div class="fsr-sec" :class="{ 'is-active': active === 'direction' }" data-sec="direction">
				<b>方向 · 40 分</b>
				<p>终端方向（看涨 / 看跌 / 持平）预测与实际一致得 40 分；双方均持平（|幅度| ≤ 0.5%）也算命中。</p>
				<p>方向相反，或预测涨跌而实际持平（反之亦然）→ 0 分。</p>
			</div>
			<div class="fsr-sec" :class="{ 'is-active': active === 'amplitude' }" data-sec="amplitude">
				<b>幅度 · 30 / 20 分</b>
				<p>前提：方向命中后才计分；方向未中本项 0 分。</p>
				<p>比较终端幅度（取绝对值）：实际幅度 − 预测幅度 &gt; +3pp（超越）或 &lt; −3pp（不及）→ 20 分；±3pp 内（贴近）→ 30 分。</p>
			</div>
			<div class="fsr-sec" :class="{ 'is-active': active === 'path' }" data-sec="path">
				<b>路径 · 30 / 20 / 10 / 0 分</b>
				<p>逐日对比（按验证口径取价）：偏移 =（实际 − 预测）/ 预测；判定优先级从高到低：</p>
				<p>① 反向：终端方向与实际相反 → 0 分</p>
				<p>② 不利偏移：任一日逆向偏离 &gt; 5%（看多日实际低于预测价超 5%，看空日反之）→ 10 分</p>
				<p>③ 贴合：逐日 |偏移| 全部 ≤ 2% → 30 分</p>
				<p>④ 其余（含顺向大偏移）→ 轻微偏移 20 分</p>
			</div>
			<div class="fsr-sec" :class="{ 'is-active': active === 'grade' }" data-sec="grade">
				<b>分档</b>
				<p>≥ 80 优秀 · 60~79 良好 · 40~59 一般 · &lt; 40 较差</p>
			</div>
		</div>
	</el-popover>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// 预测评分规则说明弹层（假设台账标题 / 详情得分构成处复用；el-popover teleport 到 body）
// open(sec) 供详情“得分构成”点击定位到对应维度（basis/direction/amplitude/path/grade）
const visible = ref(false)
const active = ref('')
const bodyRef = ref<HTMLElement>()
let activeTimer: ReturnType<typeof setTimeout> | null = null

// 弹层完全展开后再滚动定位，并短暂高亮目标分区
function locate() {
	if (!active.value || !bodyRef.value) return
	const el = bodyRef.value.querySelector<HTMLElement>(`[data-sec="${active.value}"]`)
	el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
	if (activeTimer) clearTimeout(activeTimer)
	activeTimer = setTimeout(() => (active.value = ''), 1600)
}

watch(visible, v => {
	if (v) setTimeout(locate, 80)
	else active.value = ''
})

function open(sec?: string) {
	active.value = sec ?? ''
	if (visible.value) locate()
	else visible.value = true
}

defineExpose({ open })
</script>

<style lang="scss" scoped>
.fsr-link {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
	font-weight: 400;
	color: var(--el-color-primary);
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		opacity: 0.75;
	}
}
</style>

<style lang="scss">
// el-popover teleport 到 body，需非 scoped 全局样式
.fsr-popper {
	padding: 12px 14px;

	.fsr-body {
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-height: 430px;
		overflow-y: auto;
		font-size: 12px;
		line-height: 1.65;
		color: var(--el-text-color-regular);

		.fsr-head {
			display: flex;
			align-items: baseline;
			justify-content: space-between;
			gap: 8px;

			b {
				font-size: 13px;
				color: var(--el-text-color-primary);
			}

			span {
				font-size: 12px;
				color: var(--el-text-color-secondary);
			}
		}

		.fsr-sec {
			padding: 8px 10px;
			border-radius: 10px;
			background: #f7f8fa;
			transition: background 0.3s, box-shadow 0.3s;

			&.is-active {
				background: var(--el-color-primary-light-9);
				box-shadow: inset 0 0 0 1px var(--el-color-primary-light-7);
			}

			> b {
				display: block;
				margin-bottom: 2px;
				color: var(--el-text-color-primary);
			}

			p {
				margin: 0;

				& + p {
					margin-top: 2px;
				}

				b {
					color: var(--el-text-color-primary);
				}
			}
		}
	}
}
</style>
