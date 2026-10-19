<template>
	<el-container class="strategy-manage-page">
		<el-header class="header">
			<span class="search-box">
				<el-button type="primary" @click="openAdd">
					<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增策略
				</el-button>
				<el-select v-model="filterStatus" style="width: 130px" @change="load">
					<el-option v-for="opt in ZDX_STRATEGY_STATUS_FILTER" :key="opt.value" :label="opt.label" :value="opt.value" />
				</el-select>
			</span>
			<span class="button-box">
				<el-button @click="load">
					<font-awesome-icon fas icon="rotate-right"></font-awesome-icon>&nbsp;刷新
				</el-button>
			</span>
		</el-header>
		<el-main class="content">
			<!-- 说明 -->
			<div class="tip-box">
				<div class="tip-head">
					<span class="tip-title">策略验证说明</span>
					<span class="tip-text">录入策略后自动按流派周期做分级验证：小验证轻量落指标，大验证做"本期 vs 基线期 vs 上一大周期"三组对比并可生成 AI 归因；周期快照在创建时确定，流派中途变更不回溯；窗口内实盘样本不足 5 笔记"样本不足"，不下结论</span>
				</div>
				<div class="legend">
					<span class="legend-item"><el-tag size="small" type="success">改善</el-tag>期望值/胜率对基线综合为正</span>
					<span class="legend-item"><el-tag size="small" type="info">持平</el-tag>对基线变化在容差内</span>
					<span class="legend-item"><el-tag size="small" type="danger">恶化</el-tag>对基线综合为负</span>
					<span class="legend-item"><el-tag size="small" type="warning">样本不足</el-tag>窗口了结样本 &lt;5，期满自动重算</span>
				</div>
			</div>

			<div v-loading="loading" class="card-list">
				<el-empty v-if="!loading && !list.length" description="暂无策略，点击右上角「新增策略」开始录入" :image-size="90"></el-empty>
				<div v-for="s in list" :key="s.Id" class="strategy-card" :class="{ 'is-finished': s.Status === 2 }">
					<!-- 头部：名称 + 状态 + 周期/进度 + 操作 -->
					<div class="sc-head">
						<div class="sc-title">
							<span class="sc-mini-ico tone-violet"><font-awesome-icon fas icon="bullseye"></font-awesome-icon></span>
							<b>{{ s.Name }}</b>
							<el-tag size="small" :type="statusTag(s.Status)">{{ statusLabel(s.Status) }}</el-tag>
							<span v-if="s.LinkedRuleKeys" class="sc-linked" :title="'关联改进方向：' + s.LinkedRuleKeys">
								<font-awesome-icon fas icon="link"></font-awesome-icon>{{ s.LinkedRuleKeys }}
							</span>
						</div>
						<div class="sc-meta muted">
							<span>小验证 {{ s.MinorDays }} 天 · 大验证 {{ s.MajorDays }} 天</span>
							<span>起始 {{ fmtDate(s.StartDate) }}</span>
							<span v-if="s.Status === 1">当前第 {{ s.CurrentMinorNo }} 小周期</span>
							<span v-if="s.Status === 1 && s.NextMajorInDays > 0">距下个大验证 {{ s.NextMajorInDays }} 天</span>
							<span v-if="s.EndDate">结束 {{ fmtDate(s.EndDate) }}</span>
							<span v-if="s.LastMajorVerdict">最近大验证：<el-tag size="small" :type="verdictTag(s.LastMajorVerdict)">{{ verdictLabel(s.LastMajorVerdict) }}</el-tag></span>
						</div>
						<div class="sc-ops">
							<el-button link type="primary" size="small" @click="openEdit(s)">编辑</el-button>
							<el-button v-if="s.Status === 1" link type="warning" size="small" @click="finish(s)">结束</el-button>
							<el-button link type="danger" size="small" @click="removeRow(s)">删除</el-button>
						</div>
					</div>

					<!-- 基线 vs 最新指标对比 -->
					<div class="sc-metrics">
						<span class="sm-label muted">基线 → 最新</span>
						<span v-for="m in metricPairs(s)" :key="m.key" class="sm-item">
							<span class="sm-name muted">{{ m.name }}</span>
							<span class="sm-base">{{ m.base }}</span>
							<font-awesome-icon fas icon="arrow-right" class="sm-arrow"></font-awesome-icon>
							<span class="sm-cur" :class="m.tone">{{ m.cur }}</span>
						</span>
						<span v-if="!s.Verifies?.length" class="sm-none muted">尚无已完成验证期，首个小验证点 {{ fmtDate(firstMinorEnd(s)) }} 到期后自动生成</span>
					</div>

					<!-- 策略正文（两行截断，可展开） -->
					<div class="sc-content" :class="{ 'is-open': expandedContent.includes(s.Id) }" @click="toggleContent(s.Id)">
						{{ s.Content }}
					</div>

					<!-- 五子策略摘要 -->
					<div class="sc-subrules">
						<template v-if="subRuleCount(s) > 0">
							<span class="sr-label muted">五子策略</span>
							<span v-for="g in subSummary(s)" :key="g.group" class="sr-item">
								<span class="sr-name">{{ g.name }}</span>
								<span class="sr-rules">{{ g.rules.join('、') }}</span>
							</span>
						</template>
						<span v-else class="sr-none muted">
							未定义五子策略（选股/择时/仓位/止盈/止损）
							<el-button link type="primary" size="small" @click="openEdit(s)">去编辑器定义</el-button>
						</span>
					</div>

					<!-- 验证时间线（展开详情才拉取周期走势） -->
					<div class="sc-detail">
						<el-collapse @change="(name: any) => onPanel(s, name)">
							<el-collapse-item name="verify">
								<template #title>
									<span class="sc-panel-title"><font-awesome-icon fas icon="timeline"></font-awesome-icon>&nbsp;验证时间线（{{ s.Verifies?.length ?? 0 }}）</span>
								</template>
								<div v-if="!s.Verifies?.length" class="muted vt-empty">尚无验证点</div>
								<div v-else class="vt-list">
									<div v-for="v in s.Verifies" :key="v.Id" class="vt-item" :class="'lv' + v.Level">
										<template v-if="v.Level === 1">
											<div class="vt-minor">
												<span class="vt-tag minor">小验证 #{{ v.VerifyNo }}</span>
												<span class="vt-window">{{ fmtDate(v.WindowBegin) }} ~ {{ fmtDate(v.WindowEnd) }}</span>
												<span class="vt-nums muted">成交 {{ v.Metrics.TradeCount }} 笔 · 胜率 {{ fmtPct(v.Metrics.WinRate) }} · 期望 {{ fmtMoney(v.Metrics.Expectancy) }}</span>
												<el-tag size="small" :type="verdictTag(v.Verdict)">{{ verdictLabel(v.Verdict) }}</el-tag>
											</div>
										</template>
										<template v-else>
											<div class="vt-major-head">
												<span class="vt-tag major">大验证 #{{ v.VerifyNo }}</span>
												<span class="vt-window">{{ fmtDate(v.WindowBegin) }} ~ {{ fmtDate(v.WindowEnd) }}</span>
												<el-tag size="small" :type="verdictTag(v.Verdict)">{{ verdictLabel(v.Verdict) }}</el-tag>
												<el-button size="small" type="primary" plain :loading="aiLoadingId === v.Id" @click.stop="genAi(s.Id, v)">
													{{ v.AiNote ? '重新生成' : 'AI 归因' }}
												</el-button>
											</div>
											<el-table :data="majorRows(s, v)" size="small" class="vt-table">
												<el-table-column prop="name" label="指标" min-width="90" />
												<el-table-column label="基线期" width="110" align="right">
													<template #default="{ row }">{{ row.base }}</template>
												</el-table-column>
												<el-table-column label="本期" width="110" align="right">
													<template #default="{ row }">{{ row.cur }}</template>
												</el-table-column>
											</el-table>
											<div v-if="v.AiNote" class="vt-ai">
												<div class="vt-ai-head"><font-awesome-icon fas icon="wand-magic-sparkles"></font-awesome-icon>&nbsp;AI 归因 · {{ dayjs(v.GeneratedAt).format('MM-DD HH:mm') }}</div>
												<div class="vt-ai-text">{{ v.AiNote }}</div>
											</div>
										</template>
									</div>
								</div>
							</el-collapse-item>
							<el-collapse-item name="trend">
								<template #title>
									<span class="sc-panel-title"><font-awesome-icon fas icon="chart-line"></font-awesome-icon>&nbsp;周期走势（按小验证周期分桶）</span>
								</template>
								<div v-if="details[s.Id]?.BucketTrend?.length" :ref="el => setTrendRef(s.Id, el as HTMLElement)" class="vt-trend"></div>
								<div v-else class="muted vt-empty">{{ trendLoadingId === s.Id ? '加载中…' : '暂无可分桶数据' }}</div>
							</el-collapse-item>
							<el-collapse-item name="exec">
								<template #title>
									<span class="sc-panel-title"><font-awesome-icon fas icon="list-check"></font-awesome-icon>&nbsp;策略执行度（逐笔纪律）</span>
								</template>
								<div v-if="execLoadingId === s.Id" class="muted vt-empty">加载中…</div>
								<div v-else-if="!execMap[s.Id]" class="muted vt-empty">暂无执行度数据</div>
								<div v-else-if="!execMap[s.Id]?.HasEvaluable" class="muted vt-empty">未启用可自动评估的规则（去编辑器勾选时间窗/止损/止盈/持有期类规则）</div>
								<div v-else class="ex-wrap">
									<div class="ex-overall">
										<span class="ex-num" :style="{ color: rateColor(execMap[s.Id]?.OverallRate) }">{{ execMap[s.Id]?.OverallRate == null ? '—' : execMap[s.Id]?.OverallRate + '%' }}</span>
										<span class="ex-cap muted">总体执行率 · 已了结样本 {{ execMap[s.Id]?.SampleCount }} 笔</span>
									</div>
									<div class="ex-dims">
										<div v-for="d in execMap[s.Id]?.Dimensions" :key="d.Group" class="ex-dim">
											<span class="ex-dim-name">{{ d.Name }}</span>
											<el-progress v-if="d.Rate != null" :percentage="d.Rate" :color="rateColor(d.Rate)" :stroke-width="10" class="ex-dim-bar" />
											<span v-else class="ex-dim-gray">{{ d.Configured ? '仅定义 · 暂不自动评估' : '未配置' }}</span>
											<span class="ex-dim-num muted">{{ d.Rate != null ? ('违 ' + d.ViolationCount + '/' + d.EvaluableCount) : (d.SkippedCount ? (d.SkippedCount + ' 项') : '') }}</span>
										</div>
									</div>
									<div v-if="execMap[s.Id]?.Violations.length" class="ex-viol">
										<div class="ex-sub-title">违规 TOP{{ Math.min(5, execMap[s.Id]?.Violations.length ?? 0) }}</div>
										<div v-for="(v, i) in (execMap[s.Id]?.Violations ?? []).slice(0, 5)" :key="i" class="ex-viol-row">
											<span class="ex-viol-date muted">{{ fmtDate(v.TradeDate) }}</span>
											<span class="ex-viol-stock">{{ v.StockName || v.StockCode }}</span>
											<el-tag size="small" type="danger">{{ v.RuleName }}</el-tag>
											<span v-if="v.ImpactPct != null" class="ex-viol-impact muted">影响 {{ v.ImpactPct }}%</span>
										</div>
									</div>
									<div class="ex-cmp">
										<div class="ex-sub-title">执行 vs 不执行</div>
										<div class="ex-cmp-grid">
											<div class="ex-cmp-col">
												<div class="ex-cmp-head good">合规 {{ execMap[s.Id]?.Compared.Compliant.Count }} 笔</div>
												<div class="ex-cmp-metric"><span class="muted">胜率</span><b>{{ fmtPct(execMap[s.Id]?.Compared.Compliant.WinRate) }}</b></div>
												<div class="ex-cmp-metric"><span class="muted">盈亏比</span><b>{{ fmtNum(execMap[s.Id]?.Compared.Compliant.ProfitLossRatio) }}</b></div>
												<div class="ex-cmp-metric"><span class="muted">期望</span><b>{{ fmtMoney(execMap[s.Id]?.Compared.Compliant.Expectancy) }}</b></div>
											</div>
											<div class="ex-cmp-col">
												<div class="ex-cmp-head bad">违规 {{ execMap[s.Id]?.Compared.Violated.Count }} 笔</div>
												<div class="ex-cmp-metric"><span class="muted">胜率</span><b class="c-red">{{ fmtPct(execMap[s.Id]?.Compared.Violated.WinRate) }}</b></div>
												<div class="ex-cmp-metric"><span class="muted">盈亏比</span><b class="c-red">{{ fmtNum(execMap[s.Id]?.Compared.Violated.ProfitLossRatio) }}</b></div>
												<div class="ex-cmp-metric"><span class="muted">期望</span><b class="c-red">{{ fmtMoney(execMap[s.Id]?.Compared.Violated.Expectancy) }}</b></div>
											</div>
										</div>
										<div class="ex-note muted">过程纪律为近似评估（基于已了结样本最终盈亏与买入时间，不逐日盯市）</div>
									</div>
								</div>
							</el-collapse-item>
						</el-collapse>
					</div>
				</div>
			</div>
		</el-main>
	</el-container>

	<!-- 新增/编辑对话框 -->
	<el-dialog v-model="dialogVisible" width="680px" :title="isEdit ? '编辑策略' : '新增策略'" :close-on-click-modal="false" top="5vh" class="strategy-dialog">
		<div class="dialog-body">
			<div class="dialog-row">
				<span class="row-label">策略名称</span>
				<el-input v-model="form.Name" maxlength="100" show-word-limit placeholder="如： Reduce 频繁换手——只做模式内信号"></el-input>
			</div>
			<div class="dialog-row align-top">
				<span class="row-label">策略内容</span>
				<el-input v-model="form.Content" type="textarea" :rows="6" maxlength="2000" show-word-limit
					placeholder="策略正文与执行要点：做什么、不做什么、如何自检（将作为 AI 归因的对照依据）"></el-input>
			</div>
			<div class="dialog-row align-top">
				<span class="row-label">关联改进方向</span>
				<el-select v-model="linkedKeys" multiple clearable collapse-tags collapse-tags-tooltip style="width: 100%"
					placeholder="可选：关联复盘中心诊断带的改进方向（仅未解决问题）">
					<el-option v-for="opt in ruleOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
				</el-select>
			</div>
			<!-- 五子策略编辑器（选股/择时/仓位/止盈/止损；新建与编辑均可改） -->
			<div class="dialog-row align-top subrules-row">
				<span class="row-label">五子策略</span>
				<div class="subrules-editor">
					<div class="se-toolbar">
						<span class="muted">套用模板</span>
						<el-select v-model="templateKey" placeholder="选择模板" size="small" style="width: 130px" @change="applyTemplate">
							<el-option v-for="t in ZDX_STRATEGY_TEMPLATES" :key="t.key" :label="t.label" :value="t.key" />
						</el-select>
						<el-button link type="info" size="small" @click="initEditor([])">清空</el-button>
						<span class="se-count muted">已启用 {{ enabledTotal }} 项</span>
					</div>
					<el-collapse v-model="editorActive" class="se-collapse">
						<el-collapse-item v-for="grp in ruleCatalog" :key="grp.Group" :name="grp.Group">
							<template #title>
								<span class="se-grp-title">{{ grp.Name }}</span>
								<span class="se-grp-count muted">{{ groupEnabled(grp) }}/{{ grp.Rules.length }}</span>
							</template>
							<div v-for="rule in grp.Rules" :key="rule.Key" class="se-rule">
								<el-switch v-model="subRuleMap[rule.Key].enabled" size="small" />
								<span class="se-rule-name">{{ rule.Name }}</span>
								<el-tag size="small" :type="rule.Eval === 0 ? 'info' : 'success'" class="se-rule-eval">{{ ZDX_RULE_EVAL_LABELS[rule.Eval] }}</el-tag>
								<template v-if="rule.Max > 0">
									<el-input-number v-model="subRuleMap[rule.Key].param" :min="rule.Min" :max="rule.Max" :step="rule.Max <= 10 ? 0.5 : 1"
										:disabled="!subRuleMap[rule.Key].enabled" size="small" controls-position="right" class="se-rule-param" />
									<span class="se-rule-unit muted">{{ rule.Unit }}</span>
								</template>
							</div>
						</el-collapse-item>
					</el-collapse>
					<div v-if="!ruleCatalog.length" class="muted se-empty">规则目录加载失败，请刷新重试</div>
				</div>
			</div>
			<template v-if="!isEdit">
				<div class="dialog-row">
					<span class="row-label">起始日期</span>
					<el-date-picker v-model="form.StartDate" type="date" value-format="YYYY-MM-DD" placeholder="默认今天" :disabled-date="disabledFuture" style="width: 160px"></el-date-picker>
					<span class="row-tip muted">基线期取起始日前 {{ form.MajorDays || schoolCycleHint }} 天自动快照</span>
				</div>
				<div class="dialog-row">
					<span class="row-label">高级选项</span>
					<span class="row-sub">小验证周期</span>
					<el-input-number v-model="form.MinorDays" :min="0" :max="365" placeholder="流派默认" style="width: 120px"></el-input-number>
					<span class="row-sub ml">大验证周期</span>
					<el-input-number v-model="form.MajorDays" :min="0" :max="365" placeholder="流派默认" style="width: 120px"></el-input-number>
				</div>
				<div class="dialog-row">
					<span class="row-label"></span>
					<span class="row-tip muted">0 = 按流派默认（当前流派默认：{{ schoolCycleHint }} 天，即周小验证·月大验证节奏）；创建时从流派快照，之后改流派不回溯</span>
				</div>
			</template>
			<div v-else class="dialog-row">
				<span class="row-label"></span>
				<span class="row-tip muted">编辑仅更新名称/正文/关联改进方向；验证周期与基线期在创建时已快照，不可修改。如需调整请结束后新建</span>
			</div>
		</div>
		<template #footer>
			<el-button type="primary" :loading="saving" @click="submit">提交</el-button>
			<el-button type="warning" @click="dialogVisible = false">取消</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox, dayjs } from 'element-plus'
