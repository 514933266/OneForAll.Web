// 智多星模块：公共常量与静态模拟工具
import { dayjs } from 'element-plus'
import { IZdxTradeRecordData } from '@/interfaces/zhiduoxing/IZdxMyTrade'

// ---------- 类型定义 ----------
export interface IStock {
	Code: string
	Name: string
	Sector: string
	Market: string
	Price: number
	ChangePercent: number
	ChangeAmount: number
	Volume: number
	Amount: number
	Amplitude: number
	IsLimitUp?: boolean
	IsLimitDown?: boolean
	IsLeader?: boolean
	IsST?: boolean
	IsSpecialST?: boolean
}

// 详情扩展字段
export interface IStockDetail extends IStock {
	Open: number
	High: number
	Low: number
	PrevClose: number
	LimitUp: number
	LimitDown: number
	Turnover: number
	VolumeRatio: number
	TotalShares: number
	FreeFloat: number
	IssuedShares: number
	MarketCap: number
	PE: number
	PB: number
	EPS: number
	BPS: number
	AvgPrice: number
	MainInflow: number
	MainOutflow: number
}

// ---------- 市场分类 ----------
export const MARKETS = [
	{ Key: 'shMain', Label: '上证主板', Count: 1190 },
	{ Key: 'szMain', Label: '深证主板', Count: 530 },
	{ Key: 'cyb', Label: '创业板', Count: 1403 },
	{ Key: 'kcb', Label: '科创板', Count: 587 }
]

// ---------- 行业板块 ----------
export const SECTORS = [
	'白酒',
	'证券',
	'银行',
	'保险',
	'食品饮料',
	'光伏设备',
	'房地产',
	'汽车整车',
	'半导体',
	'医疗器械',
	'医疗服务',
	'软件开发',
	'电池',
	'生物制品',
	'养殖业',
	'家电',
	'光学光电子',
	'消费电子',
	'工程机械',
	'化工原料'
]

