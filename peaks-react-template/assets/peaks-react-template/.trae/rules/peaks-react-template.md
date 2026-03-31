# Peaks React Template - AI Coding Rules

## 🚨 核心原则（必须严格遵守）

### 1. 禁止使用 `any` 类型

**绝对禁止**在代码中使用 `any` 类型。违反此规则将导致代码审查不通过。

#### ❌ 错误示例

```typescript
// 禁止使用 any
const data: any = fetchData();
function process(obj: any) { return obj; }
interface User { name: any }
```

#### ✅ 正确做法

```typescript
// 1. 使用未知类型
const data: unknown = fetchData();

// 2. 使用泛型
function process<T>(obj: T): T { return obj; }

// 3. 使用具体类型
interface User { name: string; age: number }

// 4. 使用工具类型
type Maybe<T> = T | null | undefined;
type Optional<T> = T | undefined;
type Nullable<T> = T | null;

// 5. 使用类型推断
const user = { name: 'John', age: 30 }; // 自动推断类型
```

### 2. 类型安全优先

- 始终为函数参数和返回值定义明确的类型
- 使用 TypeScript 严格模式
- 优先使用接口（interface）和类型别名（type）
- 使用泛型提高代码复用性

## 📋 项目规范

### 技术栈

- **框架**: Umi 4.x + React 18.x
- **UI 库**: Ant Design 6.x
- **语言**: TypeScript 5.x（严格模式）
- **样式**: Tailwind CSS 3.x + CSS 变量
- **状态管理**: Zustand 5.x
- **数据请求**: TanStack React Query 5.x + Umi Request
- **表单**: React Hook Form 7.x + Zod
- **工具库**: ahooks 3.x, dayjs

### 代码风格

#### 1. 导入规范

```typescript
// 使用路径别名
import { xxx } from '@/components';
import { yyy } from '@/services';
import { zzz } from '@/types';

// React 导入
import { memo, useMemo, useCallback } from 'react';
import { useIntl, setLocale } from 'umi';
```

#### 2. 组件定义

```typescript
// 函数组件使用 memo 包裹
import { memo } from 'react';

interface Props {
  title: string;
  count?: number;
}

const Component = memo<Component>((props) => {
  const { title, count = 0 } = props;
  return <div>{title}</div>;
});

export default Component;
```

#### 3. Hooks 使用

```typescript
// 自定义 Hooks 必须以 use 开头
import { useMemo, useCallback } from 'react';

export function useThemeConfig() {
  const theme = useMemo(() => ({
    colorPrimary: '#1677ff',
  }), []);

  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return { theme, handleClick };
}
```

#### 4. API 请求规范

```typescript
// 1. 定义类型
import { ApiResponse } from '@/types';

interface User {
  id: number;
  name: string;
}

interface UserListParams {
  page?: number;
  size?: number;
}

// 2. 使用 requestMethods
import { requestMethods } from '@/services/request';

export const getUserList = (params: UserListParams) => {
  return requestMethods.get<User[]>(`${prefixRoute}/users`, params);
};

export const createUser = (data: Partial<User>) => {
  return requestMethods.post<User>(`${prefixRoute}/users`, data);
};
```

#### 5. React Query 使用

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { getUserList, createUser } from './api';

// Query
export function useUserList(params: UserListParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => getUserList(params),
    staleTime: 5 * 60 * 1000,
  });
}

// Mutation
export function useCreateUser() {
  return useMutation({
    mutationFn: createUser,
  });
}
```

#### 6. 国际化

```typescript
import { useIntl, FormattedMessage, setLocale } from 'umi';

const Component = () => {
  const intl = useIntl();
  
  // 使用 useIntl
  const welcome = intl.formatMessage(
    { id: 'user.welcome' },
    { name: '张三' }
  );
  
  // 或使用组件
  return (
    <FormattedMessage 
      id="user.welcome" 
      values={{ name: '张三' }} 
    />
  );
};

