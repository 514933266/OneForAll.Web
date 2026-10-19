// 流派定义管理项（后台流派管理页列表行）
export interface IZdxSchoolManage {
	// 流派 Id
	Id: number
	// 流派名（唯一；AI 判定命中的实测流派名，可直接改名）
	Name: string
	// 一句话描述（用户端评定弹窗卡片副文案）
	Description?: string
	// 图标名（font-awesome free-solid，如 bolt/fire/anchor）
	Icon?: string
	// 色调（info=中性 good=优势 warn=警示 danger=风险）
	Tone: string
	// 实测对照说明（评定弹窗内"该流派与系统实测画像如何对照"）
	CompareNote?: string
	// 验证价格口径（1=收盘价 2=日内最高价；复盘假设到期判定的正式口径）
	VerifyPriceBasis: number
	// 评分参数：盈亏比达标线（软饱和：达标=85 分、K×达标=100 分，K=盈亏比封顶倍数；1~10 倍）
	ProfitRatioTarget?: number | null
	// 评分参数：择时窗口（择时得分取买入后/卖出后第 N 日均涨幅对比；1~60 日）
	TimingWindow?: number | null
	// 评分参数：择时映射幅度（±%：软饱和居中 0=50、+幅度=85、±K×幅度=100/0；0.5~50）
	TimingSpan?: number | null
	// 评分参数：耐心达标天数（平均持有达该天数记 85 分、K×达标封顶 100；0.5~365）
	HoldDaysTarget?: number | null
	// 评分参数：大亏阈值（%（相对用户自己的平均单笔买入额）：单笔亏损低于 -平均单笔买入额×阈值% 计入大亏；10~100）
	BigLossThreshold?: number | null
	// 评分参数：连亏起扣（与期望最大连亏 k*=ln(n·q̂)÷ln(1/p̂)，p̂=(亏损笔数+1)÷(总笔数+2) Laplace 平滑，取大后为实际起扣，每超 1 笔扣 6 分；1~10 笔）
	ConsecutiveLossStart?: number | null
	// 评分参数：费用侵蚀满分线（费用÷盈利平仓毛利合计×100 达该值记 0 分，毛利口径与盈亏符号无关；1~100）
	FeeErosionTolerance?: number | null
	// 评分参数：回撤均幅倍数（回撤基准=max(曲线峰值, 单笔均幅×倍数, 1)；0.5~10）
	AvgAmplitudeMultiplier?: number | null
	// 评分参数：年化收益达标线（软饱和：年化达该值记 85 分、K×该值记 100 分，负方向对称；1~100）
	AnnualRateTarget?: number | null
	// 可选评分参数：盈亏比封顶倍数（软饱和触顶倍数；留空按默认 3，不并入 9 项全填或全空；1.5~10）
	ProfitRatioCapMult?: number | null
	// 可选评分参数：择时封顶倍数（同上；留空按 3）
	TimingCapMult?: number | null
	// 可选评分参数：耐心封顶倍数（同上；留空按 3）
	PatienceCapMult?: number | null
	// 可选评分参数：收益能力封顶倍数（同上；留空按 3）
	ProfitCapMult?: number | null
	// 排序号（用户端选项与管理页列表共用，升序）
	SortNumber: number
	// 是否启用（停用后不出现在用户端选项且不参与 AI 判定，但已选用户仍可见历史选择）
	IsEnabled: boolean
	// 创建时间
	CreateTime: string
	// 更新时间
	UpdateTime: string
	// 最后修改人
	Modifier?: string
}

// 流派编辑表单（新增/编辑共用；名称可改，重名将被拒绝）
export interface IZdxSchoolForm {
	// 流派名（必填且唯一，≤50字）
	Name: string
	// 一句话描述（选填，≤200字）
	Description?: string
	// 图标名（选填，font-awesome free-solid）
	Icon?: string
	// 色调（info/good/warn/danger）
	Tone: string
	// 实测对照说明（选填，≤500字）
	CompareNote?: string
	// 验证价格口径（1=收盘价 2=日内最高价；缺省/非法归 1）
	VerifyPriceBasis?: number | null
	// 评分参数：盈亏比达标线（1~10 倍；9 项评分参数需全部填写或全部留空）
	ProfitRatioTarget?: number | null
	// 评分参数：择时窗口（1~60 日）
	TimingWindow?: number | null
	// 评分参数：择时映射幅度（±%；0.5~50）
	TimingSpan?: number | null
	// 评分参数：耐心达标天数（天；0.5~365）
	HoldDaysTarget?: number | null
	// 评分参数：大亏阈值（%（相对平均单笔买入额）；10~100）
	BigLossThreshold?: number | null
	// 评分参数：连亏起扣（笔；1~10）
	ConsecutiveLossStart?: number | null
	// 评分参数：费用侵蚀满分线（%；1~100）
	FeeErosionTolerance?: number | null
	// 评分参数：回撤均幅倍数（倍；0.5~10）
	AvgAmplitudeMultiplier?: number | null
	// 评分参数：年化收益达标线（%；1~100）
	AnnualRateTarget?: number | null
	// 可选评分参数：盈亏比封顶倍数（软饱和触顶倍数；留空按默认 3，不参与全填或全空；1.5~10）
	ProfitRatioCapMult?: number | null
	// 可选评分参数：择时封顶倍数（同上；留空按 3）
	TimingCapMult?: number | null
	// 可选评分参数：耐心封顶倍数（同上；留空按 3）
	PatienceCapMult?: number | null
	// 可选评分参数：收益能力封顶倍数（同上；留空按 3）
	ProfitCapMult?: number | null
	// 排序号（升序）
	SortNumber: number
	// 是否启用
	IsEnabled: boolean
}

// 流派选项（用户端评定弹窗卡片；仅启用项）
export interface IZdxSchoolOption {
	// 流派 Id
	Id: number
	// 流派名
	Name: string
	// 一句话描述（卡片副文案）
	Description?: string
	// 图标名（font-awesome free-solid）
	Icon?: string
	// 色调（info/good/warn/danger）
	Tone: string
	// 实测对照说明（选中后展示）
	CompareNote?: string
}

// 我的交易档案（用户端"流派评定"；含当前所选流派与可选项列表）
export interface IZdxMyProfile {
	// 当前所选流派 Id（null=未评定）
	SchoolId?: number | null
	// 当前所选流派名
	SchoolName?: string
	// 当前所选流派图标名
	SchoolIcon?: string
	// 当前所选流派色调
	SchoolTone?: string
	// 当前所选流派是否启用（false=已停用，前端标记灰色"已停用"）
	SchoolEnabled: boolean
	// 用户可选一句话说明
	SchoolNote?: string
	// 评定时间（最近一次保存时间）
	SchoolUpdateTime?: string | null
	// 可选流派列表（仅启用项，按排序号升序）
	Options: IZdxSchoolOption[]
}

// 流派评定保存表单（SchoolId 为空=清除评定；已停用流派不可选择）
export interface IZdxProfileForm {
	// 流派 Id（空=清除评定）
	SchoolId?: number | null
	// 一句话说明（选填，≤200字）
	SchoolNote?: string
}
