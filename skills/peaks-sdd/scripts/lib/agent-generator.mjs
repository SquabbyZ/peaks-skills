#!/usr/bin/env node
/**
 * peaks-sdd Agent 生成模块
 * 根据技术栈动态生成 Agent 配置文件
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { status, agentBadge } from './terminal-ui.mjs';

/**
 * 根据技术栈过滤 skills
 * @param {Array} skills - skills 列表
 * @param {object} techStack - 技术栈信息
 * @returns {Array} 过滤后的 skills
 */
export function filterSkills(skills, techStack) {
  const excludeSkills = new Set();

  if (techStack.frontend === 'react' || techStack.frontend === 'next') {
    excludeSkills.add('vue-best-practices');
    excludeSkills.add('vue');
    excludeSkills.add('vue-debug-guides');
  }

  if (techStack.frontend === 'vue') {
    excludeSkills.add('react:components');
    excludeSkills.add('vercel-react-best-practices');
    excludeSkills.add('vercel-react-native-skills');
    excludeSkills.add('vercel-react-view-transitions');
  }

  if (techStack.backend !== 'nestjs' && techStack.backend) {
    excludeSkills.add('nestjs-patterns');
  }

  return skills.filter(skill => !excludeSkills.has(skill));
}

/**
 * 构建技术栈描述
 * @param {object} techStack - 技术栈信息
 * @returns {string} 技术栈描述
 */
export function buildTechStackDesc(techStack) {
  const parts = [];
  if (techStack.frontend) parts.push(techStack.frontend.toUpperCase());
  if (techStack.backend) parts.push(techStack.backend.toUpperCase());
  if (techStack.ui) parts.push(techStack.ui.toUpperCase());
  if (techStack.database) parts.push(techStack.database.toUpperCase());
  if (techStack.hasTauri) parts.push('TAURI');
  return parts.join(' + ') || 'Unknown';
}

function hasFrontendStack(techStack) {
  if (techStack.frontend || techStack.frontendFramework) return true;

  if (techStack.isMonorepo && techStack.packageDetails) {
    return Object.values(techStack.packageDetails).some(detail => detail.frontend?.framework || detail.frontend);
  }

  return false;
}

function hasBackendStack(techStack) {
  if (techStack.backend || techStack.backendFramework) return true;

  if (techStack.isMonorepo && techStack.packageDetails) {
    return Object.values(techStack.packageDetails).some(detail => detail.backend?.framework || detail.backend);
  }

  return false;
}

/**
 * 提取 skills 部分的开始位置
 * @param {string} content - 文件内容
 * @returns {object} { start, end }
 */
export function findSkillsSection(content) {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let skillsStart = -1;
  let skillsEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '---' && !inFrontmatter) {
      inFrontmatter = true;
      continue;
    }

    if (trimmed === '---' && inFrontmatter) {
      inFrontmatter = false;
      continue;
    }

    if (!inFrontmatter) continue;

    if (trimmed === 'skills:' || trimmed.startsWith('skills:')) {
      skillsStart = i;
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        const nextTrimmed = nextLine.trim();

        if (!nextTrimmed) continue;

        if (nextTrimmed.match(/^\w+:\s*$/)) {
          skillsEnd = j;
          break;
        }

        if (nextLine.match(/^[a-z]/) && !nextTrimmed.startsWith('-')) {
          skillsEnd = j;
          break;
        }

        if (nextTrimmed === 'memory:') {
          skillsEnd = j;
          break;
        }
      }
      break;
    }
  }

  return { start: skillsStart, end: skillsEnd };
}

/**
 * 生成 Agent 文件
 * @param {string} agentName - agent 名称
 * @param {object} techStack - 技术栈信息
 * @param {string} templatePath - 模板路径
 * @param {string} destPath - 目标路径
 * @returns {boolean} 是否成功
 */
