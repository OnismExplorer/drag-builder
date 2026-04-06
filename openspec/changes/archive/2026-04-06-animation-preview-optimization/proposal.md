## Why

当前预设动画预览存在交互缺陷：当组件已存在于画布上时，选择"淡入"等预设动画，组件没有任何视觉变化。预期行为是组件应先消失/变化，再以预设动画方式复原，让用户能直观预览动画效果。

## What Changes

- 新增 `useAnimationPreview` Hook，统一处理动画预览的"播放→复原"逻辑
- 修改 `ComponentNode` 组件，将动画播放完毕的复原逻辑移入 Hook
- 优化预设动画分类逻辑：通过检测 `initial` 是否等于组件"自然状态"判断动画类型
- "进入类"动画（淡入）：initial = 隐藏状态，播放完毕后停在自然状态，无需复原
- "变化/退出/移动类"动画（淡出、缩小、向左移等）：initial = 自然状态，播放完毕后需复原回自然状态

## Capabilities

### New Capabilities

- `animation-preview`: 动画预览能力，支持选择预设时自动播放预览动画，播放完毕后自动复原组件状态

## Impact

- 新增文件：`drag-builder-react/src/hooks/useAnimationPreview.ts`
- 修改文件：`drag-builder-react/src/components/Canvas/ComponentNode.tsx`
- 影响范围：动画配置、画布渲染、属性面板预设动画选择
