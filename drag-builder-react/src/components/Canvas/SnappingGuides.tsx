/**
 * 吸附辅助线组件
 * 使用 SVG 绘制对齐辅助线和距离标注
 *
 * 需求：6.2, 6.5
 * - 6.2: 边缘距离小于 5px 时显示粉色辅助线
 * - 6.5: 拖拽结束后隐藏辅助线
 * - 显示组件间距离标注（净间距）
 *
 * 专业 Figma/Sketch 风格：
 * - 参考线（refStart-refEnd）：淡色虚线，表示对齐基准
 * - 间距线（gapStart-gapEnd）：粗实线，表示实际间距，位于 gapPosition
 * - 端点标记：垂直于间距线的短线
 * - 距离标签：居中显示在间距线上
 *
 * 关键修复：
 * - type 表示测量线的方向
 * - vertical: 测量线在 Y 方向延伸（固定 X = gapPosition）
 * - horizontal: 测量线在 X 方向延伸（固定 Y = gapPosition）
 */

import React from 'react';
import { useUIStore } from '../../store/uiStore';

/**
 * SnappingGuides 组件
 * 渲染吸附辅助线（使用 SVG）
 *
 * 视觉层次：
 * 1. 参考线：淡粉色虚线（opacity 0.3），显示对齐关系
 * 2. 间距线：粉色粗实线（strokeWidth 1.5），显示实际间距
 * 3. 端点标记：8px 垂直短线，标记间距边界
 * 4. 距离标签：白底粉字，居中显示距离值
 */
export const SnappingGuides: React.FC = () => {
  const { snapLines } = useUIStore();

  // 如果没有辅助线，不渲染
  if (snapLines.length === 0) {
    return null;
  }

  const COLOR = '#EC4899';

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        zIndex: 9999,
      }}
    >
      {snapLines.map((line, index) => {
        const isRefVert = line.type === 'vertical'; // 用于渲染虚线参考线
        const isGapVert = !!line.isGapVertical; // 【强制】用于渲染间距测量线，不依赖猜测
        const { position, refStart, refEnd, gapStart, gapEnd, gapPosition, distance } = line;
        const hasGap =
          gapStart !== undefined &&
          gapEnd !== undefined &&
          distance !== undefined &&
          distance > 0.5;

        return (
          <g key={`snap-line-${index}`}>
            {/* 1. 对齐基准线（虚线参考线）- 使用 isRefVert */}
            <line
              x1={isRefVert ? position : refStart}
              y1={isRefVert ? refStart : position}
              x2={isRefVert ? position : refEnd}
              y2={isRefVert ? refEnd : position}
              stroke={COLOR}
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.3}
            />

            {/* 2. 间距线和标注（仅在有间距时显示）- 改用 isGapVert */}
            {hasGap && gapPosition !== undefined && (
              <g>
                {/* 测量线：垂直(isGapVert)则固定 X=gapPosition，水平则固定 Y=gapPosition */}
                <line
                  x1={isGapVert ? gapPosition : gapStart}
                  y1={isGapVert ? gapStart : gapPosition}
                  x2={isGapVert ? gapPosition : gapEnd}
                  y2={isGapVert ? gapEnd : gapPosition}
                  stroke={COLOR}
                  strokeWidth={1.5}
                />

                {/* 起点端点标记 */}
                <line
                  x1={isGapVert ? gapPosition - 4 : gapStart}
                  y1={isGapVert ? gapStart : gapPosition - 4}
                  x2={isGapVert ? gapPosition + 4 : gapStart}
                  y2={isGapVert ? gapStart : gapPosition + 4}
                  stroke={COLOR}
                  strokeWidth={1.5}
                />

                {/* 终点端点标记 */}
                <line
                  x1={isGapVert ? gapPosition - 4 : gapEnd}
                  y1={isGapVert ? gapEnd : gapPosition - 4}
                  x2={isGapVert ? gapPosition + 4 : gapEnd}
                  y2={isGapVert ? gapEnd : gapPosition + 4}
                  stroke={COLOR}
                  strokeWidth={1.5}
                />

                {/* 距离标签：始终居中在测量线上 */}
                {distance > 0.1 && (
                  <g
                    transform={`translate(${
                      isGapVert ? gapPosition + 8 : (gapStart + gapEnd) / 2
                    }, ${isGapVert ? (gapStart + gapEnd) / 2 : gapPosition - 12})`}
                  >
                    {/* 距离文本背景 */}
                    <rect x={-18} y={-8} width={36} height={16} fill={COLOR} rx={2} />
                    {/* 距离文本 */}
                    <text
                      dy="4"
                      textAnchor="middle"
                      fill="white"
                      fontSize="10px"
                      fontWeight="bold"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {distance.toFixed(1)}
                    </text>
                  </g>
                )}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};
