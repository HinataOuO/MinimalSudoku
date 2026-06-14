---
name: git-issue
description: Analyze an issue and produce implementation plan.
---

## purpose
Turn issue context into scoped plan.

## load
- Issue body/comments.
- `project/PROJECT_INDEX.md`
- relevant skill by scope.
- relevant memory shards.

## scope
- Read-only analysis unless user requests implementation.

## deny
- Do not edit by default.
- Do not close issue.

## procedure
1. Read issue.
2. Identify scope/layer.
3. Load matching skill and memory.
4. Inspect likely files.
5. Report plan, risks, verification.

## done
- Actionable plan produced.
