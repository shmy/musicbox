const request = require('../http')
const cheerio = require('cheerio')
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
        uri: `http://mobile.kuwo.cn/mpage/html5/getsongurl?mid=${id}&format=mp3`,
        method: 'GET',
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
  hotKey() {
    return new Promise((resolve, reject) => {
      const options = {
        uri: 'http://mobile.kuwo.cn/mpage/html5/2015/action/hotword.jsp',
        method: 'GET',
        json: true
      }
      request(options)
        .then(data => {
          resolve(data.map(i => i.name))
        })
        .catch(reject)
    })
  }
  recommend() {
    return new Promise((resolve, reject) => {
      const options = {
        uri: 'http://m.kuwo.cn/newh5/index/index',
        method: 'GET'
      }
      request(options)
        .then(data => {
          const $ = cheerio.load(data)
          const result = []
          $('.gedan .swiper-slide').each((index, el) => {
            const item = {
              id: $(el).find('a').attr('href').split('pid=')[1],
              picUrl: $(el).find('a > img').attr('data-src'),
              songListDesc: $(el).find('.gedantitle').text().trim(),
              songListAuthor: '酷我'
            }
            result.push(item)
          })

          $('.program .swiper-slide').each((index, el) => {
            const item = {
              id: $(el).find('a').attr('href').split('pid=')[1],
              picUrl: $(el).find('a > img').attr('data-src'),
              songListDesc: $(el).find('.programtitle').text(),
              songListAuthor: '酷我'
            }
            result.push(item)
          })

          resolve({ songList: result })
        })
        .catch(reject)
    })
  }
  cdInfo(id) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        uri: `http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&encode=utf-8&keyset=pl2012&identity=kuwo&vipver=1&pid=${id}&pn=0&rn=1000000&_=${Date.now()}`,
        json: true
      }
      request(options)
        .then(data => {
          const result = {}
          result.dissname = data.title
          result.desc = data.info
          result.logo = data.pic
          result.visitnum = data.playnum
          result.songlist = data.musiclist.map(i => ({
            id: i.id,
            songname: i.name,
            singername: i.artist
          }))
          resolve(result)
        })
        .catch(reject)
    })
  }
}