// 切换语言
setLocale('en-US', false); // 不刷新页面
```

### 样式规范

#### 🚨 样式使用优先级（必须遵守）

**优先级顺序**：
1. ✅ **Tailwind CSS 工具类**（最优先）
2. ✅ **CSS 变量 + Tailwind**（动态值）
3. ✅ **Ant Design 组件样式**（通过 `className` 或 `styles` prop）
4. ✅ **CSS 模块/全局 CSS**（复杂组件样式）
5. ❌ **style 内联样式**（禁止使用，除非动态计算无法避免）

#### 1. Tailwind CSS 优先原则

```tsx
// ✅ 推荐：完全使用 Tailwind 工具类
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-lg font-semibold text-gray-900">标题</h2>
  <button className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600">
    按钮
  </button>
</div>

// ✅ 推荐：Tailwind + CSS 变量（使用设计令牌）
<div className="p-[var(--spacing-lg)] bg-[var(--color-bg-primary)]">
  <p className="text-[var(--color-text-primary)]">
    使用 CSS 变量的内容
  </p>
</div>

// ❌ 禁止：使用 style 内联样式
<div style={{ display: 'flex', padding: '16px', backgroundColor: '#fff' }}>
  <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>标题</h2>
</div>

// ❌ 禁止：混合使用 Tailwind 和 style
<div className="flex" style={{ padding: '16px' }}>
  不推荐的写法
</div>
```

#### 2. CSS 变量使用（配合 Tailwind）

```typescript
// ✅ 推荐：在 Tailwind 中使用 CSS 变量
<div className="bg-[var(--color-primary)] text-[var(--color-text-primary)]">
  内容
</div>

// ✅ 推荐：动态计算样式（仅在必要时）
const getDynamicClassName = (type: 'success' | 'error') => {
  return type === 'success' 
    ? 'bg-[var(--color-success)]' 
    : 'bg-[var(--color-error)]';
};

// ❌ 禁止：使用 style 对象
const style = {
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-text-primary)',
};
<div style={style}>内容</div>
```

#### 3. 响应式设计（使用 Tailwind）

```tsx
// ✅ 推荐：使用 Tailwind 响应式前缀
<div className="
  w-full 
  sm:w-1/2 
  md:w-1/3 
  lg:w-1/4 
  xl:w-1/5
">
  响应式宽度的内容
</div>

// ✅ 推荐：响应式间距和排版
<div className="
  text-sm sm:text-base md:text-lg
  p-2 sm:p-4 md:p-6
  flex flex-col sm:flex-row
">
  响应式布局
</div>

// ❌ 禁止：使用 media query 的 style
<div style={{
  width: '100%',
  '@media (min-width: 640px)': { width: '50%' } // 错误！
}}>
  内容
</div>
```

#### 4. 条件样式（使用 className 组合）

```tsx
// ✅ 推荐：使用模板字符串或 clsx/cn
import { clsx } from 'clsx';

const Button = ({ variant, disabled }) => {
  const className = clsx(
    'px-4 py-2 rounded font-medium',
    variant === 'primary' && 'bg-blue-500 text-white',
    variant === 'secondary' && 'bg-gray-200 text-gray-800',
    disabled && 'opacity-50 cursor-not-allowed'
  );
  
  return <button className={className}>按钮</button>;
};

// ✅ 推荐：使用三元表达式
<div className={isActive ? 'bg-blue-500' : 'bg-gray-200'}>
  条件样式
</div>

// ❌ 禁止：使用 style 对象处理条件样式
<div style={{
  backgroundColor: isActive ? '#3b82f6' : '#e5e7eb'
}}>
  不推荐
</div>
```

#### 5. Ant Design 组件样式覆盖

```tsx
// ✅ 推荐：使用 className + Tailwind
<Button className="px-6 py-3 bg-blue-500 hover:bg-blue-600">
  按钮
</Button>

// ✅ 推荐：使用 styles prop（Ant Design 6.x）
<Button 
  styles={{
    root: { padding: 'var(--spacing-lg)' },
  }}
>
  按钮
</Button>

// ✅ 推荐：使用 ConfigProvider 主题配置
<ConfigProvider
  theme={{
    token: {
      colorPrimary: 'var(--color-primary)',
      borderRadius: 6,
    },
  }}
