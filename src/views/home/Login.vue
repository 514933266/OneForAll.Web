<template>
  <el-container class="container">
    <el-main class="left-container">
      <div ref="lottieContainer" class="lottie"></div>
    </el-main>
    <el-main class="right-container">
      <div class="content">
        <div class="logo">
          <el-image :src="require('../../assets/img/logo-font.svg')" />
        </div>
        <div class="title ofa-text-title ofa-xxl">
          Hi,欢迎使用蜂窝云办公
        </div>
        <div class="ofa-text-info ofa-mt20">请输入账号密码登录</div>
        <form class="login-form ofa-mt20">
          <div class="tips ofa-text-danger ofa-mb10" v-show="loginTips">
            <font-awesome-icon fas icon="minus-circle"></font-awesome-icon>{{ loginTips }}
          </div>
          <el-input v-model="form.username" placeholder="手机 / 用户名">
            <template slot="prepend">
              <font-awesome-icon fas icon="user"></font-awesome-icon>
            </template>
          </el-input>
          <el-input :type="passwordCss.type" v-model="form.password" placeholder="请输入登录密码">
            <template slot="prepend">
              <font-awesome-icon fas :icon="passwordCss.icon" @click="pwdVisiable = !pwdVisiable" style="cursor:pointer;">
              </font-awesome-icon>
            </template>
          </el-input>
          <div class="type-box">
            <el-checkbox v-model="form.markUsername" class="ofa-text-info">记住账号</el-checkbox>
          </div>
          <div class="button-box">
            <el-button round @click="login" @keyup.enter="keyDown(e)" type="primary" class="login-button">
              <span v-if="!logining">登录</span>
              <span v-else>正在登陆<el-icon class="el-icon-loading"></el-icon></span>
            </el-button>
            <el-divider border-style="dotted">
              <label class="ofa-text-info">其他方式</label>
            </el-divider>
            <div class="login-type-box">
              <el-image :src="require('../../assets/img/wechat.svg')" @click="toWxAuthPage"></el-image>
              <el-image :src="require('../../assets/img/dingding.svg')"></el-image>
            </div>
          </div>
        </form>
      </div>
      <div class="contact">
        <el-link href="https://official.fengwoyun.net/#project" :underline="false">关于我们</el-link>
        <el-link href="#" :underline="false">法律声明及隐私权政策</el-link>
        <el-link href="https://official.fengwoyun.net/#contact-us" :underline="false">联系我们</el-link>
        <el-link href="https://official.fengwoyun.net" :underline="false">至极科技</el-link>
      </div>
      <div class="copy-right ofa-text-placeholder">
        Copyright &copy; 2019- {{ new Date().Year }} ZhiJi
        Technology Co.,Ltd. All Rights Reserved.
      </div>
      <div class="copy">
        <el-link :underline="false" href="http://beian.miit.gov.cn">
          <el-image :src="require('../../assets/img/copy-right.png')" />粤ICP备18041480号</el-link>
      </div>
    </el-main>
  </el-container>
</template>

<script>
import md5 from 'js-md5'
import auth from '../../untils/oauth'
import API from '../../apis/sys-api'
import BASE_API from '../../apis/base-api'
import lottie from 'lottie-web'
import lottieJson from '../../assets/js/login-lottie.json'
import { LOGIN, INDEX } from '../../router/base-router'
import { CLEAR_LOGIN, SET_CLIENT } from '../../store/mutation-types'

