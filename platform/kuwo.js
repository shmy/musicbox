const request = require('request-promise-native')
const getUserAgent = require('../ua')
const { decode } = require('he')

module.exports = class KuWo {
  __formatTime(seconds) {
    let min = Math.floor(seconds / 60)
    let second = seconds % 60
    let hour, newMin, time

    if (min > 60) {
      hour = Math.floor(min / 60)
      newMin = min % 60
    }

    second = second.toFixed(3)
    if (second < 10) { second = '0' + second }
    if (min < 10) { min = '0' + min }
    return time = hour ? (hour + ':' + newMin + ':' + second) : (min + ':' + second)
  }
  __getLyric(id) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        uri: 'http://m.kuwo.cn/newh5/singles/songinfoandlrc',
        qs: {
          musicId: id
        },
        headers: {
          'User-Agent': getUserAgent()
        },
        json: true
      }
      request(options)
        .then(data => {
          const lrclist = data.data.lrclist
          const lrc = lrclist ? lrclist
            .map(item => {
              return `[${this.__formatTime(item.time)}] ${item.lineLyric}`
            })
            .join('\n') : ''
          let { songName: songname, pic, artist: singername } = data.data.songinfo
          pic = pic.replace('/240/', '/320/')
          resolve({ lrc, songname, pic, singername })
        })
        .catch(reject)
    })
  }
  __getPlayUri(id) {
    return `http://mobile.kuwo.cn/mpage/html5/getsongurl?mid=${id}&format=mp3`
  }
  __getSearchPam(keyword, page, perPage) {
    return {
      all: keyword,
      ft: 'music',
      client: 'kt',
      cluster: 0,
      pn: page,
      rn: perPage,
      rformat: 'json',
      encoding: 'utf8',
      r: Date.now()
    }
  }
  search(keyword, page = 1, perPage = 20) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        uri: 'http://search.kuwo.cn/r.s',
        qs: this.__getSearchPam(keyword, page, perPage),
        headers: {
          // 'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': getUserAgent()
        },
        json: true
      }
      request(options)
        .then(data => {
          /* eslint-disable no-useless-escape */
          data = data.replace(/\'/g, '"')
          data = JSON.parse(data)
          // if (data.code !== 200) {
          //   return reject(new Error('搜索网易云音乐失败'))
          // }
          const result = {}
          result.page = page
          result.per_page = perPage
          result.total = +data.TOTAL
          result.list = data.abslist.map(item => {
            // console.log(item.ALBUMID)
            return {
              id: item.MUSICRID.replace(/^MUSIC_/, ''),
              songname: decode(item.SONGNAME),
              singername: decode(item.ARTIST)
            }
          })
          resolve(result)
        })
        .catch(reject)
    })
  }
  song(id) {
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
          //   return reject(new Error('搜索百度音乐失败'))
          // }
          const result = {
            url: data.url
          }
          this.__getLyric(id)
            .then(data => {
              resolve(Object.assign(result, data))
            })
            .catch(reject)
        })
        .catch(reject)
    })
  }
}
