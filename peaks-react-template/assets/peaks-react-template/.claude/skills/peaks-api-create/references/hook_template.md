# Hook Template (按业务模块组织)

## 业务模块 Hook 文件结构

```typescript
// src/hooks/services/useModuleName.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import type { ApiResponse } from '@typeDefs/api';
import apiPaths from '@services/api';
import { requestMethods } from '@services/request';

// ============ 类型定义 ============
// 导出所有 Params interface，供 api.ts 使用
export interface GetItemParams {
  id: string;
}

export interface CreateItemParams {
  name: string;
  value: number;
}

export interface UpdateItemParams {
  id: string;
  name?: string;
  value?: number;
}

// 响应类型（文件内使用，可共享）
interface ItemResponse {
  id: string;
  name: string;
  value: number;
}

// ============ GET 请求 - useQuery ============
export const useGetItem = (params: GetItemParams) => {
  return useQuery<ApiResponse<ItemResponse>>({
    queryKey: ['item', params.id],
    queryFn: () =>
      requestMethods.get<ApiResponse<ItemResponse>>(
        apiPaths.get_item(params),
      ) as Promise<ApiResponse<ItemResponse>>,
    enabled: !!params.id,
  });
};

export const useGetItemList = () => {
  return useQuery<ApiResponse<ItemResponse[]>>({
    queryKey: ['itemList'],
    queryFn: () =>
      requestMethods.get<ApiResponse<ItemResponse[]>>(
        apiPaths.get_item_list,
      ) as Promise<ApiResponse<ItemResponse[]>>,
  });
};

// ============ POST 请求 - useMutation ============
export const useCreateItem = () => {
  return useMutation<ApiResponse<ItemResponse>, Error, CreateItemParams>({
    mutationFn: (data) =>
      requestMethods.post<ApiResponse<ItemResponse>>(
        apiPaths.create_item(data),
        data,
      ) as Promise<ApiResponse<ItemResponse>>,
  });
};

// ============ PUT 请求 - useMutation ============
export const useUpdateItem = () => {
  return useMutation<ApiResponse<ItemResponse>, Error, UpdateItemParams>({
    mutationFn: ({ id, ...data }) =>
      requestMethods.put<ApiResponse<ItemResponse>>(
        apiPaths.update_item(id, data),
        data,
      ) as Promise<ApiResponse<ItemResponse>>,
  });
};

// ============ DELETE 请求 - useMutation ============
export const useDeleteItem = () => {
  return useMutation<ApiResponse<void>, Error, { id: string }>({
    mutationFn: ({ id }) =>
      requestMethods.delete<ApiResponse<void>>(
        apiPaths.delete_item(id),
      ) as Promise<ApiResponse<void>>,
  });
};
```

## 使用示例

```typescript
import {
  useGetItem,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
} from '@/hooks/services/useItem';

// Query Hook
const { data, isLoading, error } = useGetItem({ id: '123' });

// 带 enabled 条件
const { data } = useGetItem({ id: itemId || '' }); // itemId 为 undefined 时不请求

// Mutation Hook
const createMutation = useCreateItem();
await createMutation.mutateAsync({ name: 'New Item', value: 100 });

// Mutation with handlers
const updateMutation = useUpdateItem();
updateMutation.mutate(
  { id: '123', name: 'Updated' },
  {
    onSuccess: (data) => console.log('Updated:', data),
    onError: (error) => console.error('Update failed:', error),
  },
);
```

## 关键要点

1. **按业务模块组织** - 一个模块的所有 API 在一个文件中
2. **类型定义在顶部** - 所有 Params interface 必须 export
3. **分类组织** - GET 请求在前，其他请求在后，使用注释分隔
4. **共享类型** - 同一模块的 hook 可共享 Response 类型
5. **enabled 条件** - Query hook 应该根据参数设置 enabled
6. **类型安全** - 禁止使用 any，使用明确的类型定义
