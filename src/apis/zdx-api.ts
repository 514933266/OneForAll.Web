import axios from '../untils/axios'
import { useClientStore } from '../stores/clientStore'
import { IBaseMessage } from '../interfaces/IBaseMessage'
import { IBasePage } from '../interfaces/IBasePage'
import { IZdxMarketOverview } from '../interfaces/zhiduoxing/IZdxMarketOverview'
import { IZdxMarketDaily, IZdxMarketDailyForm } from '../interfaces/zhiduoxing/IZdxMarketDaily'
import { IZdxStockData, IZdxStockDataForm, IZdxStockDataQuery } from '../interfaces/zhiduoxing/IZdxStockData'
import {
	IZdxMarketKlinePoint,
	IZdxMarketQuote,
	IZdxMarketTrend,
	IZdxStockQuoteItem,
	IZdxStockQuoteQuery,
	IZdxStockMarketTab,
	IZdxSectorSummary,
	IZdxMarketNews,
	IZdxMarketLhb
} from '../interfaces/zhiduoxing/IZdxStockQuote'
import { IZdxStockKlineData, IZdxStockKlineDataForm, IZdxStockKlineDataQuery, IZdxKlineProgressStats, IZdxSyncProgress } from '../interfaces/zhiduoxing/IZdxStockKlineData'
import { IZdxSectorKlineData, IZdxSectorKlineDataForm, IZdxSectorKlineDataQuery } from '../interfaces/zhiduoxing/IZdxSectorKlineData'
import { IZdxMarketKlineData, IZdxMarketKlineDataForm, IZdxMarketKlineDataQuery } from '../interfaces/zhiduoxing/IZdxMarketKlineData'
import {
	IZdxStockDetail,
	IZdxStockTrend,
	IZdxStockKlinePoint,
	IZdxStockNews,
	IZdxStockReports,
	IZdxCompanyInfo,
	IZdxStockFinance,
	IZdxShareholderInfo,
	IZdxSectorDetail
} from '../interfaces/zhiduoxing/IZdxStockDetail'
import { IZdxTradeDay, IZdxTradeDayDefault, IZdxTradeDayForm, IZdxTradeDayHolidayForm } from '../interfaces/zhiduoxing/IZdxTradeDay'
import {
	IZdxStockNewsData,
	IZdxStockReport,
	IZdxStockCompany,
	IZdxStockFinanceData,
	IZdxStockHolder,
	IZdxStockInfoStats,
	IZdxStockNewsQuery,
	IZdxStockReportQuery
} from '../interfaces/zhiduoxing/IZdxStockInfo'
import {
	IZdxTradeRecordData,
	IZdxTradeImportResult,
	IZdxTradeRecordQuery,
	IZdxTradePosition,
	IZdxTradeDayDetail,
	IZdxTradeStats,
	IZdxProfitCalendar,
	IZdxProfitYear,
	IZdxProfitOverall,
	IZdxProfitTrend,
	IZdxTradeAudit,
	IZdxStockTradeSummary,
	IZdxTradeCycleAiResult,
	ICycleKline,
	IZdxFeeTrend,
	IZdxBehaviorStats,
	IZdxBehaviorScores,
	IZdxAssetTrend,
	IZdxProfitTrendCompare,
	IZdxBehaviorAiData,
	IZdxBehaviorEvaluateData,
	IZdxBehaviorEvalProgress,
	IZdxBehaviorTagManage,
	IZdxBehaviorTagForm,
	IZdxStyleTagManage,
	IZdxStyleTagForm,
	IZdxReviewContext,
	IZdxReview,
	IZdxReviewSaveForm,
	IZdxReviewScoreResult,
	IZdxSchoolAlignment,
	IZdxSchoolAiAdvice
} from '../interfaces/zhiduoxing/IZdxMyTrade'
import { IZdxWatchlistItem, IZdxWatchlistMigrateResult } from '../interfaces/zhiduoxing/IZdxWatchlist'
import {
	IZdxStockDrawing,
	IZdxStockDrawingSaveForm,
	IZdxStockPriceLevelSaveForm,
	IZdxStockForecast,
	IZdxStockForecastSaveForm,
	IZdxStockForecastLong,
	IZdxStockForecastLongSaveForm,
	IZdxAiPatternResult,
	IZdxAiPatternSaveForm,
	IZdxAiForecastResult,
	IZdxAiMoodResult,
	IZdxAiAnalyzeResult,
	IZdxForecastCenterItem,
	IZdxForecastCenterStats,
	IZdxLiveTargetNote,
	IZdxLiveTarget,
	IZdxLiveTargetDetail,
	IZdxTradePerformance,
	IZdxForecastVsLive,
	IZdxStrategyDiagnosis,
	IZdxExecutionConsistencyItem,
	IZdxStrategyAi
} from '../interfaces/zhiduoxing/IZdxStockReview'
import { IZdxUserStrategy, IZdxUserStrategyForm, IZdxRuleGroupCatalog, IZdxExecutionDegree } from '../interfaces/zhiduoxing/IZdxUserStrategy'
import { IZdxTechnicalIndicatorManage, IZdxTechnicalIndicatorForm } from '../interfaces/zhiduoxing/IZdxTechnicalIndicator'
import { IZdxCandlePatternManage, IZdxCandlePatternForm } from '../interfaces/zhiduoxing/IZdxCandlePattern'
import { IZdxSchoolManage, IZdxSchoolForm, IZdxMyProfile, IZdxProfileForm } from '../interfaces/zhiduoxing/IZdxSchool'
import {
	IZdxNewsStats,
	IZdxNewsQuery,
	IZdxNewsFlashData,
	IZdxNewsStockItem,
	IZdxNewsDetail,
	IZdxNewsDaily,
	INoticeHint
} from '../interfaces/zhiduoxing/IZdxNews'
import { IZdxStockEventBoard, IZdxEventSubCount, IZdxBuybackContext } from '../interfaces/zhiduoxing/IZdxStockEvent'

const useClient = useClientStore()

// 手动同步公共请求（limit 空=全量；全量同步耗时较长，timeout=0 不设请求超时）
async function postZdxSync(path: string, limit?: number): Promise<IBaseMessage> {
	const host = useClient.zdxApi
	if (!host) throw new Error('未配置智多星服务地址')
	const params: any = {}
	if (limit !== undefined && limit !== null && limit > 0) params.limit = limit
	// 后端返回 BaseMessage（拦截器已剥离 AxiosResponse，并按其 Status 统一弹出成功/失败通知）
	const res: any = await axios.post(`${host}${path}`, null, { params, timeout: 0 })
	if (res && res.Status === false) throw new Error(res.Message)
	return res
}

// 手动区间同步公共请求（begin 空=滚动同步；begin 非空=区间回补 begin~end，end 空=截至今天；后端为异步后台任务，POST 立即返回受理结果）
async function postZdxSyncRange(path: string, begin?: string, end?: string): Promise<IBaseMessage> {
	const host = useClient.zdxApi
	if (!host) throw new Error('未配置智多星服务地址')
	const params: any = {}
	if (begin) params.begin = begin
	if (end) params.end = end
	const res: any = await axios.post(`${host}${path}`, null, { params, timeout: 0 })
	if (res && res.Status === false) throw new Error(res.Message)
	return res
}

