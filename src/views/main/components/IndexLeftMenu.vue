<template>
	<el-menu unique-opened :collapse="collapse" class="index-leftmenu">
		<el-button type="primary" circle class="collapse-icon" @click="collapseMenu">
			<font-awesome-icon fas :icon="collapse ? 'angle-right' : 'angle-left'"></font-awesome-icon
		></el-button>
		<div class="logo-box">
			<img v-if="collapse" src="@/assets/images/logo-title-min.png" />
			<img v-else src="@/assets/images/logo-title.png" />
		</div>
		<div class="menu-box">
			<el-menu-item :index="homeItem.Id" @click="clickItem" class="home-item">
				<font-awesome-icon fas :icon="homeItem.Icon" class="icon"></font-awesome-icon>
				<label class="menu-name">{{ homeItem.Name }}</label>
			</el-menu-item>
			<IndexLeftMenuItem v-if="menus.length > 0" :list="menus" :collapse="collapse" @click="clickItem"> </IndexLeftMenuItem>
		</div>
	</el-menu>
	<RemoteMoudleLoader ref="moudleLoaderRef"></RemoteMoudleLoader>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, defineEmits, defineExpose } from 'vue'
import API from '@/apis/base-api'
import { WELCOME } from '@/routers/main-router'
import { IPersonalMenuTree } from '@/interfaces/IPersonalMenuTree'
import IndexLeftMenuItem from './IndexLeftMenuItem.vue'
import RemoteMoudleLoader from './RemoteMoudleLoader.vue'

const collapse = ref(false)
const homeItem = WELCOME
const menus = ref<IPersonalMenuTree[]>([])
// 需要远程加载的模块url集合
const moudles = ref<string[]>([])
const emit = defineEmits(['click'])
const moudleLoaderRef = ref() // 远程组件

onMounted(() => {
	getMenus()
	// 默认加载首页
	clickItem({ index: homeItem.Id, indexPath: [homeItem.Id] })
})

// 点击菜单
function clickItem(item: any) {
	const { index, indexPath } = item
	const paths: IPersonalMenuTree[] = []
	const arr = indexPath as string[]

	if (index === homeItem.Id) {
		paths.push(homeItem)
		emit('click', homeItem, paths)
	} else {
		// 请求加载的菜单
		arr.forEach(id => {
			const item = findMenu(menus.value, id)
			if (item) {
				paths.push(item)
			}
		})
		const menu = paths.find(w => w.Id === index)
		emit('click', menu, paths)
	}
}

// 获取菜单列表
function getMenus() {
	API.getMenus().then(res => {
		menus.value = res
		moudles.value = menus.value.filter(x => x.Type === 1).map(x => x.Url)
		nextTick(() => {
			moudleLoaderRef.value?.loadMoudles(moudles.value)
		})
	})
}

// 查找指定菜单
function findMenu(menus: IPersonalMenuTree[], id: string): IPersonalMenuTree | undefined {
	for (let index = 0; index < menus.length; index++) {
		const element = menus[index]
		if (element.Id === id) {
			return element
		} else if (element.Children.length > 0) {
			const item = findMenu(element.Children, id)
			if (item) return item
		}
	}
	return undefined
}

// 折叠菜单
function collapseMenu() {
	collapse.value = collapse.value === true ? false : true
}

defineExpose({ moudles })
</script>

<style lang="scss" scoped>
$left-width: 280px;
$left-collapse-width: 100px;

.index-leftmenu {
	display: flex;
	flex-direction: column;
	background: #fff;
	box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.05);
	height: 100%;

	.collapse-icon {
		position: absolute;
		top: 29px;
		right: -10px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		font-size: 12px;
		z-index: 99999;
	}

	.logo-box {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		border-bottom: 1px solid #eaebec;

		img {
			height: 40px;
		}
	}
}

.el-menu {
	z-index: 1;

	&:not(.el-menu--collapse) {
		width: $left-width;
	}
}

.menu-box {
	flex: 1;
	overflow-y: auto;
	overflow-x: hidden;
	-ms-overflow-style: none;
	overflow: -moz-scrollbars-none;
	scrollbar-width: none;
	margin-top: 20px;

	.home-item {
		color: #606266;
		border-radius: 10px;
		margin: 0 10px 0;

		.icon {
			width: 16px;
			height: 16px;
		}
	}
}

.menu-box::-webkit-scrollbar {
	width: 0 !important;
}

.el-menu-item.is-active {
	background-color: #409eff;
	color: #fff;
}

.el-menu--collapse {
	width: $left-collapse-width;

	:deep(.menu-name),
	:deep(.menu-name-disabled),
	:deep(.el-sub-menu__icon-arrow),
	:deep(.el-menu-item-group__title) {
		display: none;
	}

	:deep(.el-menu-item),
	:deep(.el-sub-menu__title) {
		display: flex;
		justify-content: center;
	}
}

.menu-name {
	margin-left: 4px;
}
</style>