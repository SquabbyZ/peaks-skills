#!/usr/bin/env node
/**
 * peaks-sdd 技术栈检测模块
 * 检测项目技术栈并生成配置
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * 扫描目录结构（用于显示项目树）
 * @param {string} dirPath - 目录路径
 * @param {number} depth - 当前深度
 * @param {number} maxDepth - 最大深度
 * @returns {Array} 目录结构数组
 */
function scanDirectoryStructure(dirPath, depth = 0, maxDepth = 3) {
  const result = [];
  if (depth >= maxDepth) return result;

  try {
    const entries = readdirSync(dirPath);
    const items = [];

    for (const entry of entries) {
      // 跳过 node_modules 和隐藏目录（但保留 .claude 等重要隐藏目录）
      if (entry === 'node_modules' || entry === '.git') continue;
      if (entry.startsWith('.') && entry !== '.claude' && entry !== '.peaks') continue;

      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        items.push({ name: entry, isDir: true, path: fullPath });
      } else {
        items.push({ name: entry, isDir: false, path: fullPath });
      }
    }

    // 排序：目录在前，文件在后
    items.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const item of items) {
      result.push({ name: item.name, isDir: item.isDir, depth });
      if (item.isDir) {
        const children = scanDirectoryStructure(item.path, depth + 1, maxDepth);
        result.push(...children);
      }
    }
  } catch (e) {
    // 忽略无法读取的目录
  }

  return result;
}

/**
 * 将目录结构转换为 Markdown 树格式
 * @param {Array} structure - 目录结构数组
 * @param {number} maxShowDepth - 最大显示深度
 * @returns {string} Markdown 树格式字符串
 */
function toMarkdownTree(structure, maxShowDepth = 3) {
  if (!structure || structure.length === 0) return '';

  // 为每个元素计算是否是其父节点的最后一个子元素
  const itemsWithContext = [];
  for (let i = 0; i < structure.length; i++) {
    const item = structure[i];
    // 找到下一个深度 <= 当前深度的元素，当前元素就是该深度的最后一个
    let isLast = true;
    for (let j = i + 1; j < structure.length; j++) {
      if (structure[j].depth <= item.depth) {
        isLast = false;
        break;
      }
    }
    // 如果没有更深层的元素了，也是最后一个
    if (i === structure.length - 1) isLast = true;

    itemsWithContext.push({ ...item, isLast });
  }

  const lines = [];

  for (const item of itemsWithContext) {
    // 构建缩进
    let indent = '';
    for (let d = 0; d < item.depth; d++) {
      // 找到当前深度的最后一个状态
      const parentLast = itemsWithContext.find(
        (ctx, idx) => ctx.depth === d && ctx.isLast === false &&
        itemsWithContext.indexOf(ctx) < itemsWithContext.indexOf(item)
      );
      // 检查该深度级别的父节点是否是最后一个
      let isParentLast = true;
      for (let j = 0; j < itemsWithContext.length; j++) {
        if (itemsWithContext[j].depth === d && itemsWithContext[j].isLast === false) {
          const nextItem = itemsWithContext[j + 1];
          if (nextItem && itemsWithContext.indexOf(item) > j) {
            isParentLast = false;
            break;
          }
        }
      }

      // 简化：只检查同一深度的元素
      const sameDepthItems = itemsWithContext.filter(ctx => ctx.depth === d);
      const currentIndex = sameDepthItems.indexOf(item);
      if (d < item.depth) {
        // 如果是当前项的祖先层级，检查该层级是否有非最后一个兄弟
        const ancestor = itemsWithContext.find(ctx => ctx.depth === d);
        if (ancestor) {
          // 检查是否有后续兄弟
          const laterSibling = itemsWithContext.some((ctx, idx) =>
            ctx.depth === d && !ctx.isLast && idx < itemsWithContext.indexOf(item)
          );
          indent += laterSibling ? '│   ' : '    ';
        } else {
          indent += '    ';
        }
      }
    }

    // 最后一级的缩进
    const prefix = item.isLast ? '└── ' : '├── ';
    const icon = item.isDir ? '📂' : '📄';
    lines.push(`${indent}${prefix}${icon} ${item.name}`);
  }

  return lines.join('\n');
}

