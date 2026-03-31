/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}',
    './layouts/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 主色调 (Brand Color)
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          bg: 'var(--color-primary-bg)',
          'bg-hover': 'var(--color-primary-bg-hover)',
          border: 'var(--color-primary-border)',
          'border-hover': 'var(--color-primary-border-hover)',
          text: 'var(--color-primary-text)',
          'text-active': 'var(--color-primary-text-active)',
        },
        // 成功色 (Success Color)
        success: {
          DEFAULT: 'var(--color-success)',
          hover: 'var(--color-success-hover)',
          active: 'var(--color-success-active)',
          bg: 'var(--color-success-bg)',
          border: 'var(--color-success-border)',
          text: 'var(--color-success-text)',
        },
        // 警告色 (Warning Color)
        warning: {
          DEFAULT: 'var(--color-warning)',
          hover: 'var(--color-warning-hover)',
          active: 'var(--color-warning-active)',
          bg: 'var(--color-warning-bg)',
          border: 'var(--color-warning-border)',
          text: 'var(--color-warning-text)',
        },
        // 错误色 (Error Color)
        error: {
          DEFAULT: 'var(--color-error)',
          hover: 'var(--color-error-hover)',
          active: 'var(--color-error-active)',
          bg: 'var(--color-error-bg)',
          border: 'var(--color-error-border)',
          text: 'var(--color-error-text)',
        },
        // 信息色 (Info Color)
        info: {
          DEFAULT: 'var(--color-info)',
          hover: 'var(--color-info-hover)',
          active: 'var(--color-info-active)',
          bg: 'var(--color-info-bg)',
          border: 'var(--color-info-border)',
          text: 'var(--color-info-text)',
        },
        // 文本色 (Text Colors)
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          quaternary: 'var(--color-text-quaternary)',
        },
        // 背景色 (Background Colors)
        bg: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
          quaternary: 'var(--color-bg-quaternary)',
          elevated: 'var(--color-bg-elevated)',
          layout: 'var(--color-bg-layout)',
          mask: 'var(--color-bg-mask)',
          spotlight: 'var(--color-bg-spotlight)',
        },
        // 填充色 (Fill Colors)
        fill: {
          DEFAULT: 'var(--color-fill)',
          secondary: 'var(--color-fill-secondary)',
          tertiary: 'var(--color-fill-tertiary)',
          quaternary: 'var(--color-fill-quaternary)',
        },
        // 边框色 (Border Colors)
        border: {
          DEFAULT: 'var(--color-border)',
          secondary: 'var(--color-border-secondary)',
          bg: 'var(--color-border-bg)',
        },
      },
      fontSize: {
        xs: ['var(--font-size-xs)', { lineHeight: '1.4' }],
        sm: ['var(--font-size-sm)', { lineHeight: '1.5' }],
        base: ['var(--font-size-base)', { lineHeight: '1.5' }],
        lg: ['var(--font-size-lg)', { lineHeight: '1.5' }],
        xl: ['var(--font-size-xl)', { lineHeight: '1.5' }],
        '2xl': ['var(--font-size-2xl)', { lineHeight: '1.4' }],
        'heading-1': ['var(--font-size-heading-1)', { lineHeight: '1.2' }],
        'heading-2': ['var(--font-size-heading-2)', { lineHeight: '1.25' }],
        'heading-3': ['var(--font-size-heading-3)', { lineHeight: '1.3' }],
        'heading-4': ['var(--font-size-heading-4)', { lineHeight: '1.35' }],
        'heading-5': ['var(--font-size-heading-5)', { lineHeight: '1.4' }],
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        'control-sm': 'var(--spacing-control-sm)',
        control: 'var(--spacing-control)',
        'control-lg': 'var(--spacing-control-lg)',
      },
      borderRadius: {
        xs: 'var(--border-radius-xs)',
        sm: 'var(--border-radius-sm)',
        md: 'var(--border-radius-md)',
        lg: 'var(--border-radius-lg)',
        xl: 'var(--border-radius-xl)',
        outer: 'var(--border-radius-outer)',
        full: 'var(--border-radius-full)',
      },
      boxShadow: {
        sm: 'var(--box-shadow-sm)',
        md: 'var(--box-shadow-md)',
        lg: 'var(--box-shadow-lg)',
        xl: 'var(--box-shadow-xl)',
        DEFAULT: 'var(--box-shadow)',
        secondary: 'var(--box-shadow-secondary)',
      },
      // 动画 (Motion)
      transitionDuration: {
        fast: 'var(--motion-duration-fast)',
        DEFAULT: 'var(--motion-duration)',
        slow: 'var(--motion-duration-slow)',
      },
      transitionTimingFunction: {
        'ease-out': 'var(--motion-ease-out)',
        'ease-in': 'var(--motion-ease-in)',
        'ease-in-out': 'var(--motion-ease-in-out)',
        'ease-out-back': 'var(--motion-ease-out-back)',
        'ease-in-back': 'var(--motion-ease-in-back)',
      },
    },
  },
  plugins: [],
};
