# 技术栈检测规则

## 前端框架

从 `package.json` dependencies/devDependencies 检测：

| 依赖 | 结果 |
| --- | --- |
| `react` | `FRONTEND_FRAMEWORK=react` |
| `vue` | `FRONTEND_FRAMEWORK=vue` |
| `next` | `FRONTEND_FRAMEWORK=next` |

## UI 库

| 依赖 | UI_LIBRARY | 框架 |
| --- | --- | --- |
| `antd` | antd | React |
| `@mui/material` | mui | React |
| `@chakra-ui/react` | chakra | React |
| `@radix-ui/*` | radix | React |
| `shadcn` | shadcn | React |
| `element-plus` | element-plus | Vue 3 |
| `naive-ui` | naive-ui | Vue 3 |
| `vuetify` | vuetify | Vue 3 |
| `quasar` | quasar | Vue 3 |
| `@ant-design/vue` | ant-design-vue | Vue 3 |
| `primevue` | primevue | Vue 3 |
| `element-ui` | element-ui | Vue 2 |
| `iview` | iview | Vue 2 |
| `bootstrap-vue` | bootstrap-vue | Vue 2 |
| `buefy` | buefy | Vue 2 |
| `muse-ui` | muse-ui | Vue 2 |
| `vue-material` | vue-material | Vue 2 |

## 后端框架

| 依赖 | 结果 |
| --- | --- |
| `@nestjs/core` | `BACKEND_FRAMEWORK=nestjs` |
| `express` | `BACKEND_FRAMEWORK=express` |
| `fastify` | `BACKEND_FRAMEWORK=fastify` |

## 桌面应用

| 文件/目录 | 结果 |
| --- | --- |
| `src-tauri/Cargo.toml` | `HAS_TAURI=true` |
| `tauri.conf.json` | `HAS_TAURI=true` |

## 数据库

| 依赖 | 结果 |
| --- | --- |
| `@prisma/client` / `prisma` | `HAS_DATABASE=postgresql`（除非配置另有说明） |
| `typeorm` | `HAS_DATABASE=postgresql`（除非配置另有说明） |
| `drizzle-orm` | `HAS_DATABASE=postgresql`（除非配置另有说明） |

## 测试框架

| 依赖 | 结果 |
| --- | --- |
| `@playwright/test` | playwright |
| `vitest` | vitest |
| `jest` | jest |

## Monorepo

| 文件 | 检测方式 |
| --- | --- |
| `pnpm-workspace.yaml` | 读取 packages |
| `lerna.json` | 读取 packages |
| `turbo.json` | 存在 pipeline/tasks 即视为 monorepo |
| root `package.json` | 读取 workspaces |

Monorepo 下 `PROJECT_PATH` 是根目录，`PACKAGES` 是子包列表；必要时让用户确认针对哪个包开发。
