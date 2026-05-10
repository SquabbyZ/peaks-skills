#!/usr/bin/env node
/**
 * peaks-sdd 项目初始化脚本
 * 自动扫描项目技术栈并生成配置
 */

import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

import { detectTechStack, printTechStack } from './lib/tech-stack-detector.mjs';
import { generateAgentConfigs } from './lib/agent-generator.mjs';
import { createPeaksDirectory, createDataDirectories, configureMcpServers } from './lib/directory-creator.mjs';
import { printAnimatedTitle, status } from './lib/terminal-ui.mjs';

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

async function main() {
  const startTime = performance.now();
  const projectPath = process.argv[2] || process.cwd();
  const skillDir = getSkillDir();

  console.log('\n\x1b[1m\x1b[36m╔══════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[36m║\x1b[0m  \x1b[1m\x1b[37mpeaks-sdd 项目初始化\x1b[0m\x1b[36m                   ║\x1b[0m');
  console.log('\x1b[1m\x1b[36m╚══════════════════════════════════════════════╝\x1b[0m');
  console.log(`\x1b[90m   扫描项目: ${projectPath}\x1b[0m`);

  printAnimatedTitle('🔍 扫描项目');
  const techStack = detectTechStack(projectPath);
  printTechStack(techStack, projectPath);

  printAnimatedTitle('🧩 生成 Agents');
  if (skillDir) {
    const templatesDir = join(skillDir, 'templates', 'agents');
    const agentsDir = join(projectPath, '.claude', 'agents');

    // 清空 agents 目录重新生成
    if (existsSync(agentsDir)) {
      const { rmSync } = await import('fs');
      rmSync(agentsDir, { recursive: true });
    }
    mkdirSync(agentsDir, { recursive: true });

    const generatedAgents = generateAgentConfigs(techStack, templatesDir, agentsDir, projectPath);
    console.log(`\n\x1b[90m   共生成 ${generatedAgents.length} 个 Agent\x1b[0m`);
  } else {
    console.log(`\n   ${status.warning('未找到 peaks-sdd skill 目录，跳过 Agent 生成')}`);
  }

  // Skills 延迟安装提示（初始化时不安装，避免 429）
  console.log(`\n   ${status.info('Skills 将在实际使用时按需安装')}`);

  printAnimatedTitle('📁 创建 .peaks 目录');
  createPeaksDirectory(projectPath);

  printAnimatedTitle('📂 创建数据目录');
  createDataDirectories(projectPath);

  printAnimatedTitle('🔌 配置 MCP 服务');
  configureMcpServers(projectPath);

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

  console.log('\n\x1b[1m\x1b[36m╔══════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[36m║\x1b[0m  \x1b[1m\x1b[32m✅ 初始化完成！\x1b[0m\x1b[36m                            ║\x1b[0m');
  console.log(`\x1b[1m\x1b[36m║\x1b[0m  \x1b[90m耗时: ${elapsed}s\x1b[0m\x1b[36m                            ║\x1b[0m`);
  console.log('\x1b[1m\x1b[36m╚══════════════════════════════════════════════╝\x1b[0m');
  console.log('\n\x1b[90m   接下来运行:\x1b[0m');
  console.log('\x1b[90m   • \x1b[37m/peaks-sdd 加个用户注册功能\x1b[0m  功能开发');
  console.log('\x1b[90m   • \x1b[37m/peaks-sdd 登录按钮点击没反应\x1b[0m  Bug 修复');
  console.log('\x1b[90m   • \x1b[37m/peaks-sdd 初始化\x1b[0m     重新初始化项目');
  console.log('');
}

main().catch(console.error);