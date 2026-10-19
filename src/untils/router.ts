import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'
import { LOGIN, INDEX } from '../routers/main-router'
import { PERSON_ENTRY_FILE } from '../routers/oa-router'
import { ZDX_LOGIN, ZDX_PORTAL_PATH_MAP, inZdxPortal } from '../consts/zdx-portal'

// 自动构建子路由
const childRoutes: RouteRecordRaw[] = []
const files = require.context('../views', true, /.vue$/i)
files.keys().forEach(key => {
	if (key.match(/(components|login|index|entryFile)\//i)) return
	const route = createRoute(key)
	if (route) childRoutes.push(route)
  })

function createRoute(fileName: string) {
	if (fileName.match(/(components|Login|Index|App)/)) return undefined
	let name = ''
	let path = '/'
	const str = fileName.replace(/(\..\/views|\.\/|.vue)/g, '')
	const arr = str.split('/').filter(x => x)
	arr.forEach((e, i) => {
		name += e.substring(0, 1).toUpperCase() + e.substring(1)
		path += e.replace(/[A-Z]/g, (c, i2) => {
			return i2 === 0 ? c.toLowerCase() : '-' + c.toLowerCase()
		})

		if (i !== arr.length - 1) {
			path += '/'
		}
	})
	return {
		name: name,
		path: path,
		component: () => import('../views/' + str + '.vue')
	}
}

const router = createRouter({
	history: createWebHashHistory(),
	routes: [
		{
			name: LOGIN.Name,
			path: LOGIN.Url,
			component: () => import('../views/main/Login.vue')
		},
		{
			name: INDEX.Name,
			path: INDEX.Url,
			component: () => import('../views/main/Index.vue'),
			children: childRoutes
		},
		{
			name: PERSON_ENTRY_FILE.Name,
			path: PERSON_ENTRY_FILE.Url,
			component: () => import('../views/oa/PersonEntryFile.vue')
		},
		// 智多星独立站：专用登录页
		{
			name: ZDX_LOGIN.Name,
			path: ZDX_LOGIN.Url,
			component: () => import('../views/zhiduoxing/components/ZdxLogin.vue')
		},
		// 智多星独立站：外壳布局（固定菜单，复用现有页面组件）
		{
			name: 'ZdxPortal',
			path: '/zdx',
			component: () => import('../views/zhiduoxing/components/ZdxPortal.vue'),
			children: [
				{ path: '', redirect: { name: 'ZdxPortalMarket' } },
				{ name: 'ZdxPortalMarket', path: 'market', component: () => import('../views/zhiduoxing/Market.vue') },
				{ name: 'ZdxPortalStock', path: 'stock', component: () => import('../views/zhiduoxing/StockDetail.vue') },
				{ name: 'ZdxPortalSector', path: 'sector', component: () => import('../views/zhiduoxing/SectorQuote.vue') },
				{ name: 'ZdxPortalNews', path: 'news', component: () => import('../views/zhiduoxing/News.vue') },
				{ name: 'ZdxPortalZone', path: 'zone', component: () => import('../views/zhiduoxing/MyZone.vue') },
				{ name: 'ZdxPortalReview', path: 'review', component: () => import('../views/zhiduoxing/StockReview.vue') },
				{ name: 'ZdxPortalStrategy', path: 'strategy', component: () => import('../views/zhiduoxing/StrategyManage.vue') },
				{ name: 'ZdxPortalBehavior', path: 'behavior', component: () => import('../views/zhiduoxing/BehaviorProfile.vue') }
			]
		},
		{
			path: '',
			name: 'Default',
			component: () => import('../views/main/Login.vue')
		}
	]
})

// 智多星独立站内互跳：沿用原 /zhiduoxing/* 地址（browserStore.navigate 与页面内直跳），
// 统一映射为 /zdx/* 子路由，保证不脱离独立站外壳（query/hash 原样携带）
router.beforeEach((to) => {
	if (inZdxPortal(router.currentRoute.value.path)) {
		const mapped = ZDX_PORTAL_PATH_MAP[to.path]
		if (mapped) {
			return { path: mapped, query: to.query, hash: to.hash }
		}
	}
})

export default router
