/* eslint-disable */
Date.prototype.toString = function (formatString) {
  /**
     * 兼容性：ie5+
     * default
     * yyyy-MM-dd HH:mm:ss  => 2016-09-01 01:11:00
     *
     * other
     * yyyy-M-d h:m:s       => 2016-9-1 1:11:0
     * y-M-d h:m:s          => 16-9-1 1:11:0
     * yyyy.M.d h:m:s       => 2016.9.1 1:11:0
     * d/M/yyyy             => 1/9/2016
     * yyyyMMddhhmmss            => 20160901011100
     * yyyyMdhms            => 2016911110
     * yy年M月d日 h点m分s秒       => 16年9月1日 1点11分0秒
     *
     */
  var o = {
    Y: this.getFullYear(),
    M: this.getMonth() + 1,
    D: this.getDate(),
    H: this.getHours(),
    m: this.getMinutes(),
    S: this.getSeconds()
  }
  var reg = new RegExp('([Yy]+)|(M+)|([Dd]+)|([Hh]+)|(m+)|([Ss]+)', 'g')
  if (formatString) {
    return formatString.replace(reg, function (v) {
      var old = v
      if (/m/.test(v)) {
        if (o.m < 10) {
          old = '0' + o.m
        } else {
          old = o.m
        }
      } else if (/y/i.test(v)) {
        var y = '' + o.Y
        var le = y.length - (v.length === 1 ? 2 : v.length)
        old = y.substring(y.length, le)
      } else {
        var key = v.toUpperCase().substr(0, 1)
        old = o[key]
        if (o[key] < 10) {
          old = '0' + old
        }
      }
      return old
    })
  } else {
    return this.toString('yyyy-MM-dd HH:mm:ss')
  }
}