>
  <Button>按钮</Button>
</ConfigProvider>

// ❌ 禁止：使用 style prop 覆盖 Ant Design 样式
<Button style={{ padding: '16px', backgroundColor: '#1677ff' }}>
  不推荐
</Button>
```

#### 6. 动态样式处理

```typescript
// ✅ 推荐：使用 CSS 变量 + inline style（仅限动态值）
const DynamicComponent = ({ opacity = 0.8 }) => {
  return (
    <div 
      className="bg-[var(--color-primary)] text-white"
      style={{ opacity }} // 仅动态值使用 style
    >
      内容
    </div>
  );
};

// ✅ 推荐：使用 CSS 自定义属性
<div 
  className="bg-primary"
  style={{ '--custom-opacity': opacity } as React.CSSProperties}
>
  内容
</div>

// ❌ 禁止：完全使用 style 对象
<div style={{
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  padding: '16px',
  borderRadius: '8px'
}}>
  应该使用 className
</div>
```

#### 7. 全局 CSS 使用场景

```css
/* ✅ 推荐：在 global.css 中定义复杂组件样式 */
.custom-card {
  @apply p-4 rounded-lg shadow-md;
  background: var(--color-bg-primary);
  transition: all var(--motion-duration) var(--motion-ease-out);
}

.custom-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--box-shadow-lg);
}

/* 然后在组件中使用 */
<div className="custom-card">内容</div>
```

#### 8. 样式检查清单

编写样式时必须检查：

1. ✅ **是否优先使用 Tailwind 工具类**？
2. ✅ **是否避免使用 style 内联样式**？
3. ✅ **是否使用 CSS 变量而非硬编码颜色/尺寸**？
4. ✅ **是否使用响应式前缀（sm:, md:, lg:）**？
5. ✅ **条件样式是否使用 className 组合**？
6. ✅ **Ant Design 组件是否使用 className 而非 style**？
7. ✅ **动态值是否最小化使用 style**？

### 目录结构规范

```
src/
├── constants/          # 常量定义
├── layouts/            # 布局组件
├── locales/            # 国际化文件
├── pages/              # 页面组件
├── services/           # API 服务层
│   ├── api.ts         # API 接口定义
│   ├── request.ts     # 请求封装
│   └── queryClient.ts # React Query 配置
├── styles/             # 样式文件
│   ├── variables.css  # CSS 变量（首屏加载）
│   └── global.css     # 全局样式
├── theme/              # 主题配置
│   └── index.ts       # 主题配置导出
└── types/              # TypeScript 类型定义
    ├── api.ts         # API 相关类型
    ├── utils.ts       # 工具类型
    └── index.ts       # 类型导出入口
```

### 路径别名

| 别名 | 路径 | 用途 |
|------|------|------|
| `@` | `/src` | 源代码根目录 |
| `@components` | `/src/components/` | 组件 |
| `@hooks` | `/src/hooks/` | 自定义 Hooks |
| `@services` | `/src/services/` | API 服务 |
| `@pages` | `/src/pages/` | 页面组件 |
| `@layouts` | `/src/layouts/` | 布局组件 |
| `@assets` | `/src/assets/` | 静态资源 |
| `@styles` | `/src/styles/` | 样式文件 |
| `@typeDefs` | `/src/types/` | 类型定义 |

## 🔧 开发规范

### 1. 组件开发

- 使用 `memo` 包裹函数组件以优化性能
- Props 必须定义接口类型
- 默认参数值在解构时提供
- 使用 `useMemo` 和 `useCallback` 优化性能

### 2. 状态管理

- 全局状态使用 Zustand
- 服务端状态使用 React Query
- 表单状态使用 React Hook Form
- 避免在组件内使用过多 `useState`

### 3. 错误处理

```typescript
// 请求拦截和响应拦截已在 request.ts 中统一处理
// 组件内只需关注业务逻辑

