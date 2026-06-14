# Project Index

## Paths
- App root: set in overlay.
- Source: set in overlay.
- Tests: set in overlay.
- Roadmap: `project/roadmap/`
- Memory: `project/memory/`

## Load
- Read overlay only when project-specific facts are needed.
- Read memory index before any memory shard.
- Read roadmap index before any roadmap macro/layer.

## Overlay Contract
Overlay owns:
- project name
- source paths
- package manager
- test commands
- domain rules
- DB/provider quirks
- deployment constraints
