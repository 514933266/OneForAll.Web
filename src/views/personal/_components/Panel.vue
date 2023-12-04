<template>
  <div class="panel-box">
    <div class="panel-box-top">
      <div class="panel-box-top-left">
        <div class="avatar-box">
          <crop-uploader round :imgUrl="user.IconUrl" @upload="uploadHeader" title="裁剪头像"></crop-uploader>
          <div class="image-wrapper">
            <img class="thumbnail" src="./../../../assets/img/camera.svg" />
          </div>
        </div>
        <div class="section-text">
          <div class="section-text-name">
            <label class="ofa-text-title">{{ user.Name }}({{user.UserName }})</label>
          </div>
          <div class="section-text-desc">
            <img src="./../../../assets/img/edit.svg" @click="toInfoPage" />
            <label class="ofa-text-label signature-label">签名：</label>
            <label class="ofa-text-title">{{ user.Signature }}</label>
          </div>
        </div>
      </div>
      <div class="right-section">
        <el-button type="text" @click="toPasswordPage">
          <font-awesome-icon fas icon="clock"></font-awesome-icon>&nbsp;个人考勤
        </el-button>
        <el-dropdown trigger="click" placement="bottom">
          <el-button type="text">
            <font-awesome-icon fas icon="calendar"></font-awesome-icon>&nbsp;人事历程
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <div class="time-box">
              <el-timeline>
                <el-timeline-item v-for="(item, index) in personalHistories" :key="index" type="primary">
                  <div class="primary-box">
                    <span>{{item.PersonJob}}</span>
                  </div>
                  <div class="success-box">
                    <span>{{new Date(item.CreateTime).toString('yyyy-MM-dd HH:mm')}}</span>
                    <span>{{item.Remark}}</span>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-dropdown-menu>
        </el-dropdown>
        <el-button type="text" @click="toPersonalFilePage">
          <font-awesome-icon fas icon="id-badge"></font-awesome-icon>&nbsp;OA档案
        </el-button>
        <el-button type="text" @click="toPasswordPage">
          <font-awesome-icon fas icon="lock"></font-awesome-icon>&nbsp;修改密码
        </el-button>
      </div>
    </div>
    <div class="firm-box">
      <div class="firm-box-left">
        <div>
          <div class="mb8">工号：<label class="ofa-text-title">{{ personalFile.WorkNumber }}</label></div>
          <div class="mb8">状态：<label class="ofa-text-title">{{ isBindFile ? personalFile.EmployeeStatus: '' }}</label>
          </div>
        </div>
        <div>
          <div class="mb8">所属部门：<label class="ofa-text-title">{{ personalFile.team }}</label>
          </div>
          <div class="mb8">入职时间：<label
              class="ofa-text-title">{{ isBindFile ? new Date(personalFile.EntryDate).toString('yyyy-MM-dd') : '' }}</label>
          </div>
        </div>
        <div class="mb8">职级：<label class="ofa-text-title">{{ personalFile.Job }}</label></div>
      </div>
      <div class="firm-box-right">
        <div class="firm-box-right-div">
          <div class="text-top ofa-text-grey">入职天数</div>
          <div class="text-num ofa-text-title">{{ personalFile.joinDay }}</div>
        </div>
        <div class="box-line"></div>
        <div class="firm-box-right-div">
          <div class="text-top ofa-text-grey">司龄</div>
          <div class="text-num ofa-text-title">{{ personalFile.JoinAge }}</div>
        </div>
        <div class="box-line"></div>
        <div class="firm-box-right-div">
          <div class="text-top ofa-text-grey">工作年限</div>
          <div class="text-num ofa-text-title">{{ personalFile.workAge }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import API from '../../../apis/base-api'
import OA_API from '../../../apis/oa-api'
import { PERSONAL_FILE, PERSONAL_INFO, PERSONAL_PASSWORD } from '../../../router/base-router'
import { SET_USER } from '../../../store/mutation-types'

// 个人OA面板
export default {
  name: 'PersonalPanel',
  data () {
    return {
      isBindFile: false, // 已绑定档案
      personalFile: {}, // OA档案
      entity: {}, // 用户信息
      personalHistories: [] // 人事档案
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
    uploadHeader (upload) {
      const formData = new FormData()
      const url = this.$root.getApi(API.KEY, API.PERSONAL.HEADER)
      formData.append('files', upload.file, upload.filename)
      this.axios.post(url, formData)
        .then(response => {
          if (response.Status) {
            this.$store.commit(SET_USER, { ...this.user, IconUrl: `${this.domain}${response.Data.Result.Url}` })
          }
        })
    },
    getPersonalFile () {
      const url = this.$root.getApi(OA_API.KEY, OA_API.PERSONAL_FILE.URL)
      this.axios.get(url).then(response => {
        this.personalFile = { ...response, joinDay: this.getJoinsDays(response), workAge: this.getWorkAge(response), team: this.getTeamName(response) }
        if (response.Id !== this.$store.state.guid) {
          this.isBindFile = true
        }
      })
    },
    getJoinsDays (personalFile) {
      if (personalFile.EntryDate) {
        var date1 = new Date()
        var date2 = new Date(personalFile.EntryDate)
        var timeDiff = Math.abs(date2.getTime() - date1.getTime())
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))
        return diffDays
      }
      return 0
    },
    getWorkAge (personalFile) {
      if (personalFile.ExtendInformations) {
        return personalFile.ExtendInformations.find(w => w.Name === 'WorkAge')?.Value
      }
      return 0
    },
    getTeamName (personalFile) {
      if (personalFile.ExtendInformations) {
        return personalFile.ExtendInformations.find(w => w.Name === 'Team')?.Value
      }
      return 0
    },
    bindFile (key) {
      const url = this.$root.getApi(OA_API.KEY, OA_API.PERSONAL_FILE.URL)
      this.axios.post(url, { key: key }).then(response => {
        if (response.Status) {
          this.getPersonalFile()
        }
      })
    },
    getPersonalHistories () {
      const url = this.$root.getApi(OA_API.KEY, OA_API.PERSONAL_FILE.HISTORY)
      this.axios.get(url).then(response => {
        this.personalHistories = response
      })
    },
    toInfoPage () {
      this.$root.navigate(PERSONAL_INFO)
    },
    toPasswordPage () {
      this.$root.navigate(PERSONAL_PASSWORD)
    },
    toPersonalFilePage () {
      if (!this.isBindFile) {
        this.$prompt('账号未绑定档案，请输入身份证或手机号码查找绑定', '绑定个人档案', {
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        }).then(({ value }) => {
          this.bindFile(value)
        })
      } else {
        this.$root.navigate(PERSONAL_FILE)
      }
    }
  },
  created () {
    this.getPersonalFile()
    this.getPersonalHistories()
  }
}
</script>

