# Cleanup Stale Behaviors

## Context
The `registry/behaviors-registry.json` file contains entries for behaviors that do not exist in the filesystem:
- `input-watcher`
- `sign-out`
- `social-auth`

These stale entries clutter the registry and can cause confusion.

## Objectives
Remove the stale entries from `registry/behaviors-registry.json`.

## Steps
1.  Open `registry/behaviors-registry.json`.
2.  Locate the entries for `input-watcher`, `sign-out`, and `social-auth`.
3.  Remove the entire object for each of these behaviors.
4.  Verify that `registry/behaviors-registry.json` is valid JSON.

## deliverables
-   Updated `registry/behaviors-registry.json` without the stale entries.
