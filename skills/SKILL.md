---
name: peaks-skills
description: AI-driven frontend development skills for React, Next.js, Pixso design sync, forms, and API generation. Install individual skills or the entire collection.
---

# Peaks Skills Collection

A comprehensive set of AI-driven frontend development skills for React/Next.js projects.

## Available Skills

| Skill | Description |
|-------|-------------|
| **peaks-react-template** | Generate complete React/Next.js project templates with pre-configured tooling |
| **peaks-pixso-code-sync** | Bidirectional sync between Pixso design files and React code |
| **peaks-hook-form** | Generate React Hook Form + Ant Design forms with Zod validation |
| **peaks-api-create** | Auto-generate React Query hooks from Swagger/OpenAPI specifications |
| **peaks-react-prompt-editor** | Tree-structured React prompt editor for AI workflows |
| **peaks-sdd** | Spec-Driven Development workflow with Constitution, PRD, Design, Develop, Review, QA, and Deploy phases |

## Installation

Install the entire collection:
```bash
npx skills add SquabbyZ/peaks-skills
```

Or install individual skills:
```bash
npx skills add SquabbyZ/peaks-skills --skill peaks-react-template
npx skills add SquabbyZ/peaks-skills --skill peaks-hook-form
# etc.
```

## Quick Start

### peaks-react-template
Generate a complete React project template:
```bash
# Use the helper script to copy template
python scripts/use_template.py ./my-new-project
```

### peaks-pixso-code-sync
Bidirectional sync between Pixso and React code. Triggers:
- "从 Pixso 同步到代码" / "sync from Pixso"
- "把代码同步到 Pixso" / "sync to Pixso"

### peaks-hook-form
Generate forms with one command:
```bash
python3 scripts/quick_start.py FormName SchemaName --fields '[{"name":"field1","type":"string"}]'
```

### peaks-api-create
Generate API hooks from Swagger:
```
用户提供 swagger JSON URL → 自动解析并生成 hooks
```

### peaks-sdd
Spec-Driven Development workflow:
- `/peaksinit` - Initialize project, detect tech stack
- `/peaksfeat` - Full feature development workflow
- `/peaksbug` - Bug fix workflow with systematic debugging

## Requirements

- Node.js >= 16.0.0
- React 18+, TypeScript 5+, Tailwind CSS 3, Ant Design 5
- Works with Claude Code, Cursor, VS Code, Windsurf, and other AI coding agents

## Repository

https://github.com/SquabbyZ/peaks-skills