<template>
  <div>
    <spinner v-if="loading"></spinner>
    <div v-else>
      <el-card>
        <el-page-header @back="goBack" content="消息详情">
        </el-page-header>
      </el-card>
      <el-card class="msg-card">
        <div class="title-box">
          <div class="title">{{entity.Title}}</div>
          <div class="date">{{new Date(entity.CreateTime).toString('yyyy年MM月dd日 hh:mm')}}</div>
        </div>
        <el-divider></el-divider>
        <div v-html="entity.Content"></div>
      </el-card>
    </div>
  </div>
</template>

<script>
import API from '../../apis/base-api'
import { MESSAGE_CENTER, MESSAGE_CENTER_FORM } from '../../router/base-router'

export default {
  name: MESSAGE_CENTER_FORM.name,
  data () {
    return {
      loading: false, // 加载中
      entity: {}
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => vm.init())
  },
  methods: {
    init () {
      if (!this.loading) {
        this.loading = true
        this.entity = this.$route.params
        this.read()
        this.loading = false
      }
    },
    read () {
      if (this.entity.Id) {
        const url = this.$root.getApi(API.KEY, API.PERSONAL_MESSAGE.READ)
        this.axios.patch(`${url}?isQuiet=true`, [this.entity.Id])
      }
    },
    goBack () {
      this.$root.navigate(MESSAGE_CENTER)
    }
  },
  created () {
    this.init()
  }
}
</script>

<style lang="scss" scoped>
.msg-card {
    min-height: 600px;
    margin-top: 20px;
}
.title-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    .title {
        font-size: 1.25rem;
    }

    .date {
        margin-top: 10px;
        font-size: 1rem;
    }
}
</style>
