# peaks-sdd 自动化工作流实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 peaks-sdd 空目录初始化后的全自动化工作流：PRD → 设计 → 知识积累 → 技术文档+测试用例 → 开发 → CR+安全(并行) → 3轮QA → 部署

**Architecture:** 修改 SKILL.md 空目录初始化流程 + 新增 workflow-continuer.mjs 脚本 + 增强 dispatcher 模板

**Tech Stack:** Node.js MJS scripts, Claude Code Agent tool

---

## 文件结构

```
skills/peaks-sdd/
├── SKILL.md                              # 修改：补全空目录初始化流程
├── scripts/
│   ├── workflow-continuer.mjs           # 新建：工作流自动执行脚本
│   └── lib/
│       └── session-state-manager.mjs     # 新建：session 状态管理
└── templates/agents/
    └── dispatcher.md                     # 修改：增强 Step 7 CR+安全循环
```

---

## Task 1: 新建 session-state-manager.mjs

**Files:**
- Create: `skills/peaks-sdd/scripts/lib/session-state-manager.mjs`
- Test: N/A (工具脚本)

**Purpose:** 管理 workflow 状态和检查点

- [ ] **Step 1: 创建 session-state-manager.mjs**

```javascript
#!/usr/bin/env node
/**
 * peaks-sdd Session 状态管理器
 * 管理 workflow 状态、检查点、context 估算
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Workflow 状态枚举
 */
export const WorkflowState = {
  INIT: 'init',
  NAME_CONFIRMED: 'name_confirmed',
  PRD_DONE: 'prd_done',
  TECH_STACK_CONFIRMED: 'tech_stack_confirmed',
  DESIGN_DONE: 'design_done',
  KNOWLEDGE_DONE: 'knowledge_done',
  DOCS_DONE: 'docs_done',
  DEVELOPMENT_DONE: 'development_done',
  CR_SECURITY_PASSED: 'cr_security_passed',
  QA_PASSED: 'qa_passed',
  DEPLOY_DONE: 'deploy_done'
};

/**
 * SessionStateManager 类
 */
export class SessionStateManager {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.stateFile = join(projectPath, '.claude', 'session-state.json');
    this.workflowStateFile = join(projectPath, '.peaks', 'workflow-state.json');
  }

  /**
   * 读取 session state
   */
  readSessionState() {
    if (!existsSync(this.stateFile)) {
      return {
        contextEstimate: 0,
        projectType: null,
        techStack: {},
        currentWorkflow: null
      };
    }
    try {
      return JSON.parse(readFileSync(this.stateFile, 'utf-8'));
    } catch (e) {
      return { contextEstimate: 0, projectType: null, techStack: {}, currentWorkflow: null };
    }
  }

  /**
   * 写入 session state
   */
  writeSessionState(state) {
    mkdirSync(join(this.projectPath, '.claude'), { recursive: true });
    writeFileSync(this.stateFile, JSON.stringify(state, null, 2), 'utf-8');
  }

  /**
   * 读取 workflow state
   */
  readWorkflowState() {
    if (!existsSync(this.workflowStateFile)) {
      return {
        currentState: WorkflowState.INIT,
        stepHistory: [],
        checkpoints: []
      };
    }
    try {
      return JSON.parse(readFileSync(this.workflowStateFile, 'utf-8'));
    } catch (e) {
      return { currentState: WorkflowState.INIT, stepHistory: [], checkpoints: [] };
    }
  }

  /**
   * 写入 workflow state
   */
  writeWorkflowState(state) {
    mkdirSync(join(this.projectPath, '.peaks'), { recursive: true });
    writeFileSync(this.workflowStateFile, JSON.stringify(state, null, 2), 'utf-8');
  }

  /**
   * 更新 workflow 状态
   */
  updateWorkflowState(newState, metadata = {}) {
    const state = this.readWorkflowState();
    state.stepHistory.push({
      from: state.currentState,
      to: newState,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    state.currentState = newState;
    this.writeWorkflowState(state);
    return state;
  }

  /**
   * 产出检查点
   */
  saveCheckpoint(checkpointType, data) {
    const state = this.readWorkflowState();
    const checkpoint = {
      type: checkpointType,
      timestamp: new Date().toISOString(),
      data
    };
    state.checkpoints.push(checkpoint);
    this.writeWorkflowState(state);

    // 同时写入检查点文件
    const checkpointDir = join(this.projectPath, '.peaks', 'checkpoints');
    mkdirSync(checkpointDir, { recursive: true });
    const checkpointFile = join(checkpointDir, `checkpoint-${checkpointType}-${Date.now()}.md`);
    writeFileSync(checkpointFile, `# Checkpoint - ${checkpointType}\n\n${JSON.stringify(data, null, 2)}`, 'utf-8');
    return checkpointFile;
  }

  /**
   * 检查是否需要 compact
   */
  needsCompact() {
    const session = this.readSessionState();
    return session.contextEstimate >= 75;
  }

  /**
   * 获取当前状态
   */
  getCurrentState() {
    return this.readWorkflowState().currentState;
  }
}

