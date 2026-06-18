---
name: task-status
description: Read-only roadmap status overview.
---

## purpose
Report current roadmap status without loading layer details.

## load
- `.ai-project/local/project/roadmap/INDEX.md`
- `MACRO.md` files for active `wip` features only

## scope
- Roadmap read-only.

## deny
- Do not edit.
- Do not load layer files.

## procedure
1. Read roadmap index.
2. Read active macro files.
3. Summarize feature/layer states.
4. List next open checkboxes.

## done
- Status table and next items reported.
