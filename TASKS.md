# Project Tasks

## Agent Protocol

This file is managed via **Optimistic Concurrency**.

### Executing Tasks

1.  **Read**: Parse the file to find the next available task (`[ ]`).
    - **Check Dependencies**: If a task is marked with `🔒 Blocked by: [...]`, verify the blocking task is `[x]` (Done) before starting.
2.  **Lock**: Immediately change the status to `[-]` (In Progress) and **save the file**.
3.  **Initialize**: Create a new worktree for the task using `gwadd <branch-name>` as defined in `docs/guides/worktree-management.md`.
4.  **Execute (PDSRTDD Flow)**: Perform the task following the **Plan-Data-Schema-Registry-Test-Develop** protocol:
    - **Plan & Data (Handshake Phase)**: Analyze the requirements and make the **Architectural Decision**. Update `LOG.md` with the plan and a **State Manifest** (listing every piece of state, its source of truth, and its validation schema). **STOP and wait for approval before writing any code.**
    - **Schema & Registry**: Once the plan is approved, define the Zod schemas and update `html-registry.ts`. **CRITICAL:** Do _not_ implement the component logic or behavior logic yet. Only the contracts.
    - **Test**: Write tests against the Schemas and Registry definitions. Ensure the tests fail or correctly assert the missing implementation.
    - **Develop**: Implement the Web Component classes (`webcomponent.ts`) and Behavior logic (`behavior.ts`) to make the tests pass.
5.  **Log**: Create a `LOG.md` file within the feature's folder in `feature/sub-feature` documenting:
    - **Architectural Choice**: Explicitly state why you chose a **Behavior** vs. a **Web Component** based on the "Identity vs. Capability" heuristic.
    - **Implementation Details**: Decisions made, and any relevant technical notes.
    - **State Manifest**: List the attributes that represent the component's state.
6.  **Verify & Review**: Run `pnpm check` to ensure project-wide type safety. Verify that all tests pass within the feature worktree. **STOP**. Present the changes to the user (e.g., via `git status`). **DO NOT** commit until the user explicitly requests it.
7.  **Verify Alignment (Regression)**: If a core component or protocol was changed, identify all existing implementations that rely on it. Create new tasks to "regress" and align those implementations with the new core.
8.  **Standardize Usage (Progression)**: For new features, ensure the usage standards are documented in the relevant guide (e.g., `AGENTS.md`). Create follow-up tasks to propagate this standard to other relevant areas.
9.  **Complete**: Update the status to `[x]` (Done).

### Adding New Tasks

1.  **Atomicity**: Ensure the task represents a single, independent unit of work. **Each behavior implementation or refactor must be a separate task.** Do not group multiple behaviors into one task.
2.  **Abstract Requirements**: Define the task by the **Goal** (What) and the **Context** (Why). Do not prescribe the **Implementation** (How). The detailed design and implementation plan is the responsibility of the agent executing the task during the **Plan** phase.
3.  **Classify**: Determine if the task is a **Progression** (new feature/capability) or a **Regression** (alignment/refactoring due to core changes).
4.  **Create Task Folder**: Create a directory in `tasks/` named after the task (kebab-case).
5.  **Document Task**: Create a detailed `.md` file inside that folder using the template in `docs/templates/task.md`. Ensure it includes the Protocol Checklist and Prohibited Patterns.
6.  **Register Task**: Add a new `[ ]` entry **at the top** of the `Backlog` section in this file, linking to the `.md` file created in step 5.
    - **Define Dependencies**: If the new task depends on another task being completed first, append `🔒 Blocked by: [Task Name]` to the line.
    - **Bottom-Up Ordering**: New tasks are always added at the top. This makes it easier to see the most recent work and maintains a chronological history from newest (top) to oldest (bottom).

## Status Legend

- `[ ]` **Todo**: Available to be picked up.
- `[-]` **In Progress**: Currently being executed.
- `[x]` **Done**: Completed and verified (including regression/progression checks).
- `[?]` **Indeterminate**: Blocked or needs review.

## Backlog

