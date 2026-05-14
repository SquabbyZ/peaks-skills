#!/usr/bin/env node
/**
 * peaks-sdd 产出物门禁验证脚本
 * 验证 6 项强制产出物是否齐全
 */

import { existsSync, readFileSync, realpathSync, readdirSync, statSync } from 'fs';
import { dirname, isAbsolute, join, relative, resolve } from 'path';
import { spawn } from 'child_process';
import { isDirectCliExecution, printGateResults } from './lib/artifact-cli.mjs';
import { getPeaksPaths, readCurrentChangeId } from './lib/change-artifacts.mjs';

/**
 * 异步执行命令（Promise 版本，可中断）
 */
function execAsync(command, args, options = {}) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    const child = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: options.shell || false
    });

    const timeout = options.timeout || 60000;
    const timer = setTimeout(() => {
      child.kill();
      resolve({ success: false, killed: true, stdout, stderr, message: 'timeout' });
    }, timeout);

    child.stdout?.on('data', (data) => { stdout += data.toString(); });
    child.stderr?.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ success: code === 0, killed: false, stdout, stderr, code });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ success: false, killed: false, stdout, stderr, error: err.message });
    });
  });
}

const args = process.argv.slice(2);
const projectPathArg = args.find(arg => !arg.startsWith('-'));
const projectPath = resolveProjectRoot(projectPathArg || process.cwd());
const skipCoverage = args.includes('--force') || args.includes('-f');
const allowLocalTools = args.includes('--allow-local-tools') || process.env.PEAKS_SDD_ALLOW_LOCAL_TOOLS === '1';
const defaultTargetCoverage = 95; // 应用/业务项目强制单元测试覆盖率
const componentLibraryTargetCoverage = 60; // 开源组件库覆盖率要求

function getCurrentChangePath(basePath) {
  const currentChangeId = readCurrentChangeId(basePath) || '1970-01-01-initial-product';
  return getPeaksPaths(basePath, currentChangeId).changeRelativePath;
}

function resolveProjectRoot(startPath) {
  let current = resolve(startPath);

  while (true) {
    if (existsSync(join(current, '.peaks', 'current-change'))) return current;

    const parent = dirname(current);
    if (parent === current) return resolve(startPath);
    current = parent;
  }
}

function buildArtifactChecks(currentChangePath, options = {}) {
  const checks = [
    {
      id: 1,
      name: '交互式脑暴记录',
      check: 'interactive-brainstorm',
      file: `.peaks/${currentChangePath}/product/brainstorm.md`,
      required: true,
      missingAction: '必须先通过 AskUserQuestion 完成至少 5 轮真实用户脑暴，不能用自动分析摘要代替'
    },
    {
      id: 2,
      name: 'PRD 文档',
      pattern: `.peaks/${currentChangePath}/product/prd.md`,
      required: true,
      missingAction: '通知 product 补全'
    },
    {
      id: 3,
      name: 'PRD 可评审性',
      check: 'reviewable-prd',
      file: `.peaks/${currentChangePath}/product/prd.md`,
      required: true,
      missingAction: 'PRD 必须包含问题、用户、目标、范围、需求、验收标准、风险和开放问题'
    },
    {
      id: 3,
      name: 'PRD 阻塞确认',
      check: 'confirmation',
      file: `.peaks/${currentChangePath}/product/prd-confirmation.md`,
      required: true,
      missingAction: 'PRD 必须经用户明确确认后才能进入设计/技术方案'
    },
    {
      id: 4,
      name: 'Swagger API 规范',
      check: 'swagger',
      file: `.peaks/${currentChangePath}/product/swagger.json`,
      required: true,
      missingAction: 'PRD 确认后必须输出 swagger.json/OpenAPI 规范'
    },
    ...(options.hasUi ? [
      {
        id: 3,
        name: '设计规范',
        pattern: `.peaks/${currentChangePath}/design/design-spec.md`,
        required: true,
        missingAction: '通知 design 补全'
      },
      {
        id: 4,
        name: '可视化设计稿',
        check: 'visual-design',
        required: true,
        missingAction: 'UI 项目必须补充可预览 HTML 设计稿或等价设计平台产物'
      },
      {
        id: 5,
        name: '设计阻塞确认',
        check: 'design-confirmation',
        file: `.peaks/${currentChangePath}/design/design-confirmation.md`,
        required: true,
        missingAction: '设计稿必须经用户明确确认、记录预览 URL/命令并指向实际视觉产物后才能进入技术方案'
      }
    ] : []),
    {
      id: 6,
      name: '技术文档',
      pattern: `.peaks/${currentChangePath}/architecture/system-design.md`,
      required: true,
      missingAction: '通知研发 Agent 补全'
    },
    {
      id: 7,
      name: '技术方案阻塞确认',
      check: 'confirmation',
      file: `.peaks/${currentChangePath}/architecture/system-design-confirmation.md`,
      required: true,
      missingAction: '技术方案必须经用户明确确认后才能进入 task graph / swarm'
    },
    {
      id: 8,
      name: '测试用例',
      pattern: `.peaks/${currentChangePath}/qa/test-plan.md`,
      required: true,
      missingAction: '通知 qa 补全'
    },
    {
      id: 9,
      name: 'Swarm 任务图',
      check: 'swarm-task-graph',
      file: `.peaks/${currentChangePath}/swarm/task-graph.json`,
      required: true,
      missingAction: 'dispatcher 必须先输出 task-graph.json，包含前端、后端/数据库/API、QA、CR、安全任务节点和依赖'
    },
    {
      id: 10,
      name: 'Swarm 并行波次',
      check: 'swarm-waves',
      file: `.peaks/${currentChangePath}/swarm/waves.json`,
      required: true,
      missingAction: 'dispatcher 必须输出 waves.json，显式记录 parallel 数组和每个 wave 的并行 agent'
    },
    {
      id: 11,
      name: 'Swarm 任务简报',
      check: 'swarm-briefs',
      required: true,
      missingAction: 'dispatcher 必须为每个执行 agent 输出 swarm/briefs/*.md，包含 Artifact Path、任务、文件边界、依赖和交接要求'
    },
    {
      id: 12,
      name: 'Handoff Protocol',
      check: 'handoff-protocol',
      required: true,
      missingAction: '每个执行 agent 必须在 swarm/handoffs/ 记录输入版本、输出版本、文件状态和下游交接'
    },
    {
      id: 13,
      name: '专项执行 Agents',
      check: 'execution-agents',
      required: true,
      missingAction: '技术方案确认后必须生成 frontend/backend/qa-child/code-reviewer/security-reviewer 等专项 agent'
    },
    {
      id: 14,
      name: '模块自测报告',
      pattern: `.peaks/${currentChangePath}/swarm/reports/*.md`,
      required: true,
      missingAction: '缺失模块重新调度子 Agent'
    },
    {
      id: 10,
      name: 'Code Review',
      check: 'code-review-report',
      file: `.peaks/${currentChangePath}/review/code-review.md`,
      required: true,
      missingAction: '通知 code-reviewer 补全并显式写明产物路径'
    },
    {
      id: 11,
      name: 'Code Review 冒烟报告',
      check: 'review-smoke-report',
      file: `.peaks/${currentChangePath}/review/code-review-smoke.md`,
      required: true,
      missingAction: '必须输出 code review 检查环境自测/冒烟报告并显式写明产物路径'
    },
    {
      id: 12,
      name: '安全审查',
      check: 'security-report',
      file: `.peaks/${currentChangePath}/security/security-report.md`,
      required: true,
      missingAction: '通知 security-reviewer 补全并显式写明产物路径；有 CRITICAL 问题则阻断'
    },
    {
      id: 13,
      name: '安全检查冒烟报告',
      check: 'security-smoke-report',
      file: `.peaks/${currentChangePath}/security/security-smoke.md`,
      required: true,
      missingAction: '必须输出安全检查环境自测/冒烟报告并显式写明产物路径'
    },
    {
      id: 14,
      name: '功能测试报告',
      check: 'qa-report',
      file: `.peaks/${currentChangePath}/qa/functional-report.md`,
      required: true,
      missingAction: '通知 qa 补全功能测试报告'
    },
    {
      id: 15,
      name: '性能测试报告',
      check: 'qa-report',
      file: `.peaks/${currentChangePath}/qa/performance-report.md`,
      required: true,
      missingAction: '通知 qa 补全性能测试报告'
    },
    {
      id: 16,
      name: '业务验收报告',
      check: 'business-report',
      file: `.peaks/${currentChangePath}/qa/business-report.md`,
      required: true,
      missingAction: '通知 qa 补全业务验收报告，映射 PRD 验收标准和核心业务价值'
    },
    {
      id: 17,
      name: '运行时冒烟验证',
      check: 'runtime-smoke-report',
      file: `.peaks/${currentChangePath}/qa/runtime-smoke-report.md`,
      required: true,
      missingAction: '必须启动应用、验证核心路径，并让用户进行 UX 验证'
    },
    {
      id: 18,
      name: 'Agent 使用证据',
      check: 'agent-usage',
      file: `.peaks/${currentChangePath}/swarm/agent-usage.md`,
      required: true,
      missingAction: 'dispatcher 必须记录实际调用的 product/design/dev/review/security/qa agents 和证据路径'
    },
    {
      id: 19,
      name: 'QA 三轮测试',
      check: 'qa-rounds',
      required: true,
      missingAction: '必须完成 qa-round-1/2/3 和 acceptance-report'
    },
    {
      id: 20,
      name: '最终报告',
      pattern: `.peaks/${currentChangePath}/final-report.md`,
      required: true,
      missingAction: '汇总 PRD、设计、架构、review、QA 和验证证据'
    },
    {
      id: 21,
      name: '初始化基线',
      check: 'init-baseline',
      required: true,
      missingAction: '重新运行 peaks-sdd 初始化补齐 project docs 和 agents'
    },
    {
      id: 22,
      name: '项目 Agent 阶段交接',
      check: 'phase-handoffs',
      required: true,
      missingAction: '初始化必须生成 product/design/dispatcher/qa 阶段交接 brief，后续阶段需记录实际项目 agent 调用证据'
    },
    {
      id: 23,
      name: 'TypeScript 编译',
      check: 'tsc',
      required: true,
      missingAction: '编译失败的模块不标记完成'
    },
    {
      id: 24,
      name: '单元测试报告',
      check: 'unit-test-report',
      required: true,
      missingAction: '必须输出单元测试报告到 .peaks/ut/'
    },
    {
      id: 25,
      name: '单元测试覆盖率',
      check: 'coverage',
      required: true,
      missingAction: '必须补充单元测试并达到项目类型覆盖率阈值'
    }
  ];

  return checks;
}

