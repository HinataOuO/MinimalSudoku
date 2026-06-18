---
name: push
description: Commit and push after diff review and explicit confirmation.
---

## purpose
Safely commit and push current changes.

## load
- Git status/diff/branch only.

## scope
- Git working tree.

## deny
- Do not force push.
- Do not commit `.env*`, `*.key`, `*.pem`.
- Do not run `git add`, `git commit`, or `git push` before confirmation.

## procedure
1. Inspect `git status --short`, diff, and branch.
2. Stop if clean.
3. Stop if secret-like files are staged/modified.
4. Propose Conventional Commit message.
5. Show branch, file count, message.
6. Ask explicit confirmation.
7. After confirmation, run add/commit/push.

## done
- Commit hash and push target reported, or blocker reported.
