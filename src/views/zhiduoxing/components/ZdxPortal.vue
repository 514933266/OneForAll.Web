<template>
	<el-container class="zdx-portal">
		<!-- 顶栏：品牌 + 用户区 -->
		<el-header class="portal-header">
			<div class="header-brand">
				<span class="brand-ico"><font-awesome-icon fas icon="chart-line"></font-awesome-icon></span>
				<span class="brand-name">智多星</span>
				<span class="brand-sub">金融数据分析系统</span>
			</div>
			<div class="header-user">
				<el-dropdown trigger="click">
					<div class="user-entry">
						<el-avatar :size="30" :src="avatarUrl">
							<template #default>
								<font-awesome-icon fas icon="user"></font-awesome-icon>
							</template>
						</el-avatar>
						<span class="user-name">{{ userStore.user?.Name || '未登录' }}</span>
						<font-awesome-icon fas icon="chevron-down" class="user-arrow"></font-awesome-icon>
					</div>
					<template #dropdown>
						<el-dropdown-menu>
							<el-dropdown-item @click="backToOffice">
								<font-awesome-icon fas icon="house"></font-awesome-icon>&nbsp;返回办公门户
							</el-dropdown-item>
							<el-dropdown-item divided @click="logout">
								<font-awesome-icon fas icon="power-off"></font-awesome-icon>&nbsp;{{
									logouting ? '安全退出中...' : '退出登录' }}
							</el-dropdown-item>
						</el-dropdown-menu>
					</template>
				</el-dropdown>
			</div>
		</el-header>

		<el-container class="portal-body">
			<!-- 左侧固定菜单（静态配置，不走动态菜单） -->
			<el-aside class="portal-aside" width="180px">
				<ul class="menu-list">
					<li v-for="menu in ZDX_PORTAL_MENUS" :key="menu.Code" class="menu-item"
						:class="{ active: activeCode === menu.Code }" @click="clickMenu(menu)">
						<font-awesome-icon fas :icon="menu.Icon" class="menu-ico"></font-awesome-icon>
						<span>{{ menu.Name }}</span>
					</li>
				</ul>
			</el-aside>

			<!-- 内容区：复用现有智多星页面组件（等动态 API 地址就绪后再渲染，避免首屏取不到服务地址） -->
			<el-main class="portal-main">
				<router-view v-if="ready" />
			</el-main>
		</el-container>
	</el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import API from '@/apis/oauth-api'
import BASE_API from '@/apis/base-api'
import { useBrowserStore } from '@/stores/browserStore'
import { useClientStore } from '@/stores/clientStore'
import { useTokenStore } from '@/stores/tokenStore'
import { useUserStore } from '@/stores/userStore'
import { IPersonalMenuTree } from '@/interfaces/IPersonalMenuTree'
import { ZDX_LOGIN, ZDX_PORTAL_MENUS, ZDX_PORTAL_PATH_MAP } from '@/consts/zdx-portal'

const route = useRoute()
const router = useRouter()
const browserStore = useBrowserStore()
const clientStore = useClientStore()
const tokenStore = useTokenStore()
const userStore = useUserStore()

const logouting = ref(false)
const ready = ref(false) // 子页面可渲染（登录态与服务地址就绪）

// 当前激活菜单（按独立站路由反查）
const activeCode = computed(() => {
	const menu = ZDX_PORTAL_MENUS.find(w => ZDX_PORTAL_PATH_MAP[w.Url] === route.path)
	return menu?.Code ?? ''
})

// 头像地址（基座服务 + 相对路径）
const avatarUrl = computed(() => {
	const icon = userStore.user?.IconUrl
	return icon ? `${BASE_API.getHost()}${icon}` : ''
})

