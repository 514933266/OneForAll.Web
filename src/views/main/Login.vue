<template>
	<el-container class="login-page">
		<el-main class="left-container">
			<div ref="lottieContainer" class="lottie-container"></div>
		</el-main>
		<el-aside class="right-container">
			<div class="login-box">
				<div class="logo">
					<img src="@/assets/images/logo-title.png" fit="contain" class="logo" />
				</div>
				<div class="title">Hi,欢迎使用蜂窝云办公</div>
				<div class="tips-title">请输入账号密码登录</div>
				<div class="tips" v-show="loginTips"><font-awesome-icon fas icon="minus-circle"></font-awesome-icon>{{
					loginTips }}</div>
				<form class="login-form">
					<el-input v-model="form.username" size="large" placeholder="用户名">
						<template #prefix>
							<font-awesome-icon fas icon="user"></font-awesome-icon>
						</template>
					</el-input>
					<el-input show-password v-model="form.password" @keydown.enter="login" type="password" size="large"
						placeholder="登录密码">
						<template #prefix>
							<font-awesome-icon fas icon="lock"> </font-awesome-icon>
						</template>
					</el-input>
					<div v-show="isRequiredCode" class="code-box">
						<el-input v-model="form.code" placeholder="验证码" class="ofa-mr10"
							style="width: 150px;"></el-input>
						<el-image :src="base64CodeUrl" alt="验证码" class="ofa-mr4"
							style="width: 120px;height: 50px;"></el-image>
						<el-button link @click="getVerifyCodeBase64" type="primary"><font-awesome-icon fas icon="refrsh"
								class="ofa-mr4"></font-awesome-icon>换一个</el-button>
					</div>
				</form>
				<div class="button-box">
					<el-button round @click="login" type="primary" class="login-button">
						<span v-if="!logining">登录</span>
						<span v-else>正在登陆&nbsp;<font-awesome-icon fas spin icon="spinner"></font-awesome-icon></span>
					</el-button>
					<!-- <el-divider border-style="dotted">
            <label class="ofa-text-info">其他方式</label>
          </el-divider>
          <div class="login-type-box">
            <img src="/src/assets/img/wechat.svg"></img>
            <el-image src="../src/assets/img/dingding.svg"></el-image>
          </div> -->
				</div>
			</div>
			<div class="contact-box">
				<el-link href="https://official.fengwoyun.net/#project" :underline="false"> 关于我们 </el-link>
				<el-link href="#" :underline="false">法律声明及隐私权政策</el-link>
				<el-link href="https://official.fengwoyun.net/#contact-us" :underline="false"> 联系我们 </el-link>
				<el-link href="https://official.fengwoyun.net" :underline="false"> 至极科技 </el-link>
			</div>
			<div class="copy-right">Copyright &copy; 2019- {{ year }} ZhiJi Technology Co.,Ltd. All Rights Reserved.
			</div>
			<div class="copy-box">
				<el-link :underline="false" href="http://beian.miit.gov.cn">
					<img src="@/assets/images/copy-right.png" />
					粤ICP备18041480号
				</el-link>
			</div>
		</el-aside>
	</el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import router from '@/untils/router'
import lottie from 'lottie-web'
import { Md5 } from "ts-md5"
import lottieJson from '@/assets/lotties/login-lottie.json'
import API from '@/apis/oauth-api'
import BASE_API from '@/apis/base-api'
import { INDEX } from '@/routers/main-router'
import { useClientStore } from '@/stores/clientStore'
import { useTokenStore } from '@/stores/tokenStore'

const clientStore = useClientStore()
const tokenStore = useTokenStore()
const lottieContainer = ref() // Lottie元素
const loginTips = ref('') // 登录提示
const logining = ref(false) // 正在登陆
const year = new Date().getFullYear()
const form = ref({ username: '', password: '', markUsername: false, code: '' })
const codeKey = ref('') // 生成验证码秘钥
const base64CodeUrl = ref('') // 简单验证码图片
const isRequiredCode = ref(false) // 是否需要验证码

onMounted(() => {
	lottie.loadAnimation({
		container: lottieContainer.value, // 绑定dom节点
		renderer: 'canvas', // 渲染方式:svg、canvas
		loop: true, // 是否循环播放，默认：false
		autoplay: true, // 是否自动播放, 默认true
		animationData: lottieJson // AE动画使用bodymovie导出为json数据
	})
	initClient()
})

