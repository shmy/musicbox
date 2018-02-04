const NeteaseMusic = require('simple-netease-cloud-music')
const nm = new NeteaseMusic()
const request = require('request-promise-native')
const Encrypt = require('../crypto')
const getUserAgent = require('../ua')

module.exports = class Netease {
  __getPlayPam(id) {
    return Encrypt({
      ids: [id],
      br: 999000,
      csrf_token: ''
    })
  }
  __getSongUri(id) {
    return new Promise((resolve, reject) => {
      const options = {
        uri: 'http://music.163.com/weapi/song/enhance/player/url',
        method: 'POST',
        form: this.__getPlayPam(id),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': getUserAgent()
        },
        json: true
      }
      request(options)
        .then(data => {
          if (data.code !== 200) {
            return reject(new Error('搜索网易云音乐失败'))
          }
          resolve(data.data[0].url)
        })
        .catch(reject)
    })
  }
  search(keyword, page = 1, perPage = 20) {
    return new Promise((resolve, reject) => {
      nm.search(keyword, page, perPage)
        .then(data => {
          if (data.code !== 200) {
            return reject(new Error('搜索网易云音乐失败'))
          }
          data = data.result
          const result = {}
          result.page = page
          result.per_page = perPage
          result.total = data.songCount
          result.list = data.songs.map(item => {
            // console.log(item)
            return {
              id: item.id,
              songname: item.name,
              singername: item.ar.map(i => i.name).join(',')
            }
          })
          resolve(result)
        })
        .catch(reject)
    })
  }
  song(id) {
    return new Promise((resolve, reject) => {
      Promise.all([
        nm.song(id),
        this.__getSongUri(id),
        nm.lyric(id)
      ])
        .then(([info, url, lrc]) => {
          const result = {
            url: url,
            lrc: lrc.lrc ? lrc.lrc.lyric : '',
            songname: info.songs[0].name,
            singername: info.songs[0].ar.map(i => i.name).join(',')
          }
          if (!info.songs[0].al.pic_str) {
            result.pic = ''
            return resolve(result)
          }
          nm.picture(info.songs[0].al.pic_str)
            .then(res => {
              result.pic = res.url
              resolve(result)
            })
            .catch(reject)
        })
        .catch(reject)
    })
  }
  recommend() {
    return new Promise((resolve, reject) => {
      const options = {
        uri: 'http://music.163.com/m/',
        method: 'GET',
        headers: {
          // 'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': getUserAgent()
        }
      }
      request(options)
        .then(data => {
          const reg = /window\.REDUX_STATE ?=([\S\s]*)\}\}\;/
          let text = data.match(reg)
          text = text[1] + '}}'
          text = JSON.parse(text)
          const result = []
          text.HomeRecommend.data._list.forEach(list => {
            if (Array.isArray(list)) {
              list.forEach(item => {
                const i = {
                  id: item.id,
                  picUrl: item.picUrl,
                  songListDesc: item.name,
                  songListAuthor: item.copywriter,
                }
                result.push(i)
              })
            }
          })
          resolve({ songList: result })
        })
        .catch(reject)
    })
  }
  cdInfo(id) {
    return new Promise((resolve, reject) => {
      nm.playlist(id)
        .then(({ playlist }) => {
          const result = {}
          result.dissname = playlist.name
          result.desc = playlist.description
          result.logo = playlist.coverImgUrl
          result.visitnum = playlist.playCount
          result.songlist = playlist.tracks.map(i => ({
            id: i.id,
            songname: i.name,
            singername: i.ar.map(t => t.name).join(',')
          }))
          resolve(result)
        })
        .catch(reject)
    })

  }
}
