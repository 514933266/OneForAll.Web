import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'
import { LOGIN, INDEX } from '../routers/main-router'
import { PERSON_ENTRY_FILE } from '../routers/oa-router'

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
		{
			path: '',
			name: 'Default',
			component: () => import('../views/main/Login.vue')
		}
	]
})

export default router
