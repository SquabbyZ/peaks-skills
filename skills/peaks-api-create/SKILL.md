---
name: peaks-api-create
description: |
  Auto-generate API hooks from Swagger/OpenAPI specifications. Use when: (1) User wants to create new API endpoints based on swagger documentation, (2) User wants to add new API hooks from swagger, (3) User wants to automatically generate React Query hooks from swagger URL. Triggers: "创建api hook", "generate api hooks", "add swagger api", "根据swagger生成hook"
---

# Peaks API Create

根据 Swagger/OpenAPI 规范自动生成 API hooks。

## Workflow

### Step 1: 获取 Swagger JSON

用户会提供一个 swagger JSON URL（例如：`https://validator.swagger.io/validator/openapi.json`）。

使用 WebFetch 工具获取 swagger 内容：

```typescript
// 使用 WebFetch 工具获取 swagger JSON
WebFetch(url: "用户提供的URL")
```

### Step 2: 解析 Swagger 并检查 API

解析 swagger 文档中的 paths 和 endpoints，然后在 `src/services/api.ts` 中检查是否已存在相同的 URL：

- 如果存在：使用现有的 API 路径
- 如果不存在：在 `src/services/api.ts` 中添加新的 API 路径

**API 路径添加格式：**

- 不带参数的 endpoint：

```typescript
export default {
  login: `${prefixRoute}/user/login`,
  // 新增 endpoint
  new_endpoint: `${prefixRoute}/path/to/endpoint`,
};
```

- 带参数的 endpoint（重要）：在 hook 生成后，需要将 params 的 interface 导出并在 api.ts 中使用

### Step 3: 生成 Hook

在 `src/hooks/services/` 目录下，**按业务模块**生成 hook 文件。

**核心原则：按业务模块组织**

- 同一业务模块的所有 API 操作放在**同一个文件**中
- 文件命名：`use + 业务模块名.ts`（如 `useUser.ts`、`useValidator.ts`）
- 每个 API endpoint 导出一个独立的 hook 函数
- 同一业务模块的多个 hook 函数共享类型定义

**业务模块划分规则：**

根据 Swagger paths 的第一级路径确定业务模块：

- `/user/login`、`/user/profile` → `useUser.ts`
- `/validator/check` → `useValidator.ts`
- `/auth/token` → `useAuth.ts`

**重要：带参数 API 的处理规则**

当 API 带有路径参数时，必须：

1. **在 hook 文件中导出 params 的 interface**（使用 `export` 关键字）
2. **更新 api.ts 使用该 interface**

**示例 - 业务模块文件结构**（useUser.ts）：

```typescript
// src/hooks/services/useUser.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import type { ApiResponse } from '@typeDefs/api';
import apiPaths from '@services/api';
import { requestMethods } from '@services/request';

// ============ 类型定义 ============
// 导出所有 params interface，供 api.ts 使用
export interface GetAuthorizationParams {
  token: string;
}

export interface CreateUserParams {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserParams {
  id: string;
  name?: string;
  email?: string;
}

// 响应类型
interface UserResponse {
  id: string;
  name: string;
  email: string;
  token: string;
}

// ============ GET 请求 - useQuery ============
export const useGetAuthorization = (params: GetAuthorizationParams) => {
  return useQuery<ApiResponse<UserResponse>>({
    queryKey: ['authorization', params.token],
    queryFn: () =>
      requestMethods.get<ApiResponse<UserResponse>>(
        apiPaths.get_authorization(params.token),
      ) as Promise<ApiResponse<UserResponse>>,
    enabled: !!params.token,
  });
};

export const useGetUserById = (id: string) => {
  return useQuery<ApiResponse<UserResponse>>({
    queryKey: ['user', id],
    queryFn: () =>
      requestMethods.get<ApiResponse<UserResponse>>(
        apiPaths.get_user_by_id(id),
      ) as Promise<ApiResponse<UserResponse>>,
    enabled: !!id,
  });
};

// ============ POST 请求 - useMutation ============
export const useCreateUser = () => {
  return useMutation<ApiResponse<UserResponse>, Error, CreateUserParams>({
    mutationFn: (data) =>
      requestMethods.post<ApiResponse<UserResponse>>(
        apiPaths.create_user(data),
        data,
      ) as Promise<ApiResponse<UserResponse>>,
  });
};

// ============ PUT 请求 - useMutation ============
export const useUpdateUser = () => {
  return useMutation<ApiResponse<UserResponse>, Error, UpdateUserParams>({
    mutationFn: ({ id, ...data }) =>
      requestMethods.put<ApiResponse<UserResponse>>(
        apiPaths.update_user(id, data),
        data,
      ) as Promise<ApiResponse<UserResponse>>,
  });
};

// ============ DELETE 请求 - useMutation ============
export const useDeleteUser = () => {
  return useMutation<ApiResponse<void>, Error, { id: string }>({
    mutationFn: ({ id }) =>
      requestMethods.delete<ApiResponse<void>>(
        apiPaths.delete_user(id),
      ) as Promise<ApiResponse<void>>,
  });
};
```