/**
 * 扫描单个包的目录结构（用于 Monorepo）
 * @param {string} basePath - 根目录
 * @param {string} pkgName - 包名
 * @param {number} maxDepth - 最大深度
 * @returns {Array} 目录结构
 */
function scanPackageStructure(basePath, pkgName, maxDepth = 2) {
  const pkgPath = join(basePath, 'packages', pkgName);
  if (!existsSync(pkgPath)) return [];
  return scanDirectoryStructure(pkgPath, 0, maxDepth);
}

/**
 * 检测技术栈
 * @param {string} projectPath - 项目路径
 * @returns {object} 技术栈信息
 */
export function detectTechStack(projectPath) {
  const packageJsonPath = join(projectPath, 'package.json');
  const techStack = {
    frontend: null,
    frontendFramework: null,  // 具体框架（如 umi, next, nuxt）
    backend: null,
    ui: null,
    database: null,
    test: null,
    buildTool: null,          // 构建工具（vite, webpack, next）
    hasTauri: false,
    devPort: 3000,
    projectName: '',
    packages: {},  // 项目实际依赖
    isMonorepo: false,
    monorepoPackages: [],  // monorepo 子包路径列表
    packageDetails: {},  // 各子包的详细技术栈信息
    directoryStructure: []  // 目录结构（文件树）
  };

  // ========== 扫描项目目录结构 ==========
  techStack.directoryStructure = scanDirectoryStructure(projectPath);

  // ========== 检测 monorepo 并收集所有依赖 ==========
  let allDeps = {};

  if (existsSync(packageJsonPath)) {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    techStack.projectName = pkg.name || 'unknown-project';
    techStack.isMonorepo = !!(pkg.workspaces && pkg.workspaces.length > 0);

    // 优先从根目录收集
    allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // 如果是 monorepo，扫描 packages/ 下的依赖
    if (techStack.isMonorepo && existsSync(join(projectPath, 'packages'))) {
      const packagesDir = readdirSync(join(projectPath, 'packages'));
      for (const pkgName of packagesDir) {
        const pkgPath = join(projectPath, 'packages', pkgName, 'package.json');
        if (existsSync(pkgPath)) {
          try {
            const subPkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            const subDeps = { ...subPkg.dependencies, ...subPkg.devDependencies };
            allDeps = { ...allDeps, ...subDeps };  // 合并依赖
            techStack.monorepoPackages.push(pkgName);

            // 收集每个子包的详细技术栈信息
            techStack.packageDetails[pkgName] = {
              frontend: detectPackageFrontend(subPkg, join(projectPath, 'packages', pkgName)),
              backend: detectPackageBackend(subPkg),
              ui: detectPackageUI(subPkg),
              database: detectPackageDatabase(subPkg),
              buildTool: detectPackageBuildTool(subPkg, join(projectPath, 'packages', pkgName))
            };
          } catch (e) {
            // 忽略解析失败的 package.json
          }
        }
      }
    }

    techStack.packages = allDeps;

    // ========== 检测前端框架和具体框架 ==========
    // 优先通过配置文件检测具体框架
    if (existsSync(join(projectPath, '.umirc.ts')) ||
        existsSync(join(projectPath, '.umirc.js')) ||
        existsSync(join(projectPath, '.umirc.tsx')) ||
        existsSync(join(projectPath, '.umirc.jsx')) ||
        existsSync(join(projectPath, '.umirc.json')) ||
        existsSync(join(projectPath, 'umirc.ts'))) {
      techStack.frontend = 'react';
      techStack.frontendFramework = 'umi';
    } else if (existsSync(join(projectPath, 'next.config.js')) ||
               existsSync(join(projectPath, 'next.config.mjs')) ||
               existsSync(join(projectPath, 'next.config.ts'))) {
      techStack.frontend = 'next';
      techStack.frontendFramework = 'next';
    } else if (existsSync(join(projectPath, 'nuxt.config.ts')) ||
               existsSync(join(projectPath, 'nuxt.config.js'))) {
      techStack.frontend = 'vue';
      techStack.frontendFramework = 'nuxt';
    } else if (existsSync(join(projectPath, 'svelte.config.js'))) {
      techStack.frontend = 'svelte';
      techStack.frontendFramework = 'svelte';
    }
    // 通过 package.json 检测（使用合并后的 allDeps）
    else if (allDeps.umi) {
      techStack.frontend = 'react';
      techStack.frontendFramework = 'umi';
    } else if (allDeps.next) {
      techStack.frontend = 'next';
      techStack.frontendFramework = 'next';
    } else if (allDeps.nuxt) {
      techStack.frontend = 'vue';
      techStack.frontendFramework = 'nuxt';
    } else if (allDeps.react) {
      techStack.frontend = 'react';
    } else if (allDeps.vue) {
      techStack.frontend = 'vue';
    }

    // ========== 检测构建工具 ==========
    // Umi.js 默认端口是 8000
    if (techStack.frontendFramework === 'umi') {
      techStack.buildTool = 'umi';
      techStack.devPort = 8000;
    } else if (existsSync(join(projectPath, 'vite.config.ts')) ||
        existsSync(join(projectPath, 'vite.config.js')) ||
        existsSync(join(projectPath, 'vite.config.mjs'))) {
      techStack.buildTool = 'vite';
      techStack.devPort = 5173;
    } else if (existsSync(join(projectPath, 'webpack.config.js')) ||
               existsSync(join(projectPath, 'webpack.config.ts'))) {
      techStack.buildTool = 'webpack';
      techStack.devPort = 8080;
    } else if (techStack.frontendFramework === 'next') {
      techStack.buildTool = 'next';
      techStack.devPort = 3000;
    } else if (techStack.frontendFramework === 'nuxt') {
      techStack.buildTool = 'nuxt';
      techStack.devPort = 3000;
    } else if (allDeps.vite) {
      techStack.buildTool = 'vite';
      techStack.devPort = 5173;
    } else if (allDeps.webpack) {
      techStack.buildTool = 'webpack';
      techStack.devPort = 8080;
    }

    // ========== 检测后端框架（使用合并后的 allDeps）==========
    if (allDeps['@nestjs/core']) techStack.backend = 'nestjs';
    else if (allDeps.express) techStack.backend = 'express';
    else if (allDeps.fastify) techStack.backend = 'fastify';
    else if (allDeps.koa || allDeps['koa__']) techStack.backend = 'koa';

    // ========== 检测 UI 库 ==========
    if (allDeps.antd || allDeps['@ant-design/react']) techStack.ui = 'antd';
    else if (allDeps['@mui/material']) techStack.ui = 'mui';
    else if (allDeps['@chakra-ui/react']) techStack.ui = 'chakra';
    else if (allDeps['@radix-ui/react-dialog'] || allDeps['@radix-ui/react-accordion']) techStack.ui = 'radix';
    else if (allDeps['shadcn'] || existsSync(join(projectPath, 'components.json'))) techStack.ui = 'shadcn';
    else if (allDeps['primevue']) techStack.ui = 'primevue';
    else if (allDeps['vuetify']) techStack.ui = 'vuetify';
    else if (allDeps['element-plus']) techStack.ui = 'element-plus';

    // ========== 检测数据库 ==========
    if (allDeps.prisma) techStack.database = 'postgresql';
    else if (allDeps.typeorm) techStack.database = 'postgresql';
    else if (allDeps.drizzle) techStack.database = 'postgresql';
    else if (allDeps.mongoose) techStack.database = 'mongodb';

    // ========== 检测测试框架 ==========
    if (allDeps['@playwright/test']) techStack.test = 'playwright';
    else if (allDeps.vitest) techStack.test = 'vitest';
    else if (allDeps.jest) techStack.test = 'jest';

    // ========== 检测 Tauri ==========
    if (existsSync(join(projectPath, 'src-tauri')) ||
        existsSync(join(projectPath, 'tauri.conf.json'))) {
      techStack.hasTauri = true;
    }
  }

  return techStack;
}

