# Decisions

## Roadmap Format

Use lightweight Markdown files in `roadmap/`.

Reason: readable, easy to update, no tooling required.

## Architecture

Keep Sudoku engine independent from UI.

Reason: puzzle generation, solving, validation, and difficulty logic need unit
tests and should not depend on React Native.

## Persistence

Use Zustand `persist` middleware with AsyncStorage.

Reason: small API surface, matches requested stack, supports offline resume.

## UI Style

Use NativeWind utility classes plus a small color token file.

Reason: minimal shadcn-inspired styling without adding a component library.