<style lang="scss" scoped>
.panel-box {
  padding: 20px 38px 29px 26px;
  &-top {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 21px;
    &-left {
      display: flex;
    }
  }
  .avatar-box {
    position: relative;
    height: 80px;
    width: 80px;

    .image-wrapper {
      background-color: rgba(229, 239, 255, 1);
      border-radius: 50%;
      height: 22px;
      width: 22px;
      position: absolute;
      right: 0;
      bottom: 0;
      .thumbnail {
        width: 16px;
        height: 16px;
        margin: 3px 0 0 3px;
      }
  }

  /deep/ .crop-uploader {
    width: 80px;
    height: 80px;
  }
}
  .section-text {
    margin: 6px 0 0 21px;
    &-name {
      font-size: 18px;
      font-weight: 500;
    }
    &-desc {
      display: flex;
      align-items: center;
      margin-top: 9px;
      width: 400px;
      img {
        width: 16px;
        height: 16px;
        margin-right: 7px;
        cursor: pointer;
      }

      /deep/ input {
        border: none;
        border-bottom: 1px solid;
      }
    }
  }
  .right-section {
    display: flex;
    gap: 40px;
    margin-bottom: 21px;
    height: 22px;
    div {
      display: flex;
      > img {
        width: 16px;
        height: 16px;
        margin-right: 6px;
        margin-top: 3px;
      }
      > span {
        font-size: 14px;
        font-weight: 400;
        color: #409eff;
        line-height: 22px;
        cursor: pointer;
        flex-shrink: 0;
      }
    }
  }
  .firm-box {
    display: flex;
    flex-wrap: wrap;
    gap: 40px;
    &-left {
      display: flex;
      flex-wrap: wrap;
      flex: 2.5;
      gap: 15%;
      background-color: rgba(247, 248, 252, 1);
      border-radius: 8px;
      padding: 20px 23px 14px 23px;
      font-size: 14px;
      font-weight: 400;
      color: #7f8fa4;
      line-height: 22px;
      white-space: nowrap;
      .mb8 {
        margin-bottom: 8px;
      }
    }
    &-right {
      display: flex;
      flex-wrap: nowrap;
      flex: 1;
      justify-content: flex-end;
      margin-right: 20px;
      &-div {
        text-align: right;
        margin-top: 10px;
      }
      .box-line {
        background-color: rgba(233, 233, 233, 1);
        width: 1px;
        height: 40px;
        margin: 22px 40px 0 22px;
      }
      .text-top {
        font-size: 14px;
        font-weight: 400;
        line-height: 22px;
        margin-bottom: 5px;
        white-space: nowrap;
      }
      .text-num {
        font-size: 30px;
        line-height: 38px;
        white-space: nowrap;
      }
    }
  }
}
.time-box {
  padding: 25px 50px 0;
  img {
    width: 16px;
    height: 16px;
    margin-right: 6px;
  }
  .primary-box {
    display: flex;
    align-items: center;
    span {
      font-size: 14px;
      font-weight: 500;
      color: #354052;
      line-height: 22px;
    }
  }
  .success-box {
    font-size: 14px;
    font-weight: 400;
    color: #7f8fa4;
    line-height: 22px;
    :nth-child(1) {
      margin-right: 12px;
    }
    :nth-child(2) {
      color: #354052;
      margin-right: 5px;
    }
    :nth-child(3) {
      color: #409eff;
    }
  }
  /deep/ .el-timeline-item__node--normal {
    left: 0px;
    width: 10px;
    height: 10px;
  }
  /deep/ .el-timeline-item__node--normal.el-timeline-item__node--success {
    box-sizing: border-box;
    left: 0px;
    width: 10px;
    height: 10px;
    background: #ffffff;
    border: 2px solid #409eff;
  }
}
</style>
