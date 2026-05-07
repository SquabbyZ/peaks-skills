---
name: peaks-react-template
description: Generate a complete React/Next.js project template based on the peaks-react-template structure. Use when users request to create a new React project, scaffold a React application, generate project boilerplate, or initialize a React/Next.js codebase with best practices and pre-configured setup.
---

# Peaks React Template

## Overview

This skill provides a complete, production-ready React/Next.js project template with pre-configured tooling, best practices, and essential development setup. Use this skill to quickly scaffold new React projects with a comprehensive set of features including TypeScript, ESLint, Prettier, Husky hooks, testing setup, and deployment configurations.

## When to Use This Skill

Use this skill when users request:
- "Create a new React project"
- "Scaffold a React application"
- "Generate a Next.js template"
- "Initialize a React codebase"
- "Set up a React project with best practices"
- "Create a full-stack React application structure"

## Project Structure

This template includes a comprehensive React/Next.js project structure:

### Core Configuration Files
- **TypeScript**: `tsconfig.json` - TypeScript configuration
- **ESLint**: `.eslintrc.js`, `.eslintignore` - Code linting rules
- **Prettier**: `.prettierrc.json`, `.prettierignore` - Code formatting
- **Environment**: `.env` - Environment variables template
- **Git**: `.gitignore` - Git ignore patterns
- **NPM Registry**: `.npmrc` - NPM registry configuration with Chinese mirrors

### Development Tools
- **Husky**: `.husky/` - Git hooks (pre-commit, commit-msg)
- **Commitlint**: `commitlint.config.js` - Commit message linting
- **Lint-staged**: `.lintstagedrc.js` - Staged file linting

### Build & Deployment
- **Docker**: `deploy/Dockerfile`, `deploy/nginx.conf` - Containerization
- **CI/CD**: `deploy/.gitlab-ci.yml` - GitLab CI configuration
- **PostCSS**: `postcss.config.js` - CSS processing
- **Tailwind**: `tailwind.config.js` - Utility-first CSS framework

### Source Code Structure (`src/`)
```
src/
├── constants/       # Application constants
├── layouts/         # Layout components
├── locales/         # Internationalization files
├── pages/           # Page components
├── services/        # API services and HTTP client
├── styles/          # Global styles and CSS variables
├── theme/           # Theme configuration
└── types/           # TypeScript type definitions
```

### AI Rules & Skills
- **.claude/rules/peaks-react-template.md**: AI coding rules with strict guidelines for:
  - TypeScript best practices (no `any` type allowed)
  - Tailwind CSS first styling approach
  - Performance optimization requirements
  - Code style and project structure
