# Conventions

## Tags
- `always`: user preferences, durable workflow rules.
- `backend`: server code, DB access, API, auth, validation.
- `frontend`: UI, components, styles, i18n strings.
- `migration`: schema changes, migrations, seeds, import scripts.
- `domain`: project domain rules.
- `roadmap`: task planning and completion state.

## Roadmap Status
- `todo`: not started.
- `wip`: active.
- `blocked`: waiting on external input.
- `done`: complete and verified.

## Layer Names
- `database`
- `backend`
- `frontend`
- `verify`

## Memory Frontmatter

```yaml
---
id: short-id
tags: [always]
load: always
updated: YYYY-MM-DD
depends: []
---
```

## Skill Body Shape
Use only these headings after frontmatter:

```markdown
## purpose
## load
## scope
## deny
## procedure
## done
```
