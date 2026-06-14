---
name: schema
description: Schema-only DB model changes.
---

## purpose
Change data model only.

## load
- `project/memory/MEMORY_INDEX.md`
- shards tagged `migration`
- overlay for DB provider and schema path

## scope
- Schema file.
- Migration history read-only.

## deny
- UI/backend implementation.
- Running destructive DB operations without confirmation.

## procedure
1. Read schema and nearby model patterns.
2. Edit schema.
3. Generate/check migration if requested or project flow requires.
4. Report migration command needed.

## done
- Schema updated.
- Migration impact stated.
