#!/usr/bin/env node
/**
 * peaks-sdd 调度引擎
 * 运行时任务调度核心逻辑
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

/**
 * 任务调度引擎
 */
export class DispatcherEngine {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.agentsDir = join(projectPath, '.claude', 'agents');
    this.registry = null;
  }

  /**
   * 加载调度 Agent 配置
   */
  loadDispatcherConfig() {
    const dispatcherPath = join(this.agentsDir, 'dispatcher.md');
    if (!existsSync(dispatcherPath)) {
      throw new Error('dispatcher.md not found. Run init.mjs first.');
    }
    return readFileSync(dispatcherPath, 'utf-8');
  }

  /**
   * 扫描项目模块结构
   */
  scanProjectStructure() {
    const packagesDir = join(this.projectPath, 'packages');
    const packages = [];
    const modules = this.scanModules(this.projectPath);

    if (existsSync(packagesDir)) {
      const entries = readdirSync(packagesDir);
      for (const entry of entries) {
        const pkgPath = join(packagesDir, entry);
        if (statSync(pkgPath).isDirectory()) {
          packages.push({
            name: entry,
            path: pkgPath,
            modules: this.scanModules(pkgPath)
          });
        }
      }
    }

    return {
      projectType: packages.length > 0 ? 'multi-package' : 'single-package',
      packages,
      modules
    };
  }

  /**
   * 扫描单个包内的模块
   */
  scanModules(pkgPath) {
    const modules = [];
    const possiblePaths = [
      { path: join(pkgPath, 'src', 'features'), type: 'features' },
      { path: join(pkgPath, 'src', 'app'), type: 'app-router' },
      { path: join(pkgPath, 'app'), type: 'app-router' },
      { path: join(pkgPath, 'src', 'pages'), type: 'pages' },
      { path: join(pkgPath, 'pages'), type: 'pages' },
      { path: join(pkgPath, 'src'), type: 'backend-module' }
    ];
    const seen = new Set();

    for (const { path, type } of possiblePaths) {
      if (!existsSync(path)) continue;

      const entries = readdirSync(path);
      for (const entry of entries) {
        if (entry.startsWith('_') || entry.startsWith('(')) continue;
        if (type === 'backend-module' && ['app', 'pages', 'features', 'components', 'hooks', 'styles'].includes(entry)) continue;

        const entryPath = join(path, entry);
        if (!statSync(entryPath).isDirectory() || seen.has(entryPath)) continue;

        seen.add(entryPath);
        modules.push({
          name: entry,
          path: entryPath,
          type
        });
      }
    }

    return modules;
  }

  /**
   * 分析任务涉及的模块
   * @param {string} taskDescription - 任务描述
   * @param {object} scanResult - 扫描结果
   * @returns {Array} 涉及的模块列表
   */
  analyzeTaskModules(taskDescription, scanResult) {
    const involvedModules = [];
    const taskLower = taskDescription.toLowerCase();

    // 关键词匹配
    const keywords = {
      'auth': ['auth', 'login', 'logout', 'register', 'permission', '权限', '登录'],
      'user': ['user', 'users', 'profile', '用户', '会员'],
      'order': ['order', 'orders', '订单'],
      'product': ['product', 'products', '商品', '产品'],
      'payment': ['payment', 'pay', '支付', '付款'],
      'ai-models': ['ai-model', 'ai-models', 'model', '模型', 'ai']
    };

    const scanEntries = [
      ...(scanResult.packages || []).flatMap(pkg => pkg.modules.map(mod => ({ mod, packageName: pkg.name }))),
      ...(scanResult.modules || []).map(mod => ({ mod, packageName: '' }))
    ];

    for (const { mod, packageName } of scanEntries) {
      const modLower = mod.name.toLowerCase();
      if (taskLower.includes(modLower)) {
        involvedModules.push({ ...mod, package: packageName });
        continue;
      }

      for (const [keyword, terms] of Object.entries(keywords)) {
        if (modLower.includes(keyword) || terms.some(t => taskLower.includes(t))) {
          const exists = involvedModules.find(m => m.name === mod.name && m.package === packageName);
          if (!exists) {
            involvedModules.push({ ...mod, package: packageName });
          }
        }
      }
    }

    return involvedModules;
  }

  /**
   * 生成执行计划
   * @param {Array} involvedModules - 涉及的模块
   * @returns {object} 执行计划
   */
  generateExecutionPlan(involvedModules) {
    // 独立模块可以并行
    const parallelModules = involvedModules.filter(m => !m.dependsOn);
    // 有依赖的串行执行
    const sequentialSteps = [];

    return {
      phases: [
        {
          phase: 1,
          type: 'parallel',
          modules: parallelModules.map(m => `${m.package}/${m.name}`)
        }
      ],
      totalModules: involvedModules.length,
      parallelCount: parallelModules.length
    };
  }

  /**
   * 获取模块 Agent 配置路径
   */
  getModuleAgentPath(module, agentType = 'sub-agent') {
    const fallbackAgent = module.type?.includes('backend') ? 'backend-child.md' : 'frontend-child.md';
    const possiblePaths = [
      join(this.agentsDir, `${module.package}-${module.name}-agent.md`),
      join(this.agentsDir, `${module.name}-agent.md`),
      join(this.agentsDir, module.package || '', `${module.name}-agent.md`),
      join(this.agentsDir, fallbackAgent)
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path;
      }
    }

    return null;
  }

  /**
   * 加载模块 Agent 配置
   */
  loadModuleAgent(module) {
    const agentPath = this.getModuleAgentPath(module);
    if (!agentPath) {
      return null;
    }
    return {
      path: agentPath,
      name: basename(agentPath, '.md'),
      content: readFileSync(agentPath, 'utf-8')
    };
  }

  /**
   * 生成任务调度报告
   */
  generateDispatchReport(taskDescription, scanResult, involvedModules, executionPlan) {
    let report = `# 任务调度报告\n\n`;
    report += `**任务**: ${taskDescription}\n\n`;
    report += `**项目类型**: ${scanResult.projectType}\n\n`;
    report += `**检测到的模块**:\n`;
    for (const mod of involvedModules) {
      report += `- ${mod.package}/${mod.name} (${mod.type})\n`;
    }
    report += `\n**执行计划**:\n`;
    report += `- 总模块数: ${executionPlan.totalModules}\n`;
    report += `- 可并行: ${executionPlan.parallelCount}\n`;
    for (const phase of executionPlan.phases) {
      report += `- Phase ${phase.phase}: ${phase.type} - ${phase.modules.join(', ')}\n`;
    }
    return report;
  }
}

