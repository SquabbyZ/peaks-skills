---
name: type-check
enabled: true
event: PostToolUse
action: warn
---

## TypeScript 类型检查 Hook

在每次 Edit/Write 操作后，检查 TypeScript 文件是否使用了 `any` 类型，并发出警告。

### 检查规则

| 检测内容 | 严重级别 | 动作 |
|---------|---------|------|
| `any` 类型声明 | HIGH | ⚠️ 警告，提示使用 `unknown` 或具体类型 |
| `as any` 类型断言 | HIGH | ⚠️ 警告，提示使用类型守卫 |
| `: any` 参数/返回值 | MEDIUM | ℹ️ 提示，建议添加类型注解 |
| 禁用的 `any` 模式 | CRITICAL | 🚨 阻断，建议修复后继续 |

### 匹配规则

- 只检查 `.ts` `.tsx` 文件
- 跳过 `node_modules/` 目录
- 跳过 `.d.ts` 声明文件（允许 any）
- 跳过 `generated/` 目录（自动生成代码）

### 警告输出格式

```
🚨 [TypeCheck] src/api/user.ts:15
   ⚠️ 禁止使用 'any' 类型
   ℹ️ 建议: 使用 'unknown' 然后进行类型收窄

   15 | function getErrorMessage(error: any) {
      |                                    ^^^
   ℹ️ 正确写法:
   function getErrorMessage(error: unknown): string {
     if (error instanceof Error) return error.message;
     return 'Unknown error';
   }
```

### TypeScript 配置

检查项目中的 `tsconfig.json` 是否启用了严格模式：

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 自动修复建议

| 问题 | 修复方案 |
|------|---------|
| `any` 类型 | → `unknown` + 类型守卫 |
| `as any` | → 类型守卫或类型断言 |
| 缺少参数类型 | → 添加明确的参数类型 |
| 缺少返回值类型 | → 添加明确的返回类型 |

### 可选：自动运行 tsc

如果项目配置了 `post-write` hook，可以自动运行 `tsc --noEmit` 检查：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "command": "tsc --noEmit --pretty false",
        "description": "Type-check after writing TypeScript files"
      }
    ]
  }
}
```

### 严重级别说明

| 级别 | 含义 | 是否阻断 |
|------|------|---------|
| CRITICAL | 安全漏洞或可能的数据丢失 | 是，需修复 |
| HIGH | 重大质量问题 | 警告，建议修复 |
| MEDIUM | 可维护性问题 | 提示，可选修复 |
| LOW | 风格建议 | 仅提醒 |

### 与 ESLint 配合

此 hook 可与项目的 ESLint 配置协同工作：

```json
// .eslintrc.json
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unsafe-type": "warn"
}
```

ESLint 规则比此 hook 更精确，建议同时启用 ESLint 以获得更好的类型安全保证。