# Pixso-Code Sync 快速开始指南

## 什么是双向同步？

peaks-pixso-code-sync 技能支持 Pixso 设计稿与本地代码之间的**双向同步**：

```
┌─────────────┐                    ┌─────────────┐
│   Pixso     │  ← Pixso→代码 →    │   代码文件   │
│   设计稿     │  ← 代码→Pixso →    │  src/pages  │
└─────────────┘                    └─────────────┘
```

## 快速上手

### 场景 1：从 Pixso 设计生成代码

**当你有**：Pixso 中设计好的页面
**想要**：生成本地 React 代码文件

**操作步骤**：

1. 在 Pixso 中打开设计稿
2. 告诉 AI："从 Pixso 同步到代码"或"根据设计生成代码"
3. AI 会自动：
   - 获取 Pixso 设计稿的详细信息
   - 转换为 React + Tailwind CSS 代码
   - 保存到对应的文件路径
   - 添加同步注释和映射关系

**示例对话**：

```
用户：帮我把当前 Pixso 画布同步到 src/pages/index.tsx
AI：正在从 Pixso 同步设计到代码...
   - 获取 Pixso 节点 DSL
   - 解析设计元素和样式
   - 生成 React 组件代码
   - 保存到 src/pages/index.tsx
   - 同步完成！
```

### 场景 2：将代码更新同步到 Pixso

**当你有**：修改后的本地代码
**想要**：更新 Pixso 设计稿

**操作步骤**：

1. 打开要同步的代码文件
2. 告诉 AI："把代码同步到 Pixso"或"更新 Pixso 设计"
3. AI 会自动：
   - 读取代码文件
   - 解析 JSX 结构和 Tailwind 类名
   - 转换为 Pixso 设计元素
   - 更新或创建 Pixso 页面

**示例对话**：

```
用户：把 src/pages/index.tsx 同步到 Pixso
AI：正在将代码同步到 Pixso...
   - 读取代码文件
   - 解析 Tailwind CSS 类名
   - 转换为 Pixso 设计元素
   - 更新 Pixso 页面
   - 同步完成！
```

### 场景 3：保持双向一致性

**当你有**：代码和 Pixso 都有修改
**想要**：保持两者一致

**建议工作流**：

1. 先确定哪个是"权威来源"（设计稿 or 代码）
2. 选择一个方向进行同步
3. 小步迭代，频繁同步

**示例对话**：

```
用户：代码和 Pixso 都有修改，怎么保持同步？
AI：建议先确定同步方向：
   1. 如果设计稿是最新的 → 从 Pixso 同步到代码
   2. 如果代码是最新的 → 从代码同步到 Pixso
   你希望哪个方向？
```

## 触发词参考

使用以下关键词可以快速触发同步：

### Pixso→代码

- "从 Pixso 同步到代码"
- "根据设计生成代码"
- "更新代码"
- "从画布同步"
- "Pixso 设计转代码"
- "把设计应用到代码"

### 代码→Pixso

- "把代码同步到 Pixso"
- "更新 Pixso 设计"
- "代码转设计"
- "同步到画布"
- "更新设计稿"

### 通用

- "同步 Pixso"
- "双向同步"
- "保持设计和代码一致"

## 同步特性

### ✅ 自动处理

- **组件复用**：优先使用 Ant Design 和项目现有组件
- **样式转换**：Tailwind CSS 类名 ↔ Pixso 样式
- **交互状态**：hover、active 等状态自动转换
- **逻辑保护**：保留 useState、useEffect 等逻辑代码
- **代码格式化**：自动使用 Prettier 格式化
- **映射管理**：自动维护 Pixso 页面和代码文件的映射关系

### 🛡️ 安全保护

- **逻辑代码保护**：严禁删除包含业务逻辑的代码
- **冲突标记**：冲突时保留旧代码并添加 TODO 标记
- **版本备份**：同步前创建 Pixso 版本备份
- **注释保留**：保留代码注释和文档

## 同步示例

### 示例 1：简单的首页同步

**Pixso 设计**：

- 标题："Welcome to Our App"
- 副标题："Build with React and Tailwind CSS"
- 按钮："Get Started"

**同步后代码**：

