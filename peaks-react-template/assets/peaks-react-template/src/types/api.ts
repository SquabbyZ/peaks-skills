import { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';

export type RequestMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type RequestParams = Record<string, any>;
export type RequestData = Record<string, any>;

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface ApiOptions<T> {
  method?: RequestMethod;
  params?: RequestParams;
  data?: RequestData;
  queryOptions?: UseQueryOptions<T>;
  mutationOptions?: UseMutationOptions<
    T,
    unknown,
    { url: string; data?: RequestData; params?: RequestParams }
  >;
}
