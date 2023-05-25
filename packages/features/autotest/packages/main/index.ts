import { autotestInit } from './autotest'

module.exports = () => {
  return {
    onReady(ctx) {
      autotestInit(ctx.browserWindow)
    }
  }
}