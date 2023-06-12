/* eslint-disable */
/* ---- 字符串去空格 ---- */
String.prototype.trim = function () {
  return this.replace(/(^\s*)|(\s*$)/g, '')
}
String.prototype.trimStart = function () {
  return this.replace(/(^\s*)/g, '')
}
String.prototype.trimEnd = function () {
  return this.replace(/(\s*$)/g, '')
}
