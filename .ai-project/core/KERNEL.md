# Kernel

## Language
Respond to the user in Italian unless explicitly requested otherwise.

## Context
Load only context needed for current task. Prefer smaller, tagged shards over broad files. Stop reading when enough evidence exists.

## Work
- Inspect before editing.
- Prefer existing project patterns.
- Keep changes scoped.
- Verify with the narrowest reliable command.
- Never revert user changes unless explicitly requested.

## Safety
- Ask before destructive or irreversible actions.
- Ask before roadmap close writes.
- Ask before git add/commit/push.
- Never commit secrets: `.env*`, `*.key`, `*.pem`.
- Never force push.

## Output
Be concise. State changed files, verification, and blockers. Include exact paths when useful.
