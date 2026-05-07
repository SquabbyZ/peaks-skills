---
name: peaks-pixso-code-sync
description: '实现 Pixso 与代码的双向同步，保持设计与代码的一致性。支持两个方向：(1) Pixso→代码：从设计稿生成 React 代码；(2) 代码→Pixso：将代码更新同步到设计稿。触发词：同步 Pixso、从设计生成代码、更新 UI、代码转设计、双向同步。'
---

# Pixso-Code Sync Skill

## 技能描述

实现 Pixso 与代码的**双向同步**，保持设计与代码的一致性。

支持两个同步方向：

- **Pixso→代码**：从 Pixso 设计稿生成 React + TypeScript 代码
- **代码→Pixso**：将本地代码同步到 Pixso 设计稿

## 使用场景

### 场景 1：设计稿同步到代码（Pixso→代码）

**场景描述**：将 Pixso 设计稿转换为 React + TypeScript 代码

**子场景**：

#### 1.1 同步整个设计稿（未选中内容）

**触发条件**：

- 用户打开了 Pixso 画布
- 用户**没有选中任何特定的节点或组件**
- 用户输入触发词（如"从 Pixso 同步到代码"）

**处理逻辑**：

```
1. 检测到当前没有选中的节点
   ↓
2. 自动获取当前画布的根节点（最顶层 Frame）
   ↓
3. 同步整个画布的所有内容
   ↓
4. 生成完整的页面代码
```

**示例**：

```
用户操作：
1. 打开 Pixso 画布 "首页设计"
2. 没有选中任何内容（或点击空白处取消选择）
3. 输入："从 Pixso 同步到代码"

AI 处理：
✅ 检测到未选中内容
✅ 自动获取画布根节点
✅ 同步整个"首页设计"画布
✅ 生成完整的首页代码
```

**代码输出**：

```tsx
// 生成整个页面的完整代码
import { memo } from 'react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 所有内容区域 */}
      <main className="container mx-auto px-4 py-20">
        <section>...</section>
        <section>...</section>
        <section>...</section>
      </main>
    </div>
  );
};

export default memo(Home);
```

#### 1.2 同步选中的组件（已选中内容）

**触发条件**：

- 用户打开了 Pixso 画布
- 用户**选中了特定的节点或组件**
- 用户输入触发词

**处理逻辑**：

```
1. 检测到当前有选中的节点
   ↓
2. 仅获取选中节点及其子节点
   ↓
3. 同步选中的组件内容
   ↓
4. 生成组件代码
```

**示例**：

```
用户操作：
1. 打开 Pixso 画布 "首页设计"
2. 选中"导航栏"组件
3. 输入："从 Pixso 同步到代码"

AI 处理：
✅ 检测到选中了"导航栏"节点
✅ 仅同步导航栏组件
✅ 生成导航栏代码
```

**代码输出**：

```tsx
// 仅生成导航栏组件的代码
import { memo } from 'react';

const Navbar = () => {
  return (
    <nav className="fixed w-full bg-white/70 backdrop-blur-md">
      <div className="container mx-auto flex justify-between">
        {/* 仅导航栏内容 */}
      </div>
    </nav>
  );
};

export default memo(Navbar);
```

#### 1.3 同步选中的区块（部分选中）

**触发条件**：

- 用户打开了 Pixso 画布
- 用户选中了某个区块（如 Hero 区域、卡片区域）
- 用户输入触发词

**处理逻辑**：

```
1. 检测到当前有选中的节点
   ↓
2. 获取选中区块及其子节点
   ↓
3. 同步选中的区块内容
   ↓
4. 生成区块代码（可嵌入现有页面）
```

**示例**：

```
用户操作：
1. 打开 Pixso 画布 "首页设计"
2. 选中"Hero 区域"
3. 输入："同步这个区域到代码"

AI 处理：
✅ 检测到选中了"Hero 区域"
✅ 仅同步 Hero 区域
✅ 生成 Hero 区域代码
```

**代码输出**：

```tsx
// 生成 Hero 区域的代码
<section className="mb-24 text-center">
  <h1 className="text-6xl font-bold">
    Data-driven decisions for your business
  </h1>
  <p className="text-xl text-gray-600">
    Transform your data into actionable insights...
  </p>
  <div className="flex gap-4">
    <button className="bg-blue-600 text-white">Start Free Trial</button>
    <button className="border-2 border-blue-600">Book a Demo</button>
  </div>
</section>
```

### 场景 2：代码同步到设计稿（代码→Pixso）

**场景描述**：将本地代码的 UI 结构同步到 Pixso 设计稿

**处理逻辑**：

```
1. 读取当前编辑的代码文件
   ↓
2. 解析 UI 结构和样式
   ↓
3. 转换为 Pixso 设计元素
   ↓
4. 更新或创建 Pixso 页面
```

**示例**：

```
用户操作：
1. 在 IDE 中编辑 src/pages/index.tsx
2. 修改了页面内容
3. 输入："把代码同步到 Pixso"

AI 处理：
✅ 读取代码文件
✅ 解析 UI 结构
✅ 更新 Pixso 设计稿
✅ 保持设计和代码一致
```

### 场景 3：保持设计和代码实时同步

**场景描述**：在开发过程中频繁同步，保持设计和代码的一致性

**推荐实践**：

```
设计修改 → 同步到代码 → 开发实现 → 同步到设计 → 循环迭代
```

**示例流程**：

```
1. 设计师在 Pixso 中修改了按钮样式
   ↓
2. 开发者触发"从 Pixso 同步到代码"
   ↓
3. 代码自动更新按钮样式
   ↓
4. 开发者继续实现业务逻辑
   ↓
5. 开发者添加新的功能区块
   ↓
6. 开发者触发"把代码同步到 Pixso"
   ↓
7. 设计稿自动更新新功能区块
```

## 决策流程

### 同步方向判断

```
用户输入 → 识别关键词 → 判断方向
   ↓
   ├─ 明确指定 → 按用户指定
   ├─ 打开 Pixso → 默认 Pixso→代码
   ├─ 编辑代码 → 默认 代码→Pixso
   └─ 无法判断 → 询问用户
```

### 同步范围判断（Pixso→代码）

```
检查选中状态
   ↓
   ├─ 未选中任何内容 → 同步整个画布（根节点）
   ├─ 选中组件 → 同步选中组件
   └─ 选中区块 → 同步选中区块
```

