# Guides

Step-by-step guides and tutorials for working with BehaviorFN.

## 🚀 Getting Started

### [Using Behaviors](./using-behaviors.md)
**Start here!** Learn how to use BehaviorFN behaviors in your projects.
- Installing behaviors
- Adding behaviors to HTML elements
- Understanding the `behavior` attribute
- Basic examples

### [CDN Usage](./cdn-usage.md)
Load BehaviorFN via CDN for quick prototyping.
- ESM imports from CDN
- Auto-loader setup
- Manual host definition
- Performance considerations

### [Auto-Loader](./auto-loader.md)
Automatic behavior loading without explicit `is` attributes.
- How auto-loader works
- Setup and configuration
- Performance trade-offs
- When to use manual loading

### [Manual Loading](./manual-loading.md)
Explicit behavior host definition for production.
- Defining behavioral hosts
- Performance benefits
- Type safety advantages
- Best practices

## 🏗️ Creating Behaviors

### [Behavior Definition Standard](./behavior-definition-standard.md)
**Required reading for contributors!** The canonical contract for all behaviors.
- File structure (4 files per behavior)
- Schema definition patterns
- Attribute naming conventions
- Command naming conventions
- Key-value identity pattern

### [Contributing Behaviors](./contributing-behaviors.md)
How to create and contribute new behaviors.
- PDSRTDD workflow
- Behavior templates
- Testing requirements
- Submission guidelines

### [Testing Behaviors](./testing-behaviors.md)
Writing tests for behaviors.
- Test harness patterns
- Lifecycle testing
- Command testing
- Integration tests

## 🔧 Advanced Topics

### [Type-Safe Registries](./type-safe-registries.md)
Registry patterns and type safety.
- BehaviorDef structure
- Registry access patterns
- Type inference
- Singleton pattern

### [JSON Template Behavior](./json-template-behavior.md)
Complete guide to the json-template behavior.
- Path resolution
- Array iteration
- Fallback operators
- Slicing and negative indices

### [Creating Platforms](./creating-platforms.md)
Adding support for new frameworks and build tools.
- Platform interface
- Detection strategies
- Path resolution
- Configuration

## 📚 Reference

| Guide | Purpose | Audience |
|-------|---------|----------|
| [Using Behaviors](./using-behaviors.md) | Getting started | End users |
| [CDN Usage](./cdn-usage.md) | Quick setup | Prototypers |
| [Auto-Loader](./auto-loader.md) | Convenience pattern | DX-focused devs |
| [Manual Loading](./manual-loading.md) | Production setup | Performance-focused devs |
| [Behavior Definition Standard](./behavior-definition-standard.md) | Behavior contract | Contributors |
| [Contributing Behaviors](./contributing-behaviors.md) | Contribution flow | Contributors |
| [Testing Behaviors](./testing-behaviors.md) | Test patterns | Contributors |
| [Type-Safe Registries](./type-safe-registries.md) | Registry internals | Advanced contributors |
| [JSON Template](./json-template-behavior.md) | Specific behavior | Users of json-template |
| [Creating Platforms](./creating-platforms.md) | Platform support | Framework integrators |

## 🎯 Quick Links by Use Case

### "I want to use BehaviorFN in my project"
1. [Using Behaviors](./using-behaviors.md)
2. [CDN Usage](./cdn-usage.md) (for quick start)
3. [Manual Loading](./manual-loading.md) (for production)

### "I want to create a new behavior"
1. [Behavior Definition Standard](./behavior-definition-standard.md) ⭐
2. [Contributing Behaviors](./contributing-behaviors.md)
3. [Testing Behaviors](./testing-behaviors.md)

### "I want to understand how it works"
1. [Auto-Loader](./auto-loader.md)
2. [Type-Safe Registries](./type-safe-registries.md)
3. [Architecture docs](../architecture/README.md)

### "I want to add framework support"
1. [Creating Platforms](./creating-platforms.md)
2. Check `src/platforms/` for examples

## 📝 Documentation Standards

All guides should:
- Include working code examples
- Use current API signatures
- Cross-reference related guides
- Show both simple and advanced usage
- Include troubleshooting tips

## 🤝 Contributing to Guides

To add or improve a guide:
1. Follow existing guide structure
2. Include practical examples
3. Test all code snippets
4. Add guide to this README
5. Cross-link with related docs

---

**Last updated:** 2026-02-26
