<template>
  <el-container class="container">
    <el-header class="header">
      <el-row type="flex" align="middle">
        <img src="../../assets/img/login-header.png">
        <el-divider direction="vertical"></el-divider>
        <label class="title">云办公</label>
      </el-row>
    </el-header>
    <el-main class="content" :style="bgStyle">
      <div class="login-box">
        <div class="title">
          <label>登录</label>
          <label class="welcome">WELCOME</label>
        </div>
        <form class="login-form">
          <div class="tips" v-show="loginTips">
            <font-awesome-icon fas icon="minus-circle"></font-awesome-icon>{{ loginTips }}
          </div>
          <el-input v-model="form.username" placeholder="手机 / 用户名">
            <template slot="prepend">
              <font-awesome-icon fas icon="user"></font-awesome-icon>
            </template>
          </el-input>
          <el-input :type="passwordCss.type" v-model="form.password" placeholder="请输入登录密码">
            <template slot="prepend">
              <font-awesome-icon fas :icon="passwordCss.icon" @click="pwdVisiable = !pwdVisiable">
              </font-awesome-icon>
            </template>
          </el-input>
          <div class="type-box">
            <el-checkbox v-model="form.markUsername">记住账号</el-checkbox>
          </div>
          <el-button round @click="login" type="primary" class="login-button">
            <span v-if="!logining">登录</span>
            <span v-else>正在登陆<font-awesome-icon far icon="spinner" spin></font-awesome-icon></span>
          </el-button>
        </form>
      </div>
    </el-main>
    <el-footer class="bottom" height="140px">
      <div class="contact">
        <el-link href="#" :underline="false">关于我们</el-link>
        <el-link href="#" :underline="false">法律声明及隐私权政策</el-link>
        <el-link href="#" :underline="false">联系我们</el-link>
        <el-link href="http://official.fengwoyun.net" :underline="false">至极科技</el-link>
      </div>
      <div class="copy-right">
        <div>Copyright &copy; 2018 - {{new Date().toString('yyyy')}} ZhiJi Technology Co.,Ltd. All Rights Reserved.
        </div>
        <div class="copy">
          <el-link :underline="false" href="http://beian.miit.gov.cn"><img
              src="../../assets/img/copy-right.png">粤ICP备18041480号</el-link>
        </div>
      </div>
    </el-footer>
  </el-container>
</template>

<script>
import md5 from 'js-md5'
import auth from '../../untils/oauth'
import API from '../../apis/sys-api'
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
  beforeRouteEnter (to, from, next) {
    next(vm => vm.init())
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
    getClient () {
      this.loading = true
      this.axios.get(API.WEBSITE_SETTING_RESOURCE.URL)
        .then(response => {
          this.$store.commit(SET_CLIENT, response)
          this.loading = false
        })
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
      console.log(this.client)
      if (!this.client.OAuthClientId || this.client.OAuthClientId.length < 1) {
        this.loginTips = '当前站点未经授权'
      }
    },
    loginSuccess () {
      $(document).unbind('keydown') // 删除键盘事件
      if (this.form.markUsername) {
        this.$cookies.set('username', this.form.username, 604800)
      } else {
        this.$cookies.set('username', '')
      }
      this.$router.push(INDEX)
    },
    loginFail (data) {
      this.logining = false
      if (data) {
        this.loginTips = data.result ? data.result.Message : data
      }
    }
  },
  created () {
    this.init()
  },
  mounted () {
    var self = this
    $(document).keydown((event) => {
      switch (event.keyCode) {
        case 13: self.login(); break
      }
    })
  }
}
</script>

<style lang="scss" scoped>
$form-width: 260px;
.container {
  background: rgba(250, 250, 250, 1);
  height: 100%;
}
.header {
  display: flex;
  align-items: center;
  background: #fff;

  img {
    margin-left: 150px;
    width: 100px;
    height: 40px;
  }

  .el-divider {
    height: 30px;
  }

  .title {
    font-size: 28px;
  }
}

.content {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-size: cover !important;

  .login-box {
    display: flex;
    flex-direction: column;
    padding: 0 20px;
    width: 450px;
    height: 500px;
    margin-right: 50px;
    background-color: rgba(255, 255, 255, 1);
    box-shadow: 0 0 20px 0 rgba(0, 0, 0, .1);

    .title {
      display: flex;
      align-items: center;
      flex-direction: column;
      font-size: 32px;
      font-family: 'Source Han Sans CN';
      color: #409EFF;
      margin: 50px 0;

      label {
        width: 80px;
        text-align: center;
      }

      .welcome {
        font-size: 14px;
        color: #DDDDDD;
      }
    }

    /deep/ .login-form {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;

      .tips {
        width: $form-width;
        margin-bottom: 10px;
        padding-left: 5px;
        text-align: left;
        font-size: .75rem;
        color: #666;

        .fa-minus-circle {
          color: #F56C6C;
          padding-right: 5px;
        }
      }

      .el-input {
        margin-bottom: 20px;
        background-color: transparent;
        width: $form-width;
        border-bottom: 1px solid #F4F4F4;

        input {
          color: #666;
          background-color: transparent;
          border: none;
          height: 42px;
          padding: 0 15px 0 5px;
        }

        .el-input-group__prepend {
          background: transparent;
          border: none;
          color: #409EFF;
          padding: 0;
        }

        svg {
          width: 20px;
        }
      }

      .type-box {
        width: $form-width;
        display: flex;
        justify-content: space-between;
        font-size: .75rem;

        .el-checkbox__label {
          font-size: .75rem;
        }

        .el-button {
          padding: 0;
        }
      }

      .login-button {
        margin-top: 50px;
        font-size: 1rem !important;
        color: #fff;
        border: none;
        width: 260px;
        height: 42px;
      }
    }
  }
}

.bottom {
  border-top: 1px solid #DCDFE6;

  .contact {
    display: flex;
    flex-wrap: wrap;
    margin-top: 35px;

    .el-link {
      padding: 0 30px 0 0;
      font-size: 1rem;
      color: #909399;

      &:hover {
        color: #409EFF;
        transition: .3s;
      }
    }
  }

  .copy-right {
    display: flex;
    flex-direction: column;
    width: 80%;
    margin-top: 10px;
    font-size: 14px;
    color: #606266;

    .copy {
      margin-top: 10px;

      .el-link {
        font-size: .75rem;
        color: #909399;
      }

      img {
        width: 14px;
        height: 14px;
        margin-right: 5px;
      }
    }
  }
}
</style>
