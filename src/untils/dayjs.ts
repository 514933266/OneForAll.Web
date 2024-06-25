import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import weekday from 'dayjs/plugin/weekday'
import isToday from 'dayjs/plugin/isToday'
import isBetween from 'dayjs/plugin/isBetween'
import 'dayjs/locale/zh-cn'
// 使用 UTC 模式来解析和展示时间
dayjs.extend(utc)
// 时区
dayjs.extend(timezone)
// 设置默认时区
dayjs.tz.setDefault('PRC')
// 语言包
dayjs.locale('zh-cn')
// 获取或设置当前语言的星期
dayjs.extend(weekday)
// 判断当前 Day.js 对象是否是今天
dayjs.extend(isToday)
// 判断是否两者之间
dayjs.extend(isBetween)

export default dayjs 
