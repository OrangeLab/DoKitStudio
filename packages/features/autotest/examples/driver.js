


const { Builder } = require('@dokit/autotest-core');

(async function main() {
  let driver = await new Builder().build({
    uri: 'http://172.23.142.58:8002',
    clientSessionId: 'SIDKDNJUDHSUASLK'
  })

  await driver.setActionData({
    dataPathList: [
      '/Users/didi/Desktop/DoKit/dokit-autotest/examples/data/001.json',
      '/Users/didi/Desktop/DoKit/dokit-autotest/examples/data/002.json',
      '/Users/didi/Desktop/DoKit/dokit-autotest/examples/data/003.json'
    ]
  });

  await driver.triggerClick({
    "page": {
      "type": "activity",
      "name": "com.didi.test.MainActivity",
      "visible": true,
      "current": false,
      "index": 2
    },
    "view": {
      "id": "root_home_test_text_view",
      "xpath": "/root/1/3/test",
      "name": "com.didi.TestView",
      "text": "DoKit"
    },
    "event": {
      "eventId": "ON_CLICK",
      "x": "100",
      "y": "200"
    }
  })

  console.log(
    'sdasd'
  )

  await driver.wait(1000)

  // const res = await driver.searchPage({"page": {
  //   "type": "activity",
  //   "name": "com.didi.test.MainActivity",
  //   "visible": true,
  //   "current": false,
  //   "index": 2
  // }})

  await driver.quit()
})()
