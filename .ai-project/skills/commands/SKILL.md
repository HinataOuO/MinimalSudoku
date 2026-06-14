---
name: commands
description: List portable project skills and route to smallest matching skill.
---

## purpose
Route user intent to one focused skill.

## load
- `core/KERNEL.md`
- `core/LOAD_ORDER.md`
- `project/PROJECT_INDEX.md`

## scope
- Skill discovery only.

## deny
- Do not edit files.
- Do not load roadmap layers.

## procedure
1. Match request to smallest skill.
2. If task spans layers, state needed skills in order.
3. Load only selected skill.

## done
- Selected skill or clear no-skill fallback reported.