然后更新 `src/services/api.ts` 使用导出的 interface：

```typescript
import {
  GetAuthorizationParams,
  CreateUserParams,
  UpdateUserParams,
} from '@hooks/services/useUser';

export default {
  // User 模块
  get_authorization: (params: GetAuthorizationParams) =>
    `${prefixRoute}/user/authorization/${params.token}`,
  create_user: (params: CreateUserParams) => `${prefixRoute}/user/create`,
  update_user: (id: string, params: UpdateUserParams) =>
    `${prefixRoute}/user/${id}`,
  delete_user: (id: string) => `${prefixRoute}/user/${id}`,
};
```

**生成规则：**

1. **文件命名**：`use + 业务模块名.ts`
   - 根据 Swagger paths 的第一级路径确定模块名
   - 例如：`/user/*` → `useUser.ts`，`/validator/*` → `useValidator.ts`

2. **GET 请求**：使用 `useQuery`
   - Hook 命名：`use + Get + Endpoint 名`（如 `useGetUserById`）
   - queryKey: `['entity 名', 参数]`
   - enabled: 根据参数是否存在设置

3. **POST/PUT/PATCH/DELETE 请求**：使用 `useMutation`
   - Hook 命名：`use + 操作 + Endpoint 名`（如 `useCreateUser`、`useUpdateUser`）
   - mutationFn: 使用对应的 requestMethods

4. **类型定义**：
   - 所有 Params interface 必须导出（export），供 api.ts 使用
   - Response 类型在文件内定义，多个 hook 可共享
   - **禁止使用 `any` 类型**

5. **代码组织**：
   - 类型定义放在文件顶部
   - GET 请求（useQuery）在前
   - 其他请求（useMutation）在后
   - 使用注释分隔不同类型

### Step 4: 代码格式化

**非常重要**：生成或更新代码后，必须使用项目自身的 prettier 配置进行格式化。

项目 prettier 配置位于：`/Users/yuanyuan/Desktop/work/prompt-project/prompt-project/.prettierrc.json`

配置内容：

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
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

使用 prettier 格式化生成的文件：

```bash
# 格式化单个文件
npx prettier --write src/services/api.ts
npx prettier --write src/hooks/services/useXXX.ts

# 或格式化整个目录
npx prettier --write src/services/api.ts src/hooks/services/*.ts
```

### Step 5: 检查并更新 Index

如果 `src/hooks/services/index.ts` 存在，确保导出新的 hook。

**注意**：由于现在按业务模块组织，一个文件会导出多个 hook，需要全部导出：

```typescript
// src/hooks/services/index.ts
export * from './useUser';
export * from './useValidator';
```

### Step 6: 生成单元测试文件

在 `test/hooks/` 目录下，**按业务模块**生成对应的测试文件。

**测试文件命名规则：**

