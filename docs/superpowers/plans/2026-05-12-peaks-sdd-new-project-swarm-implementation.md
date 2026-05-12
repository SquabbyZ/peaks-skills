# Peaks SDD New Project Swarm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first foundation slice that makes the all-new-project swarm mode the primary path: change-scoped `.peaks` artifacts, fine-grained MCP policy, artifact verification, and runtime references/templates that make the new-project workflow executable by agents.

**Architecture:** Treat new-project swarm as the first-class mode and allow substantial peaks-sdd changes around it. Add focused reusable helpers under `scripts/lib/` for change-scoped artifact paths and MCP policy so future existing-project and bug workflows can reuse them later. Update scripts and references to use `.peaks/project`, `.peaks/current-change`, and `.peaks/changes/<change-id>/...`; existing-project and bugfix paths only keep lightweight route placeholders, not full compatibility implementation in this slice. Agent templates consume the new references and enforce deep brainstorming, design spec, Docker DB, shadcn/ui, unit-test, MCP, and persistence gates.

**Tech Stack:** Node.js ESM scripts, Markdown skill/reference templates, existing peaks-sdd CLI scripts, no new runtime dependencies.

---

## File Structure

### New files

- `skills/peaks-sdd/scripts/lib/change-artifacts.mjs`
  - Owns change ID normalization, `.peaks` project/change directory creation, `.peaks/current-change`, and path resolution.
- `skills/peaks-sdd/scripts/lib/mcp-policy.mjs`
  - Owns fine-grained MCP server registry, tech-stack-aware defaults, and safe merge behavior for `.claude/settings.json`.
- `skills/peaks-sdd/references/new-project-swarm-workflow.md`
  - Runtime reference for the confirmed full new-project swarm flow.
- `skills/peaks-sdd/references/artifact-layout.md`
  - Runtime reference for `.peaks/project` and `.peaks/changes/<change-id>` layout.
- `skills/peaks-sdd/references/mcp-policy.md`
  - Runtime reference for MCP stage injection and server-specific rules.

### Modified files

- `skills/peaks-sdd/scripts/lib/directory-creator.mjs`
  - Replace legacy `.peaks/prds`, `.peaks/reports`, etc. creation with change-scoped layout helpers.
  - Replace unconditional MCP installation with `mcp-policy.mjs`.
- `skills/peaks-sdd/scripts/init.mjs`
  - Accept optional `--change=<slug>`.
  - Stop deleting `.claude/agents/` during init.
  - Pass tech stack to MCP configuration.
- `skills/peaks-sdd/scripts/verify-artifacts.mjs`
  - Verify current change artifacts instead of legacy top-level `.peaks/prds` paths.
- `skills/peaks-sdd/SKILL.md`
  - Make all-new-project swarm the primary supported path.
  - Keep existing-project feature and bugfix as explicit “reserved for later” routes that reuse shared artifact/MCP helpers in future iterations.
  - Update output directories, quick references, and empty-project route to point at swarm workflow.
- `skills/peaks-sdd/references/empty-project-workflow.md`
  - Replace legacy flat artifact paths with change-scoped paths and deep brainstorming gates.
- `skills/peaks-sdd/references/resource-index.md`
  - Add the new reference/helper files.
- `skills/peaks-sdd/references/optional-skills.md`
  - Add design-taste/frontend-design/ui-ux, external enhancement source policy, and no-bulk-install guidance.
- `skills/peaks-sdd/references/memory-and-context.md`
  - Add Persistence Policy: `.peaks` state, GitNexus decisions, claude-mem long-term facts, Context7 docs.
- `skills/peaks-sdd/templates/agents/dispatcher.md`
  - Enforce new-project swarm routing and change-scoped artifact bus.
- `skills/peaks-sdd/templates/agents/product.md`
  - Enforce deep brainstorming gate.
- `skills/peaks-sdd/templates/agents/design.md`
  - Enforce design spec generation, design-taste/frontend-design/ui-ux guidance, awesome-design-md recommendation.
- `skills/peaks-sdd/templates/agents/qa/qa-child.md`
  - Enforce unit-test evidence and change-scoped reports.

---

## Task 1: Add change-scoped artifact helper

**Files:**
- Create: `skills/peaks-sdd/scripts/lib/change-artifacts.mjs`

- [ ] **Step 1: Create `change-artifacts.mjs`**

Write this complete file:

