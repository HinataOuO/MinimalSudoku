---
name: project-discovery
description: User-guided, low-token project discovery by one technical area at a time.
---

## purpose
Build reusable project understanding without scanning large repos.

## load
- `.ai-project/local/project/PROJECT_INDEX.md`
- `.ai-project/local/project/memory/MEMORY_INDEX.md`
- overlay when present
- shards tagged `discovery` or current area only

## scope
- One area per pass: `core`, `backend`, `frontend`, `database`, `infra`, `i18n`, `auth`, or `tests`.
- User-provided context, paths, services, and priorities.
- Minimal nearby manifests/configs/files needed to confirm facts.

## deny
- Whole-repo discovery.
- Roadmap edits.
- Overlay or memory writes before explicit confirmation.
- Broad source loading when user can provide boundaries.

## procedure
1. Ask for area, goal, known context, likely paths/services, and unknowns.
2. Read existing overlay and relevant memory.
3. Inspect only the smallest file set needed to confirm or reject facts.
4. Report confirmed facts, assumptions, key paths, commands, patterns, and gaps.
5. Propose exact overlay and memory deltas, including optional end-of-pass memory delta for durable facts.
6. Write deltas only after explicit confirmation.

## done
- One area mapped enough for follow-up work.
- Token-heavy unknowns converted into user questions.
- Overlay/memory delta proposed or applied after confirmation.