import { IZdxUserStrategy, IZdxUserStrategyForm, IZdxUserStrategyVerify, IZdxStrategyMetrics, IZdxRuleGroupCatalog, IZdxRuleDef, IZdxSubRuleGroup, IZdxExecutionDegree, ZDX_VERIFY_VERDICTS, ZDX_STRATEGY_STATUS, ZDX_RULE_EVAL_LABELS } from '@/interfaces/zhiduoxing/IZdxUserStrategy'
import { IZdxStrategyDiagnosis } from '@/interfaces/zhiduoxing/IZdxStockReview'
import API from '@/apis/zdx-api'

// 列表状态筛选（0=全部）
const ZDX_STRATEGY_STATUS_FILTER = [{ value: 0, label: '全部策略' }, { value: 1, label: '进行中' }, { value: 2, label: '已结束' }]

const route = useRoute()
const loading = ref(false)
const saving = ref(false)
const list = ref<IZdxUserStrategy[]>([])
const filterStatus = ref(0)

// 详情缓存（BucketTrend 走势数据）
const details = ref<Record<number, IZdxUserStrategy>>({})
const trendLoadingId = ref(0)
const aiLoadingId = ref(0)
const trendRefs = new Map<number, HTMLElement>()
const trendCharts = new Map<number, echarts.ECharts>()

