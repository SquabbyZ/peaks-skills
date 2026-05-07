# 双向同步实现指南

## 概述

本指南详细说明如何实现 Pixso 与代码的双向同步，确保设计与代码保持一致性。

## 同步方向识别

### 用户意图识别

通过以下关键词识别用户期望的同步方向：

#### Pixso→代码

- "从 Pixso 同步到代码"
- "根据设计生成代码"
- "更新代码"
- "从画布同步"
- "Pixso 设计转代码"
- "把设计应用到代码"

#### 代码→Pixso

- "把代码同步到 Pixso"
- "更新 Pixso 设计"
- "代码转设计"
- "同步到画布"
- "更新设计稿"

#### 自动判断

- 用户打开了 Pixso 页面 → 默认 Pixso→代码
- 用户正在编辑代码文件 → 默认 代码→Pixso
- 无法判断时 → 询问用户

## Pixso→代码 同步实现

### 步骤 1：获取 Pixso 设计信息

```typescript
// 使用 mcp_pixso_get_node_dsl 获取当前节点的 DSL
const dsl = await mcp_pixso_get_node_dsl({
  clientFrameworks: 'react',
});
```

### 步骤 2：解析 DSL 结构

DSL 包含以下关键信息：

- `pixDslNodes`: 设计节点数组
  - `type`: 节点类型（FRAME, PARAGRAPH, RECTANGLE 等）
  - `guid`: 节点唯一标识
  - `width`, `height`: 尺寸
  - `top`, `left`: 位置
  - `fillPaints`: 填充样式
  - `nodeText`: 文本内容
  - `fontFamily`, `fontSize`, `fontWeight`: 文本样式
  - `autoLayout`: 自动布局信息

### 步骤 3：转换为 React 代码

#### 节点类型映射

```typescript
const nodeTypeMap = {
  FRAME: 'div',
  PARAGRAPH: 'p',
  TEXT: 'span',
  RECTANGLE: 'div',
  ELLIPSE: 'div',
  LINE: 'hr',
  IMAGE: 'img',
};
```

#### 样式转换规则

```typescript
// 颜色转换
const colorMap = {
  '#3b82f6': 'blue-500',
  '#1e40af': 'blue-800',
  '#ffffff': 'white',
  '#000000': 'black',
  // ... 更多颜色映射
};

// 字体大小转换
const fontSizeMap = {
  12: 'text-xs',
  14: 'text-sm',
  16: 'text-base',
  18: 'text-lg',
  20: 'text-xl',
  24: 'text-2xl',
  32: 'text-3xl',
};

// 间距转换
const spacingMap = {
  4: 'p-1',
  8: 'p-2',
  12: 'p-3',
  16: 'p-4',
  20: 'p-5',
  24: 'p-6',
  32: 'p-8',
};
```

### 步骤 4：生成代码结构

```tsx
/*
 * Pixso Sync Information
 * Sync Time: {timestamp}
 * Pixso Page: {pageName}
 * Sync Direction: Pixso → Code
 */

import { memo } from 'react';

/**
 * Component Description
 * Corresponding to Pixso design element: {elementType}
 * Style source: Extracted from Pixso design
 * Layout: {layoutDescription}
 * Interactive elements: {interactiveElements}
 */
const ComponentName = () => {
  return (
    <div className="{tailwindClasses}">
      {/* Text element from Pixso design */}
      {text}
    </div>
  );
};

export default memo(ComponentName);
```

### 步骤 5：处理交互状态

识别 Pixso 变体组，转换为 Tailwind 状态修饰符：

```typescript
// Pixso 变体 → Tailwind 类
const variantMap = {
  Hover: 'hover:',
  Active: 'active:',
  Focus: 'focus:',
  Disabled: 'disabled:',
};

// 示例：变体差异属性转换
// Pixso: Frame/Hover 的 backgroundColor = #3b82f6
// 代码：className="bg-white hover:bg-blue-500"
```

### 步骤 6：保留逻辑代码

```typescript
// 检测并保留现有逻辑
const logicPatterns = [
  /useState/,
  /useEffect/,
  /useCallback/,
  /useMemo/,
  /onClick/,
  /onChange/,
  /onSubmit/,
];

// 如果检测到逻辑代码，保留并添加注释
if (logicPatterns.some((pattern) => pattern.test(existingCode))) {
  // 保留逻辑代码
  preservedCode = existingCode;
}
```

## 代码→Pixso 同步实现

### 步骤 1：读取代码文件

```typescript
const code = await fs.readFile(filePath, 'utf-8');
```

### 步骤 2：解析 React 组件

提取关键信息：

- 组件名称
- JSX 结构
- className 类名
- 文本内容
- 样式属性

### 步骤 3：解析 Tailwind CSS 类名

```typescript
const tailwindClasses = {
  layout: ['flex', 'grid', 'block', 'inline-block'],
  spacing: ['p-4', 'm-2', 'gap-4'],
  colors: ['bg-blue-500', 'text-white'],
  typography: ['text-lg', 'font-bold'],
  effects: ['shadow-lg', 'rounded-md'],
  states: ['hover:bg-blue-600', 'active:scale-95'],
};
```

