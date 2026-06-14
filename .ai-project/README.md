# AI Project Starter

Portable prompt, skill, command, roadmap, memory, and issue-template starter for Codex + Claude.

Two modes:
- Template source: `AI-ProjectStarter/`. Maintained here, validated here, not loaded during normal runtime.
- Installed runtime: `.ai-project/`. Agents load only this copy after install.

## Goals
- Keep internal prompts in English.
- Respond to users in Italian by default.
- Load context lazily: kernel -> project index -> skill -> tagged memory/roadmap shard.
- Keep files small and deduplicated.
- Preserve tool safety: explicit confirmation before writes that close roadmap work or push git history.

## Layout
- `core/`: shared rules loaded by all agents.
- `adapters/`: Codex and Claude entrypoints generated from shared rules.
- `starter.json`: manifest for skills, commands, required files, tags, and roadmap layers.
- `skills/`: portable task skills. Installed under `.ai-project/skills/`.
- `commands/claude/`: slash-command wrappers. Installed under `.ai-project/commands/claude/`.
- `project/`: portable project index, memory shards, and roadmap templates.
- `github/ISSUE_TEMPLATE/`: GitHub issue templates.
- `overlays/example/`: placeholder overlay shape only. Real overlays are created after install in `.ai-project/overlays/<project>/`.

## Install
1. Create `.ai-project/`.
2. Copy `AI-ProjectStarter/*` into `.ai-project/`.
3. Copy `.ai-project/adapters/codex/AGENTS.md` to project root `AGENTS.md` or merge into existing one.
4. Copy `.ai-project/adapters/claude/CLAUDE.md` to project root `CLAUDE.md` or merge into existing one.
5. Keep skills canonical in `.ai-project/skills/`. Also copy them to `.agents/skills/` only if Codex needs local skill discovery.
6. Copy `.ai-project/commands/claude/*` to `.claude/commands/` for Claude slash-command discovery.
7. Copy `.ai-project/github/ISSUE_TEMPLATE/*` to `.github/ISSUE_TEMPLATE/` if GitHub issue forms should change.
8. Add one project overlay in `.ai-project/overlays/<project>/PROJECT_OVERLAY.md`.

Do not add real project overlays to `AI-ProjectStarter/`. Keep project names, paths, aliases, DB quirks, domain facts, and private conventions in installed runtime overlays or project memory.

## Runtime Loading
Runtime agents load:
- `.ai-project/core/`
- `.ai-project/project/PROJECT_INDEX.md`
- matching `.ai-project/skills/<name>/SKILL.md`
- tagged memory/roadmap shards only when required

Runtime agents must not load `README.md`, `MIGRATION.md`, or `CHECKS.md` unless maintaining or validating the starter itself.

## Validate

```bash
bash AI-ProjectStarter/scripts/validate-starter.sh
```

## Token Check
Validator `word_count` uses same file set as:

```bash
find AI-ProjectStarter/core AI-ProjectStarter/skills AI-ProjectStarter/commands/claude AI-ProjectStarter/project/memory AI-ProjectStarter/github/ISSUE_TEMPLATE \
  -type f \( -name '*.md' -o -name '*.yml' -o -name '*.yaml' \) -print0 |
  xargs -0 wc -w
```

Target: stay under 3000 words.
