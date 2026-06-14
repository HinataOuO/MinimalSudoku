---
name: migration
description: Full DB migration workflow: schema, migration, seed/import scripts.
---

## purpose
Run or prepare complete migration work.

## load
- `project/memory/MEMORY_INDEX.md`
- shards tagged `migration`
- overlay for DB provider, scripts, commands

## scope
- Schema.
- Migrations.
- Seed/import scripts.

## deny
- Irreversible DB operation without explicit confirmation.
- Frontend work.

## procedure
1. Read schema, migration history, scripts.
2. Plan migration and seed/import impact.
3. Edit schema/scripts.
4. Run approved migration/verification commands.
5. Record recovery notes when needed.

## done
- Migration path ready or executed.
- Data/script impact verified or blocker reported.