```tsx
/*
 * Pixso Sync Information
 * Sync Time: 2026-03-28
 * Pixso Page: src/pages/index
 * Sync Direction: Pixso → Code
 */

import { memo } from 'react';
import { Button } from 'antd';

/**
 * Home Page Component
 * Corresponding to Pixso design: src/pages/index
 * Style source: Extracted from Pixso design
 * Layout: Centered flex column layout
 * Interactive elements: Get Started button
 */
const Home = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <h1 className="mb-4 text-4xl font-bold text-gray-800">
        Welcome to Our App
      </h1>
      <p className="mb-8 text-xl text-gray-600">
        Build with React and Tailwind CSS
      </p>
      <Button type="primary" size="large">
        Get Started
      </Button>
    </div>
  );
};

export default memo(Home);
```

### 示例 2：带交互状态的卡片

**Pixso 设计**：

- 卡片组件（有 Hover 变体）
- 正常状态：白色背景
- Hover 状态：蓝色背景

**同步后代码**：

```tsx
/*
 * Pixso Sync Information
 * Sync Time: 2026-03-28
 * Pixso Page: src/components/Card
 * Sync Direction: Pixso → Code
 */

import { memo } from 'react';

/**
 * Card Component
 * Corresponding to Pixso design: Card
 * Style source: Extracted from Pixso design
 * Layout: Padded card with shadow
 * Interactive elements: Hover state
 */
const Card = ({ children }) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-lg transition-colors hover:bg-blue-50">
      {children}
    </div>
  );
};

export default memo(Card);
```

## 最佳实践

### 1. 命名一致性

确保 Pixso 页面名称与代码文件路径一致：

```
Pixso 页面名称          代码文件路径
src/pages/index   ↔   src/pages/index.tsx
src/pages/about   ↔   src/pages/about.tsx
src/components/Card ↔ src/components/Card.tsx
```

### 2. 小步迭代

- ✅ 每次修改后及时同步
- ✅ 避免积累大量变更
- ❌ 不要等到最后才同步

### 3. 版本控制

同步前创建 Git 提交：

```bash
git add .
git commit -m "Before Pixso sync"
# 然后进行同步
```

### 4. 检查同步结果

同步完成后：

1. 检查代码是否正确
2. 运行项目查看效果
3. 测试交互功能
4. 如有问题及时修复

## 常见问题

### Q: 同步后样式不一致？

**A**: 检查以下几点：

1. Tailwind CSS 配置是否正确
2. 颜色、字体是否在设计规范中
3. 响应式断点是否匹配

### Q: 逻辑代码被覆盖？

**A**: 技能会保护逻辑代码，但建议：

1. 同步前备份代码
2. 检查冲突标记
3. 手动合并复杂逻辑

### Q: 如何取消同步？

**A**:

1. 使用 Git 回滚代码
2. 在 Pixso 中恢复历史版本
3. 删除映射文件重新建立

### Q: 支持哪些项目？

**A**:

- ✅ React 18 + TypeScript
- ✅ Umijs
- ✅ Tailwind CSS 3
- ✅ Ant Design 6
- 其他项目需要调整配置

## 技术栈支持

当前技能针对以下技术栈优化：

```json
{
  "framework": "React 18",
  "language": "TypeScript",
  "routing": "Umijs",
  "styling": "Tailwind CSS 3",
  "components": "Ant Design 6"
}
```

## 映射关系

技能会自动维护映射关系文件：

**文件位置**：`.claude/skills/peaks-pixso-code-sync/mappings.json`

**格式**：

```json
{
  "mappings": [
    {
      "code_path": "src/pages/index.tsx",
      "pixso_page_id": "9:4855",
      "last_sync": "2026-03-28T10:30:00Z",
      "sync_direction": "pixso_to_code",
      "pixso_page_name": "src/pages/index"
    }
  ]
}
```

## 获取帮助

如遇到问题：

1. 查看本快速开始指南
2. 参考 [双向同步实现指南](./references/bidirectional-sync-guide.md)
3. 检查技能配置文件

## 下一步

- 尝试第一次同步
- 熟悉触发词和工作流
- 建立同步习惯（每次修改后同步）
- 探索高级功能（变体、状态管理等）