onMounted(() => {
	// 未登录回专用登录页
	if (!tokenStore.bearToken) {
		router.replace({ path: ZDX_LOGIN.Url })
		return
	}
	// 各服务 API 地址由站点配置动态下发：有缓存直接渲染，无缓存先拉配置
	if (clientStore.zdxApi) {
		ready.value = true
	} else {
		API.getClient().then(res => {
			clientStore.setClient(res)
		}).catch(() => { }).finally(() => {
			ready.value = true
		})
	}
	// 加载登录用户（“我的地盘”档案卡等依赖 userStore）
	if (!userStore.user?.Id) {
		BASE_API.getLoginUser().then(res => {
			userStore.setUser(res)
		}).catch(() => {
			// Base 服务不可用/无权限时，用 JWT 里的 display_name 兜底显示
			const name = decodeJwtName(tokenStore.bearToken)
			if (name) userStore.setUser(Object.assign({}, userStore.user, { Name: name }))
		})
	}
})

// 从 JWT payload 解出 display_name（仅展示用途，不做校验）
function decodeJwtName(token?: string): string {
	try {
		const payload = token?.split('.')[1]
		if (!payload) return ''
		const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
		return json.display_name ?? ''
	} catch {
		return ''
	}
}

// 点击菜单：沿用内部浏览器跳转（页面间携带参数逻辑不变，路由守卫映射为 /zdx/* 子路由）
function clickMenu(menu: IPersonalMenuTree) {
	if (ZDX_PORTAL_PATH_MAP[menu.Url] === route.path) return
	browserStore.navigate(menu)
}

// 返回办公门户
function backToOffice() {
	router.push({ path: '/index' })
}

// 退出登录：本地登录态无条件清除，服务端登出仅尽力通知——
// 智多星账号对 Base 服务可能无权限（401/403 等），不能因此退不出去
function logout() {
	logouting.value = true
	BASE_API.logout().catch(() => { })
	tokenStore.clearToken()
	clientStore.clearClient()
	router.replace({ path: ZDX_LOGIN.Url }).finally(() => {
		logouting.value = false
	})
}
</script>

<style lang="scss" scoped>
.zdx-portal {
	height: 100vh;
	overflow: hidden;
	background: #f5f7fb;
}

.portal-header {
	height: 56px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 20px;
	background: linear-gradient(135deg, #4a7ef7 0%, #6c63f0 55%, #7c5cf0 100%);
	box-shadow: 0 2px 10px rgba(74, 126, 247, 0.25);

	.header-brand {
		display: flex;
		align-items: center;
		color: #fff;

		.brand-ico {
			width: 32px;
			height: 32px;
			border-radius: 9px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(255, 255, 255, 0.18);
			margin-right: 10px;
		}

		.brand-name {
			font-size: 18px;
			font-weight: 700;
			letter-spacing: 1px;
		}

		.brand-sub {
			margin-left: 10px;
			font-size: 12px;
			opacity: 0.75;
		}
	}

	.header-user {
		.user-entry {
			display: flex;
			align-items: center;
			gap: 8px;
			cursor: pointer;
			color: #fff;
			padding: 4px 10px;
			border-radius: 18px;
			background: rgba(255, 255, 255, 0.12);

			&:hover {
				background: rgba(255, 255, 255, 0.2);
			}

			.user-name {
				font-size: 13px;
				max-width: 120px;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.user-arrow {
				font-size: 11px;
				opacity: 0.8;
			}
		}
	}
}

.portal-body {
	overflow: hidden;
}

.portal-aside {
	background: #fff;
	border-right: 1px solid #eef0f6;
	padding-top: 12px;

	.menu-list {
		list-style: none;
		margin: 0;
		padding: 0 10px;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 11px 14px;
		margin-bottom: 6px;
		border-radius: 10px;
		font-size: 14px;
		color: #4b5567;
		cursor: pointer;
		transition: background 0.2s, color 0.2s;

		.menu-ico {
			width: 16px;
			text-align: center;
		}

		&:hover {
			background: #f2f5fd;
			color: #4a7ef7;
		}

		&.active {
			background: linear-gradient(90deg, rgba(74, 126, 247, 0.1), rgba(124, 92, 240, 0.1));
			color: #4a7ef7;
			font-weight: 600;
		}
	}
}

.portal-main {
	padding: 14px;
	overflow-y: auto;
	background: linear-gradient(180deg, #fbfcff 0%, #f5f7fd 120px);
}
</style>
