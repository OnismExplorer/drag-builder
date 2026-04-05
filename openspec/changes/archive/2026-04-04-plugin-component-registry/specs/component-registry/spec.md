## ADDED Requirements

### Requirement: Component Registration
The system SHALL provide a ComponentRegistry singleton that manages component definitions lifecycle.

#### Scenario: Register a new component
- **WHEN** developer calls `componentRegistry.register(definition)`
- **THEN** the registry stores the definition internally
- **AND** subsequent calls to `componentRegistry.get(type)` return that definition

#### Scenario: Unregister a component
- **WHEN** developer calls `componentRegistry.unregister(type)`
- **THEN** the registry removes the definition
- **AND** subsequent calls to `componentRegistry.get(type)` return undefined

#### Scenario: Query all registered components
- **WHEN** developer calls `componentRegistry.getAll()`
- **THEN** the system returns an array of all registered ComponentDefinition objects

#### Scenario: Query components by category
- **WHEN** developer calls `componentRegistry.getByCategory(categoryId)`
- **THEN** the system returns only components belonging to that category

### Requirement: ComponentDefinition Structure
Each component definition SHALL contain all metadata needed for rendering, property editing, and code generation.

#### Scenario: Definition contains required fields
- **WHEN** a component is registered
- **THEN** the definition includes `type`, `material`, `defaults`, `propertyGroups`, `render`, and `codeGen`
- **AND** `material` includes `type`, `label`, `icon`, `category`
- **AND** `defaults` includes `position`, `styles`, `content`

### Requirement: Factory Method
The registry SHALL provide a `createDefault` method to instantiate components with default configuration.

#### Scenario: Create component with defaults
- **WHEN** developer calls `componentRegistry.createDefault(type, position)`
- **THEN** the system returns a new ComponentNode with:
  - A unique UUID v4 as id
  - The specified type
  - Default position, styles, and content from the definition
  - zIndex initialized to 0

### Requirement: Material Configuration
The registry SHALL provide material configuration for the MaterialPanel.

#### Scenario: Get materials by category
- **WHEN** `componentRegistry.getMaterialsByCategory()` is called
- **THEN** the system returns an array of `{ category: string, items: MaterialConfig[] }`
- **AND** items are grouped by their category field

### Requirement: Adapter Support
The registry SHALL support registering component adapters that wrap third-party libraries.

#### Scenario: Register adapter with multiple components
- **WHEN** `componentRegistry.registerAdapter(adapter)` is called
- **THEN** all components within that adapter are registered individually
- **AND** each component's type is namespaced by the adapter's namespace