// ---------- 静态模拟股票数据 ----------
export const STOCKS: IStock[] = [
	// 上证主板
	{ Code: '600519', Name: '贵州茅台', Sector: '白酒', Market: 'shMain', Price: 1688.5, ChangePercent: 1.28, ChangeAmount: 21.32, Volume: 2.68, Amount: 45.2, Amplitude: 2.15, IsLeader: true },
	{ Code: '601318', Name: '中国平安', Sector: '保险', Market: 'shMain', Price: 52.36, ChangePercent: -0.42, ChangeAmount: -0.22, Volume: 18.5, Amount: 96.8, Amplitude: 1.23 },
	{ Code: '600036', Name: '招商银行', Sector: '银行', Market: 'shMain', Price: 36.85, ChangePercent: 0.82, ChangeAmount: 0.3, Volume: 15.2, Amount: 56.1, Amplitude: 1.05 },
	{ Code: '600030', Name: '中信证券', Sector: '证券', Market: 'shMain', Price: 26.74, ChangePercent: 10.01, ChangeAmount: 2.43, Volume: 45.8, Amount: 121.5, Amplitude: 9.87, IsLimitUp: true },
	{ Code: '600887', Name: '伊利股份', Sector: '食品饮料', Market: 'shMain', Price: 28.15, ChangePercent: -0.53, ChangeAmount: -0.15, Volume: 12.3, Amount: 34.7, Amplitude: 1.62 },
	{ Code: '603288', Name: '海天味业', Sector: '食品饮料', Market: 'shMain', Price: 42.3, ChangePercent: 1.15, ChangeAmount: 0.48, Volume: 3.6, Amount: 15.2, Amplitude: 1.98 },
	{ Code: '600031', Name: '三一重工', Sector: '工程机械', Market: 'shMain', Price: 16.82, ChangePercent: -1.12, ChangeAmount: -0.19, Volume: 20.4, Amount: 34.5, Amplitude: 2.34 },
	{ Code: '600276', Name: '恒瑞医药', Sector: '化学制药', Market: 'shMain', Price: 46.2, ChangePercent: 2.35, ChangeAmount: 1.06, Volume: 8.9, Amount: 41, Amplitude: 3.12 },
	{ Code: '601211', Name: '国泰君安', Sector: '证券', Market: 'shMain', Price: 15.3, ChangePercent: 0.66, ChangeAmount: 0.1, Volume: 22.1, Amount: 33.8, Amplitude: 1.45 },
	{ Code: '601888', Name: '中国中免', Sector: '旅游零售', Market: 'shMain', Price: 68.45, ChangePercent: -2.05, ChangeAmount: -1.43, Volume: 7.2, Amount: 49.5, Amplitude: 2.89 },
	{ Code: '601012', Name: '隆基绿能', Sector: '光伏设备', Market: 'shMain', Price: 17.62, ChangePercent: 3.16, ChangeAmount: 0.54, Volume: 28.6, Amount: 50.2, Amplitude: 4.32 },
	{ Code: '600438', Name: '通威股份', Sector: '光伏设备', Market: 'shMain', Price: 21.15, ChangePercent: 1.93, ChangeAmount: 0.4, Volume: 16.8, Amount: 35.6, Amplitude: 2.76 },
	{ Code: '600048', Name: '保利发展', Sector: '房地产', Market: 'shMain', Price: 8.62, ChangePercent: -0.92, ChangeAmount: -0.08, Volume: 26.4, Amount: 22.8, Amplitude: 1.87 },
	{ Code: '601899', Name: '紫金矿业', Sector: '有色金属', Market: 'shMain', Price: 18.05, ChangePercent: 2.85, ChangeAmount: 0.5, Volume: 42.3, Amount: 76.2, Amplitude: 3.45 },
	{ Code: '601668', Name: '中国建筑', Sector: '建筑装饰', Market: 'shMain', Price: 5.68, ChangePercent: -0.35, ChangeAmount: -0.02, Volume: 35.2, Amount: 20, Amplitude: 0.88 },
	{ Code: '600900', Name: '长江电力', Sector: '电力', Market: 'shMain', Price: 28.45, ChangePercent: 0.18, ChangeAmount: 0.05, Volume: 9.8, Amount: 27.9, Amplitude: 0.52 },
	{ Code: '600104', Name: '上汽集团', Sector: '汽车整车', Market: 'shMain', Price: 14.92, ChangePercent: -0.73, ChangeAmount: -0.11, Volume: 11.5, Amount: 17.2, Amplitude: 1.35 },
	{ Code: '600436', Name: '片仔癀', Sector: '中药', Market: 'shMain', Price: 218.3, ChangePercent: 0.55, ChangeAmount: 1.2, Volume: 0.9, Amount: 19.6, Amplitude: 1.1 },
	{ Code: '600319', Name: 'ST亚星', Sector: '化工原料', Market: 'shMain', Price: 4.98, ChangePercent: -4.97, ChangeAmount: -0.26, Volume: 8.6, Amount: 4.3, Amplitude: 2.15, IsST: true, IsLimitDown: true },
	// 深证主板
	{ Code: '000858', Name: '五粮液', Sector: '白酒', Market: 'szMain', Price: 142.8, ChangePercent: 0.96, ChangeAmount: 1.36, Volume: 5.2, Amount: 74.3, Amplitude: 1.72 },
	{ Code: '000002', Name: '万科A', Sector: '房地产', Market: 'szMain', Price: 6.85, ChangePercent: -1.15, ChangeAmount: -0.08, Volume: 30.1, Amount: 20.6, Amplitude: 2.05 },
	{ Code: '000725', Name: '京东方A', Sector: '光学光电子', Market: 'szMain', Price: 4.12, ChangePercent: 2.23, ChangeAmount: 0.09, Volume: 98.6, Amount: 40.6, Amplitude: 3.48 },
	{ Code: '000100', Name: 'TCL科技', Sector: '光学光电子', Market: 'szMain', Price: 4.85, ChangePercent: 10.02, ChangeAmount: 0.44, Volume: 86.4, Amount: 41.9, Amplitude: 9.35, IsLimitUp: true },
	{ Code: '000333', Name: '美的集团', Sector: '家电', Market: 'szMain', Price: 72.35, ChangePercent: 0.68, ChangeAmount: 0.49, Volume: 7.8, Amount: 56.4, Amplitude: 1.28 },
	{ Code: '000651', Name: '格力电器', Sector: '家电', Market: 'szMain', Price: 41.2, ChangePercent: -0.48, ChangeAmount: -0.2, Volume: 10.2, Amount: 42.1, Amplitude: 1.15 },
	{ Code: '000001', Name: '平安银行', Sector: '银行', Market: 'szMain', Price: 11.64, ChangePercent: -0.17, ChangeAmount: -0.02, Volume: 97.4, Amount: 11.31, Amplitude: 1.37 },
	{ Code: '002594', Name: '比亚迪', Sector: '汽车整车', Market: 'szMain', Price: 245.6, ChangePercent: 1.85, ChangeAmount: 4.46, Volume: 12.4, Amount: 304.5, Amplitude: 2.56, IsLeader: true },
	{ Code: '002415', Name: '海康威视', Sector: '计算机设备', Market: 'szMain', Price: 30.15, ChangePercent: -0.89, ChangeAmount: -0.27, Volume: 11.2, Amount: 33.8, Amplitude: 1.76 },
	{ Code: '002475', Name: '立讯精密', Sector: '消费电子', Market: 'szMain', Price: 34.5, ChangePercent: 2.37, ChangeAmount: 0.8, Volume: 18.6, Amount: 64.2, Amplitude: 3.15 },
	{ Code: '002714', Name: '牧原股份', Sector: '养殖业', Market: 'szMain', Price: 42.8, ChangePercent: -1.06, ChangeAmount: -0.46, Volume: 9.5, Amount: 40.7, Amplitude: 1.98 },
	{ Code: '000877', Name: '*ST天山', Sector: '农业种植', Market: 'szMain', Price: 3.42, ChangePercent: -5.0, ChangeAmount: -0.18, Volume: 4.8, Amount: 1.6, Amplitude: 2.36, IsSpecialST: true, IsLimitDown: true },
	// 创业板
	{ Code: '300750', Name: '宁德时代', Sector: '电池', Market: 'cyb', Price: 198.5, ChangePercent: 3.42, ChangeAmount: 6.57, Volume: 15.6, Amount: 309.8, Amplitude: 4.25, IsLeader: true },
	{ Code: '300059', Name: '东方财富', Sector: '证券', Market: 'cyb', Price: 21.35, ChangePercent: 1.18, ChangeAmount: 0.25, Volume: 42.8, Amount: 91.4, Amplitude: 2.86 },
	{ Code: '300760', Name: '迈瑞医疗', Sector: '医疗器械', Market: 'cyb', Price: 268.2, ChangePercent: 0.86, ChangeAmount: 2.29, Volume: 2.1, Amount: 56.3, Amplitude: 1.52 },
	{ Code: '300015', Name: '爱尔眼科', Sector: '医疗服务', Market: 'cyb', Price: 13.85, ChangePercent: -0.72, ChangeAmount: -0.1, Volume: 25.6, Amount: 35.5, Amplitude: 2.05 },
	{ Code: '300014', Name: '亿纬锂能', Sector: '电池', Market: 'cyb', Price: 46.3, ChangePercent: 2.03, ChangeAmount: 0.92, Volume: 10.8, Amount: 50, Amplitude: 3.28 },
	{ Code: '300124', Name: '汇川技术', Sector: '自动化设备', Market: 'cyb', Price: 62.15, ChangePercent: 1.45, ChangeAmount: 0.89, Volume: 4.2, Amount: 26.1, Amplitude: 2.16 },
	{ Code: '300274', Name: '阳光电源', Sector: '光伏设备', Market: 'cyb', Price: 72.8, ChangePercent: 20.0, ChangeAmount: 12.13, Volume: 22.4, Amount: 163.2, Amplitude: 19.86, IsLimitUp: true },
	{ Code: '300498', Name: '温氏股份', Sector: '养殖业', Market: 'cyb', Price: 18.25, ChangePercent: -0.49, ChangeAmount: -0.09, Volume: 8.9, Amount: 16.2, Amplitude: 1.34 },
	{ Code: '300122', Name: '智飞生物', Sector: '生物制品', Market: 'cyb', Price: 24.6, ChangePercent: -1.83, ChangeAmount: -0.46, Volume: 12.6, Amount: 31, Amplitude: 3.05 },
	{ Code: '300142', Name: '沃森生物', Sector: '生物制品', Market: 'cyb', Price: 12.35, ChangePercent: -20.01, ChangeAmount: -3.09, Volume: 28.4, Amount: 35.1, Amplitude: 19.42, IsLimitDown: true },
	// 科创板
	{ Code: '688981', Name: '中芯国际', Sector: '半导体', Market: 'kcb', Price: 88.2, ChangePercent: 1.52, ChangeAmount: 1.32, Volume: 16.8, Amount: 148.2, Amplitude: 2.85, IsLeader: true },
	{ Code: '688111', Name: '金山办公', Sector: '软件开发', Market: 'kcb', Price: 245.3, ChangePercent: 0.78, ChangeAmount: 1.9, Volume: 1.6, Amount: 39.2, Amplitude: 1.45 },
	{ Code: '688008', Name: '澜起科技', Sector: '半导体', Market: 'kcb', Price: 68.75, ChangePercent: 2.45, ChangeAmount: 1.64, Volume: 3.9, Amount: 26.8, Amplitude: 3.62 },
	{ Code: '688012', Name: '中微公司', Sector: '半导体', Market: 'kcb', Price: 128.4, ChangePercent: -0.65, ChangeAmount: -0.84, Volume: 2.3, Amount: 29.5, Amplitude: 2.08 },
	{ Code: '688393', Name: '安必平', Sector: '医疗器械', Market: 'kcb', Price: 25.6, ChangePercent: 20.02, ChangeAmount: 4.27, Volume: 2.68, Amount: 7.55, Amplitude: 15.23, IsLimitUp: true },
	{ Code: '688435', Name: '达梦数据', Sector: '软件开发', Market: 'kcb', Price: 51.16, ChangePercent: 20.01, ChangeAmount: 8.53, Volume: 10.64, Amount: 5.03, Amplitude: 19.14, IsLimitUp: true },
	{ Code: '688315', Name: '诺禾致源', Sector: '医疗服务', Market: 'kcb', Price: 17.1, ChangePercent: 20.0, ChangeAmount: 2.85, Volume: 17.07, Amount: 2.72, Amplitude: 20.07, IsLimitUp: true },
	{ Code: '688041', Name: '海光信息', Sector: '半导体', Market: 'kcb', Price: 118.5, ChangePercent: 1.85, ChangeAmount: 2.15, Volume: 5.2, Amount: 61.6, Amplitude: 3.25 },
	{ Code: '688256', Name: '寒武纪', Sector: '半导体', Market: 'kcb', Price: 235.6, ChangePercent: -2.35, ChangeAmount: -5.67, Volume: 8.4, Amount: 198.2, Amplitude: 4.86 },
	{ Code: '688126', Name: '沪硅产业', Sector: '半导体', Market: 'kcb', Price: 15.8, ChangePercent: 3.27, ChangeAmount: 0.5, Volume: 9.6, Amount: 15.2, Amplitude: 5.12 }
]