// 初始化客户端信息
function initClient() {
	API.getClient().then(res => {
		clientStore.setClient(res)
		if (!res.OAuthClientId) {
			loginTips.value = '域名未注册授权'
		}
	})
}

// 登录
function login() {
	if (logining.value) return false
	if (loginTips.value === '域名未注册授权') return false
	if (form.value.username === '') {
		loginTips.value = '请输入用户名'
		return
	}
	if (form.value.password === '') {
		loginTips.value = '请输入密码'
		return
	}
	logining.value = true
	API.login(form.value.username, form.value.password, form.value.code, codeKey.value)
		.then(res => {
			// 缓存token
			tokenStore.clearToken()
			tokenStore.setToken(res)
			// 登录日志
			BASE_API.logLogin()
			// 跳转首页
			router.push({ path: INDEX.Url })
		})
		.catch(error => {
			loginTips.value = error.result.Message
			isRequiredCode.value = error.result.Data?.IsRequiredCaptcha
		})
		.finally(() => {
			logining.value = false
		})
}

// 获取验证码 Base64
function getVerifyCodeBase64() {
	const timestamp = new Date().getTime()
	let randomStr = '';
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	for (let i = 0; i < length; i++) {
		randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	codeKey.value = Md5.hashStr(randomStr += '_' + timestamp)
	API.getVerifyCodeBase64(codeKey.value).then(res => {
		base64CodeUrl.value = `data:image/png;base64,${res}`
	})
}
</script>

<style lang="scss" scoped>
.left-container {
	flex: 1;
	display: flex;
	background: #f7f7fa;
	flex-direction: column;
	align-items: center;
	justify-content: center;

	.lottie-container {
		width: 80%;
	}
}

.right-container {
	padding: 20px;
	width: 600px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: #fff;

	.logo {
		margin-bottom: 40px;

		img {
			height: 39px;
		}
	}

	.login-box {
		display: flex;
		flex-direction: column;
		width: 400px;
		margin-top: 140px;

		.title {
			font-family: 'PingFang SC-Semibold, PingFang SC';
			font-size: 1.75rem;
			font-weight: 600;
			margin: 10px 0;
		}

		.tips-title {
			color: #909399;
			margin-bottom: 20px;
		}

		.tips {
			margin-right: 4px;
			font-size: 1rem;
			margin: 0 4px 10px 0;
			color: #f56c6c;

			svg {
				margin-right: 4px;
			}
		}

		:deep(.login-form) {
			display: flex;
			flex-direction: column;
			flex: 1;
			margin-bottom: 20px;

			.el-input {
				margin-bottom: 20px;
				border: none;
				background-color: #f7f8fc;
				border-radius: 10px;

				input {
					border: none;
					height: 50px;
					padding: 0 15px 0 5px;
					background-color: #f7f8fc;
					border-radius: 10px;
				}

				.el-input__wrapper {
					background-color: #f7f8fc;
					box-shadow: none;
				}

				.el-input-group__prepend {
					background: transparent;
					border: none;
					color: #c0c4cc;
				}

				svg {
					font-size: 0.75rem;
					width: 20px;
					height: 20px;
				}
			}
		}

		.button-box {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			margin-top: 50px;
		}

		.login-button {
			width: 100%;
			font-size: 1rem !important;
			color: #fff;
			border: none;
			height: 50px;
			border-radius: 8px;
		}

		.code-box {
			display: flex;

			.el-input {
				margin-bottom: 0;
			}

			.el-image {
				border: 1px solid #DCDFE6;
			}
		}
	}

	.contact-box {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		margin-top: 100px;

		.el-link {
			padding: 0 30px 0 0;
			color: #a7abba;

			&:hover {
				color: #409eff;
				transition: 0.3s;
			}
		}
	}

	.copy-right {
		display: flex;
		flex-direction: column;
		margin-top: 10px;
		color: #a8abb2;
	}

	.copy-box {
		margin-top: 10px;

		.el-link {
			color: #a7abba;

			&:hover {
				color: #409eff;
				transition: 0.3s;
			}
		}

		img {
			width: 16px;
			height: 16px;
			margin-right: 5px;
		}
	}

	.login-type-box {
		display: flex;
		align-items: center;

		.el-image {
			border-radius: 50%;
			margin-right: 20px;
			cursor: pointer;
		}
	}
}
</style>