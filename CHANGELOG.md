# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-04-03

### Changed
- peaks-hook-form: Add `{SchemaName}FormKey` enum and use enum keys in Zod schema + `defaultValue` for consistent field access.
- peaks-hook-form: `quick_start.py` supports per-field `component_type`; skips component generation when not specified; supports `input/select/switch/textarea/text` generation and avoids duplicate outputs.
- peaks-hook-form: `create_form_template.py` now accepts field definitions (`List[dict]`) and generates JSX + imports based on `component_type`; template component now uses `forwardRef` + `useImperativeHandle` to expose `submit()`.
- peaks-hook-form: `generate_form_component.py` generates generic field components (no longer per-field `FieldName` variants) and expands supported components (e.g. `switch`); CLI usage updated accordingly.

### Docs
- README (ZH/EN): Update peaks-hook-form section with a more complete recommended prompt template (including optional form dir, default schema name, and field format) and simplified feature bullets.
- peaks-hook-form: Update `prompt_templates.md` template 1 to include defaults and `componentType` in field format; refresh example content.
- peaks-hook-form: Update `SKILL.md` examples for `generate_form_component.py` to match generic component generation and include switch generation.

### Chore
- Staged changes currently include Python bytecode cache files (`__pycache__/*.pyc`). Consider excluding them via `.gitignore` if not intended for release artifacts.