// 编辑对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref<IZdxUserStrategyForm>(newForm())
const linkedKeys = ref<string[]>([])
// 流派默认周期提示（取列表最近一条进行中策略的周期；无策略时回退 7/28 与后端一致）
const schoolCycleHint = ref(7)
const schoolCycleHintMajor = ref(28)

// 关联改进方向下拉（诊断带未解决问题）
const ruleOptions = ref<{ value: string; label: string }[]>([])

// 五子策略规则目录（静态模板；编辑器渲染 + 摘要回显 + 执行度图例共用）
const ruleCatalog = ref<IZdxRuleGroupCatalog[]>([])
// 编辑器勾选态：key=规则编码（跨维度唯一），val=是否启用/参数
const subRuleMap = ref<Record<string, { enabled: boolean; param: number }>>({})
// 编辑器当前展开维度面板
const editorActive = ref<string[]>(['timing'])
// 套用模板下拉
const templateKey = ref('')
// 执行度：按策略 Id 懒加载缓存（详情进入 exec 面板时拉取）
const execMap = ref<Record<number, IZdxExecutionDegree | null>>({})
const execLoadingId = ref(0)

// 编码 → 规则定义索引（摘要/参数展示取名称与单位）
const defByKey = new Map<string, IZdxRuleDef>()

