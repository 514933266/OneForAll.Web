<template>
  <div>
    <div class="welcome-top">
      <div class="top-left">
        <div class="company-name ofa-text-title">{{tenant.Name}}</div>
        <div class="company-hello ofa-text-grey">
          {{today.hello()}}，{{user.Name}}，今天是{{today.toString('yyyy年MM月dd日')}}&nbsp;{{today.toWeek()}}</div>
      </div>
      <div class="top-right">
        <div class="right-item ">
          <img src="./../../assets/img/onjob.svg" alt="">
          <div>
            <div class="item-tag ofa-text-grey">在职员工</div>
            <div class="item-num">{{statistics.TotalOnJobCount}}</div>
          </div>
        </div>
        <div class="right-item ">
          <img src="./../../assets/img/alljob.svg" alt="">
          <div>
            <div class="item-tag ofa-text-grey">全职员工</div>
            <div class="item-num">{{statistics.NormalCount}}</div>
          </div>
        </div>
        <div class="right-item ">
          <img src="./../../assets/img/staff.svg" alt="">
          <div>
            <div class="item-tag ofa-text-grey">部门成员</div>
            <div class="item-num">{{statistics.TeamCount}}</div>
          </div>
        </div>
        <div class="right-item">
          <img src="./../../assets/img/group.svg" alt="">
          <div>
            <div class="item-tag ofa-text-grey">同组成员</div>
            <div class="item-num">{{statistics.GroupCount}}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="welcome-center">
      <div class="center-item">
        <div class="center-title">
          <span class="ofa-text-grey">待办事项</span>
          <img src="./../../assets/img/todo.svg" alt="">
        </div>
        <div class="center-num">
          <span class="num-text">0</span>
          <span class="num-type">项</span>
        </div>
      </div>
      <div class="center-item">
        <div class="center-title">
          <span class="ofa-text-grey">任务日程</span>
          <img src="./../../assets/img/task.svg" alt="">
        </div>
        <div class="center-num">
          <span class="num-text">0</span>
          <span class="num-type">个</span>
        </div>
      </div>
      <div class="center-item">
        <div class="center-title">
          <span class="ofa-text-grey">备忘录</span>
          <img src="./../../assets/img/memorandum.svg" alt="">
        </div>
        <div class="center-num">
          <span class="num-text">0</span>
          <span class="num-type">个</span>
        </div>
      </div>
      <div class="center-item">
        <div class="center-title">
          <span class="ofa-text-grey">我的出勤</span>
          <img src="./../../assets/img/atten.svg" alt="">
        </div>
        <div class="center-num">
          <span class="num-text">0</span>
          <span class="num-type">天</span>
        </div>
      </div>
    </div>
    <div class="welcome-bottom">
      <div class="left-bottom">
        <div class="bottom-header">
          <div class="left-header">
            <span class="left-header-title">工作活跃度</span>
            <span class="left-header-desc ofa-text-grey">（近{{livenessDateTypes[livenessDateIndex]}}）</span>
          </div>
          <div class="right-header">
            <div v-for="(item,index) in livenessDateTypes" :key="item" :class="{active:livenessDateIndex===index}" @click="changeLivenessType(index)">
              {{item}}</div>
          </div>
        </div>
        <div style="height: 406px" ref="chartColumn"></div>
      </div>
      <div class="right-bottom">
        <div class="bottom-header">
          <div class="left-header">
            <span class="left-header-title">动态</span>
          </div>
          <div class="right-header">
            <div v-for="(item,index) in activityTypes" :key="item" :class="{active:activityTypeIndex===index}" @click="activityTypeIndex=index">
              {{item}}
            </div>
          </div>
        </div>
        <div v-if="activityTypeIndex==0" class="transition-box">
          <div class="activityTypeIndex-item" v-for="item in persons" :key="item.Id">
            <el-avatar class="pic-box" shape="square" :size="50" :src="(domain + item.IconUrl)">
              <font-awesome-icon fas icon="image"></font-awesome-icon>
            </el-avatar>
            <div class="activityTypeIndex-item-right-box">
              <div class="activityTypeIndex-item-right">
                <span class="pople-name">{{item.Name}}</span>
                <div class="pople-name-right">
                  <div :class="['pople-name-right-tag', getTypeColor(item.EmployeeType)]"></div>
                  <div class="pople-name">{{item.EmployeeType ? item.EmployeeType : '全职'}}</div>
                </div>
              </div>
              <div class="activityTypeIndex-item-right pople-name-time">
                <div>{{item.Job}}</div>
                <div>{{new Date(item.EntryDate).toString('yyyy-MM-dd')}}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="activityTypeIndex==1" class="transition-box">
          <el-timeline>
            <el-timeline-item v-for="(activity, index) in loginInfos" :key="index" type="primary" :timestamp="activity.CreateTime">
              <span class="line-name">{{activity.CreatorName}}&nbsp;<label class="ofa-text-remark">({{activity.UserName}})</label></span>
              <span class="line-name ofa-text-success">登录了系统</span>
            </el-timeline-item>
          </el-timeline>
        </div>
        <div v-if="activityTypeIndex==2" class="transition-box">
          <el-timeline>
            <el-timeline-item v-for="(activity, index) in activity" :key="index" :timestamp="activity.timestamp">
              <span class="line-name">{{activity.name}}</span>
              <span class="line-name" style="color:#A7ABBA">{{activity.act}}</span>
              <span class="line-name">{{activity.content}}</span>
            </el-timeline-item>
          </el-timeline>
        </div>
        <div v-if="activityTypeIndex==3" class="transition-box">
          <el-timeline>
            <el-timeline-item v-for="(activity, index) in activityThree" :key="index" :timestamp="activity.timestamp">
              <div class="three-line">
                <div class="pic-box"></div>
                <div class="mr5">
                  <div class="line-name">{{activity.name}}</div>
                  <div class="line-desc ">{{activity.content}}</div>
                </div>
                <span class="mr5 line-desc ">在</span>
                <span class="mr5 line-name">提交代码</span>
                <span class="line-name">@我</span>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import OA_API from '../../apis/oa-api'
