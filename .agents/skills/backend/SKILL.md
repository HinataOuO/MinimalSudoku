---
name: backend
description: "Backend tasks: server code, DB queries, API routes, auth, validation."
---

## purpose
Implement backend changes with project patterns.

## load
- `.ai-project/local/project/memory/MEMORY_INDEX.md`
- shards tagged `backend`
- overlay only for source paths, DB/client, auth rules

## scope
- Backend source paths from overlay.
- DB access helpers.
- API/server action files.

## deny
- Frontend layout/component-only work.
- Unrelated schema migrations.
- Generated files unless overlay allows.

## procedure
1. Read target files and local helpers.
2. Confirm validation/auth requirements.
3. Edit narrow files.
4. Run focused verification.
5. Review memory delta: propose only durable backend facts, or state none.

## done
- Backend behavior implemented.
- Validation/auth covered.
- Verification result reported.
- No memory written without explicit confirmation.
