# Templates

Templates for creating new tasks, behaviors, and documentation in BehaviorFN.

## 📄 Available Templates

### [Task Template](./task.md)
Template for creating new development tasks.

**Use when:**
- Planning new features
- Documenting bug fixes
- Organizing refactoring work
- Creating improvement tasks

**Required sections:**
- Status and metadata
- Context (why)
- Goal (what)
- Acceptance criteria (how to verify)
- Optional: Testing plan, notes, references

## 🎯 Using Templates

### Creating a Task

1. **Copy template:**
   ```bash
   cp docs/templates/task.md docs/tasks/YYYYMMDD-HHMMSS-task-name/TASK.md
   ```

2. **Fill in details:**
   - Update status, date, priority, complexity
   - Write clear context and goals
   - Define specific acceptance criteria

3. **Add to TASKS.md:**
   ```markdown
   - [ ] Task name - Brief description
   ```

4. **Start working:**
   - Lock task: `[-]` in TASKS.md
   - Create LOG.md if needed
   - Follow PDSRTDD workflow

### Creating a Behavior

While there's no explicit behavior template, follow this structure:

```
registry/behaviors/behavior-name/
├── _behavior-definition.ts   # uniqueBehaviorDef call
├── schema.ts                  # TypeBox schema
├── behavior.ts                # Factory function
└── behavior.test.ts           # Tests
```

See [Behavior Definition Standard](../guides/behavior-definition-standard.md) for details.

## 📋 Template Structure

### Task Template Structure
```markdown
# Task: [Name]

**Status:** Pending/In Progress/Complete
**Created:** YYYY-MM-DD
**Priority:** High/Medium/Low
**Complexity:** High/Medium/Low

## Context
Why this task exists

## Goal
What success looks like

## Acceptance Criteria
- [ ] Testable requirement 1
- [ ] Testable requirement 2

## Testing
How to verify

## Notes
Additional info
```

## 🎨 Customizing Templates

Templates are starting points - adapt as needed:

### For Simple Tasks
Minimal template with just context, goal, and acceptance criteria.

### For Complex Tasks
Add sections for:
- Dependencies
- Risk assessment
- Rollback plan
- Migration strategy
- Performance considerations

### For Behavior Tasks
Add sections for:
- Attribute specifications
- Command specifications
- Event handling patterns
- Integration requirements

## 📝 Best Practices

### Task Templates
- **Be specific:** Vague goals lead to unclear results
- **Testable criteria:** Each criterion should be verifiable
- **Link related:** Reference related tasks, issues, docs
- **Keep updated:** Update task as requirements evolve

### Documentation Templates
- **Include examples:** Always show working code
- **Progressive disclosure:** Start simple, add complexity
- **Cross-reference:** Link to related documentation
- **Keep current:** Update when APIs change

## 🔗 Related Documentation

- [Tasks README](../tasks/README.md) - Task management
- [Contributing](../contributing/README.md) - Contribution guidelines
- [AGENTS.md](../../AGENTS.md) - Development workflow
- [Behavior Definition Standard](../guides/behavior-definition-standard.md) - Behavior structure

## 🤝 Contributing Templates

Have a useful template pattern? Contribute it!

1. Create template file
2. Document its purpose
3. Provide example usage
4. Update this README
5. Submit PR

---

**Need a template?** Start with [task.md](./task.md) and adapt as needed.

**Last updated:** 2026-02-26