try {
  const data = await api.getUser(id);
  // 处理数据
} catch (error) {
  // 处理业务特定错误
  if (error instanceof Error) {
    console.error('业务错误:', error.message);
  }
}
```

### 4. 性能优化

- 使用 `React.memo` 包裹组件
- 使用 `useMemo` 缓存计算结果
- 使用 `useCallback` 缓存函数
- 使用 `React Query` 的 `staleTime` 减少重复请求

### 5. 性能要求与指标

#### 核心性能指标（Core Web Vitals）

| 指标 | 目标值 | 说明 |
|------|--------|------|
| **LCP (最大内容绘制)** | < 2.5s | 页面主要内容加载完成时间 |
| **FID (首次输入延迟)** | < 100ms | 用户首次交互的响应时间 |
| **CLS (累计布局偏移)** | < 0.1 | 页面布局稳定性 |
| **FCP (首次内容绘制)** | < 1.8s | 页面开始渲染时间 |
| **TTI (可交互时间)** | < 3.8s | 页面完全可交互时间 |

#### Bundle 大小限制

```
⚠️ 警告阈值：
- 单个 JS chunk: < 300KB (gzip 后)
- 初始 bundle 大小： < 500KB (gzip 后)
- 页面总 JS 大小： < 1MB (gzip 后)

❌ 禁止：
- 超过 500KB 的单个 chunk（除非经过审批）
- 未经 code splitting 的大型依赖包
- 在生产环境打包中遗留调试代码
```

#### 首屏加载优化

```typescript
// ✅ 推荐：使用 React.lazy + Suspense 进行代码分割
import { Suspense, lazy } from 'react';

const LazyComponent = lazy(() => import('@/components/HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyComponent />
    </Suspense>
  );
}

// ✅ 推荐：使用动态导入处理大型依赖
const handleClick = async () => {
  const heavyModule = await import('@/utils/heavyModule');
  heavyModule.doWork();
};

// ✅ 推荐：使用 CSS 变量内联避免 FOUC
// 已在 .umirc.ts 中配置自动内联 variables.css
```

#### 图片优化

```typescript
// ✅ 推荐：使用懒加载
<img loading="lazy" src={image} alt="description" />

// ✅ 推荐：使用 WebP 格式并提供 fallback
<picture>
  <source srcSet={webpImage} type="image/webp" />
  <img src={fallbackImage} alt="description" />
</picture>

// ✅ 推荐：使用响应式图片
<img 
  srcSet={`
    ${smallImage} 480w,
    ${mediumImage} 768w,
    ${largeImage} 1200w
  `}
  sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, 1200px"
  src={largeImage}
  alt="description"
/>
```

#### 列表渲染优化

```typescript
import { memo } from 'react';

// ✅ 推荐：虚拟滚动处理大数据列表
// 使用 react-window 或 react-virtualized
import { FixedSizeList } from 'react-window';

const VirtualList = memo(({ data }) => (
  <FixedSizeList
    height={600}
    itemCount={data.length}
    itemSize={35}
  >
    {({ index, style }) => (
      <div style={style}>{data[index]}</div>
    )}
  </FixedSizeList>
));

// ✅ 推荐：使用 useMemo 缓存过滤/排序结果
const FilteredList = memo(({ items, filter }) => {
  const filteredItems = useMemo(
    () => items.filter(item => item.name.includes(filter)),
    [items, filter]
  );
  
  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
});
```

#### 防抖与节流

```typescript
import { useDebounce, useThrottle } from 'ahooks';

// ✅ 推荐：搜索输入使用防抖
const SearchBox = () => {
  const [value, setValue] = useState('');
  const debouncedValue = useDebounce(value, { wait: 300 });
  
  // 使用 debouncedValue 进行搜索
  return <input value={value} onChange={e => setValue(e.target.value)} />;
};

