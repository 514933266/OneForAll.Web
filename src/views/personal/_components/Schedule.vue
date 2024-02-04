<template>
  <div class="schedule-box">
    <div class="schedule-box-top">
      <div class="schedule-box-top-left">
        <img src="./../../../assets/img/Group.png" alt="">
        <span>日程安排</span>
      </div>
      <div class="schedule-tab">
        <div @click="activeNum=1" :class="{act:activeNum==1}">
          <img src="./../../../assets/img/calendar-fill1.svg" alt="" v-if="activeNum==1">
          <img src="./../../../assets/img/calendar-fill.svg" alt="" v-else>
        </div>
        <div @click="activeNum=2" :class="{act:activeNum==2}">
          <img src="./../../../assets/img/database-fill1.svg" alt="" v-if="activeNum==2">
          <img src="./../../../assets/img/database-fill.svg" alt="" v-else>
        </div>
      </div>
    </div>
    <div v-show="activeNum==1" class="calendar-box">
      <el-calendar v-model="entity.SettingDay">
        <template slot="dateCell" slot-scope="{date, data}">
          <el-dropdown placement="bottom" trigger="click" :class="getDayClass(data.day)">
            <div class="date-box" @click="changeDate(data.day)">
              <div>{{ data.day.split('-')[2] }}</div>
              <div v-if="checkData(data.day)" class="date-yuan"></div>
            </div>
            <el-dropdown-menu slot="dropdown">
              <div class="menu-item-box">
                <div class="menu-item-box-title">
                  <img src="./../../../assets/img/read-fill.svg" alt="">
                  <span>备注内容</span>
                </div>
                <el-input show-word-limit type="textarea" placeholder="请输入提醒内容" v-model="entity.Content"
                  class="textarea-input" maxlength="20"></el-input>
                <div class="menu-item-box-title1">
                  <img src="./../../../assets/img/sound-fill.svg" alt="">
                  <span>提醒方式</span>
                </div>
                <el-radio-group v-model="entity.NotifyTimeType">
                  <el-radio :label="0">提前3天提醒</el-radio>
                  <el-radio :label="1">提前1天提醒</el-radio>
                  <el-radio :label="99">提前<el-input v-model="entity.NotifyTimeSpan" style="width:40px" class="num-input"
                      size="mini"></el-input>小时提醒</el-radio>
                </el-radio-group>
                <div class="type-box">
                  <el-checkbox-group v-model="entity.NotificationTypes" size="small">
                    <el-checkbox v-for="item in notificationTypes" :key="item.value" :label="item.value">
                      {{ item.label }}</el-checkbox>
                  </el-checkbox-group>
                </div>
                <div class="menu-item-box-bottom">
                  <div class="menu-item-box-bottom-left">
                    <img src="./../../../assets/img/info-circle.svg" alt="">
                    <span>微信提醒需要关注</span>
                    <span @click="dialogVisible=true">公众号</span>
                    <span>并发送 绑定账号:账号</span>
                  </div>
                  <div>
                    <el-button type="primary" @click="add" size="small">确定</el-button>
                  </div>
                </div>
                <el-dialog title="微信扫码关注" :visible.sync="dialogVisible" width="318px" center class="ewm-dialog"
                  :modal="false">
                  <div class="ewm-box-div">
                    <div class="ewm-box">
                      <img src="./../../../assets/img/wxgzh-qrcode.jpg" alt="">
                    </div>
                    <div>蜂窝云企</div>
                  </div>
                </el-dialog>
              </div>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-calendar>
    </div>
    <!-- 提醒 -->
    <div v-show="activeNum==2">
      <div>
        <div class="date-top">
          <span>{{new Date(date).toString('yyyy年MM月')}}</span>
          <span>{{list.length}}条提醒</span>
        </div>
        <div v-for="item in list" :key="item.Id" class="child-box">
          <div class="left-img" style="background: #FFF3DE;">
            <img src="./../../../assets/img/youjian.svg" alt="">
          </div>
          <div class="center-box">
            <div class="center-box-top">
              <span class="center-box-date">{{ new Date(item.SettingDate).toString('MM月dd日') }}</span>
              <span
                class="center-box-day">{{ item.IsClosed ? '已关闭' : ('预计在' + new Date(item.NotifyTime).toString('yyyy-MM-dd') + '提醒') }}</span>
              <img src="./../../../assets/img/bell-fill.svg" alt="" v-if="!item.IsClosed" class="bell-img">
            </div>
            <div class="center-box-bottom">
              <img src="./../../../assets/img/edit.svg" alt="">
              <span>{{ item.Content }}</span>
            </div>
          </div>
          <el-dropdown v-if="!item.IsClosed" trigger="click" placement="bottom-start">
            <img src="./../../../assets/img/mao.svg" alt="" class="mao-img">
            <el-dropdown-menu slot="dropdown" class="dropdown-back">
              <div class="menu-box">
                <div @click="del(item)" class="ofa-text-danger">删除</div>
                <div @click="close(item)">关闭</div>
              </div>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import API from '../../../apis/oa-api'
