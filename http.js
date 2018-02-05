const { request } = require('http')
const { parse } = require('url')
const { stringify } = require('querystring')
const getUserAgent = require('./ua')

module.exports = (options = {
  method: 'GET',
  uri: '',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  json: false
}) => new Promise((resolve, reject) => {
  const {
    protocol,
    hostname,
    port = 80,
    path,
  } = parse(options.uri)
  const config = {
    hostname,
    port,
    path,
    method: options.method,
    headers: Object.assign({ 'User-Agent': getUserAgent() }, options.headers)
  }
  if (options.qs) {
    config.path += '?' + stringify(options.qs)
  }
  
  const req = request(config, res => {
    let data = ''
    res.setEncoding('utf8')
    res.on('data', chunk => {
      data += chunk
    })
    res.on('end', () => {
      if (options.json) {
        try {
          data = JSON.parse(data)
        } catch (error) { }
      }
      resolve(data)
    })
  })
  // 设置15秒超时
  req.setTimeout(15 * 1000, () => {
    req.abort() // 取消请求
    reject(new Error('timeouted'))
  })
  req.on('error', reject)
  // 写入数据到请求主体
  if (options.form) {
    req.write(stringify(options.form))
  }
  req.end()
})