export function generateAgentFile(agentName, techStack, templatePath, destPath) {
  if (!existsSync(templatePath)) {
    console.log(`  \x1b[33m⚠️  模板不存在: ${agentName}.md\x1b[0m`);
    return false;
  }

  let content = readFileSync(templatePath, 'utf-8');

  // 提取 frontmatter 和 body（兼容 Windows 和 Unix 换行）
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    console.log(`  \x1b[33m⚠️  模板格式错误: ${agentName}.md\x1b[0m`);
    return false;
  }

  let frontmatter = match[1];
  let body = match[2];

  // 标准化换行符（兼容 Windows 和 Unix）
  frontmatter = frontmatter.replace(/\r\n/g, '\n');
  body = body.replace(/\r\n/g, '\n');

  // 定义模板变量映射
  const variables = {
    '{{PROJECT_NAME}}': techStack.projectName || 'unknown-project',
    '{{PROJECT_PATH}}': techStack.projectPath || process.cwd(),
    '{{TECH_STACK}}': buildTechStackDesc(techStack),
    '{{FRONTEND_FRAMEWORK}}': techStack.frontend || 'react',
    '{{BACKEND_FRAMEWORK}}': techStack.backend || 'nestjs',
    '{{UI_LIBRARY}}': techStack.ui || 'antd',
    '{{TEST_FRAMEWORK}}': techStack.test || 'playwright',
    '{{DEV_PORT}}': String(techStack.devPort || 3000),
    '{{HAS_TAURI}}': String(techStack.hasTauri || false),
    '{{HAS_DATABASE}}': techStack.database || 'none'
  };

  // 替换 frontmatter 中的变量
  for (const [key, value] of Object.entries(variables)) {
    frontmatter = frontmatter.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  // 替换 body 中的变量
  for (const [key, value] of Object.entries(variables)) {
    body = body.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  // 提取当前 skills 并过滤
  const skillsMatch = frontmatter.match(/^skills:$\n([\s\S]*?)^memory:/m);
  if (skillsMatch) {
    const currentSkills = skillsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(2).trim());

    const filteredSkills = filterSkills(currentSkills, techStack);

    // 替换 skills 部分
    frontmatter = frontmatter.replace(/^skills:$\n[\s\S]*?^memory:/m, (match) => {
      const skillsLines = filteredSkills.map(s => `  - ${s}`).join('\n');
      return `skills:\n${skillsLines}\nmemory:`;
    });
  }

  // 根据技术栈动态调整 tools
  frontmatter = adjustToolsByTechStack(frontmatter, techStack, agentName);

  // 根据技术栈动态调整 body 内容
  body = adjustBodyByTechStack(body, techStack, agentName);

  // 添加项目实际依赖信息（仅针对 frontend 和 backend agent）
  if (agentName === 'frontend' || agentName === 'backend') {
    const projectDeps = generateProjectDepsSection(techStack);
    body = body + '\n\n' + projectDeps;
  }

  // 组合最终内容
  content = `---\n${frontmatter}\n---\n${body}`;

  writeFileSync(destPath, content, 'utf-8');
  return true;
}

/**
 * 根据技术栈动态调整 tools
 * @param {string} frontmatter - frontmatter 内容
 * @param {object} techStack - 技术栈信息
 * @param {string} agentName - agent 名称
 * @returns {string} 调整后的 frontmatter
 */
function adjustToolsByTechStack(frontmatter, techStack, agentName) {
  // 如果没有前端框架，移除前端相关的 MCP 工具
  if (!techStack.frontend) {
    frontmatter = frontmatter.replace(/  - mcp__playwright__[^\n]+\n/g, '');
    frontmatter = frontmatter.replace(/  - mcp__frontend-design__[^\n]+\n/g, '');
    frontmatter = frontmatter.replace(/  - mcp__typescript-lsp__[^\n]+\n/g, '');
  }

  // 如果没有数据库，移除数据库相关的工具
  if (!techStack.database) {
    frontmatter = frontmatter.replace(/  - mcp__postgres__[^\n]+\n/g, '');
  }

  // 移除 Tauri 相关工具（如果不需要）
  if (!techStack.hasTauri) {
    frontmatter = frontmatter.replace(/  - mcp__tauri__[^\n]+\n/g, '');
  }

  return frontmatter;
}

/**
 * 根据技术栈动态调整 body 内容
 * @param {string} body - body 内容
 * @param {object} techStack - 技术栈信息
 * @param {string} agentName - agent 名称
 * @returns {string} 调整后的 body
 */
