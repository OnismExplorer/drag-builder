## ADDED Requirements

### Requirement: Ant Design Adapter
The system SHALL provide an adapter that wraps Ant Design components as PluginDefinition-compatible components.

#### Scenario: Adapter structure
- **WHEN** `createAntdAdapter()` is called
- **THEN** the system returns a ComponentAdapter with:
  - `namespace: 'antd'`
  - `components: { 'antd-button': Definition, 'antd-input': Definition, ... }`

### Requirement: Button Component Adaptation
The adapter SHALL include an AntD Button component.

#### Scenario: Button default configuration
- **WHEN** `antd-button` component is registered
- **THEN** its defaults include:
  - `width: 120, height: 40`
  - `backgroundColor: '#C2410C'`
  - `borderRadius: 8`
  - `content.text: '按钮'`
  - `content.type: 'primary'`

#### Scenario: Button property group
- **WHEN** `antd-button` component is selected
- **THEN** the PropertyPanel shows:
  - Text (string input)
  - Type (select: primary, default, dashed, text, link)

### Requirement: Button Code Generation
The adapter SHALL generate valid AntD JSX code.

#### Scenario: Button export
- **WHEN** an `antd-button` component is exported
- **THEN** the generated code includes:
```tsx
import { Button } from 'antd';

<Button type="primary" className="comp-{id}" style={{ ... }}>
  按钮文字
</Button>
```

### Requirement: Dynamic Import
The adapter SHALL use dynamic import for antd to avoid bloating the main bundle.

#### Scenario: Lazy load antd
- **WHEN** an antd component is first rendered on the canvas
- **THEN** the system dynamically imports the antd module
- **AND** shows a placeholder until the import resolves

### Requirement: Adapter Registration
The adapter SHALL be registered to the global registry.

#### Scenario: Register adapter
- **WHEN** the application initializes in development mode
- **THEN** `componentRegistry.registerAdapter(createAntdAdapter())` is called
- **AND** antd components appear in MaterialPanel under 'antd' category
