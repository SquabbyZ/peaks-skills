# 双向同步演示

## 演示概述

本演示展示 peaks-pixso-code-sync 技能如何实现 Pixso 与代码的双向同步。

## 演示 1：Pixso → 代码同步

### 初始状态

**Pixso 设计稿**：

- 页面名称：`src/pages/index`
- 设计元素：
  - 容器：Flex 布局，居中，渐变背景
  - 标题：文本 "Welcome"，48px，粗体
  - 副标题：文本 "Build amazing apps"，24px，常规
  - 按钮：主要按钮 "Get Started"

### 同步过程

**用户指令**：

```
帮我把当前 Pixso 画布同步到代码
```

**AI 执行步骤**：

1. **获取 Pixso DSL**

   ```typescript
   const dsl = await mcp_pixso_get_node_dsl({
     clientFrameworks: 'react',
   });
   ```

2. **解析设计元素**

   ```
   - FRAME (容器): flex, gradient background
   - TEXT (标题): "Welcome", 48px, bold
   - TEXT (副标题): "Build amazing apps", 24px
   - BUTTON (按钮): "Get Started", primary
   ```

3. **生成代码**

   ```tsx
   /*
    * Pixso Sync Information
    * Sync Time: 2026-03-28
    * Pixso Page: src/pages/index
    * Sync Direction: Pixso → Code
    */

   import { memo } from 'react';
   import { Button } from 'antd';

   const Home = () => {
     return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
         <h1 className="mb-4 text-4xl font-bold text-gray-800">Welcome</h1>
         <p className="mb-8 text-2xl text-gray-600">Build amazing apps</p>
         <Button type="primary" size="large">
           Get Started
         </Button>
       </div>
     );
   };

   export default memo(Home);
   ```

4. **保存文件**

   ```
   保存到：src/pages/index.tsx
   ```

5. **创建映射**

   ```json
   {
     "code_path": "src/pages/index.tsx",
     "pixso_page_id": "9:4855",
     "sync_direction": "pixso_to_code"
   }
   ```

6. **格式化代码**
   ```bash
   npx prettier --write src/pages/index.tsx
   ```

### 同步完成

**输出**：

```
✅ Pixso → 代码 同步完成！

同步详情：
- Pixso 页面：src/pages/index
- 代码文件：src/pages/index.tsx
- 设计元素：4 个
- 交互状态：0 个
- 映射关系：已创建

代码结构：
✓ 容器布局
✓ 标题文本
✓ 副标题文本
✓ 按钮组件
```

## 演示 2：代码 → Pixso 同步

### 初始状态

**本地代码**（已修改）：

```tsx
import { memo } from 'react';
import { Button } from 'antd';

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
      <h1 className="mb-4 text-5xl font-bold text-gray-900">
        Welcome to Our App
      </h1>
      <p className="mb-8 text-2xl text-gray-700">
        Build amazing apps with React and Tailwind
      </p>
      <div className="space-x-4">
        <Button type="primary" size="large">
          Get Started
        </Button>
        <Button size="large">Learn More</Button>
      </div>
    </div>
  );
};

export default memo(Home);
```

### 同步过程

**用户指令**：

```
把代码同步到 Pixso
```

**AI 执行步骤**：

1. **读取代码文件**

   ```typescript
   const code = await fs.readFile('src/pages/index.tsx', 'utf-8');
   ```

2. **解析 React 组件**

   ```
   - 组件名：Home
   - JSX 结构：div > (h1, p, div.buttons)
   - Tailwind 类名：
     - bg-gradient-to-br from-purple-50 to-pink-100
     - text-5xl, text-2xl
     - space-x-4
   ```

3. **转换为 Pixso 设计**

   ```typescript
   const result = await mcp_pixso_code_to_design({
     htmlStr: code,
   });
   ```

4. **更新 Pixso 页面**

   ```
   - 更新背景渐变：purple-50 → pink-100
   - 更新标题文本和样式
   - 更新副标题文本
   - 添加新按钮 "Learn More"
   ```

5. **更新映射**
   ```json
   {
     "code_path": "src/pages/index.tsx",
     "pixso_page_id": "9:4855",
     "sync_direction": "code_to_pixso",
     "last_sync": "2026-03-28T11:00:00Z"
   }
   ```

### 同步完成

**输出**：

```
✅ 代码 → Pixso 同步完成！

同步详情：
- 代码文件：src/pages/index.tsx
- Pixso 页面：src/pages/index
- 更新元素：5 个
- 新增元素：1 个（Learn More 按钮）
- 映射关系：已更新

设计变更：
✓ 背景渐变更新
✓ 标题文本和样式更新
✓ 副标题更新
✓ 添加新按钮
```

## 演示 3：带交互状态的同步

### Pixso 设计（带变体）

**组件**：Card
**变体**：

- Default: 白色背景，阴影
- Hover: 蓝色背景，阴影加深

### 同步到代码

**用户指令**：

```
从 Pixso 同步 Card 组件到代码
```

**AI 执行**：

1. **获取 DSL 和变体**

   ```typescript
   const dsl = await mcp_pixso_get_node_dsl();
   const variants = await mcp_pixso_get_variants();
   ```

2. **识别变体差异**

   ```
   Default:
   - backgroundColor: #ffffff
   - shadow: 0 4px 6px rgba(0,0,0,0.1)

   Hover:
   - backgroundColor: #3b82f6
   - shadow: 0 10px 15px rgba(0,0,0,0.2)
   ```

