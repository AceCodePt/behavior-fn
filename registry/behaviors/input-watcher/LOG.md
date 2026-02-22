# Reimplement Input Watcher Behavior - Log

## Plan

Goal: Reimplement `input-watcher` to watch input elements and reflect their values in the host element's text content.

### Capabilities
1.  **Watch Targets**: Watch one or more input elements specified by selector or ID.
2.  **Formatting**: Format the output using a template string.
3.  **Custom Events**: Listen to specific events (default: `input`, `change`).
4.  **Attribute/Property**: Read value from property (default) or attribute.

### State Manifest

| State | Source | Schema | Description |
| :--- | :--- | :--- | :--- |
| `input-watcher-target` | Attribute | `String` | Selector or ID list of inputs. |
| `input-watcher-format` | Attribute | `Optional<String>` | Format template (e.g. `{0} - {1}`). |
| `input-watcher-events` | Attribute | `Optional<String>` | Events to listen to. |
| `input-watcher-attr` | Attribute | `Optional<String>` | Attribute to read instead of value property. |

### Architecture

-   **Identity vs Capability**: This is a **Capability** (Behavior). It adds the capability to "watch and display" to any element.
-   **Implementation**:
    -   Use `behavior.ts` to implement logic.
    -   Use `MutationObserver` or `attributeChangedCallback` to handle configuration changes.
    -   Use `addEventListener` on targets.

## Implementation Details

-   **Target Resolution**: Split `input-watcher-target` by comma. For each part, try `document.getElementById` (fast path) or `document.querySelector`.
-   **Value Extraction**:
    -   If `input-watcher-attr` is set, use `getAttribute`.
    -   Else, use `.value` property.
-   **Formatting**:
    -   If one value: replace `{value}` or `{0}` in format string.
    -   If multiple values: replace `{0}`, `{1}`, etc. based on index.
    -   If no format string: join values with space or use JSON.stringify if complex? Default: just join with space or take first if single.

## Steps (PDSRTDD)

1.  [ ] **Schema**: Define TypeBox schema in `_behavior-definition.ts`.
2.  [ ] **Registry**: Ensure registry is up to date (it might already be there).
3.  [ ] **Test**: Write failing tests in `behavior.test.ts`.
4.  [ ] **Develop**: Implement logic in `behavior.ts`.