/**
 * 调度入口函数
 * @param {string} projectPath - 项目路径
 * @param {string} taskDescription - 任务描述
 * @returns {object} 调度结果
 */
export function dispatch(projectPath, taskDescription) {
  const engine = new DispatcherEngine(projectPath);

  // 加载 dispatcher 配置
  engine.loadDispatcherConfig();

  // 扫描项目结构
  const scanResult = engine.scanProjectStructure();

  // 分析任务涉及的模块
  const involvedModules = engine.analyzeTaskModules(taskDescription, scanResult);

  // 生成执行计划
  const executionPlan = engine.generateExecutionPlan(involvedModules);

  // 生成调度报告
  const report = engine.generateDispatchReport(taskDescription, scanResult, involvedModules, executionPlan);

  return {
    scanResult,
    involvedModules,
    executionPlan,
    report
  };
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const projectPath = process.argv[2] || process.cwd();
  const taskDescription = process.argv[3] || '未知任务';

  console.log('\n\x1b[1m\x1b[36m🚀 任务调度引擎\x1b[0m\n');
  console.log(`\x1b[90m   项目: ${projectPath}\x1b[0m`);
  console.log(`\x1b[90m   任务: ${taskDescription}\x1b[0m\n`);

  try {
    const result = dispatch(projectPath, taskDescription);
    console.log(result.report);
    console.log('\n\x1b[32m✅ 调度完成\x1b[0m\n');
  } catch (error) {
    console.error(`\x1b[31m❌ 调度失败: ${error.message}\x1b[0m`);
    process.exit(1);
  }
}