const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const SourceMap = require('source-map');
const dayjs = require('dayjs')

const PORT = 9999;

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!').status(200);
})

app.post('/upload', (req, res) => {
  const fileName = req.query.name
  const filePath = path.join(__dirname, 'uploads', fileName)

  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
  }

  const writeStream = fs.createWriteStream(filePath)

  req.on('data', (chunk) => {
    writeStream.write(chunk)
  })

  req.on('end', () => {
    writeStream.end(() => {
      res.status(200).send(`File ${fileName} has been saved.`)
    })
  })

  writeStream.on('error', (err) => {
    fs.unlink(filePath, () => {
      console.error(`Error writing file ${fileName}: ${err}`)
      // res.status(500).send(`Error writing file ${fileName}.`)
    })
  })
})

app.post('/reportVueError',async (req, res) => {
  const urlParams = req.body;
  console.log(`收到Vue错误报告`);
  console.log('urlParams', urlParams);

  const stack = urlParams.error.stack;
  // 获取文件名
  const fileName = path.basename(stack.url);
  // 查找map文件
  const filePath = path.join(__dirname, 'uploads', fileName + '.map');
  const readFile = function (filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, { encoding: 'utf-8'}, (err, data) => {
        if (err) {
          console.log('readFileErr', err)
          return reject(err);
        }
        resolve(JSON.parse(data));
      })
    })
  }

  async function searchSource({ filePath, line, column }) {
    const rawSourceMap = await readFile(filePath);
    const consumer = await new SourceMap.SourceMapConsumer(rawSourceMap);
    const res = consumer.originalPositionFor({ line, column })

    consumer.destroy();
    return res;
  }

  let sourceMapParseResult = '';
  try {
    // 解析sourceMap结果
    sourceMapParseResult = await searchSource({ filePath, line: stack.line, column: stack.column });
  } catch (err) {
    sourceMapParseResult = err;
  }
  console.log('解析结果', sourceMapParseResult)

  const today = dayjs().format('YYYY-MM-DD') // 今天

  const logDirPath = path.join(__dirname, 'log');
  const logFilePath = path.resolve(__dirname, 'log/' + `log-${today}.txt`)

  if (!fs.existsSync(logDirPath)) {
    console.log(`创建log文件夹`)
    fs.mkdirSync(logDirPath, { recursive: true });
  }
  if (!fs.existsSync(logFilePath)) {
    console.log(`创建${today}日志文件`)
    fs.writeFileSync(logFilePath, '', 'utf8');
  }

  const writeStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  writeStream.on('open', () => {
    // writeStream.write('UUID：' + urlParams.data.uuid + '\n');
    writeStream.write('错误类型：Window' + '\n');
    writeStream.write('错误发生时间：' + urlParams.data.errTime + '\n');
    writeStream.write('IP：' + req.ip + '\n');
    writeStream.write(`安卓: ${urlParams.data.isAndroid} IOS: ${urlParams.data.isIOS} 移动端: ${urlParams.data.isMobile} 微信: ${urlParams.data.isWechat} （安卓和ios同时为false表示未知设备）` + '\n');
    writeStream.write('用户代理：' + urlParams.browserInfo.userAgent + '\n');
    writeStream.write('错误信息：' + urlParams.error.message + '\n');
    writeStream.write('---------------------------------- \n');

    writeStream.end(() => {
      console.log('vue错误日志写入成功');
      console.log('---------------------');
      res.send({
        data: '错误上报成功',
        status: 200,
      }).status(200);
    });
  })

  writeStream.on('error', err => {
    res.send({
      data: '错误上报失败',
      status: 404,
    }).status(404);
    console.error('发生错误:', err);
  })
})

// 处理Window报错
app.post('/reportWindowError',async (req, res) => {
  const urlParams = req.body;
  console.log(`收到Window错误报告`);
  console.log('urlParams', urlParams);

  const today = dayjs().format('YYYY-MM-DD') // 今天

  const logDirPath = path.join(__dirname, 'log');
  const logFilePath = path.join(__dirname, 'log' + `/log-${today}.txt`)

  if (!fs.existsSync(logDirPath)) {
    console.log(`创建log文件夹`)
    fs.mkdirSync(logDirPath, { recursive: true });
  }
  if (!fs.existsSync(logFilePath)) {
    console.log(`创建${today}日志文件`)
    fs.writeFileSync(logFilePath, '', 'utf8');
  }

  const writeStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  writeStream.on('open', () => {
    // writeStream.write('UUID：' + urlParams.data.uuid + '\n');
    writeStream.write('错误类型：Window' + '\n');
    writeStream.write('错误发生时间：' + urlParams.data.errTime + '\n');
    writeStream.write('IP：' + req.ip + '\n');
    writeStream.write(`安卓: ${urlParams.data.isAndroid} IOS: ${urlParams.data.isIOS} 移动端: ${urlParams.data.isMobile} 微信: ${urlParams.data.isWechat} （安卓和ios同时为false表示未知设备）` + '\n');
    writeStream.write('用户代理：' + urlParams.browserInfo.userAgent + '\n');
    writeStream.write('错误信息：' + urlParams.error.message + '\n');
    writeStream.write('---------------------------------- \n');

    writeStream.end(() => {
      console.log('window错误日志写入成功');
      console.log('---------------------');
      res.send({
        data: '错误上报成功',
        status: 200,
      }).status(200);
    });
  })

  writeStream.on('error', err => {
    res.send({
      data: '错误上报失败',
      status: 404,
    }).status(404);
    console.error('发生错误:', err);
  })
})

app.listen(PORT, () => {
  console.log(`服务启动成功，端口号为:${PORT}`)
})