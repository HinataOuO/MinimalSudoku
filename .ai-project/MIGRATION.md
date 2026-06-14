# Migration Guide

Migration-only context. Do not load during normal runtime. Use only while installing, upgrading, or validating this starter.

## Policy
- Internal prompting: English.
- Skills and commands: English.
- Memory shards: English, ultra-compressed.
- GitHub templates: English.
- User-facing output: Italian unless explicitly requested otherwise.

## Steps
1. Snapshot current `.agents/`, `.claude/`, `.github/ISSUE_TEMPLATE/`.
2. Copy starter files into temporary paths.
3. Move global rules into `core/KERNEL.md`; keep one language rule only.
4. Convert memory files into tagged shards with frontmatter:

```yaml
---
id: short-id
tags: [always]
load: always
updated: YYYY-MM-DD
depends: []
---
```

5. Replace project names in skills with `{project_root}` or overlay facts.
6. Move repeated scope/routing rules to `core/LOAD_ORDER.md` and `core/CONVENTIONS.md`.
7. Keep project-specific tables, roles, feature names, DB quirks in overlay or tagged memory shards.
8. Replace Claude commands with thin wrappers that load matching starter skills.
9. Replace GitHub issue templates with scope/layer-aligned templates.
10. Run token check from `README.md`.

## Path Mapping

| Old path | New canonical path | Install note |
| --- | --- | --- |
| `.agents/skills/*` | `.ai-project/skills/*` | Keep canonical copy here; duplicate to `.agents/skills/` only for Codex discovery. |
| `.claude/commands/*` | `.ai-project/commands/claude/*` | Copy wrappers to `.claude/commands/` for Claude discovery. |
| `.claude/memory/*` | `.ai-project/project/memory/*` | Split into tagged shards with required frontmatter. |
| `.github/ISSUE_TEMPLATE/*` | `.ai-project/github/ISSUE_TEMPLATE/*` | Copy into `.github/ISSUE_TEMPLATE/` only when ready to replace repo templates. |
| project-specific notes | `.ai-project/overlays/<project>/PROJECT_OVERLAY.md` | Keep names, paths, DB quirks, domain aliases out of generic files. |

## Manifest

Use `starter.json` as source of truth for:
- canonical root
- skill names
- Claude wrapper names
- required files
- memory tags
- roadmap layers

Create any project-specific command aliases outside the template after install.

## Validation
- Backend task loads only kernel, project index, backend skill, and relevant backend/migration memory.
- UI task does not load migration/domain shards unless requested.
- `next-task` loads roadmap index, one macro, one layer.
- `task-status` remains read-only.
- `close-task` writes only after explicit confirmation.
- `push` blocks `.env*`, `*.key`, `*.pem`; never force pushes.
- `bash AI-ProjectStarter/scripts/validate-starter.sh` passes.