### 文件匹配逻辑

```
Pixso 页面名称 → 匹配项目文件路径
   ↓
   ├─ src/pages/index → src/pages/index.tsx
   ├─ src/pages/about → src/pages/about.tsx
   └─ 未找到 → 询问用户创建位置
```

## 核心功能

- **双向同步**：支持 Pixso 设计稿与本地代码的精准转换（两个方向）
- **规范约束**：强制 AI 复用项目现有组件（Ant Design、项目自定义组件）
- **安全防御**：冲突时保留旧代码，添加注释和 TODO 标记
- **状态管理**：智能处理 Hover/Active 等交互状态
- **自动格式化**：同步完成后自动使用 Prettier 格式化代码

## 技术栈

React 18 + TypeScript + Umijs + TailwindCSS 3 + Ant Design 6

## 触发方式

支持自然语言触发，当用户输入包含以下关键词时自动激活：

### Pixso→代码 触发词

- "从 Pixso 同步到代码"
- "根据设计生成代码"
- "更新代码"
- "从画布同步"
- "Pixso 设计转代码"

### 代码→Pixso 触发词

- "把代码同步到 Pixso"
- "更新 Pixso 设计"
- "代码转设计"
- "同步到画布"
- "更新设计稿"

### 通用触发词

- "同步 Pixso"
- "双向同步"
- "保持设计和代码一致"

## 工作流程

### 方向判断

1. **识别同步方向**：
   - 用户明确指定方向 → 按用户指定
   - 用户打开了 Pixso 页面 → 默认 Pixso→代码
   - 用户正在编辑代码文件 → 默认 代码→Pixso
   - 无法判断时 → 询问用户

### Pixso→代码 同步流程（增强版 - 解决样式还原度问题）

**核心问题**:

- `mcp_pixso_design_to_code` 生成的代码样式信息不够精确
- `mcp_pixso_get_node_dsl` 数据量大容易截断
- 依赖 AI 视觉识别截图，无法精确识别颜色、间距等
- **选中节点识别不准确**: 可能获取到错误的节点或非选中的内容

**优化策略**: 采用**分层数据获取 + 关键样式精确提取 + 选中状态验证**的方法

1. **多层次数据获取**（核心改进）

   **第零层：选中状态验证**（新增 - 确保准确性）
   - **关键步骤**: 在调用任何 MCP 工具之前，必须先验证选中状态
   - 验证方法:
     - 通过 MCP 工具获取当前选中的节点信息
     - 确认选中节点的 guid、名称、类型
     - 与用户截图或描述进行比对
   - **如果无法确认选中状态，必须询问用户**:
     - "请确认您当前选中的节点名称是什么？"
     - "请提供选中节点的截图或描述"
   - 用途：确保后续获取的数据是用户真正选中的内容

   **第一层：整体结构获取**
   - 使用 `mcp_pixso_design_to_code` 获取完整组件结构
   - 优势：数据完整，不会截断，包含所有文本内容
   - 用途：作为代码生成的基础框架

   **第二层：分块获取 DSL**（关键改进）
   - 不直接获取整个页面的 DSL，而是**分模块获取**
   - 策略：
     - 先识别页面的主要区块（导航栏、Hero、特性区等）
     - 对每个区块单独调用 `mcp_pixso_get_node_dsl`
     - 每次只获取一个区块的 DSL，避免数据截断
   - 优势：既能获取详细样式，又避免截断

   **第三层：截图视觉验证**
   - 使用 `mcp_pixso_get_image` 获取设计稿截图
   - 用途：
     - 验证结构完整性
     - 识别渐变方向、阴影效果等视觉特征
     - 辅助判断颜色深浅、透明度等
     - **验证选中范围**: 确认截图中的选中框与用户描述一致

2. **选中内容准确性验证**（新增 - 关键改进）

   **验证步骤**:
   - **步骤 1: 获取选中节点基本信息**
     ```javascript
     // 伪代码
     const selectedNode = await getSelectedNode();
     console.log('选中节点:', {
       guid: selectedNode.guid,
       name: selectedNode.name,
       type: selectedNode.type,
       childrenCount: selectedNode.children?.length,
     });
     ```
   - **步骤 2: 验证选中范围**
     - 检查选中节点的子节点数量
     - 确认是否包含预期的内容
     - 如果子节点数量与截图明显不符，需要重新获取
   - **步骤 3: 交叉验证**
     - 对比 `mcp_pixso_design_to_code` 返回的结构
     - 对比 `mcp_pixso_get_node_dsl` 返回的 DSL
     - 对比 `mcp_pixso_get_image` 返回的截图
     - **三者必须一致**,否则重新获取
   - **步骤 4: 用户确认**（当出现以下情况时）
     - 选中的节点名称与设计稿标注不一致
     - 选中的内容范围不明确
     - 获取到的数据与截图有明显差异
     - 无法确定是否获取了正确的节点

