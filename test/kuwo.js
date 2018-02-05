const Music = require('../index')
  ; (async () => {
    try {
      let data = await Music.kuwo.recommend()
      data = await Music.kuwo.cdInfo(data.songList[0].id)
      data = await Music.kuwo.song(data.songlist[0].id)
      console.log(data, await Music.kuwo.hotKey())
    } catch (error) {
      console.log(error)
    }
  })()