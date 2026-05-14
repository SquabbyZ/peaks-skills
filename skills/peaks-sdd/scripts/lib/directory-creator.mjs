#!/usr/bin/env node
/**
 * peaks-sdd 目录创建模块
 * 创建 .peaks 目录结构和数据目录
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, copyFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { status } from './terminal-ui.mjs';
import { createPeaksProjectLayout } from './change-artifacts.mjs';
import { buildMcpPolicyNotes, buildMcpServers } from './mcp-policy.mjs';

/**
 * 创建 .peaks 目录结构
 * @param {string} projectPath - 项目路径
 * @param {object} options - change 创建选项
 */
export function createPeaksDirectory(projectPath, options = {}) {
  const paths = createPeaksProjectLayout(projectPath, options);

  console.log('\n\x1b[1m\x1b[36m📁\x1b[0m 创建 .peaks change-scoped 目录结构:');
  console.log('\x1b[90m' + '─'.repeat(50) + '\x1b[0m');
  console.log(`\x1b[32m  ✅ .peaks/project/\x1b[0m \x1b[90m- 跨迭代项目知识\x1b[0m`);
  console.log(`\x1b[32m  ✅ .peaks/${paths.changeRelativePath}/\x1b[0m \x1b[90m- 当前 change 产物\x1b[0m`);
  console.log(`\x1b[32m  ✅ .peaks/current-change\x1b[0m \x1b[90m- 指向 ${paths.changeRelativePath}\x1b[0m`);

  const readmePath = join(paths.peaksDir, 'README.md');
  if (!existsSync(readmePath)) {
    const readmeContent = `# .peaks

peaks-sdd 工作流产出物目录。

## 结构

- \`project/\`: 跨迭代稳定信息，例如产品总览、知识、路线图和长期决策索引。
- \`current-change\`: 当前活跃 change 指针，内容形如 \`changes/YYYY-MM-DD-initial-product\`。
- \`changes/<change-id>/\`: 每次全新项目、功能迭代或 bugfix 的阶段产物。

## Change 目录

每个 change 内部包含：

- \`product/\`: brainstorm 和 PRD
- \`design/\`: UX、视觉方向、设计规范、预览和截图
- \`architecture/\`: 技术栈、系统设计、决策
- \`openspec/\`: OpenSpec 映射和摘要
- \`enhancements.md\`: 外部 skills、MCP 查询和最佳实践来源
- \`swarm/\`: task graph、waves、status、briefs、reports、文件所有权
- \`dispatch/\`: 前后端研发调度图
- \`qa/\`: 测试计划、E2E 报告和截图
- \`review/\`: code review 和安全审查
- \`checkpoints/\`: 阶段检查点和 product/design/dispatcher/qa 项目 agent 交接 brief
- \`final-report.md\`: 最终报告
`;
    writeFileSync(readmePath, readmeContent, 'utf-8');
    console.log(`\x1b[32m  ✅ .peaks/README.md\x1b[0m`);
  } else {
    console.log(`\x1b[36m  ➖ .peaks/README.md 已存在\x1b[0m`);
  }

  return paths;
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
 * @param {object} techStack - 检测到的技术栈
 */
export function configureProjectSettings(projectPath, techStack = {}, skillDir = null) {
  const settingsPath = join(projectPath, '.claude', 'settings.json');
  const mcpServers = buildMcpServers(projectPath, techStack);
  const mcpPolicyNotes = buildMcpPolicyNotes(techStack);

  console.log(`\n\x1b[1m\x1b[36m🔌\x1b[0m 配置 MCP 和 Hooks:`);
  console.log('\x1b[90m' + '─'.repeat(50) + '\x1b[0m');

  let settings = { mcpServers: {}, permissions: { allow: [], deny: [] }, hooks: {} };
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    } catch (e) {
      console.log(`  ${status.warning('settings.json 解析失败，已跳过配置以避免覆盖用户配置')}`);
      return;
    }
  }

  if (skillDir) {
    const templatePath = join(skillDir, 'templates', '.claude', 'settings.json');
    if (existsSync(templatePath)) {
      const template = renderSettingsTemplate(templatePath, { projectPath, skillDir });
      settings = mergeSettings(settings, template);
    }
  }

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

  settings.peaksSdd = {
    ...(settings.peaksSdd || {}),
    mcpPolicy: {
      mode: 'fine-grained-stage-injection',
      notes: mcpPolicyNotes
    }
  };

  if (!settings.permissions) {
    settings.permissions = { allow: [], deny: [] };
  }
  if (!settings.hooks) {
    settings.hooks = {};
  }

  mkdirSync(join(projectPath, '.claude'), { recursive: true });
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  console.log(`\x1b[90m  └─ settings.json 已更新\x1b[0m`);
}

