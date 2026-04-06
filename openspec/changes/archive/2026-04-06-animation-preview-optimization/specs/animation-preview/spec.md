## ADDED Requirements

### Requirement: Animation Type Classification
The system SHALL classify preset animations into "entering" type or "change/exit/move" type based on the animation's initial state.

#### Scenario: Entering animation classification
- **WHEN** a preset animation's `initial.opacity` equals `0`
- **THEN** the animation is classified as an "entering" animation
- **AND** it does NOT require restoration after preview

#### Scenario: Change/exit/move animation classification
- **WHEN** a preset animation's `initial.opacity` does NOT equal `0`
- **THEN** the animation is classified as a "change/exit/move" animation
- **AND** it requires restoration to natural state after preview

### Requirement: Entering Animation Preview
The system SHALL automatically play an entering animation preview when a preset is selected, and the component SHALL stop at its natural state after the animation completes.

#### Scenario: FadeIn preview on existing component
- **WHEN** a component with natural opacity `1` exists on the canvas
- **AND** the user selects the "fadeIn" preset
- **THEN** the component first becomes hidden (opacity: 0)
- **AND** then fades in to natural state (opacity: 1)
- **AND** the component stops at natural state after animation completes

#### Scenario: ScaleIn preview on existing component
- **WHEN** a component with natural scale `1` exists on the canvas
- **AND** the user selects the "scaleIn" preset
- **THEN** the component first becomes small (scale: 0.1)
- **AND** then scales up to natural state (scale: 1)
- **AND** the component stops at natural state after animation completes

### Requirement: Change/Exit/Move Animation Preview with Restoration
The system SHALL automatically play a change/exit/move animation preview when a preset is selected, and the component SHALL restore to its natural state after the animation completes.

#### Scenario: FadeOut preview with restoration
- **WHEN** a component with natural opacity `1` exists on the canvas
- **AND** the user selects the "fadeOut" preset
- **THEN** the component plays fade out animation (opacity: 1 → 0)
- **AND** after animation completes, the component restores to natural state (opacity: 1)
- **AND** the animation configuration remains selected in the property panel

#### Scenario: ScaleOut preview with restoration
- **WHEN** a component with natural scale `1` exists on the canvas
- **AND** the user selects the "scaleOut" preset
- **THEN** the component plays shrink animation (scale: 1 → 0.5)
- **AND** after animation completes, the component restores to natural state (scale: 1)
- **AND** the animation configuration remains selected in the property panel

#### Scenario: SlideLeft preview with restoration
- **WHEN** a component at natural position x: 0 exists on the canvas
- **AND** the user selects the "slideLeft" preset
- **THEN** the component plays slide left animation (x: 0 → -50)
- **AND** after animation completes, the component restores to natural position (x: 0)
- **AND** the animation configuration remains selected in the property panel

#### Scenario: SlideRight preview with restoration
- **WHEN** a component at natural position x: 0 exists on the canvas
- **AND** the user selects the "slideRight" preset
- **THEN** the component plays slide right animation (x: 0 → 50)
- **AND** after animation completes, the component restores to natural position (x: 0)
- **AND** the animation configuration remains selected in the property panel

#### Scenario: Bounce preview with restoration
- **WHEN** a component with natural scale `1` exists on the canvas
- **AND** the user selects the "bounce" preset
- **THEN** the component plays bounce animation (scale: 0.1 → 1)
- **AND** after animation completes, the component restores to natural state (scale: 1)
- **AND** the animation configuration remains selected in the property panel

#### Scenario: RotateIn preview with restoration
- **WHEN** a component at natural rotation rotate: 0 exists on the canvas
- **AND** the user selects the "rotateIn" preset
- **AND** the component plays rotate animation (rotate: value → 0)
- **AND** after animation completes, the component restores to natural rotation (rotate: 0)
- **AND** the animation configuration remains selected in the property panel

### Requirement: Animation Preview via useAnimationPreview Hook
The system SHALL use a `useAnimationPreview` Hook to manage the animation preview and restoration lifecycle.

#### Scenario: Hook detects animation change requiring preview
- **WHEN** the `useAnimationPreview` Hook detects an animation configuration change
- **AND** the animation's initial state equals the component's natural state
- **THEN** the Hook SHALL mark the animation as requiring preview and restoration

#### Scenario: Hook handles restoration after animation completes
- **WHEN** an animation with restoration requirement completes playing
- **THEN** the Hook SHALL clear the animation configuration to restore the component
- **AND** the Hook SHALL re-apply the animation configuration to maintain the user's selection