function adjustBodyByTechStack(body, techStack, agentName) {
  // 如果是 React/Next 项目，移除 Vue 相关内容
  if (techStack.frontend === 'react' || techStack.frontend === 'next') {
    body = body.replace(/### Vue2[\s\S]*?(?=### |\n## )/g, '');
    body = body.replace(/### Vue3[\s\S]*?(?=### |\n## )/g, '');
  }

  // 如果是 Vue 项目，移除 React 相关内容
  if (techStack.frontend === 'vue') {
    body = body.replace(/### React[\s\S]*?(?=### |\n## )/g, '');
  }

  // 如果没有后端，移除后端相关内容
  if (!techStack.backend) {
    body = body.replace(/### NestJS[\s\S]*?(?=### |\n## )/g, '');
    body = body.replace(/### Express[\s\S]*?(?=### |\n## )/g, '');
    body = body.replace(/### Fastify[\s\S]*?(?=### |\n## )/g, '');
  }

  // 如果没有数据库，移除数据库相关内容
  if (!techStack.database) {
    body = body.replace(/### 数据库[\s\S]*?(?=### |\n## )/g, '');
    body = body.replace(/### ORM[\s\S]*?(?=### |\n## )/g, '');
  }

  // 如果没有 Tauri，移除 Tauri 相关内容
  if (!techStack.hasTauri) {
    body = body.replace(/### Tauri[\s\S]*?(?=### |\n## )/g, '');
  }

  return body;
}

/**
 * 生成项目实际依赖信息部分
 * @param {object} techStack - 技术栈信息
 * @returns {string} 依赖信息 markdown
 */
function generateProjectDepsSection(techStack) {
  const deps = techStack.packages || {};

  // 提取关键依赖
  const keyDeps = {
    // 框架
    'react': deps.react,
    'umi': deps.umi,
    'vue': deps.vue,
    'next': deps.next,
    // UI 库
    'antd': deps.antd,
    'antd-style': deps['antd-style'],
    '@mui/material': deps['@mui/material'],
    '@chakra-ui/react': deps['@chakra-ui/react'],
    // 状态管理
    'zustand': deps.zustand,
    '@reduxjs/toolkit': deps['@reduxjs/toolkit'],
    '@tanstack/react-query': deps['@tanstack/react-query'],
    'ahooks': deps.ahooks,
    'swr': deps.swr,
    // 表单
    'react-hook-form': deps['react-hook-form'],
    '@hookform/resolvers': deps['@hookform/resolvers'],
    'formik': deps.formik,
    // 样式
    'tailwindcss': deps.tailwindcss,
    'styled-components': deps['styled-components'],
    // 路由
    'react-router-dom': deps['react-router-dom'],
    '@umijs/router': deps['@umijs/router'],
    // 工具库
    'lodash': deps.lodash,
    'dayjs': deps.dayjs,
    'axios': deps.axios,
  };

  // 过滤出实际存在的依赖
  const actualDeps = Object.entries(keyDeps)
    .filter(([_, version]) => version)
    .map(([name, version]) => `  - ${name}: ${version}`)
    .join('\n');

  if (!actualDeps) {
    return '';
  }

  return `## 项目实际依赖

本项目检测到的实际依赖：

${actualDeps}

> 此列表由初始化脚本自动生成，基于 package.json 的 dependencies 和 devDependencies。
> 开发时请优先使用项目已有的依赖库。`;
}

/**
 * 从模板中提取 description
 * @param {string} templatePath - 模板路径
 * @returns {string} 描述信息
 */
function getAgentDescription(templatePath) {
  try {
    const content = readFileSync(templatePath, 'utf-8');
    const match = content.match(/^description:\s*\|\s*\n([^\n]+)/m);
    if (match) {
      return match[1].trim();
    }
    // 尝试另一种格式
    const descMatch = content.match(/description:\s*["']([^"']+)["']/m);
    if (descMatch) {
      return descMatch[1].trim();
    }
  } catch (e) {}
  return 'Agent 配置文件';
}

/**
 * 从模板中提取 when_to_use（简短角色描述）
 * @param {string} templatePath - 模板路径
 * @returns {string} 角色描述
 */
function getAgentRole(templatePath) {
  try {
    const content = readFileSync(templatePath, 'utf-8');
    const match = content.match(/^when_to_use:\s*\|\s*\n([^\n]+)/m);
    if (match) {
      return match[1].trim();
    }
  } catch (e) {}
  return '';
}

/**
 * 从模板中提取 color
 * @param {string} templatePath - 模板路径
 * @returns {string|null} 颜色名称
 */
function getAgentColor(templatePath) {
  try {
    const content = readFileSync(templatePath, 'utf-8');
    const match = content.match(/^color:\s*(\w+)/m);
    if (match) return match[1].trim();
  } catch (e) {}
  return null;
}

/**
 * 颜色名称到 ANSI 256 色码的映射
 * @param {string} colorName - 颜色名称
 * @returns {number} ANSI 色码
 */
function getColorAnsi(colorName) {
  const map = {
    violet: 135,   // 紫色
    red: 196,      // 红色
    blue: 33,      // 蓝色
    pink: 213,     // 粉色
    cyan: 51,      // 青色
    green: 46,     // 绿色
    orange: 208,   // 橙色
    indigo: 99,    // 靛蓝
    teal: 37,      // 蓝绿
    emerald: 35,   // 翠绿
    amber: 214,    // 琥珀
    purple: 141,   // 紫色
    slate: 245,    // 灰色
    yellow: 226,   // 黄色
  };
  return map[colorName] || 245;
}

/**
 * 生成 QA 子 Agent 配置
 * @param {object} techStack - 技术栈信息
 * @param {string} templatesDir - 模板目录
 * @param {string} agentsDir - agent 输出目录
 * @returns {Array} 生成的 agent 列表
 */
function generateQaSubAgents(techStack, templatesDir, agentsDir) {
  const qaAgents = ['qa', 'qa-child'];
  const generated = [];
  const qaTemplateDir = join(templatesDir, 'qa');

  for (const agent of qaAgents) {
    const templatePath = join(qaTemplateDir, `${agent}.md`);
    const destPath = join(agentsDir, `${agent}.md`);

    if (existsSync(templatePath)) {
      const success = generateAgentFile(agent, techStack, templatePath, destPath);
      if (success) {
        const qaRole = getAgentRole(templatePath);
        const qaRoleTag = qaRole ? ` \x1b[33m${qaRole}\x1b[0m` : ' \x1b[90mQA Agent\x1b[0m';
        console.log(`  ${agentBadge(`${agent}.md`, getAgentColor(templatePath))}${qaRoleTag}`);
        generated.push(agent);
      }
    } else {
      console.log(`  ${status.warning(`QA 模板不存在: ${agent}.md`)}`);
    }
  }

  return generated;
}

/**
 * 扫描项目模块结构
 * @param {object} techStack - 技术栈信息
 * @param {string} projectPath - 项目路径
 * @returns {object} 模块扫描结果
 */
export function scanProjectModules(techStack, projectPath) {
  const modules = [];
  const sharedFiles = [];
  const packages = [];

  // 检测 packages/ 目录（多包项目）
  const packagesDir = join(projectPath, 'packages');
  if (existsSync(packagesDir)) {
    const entries = readdirSync(packagesDir);
    for (const entry of entries) {
      const pkgPath = join(packagesDir, entry);
      if (statSync(pkgPath).isDirectory()) {
        packages.push({
          name: entry,
          path: pkgPath,
          modules: scanModulesInPath(pkgPath, techStack, entry)
        });
      }
    }
  }

  const srcModules = scanModulesInPath(projectPath, techStack, '');
  if (srcModules.length > 0) {
    modules.push(...srcModules);
  }

  return {
    projectType: packages.length > 0 ? 'multi-package' : 'single-package',
    projectPath,
    packages,
    modules,
    sharedFiles
  };
}

/**
 * 扫描指定路径下的模块
 * @param {string} basePath - 基础路径
 * @param {object} techStack - 技术栈信息
 * @param {string} pkgName - 包名称（用于判断是否 Tauri）
 * @returns {Array} 模块列表
 */
function scanModulesInPath(basePath, techStack, pkgName = '') {
  const modules = [];

  // Tauri 不拆分，整个作为一个模块
  if (pkgName === 'client' && techStack.hasTauri) {
    modules.push({
      name: 'main',
      path: basePath,
      type: 'tauri'
    });
    return modules;
  }

  const isFrontend = techStack.frontend || techStack.frontendFramework;
  const isBackend = techStack.backend || (pkgName === 'server');

  if (isFrontend) {
    const possiblePaths = [
      { path: join(basePath, 'src', 'app'), type: 'app-router' },
      { path: join(basePath, 'app'), type: 'app-router' },
      { path: join(basePath, 'src', 'pages'), type: 'pages' },
      { path: join(basePath, 'pages'), type: 'pages' },
      { path: join(basePath, 'src', 'features'), type: 'features' }
    ];

    scanModuleDirectories(possiblePaths, modules, techStack);
  }

  // 后端：以 src 下的目录为模块
  if (isBackend) {
    const srcDir = join(basePath, 'src');
    if (existsSync(srcDir)) {
      const entries = readdirSync(srcDir);
      for (const entry of entries) {
        const entryPath = join(srcDir, entry);
        if (statSync(entryPath).isDirectory()) {
          modules.push({
            name: entry,
            path: entryPath,
            type: 'backend-module',
            techStack: detectModuleTechStack(entryPath, techStack)
          });
        }
      }
    }
  }

  return modules;
}

function scanModuleDirectories(possiblePaths, modules, techStack) {
  const seen = new Set(modules.map(module => module.path));

  for (const { path, type } of possiblePaths) {
    if (!existsSync(path)) continue;

    const entries = readdirSync(path);
    for (const entry of entries) {
      if (entry.startsWith('_') || entry.startsWith('(')) continue;

      const entryPath = join(path, entry);
      if (!statSync(entryPath).isDirectory() || seen.has(entryPath)) continue;

      seen.add(entryPath);
      modules.push({
        name: entry,
        path: entryPath,
        type,
        techStack: detectModuleTechStack(entryPath, techStack)
      });
    }
  }
}

/**
 * 检测模块的技术栈
 * @param {string} modulePath - 模块路径
 * @param {object} projectTechStack - 项目技术栈
 * @returns {object} 模块技术栈
 */
function detectModuleTechStack(modulePath, projectTechStack) {
  // 检测模块特定的技术栈（可能与项目整体不同）
  const pkgJsonPath = join(modulePath, 'package.json');
  if (existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    return {
      frontend: deps.react ? 'react' : (deps.vue ? 'vue' : projectTechStack.frontend),
      backend: deps['@nestjs/core'] ? 'nestjs' : projectTechStack.backend,
      ui: projectTechStack.ui
    };
  }

  return {
    frontend: projectTechStack.frontend,
    backend: projectTechStack.backend,
    ui: projectTechStack.ui
  };
}

/**
 * 生成调度 Agent 配置
 * @param {object} techStack - 技术栈信息
 * @param {object} scanResult - 模块扫描结果
 * @param {string} templatesDir - 模板目录
 * @param {string} agentsDir - agent 输出目录
 * @returns {boolean} 是否成功
 */
export function generateDispatcherConfig(techStack, scanResult, templatesDir, agentsDir) {
  const dispatcherTemplatePath = join(templatesDir, 'dispatcher.md');
  if (!existsSync(dispatcherTemplatePath)) {
    console.log(`  \x1b[33m⚠️  调度 Agent 模板不存在\x1b[0m`);
    return false;
  }

  let content = readFileSync(dispatcherTemplatePath, 'utf-8');

  // 提取 frontmatter 和 body（兼容 Windows 和 Unix 换行）
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    console.log(`  \x1b[33m⚠️  调度 Agent 模板格式错误\x1b[0m`);
    return false;
  }

  let frontmatter = match[1];
  let body = match[2];

  // 标准化换行符（兼容 Windows 和 Unix）
  frontmatter = frontmatter.replace(/\r\n/g, '\n');
  body = body.replace(/\r\n/g, '\n');

  // 注入项目结构信息
  const projectInfo = {
    '{{PROJECT_NAME}}': techStack.projectName || 'unknown-project',
    '{{PROJECT_PATH}}': techStack.projectPath || process.cwd(),
    '{{PROJECT_TYPE}}': scanResult.projectType,
    '{{PACKAGE_COUNT}}': String(scanResult.packages.length),
    '{{MODULE_COUNT}}': String(scanResult.modules.length),
    '{{TECH_STACK}}': buildTechStackDesc(techStack)
  };

  // 替换变量
  for (const [key, value] of Object.entries(projectInfo)) {
    frontmatter = frontmatter.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    body = body.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  // 根据项目类型调整 body
  if (scanResult.projectType === 'single-package') {
    body = body.replace(/\$2\$ 多包项目配置[\s\S]*?\$2\$ 单包项目简化版/, '$2$ 单包项目简化配置');
  }

  // 生成模块注册表
  const moduleRegistry = generateModuleRegistry(scanResult);
  body = body.replace('{{MODULE_REGISTRY}}', moduleRegistry);

  const destPath = join(agentsDir, 'dispatcher.md');
  writeFileSync(destPath, `---\n${frontmatter}\n---\n${body}`, 'utf-8');
  const dispatcherColor = getAgentColor(dispatcherTemplatePath);
  const dispatcherRole = getAgentRole(dispatcherTemplatePath);
  const dispatcherRoleTag = dispatcherRole ? ` \x1b[33m${dispatcherRole}\x1b[0m` : ' \x1b[90m调度 Agent\x1b[0m';
  console.log(`  ${agentBadge('dispatcher.md', dispatcherColor)}${dispatcherRoleTag}`);
  return true;
}

/**
 * 生成模块注册表
 * @param {object} scanResult - 扫描结果
 * @returns {string} 模块注册表 markdown
 */
function generateModuleRegistry(scanResult) {
  let registry = '## 模块注册表\n\n';
  registry += `项目类型: **${scanResult.projectType}**\n\n`;

  if (scanResult.packages.length > 0) {
    registry += '### 包列表\n\n';
    for (const pkg of scanResult.packages) {
      registry += `- **${pkg.name}**: ${pkg.modules.length} 个模块\n`;
    }
  }

  if (scanResult.modules.length > 0) {
    registry += '\n### 模块列表\n\n';
    for (const mod of scanResult.modules) {
      registry += `- **${mod.name}** (${mod.type}): ${mod.path}\n`;
    }
  }

  registry += '\n### 调度规则\n\n';
  registry += '- 独立模块并行执行\n';
  registry += '- 有依赖模块串行执行\n';
  registry += '- 共享文件修改需通过交接协议\n';

  return registry;
}

/**
 * 生成子 Agent 配置
 * @param {object} techStack - 技术栈信息
 * @param {object} scanResult - 模块扫描结果
 * @param {string} templatesDir - 模板目录
 * @param {string} agentsDir - agent 输出目录
 * @returns {Array} 生成的 agent 列表
 */
export function generateSubAgentConfigs(techStack, scanResult, templatesDir, agentsDir) {
  const childTemplates = [
    { name: 'frontend-child', templatePath: join(templatesDir, 'sub-front', 'frontend-child.md'), enabled: hasFrontendStack(techStack) },
    { name: 'backend-child', templatePath: join(templatesDir, 'sub-back', 'backend-child.md'), enabled: hasBackendStack(techStack) }
  ];

  const generated = [];

  for (const child of childTemplates) {
    if (!child.enabled) continue;

    if (!existsSync(child.templatePath)) {
      console.log(`  ${status.warning(`子 Agent 模板不存在: ${child.name}.md`)}`);
      continue;
    }

    const destPath = join(agentsDir, `${child.name}.md`);
    const success = generateAgentFile(child.name, techStack, child.templatePath, destPath);
    if (success) {
      const role = getAgentRole(child.templatePath);
      const roleTag = role ? ` \x1b[33m${role}\x1b[0m` : ' \x1b[90m子 Agent\x1b[0m';
      console.log(`  ${agentBadge(`${child.name}.md`, getAgentColor(child.templatePath))}${roleTag}`);
      generated.push(child.name);
    }
  }

  return generated;
}

/**
 * 生成单个子 Agent 文件
 * @param {string} agentName - agent 名称
 * @param {object} techStack - 技术栈信息
 * @param {object} module - 模块信息
 * @param {string} templatePath - 模板路径
 * @param {string} destDir - 目标目录
 * @returns {boolean} 是否成功
 */
function generateSubAgentFile(agentName, techStack, module, templatePath, destDir) {
  let content = readFileSync(templatePath, 'utf-8');

  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return false;

  let frontmatter = match[1];
  let body = match[2];

  const variables = {
    '{{MODULE_NAME}}': module.name,
    '{{MODULE_PATH}}': module.path,
    '{{MODULE_TYPE}}': module.type,
    '{{TECH_STACK}}': buildTechStackDesc(techStack),
    '{{AGENT_NAME}}': agentName
  };

  for (const [key, value] of Object.entries(variables)) {
    frontmatter = frontmatter.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    body = body.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  const destPath = join(destDir, `${agentName}.md`);
  writeFileSync(destPath, `---\n${frontmatter}\n---\n${body}`, 'utf-8');
  console.log(`  ${status.success(`${agentName}.md`)} \x1b[90m- ${module.type}\x1b[0m`);
  return true;
}

/**
 * 生成 Agent 配置
 * @param {object} techStack - 技术栈信息
 * @param {string} templatesDir - 模板目录
 * @param {string} agentsDir - agent 输出目录
 * @param {string} projectPath - 项目路径
 * @returns {Array} 生成的 agent 列表
 */
// 初始化时保留的 agents（不覆盖，允许知识积累）
const PRESERVED_AGENTS = ['product', 'design'];

export function generateAgentConfigs(techStack, templatesDir, agentsDir, projectPath) {
  const agents = [];

  const baseAgents = [
    'peaksfeat', 'peaksbug', 'product', 'qa', 'devops', 'security-reviewer',
    'code-reviewer-frontend', 'code-reviewer-backend', 'triage'
  ];

  const stackAgents = [];
  if (hasFrontendStack(techStack)) {
    stackAgents.push('sub-front/frontend', 'design');
  }
  if (hasBackendStack(techStack)) stackAgents.push('sub-back/backend');
  if (techStack.hasTauri) stackAgents.push('tauri');
  if (techStack.database) stackAgents.push('postgres');

  const allAgents = [...new Set([...baseAgents, ...stackAgents])];

  for (const agent of allAgents) {
    // QA agent 需要特殊处理，生成其子 agents
    if (agent === 'qa') {
      console.log(`\n\x1b[1m\x1b[36m🧪\x1b[0m \x1b[1mQA 测试 Agents\x1b[0m`);
      console.log('\x1b[90m' + '─'.repeat(50) + '\x1b[0m');
      const qaSubAgents = generateQaSubAgents(techStack, templatesDir, agentsDir);
      console.log(`\n\x1b[90m   共生成 ${qaSubAgents.length} 个 QA Agent\x1b[0m`);
      agents.push(...qaSubAgents);
      continue;
    }

    // product 和 design 保留已有配置（用于知识积累）
    if (PRESERVED_AGENTS.includes(agent)) {
      const destPath = join(agentsDir, `${agent}.md`);
      if (existsSync(destPath)) {
        console.log(`  ${status.info(`保留已有 ${agent}.md（知识积累）`)}`);
        agents.push(agent);
        continue;
      }
      // 如果不存在，则生成
    }

    const templatePath = join(templatesDir, `${agent}.md`);
    const outputAgentName = agent.includes('/') ? agent.split('/').at(-1) : agent;
    const destPath = join(agentsDir, `${outputAgentName}.md`);

    if (existsSync(templatePath)) {
      const success = generateAgentFile(outputAgentName, techStack, templatePath, destPath);
      if (success) {
        const desc = getAgentDescription(templatePath);
        const role = getAgentRole(templatePath);
        const color = getAgentColor(templatePath);
        const badge = agentBadge(`${outputAgentName}.md`, color);
        const roleTag = role ? ` \x1b[33m${role}\x1b[0m` : '';
        console.log(`  ${badge}${roleTag}`);
        agents.push(outputAgentName);
      }
    } else {
      console.log(`  ${status.warning(`模板不存在: ${agent}.md`)}`);
    }
  }

  // 生成调度 Agent 和子 Agent 配置
  console.log(`\n\x1b[1m\x1b[36m🚀\x1b[0m \x1b[1m调度 Agent 配置\x1b[0m`);
  console.log('\x1b[90m' + '─'.repeat(50) + '\x1b[0m');

  const scanResult = scanProjectModules(techStack, projectPath);
  const dispatcherSuccess = generateDispatcherConfig(techStack, scanResult, templatesDir, agentsDir);
  if (dispatcherSuccess) {
    agents.push('dispatcher');
  }

  const subAgents = generateSubAgentConfigs(techStack, scanResult, templatesDir, agentsDir);
  agents.push(...subAgents);

  console.log(`\n\x1b[90m   共生成 ${subAgents.length} 个子 Agent\x1b[0m`);

  return agents;
}
