const request = require('request-promise-native')
const { decode } = require('he')
const getUserAgent = require('../ua')

module.exports = class QQ {
  __getDetailUri (id) {
    return `https://i.y.qq.com/v8/playsong.html?songmid=${id}&format=mp3&ADTAG=myqq&from=myqq`
  }
  __getSearchPam (keyword, page, perPage) {
    return {
      format: 'json',
      inCharset: 'utf-8',
      outCharset: 'utf-8',
      platform: 'h5',
      w: keyword,
      p: page,
      perpage: perPage,
      n: perPage,
      _: Date.now()
    }
  }
  __getLyric (id) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        uri: 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric.fcg',
        qs: {
          nobase64: 1,
          musicid: id,
          songtype: 0,
          callback: 'j'
        },
        headers: {
          referer: 'https://i.y.qq.com',
          'User-Agent': getUserAgent()
        }
      }
      request(options)
        .then(data => {
          const reg = /^j\((.+)\)$/
          data = JSON.parse(data.match(reg)[1])
          resolve(decode(data.lyric || ''))
        })
        .catch(reject)
    })
  }
  search (keyword, page = 1, perPage = 20) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        uri: 'https://c.y.qq.com/soso/fcgi-bin/search_for_qq_cp',
        qs: this.__getSearchPam(keyword, page, perPage),
        headers: {
          referer: 'https://i.y.qq.com',
          'User-Agent': getUserAgent()
        },
        json: true
      }
      request(options)
        .then(data => {
          if (data.code !== 0) {
            return reject(new Error('搜索QQ音乐失败'))
          }
          const result = {}
          const song = data.data.song
          result.page = song.curpage
          result.per_page = song.curnum
          result.total = song.totalnum
          result.list = song.list.map(item => {
            return {
              id: item.songmid,
              songname: decode(item.songname || ''),
              singername: decode(item.singer.map(i => i.name).join(',') || '')
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
        method: 'GET',
        uri: this.__getDetailUri(id),
        headers: {
          referer: 'https://i.y.qq.com',
          'User-Agent': getUserAgent()
        }
      }
      request(options)
        .then(data => {
          /* eslint-disable no-useless-escape */
          const reg = /window\.songlist ?=([\S\s]*)\}\]\;/
          let text = data.match(reg)
          if (!text) {
            return reject(new Error('获取QQ音乐链接失败'))
          }
          text = text[1] + '}]'
          try {
            text = JSON.parse(text)[0]
            const result = {
              url: text.m4aUrl,
              pic: 'http:' + text.pic,
              songname: text.songname,
              singername: text.singername
            }
            this.__getLyric(text.songid)
              .then(lrc => {
                result.lrc = lrc
                resolve(result)
              })
              .catch(reject)
          } catch (error) {
            return reject(new Error('获取QQ音乐链接失败'))
          }
        })
        .catch(reject)
    })
  }
}
