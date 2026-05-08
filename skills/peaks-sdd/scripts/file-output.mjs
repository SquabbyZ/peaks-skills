#!/usr/bin/env node
/**
 * 文件输出优化脚本
 * 核心策略：产出到文件 > 留在 context
 * 减少 token 消耗的同时保持功能完整
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 定义标准的产出目录结构
const OUTPUT_STRUCTURE = {
  'constitution': '.peaks/constitution.md',
  'prd': '.peaks/prds/prd-[feature]-[date].md',
  'plan': '.peaks/plans/plan-[feature]-[date].md',
  'tasks': '.peaks/tasks/task-[feature]-[date].md',
  'report': '.peaks/reports/report-[type]-[date].md',
  'bug-repro': '.peaks/bugs/repro-[date].md',
  'bug-hypothesis': '.peaks/bugs/hypothesis-[date].md',
  'deploy-log': '.peaks/deploys/deploy-[env]-[date].log'
};

// 确保目录存在
function ensureDir(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// 写入产出文件
function writeOutput(projectPath, type, content, metadata = {}) {
  let filePath = OUTPUT_STRUCTURE[type];

  if (!filePath) {
    console.error(`❌ 未知产出类型: ${type}`);
    return null;
  }

  // 替换变量
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  filePath = filePath
    .replace('[feature]', metadata.feature || 'unknown')
    .replace('[date]', date)
    .replace('[type]', metadata.type || 'general')
    .replace('[env]', metadata.env || 'prod');

  const fullPath = join(projectPath, filePath);
  ensureDir(fullPath);

  // 添加元数据头
  const fullContent = `---
type: ${type}
created: ${new Date().toISOString()}
${metadata.agent ? `agent: ${metadata.agent}` : ''}
${metadata.phase ? `phase: ${metadata.phase}` : ''}
---

${content}
`;

  writeFileSync(fullPath, fullContent, 'utf-8');
  console.log(`✅ 已输出: ${filePath}`);

  return filePath;
}

// 快速写入函数（简化调用）
async function quickOutput(projectPath, phase, content) {
  const typeMap = {
    'constitution': 'constitution',
    'prd': 'prd',
    'plan': 'plan',
    'tasks': 'tasks',
    'implement': 'report',
    'deploy': 'report'
  };

  const type = typeMap[phase] || 'report';
  return writeOutput(projectPath, type, content, {
    phase,
    agent: 'claude-code'
  });
}

// 生成阶段摘要（减少 context 保留量）
function generatePhaseSummary(phase, inputs, outputs) {
  const summary = {
    phase,
    timestamp: new Date().toISOString(),
    inputCount: Object.keys(inputs).length,
    outputFiles: outputs.length,
    contextSaved: outputs.length > 0 // 文件产出 = 节省 context
  };

  return `## ${phase} 完成摘要

- 输入: ${summary.inputCount} 项
- 产出文件: ${summary.outputFiles} 个
- Context 节省: ${summary.contextSaved ? '是' : '否'}

详情见: .peaks/${phase}/
`;
}

// 增量更新 VS 全量保留
function shouldIncrementalUpdate(existingContent, newContent, threshold = 0.3) {
  // 如果变更超过 30%，建议全量更新而非增量
  const existingLines = existingContent.split('\n').length;
  const newLines = newContent.split('\n').length;
  const changeRatio = Math.abs(newLines - existingLines) / existingLines;

  return changeRatio < threshold;
}

// 产出模板
const TEMPLATES = {
  constitution: `# Constitution - {{PROJECT_NAME}}

## 代码规范
- TypeScript strict mode
- ESLint + Prettier
- 组件 PascalCase，工具函数 camelCase

## 提交约定
- Conventional Commits (feat/fix/refactor)
- PR 必须经过 Code Review

## Agent 调度策略
- 前端变更 → frontend agent → code-reviewer-frontend
- 后端变更 → backend agent → code-reviewer-backend
- 所有变更 → security-reviewer → qa

## 质量门禁
- Code Review → 安全检查 → QA 验证
`,

  prd: `# PRD - {{FEATURE_NAME}}

## 概述
### 背景
{{BACKGROUND}}

### 目标
{{GOAL}}

## 功能列表

### [NEW] {{FEATURE_NAME}}
- 描述: {{DESCRIPTION}}
- 验收标准:
  - {{ACCEPTANCE_CRITERIA_1}}
  - {{ACCEPTANCE_CRITERIA_2}}

## 非功能性需求
- 性能: {{PERFORMANCE_REQUIREMENTS}}
- 安全: {{SECURITY_REQUIREMENTS}}
`,

  plan: `# Plan - {{FEATURE_NAME}}

## 技术方案
- 前端: {{FRONTEND_STACK}}
- 后端: {{BACKEND_STACK}}
- 数据库: {{DATABASE}}

## 里程碑
| # | 里程碑 | 依赖 | 预计工时 |
|---|--------|------|---------|
| M1 | {{MILESTONE_1}} | 无 | {{ESTIMATE_1}} |
| M2 | {{MILESTONE_2}} | M1 | {{ESTIMATE_2}} |

## 风险
- {{RISK_1}}
- {{RISK_2}}
`
};

// 导出模板
function getTemplate(type) {
  return TEMPLATES[type] || null;
}

// 替换模板变量
function fillTemplate(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

// 入口
const projectPath = process.argv[2] || process.cwd();
const command = process.argv[3];

if (command === 'output') {
  const type = process.argv[4];
  const content = process.argv[5] || '';
  const metadata = JSON.parse(process.argv[6] || '{}');
  writeOutput(projectPath, type, content, metadata);
} else if (command === 'template') {
  const type = process.argv[4];
  const template = getTemplate(type);
  if (template) {
    console.log(template);
  } else {
    console.error(`❌ 未知模板类型: ${type}`);
    process.exit(1);
  }
} else if (command === 'summary') {
  const phase = process.argv[4];
  const inputs = JSON.parse(process.argv[5] || '{}');
  const outputs = JSON.parse(process.argv[6] || '[]');
  console.log(generatePhaseSummary(phase, inputs, outputs));
} else {
  console.log(`
📁 文件输出优化脚本

用法:
  node scripts/file-output.js output <type> <content> [metadata]
  node scripts/file-output.js template <type>
  node scripts/file-output.js summary <phase> <inputs> <outputs>

类型:
  - constitution, prd, plan, tasks
  - report, bug-repro, bug-hypothesis, deploy-log

示例:
  node scripts/file-output.js output prd "# PRD..." {"feature":"login"}
  node scripts/file-output.js template prd
  `);
}

export { writeOutput, getTemplate, fillTemplate, generatePhaseSummary };