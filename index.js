const QQ = require('./platform/qq')
const Netease = require('./platform/netease')
const KuWo = require('./platform/kuwo')
const KuGou = require('./platform/kugou')
module.exports = {
  qq: new QQ,
  netease: new Netease,
  kuwo: new KuWo,
  kugou: new KuGou
}
