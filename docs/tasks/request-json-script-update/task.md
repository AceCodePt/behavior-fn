# Task: Request Behavior JSON Script Update Support

## Goal

Enhance the `request` behavior to support updating existing JSON `<script>` tags with different merge strategies (replace, appendArray, prependArray) based on the response content.

## Context

Currently, the `request` behavior supports various swap strategies for HTML content (`innerHTML`, `outerHTML`, `beforebegin`, `afterbegin`, `beforeend`, `afterend`, `delete`, `none`), but lacks support for updating JSON data stored in `<script type="application/json">` tags. 

Many applications use JSON script tags for storing structured data that needs to be updated dynamically based on server responses. There are common patterns where:
1. The entire JSON payload should be replaced
2. The response should be appended to an existing array
3. The response should be prepended to an existing array

Without this capability, developers must write custom JavaScript to handle JSON script tag updates, which defeats the purpose of using a declarative behavior.

## Requirements

- The behavior must support updating `<script type="application/json">` elements when the target is a script tag
- When the response is JSON (detected or explicitly configured), the behavior should support three merge strategies:
  - **replace**: Replace the entire JSON content with the response
  - **appendArray**: Append the response to an existing array (assumes both existing and response are arrays or array-compatible)
  - **prependArray**: Prepend the response to an existing array
- The merge strategy should be configurable via an attribute (e.g., `request-json-strategy`)
- Error handling should gracefully handle cases where:
  - The existing content is not valid JSON
  - The response is not valid JSON
  - Array operations are attempted on non-array data
- The existing `request-swap` attribute should continue to work for HTML responses
- The implementation must maintain backward compatibility with existing usage

## Definition of Done

- [ ] Schema updated with new `request-json-strategy` attribute supporting `replace`, `appendArray`, `prependArray` values
- [ ] Behavior logic detects when target is a `<script type="application/json">` tag
- [ ] Replace strategy correctly updates the script tag's text content with new JSON
- [ ] AppendArray strategy correctly appends response items to existing array
- [ ] PrependArray strategy correctly prepends response items to existing array
- [ ] Error handling covers invalid JSON scenarios with appropriate console warnings
- [ ] Tests cover all three strategies with valid and invalid JSON cases
- [ ] Tests verify backward compatibility with existing HTML swap strategies
- [ ] Documentation updated with examples of JSON script tag updates
- [ ] All tests pass
- [ ] **User Review**: Changes verified and commit authorized