- 格式：`{业务模块名}.test.ts`
- 例如：`useUser.ts` → `test/hooks/useUser.test.ts`

**测试文件模板（包含多个 hook 的测试）：**

```typescript
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useGetAuthorization,
  useCreateUser,
  useUpdateUser,
} from '../../src/hooks/services/useUser';
import { requestMethods } from '../../src/services';

jest.mock('../../src/services', () => ({
  requestMethods: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('useUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useGetAuthorization', () => {
    test('should call get method with token', async () => {
      const mockResponse = {
        code: 0,
        data: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          token: 'test-token',
        },
        message: 'success',
      };
      (requestMethods.get as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useGetAuthorization({ token: 'test-token' }),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestMethods.get).toHaveBeenCalledWith(
        '/api/user/authorization/test-token',
      );
    });

    test('should not call get when token is empty', () => {
      const { result } = renderHook(() => useGetAuthorization({ token: '' }));

      expect(result.current.fetchStatus).toBe('idle');
      expect(requestMethods.get).not.toHaveBeenCalled();
    });

    test('should handle error', async () => {
      const mockError = new Error('Network error');
      (requestMethods.get as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() =>
        useGetAuthorization({ token: 'test-token' }),
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useCreateUser', () => {
    test('should call post method with data', async () => {
      const mockResponse = {
        code: 0,
        data: {
          id: '1',
          name: 'New User',
          email: 'new@example.com',
        },
        message: 'success',
      };
      (requestMethods.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateUser());

      await act(async () => {
        await result.current.mutateAsync({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestMethods.post).toHaveBeenCalledWith('/api/user/create', {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      });
    });

    test('should handle mutation error', async () => {
      const mockError = new Error('Create failed');
      (requestMethods.post as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateUser());

      await act(async () => {
        try {
          await result.current.mutateAsync({
            name: 'New User',
            email: 'new@example.com',
            password: 'password123',
          });
        } catch (error) {
          expect(error).toEqual(mockError);
        }
      });

      expect(result.current.isError).toBe(true);
    });
  });
});
```

**测试规则：**

1. **必须 mock `requestMethods`** - 使用 jest.mock 模拟请求方法
2. **按模块组织测试** - 一个模块的所有 hook 测试放在一个 describe 块中
3. **每个 hook 单独 describe** - 清晰区分不同 hook 的测试
4. **测试成功场景** - 验证 API 调用和返回数据处理
5. **测试 enabled 条件** - 验证参数不满足时不发起请求
6. **测试错误处理** - 验证错误场景
7. **使用 `waitFor`** - 异步断言必须使用 waitFor 包裹
8. **使用 `act`** - mutation 操作必须用 act 包裹
9. **每个测试用例必须有明确的断言** - 不要有空的 test 函数

**生成测试文件后，使用 prettier 格式化：**

```bash
npx prettier --write test/hooks/useUser.test.ts
```

### Step 7: 生成 Mock 数据

根据 Umi Mock 规范，在 `mock/` 目录下生成对应的 Mock 文件。

**Mock 目录结构：**

```
mock/
├── index.ts          # 入口文件
├── validator.ts     # Swagger Validator API mocks
└── user.ts          # 用户相关 mocks
```

**Mock 文件模板：**

```typescript
// mock/validator.ts
import { defineMock } from 'umi';

export default defineMock({
  // GET 请求 - 只需路径
  'GET /api/validator/': {
    code: 0,
    data: {
      messages: [],
      schemaValidationMessages: [],
    },
    message: 'success',
  },

  // POST 请求
  'POST /api/validator/': {
    code: 0,
    data: {
      messages: [],
      schemaValidationMessages: [],
    },
    message: 'success',
  },

  // 带路径参数
  'GET /api/user/authorization/:token': {
    code: 0,
    data: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      token: 'test-token',
    },
    message: 'success',
  },
});
```

**生成规则：**