### 步骤 4：转换为 Pixso 设计元素

```typescript
// Tailwind → Pixso 映射
const classToPixsoMap = {
  'bg-blue-500': { type: 'SOLID', color: { r: 59, g: 82, b: 246, a: 1 } },
  'text-white': { type: 'SOLID', color: { r: 255, g: 255, b: 255, a: 1 } },
  'shadow-lg': { type: 'DROP_SHADOW', radius: 16, offset: { x: 0, y: 10 } },
  // ... 更多映射
};
```

### 步骤 5：调用 Pixso MCP 工具

```typescript
// 使用 mcp_pixso_code_to_design 转换代码为设计
const result = await mcp_pixso_code_to_design({
  htmlStr: code,
});
```

### 步骤 6：处理交互状态

识别状态修饰符，创建 Pixso 变体：

```typescript
// 识别 hover: 类名
const hoverClasses = classes.filter((c) => c.startsWith('hover:'));
if (hoverClasses.length > 0) {
  // 创建 Component/Hover 变体
  await createVariant('Hover', hoverClasses);
}
```

## 冲突处理策略

### 策略 1：保留旧代码

```typescript
// 结构冲突时的处理方式
const handleConflict = (oldCode, newCode) => {
  return `
/*  Old Code (Pixso Sync): 
${oldCode}
*/

// TODO: [Pixso Sync] Review and merge changes
${newCode}
  `;
};
```

### 策略 2：保护逻辑代码

```typescript
// 严禁删除逻辑代码
const protectedPatterns = [
  /useState\([^)]*\)/g,
  /useEffect\([^)]*\)/g,
  /const\s+\w+\s*=\s*\([^)]*\)\s*=>/g,
  /function\s+\w+\s*\([^)]*\)/g,
];

protectedPatterns.forEach((pattern) => {
  const matches = code.match(pattern);
  if (matches) {
    // 保留匹配的代码块
  }
});
```

## 映射关系管理

### 映射文件结构

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

### 映射更新逻辑

```typescript
const updateMapping = (mapping) => {
  const existingIndex = mappings.findIndex(
    (m) =>
      m.code_path === mapping.code_path ||
      m.pixso_page_id === mapping.pixso_page_id,
  );

  if (existingIndex >= 0) {
    mappings[existingIndex] = {
      ...mappings[existingIndex],
      ...mapping,
      last_sync: new Date().toISOString(),
    };
  } else {
    mappings.push(mapping);
  }

  // 保存到文件
  fs.writeFileSync(MAPPING_FILE, JSON.stringify({ mappings }, null, 2));
};
```

## 代码格式化

### Prettier 配置

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 执行格式化

```bash
npx prettier --write src/pages/index.tsx
```

## 示例场景

### 场景 1：Pixso→代码（新页面）

**用户操作**：在 Pixso 中设计了新的首页，要求同步到代码

**执行流程**：

1. 获取 Pixso 页面 DSL
2. 解析设计元素
3. 生成 React 组件代码
4. 保存到 `src/pages/index.tsx`
5. 创建映射关系
6. 格式化代码

**输出**：

```tsx
/*
 * Pixso Sync Information
 * Sync Time: 2026-03-28
 * Pixso Page: src/pages/index
 * Sync Direction: Pixso → Code
 */

import { memo } from 'react';

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <h1 className="mb-8 text-4xl font-bold text-gray-800">
        Welcome to Our App
      </h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Feature cards from Pixso design */}
      </div>
    </div>
  );
};

export default memo(Home);
```

### 场景 2：代码→Pixso（更新设计）

**用户操作**：修改了代码中的样式，要求同步到 Pixso

**执行流程**：

1. 读取代码文件
2. 解析 Tailwind 类名
3. 转换为 Pixso 设计元素
4. 更新 Pixso 页面
5. 更新映射关系

### 场景 3：双向同步（保持一致）

**用户操作**：在代码和 Pixso 都有修改，要求双向同步

**执行流程**：

1. 创建 Pixso 版本备份
2. 代码→Pixso 同步 UI 结构
3. Pixso→代码 同步设计细节
4. 冲突检测和标记
5. 生成合并建议

## 最佳实践

### 1. 频繁小步同步

- 每次修改后及时同步
- 避免大规模冲突

### 2. 使用版本控制

- 同步前创建 Git 提交
- 便于回滚和对比

### 3. 清晰的命名

- Pixso 页面名称与文件路径一致
- 便于自动匹配

### 4. 注释和文档

- 添加同步信息注释
- 记录重要变更

### 5. 测试验证

- 同步后运行测试
- 确保功能正常

## 常见问题

### Q: 同步后样式不一致？

A: 检查 Tailwind 配置，确保颜色、间距等与设计一致

### Q: 逻辑代码被覆盖？

A: 检查冲突处理逻辑，确保保护了 useState、useEffect 等代码

### Q: 映射关系丢失？

A: 检查映射文件路径，确保正确保存和读取

### Q: 交互状态未同步？

A: 检查变体识别逻辑，确保 hover、active 等状态正确转换