// ---------- 查询 ----------
// 按代码查询股票
export function findStockByCode(code: string): IStock | undefined {
	return STOCKS.find(s => s.Code === code)
}

// 按市场查询股票
export function findStocksByMarket(market: string): IStock[] {
	return STOCKS.filter(s => s.Market === market)
}

// 确定性哈希
function hashCode(str: string) {
	let h = 0
	for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 997
	return h
}

// 生成详情扩展字段（静态推导，保证确定性）
export function buildDetail(stock: IStock): IStockDetail {
	const h = hashCode(stock.Code)
	const prevClose = +(stock.Price - stock.ChangeAmount).toFixed(2)
	const limitRatio = stock.IsST || stock.IsSpecialST ? 0.05 : stock.Market === 'cyb' || stock.Market === 'kcb' ? 0.2 : 0.1
	const amplitude = stock.Amplitude / 100
	const open = +(prevClose * (1 + (stock.ChangePercent >= 0 ? 0.004 : -0.004))).toFixed(2)
	const high = +(Math.max(stock.Price, open) * (1 + amplitude * 0.6)).toFixed(2)
	const low = +(Math.min(stock.Price, open) * (1 - amplitude * 0.4)).toFixed(2)
	const totalShares = 5 + (h % 400)
	const freeFloat = +(totalShares * (0.6 + (h % 30) / 100)).toFixed(1)
	const marketCap = +(stock.Price * totalShares).toFixed(0)
	const pe = 8 + (h % 40)
	const pb = +(0.5 + (h % 30) / 10).toFixed(2)
	return {
		...stock,
		Open: open,
		High: high,
		Low: low,
		PrevClose: prevClose,
		LimitUp: +(prevClose * (1 + limitRatio)).toFixed(2),
		LimitDown: +(prevClose * (1 - limitRatio)).toFixed(2),
		Turnover: +(0.2 + (h % 80) / 10).toFixed(2),
		VolumeRatio: +(0.5 + (h % 20) / 10).toFixed(2),
		TotalShares: totalShares,
		FreeFloat: freeFloat,
		IssuedShares: 20 + (h % 100),
		MarketCap: marketCap,
		PE: pe,
		PB: pb,
		EPS: +(stock.Price / pe).toFixed(3),
		BPS: +(stock.Price / pb).toFixed(2),
		AvgPrice: +((stock.Price + open) / 2).toFixed(2),
		MainInflow: +(stock.Amount * (0.3 + (h % 40) / 100)).toFixed(3),
		MainOutflow: +(stock.Amount * (0.35 + ((h + 7) % 40) / 100)).toFixed(3)
	}
}