3. **智能样式提取**（关键改进）

   **从分块 DSL 中提取精确样式：**
   - 颜色值：提取 fillPaints 中的精确 RGB/RGBA 值
   - 间距：从 autoLayout 中提取 itemSpacing、padding 等
   - 字体：从文本节点提取 fontSize、fontWeight、lineHeight
   - 圆角：提取 rectangleCornerRadius 值
   - 阴影：从 effects 中提取 shadow 参数
   - 边框：提取 strokeWeight、strokePaints

   **样式映射规则：**

   ```javascript
   // 颜色值转换
   { r: 37, g: 99, b: 235, a: 1 } → bg-blue-600
   { r: 255, g: 255, b: 255, a: 0.3 } → bg-white/30

   // 间距转换
   itemSpacing: 32 → space-x-8 或 gap-8
   paddingTop: 16 → pt-4
   paddingLeft: 24 → pl-6

   // 字体大小转换
   fontSize: 48 → text-6xl
   fontSize: 20 → text-xl
   fontWeight: 700 → font-bold

   // 圆角转换
   cornerRadius: 8 → rounded-lg
   cornerRadius: 12 → rounded-xl

   // 阴影转换
   effects: [{ type: "DROP_SHADOW", radius: 16 }] → shadow-lg
   ```

   **背景色提取规则**（重要增强）：
   - 必须检查每个 FRAME 节点的 fillPaints 属性
   - 即使 fillPaints 为空数组或 undefined，也要：
     - **检查父节点的背景**
     - **检查截图的整体色调**
     - 对于透明背景，使用 `bg-transparent` 或省略背景类
     - 对于半透明背景，使用 `/` 语法（如 `bg-white/40`）
     - 对于渐变背景，检查 gradientStops 并转换为 `bg-gradient-to-*`
   - **特别注意**：如果截图显示有背景色但 DSL 中没有 fillPaints，以截图为准添加背景类
   - **Footer/Header 区域**：通常有整体背景色，即使子节点没有 fillPaints，也要检查容器节点的背景

   **列表结构识别规则**（新增）：
   - 当检测到多个相同结构的文本项垂直排列时（如 Footer 链接）：
     - 识别为 `ul` 或 `ol` 列表
     - 每个文本项包裹在 `li` 中
     - 添加适当的间距类（如 `space-y-2`）
   - 当检测到多列布局时（如 Footer 的 4 列链接）：
     - 使用 `grid` 布局（优先）或 `flex` 布局
     - 根据列数添加 `grid-cols-*` 类（如 `grid-cols-1 md:grid-cols-4`）
     - 添加适当的 `gap` 间距（如 `gap-8`）
   - **列标题识别**：每组列表通常有标题（h3），添加 `font-semibold mb-4` 等样式

   **按钮样式提取规则**（重要增强）：
   - 按钮背景色：从 button FRAME 的 fillPaints 提取
   - 按钮文字颜色：从 button 内文本节点的 fillPaints 提取
   - 按钮边框：从 strokePaints 提取
   - 按钮悬停状态：检查是否有变体或单独定义 hover 状态
   - 如果按钮背景为纯色，必须添加对应的 `bg-*` 类
   - 如果按钮文字为深色，必须添加 `text-*` 类

4. **视觉特征识别**（从截图提取）

   **识别以下视觉特征：**
   - 渐变方向：从上到下 → `bg-gradient-to-b`，对角线 → `bg-gradient-to-br`
   - 阴影柔和度：轻微 → `shadow-sm`，中等 → `shadow-md`，强烈 → `shadow-lg`
   - 透明度级别：几乎透明 → `/20`，半透明 → `/50`，轻微透明 → `/80`
   - 文字颜色深浅：深灰 → `text-gray-900`，中灰 → `text-gray-700`，浅灰 → `text-gray-500`
   - **背景色调**（新增）：
     - 淡蓝/淡紫色 → `bg-gradient-to-br from-blue-50 to-indigo-100`
     - 淡灰色 → `bg-gray-50`
     - 白色/近白色 → `bg-white`

   **验证与微调：**
   - 对比 DSL 提取的颜色和截图效果
   - 如果截图效果更淡，降低不透明度（如从 `bg-white/50` 调整为 `bg-white/30`）
   - 如果截图阴影更柔和，调整阴影级别（如从 `shadow-lg` 调整为 `shadow-md`）
   - **如果 DSL 中没有背景但截图有明显背景色，添加对应的背景类**
   - **对于 Footer 等区域，检查整体容器的背景色，而不只是子节点**

5. **代码生成优化**

   **基于多源数据生成代码：**
   - 结构：来自 `mcp_pixso_design_to_code`（保证完整性）
   - 精确样式：来自分块 DSL（保证还原度）
   - 视觉特征：来自截图（保证视觉效果）

   **生成策略：**

   ```javascript
   // 伪代码示例
   async function syncPixsoToCode() {
     // 1. 获取整体结构
     const designCode = await mcp_pixso_design_to_code({...});

     // 2. 识别主要区块
     const sections = identifySections(designCode);

     // 3. 分块获取 DSL
     const sectionStyles = [];
     for (const section of sections) {
       const dsl = await mcp_pixso_get_node_dsl({ itemId: section.id });
       sectionStyles.push(extractStyles(dsl));
     }

     // 4. 获取截图
     const screenshot = await mcp_pixso_get_image({...});

     // 5. 整合数据生成代码
     const code = generateCode({
       structure: designCode,
       styles: sectionStyles,
       visualFeatures: analyzeScreenshot(screenshot)
     });

     return prettier.format(code);
   }
   ```

### 代码→Pixso 同步流程

1. 读取项目组件约束，确保生成代码复用现有组件
2. 确定页面名称：
   - 用户指定则使用用户指定名称
   - 否则使用代码文件的路径（如 `src/pages/index.tsx` → `src/pages/index`）
3. 检查 Pixso 是否存在对应名称的页面
4. 解析 React 组件代码，提取 UI 结构和内容：
   - 提取 JSX 元素和属性
   - 识别文本内容和样式
   - 解析 Tailwind CSS 类名
   - 识别交互状态类（hover:、active: 等）
5. 将解析后的 UI 结构转换为 Pixso 能够理解的设计元素
6. 调用 `mcp_pixso_code_to_design` 工具进行数据流转：
   - 存在则更新
   - 不存在则创建新页面
7. 处理冲突，保留旧代码并添加 TODO 标记
8. 创建或更新 Pixso 页面和代码之间的映射关系
9. 同步完成后输出映射关系更新信息

## 安全策略

- **逻辑保护**：严禁删除包含 `useState`、`useEffect`、`onClick` 等逻辑的代码块
- **冲突处理**：结构冲突时，保留旧代码并添加 TODO 标记，生成新 UI 结构
- **版本备份**：同步前必须创建 Pixso 命名版本，重大更新建议在 Pixso 分支中操作
- **注释保留**：保留代码中的注释和 TODO 标记

## 状态同步规则

- **代码→Pixso**：
  - 识别 `hover:` 类名，创建 `Component/Hover` 变体
  - 识别 `active:` 类名，创建 `Component/Active` 变体
  - 识别 `focus:` 类名，创建 `Component/Focus` 变体
- **Pixso→代码**：
  - 识别 Pixso 变体组，将差异属性转换为 Tailwind 状态修饰符
  - 将变体差异转换为 `hover:`、`active:` 等前缀

## 页面创建与命名规则

- **新页面创建**：当 Pixso 中不存在对应页面时，自动创建新页面
- **页面命名优先级**：
  1. 用户明确指定的页面名称
  2. 如果未指定，则使用代码文件的路径（不含扩展名）
- **页面内容**：确保新页面包含完整的 UI 结构、样式和交互元素
- **映射关系**：创建新页面后，自动更新映射关系文件，记录页面 ID 和名称

## 页面匹配功能

