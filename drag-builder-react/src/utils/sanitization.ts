/**
 * 安全工具函数
 * 提供 XSS 防护等安全相关功能
 */

/**
 * 默认占位图
 */
const DEFAULT_PLACEHOLDER = '/placeholder.png';

/**
 * 不安全的 URL 协议列表
 */
const UNSAFE_PROTOCOL_REGEX = /^(javascript:|data:|vbscript:|file:)/i;

/**
 * 安全地获取图片 URL
 * 防止 XSS 攻击，过滤危险的 URL 协议
 *
 * @param url 原始 URL
 * @param fallback 回退 URL（当 URL 不安全时使用）
 * @returns 安全校验后的 URL
 */
export function getSafeImageUrl(
  url: string | undefined,
  fallback: string = DEFAULT_PLACEHOLDER
): string {
  if (!url) {
    return fallback;
  }

  // 去除前后空白
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return fallback;
  }

  // 检查是否包含不安全的协议
  if (UNSAFE_PROTOCOL_REGEX.test(trimmedUrl)) {
    console.warn(`[Security] 拒绝不安全的图片 URL: ${trimmedUrl}`);
    return fallback;
  }

  // 检查是否是相对路径（安全的）
  if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./') || trimmedUrl.startsWith('../')) {
    return trimmedUrl;
  }

  // 检查是否是 http/https URL
  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  // 其他情况使用占位图
  console.warn(`[Security] 未识别的图片 URL 格式: ${trimmedUrl}`);
  return fallback;
}