// ---------- 格式化 ----------
export function formatPercent(value: number) {
	return (value > 0 ? '+' : '') + value.toFixed(2) + '%'
}
export function formatAmount(value: number) {
	return (value > 0 ? '+' : '') + value.toFixed(2)
}
// 金额千分位格式化（保留两位小数；signed=true 时正数带 + 号）
export function formatThousands(value: number, signed = false) {
	const fixed = Math.abs(value).toFixed(2)
	const [int, dec] = fixed.split('.')
	const grouped = int.replace(/\B(?=(\d{3})+$)/g, ',')
	const text = `${grouped}.${dec}`
	if (value < 0 && fixed !== '0.00') return '-' + text
	return (signed && value > 0 ? '+' : '') + text
}

// ---------- 交易盈亏（移动加权平均口径，与后端 ZdxTradeRecordManager.Calc 一致） ----------
// 交易记录排序：按交易日（有 TradeTime 时精确到秒）、再按 Id 升序（与后端回放顺序一致）
export function sortTradeRecords(records: IZdxTradeRecordData[]) {
	return [...records].sort((a, b) => {
		const diff = tradeSortKey(a) - tradeSortKey(b)
		return diff || a.Id - b.Id
	})
}
function tradeSortKey(r: IZdxTradeRecordData) {
	const base = dayjs(r.TradeDate)
	if (!r.TradeTime) return base.valueOf()
	const parts = r.TradeTime.split(':').map(v => parseInt(v, 10))
	const seconds = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0)
	return base.startOf('day').valueOf() + seconds * 1000
}