- **代码→Pixso**：根据文件路径查找或创建对应名称的 Pixso 页面
- **Pixso→代码**：根据当前打开的 Pixso 页面名称查找项目中对应的文件
- **自动匹配**：实现 Pixso 页面名称与项目文件路径的自动对应
- **映射维护**：自动维护页面名称与文件路径的对应关系

## 代码格式化

- **Prettier 集成**：同步完成后自动使用 Prettier 格式化代码
- **配置优先级**：
  1. 优先使用项目中已有的 Prettier 配置文件
  2. 若项目中无配置，使用内置的通用 Prettier 规范
- **内置规范**：
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
- **自动执行**：同步操作完成后自动运行格式化命令，确保代码风格一致

## 输出要求

- 所有代码变更需附带简短说明
- 冲突处理必须明确标注 TODO 标记，旧代码需注释保留
- 禁止输出与同步无关的内容
- 每次同步后输出映射关系更新信息
- 新增代码必须添加同步注释
- **【强制】禁止使用 `any` 类型** - 必须使用明确的类型定义，如 `unknown`、具体的 interface 或 type
- Pixso→代码同步时，为每个主要区块添加详细注释：
  - 区块功能说明
  - 样式来源（从 Pixso 设计中提取）
  - 布局结构说明
  - 交互元素说明

## 组件复用约束

- **Ant Design**：优先使用项目已安装的 Ant Design 组件
- **项目组件**：复用 `src/components/` 目录下的现有组件
- **禁止硬编码**：禁止使用内联 style 属性，强制使用 Tailwind CSS 类名
- **样式转换**：
  - 颜色值转换为 Tailwind 颜色类（如 `#3b82f6` → `bg-blue-500`）
  - 字体大小转换为 Tailwind 排版类（如 `16px` → `text-base`）
  - 间距转换为 Tailwind 间距类（如 `16px` → `p-4`）

## 映射关系管理

- **映射文件**：`.claude/skills/peaks-pixso-code-sync/mappings.json`
- **映射格式**：
  ```json
  {
    "mappings": [
      {
        "code_path": "src/pages/index.tsx",
        "pixso_page_id": "9:4855",
        "last_sync": "2026-03-28",
        "sync_direction": "pixso_to_code",
        "pixso_page_name": "src/pages/index"
      }
    ]
  }
  ```
- **同步策略**：
  - 代码→Pixso：检查存在性→更新或创建→生成映射
  - Pixso→代码：检查映射→更新代码→保留逻辑

## 技术实现细节

### 核心问题说明

**问题根源：Pixso MCP 工具的能力限制**

1. **`mcp_pixso_design_to_code` 的局限**
   - ✅ 优势：返回完整的组件结构，不会截断
   - ❌ 问题：样式信息过于简化，缺少精确的颜色值、间距、字体大小等
   - 结果：生成的代码结构正确，但样式还原度低

2. **`mcp_pixso_get_node_dsl` 的局限**
   - ✅ 优势：包含最详细的样式和技术信息
   - ❌ 问题：数据量巨大，容易截断（超过响应长度限制）
   - 结果：无法获取完整页面的 DSL 数据

3. **`mcp_pixso_get_image` 的局限**
   - ✅ 优势：直观的视觉参考，完整展示设计效果
   - ❌ 问题：需要 AI 视觉识别，无法精确读取颜色值、间距等数值
   - 结果：只能作为辅助验证，无法作为主要数据源

**解决方案：分层数据获取 + 分块精确提取**

通过分层获取（结构→分块 DSL→截图）和智能整合，在保证数据完整性的同时，最大化样式还原度。

### Pixso→代码 数据获取策略

**问题背景**：

- `mcp_pixso_get_node_dsl` 返回的原始 DSL 数据包含过多细节（样式、位置、AutoLayout 等），容易导致响应截断
- 截断后的数据不完整，导致生成的代码缺失重要内容
- **选中节点识别不准确**: 可能获取到错误的节点或非选中的内容
- **数据来源不一致**: 不同 MCP 工具返回的选中节点信息可能有差异

**解决方案**：

```
优先级 0: 选中状态验证（新增 - 确保准确性）
  ✅ 目标：确认获取的是用户真正选中的内容
  ✅ 方法:
     - 获取当前选中的节点 guid 和名称
     - 与用户提供的截图或描述比对
     - 如果不一致，立即询问用户
  ✅ 验证点:
     - 节点名称是否匹配
     - 节点类型是否匹配（FRAME、GROUP 等）
     - 子节点数量是否合理
     - 内容范围是否与截图一致

优先级 1: mcp_pixso_design_to_code
  ✅ 优势：返回完整的组件结构，数据精简，不会截断
  ✅ 用途：获取层级结构、文本内容、基本布局
  ❌ 局限：样式信息不够详细
  ⚠️ 注意：必须验证返回的节点 guid 是否与选中的 guid 一致

优先级 2: mcp_pixso_get_image
  ✅ 优势：直观的视觉参考，完整展示设计效果
  ✅ 用途：验证结构完整性、识别颜色/间距/字体等样式
  ❌ 局限：需要人工或 AI 视觉识别
  ⚠️ 注意：截图必须包含选中框，用于验证选中范围

优先级 3: mcp_pixso_get_node_dsl (可选/按需)
  ✅ 优势：包含最详细的样式和技术信息
  ✅ 用途：仅用于获取特定节点的精确样式
  ❌ 局限：数据量大，容易截断
  ⚠️ 注意：必须验证返回的节点 guid 是否与选中的 guid 一致
```

### 选中内容准确性保障（新增）

**核心原则**:

1. **不信任单一数据源**: 必须通过多个 MCP 工具交叉验证
2. **先验证再处理**: 在生成代码之前，必须先确认选中内容准确
3. **有疑问必询问**: 任何不确定的地方都要询问用户

**验证流程**:

```
1. 获取选中节点信息
   ↓
2. 从多个 MCP 工具获取数据
   ↓
3. 交叉验证数据一致性
   ↓
4. 发现差异 → 询问用户
   ↓
5. 确认一致 → 继续处理
```

**交叉验证检查清单**:

