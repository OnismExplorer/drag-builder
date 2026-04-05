/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 自定义主色调
        primary: '#C2410C',
        // Slate 系列已经内置在 Tailwind 中
      },
      backdropBlur: {
        lg: '16px',
      },
      keyframes: {
        // 星光边框动画 - 底部星光移动
        'star-movement-bottom': {
          '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
          '100%': { transform: 'translate(-100%, 0%)', opacity: '0' },
        },
        // 星光边框动画 - 顶部星光移动
        'star-movement-top': {
          '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
          '100%': { transform: 'translate(100%, 0%)', opacity: '0' },
        },
        // Logo 渐变动画 - 渐变位置移动
        'gradient-shift': {
          '0%': {
            backgroundPosition: '0% 0%',
          },
          '100%': {
            backgroundPosition: '200% 200%',
          },
        },
      },
      animation: {
        'star-movement-bottom': 'star-movement-bottom linear infinite alternate',
        'star-movement-top': 'star-movement-top linear infinite alternate',
        'gradient-shift': 'gradient-shift 4s linear infinite',
      },
    },
  },
  plugins: [],
};
