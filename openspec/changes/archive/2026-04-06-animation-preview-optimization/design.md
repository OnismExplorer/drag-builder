## Context

当前预设动画预览存在交互缺陷：当组件已存在于画布上时，选择"淡入"等预设动画，组件没有任何视觉变化。

**根本原因**：framer-motion 的 `initial` prop 只在组件首次挂载时生效。当用户对已存在的组件应用预设动画时：
1. `applyPreset()` 更新了 `animation` 配置（设置 `initial` + `animate`）
2. 组件重新渲染，但 motion.div 没有重新挂载（组件 key 没变）
3. framer-motion 检测到 `initial` 和 `animate` 的变化，但不会重新播放动画

**当前行为**：
- fadeIn: `initial: { opacity: 0 }`, `animate: { opacity: 1 }` → 组件不变化
- 预期：组件先消失（opacity: 0），再淡入显示（opacity: 1），停在自然状态

## Goals / Non-Goals

**Goals:**
- 实现选择预设动画时自动播放预览
- "进入类"动画（淡入）预览后停在自然状态
- "变化/退出/移动类"动画（淡出、缩小、向左移等）预览后复原回自然状态
- 动画配置在属性面板保持"选中"状态

**Non-Goals:**
- 不修改 `AnimationConfig` 的数据结构
- 不修改预设动画的自定义配置功能
- 不添加"预览按钮"——选择即预览

## Decisions

### Decision 1: 新增 `useAnimationPreview` Hook 统一处理

**选择**：将预览+复原逻辑封装在 `useAnimationPreview` Hook 中

**原因**：
- 集中管理动画预览状态，便于维护
- ComponentNode 只需调用 Hook，无需关心内部逻辑
- 未来扩展（如添加"预览按钮"）只需修改 Hook

**替代方案**：
- 在 `DynamicPropertyEditor` 的 `applyPreset` 中用 setTimeout 处理：无法精确获取动画结束时刻
- 在 `ComponentNode` 的 `handleAnimationComplete` 中处理：逻辑分散，难以维护

### Decision 2: 动画类型判断逻辑

**选择**：通过 `initial.opacity === 0` 判断是否为"进入类"动画

```typescript
function isEnterAnimation(animation: AnimationConfig): boolean {
  return animation.initial?.opacity === 0;
}
```

**原因**：
- 淡入是唯一的"进入类"动画，initial.opacity = 0 表示"隐藏状态"
- 其他所有预设动画的 initial 都等于组件自然状态
- 判断逻辑简单、明确

### Decision 3: 复原机制

**选择**：动画播放完毕后，先清除 animation 配置，再重新设置

**流程**：
```
动画播放完成 (onAnimationComplete)
    ↓
① 清除 animation 配置（组件恢复正常 div，无动画）
    ↓
② 重新设置 animation 配置（保持用户选择）
```

**原因**：
- framer-motion 播放完毕后，组件停留在 `animate` 定义的状态
- 清除 animation 后，ComponentNode 会渲染为普通 div，视觉上"复原"
- 重新设置 animation 是为了保持属性面板的"选中"状态

### Decision 4: Hook 内部实现

```typescript
export function useAnimationPreview(
  component: ComponentNode,
  animation: AnimationConfig | undefined,
  updateComponent: (id: string, updates: Partial<ComponentNode>) => void
): boolean {
  // 1. 记录上一次 animation 配置
  // 2. 检测 animation 变化，判断是否需要预览
  // 3. 如果是变化/退出/移动类动画：
  //    - 设置 _previewing 状态
  //    - 动画播放完毕后执行复原逻辑
  // 4. 返回 isPreviewing 状态
}
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 动画时长硬编码为 0.5s | 用户自定义动画时长后，预览时长不一致 | 预览使用预设时长，自定义动画走"自定义"模式 |
| 复原时可能短暂闪烁 | 清除→重新设置 animation 时，DOM 会短暂渲染为普通 div | 使用 requestAnimationFrame 延迟设置 animate，减小视觉间隙 |
| 动画结束时组件位置偏移 | framer-motion 的 transform 可能残留 | ComponentNode 已有 `resetStyle` 机制清除残留样式 |

## Open Questions

无
