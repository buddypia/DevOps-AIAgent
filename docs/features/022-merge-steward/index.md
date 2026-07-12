# Merge Steward

- [BRIEF](BRIEF.md)
- [SPEC](SPEC-022-merge-steward.md)
- [Screen](screens/merge-steward.md)
- [UI Wireframe](../../wireframes/feature-022-merge-steward-wireframe.md)

Status: Implemented and verified (116 tests, production build, architecture gate, Deep final review).

## Runtime

- Issue preview/create with explicit action authorization and duplicate guard
- PR evidence evaluation with GitHub `mergeable_state`, checks, reviews, changed paths, head/base receipt
- READY-only squash merge after immediate re-evaluation
- Read-only A2A skill: `github.lifecycle.evaluate`
