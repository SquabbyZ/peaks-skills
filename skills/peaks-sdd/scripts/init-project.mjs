#!/usr/bin/env node
/**
 * peaks-sdd 项目初始化脚本
 * 自动扫描项目技术栈并生成配置
 */

import { readFileSync, existsSync, mkdirSync, cpSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 获取 peaks-sdd skill 目录
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

// 检测技术栈
function detectTechStack(projectPath) {
  const packageJsonPath = join(projectPath, 'package.json');
  const techStack = {
    frontend: null,
    backend: null,
    ui: null,
    database: null,
    test: null,
    hasTauri: false,
    devPort: 3000,
    projectName: '',
    monorepo: false,
    packages: []
  };

  if (existsSync(packageJsonPath)) {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    techStack.projectName = pkg.name || 'unknown-project';

    // 前端框架检测
    if (deps.react) techStack.frontend = 'react';
    else if (deps.vue) techStack.frontend = 'vue';
    else if (deps.next) techStack.frontend = 'next';

    // 后端框架检测
    if (deps['@nestjs/core']) techStack.backend = 'nestjs';
    else if (deps.express) techStack.backend = 'express';
    else if (deps.fastify) techStack.backend = 'fastify';

    // UI库检测
    if (deps.antd) techStack.ui = 'antd';
    else if (deps['@mui/material']) techStack.ui = 'mui';
    else if (deps['@chakra-ui/react']) techStack.ui = 'chakra';
    else if (deps['@radix-ui/react-dialog']) techStack.ui = 'radix';
    else if (deps['@radix-ui/react-accordion']) techStack.ui = 'radix';
    else if (deps.cva) techStack.ui = 'radix'; // Radix with class-variance-authority

    // 数据库检测
    if (deps.typeorm || deps.prisma || deps.drizzle) techStack.database = 'postgresql';
    else if (deps.mongoose) techStack.database = 'mongodb';

    // 测试框架检测
    if (deps['@playwright/test']) techStack.test = 'playwright';
    else if (deps.vitest) techStack.test = 'vitest';
    else if (deps.jest) techStack.test = 'jest';

    // Tauri检测
    if (existsSync(join(projectPath, 'src-tauri')) ||
        existsSync(join(projectPath, 'tauri.conf.json'))) {
      techStack.hasTauri = true;
    }

    // Monorepo检测
    if (existsSync(join(projectPath, 'pnpm-workspace.yaml')) ||
        existsSync(join(projectPath, 'lerna.json')) ||
        existsSync(join(projectPath, 'turbo.json'))) {
      techStack.monorepo = true;
    }

    // 开发端口
    if (pkg.devDependencies?.vite) techStack.devPort = 5173;
    else if (pkg.devDependencies?.webpack) techStack.devPort = 8080;
  }

  return techStack;
}

// 动态生成 Agent frontmatter
function generateAgentFrontmatter(agentName, techStack, templateContent) {
  const vars = {
    // Frontmatter 基本配置（保持模板原有值）
    name: agentName,

    // when_to_use 根据技术栈动态生成
    when_to_use: getWhenToUse(agentName, techStack),

    // model 根据 agent 类型动态分配
    model: getModel(agentName),

    // tools 根据 agent 类型和技术栈动态生成
    tools: getTools(agentName, techStack),

    // skills 根据技术栈动态生成
    skills: getSkills(agentName, techStack),

    // memory 固定为 project
    memory: 'project',

    // maxTurns 根据 agent 类型设置
    maxTurns: getMaxTurns(agentName),

    // hooks 根据技术栈动态生成
    hooks: getHooks(agentName, techStack)
  };

  return vars;
}

function getWhenToUse(agentName, techStack) {
  const triggerWords = {
    frontend: ['前端', '页面', '组件', '样式', '交互', 'UI实现', 'React', 'Vue', 'Next.js', '浏览器测试'].join('、'),
    backend: ['后端', 'API', '接口', '数据库', 'NestJS', 'Express', 'Fastify'].join('、'),
    qa: ['测试', '验证', 'QA', '自动化测试', 'E2E', '测试用例', 'Playwright'].join('、'),
    product: ['需求', 'PRD', '产品', '功能', '用户故事', 'PRD'].join('、'),
    devops: ['部署', 'Docker', 'CI/CD', '运维', '环境', '配置'].join('、'),
    securityreviewer: ['安全', '漏洞', 'OWASP', 'XSS', '注入', '安全审查'].join('、'),
    peaksbug: ['bug', '报错', '修复', '问题', '错误', '没反应'].join('、'),
    peaksfeat: ['功能', '开发', '添加', '实现', '新功能'].join('、')
  };

  // 通用触发词
  const common = ['前端开发', 'UI开发', '组件开发'];

  // 技术栈特定触发词
  const stackSpecific = [];
  if (techStack.frontend === 'react') stackSpecific.push('React开发');
  if (techStack.frontend === 'vue') stackSpecific.push('Vue开发');
  if (techStack.frontend === 'next') stackSpecific.push('Next.js开发');
  if (techStack.ui === 'antd') stackSpecific.push('Ant Design');
  if (techStack.ui === 'mui') stackSpecific.push('Material UI');
  if (techStack.backend === 'nestjs') stackSpecific.push('NestJS后端');
  if (techStack.backend === 'express') stackSpecific.push('Express API');

  const words = [...new Set([...(triggerWords[agentName] || '').split('、'), ...common, ...stackSpecific])];
  return words.filter(Boolean).join('、');
}

function getModel(agentName) {
  // 根据 agent 类型分配模型
  const models = {
    frontend: 'sonnet',
    backend: 'sonnet',
    qa: 'sonnet',
    product: 'sonnet',
    devops: 'haiku',
    securityreviewer: 'sonnet',
    codeReviewerFrontend: 'sonnet',
    codeReviewerBackend: 'sonnet',
    peaksbug: 'sonnet',
    peaksfeat: 'sonnet',
    tauri: 'sonnet',
    postgres: 'sonnet',
    triage: 'haiku'
  };
  return models[agentName] || 'sonnet';
}

function getTools(agentName, techStack) {
  // 基础工具（所有 agent 都需要）
  const baseTools = ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'Agent'];

  // E2E 测试工具
  const testTools = techStack.test === 'playwright'
    ? ['mcp__playwright__navigate', 'mcp__playwright__click', 'mcp__playwright__fill', 'mcp__playwright__screenshot']
    : [];

  // 浏览器工具
  const browserTools = ['mcp__chrome-devtools__navigate', 'mcp__chrome-devtools__click', 'mcp__chrome-devtools__fill', 'mcp__chrome-devtools__screenshot'];

  // 前端 agent 额外工具
  if (agentName === 'frontend') {
    return [...baseTools, ...testTools, ...browserTools];
  }

  // QA agent 额外工具
  if (agentName === 'qa') {
    return [...baseTools, ...testTools, 'mcp__browser-use__navigate'];
  }

  // 默认返回基础工具
  return baseTools;
}

