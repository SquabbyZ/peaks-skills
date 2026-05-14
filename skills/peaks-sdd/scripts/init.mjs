#!/usr/bin/env node
/**
 * peaks-sdd 项目初始化脚本
 * 自动扫描项目技术栈并生成配置
 *
 * 用法:
 *   node init.mjs <projectPath>                    # 自动检测技术栈
 *   node init.mjs <projectPath> --frontend=react --backend=nestjs  # 指定技术栈
 */

import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

import { detectTechStack, printTechStack } from './lib/tech-stack-detector.mjs';
import { ensureProjectAgents } from './lib/agent-generator.mjs';
import { createPeaksDirectory, createDataDirectories, configureProjectSettings, syncProjectTemplates } from './lib/directory-creator.mjs';
import { printAnimatedTitle, status } from './lib/terminal-ui.mjs';
import { createChangeId } from './lib/change-artifacts.mjs';
import { createWelcomeCard } from './lib/progress-communicator.mjs';
import { hasValidPlanningConfirmations } from './lib/planning-confirmations.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getSkillDir() {
  let dir = __dirname;
  for (let i = 0; i < 5; i++) {
    dir = join(dir, '..');
    if (existsSync(join(dir, 'SKILL.md')) && existsSync(join(dir, 'templates', 'agents'))) {
      return dir;
    }
  }
  return null;
}

/**
 * 解析命令行参数中的技术栈覆盖
 * @param {string[]} args - 命令行参数
 * @returns {object|null} 技术栈覆盖对象
 */
function parseTechStackOverride(args) {
  const override = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (key && value) {
        if (key === 'frontend') override.frontend = value;
        if (key === 'backend') override.backend = value;
        if (key === 'ui') override.ui = value;
        if (key === 'database') override.database = value;
        if (key === 'monorepo') override.isMonorepo = value === 'true';
      }
    }
  }
  return Object.keys(override).length > 0 ? override : null;
}

function parseChangeName(args) {
  for (const arg of args) {
    if (arg.startsWith('--change=')) {
      return arg.slice('--change='.length);
    }
  }
  return 'initial-product';
}

function isZeroToOneProject(projectPath) {
  const ignoredEntries = new Set(['.DS_Store', '.git', '.claude', '.gitnexus', '.peaks', 'openspec']);
  const entries = readdirSync(projectPath).filter(entry => !ignoredEntries.has(entry));
  return entries.length === 0;
}

function hasConfirmedPlanningArtifacts(projectPath) {
  return hasValidPlanningConfirmations(projectPath);
}

/**
 * 重新扫描 monorepo 子包的技术栈
 * @param {string} projectPath - 项目路径
 * @returns {object} 包含 monorepoPackages 和 packageDetails
 */