import { NOTIFICATION_TYPE } from '../../../assets/js/oa-const'

// 个人日程
export default {
  name: 'PersonalSchedule',
  data () {
    return {
      notificationTypes: NOTIFICATION_TYPE,
      dialogVisible: false, // 公众号弹窗显示
      date: new Date(), // 当前日期
      activeNum: 1, // 激活的标签
      entity: { SettingDay: new Date(), NotificationTypes: [99], NotifyTimeSpan: 0 }, // 当前日程通知实体
      list: [], // 日程列表
      days: [] // 日程日期列表
    }
  },
  watch: {
    activeNum (val) {
      if (val === 1) {
        this.get()
      }
    }
  },
  methods: {
    init () {
      this.get()
    },
    get () {
      const date = new Date()
      const url = this.$root.getApi(API.KEY, API.PERSONAL_SCHEDULE.DATE(date))
      this.axios.get(url).then(response => {
        this.list = response
        this.days = response.map(m => { return m.SettingDate })
      })
    },
    add () {
      const url = this.$root.getApi(API.KEY, API.PERSONAL_SCHEDULE.URL)
      this.axios.post(url, this.entity).then(response => {
        if (response.Status) {
          this.get()
        }
      })
    },
    del (entity) {
      const url = this.$root.getApi(API.KEY, API.PERSONAL_SCHEDULE.BATCH_DELETE)
      this.axios.post(url, [entity.Id]).then(response => {
        if (response.Status) {
          this.get()
        }
      })
    },
    close (entity) {
      const url = this.$root.getApi(API.KEY, API.PERSONAL_SCHEDULE.CLOSE(entity.Id))
      this.axios.patch(url).then(response => {
        if (response.Status) {
          this.get()
        }
      })
    },
    checkData (day) {
      return this.list.findIndex(w => new Date(w.SettingDate).toString('yyyy-MM-dd') === day) > -1
    },
    getDayClass (day) {
      const valid = new Date().toString('yyyy-MM-dd') <= new Date(day).toString('yyyy-MM-dd')
      return valid === true ? '' : 'ofa-text-grey'
    },
    changeDate (day) {
      const data = this.list.find(w => new Date(w.SettingDate).toString('yyyy-MM-dd') === day)
      if (data) {
        this.entity = data
      } else {
        this.entity = { SettingDate: day, NotificationTypes: [99], NotifyTimeSpan: 0 }
      }
    }
  },
  created () {
    this.init()
  }
}
</script>

