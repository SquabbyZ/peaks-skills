---
name: test-gate
enabled: true
event: PreToolUse
action: block
---

## 测试门禁 Hook (Test Gate)

在功能/性能/安全/高并发测试全部通过前，禁止合并或部署代码。

### 测试类型和要求

| 测试类型 | 覆盖率要求 | 必须通过 | 阻断条件 |
|---------|-----------|---------|---------|
| **功能测试** | >= 80% | ✅ | 任何功能测试失败 |
| **性能测试** | LCP < 2.5s, INP < 200ms | ✅ | 任何性能指标超标 |
| **安全测试** | 无 CRITICAL/HIGH 漏洞 | ✅ | 任何高危漏洞 |
| **高并发测试** (后端) | 1000+ 并发请求 | ✅ | 错误率 > 1% 或延迟 > 500ms |
| **E2E 测试** | 关键路径覆盖 | ✅ | 任何 E2E 测试失败 |

### 检测的命令模式

```javascript
// 触发阻断的命令
const BLOCKED_COMMANDS = [
  'npm test',
  'pnpm test',
  'npm run test:e2e',
  'pnpm test:e2e',
  'npm run deploy',
  'pnpm deploy',
  'git merge',
  'git push origin main',
  'gh pr merge'
];
```

### 测试报告要求

测试完成后必须生成报告到 `.peaks/reports/test-report.json`：

```json
{
  "timestamp": "2026-05-08T10:00:00Z",
  "coverage": {
    "functionality": 85,
    "performance": 92,
    "security": 100,
    "concurrency": 88
  },
  "results": {
    "functionality": { "passed": true, "failures": 0 },
    "performance": { "passed": true, "metrics": {...} },
    "security": { "passed": true, "vulnerabilities": [] },
    "concurrency": { "passed": true, "maxQPS": 1500, "errorRate": 0.01 }
  },
  "gateStatus": "passed" // 或 "failed"
}
```

### 阻断输出格式

```
🚨 [TestGate] 测试门禁未通过

📊 测试结果:
  ❌ 功能测试: 覆盖率 72% (要求 >= 80%)
     - src/api/user.test.ts: 3 个测试失败
     - src/utils/validation.test.ts: 1 个测试失败

  ❌ 性能测试: LCP 3.2s (要求 < 2.5s)
     - 首页 LCP: 3.2s
     - 列表页 INP: 280ms (要求 < 200ms)

  ✅ 安全测试: 通过 (0 vulnerabilities)

  ⚠️ 高并发测试: 错误率 2.3% (要求 <= 1%)
     - 500 并发: 0.5% 错误率
     - 1000 并发: 2.3% 错误率

💡 如何通过测试门禁:
  1. 补充功能测试用例，覆盖率达到 80%+
  2. 优化首页加载性能 (LCP < 2.5s)
  3. 修复高并发下的错误率问题

⏸️ 当前操作已阻断
```

### 通过输出格式

```
✅ [TestGate] 测试门禁全部通过

📊 测试结果:
  ✅ 功能测试: 覆盖率 85% (15/15 通过)
  ✅ 性能测试: LCP 1.8s, INP 120ms
  ✅ 安全测试: 0 vulnerabilities
  ✅ 高并发测试: 1000 并发，错误率 0.1%，延迟 120ms

🎉 所有测试已通过，允许合并/部署
```

### 自动化测试命令

```bash
# 功能测试
npm test -- --coverage

# 性能测试 (使用 Lighthouse)
npx lighthouse https://example.com --output=json --output-path=.peaks/reports/lighthouse.json

# 安全测试 (使用 npm audit)
npm audit --json > .peaks/security/audit.json

# 高并发测试 (使用 k6)
k6 run scripts/load-test.js --out json=.peaks/reports/k6.json
```

### 配置文件

在 `.peaks/config/test-gate.json` 中配置阈值：

```json
{
  "functionality": {
    "minCoverage": 80,
    "maxFailures": 0
  },
  "performance": {
    "maxLCP": 2500,
    "maxINP": 200,
    "maxCLS": 0.1
  },
  "security": {
    "maxCritical": 0,
    "maxHigh": 0
  },
  "concurrency": {
    "minQPS": 1000,
    "maxErrorRate": 0.01,
    "maxLatency": 500
  }
}
```

### 允许例外

1. **Hotfix**: `git commit -m "hotfix: 紧急修复"` 可延迟测试
2. **跳过特定检查**: 环境变量 `SKIP_PERF_TEST=true`

### 与 peaks-sdd 配合

```
/peaksfeat
  └── Phase 6: Review (CR + Security)
        ↓
      通过
        ↓
  Phase 7: QA (测试门禁)
        ↓
      功能测试 ✅
      性能测试 ✅
      安全测试 ✅
      高并发测试 ✅
        ↓
      全部通过 → 允许部署
      任一失败 → 阻断
```