/**
 * 检测子包的前端框架
 */
function detectPackageFrontend(pkg, pkgPath) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps.react) return { framework: 'react', version: deps.react };
  if (deps.vue) return { framework: 'vue', version: deps.vue };
  if (deps.next) return { framework: 'next', version: deps.next };
  return { framework: null, version: null };
}

/**
 * 检测子包的后端框架
 */
function detectPackageBackend(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps['@nestjs/core']) return { framework: 'nestjs', version: deps['@nestjs/core'] };
  if (deps.express) return { framework: 'express', version: deps.express };
  if (deps.fastify) return { framework: 'fastify', version: deps.fastify };
  if (deps.koa) return { framework: 'koa', version: deps.koa };
  return { framework: null, version: null };
}

/**
 * 检测子包的 UI 库
 */
function detectPackageUI(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps.antd || deps['@ant-design/react']) return { framework: 'antd', version: deps.antd || deps['@ant-design/react'] };
  if (deps['@mui/material']) return { framework: 'mui', version: deps['@mui/material'] };
  if (deps['@chakra-ui/react']) return { framework: 'chakra', version: deps['@chakra-ui/react'] };
  if (deps['@radix-ui/react-dialog'] || deps['@radix-ui/react-accordion']) return { framework: 'radix', version: deps['@radix-ui/react-dialog'] || deps['@radix-ui/react-accordion'] };
  if (deps['primevue']) return { framework: 'primevue', version: deps['primevue'] };
  if (deps.vuetify) return { framework: 'vuetify', version: deps.vuetify };
  if (deps['element-plus']) return { framework: 'element-plus', version: deps['element-plus'] };
  return { framework: null, version: null };
}