// 内置模板（趋势跟踪/价值/短线；套用后预置勾选与参数，其余清空）
const ZDX_STRATEGY_TEMPLATES: { key: string; label: string; rules: Record<string, number> }[] = [
	{ key: 'trend', label: '趋势跟踪', rules: { sc_ma: 0, sc_breakout: 0, tm_no_open_30min: 30, ps_single_cap: 20, tp_fixed: 20, tp_time: 30, sl_fixed: 8 } },
	{ key: 'value', label: '价值投资', rules: { sc_pe: 30, sc_roe: 15, ps_single_cap: 30, ps_total_cap: 80, tp_time: 180, sl_fixed: 20 } },
	{ key: 'short', label: '短线题材', rules: { tm_no_open_30min: 15, ps_single_cap: 15, tp_fixed: 12, tp_time: 5, sl_fixed: 5, sl_time: 3 } }
]

function newForm(): IZdxUserStrategyForm {
	return { Id: 0, Name: '', Content: '', LinkedRuleKeys: '', MinorDays: 0, MajorDays: 0, StartDate: '' }
}

onMounted(async () => {
	await loadCatalog()
	await load()
	loadRules()
	// 诊断带「定为策略目标」跳转预填：?link=P5,E3 直接打开新增对话框
	const link = String(route.query.link ?? '')
	if (link) {
		openAdd()
		linkedKeys.value = link.split(',').map(e => e.trim()).filter(e => e)
		form.value.LinkedRuleKeys = link
	}
})

// 加载规则目录并重建索引（失败静默：目录为空时编辑器无面板，不影响正文录入）
async function loadCatalog() {
	try {
		ruleCatalog.value = await API.getStrategyRuleCatalog()
		defByKey.clear()
		ruleCatalog.value.forEach(g => g.Rules.forEach(r => defByKey.set(r.Key, r)))
	} catch {
		ruleCatalog.value = []
	}
}

// 加载策略列表（失败清空；提示由拦截器统一弹出）
async function load() {
	loading.value = true
	try {
		list.value = await API.getUserStrategyList(filterStatus.value || undefined)
		const active = list.value.find(e => e.Status === 1)
		if (active) {
			schoolCycleHint.value = active.MinorDays
			schoolCycleHintMajor.value = active.MajorDays
		}
	} catch {
		list.value = []
	} finally {
		loading.value = false
	}
}