/**
 * 简单的 glob 模式匹配
 * @param {string} name - 文件/目录名
 * @param {string} pattern - 模式（支持 * 和 ?）
 * @returns {boolean} 是否匹配
 */
function matchGlobPattern(name, pattern) {
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(name);
}

/**
 * 递归搜索匹配的文件
 * @param {string} basePath - 基础路径
 * @param {string} pattern - glob 模式
 * @returns {Array} 匹配的文件列表
 */
function findMatchingFiles(basePath, pattern) {
  const results = [];
  const patternParts = pattern.split('/');
  const wildcardIndex = patternParts.findIndex(p => p.includes('*') || p.includes('?'));

  if (wildcardIndex === -1) {
    const fullPath = join(basePath, pattern);
    if (existsSync(fullPath) && statSync(fullPath).isFile()) {
      return [pattern];
    }
    return results;
  }

  // 构建搜索路径
  const searchParts = patternParts.slice(0, wildcardIndex);
  let searchDir = basePath;
  for (const part of searchParts) {
    if (part !== '.' && part !== '..') {
      searchDir = join(searchDir, part);
      if (!existsSync(searchDir)) return results;
    }
  }

  // 剩余的搜索模式
  const remainingPattern = patternParts.slice(wildcardIndex);
  const prefix = searchParts.filter(p => p !== '.' && p !== '..').join('/');
  const prefixDir = basePath;

  function search(dir, patternIdx, currentPrefix) {
    if (patternIdx >= remainingPattern.length) {
      // 匹配完成，dir 应该是文件
      const fullPath = join(dir);
      if (existsSync(fullPath)) {
        results.push(currentPrefix);
      }
      return;
    }

    const currentPattern = remainingPattern[patternIdx];
    const isLast = patternIdx === remainingPattern.length - 1;

    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!matchGlobPattern(entry.name, currentPattern)) continue;

        const fullPath = join(dir, entry.name);

        if (isLast) {
          if (entry.isFile()) {
            results.push(join(currentPrefix, entry.name));
          }
        } else if (entry.isDirectory()) {
          search(fullPath, patternIdx + 1, join(currentPrefix, entry.name));
        }
      }
    } catch (e) {
      // 目录不可访问时跳过
    }
  }

  search(searchDir, 0, prefix || '.');
  return results;
}

/**
 * 检查单个包的 TypeScript 编译
 * @param {string} pkgPath - 包路径
 * @param {string} pkgName - 包名称
 * @returns {Promise<object>} 检查结果
 */
async function checkPackageTypeScript(pkgPath, pkgName) {
  const tsconfigPath = join(pkgPath, 'tsconfig.json');
  if (!existsSync(tsconfigPath)) {
    return { name: pkgName, pass: null, message: '无 tsconfig.json' };
  }

  if (!allowLocalTools) {
    return { name: pkgName, pass: false, message: '已发现 tsconfig，需 --allow-local-tools 执行编译' };
  }

  const runner = resolveLocalTscRunner(pkgPath);
  if (!runner) {
    return { name: pkgName, pass: null, message: '未安装 TypeScript' };
  }

  const result = await execAsync(runner.command, [...runner.args, '--noEmit', '--pretty', 'false'], {
    cwd: pkgPath,
    timeout: 60000
  });

  if (result.killed) {
    return { name: pkgName, pass: false, message: '超时' };
  }

  if (result.success) {
    return { name: pkgName, pass: true, message: '0 errors' };
  }

  const output = result.stdout || result.stderr || '';
  const errorMatch = output.match(/(\d+) errors?/);
  const errorCount = errorMatch ? errorMatch[1] : '未知';
  return { name: pkgName, pass: false, message: `${errorCount} errors` };
}

function resolveLocalTscRunner(pkgPath) {
  const pkgJsonPath = join(pkgPath, 'node_modules', 'typescript', 'package.json');
  if (!existsSync(pkgJsonPath)) return null;

  try {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
    const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.tsc;
    if (!bin || isAbsolute(bin) || bin.includes('..')) return null;

    const typescriptDir = resolve(pkgPath, 'node_modules', 'typescript');
    const binPath = resolve(typescriptDir, bin);
    if (!existsSync(binPath)) return null;

    const packageRoot = resolve(pkgPath);
    const realTypescriptDir = realpathSync(typescriptDir);
    const realBinPath = realpathSync(binPath);
    const realPackageRoot = realpathSync(packageRoot);
    if (!isInsideDirectory(realPackageRoot, realTypescriptDir)) return null;
    if (!isInsideDirectory(realTypescriptDir, realBinPath)) return null;
    return { command: process.execPath, args: [realBinPath] };
  } catch {
    return null;
  }
}

