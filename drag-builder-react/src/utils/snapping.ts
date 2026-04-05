/**
 * 吸附引擎
 * 检测组件对齐关系并提供吸附功能
 *
 * 需求：6.1, 6.2, 6.3, 6.4
 * - 6.1: 拖拽组件时检测与其他组件的对齐关系
 * - 6.2: 边缘距离小于 5px 时显示辅助线
 * - 6.3: 检测左/右/顶/底/水平居中/垂直居中对齐
 * - 6.4: 检测到对齐时自动吸附（误差 ±2px）
 */

import type { ComponentNode } from '../types';

/**
 * 矩形边界接口
 * 用于表示组件的边界框
 */
export interface Rect {
  left: number; // 左边界
  top: number; // 上边界
  right: number; // 右边界
  bottom: number; // 下边界
  width: number; // 宽度
  height: number; // 高度
}

/**
 * 吸附线接口
 * 用于渲染对齐辅助线和间距标注
 */
export interface SnapLine {
  type: 'horizontal' | 'vertical'; // 参考线类型（对齐基准线的方向）
  position: number; // 对齐轴坐标（x 或 y）

  // 全局参考线范围（对齐基准线）
  refStart: number; // 参考线起点
  refEnd: number; // 参考线终点

  // 间距线范围（仅在两个组件相邻边缘之间）
  gapStart?: number; // 间距起点
  gapEnd?: number; // 间距终点
  gapPosition?: number; // 间距线的位置（垂直于对齐轴）
  distance?: number; // 距离值
  isGapVertical?: boolean; // 测量线是否垂直（解耦参考线和测量线的方向）
}

/**
 * 单个吸附结果
 * 包含辅助线和吸附位置
 */
interface SnapResult {
  line: SnapLine; // 辅助线信息
  snapPosition: number; // 吸附后的位置
}

/**
 * 完整吸附结果
 * 包含所有辅助线和 X/Y 方向的吸附位置
 */
export interface SnappingResult {
  snapLines: SnapLine[]; // 所有辅助线
  snapX: number | null; // X 方向吸附位置（null 表示不吸附）
  snapY: number | null; // Y 方向吸附位置（null 表示不吸附）
}

/**
 * 吸附引擎类
 * 提供组件对齐检测和吸附功能
 */
export class SnappingEngine {
  private readonly SNAP_THRESHOLD = 5; // 吸附阈值（px）
  private readonly GRID_SIZE = 20; // 网格大小（px）

  /**
   * 计算两个区间之间的净距离
   * 如果重叠则返回 0
   * @param min1 区间1的最小值
   * @param max1 区间1的最大值
   * @param min2 区间2的最小值
   * @param max2 区间2的最大值
   * @returns 净间距
   */
  private calculateGap(min1: number, max1: number, min2: number, max2: number): number {
    if (max1 < min2) return min2 - max1; // 1在2上方/左侧
    if (max2 < min1) return min1 - max2; // 2在1上方/左侧
    return 0; // 重叠
  }

