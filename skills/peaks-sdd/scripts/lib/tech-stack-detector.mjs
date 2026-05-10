#!/usr/bin/env node
/**
 * peaks-sdd 技术栈检测模块
 * 检测项目技术栈并生成配置
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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
    packages: {}  // 项目实际依赖
  };

  if (existsSync(packageJsonPath)) {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    techStack.projectName = pkg.name || 'unknown-project';
    techStack.packages = deps;

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
    // 通过 package.json 检测
    else if (deps.umi) {
      techStack.frontend = 'react';
      techStack.frontendFramework = 'umi';
    } else if (deps.next) {
      techStack.frontend = 'next';
      techStack.frontendFramework = 'next';
    } else if (deps.nuxt) {
      techStack.frontend = 'vue';
      techStack.frontendFramework = 'nuxt';
    } else if (deps.react) {
      techStack.frontend = 'react';
    } else if (deps.vue) {
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
    } else if (pkg.devDependencies?.vite) {
      techStack.buildTool = 'vite';
      techStack.devPort = 5173;
    } else if (pkg.devDependencies?.webpack) {
      techStack.buildTool = 'webpack';
      techStack.devPort = 8080;
    }

    // ========== 检测后端框架 ==========
    if (deps['@nestjs/core']) techStack.backend = 'nestjs';
    else if (deps.express) techStack.backend = 'express';
    else if (deps.fastify) techStack.backend = 'fastify';
    else if (deps.koa || deps['koa__']) techStack.backend = 'koa';

    // ========== 检测 UI 库 ==========
    if (deps.antd || deps['@ant-design/react']) techStack.ui = 'antd';
    else if (deps['@mui/material']) techStack.ui = 'mui';
    else if (deps['@chakra-ui/react']) techStack.ui = 'chakra';
    else if (deps['@radix-ui/react-dialog'] || deps['@radix-ui/react-accordion']) techStack.ui = 'radix';
    else if (deps['shadcn'] || existsSync(join(projectPath, 'components.json'))) techStack.ui = 'shadcn';
    else if (deps['primevue']) techStack.ui = 'primevue';
    else if (deps['vuetify']) techStack.ui = 'vuetify';
    else if (deps['element-plus']) techStack.ui = 'element-plus';

    // ========== 检测数据库 ==========
    if (deps.prisma) techStack.database = 'postgresql';
    else if (deps.typeorm) techStack.database = 'postgresql';
    else if (deps.drizzle) techStack.database = 'postgresql';
    else if (deps.mongoose) techStack.database = 'mongodb';

    // ========== 检测测试框架 ==========
    if (deps['@playwright/test']) techStack.test = 'playwright';
    else if (deps.vitest) techStack.test = 'vitest';
    else if (deps.jest) techStack.test = 'jest';

    // ========== 检测 Tauri ==========
    if (existsSync(join(projectPath, 'src-tauri')) ||
        existsSync(join(projectPath, 'tauri.conf.json'))) {
      techStack.hasTauri = true;
    }
  }

  return techStack;
}

/**
 * 打印技术栈信息
 * @param {object} techStack - 技术栈信息
 */
export function printTechStack(techStack) {
  const deps = techStack.packages || {};

  // 获取版本号的辅助函数
  const getVersion = (name) => {
    const v = deps[name];
    return v ? ` (\x1b[90mv${v}\x1b[0m)` : '';
  };

  console.log('\n\x1b[1m\x1b[36m📦\x1b[0m 检测到的技术栈:');
  console.log(`\x1b[90m  ├─ 前端框架: \x1b[0m${techStack.frontend || '未检测到'}${techStack.frontendFramework ? ` (\x1b[33m${techStack.frontendFramework}\x1b[0m)` : ''}${getVersion(techStack.frontendFramework)}`);
  console.log(`\x1b[90m  ├─ 构建工具: \x1b[0m${techStack.buildTool || '未检测到'}${getVersion(techStack.buildTool)}`);
  console.log(`\x1b[90m  ├─ 后端: \x1b[0m${techStack.backend || '未检测到'}${getVersion('@nestjs/core')}`);
  console.log(`\x1b[90m  ├─ UI库: \x1b[0m${techStack.ui || '未检测到'}${getVersion(deps.antd ? 'antd' : techStack.ui === 'mui' ? '@mui/material' : techStack.ui)}`);
  console.log(`\x1b[90m  ├─ 数据库: \x1b[0m${techStack.database || '未检测到'}${getVersion('prisma')}`);
  console.log(`\x1b[90m  ├─ 测试: \x1b[0m${techStack.test || '未检测到'}${getVersion('@playwright/test')}`);
  console.log(`\x1b[90m  ├─ Tauri: \x1b[0m${techStack.hasTauri ? '\x1b[32m是\x1b[0m' : '\x1b[90m否\x1b[0m'}`);
  console.log(`\x1b[90m  └─ 开发端口: \x1b[0m${techStack.devPort}`);
}