- [-] [Implement Set-Value Behavior](docs/tasks/set-value-behavior/task.md)
- [-] [Fix Failing Tests](docs/tasks/fix-failing-tests/task.md)
- [x] [Implement Auto-Grow Behavior](docs/tasks/auto-grow-behavior/task.md)
- [-] [Add CLI Apply TSConfig Flag Command](docs/tasks/cli-apply-tsconfig-flag/task.md)
- [x] [Add CLI Reapply Command](docs/tasks/cli-reapply-command/task.md)
- [x] [Fix Zod Mini Union Type Support](docs/tasks/fix-zod-mini-union-support/task.md)
- [x] [Add CLI Command to List Available Behaviors](docs/tasks/list-existing-behaviors/task.md)
- [x] [Migrate CLI to Schema-First Architecture (TypeBox)](docs/tasks/cli-schema-first-architecture/task.md)
- [x] [Fix Config File Handling and Add Command Issues](docs/tasks/fix-config-and-add-command/task.md)
- [x] [Remove event-methods.ts Stale Reference](docs/tasks/remove-event-methods-stale-reference/task.md)
- [ ] [Behavior Validation Standards](docs/tasks/behavior-validation-standards/task.md)
- [ ] [Multi-Registry Support](docs/tasks/multi-registry-support/task.md)
- [ ] [Registry Discovery and Directory](docs/tasks/registry-discovery-directory/task.md) 🔒 Blocked by: [Multi-Registry Support]
- [ ] [Consolidated Registry Format Support](docs/tasks/consolidated-registry-format/task.md) 🔒 Blocked by: [Multi-Registry Support]
- [ ] [Security Hardening for Multi-Registry](docs/tasks/security-hardening-registries/task.md) 🔒 Blocked by: [Multi-Registry Support]
- [ ] [Create Documentation Site](docs/tasks/docs-site/task.md)
- [x] [Investigate Slow Test Execution Times](docs/tasks/investigate-slow-tests/TASK.md)
- [x] [Audit Documentation and Align with Current Implementation](docs/tasks/20260226-182707-audit-documentation/TASK.md)
- [x] [Audit Core Implementation Files for Consistency](docs/tasks/20260226-182800-audit-core-files/TASK.md)
- [x] [Add Negative Array Index Support to json-template](docs/tasks/json-template-negative-indices/task.md)
- [x] [Add json-template-slice Attribute for Array Slicing](docs/tasks/json-template-slice/task.md)
- [x] [Remove IIFE Support - ESM Only](docs/tasks/esm-only-drop-iife/task.md)
- [x] [Restructure CDN Build - Core + Behavior Modules](docs/tasks/cdn-core-plus-behaviors/task.md)
- [x] [Fix CDN Build to Inline TypeBox Schemas](docs/tasks/fix-cdn-build-typebox/task.md)
- [x] [Render json-template When Root Data is Empty Array](docs/tasks/json-template-render-empty-arrays/task.md)
- [x] [Add Fallback Operator to JSON-Template Behavior](docs/tasks/add-fallback-operator/task.md)
- [x] [Add Array Swap Strategies to Request Behavior](docs/tasks/add-array-swap-strategies/task.md)
- [x] [Migrate reveal to Behavior Definition Standard](docs/tasks/migrate-to-behavior-definition-standard/reveal.md)
- [x] [Consolidate Constants and Commands into Behavioral Definition](docs/tasks/consolidate-constants-commands/task.md)
- [x] [Refactor to Opt-In Loading Architecture](docs/tasks/refactor-opt-in-loading/LOG.md)
- [x] [Implement Content Setter Behavior](docs/tasks/20260224-182306-content-setter-behavior/LOG.md)
- [x] [JSON Template Behavior](docs/tasks/json-template-behavior/task.md)
- [x] [Compound Invoker Commands Support](docs/tasks/compound-invoker-commands/task.md)
- [x] [Request Behavior JSON Script Update Support](docs/tasks/request-json-script-update/task.md)
- [x] [Align Behavior Attributes and Documentation](docs/tasks/20260224-125849-align-behavior-attributes/LOG.md)
- [x] [Fix Behavior Parsing Inconsistency Between Auto-Loader and Behavioral Host](docs/tasks/fix-behavior-parsing-inconsistency/task.md)
- [x] [Opt-In Auto-Loader for Behavioral Hosts](docs/tasks/opt-in-auto-loader/task.md)
- [x] [Replace @standard-schema/spec with auto-wc in Core Dependencies](docs/tasks/replace-standard-schema-with-auto-wc/task.md)
- [x] [Add Test Files Import Option](docs/tasks/add-test-files-option/task.md)
- [x] [Refactor Strategies to Validators with Directory Structure](docs/tasks/refactor-strategies-to-validators/task.md)
- [x] [Remove Jiti Dependency - Build Registry Instead](docs/tasks/remove-jiti-build-registry/task.md)
- [x] [Simplify Init Flow](docs/tasks/simplify-init-flow/task.md)
- [x] [Create Platform Interface](docs/tasks/create-platform-interface/task.md)
- [x] [Type Safety Review and Refactor](docs/tasks/type-safety-review-refactor/task.md)
- [x] [Refactor CLI to Validator Strategy](docs/tasks/refactor-cli-validator-strategy/task.md)
- [x] [Create CLI 'create' Command](docs/tasks/create-cli-create-command/task.md)
- [x] [Add Zod Mini Support](docs/tasks/add-zod-mini-support/task.md)
- [x] [Reimplement Input Watcher Behavior](docs/tasks/reimplement-input-watcher/task.md)
- [x] [Reimplement Request Behavior](docs/tasks/reimplement-request/task.md)
- [x] [Sync Reveal Hidden/Open Attributes](docs/tasks/sync-reveal-hidden-open/task.md)
- [x] [Fix Broken Tests](docs/tasks/fix-broken-tests/task.md)
- [x] [Cleanup Stale Behaviors](docs/tasks/cleanup-stale-behaviors/task.md) 🔒 Blocked by: [Fix Broken Tests]
- [x] [Migrate `logger` to TypeBox Schema](docs/tasks/migrate-behavior-logger/task.md)
- [x] [Migrate `element-counter` to TypeBox Schema](docs/tasks/migrate-behavior-element-counter/task.md)
- [x] [Migrate `clearable` to TypeBox Schema](docs/tasks/migrate-behavior-clearable/task.md)
- [x] [Migrate `compute` to TypeBox Schema](docs/tasks/migrate-behavior-compute/task.md)
- [x] [Migrate `set-value` to TypeBox Schema](docs/tasks/migrate-behavior-set-value/task.md)
- [x] [Migrate `request` to TypeBox Schema](docs/tasks/migrate-behavior-request/task.md)