  /**
   * 检测吸附点
   *
   * @param movingComponent 正在移动的组件
   * @param otherComponents 其他组件列表
   * @param canvasWidth 画布宽度（可选，用于检测画布边缘）
   * @param canvasHeight 画布高度（可选，用于检测画布边缘）
   * @param enableGridSnap 是否启用网格吸附（默认 false）
   * @returns 吸附信息（辅助线和吸附位置）
   */
  detectSnapping(
    movingComponent: ComponentNode,
    otherComponents: ComponentNode[],
    canvasWidth?: number,
    canvasHeight?: number,
    enableGridSnap: boolean = false
  ): SnappingResult {
    const snapLines: SnapLine[] = [];
    let snapX: number | null = null;
    let snapY: number | null = null;

    const movingRect = this.getRect(movingComponent);

    // 检测画布边缘对齐
    if (canvasWidth !== undefined && canvasHeight !== undefined) {
      const canvasResult = this.checkCanvasEdgeAlignment(movingRect, canvasWidth, canvasHeight);
      snapX = canvasResult.snapX;
      snapY = canvasResult.snapY;
      snapLines.push(...canvasResult.lines);
    }

    // 遍历所有其他组件，检测对齐关系
    for (const other of otherComponents) {
      // 跳过自己
      if (other.id === movingComponent.id) continue;

      const otherRect = this.getRect(other);

      // 检测水平对齐（左对齐、右对齐、水平居中）
      // 只有在还没有吸附到画布边缘时才检测组件对齐
      if (snapX === null) {
        const horizontalSnaps = this.checkHorizontalAlignment(movingRect, otherRect);
        if (horizontalSnaps.length > 0) {
          // 使用第一个检测到的对齐
          snapLines.push(horizontalSnaps[0].line);
          snapX = horizontalSnaps[0].snapPosition;
        }
      }

      // 检测垂直对齐（顶部对齐、底部对齐、垂直居中）
      // 只有在还没有吸附到画布边缘时才检测组件对齐
      if (snapY === null) {
        const verticalSnaps = this.checkVerticalAlignment(movingRect, otherRect);
        if (verticalSnaps.length > 0) {
          // 使用第一个检测到的对齐
          snapLines.push(verticalSnaps[0].line);
          snapY = verticalSnaps[0].snapPosition;
        }
      }
    }

    // 如果没有检测到组件或画布边缘吸附，且启用了网格吸附，则检测网格吸附
    // 注意：网格吸附不显示辅助线（因为网格是隐式的）
    if (enableGridSnap) {
      if (snapX === null) {
        const gridSnapX = this.snapToGrid(movingRect.left);
        if (Math.abs(movingRect.left - gridSnapX) < this.SNAP_THRESHOLD) {
          snapX = gridSnapX;
          // 网格吸附不添加辅助线
        }
      }

      if (snapY === null) {
        const gridSnapY = this.snapToGrid(movingRect.top);
        if (Math.abs(movingRect.top - gridSnapY) < this.SNAP_THRESHOLD) {
          snapY = gridSnapY;
          // 网格吸附不添加辅助线
        }
      }
    }

    return { snapLines, snapX, snapY };
  }

