# Changelog

All notable changes to this project will be documented in this file.

## [1.0.13] - 2026-05-08

### Fixed

**peaks-sdd 初始化流程**:
- Step 0.8 新增 `improve-codebase-architecture` skill 安装（所有 agent 模板引用但之前未安装）

---

## [1.0.12] - 2026-05-08

### Changed

**统一 Skills 目录结构**:
- 所有 skill 从根目录移至 `skills/` 目录,作为单一来源
- `npx peaks-skills install` 路径从 `<skill>/` 改为 `skills/<skill>/`
- 删除了根目录 `peaks-sdd/`,保留 `skills/peaks-sdd/` 完整副本(包含 commands, templates, references)
- `bin/cli.js` 更新路径引用,从 `skills/` 目录读取所有 skill

**skills.sh 收录准备**:
- 优化 `skills/` 目录结构,符合 vercel-labs/agent-skills 规范
- README / README-en 新增 `npx skills add` 安装说明

---

## [1.0.12] - 2026-05-08

### Added

#### peaks-sdd

**新增 Commands**：
- `/peakscheck` - 自动检查 peaks-sdd 是否有新版本（并行触发，不阻塞主命令）
- `/peaksupdate` - 更新 peaks-sdd 到最新版本，生成更新报告

**增量更新支持**：
- 初始化时检测项目是否已配置，已配置则执行增量更新
- Agent 模板对比更新机制，避免重复生成

**Vue 支持增强**：
- frontend Agent 新增 Vue2（Options API）和 Vue3（Composition API）开发规范
  - Vue2: Options API 顺序、Vuex 状态管理、响应式陷阱、`$set` 使用
  - Vue3: setup() 语法、Pinia 状态管理、`<script setup lang="ts">`
- code-reviewer-frontend Agent 支持 React + Vue2 + Vue3 三种框架审查
  - Vue2: Options API 顺序、Vuex 规范、响应式陷阱
  - Vue3: Composition API、Pinia、TypeScript 支持

**全局 Skills 配置**：
- 所有 Agent 模板新增 `improve-codebase-architecture` + `find-skills` skills
- peaksinit 初始化时自动安装这两个全局 Skills

**npm 链接**：
- 更新报告、初始化报告新增 npm 包链接 https://www.npmjs.com/package/peaks-skills

### Updated

#### peaks-sdd

**并行检查更新机制**：
- `/peaksinit`、`/peaksfeat`、`/peaksbug` 执行前并行检查 peaks-sdd 版本
- 检测到新版本时提示用户是否更新

**peaksinit 增强**：
- Step 0.3.1 新增 `improve-codebase-architecture` 架构分析步骤
- 结合 `@bunas/fs-mcp` 读取关键文件，深度理解项目结构
- 新增 `{{PROJECT_ARCHITECTURE}}` 变量用于 Agent 生成

**Agent 模板同步**：
- 14 个 Agent 模板全部更新，新增 skills 配置
- peaksinit 报告新增「Agent 配置同步状态」表格

---

## [1.0.11] - 2026-05-08

### Added

#### peaks-sdd

- **实测验证**：使用 CardList 滚动加载 bug 进行完整 bug 修复工作流测试
- **根因分析**：识别 IntersectionObserver 生命周期问题（useEffect 依赖导致 observer 重建死循环）
- **强制产出门禁**：4 个产出文件（bugs/fixes/auto-tests/reports）必须全部落盘
- **P0/P1/P2 优化分级**：
  - P0: 最终验收门禁（强制验证 4 个产出文件）
  - P1: 主动检查点（Phase 末尾验证）
  - P2: 改动量自检（单一文件 > 50 行需说明，> 100 行必须拆分）

### Updated

#### peaks-sdd

- peaksbug.md: 582 行（+102 行），完善验证检查点
- commands/peaksbug.md: 同步 Phase 1-8 编号，新增最终门禁说明

---

## [1.0.4] - 2026-05-07

### Added

#### peaks-sdd

- **新增技能**：规约驱动开发（Spec-Driven Development）工作流
- **智能项目初始化**：自动检测技术栈（React/NestJS/Tauri/PostgreSQL），动态生成对应的 Agent 配置
- **完整开发流程**：Constitution → PRD → 设计 → 开发 → Code Review → QA → 部署
- **系统化 Bug 修复**：reproduce → root cause → fix → test → verify
- **Checkpoint 门禁**：每个 Phase 完成后必须经过检查点确认，防止失控
- **Slash Commands**：`/peaksinit`、`/peaksfeat`、`/peaksbug`
- **跨会话 Memory**：通过 claude-mem MCP 实现上下文持久化
- **Karpathy 开发原则**：减少 LLM 编码错误的最佳实践指南