export default SessionStateManager;
```

---

## Task 2: 新建 workflow-continuer.mjs

**Files:**
- Create: `skills/peaks-sdd/scripts/workflow-continuer.mjs`
- Dependencies: `session-state-manager.mjs`

**Purpose:** 工作流自动执行脚本，检查当前状态并执行下一步

- [ ] **Step 1: 创建 workflow-continuer.mjs**

```javascript
#!/usr/bin/env node
/**
 * peaks-sdd 工作流自动执行脚本
 * 检查当前状态并自动执行下一步
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SessionStateManager, WorkflowState } from './lib/session-state-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getSkillDir() {
  let dir = __dirname;
  for (let i = 0; i < 5; i++) {
    dir = join(dir, '..');
    if (existsSync(join(dir, 'SKILL.md'))) {
      return dir;
    }
  }
  return null;
}

/**
 * 状态流转映射
 */
const STATE_TRANSITIONS = {
  [WorkflowState.INIT]: 'step1_confirm_name',
  [WorkflowState.NAME_CONFIRMED]: 'step2_prd_brainstorm',
  [WorkflowState.PRD_DONE]: 'step3_confirm_tech_stack',
  [WorkflowState.TECH_STACK_CONFIRMED]: 'step4_design',
  [WorkflowState.DESIGN_DONE]: 'step5_knowledge',
  [WorkflowState.KNOWLEDGE_DONE]: 'step6_docs',
  [WorkflowState.DOCS_DONE]: 'step7_development',
  [WorkflowState.DEVELOPMENT_DONE]: 'step8_cr_security',
  [WorkflowState.CR_SECURITY_PASSED]: 'step9_qa',
  [WorkflowState.QA_PASSED]: 'step10_deploy'
};

/**
 * 检查产出物是否存在
 */
function checkArtifacts(projectPath, state) {
  const artifacts = {
    [WorkflowState.NAME_CONFIRMED]: () => existsSync(join(projectPath, 'package.json')),
    [WorkflowState.PRD_DONE]: () => existsSync(join(projectPath, '.peaks', 'prds')),
    [WorkflowState.TECH_STACK_CONFIRMED]: () => true, // 技术栈在 state 中
    [WorkflowState.DESIGN_DONE]: () => existsSync(join(projectPath, '.peaks', 'designs')),
    [WorkflowState.KNOWLEDGE_DONE]: () => existsSync(join(projectPath, '.peaks', 'knowledge', 'product-knowledge.md')),
    [WorkflowState.DOCS_DONE]: () => {
      const plansDir = join(projectPath, '.peaks', 'plans');
      const testDocsDir = join(projectPath, '.peaks', 'test-docs');
      return existsSync(plansDir) && existsSync(testDocsDir);
    },
    [WorkflowState.DEVELOPMENT_DONE]: () => existsSync(join(projectPath, '.peaks', 'reports', 'dispatcher-summary.md')),
    [WorkflowState.CR_SECURITY_PASSED]: () => {
      const reportsDir = join(projectPath, '.peaks', 'reports');
      return existsSync(join(reportsDir, 'cr-report.md')) && existsSync(join(reportsDir, 'security-report.md'));
    },
    [WorkflowState.QA_PASSED]: () => existsSync(join(projectPath, '.peaks', 'reports', 'final-report.md'))
  };

  const checker = artifacts[state];
  if (!checker) return true;
  return checker();
}