export default {
  name: LOGIN.name,
  data () {
    return {
      bgDomain: API.SERVICE_DOMAIN,
      defaultBgUrl: require('../../assets/img/login-background.jpg'),
      loading: false, // 加载中
      logining: false, // 正在登陆
      pwdVisiable: false, // 密码可见
      loginTips: '', // 登录提示
      lottieOption: lottieJson, // lottie动画配置
      form: { username: '', password: '', markUsername: false } // 表单
    }
  },
  computed: {
    passwordCss () {
      return this.pwdVisiable ? { type: 'text', icon: 'eye' } : { type: 'password', icon: 'eye-slash' }
    },
    bgStyle () {
      if (this.$store.getters.client.LoginBackgroundUrl) {
        return `background: url("${this.bgDomain}${this.$store.getters.client.LoginBackgroundUrl}") no-repeat;`
      }
      return `background: url("${this.defaultBgUrl}") no-repeat;`
    },
    client () {
      return this.$store.getters.client
    }
  },
  methods: {
    init () {
      if (!this.loading) {
        this.$store.commit(CLEAR_LOGIN)
        this.getClient()
        const username = this.$cookies.get('username')
        this.form.username = username === null ? '' : username
        this.form.markUsername = this.form.username.length > 0
      }
    },
    initAnimation () {
      // 动画效果
      const animation = lottie.loadAnimation({
        container: this.$refs.lottieContainer, // 绑定dom节点
        renderer: 'svg', // 渲染方式:svg、canvas
        loop: true, // 是否循环播放，默认：false
        autoplay: true, // 是否自动播放, 默认true
        animationData: this.lottieOption // AE动画使用bodymovie导出为json数据
      })
      animation.play()
    },
    getClient () {
      this.loading = true
      this.axios.get(API.WEBSITE_SETTING_RESOURCE.URL)
        .then(response => {
          this.$store.commit(SET_CLIENT, response)
          this.loading = false
        })
    },
    keyDown (e) {
      if (e.keyCode === 13) {
        this.login()
      }
    },
    login () {
      if (!this.logining) this.beforeLogin()
    },
    beforeLogin () {
      this.logining = true
      this.validateUser()
      this.validateClient()
      if (this.loginTips.length > 0) {
        this.logining = false
        return false
      }
      this.$nextTick(() => {
        auth.getToken(this.form.username, md5(this.form.password), this.loginSuccess, this.loginFail)
      })
    },
    validateUser () {
      if (this.form.username === '') this.loginTips = '请输入用户名'
      else if (this.form.password === '') this.loginTips = '请输入密码'
      else this.loginTips = ''
    },
    validateClient () {
      if (!this.client.OAuthClientId || this.client.OAuthClientId.length < 1) {
        this.loginTips = '当前站点未经授权'
      }
    },
    loginSuccess () {
      if (this.form.markUsername) {
        this.$cookies.set('username', this.form.username, 604800)
      } else {
        this.$cookies.set('username', '')
      }
      // 提交登录日志
      const url = this.$root.getApi(BASE_API.KEY, BASE_API.PERSONAL.URL)
      this.axios.post(url, { Source: 'PC', LoginType: 'Password' })
      // 跳转
      this.$router.push(INDEX)
    },
    loginFail (data) {
      this.logining = false
      if (data) {
        this.loginTips = data.result ? data.result.Message : data
      }
    },
    toWxAuthPage () {
      const appId = 'wxb7bbb540224f7bbb'
      const scope = 'snsapi_base'
      const redirectUrl = encodeURI(window.location.hostname + LOGIN.name)
      const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUrl}&response_type=code&scope=${scope}&state=STATE#wechat_redirect`
      window.location.href = url
    }
  },
  created () {
    this.init()
  },
  mounted () {
    window.addEventListener('keydown', this.keyDown)
    this.initAnimation()
  },
  unmounted () {
    window.removeEventListener('keydown', this.keyDown, false)
  }
}
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.left-container {
  flex: 1;
  display: flex;
  background: #f7f7fa;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .lottie {
    flex: 1;
    width: 100%;
  }
}

.right-container {
  flex: none;
  width: 600px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;

  .logo {
    margin-bottom: 80px;
    flex: 1;
    display: flex;
    width: 400px;

    .el-image {
      height: 39px;
    }
  }

  /deep/ .content {
    display: flex;
    flex-direction: column;
    width: 400px;
    margin-top: 140px;

    .title {
      font-family: 'PingFang SC-Semibold, PingFang SC';
    }

    .login-form {
      display: flex;
      flex-direction: column;
      flex: 1;

      .tips {
        margin-right: 4px;
        font-size: 1rem;
        transition: all 0.3s ease-in;

        svg {
          margin-right: 4px;
        }
      }

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

      .type-box {
        flex: 1;
        display: flex;
        justify-content: space-between;

        .el-button {
          padding: 0;
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
    }
  }

  .contact {
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
  }

  .copy {
    margin-top: 10px;

    .el-link {
      color: #a7abba;

      &:hover {
        color: #409eff;
        transition: 0.3s;
      }
    }

    .el-image {
      width: 14px;
      height: 14px;
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