// 关联改进方向选项（诊断带未解决问题；失败静默，下拉为空不影响录入）
async function loadRules() {
	try {
		const d: IZdxStrategyDiagnosis | null = await API.getStrategyDiagnosis()
		ruleOptions.value = (d?.Issues ?? [])
			.filter(e => e.RuleKey && e.Status !== 3)
			.map(e => ({ value: e.RuleKey as string, label: `${e.RuleKey} ${e.Title}` }))
	} catch {
		ruleOptions.value = []
	}
}

// ===== 新增/编辑 =====
function openAdd() {
	isEdit.value = false
	form.value = newForm()
	linkedKeys.value = []
	initEditor([])
	dialogVisible.value = true
}

function openEdit(row: IZdxUserStrategy) {
	isEdit.value = true
	form.value = {
		Id: row.Id,
		Name: row.Name,
		Content: row.Content,
		LinkedRuleKeys: row.LinkedRuleKeys ?? '',
		MinorDays: row.MinorDays,
		MajorDays: row.MajorDays,
		StartDate: ''
	}
	linkedKeys.value = (row.LinkedRuleKeys ?? '').split(',').map(e => e.trim()).filter(e => e)
	initEditor(row.SubRules ?? [])
	dialogVisible.value = true
}

// 初始化五子策略编辑器：先按目录全量未启用（参数取默认），再回填已勾选规则
function initEditor(subRules: IZdxSubRuleGroup[]) {
	const map: Record<string, { enabled: boolean; param: number }> = {}
	ruleCatalog.value.forEach(g => g.Rules.forEach(r => {
		const p = Math.min(Math.max(r.DefaultParam, r.Min), r.Max)
		map[r.Key] = { enabled: false, param: p }
	}))
	;(subRules ?? []).forEach(grp => (grp.Rules ?? []).forEach(r => {
		if (map[r.Key]) map[r.Key] = { enabled: !!r.Enabled, param: r.Param ?? map[r.Key].param }
	}))
	subRuleMap.value = map
	templateKey.value = ''
	editorActive.value = ['timing']
}

// 套用模板：重置全量未启用后按模板预置勾选与参数
function applyTemplate(key: string) {
	const tpl = ZDX_STRATEGY_TEMPLATES.find(e => e.key === key)
	initEditor([])
	if (!tpl) return
	const map = { ...subRuleMap.value }
	Object.keys(tpl.rules).forEach(k => {
		if (map[k]) {
			const def = defByKey.get(k)
			let p = tpl.rules[k]
			if (def) p = Math.min(Math.max(p, def.Min), def.Max)
			map[k] = { enabled: true, param: p }
		}
	})
	subRuleMap.value = map
	editorActive.value = ruleCatalog.value.map(g => g.Group)
}

// 从编辑器状态构建提交用 SubRules（仅收集启用的规则，按目录维度分组；无启用则空数组=清空五子策略）
function buildSubRules(): IZdxSubRuleGroup[] {
	const groups: IZdxSubRuleGroup[] = []
	ruleCatalog.value.forEach(g => {
		const rules = g.Rules.filter(r => subRuleMap.value[r.Key]?.enabled)
			.map(r => ({ Key: r.Key, Enabled: true, Param: subRuleMap.value[r.Key].param }))
		if (rules.length) groups.push({ Group: g.Group, Rules: rules })
	})
	return groups
}

// 五子策略摘要（每维度展示已启用关键规则名；无则不列）
function subSummary(s: IZdxUserStrategy): { group: string; name: string; rules: string[] }[] {
	const out: { group: string; name: string; rules: string[] }[] = []
	const enabled = new Set<string>()
	;(s.SubRules ?? []).forEach(grp => (grp.Rules ?? []).forEach(r => { if (r.Enabled) enabled.add(r.Key) }))
	if (!enabled.size) return out
	ruleCatalog.value.forEach(g => {
		const names = g.Rules.filter(r => enabled.has(r.Key)).map(r => r.Name)
		if (names.length) out.push({ group: g.Group, name: g.Name, rules: names })
	})
	return out
}

// 启用规则总数（卡片塑导“去编辑器定义”提示用）
function subRuleCount(s: IZdxUserStrategy): number {
	let n = 0
	;(s.SubRules ?? []).forEach(grp => (grp.Rules ?? []).forEach(r => { if (r.Enabled) n++ }))
	return n
}

// 启用规则总数（编辑器工具栏「已启用 N 项」）
const enabledTotal = computed(() => Object.values(subRuleMap.value).filter(v => v.enabled).length)

// 单维度启用计数（编辑器维度面板标题 x/y）
function groupEnabled(grp: IZdxRuleGroupCatalog): number {
	return grp.Rules.filter(r => subRuleMap.value[r.Key]?.enabled).length
}

function disabledFuture(date: Date) {
	return date.getTime() > Date.now()
}

async function submit() {
	if (!form.value.Name?.trim()) {
		ElMessage.warning('请输入策略名称')
		return
	}
	if (!form.value.Content?.trim()) {
		ElMessage.warning('请输入策略内容')
		return
	}
	if (saving.value) return
	saving.value = true
	try {
		const payload: IZdxUserStrategyForm = {
			...form.value,
			LinkedRuleKeys: linkedKeys.value.join(','),
			StartDate: form.value.StartDate || undefined,
			SubRules: buildSubRules()
		}
		const res = await API.saveUserStrategy(payload)
		if (res.Status) {
			dialogVisible.value = false
			delete execMap.value[payload.Id]
			load()
		}
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		saving.value = false
	}
}

// 结束策略（补齐截至今天的验证点后冻结）
function finish(row: IZdxUserStrategy) {
	ElMessageBox.confirm(`确认结束策略「${row.Name}」？将补齐截至今天已完整结束的验证期后冻结，历史判定不再重算。`, '结束策略提示', { type: 'warning', cancelButtonText: '再想想' })
		.then(async () => {
			try {
				const res = await API.finishUserStrategy(row.Id)
				if (res.Status) load()
			} catch {
				// 提示由拦截器统一弹出
			}
		})
		.catch(() => { })
}