// 智多星（神策智投）
const API = {
	getHost() {
		return useClient.zdxApi ?? ''
	},
	// 获取大盘概览（成交额、涨跌家数、涨停跌停、涨跌分布；date 为指定日期 yyyy-MM-dd，为空取实时）
	async getMarketOverview(date?: string): Promise<IZdxMarketOverview> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		// axios 拦截器已剥离 AxiosResponse，此处为响应体（接口异常时后端返回 BaseMessage）
		const res: any = await axios.get(`${host}/api/ZdxMarket/Overview`, { params: { date } })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// ==================== 每日市场行情数据管理 ====================

	// 查询交易日区间的大盘行情列表（begin/end 为 yyyy-MM-dd，空=不限；按交易日期倒序）
	async getMarketDailys(begin?: string, end?: string): Promise<IZdxMarketDaily[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (begin) params.begin = begin
		if (end) params.end = end
		const res: any = await axios.get(`${host}/api/ZdxMarketDailyData`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 新增/补录每日大盘行情（记录已存在时覆盖更新；服务端记录修改人并标记人工维护）
	async addMarketDaily(data?: IZdxMarketDailyForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxMarketDailyData`, data)
	},

	// 修正每日大盘行情（服务端记录修改人并标记人工维护）
	async updateMarketDaily(tradeDate: string, data?: IZdxMarketDailyForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.put(`${host}/api/ZdxMarketDailyData/${tradeDate}`, data)
	},

	// 删除指定交易日的行情记录
	async delMarketDaily(tradeDate: string): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.delete(`${host}/api/ZdxMarketDailyData/${tradeDate}`)
	},

	// ==================== 股票基础数据管理 ====================

	// 分页查询股票基础数据（支持关键字/板块/数据来源筛选，按股票代码升序）
	async getPageStockDatas(form?: IZdxStockDataQuery, pageIndex?: number, pageSize?: number): Promise<IBasePage<IZdxStockData>> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { pageIndex: pageIndex, pageSize: pageSize }
		if (form?.Keyword) params.keyword = form.Keyword
		if (form?.MarketType !== undefined && form?.MarketType !== null) params.marketType = form.MarketType
		if (form?.DataSource !== undefined && form?.DataSource !== null) params.dataSource = form.DataSource
		if (form?.TradeStatus !== undefined && form?.TradeStatus !== null) params.tradeStatus = form.TradeStatus
		const res: any = await axios.get(`${host}/api/ZdxMarketStockData`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 新增股票基础数据（代码已存在时返回失败；服务端记录修改人并标记人工维护）
	async addStockData(data?: IZdxStockDataForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxMarketStockData`, data)
	},

	// 修正股票基础数据（代码不可修改；服务端记录修改人并标记人工维护）
	async updateStockData(id: number, data?: IZdxStockDataForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.put(`${host}/api/ZdxMarketStockData/${id}`, data)
	},

	// 删除股票数据（仅删除本地记录，同步任务再次采集到该股票时会重新入库）
	async delStockData(id: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.delete(`${host}/api/ZdxMarketStockData/${id}`)
	},

	// ==================== 市场板块与个股行情（行情页） ====================

	// 获取市场板块列表（上证/深成/创业板/科创板〔科创综指〕行情快照，读库返回；取数失败返回空数组）
	async getMarkets(): Promise<IZdxMarketQuote[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxMarket/Markets`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取市场板块分时走势（当日每分钟粒度，读库返回；无数据返回空序列）
	async getMarketTrend(code: string): Promise<IZdxMarketTrend> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxMarket/Markets/${code}/Trend`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取市场板块K线（period 周期：day/week/month；按日期升序返回最近 count 根，默认130；无数据返回空数组）
	async getMarketKlines(code: string, period: string, count?: number): Promise<IZdxMarketKlinePoint[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { period }
		if (count) params.count = count
		const res: any = await axios.get(`${host}/api/ZdxMarket/Markets/${code}/Klines`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 分页查询个股行情列表（支持市场/行业/涨跌幅/市值/涨停跌停/龙头/ST筛选，按涨跌幅降序）
	async getStocks(form?: IZdxStockQuoteQuery, pageIndex?: number, pageSize?: number): Promise<IBasePage<IZdxStockQuoteItem>> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { pageIndex: pageIndex, pageSize: pageSize }
		if (form?.Code) params.code = form.Code
		if (form?.Name) params.name = form.Name
		if (form?.Market) params.market = form.Market
		if (form?.Sector) params.sector = form.Sector
		if (form?.PercentMin !== undefined) params.percentMin = form.PercentMin
		if (form?.PercentMax !== undefined) params.percentMax = form.PercentMax
		if (form?.MarketCapMin !== undefined) params.marketCapMin = form.MarketCapMin
		if (form?.MarketCapMax !== undefined) params.marketCapMax = form.MarketCapMax
		if (form?.LimitUp) params.limitUp = true
		if (form?.LimitDown) params.limitDown = true
		if (form?.Leader) params.leader = true
		if (form?.HideST) params.hideST = true
		if (form?.HideSpecialST) params.hideSpecialST = true
		if (form?.ShowDelisted) params.showDelisted = true
		const res: any = await axios.get(`${host}/api/ZdxStocks`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取市场Tab统计（上证主板/深证主板/创业板/科创板及市场家数）
	async getStockMarkets(): Promise<IZdxStockMarketTab[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStocks/Markets`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取股票池行业列表（行业筛选下拉数据源）
	async getStockSectors(): Promise<string[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStocks/Sectors`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取行业板块摘要列表（本地快照等权聚合，按涨跌幅降序；板块涨跌幅拼图数据源）
	async getMarketSectors(): Promise<IZdxSectorSummary[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxMarket/Sectors`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取市场资讯-24小时滚动（全市场最新资讯，跨股票按发布时间倒序，含关联股票名称）
	async getMarketNewsFlash(count?: number): Promise<IZdxMarketNews[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (count) params.count = count
		const res: any = await axios.get(`${host}/api/ZdxMarket/News/Flash`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取市场资讯-要闻精华（权威媒体来源 + 标题去重 + 发布时间倒序）
	async getMarketNewsFocus(count?: number): Promise<IZdxMarketNews[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (count) params.count = count
		const res: any = await axios.get(`${host}/api/ZdxMarket/News/Focus`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取龙虎榜上榜个股列表（最新交易日，按净买额降序）
	async getMarketLhb(count?: number): Promise<IZdxMarketLhb[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (count) params.count = count
		const res: any = await axios.get(`${host}/api/ZdxMarket/Lhb`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// ==================== 个股详情页（详情/分时/K线/资讯/研报/公司/财务/股东） ====================

	// 获取个股详情（报价指标）
	async getStockDetail(code: string): Promise<IZdxStockDetail> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStocks/${code}`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取个股分时走势（date 为空=最新交易日；指定历史日期返回该日存底分时，无数据返回空序列）
	async getStockTrend(code: string, date?: string): Promise<IZdxStockTrend> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (date) params.date = date
		const res: any = await axios.get(`${host}/api/ZdxStocks/${code}/Trend`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取个股K线（period 周期：day/week/month；fqt 复权口径：qfq=前复权[默认]/none=不复权；按日期升序返回最近 count 根，默认130；无数据返回空数组）
	async getStockKlines(code: string, period: string, count?: number, fqt?: string): Promise<IZdxStockKlinePoint[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { period }
		if (count) params.count = count
		if (fqt) params.fqt = fqt
		const res: any = await axios.get(`${host}/api/ZdxStocks/${code}/Klines`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取个股资讯（最新资讯 + 公司公告）
	async getStockNews(code: string): Promise<IZdxStockNews> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStocks/${code}/News`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取个股研报（个股研报 + 行业研报）
	async getStockReports(code: string): Promise<IZdxStockReports> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStocks/${code}/Reports`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取公司资料（简介 + 基本信息）
	async getStockCompany(code: string): Promise<IZdxCompanyInfo> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStocks/${code}/Company`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取财务数据（净利润趋势 + 每股指标 + 成长能力）
	async getStockFinance(code: string): Promise<IZdxStockFinance> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStocks/${code}/Finance`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取股东信息（十大流通股东 + 股东人数趋势）
	async getStockHolders(code: string): Promise<IZdxShareholderInfo> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStocks/${code}/Holders`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取同市场个股列表（详情页同市场切换下拉数据源；返回该市场全量，按涨幅降序）
	async getStockListByMarket(market: string): Promise<IZdxStockQuoteItem[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStocks/List/${market}`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取行业行情详情（指数点位 + 涨跌家数 + 近22日走势；dataSource 走势数据源 2=东财/4=腾讯，空=优先东财回退腾讯）
	async getSectorDetail(name: string, dataSource?: number): Promise<IZdxSectorDetail> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (dataSource) params.dataSource = dataSource
		const res: any = await axios.get(`${host}/api/ZdxMarket/Sector/${encodeURIComponent(name)}`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取行业板块K线（period 周期：day/week/month；dataSource 数据源 2=东财/4=腾讯，空=优先东财回退腾讯；按日期升序返回最近 count 根，默认600；无数据返回空数组）
	async getSectorKlines(name: string, period: string, count?: number, dataSource?: number): Promise<IZdxMarketKlinePoint[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { period }
		if (count) params.count = count
		if (dataSource) params.dataSource = dataSource
		const res: any = await axios.get(`${host}/api/ZdxMarket/Sector/${encodeURIComponent(name)}/Klines`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// ==================== K线数据管理（分时K/日K/周K/月K） ====================

	// 分页查询K线数据（period 周期：minute/day/week/month；fqt 复权口径：qfq=前复权/none=不复权，分时K忽略；按交易日期倒序，分时按时间点升序）
	async getKlineDatas(period: string, fqt: string, form?: IZdxStockKlineDataQuery, pageIndex?: number, pageSize?: number): Promise<IBasePage<IZdxStockKlineData>> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { period, fqt, pageIndex, pageSize }
		if (form?.Code) params.code = form.Code
		if (form?.Begin) params.begin = form.Begin
		if (form?.End) params.end = form.End
		const res: any = await axios.get(`${host}/api/ZdxStockKlineData`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取K线同步进度统计（最近N个交易日各类K线按日覆盖股票数 + 股票池总数；days 5~30，默认10）
	async getKlineProgressStats(days?: number): Promise<IZdxKlineProgressStats> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (days) params.days = days
		const res: any = await axios.get(`${host}/api/ZdxStockKlineData/ProgressStats`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 新增/补录K线数据（记录已存在时覆盖更新；fqt 决定写入不复权主表还是前复权副本表）
	async addKlineData(period: string, data?: IZdxStockKlineDataForm, fqt?: string): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (fqt) params.fqt = fqt
		return await axios.post(`${host}/api/ZdxStockKlineData/${period}`, data, { params })
	},

	// 修正K线数据（记录不存在时返回失败；fqt 决定定位哪张表）
	async updateKlineData(period: string, data?: IZdxStockKlineDataForm, fqt?: string): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (fqt) params.fqt = fqt
		return await axios.put(`${host}/api/ZdxStockKlineData/${period}`, data, { params })
	},

	// 删除K线记录（minute 仅分时K需要；fqt 决定删除哪张表）
	async delKlineData(period: string, code: string, tradeDate: string, minute?: string, fqt?: string): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (minute) params.minute = minute
		if (fqt) params.fqt = fqt
		return await axios.delete(`${host}/api/ZdxStockKlineData/${period}/${code}/${tradeDate}`, { params })
	},

	// 清空K线数据（按查询条件批量物理删除：code/begin/end 留空=不限，全部留空=清空该表全量；period×fqt 定位表）
	async clearKlineDatas(period: string, fqt: string, form?: IZdxStockKlineDataQuery): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { period, fqt }
		if (form?.Code) params.code = form.Code
		if (form?.Begin) params.begin = form.Begin
		if (form?.End) params.end = form.End
		return await axios.delete(`${host}/api/ZdxStockKlineData/Clear`, { params })
	},

	// ==================== 板块K线数据管理（行业日K/周K/月K） ====================

	// 分页查询板块K线数据（period 周期：day/week/month；按行业名称/交易日期区间筛选；交易日期倒序）
	async getSectorKlineDatas(period: string, form?: IZdxSectorKlineDataQuery, pageIndex?: number, pageSize?: number): Promise<IBasePage<IZdxSectorKlineData>> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { period, pageIndex, pageSize }
		if (form?.Name) params.name = form.Name
		if (form?.Begin) params.begin = form.Begin
		if (form?.End) params.end = form.End
		if (form?.DataSource) params.dataSource = form.DataSource
		const res: any = await axios.get(`${host}/api/ZdxSectorKlineData`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 新增/补录板块K线数据（记录已存在时覆盖更新）
	async addSectorKlineData(period: string, data?: IZdxSectorKlineDataForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxSectorKlineData/${period}`, data)
	},

	// 修正板块K线数据（记录不存在时返回失败；主键不可修改）
	async updateSectorKlineData(period: string, data?: IZdxSectorKlineDataForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.put(`${host}/api/ZdxSectorKlineData/${period}`, data)
	},

	// 删除板块K线记录（行业名称含中文，编码后拼 URL；source 数据来源 2=东财/4=腾讯，主键组成部分）
	async delSectorKlineData(period: string, name: string, tradeDate: string, source: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.delete(`${host}/api/ZdxSectorKlineData/${period}/${encodeURIComponent(name)}/${tradeDate}/${source}`)
	},

	// 清空板块K线数据（按查询条件批量物理删除：name/begin/end 留空=不限，全部留空=清空该表全量）
	async clearSectorKlineDatas(period: string, form?: IZdxSectorKlineDataQuery): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { period }
		if (form?.Name) params.name = form.Name
		if (form?.Begin) params.begin = form.Begin
		if (form?.End) params.end = form.End
		if (form?.DataSource) params.dataSource = form.DataSource
		return await axios.delete(`${host}/api/ZdxSectorKlineData/Clear`, { params })
	},

	// ==================== 指数K线数据管理（四大指数日K/周K/月K） ====================

	// 分页查询指数K线数据（period 周期：day/week/month；按板块代码/交易日期区间筛选；交易日期倒序）
	async getMarketKlineDatas(period: string, form?: IZdxMarketKlineDataQuery, pageIndex?: number, pageSize?: number): Promise<IBasePage<IZdxMarketKlineData>> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { period, pageIndex, pageSize }
		if (form?.Code) params.code = form.Code
		if (form?.Begin) params.begin = form.Begin
		if (form?.End) params.end = form.End
		const res: any = await axios.get(`${host}/api/ZdxMarketKlineData`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 新增/补录指数K线数据（记录已存在时覆盖更新）
	async addMarketKlineData(period: string, data?: IZdxMarketKlineDataForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxMarketKlineData/${period}`, data)
	},

	// 修正指数K线数据（记录不存在时返回失败；主键不可修改）
	async updateMarketKlineData(period: string, data?: IZdxMarketKlineDataForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.put(`${host}/api/ZdxMarketKlineData/${period}`, data)
	},

	// 删除指数K线记录
	async delMarketKlineData(period: string, code: string, tradeDate: string): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.delete(`${host}/api/ZdxMarketKlineData/${period}/${code}/${tradeDate}`)
	},

	// 清空指数K线数据（按查询条件批量物理删除：code/begin/end 留空=不限，全部留空=清空该表全量）
	async clearMarketKlineDatas(period: string, form?: IZdxMarketKlineDataQuery): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { period }
		if (form?.Code) params.code = form.Code
		if (form?.Begin) params.begin = form.Begin
		if (form?.End) params.end = form.End
		return await axios.delete(`${host}/api/ZdxMarketKlineData/Clear`, { params })
	},

	// ==================== 个股信息数据管理（资讯/研报/公司/财务/股东） ====================

	// 获取五类数据统计（管理页概览：每类行数/覆盖股票数/最近数据时间 + 股票池总数）
	async getStockInfoStats(): Promise<IZdxStockInfoStats> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockInfo/Stats`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 分页查询资讯/公告（按发布时间倒序）
	async getStockInfoNews(form?: IZdxStockNewsQuery, pageIndex?: number, pageSize?: number): Promise<IBasePage<IZdxStockNewsData>> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { pageIndex, pageSize }
		if (form?.Code) params.code = form.Code
		if (form?.ItemType !== undefined && form?.ItemType !== null) params.itemType = form.ItemType
		const res: any = await axios.get(`${host}/api/ZdxStockInfo/News`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 分页查询研报（按发布日期倒序）
	async getStockInfoReports(form?: IZdxStockReportQuery, pageIndex?: number, pageSize?: number): Promise<IBasePage<IZdxStockReport>> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { pageIndex, pageSize }
		if (form?.Code) params.code = form.Code
		if (form?.ItemType !== undefined && form?.ItemType !== null) params.itemType = form.ItemType
		const res: any = await axios.get(`${host}/api/ZdxStockInfo/Reports`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 分页查询公司资料（按股票代码升序）
	async getStockInfoCompany(code?: string, pageIndex?: number, pageSize?: number): Promise<IBasePage<IZdxStockCompany>> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { pageIndex, pageSize }
		if (code) params.code = code
		const res: any = await axios.get(`${host}/api/ZdxStockInfo/Company`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 分页查询财务指标（按报告期倒序）
	async getStockInfoFinance(code?: string, pageIndex?: number, pageSize?: number): Promise<IBasePage<IZdxStockFinanceData>> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { pageIndex, pageSize }
		if (code) params.code = code
		const res: any = await axios.get(`${host}/api/ZdxStockInfo/Finance`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 分页查询十大流通股东（按报告期倒序、排名升序）
	async getStockInfoHolders(code?: string, pageIndex?: number, pageSize?: number): Promise<IBasePage<IZdxStockHolder>> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { pageIndex, pageSize }
		if (code) params.code = code
		const res: any = await axios.get(`${host}/api/ZdxStockInfo/Holders`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// ==================== 手动数据同步（首次初始化/补充/排障；全量耗时较长不设超时） ====================

	// 股票池同步（东财全市场基础信息+最新行情；limit 空=全市场）
	async syncZdxPool(limit?: number): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/Pool', limit)
	},

	// 行情快照同步（腾讯批量盘中行情；limit 空=池内全量）
	async syncZdxSnapshot(limit?: number): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/Snapshot', limit)
	},

	// 日K同步（异步后台执行：立即返回受理结果，进度经 getZdxSyncProgress 轮询；首次全量历史130根，此后增量；新股自动补齐）
	async syncZdxDaily(limit?: number): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/Daily', limit)
	},

	// 分时同步（异步后台执行：立即返回受理结果，进度经 getZdxSyncProgress 轮询；按需批量预热，日常由详情接口惰性拉取回写）
	async syncZdxMinute(limit?: number): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/Minute', limit)
	},

	// 周K同步（异步后台执行：立即返回受理结果，进度经 getZdxSyncProgress 轮询；首次全量历史130根，此后增量拉最新周；新股自动补齐）
	async syncZdxWeekly(limit?: number): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/Weekly', limit)
	},

	// 月K同步（异步后台执行：立即返回受理结果，进度经 getZdxSyncProgress 轮询；首次全量历史130根，此后增量拉最新月；新股自动补齐）
	async syncZdxMonthly(limit?: number): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/Monthly', limit)
	},

	// 查询手动同步任务进度（K线管理页轮询：2秒一次；同时反映当前是否有任务执行中与最近一次执行结果）
	async getZdxSyncProgress(): Promise<IZdxSyncProgress> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxSync/Progress`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 按代码同步（异步后台执行：立即返回受理结果，进度经 getZdxSyncProgress 轮询；定向同步单只股票指定周期/复权口径/日期区间的K线；仅补缺失日期，已存在行保持不变；日期留空=最近130根补齐）
	async syncZdxByCode(period: string, code: string, fqt: string, begin?: string, end?: string): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { period, code, fqt }
		if (begin) params.begin = begin
		if (end) params.end = end
		const res: any = await axios.post(`${host}/api/ZdxSync/ByCode`, null, { params, timeout: 0 })
		if (res && res.Status === false) throw new Error(res.Message)
		return res
	},

	// 去重同步（异步后台执行：立即返回受理结果，进度经 getZdxSyncProgress 轮询；补漏：仅对查询日期区间内无K线数据的个股执行补齐同步；日期留空=检测全表无数据的个股；已存在行保持不变）
	async syncZdxSecond(period: string, fqt: string, begin?: string, end?: string): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { period, fqt }
		if (begin) params.begin = begin
		if (end) params.end = end
		const res: any = await axios.post(`${host}/api/ZdxSync/Second`, null, { params, timeout: 0 })
		if (res && res.Status === false) throw new Error(res.Message)
		return res
	},

	// 板块行情同步（板块快照 + 当日分时每分钟粒度（含累计成交量）落库）
	async syncZdxMarket(): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/Market')
	},

	// 指数日K同步（异步后台执行：进度经 getZdxSyncProgress 轮询；日期留空=滚动同步〔首次全量历史130根，此后增量〕；填写开始日期=区间回补该区间，结束日期留空=截至今天）
	async syncZdxMarketDailyKline(begin?: string, end?: string): Promise<IBaseMessage> {
		return await postZdxSyncRange('/api/ZdxSync/MarketDailyKline', begin, end)
	},

	// 指数周K同步（异步后台执行：同上；未走完周的临时K线不落库）
	async syncZdxMarketWeeklyKline(begin?: string, end?: string): Promise<IBaseMessage> {
		return await postZdxSyncRange('/api/ZdxSync/MarketWeeklyKline', begin, end)
	},

	// 指数月K同步（异步后台执行：同上；未走完月的临时K线不落库）
	async syncZdxMarketMonthlyKline(begin?: string, end?: string): Promise<IBaseMessage> {
		return await postZdxSyncRange('/api/ZdxSync/MarketMonthlyKline', begin, end)
	},

	// 行业行情同步（东财板块口径：按股票池行业名单解析板块代码并批量拉取快照落库 zdx_sector，未匹配行业以股票池等权聚合口径兜底）
	async syncZdxSector(): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/Sector')
	},

	// 行业日K同步（异步后台执行：进度经 getZdxSyncProgress 轮询；日期留空=滚动同步〔首次全量历史130根，此后增量〕；填写开始日期=区间回补该区间，结束日期留空=截至今天）
	async syncZdxSectorDailyKline(begin?: string, end?: string): Promise<IBaseMessage> {
		return await postZdxSyncRange('/api/ZdxSync/SectorDailyKline', begin, end)
	},

	// 行业周K同步（异步后台执行：同上；未走完周的临时K线不落库）
	async syncZdxSectorWeeklyKline(begin?: string, end?: string): Promise<IBaseMessage> {
		return await postZdxSyncRange('/api/ZdxSync/SectorWeeklyKline', begin, end)
	},

	// 行业月K同步（异步后台执行：同上；未走完月的临时K线不落库）
	async syncZdxSectorMonthlyKline(begin?: string, end?: string): Promise<IBaseMessage> {
		return await postZdxSyncRange('/api/ZdxSync/SectorMonthlyKline', begin, end)
	},

	// 大盘行情同步（东财汇总 + 股票池快照涨跌分布落库，并生成当日 AI 解读）
	async syncZdxMarketDaily(): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/MarketDaily')
	},

	// 个股资讯/公告同步（东财资讯搜索+公告接口；limit 空=池内全量）
	async syncZdxInfoNews(limit?: number): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/InfoNews', limit)
	},

	// 个股研报同步（个股研报+所属行业研报；limit 空=池内全量）
	async syncZdxInfoReports(limit?: number): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/InfoReports', limit)
	},

	// 公司资料同步（F10公司概况：简介+基本信息；limit 空=池内全量）
	async syncZdxInfoCompany(limit?: number): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/InfoCompany', limit)
	},

	// 财务指标同步（按报告期落库，同报告期覆盖刷新；limit 空=池内全量）
	async syncZdxInfoFinance(limit?: number): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/InfoFinance', limit)
	},

	// 十大流通股东同步（多报告期落库，同报告期同排名覆盖刷新；limit 空=池内全量）
	async syncZdxInfoHolders(limit?: number): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/InfoHolders', limit)
	},

	// ==================== 交易日管理（概览页日期选择 + 交易日历维护页） ====================

	// 查询日期区间的交易日历列表（begin/end 为 yyyy-MM-dd，空=不限；按日期升序）
	async getTradeDays(begin?: string, end?: string): Promise<IZdxTradeDay[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (begin) params.begin = begin
		if (end) params.end = end
		const res: any = await axios.get(`${host}/api/ZdxTradeDay`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取概览默认展示日期（今日收盘后=今日；未收盘/非交易日=最近历史交易日，含未收盘标记）
	async getTradeDayDefault(): Promise<IZdxTradeDayDefault> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxTradeDay/Default`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 人工调整指定日期（标注假期/恢复交易日；仅工作日可调整；服务端记录修改人）
	async updateTradeDay(tradeDate: string, data?: IZdxTradeDayForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.put(`${host}/api/ZdxTradeDay/${tradeDate}`, data)
	},

	// 按月份区间批量生成交易日（含区间内全部周一至周五；已存在日期跳过，单次最多 24 个月）
	async generateTradeDays(begin: string, end: string): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxTradeDay/Generate`, { Begin: begin, End: end })
		if (res && res.Status === false) throw new Error(res.Message)
		return res
	},

	// 通过 DeepSeek 获取指定年月的法定休市安排并写入交易日历（比对后标记；人工调整不被覆盖）
	async syncTradeDayHolidays(data: IZdxTradeDayHolidayForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxTradeDay/Holiday`, data)
		if (res && res.Status === false) throw new Error(res.Message)
		return res
	},

	// ==================== 技术指标管理（数据中台技术指标定义维护） ====================

	// 获取技术指标定义列表（数据中台管理页；按排序号升序）
	async getTechnicalIndicatorList(): Promise<IZdxTechnicalIndicatorManage[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxTechnicalIndicator`)
		if (res.Status === false) throw new Error(res.Message)
		return res as IZdxTechnicalIndicatorManage[]
	},

	// 新增技术指标定义（编码必填且唯一）
	async addTechnicalIndicator(form: IZdxTechnicalIndicatorForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxTechnicalIndicator`, form)
	},

	// 编辑技术指标定义（编码不可修改）
	async updateTechnicalIndicator(id: number, form: IZdxTechnicalIndicatorForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.put(`${host}/api/ZdxTechnicalIndicator/${id}`, form)
	},

	// 删除技术指标定义（删除后图表可选列表不再输出该指标）
	async delTechnicalIndicator(id: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.delete(`${host}/api/ZdxTechnicalIndicator/${id}`)
	},

	// ==================== K线形态指标管理（数据中台形态指标定义维护；示意图形由K线画板图形化绘制） ====================

	// 获取形态指标定义列表（数据中台管理页；按排序号升序）
	async getCandlePatternList(): Promise<IZdxCandlePatternManage[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxCandlePattern`)
		if (res.Status === false) throw new Error(res.Message)
		return res as IZdxCandlePatternManage[]
	},

	// 新增形态指标定义（编码必填且唯一；Candles 为画板生成的 JSON 数组）
	async addCandlePattern(form: IZdxCandlePatternForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxCandlePattern`, form)
	},

	// 编辑形态指标定义（编码不可修改）
	async updateCandlePattern(id: number, form: IZdxCandlePatternForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.put(`${host}/api/ZdxCandlePattern/${id}`, form)
	},

	// 删除形态指标定义（删除后图表形态标注参考不再输出该形态）
	async delCandlePattern(id: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.delete(`${host}/api/ZdxCandlePattern/${id}`)
	},

	// ==================== 我的地盘（交易记录导入/流水/持仓/统计/收益日历 + 自选股） ====================

	// 导入交易记录 Excel（multipart/form-data 字段名 file；自动识别表头，重复行跳过）
	async importMyTrade(file: File): Promise<IZdxTradeImportResult> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const formData = new FormData()
		formData.append('file', file)
		const res: any = await axios.post(`${host}/api/ZdxMyTrade/Import`, formData)
		if (res && res.Status === false) throw new Error(res.Message)
		return res
	},

	// 分页查询交易流水（最新在前；begin/end 为 yyyy-MM-dd；category 空=不限）
	async getMyTrades(form?: IZdxTradeRecordQuery, pageIndex?: number, pageSize?: number): Promise<IBasePage<IZdxTradeRecordData>> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { pageIndex, pageSize }
		if (form?.Begin) params.begin = form.Begin
		if (form?.End) params.end = form.End
		if (form?.StockCode) params.code = form.StockCode
		if (form?.Category !== undefined && form?.Category !== null) params.category = form.Category
		if (form?.Keyword) params.keyword = form.Keyword
		const res: any = await axios.get(`${host}/api/ZdxMyTrade`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取指定股票的交易汇总（持仓+统计+交易记录；无记录返回null）
	async getMyTradeByStock(code: string): Promise<IZdxStockTradeSummary | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxMyTrade/ByStock/${code}`)
		if (!res || res.Status === false) return null
		return res
	},

	// 生成/重新生成单轮清仓轮次 AI 买卖评语（DeepSeek；耗时较长 timeout:0）
	async refreshCycleAi(cycleId: number): Promise<IZdxTradeCycleAiResult | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxTradeCycle/RefreshCycleAi`, { CycleId: cycleId }, { timeout: 0 })
		if (res && res.Status === false) throw new Error(res.Message)
		return (res ?? null) as IZdxTradeCycleAiResult | null
	},

	// 轮次迷你 K 线（展开轮次卡片时按需拉取：前复权蜡烛 + B/S 买卖点 + 上证对比基准）
	async getCycleKline(code: string, start: string, end: string): Promise<ICycleKline | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxTradeCycle/Kline/${code}`, { params: { start, end } })
		if (res && res.Status === false) throw new Error(res.Message)
		return (res ?? null) as ICycleKline | null
	},

	// 获取当前持仓列表（移动加权平均成本；现价取行情快照；按市值倒序）
	async getMyPositions(): Promise<IZdxTradePosition[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxMyTrade/Positions`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取指定日期的当日明细（目标日日终持仓浮动盈亏 + 当日卖出净盈亏逐笔 + 费用分项；收益日历日明细弹窗）
	async getMyDayDetail(date: string): Promise<IZdxTradeDayDetail> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxMyTrade/DayDetail`, { params: { date } })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取交易统计（笔数/金额/胜率/累计净盈亏 + 按股票维度汇总）
	async getMyTradeStats(): Promise<IZdxTradeStats> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxMyTrade/Stats`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 设置/清除手动校准的佣金费率（rate 小数值，万1.2=0.00012，含规费口径与券商App一致；0=清除校准恢复自动分析）
	async setMyCommissionRate(rate: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxMyTrade/CommissionRate`, { Rate: rate })
		if (res && res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取指定年月收益日历（每日卖出净盈亏聚合）
	async getProfitCalendar(year: number, month: number): Promise<IZdxProfitCalendar> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxMyTrade/ProfitCalendar`, { params: { year, month } })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取指定年份收益年历（12 个月月度盈亏/费用/红利汇总 + 年合计）
	async getProfitYear(year: number): Promise<IZdxProfitYear> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxMyTrade/ProfitYear`, { params: { year } })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取至今收益总览（全历史按年盈亏/费用/红利汇总 + 总合计；Years 按年份降序）
	async getProfitOverall(): Promise<IZdxProfitOverall> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxMyTrade/ProfitOverall`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取收益趋势（全历史按月净盈亏 + 累计曲线）
	async getProfitTrend(): Promise<IZdxProfitTrend> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxMyTrade/ProfitTrend`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取费用月度趋势（全历史按月费用支出汇总 + 分项；仅含有费用发生的月份）
	async getMyFeeTrend(): Promise<IZdxFeeTrend> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxMyTrade/FeeTrend`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取交易对账校验（逐笔推导持仓 vs 交割单股份余额）
	async getMyTradeAudit(): Promise<IZdxTradeAudit> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxMyTrade/Audit`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取交易行为画像（节奏/持仓周期/盈亏结构/仓位/成本/四象限/择时/标签；tradingDays=最近N个交易日窗口，空=全历史；range=统一时间条件）
	// range：all/history/20/60/120/250（history=今年之前，N=近 N 个自然日）；传非空时优先于 tradingDays
	async getMyBehaviorStats(tradingDays?: number, range?: string): Promise<IZdxBehaviorStats> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (tradingDays !== undefined && tradingDays !== null && tradingDays > 0) params.tradingDays = tradingDays
		if (range) params.range = range
		const res: any = await axios.get(`${host}/api/ZdxBehaviorProfile/BehaviorStats`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取交易行为得分（近1/3/6个自然月八维得分 + 月度趋势点）
	async getMyBehaviorScores(): Promise<IZdxBehaviorScores> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxBehaviorProfile/BehaviorScores`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取流派契合度分析（当前流派 vs 近期/累计实测逐维对照 + 风格漂移 + 重新评定建议）
	// range：统一时间条件（all/history/20/60/120/250；近期=所选时间线末段近 20 交易日，累计=所选时间线全量）
	async getSchoolAlignment(range?: string): Promise<IZdxSchoolAlignment> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (range) params.range = range
		const res: any = await axios.get(`${host}/api/ZdxBehaviorProfile/SchoolAlignment`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 生成流派契合 AI 深度建议（契合分解表提交 DeepSeek；实时生成不落库；耗时数秒至数十秒）
	async genSchoolAiAdvice(range?: string): Promise<IZdxSchoolAiAdvice | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (range) params.range = range
		const res: any = await axios.post(`${host}/api/ZdxBehaviorProfile/SchoolAiAdvice`, null, { params, timeout: 0 })
		if (res.Status === false) throw new Error(res.Message)
		return (res.Data ?? null) as IZdxSchoolAiAdvice | null
	},

	// 获取总资产趋势（近1年日度日终资产序列 + 区间分布 + 最新资产构成）
	async getMyAssetTrend(): Promise<IZdxAssetTrend> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxMyTrade/AssetTrend`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取收益趋势指数对比（近1年：用户收益率 vs 上证/深证/创业板/科创50）
	async getMyProfitTrendCompare(): Promise<IZdxProfitTrendCompare> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxMyTrade/ProfitTrendCompare`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取已落库的交易行为 AI 分析（画像页加载读取；无记录返回 null）
	async getMyBehaviorAi(): Promise<IZdxBehaviorAiData | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxBehaviorProfile/BehaviorAi`)
		if (res.Status === false) throw new Error(res.Message)
		return (res.Data ?? null) as IZdxBehaviorAiData | null
	},

	// 评定/重新评定交易行为画像（按步骤：组合全部分析→风格总结与八维基础数值参照落库→刷新月度评分快照→生成 AI 诊断；耗时数秒至数十秒）
	async evaluateMyBehaviorProfile(): Promise<IZdxBehaviorEvaluateData> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxBehaviorProfile/Evaluate`)
		if (res.Status === false) throw new Error(res.Message)
		return res.Data as IZdxBehaviorEvaluateData
	},

	// 获取交易行为画像评定进度（评定期间轮询展示步骤：正在执行哪方面的计算；未评定时 Running=false）
	async getMyBehaviorEvalProgress(): Promise<IZdxBehaviorEvalProgress> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxBehaviorProfile/EvaluateProgress`)
		if (res.Status === false) throw new Error(res.Message)
		return res as IZdxBehaviorEvalProgress
	},

	// 获取行为标签定义列表（后台标签管理页；按排序号升序）
	async getBehaviorTagList(): Promise<IZdxBehaviorTagManage[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxBehaviorTag`)
		if (res.Status === false) throw new Error(res.Message)
		return res as IZdxBehaviorTagManage[]
	},

	// 新增行为标签定义（触发键必填且唯一）
	async addBehaviorTag(form: IZdxBehaviorTagForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxBehaviorTag`, form)
	},

	// 编辑行为标签定义（触发键不可修改）
	async updateBehaviorTag(id: number, form: IZdxBehaviorTagForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.put(`${host}/api/ZdxBehaviorTag/${id}`, form)
	},

	// 删除行为标签定义（删除后画像页该触发键回退内置默认文案）
	async delBehaviorTag(id: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.delete(`${host}/api/ZdxBehaviorTag/${id}`)
	},

	// 获取风格标签定义列表（后台标签管理页；module=style/stock/persona，空=全部）
	async getStyleTagList(module?: string): Promise<IZdxStyleTagManage[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStyleTag`, { params: { module } })
		if (res.Status === false) throw new Error(res.Message)
		return res as IZdxStyleTagManage[]
	},

	// 新增风格标签定义（模块+层+判定键必填且唯一）
	async addStyleTag(form: IZdxStyleTagForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxStyleTag`, form)
	},

	// 编辑风格标签定义（模块/层/判定键不可修改）
	async updateStyleTag(id: number, form: IZdxStyleTagForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.put(`${host}/api/ZdxStyleTag/${id}`, form)
	},

	// 删除风格标签定义（删除后画像页该判定键回退内置默认文案）
	async delStyleTag(id: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.delete(`${host}/api/ZdxStyleTag/${id}`)
	},

	// 获取复盘上下文（区间交易记录 + 区间汇总 + 已有笔记；date 为 yyyy-MM-dd，空=今天）
	async getReviewContext(type: number, date?: string, stockCode?: string): Promise<IZdxReviewContext> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxReview/Context`, { params: { type, date, stockCode } })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取复盘笔记列表（按复盘日期倒序；供日历"已复盘"标记与个股笔记列表）
	async getReviewList(params: { type?: number; stockCode?: string; begin?: string; end?: string; max?: number }): Promise<IZdxReview[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxReview/List`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 保存复盘笔记（按归一化日期定位，存在则更新）
	async saveReview(form: IZdxReviewSaveForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxReview`, form)
	},

	// 删除复盘笔记
	async deleteReview(id: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.delete(`${host}/api/ZdxReview/${id}`)
	},

	// AI 回归验证与评分（对照复盘日后实际走势验证判断与计划兑现度；请求成功即落库）
	async scoreReview(id: number): Promise<IZdxReviewScoreResult | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxReview/Score`, { Id: id }, { timeout: 0 })
		if (res && res.Status === false) throw new Error(res.Message)
		return (res ?? null) as IZdxReviewScoreResult | null
	},

	// 获取个股画图（按 股票 + 周期；不存在返回 null）
	async getStockDrawing(stockCode: string, period: string): Promise<IZdxStockDrawing | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockReview/Drawing`, { params: { stockCode, period } })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 保存个股画图（按 股票 + 周期，存在则覆盖更新）
	async saveStockDrawing(form: IZdxStockDrawingSaveForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.put(`${host}/api/ZdxStockReview/Drawing`, form)
	},

	// 保存支撑/压力位（不复权价；null=恢复自动计算；独立接口避免与画图保存互踩）
	async saveStockPriceLevel(form: IZdxStockPriceLevelSaveForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.put(`${host}/api/ZdxStockReview/Level`, form)
	},

	// 获取个股预测列表（按创建时间倒序；含到期惰性验证）
	async getForecastList(stockCode: string, period: string = 'day'): Promise<IZdxStockForecast[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockReview/Forecasts`, { params: { stockCode, period } })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 保存个股预测（存在进行中则覆盖更新；锚点存不复权价）
	async saveForecast(form: IZdxStockForecastSaveForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxStockReview/Forecast`, form)
	},

	// 删除个股预测
	async delForecast(id: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.delete(`${host}/api/ZdxStockReview/Forecast/${id}`)
	},

	// 获取长线目标预测列表（按目标天数升序；收盘价口径自动判定）
	async getForecastLongList(stockCode: string): Promise<IZdxStockForecastLong[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockReview/ForecastLongs`, { params: { stockCode } })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 保存长线目标预测（同日数覆盖更新；起点由后端按最新日K校正；仅向上）
	async saveForecastLong(form: IZdxStockForecastLongSaveForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxStockReview/ForecastLong`, form)
	},

	// 删除长线目标预测
	async delForecastLong(id: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.delete(`${host}/api/ZdxStockReview/ForecastLong/${id}`)
	},

	// 获取复盘中心假设台账（全量所有股票，按创建时间倒序；含到期惰性验证与股票名称/持仓标记）
	async getReviewCenterList(): Promise<IZdxForecastCenterItem[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockReview/CenterList`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取复盘中心统计分析（概览/月度趋势/滚动校准/分组对比/股票排行）
	// range：统一时间条件（all/history/20/60/120/250；history=今年之前，N=近 N 个自然日）
	async getReviewCenterStats(range: string = 'all'): Promise<IZdxForecastCenterStats> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockReview/CenterStats`, { params: { range } })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取复盘中心长线目标台账（全量所有股票，按更新时间倒序；联查股票名称）
	async getReviewCenterLongList(): Promise<IZdxStockForecastLong[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockReview/CenterLongList`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取复盘中心实盘目标台账（全量：个股复盘笔记 TradeNotes 逐笔折算；按复盘日期倒序）
	async getReviewCenterLiveList(): Promise<IZdxLiveTargetNote[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockReview/CenterLiveList`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取实盘目标台账（验证视图：先折算同步 + 惰性验证，再返回全量行）
	async getLiveTargetList(): Promise<IZdxLiveTarget[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockReview/LiveTargetList`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取实盘目标详情（验证结果 + 价格轨迹：分钟优先、日K兜底、采样≤400 点）
	async getLiveTargetDetail(id: number): Promise<IZdxLiveTargetDetail | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockReview/LiveTargetDetail/${id}`)
		if (res && res.Status === false) throw new Error(res.Message)
		return (res ?? null) as IZdxLiveTargetDetail | null
	},

	// 获取交易绩效（实盘目标验证样本：核心指标/盈亏分布/盈亏单/单笔盈亏比/归因分组）
	async getTradePerformance(range: string = 'all', startDate?: string, endDate?: string): Promise<IZdxTradePerformance> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockReview/TradePerformance`, { params: { range, startDate, endDate } })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取预测 vs 实盘对比（判断力 vs 执行力：方向命中率/达标率/胜率/智能提示）
	// range：统一时间条件（all/history/20/60/120/250；假设按创建时间、实盘按卖出/买入/创建时间过滤）
	async getForecastVsLive(range?: string): Promise<IZdxForecastVsLive> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (range) params.range = range
		const res: any = await axios.get(`${host}/api/ZdxStockReview/ForecastVsLive`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取策略诊断（改进方向清单 + 今日待办 + KPI 周趋势与环比）
	async getStrategyDiagnosis(): Promise<IZdxStrategyDiagnosis> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockReview/StrategyDiagnosis`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取执行一致性列表（已判定假设 × 假设期间实盘动作逐行对照）
	// range：统一时间条件（all/history/20/60/120/250；按假设创建时间过滤）
	async getExecutionConsistency(range?: string): Promise<IZdxExecutionConsistencyItem[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (range) params.range = range
		const res: any = await axios.get(`${host}/api/ZdxStockReview/ExecutionConsistency`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取已落库的 AI 策略周报（复盘中心加载读取；无记录返回 null）
	async getStrategyAi(): Promise<IZdxStrategyAi | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockReview/StrategyAi`)
		if (res.Status === false) throw new Error(res.Message)
		return (res.Data ?? null) as IZdxStrategyAi | null
	},

	// 生成/重新生成 AI 策略周报（诊断聚合数据提交 DeepSeek；落库覆盖；耗时数秒至数十秒）
	async genStrategyAi(): Promise<IZdxStrategyAi | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxStockReview/StrategyAi`, null, { timeout: 0 })
		if (res.Status === false) throw new Error(res.Message)
		return (res.Data ?? null) as IZdxStrategyAi | null
	},

	// ==================== 用户交易策略（交易策略页：人工录入 + 按流派周期分级验证 + 大验证 AI 归因） ====================

	// 获取策略列表（含验证点时间线与节奏字段；进行中策略服务端会惰性补齐已完整结束的验证期）
	// status：状态过滤（1=进行中 2=已结束；0/不传=全部）
	async getUserStrategyList(status?: number): Promise<IZdxUserStrategy[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (status) params.status = status
		const res: any = await axios.get(`${host}/api/ZdxUserStrategy`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return (res ?? []) as IZdxUserStrategy[]
	},

	// 获取策略详情（列表口径 + 按小验证周期分桶的走势序列）
	async getUserStrategyDetail(id: number): Promise<IZdxUserStrategy | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxUserStrategy/Detail/${id}`)
		if (res.Status === false) throw new Error(res.Message)
		return (res.Data ?? null) as IZdxUserStrategy | null
	},

	// 保存策略（新建：周期不传则按当前流派快照并即算基线期指标；编辑：仅名称/正文/关联规则生效）
	async saveUserStrategy(form: IZdxUserStrategyForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxUserStrategy/Save`, form)
	},

	// 结束策略（补齐截至今天的验证点后冻结，历史判定不再重算）
	async finishUserStrategy(id: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxUserStrategy/Finish/${id}`)
	},

	// 删除策略（级联删除其验证点）
	async delUserStrategy(id: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.delete(`${host}/api/ZdxUserStrategy/${id}`)
	},

	// 生成指定大验证点的 AI 归因评语（本期 vs 基线期 vs 上一大周期；已存在则覆盖；耗时数秒至数十秒）
	async genStrategyVerifyAi(strategyId: number, verifyNo: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxUserStrategy/VerifyAi`, null, { params: { strategyId, verifyNo }, timeout: 0 })
	},

	// 获取五子策略规则目录（选股/择时/仓位/止盈/止损静态模板；裸列表，供编辑器渲染）
	async getStrategyRuleCatalog(): Promise<IZdxRuleGroupCatalog[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxUserStrategy/RuleCatalog`)
		if (res && res.Status === false) throw new Error(res.Message)
		return (res ?? []) as IZdxRuleGroupCatalog[]
	},

	// 获取策略执行度（只读现算：逐笔对照已启用且可自动评估的五子策略规则）
	async getStrategyExecutionDegree(id: number): Promise<IZdxExecutionDegree | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxUserStrategy/ExecutionDegree/${id}`)
		if (res.Status === false) throw new Error(res.Message)
		return (res.Data ?? null) as IZdxExecutionDegree | null
	},

	// AI 识别近 20 个交易日 K 线形态（对照形态知识库；结果落库保存并返回完整列表）
	async aiReviewPattern(stockCode: string, date?: string): Promise<IZdxAiPatternResult | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxStockReview/AiPattern`, { StockCode: stockCode, Date: date }, { timeout: 0 })
		if (res && res.Status === false) throw new Error(res.Message)
		return (res ?? null) as IZdxAiPatternResult | null
	},

	// 获取已落库的形态列表（不做识别，仅读库）
	async getAiPatternList(stockCode: string, date?: string): Promise<IZdxAiPatternResult | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockReview/PatternList`, { params: { stockCode, date } })
		if (res && res.Status === false) throw new Error(res.Message)
		return (res ?? null) as IZdxAiPatternResult | null
	},

	// 人工保存形态（编辑后来源标记为人工修正）
	async saveAiPatternItem(form: IZdxAiPatternSaveForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxStockReview/Pattern`, form)
	},

	// 删除形态
	async delAiPatternItem(id: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.delete(`${host}/api/ZdxStockReview/Pattern/${id}`)
	},

	// AI 生成未来 1~5 个交易日走势预测锚点（不入库；确认后走保存预测接口落库；days 空=5）
	async aiReviewForecast(stockCode: string, days?: number): Promise<IZdxAiForecastResult | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxStockReview/AiForecast`, { StockCode: stockCode, Days: days }, { timeout: 0 })
		if (res && res.Status === false) throw new Error(res.Message)
		return (res ?? null) as IZdxAiForecastResult | null
	},

	// AI 情绪分析（标签建议 + 总结；支持人工修正后随复盘笔记保存）
	async aiReviewMood(form: {
		StockCode: string
		Date?: string
		TechnicalText?: string
		NewsText?: string
		CandidateTags?: string[]
	}): Promise<IZdxAiMoodResult | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxStockReview/AiMood`, form, { timeout: 0 })
		if (res && res.Status === false) throw new Error(res.Message)
		return (res ?? null) as IZdxAiMoodResult | null
	},

	// AI 综合分析（近 20 日K线一次性生成技术面/情绪面/复盘笔记/后续计划四段复盘初稿；不入库）
	async aiReviewAnalyze(form: {
		StockCode: string
		Date?: string
		CandidateTags?: string[]
	}): Promise<IZdxAiAnalyzeResult | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxStockReview/AiAnalyze`, form, { timeout: 0 })
		if (res && res.Status === false) throw new Error(res.Message)
		return (res ?? null) as IZdxAiAnalyzeResult | null
	},

	// 获取自选股列表（含行情快照，按排序号升序）
	async getWatchlist(): Promise<IZdxWatchlistItem[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxWatchlist`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 添加自选（股票池未收录返回失败；已存在幂等成功）
	async addWatchlist(code: string): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxWatchlist/${code}`)
	},

	// 移除自选
	async delWatchlist(code: string): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.delete(`${host}/api/ZdxWatchlist/${code}`)
	},

	// 迁移本地自选（localStorage 旧数据一次性同步；返回总数/成功/跳过）
	async migrateWatchlist(codes: string[]): Promise<IZdxWatchlistMigrateResult> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxWatchlist/Migrate`, codes)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取流派定义列表（后台流派管理页；按排序号升序，含停用）
	async getSchoolList(): Promise<IZdxSchoolManage[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxSchool`)
		if (res.Status === false) throw new Error(res.Message)
		return res as IZdxSchoolManage[]
	},

	// 新增流派定义（名称必填且唯一；评分参数需通过校验：9 项须全填或全空）
	async addSchool(form: IZdxSchoolForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.post(`${host}/api/ZdxSchool`, form)
	},

	// 编辑流派定义（名称可改，重名将被拒绝；评分参数需通过校验）
	async updateSchool(id: number, form: IZdxSchoolForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.put(`${host}/api/ZdxSchool/${id}`, form)
	},

	// 删除流派定义（被用户引用的流派会被拒绝，请改用停用）
	async delSchool(id: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.delete(`${host}/api/ZdxSchool/${id}`)
	},

	// 获取我的档案（当前所选流派 + 启用选项列表；未评定返回空档案 + 选项）
	async getMyProfile(): Promise<IZdxMyProfile> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxUserProfile/my`)
		if (res.Status === false) throw new Error(res.Message)
		return res as IZdxMyProfile
	},

	// 保存我的流派评定（SchoolId 为空=清除评定；已停用流派不可选择）
	async saveMySchool(form: IZdxProfileForm): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		return await axios.put(`${host}/api/ZdxUserProfile/my/school`, form)
	},

	// ==================== 资讯（消息面）页面 ====================

	// 获取消息面统计（顶部统计卡：今日快讯/个股资讯/政策/公告/资讯/高影响/待分析条数）
	async getZdxNewsStats(): Promise<IZdxNewsStats> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxNews/Stats`)
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 分页查询全局快讯（按发布时间倒序；AI 分类徽标内联返回，未分析为空）
	async getZdxNewsFlash(form?: IZdxNewsQuery, pageIndex?: number, pageSize?: number): Promise<IBasePage<IZdxNewsFlashData>> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { pageIndex, pageSize }
		if (form?.Category !== undefined && form?.Category !== null) params.category = form.Category
		if (form?.SubCategory !== undefined && form?.SubCategory !== null) params.subCategory = form.SubCategory
		if (form?.Direction !== undefined && form?.Direction !== null) params.direction = form.Direction
		if (form?.Strength !== undefined && form?.Strength !== null) params.strength = form.Strength
		if (form?.DataSource !== undefined && form?.DataSource !== null) params.dataSource = form.DataSource
		if (form?.Key) params.key = form.Key
		if (form?.Begin) params.begin = form.Begin
		if (form?.End) params.end = form.End
		const res: any = await axios.get(`${host}/api/ZdxNews/Flash`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 分页查询个股资讯/公告（itemType 1资讯 2公告，空=不限；按发布时间倒序；AI 分类徽标内联返回）
	async getZdxNewsStockNews(form?: IZdxNewsQuery, itemType?: number, pageIndex?: number, pageSize?: number): Promise<IBasePage<IZdxNewsStockItem>> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = { pageIndex, pageSize }
		if (form?.StockCode) params.stockCode = form.StockCode
		if (itemType !== undefined && itemType !== null) params.itemType = itemType
		if (form?.Category !== undefined && form?.Category !== null) params.category = form.Category
		if (form?.SubCategory !== undefined && form?.SubCategory !== null) params.subCategory = form.SubCategory
		if (form?.Direction !== undefined && form?.Direction !== null) params.direction = form.Direction
		if (form?.Strength !== undefined && form?.Strength !== null) params.strength = form.Strength
		if (form?.DataSource !== undefined && form?.DataSource !== null) params.dataSource = form.DataSource
		if (form?.Key) params.key = form.Key
		if (form?.Begin) params.begin = form.Begin
		if (form?.End) params.end = form.End
		const res: any = await axios.get(`${host}/api/ZdxNews/StockNews`, { params })
		if (res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取消息详情聚合（消息本体+AI分析+影响面明细；消息不存在返回 null）
	async getZdxNewsDetail(newsKind: number, newsId: number): Promise<IZdxNewsDetail | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxNews/Detail`, { params: { newsKind, newsId } })
		if (res && res.Status === false) throw new Error(res.Message)
		return (res ?? null) as IZdxNewsDetail | null
	},

	// 获取指定日期的消息面日报（不存在返回 null）
	async getZdxNewsDailyReport(date?: string): Promise<IZdxNewsDaily | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (date) params.date = date
		const res: any = await axios.get(`${host}/api/ZdxNews/DailyReport`, { params })
		if (res && res.Status === false) throw new Error(res.Message)
		return (res ?? null) as IZdxNewsDaily | null
	},

	// 单条消息 AI 分析（分类+摘要；国家政策/高强度消息自动追加影响面分析；耗时数秒至数十秒）
	async analyzeZdxNews(newsKind: number, newsId: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxNews/Analyze`, null, { params: { newsKind, newsId }, timeout: 0 })
		if (res && res.Status === false) throw new Error(res.Message)
		return res
	},

	// 单条消息影响面分析（AI 输出受影响板块+个股；重跑整批替换；耗时数秒至数十秒）
	async analyzeZdxNewsImpact(newsKind: number, newsId: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxNews/AnalyzeImpact`, null, { params: { newsKind, newsId }, timeout: 0 })
		if (res && res.Status === false) throw new Error(res.Message)
		return res
	},

	// 人工修正分类（覆盖写入并标记人工修正，批量 AI 分类跳过该消息）
	async classifyZdxNews(newsKind: number, newsId: number, category: number, subCategory: number, direction: number, strength: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxNews/Classify`, null, {
			params: { newsKind, newsId, category, subCategory, direction, strength },
			timeout: 0
		})
		if (res && res.Status === false) throw new Error(res.Message)
		return res
	},

	// 全局快讯同步（腾讯指数新闻流优先→东财 7x24 快讯兜底→去重落库；日常每30分钟由定时任务触发）
	async syncZdxInfoFlash(): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/InfoFlash')
	},

	// 消息批量 AI 分类（未分类消息限量处理+限速；国家政策/高强度消息自动追加影响面分析；maxCount 空=50）
	async syncZdxNewsClassify(maxCount?: number): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/NewsClassify', maxCount)
	},

	// 消息面日报生成（当日政策/公告/资讯三段式 AI 总结并落库；date 空=今天；耗时数秒至数十秒）
	async syncZdxNewsDailyReport(date?: string): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (date) params.date = date
		const res: any = await axios.post(`${host}/api/ZdxSync/NewsDailyReport`, null, { params, timeout: 0 })
		if (res && res.Status === false) throw new Error(res.Message)
		return res
	},

	// 公告历史回溯（东财大页拉取近 200 条/只入库存补齐统计样本；limit 空=池内全量；幂等重跑，新公告由 AI 分类与事件转写任务接力）
	async syncZdxStockEventBackfill(limit?: number): Promise<IBaseMessage> {
		return await postZdxSync('/api/ZdxSync/StockEventBackfill', limit)
	},

	// 公告关键事件转写（扫描已分类关键公告建事件行+DeepSeek 提取核心数值实体；maxCount 空=100；日常由 StockEventJob 触发，本入口限量补跑）
	async syncZdxStockEventBuild(maxCount?: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const params: any = {}
		if (maxCount !== undefined && maxCount !== null && maxCount > 0) params.maxCount = maxCount
		// 逐条 DeepSeek 提取耗时较长，不设请求超时
		const res: any = await axios.post(`${host}/api/ZdxSync/StockEventBuild`, null, { params, timeout: 0 })
		if (res && res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取事件驱动全景看板（股×事件子类：T+5/20/60 胜率/绝对/超额统计 + 规则建议 + 时间轴事件 + 缓存洞察；首次查询惰性补齐 T+N 略慢）
	async getZdxStockEventBoard(code: string, sub: number): Promise<IZdxStockEventBoard> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockEvents/Board/${code}/${sub}`, { timeout: 0 })
		if (res && res.Status === false) throw new Error(res.Message)
		return res
	},

	// 生成/重新生成 AI 深度洞察（看板统计+事件明细喂 DeepSeek，结果覆盖缓存表；耗时数秒至数十秒）
	async generateZdxStockEventInsight(code: string, sub: number): Promise<IBaseMessage> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.post(`${host}/api/ZdxStockEvents/Insight`, null, { params: { code, sub }, timeout: 0 })
		if (res && res.Status === false) throw new Error(res.Message)
		return res
	},

	// 获取某股各子类事件计数（一次 GROUP BY；chips 区火苗高发角标与默认子类选择用）
	async getZdxStockEventSubCounts(code: string): Promise<IZdxEventSubCount[]> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockEvents/SubCounts/${code}`)
		if (res && res.Status === false) throw new Error(res.Message)
		return res ?? []
	},

	// 获取个股分红上下文（分红送转子类看板用：本股分红走势 + 最新每10股派息在同行业股票池中的位置/中位数）
	async getZdxStockEventDividend(code: string): Promise<any> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockEvents/Dividend/${code}`)
		if (res && res.Status === false) throw new Error(res.Message)
		return res ?? null
	},

	// 获取个股回购上下文（回购子类看板用：历史回购方案点位与未完成方案识别）
	async getZdxStockEventBuyback(code: string): Promise<IZdxBuybackContext | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxStockEvents/Buyback/${code}`)
		if (res && res.Status === false) throw new Error(res.Message)
		return res ?? null
	},

	// 个股近期公告提示（近 7 天公告数 + 回购进行中；公告 tab 徒标与顶栏 chip 展示用）
	async getZdxNoticeHint(code: string): Promise<INoticeHint | null> {
		const host = useClient.zdxApi
		if (!host) throw new Error('未配置智多星服务地址')
		const res: any = await axios.get(`${host}/api/ZdxNews/NoticeHint/${code}`)
		if (res && res.Status === false) throw new Error(res.Message)
		return res ?? null
	}
}

export default API
