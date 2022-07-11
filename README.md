# DoKitStudio
A DoKit Desktop Application

# 简介
DoKitStudio是一个基于electron-vite-vue架构的桌面端项目，目前主要服务于DoKit项目的一机多控功能

为了保证开发期间的快速构建我们使用饿了electron-vite-vue架构
https://github.com/electron-vite/electron-vite-vue


UI框架使用了ArcoDesign
https://arco.design/vue/docs/start

整体项目结构如下
```
packages
├── main
│   ├── autoTest
│   │   ├── dataService.ts
│   │   ├── dataStore.ts
│   │   ├── index.ts
│   │   ├── multiControl.ts
│   │   ├── requestPool.ts
│   │   └── userInterfaceAutomation.ts
│   ├── index.ts
│   ├── socketServer
│   │   ├── Client.ts
│   │   ├── ProxyServer.ts
│   │   ├── cli.ts
│   │   ├── index.ts
│   │   ├── start.ts
│   │   └── utils.ts
│   ├── util.ts
│   └── vite.config.ts
├── preload
│   ├── index.ts
│   ├── loading.ts
│   ├── utils.ts
│   └── vite.config.ts
└── renderer
    ├── index.html
    ├── public
    │   ├── dokit_pc_logo.ico
    │   ├── electron-vite-vue.gif
    │   ├── favicon.ico
    │   └── images
    │       ├── node.png
    │       └── quick-start.gif
    ├── src
    ├── tsconfig.json
    └── vite.config.ts

```

核心功能主要是socket中转服务
packages/main/socketServer
以及一机多控处理逻辑
/packages/main/autoTest/multiControl.ts

## Quick Start

```sh
// 安装依赖
yarn

// dev构建
yarn dev

// 代码打包
yarn build
```

## 备注
为了确保打包成功
我们使用了yarnrc指定了npm源和一些electron的镜像地址
