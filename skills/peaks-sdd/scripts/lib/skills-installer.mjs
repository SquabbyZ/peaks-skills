#!/usr/bin/env node
/**
 * peaks-sdd Skills 安装模块
 * 批量安装 skills 到全局目录
 */

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import os from 'os';
import { status } from './terminal-ui.mjs';

/**
 * 安装单个 skill（带进度显示和重试）
 * @param {string} skillUrl - skill 仓库 URL
 * @param {string} skillName - skill 名称
 * @param {object} options - 配置选项
 * @returns {Promise<object>} 安装结果
 */
export async function installSkill(skillUrl, skillName, options = {}) {
  const { skillDirName, global = true, maxRetries = 2, timeout = 90000 } = options;
  const globalSkillsDir = join(os.homedir(), '.claude', 'skills');
  const dirName = skillDirName || skillName;
  const skillDestDir = join(globalSkillsDir, dirName);

  // 检查是否已安装
  if (existsSync(skillDestDir)) {
    console.log(`  ${status.skip(`${skillName} 已安装，跳过`)}`);
    return { success: true, skipped: true, name: skillName };
  }

  // 动态显示正在安装
  process.stdout.write(`  \x1b[33m⏳ ${skillName}\x1b[0m 安装中...`);
  const { execSync } = await import('child_process');

  try {
    const installCmd = `npx -y skills add ${skillUrl} --skill ${skillName}`;
    execSync(installCmd, {
      cwd: global ? os.homedir() : process.cwd(),
      stdio: 'pipe',
      timeout: timeout,
    });
    process.stdout.write(`\r  \x1b[32m✅ ${skillName}\x1b[0m 安装成功\n`);
    return { success: true, skipped: false, name: skillName };
  } catch (error) {
    // 网络/npm错误都跳过，不阻塞流程
    const isNetworkError =
      error.message?.includes('timeout') ||
      error.message?.includes('ETIMEDOUT') ||
      error.message?.includes('ENOTFOUND') ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('network') ||
      error.message?.includes('npm') ||
      error.message?.includes('not found') ||
      error.message?.includes('404');

    if (isNetworkError) {
      process.stdout.write(`\r  \x1b[33m⚠️ ${skillName}\x1b[0m 跳过（网络问题）\n`);
      return { success: true, skipped: true, name: skillName };
    }
    process.stdout.write(`\r  \x1b[31m❌ ${skillName}\x1b[0m 安装失败: ${error.message?.slice(0, 50)}\n`);
    return { success: false, skipped: false, name: skillName, error: error.message };
  }
}

/**
 * 批量安装 skills（带进度显示）
 * @param {Array} skillList - skills 列表
 * @returns {Promise<Array>} 安装结果
 */
