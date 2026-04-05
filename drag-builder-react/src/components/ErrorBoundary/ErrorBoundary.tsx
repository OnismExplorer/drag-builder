/**
 * ErrorBoundary 错误边界组件
 *
 * 功能：
 * - 捕获子组件树中的 JavaScript 错误
 * - 显示友好的错误页面（Linear/Vercel 风格，Slate 色系）
 * - 提供"刷新页面"按钮
 * - 记录错误日志（含时间戳和堆栈信息）
 *
 * 需求：15.5 - 在控制台记录所有错误日志（包含时间戳和堆栈信息）
 */

import React from 'react';

// ─── 类型定义 ────────────────────────────────────────────────────────────────

/** ErrorBoundary 组件的 Props */
interface ErrorBoundaryProps {
  /** 子组件 */
  children: React.ReactNode;
}

/** ErrorBoundary 组件的 State */
interface ErrorBoundaryState {
  /** 是否已捕获到错误 */
  hasError: boolean;
  /** 捕获到的错误对象 */
  error: Error | null;
}

// ─── 组件实现 ────────────────────────────────────────────────────────────────

/**
 * ErrorBoundary 类组件
 *
 * React 要求 Error Boundary 必须是 class component，
 * 因为函数组件无法实现 componentDidCatch 和 getDerivedStateFromError。
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // 初始化状态：无错误
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * 静态方法：从错误中派生新的 state
   * 在渲染阶段调用，用于更新 UI 显示错误页面
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * 生命周期方法：捕获错误并记录日志
   * 在提交阶段调用，适合执行副作用（如日志记录）
   *
   * 需求 15.5：记录包含时间戳和堆栈信息的错误日志
   */
  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // 格式化时间戳（ISO 8601 格式）
    const timestamp = new Date().toISOString();

    // 输出结构化错误日志
    console.error(
      `[ErrorBoundary] ${timestamp}\n` +
        `错误信息：${error.message}\n` +
        `组件堆栈：${info.componentStack}\n` +
        `错误堆栈：${error.stack ?? '（无堆栈信息）'}`
    );
  }

  /**
   * 处理"刷新页面"按钮点击
   */
  private handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    const { hasError, error } = this.state;

    // 正常渲染子组件
    if (!hasError) {
      return this.props.children;
    }

    // ─── 错误页面 UI ──────────────────────────────────────────────────────────
    return (
      <div
        className="
          min-h-screen bg-white
          flex items-center justify-center
          px-6
        "
      >
        <div
          className="
            max-w-md w-full
            bg-white border border-slate-200
            rounded-2xl shadow-sm
            p-10
            flex flex-col items-center gap-6
            text-center
          "
        >
          {/* 错误图标 */}
          <div
            className="
              w-14 h-14
              rounded-2xl
              bg-orange-50
              flex items-center justify-center
              flex-shrink-0
            "
          >
            <svg
              className="w-7 h-7 text-[#C2410C]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          {/* 标题 */}
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              页面出现了一些问题
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              应用遇到了意外错误，请尝试刷新页面。如果问题持续出现，请联系技术支持。
            </p>
          </div>

          {/* 错误详情（折叠展示） */}
          {error && (
            <details className="w-full text-left">
              <summary
                className="
                  text-xs text-slate-400
                  cursor-pointer select-none
                  hover:text-slate-600
                  transition-colors
                "
              >
                查看错误详情
              </summary>
              <pre
                className="
                  mt-3 p-3
                  bg-slate-50 border border-slate-200
                  rounded-lg
                  text-xs text-slate-600
                  overflow-auto max-h-40
                  whitespace-pre-wrap break-all
                "
              >
                {error.message}
              </pre>
            </details>
          )}

          {/* 刷新按钮 */}
          <button
            onClick={this.handleReload}
            className="
              w-full
              bg-[#C2410C] hover:bg-[#9A3412]
              text-white text-sm font-medium
              px-6 py-2.5
              rounded-2xl
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:ring-offset-2
            "
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
