import React from 'react';
import { Outlet } from 'umi';
import '../styles/global.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../services';
import { ConfigProvider } from 'antd';
import { useThemeConfig } from '@/theme';

const Layout = () => {
  const theme = useThemeConfig();

  return (
    <ConfigProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    </ConfigProvider>
  );
};

export default React.memo(Layout);