- [x] [Test Transformers and CLI Logic](docs/tasks/test-transformers-cli/task.md)
- [x] [Separate Standard Events](docs/tasks/separate-standard-events/task.md)

- [x] [Smart Validator Detection in Init](docs/tasks/smart-validator-detection/task.md)
- [x] [Refactor Behavior Attachment](docs/tasks/refactor-behavior-attachment/task.md)
- [x] [Initial Setup](docs/tasks/initial-setup/task.md)
- [x] [Extract Behaviors](docs/tasks/extract-behaviors/task.md)
- [x] [Create CLI Tool](docs/tasks/create-cli/task.md)
- [x] [Document Command Protocol](docs/architecture/command-protocol.md)
- [x] [Document Reactive Protocol](docs/architecture/reactive-protocol.md)
- [x] [Create Testing Guide](docs/guides/testing-behaviors.md)
- [x] [Create Usage Guide](docs/guides/using-behaviors.md)
- [x] [Create Behavioral Host Web Component](docs/tasks/behavioral-host/task.md)
- [x] [Add Platform Detection to Init](docs/tasks/platform-detection/task.md)
- [x] [Implement Import Rewriting](docs/tasks/import-rewriting/task.md)
- [x] [Add Test Harness to Core](docs/tasks/test-harness/task.md)