---

## [1.0.3] - 2026-04-23

### Added

#### peaks-hook-form

- **横向布局支持**：为所有表单子组件添加 `layout`、`labelWidth`、`showRequiredMark` 属性，支持 vertical/horizontal 两种布局模式
- **灵活样式配置**：
  - `marginBottom`：自定义表单项底部外边距（string | number）
  - `errorPosition`：支持 'below'（下方显示）和 'border'（边框覆盖）两种错误提示位置
- **新增 Tag 组件支持**：HookTagFormItem 用于标签输入场景
- **完善文档体系**：
  - FEATURES_UPDATE.md：详细记录 marginBottom 和 errorPosition 技术实现
  - HORIZONTAL_LAYOUT_UPDATE.md：横向布局功能说明和使用示例

#### peaks-pixso-code-sync

- **多源数据融合策略**：结合 mcp_pixso_design_to_code 和 mcp_pixso_get_image，解决 DSL 数据截断问题
- **性能大幅提升**：
  - 数据完整性：40% → 95% (+137%)
  - 代码准确性：50% → 90% (+80%)
  - 同步成功率：40% → 95% (+137%)
- **完善文档体系**：
  - OPTIMIZATION-CHECKLIST.md：优化完成清单
  - references/mcp-optimization-guide.md：MCP 工具优化使用指南
  - references/optimization-summary.md：优化总结文档
  - references/test-case.md：测试案例和效果验证

#### peaks-react-template

- **AI 编码规则集成**：.claude/rules/peaks-react-template.md，包含严格的 TypeScript 规范（禁止 any）、Tailwind CSS 优先原则、性能优化要求
- **辅助脚本增强**：scripts/use_template.py 确保所有隐藏文件（.husky/、.claude/、.npmrc 等）正确复制
- **完整的 Claude Code Skills 集成**：预配置 peaks-api-create、peaks-hook-form、peaks-pixso-code-sync 技能

#### peaks-react-prompt-editor

- **新增技能**：树形结构的 React Prompt 编辑器组件库使用指南
- **核心功能文档**：
  - 树形节点编排和拖拽排序
  - AI 优化流式输出（支持 OpenAI/Dify/百炼）
  - @变量插入系统和自定义数据选择器
  - 高度可定制的 UI（工具栏、节点操作、顶部区域）
  - 预览模式（只读编辑器/Markdown 渲染）
  - 国际化支持（zhCN/enUS）
  - 主题切换（system/light/dark）
  - 节点依赖管理

### Changed

#### peaks-hook-form

- 所有表单子组件使用 memo 包裹，优化渲染性能
- 统一错误状态判断逻辑：isDirty || isTouched || isSubmitted
- TextArea 在横向布局时使用 items-start 而非 items-center，确保顶部对齐

#### peaks-pixso-code-sync

- 重构 Pixso→代码 同步流程为 6 步优化版本
- 明确三个 MCP 工具的使用优先级和最佳实践
- 补充样式转换规则表格和组件层级映射说明

### Docs

- README: 更新 peaks-pixso-code-sync 和 peaks-hook-form 核心特性描述
- README: 添加持续优化章节，说明各技能的改进方向
- README: 技术栈中增加 AI 集成（Claude Code Skills, MCP）
- 各技能目录新增多个详细文档，提供完整的使用指南和最佳实践

---

## [1.0.2] - 2026-04-13

### Changed

- peaks-hook-form: Add `{SchemaName}FormKey` enum and use enum keys in Zod schema + `defaultValue` for consistent field access.
- peaks-hook-form: `quick_start.py` supports per-field `component_type`; skips component generation when not specified; supports `input/select/switch/textarea/text` generation and avoids duplicate outputs.
- peaks-hook-form: `create_form_template.py` now accepts field definitions (`List[dict]`) and generates JSX + imports based on `component_type`; template component now uses `forwardRef` + `useImperativeHandle` to expose `submit()`.
- peaks-hook-form: `generate_form_component.py` generates generic field components (no longer per-field `FieldName` variants) and expands supported components (e.g. `switch`); CLI usage updated accordingly.

### Docs

- README (ZH/EN): Update peaks-hook-form section with enhanced features (multiple component types support, enum key access), improved prompt template format, and added switch example.
- peaks-hook-form: Update `prompt_templates.md` template 1 to include defaults and `componentType` in field format; refresh example content.
- peaks-hook-form: Update `SKILL.md` examples for `generate_form_component.py` to match generic component generation and include switch generation.

## [1.0.1] - 2026-04-03

### Changed

- Initial release with peaks-hook-form bidirectional sync capabilities