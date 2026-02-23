# Task: Create Platform Interface

## Goal

Design and implement a platform abstraction interface that makes it easy to add support for new frameworks and platforms (Astro, Next.js, Remix, SvelteKit, Nuxt, etc.) without modifying core CLI logic.

## Context

Currently, platform detection and configuration is hardcoded in `index.ts` with inline string replacements and conditional logic (lines 43-54, 134-141). Adding support for a new platform requires modifying the core CLI code, which violates the Open-Closed Principle and makes the codebase harder to maintain and test.

The current implementation:
- Uses a simple `detectPlatform()` function that checks for config files
- Hardcodes platform-specific transformations (e.g., `isServer` implementation)
- Lacks extensibility for platform-specific behavior utils, registry modifications, or build tool integrations

## Requirements

- **Platform Interface**: Define a clear interface/contract that each platform implementation must satisfy
- **Platform Registry**: Create a registry system where platforms can be registered and discovered
- **Detection Strategy**: Support automatic detection based on config files, package.json, or user selection
- **Transformation Hooks**: Enable platforms to inject platform-specific code transformations (e.g., `isServer`, imports, APIs)
- **Validation**: Ensure platform implementations can validate their environment requirements
- **Extensibility**: Make it trivial to add a new platform by creating a single platform module without touching core code
- **Defaults**: Provide a "generic" fallback platform for unsupported environments

## Definition of Done

-   [ ] Platform interface/contract defined (TypeScript interface or abstract class)
-   [ ] Platform registry system implemented with discovery mechanism
-   [ ] At least 3-5 existing platforms (Astro, Next.js, generic) migrated to new interface
-   [ ] Detection logic refactored to use platform registry
-   [ ] Transformation logic moved from core CLI to platform implementations
-   [ ] All existing tests pass
-   [ ] New tests added for platform interface and implementations
-   [ ] Documentation updated with guide on how to create a new platform
-   [ ] **User Review**: Changes verified and commit authorized

> **Note:** Do not include implementation details, code snippets, or technical designs here. The detailed execution plan belongs in the `LOG.md` file created during the **Plan** phase of the PDSRTDD workflow.
