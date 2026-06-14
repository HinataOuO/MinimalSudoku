# Load Order

1. `core/KERNEL.md`
2. `core/CONVENTIONS.md`
3. `project/PROJECT_INDEX.md`
4. Matching skill or command wrapper.
5. Memory index, then only shards whose `tags` or `load` match task.
6. Roadmap index, then only current `MACRO.md`, then only one layer file.
7. Project overlay only when project-specific facts are required.

## Rules
- `always` memory can load every session.
- Scope memory loads only on direct relevance.
- Roadmap layer files load one at a time.
- Full-stack tasks may load several skills, but each layer stays explicit.