<style  lang="scss" scoped>
.schedule-box {
  padding: 15px 0;
  &-top {
    display: flex;
    justify-content: space-between;
    &-left {
      display: flex;
      align-items: center;
      margin-left: 20px;
      img {
        width: 24px;
        height: 24px;
        margin-right: 8px;
      }
      span {
        font-size: 18px;
        font-family: PingFangSC-Medium, PingFang SC;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.85);
        line-height: 24px;
      }
    }
    &-right {
      margin-top: 9px;
      display: flex;
      align-items: center;
      margin-right: 31px;
      img {
        width: 16px;
        height: 16px;
        margin-right: 5px;
      }
      span {
        font-size: 14px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #409eff;
        line-height: 22px;
      }
    }
  }
  .schedule-tab {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 13px;
    margin-bottom: 2px;
    margin-right: 20px;
    > div {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: transparent;
      border-radius: 4px;
      margin-right: 5px;
      cursor: pointer;
      transition: all 0.5s;
    }
    .act {
      background: #e8f3ff;
    }
  }
  .date-top {
    margin-left: 22px;
    margin-bottom: 17px;
    :nth-child(1) {
      font-size: 18px;
      font-family: PingFangSC-Medium, PingFang SC;
      font-weight: 500;
      color: #354052;
      line-height: 22px;
      margin-right: 11px;
    }
    :nth-child(2) {
      font-size: 14px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #7f8fa4;
      line-height: 22px;
    }
  }
  .child-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f7f8fc;
    border-radius: 41px;
    padding: 15px 30px;
    margin: 0 20px 20px;
    .center-box {
      flex: 1;
    }
    .left-img {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      margin-right: 23px;
      img {
        width: 20px;
        height: 20px;
      }
    }
    .center-box {
      &-top {
        display: flex;
        align-items: center;
        margin-bottom: 9px;
        span {
          white-space: nowrap;
        }
      }
      &-date {
        font-size: 14px;
        font-family: PingFangSC-Medium, PingFang SC;
        font-weight: 500;
        color: #354052;
        line-height: 22px;
        margin-right: 16px;
      }
      &-day {
        font-size: 14px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #7f8fa4;
        line-height: 22px;
        margin-right: 22px;
      }
      .tag1 {
        padding: 1px 7px;
        background: #fff3de;
        border-radius: 2px;
        font-size: 14px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #ff8216;
        line-height: 22px;
      }
      .tag2 {
        padding: 1px 7px;
        background: #eae2ff;
        border-radius: 2px;
        font-size: 14px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #8253ff;
        line-height: 22px;
      }
      .tag3 {
        padding: 1px 7px;
        background: #ebfce9;
        border-radius: 2px;
        font-size: 14px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #1acf2d;
        line-height: 22px;
      }
      .tag4 {
        padding: 1px 7px;
        background: #e6eeff;
        border-radius: 2px;
        font-size: 14px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #5e93ff;
        line-height: 22px;
      }
      .tag5 {
        padding: 1px 7px;
        background: #ffefe6;
        border-radius: 2px;
        font-size: 14px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #ff6767;
        line-height: 22px;
      }
      .bell-img {
        width: 16px;
        height: 16px;
        margin-left: 11px;
      }
      &-bottom {
        display: flex;
        align-items: center;
        img {
          width: 16px;
          height: 16px;
          margin-right: 6px;
        }
        font-size: 14px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #354052;
        line-height: 22px;
      }
    }
    .mao-img {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
  }
  .calendar-box {
    margin-top: 63px;
    /deep/ .el-calendar__header {
      display: none;
    }
    /deep/ .el-calendar-table {
      table-layout: auto;
    }
    /deep/ .el-calendar-table tr td:first-child {
      border: none;
    }
    /deep/ .el-calendar-table td {
      border: none;
    }
    /deep/ .el-calendar-day {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /deep/ .el-calendar-table td.is-selected {
      background: transparent;
      position: relative;
    }
    /deep/ .el-calendar-table td.is-selected .el-calendar-day .el-dropdown {
      color: #fff;
    }
    /deep/ .el-calendar-table .el-calendar-day::before {
      content: '';
      position: absolute;
      width: 50px;
      height: 50px;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      background: transparent;
      border-radius: 50%;
      opacity: 0;
      transition: all 0.3s;
    }
    /deep/ .el-calendar-table td.is-selected .el-calendar-day::before {
      opacity: 1;
      background: #409eff;
    }
    /deep/ .el-calendar-table .el-calendar-day:hover {
      background: transparent;
    }
    /deep/ .el-calendar-table td.is-selected .el-calendar-day .date-box {
      color: #fff;
    }
    /deep/ .el-calendar-table .el-calendar-day:hover::before {
      background: #f2f8ff;
      opacity: 1;
    }
  }
  .date-box {
    position: relative;
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  .date-yuan {
    width: 8px;
    height: 8px;
    background: #409eff;
    border-radius: 50%;
  }

  .is-selected {
    .date-yuan {
      background: #fff;
    }
  }
}
.menu-box {
  padding: 0 8px;
  > div {
    box-sizing: border-box;
    width: 126px;
    padding: 12px 21px;
    border-bottom: 1px solid #e8e8e8;
    cursor: pointer;
    font-size: 14px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: #354052;
    line-height: 22px;
  }
}
.menu-box div:last-child {
  border-bottom: 1px solid transparent;
}
.menu-item-box {
  padding: 10px 20px 15px;
  &-title {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
    line-height: 24px;
    margin-bottom: 10px;
    img {
      width: 20px;
      height: 20px;
      margin-right: 11px;
    }
  }
  .textarea-input {
    margin-bottom: 10px;
    /deep/ .el-textarea__inner {
      width: 465px;
      border: none;
      background: #f5f7fa;
      border-radius: 4px;
      padding: 10px 15px;
    }
  }
  &-title1 {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
    line-height: 24px;
    margin-bottom: 5px;
    img {
      width: 20px;
      height: 20px;
      margin-right: 11px;
    }
  }
  .num-input {
    width: 43px;
    margin: 0 10px;
  }
  .type-box {
    margin-top: 20px;
    margin-bottom: 25px;
    display: flex;
    align-items: center;
    gap: 12px;
    .act {
      border: 1px solid #409eff;
      color: #409eff;
    }
  }
  .menu-item-box-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    > div {
      display: flex;
      align-items: center;
      img {
        width: 16px;
        height: 16px;
        margin-right: 5px;
      }
    }
    &-left {
      font-size: 14px;
      font-weight: 400;
      line-height: 22px;
      :nth-child(2) {
        color: #7f8fa4;
        margin-right: 5px;
      }
      :nth-child(3) {
        color: #409eff;
        cursor: pointer;
      }
    }
  }
}
/deep/ .ewm-dialog .el-dialog {
  box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.15);
  border-radius: 10px;
}
.ewm-box-div {
  text-align: center;
  font-size: 14px;
  font-weight: 400;
  color: #333333;
  line-height: 21px;
}
.ewm-box {
  margin: 0 auto;
  box-sizing: border-box;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #dfdfdf;
  margin-bottom: 23px;
  > div {
    width: 100%;
    height: 100%;
    background: #000;
  }
}
</style>
