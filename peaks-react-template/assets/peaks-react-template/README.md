<div align="right">

[🇺🇸 English](README-en.md) | [🇨🇳 简体中文](README.md)

</div>

---

# Peaks React Template

基于 Umi + React + TypeScript 的现代化前端项目模板，支持国际化（i18n）、状态管理、请求拦截等企业级功能。

## 功能特性

### 核心技术栈

- **框架**：Umi 4.x - 企业级 React 应用框架
- **UI 库**：Ant Design 6.x - 企业级 UI 组件库
- **语言**：TypeScript 5.x - 类型安全的 JavaScript 超集
- **样式**：Tailwind CSS 3.x - 实用优先的 CSS 框架
- **状态管理**：Zustand 5.x - 轻量级状态管理库
- **数据请求**：TanStack React Query 5.x + Umi Request
- **表单处理**：React Hook Form 7.x + Zod 验证
- **Hooks 库**：ahooks 3.x - 高质量 React Hooks 库
- **日期处理**：Day.js - 轻量级日期处理库
- **包管理器**：pnpm - 快速、节省空间的包管理器

### 主要功能

#### 1. 国际化（i18n）

项目内置了完整的国际化解决方案，支持多语言切换：

- **支持语言**：简体中文（zh-CN）、英文（en-US）
- **配置位置**：`src/locales/` 目录
- **切换方式**：通过 `setLocale` API 无刷新切换语言
- **UI 组件**：内置 `SelectLang` 组件快速集成语言选择器

**相关文件**：

- [src/locales/zh-CN.json](src/locales/zh-CN.json) - 中文语言包
- [src/locales/en-US.json](src/locales/en-US.json) - 英文语言包

#### 2. 点击组件跳转源码

开发模式下支持点击页面组件直接跳转到编辑器源码位置（仅 React 项目支持）：

- **Mac**：Option + Click
- **Windows**：Alt + Click
- **查看父组件**：Option + Right-click / Alt + Right-click
- **配置**：`.umirc.ts` 中的 `clickToComponent` 选项

#### 3. 首屏 CSS 变量内联

通过内联 CSS 变量到 HTML `<head>` 避免 FOUC（Flash of Unstyled Content）问题：

- CSS 变量文件：`src/styles/variables.css`
- 自动在 JS 执行前注入，确保样式一致性

#### 4. 路径别名

支持简洁的路径别名导入：

| 别名            | 实际路径               |
| ------------- | ------------------ |
| `@`           | `/src`             |
| `@components` | `/src/components/` |
| `@hooks`      | `/src/hooks/`      |
| `@services`   | `/src/services/`   |
| `@pages`      | `/src/pages/`      |
| `@layouts`    | `/src/layouts/`    |
| `@assets`     | `/src/assets/`     |
| `@styles`     | `/src/styles/`     |
| `@typeDefs`   | `/src/types/`      |

#### 5. API 代理

配置了 `/api` 路径代理，方便开发阶段调用后端接口：

```typescript
proxy: {
  '/api': {
    target: process.env.API_DOMAIN || 'http://localhost:3000',
    changeOrigin: true,
  },
}
```

#### 6. 代码规范

项目集成了多种代码规范工具：

- **ESLint**：代码质量检查
- **Prettier**：代码格式化
- **Husky**：Git Hooks（commit-msg、pre-commit）
- **lint-staged**：只对暂存的文件进行 lint
- **commitlint**：提交信息规范（基于 Conventional Commits）

#### 7. 单元测试（Jest）

项目集成了 Jest 作为单元测试框架：

- **配置位置**：`jest.config.js`
- **测试文件目录**：`test/` 目录
- **文件匹配规则**：`{name}.{spec,test}.{ts,tsx,js,jsx}`
- **测试命令**：
  - `pnpm test` - 运行测试
  - `pnpm test:watch` - 监听模式运行测试

## 项目结构

```
prompt-project/
├── .husky/                  # Git Hooks 配置
│   ├── commit-msg          # commit-msg hook
│   └── pre-commit          # pre-commit hook
├── .claude/                  # Claude Code skills configuration
│   └── skills/             # 技能目录
│       ├── peaks-api-create/
│       ├── peaks-hook-form/
│       └── peaks-pixso-code-sync/
├── .vscode/                # VS Code 配置
│   └── settings.json       # i18n-ally 插件配置
├── deploy/                 # 部署配置
│   ├── .gitlab-ci.yml      # GitLab CI 配置
│   ├── Dockerfile           # Docker 配置
│   └── nginx.conf           # Nginx 配置
├── src/                    # 源代码目录
│   ├── constants/           # 常量定义
│   │   └── index.ts
│   ├── layouts/             # 布局组件
│   │   └── index.tsx
│   ├── locales/             # 国际化语言文件
│   │   ├── zh-CN.json       # 中文
│   │   └── en-US.json       # 英文
│   ├── pages/               # 页面组件
│   │   └── Home.tsx
│   ├── services/            # 服务层（API 请求）
│   │   ├── api.ts
│   │   ├── index.ts
│   │   ├── queryClient.ts
│   │   └── request.ts
│   ├── styles/              # 样式文件
│   │   ├── global.css
│   │   └── variables.css    # CSS 变量
│   ├── theme/               # 主题配置
│   │   └── index.ts
│   └── types/               # TypeScript 类型定义
│       ├── api.ts
│       ├── index.ts
│       └── utils.ts
├── test/                    # 测试文件目录
│   └── example.test.ts      # 测试示例
├── .env                    # 环境变量
├── .eslintcache            # ESLint 缓存
├── .eslintignore           # ESLint 忽略配置
├── .eslintrc.js            # ESLint 配置
├── .gitignore              # Git 忽略配置
├── .lintstagedrc.js        # lint-staged 配置
├── .npmrc                  # npm/pnpm 配置
├── .prettierignore         # Prettier 忽略配置
├── .prettierrc.json        # Prettier 配置
├── .umirc.ts               # Umi 配置
├── commitlint.config.js    # commitlint 配置
├── jest.config.js          # Jest 测试配置
├── package.json            # 项目依赖
├── pnpm-lock.yaml         # pnpm 锁定文件
├── postcss.config.js       # PostCSS 配置
├── routes.ts               # 路由配置
├── tailwind.config.js      # Tailwind CSS 配置
├── tsconfig.json           # TypeScript 配置
└── typings.d.ts            # 类型声明文件
```

