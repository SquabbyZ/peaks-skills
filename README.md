<div align="center">

# Peaks Skills

[English](./README-en.md) | **简体中文**

一个专为 AI 驱动的前端开发设计的高效能技能集合，提供从设计到代码的完整工作流解决方案。

[![npm version](https://img.shields.io/npm/v/peaks-skills.svg)](https://www.npmjs.com/package/peaks-skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/SquabbyZ/peaks-skills)](https://github.com/SquabbyZ/peaks-skills)
[![skills.sh](https://skills.sh/b/SquabbyZ/peaks-skills)](https://skills.sh/SquabbyZ/peaks-skills)
</div>

## 📦 技能列表

### 1. peaks-react-template

**功能**：一键生成生产级 React 项目模板

**核心特性**：

- ✅ 完整的 TypeScript + Tailwind CSS + Ant Design 配置
- ✅ 预配置 ESLint、Prettier、Husky 代码质量工具
- ✅ 集成 AI 编码规则和最佳实践
- ✅ 包含 Docker、CI/CD 部署配置
- ✅ 内置国际化、主题系统、API 服务层

**使用场景**：

- 快速搭建新的 React/Next.js 项目
- 需要标准化项目结构和编码规范
- 希望集成 AI 辅助开发能力

### 2. peaks-pixso-code-sync

**功能**：实现 Pixso 设计稿与本地代码的双向同步

**核心特性**：

- 🔄 **双向同步**：Pixso→代码 和 代码→Pixso 两个方向
- 🎯 **精准匹配**：自动识别选中组件或同步整个画布
- 🛡️ **安全保护**：保留业务逻辑代码，冲突时添加 TODO 标记
- 🎨 **样式还原**：分层数据获取，最大化样式还原度
- 📊 **映射管理**：自动维护设计稿与代码文件的映射关系
- ⚡ **优化策略**：多源数据融合（design_to_code + get_image），解决 DSL 截断问题
- 📈 **高完整性**：数据完整性从 40% 提升至 95%，代码准确性达 90%

**触发词**：

- "从 Pixso 同步到代码"
- "把代码同步到 Pixso"
- "同步 Pixso"
- "双向同步"

**使用场景**：

- 设计师修改设计稿后快速更新代码
- 开发过程中保持设计和代码一致
- 从设计稿快速生成页面框架

### 3. peaks-hook-form

**功能**：一键生成 React Hook Form + Ant Design 表单

**核心特性**：

- 📝 自动生成类型安全的表单字段与 Zod 校验逻辑
- 🧩 表单字段组件化，便于复用与扩展
- 🚀 默认做基础性能优化，减少不必要的重渲染
- 🎯 支持多种组件类型：input、select、switch、textarea、text（只读展示）、tag
- 🔑 使用枚举键访问字段，类型更安全
- 📐 **横向布局支持**：支持 vertical/horizontal 两种布局模式，可自定义 label 宽度
- 🎨 **灵活样式配置**：
  - `marginBottom`：自定义表单项底部外边距
  - `errorPosition`：支持 'below'（下方）和 'border'（边框）两种错误提示位置
- ✨ **必填标记控制**：通过 `showRequiredMark` 控制是否显示必填星号

**提示词模板（推荐）**：

```text
使用 peaks-hook-form 技能生成一个表单：
- 表单名称：[FormName] (例如：UserSettingsForm)
- 表单目录：默认值为 src/components/，可选项
- Schema 名称：默认值为 [FormName].schema.ts，可选项
- 字段列表：
  * [字段名] [组件类型] ([类型]): [标签名称] [验证规则/其他要求]
  * [字段名] [组件类型] ([类型]): [标签名称] [验证规则/其他要求]
```

```text
示例：
使用 peaks-hook-form 技能生成一个表单：
- 表单名称：CreateNewPropmt
- 字段列表：
  * name input (string): 提示词名称 必填，最多 64 个字符，只能包含中文、字母数字、下划线
  * template text (string): 提示词模板，只做为数据展示不可交互
  * theme select (string): 主题
  * description textarea (string): 描述
  * enabled switch (boolean): 启用
```

**使用场景**：

- 快速创建配置表单、设置页面
- 需要表单验证和类型推导
- 希望复用表单组件

### 4. peaks-api-create

**功能**：根据 Swagger/OpenAPI 规范自动生成 API hooks

**核心特性**：

- 🔌 **自动生成**：从 Swagger JSON 自动解析 endpoints
- 📦 **按模块组织**：同一业务模块的 API 放在一个文件
- 🧪 **测试生成**：自动生成单元测试和 Mock 数据
- 🔒 **类型安全**：完整的 TypeScript 类型定义
- 🎯 **React Query**：使用 useQuery 和 useMutation

**工作流程**：

1. 用户提供 Swagger JSON URL
2. 解析 endpoints 并按业务模块分组
3. 生成/更新 `src/services/api.ts`
4. 按模块生成 hook 文件（如 `useUser.ts`）
5. 生成对应的单元测试和 Mock 数据
6. 自动使用 Prettier 格式化

**使用场景**：

- 根据后端 Swagger 文档快速创建 API hooks
- 需要标准化的 API 调用层
- 希望自动生成测试和 Mock

### 5. peaks-react-prompt-editor

**功能**：树形结构的 React Prompt 编辑器组件库

**核心特性**：

- 🌳 **树形节点编排**：支持多层级 Prompt 节点管理，可拖拽排序
- 🤖 **AI 优化流式输出**：内置 AI 优化功能，支持 OpenAI/Dify/百炼等平台
- 📊 **变量插入系统**：@变量选择器，支持自定义数据源和多选批量插入
- 🛠️ **高度可定制**：
  - 自定义工具栏（renderToolbar）
  - 自定义节点操作（renderNodeActions）
  - 自定义节点顶部区域（renderNodeTopSlot）
- 👁️ **预览模式**：支持只读编辑器和 Markdown 渲染两种预览方式
- 🌍 **国际化支持**：内置中英文语言包（zhCN/enUS）
- 🎨 **主题切换**：支持 system/light/dark 三种主题模式
- ⚡ **依赖管理**：节点间可声明依赖关系，运行时自动收集依赖内容

**安装使用**：

```bash
pnpm add react-prompt-editor antd @ant-design/x
```

```tsx
import { PromptEditor, TaskNode } from "react-prompt-editor";
import "react-prompt-editor/styles/index.css";

const [data, setData] = useState<TaskNode[]>([
  {
    id: "1",
    title: "System Prompt",
    content: "# Role\nYou are a helpful assistant.",
    children: [],
    isLocked: false,
    hasRun: false,
  },
]);

<PromptEditor value={data} onChange={setData} />;
```

**使用场景**：

- 构建 AI 工作流编辑器
- 管理复杂 Prompt 结构
- 集成变量插入功能
- 实现流式 AI 优化
- 多语言支持的 Prompt 管理系统

### 6. peaks-sdd

**功能**：规约驱动开发（Spec-Driven Development）工作流

**核心特性**：

- ⚡ **智能项目初始化**：自动检测技术栈（React/Vue2/Vue3/NestJS/Tauri/PostgreSQL），动态生成对应的 Agent 配置
- 📋 **完整开发流程**：Constitution → PRD → 设计 → 开发 → Code Review → QA → 部署
- 🐛 **系统化 Bug 修复**：reproduce → root cause → fix → test → verify
- 🔧 **Checkpoint 门禁**：每个 Phase 完成后必须经过检查点确认，防止失控
- 🤖 **动态 Agent 生成**：根据检测到的技术栈自动选择和配置 Agent
- 💾 **跨会话 Memory**：通过 claude-mem MCP 实现上下文持久化
- 🛠️ **Slash Command**：`/peaks-sdd`（统一入口）
- 🔔 **自动更新检查**：使用任一命令时自动检查新版本，提示用户更新
- 🏗️ **增量更新**：已初始化项目再次运行 `/peaks-sdd 初始化` 时自动增量更新 Agent 模板
- 🌐 **Vue 全面支持**：Vue2（Options API + Vuex）和 Vue3（Composition API + Pinia）开发规范和代码审查

**工作流程**：

| 命令 | 说明 | 适用场景 |
|------|------|---------|
| `/peaks-sdd 初始化` | 项目初始化/增量更新 | 新项目或现有项目配置/更新 Agent |
| `/peaks-sdd 添加[功能]` | 功能开发 | 0→1 新项目，复杂项目多团队协作 |
| `/peaks-sdd [bug描述]` | Bug 修复 | 问题复现 → 根因分析 → 修复 → 回归测试 |

**技术栈检测**：

| 检测项 | 来源 | 说明 |
|--------|------|------|
| 前端框架 | package.json.dependencies.react | React 项目 |
| 后端框架 | package.json.dependencies.@nestjs/* | NestJS 后端 |
| 桌面应用 | src-tauri/ 或 tauri.conf.json | Tauri 项目 |
| 全栈框架 | package.json.dependencies.next | Next.js |
| 数据库 | typeorm / prisma / drizzle | 数据库 ORM |
| 测试框架 | @playwright/test / vitest / jest | 测试框架 |

**使用场景**：

- 从零开始的新项目搭建
- 复杂项目的多方对齐和流程管控
- 系统化 Bug 修复和根因分析
- 需要持久化开发上下文的长期项目

## 🚀 快速开始

### 通过 skills.sh 安装（兼容 Vercel agent-skills 生态）

```bash
# 安装全部技能
npx skills add SquabbyZ/peaks-skills

# 仅安装单个技能
npx skills add SquabbyZ/peaks-skills/skills/peaks-sdd
```

技能会被解压到 `.claude/skills/`,Claude Code、Cursor 等支持 SKILL.md 规范的 agent 会自动发现并按 description 触发。

### 使用 CLI 安装（推荐）

```bash
# 安装技能到当前项目
npx peaks-skills install peaks-react-template
npx peaks-skills install peaks-pixso-code-sync
npx peaks-skills install peaks-hook-form
npx peaks-skills install peaks-api-create
npx peaks-skills install peaks-react-prompt-editor
npx peaks-skills install peaks-sdd

# 查看所有可用技能
npx peaks-skills list
```

### 在 Claude Code 中使用

技能安装后，在 Claude Code 的 AI 对话中直接使用自然语言触发：

```
• "帮我创建一个 React 项目" → peaks-react-template
• "从 Pixso 同步这个页面到代码" → peaks-pixso-code-sync
• "生成一个表单，包含用户名和邮箱" → peaks-hook-form
• "根据 swagger 生成 API hooks" → peaks-api-create
• "创建一个 Prompt 编辑器" → peaks-react-prompt-editor
• "初始化我的项目" / "peaks-sdd 初始化" → peaks-sdd
• "开发新功能" / "peaks-sdd 添加..." → peaks-sdd
• "修复这个 bug" / "peaks-sdd ..." → peaks-sdd
```

## 📚 文档

每个技能都有详细的文档：

- **peaks-react-template**: [SKILL.md](./peaks-react-template/SKILL.md)
- **peaks-pixso-code-sync**:
  - [SKILL.md](./peaks-pixso-code-sync/SKILL.md)
  - [快速开始](./peaks-pixso-code-sync/references/quick-start.md)
  - [双向同步指南](./peaks-pixso-code-sync/references/bidirectional-sync-guide.md)
- **peaks-hook-form**:
  - [SKILL.md](./peaks-hook-form/SKILL.md)
  - [快速开始](./peaks-hook-form/references/quick_start.md)
  - [使用指南](./peaks-hook-form/references/usage_guide.md)
- **peaks-api-create**: [SKILL.md](./peaks-api-create/SKILL.md)
- **peaks-react-prompt-editor**: [SKILL.md](./peaks-react-prompt-editor/SKILL.md)
- **peaks-sdd**: [SKILL.md](./peaks-sdd/SKILL.md)

## 🛠️ 技术栈

所有技能基于以下技术栈：

- **框架**: React 18, Next.js, Umijs
- **语言**: TypeScript (严格模式，禁止 `any`)
- **样式**: Tailwind CSS 3
- **组件库**: Ant Design 6
- **状态管理**: React Query (TanStack Query)
- **表单**: React Hook Form + Zod
- **代码质量**: ESLint, Prettier, Husky
- **测试**: Jest, React Testing Library
- **部署**: Docker, Nginx, GitLab CI
- **AI 集成**: Claude Code Skills, MCP (Model Context Protocol)

## 🎯 设计理念

### 1. AI 优先

所有技能都针对 AI 辅助开发进行了优化：

- 清晰的触发词和意图识别
- 结构化的工作流程
- 明确的输出格式和质量标准

### 2. 类型安全

严格遵循 TypeScript 最佳实践：

- 禁止使用 `any` 类型
- 完整的类型推导
- 类型驱动的 API 设计

### 3. 代码质量

内置代码质量保障：

- 自动使用 Prettier 格式化
- ESLint 规则约束
- 单元测试和 Mock 数据生成

### 4. 开发效率

最大化开发效率：

- 一键生成完整结构
- 可复用的组件和模式
- 减少重复性工作

### 5. 持续优化

定期优化和增强：

- peaks-pixso-code-sync: 多源数据融合策略，解决 DSL 截断问题
- peaks-hook-form: 横向布局支持和灵活的样式配置
- 完善的文档体系和最佳实践指南

## 🔧 高级用法

### 自定义技能

你可以基于现有技能模板创建自定义技能：

1. 复制技能目录结构
2. 修改 `SKILL.md` 中的配置
3. 调整工作流程和输出格式
4. 在 Claude Code 中注册新技能

### 技能组合

多个技能可以组合使用：

```
1. 使用 peaks-sdd (/peaks-sdd 初始化) 初始化项目
   ↓
2. 使用 peaks-react-template 创建项目结构
   ↓
3. 使用 peaks-api-create 生成 API hooks
   ↓
4. 使用 peaks-hook-form 创建表单
   ↓
5. 使用 peaks-pixso-code-sync 同步设计稿
   ↓
6. 使用 peaks-react-prompt-editor 构建 AI 工作流编辑器
   ↓
7. 使用 peaks-sdd (/peaks-sdd 添加...) 开发新功能
   ↓
8. 使用 peaks-sdd (/peaks-sdd ...) 修复 bug
```

### 与现有项目集成

这些技能可以集成到现有项目中：

- **peaks-react-template**: 选择性复制配置文件和目录结构
- **peaks-hook-form**: 直接运行脚本生成组件
- **peaks-api-create**: 在现有项目中生成 API hooks
- **peaks-pixso-code-sync**: 配置映射关系后使用

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 支持

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 联系作者团队