- **.claude/skills/**: Pre-configured AI skills for enhanced development
  - `peaks-api-create`: API hook generation from Swagger
  - `peaks-hook-form`: React Hook Form + Ant Design forms
  - `peaks-pixso-code-sync`: Pixso design to code synchronization

### Testing & Documentation
- **Jest**: `jest.config.js` - Testing framework configuration
- **README**: `README.md`, `README-en.md` - Project documentation
- **License**: `LICENSE` - Project license

## Usage Instructions

### Method 1: Using the Helper Script (Recommended)

The template includes a helper script that ensures ALL files (including hidden files like `.husky/`, `.claude/`, `.npmrc`, etc.) are copied correctly:

```bash
# Navigate to the skill directory
cd /path/to/peaks-react-template

# Run the template copy script
python scripts/use_template.py /path/to/your/new-project
```

This script will:
- Copy ALL files including hidden files (`.husky/`, `.claude/`, `.npmrc`, `.eslintrc.js`, etc.)
- Preserve file permissions and timestamps
- List all hidden files that were copied
- Display next steps for project setup

### Method 2: Manual Copy

If you prefer to copy manually, use one of these methods to ensure hidden files are included:

**Using rsync (macOS/Linux):**
```bash
rsync -av /path/to/peaks-react-template/assets/peaks-react-template/ /path/to/your/new-project/
```

**Using cp (macOS/Linux):**
```bash
cp -R /path/to/peaks-react-template/assets/peaks-react-template/. /path/to/your/new-project/
```

**Using PowerShell (Windows):**
```powershell
Copy-Item -Path "\path\to\peaks-react-template\assets\peaks-react-template\*" -Destination "\path\to\your\new-project" -Recurse -Force
```

**⚠️ Important:** Make sure to copy hidden files (files starting with `.`). Common hidden files in this template:
- `.husky/` - Git hooks
- `.claude/` - AI rules and skills
- `.npmrc` - NPM registry config
- `.eslintrc.js` - ESLint config
- `.prettierrc.json` - Prettier config
- `.gitignore` - Git ignore patterns
- `.env` - Environment variables template

### Post-Copy Setup

After copying the template:

1. **Update package.json** with your project name and metadata
2. **Install dependencies**: `npm install` or `pnpm install`
3. **Configure environment**: Update `.env` with your variables
4. **Customize configurations** as needed (ESLint, Prettier, etc.)
5. **Start development**: `npm run dev` or `pnpm dev`

## Key Features

### 1. Pre-configured Tooling
- TypeScript for type safety
- ESLint + Prettier for code quality
- Husky for git hooks
- Commitlint for commit message standards

### 2. Development Best Practices
- Component-based architecture
- Service layer for API calls
- Centralized theme and styling
- Internationalization ready
- Type-safe API integration

### 3. Deployment Ready
- Docker configuration
- Nginx setup
- CI/CD pipeline (GitLab)
- Environment-specific configs

### 4. AI-Powered Development
- Integrated Claude Code skills for:
  - Automatic API hook generation
  - Form component scaffolding
  - Design-to-code synchronization

### 5. AI Coding Rules
- Comprehensive AI coding guidelines in `.claude/rules/peaks-react-template.md`:
  - **Zero tolerance for `any` type** - Must use proper TypeScript types
  - **Tailwind CSS first** - Prefer utility classes over inline styles
  - **Performance requirements** - Core Web Vitals targets and optimization checklist
  - **Code style enforcement** - Consistent patterns for components, hooks, and API calls

## Resources

This skill includes the complete project template in the `assets/peaks-react-template/` directory, containing all files and folders needed to bootstrap a new React/Next.js project.

### assets/peaks-react-template/

The complete project structure including:
- All configuration files (including hidden files)
- Source code templates
- Deployment scripts
- Git hooks
- Documentation
- AI coding rules (`.claude/rules/peaks-react-template.md`)
- Claude Code skills integration

**Usage**: Copy the entire `assets/peaks-react-template/` directory to your target location using the helper script or manual copy methods described above.

### scripts/use_template.py

Helper script to copy the template while preserving ALL files including hidden files.

**Features:**
- ✅ Copies ALL files including hidden files (`.husky/`, `.claude/`, `.npmrc`, etc.)
- ✅ Preserves file permissions and timestamps
- ✅ Lists all copied hidden files
- ✅ Displays next steps for project setup

**Usage:**
```bash
python scripts/use_template.py ./my-new-project
```

## Customization Guide

### Common Customizations

1. **Project Metadata**: Update `package.json` name, version, description
2. **Environment Variables**: Modify `.env` for your API endpoints
3. **Theme**: Update `src/theme/index.ts` for brand colors
4. **API Base URL**: Configure in `src/services/request.ts`
5. **Locales**: Add translations in `src/locales/`

### Optional Removals

If certain features aren't needed:
- Remove `.husky/` if not using git hooks
- Remove `deploy/` if using different deployment strategy
- Remove `.claude/skills/` if not using AI skills
- Remove `jest.config.js` if using different testing framework

## Quick Start Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Run tests
pnpm test

# Format code
pnpm format
```