/**
 * 继续工作流
 */
async function continueWorkflow(projectPath) {
  const skillDir = getSkillDir();
  const manager = new SessionStateManager(projectPath);
  const currentState = manager.getCurrentState();

  console.log(`\n🔄 当前状态: ${currentState}`);

  // 检查产出物
  if (!checkArtifacts(projectPath, currentState)) {
    console.error(`❌ 状态 ${currentState} 的产出物缺失，请先完成当前步骤`);
    return { success: false, state: currentState, error: 'artifacts_missing' };
  }

  // 确定下一步
  const nextStep = STATE_TRANSITIONS[currentState];
  if (!nextStep) {
    console.log(`✅ 工作流已完成，当前状态: ${currentState}`);
    return { success: true, state: currentState, done: true };
  }

  console.log(`📍 下一步: ${nextStep}`);

  // 更新状态
  manager.updateWorkflowState(getNextState(currentState), { nextStep });

  return {
    success: true,
    state: currentState,
    nextStep,
    instruction: getStepInstruction(nextStep)
  };
}

/**
 * 根据下一步获取目标状态
 */
function getNextState(current) {
  const transitions = {
    [WorkflowState.INIT]: WorkflowState.NAME_CONFIRMED,
    [WorkflowState.NAME_CONFIRMED]: WorkflowState.PRD_DONE,
    [WorkflowState.PRD_DONE]: WorkflowState.TECH_STACK_CONFIRMED,
    [WorkflowState.TECH_STACK_CONFIRMED]: WorkflowState.DESIGN_DONE,
    [WorkflowState.DESIGN_DONE]: WorkflowState.KNOWLEDGE_DONE,
    [WorkflowState.KNOWLEDGE_DONE]: WorkflowState.DOCS_DONE,
    [WorkflowState.DOCS_DONE]: WorkflowState.DEVELOPMENT_DONE,
    [WorkflowState.DEVELOPMENT_DONE]: WorkflowState.CR_SECURITY_PASSED,
    [WorkflowState.CR_SECURITY_PASSED]: WorkflowState.QA_PASSED,
    [WorkflowState.QA_PASSED]: WorkflowState.DEPLOY_DONE
  };
  return transitions[current] || current;
}

/**
 * 获取步骤指令
 */
function getStepInstruction(step) {
  const instructions = {
    'step1_confirm_name': '使用 AskUserQuestion 确认项目名称',
    'step2_prd_brainstorm': '调度 product agent 进行 PRD 脑暴',
    'step3_confirm_tech_stack': '使用 AskUserQuestion 确认技术栈',
    'step4_design': '调度 design agent（如有前端）确认设计稿',
    'step5_knowledge': '调度 product agent 生成知识积累',
    'step6_docs': '并行生成技术文档和测试用例',
    'step7_development': '调度 dispatcher 拆分子 agent 开发',
    'step8_cr_security': '并行执行 CodeReview 和安全检查',
    'step9_qa': '调度 qa-coordinator 执行 3 轮 QA 测试',
    'step10_deploy': '调度 devops 执行部署'
  };
  return instructions[step] || '未知步骤';
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const projectPath = process.argv[2] || process.cwd();
  console.log(`\n🔄 peaks-sdd 工作流继续器\n`);
  console.log(`项目: ${projectPath}\n`);

  const result = await continueWorkflow(projectPath);
  if (result.success) {
    if (result.done) {
      console.log(result.instruction || '工作流已完成');
    } else {
      console.log(`下一步: ${result.instruction}`);
    }
  } else {
    console.error(`错误: ${result.error}`);
    process.exit(1);
  }
}

