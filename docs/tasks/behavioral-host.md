# Create Behavioral Host Web Component

## Description

Implement a base class/mixin that handles behavior lifecycle management. This component will serve as the foundation for all elements that need to support behaviors.

## Requirements

- It must observe attributes defined by behaviors.
- It must instantiate behaviors on `connectedCallback`.
- It must delegate `attributeChangedCallback` to behaviors.
- It must handle `disconnectedCallback`.

## Implementation

### 1. Behavioral Host Mixin

- Create `registry/behaviors/behavioral-host.ts` (part of `core`).
- It should export a function `withBehaviors(Base: CustomElementConstructor)` that returns a class extending `Base`.

### 2. Define Hosts Utility

- Create `registry/behaviors/define-hosts.ts`.
- Implement `defineBehavioralHost<K extends keyof HTMLElementTagNameMap>(tagName: K, name?: string)`.
- This leverages `HTMLElementTagNameMap` to provide autocomplete for valid HTML tags, ensuring type safety.
- Default name: `behavioral-${tagName}`.
- Logic:
  - Check if `customElements.get(name)` is already defined.
  - Get the base constructor dynamically: `const Base = document.createElement(tagName).constructor`.
  - Create the behavioral class: `const BehavioralClass = withBehaviors(Base)`.
  - Define the custom element: `customElements.define(name, BehavioralClass, { extends: tagName })`.

## Goal

Ensure consumers have the necessary runtime to use behaviors and a convenient utility to register behavioral hosts.