## 快速开始

### 环境要求

- Node.js: >= 22.22.0
- pnpm: >= 10.x（推荐）或 npm >= 11.x

### 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 开发命令

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 自动修复代码问题
pnpm lint:fix

# 运行测试
pnpm test

# 监听模式运行测试
pnpm test:watch
```

### 环境变量

在项目根目录创建 `.env` 文件：

```env
# API 域名
API_DOMAIN=http://localhost:3000

# 网站标题
TITLE=My App

# 国际化默认语言
LOCALE=zh-CN

# 国际化分隔符
LOCALE_BASE_SEPARATOR=-

# 图标列表（逗号分隔）
FAVICONONS=https://example.com/favicon1.ico,https://example.com/favicon2.ico
```

## 核心模块说明

### 1. 布局系统

布局组件位于 `src/layouts/index.tsx`，定义了应用的整体布局结构。

### 2. 路由配置

路由定义在 `routes.ts` 文件中，支持以下配置：

```typescript
export const Routes = {
  Home: '/',
};

const routes = [
  { path: Routes.Home, component: 'Home' },
];
```

### 3. 服务层

服务层位于 `src/services/` 目录：

- `api.ts` - API 接口定义
- `request.ts` - 基于 Umi Request 的请求封装
- `queryClient.ts` - TanStack Query 客户端配置
- `index.ts` - 服务导出入口

### 4. 样式系统

样式文件位于 `src/styles/` 目录：

- `variables.css` - CSS 变量定义（首屏加载）
- `global.css` - 全局样式

### 5. 主题配置

主题配置位于 `src/theme/index.ts`，可自定义 Ant Design 主题变量。

### 6. 类型定义

TypeScript 类型定义位于 `src/types/` 目录：

- `api.ts` - API 相关类型
- `utils.ts` - 工具类型
- `index.ts` - 类型导出入口

### 7. 测试配置

Jest 测试配置位于 `jest.config.js`，测试文件放在 `test/` 目录：

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['<rootDir>/test/**/*.{spec,test}.{ts,tsx}'],
};
```

**编写测试**：在 `test/` 目录下创建 `{name}.test.ts` 或 `{name}.spec.ts` 文件

## 国际化使用

### 添加新的翻译

1. 在 `src/locales/zh-CN.json` 和 `src/locales/en-US.json` 中添加对应的键值对

```json
{
  "user": {
    "welcome": "{name}，欢迎回来！"
  }
}
```

2. 在组件中使用

```typescript
import { useIntl, FormattedMessage } from 'umi';

// 使用 useIntl hook
const intl = useIntl();
const welcome = intl.formatMessage(
  { id: 'user.welcome' },
  { name: '张三' }
);

// 或使用组件
<FormattedMessage id="user.welcome" values={{ name: '张三' }} />
```

### 切换语言

```typescript
import { setLocale } from 'umi';

// 切换到英文（不刷新页面）
setLocale('en-US', false);

// 切换到中文（不刷新页面）
setLocale('zh-CN', false);
```

## 部署

### Docker 部署

```bash
# 构建 Docker 镜像
docker build -t prompt-project:latest .

# 运行容器
docker run -d -p 3000:80 prompt-project:latest
```

### Nginx 部署

参考 `deploy/nginx.conf` 配置文件进行 Nginx 部署。

### GitLab CI

项目已配置 `.gitlab-ci.yml`，推送到 GitLab 会自动构建和部署。

## 开发工具

### i18n-ally 插件配置

项目已配置 VS Code 的 i18n-ally 插件，用于国际化开发：

- 自动识别 `src/locales/` 目录
- 支持键的实时预览
- 提供翻译编辑功能

### 点击组件跳转

使用 `clickToComponent` 功能可以快速定位组件源码：

1. Mac: Option + Click 组件
2. Windows: Alt + Click 组件

## 许可证

本项目基于 [MIT License](LICENSE) 开源协议。
