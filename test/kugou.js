const Music = require('../index')
  ; (async () => {
    try {
      let data = await Music.kugou.recommend()
      data = await Music.kugou.cdInfo(data.songList[0].id)
      data = await Music.kugou.song(data.songlist[2].id)
      console.log(data)
    } catch (error) {
      console.log(error)
    }
  })()