function isInsideDirectory(parentDir, childPath) {
  const parent = parentDir.endsWith(pathSeparator()) ? parentDir : `${parentDir}${pathSeparator()}`;
  return childPath === parentDir || childPath.startsWith(parent);
}

function pathSeparator() {
  return process.platform === 'win32' ? '\\' : '/';
}

function discoverTypeScriptProjects(basePath) {
  const roots = [];
  const seen = new Set();
  const ignoredDirs = new Set(['.git', '.claude', '.peaks', '.gitnexus', 'node_modules', 'dist', 'build', 'target', 'coverage']);
  const maxDepth = 3;

  function addProject(dir) {
    if (seen.has(dir)) return;
    seen.add(dir);
    const name = relative(basePath, dir).replace(/\\/g, '/') || '(root)';
    roots.push({ path: dir, name });
  }

  function walk(dir, depth) {
    if (depth > maxDepth) return;
    const hasTsconfig = existsSync(join(dir, 'tsconfig.json'));
    if (hasTsconfig) {
      addProject(dir);
    }

    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || ignoredDirs.has(entry.name)) continue;
      walk(join(dir, entry.name), depth + 1);
    }
  }

  walk(basePath, 0);
  return roots;
}

function checkInitializationBaseline(basePath) {
  const requiredFiles = [
    '.peaks/current-change',
    '.peaks/project/overview.md',
    '.peaks/project/product-knowledge.md',
    '.peaks/project/roadmap.md',
    '.peaks/project/decisions.md',
    '.claude/settings.json',
    '.claude/session-state.json',
    '.claude/hookify/context-monitor.local.md',
    '.claude/agents/dispatcher.md',
    '.claude/agents/product.md',
    '.claude/agents/design.md',
    '.claude/agents/qa.md',
    '.claude/agents/triage.md',
    'openspec/README.md'
  ];

  const missing = requiredFiles.filter(file => !existsSync(join(basePath, file)));
  if (missing.length > 0) {
    return { pass: false, message: `缺失 ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}` };
  }

  return { pass: true, message: 'project docs 和 agents 已就绪' };
}

function checkPhaseHandoffs(basePath, currentChangePath) {
  const requiredHandoffs = [
    { agent: 'product', outputs: ['product/brainstorm.md', 'product/prd.md'] },
    { agent: 'design', outputs: ['design/design-preview.html', 'design/design-spec.md'] },
    { agent: 'dispatcher', outputs: ['architecture/system-design.md', 'swarm/task-graph.json'] },
    { agent: 'qa', outputs: ['qa/test-plan.md', 'qa/functional-report.md'] }
  ];
  const missing = [];

  for (const handoff of requiredHandoffs) {
    const relativePath = `.peaks/${currentChangePath}/checkpoints/${handoff.agent}-phase-handoff.md`;
    const fullPath = join(basePath, relativePath);
    if (!existsSync(fullPath)) {
      missing.push(`${handoff.agent}-phase-handoff.md`);
      continue;
    }

    const content = readFileSync(fullPath, 'utf-8');
    if (!new RegExp(`Project Agent:\\s*\\.claude/agents/${handoff.agent}\\.md`).test(content)
      || !/Required Invocation Evidence:/i.test(content)
      || !/Output Artifacts:/i.test(content)) {
      missing.push(`${handoff.agent}-phase-handoff.md incomplete`);
      continue;
    }

    const phaseHasOutputs = handoff.outputs.some(output => existsSync(join(basePath, '.peaks', currentChangePath, output)));
    if (phaseHasOutputs && !/(Status:\s*(COMPLETED|BLOCKED|DEVIATION)|Actual Invocation Evidence:|Deviation:)/i.test(content)) {
      missing.push(`${handoff.agent}-phase-handoff.md lacks invocation evidence`);
    }
  }

  if (missing.length > 0) {
    return { pass: false, message: `缺失或不完整: ${missing.slice(0, 4).join(', ')}` };
  }

  return { pass: true, message: '核心项目 agent 阶段交接已就绪' };
}

function checkInteractiveBrainstorm(basePath, relativePath) {
  const fullPath = join(basePath, relativePath);
  if (!existsSync(fullPath)) {
    return { pass: false, message: '未找到 brainstorm.md' };
  }

  const content = readFileSync(fullPath, 'utf-8');
  const rounds = content.match(/(^|\n)##+\s*(Round|第\s*\d+\s*轮|轮次|问题)/gi) || [];
  const userAnswers = content.match(/(^|\n)\s*[-*]?\s*(user answer|用户回答|用户选择|用户输入|answer|selection)\s*[:：]/gi) || [];
  const decisions = content.match(/(^|\n)\s*[-*]?\s*(decision|结论|确认|用户确认)\s*[:：]/gi) || [];
  const hasAskUserQuestion = /AskUserQuestion/i.test(content);
  const hasOpenQuestionsOnly = /需要确认的问题|待确认|open questions/i.test(content) && userAnswers.length === 0;

  if (rounds.length < 5 || userAnswers.length < 5 || decisions.length < 5 || !hasAskUserQuestion || hasOpenQuestionsOnly) {
    return { pass: false, message: 'brainstorm.md 必须记录至少 5 轮 AskUserQuestion、用户回答和确认结论' };
  }

  return { pass: true, message: `记录 ${rounds.length} 轮交互式脑暴` };
}

function checkReviewablePrd(basePath, relativePath) {
  const fullPath = join(basePath, relativePath);
  if (!existsSync(fullPath)) {
    return { pass: false, message: '未找到 PRD' };
  }

  const content = readFileSync(fullPath, 'utf-8');
  const requiredSections = [
    /##\s*(Problem|问题|背景)/i,
    /##\s*(Target Users|目标用户|用户)/i,
    /##\s*(Goals|目标|成功指标)/i,
    /##\s*(Non-Goals|非目标|范围)/i,
    /##\s*(User Stories|用户故事|用户场景)/i,
    /##\s*(Functional Requirements|功能需求|需求)/i,
    /##\s*(Non-Functional Requirements|非功能需求|质量属性)/i,
    /##\s*(Acceptance Criteria|验收标准)/i,
    /##\s*(Risks and Open Questions|风险|开放问题)/i
  ];
  const missingCount = requiredSections.filter(section => !section.test(content)).length;
  if (missingCount > 0 || content.trim().length < 600) {
    return { pass: false, message: `PRD 不可评审：缺少 ${missingCount} 个必要章节或内容过短` };
  }

  return { pass: true, message: 'PRD 达到可评审结构' };
}

function checkUnitTestReport(basePath) {
  const utDir = join(basePath, '.peaks', 'ut');
  if (!existsSync(utDir)) {
    return { pass: false, message: '未找到 .peaks/ut' };
  }

  const hasReport = findMatchingFiles(basePath, '.peaks/ut/*unit*report*.md').length > 0
    || findMatchingFiles(basePath, '.peaks/ut/*test*report*.md').length > 0;
  const hasCoverage = findMatchingFiles(basePath, '.peaks/ut/coverage-summary.json').length > 0
    || findMatchingFiles(basePath, '.peaks/ut/*coverage*.json').length > 0;

  if (!hasReport || !hasCoverage) {
    return { pass: false, message: '缺少 unit-test-report 或 coverage-summary' };
  }

  return { pass: true, message: '单元测试报告已归档到 .peaks/ut' };
}

function hasUiProject(basePath) {
  const pkgPath = join(basePath, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
      if (deps.react || deps.vue || deps.svelte || deps.next || deps.vite || deps['@tauri-apps/api']) return true;
    } catch {}
  }

  return existsSync(join(basePath, 'src', 'pages'))
    || existsSync(join(basePath, 'src', 'app'))
    || existsSync(join(basePath, 'app'))
    || existsSync(join(basePath, 'pages'))
    || existsSync(join(basePath, 'src', 'components'));
}

