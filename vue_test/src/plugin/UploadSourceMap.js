const glob = require('glob')
const path = require('path')
const http = require('http')
const fs = require('fs')

class UploadSourceMap {
  constructor (options) {
    this.options = options
  }

  apply (compiler) {
    console.log('UploadSourceMap')

    // 在打包完成后运行
    compiler.hooks.done.tap('UploadSourceMap', async stats => {
      const list = glob.sync(path.join(stats.compilation.outputOptions.path, '**/*.js.map'))
      for (const item of list) {
        const fileName = path.basename(item);
        console.log(`开始上传${fileName}`)
        await this.upload(this.options.url, item)
        console.log(`上传${fileName}完成`)
      }
    })
  }

  upload (url, file) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        `${url}/upload?name=${path.basename(file)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            Connection: 'keep-alive',
            'Transfer-Encoding': 'chunked'
          }
        }
      )
      fs.createReadStream(file)
        .on('data', chunk => {
          req.write(chunk)
        })
        .on('end', () => {
          req.end()
          // 删除文件
          fs.unlink(file, (err) => {
            if (err) {
              console.error(err)
            }
          })
          resolve()
        })
    })
  }
}

module.exports = UploadSourceMap
