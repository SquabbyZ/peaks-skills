#!/usr/bin/env node
/**
 * OpenSpec CLI Wrapper - OpenSpec 工作流封装脚本
 *
 * 提供简单的接口让 Agent 调用 OpenSpec 功能
 *
 * 使用方式:
 *   node openspec.mjs <command> [args...]
 *
 * 示例:
 *   node openspec.mjs init
 *   node openspec.mjs propose "添加登录功能"
 *   node openspec.mjs specs
 *   node openspec.mjs apply
 *   node openspec.mjs archive
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// OpenSpec 命令映射
const OPENSPEC_COMMANDS = {
  // 初始化 OpenSpec 项目
  init: {
    desc: '初始化 OpenSpec 项目',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'init']
  },

  // 创建变更提案
  propose: {
    desc: '创建变更提案',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'propose'],
    usage: 'node openspec.mjs propose "<变更描述>"'
  },

  // 编写规格
  specs: {
    desc: '编写或更新规格文档',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'specs']
  },

  // 技术设计
  design: {
    desc: '进行技术设计评审',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'design']
  },

  // 任务拆分
  tasks: {
    desc: '拆分和分配任务',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'tasks']
  },

  // 实施任务
  apply: {
    desc: '实施任务',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'apply']
  },

  // 快速填充（填充所有 artifacts）
  ff: {
    desc: '快速填充所有 artifacts',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'ff']
  },

  // 同步变更到 specs
  sync: {
    desc: '同步变更到规格文档',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'sync']
  },

  // 归档并合并到 specs
  archive: {
    desc: '归档变更并合并到规格文档',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'archive']
  },

  // 验证实施结果
  verify: {
    desc: '验证实施结果',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'verify']
  },

  // 查看所有变更
  changes: {
    desc: '列出所有变更提案',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'changes']
  },

  // 探索代码库
  explore: {
    desc: '探索代码库结构',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'explore']
  }
};

/**
 * 执行 OpenSpec 命令
 */
function execOpenSpec(command, extraArgs = []) {
  return new Promise((resolve, reject) => {
    const cmdConfig = OPENSPEC_COMMANDS[command];

    if (!cmdConfig) {
      reject(new Error(`未知命令: ${command}\n可用命令: ${Object.keys(OPENSPEC_COMMANDS).join(', ')}`));
      return;
    }

    console.error(`[OpenSpec] ${cmdConfig.desc}...`);
    console.error(`[OpenSpec] 执行: ${cmdConfig.cmd} ${cmdConfig.args.join(' ')}`);

    const proc = spawn(cmdConfig.cmd, [...cmdConfig.args, ...extraArgs], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, stdout, stderr });
      } else {
        resolve({ success: false, stdout, stderr, code });
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * 检查 OpenSpec 是否可用
 */
async function checkOpenSpec() {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['-y', '@fission-ai/openspec@latest', '--version'], {
      stdio: 'pipe'
    });

    let version = '';
    proc.stdout.on('data', (data) => {
      version += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.error(`[OpenSpec] 版本: ${version.trim()}`);
        resolve(true);
      } else {
        console.error('[OpenSpec] 未安装，将在使用时自动安装');
        resolve(false);
      }
    });

    // 2秒超时
    setTimeout(() => {
      proc.kill();
      console.error('[OpenSpec] 检查超时，将在使用时自动安装');
      resolve(false);
    }, 2000);
  });
}

/**
 * 打印帮助信息
 */
function printHelp() {
  console.log(`
OpenSpec CLI Wrapper - OpenSpec 工作流封装脚本

使用方法:
  node openspec.mjs <command> [args...]

可用命令:
${Object.entries(OPENSPEC_COMMANDS)
  .map(([cmd, config]) => `  ${cmd.padEnd(12)} - ${config.desc}`)
  .join('\n')}

示例:
  # 初始化 OpenSpec 项目
  node openspec.mjs init

  # 创建变更提案
  node openspec.mjs propose "添加用户登录功能"

  # 查看所有变更
  node openspec.mjs changes

  # 实施任务
  node openspec.mjs apply

  # 归档变更
  node openspec.mjs archive

更多信息:
  https://github.com/fission-codes/openspec
`);
}

// 主入口
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  const command = args[0];
  const extraArgs = args.slice(1);

  // 先检查 OpenSpec 是否可用
  await checkOpenSpec();

  try {
    const result = await execOpenSpec(command, extraArgs);
    process.exit(result.success ? 0 : (result.code || 1));
  } catch (err) {
    console.error(`[OpenSpec] 错误: ${err.message}`);
    process.exit(1);
  }
}

main();