function checkVisualDesign(basePath, currentChangePath) {
  const designDir = join(basePath, '.peaks', currentChangePath, 'design');
  if (!existsSync(designDir)) {
    return { pass: false, message: '未找到 design 目录' };
  }

  const files = readdirSync(designDir).filter(name => isValidVisualArtifact(join(designDir, name)));

  if (files.length === 0) {
    return { pass: false, message: '未找到可视化设计稿' };
  }

  return { pass: true, message: `找到 ${files.length} 个视觉产物` };
}

function isValidVisualArtifact(fullPath) {
  if (!existsSync(fullPath)) return false;

  const lowerName = fullPath.toLowerCase();
  const allowedExtensions = new Set(['.html', '.png', '.jpg', '.jpeg', '.svg', '.pdf']);
  if (![...allowedExtensions].some(ext => lowerName.endsWith(ext))) return false;
  if (!statSync(fullPath).isFile() || statSync(fullPath).size < 1024) return false;

  if (lowerName.endsWith('.html')) {
    const content = readFileSync(fullPath, 'utf-8').toLowerCase();
    return content.includes('<html') || content.includes('<!doctype html');
  }

  const bytes = readFileSync(fullPath);
  if (lowerName.endsWith('.png')) return hasSignature(bytes, [0x89, 0x50, 0x4e, 0x47]);
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return hasSignature(bytes, [0xff, 0xd8, 0xff]);
  if (lowerName.endsWith('.pdf')) return bytes.subarray(0, 4).toString('utf-8') === '%PDF';
  if (lowerName.endsWith('.svg')) return bytes.toString('utf-8', 0, Math.min(bytes.length, 256)).toLowerCase().includes('<svg');

  return false;
}

function hasSignature(bytes, signature) {
  return signature.every((byte, index) => bytes[index] === byte);
}

function checkConfirmation(basePath, relativePath) {
  const fullPath = join(basePath, relativePath);
  if (!existsSync(fullPath)) {
    return { pass: false, message: '未找到确认记录' };
  }

  const content = readFileSync(fullPath, 'utf-8').trim();
  return validateConfirmationContent(content);
}

function validateConfirmationContent(content) {
  if (!content) {
    return { pass: false, message: '确认记录为空' };
  }

  const hasApprovedStatus = /(^|\n)status:\s*approved\b/i.test(content);
  const hasApprover = /(^|\n)approver:\s*\S+/i.test(content);
  const hasApprovedAt = /(^|\n)approvedAt:\s*\S+/i.test(content);
  const hasArtifact = /(^|\n)artifact:\s*\S+/i.test(content);
  const hasSource = /(^|\n)source:\s*\S+/i.test(content);
  const decision = content.match(/(^|\n)decision:\s*(.+)/i)?.[2]?.trim() || '';
  if (!hasApprovedStatus || !hasApprover || !hasApprovedAt || !hasArtifact || !hasSource || decision.length < 20) {
    return { pass: false, message: '确认记录缺少 approved 状态、审批人、时间、来源、artifact 或有效 decision' };
  }

  return { pass: true, message: '已记录用户阻塞确认' };
}

