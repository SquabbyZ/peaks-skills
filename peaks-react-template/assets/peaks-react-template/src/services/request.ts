import { ApiResponse } from '@/types';
import { extend } from 'umi-request';

// 创建请求实例
const request = extend({
  prefix: process.env.API_DOMAIN || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截
request.interceptors.request.use((url, options) => {
  // 可以在这里添加token等认证信息
  const token = localStorage.getItem('token');
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return {
    url,
    options,
  };
});

// 响应拦截
request.interceptors.response.use(async (response) => {
  // 可以在这里处理统一的响应逻辑
  try {
    const data = await response.clone().json();
    if (response.status === 200) {
      return data;
    }
    return response;
  } catch (error) {
    // 可以在这里处理统一的错误逻辑
    if (error instanceof Error) {
      console.error('Error:', error.message);
    }
    return response;
  }
});

// 生成公共方法
export const requestMethods = {
  get: <T = any>(url: string, params?: Record<string, any>) => {
    return request.get<ApiResponse<T> | T>(url, { params });
  },
  post: <T = any>(url: string, data?: Record<string, any>) => {
    return request.post<ApiResponse<T> | T>(url, { data });
  },
  patch: <T = any>(url: string, data?: Record<string, any>) => {
    return request.patch<ApiResponse<T> | T>(url, { data });
  },
  put: <T = any>(url: string, data?: Record<string, any>) => {
    return request.put<ApiResponse<T> | T>(url, { data });
  },
  delete: <T = any>(url: string, params?: Record<string, any>) => {
    return request.delete<ApiResponse<T> | T>(url, { params });
  },
};

export default request;
