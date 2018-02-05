const Music = require('../index')
  ; (async () => {
    try {
      let data = await Music.netease.recommend()
      data = await Music.netease.cdInfo(data.songList[0].id)
      data = await Music.netease.song(data.songlist[0].id)
      console.log(data)
    } catch (error) {
      console.log(error)
    }
  })()