---
name: session-status
description: Report current session task list.
---

## purpose
Show active session progress.

## load
- Current agent task list only.

## scope
- Session state.

## deny
- Do not edit files.
- Do not read roadmap unless no session tasks exist and user asks for next work.

## procedure
1. List completed, active, pending tasks.
2. If no tasks exist, suggest `next-task`.

## done
- Session state reported.