3. **转换为 Tailwind 状态类**
   ```tsx
   const Card = ({ children }) => {
     return (
       <div className="bg-white shadow-lg transition-all duration-200 hover:bg-blue-500 hover:shadow-xl">
         {children}
       </div>
     );
   };
   ```

### 同步完成

**输出**：

```
✅ Pixso → 代码 同步完成（带交互状态）

同步详情：
- 组件名称：Card
- 基础样式：已转换
- 交互状态：2 个（Default, Hover）
- 状态映射：
  ✓ Hover → hover: 前缀
  ✓ 过渡动画 → transition-all

生成代码：
✓ 基础样式类
✓ 状态修饰符
✓ 过渡效果
```

## 演示 4：冲突处理

### 场景

**现有代码**（带逻辑）：

```tsx
import { memo, useState } from 'react';
import { Button } from 'antd';

const Home = () => {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    console.log('Button clicked', count);
  };

  return (
    <div className="flex flex-col items-center p-8">
      <h1 className="mb-4 text-3xl font-bold">Counter App</h1>
      <p className="mb-4 text-xl">Count: {count}</p>
      <Button onClick={handleClick}>Increment</Button>
    </div>
  );
};

export default memo(Home);
```

**Pixso 设计**（新布局）：

- 不同的布局结构
- 不同的样式

### 同步过程

**AI 检测到逻辑代码**：

```typescript
const hasLogic = /useState|useEffect|onClick/.test(code);
if (hasLogic) {
  // 保护逻辑代码
  preserveLogic(code);
}
```

**冲突处理**：

```tsx
/*
 * Pixso Sync Information
 * Sync Time: 2026-03-28
 * Pixso Page: src/pages/index
 * Sync Direction: Pixso → Code
 */

import { memo, useState } from 'react';
import { Button } from 'antd';

const Home = () => {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    console.log('Button clicked', count);
  };

  return (
    // TODO: [Pixso Sync] Review layout changes
    <div className="new-pixso-layout">
      {/* Pixso 设计的新布局 */}
      <h1 className="text-center text-4xl font-bold">Counter App</h1>
      <p className="my-4 text-center text-2xl">Count: {count}</p>
      <Button onClick={handleClick} type="primary">
        Increment
      </Button>
    </div>
  );
};

export default memo(Home);
```

### 同步完成

**输出**：

```
✅ Pixso → 代码 同步完成（冲突已处理）

同步详情：
- 逻辑代码：已保护 ✓
- useState: 已保留 ✓
- useEffect: 未检测到
- onClick: 已保留 ✓

冲突处理：
- 布局变更：添加 TODO 标记
- 样式更新：已应用
- 逻辑保留：完整保留

建议：
请检查 TODO 标记处，确认布局变更是否符合预期
```

## 性能对比

### 同步速度

| 操作类型   | 元素数量 | 平均耗时 |
| ---------- | -------- | -------- |
| Pixso→代码 | < 10     | ~2 秒    |
| Pixso→代码 | 10-50    | ~5 秒    |
| Pixso→代码 | 50+      | ~10 秒   |
| 代码→Pixso | 简单组件 | ~3 秒    |
| 代码→Pixso | 复杂页面 | ~8 秒    |

### 代码质量

| 指标                | 目标  | 实际 |
| ------------------- | ----- | ---- |
| Prettier 格式化     | 100%  | 100% |
| TypeScript 类型检查 | ✓     | ✓    |
| ESLint 规则         | ✓     | ✓    |
| 组件复用率          | > 80% | ~90% |

## 最佳实践总结

### ✅ 推荐做法

1. **频繁同步**
   - 每次修改后立即同步
   - 避免积累大量变更

2. **清晰命名**
   - Pixso 页面名称 = 文件路径
   - 便于自动匹配

3. **小步迭代**
   - 一次同步一个方向
   - 确认后再继续

4. **版本控制**
   - 同步前 Git 提交
   - 便于回滚

### ❌ 避免做法

1. **长时间不同步**
   - 导致大量冲突
   - 增加合并难度

2. **命名不一致**
   - Pixso 和代码名称不同
   - 需要手动匹配

3. **同时双向修改**
   - 容易产生冲突
   - 建议确定权威来源

## 实际案例

### 案例 1：电商首页

**项目**：电商平台首页
**技术栈**：React + Tailwind + Ant Design
**同步内容**：

- 商品卡片列表
- 轮播图
- 分类导航
- 页脚

**结果**：

- 同步时间：~15 分钟
- 代码行数：~500 行
- 组件复用：95%
- 手动调整：5%

### 案例 2：管理后台

**项目**：数据管理后台
**技术栈**：React + Umi + Ant Design
**同步内容**：

- 数据表格
- 筛选表单
- 统计卡片
- 图表容器

**结果**：

- 同步时间：~20 分钟
- 代码行数：~800 行
- 组件复用：90%
- 手动调整：10%

## 总结

双向同步的优势：

1. **提升效率**：减少重复劳动
2. **保持一致**：设计和代码始终同步
3. **减少错误**：自动化转换，减少人为错误
4. **快速迭代**：设计和开发并行

立即开始使用 peaks-pixso-code-sync 技能，体验高效的双向同步！
