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
const currentChangeId = readCurrentChangeId(projectPath) || '1970-01-01-initial-product';
const currentChangePath = getPeaksPaths(projectPath, currentChangeId).changeRelativePath;
const skipCoverage = args.includes('--force') || args.includes('-f');
const allowLocalTools = args.includes('--allow-local-tools') || process.env.PEAKS_SDD_ALLOW_LOCAL_TOOLS === '1';
const targetCoverage = 80; // 目标覆盖率

function resolveProjectRoot(startPath) {
  let current = resolve(startPath);

  while (true) {
    if (existsSync(join(current, '.peaks', 'current-change'))) return current;

    const parent = dirname(current);
    if (parent === current) return resolve(startPath);
    current = parent;
  }
}

const ARTIFACT_CHECKS = [
  {
    id: 1,
    name: 'PRD 文档',
    pattern: `.peaks/${currentChangePath}/product/prd.md`,
    required: true,
    missingAction: '通知 product 补全'
  },
  {
    id: 2,
    name: '设计规范',
    pattern: `.peaks/${currentChangePath}/design/design-spec.md`,
    required: true,
    missingAction: '通知 design 补全'
  },
  {
    id: 3,
    name: '技术文档',
    pattern: `.peaks/${currentChangePath}/architecture/system-design.md`,
    required: true,
    missingAction: '通知研发 Agent 补全'
  },
  {
    id: 4,
    name: '测试用例',
    pattern: `.peaks/${currentChangePath}/qa/test-plan.md`,
    required: true,
    missingAction: '通知 qa 补全'
  },
  {
    id: 5,
    name: '模块自测报告',
    pattern: `.peaks/${currentChangePath}/swarm/reports/*.md`,
    required: true,
    missingAction: '缺失模块重新调度子 Agent'
  },
  {
    id: 6,
    name: 'Code Review',
    pattern: `.peaks/${currentChangePath}/review/code-review.md`,
    required: true,
    missingAction: '通知 code-reviewer 补全'
  },
  {
    id: 7,
    name: '安全审查',
    pattern: `.peaks/${currentChangePath}/review/security-review.md`,
    required: true,
    missingAction: '有 CRITICAL 问题则阻断'
  },
  {
    id: 8,
    name: '最终报告',
    pattern: `.peaks/${currentChangePath}/final-report.md`,
    required: true,
    missingAction: '汇总 PRD、设计、架构、review、QA 和验证证据'
  },
  {
    id: 9,
    name: '初始化基线',
    check: 'init-baseline',
    required: true,
    missingAction: '重新运行 peaks-sdd 初始化补齐 project docs 和 agents'
  },
  {
    id: 10,
    name: 'TypeScript 编译',
    check: 'tsc',
    required: true,
    missingAction: '编译失败的模块不标记完成'
  },
  {
    id: 11,
    name: '单元测试覆盖率',
    check: 'coverage',
    required: false,
    missingAction: '新项目需补充单元测试'
  }
];

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
  // 查找覆盖率报告
  const coverageFiles = [
    join(pkgPath, 'coverage', 'coverage-summary.json'),
    join(pkgPath, 'coverage', 'lcov.info'),
    join(pkgPath, 'coverage', ' Clover.xml'),
    join(pkgPath, 'coverage', 'cobertura-coverage.xml'),
  ];

  for (const cf of coverageFiles) {
    if (existsSync(cf)) {
      try {
        const { readFileSync } = await import('fs');
        const content = readFileSync(cf, 'utf-8');
        let coverage = 0;
        if (cf.endsWith('.json')) {
          const data = JSON.parse(content);
          coverage = data.total?.lines?.pct || 0;
        } else if (cf.endsWith('.info')) {
          // lcov.info 格式
          const match = content.match(/LH:\d+\n?.*?LV:\d+/g);
          if (match) {
            let hit = 0, found = 0;
            for (const m of match) {
              const parts = m.split('\n');
              const lv = parts[1]?.match(/LV:(\d+)/);
              const lh = parts[0]?.match(/LH:(\d+)/);
              if (lv) found += parseInt(lv[1]);
              if (lh) hit += parseInt(lh[1]);
            }
            coverage = found > 0 ? (hit / found * 100) : 0;
          }
        }
        return {
          name: pkgName,
          pass: coverage >= targetCoverage,
          message: `覆盖率 ${coverage.toFixed(2)}%`,
          coverage
        };
      } catch {}
    }
  }

  return { name: pkgName, pass: null, message: '无覆盖率报告', coverage: 0 };
}