- ✅ 检查 1: `mcp_pixso_design_to_code` 返回的节点 guid 是否与选中的 guid 一致
- ✅ 检查 2: `mcp_pixso_get_node_dsl` 返回的节点 guid 是否与选中的 guid 一致
- ✅ 检查 3: 两个工具返回的节点名称是否一致
- ✅ 检查 4: 两个工具返回的子节点数量是否一致
- ✅ 检查 5: 截图中的选中框是否包含预期的内容
- ✅ 检查 6: 文本内容是否与截图一致
- ✅ 检查 7: 层级结构是否与截图一致

**发现差异时的处理**:

1. ** guid 不一致**: 重新获取选中节点，或询问用户"请确认您选中的节点"
2. **名称不一致**: 询问用户"选中的节点名称是 X 还是 Y?"
3. **子节点数量不一致**: 重新获取 DSL，或分块获取
4. **文本内容不一致**: 以 `mcp_pixso_design_to_code` 为准（更完整）
5. **截图与数据不一致**: 以截图为准，调整数据解析

**示例代码**:

```javascript
// 伪代码示例
async function syncSelectedNode() {
  // 1. 获取选中节点信息
  const selectedGuid = await getSelectedNodeGuid();
  console.log('选中的 guid:', selectedGuid);

  // 2. 从多个工具获取数据
  const designCode = await mcp_pixso_design_to_code({ itemId: selectedGuid });
  const dsl = await mcp_pixso_get_node_dsl({ itemId: selectedGuid });
  const screenshot = await mcp_pixso_get_image({ itemId: selectedGuid });

  // 3. 交叉验证
  const validation = {
    guidMatch: designCode.guid === dsl.guid && designCode.guid === selectedGuid,
    nameMatch: designCode.name === dsl.name,
    childrenCountMatch: designCode.children?.length === dsl.children?.length,
    screenshotMatch: verifyWithScreenshot(designCode, screenshot),
  };

  // 4. 验证失败时处理
  if (!validation.guidMatch || !validation.nameMatch) {
    console.error('验证失败:', validation);
    await askUser('选中节点验证失败，请确认您选中的节点是否正确');
    return;
  }

  // 5. 验证成功，继续处理
  generateCode(designCode, dsl, screenshot);
}
```

### 代码生成流程（增强版 - 包含选中内容验证）

```javascript
// 伪代码示例
async function syncPixsoToCode() {
  // 0. 选中状态验证（新增 - 确保准确性）
  const selectedGuid = await getSelectedNodeGuid();
  console.log('选中的 guid:', selectedGuid);

  if (!selectedGuid) {
    // 未选中任何内容，使用画布根节点
    console.log('未选中内容，使用画布根节点');
    selectedGuid = await getCanvasRootNodeId();
  }

  // 1. 获取整体结构（保证完整性）
  const designCode = await mcp_pixso_design_to_code({
    clientFrameworks: 'react',
    itemId: selectedGuid, // 使用选中的 guid
  });

  // 2. 交叉验证选中内容（新增 - 关键步骤）
  const validation = await validateSelectedNode(designCode, selectedGuid);
  if (!validation.isValid) {
    console.error('选中内容验证失败:', validation.errors);
    await askUser(
      `选中内容验证失败：${validation.errors.join(', ')}\n请确认您选中的节点是否正确`,
    );
    return;
  }
  console.log('选中内容验证通过');

  // 3. 识别主要区块（导航栏、Hero、特性区等）
  const sections = identifySections(designCode);

  // 4. 分块获取 DSL（关键改进：避免截断）
  const sectionStyles = [];
  for (const section of sections) {
    const dsl = await mcp_pixso_get_node_dsl({
      clientFrameworks: 'react',
      itemId: section.id,
    });

    // 验证每个区块的 guid 是否一致
    if (dsl.guid !== section.id) {
      console.warn(`区块 ${section.id} 的 guid 不匹配，重新获取`);
      // 尝试重新获取或使用备选方案
    }

    sectionStyles.push(extractStyles(dsl));
  }

  // 5. 获取截图（视觉验证）
  const screenshot = await mcp_pixso_get_image({
    clientFrameworks: 'react',
    itemId: selectedGuid,
  });

  // 6. 最终验证（新增）
  const finalValidation = finalValidation(
    designCode,
    sectionStyles,
    screenshot,
  );
  if (!finalValidation.isValid) {
    console.error('最终验证失败:', finalValidation.errors);
    await askUser(
      `数据验证失败：${finalValidation.errors.join(', ')}\n是否继续生成代码？`,
    );
  }

  // 7. 整合多源数据生成代码
  const code = generateCode({
    structure: designCode, // 保证结构完整
    styles: sectionStyles, // 保证样式精确
    visualFeatures: analyzeScreenshot(screenshot), // 保证视觉效果
  });

  // 8. 格式化并输出
  return prettier.format(code);
}

// 新增辅助函数：验证选中节点
async function validateSelectedNode(designCode, selectedGuid) {
  const errors = [];

  // 检查 1: guid 是否匹配
  if (designCode.guid !== selectedGuid) {
    errors.push(`guid 不匹配：期望 ${selectedGuid}, 实际 ${designCode.guid}`);
  }

  // 检查 2: 获取 DSL 进行对比
  const dsl = await mcp_pixso_get_node_dsl({ itemId: selectedGuid });
  if (dsl.guid !== selectedGuid) {
    errors.push(`DSL guid 不匹配：期望 ${selectedGuid}, 实际 ${dsl.guid}`);
  }

  // 检查 3: 名称是否一致
  if (designCode.name !== dsl.name) {
    errors.push(
      `名称不一致：design_to_code 返回 ${designCode.name}, dsl 返回 ${dsl.name}`,
    );
  }

  // 检查 4: 子节点数量是否合理
  if (!designCode.children || designCode.children.length === 0) {
    errors.push('未获取到子节点，可能选中了错误的节点');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}

// 新增辅助函数：最终验证
function finalValidation(designCode, sectionStyles, screenshot) {
  const errors = [];

  // 验证结构完整性
  if (!designCode.code || designCode.code.length === 0) {
    errors.push('未获取到代码结构');
  }

  // 验证样式完整性
  if (sectionStyles.length === 0) {
    errors.push('未获取到任何样式信息');
  }

  // 验证截图可用性
  if (!screenshot || !screenshot.data) {
    errors.push('未获取到截图');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}
```

// 辅助函数：识别主要区块
function identifySections(designCode) {
// 基于设计稿结构识别主要功能区块
// 返回区块 ID 列表，用于分块获取 DSL
return [
{ id: 'navbar', name: '导航栏' },
{ id: 'hero', name: 'Hero 区域' },
{ id: 'logos', name: '公司 Logo 区' },
{ id: 'features', name: '特性卡片区' }
];
}

