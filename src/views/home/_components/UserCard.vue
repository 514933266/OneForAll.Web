<template>
  <div class="user-card-box">
    <el-image :src="user.IconUrl" @click="toPersonalPage" class="user-icon">
      <div slot="error" class="image-slot">
        <img src="../../../assets/img/user-icon.png" />
      </div>
    </el-image>
    <label class="user-name">{{user.Name}}</label>
    <el-dropdown>
      <el-button class="el-dropdown-link user-btn">
        <i class="el-icon-arrow-down el-icon--right"></i>
      </el-button>
      <el-dropdown-menu slot="dropdown" class="user-card">
        <div class="card-header">
          <label>我的名片</label>
          <el-button type="text" @click="toPersonalPage">个人中心</el-button>
        </div>
        <div class="card-content">
          <el-image :src="user.IconUrl">
            <div slot="error" class="image-slot">
              <img src="../../../assets/img/user-icon.png" />
            </div>
          </el-image>
          <ul class="user-info">
            <li>
              <font-awesome-icon fas icon="building"></font-awesome-icon><label>{{user.TenantName}}</label>
            </li>
            <li>
              <font-awesome-icon fas icon="user"></font-awesome-icon><label>{{user.Name}}</label>
              <label class="ofa-text-regular">&nbsp;({{user.UserName}})</label>
            </li>
            <li>
              <font-awesome-icon fas icon="signature"></font-awesome-icon>
              <label v-if="user.Signature">{{user.Signature}}</label>
              <label v-else class="ofa-text-remark">暂时还没有签名，快去个人中心写一个吧~</label>
            </li>
          </ul>
        </div>
        <div class="card-bottom">
          <el-button plain type="primary" @click="logout" size="small">
            <font-awesome-icon fas icon="power-off"></font-awesome-icon>&nbsp;{{logouting ? '安全退出中...' : '退出登录'}}
          </el-button>
        </div>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
import API from '../../../apis/base-api'
import { LOGIN, PERSONAL } from '../../../router/base-router'
import { CLEAR_LOGIN, SET_USER, SET_TENANT } from '../../../store/mutation-types'

// 菜单搜索
export default {
  name: 'UserCard',
  data () {
    return {
      logouting: false // 退出中
    }
  },
  computed: {
    user () {
      return this.$store.state.user
    },
    domain () {
      return this.$root.getApiDomain(API.KEY)
    }
  },
  methods: {
    getUser () {
      const url = this.$root.getApi(API.KEY, API.PERSONAL.URL)
      this.axios.get(url)
        .then(response => {
          this.$store.commit(SET_USER, { ...response, IconUrl: this.domain + response.IconUrl })
          this.$store.commit(SET_TENANT, {
            Id: response.TenantId,
            Name: response.TenantName
          })
        })
    },
    logout () {
      if (!this.logouting) {
        this.logouting = true
        this.$store.commit(CLEAR_LOGIN)
        const url = this.$root.getApi(API.KEY, API.PERSONAL.URL)
        this.axios.delete(url)
        this.$root.navigate(LOGIN)
        this.logouting = false
      }
    },
    toPersonalPage () {
      this.$root.navigate(PERSONAL)
    }
  },
  created () {
    this.getUser()
  }
}
</script>

<style lang="scss" scoped>
.user-card-box {
  display: flex;
  align-items: center;
}

.user-name {
    color: #2e3543;
    margin-left: 4px;
}

.user-icon {
  margin-left: 18px;
  height: 36px;
  width: 36px;
  border-radius: 50%;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
  }
}

.user-btn {
  padding: 0 10px 0 6px;
  height: 100%;
  border: none;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
}

.user-card {
  width: 400px;
  font-size: 0.75rem;

  .card-header {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #ebeef5;
    align-items: center;
    padding: 0 10px;
  }

  .card-content {
    display: flex;
    padding: 10px;

    .el-image {
      margin-right: 15px;
      height: 25%;
      width: 25%;
      border-radius: 50%;
      border: 1px solid #ebeef5;
      vertical-align: middle;

      img {
        width: 100%;
        height: 100%;
      }
    }

    .user-info {
      li {
        list-style: none;
        padding-top: 0.75rem;
      }

      svg {
        margin-right: 10px;
        color: #888;
      }
    }
  }

  .card-bottom {
    border-top: 1px solid #ebeef5;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: right;
  }
}
</style>
