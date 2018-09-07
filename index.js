/**
 * =================================
 * @2018 塞伯坦CYBMOCK前端数据模拟服务器
 * https://github.com/jd-cyb/cybmock
 * =================================
 */

const nodemon = require('gulp-nodemon')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const browserSync = require('browser-sync').create();
const fsExtra = require('fs-extra')
const del = require('del')

const cacheFile = path.join(process.cwd(), './.cache')
const mockRouterFile = path.join(process.cwd(), 'cybmock.config.js')

module.exports = () => {

  del.sync(cacheFile) //删除缓存文件

  const checkCacheFile = () => {
    let num = 0
    return new Promise((resolve, reject) => {
      const findCacheFile = () => {
        if (!fs.existsSync(cacheFile)) {
          setTimeout(() => {
            findCacheFile()
            num++
            if (num >= 30) reject()
          }, 500)
        } else {
          resolve()
        }
      }
      findCacheFile()
    })
  }

  if (!fs.existsSync(mockRouterFile)) {
    const mockRouterTemp = `const proxy = {
  'GET /api/demoGet': {
    tips: '用于演示GET请求',
    name: '塞伯坦前端模块化工程构建工具',
    github: 'https://github.com/jd-cyb/cyb-cli'
  },
  'POST /api/demoPost': {
    tips: '用于演示POST请求',
    name: '塞伯坦前端数据模拟服务器',
    github: 'https://github.com/jd-cyb/cybmock'
  }
}

module.exports = proxy
`
    fs.writeFileSync(mockRouterFile, mockRouterTemp, 'utf8');
  }

  let started = false;
  const stream = nodemon({
    script: path.join(__dirname, './server.js'),
    ext: "js",
    env: {
      'NODE_ENV': process.env.NODE_ENV
    },
    // 监听的路径
    watch: [
      path.join(process.cwd(), './mock'),
      mockRouterFile
    ]
  })

  stream
    .on('start', () => {
      if (!started) {
        checkCacheFile().then(() => {
          fsExtra.readJson(cacheFile, (err, packageObj) => {
            if (err) return console.error(err)
            browserSync.init({
              proxy: `localhost:${packageObj.port}`
            })
          })
        })
        started = true;
      }
    })
    .on('restart', () => {
      setTimeout(() => {
        browserSync.reload()
      }, 500)
    })
    .on('crash', () => {
      stream.emit('restart', 10)
    })
    .on('exit', () => {
      del.sync(cacheFile) //删除缓存文件
    })
}