export function configureMcpServers(projectPath, techStack = {}) {
  configureProjectSettings(projectPath, techStack);
}

export function syncProjectTemplates(projectPath, skillDir) {
  if (!skillDir) return { copied: [], skipped: [] };

  const copied = [];
  const skipped = [];
  copyTemplateFileIfMissing({
    sourcePath: join(skillDir, 'templates', '.claude', 'session-state.json'),
    destPath: join(projectPath, '.claude', 'session-state.json'),
    projectPath,
    copied,
    skipped
  });
  copyTemplateDirectoryIfMissing({
    sourceDir: join(skillDir, 'templates', 'hookify'),
    destDir: join(projectPath, '.claude', 'hookify'),
    projectPath,
    copied,
    skipped
  });
  copyTemplateDirectoryIfMissing({
    sourceDir: join(skillDir, 'templates', 'openspec'),
    destDir: join(projectPath, 'openspec'),
    projectPath,
    copied,
    skipped
  });

  return { copied, skipped };
}

function copyTemplateDirectoryIfMissing({ sourceDir, destDir, projectPath, copied, skipped }) {
  if (!existsSync(sourceDir)) return;

  for (const entry of readdirSync(sourceDir)) {
    if (entry === '.DS_Store') continue;

    const sourcePath = join(sourceDir, entry);
    const destPath = join(destDir, entry);
    if (statSync(sourcePath).isDirectory()) {
      copyTemplateDirectoryIfMissing({ sourceDir: sourcePath, destDir: destPath, projectPath, copied, skipped });
      continue;
    }

    copyTemplateFileIfMissing({ sourcePath, destPath, projectPath, copied, skipped });
  }
}

function copyTemplateFileIfMissing({ sourcePath, destPath, projectPath, copied, skipped }) {
  if (!existsSync(sourcePath)) return;

  const relativeDest = relative(projectPath, destPath);
  if (existsSync(destPath)) {
    skipped.push(relativeDest);
    return;
  }

  mkdirSync(dirname(destPath), { recursive: true });
  copyFileSync(sourcePath, destPath);
  copied.push(relativeDest);
}

function renderSettingsTemplate(templatePath, variables) {
  const raw = readFileSync(templatePath, 'utf-8')
    .replace(/{{PROJECT_PATH}}/g, escapeJsonStringContent(variables.projectPath))
    .replace(/{{SKILL_PATH}}/g, escapeJsonStringContent(variables.skillDir));
  return JSON.parse(raw);
}

function escapeJsonStringContent(value) {
  return JSON.stringify(String(value)).slice(1, -1);
}

function mergeSettings(existing, template) {
  const merged = {
    ...existing,
    mcpServers: { ...(existing.mcpServers || {}) },
    hooks: { ...(existing.hooks || {}) },
    permissions: {
      allow: [...(existing.permissions?.allow || [])],
      deny: [...(existing.permissions?.deny || [])]
    }
  };

  for (const [name, config] of Object.entries(template.mcpServers || {})) {
    if (!merged.mcpServers[name]) {
      merged.mcpServers[name] = config;
    }
  }

  for (const [event, hooks] of Object.entries(template.hooks || {})) {
    const existingHooks = merged.hooks[event] || [];
    merged.hooks[event] = [...existingHooks];
    for (const hook of hooks) {
      const duplicate = existingHooks.some(existingHook => existingHook.matcher === hook.matcher && existingHook.command === hook.command);
      if (!duplicate) {
        merged.hooks[event].push(hook);
      }
    }
  }

  for (const key of ['allow', 'deny']) {
    for (const value of template.permissions?.[key] || []) {
      if (!merged.permissions[key].includes(value)) {
        merged.permissions[key].push(value);
      }
    }
  }

  return merged;
}
