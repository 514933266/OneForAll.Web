import Router from 'vue-router'
import {
  LOGIN,
  INDEX,
  ENTRY_FILE,
  ENTRY_FILE_RESULT,
  _404
} from './base-router'

// 自动构建子路由
const childRoutes = []
const files = require.context('../views', true, /.vue$/i)
files.keys().forEach(key => {
  if (key.match(/(components|login|index|entryFile)\//i)) return
  const route = createRoute(key)
  childRoutes.push(route)
})

function createRoute (url) {
  let name = ''
  let path = ''
  const str = url.replace(/(\.\/|.vue)/g, '')
  const arr = str.split('/')
  arr.forEach((e, i) => {
    name += e.substring(0, 1).toUpperCase() + e.substring(1)
    path += e.replace(/[A-Z]/g, (c, i2) => {
      if (i2 === 0 || i2 === (e.length - 1)) {
        return c.toLowerCase()
      } else {
        return '-' + c.toLowerCase()
      }
    })

    if (i !== (arr.length - 1)) {
      path += '/'
    }
  })
  return {
    name: name,
    path: path,
    component: () => import('../views/' + str + '.vue')
  }
}

const router = new Router({
  // mode: 'history',
  base: '/',
  routes: [{
    ...LOGIN,
    component: () => import('../views/home/Login.vue')
  },
  {
    ...INDEX,
    component: () => import('../views/home/Index.vue'),
    children: [...childRoutes]
  },
  {
    ...ENTRY_FILE,
    component: () => import('../views/home/EntryFile.vue')
  },
  {
    ...ENTRY_FILE_RESULT,
    component: () => import('../views/home/EntryFileResult.vue')
  },
  {
    path: '*',
    component: () => import('../views/home/Login.vue')
  }]
})

router.beforeEach((to, from, next) => {
  if (to.matched && to.matched.length > 0) {
    next()
  } else {
    next(_404)
  }
})
export default router