  /**
   * 检测画布边缘和中央对齐
   * 检测组件与画布四个边缘以及中央轴的对齐关系
   *
   * 双阈值处理：
   * - 吸附阈值：5px（触发磁吸）
   * - 显示阈值：50px（显示距离标注）
   *
   * 关键修复：
   * - 左/右边缘：测量线是水平的（type: 'horizontal'），测量 X 方向距离
   * - 上/下边缘：测量线是垂直的（type: 'vertical'），测量 Y 方向距离
   *
   * @param moving 正在移动的组件矩形
   * @param canvasWidth 画布宽度
   * @param canvasHeight 画布高度
   * @returns 吸附结果
   */
  private checkCanvasEdgeAlignment(
    moving: Rect,
    canvasWidth: number,
    canvasHeight: number
  ): { snapX: number | null; snapY: number | null; lines: SnapLine[] } {
    let snapX: number | null = null;
    let snapY: number | null = null;
    const lines: SnapLine[] = [];

    const SHOW_DISTANCE_THRESHOLD = 50; // 显示标注的阈值

    // 组件的中心点，用于定位测量线
    const centerY = moving.top + moving.height / 2;
    const centerX = moving.left + moving.width / 2;

    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;
    const movingCenterX = moving.left + moving.width / 2;
    const movingCenterY = moving.top + moving.height / 2;

    // --- 水平方向：测量组件左右边到画布边缘 ---
    // 测量线是水平的（type: 'horizontal'），因为测量的是 X 方向的距离

    // 1. 左边缘
    if (moving.left < SHOW_DISTANCE_THRESHOLD) {
      if (moving.left < this.SNAP_THRESHOLD) {
        snapX = 0;
        // 只有在触发吸附时才显示辅助线
        lines.push({
          type: 'horizontal', // 测量线是水平的（X 方向距离）
          position: 0, // 对齐参考线位置（占位）
          refStart: 0,
          refEnd: canvasHeight,
          gapStart: 0, // 测量线从 x=0 开始
          gapEnd: moving.left, // 到组件左边
          gapPosition: centerY, // 测量线在组件垂直中心
          distance: moving.left,
        });
      }
    }
    // 2. 右边缘
    else if (canvasWidth - moving.right < SHOW_DISTANCE_THRESHOLD) {
      const dist = canvasWidth - moving.right;
      if (dist < this.SNAP_THRESHOLD) {
        snapX = canvasWidth - moving.width;
        // 只有在触发吸附时才显示辅助线
        lines.push({
          type: 'horizontal', // 测量线是水平的（X 方向距离）
          position: canvasWidth, // 对齐参考线位置（占位）
          refStart: 0,
          refEnd: canvasHeight,
          gapStart: moving.right, // 测量线从组件右边开始
          gapEnd: canvasWidth, // 到画布右边缘
          gapPosition: centerY, // 测量线在组件垂直中心
          distance: dist,
        });
      }
    }
    // 画布水平中央对齐（不显示距离）
    else if (snapX === null) {
      // 检测组件左边界与画布水平中央对齐
      if (Math.abs(moving.left - canvasCenterX) < this.SNAP_THRESHOLD) {
        snapX = canvasCenterX;
        lines.push({
          type: 'vertical',
          position: canvasCenterX,
          refStart: 0,
          refEnd: canvasHeight,
        });
      }
      // 检测组件右边界与画布水平中央对齐
      else if (Math.abs(moving.right - canvasCenterX) < this.SNAP_THRESHOLD) {
        snapX = canvasCenterX - moving.width;
        lines.push({
          type: 'vertical',
          position: canvasCenterX,
          refStart: 0,
          refEnd: canvasHeight,
        });
      }
      // 检测组件中心与画布水平中央对齐
      else if (Math.abs(movingCenterX - canvasCenterX) < this.SNAP_THRESHOLD) {
        snapX = canvasCenterX - moving.width / 2;
        lines.push({
          type: 'vertical',
          position: canvasCenterX,
          refStart: 0,
          refEnd: canvasHeight,
        });
      }
    }

    // --- 垂直方向：测量组件上下边到画布边缘 ---
    // 测量线是垂直的（type: 'vertical'），因为测量的是 Y 方向的距离

    // 3. 上边缘
    if (moving.top < SHOW_DISTANCE_THRESHOLD) {
      if (moving.top < this.SNAP_THRESHOLD) {
        snapY = 0;
        // 只有在触发吸附时才显示辅助线
        lines.push({
          type: 'vertical', // 测量线是垂直的（Y 方向距离）
          position: 0, // 对齐参考线位置（占位）
          refStart: 0,
          refEnd: canvasWidth,
          gapStart: 0, // 测量线从 y=0 开始
          gapEnd: moving.top, // 到组件上边
          gapPosition: centerX, // 测量线在组件水平中心
          distance: moving.top,
        });
      }
    }
    // 4. 下边缘
    else if (canvasHeight - moving.bottom < SHOW_DISTANCE_THRESHOLD) {
      const dist = canvasHeight - moving.bottom;
      if (dist < this.SNAP_THRESHOLD) {
        snapY = canvasHeight - moving.height;
        // 只有在触发吸附时才显示辅助线
        lines.push({
          type: 'vertical', // 测量线是垂直的（Y 方向距离）
          position: canvasHeight, // 对齐参考线位置（占位）
          refStart: 0,
          refEnd: canvasWidth,
          gapStart: moving.bottom, // 测量线从组件下边开始
          gapEnd: canvasHeight, // 到画布下边缘
          gapPosition: centerX, // 测量线在组件水平中心
          distance: dist,
        });
      }
    }
    // 画布垂直中央对齐（不显示距离）
    else if (snapY === null) {
      // 检测组件上边界与画布垂直中央对齐
      if (Math.abs(moving.top - canvasCenterY) < this.SNAP_THRESHOLD) {
        snapY = canvasCenterY;
        lines.push({
          type: 'horizontal',
          position: canvasCenterY,
          refStart: 0,
          refEnd: canvasWidth,
        });
      }
      // 检测组件下边界与画布垂直中央对齐
      else if (Math.abs(moving.bottom - canvasCenterY) < this.SNAP_THRESHOLD) {
        snapY = canvasCenterY - moving.height;
        lines.push({
          type: 'horizontal',
          position: canvasCenterY,
          refStart: 0,
          refEnd: canvasWidth,
        });
      }
      // 检测组件中心与画布垂直中央对齐
      else if (Math.abs(movingCenterY - canvasCenterY) < this.SNAP_THRESHOLD) {
        snapY = canvasCenterY - moving.height / 2;
        lines.push({
          type: 'horizontal',
          position: canvasCenterY,
          refStart: 0,
          refEnd: canvasWidth,
        });
      }
    }

    return { snapX, snapY, lines };
  }

