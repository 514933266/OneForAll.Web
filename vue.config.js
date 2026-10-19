const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: config => {
    // 类型检查 worker 默认堆上限 2GB（fork-ts-checker 的 typescript.memoryLimit），本项目规模下构建易内存溢出，这里放宽上限
    config.plugin('fork-ts-checker').tap(args => {
      if (args[0] && args[0].typescript) {
        args[0].typescript.memoryLimit = 8192
      }
      return args
    })
  }
})
