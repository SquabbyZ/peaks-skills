<div align="right">

[🇺🇸 English](README-en.md) | [🇨🇳 简体中文](README.md)

</div>

---

# Peaks React Template

A modern frontend project template based on Umi + React + TypeScript, supporting internationalization (i18n), state management, request interception, and other enterprise-level features.

## Features

### Core Technology Stack

- **Framework**: Umi 4.x - Enterprise-grade React application framework
- **UI Library**: Ant Design 6.x - Enterprise UI component library
- **Language**: TypeScript 5.x - Type-safe JavaScript superset
- **Styling**: Tailwind CSS 3.x - Utility-first CSS framework
- **State Management**: Zustand 5.x - Lightweight state management library
- **Data Fetching**: TanStack React Query 5.x + Umi Request
- **Form Handling**: React Hook Form 7.x + Zod validation
- **Hooks Library**: ahooks 3.x - High-quality React Hooks library
- **Date Handling**: Day.js - Lightweight date manipulation library
- **Package Manager**: pnpm - Fast, space-efficient package manager

### Main Features

#### 1. Internationalization (i18n)

The project includes a complete internationalization solution supporting multi-language switching:

- **Supported Languages**: Simplified Chinese (zh-CN), English (en-US)
- **Configuration Location**: `src/locales/` directory
- **Switching Method**: Refresh-free language switching via `setLocale` API
- **UI Component**: Built-in `SelectLang` component for quick language selector integration

**Related Files**:
- [src/locales/zh-CN.json](src/locales/zh-CN.json) - Chinese language pack
- [src/locales/en-US.json](src/locales/en-US.json) - English language pack

#### 2. Click Component to Source Code

Development mode supports clicking page components to directly jump to editor source code location (React projects only):

- **Mac**: Option + Click
- **Windows**: Alt + Click
- **View Parent Components**: Option + Right-click / Alt + Right-click
- **Configuration**: `clickToComponent` option in `.umirc.ts`

#### 3. Critical CSS Variables Inline

Avoid FOUC (Flash of Unstyled Content) by inlining CSS variables into HTML `<head>`:

- CSS variables file: `src/styles/variables.css`
- Automatically injected before JS execution to ensure style consistency

#### 4. Path Aliases

Support concise path alias imports:

| Alias | Actual Path |
|-------|------------|
| `@` | `/src` |
| `@components` | `/src/components/` |
| `@hooks` | `/src/hooks/` |
| `@services` | `/src/services/` |
| `@pages` | `/src/pages/` |
| `@layouts` | `/src/layouts/` |
| `@assets` | `/src/assets/` |
| `@styles` | `/src/styles/` |
| `@typeDefs` | `/src/types/` |

#### 5. API Proxy

Configured `/api` path proxy for convenient backend API calls during development:

```typescript
proxy: {
  '/api': {
    target: process.env.API_DOMAIN || 'http://localhost:3000',
    changeOrigin: true,
  },
}
```

#### 6. Code Standards

The project integrates multiple code standard tools:

- **ESLint**: Code quality checking
- **Prettier**: Code formatting
- **Husky**: Git Hooks (commit-msg, pre-commit)
- **lint-staged**: Only lint staged files
- **commitlint**: Commit message standards (based on Conventional Commits)

#### 7. Unit Testing (Jest)

The project integrates Jest as the unit testing framework:

- **Configuration**: `jest.config.js`
- **Test Directory**: `test/` directory
- **File Pattern**: `{name}.{spec,test}.{ts,tsx,js,jsx}`
- **Test Commands**:
  - `pnpm test` - Run tests
  - `pnpm test:watch` - Run tests in watch mode

## Project Structure