// ✅ 推荐：滚动事件使用节流
const ScrollTracker = () => {
  const handleScroll = useThrottle(
    () => console.log('scrolling'),
    { wait: 100 }
  );
  
  return <div onScroll={handleScroll}>Content</div>;
};
```

#### 性能监控

```typescript
// ✅ 推荐：使用 Performance API 监控关键指标
if (typeof performance !== 'undefined') {
  // LCP 监控
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);
  }).observe({ entryTypes: ['largest-contentful-paint'] });
  
  // CLS 监控
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      console.log('Layout Shift:', entry.value);
    }
  }).observe({ entryTypes: ['layout-shift'] });
}
```

#### 性能检查清单

生成代码时必须考虑的性能优化：

1. ✅ **组件层面**
   - 是否使用 `React.memo` 包裹？
   - Props 是否稳定（避免不必要的重渲染）？
   - 是否使用 `useMemo`/`useCallback` 缓存？

2. ✅ **数据层面**
   - 是否使用虚拟滚动处理大数据？
   - 是否使用防抖/节流处理频繁操作？
   - 是否合理使用 `staleTime` 减少请求？

3. ✅ **资源层面**
   - 图片是否使用懒加载？
   - 大型组件是否使用 lazy loading？
   - 是否使用了代码分割？

4. ✅ **网络层面**
   - API 请求是否合并？
   - 是否使用了适当的缓存策略？
   - 是否避免了重复请求？

### 6. 代码检查

```bash
# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 自动修复
pnpm lint:fix

# 格式化
pnpm format
```

## 📝 测试规范

### Jest 测试

```typescript
// test/example.test.ts
import { render, screen } from '@testing-library/react';
import Component from '@/components/Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch
```

## 🎯 AI Coding 特别提示

### 生成代码时的检查清单

#### 基础规范（必须满足）

1. ✅ **类型安全**: 是否所有变量、函数都有明确的类型？
2. ✅ **无 any**: 是否使用了 `any` 类型？（绝对禁止）
3. ✅ **路径别名**: 是否使用了 `@/` 等路径别名？
4. ✅ **组件规范**: 组件是否使用 `memo` 包裹？
5. ✅ **Props 类型**: Props 是否定义了接口？
6. ✅ **Hooks 规范**: 自定义 Hooks 是否以 `use` 开头？
7. ✅ **国际化**: 文本内容是否使用了 i18n？
8. ✅ **样式规范**: 
   - 是否优先使用 Tailwind CSS 工具类？
   - 是否避免使用 style 内联样式？
   - 是否使用 CSS 变量而非硬编码值？
   - 是否使用响应式前缀（sm:, md:, lg:）？
9. ✅ **错误处理**: 是否有适当的错误处理？

#### 性能优化（必须考虑）

10. ✅ **组件性能**: 是否使用 `useMemo`/`useCallback` 缓存？
11. ✅ **代码分割**: 大型组件是否使用 lazy loading？
12. ✅ **列表渲染**: 大数据列表是否使用虚拟滚动？
13. ✅ **防抖节流**: 频繁操作是否使用防抖/节流？
14. ✅ **图片优化**: 图片是否使用懒加载和响应式？
15. ✅ **请求优化**: 是否合理使用 `staleTime` 减少请求？

### 常见错误及修正

#### ❌ 错误 1: 使用 any

```typescript
// 错误
function fetchData(url: string): Promise<any> {
  return request.get(url);
}

// 正确
interface FetchResponse {
  data: unknown;
  message: string;
}

function fetchData(url: string): Promise<FetchResponse> {
  return request.get(url);
}
```

#### ❌ 错误 2: 缺少 Props 类型

```typescript
// 错误
const Button = (props) => {
  return <button>{props.text}</button>;
};

// 正确
interface ButtonProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
}

const Button = memo<ButtonProps>((props) => {
  const { text, onClick, disabled = false } = props;
  return <button onClick={onClick} disabled={disabled}>{text}</button>;
});
```

#### ❌ 错误 3: 未使用路径别名

```typescript
// 错误
import { xxx } from '../../../components/xxx';

// 正确
import { xxx } from '@/components/xxx';
```

## 📚 参考文档

- [Umi 文档](https://umijs.org/)
- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Ant Design 文档](https://ant.design/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [React Query 文档](https://tanstack.com/query)
- [React Hook Form 文档](https://react-hook-form.com/)

## 🚀 快速开始命令

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 测试
pnpm test
```

---

**重要提醒**: 本规则文件中的所有规范都必须严格遵守，特别是**禁止使用 `any` 类型**这一核心原则。AI 在生成代码时必须进行自我检查，确保符合所有规范。
