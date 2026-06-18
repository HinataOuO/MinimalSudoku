---
name: log-issue
description: Create issue and propose memory shard; no implicit push.
---

## purpose
Persist reported problem in issue tracker and memory.

## load
- `.ai-project/local/project/memory/MEMORY_INDEX.md`
- matching scope shard if exists
- overlay for issue labels and repo settings

## scope
- Issue tracker.
- Matching memory scope.

## deny
- Do not push.
- Do not create duplicate issue when existing one matches.
- Do not write memory before explicit confirmation.

## procedure
1. Collect title, problem, scope, labels.
2. Search existing issues if tool available.
3. Create or update issue.
4. Propose memory shard/index delta when durable and useful.
5. Write memory only after explicit confirmation.
6. Report issue URL and memory result.

## done
- Issue URL reported.
- Memory delta proposed or applied after confirmation.