export { continueWorkflow, getStepInstruction };
```

---

## Task 3: 修改 SKILL.md 空目录初始化流程

**Files:**
- Modify: `skills/peaks-sdd/SKILL.md:303-576` (空目录初始化流程部分)

**Purpose:** 补全 Step 1.5、2.5、4.5、5-9，实现全自动化

- [ ] **Step 1: 修改 Step 2，增加 skill/mcp 安装步骤**

在 Step 2 和 Step 3 之间添加：

```markdown
#### Step 2.5: 安装 Skills 和 MCP（如需要）

**确认是否需要安装 skills 和 MCP**：

```
┌─ 是空目录首次初始化？ ──────────────────────────┐
│  ✅ 是 → 安装 peaks-sdd 相关的 skills         │
│         安装必要的 MCP servers                  │
│  ❌ 否 → 跳过（skills/mcp 已安装）            │
└────────────────────────────────────────────────┘
```

**安装的 Skills**：
- `brainstorming` - 需求脑暴
- `frontend-design` - UI 设计
- `webapp-testing` - E2E 测试
- `superpowers` - 基础能力

**安装的 MCP servers**：
- `context7` - 文档检索
- `fs` - 文件系统
- `playwright` - E2E 测试
- `chrome-devtools` - 浏览器调试

```bash
# 安装 skills
npx skills add https://github.com/obra/superpowers --skill brainstorming
npx skills add https://github.com/vercel-labs/skills --skill frontend-design

# 配置 MCP servers（如尚未配置）
# 在 .claude/settings.json 中添加
```

**确认后**：
- `.claude/skills/` 下有必要的 skills
- `.claude/settings.json` 中有必要的 MCP 配置
```

- [ ] **Step 2: 修改 Step 1，增加 Step 1.5 初始化步骤**

删除原有 Step 2，替换为：

```markdown
#### Step 1.5: 创建项目目录 + 初始化

**前置条件**：项目名称已确认

**执行顺序**：

1. **创建项目目录**：
```bash
mkdir -p {{PROJECT_NAME}}  # 如 "ai-chat"
cd {{PROJECT_NAME}}
pwd  # 确认当前目录已切换到项目目录
```

2. **安装 Skills**：
```bash
# 安装 peaks-sdd 依赖的 skills
npx skills add https://github.com/obra/superpowers --skill brainstorming
npx skills add https://github.com/vercel-labs/skills --skill frontend-design
npx skills add https://github.com/anthropics/skills --skill webapp-testing
```

3. **安装/配置 MCP servers**：
```bash
# 在 .claude/settings.json 中添加（如果不存在则创建）
# 必要 MCP：
# - context7: 文档检索
# - fs: 文件系统
# - playwright: E2E 测试
# - chrome-devtools: 浏览器调试
```

4. **复制 agent 模板**：
```bash
# 复制所有 agent 模板到项目目录
SKILL_PATH=~/.claude/skills/peaks-sdd
mkdir -p .claude/agents
cp -f "$SKILL_PATH/templates/agents"/*.md .claude/agents/
cp -rf "$SKILL_PATH/templates/agents/qa" .claude/agents/
```

5. **创建 .peaks 目录结构**：
```bash
mkdir -p .peaks/{prds,plans,swagger,designs,test-docs,reports,auto-tests,checkpoints,bugs,knowledge}
```

6. **调用 init.mjs 完成基础配置**：
```bash
node $SKILL_PATH/scripts/init.mjs . --frontend=react --ui=shadcn --backend=nestjs --database=postgresql
```