```js
#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const DEFAULT_INITIAL_CHANGE_SLUG = 'initial-product';

export const CHANGE_SUBDIRS = [
  'product',
  'design/screenshots',
  'architecture',
  'openspec',
  'swarm/briefs',
  'swarm/reports',
  'dispatch',
  'qa/screenshots',
  'review',
  'checkpoints'
];

export function getDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function slugifyChangeName(input = DEFAULT_INITIAL_CHANGE_SLUG) {
  const slug = String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || DEFAULT_INITIAL_CHANGE_SLUG;
}

export function createChangeId(input = DEFAULT_INITIAL_CHANGE_SLUG, date = new Date()) {
  const slug = slugifyChangeName(input);
  const stamp = getDateStamp(date);
  if (slug.startsWith(`${stamp}-`)) return slug;
  return `${stamp}-${slug}`;
}

export function getPeaksPaths(projectPath, changeId) {
  const peaksDir = join(projectPath, '.peaks');
  const projectDir = join(peaksDir, 'project');
  const changesDir = join(peaksDir, 'changes');
  const currentChangeFile = join(peaksDir, 'current-change');
  const activeChangeId = changeId || readCurrentChangeId(projectPath) || createChangeId();
  const changeRelativePath = join('changes', activeChangeId);
  const changeDir = join(peaksDir, changeRelativePath);

  return {
    peaksDir,
    projectDir,
    changesDir,
    currentChangeFile,
    changeId: activeChangeId,
    changeRelativePath,
    changeDir
  };
}

export function readCurrentChangeId(projectPath) {
  const currentChangeFile = join(projectPath, '.peaks', 'current-change');
  if (!existsSync(currentChangeFile)) return null;

  const content = readFileSync(currentChangeFile, 'utf-8').trim();
  if (!content) return null;
  return content.replace(/^changes\//, '');
}

export function writeCurrentChange(projectPath, changeId) {
  const { peaksDir, currentChangeFile } = getPeaksPaths(projectPath, changeId);
  mkdirSync(peaksDir, { recursive: true });
  writeFileSync(currentChangeFile, `changes/${changeId}\n`, 'utf-8');
}

export function createPeaksProjectLayout(projectPath, options = {}) {
  const changeId = options.changeId || createChangeId(options.changeName || DEFAULT_INITIAL_CHANGE_SLUG);
  const paths = getPeaksPaths(projectPath, changeId);

  mkdirSync(paths.projectDir, { recursive: true });
  mkdirSync(paths.changesDir, { recursive: true });
  mkdirSync(paths.changeDir, { recursive: true });

  for (const subdir of CHANGE_SUBDIRS) {
    mkdirSync(join(paths.changeDir, subdir), { recursive: true });
  }

  writeCurrentChange(projectPath, changeId);
  ensureProjectFile(join(paths.projectDir, 'overview.md'), '# Project Overview\n\n当前产品总览会在 PRD 确认后更新。\n');
  ensureProjectFile(join(paths.projectDir, 'product-knowledge.md'), '# Product Knowledge\n\n跨迭代稳定知识会在每个 change 完成后沉淀。\n');
  ensureProjectFile(join(paths.projectDir, 'roadmap.md'), '# Roadmap\n\n阶段规划会在需要时更新。\n');
  ensureProjectFile(join(paths.projectDir, 'decisions.md'), '# Project Decisions\n\n跨 change 的长期决策索引。\n');
  ensureProjectFile(join(paths.changeDir, 'enhancements.md'), '# Enhancements\n\n记录本 change 使用的外部 skills、MCP 查询和最佳实践来源。\n');

  return paths;
}

export function resolveChangeArtifact(projectPath, relativePath, changeId = readCurrentChangeId(projectPath)) {
  const paths = getPeaksPaths(projectPath, changeId);
  return join(paths.changeDir, relativePath);
}

function ensureProjectFile(path, content) {
  if (!existsSync(path)) {
    writeFileSync(path, content, 'utf-8');
  }
}
```

- [ ] **Step 2: Run syntax check**

Run: `node --check skills/peaks-sdd/scripts/lib/change-artifacts.mjs`

Expected: no output and exit code 0.

---

## Task 2: Add fine-grained MCP policy helper

**Files:**
- Create: `skills/peaks-sdd/scripts/lib/mcp-policy.mjs`

- [ ] **Step 1: Create `mcp-policy.mjs`**

Write this complete file:

```js
#!/usr/bin/env node

export const MCP_SERVER_REGISTRY = {
  gitnexus: {
    command: 'npx',
    args: projectPath => ['-y', 'gitnexus@latest', 'mcp', '--repo', projectPath],
    strategy: 'event-driven',
    stages: ['product', 'design', 'architecture', 'swarm', 'review', 'final']
  },
  'claude-mem': {
    command: 'npx',
    args: () => ['-y', '@the.dot/mem'],
    strategy: 'long-term-memory-only',
    stages: ['product', 'architecture', 'user-preferences']
  },
  context7: {
    command: 'npx',
    args: () => ['-y', '@upstash/context7-mcp@latest'],
    strategy: 'docs-on-demand',
    stages: ['tech-selection', 'shadcn', 'tauri', 'orm', 'framework-api']
  },
  fs: {
    command: 'npx',
    args: () => ['-y', '@bunas/fs-mcp'],
    strategy: 'restricted-project-filesystem',
    stages: ['artifact-validation']
  },
  'claude-md-management': {
    command: 'npx',
    args: () => ['-y', 'claude-md-management@claude-plugins-official'],
    strategy: 'rules-management-on-demand',
    stages: ['initialization', 'claude-md-update']
  },
  'code-review': {
    command: 'npx',
    args: () => ['-y', 'code-review@claude-plugins-official'],
    strategy: 'review-stage-only',
    stages: ['review', 'fix-wave']
  },
  'typescript-lsp': {
    command: 'npx',
    args: () => ['-y', 'typescript-lsp@claude-plugins-official'],
    strategy: 'typescript-projects-only',
    stages: ['frontend', 'backend-typescript', 'review']
  },
  superpowers: {
    command: 'npx',
    args: () => ['-y', 'superpowers@claude-plugins-official'],
    strategy: 'process-guidance-on-demand',
    stages: ['brainstorm', 'planning', 'verification']
  },
  'frontend-design': {
    command: 'npx',
    args: () => ['-y', 'frontend-design@claude-plugins-official'],
    strategy: 'ui-projects-only',
    stages: ['design', 'frontend-implementation', 'preview']
  }
};

export function getRecommendedMcpServers(techStack = {}) {
  const recommended = ['gitnexus', 'claude-mem', 'context7'];

  if (hasTypeScript(techStack)) {
    recommended.push('typescript-lsp');
  }

  if (hasUi(techStack)) {
    recommended.push('frontend-design');
  }

  return recommended;
}

export function buildMcpServers(projectPath, techStack = {}) {
  const selected = getRecommendedMcpServers(techStack);
  return Object.fromEntries(
    selected.map(name => {
      const config = MCP_SERVER_REGISTRY[name];
      return [name, { command: config.command, args: config.args(projectPath) }];
    })
  );
}

export function buildMcpPolicyNotes(techStack = {}) {
  const selected = getRecommendedMcpServers(techStack);
  return selected.map(name => {
    const config = MCP_SERVER_REGISTRY[name];
    return {
      name,
      strategy: config.strategy,
      stages: config.stages
    };
  });
}

function hasTypeScript(techStack = {}) {
  const frontend = String(techStack.frontend || '').toLowerCase();
  const backend = String(techStack.backend || '').toLowerCase();
  return Boolean(frontend || backend || techStack.typescript || techStack.ui);
}

function hasUi(techStack = {}) {
  const frontend = String(techStack.frontend || '').toLowerCase();
  const ui = String(techStack.ui || '').toLowerCase();
  return Boolean(frontend || ui || techStack.hasUi);
}
```

- [ ] **Step 2: Run syntax check**

Run: `node --check skills/peaks-sdd/scripts/lib/mcp-policy.mjs`

Expected: no output and exit code 0.

---

## Task 3: Update directory creation to use change-scoped layout and MCP policy

**Files:**
- Modify: `skills/peaks-sdd/scripts/lib/directory-creator.mjs`

- [ ] **Step 1: Update imports**

Replace the imports at the top with:

```js
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { status } from './terminal-ui.mjs';
import { createPeaksProjectLayout } from './change-artifacts.mjs';
import { buildMcpPolicyNotes, buildMcpServers } from './mcp-policy.mjs';
```

- [ ] **Step 2: Replace `createPeaksDirectory` implementation**

Replace the full `createPeaksDirectory` function with:

```js
export function createPeaksDirectory(projectPath, options = {}) {
  const paths = createPeaksProjectLayout(projectPath, options);

  console.log('\n\x1b[1m\x1b[36m📁\x1b[0m 创建 .peaks change-scoped 目录结构:');
  console.log('\x1b[90m' + '─'.repeat(50) + '\x1b[0m');
  console.log(`\x1b[32m  ✅ .peaks/project/\x1b[0m \x1b[90m- 跨迭代项目知识\x1b[0m`);
  console.log(`\x1b[32m  ✅ .peaks/${paths.changeRelativePath}/\x1b[0m \x1b[90m- 当前 change 产物\x1b[0m`);
  console.log(`\x1b[32m  ✅ .peaks/current-change\x1b[0m \x1b[90m- 指向 ${paths.changeRelativePath}\x1b[0m`);

  const readmePath = join(paths.peaksDir, 'README.md');
  if (!existsSync(readmePath)) {
    const readmeContent = `# .peaks

peaks-sdd 工作流产出物目录。

## 结构

- \`project/\`: 跨迭代稳定信息，例如产品总览、知识、路线图和长期决策索引。
- \`current-change\`: 当前活跃 change 指针，内容形如 \`changes/YYYY-MM-DD-initial-product\`。
- \`changes/<change-id>/\`: 每次全新项目、功能迭代或 bugfix 的阶段产物。

## Change 目录

每个 change 内部包含：

- \`product/\`: brainstorm 和 PRD
- \`design/\`: UX、视觉方向、设计规范、预览和截图
- \`architecture/\`: 技术栈、系统设计、决策
- \`openspec/\`: OpenSpec 映射和摘要
- \`enhancements.md\`: 外部 skills、MCP 查询和最佳实践来源
- \`swarm/\`: task graph、waves、status、briefs、reports、文件所有权
- \`dispatch/\`: 前后端研发调度图
- \`qa/\`: 测试计划、E2E 报告和截图
- \`review/\`: code review 和安全审查
- \`checkpoints/\`: 阶段检查点
- \`final-report.md\`: 最终报告
`;
    writeFileSync(readmePath, readmeContent, 'utf-8');
    console.log(`\x1b[32m  ✅ .peaks/README.md\x1b[0m`);
  } else {
    console.log(`\x1b[36m  ➖ .peaks/README.md 已存在\x1b[0m`);
  }

  return paths;
}
```

- [ ] **Step 3: Replace `configureMcpServers` signature and body**

Change the function signature to:

```js
export function configureMcpServers(projectPath, techStack = {}) {
```

Inside the function, replace the hardcoded `mcpServers` object with:

```js
  const mcpServers = buildMcpServers(projectPath, techStack);
  const mcpPolicyNotes = buildMcpPolicyNotes(techStack);
```

After the loop that adds servers, add:

```js
  settings.peaksSdd = {
    ...(settings.peaksSdd || {}),
    mcpPolicy: {
      mode: 'fine-grained-stage-injection',
      notes: mcpPolicyNotes
    }
  };
```

- [ ] **Step 4: Run syntax check**

Run: `node --check skills/peaks-sdd/scripts/lib/directory-creator.mjs`

Expected: no output and exit code 0.

---

## Task 4: Update init script for change IDs and non-destructive agents

**Files:**
- Modify: `skills/peaks-sdd/scripts/init.mjs`

- [ ] **Step 1: Import `createChangeId`**

Add this import near the other imports:

```js
import { createChangeId } from './lib/change-artifacts.mjs';
```

- [ ] **Step 2: Parse `--change=<slug>`**

In `parseTechStackOverride`, keep existing behavior. Add a new function below it:

```js
function parseChangeName(args) {
  for (const arg of args) {
    if (arg.startsWith('--change=')) {
      return arg.slice('--change='.length);
    }
  }
  return 'initial-product';
}
```

- [ ] **Step 3: Compute change ID in `main`**

After `const args = process.argv.slice(3);`, add:

```js
  const changeName = parseChangeName(args);
  const changeId = createChangeId(changeName);
```

- [ ] **Step 4: Stop deleting existing agents**

Replace this block:

```js
    // 清空 agents 目录重新生成
    if (existsSync(agentsDir)) {
      const { rmSync } = await import('fs');
      rmSync(agentsDir, { recursive: true });
    }
    mkdirSync(agentsDir, { recursive: true });
```

with:

```js
    mkdirSync(agentsDir, { recursive: true });
```

- [ ] **Step 5: Pass change and tech stack to helpers**

Replace:

```js
  createPeaksDirectory(projectPath);
```

with:

```js
  createPeaksDirectory(projectPath, { changeId });
```

Replace:

```js
  configureMcpServers(projectPath);
```

with:

```js
  configureMcpServers(projectPath, techStack);
```

- [ ] **Step 6: Run syntax check**

Run: `node --check skills/peaks-sdd/scripts/init.mjs`

Expected: no output and exit code 0.

---

## Task 5: Update artifact verification for current change layout

**Files:**
- Modify: `skills/peaks-sdd/scripts/verify-artifacts.mjs`

- [ ] **Step 1: Import current-change helpers**

Add this import with the existing imports:

```js
import { getPeaksPaths, readCurrentChangeId } from './lib/change-artifacts.mjs';
```

- [ ] **Step 2: Add current change resolution after `projectPath`**

After:

```js
const projectPath = process.argv[2] || defaultProjectPath;
```

add:

```js
const currentChangeId = readCurrentChangeId(projectPath) || '1970-01-01-initial-product';
const currentChangePath = getPeaksPaths(projectPath, currentChangeId).changeRelativePath;
```

- [ ] **Step 3: Replace artifact patterns**

Replace the `pattern` values in `ARTIFACT_CHECKS`:

```js
pattern: '.peaks/prds/prd-*.md'
```

with:

```js
pattern: `.peaks/${currentChangePath}/product/prd.md`
```

Replace:

```js
pattern: '.peaks/plans/tech-doc-*.md'
```

with:

```js
pattern: `.peaks/${currentChangePath}/architecture/system-design.md`
```

Replace:

```js
pattern: '.peaks/test-docs/test-case-*.md'
```

with:

```js
pattern: `.peaks/${currentChangePath}/qa/test-plan.md`
```

Replace:

```js
pattern: '.peaks/reports/*-self-test-*.md'
```

with:

```js
pattern: `.peaks/${currentChangePath}/swarm/reports/*.md`
```

Replace:

```js
pattern: '.peaks/reports/security-review-*.md'
```

with:

```js
pattern: `.peaks/${currentChangePath}/review/security-review.md`
```

- [ ] **Step 4: Add design spec check**

Insert this object after the PRD check:

```js
  {
    id: 2,
    name: '设计规范',
    pattern: `.peaks/${currentChangePath}/design/design-spec.md`,
    required: true,
    missingAction: '通知 design 补全'
  },
```

Renumber later artifact IDs so the table remains sequential.

- [ ] **Step 5: Run syntax check**

Run: `node --check skills/peaks-sdd/scripts/verify-artifacts.mjs`

Expected: no output and exit code 0.

---

## Task 6: Add new runtime references

**Files:**
- Create: `skills/peaks-sdd/references/artifact-layout.md`
- Create: `skills/peaks-sdd/references/mcp-policy.md`
- Create: `skills/peaks-sdd/references/new-project-swarm-workflow.md`

- [ ] **Step 1: Create `artifact-layout.md`**

Write this file:

```md
# Artifact Layout

peaks-sdd stores durable workflow state in `.peaks/`. Do not rely on conversation context for phase state.

## Layout

```text
.peaks/
  project/
    overview.md
    product-knowledge.md
    roadmap.md
    decisions.md
  current-change
  changes/
    YYYY-MM-DD-initial-product/
      product/
        brainstorm.md
        prd.md
      design/
        ux-flow.md
        ui-direction.md
        design-spec.md
        approved-preview.html
        screenshots/
      architecture/
        tech-stack.md
        system-design.md
        decisions.md
      openspec/
        change-name.txt
        summary.md
      enhancements.md
      swarm/
        task-graph.json
        waves.json
        status.json
        file-ownership.json
        briefs/
        reports/
      dispatch/
      qa/
      review/
      checkpoints/
      final-report.md
```

## Rules

- Every new project, feature iteration, and bugfix gets its own `.peaks/changes/<change-id>/`.
- `.peaks/current-change` contains the active relative path, for example `changes/2026-05-12-initial-product`.
- `.peaks/project/` stores cross-iteration knowledge only.
- Child agents receive explicit change-scoped file paths in their briefs.
- Do not write new artifacts to legacy top-level `.peaks/prds`, `.peaks/designs`, `.peaks/reports`, or `.peaks/checkpoints`.
```

- [ ] **Step 2: Create `mcp-policy.md`**

Write this file:

```md
# MCP Policy

MCP servers are optional capabilities. Configure them narrowly and inject them into the phases that need them.

| MCP server | Default policy | Use phase | Rule |
| --- | --- | --- | --- |
| `gitnexus` | Configure at init, trigger at gates | Product, Design, Architecture, Swarm, Review, Final | Record decisions and audit summaries only |
| `claude-mem` | Configure at init, trigger on long-term memory events | Product, Architecture, User preferences | Store stable preferences/facts only |
| `context7` | Configure at init, query on demand | Tech selection, shadcn/ui, Tauri, ORM/API | Query current official docs and summarize into artifacts |
| `fs` | On demand | Artifact validation | Keep inside project and respect file boundaries |
| `claude-md-management` | On demand | CLAUDE.md/rules updates | Do not write phase artifacts |
| `code-review` | Review phase only | Review, fix wave | Output to current change `review/` |
| `typescript-lsp` | TypeScript projects only | Frontend, backend TS, review | Helps navigation and diagnostics; does not replace tests |
| `superpowers` | On demand | Brainstorm, planning, verification | Process guidance only |
| `frontend-design` | UI projects only | Design, frontend, preview | Must feed design spec and frontend briefs |

## Rules

- Do not give every child agent every MCP by default.
- Inject MCP access through task briefs.
- MCP use must respect `mayModify`, `readOnly`, and `mustNotTouch` boundaries.
- Writes through MCP must be recorded in the current change report.
- Project-external filesystem, remote service, or global config access requires user approval.
```

- [ ] **Step 3: Create `new-project-swarm-workflow.md`**

Write this file:

```md
# New Project Swarm Workflow

Use this when the current directory is empty or nearly empty and the user describes a product/application idea.

## Flow

1. Create `.peaks/project/`, `.peaks/changes/<change-id>/`, `.peaks/current-change`, `.claude/agents/`, and `.gitnexus/`.
2. Run deep product brainstorming before writing PRD.
3. Confirm PRD before technical planning.
4. If UI exists, create and confirm a first design, then write `design/design-spec.md`.
5. Confirm tech stack and architecture.
6. Use Context7 for current framework/library docs when selecting shadcn/ui, Tauri, ORM, or framework APIs.
7. Create OpenSpec records when available; otherwise write `openspec/summary.md`.
8. Generate swarm task graph, waves, file ownership, and child briefs.
9. Execute bounded waves with max 5 child agents per wave and max 10 development child agents.
10. Require unit tests in implementation briefs.
11. Run code review, security review, QA, and fix waves until no CRITICAL/HIGH issues remain.
12. Start the app, verify the core path, and write `final-report.md`.

## Gates

- PRD cannot be written from a shallow one-shot prompt.
- Design spec is required before frontend technical docs.
- Docker Desktop is required before local database tasks.
- shadcn/ui must use official installation docs for the selected framework.
- Tauri tasks require Rust/Tauri preflight checks.
- Deployment requires explicit user confirmation.
```

- [ ] **Step 4: Verify files exist**

Run: `test -f skills/peaks-sdd/references/artifact-layout.md && test -f skills/peaks-sdd/references/mcp-policy.md && test -f skills/peaks-sdd/references/new-project-swarm-workflow.md`

Expected: exit code 0.

---

## Task 7: Update skill references and workflow docs

**Files:**
- Modify: `skills/peaks-sdd/SKILL.md`
- Modify: `skills/peaks-sdd/references/empty-project-workflow.md`
- Modify: `skills/peaks-sdd/references/resource-index.md`

- [ ] **Step 1: Update `SKILL.md` quick reference and output directories**

Replace the empty-project row with:

```md
| 空目录创建项目 | 新项目蜂群：深度 product 脑暴 → PRD → 设计稿和设计规范 → 技术栈/架构 → OpenSpec → swarm waves → CR/安全/QA → 预览 | `references/new-project-swarm-workflow.md`, `references/artifact-layout.md`, `references/mcp-policy.md` |
```

Replace the `.peaks/` output tree with:

```text
.peaks/
├── project/                 # 跨迭代稳定知识
├── current-change           # 当前活跃 change 指针
└── changes/<change-id>/     # 每次新项目、功能迭代或 bugfix 的产物
    ├── product/
    ├── design/
    ├── architecture/
    ├── openspec/
    ├── swarm/
    ├── qa/
    ├── review/
    ├── checkpoints/
    └── final-report.md
```

Add these reference rows:

```md
| `references/new-project-swarm-workflow.md` | 全新项目蜂群端到端流程 |
| `references/artifact-layout.md` | `.peaks/project` 和 change-scoped 产物目录规范 |
| `references/mcp-policy.md` | 细粒度 MCP 使用、默认启用和阶段注入策略 |
```

- [ ] **Step 2: Update `empty-project-workflow.md`**

Replace the “必要产出” section with change-scoped paths:

```md
## 必要产出

```text
.peaks/current-change
.peaks/project/overview.md
.peaks/project/product-knowledge.md
.peaks/changes/<change-id>/product/brainstorm.md
.peaks/changes/<change-id>/product/prd.md
.peaks/changes/<change-id>/design/approved-preview.html
.peaks/changes/<change-id>/design/design-spec.md
.peaks/changes/<change-id>/architecture/tech-stack.md
.peaks/changes/<change-id>/architecture/system-design.md
.peaks/changes/<change-id>/architecture/decisions.md
.peaks/changes/<change-id>/qa/test-plan.md
.peaks/changes/<change-id>/swarm/task-graph.json
.peaks/changes/<change-id>/swarm/waves.json
.peaks/changes/<change-id>/swarm/status.json
.peaks/changes/<change-id>/review/code-review.md
.peaks/changes/<change-id>/review/security-review.md
.peaks/changes/<change-id>/final-report.md
```
```

- [ ] **Step 3: Update `resource-index.md` scripts and references**

Add rows for:

```md
| `references/new-project-swarm-workflow.md` | 全新项目蜂群端到端流程 |
| `references/artifact-layout.md` | change-scoped `.peaks/` 目录规范 |
| `references/mcp-policy.md` | 细粒度 MCP server 策略 |
| `scripts/lib/change-artifacts.mjs` | change-scoped artifact 路径和目录创建 |
| `scripts/lib/mcp-policy.mjs` | MCP server 注册表和技术栈感知配置 |
```

- [ ] **Step 4: Search for stale paths**

Run: `grep -R "\.peaks/prds\|\.peaks/designs\|\.peaks/reports\|\.peaks/checkpoints" -n skills/peaks-sdd/SKILL.md skills/peaks-sdd/references/empty-project-workflow.md skills/peaks-sdd/references/resource-index.md || true`

Expected: no output.

---

## Task 8: Update key agent templates for swarm gates

**Files:**
- Modify: `skills/peaks-sdd/templates/agents/dispatcher.md`
- Modify: `skills/peaks-sdd/templates/agents/product.md`
- Modify: `skills/peaks-sdd/templates/agents/design.md`
- Modify: `skills/peaks-sdd/templates/agents/qa/qa-child.md`

- [ ] **Step 1: Add dispatcher rule block**

Add this section near the top of `dispatcher.md`:

```md
## New Project Swarm Rules

For empty or nearly-empty projects, use `references/new-project-swarm-workflow.md` and `references/artifact-layout.md`.

- Resolve the active change from `.peaks/current-change`.
- Write all phase artifacts under `.peaks/changes/<change-id>/`.
- Do not write new workflow artifacts to legacy top-level `.peaks/prds`, `.peaks/designs`, `.peaks/reports`, or `.peaks/checkpoints`.
- Generate `swarm/task-graph.json`, `swarm/waves.json`, `swarm/status.json`, and `swarm/file-ownership.json` before dispatching child agents.
- Inject only the MCP servers needed for a given phase, following `references/mcp-policy.md`.
- Do not start implementation until PRD, design spec, and architecture are confirmed.
```

- [ ] **Step 2: Add product deep brainstorming gate**

Add this section to `product.md`:

```md
## Deep Brainstorming Gate

Product brainstorming must feel like careful product collaboration, not a perfunctory checklist.

Before writing `product/prd.md`:

- Complete at least 5 meaningful interaction rounds unless the user explicitly skips.
- Clarify target user, job-to-be-done, core workflow, constraints, success metric, and MVP scope.
- Challenge at least 3 weak assumptions or risky choices.
- Offer 2-3 product directions or wedges with tradeoffs.
- Record rejected directions and why.
- Get explicit user confirmation for target user, core flow, MVP scope, and success criteria.

Write outputs under `.peaks/changes/<change-id>/product/`.
```

- [ ] **Step 3: Add design spec gate**

Add this section to `design.md`:

```md
## Design Spec Gate

If the product has UI, the first approved design must produce `.peaks/changes/<change-id>/design/design-spec.md` before frontend technical docs.

Use or recommend:

- `design-taste-frontend`
- `ui-ux-pro-max`
- `frontend-design`
- `design-md`
- awesome-design-md for style exploration: https://github.com/voltagent/awesome-design-md

The design spec must include color tokens, typography, spacing, radius, shadow, responsive breakpoints, component states, motion rules, reduced-motion behavior, accessibility requirements, and shadcn/ui theme mapping when applicable.
```

- [ ] **Step 4: Add QA unit-test evidence rule**

Add this section to `qa/qa-child.md`:

```md
## Unit Test Evidence

For implementation verification, check unit tests before E2E when relevant.

- Confirm each implementation brief lists unit tests in `requiredTests` or explains why unit tests do not apply.
- Record unit test commands and results in the QA report.
- Do not mark a change complete if new business logic, hooks, services, data access, or utilities lack unit tests without a written reason.
- Write QA outputs under `.peaks/changes/<change-id>/qa/`.
```

- [ ] **Step 5: Verify template additions**

Run: `grep -R "New Project Swarm Rules\|Deep Brainstorming Gate\|Design Spec Gate\|Unit Test Evidence" -n skills/peaks-sdd/templates/agents`

Expected: four matching sections.

---

## Task 9: Run verification commands

**Files:**
- No code changes unless checks fail.

- [ ] **Step 1: Run syntax checks**

Run:

```bash
node --check skills/peaks-sdd/scripts/lib/change-artifacts.mjs && node --check skills/peaks-sdd/scripts/lib/mcp-policy.mjs && node --check skills/peaks-sdd/scripts/lib/directory-creator.mjs && node --check skills/peaks-sdd/scripts/init.mjs && node --check skills/peaks-sdd/scripts/verify-artifacts.mjs
```

Expected: no output and exit code 0.

- [ ] **Step 2: Run package test command**

Run: `npm test`

Expected: current repository behavior is `No tests specified` and exit code 0.

- [ ] **Step 3: Smoke-test init script in a temp directory**

Run:

```bash
tmpdir=$(mktemp -d) && node skills/peaks-sdd/scripts/init.mjs "$tmpdir" --frontend=react --ui=shadcn --change=initial-product && test -f "$tmpdir/.peaks/current-change" && test -d "$tmpdir/.peaks/project" && test -d "$tmpdir/.peaks/changes" && test -f "$tmpdir/.claude/settings.json"
```

Expected: command exits 0 and printed init output shows change-scoped `.peaks` creation.

- [ ] **Step 4: Inspect temp MCP settings**

Run:

```bash
node -e "const fs=require('fs'); const path=process.argv[1]; const s=JSON.parse(fs.readFileSync(path,'utf8')); const names=Object.keys(s.mcpServers||{}); if(!names.includes('gitnexus')||!names.includes('claude-mem')||!names.includes('context7')||!names.includes('typescript-lsp')||!names.includes('frontend-design')) process.exit(1); if(names.includes('fs')||names.includes('code-review')||names.includes('superpowers')) process.exit(2); console.log(names.sort().join(','));" "$tmpdir/.claude/settings.json"
```

Expected: prints `claude-mem,context7,frontend-design,gitnexus,typescript-lsp`.

---

## Task 10: Review changed code

**Files:**
- No direct edits unless review finds issues.

- [ ] **Step 1: Use TypeScript/JavaScript reviewer**

Dispatch a `typescript-reviewer` agent with this prompt:

```text
Review the peaks-sdd changes for Node.js ESM correctness, safe filesystem behavior, MCP settings merge behavior, and maintainability. Focus on changed files: scripts/lib/change-artifacts.mjs, scripts/lib/mcp-policy.mjs, scripts/lib/directory-creator.mjs, scripts/init.mjs, scripts/verify-artifacts.mjs. Report CRITICAL/HIGH/MEDIUM/LOW issues only; do not modify files.
```

Expected: no CRITICAL/HIGH issues.

- [ ] **Step 2: Fix any CRITICAL/HIGH issues**

If reviewer reports CRITICAL/HIGH issues, fix them before marking implementation complete.

- [ ] **Step 3: Run syntax and smoke tests again**

Run the Task 9 commands again.

Expected: all pass.
