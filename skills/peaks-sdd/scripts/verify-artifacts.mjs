#!/usr/bin/env node
/**
 * peaks-sdd 产出物门禁验证脚本
 * 验证 6 项强制产出物是否齐全
 */

import { existsSync, readFileSync, realpathSync, readdirSync, statSync } from 'fs';
import { dirname, isAbsolute, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
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

const __filename = fileURLToPath(import.meta.url);

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
        check: 'confirmation',
        file: `.peaks/${currentChangePath}/design/design-confirmation.md`,
        required: true,
        missingAction: '设计稿必须经用户明确确认后才能进入技术方案'
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
      name: '模块自测报告',
      pattern: `.peaks/${currentChangePath}/swarm/reports/*.md`,
      required: true,
      missingAction: '缺失模块重新调度子 Agent'
    },
    {
      id: 10,
      name: 'Code Review',
      pattern: `.peaks/${currentChangePath}/review/code-review.md`,
      required: true,
      missingAction: '通知 code-reviewer 补全'
    },
    {
      id: 11,
      name: '安全审查',
      pattern: `.peaks/${currentChangePath}/security/security-report.md`,
      required: true,
      missingAction: '有 CRITICAL 问题则阻断'
    },
    {
      id: 12,
      name: '功能测试报告',
      pattern: `.peaks/${currentChangePath}/qa/functional-report.md`,
      required: true,
      missingAction: '通知 qa 补全功能测试报告'
    },
    {
      id: 13,
      name: '性能测试报告',
      pattern: `.peaks/${currentChangePath}/qa/performance-report.md`,
      required: true,
      missingAction: '通知 qa 补全性能测试报告'
    },
    {
      id: 14,
      name: 'QA 三轮测试',
      check: 'qa-rounds',
      required: true,
      missingAction: '必须完成 qa-round-1/2/3 和 acceptance-report'
    },
    {
      id: 15,
      name: '最终报告',
      pattern: `.peaks/${currentChangePath}/final-report.md`,
      required: true,
      missingAction: '汇总 PRD、设计、架构、review、QA 和验证证据'
    },
    {
      id: 16,
      name: '初始化基线',
      check: 'init-baseline',
      required: true,
      missingAction: '重新运行 peaks-sdd 初始化补齐 project docs 和 agents'
    },
    {
      id: 17,
      name: 'TypeScript 编译',
      check: 'tsc',
      required: true,
      missingAction: '编译失败的模块不标记完成'
    },
    {
      id: 18,
      name: '单元测试报告',
      check: 'unit-test-report',
      required: true,
      missingAction: '必须输出单元测试报告到 .peaks/ut/'
    },
    {
      id: 19,
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
    '.claude/agents/dispatcher.md',
    '.claude/agents/product.md',
    '.claude/agents/qa.md'
  ];

  const missing = requiredFiles.filter(file => !existsSync(join(basePath, file)));
  if (missing.length > 0) {
    return { pass: false, message: `缺失 ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}` };
  }

  return { pass: true, message: 'project docs 和 agents 已就绪' };
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

  const allowedExtensions = new Set(['.html', '.png', '.jpg', '.jpeg', '.svg', '.pdf']);
  const files = readdirSync(designDir).filter(name => {
    const lowerName = name.toLowerCase();
    if (![...allowedExtensions].some(ext => lowerName.endsWith(ext))) return false;

    const fullPath = join(designDir, name);
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
  });

  if (files.length === 0) {
    return { pass: false, message: '未找到可视化设计稿' };
  }

  return { pass: true, message: `找到 ${files.length} 个视觉产物` };
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

  return { pass: true, message: 'QA 3 轮测试和验收报告齐全' };
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

  return { pass: false, message: `${skipped.length} 包未执行编译` };
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
    passedChecks: results.filter(r => r.pass).length,
    failedChecks: results.filter(r => !r.pass).length,
    results
  };
}

/**
 * 打印检查结果表格
 * @param {object} checkResult - 检查结果
 */
function printResults(checkResult) {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║            peaks-sdd 产出物门禁检查                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`\x1b[90m项目路径: ${projectPath}\x1b[0m\n`);

  console.log('┌────┬────────────────────┬──────────────────┬───────────────────────────┐');
  console.log('│ #  │ 产出物             │ 状态             │ 说明                      │');
  console.log('├────┼────────────────────┼──────────────────┼───────────────────────────┤');

  for (const r of checkResult.results) {
    const name = r.name.padEnd(18).slice(0, 18);
    const details = r.details.slice(0, 23).padEnd(23);
    const displayId = (checkResult.results.indexOf(r) + 1).toString().padStart(2);
    console.log(`│ ${displayId} │ ${name} │ ${r.status} ${r.pass ? 'PASS' : 'FAIL'} │ ${details} │`);
  }

  console.log('└────┴────────────────────┴──────────────────┴───────────────────────────┘');

  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│ 汇总:                                                        │');
  console.log(`│   检查项: ${checkResult.totalChecks}                                       │`);
  console.log(`│   通过: ${checkResult.passedChecks}                                        │`);
  console.log(`│   失败: ${checkResult.failedChecks}                                        │`);
  console.log('└─────────────────────────────────────────────────────────────┘');

  if (checkResult.failedChecks > 0) {
    console.log('\n\x1b[31m失败项目:\x1b[0m');
    for (const r of checkResult.results) {
      if (!r.pass) {
        console.log(`  ${r.id}. ${r.name} → ${r.missingAction}`);
        if (r.files.length > 0) {
          for (const f of r.files.slice(0, 3)) {
            console.log(`     - ${f}`);
          }
          if (r.files.length > 3) {
            console.log(`     ... 还有 ${r.files.length - 3} 个文件`);
          }
        }
      }
    }
  }

  console.log('\n' + '═'.repeat(62));
  if (checkResult.passed) {
    console.log('\x1b[32m ✅ 门禁检查通过 — 可以进入 QA 环节\x1b[0m\n');
  } else {
    console.log('\x1b[31m ❌ 门禁检查未通过 — 必须补全缺失项\x1b[0m\n');
  }

  return checkResult.passed;
}

if (resolve(process.argv[1] || '') === resolve(__filename)) {
  (async () => {
    const result = await runGateChecks(projectPath);
    const passed = printResults(result);
    process.exit(passed ? 0 : 1);
  })();
}

export default runGateChecks;