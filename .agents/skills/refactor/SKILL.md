---
name: refactor
description: Analyze a file, function, component, module, feature, or topic and produce a detailed refactor and optimization plan using project code-generation criteria.
---

## purpose
Analyze a code target and produce a plan-first refactor report that improves simplicity, performance, organization, duplication, and project consistency.

## load
- `.ai-project/local/project/memory/MEMORY_INDEX.md`
- shards tagged `always`
- shards tagged `backend`, `frontend`, or `migration` when the target matches that scope
- overlay only for source paths, test commands, framework, DB/client, or domain boundaries needed to interpret the target

## scope
- Read-only analysis of a specified file, function, component, module, feature, or topic.
- Nearby files, helpers, types, tests, schemas, and call sites needed to understand the target.
- Planning changes that apply the code-generation protocol.
- Follow-up implementation only after the user explicitly requests applying the plan.

## deny
- Do not edit code.
- Do not run formatters, migrations, codegen, or other mutating commands.
- Do not apply the plan in the same command unless the user makes a separate explicit implementation request.
- Do not broaden analysis outside the target unless needed to understand dependencies or duplicated behavior.
- Do not propose speculative rewrites when a smaller refactor solves the issue.

## procedure
1. Interpret the requested target. If ambiguous after local search, ask one focused clarification.
2. Read the target, nearby patterns, helpers, types, tests, and relevant memory shards.
3. Identify current responsibility, data flow, dependencies, and verification surface.
4. Evaluate simplicity, baseline performance, file organization, duplication, validation, error handling, and consistency with project patterns.
5. Produce an ordered refactor plan with target files/areas, expected benefits, risks, and verification.
6. Include concise motivations for major choices. Expand motivations only when the user requests detailed reasons.

## done
- Target interpretation stated.
- Current structure and issues summarized.
- Refactor and optimization plan produced.
- Risks and verification listed.
- No files edited.
