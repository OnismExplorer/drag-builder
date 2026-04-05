## ADDED Requirements

### Requirement: Animation Configuration Storage
Each ComponentNode SHALL optionally contain an `animation` field of type `AnimationConfig`.

#### Scenario: Animation config structure
- **WHEN** a component has animation enabled
- **THEN** the animation object contains:
  - `initial`: Record of initial state properties (e.g., `{ opacity: 0, scale: 0.8 }`)
  - `animate`: Record of animate state properties (e.g., `{ opacity: 1, scale: 1 }`)
  - `transition`: Object with `duration` (seconds), `delay` (seconds), and `ease` (easing name)

### Requirement: Canvas Animation Rendering
The canvas SHALL render components with animation using framer-motion when animation is configured.

#### Scenario: Component renders with motion wrapper
- **WHEN** a ComponentNode has `animation` configured
- **THEN** the ComponentNode renders a `<motion.div>` with:
  - `initial` prop from animation config
  - `animate` prop from animation config
  - `transition` prop from animation config

#### Scenario: Component renders without animation
- **WHEN** a ComponentNode has no `animation` configured or animation is disabled
- **THEN** the ComponentNode renders a plain `<div>` (no motion wrapper)
- **AND** no animation is applied

### Requirement: Animation Preview Playback
The animation SHALL automatically play when a component with animation is rendered on the canvas.

#### Scenario: Animation plays on component creation
- **WHEN** a new component with animation is dropped on the canvas
- **THEN** the framer-motion animation plays automatically
- **AND** the user sees the transition from initial to animate state

### Requirement: Animation Editable in PropertyPanel
The PropertyPanel SHALL display animation controls when a component with animation is selected.

#### Scenario: Animation controls visible
- **WHEN** a component with animation is selected
- **THEN** the PropertyPanel displays an "动画配置" section
- **AND** the section contains inputs for:
  - Enable/disable toggle
  - Initial state properties (opacity, scale, x, y)
  - Duration (slider, 0-5 seconds)
  - Delay (slider, 0-3 seconds)
  - Easing (dropdown with options: ease, easeIn, easeOut, easeInOut, linear)
  - Animate state properties

#### Scenario: Animation preview button
- **WHEN** user clicks a "预览动画" button in the animation panel
- **THEN** the component's animation replays from initial state