// 盈亏聚合（仅买卖成交类参与；买入成本=金额+费用；卖出盈亏=金额×摊分比例−成本×匹配数量−费用×摊分比例）
// 返回平均盈利/平均亏损（正数口径）与盈亏比（平均盈利÷平均亏损；无亏损笔为 null）
export function calcProfitStat(records: IZdxTradeRecordData[]) {
	let volume = 0
	let costTotal = 0
	let winSum = 0
	let winCount = 0
	let lossSum = 0
	let lossCount = 0
	for (const r of sortTradeRecords(records)) {
		if (r.Category !== 1 && r.Category !== 2) continue
		const fee = (r.Commission ?? 0) + (r.OtherFee ?? 0) + (r.StampTax ?? 0) + (r.TransferFee ?? 0)
		// 成交金额缺失时以发生金额还原兜底：买入发生金额=-(成交金额+费用)、卖出发生金额=成交金额-费用
		const amount =
			r.Amount > 0
				? r.Amount
				: r.Category === 1
					? Math.max(0, Math.abs(r.CashAmount ?? 0) - fee)
					: Math.max(0, Math.abs(r.CashAmount ?? 0) + fee)
		if (r.Category === 1) {
			volume += r.Volume
			costTotal += amount + fee
			continue
		}
		const avgCost = volume > 0 ? costTotal / volume : 0
		const matched = Math.min(r.Volume, volume)
		const ratio = r.Volume > 0 ? matched / r.Volume : 0
		const profit = amount * ratio - avgCost * matched - fee * ratio
		volume -= matched
		costTotal -= avgCost * matched
		if (volume <= 0) volume = 0
		if (costTotal < 0) costTotal = 0
		if (profit > 0) {
			winSum += profit
			winCount++
		} else if (profit < 0) {
			lossSum += -profit
			lossCount++
		}
	}
	const avgWin = winCount ? winSum / winCount : 0
	const avgLoss = lossCount ? lossSum / lossCount : 0
	return { avgWin, avgLoss, ratio: avgLoss > 0 ? avgWin / avgLoss : null }
}