```
prompt-project/
├── .husky/                  # Git Hooks configuration
│   ├── commit-msg          # commit-msg hook
│   └── pre-commit          # pre-commit hook
├── .trae/                  # Trae AI skills configuration
│   └── skills/             # Skills directory
│       ├── peaks-api-create/
│       ├── peaks-hook-form/
│       └── peaks-pixso-code-sync/
├── .vscode/                # VS Code configuration
│   └── settings.json       # i18n-ally plugin configuration
├── deploy/                 # Deployment configuration
│   ├── .gitlab-ci.yml      # GitLab CI configuration
│   ├── Dockerfile           # Docker configuration
│   └── nginx.conf           # Nginx configuration
├── src/                    # Source code directory
│   ├── constants/           # Constants definition
│   │   └── index.ts
│   ├── layouts/             # Layout components
│   │   └── index.tsx
│   ├── locales/             # Internationalization language files
│   │   ├── zh-CN.json       # Chinese
│   │   └── en-US.json       # English
│   ├── pages/               # Page components
│   │   └── Home.tsx
│   ├── services/            # Service layer (API requests)
│   │   ├── api.ts
│   │   ├── index.ts
│   │   ├── queryClient.ts
│   │   └── request.ts
│   ├── styles/              # Style files
│   │   ├── global.css
│   │   └── variables.css    # CSS variables
│   ├── theme/               # Theme configuration
│   │   └── index.ts
│   └── types/               # TypeScript type definitions
│       ├── api.ts
│       ├── index.ts
│       └── utils.ts
├── test/                    # Test files directory
│   └── example.test.ts      # Test example
├── .env                    # Environment variables
├── .eslintcache            # ESLint cache
├── .eslintignore           # ESLint ignore configuration
├── .eslintrc.js            # ESLint configuration
├── .gitignore              # Git ignore configuration
├── .lintstagedrc.js        # lint-staged configuration
├── .npmrc                  # npm/pnpm configuration
├── .prettierignore         # Prettier ignore configuration
├── .prettierrc.json        # Prettier configuration
├── .umirc.ts               # Umi configuration
├── commitlint.config.js    # commitlint configuration
├── jest.config.js          # Jest test configuration
├── package.json            # Project dependencies
├── pnpm-lock.yaml         # pnpm lock file
├── postcss.config.js       # PostCSS configuration
├── routes.ts               # Routes configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── typings.d.ts            # Type declarations
```

## Quick Start

### Environment Requirements

- Node.js: >= 22.22.0
- pnpm: >= 10.x (recommended) or npm >= 11.x

### Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

### Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Auto-fix code issues
pnpm lint:fix

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Environment Variables

Create a `.env` file in the project root:

```env
# API domain
API_DOMAIN=http://localhost:3000

# Website title
TITLE=My App

# Default language
LOCALE=zh-CN

# Language separator
LOCALE_BASE_SEPARATOR=-

# Favicon list (comma-separated)
FAVICONONS=https://example.com/favicon1.ico,https://example.com/favicon2.ico
```

## Core Modules

### 1. Layout System

Layout components are located in `src/layouts/index.tsx`, defining the overall layout structure of the application.

### 2. Routes Configuration

Routes are defined in the `routes.ts` file, supporting the following configuration:

```typescript
export const Routes = {
  Home: '/',
};

const routes = [
  { path: Routes.Home, component: 'Home' },
];
```

### 3. Service Layer

The service layer is located in the `src/services/` directory:

- `api.ts` - API interface definitions
- `request.ts` - Request encapsulation based on Umi Request
- `queryClient.ts` - TanStack Query client configuration
- `index.ts` - Service export entry

### 4. Style System

Style files are located in the `src/styles/` directory:

- `variables.css` - CSS variables definition (loaded on first screen)
- `global.css` - Global styles

### 5. Theme Configuration

Theme configuration is located in `src/theme/index.ts`, allowing customization of Ant Design theme variables.

### 6. Type Definitions

TypeScript type definitions are located in the `src/types/` directory:

- `api.ts` - API-related types
- `utils.ts` - Utility types
- `index.ts` - Type export entry

### 7. Test Configuration

Jest test configuration is located in `jest.config.js`, test files are placed in the `test/` directory:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['<rootDir>/test/**/*.{spec,test}.{ts,tsx}'],
};
```

**Writing Tests**: Create `{name}.test.ts` or `{name}.spec.ts` files in the `test/` directory

## Internationalization Usage

### Adding New Translations

1. Add corresponding key-value pairs in `src/locales/zh-CN.json` and `src/locales/en-US.json`

```json
{
  "user": {
    "welcome": "{name}, welcome back!"
  }
}
```

2. Use in components

```typescript
import { useIntl, FormattedMessage } from 'umi';

// Using useIntl hook
const intl = useIntl();
const welcome = intl.formatMessage(
  { id: 'user.welcome' },
  { name: 'John' }
);

// Or using component
<FormattedMessage id="user.welcome" values={{ name: 'John' }} />
```

### Switching Languages

```typescript
import { setLocale } from 'umi';

// Switch to English (no page refresh)
setLocale('en-US', false);

// Switch to Chinese (no page refresh)
setLocale('zh-CN', false);
```

## Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t prompt-project:latest .

# Run container
docker run -d -p 3000:80 prompt-project:latest
```

### Nginx Deployment

Refer to the `deploy/nginx.conf` configuration file for Nginx deployment.

### GitLab CI

The project has `.gitlab-ci.yml` configured, pushes to GitLab will automatically build and deploy.

## Development Tools

### i18n-ally Plugin Configuration

The project configures VS Code's i18n-ally plugin for internationalization development:

- Automatically recognizes `src/locales/` directory
- Supports real-time key preview
- Provides translation editing functionality

### Click Component to Source

Use the `clickToComponent` feature to quickly locate component source:

1. Mac: Option + Click component
2. Windows: Alt + Click component

## License

This project is open source under the [MIT License](LICENSE).