function getSkills(agentName, techStack) {
  // 基础 skills（所有 agent 都需要）
  const baseSkills = ['improve-codebase-architecture', 'find-skills'];

  // 前端 skills
  const frontendSkills = ['systematic-debugging', 'test-driven-development', 'code-review', 'browser', 'browser-use'];

  // 框架特定 skills
  const frameworkSkills = [];
  if (techStack.frontend === 'react' || techStack.frontend === 'next') {
    frameworkSkills.push('vercel-react-best-practices', 'react:components');
  }
  if (techStack.frontend === 'vue') {
    frameworkSkills.push('vue-best-practices', 'vue', 'vue-debug-guides');
  }

  // UI 库特定 skills
  const uiSkills = [];
  if (techStack.ui === 'shadcn') {
    uiSkills.push('shadcn');
  }

  // 后端 skills
  const backendSkills = ['systematic-debugging', 'test-driven-development', 'code-review'];

  // 数据库 skills
  if (techStack.database === 'postgresql') {
    backendSkills.push('postgres');
  }

  // QASKills
  const qaSkills = ['test-driven-development', 'browser-use'];

  // 按 agent 类型组合
  if (agentName === 'frontend') {
    return [...baseSkills, ...frontendSkills, ...frameworkSkills, ...uiSkills];
  }
  if (agentName === 'backend') {
    return [...baseSkills, ...backendSkills];
  }
  if (agentName === 'qa') {
    return [...baseSkills, ...qaSkills];
  }
  if (agentName === 'peaksbug') {
    return [...baseSkills, 'systematic-debugging', 'test-driven-development'];
  }
  if (agentName === 'peaksfeat') {
    return [...baseSkills, 'test-driven-development'];
  }

  return baseSkills;
}

