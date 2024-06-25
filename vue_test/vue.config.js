const { defineConfig } = require('@vue/cli-service')
const UploadSourceMap = require('./src/plugin/UploadSourceMap')

module.exports = defineConfig({
  productionSourceMap: true,
  transpileDependencies: true,
  lintOnSave: false,
  configureWebpack: {
    plugins: [
      new UploadSourceMap({
        url: 'http://127.0.0.1:9999' // 后面换成自己的服务器地址
      })
    ]
  }
})
