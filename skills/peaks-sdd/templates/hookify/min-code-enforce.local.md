---
name: min-code-enforce
enabled: true
event: PostToolUse
action: warn
---

## 最小代码量强制 Hook

在每次 Write/Edit 操作后，检查新增代码是否遵循「最小代码量」原则。禁止不必要的抽象、冗余和过度工程。

### 检查规则

| 问题类型 | 严重级别 | 动作 |
|---------|---------|------|
| 未使用的 import | HIGH | ⚠️ 警告，必须移除 |
| 未使用的变量/函数 | HIGH | ⚠️ 警告，必须移除 |
| 冗余注释（解释显而易见的代码） | MEDIUM | ℹ️ 提示，删除注释 |
| 过度抽象（一次性使用的 helper） | MEDIUM | ⚠️ 警告，内联简化 |
| 重复代码（copy-paste） | HIGH | ⚠️ 警告，必须提取复用 |
| YAGNI（为未来预留的代码） | HIGH | ⚠️ 警告，删除未使用的功能 |

### 匹配规则

- 只检查 `.ts` `.tsx` `.js` `.jsx` 文件
- 跳过 `node_modules/` 目录
- 跳过 `generated/` 目录

### 警告输出格式

```
🚨 [MinCodeCheck] src/utils/helper.ts:45
   ⚠️ 检测到冗余代码

   45 | // Helper function to calculate sum
   46 | // This is used to add two numbers
   46 | // Added by developer ABC on 2024-01-01
   46 | function calculateSum(a, b) {
   47 |   return a + b;
   47 | }

   ℹ️ 问题: 注释冗余，函数可直接内联
   ✅ 建议: 删除注释，或在调用处直接内联
```

### 具体检查项

#### 1. 未使用的 Import

```typescript
// ❌ 错误
import { useState, useEffect } from 'react';
import { unusedFunction } from './utils';  // 未使用

// ✅ 正确
import { useState } from 'react';
```

#### 2. 未使用的变量

```typescript
// ❌ 错误
const unused = 'hello';
const result = doSomething();

// ✅ 正确
const result = doSomething();
```

#### 3. 冗余注释

```typescript
// ❌ 错误 - 解释显而易见的代码
// Add two numbers
function add(a: number, b: number): number {
  return a + b;  // Return the sum
}

// ✅ 正确 - 无注释或只保留关键解释
function add(a: number, b: number): number {
  return a + b;
}
```

#### 4. 过度抽象

```typescript
// ❌ 错误 - 只使用一次的 helper
function formatUserName(name: string): string {
  return name.trim().toLowerCase();
}
const displayName = formatUserName(userName);

// ✅ 正确 - 直接内联
const displayName = userName.trim().toLowerCase();
```

#### 5. YAGNI - 为未来预留

```typescript
// ❌ 错误 - 预留但未使用的接口
interface UserConfig {
  name: string;
  email: string;
  // future: phone number will be added later
  // future: address will be added later
}

// ✅ 正确 - 只定义当前需要的
interface UserConfig {
  name: string;
  email: string;
}
```

### 代码质量检查清单

在提交前检查：
- [ ] 所有 import 都有使用
- [ ] 所有变量/函数都被调用
- [ ] 没有冗余注释
- [ ] 没有 copy-paste 代码（超过 3 行相似代码应提取）
- [ ] 没有为未来预留的代码
- [ ] 简单逻辑直接内联，不抽象

### 自动检测工具

```bash
# ESLint 检测未使用变量
npx eslint --no-eslintrc --rule '{ "no-unused-vars": "error" }' src/

# TypeScript 检测未使用导出
npx tsc --noUnusedLocals

# knip 检测死代码
npx knip
```

### 正确的抽象时机

只有当满足以下条件时才抽象：

| 条件 | 说明 |
|------|------|
| **重复 3 次以上** | 同样的逻辑出现多次才提取 |
| **意图不明显** | 逻辑复杂，需要命名来解释 |
| **稳定接口** | 已经被其他模块依赖 |

不要在第一次出现时就抽象！