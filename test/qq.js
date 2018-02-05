const Music = require('../index')
  ; (async () => {
    try {
      let data = await Music.qq.recommend()
      data = await Music.qq.cdInfo(data.songList[0].id)
      data = await Music.qq.song(data.songlist[0].id)
      console.log(data, await Music.qq.hotKey())
    } catch (error) {
      console.log(error)
    }
  })()