# Create Documentation Site

## Description

Create a dedicated documentation site for `behavior-fn` to host the guides, API references, and examples.

## Requirements

- **Framework:** Use Astro Starlight or similar for easy documentation management.
- **Content:**
  - Getting Started (Installation, Usage)
  - Architecture (Command Protocol, Reactive Protocol)
  - Guides (Testing, Authoring Behaviors)
  - API Reference (List of available behaviors and their props/commands)
- **Deployment:** Deploy to Vercel or Netlify.

## Implementation Plan

1.  **Initialize Project:**
    - Create a new Astro project in `docs-site/` or separate repo.
    - Install Starlight theme.

2.  **Migrate Content:**
    - Copy existing markdown files from `docs/` to the site's content directory.
    - Structure the navigation.

3.  **Add Examples:**
    - Create interactive examples for each behavior using the library itself.

4.  **Deploy:**
    - Set up CI/CD for automatic deployment on push to main.