function checkDesignConfirmation(basePath, relativePath) {
  const fullPath = join(basePath, relativePath);
  if (!existsSync(fullPath)) {
    return { pass: false, message: '未找到设计确认记录' };
  }

  const content = readFileSync(fullPath, 'utf-8').trim();
  const baseResult = validateConfirmationContent(content);
  if (!baseResult.pass) return baseResult;

  const artifact = content.match(/(^|\n)artifact:\s*(.+)/i)?.[2]?.trim() || '';
  const hasVisualArtifact = /design\/.+\.(html|png|jpe?g|svg|pdf)$/i.test(artifact);
  const hasPreviewUrl = /(^|\n)\s*(preview url|url)\s*[:：-]\s*\S+/i.test(content);
  const hasPreviewCommand = /(^|\n)\s*(preview command|command|打开命令|预览命令)\s*[:：-]\s*\S+/i.test(content);
  const hasPreviewEvidence = /(^|\n)\s*(screenshot|snapshot|preview evidence|预览证据|截图)\s*[:：-]\s*\S+/i.test(content);
  if (!hasVisualArtifact || !hasPreviewUrl || !hasPreviewCommand || !hasPreviewEvidence) {
    return { pass: false, message: '设计确认必须指向实际视觉产物，并包含 Preview URL、Preview Command 和截图/snapshot 证据' };
  }

  const artifactPath = join(basePath, dirname(relativePath), artifact.replace(/^design\//, ''));
  if (!isValidVisualArtifact(artifactPath)) {
    return { pass: false, message: '设计确认指向的视觉产物不存在或不是有效可预览文件' };
  }

  return { pass: true, message: '已记录设计预览和用户确认证据' };
}

function checkReportContent(basePath, relativePath, patterns, label) {
  const fullPath = join(basePath, relativePath);
  if (!existsSync(fullPath)) {
    return { pass: false, message: `未找到 ${label}` };
  }

  const content = readFileSync(fullPath, 'utf-8');
  const missing = patterns.filter(({ pattern }) => !pattern.test(content));
  if (missing.length > 0) {
    return { pass: false, message: `${label} 缺少 ${missing.map(item => item.name).join('、')}` };
  }

  return { pass: true, message: `${label} 内容可验收` };
}

function checkCodeReviewReport(basePath, relativePath) {
  const result = checkReportContent(basePath, relativePath, [
    { name: '产物路径', pattern: /(^|\n)\s*Artifact Path\s*[:：-]\s*\.peaks\/changes\/[^\s]+\/review\/code-review\.md\s*($|\n)/i },
    { name: 'reviewer', pattern: /Reviewer|reviewer|审查人|code-reviewer/i },
    { name: '范围', pattern: /Scope|范围/i },
    { name: '发现表格', pattern: /\|\s*(Severity|级别)[^\n]*\|/i },
    { name: '结论', pattern: /(^|\n)\s*(Verdict|Decision|结论)\s*[:：-]\s*(PASS|BLOCK|NEEDS_FIX|通过|阻塞)/i }
  ], 'Code Review');
  if (!result.pass) return result;
  return checkNoUnresolvedBlockingFindings(basePath, relativePath, 'Code Review');
}

function checkSecurityReport(basePath, relativePath) {
  const result = checkReportContent(basePath, relativePath, [
    { name: '产物路径', pattern: /(^|\n)\s*Artifact Path\s*[:：-]\s*\.peaks\/changes\/[^\s]+\/security\/security-report\.md\s*($|\n)/i },
    { name: 'reviewer', pattern: /Reviewer|reviewer|审查人|security-reviewer/i },
    { name: '范围', pattern: /Scope|范围/i },
    { name: '安全发现表格', pattern: /\|\s*(Severity|级别)[^\n]*\|/i },
    { name: '结论', pattern: /(^|\n)\s*(Verdict|Decision|结论)\s*[:：-]\s*(PASS|BLOCK|NEEDS_FIX|通过|阻塞)/i }
  ], '安全审查');
  if (!result.pass) return result;
  return checkNoUnresolvedBlockingFindings(basePath, relativePath, '安全审查');
}

function checkNoUnresolvedBlockingFindings(basePath, relativePath, label) {
  const content = readFileSync(join(basePath, relativePath), 'utf-8');
  const rows = content.split('\n').filter(line => /^\s*\|/.test(line) && /\b(CRITICAL|HIGH)\b/i.test(line));
  const unresolved = rows.filter(row => !/\b(resolved|fixed|closed|pass|已修复|已解决|通过)\b/i.test(row));
  if (unresolved.length > 0) {
    return { pass: false, message: `${label} 存在未解决 CRITICAL/HIGH 问题` };
  }
  return { pass: true, message: `${label} 内容可验收` };
}

function checkReviewSmokeReport(basePath, relativePath) {
  return checkSmokeReport(basePath, relativePath, /\.peaks\/changes\/[^\s]+\/review\/code-review-smoke\.md/i, /review\/code-review\.md/i, 'Code Review 冒烟报告');
}

function checkSecuritySmokeReport(basePath, relativePath) {
  return checkSmokeReport(basePath, relativePath, /\.peaks\/changes\/[^\s]+\/security\/security-smoke\.md/i, /security\/security-report\.md/i, '安全检查冒烟报告');
}

function checkSmokeReport(basePath, relativePath, artifactPattern, targetPattern, label) {
  return checkReportContent(basePath, relativePath, [
    { name: '产物路径', pattern: new RegExp(`(^|\\n)\\s*Artifact Path\\s*[:：-]\\s*${artifactPattern.source}\\s*($|\\n)`, 'i') },
    { name: '执行命令', pattern: /(^|\n)\s*(Command|命令)\s*[:：-]\s*\S+/i },
    { name: '检查目标', pattern: new RegExp(`(^|\\n)\\s*(Target|目标)\\s*[:：-]\\s*${targetPattern.source}\\s*($|\\n)`, 'i') },
    { name: '结论状态', pattern: /(^|\n)\s*(Status|Decision|结论|状态)\s*[:：-]\s*(PASS|NEEDS_FIX|BLOCKED|通过|阻塞)/i }
  ], label);
}

function checkSwagger(basePath, relativePath) {
  const fullPath = join(basePath, relativePath);
  const noApiPath = join(dirname(fullPath), 'no-api.md');

  if (!existsSync(fullPath)) {
    return checkNoApiDeclaration(noApiPath);
  }
  try {
    const spec = JSON.parse(readFileSync(fullPath, 'utf-8'));
    if (!spec.openapi || !spec.info || !spec.paths || Object.keys(spec.paths).length === 0) {
      return { pass: false, message: 'swagger.json 缺少 openapi/info/paths' };
    }
    return { pass: true, message: 'Swagger API 规范可验收' };
  } catch {
    return { pass: false, message: 'swagger.json 不是有效 JSON' };
  }
}

function checkNoApiDeclaration(noApiPath) {
  if (!existsSync(noApiPath)) {
    return { pass: false, message: '未找到 swagger.json 或 product/no-api.md' };
  }

  const content = readFileSync(noApiPath, 'utf-8');
  const hasArtifactPath = /(^|\n)\s*Artifact Path\s*[:：-]\s*\.peaks\/changes\/[^\s]+\/product\/no-api\.md\s*($|\n)/i.test(content);
  const hasReason = /(^|\n)\s*(Reason|原因)\s*[:：-]\s*\S+/i.test(content);
  const hasDecision = /(^|\n)\s*(Decision|结论)\s*[:：-]\s*(NO_API|无 API|无接口)/i.test(content);
  if (!hasArtifactPath || !hasReason || !hasDecision) {
    return { pass: false, message: 'product/no-api.md 缺少 Artifact Path、Reason 或 NO_API 结论' };
  }

  return { pass: true, message: '已声明本 change 无 API 产物' };
}

function checkPassStatusReport(basePath, relativePath, label) {
  const fullPath = join(basePath, relativePath);
  if (!existsSync(fullPath)) {
    return { pass: false, message: `未找到 ${label}` };
  }

  const content = readFileSync(fullPath, 'utf-8');
  if (/(^|\n)\s*(status|verdict|结论|状态)\s*[:：-]\s*(FAIL|FAILED|BLOCKED|ERROR|未通过|失败|阻塞)\b/i.test(content)) {
    return { pass: false, message: `${label} 状态失败或阻塞` };
  }
  if (!/(^|\n)\s*(status|verdict|结论|状态)\s*[:：-]\s*PASS\b/i.test(content)) {
    return { pass: false, message: `${label} 缺少 PASS 状态` };
  }

  return { pass: true, message: `${label} PASS` };
}

function checkBusinessReport(basePath, relativePath) {
  const baseResult = checkReportContent(basePath, relativePath, [
    { name: 'AC 验收项映射', pattern: /AC-\d+\s*[:：-]/i },
    { name: '业务价值说明', pattern: /(Business|业务|Core|核心|用户价值).{0,40}(Flow|Value|流程|价值)/i },
    { name: '结论状态', pattern: /(^|\n)\s*(status|decision|结论|状态)\s*[:：-]\s*(PASS|NEEDS_FIX|BLOCKED|通过|阻塞)/i }
  ], '业务验收报告');
  if (!baseResult.pass) return baseResult;

  const content = readFileSync(join(basePath, relativePath), 'utf-8');
  const mappedItems = content.match(/AC-\d+\s*[:：-]/gi) || [];
  if (mappedItems.length < 1) {
    return { pass: false, message: '业务验收报告缺少可追踪 AC 映射' };
  }

  return baseResult;
}

function checkRuntimeSmokeReport(basePath, relativePath) {
  const baseResult = checkReportContent(basePath, relativePath, [
    { name: '启动命令字段', pattern: /(^|\n)\s*(command|命令)\s*[:：-]\s*\S+/i },
    { name: '访问目标字段', pattern: /(^|\n)\s*(url|target|endpoint|路径|窗口)\s*[:：-]\s*\S+/i },
    { name: '用户 UX 验证字段', pattern: /(^|\n)\s*(user\s*UX\s*verification|UX\s*verification|用户.*体验|用户.*验证)\s*[:：-]\s*(requested|confirmed|done|yes|已请求|已确认|已完成)/i },
    { name: '结论状态', pattern: /(^|\n)\s*(status|decision|结论|状态)\s*[:：-]\s*(PASS|NEEDS_FIX|BLOCKED|通过|阻塞)/i }
  ], '运行时冒烟验证');
  if (!baseResult.pass) return baseResult;

  const content = readFileSync(join(basePath, relativePath), 'utf-8');
  if (/(not\s+requested|not\s+done|未请求|未执行|未完成|no)\b/i.test(content)) {
    return { pass: false, message: '运行时冒烟验证包含否定的用户体验验证结果' };
  }

  return baseResult;
}

function checkSwarmTaskGraph(basePath, relativePath) {
  const fullPath = join(basePath, relativePath);
  if (!existsSync(fullPath)) {
    return { pass: false, message: '未找到 swarm/task-graph.json' };
  }

  try {
    const graph = JSON.parse(readFileSync(fullPath, 'utf-8'));
    const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
    const modules = nodes.map(node => `${node.agentId || ''} ${node.module || ''}`.toLowerCase());
    const required = getRequiredExecutionSurfaces(basePath);
    const missing = required.filter(name => !modules.some(module => module.includes(name)));
    const hasFrontendReview = !hasUiProject(basePath) || modules.some(module => module.includes('frontend') && (module.includes('code-review') || module.includes('review')));
    const hasBackendReview = !hasApiScope(basePath) || modules.some(module => module.includes('backend') && (module.includes('code-review') || module.includes('review')));
    const hasUnitTest = modules.some(module => module.includes('unit-test') || module.includes('unit test') || module.includes('测试'));
    const hasRuntimeSmoke = modules.some(module => module.includes('runtime-smoke') || module.includes('runtime smoke') || module.includes('冒烟'));
    const missingSpecial = [
      ...(hasFrontendReview ? [] : ['frontend-code-review']),
      ...(hasBackendReview ? [] : ['backend-code-review']),
      ...(hasUnitTest ? [] : ['unit-test']),
      ...(hasRuntimeSmoke ? [] : ['runtime-smoke'])
    ];
    if (nodes.length < required.length + 3 || missing.length > 0 || missingSpecial.length > 0) {
      return { pass: false, message: `task-graph.json 缺少必要执行节点: ${[...missing, ...missingSpecial].join(', ')}` };
    }

    return { pass: true, message: `task graph 包含 ${nodes.length} 个节点` };
  } catch {
    return { pass: false, message: 'swarm/task-graph.json 不是有效 JSON' };
  }
}

function checkSwarmWaves(basePath, relativePath) {
  const fullPath = join(basePath, relativePath);
  if (!existsSync(fullPath)) {
    return { pass: false, message: '未找到 swarm/waves.json' };
  }

  try {
    const waves = JSON.parse(readFileSync(fullPath, 'utf-8'));
    const waveList = Array.isArray(waves) ? waves : waves.waves;
    if (!Array.isArray(waveList) || waveList.length === 0) {
      return { pass: false, message: 'waves.json 缺少 waves 数组' };
    }

    const parallelWaves = waveList.filter(wave => Array.isArray(wave.parallel) && wave.parallel.length >= 2);
    const oversizedWave = waveList.find(wave => Array.isArray(wave.parallel) && wave.parallel.length > 5);
    const developmentAgents = new Set();
    for (const wave of waveList) {
      for (const agent of Array.isArray(wave.parallel) ? wave.parallel : []) {
        if (/^(frontend|backend|postgres|tauri|devops|[\w-]+-child)$/i.test(agent) && !/^qa-child$/i.test(agent)) {
          developmentAgents.add(agent);
        }
      }
    }
    if (parallelWaves.length === 0 && !isSingleSurfaceNoBackend(basePath)) {
      return { pass: false, message: 'waves.json 没有记录任何并行 wave' };
    }
    if (oversizedWave) {
      return { pass: false, message: '单个 wave 的 parallel agent 超过 5 个' };
    }
    if (developmentAgents.size > 10) {
      return { pass: false, message: `开发 child agents 超过 10 个: ${developmentAgents.size}` };
    }

    return { pass: true, message: `记录 ${parallelWaves.length} 个并行 wave，${developmentAgents.size} 个开发 agent` };
  } catch {
    return { pass: false, message: 'swarm/waves.json 不是有效 JSON' };
  }
}

function checkSwarmBriefs(basePath, currentChangePath) {
  const requiredAgents = getRequiredBriefAgents(basePath);
  const missing = requiredAgents.filter(agent => !existsSync(join(basePath, '.peaks', currentChangePath, 'swarm', 'briefs', `${agent}.md`)));
  if (missing.length > 0) {
    return { pass: false, message: `缺失任务简报: ${missing.join(', ')}` };
  }

  const invalid = requiredAgents.filter(agent => {
    const content = readFileSync(join(basePath, '.peaks', currentChangePath, 'swarm', 'briefs', `${agent}.md`), 'utf-8');
    return !/Artifact Path\s*[:：-]/i.test(content)
      || !/(Task|任务)\s*[:：-]/i.test(content)
      || !/(Files|文件边界|File Boundary)\s*[:：-]/i.test(content)
      || !/(Depends On|依赖)\s*[:：-]/i.test(content)
      || !/(Handoff|交接)\s*[:：-]/i.test(content);
  });
  if (invalid.length > 0) {
    return { pass: false, message: `任务简报缺少结构字段: ${invalid.join(', ')}` };
  }

  return { pass: true, message: `找到 ${requiredAgents.length} 个结构化任务简报` };
}

function checkHandoffProtocol(basePath, currentChangePath) {
  const requiredAgents = getRequiredBriefAgents(basePath);
  const missing = requiredAgents.filter(agent => !existsSync(join(basePath, '.peaks', currentChangePath, 'swarm', 'handoffs', `${agent}.md`)));
  if (missing.length > 0) {
    return { pass: false, message: `缺失 handoff: ${missing.join(', ')}` };
  }

  const invalid = requiredAgents.filter(agent => {
    const content = readFileSync(join(basePath, '.peaks', currentChangePath, 'swarm', 'handoffs', `${agent}.md`), 'utf-8');
    return !/(Input Version|输入版本)\s*[:：-]/i.test(content)
      || !/(Output Version|输出版本)\s*[:：-]/i.test(content)
      || !/(Files Changed|文件状态|File Status)\s*[:：-]/i.test(content)
      || !/(Next Agent|下游|交接对象)\s*[:：-]/i.test(content);
  });
  if (invalid.length > 0) {
    return { pass: false, message: `handoff 缺少版本/文件/下游字段: ${invalid.join(', ')}` };
  }

  return { pass: true, message: `找到 ${requiredAgents.length} 个结构化 handoff` };
}

function checkExecutionAgents(basePath) {
  const requiredAgents = getRequiredExecutionAgentFiles(basePath);
  const missing = requiredAgents.filter(file => !existsSync(join(basePath, file)));
  if (missing.length > 0) {
    return { pass: false, message: `缺失专项 agent: ${missing.map(file => file.split('/').at(-1)).join(', ')}` };
  }

  return { pass: true, message: 'scope 内的研发、QA 子任务、CR 和安全专项 agents 已生成' };
}

function isSingleSurfaceNoBackend(basePath) {
  return hasUiProject(basePath) && !hasApiScope(basePath);
}

function getRequiredBriefAgents(basePath) {
  return [
    ...(hasUiProject(basePath) ? ['frontend'] : []),
    ...(hasApiScope(basePath) ? ['backend'] : []),
    'qa-child',
    ...(hasUiProject(basePath) ? ['code-reviewer-frontend'] : []),
    ...(hasApiScope(basePath) ? ['code-reviewer-backend'] : []),
    'security-reviewer'
  ];
}

function getRequiredExecutionSurfaces(basePath) {
  return [
    ...(hasUiProject(basePath) ? ['frontend'] : []),
    ...(hasApiScope(basePath) ? ['backend'] : []),
    'qa',
    'security'
  ];
}

function getRequiredExecutionAgentFiles(basePath) {
  return [
    ...(hasUiProject(basePath) ? ['.claude/agents/frontend.md'] : []),
    ...(hasApiScope(basePath) ? ['.claude/agents/backend.md'] : []),
    '.claude/agents/qa-child.md',
    ...(hasUiProject(basePath) ? ['.claude/agents/code-reviewer-frontend.md'] : []),
    ...(hasApiScope(basePath) ? ['.claude/agents/code-reviewer-backend.md'] : []),
    '.claude/agents/security-reviewer.md'
  ];
}

function getRequiredUsageAgents(basePath) {
  return [
    'product',
    ...(hasUiProject(basePath) ? ['design', 'frontend'] : []),
    ...(hasApiScope(basePath) ? ['backend'] : []),
    'qa',
    'qa-child',
    'security-reviewer'
  ];
}

function hasApiScope(basePath) {
  const currentChangePath = getCurrentChangePath(basePath);
  const noApiPath = join(basePath, '.peaks', currentChangePath, 'product', 'no-api.md');
  if (existsSync(noApiPath)) return false;

  const swaggerPath = join(basePath, '.peaks', currentChangePath, 'product', 'swagger.json');
  if (existsSync(swaggerPath)) return true;

  const pkgPath = join(basePath, 'package.json');
  if (!existsSync(pkgPath)) return false;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return Boolean(deps.express || deps.fastify || deps.koa || deps.hono || deps['@nestjs/core'] || deps.prisma || deps.drizzle || deps.typeorm);
  } catch {
    return false;
  }
}

function checkAgentUsage(basePath, relativePath) {
  const baseResult = checkReportContent(basePath, relativePath, [
    { name: '表格结构', pattern: /\|\s*Agent\s*\|[\s\S]*\|\s*---/i },
    { name: '任务列', pattern: /\|[^\n]*(Task|Purpose|任务|用途)[^\n]*\|/i },
    { name: '证据路径', pattern: /\.md\b/i }
  ], 'Agent 使用证据');
  if (!baseResult.pass) return baseResult;

  const content = readFileSync(join(basePath, relativePath), 'utf-8');
  const agentNames = new Set((content.match(/\b(product|design|frontend|backend|dispatcher|qa-child|qa|security-reviewer|code-reviewer-[a-z-]+)\b/gi) || []).map(name => name.toLowerCase()));
  const requiredAgents = getRequiredUsageAgents(basePath);
  const missingAgents = requiredAgents.filter(agent => !agentNames.has(agent));
  const hasCodeReviewer = [...agentNames].some(agent => agent.startsWith('code-reviewer-'));
  if (missingAgents.length > 0 || !hasCodeReviewer) {
    return { pass: false, message: `Agent 使用证据缺少: ${[...missingAgents, ...(hasCodeReviewer ? [] : ['code-reviewer'])].join(', ')}` };
  }

  return baseResult;
}

function checkQaRounds(basePath, currentChangePath) {
  const requiredFiles = [
    `.peaks/${currentChangePath}/qa/qa-round-1.md`,
    `.peaks/${currentChangePath}/qa/qa-round-2.md`,
    `.peaks/${currentChangePath}/qa/qa-round-3.md`,
    `.peaks/${currentChangePath}/qa/acceptance-report.md`
  ];
  const missing = requiredFiles.filter(file => !existsSync(join(basePath, file)));

  if (missing.length > 0) {
    return { pass: false, message: `缺失 ${missing.map(file => file.split('/').at(-1)).join(', ')}` };
  }

  const failing = requiredFiles.filter(file => !checkPassStatusReport(basePath, file, file.split('/').at(-1)).pass);
  if (failing.length > 0) {
    return { pass: false, message: `QA 报告未通过: ${failing.map(file => file.split('/').at(-1)).join(', ')}` };
  }

  return { pass: true, message: 'QA 3 轮测试和验收报告 PASS' };
}

/**
 * 检查 TypeScript 编译（递归发现根目录和嵌套 app）
 * @param {string} basePath - 项目路径
 * @returns {Promise<object>} 检查结果
 */
async function checkTypeScriptCompile(basePath) {
  const projects = discoverTypeScriptProjects(basePath);
  if (projects.length === 0) {
    return { pass: null, message: '未找到 tsconfig.json' };
  }

  const results = await Promise.all(projects.map(project => checkPackageTypeScript(project.path, project.name)));
  const failed = results.filter(r => r.pass === false);
  const passed = results.filter(r => r.pass === true);
  const skipped = results.filter(r => r.pass === null);

  if (failed.length > 0) {
    const details = failed.map(r => `${r.name}: ${r.message}`).join('; ');
    return { pass: false, message: `${failed.length} 包失败: ${details}` };
  }

  if (passed.length > 0) {
    const skippedMessage = skipped.length > 0 ? `, ${skipped.length} 跳过` : '';
    return { pass: true, message: `${passed.length} 包通过${skippedMessage}` };
  }

  return { pass: null, message: `${skipped.length} 包无 tsconfig，跳过编译` };
}

/**
 * 检测测试框架类型
 * @param {string} pkgPath - 包路径
 * @returns {Promise<string|null>} vitest | jest | playwright | null
 */
async function detectTestFramework(pkgPath) {
  try {
    const pkgFile = join(pkgPath, 'package.json');
    if (!existsSync(pkgFile)) return null;
    const { readFileSync } = await import('fs');
    const content = readFileSync(pkgFile, 'utf-8');
    const pkg = JSON.parse(content);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['vitest']) return 'vitest';
    if (deps['jest'] || deps['@types/jest']) return 'jest';
    if (deps['@playwright/test']) return 'playwright';
    return null;
  } catch {
    return null;
  }
}

