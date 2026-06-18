---
name: next-task
description: Find next roadmap task with lazy layer loading.
---

## purpose
Identify next actionable roadmap task.

## load
- `.ai-project/local/project/roadmap/INDEX.md`
- current feature `MACRO.md`
- one matching layer file

## scope
- Roadmap read-only.

## deny
- Do not edit roadmap.
- Do not load multiple layer files unless task spans layers explicitly.

## procedure
1. Read roadmap index.
2. Pick first `wip`; if none, first `todo`.
3. Read its `MACRO.md`.
4. Find first unchecked criterion.
5. Map criterion to one layer: `database`, `backend`, `frontend`, `verify`.
6. Read only that layer file.
7. Report feature, task, layer, approach.

## done
- Next task and loaded layer reported.
