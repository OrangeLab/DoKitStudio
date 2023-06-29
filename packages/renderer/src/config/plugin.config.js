import autotestIcon from "@/assets/auto_test.png";
import multiControlIcon from "@/assets/multi_control.png";
import pluginIcon from "@/assets/plugin.png";

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
      port: 2333
    }, {
      name: 'demo',
      icon: pluginIcon,
      title: 'demo',
      desc: '',
      port: 7788
    }, {
      name: 'jsonFormatter',
      icon: pluginIcon,
      title: 'JSON格式化',
      desc: '',
      port: 7788
    }, {
      name: 'textEncoder',
      icon: pluginIcon,
      title: '文本编解码',
      desc: '',
      port: 8899
    }]
  }
]