/**
 * 检查单个包的覆盖率
 * @param {string} pkgPath - 包路径
 * @param {string} pkgName - 包名称
 * @returns {Promise<object>} 检查结果
 */
async function checkPackageCoverage(pkgPath, pkgName) {
  const coverageFiles = [
    join(pkgPath, 'coverage', 'coverage-summary.json'),
    pkgName === '(root)' ? join(pkgPath, '.peaks', 'ut', 'coverage-summary.json') : null
  ].filter(Boolean);

  for (const coverageFile of coverageFiles) {
    if (!existsSync(coverageFile)) continue;

    try {
      const content = readFileSync(coverageFile, 'utf-8');
      const coverage = parseCoveragePercent(coverageFile, content);
      return {
        name: pkgName,
        pass: true,
        message: `覆盖率 ${coverage.toFixed(2)}%`,
        coverage
      };
    } catch {}
  }

  return { name: pkgName, pass: null, message: '无覆盖率报告（需要 coverage/coverage-summary.json 或 .peaks/ut/coverage-summary.json）', coverage: 0 };
}

function parseCoveragePercent(coverageFile, content) {
  if (coverageFile.endsWith('.json')) {
    const data = JSON.parse(content);
    const metrics = ['lines', 'statements', 'branches', 'functions'];
    const values = metrics.map(metric => Number(data.total?.[metric]?.pct ?? 0));
    return Math.min(...values);
  }

  if (coverageFile.endsWith('.info')) {
    const foundMatches = [...content.matchAll(/^LF:(\d+)$/gm)];
    const hitMatches = [...content.matchAll(/^LH:(\d+)$/gm)];
    const found = foundMatches.reduce((sum, match) => sum + Number(match[1]), 0);
    const hit = hitMatches.reduce((sum, match) => sum + Number(match[1]), 0);
    return found > 0 ? (hit / found) * 100 : 0;
  }

  const lineRate = content.match(/line-rate="([0-9.]+)"/);
  return lineRate ? Number(lineRate[1]) * 100 : 0;
}