import LOG_API from '../../apis/syslog-api'
import { WELCOME } from '../../router/base-router'
import { PERSON_EMPLOYEE_TYPE } from '../../assets/js/oa-const'
import echarts from 'echarts'

// 首页
export default {
  name: WELCOME.name,
  data () {
    return {
      employeeTypes: PERSON_EMPLOYEE_TYPE,
      livenessDateTypes: ['3日', '7日', '15日'],
      activityTypes: ['新同事', '登录', '活动', '@我'],
      livenessLoading: false, // 加载活跃度中
      livenessDateIndex: 0,
      activityTypeIndex: 0,
      statistics: {}, // 人员数量统计
      persons: [], // 新入职员工列表
      liveness: { Dates: [] }, // 活跃值
      activities: [],
      activity: [],
      activityThree: [],
      loginInfos: [] // 登录信息
    }
  },
  computed: {
    user () {
      return this.$store.state.user
    },
    tenant () {
      return this.$store.state.tenant
    },
    domain () {
      return this.$root.getApiDomain(OA_API.KEY)
    },
    today () {
      return new Date()
    }
  },
  methods: {
    initChart () {
      const myEchart = echarts.init(this.$refs.chartColumn)
      const option = {
        legend: {
          itemWidth: 15,
          itemHeight: 10,
          itemGap: 12,
          left: '3%',
          top: '3%',
          textStyle: {
            color: '#8C8C8C'
          },
          data: [{
            icon: 'roundRect',
            name: '我的'
          },
          {
            icon: 'roundRect',
            name: '同事'
          }
          ]
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'none'
          },
          backgroundColor: '#909399',
          borderRadius: 8
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          boundaryGap: false, // x 轴折线图从头开始
          type: 'category',
          data: this.liveness.Dates.map(m => { return new Date(m.Date).toString('MM-dd') }),
          axisLine: {
            show: false // 不显示 x 轴轴线
          },
          axisTick: {
            show: false // 不显示 x 轴刻度
          },
          splitLine: {
            show: true, // 显示 x 轴网格线
            lineStyle: {
              type: 'dashed' // 设置 x 轴网格线为虚线
            }
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            show: false // 不显示 x 轴轴线
          },
          axisTick: {
            show: false // 不显示 x 轴刻度
          },
          splitLine: {
            show: true, // 显示 y 轴网格线
            lineStyle: {
              type: 'dashed' // 设置 y 轴网格线为虚线
            }
          }
        },
        series: [
          {
            name: '我的',
            type: 'line',
            showSymbol: false, // 是否显示圆点
            symbolSize: 7, // 圆点尺寸
            color: ['#409eff'],
            areaStyle: {
              normal: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 0.8, [
                  { offset: 0, color: '#409eff' },
                  { offset: 1, color: 'rgba(64, 158, 255, 0)' }
                ], false)
              }
            },
            data: this.liveness.Dates.map(m => { return m.Value })
          },
          {
            name: '同事',
            type: 'line',
            showSymbol: false,
            symbolSize: 7,
            color: ['#ffd966'],
            areaStyle: {
              normal: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 0.8, [
                  { offset: 0, color: '#ffd966' },
                  { offset: 1, color: 'rgba(255, 217, 102, 0)' }
                ], false)
              }
            },
            data: this.liveness.Dates.map(m => { return m.AvgValue })
          }
        ]
      }
      myEchart.setOption(option)
      window.onresize = () => {
        myEchart.resize()
      }
    },
    getNewPersons () {
      const url = this.$root.getApi(OA_API.KEY, OA_API.DASHBOARD.PERSON)
      this.axios.get(url).then(response => {
        this.persons = response
      })
    },
    getTypeColor (type) {
      const val = this.employeeTypes.find(w => w.value === type)
      if (val) return val.bgColor
      return 'ofa-bg-primary'
    },
    getStatistics () {
      const url = this.$root.getApi(OA_API.KEY, OA_API.DASHBOARD.STATISTICS)
      this.axios.get(url).then(response => {
        this.statistics = response
      })
    },
    changeLivenessType (index) {
      this.livenessDateIndex = index
      this.getLiveness()
    },
    getLiveness () {
      if (this.livenessLoading) {
        this.$message.error('正在加载数据中，请稍后...')
        return false
      }
      this.livenessLoading = true
      const seed = (this.livenessDateIndex === 0 ? 3 : this.livenessDateIndex === 1 ? 7 : 15)
      const date = this.$moment().subtract(seed, 'days').format('yyyy-MM-DD')
      const url = this.$root.getApi(LOG_API.KEY, LOG_API.LIVENESS.URL)
      this.axios.get(url, {
        params: {
          startTime: date,
          endTime: new Date()
        }
      }).then(response => {
        this.liveness = response
        this.livenessLoading = false
        this.$nextTick(() => {
          this.initChart()
        })
      })
    },
    getLogins () {
      const url = this.$root.getApi(LOG_API.KEY, LOG_API.ACTIVITY.URL)
      this.axios.get(url).then(response => {
        this.loginInfos = response
      })
    }
  },
  created () {
    this.getNewPersons()
    this.getStatistics()
    this.getLiveness()
    this.getLogins()
  }
}
</script>