// ---------- 分时数据（确定性模拟） ----------
// 模拟分时时间轴（9:30-11:30、13:00-15:00，每5分钟）
export function buildTimes() {
	const arr: string[] = []
	for (let i = 0; i <= 24; i++) arr.push(minuteToTime(570 + i * 5))
	for (let i = 1; i <= 24; i++) arr.push(minuteToTime(780 + i * 5))
	return arr
}
function minuteToTime(minute: number) {
	const h = Math.floor(minute / 60)
	const m = minute % 60
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// 确定性分时形态系数
function buildFactors() {
	const arr: number[] = []
	for (let i = 0; i < 49; i++) {
		const t = i / 48
		const v = t + Math.sin(t * Math.PI * 2) * 0.2 + Math.sin(t * Math.PI * 4) * 0.1 + Math.sin(t * Math.PI * 8) * 0.04
		arr.push(Number(Math.min(1.05, Math.max(0, v)).toFixed(3)))
	}
	return arr
}

// 生成分时价格序列（基于昨收与涨跌幅）
export function buildTrendData(prevClose: number, percent: number) {
	return buildFactors().map(f => Number((prevClose * (1 + (percent * f) / 100)).toFixed(2)))
}

// 均价线（累计均值）
export function buildAvgLine(data: number[]) {
	let sum = 0
	return data.map((v, i) => {
		sum += v
		return +(sum / (i + 1)).toFixed(2)
	})
}

// ---------- K线数据（确定性模拟） ----------
export interface IKlinePoint {
	Date: string
	Open: number
	Close: number
	High: number
	Low: number
	Volume: number
}

// 确定性伪随机
export function seededRandom(seed: number) {
	let s = seed
	return () => {
		s = (s * 1664525 + 1013904223) % 4294967296
		return s / 4294967296
	}
}

// 生成日K（确定性），最后一日对齐当前价格
export function buildDailyKline(stock: IStock, count = 130): IKlinePoint[] {
	const rand = seededRandom(hashCode(stock.Code) + count * 7)
	const detail = buildDetail(stock)
	const arr: IKlinePoint[] = []
	let price = detail.PrevClose * (1 + (rand() - 0.5) * 0.3)
	const today = new Date()
	for (let i = count - 1; i >= 0; i--) {
		const open = +(price * (1 + (rand() - 0.5) * 0.012)).toFixed(2)
		const close = +(open * (1 + (rand() - 0.48) * 0.035)).toFixed(2)
		const high = +(Math.max(open, close) * (1 + rand() * 0.012)).toFixed(2)
		const low = +(Math.min(open, close) * (1 - rand() * 0.012)).toFixed(2)
		const volume = +(1 + rand() * 40).toFixed(2)
		arr.push({ Date: dayjs(today).subtract(i, 'day').format('YYYY-MM-DD'), Open: open, Close: close, High: high, Low: low, Volume: volume })
		price = close
	}
	const last = arr[arr.length - 1]
	last.Close = stock.Price
	last.High = Math.max(last.High, stock.Price)
	last.Low = Math.min(last.Low, stock.Price)
	return arr
}

// 按周期聚合（周K=5日、月K=20日）
export function aggregateKline(daily: IKlinePoint[], period: number): IKlinePoint[] {
	const arr: IKlinePoint[] = []
	for (let i = 0; i < daily.length; i += period) {
		const group = daily.slice(i, i + period)
		arr.push({
			Date: group[0].Date,
			Open: group[0].Open,
			Close: group[group.length - 1].Close,
			High: Math.max(...group.map(g => g.High)),
			Low: Math.min(...group.map(g => g.Low)),
			Volume: +group.reduce((s, g) => s + g.Volume, 0).toFixed(2)
		})
	}
	return arr
}

// 均线（不足周期返回 '-' 断点）
export function calcMA(data: IKlinePoint[], period: number) {
	return data.map((_, i) => {
		if (i < period - 1) return '-'
		const sum = data.slice(i - period + 1, i + 1).reduce((s, d) => s + d.Close, 0)
		return +(sum / period).toFixed(2)
	})
}

// ---------- 技术指标计算 ----------
// MACD：DIF/DEA/MACD柱
export function calcMACD(closes: number[]) {
	const ema = (period: number) => {
		const arr: number[] = []
		let prev = closes[0]
		const k = 2 / (period + 1)
		arr.push(prev)
		for (let i = 1; i < closes.length; i++) {
			prev = closes[i] * k + prev * (1 - k)
			arr.push(prev)
		}
		return arr
	}
	const ema12 = ema(12)
	const ema26 = ema(26)
	const dif = closes.map((_, i) => +(ema12[i] - ema26[i]).toFixed(3))
	let prevDea = dif[0]
	const dea = [prevDea]
	for (let i = 1; i < dif.length; i++) {
		prevDea = dif[i] * 0.2 + prevDea * 0.8
		dea.push(+prevDea.toFixed(3))
	}
	const macd = dif.map((v, i) => +((v - dea[i]) * 2).toFixed(3))
	return { dif, dea, macd }
}

// KDJ
export function calcKDJ(points: IKlinePoint[]) {
	const kArr: number[] = []
	const dArr: number[] = []
	const jArr: number[] = []
	let k = 50
	let d = 50
	points.forEach((p, i) => {
		const start = Math.max(0, i - 8)
		const hh = Math.max(...points.slice(start, i + 1).map(x => x.High))
		const ll = Math.min(...points.slice(start, i + 1).map(x => x.Low))
		const rsv = hh === ll ? 50 : ((p.Close - ll) / (hh - ll)) * 100
		k = (2 / 3) * k + (1 / 3) * rsv
		d = (2 / 3) * d + (1 / 3) * k
		kArr.push(+k.toFixed(2))
		dArr.push(+d.toFixed(2))
		jArr.push(+(3 * k - 2 * d).toFixed(2))
	})
	return { k: kArr, d: dArr, j: jArr }
}

// RSI
export function calcRSI(closes: number[], period: number) {
	const arr: number[] = []
	let gain = 0
	let loss = 0
	for (let i = 0; i < closes.length; i++) {
		if (i === 0) {
			arr.push(50)
			continue
		}
		const diff = closes[i] - closes[i - 1]
		const g = Math.max(diff, 0)
		const l = Math.max(-diff, 0)
		if (i <= period) {
			gain += g
			loss += l
			if (i === period) {
				gain /= period
				loss /= period
			}
		} else {
			gain = (gain * (period - 1) + g) / period
			loss = (loss * (period - 1) + l) / period
		}
		arr.push(i >= period ? +(100 - 100 / (1 + (loss === 0 ? 100 : gain / loss))).toFixed(2) : 50)
	}
	return arr
}

// ---------- 自选股（localStorage） ----------
const FAVORITES_KEY = 'zhiduoxing_favorites'
export function getFavorites(): string[] {
	try {
		return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
	} catch {
		return []
	}
}
export function saveFavorites(list: string[]) {
	localStorage.setItem(FAVORITES_KEY, JSON.stringify(list))
}
export function toggleFavorite(code: string): string[] {
	const list = getFavorites()
	const idx = list.indexOf(code)
	if (idx >= 0) list.splice(idx, 1)
	else list.push(code)
	saveFavorites(list)
	return list
}
export function isFavorite(code: string) {
	return getFavorites().includes(code)
}

// ---------- 行业行情（静态推导） ----------
export interface ISectorInfo {
	Total: number
	Up: number
	Down: number
	Flat: number
	Value: number
	Change: number
}
export function buildSectorInfo(sector: string): ISectorInfo {
	const h = hashCode(sector + '行业')
	const total = 20 + (h % 40)
	const up = Math.min(total - 1, Math.max(1, Math.round(total * (0.3 + (h % 40) / 100))))
	const down = total - up
	const flat = 0
	const change = h % 2 === 0 ? +((h % 200) / 100).toFixed(2) : -+((h % 200) / 100).toFixed(2)
	return {
		Total: total,
		Up: up,
		Down: down,
		Flat: flat,
		Value: +(2000 + (h % 2500)).toFixed(2),
		Change: change
	}
}