  /**
   * 检测水平对齐
   * 检测左对齐、右对齐、水平居中对齐，以及左右贴近
   *
   * @param moving 正在移动的组件矩形
   * @param other 其他组件矩形
   * @returns 吸附结果数组
   */
  private checkHorizontalAlignment(moving: Rect, other: Rect): SnapResult[] {
    const results: SnapResult[] = [];

    // 参考线范围：覆盖两个组件的整体范围
    const refStart = Math.min(moving.top, other.top);
    const refEnd = Math.max(moving.bottom, other.bottom);

    // 移动组件的中心位置（用于定位测量线）
    const movingCenterX = moving.left + moving.width / 2;
    const movingCenterY = moving.top + moving.height / 2;

    // 1. 左对齐 (垂直参考线，垂直间距)
    if (Math.abs(moving.left - other.left) < this.SNAP_THRESHOLD) {
      const gap = this.calculateGap(moving.top, moving.bottom, other.top, other.bottom);
      let gapStart: number | undefined;
      let gapEnd: number | undefined;

      // 【修复】只有在间距小于100px时才显示距离标注
      if (gap > 0.1 && gap < 100) {
        if (moving.bottom < other.top) {
          gapStart = moving.bottom;
          gapEnd = other.top;
        } else if (moving.top > other.bottom) {
          gapStart = other.bottom;
          gapEnd = moving.top;
        }
      }

      results.push({
        line: {
          type: 'vertical',
          position: other.left,
          refStart,
          refEnd,
          isGapVertical: true, // 【明确方向】垂直间距
          gapStart,
          gapEnd,
          gapPosition: gapStart !== undefined ? movingCenterX : undefined,
          distance: gapStart !== undefined && gap > 0.1 ? gap : undefined,
        },
        snapPosition: other.left,
      });
    }

    // 2. 右对齐 (垂直参考线，垂直间距)
    if (Math.abs(moving.right - other.right) < this.SNAP_THRESHOLD) {
      const gap = this.calculateGap(moving.top, moving.bottom, other.top, other.bottom);
      let gapStart: number | undefined;
      let gapEnd: number | undefined;

      // 【修复】只有在间距小于100px时才显示距离标注
      if (gap > 0.1 && gap < 100) {
        if (moving.bottom < other.top) {
          gapStart = moving.bottom;
          gapEnd = other.top;
        } else if (moving.top > other.bottom) {
          gapStart = other.bottom;
          gapEnd = moving.top;
        }
      }

      results.push({
        line: {
          type: 'vertical',
          position: other.right,
          refStart,
          refEnd,
          isGapVertical: true, // 【明确方向】垂直间距
          gapStart,
          gapEnd,
          gapPosition: gapStart !== undefined ? movingCenterX : undefined,
          distance: gapStart !== undefined && gap > 0.1 ? gap : undefined,
        },
        snapPosition: other.right - moving.width,
      });
    }

    // 3. 水平居中对齐 (垂直参考线，垂直间距)
    const otherCenterX = other.left + other.width / 2;
    if (Math.abs(movingCenterX - otherCenterX) < this.SNAP_THRESHOLD) {
      const gap = this.calculateGap(moving.top, moving.bottom, other.top, other.bottom);
      let gapStart: number | undefined;
      let gapEnd: number | undefined;

      // 【修复】只有在间距小于100px时才显示距离标注
      if (gap > 0.1 && gap < 100) {
        if (moving.bottom < other.top) {
          gapStart = moving.bottom;
          gapEnd = other.top;
        } else if (moving.top > other.bottom) {
          gapStart = other.bottom;
          gapEnd = moving.top;
        }
      }

      results.push({
        line: {
          type: 'vertical',
          position: otherCenterX,
          refStart,
          refEnd,
          isGapVertical: true, // 【明确方向】垂直间距
          gapStart,
          gapEnd,
          gapPosition: gapStart !== undefined ? movingCenterX : undefined,
          distance: gapStart !== undefined && gap > 0.1 ? gap : undefined,
        },
        snapPosition: otherCenterX - moving.width / 2,
      });
    }

    // 4. 左贴近 (垂直参考线，水平间距)
    if (Math.abs(moving.left - other.right) < this.SNAP_THRESHOLD) {
      const rawGap = moving.left - other.right;
      const isOverlapping = rawGap < 0;
      const absGap = Math.abs(rawGap);

      const overlapLength = Math.max(
        0,
        Math.min(moving.bottom, other.bottom) - Math.max(moving.top, other.top)
      );
      const hasSignificantOverlap =
        overlapLength >= Math.min(moving.height, other.height) * 0.5 && overlapLength >= 20;
      // 【修复】只有在间距小于100px时才显示距离标注
      const showGap = !isOverlapping && absGap > 0.1 && absGap < 100 && hasSignificantOverlap;

      results.push({
        line: {
          type: 'vertical',
          position: other.right,
          refStart,
          refEnd,
          isGapVertical: false, // 【明确方向】水平间距
          gapStart: showGap ? other.right : undefined,
          gapEnd: showGap ? moving.left : undefined,
          gapPosition: showGap ? movingCenterY : undefined,
          distance: showGap ? absGap : undefined,
        },
        snapPosition: other.right,
      });
    }

    // 5. 右贴近 (垂直参考线，水平间距)
    if (Math.abs(moving.right - other.left) < this.SNAP_THRESHOLD) {
      const rawGap = other.left - moving.right;
      const isOverlapping = rawGap < 0;
      const absGap = Math.abs(rawGap);

      const overlapLength = Math.max(
        0,
        Math.min(moving.bottom, other.bottom) - Math.max(moving.top, other.top)
      );
      const hasSignificantOverlap =
        overlapLength >= Math.min(moving.height, other.height) * 0.5 && overlapLength >= 20;
      // 【修复】只有在间距小于100px时才显示距离标注
      const showGap = !isOverlapping && absGap > 0.1 && absGap < 100 && hasSignificantOverlap;

      results.push({
        line: {
          type: 'vertical',
          position: other.left,
          refStart,
          refEnd,
          isGapVertical: false, // 【明确方向】水平间距
          gapStart: showGap ? moving.right : undefined,
          gapEnd: showGap ? other.left : undefined,
          gapPosition: showGap ? movingCenterY : undefined,
          distance: showGap ? absGap : undefined,
        },
        snapPosition: other.left - moving.width,
      });
    }

    return results;
  }