<style lang="scss" scoped>
.welcome-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 30px 30px 20px;
  background: #ffffff;
  border-radius: 16px;
  margin-bottom: 28px;

  .top-left {
    margin-bottom: 10px;

    .company-name {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .company-hello {
      font-size: 14px;
    }
  }

  .top-right {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    width: 650px;

    .right-item {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 140px;
      height: 64px;
      background: #f7f8fc;
      border-radius: 8px;
      margin-bottom: 10px;

      img {
        width: 32px;
        height: 32px;
        margin-right: 20px;
      }

      .item-tag {
        font-size: 12px;
        font-weight: 500;
        line-height: 18px;
        margin-bottom: 3px;
      }

      .item-num {
        font-size: 18px;
        font-weight: 500;
        color: #2e3543;
        line-height: 23px;
      }
    }
  }
}

.welcome-center {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 20px;

  .center-item {
    width: 22%;
    min-width: 259px;
    height: 125px;
    background: #ffffff;
    border-radius: 16px;
    margin-bottom: 10px;

    .center-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 20px 30px 10px;

      img {
        width: 44px;
        height: 44px;
        margin-left: 99px;
      }

      span {
        font-size: 14px;
        font-weight: 500;
        line-height: 20px;
      }
    }

    .center-num {
      margin-left: 30px;

      .num-text {
        font-size: 24px;
        font-weight: bold;
        color: #2e3543;
        line-height: 31px;
        margin-right: 8px;
      }

      .num-type {
        font-size: 16px;
        font-weight: 500;
        color: #2e3543;
        line-height: 24px;
      }
    }
  }
}