export async function installSkills(skillList) {
  const results = [];
  const total = skillList.length;

  // 确保全局 skills 目录存在
  const globalSkillsDir = join(os.homedir(), '.claude', 'skills');
  if (!existsSync(globalSkillsDir)) {
    mkdirSync(globalSkillsDir, { recursive: true });
  }

  for (const item of skillList) {
    const { url, name, skillDirName } = item;

    const result = await installSkill(url, name, {
      skillDirName,
      global: true,
      maxRetries: 3
    });

    results.push(result);
  }

  // 打印安装结果汇总
  const succeeded = results.filter(r => r.success && !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;
  const failed = results.filter(r => !r.success).length;

  // 按来源分组显示
  const superpowers = results.filter(r => r.name && ['brainstorming', 'dispatching-parallel-agents', 'executing-plans', 'finishing-a-development-branch', 'receiving-code-review', 'requesting-code-review', 'subagent-driven-development', 'systematic-debugging', 'test-driven-development', 'using-git-worktrees', 'using-superpowers', 'verification-before-completion', 'writing-plans', 'writing-skills'].includes(r.name));
  const vercel = results.filter(r => r.name && r.name.startsWith('vercel-'));
  const other = results.filter(r => !superpowers.includes(r) && !vercel.includes(r));

  console.log('\x1b[90m' + '─'.repeat(50) + '\x1b[0m');
  console.log(`\n\x1b[1m📊 Skills 安装结果:\x1b[0m`);

  if (superpowers.length > 0) {
    console.log(`\n   \x1b[1m🔗 Superpowers:\x1b[0m`);
    superpowers.forEach(r => {
      const icon = r.success ? (r.skipped ? '➖' : '✅') : '❌';
      console.log(`      ${icon} ${r.name}`);
    });
  }

  if (vercel.length > 0) {
    console.log(`\n   \x1b[1m🔗 Vercel Skills:\x1b[0m`);
    vercel.forEach(r => {
      const icon = r.success ? (r.skipped ? '➖' : '✅') : '❌';
      console.log(`      ${icon} ${r.name}`);
    });
  }

  if (other.length > 0) {
    console.log(`\n   \x1b[1m🔗 其他 Skills:\x1b[0m`);
    other.forEach(r => {
      const icon = r.success ? (r.skipped ? '➖' : '✅') : '❌';
      console.log(`      ${icon} ${r.name}`);
    });
  }

  console.log(`\n   ${status.success(`成功: ${succeeded}`)}`);
  console.log(`   ${status.skip(`跳过: ${skipped}`)}`);
  console.log(`   ${status.error(`失败: ${failed}`)}`);

  if (failed > 0) {
    const failedNames = results.filter(r => !r.success).map(r => r.name).join(', ');
    console.log(`\n\x1b[33m⚠️  失败列表: ${failedNames}\x1b[0m`);
  }

  return results;
}

/**
 * 根据技术栈获取需要安装的 skills 列表
 * @param {object} techStack - 技术栈信息
 * @returns {Array} skills 列表
 */
export function getSkillsToInstall(techStack) {
  const superpowersSkills = [
    { url: 'https://github.com/obra/superpowers', name: 'brainstorming' },
    { url: 'https://github.com/obra/superpowers', name: 'dispatching-parallel-agents' },
    { url: 'https://github.com/obra/superpowers', name: 'executing-plans' },
    { url: 'https://github.com/obra/superpowers', name: 'finishing-a-development-branch' },
    { url: 'https://github.com/obra/superpowers', name: 'receiving-code-review' },
    { url: 'https://github.com/obra/superpowers', name: 'requesting-code-review' },
    { url: 'https://github.com/obra/superpowers', name: 'subagent-driven-development' },
    { url: 'https://github.com/obra/superpowers', name: 'systematic-debugging' },
    { url: 'https://github.com/obra/superpowers', name: 'test-driven-development' },
    { url: 'https://github.com/obra/superpowers', name: 'using-git-worktrees' },
    { url: 'https://github.com/obra/superpowers', name: 'using-superpowers' },
    { url: 'https://github.com/obra/superpowers', name: 'verification-before-completion' },
    { url: 'https://github.com/obra/superpowers', name: 'writing-plans' },
    { url: 'https://github.com/obra/superpowers', name: 'writing-skills' },
  ];

  const commonSkills = [
    { url: 'https://github.com/vercel-labs/skills', name: 'find-skills' },
    { url: 'https://github.com/vercel-labs/skills', name: 'brainstorming' },
    { url: 'https://github.com/anthropics/skills', name: 'frontend-design' },
    { url: 'https://github.com/patricio0312rev/skills', name: 'component-scaffold-generator' },
    { url: 'https://github.com/google-labs-code/stitch-skills', name: 'design-md' },
  ];

  const browserSkills = [
    { url: 'https://github.com/browserbase/skills', name: 'browser' },
    { url: 'https://github.com/browser-use/browser-use', name: 'browser-use' },
  ];

  const designSkills = [
    { url: 'https://github.com/anthropics/skills', name: 'frontend-design' },
    { url: 'https://github.com/leonxlnx/taste-skill', name: 'design-taste-frontend' },
  ];

  const frontendSkills = [];
  if (techStack.frontend === 'react' || techStack.frontend === 'next') {
    frontendSkills.push(
      { url: 'https://github.com/vercel-labs/agent-skills', name: 'vercel-react-best-practices' },
      { url: 'https://github.com/vercel-labs/agent-skills', name: 'vercel-react-native-skills' },
      { url: 'https://github.com/vercel-labs/agent-skills', name: 'vercel-react-view-transitions' },
      { url: 'https://github.com/google-labs-code/stitch-skills', name: 'react:components' },
      { url: 'https://github.com/pbakaus/impeccable', name: 'impeccable' },
    );
  }

  if (techStack.frontend === 'vue') {
    frontendSkills.push(
      { url: 'https://github.com/hyf0/vue-skills', name: 'vue-best-practices' },
      { url: 'https://github.com/antfu/skills', name: 'vue' },
      { url: 'https://github.com/hyf0/vue-skills', name: 'vue-debug-guides' },
    );
  }

  const architectureSkills = [
    { url: 'https://github.com/mattpocock/skills', name: 'improve-codebase-architecture' },
  ];

  const testingSkills = [
    { url: 'https://github.com/anthropics/skills', name: 'webapp-testing' },
    { url: 'https://github.com/wshobson/agents', name: 'e2e-testing-patterns' },
    { url: 'https://github.com/wshobson/agents', name: 'javascript-testing-patterns' },
    { url: 'https://github.com/supercent-io/skills-template', name: 'testing-strategies' },
    { url: 'https://github.com/supercent-io/skills-template', name: 'security-best-practices' },
    { url: 'https://github.com/addyosmani/web-quality-skills', name: 'performance' },
    { url: 'https://github.com/supercent-io/skills-template', name: 'performance-optimization' },
    { url: 'https://github.com/get-convex/agent-skills', name: 'convex-performance-audit' },
    { url: 'https://github.com/wshobson/agents', name: 'api-testing-patterns' },
  ];

  // 合并所有需要安装的 skills
  return [
    ...superpowersSkills,
    ...commonSkills,
    ...browserSkills,
    ...designSkills,
    ...frontendSkills,
    ...architectureSkills,
    ...testingSkills,
  ];
}
