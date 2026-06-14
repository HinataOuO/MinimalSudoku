---
name: log-issue
description: Create issue and memory shard; no implicit push.
---

## purpose
Persist reported problem in issue tracker and memory.

## load
- `project/memory/MEMORY_INDEX.md`
- matching scope shard if exists
- overlay for issue labels and repo settings

## scope
- Issue tracker.
- Matching memory scope.

## deny
- Do not push.
- Do not create duplicate issue when existing one matches.

## procedure
1. Collect title, problem, scope, labels.
2. Search existing issues if tool available.
3. Create or update issue.
4. Create/update memory shard and index.
5. Report issue URL.

## done
- Issue URL reported.
- Memory updated when useful.
