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

    if (deps.react) techStack.frontend = 'react';
    else if (deps.vue) techStack.frontend = 'vue';
    else if (deps.next) techStack.frontend = 'next';

    if (deps['@nestjs/core']) techStack.backend = 'nestjs';
    else if (deps.express) techStack.backend = 'express';
    else if (deps.fastify) techStack.backend = 'fastify';

    if (deps.antd) techStack.ui = 'antd';
    else if (deps['@mui/material']) techStack.ui = 'mui';
    else if (deps['@chakra-ui/react']) techStack.ui = 'chakra';
    else if (deps['@radix-ui/react-dialog'] || deps['@radix-ui/react-accordion']) techStack.ui = 'radix';

    if (deps.typeorm || deps.prisma || deps.drizzle) techStack.database = 'postgresql';
    else if (deps.mongoose) techStack.database = 'mongodb';

    if (deps['@playwright/test']) techStack.test = 'playwright';
    else if (deps.vitest) techStack.test = 'vitest';
    else if (deps.jest) techStack.test = 'jest';

    if (existsSync(join(projectPath, 'src-tauri')) ||
        existsSync(join(projectPath, 'tauri.conf.json'))) {
      techStack.hasTauri = true;
    }

    if (pkg.devDependencies?.vite) techStack.devPort = 5173;
    else if (pkg.devDependencies?.webpack) techStack.devPort = 8080;
  }

  return techStack;
}

// 根据技术栈过滤 skills
function filterSkills(skills, techStack) {
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

// 提取 skills 部分的开始位置
function findSkillsSection(content) {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let skillsStart = -1;
  let skillsEnd = -1;
  let braceCount = 0;

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

    // 找到 skills: 行
    if (trimmed === 'skills:' || trimmed.startsWith('skills:')) {
      skillsStart = i;
      // 继续找到 skills 列表的结束（下一个非列表项、非缩进行）
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        const nextTrimmed = nextLine.trim();

        // 如果是空行继续
        if (!nextTrimmed) continue;

        // 如果是另一个顶层键（如 memory:）结束
        if (nextTrimmed.match(/^\w+:\s*$/)) {
          skillsEnd = j;
          break;
        }

        // 如果是另一个 section 的开始（如 memory: 前面有缩进）
        if (nextLine.match(/^[a-z]/) && !nextTrimmed.startsWith('-')) {
          skillsEnd = j;
          break;
        }

        // 如果遇到 memory: 结束
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

// 替换 skills 部分
function replaceSkillsSection(content, newSkills) {
  const { start, end } = findSkillsSection(content);
  if (start === -1 || end === -1) {
    return content; // 没找到 skills 部分，保持原样
  }

  const lines = content.split('\n');
  const before = lines.slice(0, start);
  const after = lines.slice(end);

  // 构建新的 skills 部分
  const newSkillsLines = ['skills:'];
  for (const skill of newSkills) {
    newSkillsLines.push(`  - ${skill}`);
  }

  return [...before, ...newSkillsLines, ...after].join('\n');
}

// 生成 Agent 文件
function generateAgentFile(agentName, techStack, templatePath, destPath) {
  if (!existsSync(templatePath)) {
    console.log(`  ⚠️  模板不存在: ${agentName}.md`);
    return false;
  }

  let content = readFileSync(templatePath, 'utf-8');

  // 提取 frontmatter 和 body
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    console.log(`  ⚠️  模板格式错误: ${agentName}.md`);
    return false;
  }

  let frontmatter = match[1];
  const body = match[2];

  // 提取当前 skills
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

  // 组合最终内容
  content = `---\n${frontmatter}\n---\n${body}`;

  writeFileSync(destPath, content, 'utf-8');
  return true;
}

// 生成 Agent 配置
function generateAgentConfigs(techStack, templatesDir, agentsDir) {
  const agents = [];

  const baseAgents = ['peaksfeat', 'product', 'qa', 'devops', 'security-reviewer',
              'code-reviewer-frontend', 'code-reviewer-backend', 'triage'];

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

// 创建 .peaks 目录结构
function createPeaksDirectory(projectPath) {
  const peaksDir = join(projectPath, '.peaks');
  const subdirs = ['prds', 'plans', 'swagger', 'designs', 'reports', 'auto-tests', 'checkpoints', 'bugs'];

  console.log('\n📁 创建 .peaks 目录结构:');

  for (const subdir of subdirs) {
    const dirPath = join(peaksDir, subdir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      console.log(`  ✅ .peaks/${subdir}/`);
    } else {
      console.log(`  ⚠️  .peaks/${subdir}/ 已存在`);
    }
  }

  // 创建 README.md
  const readmePath = join(peaksDir, 'README.md');
  if (!existsSync(readmePath)) {
    const readmeContent = `# .peaks

peaks-sdd 工作流产出物目录

## 目录说明

| 目录 | 用途 |
|------|------|
| \`prds/\` | PRD 文档（需求分析） |
| \`plans/\` | 开发计划（任务拆分） |
| \`swagger/\` | API 规范（后端接口定义） |
| \`designs/\` | 设计稿截图 |
| \`reports/\` | 测试报告、修复报告 |
| \`auto-tests/\` | 自动化测试脚本 |
| \`checkpoints/\` | 中间检查点归档 |
| \`bugs/\` | Bug 报告和修复记录 |

## 命名规范

| 类型 | 格式 |
|------|------|
| PRD | \`prd-[功能名]-[YYYYMMDD].md\` |
| Plan | \`plan-[功能名]-[YYYYMMDD].md\` |
| Swagger | \`swagger-[功能名]-[YYYYMMDD].json\` |
| Bug 报告 | \`bug-[问题描述]-[YYYYMMDD].md\` |
| 自动测试 | \`auto-test-[功能名]-[YYYYMMDD].md\` |
`;
    writeFileSync(readmePath, readmeContent, 'utf-8');
    console.log('  ✅ .peaks/README.md');
  }
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

// 创建 .peaks 目录结构
createPeaksDirectory(projectPath);

console.log('\n✅ 初始化完成！');
console.log('   接下来运行: /peaks-sdd 添加[功能] 开始功能开发');