**检查点**：
- [ ] 项目目录已创建
- [ ] skills 已安装（`.claude/skills/`）
- [ ] MCP 已配置（`.claude/settings.json`）
- [ ] agent 模板已复制（`.claude/agents/`）
- [ ] .peaks 目录结构已创建
- [ ] init.mjs 已执行
```

- [ ] **Step 3: 修改 Step 3 后，添加 Step 3.5 知识积累**

在 Step 3 末尾添加：

```markdown
#### Step 3.5: [自动] 知识积累

**前置条件**：PRD 已生成

**执行**：调用 product agent 生成知识积累

**产出**：`.peaks/knowledge/product-knowledge.md`

**检查点**：
- [ ] 文件存在：`.peaks/knowledge/product-knowledge.md`
- [ ] 内容包含：业务类型、目标用户、核心流程、用户偏好
```

- [ ] **Step 3: 修改 Step 5，设计确认后添加 Step 5.5**

在 Step 5 末尾添加：

```markdown
#### Step 5.5: [自动] 并行生成技术文档 + 测试用例

**前置条件**：PRD 已确认、设计稿已就绪（如有）

**并行执行**：
```
┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│ 🟨 [frontend/backend] 研发 Agent │    │ 🟧 [qa] qa-coordinator           │
│ 写技术文档                        │    │ 写测试用例 + 分析影响范围         │
└─────────────────────────────────┘    └─────────────────────────────────┘
```

**研发 Agent（技术文档）**：
- 读取 PRD 和设计稿（如有）
- 产出：`.peaks/plans/tech-doc-[功能名]-[日期].md`
- 包含：架构设计、接口定义、数据模型、模块划分

**qa-coordinator（测试用例）**：
- 读取 PRD 和设计稿（如有）
- 分析本次需求对存量功能的影响
- 产出：`.peaks/test-docs/test-case-[功能名]-[日期].md`

**检查点**：
- [ ] 技术文档存在
- [ ] 测试用例存在
- [ ] 存量影响分析已完成
```

- [ ] **Step 4: 将原有 Step 7 拆分为 Step 6-9**

删除原有 Step 7，替换为：

```markdown
#### Step 6: [自动] dispatcher 拆分子 agent 开发

**前置条件**：技术文档 + 测试用例已完成

**执行**：调用 dispatcher agent

**dispatcher 流程**：
1. 读取项目结构
2. 分析任务涉及的模块
3. 生成执行计划（独立任务并行，有依赖串行）
4. 调度子 agent 进行开发
5. 各子 agent 自测，产出自测报告
6. 汇总报告 → `.peaks/reports/dispatcher-summary-[日期].md`

**检查点**：
- [ ] dispatcher-summary 存在
- [ ] 各模块自测报告存在
```

```markdown
#### Step 7: [自动] CodeReview + 安全检查（并行）

**前置条件**：开发完成

**并行执行**：
```
┌─────────────────────────────────────────────────┐
│  并行执行（三者同时进行）                          │
│  ├─ code-reviewer-frontend（如有前端）           │
│  ├─ code-reviewer-backend（如有后端）             │
│  └─ security-reviewer                            │
└─────────────────────────────────────────────────┘
```

**检查结果判定**：

| 结果 | 动作 |
|------|------|
| 全部通过 | 进入 Step 8 |
| 有问题 | 自动通知对应 agent 修复 → 重新执行 Step 7 |
| 循环 > 10 次 | 中断流程，通知用户手动处理 |

**CR 问题循环**：
```
发现问题 → 识别问题类型
├─ frontend 相关 → frontend agent 修复
├─ backend 相关 → backend agent 修复
└─ 安全问题 → 对应 agent 修复
    ↓
修复完成 → 自测 → 重新 CR+安全
```

