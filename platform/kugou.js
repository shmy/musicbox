const request = require('request-promise-native')
const cheerio = require('cheerio')
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
  recommend() {
    return new Promise((resolve, reject) => {
      const options = {
        uri: 'http://m.kugou.com/plist/index',
        method: 'GET',
        headers: {
          // 'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': getUserAgent()
        }
      }
      request(options)
        .then(data => {
          const $ = cheerio.load(data)
          const result = []
          $('#panelList>li').each((index, el) => {
            const item = {
              id: $(el).children().eq(0).attr('href').split('/list/')[1],
              picUrl: $(el).find('.panel-img-left > img').attr('_src'),
              songListDesc: $(el).find('.panel-img-content-first').text().trim(),
              songListAuthor: '酷狗'
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
        uri: `http://m.kugou.com/plist/list/${id}`,
        headers: {
          'User-Agent': getUserAgent()
        }
      }
      request(options)
        .then(data => {
          const $ = cheerio.load(data)
          const result = {
            songlist: []
          }
          result.dissname = $('.page-title').text().trim()
          result.desc = $('#introBox').text().trim()
          result.logo = $('#imgBoxInfo > img').attr('src')
          result.visitnum = 0
          $('.panel-songslist-item').each((index, el) => {
            let text = $(el).find('.panel-songs-item-name').text().trim()
            text = text.split('-')
            const item = {
              id: $(el).attr('id').split('_')[1],
              songname: text[1].trim(),
              singername: text[0].trim()
            }
            result.songlist.push(item)
          })
          resolve(result)
        })
        .catch(reject)
    })
  }
}
