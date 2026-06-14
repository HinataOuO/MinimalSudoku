# Acceptance Checks

Starter maintenance context only. Runtime agents must not load this checklist unless validating the starter.

## Lazy Load
- Backend task loads kernel, conventions, project index, backend skill, memory index, backend memory. Migration memory loads only for schema/migration/seed/import work.
- Frontend task loads frontend skill and frontend memory. It does not load migration or domain shards unless requested.
- `next-task` loads roadmap index, one `MACRO.md`, and one layer file.
- Overlay loads only when project-specific paths, commands, DB provider, or domain facts are required.

## Safety
- `task-status` and `session-status` stay read-only.
- `close-task` asks explicit confirmation before roadmap/status writes.
- `push` asks explicit confirmation before git push, blocks `.env*`, `*.key`, `*.pem`, and never force pushes.
- Destructive DB or filesystem operations require explicit confirmation.

## Install
- Installed root is `.ai-project/`.
- Adapter paths reference `.ai-project/core/`, `.ai-project/project/`, and `.ai-project/skills/`.
- Claude wrappers reference `.ai-project/skills/`.
- Project facts live in overlays or tagged memory, not generic core/skills/commands.

## Validate
```bash
bash AI-ProjectStarter/scripts/validate-starter.sh
```