.welcome-bottom {
  display: flex;
  flex-wrap: nowrap;
  margin-bottom: 20px;

  .left-bottom {
    flex: 1;
    background-color: #ffffff;
    border-radius: 16px;
    margin-right: 20px;
  }

  .left-bottom,
  .right-bottom {
    height: 480px;

    .bottom-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 0 20px;
      margin: 0 30px;
      border-bottom: 1px solid #f5f6fb;

      .left-header-title {
        font-size: 16px;
        font-weight: 600;
        line-height: 24px;
      }

      .left-header-desc {
        font-size: 0.85rem;
      }

      .right-header {
        display: flex;
        align-content: center;

        div {
          padding: 5px 12px;
          font-size: 14px;
          font-weight: 500;
          color: #a7abba;
          line-height: 20px;
          border-radius: 6px;
          border: 1px solid #a7abba;
          cursor: pointer;
          margin-right: 8px;
        }

        .active {
          background: #409eff;
          border: 1px solid #409eff;
          color: #fff;
        }
      }
    }
  }

  .right-bottom {
    display: flex;
    flex-direction: column;
    width: 400px;
    background-color: #fff;
    border-radius: 16px;

    .transition-box {
      box-sizing: border-box;
      height: 434px;
      padding: 10px 20px;
      overflow-y: auto;

      .activityTypeIndex-item {
        display: flex;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid #eaebec;

        .activityTypeIndex-item-right-box {
          flex: 1;
        }

        .activityTypeIndex-item-right {
          display: flex;
          align-items: center;
          justify-content: space-between;

          &.pople-name-time {
            font-size: 12px;
            font-weight: 500;
            color: #a7abba;
            line-height: 18px;
          }

          .pople-name {
            font-size: 14px;
            font-weight: 500;
            color: #2e3543;
            line-height: 20px;
          }

          .pople-name-right {
            display: flex;
            align-items: center;

            .pople-name-right-tag {
              width: 20px;
              height: 7px;
              border-radius: 10px 10px 10px 10px;
              margin-right: 6px;
            }
          }
        }
      }

      /deep/ .el-timeline-item__tail {
        top: 18px;
        height: 60%;
      }
    }

    .line-name {
      font-size: 14px;
      font-weight: 500;
      color: #2e3543;
      margin-right: 5px;
    }

    .line-desc {
      font-size: 14px;
      color: #a7abba;
    }
  }
}

.pic-box {
  width: 44px;
  height: 44px;
  margin-right: 12px;
}

.three-line {
  display: flex;
  align-items: center;

  .mr5 {
    margin-right: 5px;
  }
}
</style>