function scanMonorepoPackages(projectPath) {
  const result = {
    monorepoPackages: [],
    packageDetails: {}
  };

  const packagesDir = join(projectPath, 'packages');
  if (!existsSync(packagesDir)) return result;

  const entries = readdirSync(packagesDir);
  for (const pkgName of entries) {
    const pkgPath = join(packagesDir, pkgName);
    if (!statSync(pkgPath).isDirectory()) continue;

    const pkgJsonPath = join(pkgPath, 'package.json');
    if (!existsSync(pkgJsonPath)) continue;

    try {
      const subPkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
      const deps = { ...subPkg.dependencies, ...subPkg.devDependencies };

      result.monorepoPackages.push(pkgName);

      // 检测子包的前端框架
      let frontendFramework = null;
      if (deps.react) frontendFramework = 'react';
      else if (deps.vue) frontendFramework = 'vue';
      else if (deps.next) frontendFramework = 'next';

      // 检测子包的后端框架
      let backendFramework = null;
      if (deps['@nestjs/core']) backendFramework = 'nestjs';
      else if (deps.express) backendFramework = 'express';
      else if (deps.fastify) backendFramework = 'fastify';

      // 检测子包的 UI 库
      let uiFramework = null;
      if (deps.antd || deps['@ant-design/react']) uiFramework = 'antd';
      else if (deps['@mui/material']) uiFramework = 'mui';
      else if (deps['element-plus']) uiFramework = 'element-plus';
      else if (deps['@chakra-ui/react']) uiFramework = 'chakra';

      // 检测子包的数据库
      let dbFramework = null;
      if (deps.prisma) dbFramework = 'postgresql';
      else if (deps.mongoose) dbFramework = 'mongodb';
      else if (deps.typeorm) dbFramework = 'postgresql';

      let buildToolFramework = null;
      if (deps.vite) buildToolFramework = 'vite';
      else if (deps.next) buildToolFramework = 'next';

      let testFramework = null;
      if (deps.vitest) testFramework = 'vitest';
      else if (deps.jest) testFramework = 'jest';
      else if (deps['@playwright/test']) testFramework = 'playwright';

      result.packageDetails[pkgName] = {
        frontend: frontendFramework ? { framework: frontendFramework, version: deps[frontendFramework] } : { framework: null },
        backend: backendFramework ? { framework: backendFramework, version: deps[backendFramework === 'nestjs' ? '@nestjs/core' : backendFramework] } : { framework: null },
        ui: uiFramework ? { framework: uiFramework, version: deps[uiFramework === 'mui' ? '@mui/material' : uiFramework] } : { framework: null },
        database: dbFramework ? { framework: dbFramework, version: deps.prisma || deps.typeorm || deps.mongoose } : { framework: null },
        buildTool: buildToolFramework ? { framework: buildToolFramework, version: deps[buildToolFramework] } : { framework: null },
        test: testFramework ? { framework: testFramework, version: deps[testFramework === 'playwright' ? '@playwright/test' : testFramework] } : { framework: null }
      };
    } catch (e) {
      // 忽略解析失败的 package.json
    }
  }

  return result;
}

/**
 * Initialize OpenSpec directory structure
 * @param {string} projectPath - Project path
 * @param {string} skillDir - Skill directory
 */
async function initializeOpenSpec(projectPath, skillDir) {
  const openspecDir = join(projectPath, 'openspec');
  const hasOpenSpec = existsSync(openspecDir);

  console.log('\n\x1b[1m\x1b[36m📦\x1b[0m 初始化 OpenSpec:');
  console.log('\x1b[90m' + '─'.repeat(50) + '\x1b[0m');

  if (!hasOpenSpec) {
    console.log('  \x1b[90m运行 openspec init...\x1b[0m');
    try {
      const { spawn } = await import('child_process');
      const result = await new Promise((resolve) => {
        const proc = spawn('npx', ['-y', '@fission-ai/openspec@latest', 'init'], {
          stdio: ['inherit', 'pipe', 'pipe'],
          cwd: projectPath
        });
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (d) => { stdout += d.toString(); process.stdout.write(d); });
        proc.stderr.on('data', (d) => { stderr += d.toString(); process.stderr.write(d); });
        proc.on('close', (code) => resolve({ code, stdout, stderr }));
        proc.on('error', (e) => resolve({ code: -1, stdout: '', stderr: e.message }));
      });
      if (result.code === 0) {
        console.log('  \x1b[32m✓ OpenSpec 目录结构已创建\x1b[0m');
        console.log('  \x1b[90m  └─ specs/, changes/, .openspec/\x1b[0m');
      } else {
        console.log('  \x1b[33m⚠ OpenSpec 初始化失败，将使用默认目录结构\x1b[0m');
      }
    } catch (e) {
      console.log('  \x1b[33m⚠ OpenSpec 不可用，跳过\x1b[0m');
    }
  } else {
    console.log('  \x1b[36m➖ openspec/ 已存在\x1b[0m');
  }
}

