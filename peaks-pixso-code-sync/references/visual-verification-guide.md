# 视觉效果验证指南

## 目的

本指南用于指导在 Pixso→代码同步过程中，如何通过对比设计稿截图来验证和微调生成的代码效果。

## 为什么需要视觉验证？

`mcp_pixso_design_to_code` 提供了完整的**结构数据**，但在以下方面可能不够精确：

1. **透明度**：设计稿中的半透明效果
2. **颜色深浅**：文字的灰度等级
3. **渐变细节**：渐变的方向、颜色节点
4. **阴影柔和度**：阴影的大小和模糊程度
5. **间距比例**：元素之间的精确距离

通过对比 `mcp_pixso_get_image` 返回的截图，可以发现并修正这些差异。

## 验证流程

### 步骤 1：获取多源数据

```javascript
// 1. 获取结构数据（完整，无截断）
const designCode = await mcp_pixso_design_to_code({
  clientFrameworks: 'react',
  itemId: currentNodeId,
});

// 2. 获取视觉参考（截图）
const screenshot = await mcp_pixso_get_image({
  clientFrameworks: 'react',
  itemId: currentNodeId,
});

// 3. 按需获取详细 DSL（仅关键节点）
const nodeDSL = await mcp_pixso_get_node_dsl({
  clientFrameworks: 'react',
  itemId: criticalNodeId,
});
```

### 步骤 2：生成初始代码

基于 `designCode` 生成初始的 React + Tailwind 代码。

### 步骤 3：对比截图验证

逐项对比以下视觉效果：

#### 3.1 导航栏验证

**检查项**：

- [ ] 背景透明度（截图中几乎透明 → `bg-white/30` 或更低）
- [ ] 毛玻璃效果强度（`backdrop-blur-sm` / `backdrop-blur-md` / `backdrop-blur-lg`）
- [ ] 边框透明度（`border-white/20` / `border-white/30`）
- [ ] 文字颜色（`text-gray-600` vs `text-gray-700`）

**截图特征**：

- 如果能透过导航栏看到背景 → 透明度 ≤ 30%
- 如果文字看起来较浅 → 使用 `text-gray-600`
- 如果边框很淡 → `border-white/20`

#### 3.2 Hero 区域验证

**检查项**：

- [ ] 标题字体粗细（`font-bold` vs `font-semibold`）
- [ ] 副标题颜色（`text-gray-600` vs `text-gray-500`）
- [ ] 按钮圆角（`rounded-lg` vs `rounded-xl`）
- [ ] 按钮渐变（是否有渐变效果）

**截图特征**：

- 如果副标题看起来很淡 → `text-gray-500`
- 如果按钮很圆润 → `rounded-xl` 或 `rounded-2xl`

#### 3.3 信任背书区域验证

**检查项**：

- [ ] Logo 透明度（`opacity-30` / `opacity-40` / `opacity-50`）
- [ ] 文字颜色（`text-gray-400` vs `text-gray-500`）
- [ ] 间距（`gap-8` / `gap-12` / `gap-16`）

**截图特征**：

- 如果 Logo 非常淡 → `opacity-30` 或 `opacity-40`
- 如果几乎看不清 → `opacity-20`

#### 3.4 数据卡片验证

**检查项**：

- [ ] 卡片阴影（`shadow-md` / `shadow-lg` / `shadow-xl`）
- [ ] 图表背景渐变（颜色是否正确）
- [ ] 数字字体大小（`text-3xl` vs `text-4xl`）
- [ ] 百分比颜色（绿色上涨 vs 红色下跌）

**截图特征**：

- 如果阴影很柔和 → `shadow-md`
- 如果阴影很明显 → `shadow-lg` 或 `shadow-xl`
- 如果图表背景很淡 → 使用 `from-blue-50` 而非 `from-blue-100`

#### 3.5 功能特性图标验证

**检查项**：

- [ ] 图标背景颜色（`bg-blue-50` / `bg-blue-100`）
- [ ] 图标颜色（`text-blue-600` / `text-blue-500`）
- [ ] 圆圈大小（`w-16 h-16` vs `w-20 h-20`）

**截图特征**：

- 如果背景几乎看不见 → `bg-blue-50`
- 如果背景明显 → `bg-blue-100`

#### 3.6 CTA 区域验证

**检查项**：

- [ ] 渐变方向（`bg-gradient-to-r` vs `bg-gradient-to-br`）
- [ ] 渐变颜色（`from-blue-600 to-indigo-600` vs `from-blue-700 to-purple-700`）
- [ ] 圆角（`rounded-2xl` vs `rounded-3xl`）

**截图特征**：

- 如果从左到右渐变 → `bg-gradient-to-r`
- 如果从左上到右下渐变 → `bg-gradient-to-br`
- 如果颜色偏紫 → 调整 `to-*` 颜色

#### 3.7 页面背景验证

**检查项**：

- [ ] 渐变方向（`bg-gradient-to-br`）
- [ ] 起始颜色（`from-blue-50` / `from-indigo-50`）
- [ ] 结束颜色（`to-indigo-100` / `to-purple-100`）

**截图特征**：

- 如果整体偏蓝 → `from-blue-50`
- 如果整体偏紫 → `from-indigo-50`

### 步骤 4：微调代码

根据验证结果调整代码：

