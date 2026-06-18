---
name: frontend
description: "Frontend tasks: pages, components, styles, client behavior, i18n UI strings."
---

## purpose
Implement UI changes consistent with project design.

## load
- `.ai-project/local/project/memory/MEMORY_INDEX.md`
- shards tagged `frontend`
- overlay only for app/component/i18n paths

## scope
- Frontend paths from overlay.
- Components, pages, layouts, styles, messages.

## deny
- Backend mutations unless task explicitly needs integration.
- Database/schema changes.

## procedure
1. Read nearby UI patterns.
2. Edit smallest component/page/message set.
3. Check responsive states when visible UI changes.
4. Run focused lint/typecheck if available.
5. Review memory delta: propose only durable frontend facts, or state none.

## done
- UI behavior complete.
- i18n kept in sync.
- Verification result reported.
- No memory written without explicit confirmation.
