// 智多星独立站（Portal）：专用登录页 + 独立外壳布局
// 说明：
// 1) 菜单为静态配置（不走 sys_menu 动态加载），但各页面请求的 API 地址仍由
//    /api/SysWebsiteSettingResources/Current 动态下发（clientStore.zdxApi）。
// 2) 站内复用现有页面组件；页面间互跳沿用原 /zhiduoxing/* 地址，
//    由路由守卫按 ZDX_PORTAL_PATH_MAP 自动映射为 /zdx/* 子路由。
import { IPersonalMenuTree } from '@/interfaces/IPersonalMenuTree'

// 独立站登录页路由
export const ZDX_LOGIN = { Name: 'ZdxLogin', Url: '/zdx/login' }
// 独立站默认落地页（市场行情）
export const ZDX_HOME_PATH = '/zdx/market'

// 固定菜单（与 sys_menu 智多星系菜单口径一致；Url 为原站内页面地址）
export const ZDX_PORTAL_MENUS: IPersonalMenuTree[] = [
	{ Id: 'ZdxPortalMarket', Code: 'ZdxMarket', Name: '市场行情', Url: '/zhiduoxing/market', Type: 2, OpenType: 1, Icon: 'gauge-high', IsDefault: true, Children: [] },
	{ Id: '7E4B2C9A-1D5F-4A8B-9C0E-08DF07289DFB', Code: 'ZdxStockQuote', Name: '个股行情', Url: '/zhiduoxing/stock-detail', Type: 2, OpenType: 1, Icon: 'arrow-trend-up', IsDefault: false, Children: [] },
	{ Id: 'ZdxPortalSector', Code: 'ZdxSectorQuote', Name: '板块行情', Url: '/zhiduoxing/sector-quote', Type: 2, OpenType: 1, Icon: 'table-cells-large', IsDefault: false, Children: [] },
	{ Id: 'ZdxNews', Code: 'ZdxNews', Name: '资讯', Url: '/zhiduoxing/news', Type: 2, OpenType: 1, Icon: 'newspaper', IsDefault: false, Children: [] },
	{ Id: 'ZdxPortalMyZone', Code: 'ZdxMyZone', Name: '我的地盘', Url: '/zhiduoxing/my-zone', Type: 2, OpenType: 1, Icon: 'briefcase', IsDefault: false, Children: [] },
	{ Id: 'ZdxStockReview', Code: 'ZdxStockReview', Name: '复盘中心', Url: '/zhiduoxing/stock-review', Type: 2, OpenType: 1, Icon: 'pen-to-square', IsDefault: false, Children: [] },
	{ Id: 'ZdxStrategy', Code: 'ZdxStrategy', Name: '交易策略', Url: '/zhiduoxing/strategy-manage', Type: 2, OpenType: 1, Icon: 'bullseye', IsDefault: false, Children: [] }
]

// 独立站子路由（与固定菜单一一对应；Behavior 为"我的地盘→交易画像"跳转承接页）
export const ZDX_PORTAL_CHILDREN = [
	{ name: 'ZdxPortalMarket', path: 'market', originUrl: '/zhiduoxing/market' },
	{ name: 'ZdxPortalStock', path: 'stock', originUrl: '/zhiduoxing/stock-detail' },
	{ name: 'ZdxPortalSector', path: 'sector', originUrl: '/zhiduoxing/sector-quote' },
	{ name: 'ZdxPortalNews', path: 'news', originUrl: '/zhiduoxing/news' },
	{ name: 'ZdxPortalZone', path: 'zone', originUrl: '/zhiduoxing/my-zone' },
	{ name: 'ZdxPortalReview', path: 'review', originUrl: '/zhiduoxing/stock-review' },
	{ name: 'ZdxPortalStrategy', path: 'strategy', originUrl: '/zhiduoxing/strategy-manage' },
	{ name: 'ZdxPortalBehavior', path: 'behavior', originUrl: '/zhiduoxing/behavior-profile' }
]

// 原站内页面地址 → 独立站子路由地址（站内互跳时由路由守卫映射）
export const ZDX_PORTAL_PATH_MAP: Record<string, string> = {}
ZDX_PORTAL_CHILDREN.forEach(e => { ZDX_PORTAL_PATH_MAP[e.originUrl] = `/zdx/${e.path}` })

// 判断当前是否处于独立站上下文
export function inZdxPortal(path: string) {
	return path === '/zdx' || path.startsWith('/zdx/')
}