  /**
   * 检测垂直对齐
   * 检测顶部对齐、底部对齐、垂直居中对齐，以及上下贴近
   *
   * @param moving 正在移动的组件矩形
   * @param other 其他组件矩形
   * @returns 吸附结果数组
   */
  private checkVerticalAlignment(moving: Rect, other: Rect): SnapResult[] {
    const results: SnapResult[] = [];

    // 参考线范围：覆盖两个组件的整体范围
    const refStart = Math.min(moving.left, other.left);
    const refEnd = Math.max(moving.right, other.right);

    // 移动组件的中心位置（用于定位测量线）
    const movingCenterY = moving.top + moving.height / 2;

    // 1. 顶部对齐 (水平参考线，水平间距)
    if (Math.abs(moving.top - other.top) < this.SNAP_THRESHOLD) {
      const gap = this.calculateGap(moving.left, moving.right, other.left, other.right);
      let gapStart: number | undefined;
      let gapEnd: number | undefined;

      // 【修复】只有在间距小于100px时才显示距离标注
      if (gap > 0.1 && gap < 100) {
        if (moving.right < other.left) {
          gapStart = moving.right;
          gapEnd = other.left;
        } else if (moving.left > other.right) {
          gapStart = other.right;
          gapEnd = moving.left;
        }
      }

      results.push({
        line: {
          type: 'horizontal',
          position: other.top,
          refStart,
          refEnd,
          isGapVertical: false, // 【明确方向】水平间距
          gapStart,
          gapEnd,
          gapPosition: gapStart !== undefined ? movingCenterY : undefined,
          distance: gapStart !== undefined && gap > 0.1 ? gap : undefined,
        },
        snapPosition: other.top,
      });
    }

    // 2. 底部对齐 (水平参考线，水平间距)
    if (Math.abs(moving.bottom - other.bottom) < this.SNAP_THRESHOLD) {
      const gap = this.calculateGap(moving.left, moving.right, other.left, other.right);
      let gapStart: number | undefined;
      let gapEnd: number | undefined;

      // 【修复】只有在间距小于100px时才显示距离标注
      if (gap > 0.1 && gap < 100) {
        if (moving.right < other.left) {
          gapStart = moving.right;
          gapEnd = other.left;
        } else if (moving.left > other.right) {
          gapStart = other.right;
          gapEnd = moving.left;
        }
      }

      results.push({
        line: {
          type: 'horizontal',
          position: other.bottom,
          refStart,
          refEnd,
          isGapVertical: false, // 【明确方向】水平间距
          gapStart,
          gapEnd,
          gapPosition: gapStart !== undefined ? movingCenterY : undefined,
          distance: gapStart !== undefined && gap > 0.1 ? gap : undefined,
        },
        snapPosition: other.bottom - moving.height,
      });
    }

    // 3. 垂直居中对齐 (水平参考线，水平间距)
    const otherCenterY = other.top + other.height / 2;
    if (Math.abs(movingCenterY - otherCenterY) < this.SNAP_THRESHOLD) {
      const gap = this.calculateGap(moving.left, moving.right, other.left, other.right);
      let gapStart: number | undefined;
      let gapEnd: number | undefined;

      // 【修复】只有在间距小于100px时才显示距离标注
      if (gap > 0.1 && gap < 100) {
        if (moving.right < other.left) {
          gapStart = moving.right;
          gapEnd = other.left;
        } else if (moving.left > other.right) {
          gapStart = other.right;
          gapEnd = moving.left;
        }
      }

      results.push({
        line: {
          type: 'horizontal',
          position: otherCenterY,
          refStart,
          refEnd,
          isGapVertical: false, // 【明确方向】水平间距
          gapStart,
          gapEnd,
          gapPosition: gapStart !== undefined ? movingCenterY : undefined,
          distance: gapStart !== undefined && gap > 0.1 ? gap : undefined,
        },
        snapPosition: otherCenterY - moving.height / 2,
      });
    }

    const movingCenterX = moving.left + moving.width / 2;

    // 4. 上贴近 (水平参考线，垂直间距)
    if (Math.abs(moving.top - other.bottom) < this.SNAP_THRESHOLD) {
      const rawGap = moving.top - other.bottom;
      const isOverlapping = rawGap < 0;
      const absGap = Math.abs(rawGap);

      const overlapLength = Math.max(
        0,
        Math.min(moving.right, other.right) - Math.max(moving.left, other.left)
      );
      const hasSignificantOverlap =
        overlapLength >= Math.min(moving.width, other.width) * 0.5 && overlapLength >= 20;
      // 【修复】只有在间距小于100px时才显示距离标注
      const showGap = !isOverlapping && absGap > 0.1 && absGap < 100 && hasSignificantOverlap;

      results.push({
        line: {
          type: 'horizontal',
          position: other.bottom,
          refStart,
          refEnd,
          isGapVertical: true, // 【明确方向】垂直间距
          gapStart: showGap ? other.bottom : undefined,
          gapEnd: showGap ? moving.top : undefined,
          gapPosition: showGap ? movingCenterX : undefined,
          distance: showGap ? absGap : undefined,
        },
        snapPosition: other.bottom,
      });
    }

    // 5. 下贴近 (水平参考线，垂直间距)
    if (Math.abs(moving.bottom - other.top) < this.SNAP_THRESHOLD) {
      const rawGap = other.top - moving.bottom;
      const isOverlapping = rawGap < 0;
      const absGap = Math.abs(rawGap);

      const overlapLength = Math.max(
        0,
        Math.min(moving.right, other.right) - Math.max(moving.left, other.left)
      );
      const hasSignificantOverlap =
        overlapLength >= Math.min(moving.width, other.width) * 0.5 && overlapLength >= 20;
      // 【修复】只有在间距小于100px时才显示距离标注
      const showGap = !isOverlapping && absGap > 0.1 && absGap < 100 && hasSignificantOverlap;

      results.push({
        line: {
          type: 'horizontal',
          position: other.top,
          refStart,
          refEnd,
          isGapVertical: true, // 【明确方向】垂直间距
          gapStart: showGap ? moving.bottom : undefined,
          gapEnd: showGap ? other.top : undefined,
          gapPosition: showGap ? movingCenterX : undefined,
          distance: showGap ? absGap : undefined,
        },
        snapPosition: other.top - moving.height,
      });
    }

    return results;
  }

  /**
   * 获取组件的矩形边界
   * 将组件的位置信息转换为矩形边界
   *
   * @param component 组件节点
   * @returns 矩形边界
   */
  private getRect(component: ComponentNode): Rect {
    return {
      left: component.position.x,
      top: component.position.y,
      right: component.position.x + component.position.width,
      bottom: component.position.y + component.position.height,
      width: component.position.width,
      height: component.position.height,
    };
  }

  /**
   * 将坐标吸附到最近的网格点
   *
   * @param value 原始坐标值
   * @returns 吸附后的坐标值
   */
  private snapToGrid(value: number): number {
    return Math.round(value / this.GRID_SIZE) * this.GRID_SIZE;
  }
}