1. **使用 `defineMock`** - Umi 提供的类型帮助函数
2. **路径格式** - 使用 `${prefixRoute}` 对应的实际路径
3. **响应格式** - 与 hook 中的 `ApiResponse<T>` 格式一致
4. **按 API 分类** - 每个模块一个 mock 文件（如 validator.ts, user.ts）

**根据 HTTP 方法生成 Mock 路径：**

- GET: `'GET /api/path'` 或简写为 `'/api/path'`
- POST: `'POST /api/path'`
- PUT: `'PUT /api/path'`
- PATCH: `'PATCH /api/path'`
- DELETE: `'DELETE /api/path'`

**带查询参数的 Mock：**

```typescript
// 带有 query params 的情况
'GET /api/validator/': (req, res) => {
  const { url, resolve } = req.query;
  res.json({
    code: 0,
    data: {
      messages: [],
      schemaValidationMessages: [],
    },
    message: 'success',
  });
},
```

**生成 Mock 后，使用 prettier 格式化：**

```bash
npx prettier --write mock/**/*.ts
```

## Rules

1. 始终使用 `requestMethods` from `@services/request`（umi-request wrapper）
2. 始终使用 `ApiResponse<T>` type from `@typeDefs/api`
3. 始终使用 `apiPaths` from `@services/api` 构建 URL
4. GET 请求使用 `useQuery`，POST/PUT/DELETE/PATCH 使用 `useMutation`
5. 定义有意义的 response 接口名称
6. 使用 endpoint 名称和参数作为 queryKey 用于缓存管理
7. 适当设置 `enabled` 条件
8. **生成或更新代码后，必须使用 prettier 格式化**
9. **【强制】禁止使用 `any` 类型** - 必须使用明确的类型定义，如 `unknown`、具体的 interface 或 type
10. **【强制】带参数的 API** - 必须导出 params interface 并在 api.ts 中使用
11. **【强制】按业务模块组织 hook** - 同一业务模块的所有 API 操作放在同一个文件中
12. **【强制】生成 hook 后必须生成对应的单元测试文件** - 在 `test/hooks/` 目录下创建 `{模块名}.test.ts`
13. **【强制】生成 hook 后必须生成对应的 Mock 数据** - 在 `mock/` 目录下创建对应的 mock 文件
14. **【强制】类型导出** - 所有 Params interface 必须使用 `export` 导出，供 api.ts 使用

## Project Context

- Request library: umi-request (not fetch)
- API paths: `src/services/api.ts`
- Request methods: `src/services/request.ts` exports `requestMethods`
- Types: `src/types/api.ts` exports `ApiResponse`, `RequestParams`, `RequestData`
- Hook location: `src/hooks/services/`
- Prettier config: `.prettierrc.json` (singleQuote, trailingComma: all, printWidth: 80)

## 使用示例

当用户提供 swagger URL 时：

```
用户：https://validator.swagger.io/validator/openapi.json
```

**执行流程：**

1. WebFetch 获取 swagger JSON
2. 解析 paths 中的所有 endpoints
3. **按业务模块分组** endpoints（根据第一级路径）
4. 检查 `src/services/api.ts` 是否已存在对应 API
5. 对不存在的 endpoint 添加到 api.ts
6. **按业务模块生成 hook 文件**（如 `useUser.ts`、`useValidator.ts`）
   - 同一模块的所有 API 操作在一个文件中
   - 导出多个 hook 函数（如 `useGetUser`、`useCreateUser` 等）
   - 导出所有 Params interface 供 api.ts 使用
7. 为每个业务模块生成对应的单元测试文件（如 `useUser.test.ts`）
8. 为每个 API 生成对应的 Mock 数据
9. 使用 prettier 格式化所有生成/修改的文件

**示例结构：**

```
src/hooks/services/
├── useUser.ts              # 用户相关所有 API
├── useValidator.ts         # 验证相关所有 API
└── index.ts                # 统一导出

test/hooks/
├── useUser.test.ts         # 用户 API 的所有测试
└── useValidator.test.ts    # 验证 API 的所有测试
```
