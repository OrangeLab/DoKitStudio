# DoKitStudio诞生背景
旧版本一机多控使用的是手机与手机直接通信的方式进行一机多控，在使用过程中发现在链接多台设备时主机负载变高对性能有一定影响。同时因为网络连接断开等问题，在这种模式下，主机停止服务后全部从机也断开连接恢复过程需要逐一重新建立连接。为了解决在多台设备进行一机多控的稳定/体验问题。引入其他服务，开起了DoKit Studio的研发，DoKit Studio 是一款跨平台可运行的PC桌面程序。在一机多控中承担通信核心功能。

# 项目简介
DoKitStudio是一个基于electron-vite-vue架构的桌面端项目，目前主要服务于DoKit项目的一机多控功能

为了保证开发期间的快速构建我们使用electron-vite-vue架构
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