/**
 * 检查存量项目覆盖率
 * @param {string} basePath - 项目路径
 * @returns {Promise<object>} 检查结果
 */
async function checkLegacyCoverage(basePath) {
  const targetCoverage = getCoverageTarget(basePath);
  const projects = discoverCoverageProjects(basePath);
  const coverageResults = [];

  for (const project of projects) {
    coverageResults.push(await checkPackageCoverage(project.path, project.name));
  }

  const missing = coverageResults.filter(result => result.pass === null);
  if (missing.length > 0) {
    const details = missing.map(result => `${result.name}: ${result.message}`).join('; ');
    return { pass: false, message: `${details}，必须运行单元测试并达到目标 ${targetCoverage}%` };
  }

  const failed = coverageResults.filter(result => result.coverage < targetCoverage);
  if (failed.length > 0) {
    const details = failed.map(result => `${result.name}: ${result.message}`).join('; ');
    return { pass: false, message: `${details}，低于目标 ${targetCoverage}%` };
  }

  const details = coverageResults.map(result => `${result.name}: ${result.message}`).join('; ');
  return { pass: true, message: `${details}，目标 ${targetCoverage}%` };
}

function getCoverageTarget(basePath) {
  return isOpenSourceComponentLibrary(basePath) ? componentLibraryTargetCoverage : defaultTargetCoverage;
}