**检查点**：
- [ ] CR 报告存在
- [ ] 安全检查报告存在
- [ ] 无 CRITICAL/HIGH 问题，或问题已修复
```

```markdown
#### Step 8: [自动] 3 轮 QA 测试

**前置条件**：CodeReview + 安全检查全部通过

**执行**：调用 qa-coordinator

**qa-coordinator 流程**：
```
第 1 轮 QA：
  ├─ qa-coordinator 分配任务给 QA 子 agent（并行）
  │   ├─ qa-frontend
  │   ├─ qa-backend
  │   ├─ qa-frontend-perf
  │   ├─ qa-backend-perf
  │   ├─ qa-security
  │   └─ qa-automation
  ├─ 汇总结果 → round-1-issues.md
  └─ 决策：有/无问题

第 2 轮 QA（复验）
第 3 轮 QA（最终验证）
```

**每轮 QA 结构**：
1. 分配任务 → 并行执行 → 汇总
2. 有问题 → 分配修复 → 自测 → 下一轮
3. 无问题 → 下一轮

**产出**：
- `.peaks/reports/round-1-issues.md`
- `.peaks/reports/round-2-issues.md`
- `.peaks/reports/round-3-issues.md`
- `.peaks/reports/final-report-[日期].md`

**检查点**：
- [ ] 3 轮全部完成
- [ ] 最终报告存在
```

```markdown
#### Step 9: [可选] 部署

**前置条件**：所有 QA 测试通过

**执行**：调用 devops agent

**devops 流程**：
1. Docker 构建
2. 服务部署
3. 健康检查
4. 通知用户

**产出**：`.peaks/deploys/deploy-[环境]-[日期].log`
```

---

## Task 4: 修改 dispatcher.md 模板

**Files:**
- Modify: `skills/peaks-sdd/templates/agents/dispatcher.md`

**Purpose:** 增强 dispatcher 支持 CR+安全循环逻辑

- [ ] **Step 1: 在 dispatcher.md 末尾添加 CR+安全循环处理**

在 "验收标准" 部分之后添加：

```markdown
## Step 7: CR + 安全循环处理

### 循环架构

```
dispatcher 完成开发汇总
    ↓
┌─────────────────────────────────────────────────────────┐
│  Step 7: CodeReview + 安全检查（并行）                  │
│  ├─ code-reviewer-frontend                              │
│  ├─ code-reviewer-backend                               │
│  └─ security-reviewer                                   │
└─────────────────────────────────────────────────────────┘
    ↓
┌─ 检查结果 ─────────────────────────────────────────┐
│  ✅ 全部通过 → 进入 qa-coordinator Step 8         │
│  ❌ 有问题 → Step 7.1 修复循环                    │
└────────────────────────────────────────────────────┘
```

### Step 7.1: 修复循环

```
发现问题
    ↓
识别问题类型
├─ frontend (HIGH/CRITICAL) → 通知 frontend agent 修复
├─ backend (HIGH/CRITICAL) → 通知 backend agent 修复
└─ security (any) → 通知 security-reviewer 修复
    ↓
对应 agent 修复
    ↓
agent 自测
    ↓
重新执行 Step 7（CR + 安全）
    ↓
循环直到全部通过，或超过 10 次
```

### 循环终止条件

| 条件 | 动作 |
|------|------|
| 循环 <= 10 次，全部通过 | 进入 Step 8 |
| 循环 > 10 次 | 中断，通知用户手动处理 |
| 产出检查点 | `.peaks/checkpoints/cr-fix-[N].md` |

### CR+安全 报告格式

