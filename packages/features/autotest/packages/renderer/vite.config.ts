import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import resolve, { lib2esm } from 'vite-plugin-resolve'
import polyfillExports from 'vite-plugin-electron/polyfill-exports'

import electron from 'vite-plugin-electron/renderer'
import vueJsx from '@vitejs/plugin-vue-jsx';
import svgLoader from 'vite-svg-loader';
import pkg from '../../package.json'

// https://vitejs.dev/config/
export default defineConfig({
  mode: process.env.NODE_ENV,
  root: __dirname,
  plugins: [
    vue(),
    vueJsx(),
    // svgLoader({ svgoConfig: {} }),
    electron(),
    resolve(
      /**
       * Here you can specify other modules
       * 🚧 You have to make sure that your module is in `dependencies` and not in the` devDependencies`,
       *    which will ensure that the electron-builder can package it correctly
       */
      {
        // If you use the following modules, the following configuration will work
        // What they have in common is that they will return - ESM format code snippets

        // ESM format string
        'electron-store': 'export default require("electron-store");',
        // Use lib2esm() to easy to convert ESM
        // Equivalent to
        /**
         * sqlite3: () => `
         * const _M_ = require('sqlite3');
         * const _D_ = _M_.default || _M_;
         * export { _D_ as default }
         * `
         */
        // sqlite3: lib2esm('sqlite3', { format: 'cjs' }),
        // serialport: lib2esm(
        //   // CJS lib name
        //   'serialport',
        //   // export memebers
        //   [
        //     'SerialPort',
        //     'SerialPortMock',
        //   ],
        //   { format: 'cjs' },
        // ),
      }
    ),
    polyfillExports(),
  ],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, '../renderer/src'),
      },
      {
        find: 'assets',
        replacement: path.resolve(__dirname, '../renderer/src/assets'),
      },
      {
        find: 'vue-i18n',
        replacement: 'vue-i18n/dist/vue-i18n.cjs.js', // Resolve the i18n warning issue
      },
      {
        find: 'vue',
        replacement: 'vue/dist/vue.esm-bundler.js', // compile template
      },
    ],
    extensions: ['.ts', '.js'],
  },
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT,
  },
  // 强制预构建插件包
  optimizeDeps: {
    include: [
      `monaco-editor/esm/vs/language/json/json.worker`,
      `monaco-editor/esm/vs/language/css/css.worker`,
      `monaco-editor/esm/vs/language/html/html.worker`,
      `monaco-editor/esm/vs/language/typescript/ts.worker`,
      `monaco-editor/esm/vs/editor/editor.worker`
    ],
  },

})