function getMaxTurns(agentName) {
  const turns = {
    frontend: 50,
    backend: 50,
    qa: 30,
    product: 30,
    devops: 20,
    securityreviewer: 20,
    codeReviewerFrontend: 30,
    codeReviewerBackend: 30,
    peaksbug: 30,
    peaksfeat: 100,
    tauri: 50,
    postgres: 30,
    triage: 20
  };
  return turns[agentName] || 30;
}

function getHooks(agentName, techStack) {
  // 基础 hooks
  const baseHooks = ['require-code-review'];

  // 前端 hooks
  const frontendHooks = ['type-check', 'auto-format'];
  if (techStack.ui === 'tailwind' || techStack.ui === 'tailwindcss') {
    frontendHooks.push('tailwind-enforce');
  }
  frontendHooks.push('component-library-enforce', 'file-size-check');

  // 后端 hooks
  const backendHooks = ['type-check', 'auto-format'];

  // 按 agent 类型组合
  if (agentName === 'frontend') {
    return [...baseHooks, ...frontendHooks];
  }
  if (agentName === 'backend') {
    return [...baseHooks, ...backendHooks];
  }
  if (agentName === 'qa') {
    return ['require-code-review'];
  }

  return baseHooks;
}

// 格式化 frontmatter 为 YAML 字符串
function formatFrontmatter(vars) {
  const lines = [];
  lines.push('---');
  lines.push(`name: ${vars.name}`);

  // description 需要特殊处理多行
  lines.push('description: |');
  lines.push(`  ${vars.name} agent for ${vars.when_to_use}`);

  lines.push('');
  lines.push('when_to_use: |');
  lines.push(`  ${vars.when_to_use}`);

  lines.push('');
  lines.push(`model: ${vars.model}`);

  lines.push('');
  lines.push('tools:');
  for (const tool of vars.tools) {
    lines.push(`  - ${tool}`);
  }

  lines.push('');
  lines.push('skills:');
  for (const skill of vars.skills) {
    lines.push(`  - ${skill}`);
  }

  lines.push('');
  lines.push(`memory: ${vars.memory}`);

  lines.push('');
  lines.push(`maxTurns: ${vars.maxTurns}`);

  lines.push('');
  lines.push('hooks:');
  for (const hook of vars.hooks) {
    lines.push(`  - ${hook}`);
  }

  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

// 生成 Agent 文件
function generateAgentFile(agentName, techStack, templateContent, destPath) {
  // 生成 frontmatter
  const vars = generateAgentFrontmatter(agentName, techStack, templateContent);
  const frontmatterStr = formatFrontmatter(vars);

  // 保留模板的非 frontmatter 内容（技术栈说明、职责等）
  // 提取模板 body 部分
  const bodyMatch = templateContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1] : templateContent;

  // 组合最终内容
  const content = frontmatterStr + body;

  // 写入文件
  writeFileSync(destPath, content, 'utf-8');
  return true;
}