```tsx
// 示例：根据截图调整透明度

// ❌ 初始代码（可能太深）
<nav className="bg-white/70">
  <div className="opacity-60">

// ✅ 调整后（根据截图微调）
<nav className="bg-white/30 backdrop-blur-md">
  <div className="opacity-40">
```

```tsx
// 示例：根据截图调整颜色深浅

// ❌ 初始代码（可能太深）
<p className="text-gray-700">

// ✅ 调整后（根据截图调整）
<p className="text-gray-600">
```

```tsx
// 示例：根据截图调整阴影

// ❌ 初始代码（可能太重）
<div className="shadow-xl">

// ✅ 调整后（根据截图调整）
<div className="shadow-lg">
```

```tsx
// 示例：根据截图调整图标背景

// ❌ 初始代码（可能太深）
<div className="bg-blue-100">

// ✅ 调整后（根据截图调整）
<div className="bg-blue-50">
```

### 步骤 5：再次验证

重复步骤 3-4，直到代码效果与截图一致。

## 常见视觉差异及解决方案

### 差异 1：导航栏太明显

**问题**：生成的代码中导航栏背景太深，遮挡了页面背景

**解决**：

```tsx
// 降低背景透明度
bg-white/70 → bg-white/30 → bg-white/20

// 增加毛玻璃效果
backdrop-blur-sm → backdrop-blur-md → backdrop-blur-lg
```

### 差异 2：Logo/图标太清晰

**问题**：截图中 Logo 很淡，代码中太清晰

**解决**：

```tsx
// 降低透明度
opacity-60 → opacity-40 → opacity-30

// 或使用更浅的颜色
text-gray-600 → text-gray-400
```

### 差异 3：卡片阴影太重

**问题**：卡片阴影过于明显，看起来不精致

**解决**：

```tsx
// 降低阴影强度
shadow-xl → shadow-lg → shadow-md

// 或使用更柔和的阴影
shadow-2xl → shadow-xl
```

### 差异 4：渐变不自然

**问题**：渐变过渡不平滑，颜色节点不对

**解决**：

```tsx
// 调整渐变方向
bg-gradient-to-r → bg-gradient-to-br

// 调整颜色节点
from-blue-600 to-indigo-600 → from-blue-500 to-purple-500

// 使用更淡的颜色
from-blue-100 to-indigo-100 → from-blue-50 to-indigo-50
```

### 差异 5：文字颜色太深

**问题**：副标题、说明文字看起来太深，不够精致

**解决**：

```tsx
// 使用更浅的灰色
text-gray-700 → text-gray-600 → text-gray-500

// 或降低不透明度
text-gray-800/90 → text-gray-800/70
```

## 验证清单

在提交代码前，请确认以下项目：

- [ ] 导航栏背景透明度与截图一致
- [ ] 毛玻璃效果强度适当
- [ ] Hero 标题字体粗细正确
- [ ] 副标题颜色深浅适当
- [ ] 按钮样式（圆角、渐变）与截图一致
- [ ] Logo/图标透明度正确
- [ ] 数据卡片阴影柔和度适当
- [ ] 图表背景渐变颜色正确
- [ ] 功能图标背景颜色超淡
- [ ] CTA 区域渐变方向和颜色正确
- [ ] 页面背景渐变自然
- [ ] 所有间距（margin/padding）与截图比例一致

## 工具推荐

### 颜色提取

使用以下工具从截图中提取精确颜色：

1. **ColorZilla**（浏览器扩展）
2. **Digital Color Meter**（macOS 自带）
3. **Sip**（macOS 应用）

### 间距测量

使用以下工具测量元素间距：

1. **PerfectPixel**（浏览器扩展）
2. **PixelSnap**（macOS 应用）

## 最佳实践

1. **先结构后样式**：先生成完整的结构，再微调样式
2. **从大到小**：先调整整体布局，再调整细节
3. **多次迭代**：不要期望一次就完美，多次对比调整
4. **保存参考**：保存截图作为参考，方便对比
5. **使用注释**：在代码中添加注释，说明样式来源

## 示例：完整的验证过程

### 截图特征分析

观察截图：

- 导航栏几乎透明，能看到背景渐变
- Logo 非常淡，几乎看不清
- 卡片阴影很柔和
- 图标背景是超淡的蓝色

### 初始代码

```tsx
<nav className="bg-white/70 backdrop-blur-md">
  <div className="opacity-60">
  <div className="shadow-lg">
  <div className="bg-blue-100">
```

### 调整后代码

```tsx
<nav className="bg-white/30 backdrop-blur-lg">
  <div className="opacity-40">
  <div className="shadow-md">
  <div className="bg-blue-50">
```

### 验证结果

✅ 导航栏透明度正确
✅ Logo 透明度正确
✅ 卡片阴影柔和度正确
✅ 图标背景颜色正确

## 总结

视觉验证是确保代码与设计稿一致的关键步骤。通过对比 `mcp_pixso_get_image` 返回的截图，可以发现并修正 `mcp_pixso_design_to_code` 生成的代码中的视觉差异。

**核心原则**：

- 透明度宁低勿高
- 颜色宁浅勿深
- 阴影宁柔勿重
- 渐变宁淡勿浓

通过多次迭代和微调，最终生成与设计稿完全一致的代码。
