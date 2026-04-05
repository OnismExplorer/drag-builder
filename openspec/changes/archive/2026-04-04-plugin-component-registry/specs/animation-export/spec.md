## ADDED Requirements

### Requirement: Animation Code Generation
The code generator SHALL include framer-motion imports and motion components when exporting components with animation.

#### Scenario: Export component with animation
- **WHEN** codeGenerator.generateTSXCode() is called for a canvas with animated components
- **THEN** the generated code includes:
  - `import { motion } from 'framer-motion';`
  - `<motion.div>` wrapper around the component JSX
  - `initial` prop with initial state values
  - `animate` prop with animate state values
  - `transition` prop with duration, delay, and ease

#### Scenario: Export component without animation
- **WHEN** codeGenerator.generateTSXCode() is called for a canvas with no animated components
- **THEN** the generated code does NOT include framer-motion imports
- **AND** components render as regular HTML elements

### Requirement: Animation Export Format
The exported animation configuration SHALL be valid framer-motion v11+ syntax.

#### Scenario: Generated motion props
- **WHEN** a component with `animation: { initial: {opacity: 0}, animate: {opacity: 1}, transition: {duration: 0.5, delay: 0.2, ease: "easeOut"} }` is exported
- **THEN** the generated JSX is:
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
  style={{ ...position styles... }}
>
  {/* component content */}
</motion.div>
```

### Requirement: CSS Export with Animation
When CSS export mode is enabled AND animation is configured, the TSX export SHALL use CSS for styling and motion components for animation.

#### Scenario: CSS mode with animation
- **WHEN** codeGenerator is configured with `mode: 'css'` AND `includeAnimation: true`
- **AND** a component with animation is exported
- **THEN** the TSX uses `<motion.div>` with only animation-related props
- **AND** CSS file contains position and visual styles
