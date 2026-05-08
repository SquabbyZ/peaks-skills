#!/usr/bin/env node
/**
 * Test Gate Script - 测试门禁脚本
 * 检查功能、性能、安全、高并发测试是否全部通过
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// 默认项目路径
const PROJECT_ROOT = process.argv[2] || '.';

// 配置文件路径
const CONFIG_PATH = join(PROJECT_ROOT, '.peaks/config/test-gate.json');
const REPORT_PATH = join(PROJECT_ROOT, '.peaks/reports/test-report.json');

// 默认阈值配置
const DEFAULT_CONFIG = {
  functionality: {
    minCoverage: 80,
    maxFailures: 0
  },
  performance: {
    maxLCP: 2500,
    maxINP: 200,
    maxCLS: 0.1
  },
  security: {
    maxCritical: 0,
    maxHigh: 0
  },
  concurrency: {
    minQPS: 1000,
    maxErrorRate: 0.01,
    maxLatency: 500
  }
};

// 读取配置
function loadConfig() {
  if (existsSync(CONFIG_PATH)) {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  }
  return DEFAULT_CONFIG;
}

// 读取测试报告
function loadReport() {
  if (existsSync(REPORT_PATH)) {
    return JSON.parse(readFileSync(REPORT_PATH, 'utf-8'));
  }
  return null;
}

// 检查功能测试
function checkFunctionality(report, config) {
  const result = {
    name: '功能测试',
    passed: false,
    details: []
  };

  if (!report?.results?.functionality) {
    result.details.push('未找到功能测试报告');
    return result;
  }

  const func = report.results.functionality;
  const coverage = report.coverage?.functionality || 0;

  if (coverage < config.functionality.minCoverage) {
    result.details.push(`覆盖率 ${coverage}% (要求 >= ${config.functionality.minCoverage}%)`);
  } else if (func.failures > config.functionality.maxFailures) {
    result.details.push(`${func.failures} 个测试失败 (要求 <= ${config.functionality.maxFailures})`);
  } else {
    result.passed = true;
    result.details.push(`覆盖率 ${coverage}% (${func.passed} 通过)`);
  }

  return result;
}

// 检查性能测试
function checkPerformance(report, config) {
  const result = {
    name: '性能测试',
    passed: false,
    details: []
  };

  if (!report?.results?.performance) {
    result.details.push('未找到性能测试报告');
    return result;
  }

  const perf = report.results.performance.metrics || {};

  if (perf.lcp > config.performance.maxLCP) {
    result.details.push(`LCP ${perf.lcp}ms (要求 < ${config.performance.maxLCP}ms)`);
  } else {
    result.passed = true;
  }

  if (perf.inp > config.performance.maxINP) {
    result.details.push(`INP ${perf.inp}ms (要求 < ${config.performance.maxINP}ms)`);
  }

  if (perf.cls !== undefined && perf.cls > config.performance.maxCLS) {
    result.details.push(`CLS ${perf.cls} (要求 < ${config.performance.maxCLS})`);
  }

  if (result.passed) {
    result.details.unshift(`LCP ${perf.lcp}ms, INP ${perf.inp}ms`);
  }

  return result;
}

// 检查安全测试
function checkSecurity(report, config) {
  const result = {
    name: '安全测试',
    passed: false,
    details: []
  };

  if (!report?.results?.security) {
    result.details.push('未找到安全测试报告');
    return result;
  }

  const sec = report.results.security;
  const vulns = sec.vulnerabilities || [];

  const critical = vulns.filter(v => v.severity === 'CRITICAL').length;
  const high = vulns.filter(v => v.severity === 'HIGH').length;

  if (critical > config.security.maxCritical || high > config.security.maxHigh) {
    result.details.push(`${critical} CRITICAL, ${high} HIGH 漏洞`);
  } else {
    result.passed = true;
    result.details.push('0 vulnerabilities');
  }

  return result;
}

// 检查高并发测试
function checkConcurrency(report, config) {
  const result = {
    name: '高并发测试',
    passed: false,
    details: []
  };

  if (!report?.results?.concurrency) {
    result.details.push('未找到高并发测试报告');
    return result;
  }

  const conc = report.results.concurrency;

  if (conc.maxQPS < config.concurrency.minQPS) {
    result.details.push(`最大 QPS ${conc.maxQPS} (要求 >= ${config.concurrency.minQPS})`);
  }

  if (conc.errorRate > config.concurrency.maxErrorRate) {
    result.details.push(`错误率 ${(conc.errorRate * 100).toFixed(1)}% (要求 <= ${config.concurrency.maxErrorRate * 100}%)`);
  }

  if (conc.latency > config.concurrency.maxLatency) {
    result.details.push(`延迟 ${conc.latency}ms (要求 <= ${config.concurrency.maxLatency}ms)`);
  }

  if (result.details.length === 0) {
    result.passed = true;
    result.details.push(`${conc.maxQPS} QPS, 错误率 ${(conc.errorRate * 100).toFixed(1)}%, 延迟 ${conc.latency}ms`);
  }

  return result;
}

// 主检查函数
function runGateCheck() {
  console.log('\n🚨 Test Gate - 测试门禁\n');
  console.log('='.repeat(50));

  const config = loadConfig();
  const report = loadReport();

  if (!report) {
    console.log('\n❌ 未找到测试报告 (.peaks/reports/test-report.json)\n');
    console.log('💡 请先运行测试并生成报告:\n');
    console.log('  npm test -- --coverage  # 生成功能测试报告');
    console.log('  npx lighthouse ...      # 生成性能测试报告');
    console.log('  npm audit               # 生成安全测试报告');
    console.log('  k6 run ...              # 生成高并发测试报告\n');
    process.exit(1);
  }

  // 执行各项检查
  const checks = [
    checkFunctionality(report, config),
    checkPerformance(report, config),
    checkSecurity(report, config),
    checkConcurrency(report, config)
  ];

  // 输出结果
  console.log('\n📊 测试结果:\n');

  let allPassed = true;
  for (const check of checks) {
    const status = check.passed ? '✅' : '❌';
    console.log(`  ${status} ${check.name}: ${check.details.join(', ')}`);
    if (!check.passed) {
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(50));

  if (allPassed) {
    console.log('\n✅ 测试门禁全部通过\n');
    process.exit(0);
  } else {
    console.log('\n❌ 测试门禁未通过\n');
    console.log('💡 修复建议:');
    for (const check of checks) {
      if (!check.passed) {
        console.log(`  - ${check.name}: ${check.details.join(', ')}`);
      }
    }
    console.log('');
    process.exit(1);
  }
}

// 输出帮助
function help() {
  console.log(`
🚨 Test Gate - 测试门禁脚本

用法:
  node test-gate.mjs [项目路径]

示例:
  node test-gate.mjs .
  node test-gate.mjs ../my-project

检查项:
  ✅ 功能测试: 覆盖率 >= 80%, 无失败
  ✅ 性能测试: LCP < 2.5s, INP < 200ms, CLS < 0.1
  ✅ 安全测试: 0 CRITICAL/HIGH 漏洞
  ✅ 高并发测试: >= 1000 QPS, 错误率 < 1%, 延迟 < 500ms

配置:
  在 .peaks/config/test-gate.json 中自定义阈值

报告位置:
  .peaks/reports/test-report.json
`);
}

// 入口
const command = process.argv[3];

if (!command || command === 'check') {
  runGateCheck();
} else if (command === 'help') {
  help();
} else {
  help();
  process.exit(1);
}

export { checkFunctionality, checkPerformance, checkSecurity, checkConcurrency };