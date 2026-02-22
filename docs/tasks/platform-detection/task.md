# Add Platform Detection to Init

## Description

Enhance the `init` command to automatically detect the framework and configure the project accordingly.

## Requirements

- **Frameworks:** Support Astro, Next.js, Remix, SvelteKit, Nuxt.
- **Configuration:**
  - Detect `astro.config.*` -> Set `isServer` to `import.meta.env.SSR`.
  - Detect `next.config.*` -> Set `isServer` to `typeof window === 'undefined'`.
  - Detect `vite.config.*` -> Set `isServer` to `import.meta.env.SSR`.
- **Defaults:** Fallback to generic configuration if no framework is detected.

## Implementation Plan

1.  **Update `index.ts`**:
    - Expand `detectPlatform` function to check for more config files.
    - Update `installBehavior` to inject the correct `isServer` implementation based on the detected platform.

2.  **Prompt User:**
    - If detection is ambiguous, prompt the user to select their framework.

## Status: Completed

- **Detection:** Implemented detection for `astro`, `next`, `vite`, and `nuxt`.
- **Injection:** `isServer` is now correctly replaced:
  - Astro/Vite: `import.meta.env.SSR`
  - Nuxt: `import.meta.server`
  - Next/Generic: `typeof window === 'undefined'`
