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
    projectName: ''
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
    else if (deps['@radix-ui/react-dialog'] || deps['@radix-ui/react-accordion']) techStack.ui = 'radix';

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

    // 开发端口
    if (pkg.devDependencies?.vite) techStack.devPort = 5173;
    else if (pkg.devDependencies?.webpack) techStack.devPort = 8080;
  }

  return techStack;
}

// 根据技术栈过滤 skills
function filterSkills(skills, techStack) {
  const frameworkExcludes = {
    // 排除 Vue 相关的，如果检测到 React/Next
    vue: ['vue-best-practices', 'vue', 'vue-debug-guides'],
    // 排除 React 相关的，如果检测到 Vue
    react: ['react:components'],
    // 排除 NestJS 相关的，如果检测到 Express
    express: ['nestjs-patterns'],
    // 排除特定框架的 skill
  };

  const excludeSkills = new Set();

  // 如果是 React/Next，排除 Vue skills
  if (techStack.frontend === 'react' || techStack.frontend === 'next') {
    frameworkExcludes.vue.forEach(s => excludeSkills.add(s));
  }

  // 如果是 Vue，排除 React skills
  if (techStack.frontend === 'vue') {
    frameworkExcludes.react.forEach(s => excludeSkills.add(s));
    // Vue 项目保留 Vue skills
  }

  // 如果是 Express，排除 NestJS skills
  if (techStack.backend === 'express' || techStack.backend === 'fastify') {
    frameworkExcludes.express.forEach(s => excludeSkills.add(s));
  }

  // 如果检测到 Ant Design，排除其他 UI 库的 skills
  if (techStack.ui !== 'antd') {
    ['antd-best-practices'].forEach(s => excludeSkills.add(s));
  }

  // 如果检测到的是非 antd UI，保留 antd 相关 skill
  if (techStack.ui && techStack.ui !== 'antd') {
    excludeSkills.add('antd-best-practices');
  }

  // 过滤掉不相关框架的 skills
  return skills.filter(skill => !excludeSkills.has(skill));
}

// 解析 frontmatter
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatterLines = match[1].split('\n');
  const body = match[2];

  const frontmatter = {};
  let currentKey = null;
  let currentValue = [];

  for (const line of frontmatterLines) {
    // YYYY: value 格式（顶部级别键）
    const simpleMatch = line.match(/^(\w+):\s*(.*)$/);
    if (simpleMatch && !line.startsWith(' ') && !line.startsWith('\t')) {
      if (currentKey) {
        frontmatter[currentKey] = currentValue.join('\n').trim();
      }
      currentKey = simpleMatch[1];
      currentValue = simpleMatch[2] ? [simpleMatch[2]] : [];
    }
    // 列表项 - xxx
    else if (line.match(/^\s+-\s+.+$/)) {
      const value = line.replace(/^\s+-\s+/, '');
      currentValue.push(value);
    }
    // 多行描述 | 后面的内容
    else if (line.match(/^\s+\|.+$/)) {
      const value = line.replace(/^\s+\|/, '');
      currentValue.push(value);
    }
  }

  if (currentKey) {
    frontmatter[currentKey] = currentValue.join('\n').trim();
  }

  return { frontmatter, body };
}

// 格式化 frontmatter 为 YAML 字符串
function formatFrontmatter(frontmatter) {
  const lines = [];

  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${item}`);
      }
    } else if (typeof value === 'string' && value.includes('\n')) {
      // 多行字符串
      lines.push(`${key}: |`);
      for (const line of value.split('\n')) {
        lines.push(`  ${line}`);
      }
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  return lines.join('\n');
}

// 生成 Agent 文件
function generateAgentFile(agentName, techStack, templatePath, destPath) {
  if (!existsSync(templatePath)) {
    console.log(`  ⚠️  模板不存在: ${agentName}.md`);
    return false;
  }

  const content = readFileSync(templatePath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);

  // 动态过滤 skills
  if (frontmatter.skills) {
    const currentSkills = Array.isArray(frontmatter.skills)
      ? frontmatter.skills
      : frontmatter.skills.split('\n').filter(s => s.trim());

    frontmatter.skills = filterSkills(currentSkills, techStack);
  }

  // 组合最终内容
  const finalContent = `---\n${formatFrontmatter(frontmatter)}\n---\n${body}`;

  writeFileSync(destPath, finalContent, 'utf-8');
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
      const success = generateAgentFile(agent, techStack, templatePath, destPath);
      if (success) {
        console.log(`  ✅ ${agent}.md`);
        agents.push(agent);
      }
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