/**
 * 检查存量项目覆盖率
 * @param {string} basePath - 项目路径
 * @returns {Promise<object>} 检查结果
 */
async function checkLegacyCoverage(basePath) {
  // 检查是否是存量项目（有旧代码但无测试）
  const subDirs = ['packages', 'apps', 'src'];
  const packages = [];

  for (const subDir of subDirs) {
    const subPath = join(basePath, subDir);
    if (!existsSync(subPath)) continue;
    try {
      const entries = readdirSync(subPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const pkgPath = join(subPath, entry.name);
        const tsconfigPath = join(pkgPath, 'tsconfig.json');
        if (existsSync(tsconfigPath)) {
          packages.push({ path: pkgPath, name: `${subDir}/${entry.name}` });
        }
      }
    } catch {}
  }

  if (packages.length === 0) {
    return { skip: true, message: '未找到子包' };
  }

  // 检查是否有 vitest.config 或 jest.config
  let hasTestConfig = false;
  let testFramework = null;
  for (const pkg of packages) {
    const configs = ['vitest.config.ts', 'vitest.config.js', 'jest.config.js', 'jest.config.ts'];
    for (const cfg of configs) {
      if (existsSync(join(pkg.path, cfg))) {
        hasTestConfig = true;
        testFramework = cfg.startsWith('vitest') ? 'vitest' : 'jest';
        break;
      }
    }
    if (hasTestConfig) break;
  }

  if (!hasTestConfig) {
    return {
      pass: false,
      message: '存量项目未配置单元测试 (建议: npx vitest --init)'
    };
  }

  // 如果指定了 --force，强制检查覆盖率
  if (!skipCoverage) {
    return {
      skip: true,
      message: `已跳过覆盖率检查 (覆盖率要求 ${targetCoverage}%, 可用 --force 强制检查)`
    };
  }

  // 运行覆盖率检查
  let hasCoverage = false;
  let totalPackages = packages.length;
  let passedPackages = 0;

  for (const pkg of packages) {
    const result = await checkPackageCoverage(pkg.path, pkg.name);
    if (result.pass !== null) {
      hasCoverage = true;
      if (result.pass) passedPackages++;
    }
  }

  if (!hasCoverage) {
    return { pass: false, message: '请先运行单元测试生成覆盖率报告' };
  }

  const failCount = totalPackages - passedPackages;
  if (failCount > 0) {
    return {
      pass: false,
      message: `${failCount}/${totalPackages} 包覆盖率未达标 (< ${targetCoverage}%)`
    };
  }

  return { pass: true, message: `所有包覆盖率达标 (${passedPackages}/${totalPackages})` };
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

  for (const check of ARTIFACT_CHECKS) {
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
      // 覆盖率检查（仅警告，不阻断）
      const coverageResult = await checkLegacyCoverage(basePath);
      result.details = coverageResult.message;

      if (coverageResult.skip) {
        result.status = '⏭️';
        result.pass = true;
      } else if (coverageResult.pass) {
        result.status = '✅';
        result.pass = true;
      } else {
        result.status = '⚠️';
        result.pass = true; // 不阻断，但有警告
        result.details += ' (已跳过，可 --force 强制检查)';
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
    console.log(`│ ${r.id.toString().padStart(2)} │ ${name} │ ${r.status} ${r.pass ? 'PASS' : 'FAIL'} │ ${details} │`);
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