#!/usr/bin/env node
/**
 * peaks-sdd 项目初始化脚本
 * 自动扫描项目技术栈并生成配置
 */

import { readFileSync, existsSync, mkdirSync, cpSync, rmSync } from 'fs';
import { join } from 'path';

// 安装 Impeccable design skill
async function installImpeccableSkill(projectPath) {
  const impeccableUrl = 'https://github.com/pbakaus/impeccable';
  const skillDestDir = join(projectPath, '.claude', 'skills', 'impeccable');
  const tempDir = join(projectPath, '.claude', 'skills', '.impeccable-temp');

  console.log('\n🎨 安装 Impeccable design skill...');

  try {
    // 创建临时目录
    mkdirSync(tempDir, { recursive: true });

    // 使用 degit 克隆仓库（高效拉取）
    const { execSync } = await import('child_process');
    execSync(`npx -y degit ${impeccableUrl}/main/.claude/skills/impeccable ${tempDir}`, {
      cwd: projectPath,
      stdio: 'pipe'
    });

    // 移动到目标位置
    if (existsSync(skillDestDir)) {
      rmSync(skillDestDir, { recursive: true });
    }
    mkdirSync(join(projectPath, '.claude', 'skills'), { recursive: true });
    cpSync(tempDir, skillDestDir);

    // 清理临时目录
    rmSync(tempDir, { recursive: true });

    console.log('  ✅ Impeccable skill 已安装到 .claude/skills/impeccable/');
    console.log('     使用 /impeccable 开始设计任务');

    return true;
  } catch (error) {
    // 清理临时目录
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
    console.log(`  ⚠️  Impeccable 安装失败: ${error.message}`);
    console.log('     可手动安装: npx degit pbakaus/impeccable/main/.claude/skills/impeccable .claude/skills/impeccable');
    return false;
  }
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
    devPort: 3000
  };

  if (existsSync(packageJsonPath)) {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

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

    // 数据库检测
    if (deps.typeorm || deps.prisma || deps.drizzle) techStack.database = 'postgresql';

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

// 生成Agent配置
function generateAgentConfig(techStack) {
  const agents = [];

  // 始终生成的Agent
  agents.push('peaksfeat', 'product', 'qa', 'devops', 'security-reviewer',
              'code-reviewer-frontend', 'code-reviewer-backend', 'triage');

  // 技术栈相关Agent
  if (techStack.frontend) {
    agents.push('frontend');
    if (techStack.ui) console.log(`  - UI库: ${techStack.ui}`);
  }
  if (techStack.backend) agents.push('backend');
  if (techStack.hasTauri) agents.push('tauri');
  if (techStack.database) agents.push('postgres');

  return [...new Set(agents)];
}

// 输出结果
const projectPath = process.argv[2] || process.cwd();
console.log(`\n🔍 扫描项目: ${projectPath}\n`);

const techStack = detectTechStack(projectPath);
const agents = generateAgentConfig(techStack);

console.log('📦 检测到的技术栈:');
console.log(`  - 前端: ${techStack.frontend || '未检测到'}`);
console.log(`  - 后端: ${techStack.backend || '未检测到'}`);
console.log(`  - UI库: ${techStack.ui || '未检测到'}`);
console.log(`  - 数据库: ${techStack.database || '未检测到'}`);
console.log(`  - 测试: ${techStack.test || '未检测到'}`);
console.log(`  - Tauri: ${techStack.hasTauri ? '是' : '否'}`);
console.log(`  - 开发端口: ${techStack.devPort}`);

console.log('\n🧩 将生成的 Agents:');
agents.forEach(agent => console.log(`  - ${agent}`));

// 检测到前端框架时安装 Impeccable design skill
if (techStack.frontend) {
  installImpeccableSkill(projectPath);
}

console.log('\n✅ 初始化完成！');
console.log('   接下来运行: /peaksfeat 开始功能开发');