/**
 * StarBorder 组件
 * 带有流星边框动画效果的按钮/容器组件
 */

import React from 'react';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties['animationDuration'];
  thickness?: number;
};

/**
 * StarBorder 组件
 * 边框位置有两个发光的"流星"在水平移动
 * - 顶部光晕：从左向右移动
 * - 底部光晕：从右向左移动
 */
const StarBorder = <T extends React.ElementType = 'button'>({
  as,
  className = '',
  color = 'white',
  speed = '3s',
  thickness = 1,
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || 'button';

  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-[20px] ${className}`}
      {...rest}
      style={{
        padding: `${thickness}px 0`,
        ...((rest as React.HTMLAttributes<HTMLElement>).style || {}),
      }}
    >
      {/* 底部光晕 - 从右向左移动 */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />

      {/* 顶部光晕 - 从左向右移动 */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-top z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />

      {/* 内容容器 */}
      <div className="relative z-10 bg-gradient-to-b from-black to-slate-900 border border-slate-800 text-white text-center text-[16px] py-[16px] px-[26px] rounded-[20px]">
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