function isOpenSourceComponentLibrary(basePath) {
  const pkgPath = join(basePath, 'package.json');
  if (!existsSync(pkgPath)) return false;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const text = [
      pkg.name,
      pkg.description,
      ...(Array.isArray(pkg.keywords) ? pkg.keywords : [])
    ].filter(Boolean).join(' ').toLowerCase();
    const hasLibrarySignal = Boolean(pkg.exports || pkg.module || pkg.main || pkg.types);
    const hasComponentSignal = /component|components|ui-library|design-system|react/.test(text)
      || Boolean(pkg.peerDependencies?.react || pkg.peerDependencies?.vue);
    const isOpenSourceLike = pkg.private !== true;
    return isOpenSourceLike && hasLibrarySignal && hasComponentSignal;
  } catch {
    return false;
  }
}

function discoverCoverageProjects(basePath) {
  const projects = [{ path: basePath, name: '(root)' }];
  const seen = new Set([basePath]);
  const candidateDirs = ['packages', 'apps'];

  for (const dirName of candidateDirs) {
    const dirPath = join(basePath, dirName);
    if (!existsSync(dirPath)) continue;

    try {
      const entries = readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const projectPath = join(dirPath, entry.name);
        if (seen.has(projectPath)) continue;
        seen.add(projectPath);
        projects.push({ path: projectPath, name: `${dirName}/${entry.name}` });
      }
    } catch {}
  }

  return projects;
}

// 辅助函数：读取文件
async function readFile(path, encoding) {
  const { readFileSync } = await import('fs');
  return readFileSync(path, encoding);
}

/**
 * 运行完整的门禁检查
 * @param {string} basePath - 项目路径
 * @returns {Promise<object>} 检查结果
 */
export async function runGateChecks(basePath) {
  const results = [];
  let allPassed = true;
  const currentChangePath = getCurrentChangePath(basePath);
  const hasUi = hasUiProject(basePath);

  for (const check of buildArtifactChecks(currentChangePath, { hasUi })) {
    const result = {
      id: check.id,
      name: check.name,
      required: check.required,
      missingAction: check.missingAction,
      status: '❌',
      pass: false,
      details: '',
      files: []
    };

    if (check.pattern) {
      const files = findMatchingFiles(basePath, check.pattern);
      result.files = files;

      if (files.length > 0) {
        result.status = '✅';
        result.pass = true;
        result.details = `找到 ${files.length} 个文件`;
      } else {
        allPassed = false;
        result.details = '未找到';
      }
    } else if (check.check === 'interactive-brainstorm') {
      const brainstormResult = checkInteractiveBrainstorm(basePath, check.file);
      result.details = brainstormResult.message;

      if (brainstormResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'reviewable-prd') {
      const prdResult = checkReviewablePrd(basePath, check.file);
      result.details = prdResult.message;

      if (prdResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'unit-test-report') {
      const utResult = checkUnitTestReport(basePath);
      result.details = utResult.message;

      if (utResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'init-baseline') {
      const baselineResult = checkInitializationBaseline(basePath);
      result.details = baselineResult.message;

      if (baselineResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'confirmation') {
      const confirmationResult = checkConfirmation(basePath, check.file);
      result.details = confirmationResult.message;

      if (confirmationResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'design-confirmation') {
      const confirmationResult = checkDesignConfirmation(basePath, check.file);
      result.details = confirmationResult.message;

      if (confirmationResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'visual-design') {
      const visualResult = checkVisualDesign(basePath, currentChangePath);
      result.details = visualResult.message;

      if (visualResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'swagger') {
      const reportResult = checkSwagger(basePath, check.file);
      result.details = reportResult.message;

      if (reportResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'code-review-report') {
      const reportResult = checkCodeReviewReport(basePath, check.file);
      result.details = reportResult.message;

      if (reportResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'review-smoke-report') {
      const reportResult = checkReviewSmokeReport(basePath, check.file);
      result.details = reportResult.message;

      if (reportResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'security-report') {
      const reportResult = checkSecurityReport(basePath, check.file);
      result.details = reportResult.message;

      if (reportResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'security-smoke-report') {
      const reportResult = checkSecuritySmokeReport(basePath, check.file);
      result.details = reportResult.message;

      if (reportResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'qa-report') {
      const reportResult = checkPassStatusReport(basePath, check.file, check.name);
      result.details = reportResult.message;

      if (reportResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'business-report') {
      const reportResult = checkBusinessReport(basePath, check.file);
      result.details = reportResult.message;

      if (reportResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'runtime-smoke-report') {
      const reportResult = checkRuntimeSmokeReport(basePath, check.file);
      result.details = reportResult.message;

      if (reportResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'swarm-task-graph') {
      const reportResult = checkSwarmTaskGraph(basePath, check.file);
      result.details = reportResult.message;

      if (reportResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'swarm-waves') {
      const reportResult = checkSwarmWaves(basePath, check.file);
      result.details = reportResult.message;

      if (reportResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'swarm-briefs') {
      const reportResult = checkSwarmBriefs(basePath, currentChangePath);
      result.details = reportResult.message;

      if (reportResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'handoff-protocol') {
      const reportResult = checkHandoffProtocol(basePath, currentChangePath);
      result.details = reportResult.message;

      if (reportResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'execution-agents') {
      const reportResult = checkExecutionAgents(basePath);
      result.details = reportResult.message;

      if (reportResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'agent-usage') {
      const reportResult = checkAgentUsage(basePath, check.file);
      result.details = reportResult.message;

      if (reportResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'qa-rounds') {
      const qaResult = checkQaRounds(basePath, currentChangePath);
      result.details = qaResult.message;

      if (qaResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'phase-handoffs') {
      const handoffResult = checkPhaseHandoffs(basePath, currentChangePath);
      result.details = handoffResult.message;

      if (handoffResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    } else if (check.check === 'tsc') {
      const tscResult = await checkTypeScriptCompile(basePath);
      result.details = tscResult.message;

      if (tscResult.pass === true) {
        result.status = '✅';
        result.pass = true;
      } else if (tscResult.pass === false) {
        result.status = '❌';
        allPassed = false;
      } else {
        result.status = '⏭️';
        result.pass = null;
        result.details = tscResult.message || '跳过';
      }
    } else if (check.check === 'coverage') {
      const coverageResult = await checkLegacyCoverage(basePath);
      result.details = coverageResult.message;

      if (coverageResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '❌';
        allPassed = false;
      }
    }

    results.push(result);
  }

  return {
    passed: allPassed,
    totalChecks: results.length,
    passedChecks: results.filter(r => r.pass === true).length,
    failedChecks: results.filter(r => r.pass === false).length,
    skippedChecks: results.filter(r => r.pass === null).length,
    results
  };
}

if (isDirectCliExecution(import.meta.url)) {
  (async () => {
    const result = await runGateChecks(projectPath);
    const passed = printGateResults(result, projectPath);
    process.exit(passed ? 0 : 1);
  })();
}

export default runGateChecks;