// 辅助函数：从 DSL 提取精确样式
function extractStyles(dsl) {
return {
colors: extractColors(dsl.fillPaints),
spacing: extractSpacing(dsl.autoLayout),
fonts: extractFonts(dsl.textNodes),
shadows: extractShadows(dsl.effects),
borders: extractBorders(dsl.strokePaints),
corners: extractCorners(dsl.cornerRadius)
};
}

````

### 样式转换规则

#### 基础样式

| Pixso 属性 | Tailwind CSS 类名 | 示例 |
|-----------|------------------|------|
| 填充 16px | `p-4` | padding: 16px → p-4 |
| 外边距 24px | `m-6` | margin: 24px → m-6 |
| 字体大小 16px | `text-base` | font-size: 16px → text-base |
| 字体大小 24px | `text-2xl` | font-size: 24px → text-2xl |
| 圆角 8px | `rounded-lg` | border-radius: 8px → rounded-lg |
| 阴影 | `shadow-lg` | box-shadow → shadow-lg |

#### 背景色提取（关键增强）

**提取步骤：**
1. 检查当前节点的 `fillPaints` 属性
2. 如果 `fillPaints` 为空，检查父节点
3. 根据 alpha 值确定透明度
4. 转换为对应的 Tailwind 类

**转换规则：**
```javascript
// 纯色背景
fillPaints: [{ color: { r: 255, g: 255, b: 255, a: 1 } }]
→ bg-white

// 半透明背景
fillPaints: [{ color: { r: 255, g: 255, b: 255, a: 0.4 } }]
→ bg-white/40

// 渐变背景
fillPaints: [{ type: "GRADIENT_LINEAR", gradientStops: [...] }]
→ bg-gradient-to-br from-blue-50 to-indigo-100

// 无背景
fillPaints: [] 或 undefined
→ bg-transparent 或省略
````

**常见背景色映射：**
| RGB 值 | Tailwind 类名 | 使用场景 |
|--------|--------------|----------|
| rgba(255,255,255,1) | `bg-white` | 卡片、按钮 |
| rgba(255,255,255,0.4) | `bg-white/40` | 毛玻璃卡片 |
| rgba(255,255,255,0.3) | `bg-white/30` | 导航栏 |
| rgba(37,99,235,1) | `bg-blue-600` | 主按钮 |
| rgba(0,0,0,0) | `bg-transparent` | 透明背景 |

#### 按钮样式提取（关键增强）

**必须提取的属性：**

1. **背景色**：从按钮 FRAME 的 `fillPaints` 提取
2. **文字颜色**：从按钮内文本节点的 `fillPaints` 提取
3. **边框**：从 `strokePaints` 提取
4. **内边距**：从 `autoLayout` 的 padding 提取
5. **圆角**：从 `cornerRadius` 提取

**完整按钮示例：**

```javascript
// DSL 数据结构
{
  fillPaints: [{ color: { r: 37, g: 99, b: 235, a: 1 } }],
  strokePaints: [{ color: { r: 219, g: 234, b: 254, a: 1 } }],
  cornerRadius: 8,
  autoLayout: { paddingTop: 12, paddingRight: 24, paddingBottom: 12, paddingLeft: 24 },
  children: [{
    fillPaints: [{ color: { r: 255, g: 255, b: 255, a: 1 } }]
  }]
}

// 转换为
<button className="bg-blue-600 text-white border border-blue-100 rounded-lg px-6 py-3 hover:bg-blue-700">
  Get Started