function removeRow(row: IZdxUserStrategy) {
	ElMessageBox.confirm(`确认删除策略「${row.Name}」？其全部验证点将一并删除，不可恢复。`, '删除策略提示', { type: 'warning', cancelButtonText: '放弃操作' })
		.then(async () => {
			try {
				const res = await API.delUserStrategy(row.Id)
				if (res.Status) load()
			} catch {
				// 提示由拦截器统一弹出
			}
		})
		.catch(() => { })
}

// ===== 验证时间线 / 周期走势 =====
const expandedContent = ref<number[]>([])
function toggleContent(id: number) {
	const i = expandedContent.value.indexOf(id)
	if (i >= 0) expandedContent.value.splice(i, 1)
	else expandedContent.value.push(id)
}

// 折叠面板切换：展开「周期走势」按需拉取详情（含 BucketTrend，仅首次）；展开「执行度」按需懒加载
async function onPanel(s: IZdxUserStrategy, name: string | string[]) {
	const panels = Array.isArray(name) ? name : [name]
	if (panels.includes('trend') && !details.value[s.Id]) {
		trendLoadingId.value = s.Id
		try {
			const d = await API.getUserStrategyDetail(s.Id)
			if (d) {
				details.value = { ...details.value, [s.Id]: d }
				nextTick(() => renderTrend(s.Id, d))
			}
		} catch {
			// 提示由拦截器统一弹出
		} finally {
			trendLoadingId.value = 0
		}
	}
	if (panels.includes('exec') && !(s.Id in execMap.value)) {
		loadExec(s.Id)
	}
}

// 拉取策略执行度（只读现算；失败记 null 不重试阻断）
async function loadExec(id: number) {
	if (execLoadingId.value) return
	execLoadingId.value = id
	try {
		const e = await API.getStrategyExecutionDegree(id)
		execMap.value = { ...execMap.value, [id]: e }
	} catch {
		execMap.value = { ...execMap.value, [id]: null }
	} finally {
		execLoadingId.value = 0
	}
}

// 执行率进度条颜色（高绿中橙低红；无可评估为空）
function rateColor(rate?: number | null): string {
	if (rate === null || rate === undefined) return '#c0c4cc'
	if (rate >= 80) return '#52a852'
	if (rate >= 60) return '#e6a23c'
	return '#e15b5b'
}

function setTrendRef(id: number, el: HTMLElement | null) {
	if (el) trendRefs.set(id, el)
	else trendRefs.delete(id)
}

// 渲染周期走势迷你图（胜率/命中率 % 轴 + 期望值/成交笔数独立轴）
function renderTrend(id: number, d: IZdxUserStrategy) {
	const el = trendRefs.get(id)
	if (!el || !d.BucketTrend?.length) return
	let chart = trendCharts.get(id)
	if (!chart || chart.getDom() !== el) {
		if (chart) chart.dispose()
		chart = echarts.init(el)
		trendCharts.set(id, chart)
	}
	const days = d.MinorDays || 7
	chart.setOption({
		grid: { left: 8, right: 8, top: 26, bottom: 2, containLabel: true },
		tooltip: { trigger: 'axis' },
		legend: { top: 0, itemWidth: 12, itemHeight: 8, textStyle: { fontSize: 11 } },
		xAxis: {
			type: 'category',
			data: d.BucketTrend.map(e => `${dayjs(e.WeekBegin).format('MM-DD')}(${days}d)`),
			axisLabel: { fontSize: 10 }
		},
		yAxis: [
			{ type: 'value', axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { type: 'dashed' } } },
			{ type: 'value', axisLabel: { show: false }, splitLine: { show: false } }
		],
		series: [
			{ name: '胜率%', type: 'line', smooth: true, data: d.BucketTrend.map(e => e.WinRate ?? null) },
			{ name: '命中%', type: 'line', smooth: true, data: d.BucketTrend.map(e => e.HitRate ?? null) },
			{ name: '期望(元/笔)', type: 'bar', yAxisIndex: 1, barMaxWidth: 14, data: d.BucketTrend.map(e => e.Expectancy ?? null) },
			{ name: '成交笔数', type: 'line', yAxisIndex: 1, data: d.BucketTrend.map(e => e.TradeCount) }
		]
	})
}

// 大验证对比表行：基线期 vs 本期
function majorRows(s: IZdxUserStrategy, v: IZdxUserStrategyVerify) {
	return buildPairRows(s.Baseline, v.Metrics)
}

// 基线 → 最新（取最近一个非 deferred 验证期指标）对比 chips
function metricPairs(s: IZdxUserStrategy) {
	const latest = [...(s.Verifies ?? [])].reverse().find(e => e.Verdict !== 'deferred')
	if (!latest) return []
	return buildPairRows(s.Baseline, latest.Metrics).map(r => ({ ...r, tone: pairTone(r.name, r.baseV, r.curV) }))
}

// 指标对（名称一致，供 chips 与表格复用）
function buildPairRows(base: IZdxStrategyMetrics, cur: IZdxStrategyMetrics) {
	return [
		{ key: 'win', name: '胜率', base: fmtPct(base?.WinRate), cur: fmtPct(cur?.WinRate), baseV: base?.WinRate ?? null, curV: cur?.WinRate ?? null },
		{ key: 'exp', name: '期望(元/笔)', base: fmtMoney(base?.Expectancy), cur: fmtMoney(cur?.Expectancy), baseV: base?.Expectancy ?? null, curV: cur?.Expectancy ?? null },
		{ key: 'hit', name: '假设命中', base: fmtPct(base?.HitRate), cur: fmtPct(cur?.HitRate), baseV: base?.HitRate ?? null, curV: cur?.HitRate ?? null },
		{ key: 'trades', name: '成交笔数', base: String(base?.TradeCount ?? 0), cur: String(cur?.TradeCount ?? 0), baseV: base?.TradeCount ?? null, curV: cur?.TradeCount ?? null },
		{ key: 'feeEr', name: '费用侵蚀', base: fmtPct(base?.FeeErosion), cur: fmtPct(cur?.FeeErosion), baseV: base?.FeeErosion ?? null, curV: cur?.FeeErosion ?? null }
	]
}

