<template>
  <div>
    <div class="dynamic-top">
      <img src="./../../../assets/img/huoyue.png" alt="">
      <span>工作活跃度</span>
    </div>
    <div style="height: 236px" ref="chartColumn"></div>
  </div>
</template>

<script>
import LOG_API from '../../../apis/syslog-api'
import echarts from 'echarts'

// 用户活跃度
export default {
  name: 'PersonalLiveness',
  data () {
    return {
      liveness: { Dates: [] } // 活跃值
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
    getLiveness () {
      const date = this.$moment().subtract(7, 'days').format('yyyy-MM-DD')
      const url = this.$root.getApi(LOG_API.KEY, LOG_API.LIVENESS.URL)
      this.axios.get(url, {
        params: {
          startTime: date,
          endTime: new Date()
        }
      }).then(response => {
        this.liveness = response
        this.$nextTick(() => {
          this.initChart()
        })
      })
    }
  },
  created () {
    this.getLiveness()
  }
}
</script>

<style lang="scss" scoped>
.dynamic-top {
  display: flex;
  align-items: center;
  margin: 0 19px 0 14px;
  padding: 16px 0 15px;
  img {
    width: 24px;
    height: 24px;
    margin-right: 9px;
  }
  span {
    font-size: 18px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
    line-height: 24px;
  }
}
</style>
