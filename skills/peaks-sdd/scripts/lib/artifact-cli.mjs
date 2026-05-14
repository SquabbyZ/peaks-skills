import { realpathSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

export function isDirectCliExecution(importMetaUrl, argvPath = process.argv[1]) {
  if (!argvPath) return false;

  try {
    return realpathSync(resolve(argvPath)) === realpathSync(fileURLToPath(importMetaUrl));
  } catch {
    return resolve(argvPath) === resolve(fileURLToPath(importMetaUrl));
  }
}

export function printGateResults(checkResult, projectPath) {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║            peaks-sdd 产出物门禁检查                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`\x1b[90m项目路径: ${projectPath}\x1b[0m\n`);

  console.log('┌────┬────────────────────┬──────────────────┬───────────────────────────┐');
  console.log('│ #  │ 产出物             │ 状态             │ 说明                      │');
  console.log('├────┼────────────────────┼──────────────────┼───────────────────────────┤');

  for (const r of checkResult.results) {
    const name = r.name.padEnd(18).slice(0, 18);
    const details = r.details.slice(0, 23).padEnd(23);
    const displayId = (checkResult.results.indexOf(r) + 1).toString().padStart(2);
    const statusLabel = r.pass === true ? 'PASS' : (r.pass === false ? 'FAIL' : 'SKIP');
    console.log(`│ ${displayId} │ ${name} │ ${r.status} ${statusLabel} │ ${details} │`);
  }

  console.log('└────┴────────────────────┴──────────────────┴───────────────────────────┘');

  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│ 汇总:                                                        │');
  console.log(`│   检查项: ${checkResult.totalChecks}                                       │`);
  console.log(`│   通过: ${checkResult.passedChecks}                                        │`);
  console.log(`│   跳过: ${checkResult.skippedChecks || 0}                                        │`);
  console.log(`│   失败: ${checkResult.failedChecks}                                        │`);
  console.log('└─────────────────────────────────────────────────────────────┘');

  if (checkResult.failedChecks > 0) {
    console.log('\n\x1b[31m失败项目:\x1b[0m');
    for (const r of checkResult.results) {
      if (r.pass === false) {
        console.log(`  ${r.id}. ${r.name} → ${r.missingAction}`);
        if (r.files.length > 0) {
          for (const f of r.files.slice(0, 3)) {
            console.log(`     - ${f}`);
          }
          if (r.files.length > 3) {
            console.log(`     ... 还有 ${r.files.length - 3} 个文件`);
          }
        }
      }
    }
  }

  console.log('\n' + '═'.repeat(62));
  if (checkResult.passed) {
    console.log('\x1b[32m ✅ 门禁检查通过 — 可以进入 QA 环节\x1b[0m\n');
  } else {
    console.log('\x1b[31m ❌ 门禁检查未通过 — 必须补全缺失项\x1b[0m\n');
  }

  return checkResult.passed;
}