// 变化色（胜率/期望/命中升为绿；成交笔数中性；费用侵蚀降为绿）
function pairTone(name: string, base: number | null, cur: number | null): string {
	if (base === null || base === undefined || cur === null || cur === undefined) return ''
	if (name === '成交笔数') return 'c-gray'
	if (name === '费用侵蚀') return cur <= base ? 'c-green' : 'c-red'
	return cur >= base ? 'c-green' : 'c-red'
}

// 首个小验证点到期日（起始日 + MinorDays - 1）
function firstMinorEnd(s: IZdxUserStrategy) {
	return dayjs(s.StartDate).add((s.MinorDays || 7) - 1, 'day').toDate()
}

// 生成大验证点 AI 归因（成功后刷新详情覆盖展示）
async function genAi(strategyId: number, v: IZdxUserStrategyVerify) {
	if (aiLoadingId.value) return
	aiLoadingId.value = v.Id
	try {
		const res = await API.genStrategyVerifyAi(strategyId, v.VerifyNo)
		if (res.Status) {
			v.AiNote = String((res as any).Data ?? '')
			const d = await API.getUserStrategyDetail(strategyId)
			if (d) details.value = { ...details.value, [strategyId]: d }
		}
	} catch {
		// 提示由拦截器统一弹出
	} finally {
		aiLoadingId.value = 0
	}
}

// ===== 展示辅助 =====
function statusLabel(status: number) {
	return ZDX_STRATEGY_STATUS.find(e => e.value === status)?.label ?? '未知'
}
function statusTag(status: number) {
	return (ZDX_STRATEGY_STATUS.find(e => e.value === status)?.tag ?? 'info') as any
}
function verdictLabel(verdict?: string | null) {
	if (!verdict) return ''
	return ZDX_VERIFY_VERDICTS.find(e => e.value === verdict)?.label ?? verdict
}
function verdictTag(verdict?: string | null) {
	if (!verdict) return 'info'
	return (ZDX_VERIFY_VERDICTS.find(e => e.value === verdict)?.tag ?? 'info') as any
}
function fmtDate(date?: string | Date | null) {
	return date ? dayjs(date).format('MM-DD') : '--'
}
function fmtPct(val?: number | null) {
	return val === null || val === undefined ? '—' : `${Number(val).toFixed(1)}%`
}
function fmtMoney(val?: number | null) {
	return val === null || val === undefined ? '—' : Number(val).toFixed(2)
}
function fmtNum(val?: number | null) {
	return val === null || val === undefined ? '—' : Number(val).toFixed(2)
}
</script>

<style lang="scss" scoped>
.strategy-manage-page {
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
				align-items: baseline;
				flex-wrap: wrap;
				margin-bottom: 10px;
				gap: 8px;
			}

			.tip-title {
				color: #303133;
				font-weight: bold;
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

		.card-list {
			min-height: 200px;
		}
	}
}

