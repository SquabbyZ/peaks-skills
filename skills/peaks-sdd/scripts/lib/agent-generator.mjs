#!/usr/bin/env node
/**
 * peaks-sdd Agent 生成模块
 * 根据技术栈动态生成 Agent 配置文件
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { status } from './terminal-ui.mjs';

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

  // 提取 frontmatter 和 body
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    console.log(`  \x1b[33m⚠️  模板格式错误: ${agentName}.md\x1b[0m`);
    return false;
  }

  let frontmatter = match[1];
  let body = match[2];

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
 * 生成 QA 子 Agent 配置
 * @param {object} techStack - 技术栈信息
 * @param {string} templatesDir - 模板目录
 * @param {string} agentsDir - agent 输出目录
 * @returns {Array} 生成的 agent 列表
 */
function generateQaSubAgents(techStack, templatesDir, agentsDir) {
  const qaSubAgents = [
    'qa-coordinator',
    'qa-frontend',
    'qa-backend',
    'qa-frontend-perf',
    'qa-backend-perf',
    'qa-security',
    'qa-automation'
  ];

  const generated = [];
  const qaTemplateDir = join(templatesDir, 'qa');

  // 动态过滤 QA 子 agents
  const enabledQaSubAgents = [];

  // 如果有前端，才启用前端相关 QA agents
  if (techStack.frontend) {
    enabledQaSubAgents.push('qa-frontend', 'qa-frontend-perf');
  }

  // 如果有后端，才启用后端相关 QA agents
  if (techStack.backend) {
    enabledQaSubAgents.push('qa-backend', 'qa-backend-perf');
  }

  // 安全测试始终启用
  enabledQaSubAgents.push('qa-security');

  // 自动化测试脚本执行始终启用
  enabledQaSubAgents.push('qa-automation');

  // 测试调度始终启用
  enabledQaSubAgents.push('qa-coordinator');

  for (const agent of enabledQaSubAgents) {
    const templatePath = join(qaTemplateDir, `${agent}.md`);
    const destPath = join(agentsDir, `${agent}.md`);

    if (existsSync(templatePath)) {
      const success = generateAgentFile(agent, techStack, templatePath, destPath);
      if (success) {
        console.log(`  ${status.success(`${agent}.md`)} \x1b[90m- QA 子 Agent\x1b[0m`);
        generated.push(agent);
      }
    } else {
      console.log(`  ${status.warning(`QA 模板不存在: ${agent}.md`)}`);
    }
  }

  return generated;
}

/**
 * 生成 Agent 配置
 * @param {object} techStack - 技术栈信息
 * @param {string} templatesDir - 模板目录
 * @param {string} agentsDir - agent 输出目录
 * @returns {Array} 生成的 agent 列表
 */
export function generateAgentConfigs(techStack, templatesDir, agentsDir) {
  const agents = [];

  const baseAgents = [
    'peaksfeat', 'product', 'qa', 'devops', 'security-reviewer',
    'code-reviewer-frontend', 'code-reviewer-backend', 'triage'
  ];

  const stackAgents = [];
  if (techStack.frontend) {
    stackAgents.push('frontend');
  }
  if (techStack.backend) stackAgents.push('backend');
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

    const templatePath = join(templatesDir, `${agent}.md`);
    const destPath = join(agentsDir, `${agent}.md`);

    if (existsSync(templatePath)) {
      const success = generateAgentFile(agent, techStack, templatePath, destPath);
      if (success) {
        const desc = getAgentDescription(templatePath);
        console.log(`  ${status.success(`${agent}.md`)} \x1b[90m- ${desc}\x1b[0m`);
        agents.push(agent);
      }
    } else {
      console.log(`  ${status.warning(`模板不存在: ${agent}.md`)}`);
    }
  }

  return agents;
}
