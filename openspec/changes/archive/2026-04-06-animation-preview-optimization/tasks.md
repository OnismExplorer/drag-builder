## 1. Create useAnimationPreview Hook

- [x] 1.1 Create `drag-builder-react/src/hooks/useAnimationPreview.ts` file
- [x] 1.2 Implement `isEnterAnimation` function to classify animation types
- [x] 1.3 Implement main `useAnimationPreview` hook with animation change detection
- [x] 1.4 Implement `handleAnimationComplete` restoration logic inside the hook
- [x] 1.5 Export the hook with proper TypeScript types

## 2. Modify ComponentNode

- [x] 2.1 Import and integrate `useAnimationPreview` hook in `ComponentNode.tsx`
- [x] 2.2 Pass required parameters (component, animation, updateComponent) to the hook
- [x] 2.3 Update `hasAnimation` logic to exclude previewing state
- [x] 2.4 Simplify `handleAnimationComplete` to be handled by the hook (or remove if not needed)
- [x] 2.5 Run lint and verify no errors

## 3. Testing

- [ ] 3.1 Test fadeIn animation preview on existing component
- [ ] 3.2 Test fadeOut animation preview with restoration on existing component
- [ ] 3.3 Test slideLeft animation preview with restoration
- [ ] 3.4 Test scaleIn/scaleOut animation preview with restoration
- [ ] 3.5 Test bounce and rotateIn animation preview with restoration
- [ ] 3.6 Verify animation configuration remains selected in property panel after preview
