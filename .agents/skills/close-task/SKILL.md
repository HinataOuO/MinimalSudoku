---
name: close-task
description: Close a roadmap layer after explicit confirmation.
---

## purpose
Mark a roadmap layer complete.

## load
- `.ai-project/local/project/roadmap/INDEX.md`
- target feature `MACRO.md`
- target layer file

## scope
- Roadmap index.
- Target macro file.
- Target layer file.

## deny
- Do not edit unrelated roadmap files.
- Do not write before explicit confirmation.
- Do not mix roadmap close confirmation with optional memory confirmation.

## procedure
1. Identify feature and layer from user input or active `wip`.
2. Read index and macro.
3. Show exact planned changes.
4. Ask explicit confirmation.
5. After confirmation, update layer checkboxes/status, `updated`, feature status, and index.
6. Report changed paths.
7. Separately review memory delta: propose only durable facts from closure, or state none. Write memory only after separate explicit confirmation.

## done
- Roadmap index and macro consistent.
- Optional memory delta handled separately from roadmap close.
