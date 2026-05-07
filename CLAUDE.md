# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

peaks-skills is a collection of AI-driven frontend development skills for React, Next.js, Pixso design sync, forms, and API generation. The repository contains multiple self-contained skills that can be installed individually.

## Skills Structure

Each skill is a self-contained directory with:
- `SKILL.md` - Skill definition and documentation
- `scripts/` - Code generation scripts
- `references/` - Usage guides and examples
- `assets/` - Static assets

Available skills:
- `peaks-react-template` - Generate React/Next.js project templates with TypeScript, Tailwind, Ant Design
- `peaks-pixso-code-sync` - Bidirectional sync between Pixso designs and React code
- `peaks-hook-form` - Generate React Hook Form + Ant Design forms with Zod validation
- `peaks-api-create` - Auto-generate React Query hooks from Swagger/OpenAPI specs
- `peaks-react-prompt-editor` - Tree-structured React prompt editor component
- `peaks-sdd` - Spec-Driven Development workflow (init, feature, bug slash commands)

## CLI Commands

```bash
npx peaks-skills list              # List all available skills
npx peaks-skills install <skill>   # Install a skill to .claude/skills/
npx peaks-skills info <skill>      # Show skill details
npx peaks-skills init              # Initialize skills directory
```

## Architecture

```
/peaks-skills
├── bin/cli.js                     # npm CLI entry point
├── skill.yaml                     # Main skill registry (vercel-labs/skills format)
├── peaks-*/                       # Individual skill packages
│   ├── SKILL.md                   # Skill manifest
│   ├── scripts/                   # Code generation scripts
│   ├── references/                # Documentation
│   └── assets/                    # Static assets
└── peaks-sdd/                    # Spec-Driven Development skill
    ├── commands/                  # Slash command implementations
    └── templates/                # Project templates
```

## peaks-sdd Workflow

The peaks-sdd skill provides slash commands for project development:

| Command | Purpose |
|---------|---------|
| `/peaksinit` | Scan tech stack, generate .claude/agents/ configs |
| `/peaksfeat` | Full workflow: Constitution → PRD → Design → Develop → Review → QA → Deploy |
| `/peaksbug` | Bug workflow: Reproduce → Root cause → Fix → Test → Verify |

Working directory structure created by peaks-sdd:
```
.peaks/                    # SDD outputs (PRD, plans, reports, bugs)
.claude/
├── agents/               # Dynamic agent configurations by tech stack
├── settings.json          # MCP and command configuration
└── session-state.json     # Session state
```

## Tech Stack Detection

peaks-sdd auto-detects project type from package.json:
- React/Vue: dependencies
- Next.js: dependencies.next
- NestJS: dependencies.@nestjs/*
- Tauri: src-tauri/ or tauri.conf.json
- PostgreSQL: typeorm / prisma / drizzle
- Test frameworks: @playwright/test / vitest / jest

## Dependencies

- Node.js >= 16.0.0
- npm >= 7.0.0 or pnpm >= 7.0.0
- React 18+, TypeScript 5+, Tailwind CSS 3, Ant Design 5
