/**
 * FeatureCard 组件
 * 带有 3D 倾斜效果、悬停动画和 StarBorder 边框效果的功能卡片
 */

import React, { useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor: string;
  iconBgColor: string;
  borderColor: string;
  darkMode?: boolean;
}

/**
 * FeatureCard 组件
 * 鼠标悬停时卡片会突起，鼠标移动时卡片会跟随倾斜
 * 悬停时显示 StarBorder 流星边框效果
 */
const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  iconColor,
  iconBgColor,
  borderColor,
  darkMode = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [transform, setTransform] = useState('');

  /**
   * 处理鼠标移动事件
   * 根据鼠标位置计算卡片的倾斜角度
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();

    // 计算鼠标相对于卡片中心的位置（-1 到 1）
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // 计算倾斜角度（最大 10 度）
    const rotateY = x * 10;
    const rotateX = -y * 10;

    // 应用 3D 变换
    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px) scale(1.05)`
    );
  };

  /**
   * 处理鼠标进入事件
   */
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  /**
   * 处理鼠标离开事件
   * 重置卡片状态
   */
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform('');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative p-6 rounded-2xl border shadow-sm transition-all duration-300 ease-out overflow-hidden ${
        darkMode ? 'bg-slate-900/80 backdrop-blur-sm' : 'bg-white'
      }`}
      style={{
        transform: isHovered
          ? transform
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)',
        transformStyle: 'preserve-3d',
        boxShadow: isHovered
          ? darkMode
            ? '0 20px 40px rgba(0, 0, 0, 0.5), 0 10px 20px rgba(0, 0, 0, 0.3)'
            : '0 20px 40px rgba(0, 0, 0, 0.1), 0 10px 20px rgba(0, 0, 0, 0.06)'
          : darkMode
            ? '0 1px 3px rgba(0, 0, 0, 0.3)'
            : '0 1px 3px rgba(0, 0, 0, 0.1)',
        borderColor: isHovered
          ? borderColor
          : darkMode
            ? 'rgb(51 65 85 / 0.5)'
            : 'rgb(226 232 240 / 0.5)',
      }}
    >
      {/* StarBorder 流星效果 - 仅在悬停时显示 */}
      {isHovered && (
        <>
          {/* 底部光晕 - 从右向左移动 */}
          <div
            className="absolute w-[400%] h-[80%] bottom-[-20px] right-[-300%] rounded-full animate-star-movement-bottom z-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${borderColor} 0%, ${borderColor}80 5%, transparent 15%)`,
              animationDuration: '3s',
              filter: 'blur(8px)',
            }}
          />

          {/* 顶部光晕 - 从左向右移动 */}
          <div
            className="absolute w-[400%] h-[80%] top-[-20px] left-[-300%] rounded-full animate-star-movement-top z-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${borderColor} 0%, ${borderColor}80 5%, transparent 15%)`,
              animationDuration: '3s',
              filter: 'blur(8px)',
            }}
          />
        </>
      )}

      {/* Icon 容器 - 悬停时会更加突出 */}
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 relative z-10 ${iconBgColor}`}
        style={{
          transform: isHovered ? 'translateZ(40px) scale(1.1)' : 'translateZ(0px) scale(1)',
          transformStyle: 'preserve-3d',
        }}
      >
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>

      {/* 标题 */}
      <h3
        className={`text-lg font-semibold mb-2 transition-all duration-300 relative z-10 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}
        style={{
          transform: isHovered ? 'translateZ(20px)' : 'translateZ(0px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {title}
      </h3>

      {/* 描述 */}
      <p
        className={`text-sm leading-relaxed transition-all duration-300 relative z-10 ${
          darkMode ? 'text-slate-300' : 'text-slate-600'
        }`}
        style={{
          transform: isHovered ? 'translateZ(10px)' : 'translateZ(0px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;
