<template>
	<div v-if="clientReady" class="zdx-login">
		<!-- 背景装饰光斑 -->
		<div class="bg-blob blob-1"></div>
		<div class="bg-blob blob-2"></div>
		<div class="bg-blob blob-3"></div>

		<div class="login-card">
			<!-- 左侧品牌区 -->
			<div class="brand-side">
				<div class="brand-badge"><font-awesome-icon fas icon="chart-line"></font-awesome-icon></div>
				<div class="brand-title">智多星</div>
				<div class="brand-sub">交易策略分析系统</div>
				<ul class="brand-points">
					<li><font-awesome-icon fas icon="gauge-high"></font-awesome-icon>大盘行情 · 板块资金脉络</li>
					<li><font-awesome-icon fas icon="arrow-trend-up"></font-awesome-icon>个股分时 · 日周月K全周期</li>
					<li><font-awesome-icon fas icon="briefcase"></font-awesome-icon>持仓流水 · 交易行为画像</li>
					<li><font-awesome-icon fas icon="pen-to-square"></font-awesome-icon>假设验证 · 复盘中心闭环</li>
				</ul>
			</div>

			<!-- 右侧登录区 -->
			<div class="form-side">
				<div class="form-title">Hi,你好</div>
				<div class="form-tips-title">请使用蜂窝云账号登录智多星工作台</div>
				<div class="form-tips" v-show="loginTips">
					<font-awesome-icon fas icon="circle-exclamation"></font-awesome-icon>{{ loginTips }}
				</div>
				<el-input v-model.trim="form.username" size="large" placeholder="用户名" class="form-item">
					<template #prefix>
						<font-awesome-icon fas icon="user"></font-awesome-icon>
					</template>
				</el-input>
				<el-input v-model="form.password" show-password type="password" size="large" placeholder="登录密码"
					class="form-item" @keydown.enter="login">
					<template #prefix>
						<font-awesome-icon fas icon="lock"></font-awesome-icon>
					</template>
				</el-input>
				<div v-show="isRequiredCode" class="code-box form-item">
					<el-input v-model.trim="form.code" placeholder="验证码" size="large" class="code-input"
						@keydown.enter="login"></el-input>
					<el-image :src="base64CodeUrl" alt="验证码" class="code-img" @click="getVerifyCodeBase64"></el-image>
					<el-button link type="primary" @click="getVerifyCodeBase64">
						<font-awesome-icon fas icon="refresh"></font-awesome-icon>&nbsp;换一个
					</el-button>
				</div>
				<el-button type="primary" size="large" class="login-button" :loading="logining" @click="login">
					<span v-if="!logining">登 录</span>
					<span v-else>正在登录...</span>
				</el-button>
				<div class="form-footer">Copyright &copy; 2019- {{ year }} OneForAll 蜂窝云</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Md5 } from 'ts-md5'
import API from '@/apis/oauth-api'
import BASE_API from '@/apis/base-api'
import { useClientStore } from '@/stores/clientStore'
import { useTokenStore } from '@/stores/tokenStore'
import { ZDX_HOME_PATH } from '@/consts/zdx-portal'

const route = useRoute()
const router = useRouter()
const clientStore = useClientStore()
const tokenStore = useTokenStore()

const year = new Date().getFullYear()
const clientReady = ref(false) // Current 获取客户端信息完成前不显示页面
const loginTips = ref('') // 登录提示
const logining = ref(false) // 正在登录
const form = ref({ username: '', password: '', code: '' })
const codeKey = ref('') // 验证码秘钥
const base64CodeUrl = ref('') // 验证码图片
const isRequiredCode = ref(false) // 是否需要验证码

onMounted(() => {
	// 已有登录态直接进工作台
	if (localStorage.getItem('token')) {
		router.replace({ path: ZDX_HOME_PATH })
		return
	}
	initClient()
})

// 初始化客户端信息（动态获取授权地址与各服务 API 地址；Current 返回前不显示页面，避免闪烁）
function initClient() {
	API.getClient().then(res => {
		clientStore.setClient(res)
		if (!res.OAuthClientId) {
			loginTips.value = '域名未注册授权'
		}
	}).catch(() => {
		loginTips.value = '获取服务配置失败，请检查网络'
	}).finally(() => {
		clientReady.value = true
	})
}

