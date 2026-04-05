## ADDED Requirements

### Requirement: CSS Export Mode
The code generator SHALL support a CSS file export mode where visual styles are separated into a .css file.

#### Scenario: Generate CSS file content
- **WHEN** codeGenerator.generateCSS(components) is called
- **THEN** the system returns a CSS string containing rules for all components
- **AND** each rule uses a unique class name based on component id (format: `comp-{uuid}`)
- **AND** the CSS includes positioning (left, top, width, height, z-index)

#### Scenario: CSS class naming
- **WHEN** a component with id `abc123` is exported in CSS mode
- **THEN** the generated class name is `comp-abc123`
- **AND** the CSS selector is `.comp-abc123`

### Requirement: CSS Content Structure
The generated CSS SHALL separate positioning styles from visual styles.

#### Scenario: Position styles in CSS
- **WHEN** a component is exported in CSS mode
- **THEN** the CSS includes:
  - `position: absolute`
  - `left: {x}px`
  - `top: {y}px`
  - `width: {width}px`
  - `height: {height}px`
  - `z-index: {zIndex}`

#### Scenario: Visual styles in CSS
- **WHEN** a component has visual styles configured
- **THEN** the CSS includes applicable style properties:
  - `background-color` for backgroundColor
  - `border` for borderColor and borderWidth
  - `border-radius` for borderRadius
  - `color` for textColor
  - `font-size` for fontSize
  - `font-weight` for fontWeight
  - `padding` for padding

### Requirement: CSS Transition Styles
The CSS mode SHALL NOT include animation/transition properties since those are handled by framer-motion.

#### Scenario: Animation not in CSS
- **WHEN** a component has animation configured AND CSS mode is used
- **THEN** the CSS file does NOT contain animation or transition properties
- **AND** animation is only expressed via framer-motion props in the TSX

### Requirement: Two-File Export
When CSS mode is selected, the system SHALL export both a .tsx file and a .css file.

#### Scenario: Export deliverables
- **WHEN** user selects "CSS 文件" export mode
- **THEN** the system generates two files:
  - `GeneratedPage.tsx` - React component with className references
  - `GeneratedPage.css` - All styling rules

### Requirement: Import Statement in TSX
The exported TSX file SHALL include a CSS import statement.

#### Scenario: CSS import generated
- **WHEN** CSS mode is used
- **THEN** the generated TSX includes:
  - `import './GeneratedPage.css';`
  - Components use `className="comp-{id}"` instead of inline styles