// 生成 Agent 配置
function generateAgentConfigs(techStack, templatesDir, agentsDir) {
  const agents = [];

  // 始终生成的 Agent
  const baseAgents = ['peaksfeat', 'product', 'qa', 'devops', 'security-reviewer',
              'code-reviewer-frontend', 'code-reviewer-backend', 'triage'];

  // 技术栈相关 Agent
  const stackAgents = [];
  if (techStack.frontend) {
    stackAgents.push('frontend');
    if (techStack.ui) console.log(`  - UI库: ${techStack.ui}`);
  }
  if (techStack.backend) stackAgents.push('backend');
  if (techStack.hasTauri) stackAgents.push('tauri');
  if (techStack.database) stackAgents.push('postgres');

  const allAgents = [...new Set([...baseAgents, ...stackAgents])];

  console.log('\n🧩 生成 Agents:');
  for (const agent of allAgents) {
    const templatePath = join(templatesDir, `${agent}.md`);
    const destPath = join(agentsDir, `${agent}.md`);

    if (existsSync(templatePath)) {
      const templateContent = readFileSync(templatePath, 'utf-8');
      generateAgentFile(agent, techStack, templateContent, destPath);
      console.log(`  ✅ ${agent}.md`);
      agents.push(agent);
    } else {
      console.log(`  ⚠️  模板不存在: ${agent}.md`);
    }
  }

  return agents;
}

// 安装 Impeccable design skill
async function installImpeccableSkill(projectPath) {
  const impeccableUrl = 'https://github.com/pbakaus/impeccable';
  const skillDestDir = join(projectPath, '.claude', 'skills', 'impeccable');
  const tempDir = join(projectPath, '.claude', 'skills', '.impeccable-temp');

  console.log('\n🎨 安装 Impeccable design skill...');

  try {
    mkdirSync(tempDir, { recursive: true });

    const { execSync } = await import('child_process');
    execSync(`npx -y degit ${impeccableUrl}/main/.claude/skills/impeccable ${tempDir}`, {
      cwd: projectPath,
      stdio: 'pipe'
    });

    if (existsSync(skillDestDir)) {
      rmSync(skillDestDir, { recursive: true });
    }
    mkdirSync(join(projectPath, '.claude', 'skills'), { recursive: true });
    cpSync(tempDir, skillDestDir);
    rmSync(tempDir, { recursive: true });

    console.log('  ✅ Impeccable skill 已安装');
    return true;
  } catch (error) {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
    console.log(`  ⚠️  Impeccable 安装失败: ${error.message}`);
    return false;
  }
}

// 主函数
const projectPath = process.argv[2] || process.cwd();
const skillDir = getSkillDir();

console.log(`\n🔍 扫描项目: ${projectPath}\n`);

const techStack = detectTechStack(projectPath);

console.log('📦 检测到的技术栈:');
console.log(`  - 前端: ${techStack.frontend || '未检测到'}`);
console.log(`  - 后端: ${techStack.backend || '未检测到'}`);
console.log(`  - UI库: ${techStack.ui || '未检测到'}`);
console.log(`  - 数据库: ${techStack.database || '未检测到'}`);
console.log(`  - 测试: ${techStack.test || '未检测到'}`);
console.log(`  - Tauri: ${techStack.hasTauri ? '是' : '否'}`);
console.log(`  - 开发端口: ${techStack.devPort}`);

// 生成 Agents
if (skillDir) {
  const templatesDir = join(skillDir, 'templates', 'agents');
  const agentsDir = join(projectPath, '.claude', 'agents');

  if (!existsSync(agentsDir)) {
    mkdirSync(agentsDir, { recursive: true });
  }

  generateAgentConfigs(techStack, templatesDir, agentsDir);
} else {
  console.log('\n⚠️  未找到 peaks-sdd skill 目录，跳过 Agent 生成');
}

// 检测到前端框架时安装 Impeccable design skill
if (techStack.frontend) {
  installImpeccableSkill(projectPath);
}

console.log('\n✅ 初始化完成！');
console.log('   接下来运行: /peaksfeat 开始功能开发');