// 登录
function login() {
	if (logining.value) return
	if (loginTips.value === '域名未注册授权') return
	if (!form.value.username) {
		loginTips.value = '请输入用户名'
		return
	}
	if (!form.value.password) {
		loginTips.value = '请输入密码'
		return
	}
	if (isRequiredCode.value && !form.value.code) {
		loginTips.value = '请输入验证码'
		return
	}
	logining.value = true
	loginTips.value = ''
	API.login(form.value.username, form.value.password, form.value.code, codeKey.value)
		.then(res => {
			// 登录失败：HTTP 200 + BaseMessage(Status=false)
			if (res?.Status === false) {
				loginTips.value = res.Message || '登录失败'
				if (res.Data?.IsRequiredCaptcha) {
					isRequiredCode.value = true
					getVerifyCodeBase64()
				}
				return
			}
			// 缓存 token 并记录登录日志（异步，不阻塞跳转）
			tokenStore.clearToken()
			tokenStore.setToken({ AccessToken: res.Data, RefreshToken: '' })
			BASE_API.logLogin().catch(() => { })
			const redirect = route.query.redirect as string
			router.replace({ path: redirect || ZDX_HOME_PATH })
		})
		.catch((error: any) => {
			loginTips.value = error?.Message || '登录失败，请检查网络与服务器地址'
			if (error?.Data?.IsRequiredCaptcha) {
				isRequiredCode.value = true
				getVerifyCodeBase64()
			}
		})
		.finally(() => {
			logining.value = false
		})
}

// 生成验证码（随机秘钥 + 时间戳取 MD5）
function getVerifyCodeBase64() {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let randomStr = ''
	for (let i = 0; i < 16; i++) {
		randomStr += chars.charAt(Math.floor(Math.random() * chars.length))
	}
	codeKey.value = Md5.hashStr(`${randomStr}_${new Date().getTime()}`)
	API.getVerifyCodeBase64(codeKey.value).then(res => {
		base64CodeUrl.value = `data:image/png;base64,${res}`
	})
}
</script>

<style lang="scss" scoped>
.zdx-login {
	position: relative;
	// #app 为 flex 容器，需占满剩余宽度，否则卡片收缩靠左、右侧留白
	flex: 1;
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	background: linear-gradient(135deg, #eef3ff 0%, #f5f3ff 55%, #eef6ff 100%);
}

.bg-blob {
	position: absolute;
	border-radius: 50%;
	filter: blur(80px);
	opacity: 0.5;
	pointer-events: none;
}

.blob-1 {
	width: 420px;
	height: 420px;
	background: #4a7ef7;
	top: -120px;
	left: -100px;
}

.blob-2 {
	width: 380px;
	height: 380px;
	background: #7c5cf0;
	bottom: -140px;
	right: -80px;
}

.blob-3 {
	width: 260px;
	height: 260px;
	background: #6c63f0;
	top: 55%;
	left: 12%;
	opacity: 0.25;
}

.login-card {
	position: relative;
	display: flex;
	width: 880px;
	max-width: calc(100vw - 40px);
	min-height: 520px;
	border-radius: 20px;
	background: #fff;
	box-shadow: 0 18px 50px rgba(74, 126, 247, 0.18);
	overflow: hidden;
}

.brand-side {
	width: 380px;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 48px 40px;
	color: #fff;
	background: linear-gradient(135deg, #4a7ef7 0%, #6c63f0 55%, #7c5cf0 100%);

	.brand-badge {
		width: 56px;
		height: 56px;
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 26px;
		background: rgba(255, 255, 255, 0.18);
		margin-bottom: 22px;
	}

	.brand-title {
		font-size: 34px;
		font-weight: 700;
		letter-spacing: 2px;
	}

	.brand-sub {
		margin-top: 10px;
		font-size: 14px;
		opacity: 0.85;
	}

	.brand-points {
		margin-top: 38px;
		padding: 0;
		list-style: none;

		li {
			display: flex;
			align-items: center;
			gap: 10px;
			font-size: 14px;
			opacity: 0.92;
			margin-bottom: 18px;
		}
	}
}

.form-side {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 48px 56px;

	.form-title {
		font-size: 26px;
		font-weight: 600;
		color: #2e3543;
	}

	.form-tips-title {
		margin-top: 10px;
		font-size: 13px;
		color: #8a94a6;
	}

	.form-tips {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 14px;
		font-size: 13px;
		color: #f56c6c;
	}

	.form-item {
		margin-top: 18px;
	}

	.code-box {
		display: flex;
		align-items: center;

		.code-input {
			width: 150px;
			margin-right: 12px;
		}

		.code-img {
			width: 110px;
			height: 40px;
			border: 1px solid #dcdfe6;
			border-radius: 6px;
			cursor: pointer;
			margin-right: 8px;
		}
	}

	.login-button {
		margin-top: 28px;
		width: 100%;
		height: 46px;
		font-size: 16px;
		border: none;
		border-radius: 10px;
		background: linear-gradient(90deg, #4a7ef7, #7c5cf0);

		&:hover {
			opacity: 0.92;
		}
	}

	.form-footer {
		margin-top: 30px;
		font-size: 12px;
		color: #a8abb2;
		text-align: center;
	}
}

// 窄屏隐藏品牌区
@media (max-width: 760px) {
	.brand-side {
		display: none;
	}

	.login-card {
		width: 420px;
		min-height: auto;
	}
}
</style>