.strategy-card {
	border: 1px solid #e4e7ed;
	border-radius: 10px;
	padding: 14px 16px;
	margin-bottom: 14px;
	transition: box-shadow 0.2s;

	&:hover {
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
	}

	&.is-finished {
		background: #fcfcfc;
		opacity: 0.88;
	}

	.sc-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 14px;

		.sc-title {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 15px;
			color: #303133;
		}

		.sc-mini-ico {
			width: 24px;
			height: 24px;
			border-radius: 6px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			font-size: 12px;

			&.tone-violet {
				background: #f3efff;
				color: #7b5cf0;
			}
		}

		.sc-linked {
			font-size: 12px;
			color: #7b5cf0;
			background: #f3efff;
			border-radius: 4px;
			padding: 1px 6px;
			display: inline-flex;
			align-items: center;
			gap: 4px;
		}

		.sc-meta {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 4px 14px;
			font-size: 12px;
			flex: 1;
			min-width: 240px;
		}

		.sc-ops {
			display: flex;
			align-items: center;
		}
	}

	.sc-metrics {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px 16px;
		margin-top: 10px;
		font-size: 12px;

		.sm-label {
			margin-right: -6px;
		}

		.sm-item {
			display: inline-flex;
			align-items: center;
			gap: 5px;

			.sm-name {
				margin-right: 2px;
			}

			.sm-base {
				color: #909399;
				font-variant-numeric: tabular-nums;
			}

			.sm-arrow {
				color: #c0c4cc;
				font-size: 10px;
			}

			.sm-cur {
				font-weight: 600;
				color: #303133;
				font-variant-numeric: tabular-nums;

				&.c-green {
					color: #52a852;
				}

				&.c-red {
					color: #e15b5b;
				}

				&.c-gray {
					color: #606266;
					font-weight: 500;
				}
			}
		}

		.sm-none {
			font-size: 12px;
		}
	}

	.sc-content {
		margin-top: 10px;
		color: #606266;
		font-size: 13px;
		line-height: 1.7;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		cursor: pointer;
		white-space: pre-wrap;

		&.is-open {
			-webkit-line-clamp: unset;
			display: block;
		}
	}

	.sc-subrules {
		margin-top: 10px;
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 8px 14px;
		padding: 8px 10px;
		background: #f7f8fa;
		border-radius: 8px;

		.sr-label {
			font-size: 12px;
			flex-shrink: 0;
		}

		.sr-item {
			display: inline-flex;
			align-items: baseline;
			gap: 4px;
			font-size: 12px;
		}

		.sr-name {
			color: #7c5cff;
			font-weight: 600;
		}

		.sr-rules {
			color: #606266;
		}

		.sr-none {
			font-size: 12px;
			display: inline-flex;
			align-items: center;
			gap: 6px;
		}
	}

	.sc-detail {
		margin-top: 6px;

		.sc-panel-title {
			font-size: 13px;
			color: #303133;
			font-weight: 600;
		}

		.vt-empty {
			padding: 6px 2px;
			font-size: 12px;
		}

		.vt-list {
			display: flex;
			flex-direction: column;
			gap: 10px;
		}

		.vt-item {
			&.lv1 .vt-minor {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 8px;
				font-size: 12px;
				color: #606266;
			}

			&.lv2 {
				border: 1px solid #ebe1ff;
				border-radius: 8px;
				padding: 10px 12px;
				background: #fbfaff;
			}

			.vt-tag {
				border-radius: 4px;
				padding: 1px 6px;
				font-size: 12px;
				white-space: nowrap;

				&.minor {
					background: #f0f2f5;
					color: #606266;
				}

				&.major {
					background: #f3efff;
					color: #7b5cf0;
					font-weight: 600;
				}
			}

			.vt-major-head {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 8px;
				margin-bottom: 8px;
				font-size: 12px;
			}

			.vt-window {
				color: #909399;
				font-variant-numeric: tabular-nums;
			}

			.vt-table {
				width: 100%;
				margin-bottom: 6px;
			}

			.vt-ai {
				background: #fff;
				border: 1px dashed #d8ccff;
				border-radius: 6px;
				padding: 8px 10px;

				.vt-ai-head {
					font-size: 12px;
					color: #7b5cf0;
					margin-bottom: 4px;
				}

				.vt-ai-text {
					font-size: 12px;
					color: #606266;
					line-height: 1.8;
					white-space: pre-wrap;
				}
			}
		}

		.vt-trend {
			width: 100%;
			height: 180px;
		}

		.ex-wrap {
			padding: 4px 2px;
		}

		.ex-overall {
			display: flex;
			align-items: baseline;
			gap: 10px;
			margin-bottom: 10px;

			.ex-num {
				font-size: 26px;
				font-weight: 700;
				line-height: 1;
			}

			.ex-cap {
				font-size: 12px;
			}
		}

		.ex-dims {
			display: flex;
			flex-direction: column;
			gap: 8px;
			margin-bottom: 12px;

			.ex-dim {
				display: flex;
				align-items: center;
				gap: 8px;

				.ex-dim-name {
					width: 44px;
					flex-shrink: 0;
					font-size: 12px;
					color: #606266;
				}

				.ex-dim-bar {
					flex: 1;
					min-width: 120px;
				}

				.ex-dim-gray {
					flex: 1;
					font-size: 12px;
					color: #b1b3b8;
				}

				.ex-dim-num {
					width: 68px;
					flex-shrink: 0;
					text-align: right;
					font-size: 12px;
				}
			}
		}

		.ex-sub-title {
			font-size: 12px;
			font-weight: 600;
			color: #303133;
			margin-bottom: 6px;
		}

		.ex-viol {
			margin-bottom: 12px;

			.ex-viol-row {
				display: flex;
				align-items: center;
				gap: 10px;
				font-size: 12px;
				padding: 3px 0;
				border-bottom: 1px dashed #f0f0f0;

				.ex-viol-date {
					width: 52px;
					flex-shrink: 0;
				}

				.ex-viol-stock {
					color: #303133;
				}

				.ex-viol-impact {
					margin-left: auto;
				}
			}
		}

		.ex-cmp {
			.ex-cmp-grid {
				display: flex;
				gap: 12px;

				.ex-cmp-col {
					flex: 1;
					border: 1px solid #ebeef5;
					border-radius: 8px;
					padding: 8px 10px;

					.ex-cmp-head {
						font-size: 12px;
						font-weight: 600;
						margin-bottom: 6px;

						&.good {
							color: #52a852;
						}

						&.bad {
							color: #e15b5b;
						}
					}

					.ex-cmp-metric {
						display: flex;
						justify-content: space-between;
						align-items: baseline;
						font-size: 12px;
						line-height: 1.9;

						b {
							color: #303133;
						}
					}
				}
			}

			.ex-note {
				margin-top: 8px;
				font-size: 11px;
				line-height: 1.6;
			}
		}

		.c-red {
			color: #e15b5b;
		}
	}
}

.muted {
	color: #a8abb2;
	font-size: 12px;
}
</style>

<style lang="scss">
/* 策略对话框：内容超高时弹窗内部滚动 */
.strategy-dialog {
	.el-dialog__body {
		max-height: calc(90vh - 150px);
		overflow-y: auto;
		overflow-x: hidden;
	}

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
			width: 90px;
			color: #606266;
			flex-shrink: 0;
		}

		.row-sub {
			color: #606266;
			font-size: 13px;

			&.ml {
				margin-left: 14px;
			}
		}

		.row-tip {
			margin-left: 10px;
			color: #909399;
			font-size: 12px;
		}
	}

	.subrules-row {
		.subrules-editor {
			flex: 1;
			min-width: 0;
			border: 1px solid #ebeef5;
			border-radius: 8px;
			padding: 8px 10px;
			background: #fafbfc;
		}

		.se-toolbar {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 8px;

			.se-count {
				margin-left: auto;
			}
		}

		.se-collapse {
			border-top: none;

			.el-collapse-item__header {
				background: #fff;
				border-radius: 6px;
				padding: 0 10px;
			}

			.el-collapse-item__content {
				padding-bottom: 8px;
			}
		}

		.se-grp-title {
			font-size: 13px;
			font-weight: 600;
			color: #303133;
		}

		.se-grp-count {
			margin-left: 8px;
		}

		.se-rule {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 6px 10px;
			border-bottom: 1px dashed #f0f0f0;
			flex-wrap: wrap;

			.se-rule-name {
				font-size: 13px;
				color: #606266;
			}

			.se-rule-param {
				width: 120px;
				margin-left: auto;
			}

			.se-rule-unit {
				font-size: 12px;
			}
		}

		.se-empty {
			padding: 10px;
			font-size: 12px;
		}
	}
}
</style>
