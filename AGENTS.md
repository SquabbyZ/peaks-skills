---
name: peaks-skills
description: AI-driven frontend development skills collection. Use when working with React, Next.js, Pixso design sync, forms generation, API hooks, or spec-driven development workflows.
---

# Peaks Skills

AI-driven frontend development skills for React/Next.js projects.

## Available Skills

| Skill | Trigger |
|-------|---------|
| **peaks-react-template** | "create React project", "scaffold", "template" |
| **peaks-pixso-code-sync** | "Pixso", "sync design", "design to code" |
| **peaks-hook-form** | "generate form", "React Hook Form" |
| **peaks-api-create** | "swagger", "API hooks", "OpenAPI" |
| **peaks-react-prompt-editor** | "prompt editor", "AI workflow" |
| **peaks-sdd** | "/peaks-sdd", "spec-driven", "初始化", "功能开发", "bug修复" |

## Directory Structure

```
skills/                    # vercel-labs/skills compatible format
├── SKILL.md              # Collection-level skill
├── peaks-react-template/
│   └── SKILL.md
├── peaks-pixso-code-sync/
│   └── SKILL.md
├── peaks-hook-form/
│   └── SKILL.md
├── peaks-api-create/
│   └── SKILL.md
├── peaks-react-prompt-editor/
│   └── SKILL.md
└── peaks-sdd/
    └── SKILL.md

peaks-*/                  # Native peaks-skills format (for peaks-skills CLI)
├── SKILL.md
├── scripts/
├── references/
└── assets/
```

## Quick Reference

### peaks-sdd Commands
- `/peaks-sdd 初始化我的项目` - Initialize project, detect tech stack, generate agent configs
- `/peaks-sdd 添加[功能描述]` - Full feature workflow: Constitution → PRD → Design → Develop → Review → QA → Deploy
- `/peaks-sdd [bug描述]` - Bug fix workflow: Reproduce → Root cause → Fix → Test → Verify

### Tech Stack Detection
peaks-sdd auto-detects from package.json:
- React/Vue → frontend agent
- NestJS → backend agent
- Tauri → tauri agent
- PostgreSQL (Prisma/Drizzle) → postgres agent
- Test frameworks → qa agent

## Requirements

- Node.js >= 16.0.0
- React 18+, TypeScript 5+, Tailwind CSS 3, Ant Design 5