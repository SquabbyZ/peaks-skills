<div align="center">

# Peaks Skills

[English](./README-en.md) | **简体中文**

一个专为 AI 驱动的前端开发设计的高效能技能集合，提供从设计到代码的完整工作流解决方案。

[!\[npm version\](https://img.shields.io/npm/v/peaks-skills.svg null)](https://www.npmjs.com/package/peaks-skills)
[!\[License: MIT\](https://img.shields.io/badge/License-MIT-yellow.svg null)](https://opensource.org/licenses/MIT)
[!\[GitHub stars\](https://img.shields.io/github/stars/SquabbyZ/peaks-skills null)](https://github.com/SquabbyZ/peaks-skills)

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
- 🎯 支持多种组件类型：input、select、switch、textarea、text（只读展示）
- 🔑 使用枚举键访问字段，类型更安全

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

## 🚀 快速开始

### 使用 CLI 安装（推荐）

```bash
# 安装技能到当前项目
npx peaks-skills install peaks-react-template
npx peaks-skills install peaks-pixso-code-sync
npx peaks-skills install peaks-hook-form
npx peaks-skills install peaks-api-create

# 查看所有可用技能
npx peaks-skills list
```

### 在 Trae IDE 中使用

技能安装后，在 Trae IDE 的 AI 对话中直接使用自然语言触发：

```
• "帮我创建一个 React 项目" → peaks-react-template
• "从 Pixso 同步这个页面到代码" → peaks-pixso-code-sync
• "生成一个表单，包含用户名和邮箱" → peaks-hook-form
• "根据 swagger 生成 API hooks" → peaks-api-create
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

## 🔧 高级用法

### 自定义技能

你可以基于现有技能模板创建自定义技能：

1. 复制技能目录结构
2. 修改 `SKILL.md` 中的配置
3. 调整工作流程和输出格式
4. 在 Trae IDE 中注册新技能

### 技能组合

多个技能可以组合使用：

```
1. 使用 peaks-react-template 创建项目
   ↓
2. 使用 peaks-api-create 生成 API hooks
   ↓
3. 使用 peaks-hook-form 创建表单
   ↓
4. 使用 peaks-pixso-code-sync 同步设计稿
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