async function main() {
  const startTime = performance.now();
  const projectPath = process.argv[2] || process.cwd();
  const skillDir = getSkillDir();

  console.log('\n\x1b[1m\x1b[36m╔══════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[36m║\x1b[0m  \x1b[1m\x1b[37mpeaks-sdd 项目初始化\x1b[0m\x1b[36m                   ║\x1b[0m');
  console.log('\x1b[1m\x1b[36m╚══════════════════════════════════════════════╝\x1b[0m');
  console.log(`\x1b[90m   扫描项目: ${projectPath}\x1b[0m`);

  // 解析命令行参数中的技术栈覆盖
  const args = process.argv.slice(3);
  const changeName = parseChangeName(args);
  const changeId = createChangeId(changeName);
  const techStackOverride = parseTechStackOverride(args);

  printAnimatedTitle('🔍 扫描项目');
  let techStack = detectTechStack(projectPath);

  // 如果有命令行参数传入的技术栈，使用传入的值覆盖检测结果
  if (techStackOverride) {
    console.log(`\x1b[90m   检测到技术栈覆盖参数\x1b[0m`);
    if (techStackOverride.frontend) techStack.frontend = techStackOverride.frontend;
    if (techStackOverride.backend) techStack.backend = techStackOverride.backend;
    if (techStackOverride.ui) techStack.ui = techStackOverride.ui;
    if (techStackOverride.database) techStack.database = techStackOverride.database;
    if (techStackOverride.isMonorepo !== undefined) {
      techStack.isMonorepo = techStackOverride.isMonorepo;
    }

    // 如果是 monorepo，重新扫描子包
    if (techStack.isMonorepo) {
      const monorepoInfo = scanMonorepoPackages(projectPath);
      techStack.monorepoPackages = monorepoInfo.monorepoPackages;
      techStack.packageDetails = monorepoInfo.packageDetails;
    }
  }

  techStack.isZeroToOneProject = isZeroToOneProject(projectPath);
  techStack.hasConfirmedPlanningArtifacts = hasConfirmedPlanningArtifacts(projectPath);

  printTechStack(techStack, projectPath);

  printAnimatedTitle('🧩 生成 Agents');
  if (skillDir) {
    const templatesDir = join(skillDir, 'templates', 'agents');

    const result = ensureProjectAgents({ projectPath, templatesDir, techStack });
    const action = result.bootstrapped ? '生成/补齐' : '已存在';
    console.log(`\n\x1b[90m   Agents ${action}: ${result.generatedAgents.length} 个\x1b[0m`);
  } else {
    console.log(`\n   ${status.warning('未找到 peaks-sdd skill 目录，跳过 Agent 生成')}`);
  }

  // Skills 延迟安装提示（初始化时不安装，避免 429）
  console.log(`\n   ${status.info('Skills 将在实际使用时按需安装')}`);

  printAnimatedTitle('📁 创建 .peaks 目录');
  createPeaksDirectory(projectPath, { changeId });

  printAnimatedTitle('📂 创建数据目录');
  createDataDirectories(projectPath);

  // Initialize OpenSpec directory structure
  await initializeOpenSpec(projectPath, skillDir);

  printAnimatedTitle('📋 同步模板资产');
  const syncedTemplates = syncProjectTemplates(projectPath, skillDir);
  console.log(`\n\x1b[90m   模板资产已补齐: ${syncedTemplates.copied.length} 个，保留已有: ${syncedTemplates.skipped.length} 个\x1b[0m`);

  printAnimatedTitle('🔌 配置 MCP 和 Hooks');
  configureProjectSettings(projectPath, techStack, skillDir);

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

  console.log('\n\x1b[1m\x1b[36m╔══════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[36m║\x1b[0m  \x1b[1m\x1b[32m✅ 初始化完成！\x1b[0m\x1b[36m                            ║\x1b[0m');
  console.log(`\x1b[1m\x1b[36m║\x1b[0m  \x1b[90m耗时: ${elapsed}s\x1b[0m\x1b[36m                            ║\x1b[0m`);
  console.log('\x1b[1m\x1b[36m╚══════════════════════════════════════════════╝\x1b[0m');

  // Show workflow phases
  console.log('\n' + createWelcomeCard({ projectPath, changeId }));
  console.log('\n\x1b[90m   接下来运行:\x1b[0m');
  console.log('\x1b[90m   • \x1b[37m/peaks-sdd 加个用户注册功能\x1b[0m  功能开发');
  console.log('\x1b[90m   • \x1b[37m/peaks-sdd 登录按钮点击没反应\x1b[0m  Bug 修复');
  console.log('\x1b[90m   • \x1b[37m/peaks-sdd 初始化\x1b[0m     重新初始化项目');
  console.log('');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
