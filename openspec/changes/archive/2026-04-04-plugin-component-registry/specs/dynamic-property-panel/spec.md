## ADDED Requirements

### Requirement: Dynamic Property Groups
The PropertyPanel SHALL dynamically generate property editors based on ComponentDefinition.propertyGroups.

#### Scenario: Render property groups from definition
- **WHEN** a component is selected
- **THEN** the PropertyPanel retrieves its ComponentDefinition
- **AND** renders property editors for each PropertyGroup in `propertyGroups`
- **AND** each property editor is rendered according to its `type` field

### Requirement: Property Input Types
The system SHALL support the following property input types:

#### Scenario: Number input
- **WHEN** a property has `type: 'number'`
- **THEN** the UI renders a number input with:
  - Label from `label` field
  - Value from component's current style/content
  - Optional `min`, `max`, `step`, and `suffix` (e.g., 'px', 's')

#### Scenario: Color input
- **WHEN** a property has `type: 'color'`
- **THEN** the UI renders a color picker with:
  - Label from `label` field
  - Current color value
  - Preset color palette (Slate series + #C2410C accent)

#### Scenario: String input
- **WHEN** a property has `type: 'string'`
- **THEN** the UI renders a text input with:
  - Label from `label` field
  - Current string value

#### Scenario: Select input
- **WHEN** a property has `type: 'select'`
- **THEN** the UI renders a dropdown with:
  - Label from `label` field
  - Options from `options` array
  - Current selected value

#### Scenario: Checkbox input
- **WHEN** a property has `type: 'checkbox'`
- **THEN** the UI renders a checkbox with:
  - Label from `label` field
  - Boolean checked state

### Requirement: Property Update Propagation
Changes in the PropertyPanel SHALL update the component in the store.

#### Scenario: Update propagates to store
- **WHEN** user modifies a property value
- **THEN** the system calls `updateComponent(id, { [key]: newValue })`
- **AND** the canvas re-renders with the new value within 100ms (debounced 300ms)

### Requirement: Common Property Groups
All components SHALL have access to common property groups:

#### Scenario: Position group
- **WHEN** any component is selected
- **THEN** the PropertyPanel always shows:
  - X position (number input)
  - Y position (number input)
  - Width (number input)
  - Height (number input)
  - Z-Index (number input)

#### Scenario: Layer control
- **WHEN** any component is selected
- **THEN** the PropertyPanel always shows layer controls:
  - 置于顶层 (Bring to Front)
  - 上移一层 (Move Up)
  - 下移一层 (Move Down)
  - 置于底层 (Send to Back)

### Requirement: Animation Property Group
Components with animation support SHALL show an animation property group.

#### Scenario: Animation group visible
- **WHEN** a component with `animation` field is selected
- **THEN** the PropertyPanel shows an "动画配置" group with:
  - Enable/disable toggle
  - Initial state editors
  - Duration slider
  - Delay slider
  - Easing dropdown