/**
 * 检测子包的数据库
 */
function detectPackageDatabase(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps.prisma) return { framework: 'postgresql', version: deps.prisma };
  if (deps.typeorm) return { framework: 'postgresql', version: deps.typeorm };
  if (deps.drizzle) return { framework: 'postgresql', version: deps.drizzle };
  if (deps.mongoose) return { framework: 'mongodb', version: deps.mongoose };
  return { framework: null, version: null };
}

/**
 * 检测子包的构建工具
 */
function detectPackageBuildTool(pkg, pkgPath) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps.vite) return { framework: 'vite', version: deps.vite };
  if (deps.webpack) return { framework: 'webpack', version: deps.webpack };
  return { framework: null, version: null };
}

/**
 * 打印技术栈信息
 * @param {object} techStack - 技术栈信息
 * @param {string} projectPath - 项目路径（用于扫描子包结构）
 */
export function printTechStack(techStack, projectPath = '') {
  const deps = techStack.packages || {};

  // 获取版本号的辅助函数
  const getVersion = (name) => {
    const v = deps[name];
    return v ? ` (\x1b[90mv${v}\x1b[0m)` : '';
  };

  console.log('\n\x1b[1m\x1b[36m📦\x1b[0m 检测到的技术栈:');

  if (techStack.isMonorepo) {
    // Monorepo 模式：显示结构信息
    console.log(`\x1b[90m  ├─ 项目类型: \x1b[33mMonorepo\x1b[0m`);
    console.log(`\x1b[90m  ├─ 子包数量: \x1b[32m${techStack.monorepoPackages.length} 个\x1b[0m`);
    console.log(`\x1b[90m  └─ 开发端口: \x1b[0m${techStack.devPort}`);

    console.log('\n\x1b[1m\x1b[36m📦\x1b[0m 子包详情:');
    for (let i = 0; i < techStack.monorepoPackages.length; i++) {
      const pkgName = techStack.monorepoPackages[i];
      const detail = techStack.packageDetails[pkgName];
      const isLast = i === techStack.monorepoPackages.length - 1;
      const prefix = isLast ? '└─' : '├─';

      console.log(`\x1b[90m  ${prefix} \x1b[36m${pkgName}\x1b[0m`);

      // 前端框架
      if (detail.frontend.framework) {
        console.log(`\x1b[90m  ${isLast ? ' ' : '│'}   ├─ 前端: \x1b[32m${detail.frontend.framework}\x1b[0m \x1b[90mv${detail.frontend.version}\x1b[0m`);
      }
      // 后端框架
      if (detail.backend.framework) {
        console.log(`\x1b[90m  ${isLast ? ' ' : '│'}   ├─ 后端: \x1b[32m${detail.backend.framework}\x1b[0m \x1b[90mv${detail.backend.version}\x1b[0m`);
      }
      // UI库
      if (detail.ui.framework) {
        console.log(`\x1b[90m  ${isLast ? ' ' : '│'}   ├─ UI: \x1b[32m${detail.ui.framework}\x1b[0m \x1b[90mv${detail.ui.version}\x1b[0m`);
      }
      // 数据库
      if (detail.database.framework) {
        console.log(`\x1b[90m  ${isLast ? ' ' : '│'}   ├─ 数据库: \x1b[32m${detail.database.framework}\x1b[0m \x1b[90mv${detail.database.version}\x1b[0m`);
      }
      // 构建工具
      if (detail.buildTool.framework) {
        console.log(`\x1b[90m  ${isLast ? ' ' : '│'}   └─ 构建: \x1b[32m${detail.buildTool.framework}\x1b[0m \x1b[90mv${detail.buildTool.version}\x1b[0m`);
      }
    }
  } else {
    // 单仓模式
    console.log(`\x1b[90m  ├─ 项目类型: \x1b[32m单仓\x1b[0m`);
    console.log(`\x1b[90m  ├─ 前端框架: \x1b[0m${techStack.frontend || '未检测到'}${techStack.frontendFramework ? ` (\x1b[33m${techStack.frontendFramework}\x1b[0m)` : ''}${getVersion(techStack.frontendFramework)}`);
    console.log(`\x1b[90m  ├─ 构建工具: \x1b[0m${techStack.buildTool || '未检测到'}${getVersion(techStack.buildTool)}`);
    console.log(`\x1b[90m  ├─ 后端: \x1b[0m${techStack.backend || '未检测到'}${getVersion('@nestjs/core')}`);
    console.log(`\x1b[90m  ├─ UI库: \x1b[0m${techStack.ui || '未检测到'}${getVersion(deps.antd ? 'antd' : techStack.ui === 'mui' ? '@mui/material' : techStack.ui)}`);
    console.log(`\x1b[90m  ├─ 数据库: \x1b[0m${techStack.database || '未检测到'}${getVersion('prisma')}`);
    console.log(`\x1b[90m  ├─ 测试: \x1b[0m${techStack.test || '未检测到'}${getVersion('@playwright/test')}`);
    console.log(`\x1b[90m  ├─ Tauri: \x1b[0m${techStack.hasTauri ? '\x1b[32m是\x1b[0m' : '\x1b[90m否\x1b[0m'}`);
    console.log(`\x1b[90m  └─ 开发端口: \x1b[0m${techStack.devPort}`);
  }

  // 显示项目目录结构
  if (techStack.directoryStructure && techStack.directoryStructure.length > 0) {
    console.log('\n\x1b[1m\x1b[36m📁\x1b[0m 项目目录结构:');

    if (techStack.isMonorepo) {
      // Monorepo 模式：分别显示根目录和各子包目录
      console.log('\n\x1b[90m─── \x1b[33m项目根目录\x1b[90m ───\x1b[0m');
      const rootTree = toMarkdownTree(techStack.directoryStructure);
      for (const line of rootTree.split('\n')) {
        console.log(`\x1b[90m${line}\x1b[0m`);
      }

      // 分别显示每个子包的目录结构
      console.log('\n\x1b[90m─── \x1b[33m子包目录\x1b[90m ───\x1b[0m');
      for (const pkgName of techStack.monorepoPackages) {
        console.log(`\n\x1b[36m📦 ${pkgName}\x1b[0m`);
        const pkgStructure = scanPackageStructure(projectPath, pkgName);
        if (pkgStructure.length > 0) {
          const pkgTree = toMarkdownTree(pkgStructure);
          for (const line of pkgTree.split('\n')) {
            console.log(`\x1b[90m${line}\x1b[0m`);
          }
        } else {
          console.log(`\x1b[90m  (空目录)\x1b[0m`);
        }
      }
    } else {
      // 单仓模式：直接显示目录树
      const tree = toMarkdownTree(techStack.directoryStructure);
      for (const line of tree.split('\n')) {
        console.log(`\x1b[90m${line}\x1b[0m`);
      }
    }
  }
}
