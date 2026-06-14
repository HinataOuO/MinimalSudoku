---
name: close-task
description: Close a roadmap layer after explicit confirmation.
---

## purpose
Mark a roadmap layer complete.

## load
- `project/roadmap/INDEX.md`
- target feature `MACRO.md`
- target layer file

## scope
- Roadmap index.
- Target macro file.
- Target layer file.

## deny
- Do not edit unrelated roadmap files.
- Do not write before explicit confirmation.

## procedure
1. Identify feature and layer from user input or active `wip`.
2. Read index and macro.
3. Show exact planned changes.
4. Ask explicit confirmation.
5. After confirmation, update layer checkboxes/status, `updated`, feature status, and index.
6. Report changed paths.

## done
- Roadmap index and macro consistent.
