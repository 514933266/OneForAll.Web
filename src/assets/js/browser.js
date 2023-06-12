'use strict'
/* eslint-disable */
var userAgent = navigator.userAgent.toLowerCase()
var versionConfig = {
  ie: 9,
  firefox: 21,
  opera: 15,
  chrome: 23,
  safari: 6
}

function GetBrowser () {
  var browser = {
    userAgent: userAgent,
    trident: /(msie\s|trident.*rv:)([\w.]+)/.test(userAgent), // IE内核
    chrome: (userAgent.indexOf('chrome/') > -1), // chrome内核
    mac: (userAgent.indexOf('macintosh') > -1), // 否是运行在mac平台下
    quirks: (document.compatMode === 'BackCompat'), // “怪异模式”
    gecko: userAgent.indexOf('gecko') > -1 && userAgent.indexOf('firefox') > -1, // 火狐内核
    presto: userAgent.indexOf('presto') > -1, // opera内核
    mobile: /Android|webOS|iPhone|iPod|BlackBerry|iPad/i.test(userAgent), // 是否为移动终端
    language: (navigator.browserLanguage || navigator.language).toLowerCase(),
    system: userAgent.match(/\b(windows|win32|macintosh|mac os x|adobeair|linux|unix)\b/) ? RegExp.$1 : '0'
  }
  // 移动终端
  if (browser.mobile) {
    browser.ios = !!userAgent.match(/\(i[^]+( u)? cpu.]+mac os x/), //ios终端
      browser.android = userAgent.indexOf('android') > -1 || userAgent.indexOf('linux') > -1, // android终端或者uc浏览器
      browser.iPhone = userAgent.indexOf('iphone') > -1 || userAgent.indexOf('mac') > -1, // 是否为iPhone或者QQHD浏览器
      browser.iPad = userAgent.indexOf('ipad') > -1, // 是否iPad
      browser.webApp = userAgent.indexOf('safari') === -1 // 是否web应该程序，没有头部与底部
  }
  // 内核版本、浏览器壳、浏览器版本
  if (browser.trident) {
    browser.version = parseInt(userAgent.match(/(msie\s|trident.*rv:)([\w.]+)/) ? RegExp.$2 : '0')
    browser.coreVersion = parseInt(userAgent.match(/(trident)[\/:\s]([\w.]+)/) ? RegExp.$2 : '0')
  } else if (browser.gecko) {
    browser.version = parseInt(userAgent.match(/(firefox\/|rv:)([\w.]+)/) ? RegExp.$2 : '0')
    browser.coreVersion = parseInt(userAgent.match(/(gecko)[\/:\s]([\w.]+)/) ? RegExp.$2 : '0')
  } else if (browser.chrome) {
    browser.version = parseInt(userAgent.match(/(chrome\/|safari\/|opera\/|opr\/)([\w.]+)/) ? RegExp.$2 : '0')
    browser.coreVersion = parseInt(userAgent.match(/chrome\/([\w.]+)/) ? RegExp.$1 : '0')
  } else if (browser.presto) {
    browser.version = parseInt(userAgent.match(/(opera\/)([\w.]+)/) ? RegExp.$2 : '0')
    browser.coreVersion = parseInt(userAgent.match(/chrome\/([\w.]+)/) ? RegExp.$1 : '0')
  }
  browser.validateVersion = function (config) {
    if (!config) config = versionConfig
    if (browser.trident) {
      return config.ie <= browser.version
    } else if (browser.gecko) {
      return config.opera <= browser.version || config.firefox <= browser.version
    } else if (browser.chrome) {
      return config.opera <= browser.version || config.firefox <= browser.version || config.chrome <= browser.version || config.safari <= browser.version
    } else if (browser.presto) {
      return config.opera <= browser.version
    } else {
      return browser.mobile
    }
  }
  return browser
}

window.browser = GetBrowser()