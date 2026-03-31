// import { ThemeConfig } from 'antd';
// import { getCssVariableValueCached } from '@/utils/getCssVariableValue';

// export const Theme: ThemeConfig = {
//   token: {
//     // 颜色类 - 使用 CSS 变量
//     colorPrimary: getCssVariableValueCached('var(--color-primary)'),
//     colorSuccess: getCssVariableValueCached('var(--color-success)'),
//     colorWarning: getCssVariableValueCached('var(--color-warning)'),
//     colorError: getCssVariableValueCached('var(--color-error)'),
//     colorInfo: getCssVariableValueCached('var(--color-info)'),

//     // 文本颜色
//     colorText: getCssVariableValueCached('var(--color-text-primary)'),
//     colorTextSecondary: getCssVariableValueCached(
//       'var(--color-text-secondary)',
//     ),
//     colorTextTertiary: getCssVariableValueCached('var(--color-text-tertiary)'),
//     colorTextQuaternary: getCssVariableValueCached(
//       'var(--color-text-quaternary)',
//     ),

//     // 背景色
//     colorBgContainer: getCssVariableValueCached('var(--color-bg-primary)'),
//     colorBgElevated: getCssVariableValueCached('var(--color-bg-secondary)'),
//     colorBgLayout: getCssVariableValueCached('var(--color-bg-tertiary)'),

//     // 边框色
//     colorBorder: getCssVariableValueCached('var(--color-border)'),
//     colorBorderSecondary: getCssVariableValueCached(
//       'var(--color-border-light)',
//     ),
//     colorBorderBg: getCssVariableValueCached('var(--color-border-dark)'),

//     // 圆角类 - 使用设计令牌 (与 CSS 变量保持一致)
//     borderRadiusSM: Number(
//       getCssVariableValueCached('var(--border-radius-sm)'),
//     ),
//     borderRadius: Number(getCssVariableValueCached('var(--border-radius-md)')),
//     borderRadiusLG: Number(
//       getCssVariableValueCached('var(--border-radius-lg)'),
//     ),

//     // 阴影类 - 使用 CSS 变量
//     boxShadow: getCssVariableValueCached('var(--box-shadow-md)'),
//     boxShadowSecondary: getCssVariableValueCached('var(--box-shadow-sm)'),
//     boxShadowTertiary: getCssVariableValueCached('var(--box-shadow-lg)'),

//     // 字体类 - 使用设计令牌 (与 CSS 变量保持一致)
//     fontSizeSM: Number(getCssVariableValueCached('var(--font-size-sm)')),
//     fontSize: Number(getCssVariableValueCached('var(--font-size-base)')),
//     fontSizeLG: Number(getCssVariableValueCached('var(--font-size-lg)')),
//     fontSizeXL: Number(getCssVariableValueCached('var(--font-size-xl)')),
//   },
// };
import { useTheme } from 'ahooks';
import { theme } from 'antd';
import { useMemo } from 'react';

export function useThemeConfig() {
  const { theme: themeragflow } = useTheme();

  const getCssVariableValueCached = (cssVariable: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(cssVariable);

  const themeConfig = useMemo(
    () => ({
      token: {
        // 颜色类 - 使用 CSS 变量
        colorPrimary: getCssVariableValueCached('--color-primary'),
        colorSuccess: getCssVariableValueCached('--color-success'),
        colorWarning: getCssVariableValueCached('--color-warning'),
        colorError: getCssVariableValueCached('--color-error'),
        colorInfo: getCssVariableValueCached('--color-info'),

        // 文本颜色
        colorText: getCssVariableValueCached('--color-text-primary'),
        colorTextSecondary: getCssVariableValueCached('--color-text-secondary'),
        colorTextTertiary: getCssVariableValueCached('--color-text-tertiary'),
        colorTextQuaternary: getCssVariableValueCached(
          '--color-text-quaternary',
        ),

        // 背景色
        colorBgContainer: getCssVariableValueCached('--color-bg-primary'),
        colorBgElevated: getCssVariableValueCached('--color-bg-secondary'),
        colorBgLayout: getCssVariableValueCached('--color-bg-tertiary'),

        // 边框色
        colorBorder: getCssVariableValueCached('--color-border'),
        colorBorderSecondary: getCssVariableValueCached(
          '--color-border-secondary',
        ),
        colorBorderBg: getCssVariableValueCached('--color-border-bg'),

        // 圆角类 - 使用设计令牌 (与 CSS 变量保持一致，需要去掉 px 单位)
        borderRadiusSM:
          parseFloat(getCssVariableValueCached('--border-radius-sm')) || 4,
        borderRadius:
          parseFloat(getCssVariableValueCached('--border-radius-md')) || 6,
        borderRadiusLG:
          parseFloat(getCssVariableValueCached('--border-radius-lg')) || 8,

        // 阴影类 - 使用 CSS 变量
        boxShadow: getCssVariableValueCached('--box-shadow'),
        boxShadowSecondary: getCssVariableValueCached('--box-shadow-sm'),
        boxShadowTertiary: getCssVariableValueCached('--box-shadow-tertiary'),

        // 字体类 - 使用设计令牌 (与 CSS 变量保持一致，需要去掉 px 单位)
        fontSizeSM:
          parseFloat(getCssVariableValueCached('--font-size-sm')) || 12,
        fontSize:
          parseFloat(getCssVariableValueCached('--font-size-base')) || 14,
        fontSizeLG:
          parseFloat(getCssVariableValueCached('--font-size-lg')) || 16,
        fontSizeXL:
          parseFloat(getCssVariableValueCached('--font-size-xl')) || 20,

        // 线条类
        lineWidth: parseFloat(getCssVariableValueCached('--line-width')) || 1,
        lineHeight:
          parseFloat(getCssVariableValueCached('--line-height')) ||
          1.5714285714285714,
      },

      algorithm: theme.defaultAlgorithm,
    }),
    [themeragflow],
  );

  return themeConfig;
}
export default useThemeConfig;
