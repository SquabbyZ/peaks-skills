#!/usr/bin/env node
/**
 * peaks-sdd 目录创建模块
 * 创建 .peaks 目录结构和数据目录
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { status } from './terminal-ui.mjs';

/**
 * 创建 .peaks 目录结构
 * @param {string} projectPath - 项目路径
 */
export function createPeaksDirectory(projectPath) {
  const peaksDir = join(projectPath, '.peaks');
  const subdirs = [
    { name: 'prds', desc: 'PRD 文档（需求分析）' },
    { name: 'plans', desc: '开发计划（任务拆分）' },
    { name: 'swagger', desc: 'API 规范（后端接口定义）' },
    { name: 'designs', desc: '设计稿截图' },
    { name: 'reports', desc: '测试报告、修复报告' },
    { name: 'auto-tests', desc: '自动化测试脚本' },
    { name: 'checkpoints', desc: '中间检查点归档' },
    { name: 'bugs', desc: 'Bug 报告和修复记录' },
  ];

  console.log('\n\x1b[1m\x1b[36m📁\x1b[0m 创建 .peaks 目录结构:');
  console.log('\x1b[90m' + '─'.repeat(50) + '\x1b[0m');

  for (const { name, desc } of subdirs) {
    const dirPath = join(peaksDir, name);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      console.log(`\x1b[32m  ✅ .peaks/${name}/\x1b[0m \x1b[90m- ${desc}\x1b[0m`);
    } else {
      console.log(`\x1b[36m  ➖ .peaks/${name}/ 已存在\x1b[0m \x1b[90m- ${desc}\x1b[0m`);
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
    console.log(`\x1b[32m  ✅ .peaks/README.md\x1b[0m`);
  } else {
    console.log(`\x1b[36m  ➖ .peaks/README.md 已存在\x1b[0m`);
  }
}

/**
 * 创建数据目录
 * @param {string} projectPath - 项目路径
 */
export function createDataDirectories(projectPath) {
  const dataDirs = ['.gitnexus'];

  console.log('\n\x1b[1m\x1b[36m📂\x1b[0m 创建数据目录:');
  console.log('\x1b[90m' + '─'.repeat(50) + '\x1b[0m');

  for (const dir of dataDirs) {
    const dirPath = join(projectPath, dir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      console.log(`\x1b[32m  ✅ ${dir}/\x1b[0m`);
    } else {
      console.log(`\x1b[36m  ➖ ${dir}/ 已存在\x1b[0m`);
    }
  }
}

/**
 * 配置 MCP 服务
 * @param {string} projectPath - 项目路径
 */
export function configureMcpServers(projectPath) {
  const settingsPath = join(projectPath, '.claude', 'settings.json');

  // claude-mem 和 context7 不需要 --repo 参数，它们自动使用项目目录
  const mcpServers = {
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "mcp", "--repo", projectPath]
    },
    "claude-mem": {
      "command": "npx",
      "args": ["-y", "@the.dot/mem"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "fs": {
      "command": "npx",
      "args": ["-y", "@bunas/fs-mcp"]
    },
    "claude-md-management": {
      "command": "npx",
      "args": ["-y", "claude-md-management@claude-plugins-official"]
    },
    "code-review": {
      "command": "npx",
      "args": ["-y", "code-review@claude-plugins-official"]
    },
    "typescript-lsp": {
      "command": "npx",
      "args": ["-y", "typescript-lsp@claude-plugins-official"]
    },
    "superpowers": {
      "command": "npx",
      "args": ["-y", "superpowers@claude-plugins-official"]
    },
    "frontend-design": {
      "command": "npx",
      "args": ["-y", "frontend-design@claude-plugins-official"]
    }
  };

  console.log(`\n\x1b[1m\x1b[36m🔌\x1b[0m 配置 MCP 服务:`);
  console.log('\x1b[90m' + '─'.repeat(50) + '\x1b[0m');

  // 读取现有设置
  let settings = { mcpServers: {}, permissions: { allow: [], deny: [] } };
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    } catch (e) {
      console.log(`  ${status.warning('settings.json 解析失败，将创建新的')}`);
    }
  }

  // 增量添加 mcpServers
  if (!settings.mcpServers) {
    settings.mcpServers = {};
  }

  for (const [name, config] of Object.entries(mcpServers)) {
    if (!settings.mcpServers[name]) {
      settings.mcpServers[name] = config;
      console.log(`  ${status.success(name)}`);
    } else {
      console.log(`  ${status.skip(`${name} 已配置`)}`);
    }
  }

  // 确保 permissions 字段存在
  if (!settings.permissions) {
    settings.permissions = { allow: [], deny: [] };
  }

  // 写入 settings.json
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  console.log(`\x1b[90m  └─ settings.json 已更新\x1b[0m`);
}