```markdown
# CodeReview + 安全检查报告 - [日期]

## 检查时间
- **开始时间**: YYYY-MM-DD HH:mm
- **结束时间**: YYYY-MM-DD HH:mm

## 检查结果

| 检查项 | 状态 | 问题数 |
|--------|------|--------|
| code-reviewer-frontend | ✅ PASS | 0 |
| code-reviewer-backend | ❌ FAIL | 2 |
| security-reviewer | ✅ PASS | 0 |

## 发现的问题

### HIGH
| # | 模块 | 问题 | 修复 Agent |
|---|------|------|-----------|
| 1 | server/order | 缺少事务处理 | backend |

### 修复记录
| # | 修复时间 | 修复 Agent | 自测结果 |
|---|----------|-----------|----------|
| 1 | YYYY-MM-DD HH:mm | backend | ✅ PASS |

## 结论
⏳ **修复中** (第 2/10 次循环)
```
```

### 触发条件

dispatcher 在以下情况触发 Step 7：
1. **首次触发**：dispatcher-summary 产出后
2. **重新触发**：修复完成后，dispatcher 再次执行 CR+安全
```

---

## Task 5: 更新空目录初始化流程图

**Files:**
- Modify: `skills/peaks-sdd/SKILL.md` (Step 7 流程图)

**Purpose:** 更新流程图反映新的 9 步流程

- [ ] **Step 1: 更新流程图**

将原来的流程图：

```markdown
Step 7: 并行开发（与存量项目流程一致）
```

替换为：

```markdown
**完整空目录初始化流程图（9 步）**：

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: 项目名称                                                 │
│   AskUserQuestion 确认                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 1.5: 创建项目目录 + 初始化                                  │
│   mkdir -p {{PROJECT_NAME}} && cd {{PROJECT_NAME}}            │
│   → 安装 skills（brainstorming, frontend-design 等）            │
│   → 安装/配置 MCP servers（context7, fs, playwright 等）       │
│   → 创建 .claude/agents/（复制 agent 模板）                     │
│   → 创建 .peaks/prds/ 等目录结构                               │
│   → 调用 init.mjs 完成基础配置                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: PRD 脑暴（product agent）                              │
│   AskUserQuestion 多轮交互 → brainstorm + PRD                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3.5: [自动] 知识积累                                       │
│   product agent → product-knowledge.md                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: 技术栈确认                                              │
│   AskUserQuestion → 技术栈确定                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: 设计稿（如有前端）                                      │
│   design agent → AskUserQuestion 确认 → design-spec            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 5.5: [自动] 技术文档 + 测试用例                            │
│   研发写 tech-doc + qa-coordinator 写 test-case（并行）       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: [自动] dispatcher 拆分子 agent 开发                      │
│   dispatcher → 模块开发 → 自测报告 → dispatcher-summary         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 7: [自动] CodeReview + 安全检查（并行）                    │
│   CR + 安全 → 有问题自动修复 → 循环直到通过                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 8: [自动] 3 轮 QA 测试                                    │
│   qa-coordinator → 分配 → 并行 → 汇总 → 决策                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 9: [可选] 部署                                            │
│   devops → Docker → 部署 → 健康检查                            │
└─────────────────────────────────────────────────────────────────┘
```
```

---

## 实现顺序

1. **Task 1** - session-state-manager.mjs（基础工具）
2. **Task 2** - workflow-continuer.mjs（状态机）
3. **Task 3** - SKILL.md（流程定义，含 Step 1.5 初始化）
4. **Task 4** - dispatcher.md（CR+安全循环）
5. **Task 5** - 流程图更新（反映新的 9 步流程）

---

## 验证方式

```bash
# 1. 检查文件是否存在
ls skills/peaks-sdd/scripts/workflow-continuer.mjs
ls skills/peaks-sdd/scripts/lib/session-state-manager.mjs

# 2. 运行 workflow-continuer
node skills/peaks-sdd/scripts/workflow-continuer.mjs /path/to/project

# 3. 检查 SKILL.md 修改
grep -A5 "Step 3.5" skills/peaks-sdd/SKILL.md
grep -A5 "Step 5.5" skills/peaks-sdd/SKILL.md
grep -A5 "Step 6:" skills/peaks-sdd/SKILL.md
```