

import { reactive } from 'vue'

export const autotestState = reactive({ 
  count: 0,
  clientList: [],
  project2client: {},
  projectMap: new Map()
})


// FIXME: 使用pinia后数据变化不会触发页面刷新

// import { defineStore } from 'pinia'

// export const useAutotestStore = defineStore('autotest', {
//   state: () => {
//     return { 
//       count: 0,
//       clientList: [],
//       project2client: {}
//     }
//   },
//   actions: {
//     increment() {
//       this.count++
//     },
//   },
// })