</button>
```

**按钮样式检查清单：**

- ✅ 必须有背景色（`bg-*`）
- ✅ 必须有文字颜色（`text-*`）
- ✅ 如果有边框，添加边框类（`border*`）
- ✅ 如果有圆角，添加圆角类（`rounded-*`）
- ✅ 如果有 padding，添加间距类（`px-* py-*`）
- ✅ 添加悬停效果（`hover:bg-*`）

#### 透明度转换（根据截图效果微调）

| 视觉效果 | Tailwind CSS 类名           | 使用场景         |
| -------- | --------------------------- | ---------------- |
| 几乎透明 | `opacity-20` - `opacity-30` | Logo、图标背景   |
| 半透明   | `opacity-40` - `opacity-60` | 次要元素、占位符 |
| 中等透明 | `opacity-70` - `opacity-80` | 边框、分隔线     |
| 轻微透明 | `opacity-90`                | 文字、按钮       |

#### 背景透明度

| 效果     | Tailwind CSS 类名             | 使用场景         |
| -------- | ----------------------------- | ---------------- |
| 几乎透明 | `bg-white/20` - `bg-white/30` | 导航栏、卡片背景 |
| 半透明   | `bg-white/50` - `bg-white/60` | 模态框、遮罩     |
| 轻微透明 | `bg-white/70` - `bg-white/80` | 浮层、下拉菜单   |

#### 文字颜色深浅

| 视觉效果 | Tailwind CSS 类名                 | 使用场景         |
| -------- | --------------------------------- | ---------------- |
| 非常浅   | `text-gray-400`                   | 占位符、次要信息 |
| 较浅     | `text-gray-500` - `text-gray-600` | 副标题、说明文字 |
| 正常     | `text-gray-700` - `text-gray-800` | 正文、段落       |
| 深色     | `text-gray-900`                   | 标题、重要文字   |

#### 渐变背景

| 渐变效果   | Tailwind CSS 类名                                 | 示例       |
| ---------- | ------------------------------------------------- | ---------- |
| 淡蓝到淡紫 | `bg-gradient-to-br from-blue-50 to-indigo-100`    | 页面背景   |
| 蓝色到紫色 | `bg-gradient-to-r from-blue-600 to-indigo-600`    | CTA 区域   |
| 蓝白渐变   | `bg-gradient-to-br from-blue-100 to-white`        | 卡片背景   |
| 粉紫渐变   | `bg-gradient-to-br from-purple-100 to-pink-100`   | 图表占位符 |
| 绿色渐变   | `bg-gradient-to-br from-green-100 to-emerald-100` | 数据卡片   |

#### 图标背景颜色（超淡效果）

| 颜色   | Tailwind CSS 类名 | 使用场景           |
| ------ | ----------------- | ------------------ |
| 超淡蓝 | `bg-blue-50`      | 图标背景、装饰元素 |
| 超淡紫 | `bg-purple-50`    | 图标背景、装饰元素 |
| 超淡绿 | `bg-green-50`     | 图标背景、装饰元素 |
| 超淡红 | `bg-red-50`       | 图标背景、装饰元素 |

#### 阴影柔和度

| 阴影效果 | Tailwind CSS 类名 | 使用场景     |
| -------- | ----------------- | ------------ |
| 轻微阴影 | `shadow-sm`       | 卡片、按钮   |
| 中等阴影 | `shadow-md`       | 悬浮元素     |
| 大阴影   | `shadow-lg`       | 弹窗、模态框 |
| 超大阴影 | `shadow-xl`       | 重要浮层     |

### 组件层级映射

```
Pixso Frame/Group  →  div/section
Pixso Text         →  p/h1-h6/span
Pixso Button       →  button
Pixso Input        →  input
Pixso Image        →  img
```

## 参考文档

- **快速参考卡片**：[references/quick-reference.md](./references/quick-reference.md)
  - 快速查阅表，常用触发词，样式转换参考
- **快速开始指南**：[references/quick-start.md](./references/quick-start.md)
  - 快速上手教程，常用触发词，最佳实践
- **双向同步实现指南**：[references/bidirectional-sync-guide.md](./references/bidirectional-sync-guide.md)
  - 详细的同步实现步骤，代码示例，冲突处理策略
- **演示案例**：[references/demo-showcase.md](./references/demo-showcase.md)
  - 实际同步演示，冲突处理示例，性能对比
- **技能增强说明**：[references/skill-enhancement-summary.md](./references/skill-enhancement-summary.md)
  - 技能更新概述，核心增强，使用方法，技术实现

## 最佳实践与使用建议

### 提高样式还原度的建议

1. **分块同步策略**（推荐）
   - 不要一次性同步整个页面
   - 按功能区块分别同步（导航栏、Hero、特性区等）
   - 每个区块单独触发同步，获得更精确的样式

2. **手动校准关键样式**
   - 同步完成后，检查关键样式（颜色、间距、字体）
   - 对比 Pixso 原稿，手动调整 Tailwind 类名
   - 建立项目的 Tailwind 配色方案（theme.extend.colors）

3. **使用设计令牌**
   - 在项目中定义设计令牌（Design Tokens）
   - 将常用颜色、字体、间距配置到 Tailwind 主题
   - 使用语义化的类名（如 `bg-primary` 而非 `bg-blue-600`）

4. **迭代优化**
   - 第一次同步：保证结构完整
   - 第二次同步：针对特定区块优化样式
   - 第三次同步：微调细节（透明度、阴影等）

### 何时使用不同的同步策略

**场景 1：从零开始创建页面**

- 使用整体同步快速获取页面框架
- 然后分区块同步获取精确样式
- 最后手动微调关键细节

**场景 2：更新现有页面**

- 选中特定区块进行同步
- 保留已有的业务逻辑代码
- 只更新 UI 结构和样式

**场景 3：保持设计和代码一致**

- 设计修改后，及时同步到代码
- 代码修改后，及时同步到设计
- 频繁小步同步，避免大幅改动

### 常见问题解答

**Q: 为什么生成的代码和 Pixso 原稿有差异？**
A: 主要原因是 Pixso MCP 工具的能力限制：

- `mcp_pixso_design_to_code` 生成的样式信息不完整
- `mcp_pixso_get_node_dsl` 数据量大容易截断
- 解决方案：使用分块同步策略，对每个区块单独获取 DSL

**Q: 如何提高样式还原度？**
A: 建议采用以下方法：

1. 分区块同步，不要一次性同步整个页面
2. 手动校准关键样式（颜色、间距、字体）
3. 建立项目的设计令牌系统
4. 多次迭代优化，逐步逼近原稿

**Q: 为什么同步后丢失了背景色？**
A: 这是 `mcp_pixso_design_to_code` 的已知限制。解决方案：

1. **必须检查 DSL 数据**：从 `mcp_pixso_get_node_dsl` 提取 `fillPaints`
2. **检查父节点背景**：如果当前节点无背景，检查父节点
3. **正确转换透明度**：根据 alpha 值使用 `/` 语法（如 `bg-white/40`）
4. **实现代码**：
   ```javascript
   // 从 DSL 提取背景色
   function extractBackground(node) {
     if (node.fillPaints && node.fillPaints.length > 0) {
       const paint = node.fillPaints[0];
       if (paint.type === 'SOLID') {
         const { r, g, b, a } = paint.color;
         // 转换为 Tailwind 类
         return convertToTailwindBg(r, g, b, a);
       }
     }
     return null; // 无背景
   }
   ```

**Q: 为什么按钮和按钮文字颜色错误？**
A: 按钮样式需要分别提取背景和文字颜色：

1. **按钮背景**：从按钮 FRAME 的 `fillPaints` 提取
2. **按钮文字**：从按钮内 PARAGRAPH 节点的 `fillPaints` 提取
3. **实现代码**：

   ```javascript
   // 提取按钮完整样式
   function extractButtonStyles(buttonNode) {
     // 1. 提取背景色
     const bgColor = extractBackground(buttonNode);

     // 2. 提取文字颜色（从子节点）
     const textNode = buttonNode.children.find((c) => c.type === 'PARAGRAPH');
     const textColor = textNode ? extractBackground(textNode) : null;

     // 3. 提取边框
     const borderColor = buttonNode.strokePaints
       ? extractColor(buttonNode.strokePaints[0])
       : null;

     // 4. 提取圆角
     const radius = buttonNode.cornerRadius;

     return {
       bg: bgColor, // 如 'bg-blue-600'
       text: textColor, // 如 'text-white'
       border: borderColor, // 如 'border-blue-100'
       rounded: convertRadius(radius), // 如 'rounded-lg'
     };
   }
   ```

**Q: 为什么 Footer 同步后丢失了背景色和列结构？**
A: Footer 区域有特殊结构，需要特别注意：

1. **背景色丢失**：Footer 的背景色通常定义在最外层容器，而不是子节点
   - 解决：检查整体容器的 fillPaints，或从截图识别背景色调
   - 如果截图显示淡蓝/淡紫色背景，添加 `bg-gradient-to-br from-blue-50 to-indigo-100`
2. **列结构识别**：Footer 通常包含多列链接
   - 识别多列布局：使用 `grid grid-cols-1 md:grid-cols-4 gap-8`
   - 每组链接有标题（h3）和列表（ul/li）
   - 示例结构：

   ```tsx
   <footer className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
     <div className="container mx-auto px-4">
       <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
         {/* Column 1 */}
         <div>
           <h3 className="mb-4 font-semibold">Company</h3>
           <ul className="space-y-2">
             <li>
               <a href="#about">About Us</a>
             </li>
             <li>
               <a href="#careers">Careers</a>
             </li>
           </ul>
         </div>
         {/* More columns... */}
       </div>
     </div>
   </footer>
   ```

3. **完整 Footer 同步检查清单**：
   - ✅ 检查容器背景色（从 DSL 或截图）
   - ✅ 识别列数（通常 3-4 列）
   - ✅ 添加网格布局类
   - ✅ 每组链接包含标题和列表
   - ✅ 添加适当的间距（gap, space-y）
   - ✅ 底部版权信息和分隔线

**Q: 为什么获取到的选中内容与截图不一致？**
A: 这是 Pixso MCP 工具的已知限制。可能的原因包括：

1. **选中节点识别错误**: MCP 工具可能返回了错误的节点 guid
2. **数据截断**: DSL 数据过长导致截断，丢失部分内容
3. **缓存问题**: Pixso 可能返回了缓存的旧数据
4. **网络延迟**: 多个 MCP 工具调用之间可能存在状态不同步

解决方案：

1. **重新选中节点**: 取消选择后重新选中目标节点
2. **刷新 Pixso 页面**: 清除缓存，确保数据最新
3. **使用技能中的验证流程**: 技能会自动交叉验证多个数据源
4. **提供截图**: 向 AI 提供选中内容的截图，帮助验证

**Q: 是否应该完全依赖自动同步？**
A: 不建议。自动同步适合：

- ✅ 快速搭建页面框架
- ✅ 获取基础样式
- ✅ 保持设计和代码同步

但以下情况需要手动优化：

- ❌ 精确的颜色还原
- ❌ 复杂的响应式布局
- ❌ 特殊的交互效果
- ❌ 性能优化

**Q: 如何处理同步后的代码？**
A: 建议流程：

1. 同步完成后，先运行代码检查是否有错误
2. 对比 Pixso 原稿，检查视觉效果
3. 手动调整关键样式（颜色、间距、字体）
4. 添加必要的业务逻辑
5. 进行性能优化（代码分割、懒加载等）

**Q: 如何确保选中内容的准确性？**
A: 技能已增强选中内容验证机制：

1. **自动验证**: 技能会自动验证选中节点的 guid、名称、子节点数量
2. **交叉验证**: 对比多个 MCP 工具返回的数据
3. **截图验证**: 对比截图中的选中框与数据
4. **用户确认**: 发现差异时会询问用户

用户最佳实践：

- ✅ 选中节点后，确认选中框包含预期内容
- ✅ 提供选中内容的截图
- ✅ 如果同步结果不正确，重新选中并重试
- ✅ 对于复杂设计稿，分区块同步而非一次性同步整个页面

**Q: 为什么同步后的组件有多余的边框和背景容器？**
A: 这是因为 Pixso 设计稿可能有两种不同的设计风格：

**风格 1: 容器包裹型**

- 特征：整个组件被一个大的容器 FRAME 包裹
- 容器有明确的背景色、边框、圆角等样式
- 同步时会生成带外层容器的代码
- 示例：
  ```tsx
  <div className="rounded-2xl border border-white/50 bg-white/30 backdrop-blur-lg">
    {/* 内容区域 */}
  </div>
  ```

**风格 2: 简洁扁平型**（新增识别）

- 特征：组件没有外层容器，内容直接排列
- 各个子元素有自己的背景色，但整体没有容器背景
- 设计更加扁平化、简洁
- 同步时应该直接输出内容，不添加外层容器
- 示例：
  ```tsx
  <>
    <h2 className="text-3xl font-bold">Real-time Performance</h2>
    <div className="h-80 rounded-xl bg-gray-100">...</div>
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-xl bg-white p-4 shadow-sm">...</div>
      <div className="rounded-xl bg-white p-4 shadow-sm">...</div>
    </div>
  </>
  ```

**如何判断设计风格：**

1. **检查最外层 FRAME 的 fillPaints**:
   - 如果有 fillPaints → 容器包裹型
   - 如果 fillPaints 为空或透明 → 简洁扁平型

2. **检查最外层 FRAME 的 strokePaints**:
   - 如果有 strokePaints → 容器包裹型（有边框）
   - 如果没有 strokePaints → 简洁扁平型

3. **检查截图**:
   - 如果整个组件有明显的背景色或边框 → 容器包裹型
   - 如果组件背景是透明的，只有子元素有背景 → 简洁扁平型

**适配规则：**

```javascript
// 伪代码示例
function determineContainerStyle(rootNode, screenshot) {
  const hasFill = rootNode.fillPaints && rootNode.fillPaints.length > 0;
  const hasStroke = rootNode.strokePaints && rootNode.strokePaints.length > 0;
  const isTransparent = hasFill && rootNode.fillPaints[0].color.a < 0.1;

  // 简洁扁平型判断
  if ((!hasFill || isTransparent) && !hasStroke) {
    return 'flat'; // 不生成外层容器
  }

  // 容器包裹型判断
  if (hasFill || hasStroke) {
    return 'contained'; // 生成外层容器
  }

  // 默认：根据截图判断
  if (screenshotHasContainerBackground(screenshot)) {
    return 'contained';
  }

  return 'flat';
}

// 代码生成
function generateCode(style, content) {
  if (style === 'flat') {
    // 直接输出内容，不包裹容器
    return content;
  } else {
    // 包裹容器
    return `<div className="${containerClasses}">${content}</div>`;
  }
}
```

**解决方案：**

1. 技能会自动识别设计风格
2. 对于简洁扁平型设计，不生成外层容器
3. 只给各个子元素添加对应的样式
4. 如果不确定，会询问用户是否需要外层容器

**用户操作建议：**

- 如果同步后有多余的容器，请告诉 AI"这个组件没有外层容器，请直接输出内容"
- 或者在设计稿中明确标注哪些是容器，哪些是内容
- 对于简洁风格的设计，建议选中内容区域而非整个画布
