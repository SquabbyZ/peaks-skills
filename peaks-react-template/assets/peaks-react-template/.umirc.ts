import { defineConfig } from 'umi';
import fs from 'fs';
import path from 'path';
import routes from './routes';

// 读取首屏关键 CSS 变量，内联到 HTML 中避免 FOUC
const criticalCss = fs.readFileSync(
  path.resolve(__dirname, 'src/styles/variables.css'),
  'utf-8',
);

export default defineConfig({
  routes,
  npmClient: 'pnpm',
  favicons: process.env.FAVICONONS?.split(',') || [],
  title: process.env.TITLE || '', 
  // 国际化插件
  plugins: ['@umijs/plugins/dist/locale'],
  // 启用点击组件跳转源码功能（仅 React 项目支持）
  // 使用方式：Option+Click (Mac) / Alt+Click (Windows) 点击组件跳转到编辑器源码位置
  // Option+Right-click / Alt+Right-click 可以打开上下文，查看父组件
  clickToComponent: {
    editor: 'vscode', // 支持 'vscode' | 'vscode-insiders'，默认为 'vscode'
  },
  // 国际化配置
  locale: {
    default: process.env.LOCALE || 'zh-CN',
    baseSeparator: process.env.LOCALE_BASE_SEPARATOR || '-',
  },
  // 首屏关键 CSS 内联到 HTML <head> 中，确保在 JS 执行前 CSS 变量已定义
  headScripts: [
    {
      // 使用 inline 方式内联 CSS 变量到 <head>
      content: `(function() {
  var style = document.createElement('style');
  style.textContent = ${JSON.stringify(criticalCss)};
  document.head.insertBefore(style, document.head.firstChild);
})();`.trim(),
    },
  ],
  // 浏览器兼容配置
  targets: {
    chrome: 80,
    firefox: 75,
    safari: 13,
    edge: 80,
    ios: 13,
  },
  // 代理配置
  proxy: {
    '/api': {
      target: process.env.API_DOMAIN || 'http://localhost:3000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api',
      },
    },
  },

  // 路径别名配置
  alias: {
    '@': '/src',
    '@components': '/src/components/',
    '@hooks': '/src/hooks/',
    '@services': '/src/services/',
    '@pages': '/src/pages/',
    '@layouts': '/src/layouts/',
    '@assets': '/src/assets/',
    '@styles': '/src/styles/',
    '@typeDefs': '/src/types/',
  },
});
