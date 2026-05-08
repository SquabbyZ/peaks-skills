#!/usr/bin/env node
/**
 * 配置同步脚本
 * 当项目配置改变时，自动更新 peaks-sdd 生成的相关文件
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 需要同步的文件类型
const SYNC_TARGETS = {
  'package.json': {
    parser: 'json',
    updates: ['dependencies', 'devDependencies']
  },
  'tsconfig.json': {
    parser: 'json',
    updates: ['compilerOptions']
  },
  '.env': {
    parser: 'env',
    updates: []
  },
  'vite.config.js': {
    parser: 'js',
    updates: []
  },
  'next.config.js': {
    parser: 'js',
    updates: []
  }
};

// 读取 package.json
function readPackageJson(projectPath) {
  const path = join(projectPath, 'package.json');
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf-8'));
  }
  return null;
}

// 提取技术栈变化
function detectTechStackChanges(oldPkg, newPkg) {
  const changes = {
    added: [],
    removed: [],
    changed: []
  };

  const oldDeps = oldPkg ? { ...oldPkg.dependencies, ...oldPkg.devDependencies } : {};
  const newDeps = newPkg ? { ...newPkg.dependencies, ...newPkg.devDependencies } : {};

  // 检测新增依赖
  for (const [key, value] of Object.entries(newDeps)) {
    if (!oldDeps[key]) {
      changes.added.push(key);
    }
  }

  // 检测移除依赖
  for (const [key] of Object.entries(oldDeps)) {
    if (!newDeps[key]) {
      changes.removed.push(key);
    }
  }

  return changes;
}

// 更新 CLAUDE.md 中的技术栈描述
function updateClaudeMd(projectPath, pkg) {
  const path = join(projectPath, 'CLAUDE.md');
  if (!existsSync(path)) return null;

  let content = readFileSync(path, 'utf-8');

  // 提取关键依赖
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const techStack = {
    frontend: deps.react ? 'React' : deps.vue ? 'Vue' : deps.next ? 'Next.js' : null,
    ui: deps.antd ? 'Ant Design' : deps['@mui/material'] ? 'Material UI' : deps['@chakra-ui/react'] ? 'Chakra UI' : null,
    backend: deps['@nestjs/core'] ? 'NestJS' : deps.express ? 'Express' : null,
    database: deps.prisma ? 'Prisma' : deps.typeorm ? 'TypeORM' : null
  };

  // 如果内容已包含技术栈且无变化，不更新
  const existingTech = techStack.frontend || techStack.backend;
  if (content.includes('技术栈') && existingTech) {
    console.log('  ℹ️  CLAUDE.md 技术栈无变化，跳过');
    return null;
  }

  // 添加技术栈信息
  const techSection = `\n## 技术栈\n`;
  if (techStack.frontend) content += `${techSection}- 前端: ${techStack.frontend}`;
  if (techStack.ui) content += `\n- UI: ${techStack.ui}`;
  if (techStack.backend) content += `\n- 后端: ${techStack.backend}`;
  if (techStack.database) content += `\n- 数据库: ${techStack.database}`;

  writeFileSync(path, content, 'utf-8');
  console.log('  ✅ 已更新 CLAUDE.md');
  return path;
}

// 更新 agents 配置中的技术栈变量
function updateAgentConfigs(projectPath, pkg) {
  const agentsDir = join(projectPath, '.claude/agents');
  if (!existsSync(agentsDir)) return [];

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  // 替换变量映射
  const variables = {
    '{{FRONTEND_FRAMEWORK}}': deps.react ? 'react' : deps.vue ? 'vue' : deps.next ? 'next' : '',
    '{{BACKEND_FRAMEWORK}}': deps['@nestjs/core'] ? 'nestjs' : deps.express ? 'express' : '',
    '{{UI_LIBRARY}}': deps.antd ? 'antd' : deps['@mui/material'] ? 'mui' : '',
    '{{HAS_DATABASE}}': deps.prisma || deps.typeorm ? 'postgresql' : 'none',
    '{{DEV_PORT}}': deps.vite ? '5173' : deps.webpack ? '8080' : '3000'
  };

  const updated = [];

  // 遍历所有 agent 文件
  const files = readdirSync(agentsDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const filePath = join(agentsDir, file);
    let content = readFileSync(filePath, 'utf-8');
    let changed = false;

    for (const [varName, value] of Object.entries(variables)) {
      if (content.includes(varName)) {
        content = content.replace(new RegExp(varName, 'g'), value);
        changed = true;
      }
    }

    if (changed) {
      writeFileSync(filePath, content, 'utf-8');
      updated.push(file);
    }
  }

  if (updated.length > 0) {
    console.log(`  ✅ 已更新 agents: ${updated.join(', ')}`);
  }

  return updated;
}

// 同步 .peaks/ 目录中的配置引用
function syncPeaksReferences(projectPath, changes) {
  const peaksDir = join(projectPath, '.peaks');
  if (!existsSync(peaksDir)) return [];

  const updated = [];

  // 遍历 .peaks/ 下的所有 md 文件
  const mdFiles = getAllMdFiles(peaksDir);

  for (const file of mdFiles) {
    let content = readFileSync(file, 'utf-8');
    let changed = false;

    // 更新依赖引用
    if (changes.added.length > 0) {
      for (const dep of changes.added) {
        if (content.includes(dep)) {
          console.log(`    ℹ️  ${basename(file)} 引用了新依赖: ${dep}`);
        }
      }
    }

    if (changed) {
      writeFileSync(file, content, 'utf-8');
      updated.push(file);
    }
  }

  return updated;
}

// 递归获取所有 md 文件
function getAllMdFiles(dir, files = []) {
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && !entry.startsWith('.')) {
      getAllMdFiles(fullPath, files);
    } else if (entry.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

// 生成同步报告
function generateSyncReport(projectPath, changes, updatedFiles) {
  const report = {
    timestamp: new Date().toISOString(),
    project: projectPath,
    changes,
    updatedFiles,
    summary: {
      depsAdded: changes.added.length,
      depsRemoved: changes.removed.length,
      filesUpdated: updatedFiles.length
    }
  };

  const reportPath = join(projectPath, '.peaks/reports/config-sync-report.json');
  const reportDir = dirname(reportPath);

  if (!existsSync(reportDir)) {
    require('fs').mkdirSync(reportDir, { recursive: true });
  }

  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n📄 同步报告: ${reportPath}`);

  return report;
}

// 执行同步
async function sync(projectPath) {
  console.log(`\n🔄 配置同步: ${projectPath}\n`);

  // 读取当前 package.json
  const currentPkg = readPackageJson(projectPath);

  // 尝试读取旧的 package.json.bak
  const backupPath = join(projectPath, 'package.json.bak');
  const oldPkg = existsSync(backupPath)
    ? JSON.parse(readFileSync(backupPath, 'utf-8'))
    : null;

  // 检测变化
  const changes = detectTechStackChanges(oldPkg, currentPkg);

  if (changes.added.length === 0 && changes.removed.length === 0) {
    console.log('✅ 无配置变化，无需同步');
    return;
  }

  console.log('📦 检测到配置变化:');
  if (changes.added.length > 0) {
    console.log(`  + 新增: ${changes.added.join(', ')}`);
  }
  if (changes.removed.length > 0) {
    console.log(`  - 移除: ${changes.removed.join(', ')}`);
  }

  // 执行更新
  const updatedFiles = [];

  console.log('\n🔧 执行同步...');

  // 1. 更新 CLAUDE.md
  const claudeUpdated = updateClaudeMd(projectPath, currentPkg);
  if (claudeUpdated) updatedFiles.push(claudeUpdated);

  // 2. 更新 agents 配置
  const agentsUpdated = updateAgentConfigs(projectPath, currentPkg);
  updatedFiles.push(...agentsUpdated);

  // 3. 同步 .peaks/ 引用
  const peaksUpdated = syncPeaksReferences(projectPath, changes);
  updatedFiles.push(...peaksUpdated);

  // 4. 备份新的 package.json
  writeFileSync(backupPath, JSON.stringify(currentPkg, null, 2), 'utf-8');
  console.log('  ✅ 已备份 package.json');

  // 生成报告
  generateSyncReport(projectPath, changes, updatedFiles);

  console.log('\n✅ 同步完成!');
  if (updatedFiles.length > 0) {
    console.log(`   更新了 ${updatedFiles.length} 个文件`);
  }
}

// 入口
const projectPath = process.argv[2] || process.cwd();
const command = process.argv[3];

if (command === 'sync') {
  await sync(projectPath);
} else if (command === 'check') {
  const pkg = readPackageJson(projectPath);
  if (pkg) {
    console.log('\n📦 当前技术栈:');
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps.react) console.log('  - React');
    if (deps.vue) console.log('  - Vue');
    if (deps.next) console.log('  - Next.js');
    if (deps['@nestjs/core']) console.log('  - NestJS');
    if (deps.antd) console.log('  - Ant Design');
    if (deps.prisma) console.log('  - Prisma');
  } else {
    console.log('❌ 未找到 package.json');
  }
} else {
  console.log(`
🔄 配置同步脚本

用法:
  node scripts/sync-config.js [项目路径] sync   # 同步配置变化
  node scripts/sync-config.js [项目路径] check  # 检查当前配置

示例:
  node scripts/sync-config.js . sync
  node scripts/sync-config.js /path/to/project check

说明:
  当 package.json 改变时，自动更新:
  - CLAUDE.md 中的技术栈描述
  - .claude/agents/ 中的 agent 配置变量
  - .peaks/ 中的相关引用
  `);
}

export { sync, detectTechStackChanges };