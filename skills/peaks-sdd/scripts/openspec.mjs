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
// 注意: OpenSpec CLI 使用嵌套命令结构: openspec <resource> <action>
// 例如: openspec new change <name>, openspec archive <change-name>
const OPENSPEC_COMMANDS = {
  // 初始化 OpenSpec 项目
  init: {
    desc: '初始化 OpenSpec 项目',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'init']
  },

  // 创建变更提案: openspec new change <name>
  new: {
    desc: '创建新变更提案',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'new', 'change'],
    usage: 'node openspec.mjs new "变更名称"'
  },

  // propose 是 new change 的别名（兼容旧用法）
  propose: {
    desc: '创建新变更提案 (new change 的别名)',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'new', 'change'],
    usage: 'node openspec.mjs propose "变更名称"'
  },

  // 查看变更列表: openspec list (已废弃，用 openspec list)
  changes: {
    desc: '查看所有变更提案',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'list']
  },

  // 显示变更详情: openspec show <change-name>
  show: {
    desc: '显示变更详情',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'show'],
    usage: 'node openspec.mjs show "变更名称"'
  },

  // 验证变更: openspec validate <change-name>
  validate: {
    desc: '验证变更提案',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'validate'],
    usage: 'node openspec.mjs validate "变更名称"'
  },

  // 归档变更: openspec archive <change-name>
  archive: {
    desc: '归档变更并合并到规格文档',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'archive'],
    usage: 'node openspec.mjs archive "变更名称"'
  },

  // 查看规格列表: openspec list --specs
  specs: {
    desc: '查看所有规格文档',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'list', '--specs']
  },

  // spec 命令: openspec spec
  spec: {
    desc: '管理和查看规格文档',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'spec']
  },

  // view 命令: 交互式仪表盘
  view: {
    desc: '显示交互式仪表盘',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'view']
  },

  // status 命令: 查看状态
  status: {
    desc: '显示变更完成状态',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'status'],
    usage: 'node openspec.mjs status "变更名称"'
  },

  // instructions 命令: 输出创建 artifact 的指导
  instructions: {
    desc: '输出 artifact 创建指导',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'instructions'],
    usage: 'node openspec.mjs instructions "artifact名称"'
  },

  // schema 命令: 查看可用 schema
  schemas: {
    desc: '列出可用工作流 schema',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'schemas']
  },

  // update 命令: 更新 OpenSpec 指令文件
  update: {
    desc: '更新 OpenSpec 指令文件',
    cmd: 'npx',
    args: ['-y', '@fission-ai/openspec@latest', 'update']
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
