<template>
	<el-container class="behavior-tag-page">
		<el-header class="header">
			<span class="search-box">
				<el-button type="primary" @click="openAdd">
					<font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;{{ isSchoolTab ? '新增流派' : '新增标签' }}
				</el-button>
			</span>
			<span class="button-box">
				<el-button @click="load">
					<font-awesome-icon fas icon="rotate-right"></font-awesome-icon>&nbsp;刷新
				</el-button>
			</span>
		</el-header>
		<el-main class="content">
			<!-- 分类页签（流派管理 + 行为标签及三大风格模块标签维护；后端 Api 相互独立） -->
			<el-tabs v-model="activeTab" class="tag-tabs" @tab-change="onTabChange">
				<el-tab-pane label="流派" name="school" />
				<el-tab-pane label="行为标签" name="behavior" />
				<el-tab-pane label="交易风格" name="style" />
				<el-tab-pane label="选股风格" name="stock" />
				<el-tab-pane label="交易性格" name="persona" />
			</el-tabs>

			<!-- 流派概览（统计卡片：总数/启用/参数） -->
			<div v-if="isSchoolTab" class="school-overview">
				<div v-for="card in schoolStatCards" :key="card.label" class="stat-card">
					<span class="stat-ico" :class="'stat-' + card.tone">
						<font-awesome-icon fas :icon="card.icon"></font-awesome-icon>
					</span>
					<span class="stat-meta">
						<span class="stat-num">{{ card.value }}</span>
						<span class="stat-label">{{ card.label }}</span>
					</span>
				</div>
			</div>

			<!-- 标签说明与图例（流派页签使用独立说明） -->
			<div v-if="!isSchoolTab" class="tip-box">
				<div class="tip-head">
					<span class="tip-title">标签说明</span>
					<span class="tip-text">{{ tipText }}</span>
				</div>
				<div class="legend">
					<span class="legend-item"><el-tag size="small" type="success">优势</el-tag>正向标签（绿色）</span>
					<span class="legend-item"><el-tag size="small" type="danger">风险</el-tag>风险标签（红色）</span>
					<span class="legend-item"><el-tag size="small">中性</el-tag>中性标签（蓝色）</span>
				</div>
			</div>

			<!-- 流派说明与图例 -->
			<div v-if="isSchoolTab" class="tip-box">
				<div class="tip-head">
					<span class="tip-title">流派说明</span>
					<span class="tip-text">{{ TIP_TEXTS.school }}</span>
				</div>
				<div class="legend">
					<span class="legend-item"><el-tag size="small" type="primary">中性</el-tag>常规风格（蓝色）</span>
					<span class="legend-item"><el-tag size="small" type="success">优势</el-tag>稳健风格（绿色）</span>
					<span class="legend-item"><el-tag size="small" type="warning">警示</el-tag>需留意（黄色）</span>
					<span class="legend-item"><el-tag size="small" type="danger">风险</el-tag>高风险风格（红色）</span>
				</div>
			</div>

			<!-- 流派管理表（评分参数 + 启用快切） -->
			<el-table v-if="isSchoolTab" :data="schoolList" v-loading="loading" row-key="Id" class="tag-table school-table">
				<el-table-column label="流派" min-width="230">
					<template #default="{ row }">
						<div class="school-cell">
							<span class="school-badge" :class="'tone-bg-' + row.Tone">
								<font-awesome-icon fas :icon="row.Icon || 'bolt'"></font-awesome-icon>
							</span>
							<span class="school-meta">
								<span class="school-name">{{ row.Name }}</span>
								<span class="school-desc">{{ row.Description || '—' }}</span>
							</span>
						</div>
					</template>
				</el-table-column>
				<el-table-column label="评分参数" min-width="330">
					<template #default="{ row }">
						<span v-if="schoolParamText(row)" class="param-text">{{ schoolParamText(row) }}</span>
						<span v-else class="empty-text">未配置（不参与 AI 判定，评分回退默认宽松标准）</span>
					</template>
				</el-table-column>
				<el-table-column label="色调" width="90" align="center">
					<template #default="{ row }">
						<el-tag size="small" :type="schoolToneTagType(row.Tone)">{{ schoolToneLabel(row.Tone) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="SortNumber" label="排序" width="70" align="center" />
				<el-table-column label="验证口径" width="100" align="center">
					<template #default="{ row }">
						<el-tag size="small" effect="plain" :type="row.VerifyPriceBasis === 2 ? 'warning' : 'info'">{{ schoolBasisLabel(row.VerifyPriceBasis) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="启用" width="90" align="center">
					<template #default="{ row }">
						<el-switch v-model="row.IsEnabled" :loading="schoolTogglingId === row.Id" @change="toggleSchoolEnabled(row)" />
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
						<el-button link type="primary" size="small" @click="openSchoolEdit(row)">编辑</el-button>
						<el-button link type="danger" size="small" @click="removeSchoolRow(row)">删除</el-button>
					</template>
				</el-table-column>
			</el-table>

			<!-- 行为标签表 -->
			<el-table v-else-if="activeTab === 'behavior'" :data="list" v-loading="loading" row-key="Id" class="tag-table">
				<el-table-column prop="Name" label="触发键" width="140">
					<template #default="{ row }">
						<span class="name-text">{{ row.Name }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="Title" label="标签文案" width="140" show-overflow-tooltip />
				<el-table-column prop="Description" label="说明" min-width="260" show-overflow-tooltip>
					<template #default="{ row }">
						<span class="desc-text">{{ row.Description || '--' }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="Tone" label="色调" width="90" align="center">
					<template #default="{ row }">
						<el-tag size="small" :type="toneTagType(row.Tone)">{{ toneLabel(row.Tone) }}</el-tag>
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

			<!-- 风格标签表（交易风格/选股风格/交易性格共用；模块+层+判定键与画像判定逻辑绑定） -->
			<el-table v-else :data="styleList" v-loading="loading" row-key="Id" class="tag-table">
				<el-table-column label="维度层" width="110">
					<template #default="{ row }">
						<el-tag size="small" effect="plain">{{ layerLabel(row.Layer) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="Name" label="判定键" width="130">
					<template #default="{ row }">
						<span class="name-text">{{ row.Name }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="Title" label="标签文案" width="150" show-overflow-tooltip />
				<el-table-column prop="Description" label="说明" min-width="260" show-overflow-tooltip>
					<template #default="{ row }">
						<span class="desc-text">{{ row.Description || '--' }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="Tone" label="色调" width="90" align="center">
					<template #default="{ row }">
						<el-tag size="small" :type="toneTagType(row.Tone)">{{ toneLabel(row.Tone) }}</el-tag>
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
						<el-button link type="primary" size="small" @click="openStyleEdit(row)">编辑</el-button>
						<el-button link type="danger" size="small" @click="removeStyleRow(row)">删除</el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-main>
	</el-container>

	<!-- 编辑对话框（行为标签 / 风格标签共用壳，按页签渲染表单） -->
	<el-dialog v-model="dialogVisible" width="560px" :title="dialogTitle" :close-on-click-modal="false">
		<!-- 行为标签表单 -->
		<div v-if="activeTab === 'behavior'" class="dialog-body">
			<div class="dialog-row">
				<span class="row-label">触发键</span>
				<el-input v-model="form.Name" maxlength="50" :disabled="isEdit" placeholder="系统内置标识（如：高频交易），新建后不可修改" style="width: 100%"></el-input>
			</div>
			<div class="dialog-row">
				<span class="row-label">标签文案</span>
				<el-input v-model="form.Title" maxlength="50" show-word-limit placeholder="画像页标签墙展示文本" style="width: 100%"></el-input>
			</div>
			<div class="dialog-row align-top">
				<span class="row-label">说明</span>
				<el-input v-model="form.Description" type="textarea" :rows="3" maxlength="500" show-word-limit
					placeholder="标签含义与触发条件（画像页鼠标悬浮展示）" style="width: 100%"></el-input>
			</div>
			<div class="dialog-row">
				<span class="row-label">色调</span>
				<el-select v-model="form.Tone" style="width: 100%">
					<el-option v-for="opt in TONE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
				</el-select>
			</div>
			<div class="dialog-row">
				<span class="row-label">排序号</span>
				<el-input-number v-model="form.SortNumber" :min="0" :max="9999" style="width: 160px"></el-input-number>
				<span class="row-tip">数值越小越靠前</span>
			</div>
			<div class="dialog-row">
				<span class="row-label">启用</span>
				<el-switch v-model="form.IsEnabled"></el-switch>
				<span class="row-tip">禁用后画像页不再输出该标签</span>
			</div>
		</div>
		<!-- 风格标签表单（模块/维度层/判定键编辑时不可修改） -->
		<div v-else class="dialog-body">
			<div class="dialog-row">
				<span class="row-label">模块</span>
				<el-select v-model="styleForm.Module" :disabled="isEdit" style="width: 100%">
					<el-option label="交易风格（style）" value="style" />
					<el-option label="选股风格（stock）" value="stock" />
					<el-option label="交易性格（persona）" value="persona" />
				</el-select>
			</div>
			<div class="dialog-row">
				<span class="row-label">维度层</span>
				<el-select v-model="styleForm.Layer" :disabled="isEdit" filterable allow-create default-first-option placeholder="选择或输入维度层" style="width: 100%">
					<el-option v-for="opt in layerOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
				</el-select>
			</div>
			<div class="dialog-row">
				<span class="row-label">判定键</span>
				<el-input v-model="styleForm.Name" maxlength="50" :disabled="isEdit" placeholder="画像判定输出的原始档位名（如：短线交易），新建后不可修改" style="width: 100%"></el-input>
			</div>
			<div class="dialog-row">
				<span class="row-label">标签文案</span>
				<el-input v-model="styleForm.Title" maxlength="50" show-word-limit placeholder="画像页模块标签展示文本" style="width: 100%"></el-input>
			</div>
			<div class="dialog-row align-top">
				<span class="row-label">说明</span>
				<el-input v-model="styleForm.Description" type="textarea" :rows="3" maxlength="500" show-word-limit
					placeholder="标签含义与判定条件（画像页鼠标悬浮展示）" style="width: 100%"></el-input>
			</div>
			<div class="dialog-row">
				<span class="row-label">色调</span>
				<el-select v-model="styleForm.Tone" style="width: 100%">
					<el-option v-for="opt in TONE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
				</el-select>
			</div>
			<div class="dialog-row">
				<span class="row-label">排序号</span>
				<el-input-number v-model="styleForm.SortNumber" :min="0" :max="9999" style="width: 160px"></el-input-number>
				<span class="row-tip">数值越小越靠前</span>
			</div>
			<div class="dialog-row">
				<span class="row-label">启用</span>
				<el-switch v-model="styleForm.IsEnabled"></el-switch>
				<span class="row-tip">禁用后画像页不再输出该维度标签</span>
			</div>
		</div>
		<template #footer>
			<el-button type="primary" :loading="saving" @click="submit">提交</el-button>
			<el-button type="warning" @click="dialogVisible = false">取消</el-button>
		</template>
	</el-dialog>

	<!-- 流派编辑对话框（基本信息 + 评分参数） -->
	<el-dialog v-model="schoolDialogVisible" width="760px" :title="schoolIsEdit ? '编辑流派' : '新增流派'" :close-on-click-modal="false" top="4vh">
		<div class="sd-body">
			<!-- 基本信息 -->
			<div class="sd-sect">
				<div class="sd-sect-head">
					<span class="sd-sect-bar"></span>
					<span class="sd-sect-title">基本信息</span>
					<span class="sd-sect-sub">流派名与展示信息（用户端评定弹窗）</span>
				</div>
				<div class="sd-grid">
					<div class="sd-row full">
						<span class="row-label">流派名</span>
						<el-input v-model="schoolForm.Name" maxlength="50" show-word-limit placeholder="如：超短线 / 打板 / 低吸潜伏 / 波段 / 价值投资"></el-input>
					</div>
					<div class="sd-row full">
						<span class="row-label">描述</span>
						<el-input v-model="schoolForm.Description" maxlength="200" placeholder="一句话描述（评定弹窗卡片副文案）"></el-input>
					</div>
					<div class="sd-row">
						<span class="row-label">图标</span>
						<el-select v-model="schoolForm.Icon" filterable allow-create default-first-option clearable placeholder="选择或输入 font-awesome 图标名" style="flex: 1; min-width: 0">
							<el-option v-for="name in SCHOOL_ICON_OPTIONS" :key="name" :label="name" :value="name">
								<span style="display: inline-flex; align-items: center; gap: 8px"><font-awesome-icon fas :icon="name"></font-awesome-icon><span>{{ name }}</span></span>
							</el-option>
						</el-select>
					</div>
					<div class="sd-row">
						<span class="row-label">预览</span>
						<span class="icon-preview" :class="'tone-' + schoolForm.Tone">
							<font-awesome-icon v-if="schoolForm.Icon" fas :icon="schoolForm.Icon"></font-awesome-icon>
							<span v-else class="row-tip">--</span>
						</span>
					</div>
					<div class="sd-row">
						<span class="row-label">色调</span>
						<el-select v-model="schoolForm.Tone" style="flex: 1; min-width: 0">
							<el-option v-for="opt in SCHOOL_TONE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
						</el-select>
					</div>
					<div class="sd-row">
						<span class="row-label">排序号</span>
						<el-input-number v-model="schoolForm.SortNumber" :min="0" :max="9999" style="width: 160px"></el-input-number>
					</div>
					<div class="sd-row full align-top">
						<span class="row-label">对照说明</span>
						<el-input v-model="schoolForm.CompareNote" type="textarea" :rows="2" maxlength="500" show-word-limit placeholder="该流派与系统实测画像如何对照（评定弹窗内选中后展示）"></el-input>
					</div>
					<div class="sd-row full">
						<span class="row-label">验证口径</span>
						<el-select v-model="schoolForm.VerifyPriceBasis" style="width: 300px">
							<el-option label="收盘价（中长线 / 价值投资倾向）" :value="1"></el-option>
							<el-option label="日内最高价（超短线 / 打板倾向）" :value="2"></el-option>
						</el-select>
						<span class="row-tip">复盘中心假设到期判定的正式价格口径（另一口径同步重算，仅作对照展示）</span>
					</div>
					<div class="sd-row full">
						<span class="row-label">启用</span>
						<el-switch v-model="schoolForm.IsEnabled"></el-switch>
						<span class="row-tip">停用后不出现在用户端评定选项，也不参与 AI 判定</span>
					</div>
				</div>
			</div>

			<!-- 评分参数 -->
			<div class="sd-sect">
				<div class="sd-sect-head">
					<span class="sd-sect-bar"></span>
					<span class="sd-sect-title">评分参数</span>
					<span class="sd-sect-sub">AI 判定命中该流派后按此参数换算八维得分；9 项须全部填写或全部留空（不完整不参与判定，留空回退默认宽松标准）</span>
				</div>
				<div class="param-grid">
					<div v-for="f in SCHOOL_PARAM_FIELDS" :key="f.key" class="param-item">
						<div class="param-label">{{ f.label }}<span class="param-unit">（{{ f.unit }}）</span></div>
						<el-input-number v-model="schoolForm[f.key]" :min="f.min" :max="f.max" :step="f.step" :value-on-clear="null" controls-position="right" style="width: 100%"></el-input-number>
						<div class="param-tip">{{ f.tip }}</div>
					</div>
				</div>
				<div v-if="schoolParamPartial" class="param-warn">
					<font-awesome-icon fas icon="triangle-exclamation"></font-awesome-icon>&nbsp;评分参数当前为部分填写：请补全或全部清空后再提交
				</div>
			</div>

			<!-- 封顶倍数（四维软饱和触顶倍数，独立可选参数） -->
			<div class="sd-sect">
				<div class="sd-sect-head">
					<span class="sd-sect-bar"></span>
					<span class="sd-sect-title">封顶倍数（可选）</span>
					<span class="sd-sect-sub">软饱和触顶倍数 K：达标=85 分、K×达标=100 分。四维业务语义不同可分别配置；留空按默认 3，不并入“全填或全空”规则</span>
				</div>
				<div class="param-grid">
					<div v-for="f in SCHOOL_CAPMULT_FIELDS" :key="f.key" class="param-item">
						<div class="param-label">{{ f.label }}<span class="param-unit">（{{ f.unit }}）</span></div>
						<el-input-number v-model="schoolForm[f.key]" :min="f.min" :max="f.max" :step="f.step" :value-on-clear="null" controls-position="right" style="width: 100%"></el-input-number>
						<div class="param-tip">{{ f.tip }}</div>
					</div>
				</div>
			</div>
		</div>
		<template #footer>
			<el-button type="primary" :loading="saving" @click="submitSchool">提交</el-button>
			<el-button type="warning" @click="schoolDialogVisible = false">取消</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from '@/untils/dayjs'
import { IZdxBehaviorTagManage, IZdxBehaviorTagForm, IZdxStyleTagManage, IZdxStyleTagForm } from '@/interfaces/zhiduoxing/IZdxMyTrade'
import { IZdxSchoolManage, IZdxSchoolForm } from '@/interfaces/zhiduoxing/IZdxSchool'
import API from '@/apis/zdx-api'

// 色调选项（与画像页 tag 色调一致：good=优势 / warn=风险 / info=中性）
const TONE_OPTIONS = [
	{ value: 'good', label: '优势（绿色）' },
	{ value: 'warn', label: '风险（红色）' },
	{ value: 'info', label: '中性（蓝色）' }
]

// 流派色调选项（info=中性 / good=优势 / warn=警示 / danger=风险）
const SCHOOL_TONE_OPTIONS = [
	{ value: 'info', label: '中性（蓝色）' },
	{ value: 'good', label: '优势（绿色）' },
	{ value: 'warn', label: '警示（黄色）' },
	{ value: 'danger', label: '风险（红色）' }
]

// 流派图标候选（font-awesome free-solid，可搜索或直接输入自定义图标名）
const SCHOOL_ICON_OPTIONS = ['bolt', 'fire', 'anchor', 'chart-line', 'gem', 'rocket', 'water', 'mountain', 'seedling', 'coins', 'scale-balanced', 'shield-halved', 'crown', 'compass', 'crosshairs', 'bullseye', 'gauge-high', 'chess-knight', 'trophy', 'star']

// 流派表单参数字段键（与后端 ZdxScoreStandard 9 项同名）
type SchoolParamKey = 'ProfitRatioTarget' | 'TimingWindow' | 'TimingSpan' | 'HoldDaysTarget' | 'BigLossThreshold' | 'ConsecutiveLossStart' | 'FeeErosionTolerance' | 'AvgAmplitudeMultiplier' | 'AnnualRateTarget'

// 封顶倍数字段键（4 项可选参数，与后端同名；不并入全填或全空）
type SchoolCapMultKey = 'ProfitRatioCapMult' | 'TimingCapMult' | 'PatienceCapMult' | 'ProfitCapMult'

// 评分参数字段（9 项统一"全填或全空"；范围与后端校验一致）
const SCHOOL_PARAM_FIELDS: { key: SchoolParamKey; label: string; unit: string; min: number; max: number; step: number; tip: string }[] = [
	{ key: 'ProfitRatioTarget', label: '盈亏比达标线', unit: '倍', min: 1, max: 10, step: 0.1, tip: '软饱和映射：达标记 85 分，K×达标封顶 100 分（K=下方盈亏比封顶倍数，留空按 3；达标内线性、达标外对数延伸，保留高分段区分度）' },
	{ key: 'TimingWindow', label: '择时窗口', unit: '日', min: 1, max: 60, step: 1, tip: '择时得分取买入后/卖出后第 N 日均涨幅对比' },
	{ key: 'TimingSpan', label: '择时映射幅度', unit: '±%', min: 0.5, max: 50, step: 0.5, tip: '软饱和居中映射：0 涨幅记 50 分、+幅度记 85 分、±K×幅度记 100/0 分（K=下方择时封顶倍数，留空按 3；卖出后反向）' },
	{ key: 'HoldDaysTarget', label: '耐心达标天数', unit: '天', min: 0.5, max: 365, step: 0.5, tip: '平均持有达该天数记 85 分，K×达标封顶 100 分（K=下方耐心封顶倍数，留空按 3；软饱和）' },
	{ key: 'BigLossThreshold', label: '大亏阈值', unit: '%', min: 10, max: 100, step: 1, tip: '百分比（相对用户自己的平均单笔买入额）：单笔亏损低于 -平均单笔买入额×阈值% 计入大亏，随账户仓位规模自适应；风控按大亏烈度（大亏合计÷资金基准）扣分，烧本金占比越高分越低' },
	{ key: 'ConsecutiveLossStart', label: '连亏起扣', unit: '笔', min: 1, max: 10, step: 1, tip: '起扣笔数取该值与期望最大连亏 k*=ln(n·q̂)÷ln(1/p̂)（p̂=(亏损笔数+1)÷(总笔数+2) Laplace 平滑，防小样本失真与高亏损率下 k* 爆炸）的大者，超过后每多 1 笔扣 6 分（高频账户不再因样本多被误伤）' },
	{ key: 'FeeErosionTolerance', label: '费用侵蚀满分线', unit: '%', min: 1, max: 100, step: 1, tip: '费用侵蚀比（费用 ÷ 盈利平仓毛利合计 × 100）达该值记 0 分；毛利口径与盈亏符号无关，亏损账户只要有止盈样本即可正常评估；全亏账户无止盈样本按中性 50 无法评估' },
	{ key: 'AvgAmplitudeMultiplier', label: '回撤均幅倍数', unit: '倍', min: 0.5, max: 10, step: 0.5, tip: '回撤基准 = max(曲线峰值, 单笔均幅 × 倍数, 1)，回撤达基准记 0 分' },
	{ key: 'AnnualRateTarget', label: '年化收益达标线', unit: '%', min: 1, max: 100, step: 0.5, tip: '软饱和居中映射：年化 0% 记 50 分、达该值记 85 分、K×该值记 100 分（K=下方收益能力封顶倍数，留空按 3；负方向对称）' }
]

// 封顶倍数字段（4 项可选；范围与后端 NormalizeCapMult 一致，非法值归空按默认 3）
const SCHOOL_CAPMULT_FIELDS: { key: SchoolCapMultKey; label: string; unit: string; min: number; max: number; step: number; tip: string }[] = [
	{ key: 'ProfitRatioCapMult', label: '盈亏比封顶倍数', unit: '×', min: 1.5, max: 10, step: 0.5, tip: '实际盈亏比达“倍数×达标线”时记 100 分封顶；倍数越小高分段越快触顶（适合达标线定得低的流派），留空按 3' },
	{ key: 'TimingCapMult', label: '择时封顶倍数', unit: '×', min: 1.5, max: 10, step: 0.5, tip: '买入后涨幅达“倍数×映射幅度”记 100 分、负方向对称记 0 分；幅度定得宽的流派可调小避免永远碰不到顶，留空按 3' },
	{ key: 'PatienceCapMult', label: '耐心封顶倍数', unit: '×', min: 1.5, max: 10, step: 0.5, tip: '平均持有达“倍数×达标天数”记 100 分封顶；长线流派达标天数已高，可用小倍数避免极端持有天数才满分，留空按 3' },
	{ key: 'ProfitCapMult', label: '收益能力封顶倍数', unit: '×', min: 1.5, max: 10, step: 0.5, tip: '年化达“倍数×达标线”记 100 分、负方向对称记 0 分；牛市预期高的流派可调大保留区分度，留空按 3' }
]

// 流派表单状态（参数 null=未配置）
interface SchoolFormState {
	Name: string
	Description: string
	Icon: string
	Tone: string
	CompareNote: string
	VerifyPriceBasis: number
	SortNumber: number
	IsEnabled: boolean
	ProfitRatioTarget: number | null
	TimingWindow: number | null
	TimingSpan: number | null
	HoldDaysTarget: number | null
	BigLossThreshold: number | null
	ConsecutiveLossStart: number | null
	FeeErosionTolerance: number | null
	AvgAmplitudeMultiplier: number | null
	AnnualRateTarget: number | null
	ProfitRatioCapMult: number | null
	TimingCapMult: number | null
	PatienceCapMult: number | null
	ProfitCapMult: number | null
}

// 页签（流派管理 + 行为标签/三大风格模块标签维护；后端 Api 相互独立）
type TagTab = 'school' | 'behavior' | 'style' | 'stock' | 'persona'
const activeTab = ref<TagTab>('school')

// 维度层中文映射（风格标签判定维度）
const LAYER_LABELS: Record<string, string> = {
	main: '主风格',
	holdcycle: '持仓周期',
	frequency: '交易频率',
	strategy: '策略类型',
	risk: '风险等级',
	target: '标的偏好',
	execution: '执行方式',
	marketcap: '市值',
	valuation: '估值',
	growthvalue: '成长价值',
	industry: '行业',
	momentum: '动量',
	volatility: '波动率',
	quality: '质量',
	concentration: '集中度',
	profitloss: '盈亏处理',
	positionchange: '仓位变化',
	emotion: '情绪反应',
	consistency: '决策一致性',
	costsense: '成本敏感度',
	patience: '耐心'
}

// 各模块可选维度层（下拉候选；支持自定义输入）
const MODULE_LAYERS: Record<string, string[]> = {
	style: ['main', 'holdcycle', 'frequency', 'strategy', 'risk', 'target', 'execution'],
	stock: ['marketcap', 'valuation', 'growthvalue', 'industry', 'momentum', 'volatility', 'quality', 'concentration'],
	persona: ['risk', 'holdcycle', 'frequency', 'profitloss', 'positionchange', 'emotion', 'consistency', 'concentration', 'costsense', 'patience']
}

// 页签说明文案
const TIP_TEXTS: Record<TagTab, string> = {
	school: '流派为「流派评定」候选与 AI 判定的数据源：用户未自选流派时，评定流程按画像标签（行为标签/交易风格/选股风格/交易性格）经 AI 从启用且评分参数完整的流派中判定一个作为实测流派；判定命中后按流派评分参数换算八维得分，未命中或参数不全时回退默认宽松标准；停用后不再出现在用户端评定选项且不参与 AI 判定；已被用户评定的流派不可删除，只能停用',
	behavior: '行为标签由画像页按统计特征自动触发，此处维护每个标签的展示文案、说明（悬浮提示）与色调；触发键为系统内置标识，新建后不可修改，删除后画像页将回退内置默认文案；禁用后画像页不再输出该标签',
	style: '交易风格为六层维度合成（L1 持仓周期 × L2 交易频率 → 主风格；L3 策略类型 / L4 风险等级 / L5 标的偏好 / L6 执行方式），此处维护各维度标签的展示文案、说明与色调；判定键与判定逻辑绑定，新增后不可修改；禁用后画像页不输出该维度',
	stock: '选股风格按 8 维（市值/估值/成长价值/行业/动量/波动/质量/集中度）以买入金额加权判定，此处维护各维度标签的展示文案、说明与色调；判定键与判定逻辑绑定，新增后不可修改；禁用后画像页不输出该维度',
	persona: '交易性格按 10 维（风险偏好/持仓周期/交易频率/盈亏处理/仓位变化/情绪反应/决策一致性/集中度/成本敏感度/耐心）按逐笔交易时点判定，此处维护各维度标签的展示文案、说明与色调；判定键与判定逻辑绑定，新增后不可修改；禁用后画像页不输出该维度'
}

const loading = ref(false) // 加载中
const saving = ref(false) // 保存中
const list = ref<IZdxBehaviorTagManage[]>([]) // 行为标签列表
const styleList = ref<IZdxStyleTagManage[]>([]) // 风格标签列表（style/stock/persona）
const schoolList = ref<IZdxSchoolManage[]>([]) // 流派列表

// 编辑对话框（两类标签共用壳）
const dialogVisible = ref(false)
const isEdit = ref(false) // 编辑模式（触发键/判定键禁用修改）
const editId = ref(0) // 编辑目标 Id
const form = ref<IZdxBehaviorTagForm>({ Name: '', Title: '', Description: '', Tone: 'info', SortNumber: 10, IsEnabled: true })
const styleForm = ref<IZdxStyleTagForm>({ Module: 'style', Layer: '', Name: '', Title: '', Description: '', Tone: 'info', SortNumber: 10, IsEnabled: true })

// 流派编辑对话框（基本信息 + 评分参数）
const schoolDialogVisible = ref(false)
const schoolIsEdit = ref(false) // 编辑模式（流派名可修改）
const schoolEditId = ref(0) // 编辑目标 Id
const schoolTogglingId = ref(0) // 启用快切进行中的流派 Id（0=空闲）
const schoolForm = ref<SchoolFormState>(createSchoolForm())

// 当前是否流派页签（默认页签）
const isSchoolTab = computed(() => activeTab.value === 'school')
// 当前是否风格标签页签（行为标签/流派页签=false）
const isStyleTab = computed(() => activeTab.value === 'style' || activeTab.value === 'stock' || activeTab.value === 'persona')
const dialogTitle = computed(() => (isStyleTab.value ? (isEdit.value ? '编辑风格标签' : '新增风格标签') : isEdit.value ? '编辑标签' : '新增标签'))
const tipText = computed(() => TIP_TEXTS[activeTab.value])
// 维度层下拉候选（按当前模块）
const layerOptions = computed(() => (MODULE_LAYERS[styleForm.value.Module ?? 'style'] ?? []).map(v => ({ value: v, label: `${layerLabel(v)}（${v}）` })))

// 流派概览统计卡片（总数/已启用/已配参数）
const schoolStatCards = computed(() => [
	{ label: '流派总数', value: schoolList.value.length, icon: 'layer-group', tone: 'blue' },
	{ label: '已启用', value: schoolList.value.filter(e => e.IsEnabled).length, icon: 'circle-check', tone: 'green' },
	{ label: '已配评分参数', value: schoolList.value.filter(e => e.TimingWindow != null).length, icon: 'sliders', tone: 'orange' }
])

// 评分参数是否部分填写（需 9 项全填或全空，提交前提示）
const schoolParamPartial = computed(() => {
	const vals = Object.values(readSchoolParams(schoolForm.value))
	const filled = vals.filter(v => v !== null).length
	return filled > 0 && filled < vals.length
})

onMounted(() => {
	load()
})

// 加载当前页签标签列表（失败时清空；提示由拦截器统一弹出）
async function load() {
	loading.value = true
	try {
		if (activeTab.value === 'school') {
			schoolList.value = await API.getSchoolList()
		} else if (activeTab.value === 'behavior') {
			list.value = await API.getBehaviorTagList()
		} else {
			styleList.value = await API.getStyleTagList(activeTab.value)
		}
	} catch {
		if (activeTab.value === 'school') schoolList.value = []
		else if (activeTab.value === 'behavior') list.value = []
		else styleList.value = []
	} finally {
		loading.value = false
	}
}

// 页签切换重新加载（两类标签后端 Api 独立）
function onTabChange() {
	load()
}

// 打开新增对话框（流派页签走独立对话框；标签页签按排序号默认取当前列表最大值 +1）
function openAdd() {
	if (isSchoolTab.value) {
		openSchoolAdd()
		return
	}
	if (isStyleTab.value) {
		const maxSort = styleList.value.reduce((max, item) => Math.max(max, item.SortNumber), 0)
		isEdit.value = false
		editId.value = 0
		styleForm.value = { Module: activeTab.value, Layer: '', Name: '', Title: '', Description: '', Tone: 'info', SortNumber: maxSort + 1, IsEnabled: true }
		dialogVisible.value = true
		return
	}
	const maxSort = list.value.reduce((max, item) => Math.max(max, item.SortNumber), 0)
	isEdit.value = false
	editId.value = 0
	form.value = { Name: '', Title: '', Description: '', Tone: 'info', SortNumber: maxSort + 1, IsEnabled: true }
	dialogVisible.value = true
}

// 打开行为标签编辑对话框（触发键仅展示不可修改）
function openEdit(row: IZdxBehaviorTagManage) {
	isEdit.value = true
	editId.value = row.Id
	form.value = {
		Name: row.Name,
		Title: row.Title,
		Description: row.Description ?? '',
		Tone: row.Tone,
		SortNumber: row.SortNumber,
		IsEnabled: row.IsEnabled
	}
	dialogVisible.value = true
}

// 打开风格标签编辑对话框（模块/维度层/判定键仅展示不可修改）
function openStyleEdit(row: IZdxStyleTagManage) {
	isEdit.value = true
	editId.value = row.Id
	styleForm.value = {
		Module: row.Module,
		Layer: row.Layer,
		Name: row.Name,
		Title: row.Title,
		Description: row.Description ?? '',
		Tone: row.Tone,
		SortNumber: row.SortNumber,
		IsEnabled: row.IsEnabled
	}
	dialogVisible.value = true
}

// 提交（新增/编辑；成功信息由拦截器统一弹出，关闭对话框并刷新）
async function submit() {
	if (isStyleTab.value) {
		if (!isEdit.value && (!styleForm.value.Module?.trim() || !styleForm.value.Layer?.trim() || !styleForm.value.Name?.trim())) {
			ElMessage.warning('请填写模块、维度层与判定键')
			return
		}
		if (!styleForm.value.Title?.trim()) {
			ElMessage.warning('请输入标签文案')
			return
		}
		if (saving.value) return

		saving.value = true
		try {
			const res = isEdit.value ? await API.updateStyleTag(editId.value, styleForm.value) : await API.addStyleTag(styleForm.value)
			if (res.Status) {
				dialogVisible.value = false
				load()
			}
		} catch {
			// 失败信息由响应拦截器统一弹出通知
		} finally {
			saving.value = false
		}
		return
	}

	if (!isEdit.value && !form.value.Name?.trim()) {
		ElMessage.warning('请输入触发键')
		return
	}
	if (!form.value.Title?.trim()) {
		ElMessage.warning('请输入标签文案')
		return
	}
	if (saving.value) return

	saving.value = true
	try {
		const res = isEdit.value ? await API.updateBehaviorTag(editId.value, form.value) : await API.addBehaviorTag(form.value)
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

// 删除行为标签（确认后删除；删除后画像页该触发键回退内置默认文案）
function removeRow(row: IZdxBehaviorTagManage) {
	ElMessageBox.confirm(`确认删除标签「${row.Title}」？删除后画像页该触发键将回退内置默认文案。`,
		'删除标签提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	})
		.then(async () => {
			try {
				const res = await API.delBehaviorTag(row.Id)
				if (res.Status) load()
			} catch {
				// 失败信息由响应拦截器统一弹出通知
			}
		})
		.catch(() => {
			// 用户取消
		})
}

// 删除风格标签（确认后删除；删除后画像页该判定键回退内置默认文案）
function removeStyleRow(row: IZdxStyleTagManage) {
	ElMessageBox.confirm(`确认删除标签「${row.Title}」？删除后画像页该判定键将回退内置默认文案。`,
		'删除标签提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	})
		.then(async () => {
			try {
				const res = await API.delStyleTag(row.Id)
				if (res.Status) load()
			} catch {
				// 失败信息由响应拦截器统一弹出通知
			}
		})
		.catch(() => {
			// 用户取消
		})
}

// ===== 流派管理（默认页签：基本信息 + 评分参数） =====

// 新建流派表单默认值
function createSchoolForm(): SchoolFormState {
	return {
		Name: '',
		Description: '',
		Icon: '',
		Tone: 'info',
		CompareNote: '',
		VerifyPriceBasis: 1,
		SortNumber: 10,
		IsEnabled: true,
		ProfitRatioTarget: null,
		TimingWindow: null,
		TimingSpan: null,
		HoldDaysTarget: null,
		BigLossThreshold: null,
		ConsecutiveLossStart: null,
		FeeErosionTolerance: null,
		AvgAmplitudeMultiplier: null,
		AnnualRateTarget: null,
		ProfitRatioCapMult: null,
		TimingCapMult: null,
		PatienceCapMult: null,
		ProfitCapMult: null
	}
}

// 数值规范化（非法/空值归 null，规避 el-input-number 清空值类型差异）
function normNum(v: number | null | undefined): number | null {
	return typeof v === 'number' && Number.isFinite(v) ? v : null
}

// 封顶倍数规范化（与后端 NormalizeCapMult 同口径：超出 1.5~10 归 null 按默认 3）
function normCapMult(v: number | null | undefined): number | null {
	const n = normNum(v)
	return n !== null && n >= 1.5 && n <= 10 ? n : null
}

// 读取表单 9 项评分参数（规范化）
function readSchoolParams(form: SchoolFormState) {
	return {
		ProfitRatioTarget: normNum(form.ProfitRatioTarget),
		TimingWindow: normNum(form.TimingWindow),
		TimingSpan: normNum(form.TimingSpan),
		HoldDaysTarget: normNum(form.HoldDaysTarget),
		BigLossThreshold: normNum(form.BigLossThreshold),
		ConsecutiveLossStart: normNum(form.ConsecutiveLossStart),
		FeeErosionTolerance: normNum(form.FeeErosionTolerance),
		AvgAmplitudeMultiplier: normNum(form.AvgAmplitudeMultiplier),
		AnnualRateTarget: normNum(form.AnnualRateTarget)
	}
}

// 读取表单 4 项封顶倍数（可选参数，不参与全填或全空判定）
function readSchoolCapMults(form: SchoolFormState) {
	return {
		ProfitRatioCapMult: normCapMult(form.ProfitRatioCapMult),
		TimingCapMult: normCapMult(form.TimingCapMult),
		PatienceCapMult: normCapMult(form.PatienceCapMult),
		ProfitCapMult: normCapMult(form.ProfitCapMult)
	}
}

// 打开新增流派对话框（排序号默认取当前列表最大值 +1）
function openSchoolAdd() {
	const maxSort = schoolList.value.reduce((max, item) => Math.max(max, item.SortNumber), 0)
	schoolIsEdit.value = false
	schoolEditId.value = 0
	schoolForm.value = createSchoolForm()
	schoolForm.value.SortNumber = maxSort + 1
	schoolDialogVisible.value = true
}

// 打开编辑流派对话框
function openSchoolEdit(row: IZdxSchoolManage) {
	schoolIsEdit.value = true
	schoolEditId.value = row.Id
	schoolForm.value = {
		Name: row.Name,
		Description: row.Description ?? '',
		Icon: row.Icon ?? '',
		Tone: row.Tone,
		CompareNote: row.CompareNote ?? '',
		VerifyPriceBasis: row.VerifyPriceBasis === 2 ? 2 : 1,
		SortNumber: row.SortNumber,
		IsEnabled: row.IsEnabled,
		ProfitRatioTarget: normNum(row.ProfitRatioTarget),
		TimingWindow: normNum(row.TimingWindow),
		TimingSpan: normNum(row.TimingSpan),
		HoldDaysTarget: normNum(row.HoldDaysTarget),
		BigLossThreshold: normNum(row.BigLossThreshold),
		ConsecutiveLossStart: normNum(row.ConsecutiveLossStart),
		FeeErosionTolerance: normNum(row.FeeErosionTolerance),
		AvgAmplitudeMultiplier: normNum(row.AvgAmplitudeMultiplier),
		AnnualRateTarget: normNum(row.AnnualRateTarget),
		ProfitRatioCapMult: normCapMult(row.ProfitRatioCapMult),
		TimingCapMult: normCapMult(row.TimingCapMult),
		PatienceCapMult: normCapMult(row.PatienceCapMult),
		ProfitCapMult: normCapMult(row.ProfitCapMult)
	}
	schoolDialogVisible.value = true
}

// 提交流派（校验名称/参数全填或全空；成功后关闭并刷新）
async function submitSchool() {
	const form = schoolForm.value
	if (!form.Name?.trim()) {
		ElMessage.warning('请输入流派名')
		return
	}
	const params = readSchoolParams(form)
	const capMults = readSchoolCapMults(form)
	const filled = Object.values(params).filter(v => v !== null).length
	if (filled > 0 && filled < 9) {
		ElMessage.warning('评分参数需 9 项全部填写或全部留空')
		return
	}
	if (saving.value) return

	saving.value = true
	try {
		const payload: IZdxSchoolForm = {
			Name: form.Name.trim(),
			Description: form.Description?.trim() || undefined,
			Icon: form.Icon?.trim() || undefined,
			Tone: form.Tone,
			CompareNote: form.CompareNote?.trim() || undefined,
			VerifyPriceBasis: form.VerifyPriceBasis === 2 ? 2 : 1,
			SortNumber: form.SortNumber,
			IsEnabled: form.IsEnabled,
			...params,
			...capMults
		}
		const res = schoolIsEdit.value ? await API.updateSchool(schoolEditId.value, payload) : await API.addSchool(payload)
		if (res.Status) {
			schoolDialogVisible.value = false
			load()
		}
	} catch {
		// 失败信息由响应拦截器统一弹出通知
	} finally {
		saving.value = false
	}
}

// 启用快速切换（以行数据整体提交；失败回滚开关状态）
async function toggleSchoolEnabled(row: IZdxSchoolManage) {
	if (schoolTogglingId.value) {
		row.IsEnabled = !row.IsEnabled
		return
	}
	schoolTogglingId.value = row.Id
	try {
		const res = await API.updateSchool(row.Id, {
			Name: row.Name,
			Description: row.Description,
			Icon: row.Icon,
			Tone: row.Tone,
			CompareNote: row.CompareNote,
			VerifyPriceBasis: row.VerifyPriceBasis === 2 ? 2 : 1,
			SortNumber: row.SortNumber,
			IsEnabled: row.IsEnabled,
			ProfitRatioTarget: normNum(row.ProfitRatioTarget),
			TimingWindow: normNum(row.TimingWindow),
			TimingSpan: normNum(row.TimingSpan),
			HoldDaysTarget: normNum(row.HoldDaysTarget),
			BigLossThreshold: normNum(row.BigLossThreshold),
			ConsecutiveLossStart: normNum(row.ConsecutiveLossStart),
			FeeErosionTolerance: normNum(row.FeeErosionTolerance),
			AvgAmplitudeMultiplier: normNum(row.AvgAmplitudeMultiplier),
			AnnualRateTarget: normNum(row.AnnualRateTarget),
			ProfitRatioCapMult: normCapMult(row.ProfitRatioCapMult),
			TimingCapMult: normCapMult(row.TimingCapMult),
			PatienceCapMult: normCapMult(row.PatienceCapMult),
			ProfitCapMult: normCapMult(row.ProfitCapMult)
		})
		if (!res.Status) row.IsEnabled = !row.IsEnabled
	} catch {
		row.IsEnabled = !row.IsEnabled
	} finally {
		schoolTogglingId.value = 0
	}
}

// 删除流派（确认后删除；被用户评定的流派服务端会拒绝，请改用停用）
function removeSchoolRow(row: IZdxSchoolManage) {
	ElMessageBox.confirm(`确认删除流派「${row.Name}」？已被用户评定的流派不可删除，请改用停用。`,
		'删除流派提示', {
		type: 'warning',
		cancelButtonText: '放弃操作'
	})
		.then(async () => {
			try {
				const res = await API.delSchool(row.Id)
				if (res.Status) load()
			} catch {
				// 失败信息由响应拦截器统一弹出通知
			}
		})
		.catch(() => {
			// 用户取消
		})
}

// 评分参数摘要（列表展示；未配置/部分配置给不同文案）
function schoolParamText(row: IZdxSchoolManage): string {
	const p = [
		row.ProfitRatioTarget,
		row.TimingWindow,
		row.TimingSpan,
		row.HoldDaysTarget,
		row.BigLossThreshold,
		row.ConsecutiveLossStart,
		row.FeeErosionTolerance,
		row.AvgAmplitudeMultiplier,
		row.AnnualRateTarget
	].map(v => normNum(v))
	if (p.every(v => v === null)) return ''
	if (p.some(v => v === null)) return '部分未配置（需 9 项全填）'
	// 封顶倍数为可选附加参数：仅在非默认（≠3）时附加展示，避免摘要过长
	const caps: [string, number | null][] = [
		['ProfitRatioCapMult', normCapMult(row.ProfitRatioCapMult)],
		['TimingCapMult', normCapMult(row.TimingCapMult)],
		['PatienceCapMult', normCapMult(row.PatienceCapMult)],
		['ProfitCapMult', normCapMult(row.ProfitCapMult)]
	]
	const capText = caps
		.filter(([, v]) => v !== null && v !== 3)
		.map(([k, v]) => `${CAP_MULT_LABELS[k] ?? k}×${v}`)
		.join(' ')
	const base = `盈亏比 ${p[0]} ｜ 择时 ${p[1]}日 ${p[2]}% ｜ 耐心 ${p[3]}天 ｜ 大亏 ${p[4]}% ｜ 连亏 ${p[5]}笔 ｜ 费用 ${p[6]}% ｜ 回撤×${p[7]} ｜ 年化 ${p[8]}%`
	return capText ? `${base} ｜ ${capText}` : base
}

// 封顶倍数字段的摘要短标签
const CAP_MULT_LABELS: Record<string, string> = {
	ProfitRatioCapMult: '盈亏比顶',
	TimingCapMult: '择时顶',
	PatienceCapMult: '耐心顶',
	ProfitCapMult: '收益顶'
}

// 流派验证口径展示文案（1=收盘价 2=日内最高价）
function schoolBasisLabel(basis?: number | null) {
	return basis === 2 ? '日内最高' : '收盘价'
}

// 流派色调展示文案（含警示/风险）
function schoolToneLabel(tone: string): string {
	if (tone === 'good') return '优势'
	if (tone === 'warn') return '警示'
	if (tone === 'danger') return '风险'
	return '中性'
}

// 流派色调标签类型（good=绿 warn=黄 danger=红 其他=蓝）
function schoolToneTagType(tone: string): 'success' | 'warning' | 'danger' | 'primary' {
	if (tone === 'good') return 'success'
	if (tone === 'warn') return 'warning'
	if (tone === 'danger') return 'danger'
	return 'primary'
}

// 维度层展示文案（未收录回退原始值）
function layerLabel(layer?: string): string {
	if (!layer) return '--'
	return LAYER_LABELS[layer] ?? layer
}

// 色调展示文案
function toneLabel(tone: string): string {
	if (tone === 'good') return '优势'
	if (tone === 'warn') return '风险'
	return '中性'
}

// 色调标签类型（good=绿 warn=红 其他=蓝）
function toneTagType(tone: string): 'success' | 'danger' | 'primary' {
	if (tone === 'good') return 'success'
	if (tone === 'warn') return 'danger'
	return 'primary'
}

// 时间格式化（yyyy-MM-dd HH:mm）
function fmtTime(time?: string): string {
	return time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '--'
}
</script>

<style lang="scss" scoped>
.behavior-tag-page {
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

		.tag-tabs {
			:deep(.el-tabs__header) {
				margin-bottom: 12px;
			}
		}

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

		.tag-table {
			.name-text {
				font-weight: 600;
				color: #303133;
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

// ===== 流派管理（概览统计 + 列表） =====
.school-overview {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 14px;
	margin-bottom: 14px;

	.stat-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px;
		border-radius: 12px;
		background: linear-gradient(135deg, #f7f9ff 0%, #eef3ff 100%);
		border: 1px solid #e8eefc;

		.stat-ico {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 40px;
			height: 40px;
			border-radius: 10px;
			font-size: 17px;

			&.stat-blue {
				background: #e8f1ff;
				color: #4a7ef7;
			}

			&.stat-green {
				background: #e6f8ee;
				color: #2fae6e;
			}

			&.stat-purple {
				background: #efeaff;
				color: #7c5cf0;
			}

			&.stat-orange {
				background: #fff3e5;
				color: #e6903c;
			}
		}

		.stat-meta {
			display: flex;
			flex-direction: column;
			min-width: 0;

			.stat-num {
				font-size: 22px;
				font-weight: 700;
				line-height: 1.2;
				color: #303133;
				font-variant-numeric: tabular-nums;
			}

			.stat-label {
				font-size: 12px;
				color: #909399;
			}
		}
	}
}

.school-table {
	.school-cell {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;

		.school-badge {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 34px;
			height: 34px;
			border-radius: 10px;
			font-size: 15px;
			flex-shrink: 0;

			&.tone-bg-info {
				background: #e8f1ff;
				color: #409eff;
			}

			&.tone-bg-good {
				background: #e6f8ee;
				color: #67c23a;
			}

			&.tone-bg-warn {
				background: #fdf3e3;
				color: #e6a23c;
			}

			&.tone-bg-danger {
				background: #fdeaea;
				color: #f56c6c;
			}
		}

		.school-meta {
			display: flex;
			flex-direction: column;
			min-width: 0;

			.school-name {
				font-weight: 600;
				color: #303133;
			}

			.school-desc {
				font-size: 12px;
				color: #909399;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}
	}

	.param-text {
		font-size: 12.5px;
		color: #606266;
		font-variant-numeric: tabular-nums;
	}

	.empty-text {
		color: #c0c4cc;
		font-size: 12.5px;
	}
}


// ===== 流派编辑对话框（分区布局） =====
.sd-body {
	max-height: 70vh;
	overflow-y: auto;
	padding-right: 6px;

	.sd-sect {
		margin-bottom: 18px;
		border: 1px solid #ecf0f7;
		border-radius: 12px;
		padding: 14px 16px 4px;
		background: #fcfdff;

		.sd-sect-head {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 8px;
			margin-bottom: 14px;

			.sd-sect-bar {
				width: 4px;
				height: 14px;
				border-radius: 2px;
				background: linear-gradient(180deg, #4a7ef7, #7c5cf0);
			}

			.sd-sect-title {
				font-weight: 600;
				color: #303133;
			}

			.sd-sect-sub {
				font-size: 12px;
				color: #909399;
				flex: 1;
				min-width: 0;
			}
		}

		.sd-grid {
			.sd-row {
				display: flex;
				align-items: center;
				margin-bottom: 14px;

				&.align-top {
					align-items: flex-start;

					.row-label {
						line-height: 32px;
					}
				}

				.row-label {
					width: 70px;
					flex-shrink: 0;
					color: #606266;
					font-size: 13px;
				}

				.row-tip {
					margin-left: 10px;
					color: #909399;
					font-size: 12px;
				}
			}
		}

		.icon-preview {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 34px;
			height: 34px;
			border-radius: 10px;
			font-size: 16px;

			&.tone-info {
				color: #409eff;
				background: #e8f1ff;
			}

			&.tone-good {
				color: #67c23a;
				background: #e6f8ee;
			}

			&.tone-warn {
				color: #e6a23c;
				background: #fdf3e3;
			}

			&.tone-danger {
				color: #f56c6c;
				background: #fdeaea;
			}
		}

		.param-grid {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 12px 18px;
			margin-bottom: 12px;

			.param-item {
				.param-label {
					font-size: 13px;
					color: #606266;
					margin-bottom: 6px;

					.param-unit {
						color: #a8abb2;
					}
				}

				.param-tip {
					margin-top: 4px;
					font-size: 11.5px;
					color: #b0b4bd;
					line-height: 1.5;
				}
			}
		}

		.param-warn {
			display: flex;
			align-items: center;
			margin-bottom: 12px;
			padding: 8px 12px;
			border-radius: 8px;
			background: #fdf3e3;
			color: #e6a23c;
			font-size: 12.5px;
		}
	}
}
</style>
