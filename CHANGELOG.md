# Changelog

All notable changes to this project will be documented in this file.

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

- **AI 编码规则集成**：.trae/rules/peaks-react-template.md，包含严格的 TypeScript 规范（禁止 any）、Tailwind CSS 优先原则、性能优化要求
- **辅助脚本增强**：scripts/use_template.py 确保所有隐藏文件（.husky/、.trae/、.npmrc 等）正确复制
- **完整的 Trae Skills 集成**：预配置 peaks-api-create、peaks-hook-form、peaks-pixso-code-sync 技能

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
- README: 技术栈中增加 AI 集成（Trae IDE Skills, MCP）
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
