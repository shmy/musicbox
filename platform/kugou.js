const request = require('request-promise-native')
const getUserAgent = require('../ua')

module.exports = class KuGou {
  __getPlayUri (hash) {
    return `http://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=${hash}`
  }
  __getLyric (id) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        uri: 'http://m.kugou.com/app/i/krc.php',
        qs: {
          cmd: 100,
          hash: id,
          timelength: 1
        },
        headers: {
          'User-Agent': getUserAgent()
        }
      }
      request(options)
        .then(data => {
          resolve(data)
        })
        .catch(reject)
    })
  }
  __getSearchPam (keyword, page, perPage) {
    return {
      format: 'json',
      keyword,
      page: page,
      pagesize: perPage,
      showtype: 1
    }
  }
  search (keyword, page = 1, perPage = 20) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        uri: 'http://mobilecdn.kugou.com/api/v3/search/song',
        qs: this.__getSearchPam(keyword, page, perPage),
        headers: {
          // 'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': getUserAgent()
        },
        json: true
      }
      request(options)
        .then(data => {
          if (data.errcode !== 0) {
            return reject(new Error('搜索酷狗音乐失败'))
          }
          data = data.data
          const result = {}
          result.page = page
          result.per_page = perPage
          result.total = data.total
          result.list = data.info.map(item => {
            return {
              id: item.hash.toUpperCase(),
              songname: item.songname,
              singername: item.singername
            }
          })
          resolve(result)
        })
        .catch(reject)
    })
  }
  song (id) {
    return new Promise((resolve, reject) => {
      const options = {
        uri: this.__getPlayUri(id),
        method: 'GET',
        headers: {
          // 'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': getUserAgent()
        },
        json: true
      }
      request(options)
        .then(data => {
          // if (data.code !== 200) {
          //   return reject(new Error('搜索酷狗音乐失败'))
          // }
          const result = {
            url: data.url,
            pic: data.imgUrl.replace('{size}', '400'),
            songname: data.songName,
            singername: data.singerName
          }
          this.__getLyric(id)
            .then(lrc => {
              result.lrc = lrc
              resolve(result)
            })
            .catch(reject)
        })
        .catch(reject)
    })
  }
}
