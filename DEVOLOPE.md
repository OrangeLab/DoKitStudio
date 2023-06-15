# DoKitStudio
A DoKit Desktop Application

## 框架启动

```sh
yarn

yarn dev
```

## 新增插件逻辑（临时方案）

### features项目文件夹添加插件文件夹
在dokit-studio/packages/features文件夹下添加你的子项目 如demo

项目结构如下
```
├── package.json
├── packages
│   ├── main
│   │   ├── index.ts
│   │   └── vite.config.ts
│   ├── preload
│   │   ├── index.ts
│   │   ├── loading.ts
│   │   ├── utils.ts
│   │   └── vite.config.ts
│   └── renderer
│       ├── index.html
│       ├── tsconfig.json
│       └── vite.config.ts
└── scripts
    ├── build.mjs
    └── watch.mjs
```
demo项目已做好最基础的配置，可复制demo项目改名

项目是一个使用vite构建的多包结构项目

main中onready中可以填写当前插件需要在主进程中需要执行的逻辑

preload 是当前插件的preload逻辑

renderer 是当前插件的渲染进程逻辑

package.json已经配置好了vite构建vue项目的所有依赖

其中 env配置项决定了 在开发模式下插件启动后的端口地址
```
"env": {
  "VITE_DEV_SERVER_HOST": "127.0.0.1",
  "VITE_DEV_SERVER_PORT": 7788
},
```

### 在dokit-studio框架的renderer种配置 插件信息
dokit-studio/packages/renderer/src/config/plugin.config.js 这个文件中用于配置插件菜单 结构如下
```
import autotestIcon from "@/assets/auto_test.png";
import multiControlIcon from "@/assets/multi_control.png";
import pluginIcon from "@/assets/plugin.png";  // 插件图标放在dokit-studio/packages/renderer/src/assets下 并引入

export const plugins = [
  {
    title: '常用工具',
    list: [{
      name: 'autotest',
      icon: autotestIcon,
      title: '自动化测试',
      desc: '',
      port: 2333
    }, {
      name: 'multiControl',
      icon: multiControlIcon,
      title: '一机多控',
      desc: '',
      port: 3456
    }, {
      name: 'demo',   // 与你的插件文件夹名称相同
      icon: pluginIcon, // 引入的图标
      title: 'demo', // 插件窗口标题
      desc: '', // 插件描述
      port: 7788 // dev模式下插件使用的端口号
    }]
  }
]
```
将你的插件参考demo插件进行配置
dokit-studio重新编译启动时你就可以看到你配置的图标了
