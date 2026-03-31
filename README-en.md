<div align="center">

# Peaks Skills

**English** | [简体中文](./README.md)

A high-efficiency skill collection designed for AI-driven frontend development, providing complete workflow solutions from design to code.

[!\[npm version\](https://img.shields.io/npm/v/peaks-skills.svg null)](https://www.npmjs.com/package/peaks-skills)
[!\[License: MIT\](https://img.shields.io/badge/License-MIT-yellow.svg null)](https://opensource.org/licenses/MIT)
[!\[GitHub stars\](https://img.shields.io/github/stars/SquabbyZ/peaks-skills null)](https://github.com/SquabbyZ/peaks-skills)

</div>

## 📦 Skills List

### 1. peaks-react-template

**Function**: One-click generation of production-ready React project templates

**Core Features**:

- ✅ Complete TypeScript + Tailwind CSS + Ant Design configuration
- ✅ Pre-configured ESLint, Prettier, Husky code quality tools
- ✅ Integrated AI coding rules and best practices
- ✅ Includes Docker, CI/CD deployment configuration
- ✅ Built-in internationalization, theme system, API service layer

**Use Cases**:

- Quickly scaffold new React/Next.js projects
- Standardize project structure and coding conventions
- Integrate AI-assisted development capabilities

### 2. peaks-pixso-code-sync

**Function**: Bidirectional synchronization between Pixso design files and local code

**Core Features**:

- 🔄 **Bidirectional Sync**: Two directions - Pixso→Code and Code→Pixso
- 🎯 **Precise Matching**: Auto-detect selected components or sync entire canvas
- 🛡️ **Safety Protection**: Preserve business logic code, add TODO markers on conflicts
- 🎨 **Style Restoration**: Layered data retrieval for maximum style fidelity
- 📊 **Mapping Management**: Auto-maintain mappings between design files and code

**Trigger Words**:

- "Sync from Pixso to code"
- "Sync code to Pixso"
- "Sync Pixso"
- "Bidirectional sync"

**Use Cases**:

- Quickly update code after designers modify designs
- Maintain design-code consistency during development
- Rapidly generate page frameworks from design files

### 3. peaks-hook-form

**Function**: One-click generation of React Hook Form + Ant Design forms

**Core Features**:

- ⚡ **Fast Generation**: Complete form in 5 minutes
- 📝 **Zod Validation**: Auto-generated type-safe validation logic
- 🎯 **Type Safety**: No `any` types, complete TypeScript types
- 🧩 **Componentization**: Reusable form field components
- 🚀 **Performance Optimized**: Memo-wrapped to prevent unnecessary re-renders

**Quick Start**:

```bash
python3 scripts/quick_start.py \
  DatasetSettingsAntd \
  RagConfig \
  --fields '[
    {"name":"name","type":"string","label":"Name","required":true},
    {"name":"description","type":"string","label":"Description"},
    {"name":"apiUrl","type":"string","label":"API URL","validation":"url"},
    {"name":"enabled","type":"boolean","label":"Enabled"}
  ]'
```

**Use Cases**:

- Quickly create configuration forms, settings pages
- Need form validation and type inference
- Want to reuse form components

### 4. peaks-api-create

**Function**: Automatically generate API hooks from Swagger/OpenAPI specifications

**Core Features**:

- 🔌 **Auto Generation**: Auto-parse endpoints from Swagger JSON
- 📦 **Module Organization**: APIs from same business module in one file
- 🧪 **Test Generation**: Auto-generate unit tests and Mock data
- 🔒 **Type Safety**: Complete TypeScript type definitions
- 🎯 **React Query**: Uses useQuery and useMutation

**Workflow**:

1. User provides Swagger JSON URL
2. Parse endpoints and group by business module
3. Generate/update `src/services/api.ts`
4. Generate hook files by module (e.g., `useUser.ts`)
5. Generate corresponding unit tests and Mock data
6. Auto-format with Prettier

**Use Cases**:

- Quickly create API hooks from backend Swagger documentation
- Need standardized API call layer
- Want to auto-generate tests and mocks

## 🚀 Quick Start

### Install via CLI (Recommended)

```bash
# Install skills to your project
npx peaks-skills install peaks-react-template
npx peaks-skills install peaks-pixso-code-sync
npx peaks-skills install peaks-hook-form
npx peaks-skills install peaks-api-create

# List all available skills
npx peaks-skills list
```

### Using in Trae IDE

After installation, use natural language in Trae IDE AI conversations:

```
• "Help me create a React project" → peaks-react-template
• "Sync this page from Pixso to code" → peaks-pixso-code-sync
• "Generate a form with username and email" → peaks-hook-form
• "Generate API hooks from swagger" → peaks-api-create
```

## 📚 Documentation

Each skill has detailed documentation:

- **peaks-react-template**: [SKILL.md](./peaks-react-template/SKILL.md)
- **peaks-pixso-code-sync**:
  - [SKILL.md](./peaks-pixso-code-sync/SKILL.md)
  - [Quick Start](./peaks-pixso-code-sync/references/quick-start.md)
  - [Bidirectional Sync Guide](./peaks-pixso-code-sync/references/bidirectional-sync-guide.md)
- **peaks-hook-form**:
  - [SKILL.md](./peaks-hook-form/SKILL.md)
  - [Quick Start](./peaks-hook-form/references/quick_start.md)
  - [Usage Guide](./peaks-hook-form/references/usage_guide.md)
- **peaks-api-create**: [SKILL.md](./peaks-api-create/SKILL.md)

## 🛠️ Tech Stack

All skills are based on the following tech stack:

- **Framework**: React 18, Next.js, Umijs
- **Language**: TypeScript (strict mode, no `any`)
- **Styling**: Tailwind CSS 3
- **Component Library**: Ant Design 6
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **Code Quality**: ESLint, Prettier, Husky
- **Testing**: Jest, React Testing Library
- **Deployment**: Docker, Nginx, GitLab CI

## 🎯 Design Philosophy

### 1. AI-First

All skills are optimized for AI-assisted development:

- Clear trigger words and intent recognition
- Structured workflows
- Explicit output formats and quality standards

### 2. Type Safety

Strictly follow TypeScript best practices:

- No `any` types allowed
- Complete type inference
- Type-driven API design

### 3. Code Quality

Built-in code quality assurance:

- Auto-formatting with Prettier
- ESLint rules enforcement
- Unit tests and Mock data generation

### 4. Developer Efficiency

Maximize development efficiency:

- One-click complete structure generation
- Reusable components and patterns
- Reduce repetitive work

## 🔧 Advanced Usage

### Custom Skills

You can create custom skills based on existing skill templates:

1. Copy the skill directory structure
2. Modify configuration in `SKILL.md`
3. Adjust workflows and output formats
4. Register new skills in Trae IDE

### Skill Combinations

Multiple skills can be used together:

```
1. Use peaks-react-template to create project
   ↓
2. Use peaks-api-create to generate API hooks
   ↓
3. Use peaks-hook-form to create forms
   ↓
4. Use peaks-pixso-code-sync to sync design files
```

### Integration with Existing Projects

These skills can be integrated into existing projects:

- **peaks-react-template**: Selectively copy configuration files and directory structures
- **peaks-hook-form**: Directly run scripts to generate components
- **peaks-api-create**: Generate API hooks in existing projects
- **peaks-pixso-code-sync**: Use after configuring mappings

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License

## 📞 Support

For questions or suggestions, please contact via:

- Submit an Issue
- Contact the author team

