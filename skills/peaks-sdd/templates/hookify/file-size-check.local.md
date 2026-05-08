---
name: file-size-check
enabled: true
event: PostToolUse
action: warn
---

## 文件大小检查 Hook

在每次 Write 操作后，检查文件行数是否超过 400 行。超过的文件应被拆分。

### 检查规则

| 文件行数 | 严重级别 | 动作 |
|---------|---------|------|
| > 800 行 | CRITICAL | 🚨 必须拆分，禁止超过 800 行 |
| > 400 行 | HIGH | ⚠️ 警告，建议拆分 |
| <= 400 行 | ✅ | 正常，无需操作 |

### 匹配规则

- 只检查 `.ts` `.tsx` `.js` `.jsx` `.css` `.scss` 文件
- 跳过 `node_modules/` 目录
- 跳过 `.d.ts` 声明文件
- 跳过 `generated/` 目录

### 警告输出格式

```
🚨 [FileSizeCheck] src/components/LargeComponent.tsx:523
   ⚠️ 文件超过 400 行 (实际: 523 行)
   ℹ️ 建议拆分为多个小文件

   📋 拆分建议:
   - LargeComponent.tsx → 拆分为:
   - LargeComponent.tsx (主组件, ~100行)
   - LargeComponentHeader.tsx (~80行)
   - LargeComponentBody.tsx (~150行)
   - LargeComponentFooter.tsx (~80行)
   - LargeComponent.utils.ts (~50行)

   💡 拆分原则:
   1. 每个文件单一职责
   2. 相关逻辑放在一起
   3. 公共类型提取到单独文件
   4. hooks 和 utilities 分离
```

### 拆分阈值说明

| 阈值 | 含义 | 处理方式 |
|------|------|---------|
| > 800 行 | 严重超限 | **必须拆分**，否则阻断提交 |
| 400-800 行 | 超限 | 警告，建议拆分，可选执行 |
| <= 400 行 | 正常 | 无需操作 |

### 推荐的代码组织

```
components/
├── UserProfile/           # 组件目录（PascalCase）
│   ├── index.ts           # 导出入口
│   ├── UserProfile.tsx    # 主组件（< 150 行）
│   ├── UserProfileHeader.tsx   # Header 部分
│   ├── UserProfileBody.tsx      # Body 部分
│   ├── UserProfileFooter.tsx    # Footer 部分
│   ├── useUserProfile.ts   # 相关 hooks
│   └── types.ts            # 类型定义
```

### 拆分检查清单

在拆分前，确认新文件：
- [ ] 职责单一（做一件事）
- [ ] 不超过 150 行（越短越好）
- [ ] 有清晰的命名
- [ ] 导出清晰（index.ts 重导出）
- [ ] 测试可独立进行

### 自动检测工具

可以使用以下工具辅助检测：
- `cloc` - 代码行数统计
- `ts-prune` - 未使用代码检测
- `knip` - 死代码检测

```bash
# 安装 cloc
brew install cloc

# 检测目录行数
cloc src/components --by-file --csv

# 输出示例:
# filename,language,blank,comment,code
# LargeComponent.tsx,TypeScript,23,45,523
```