@AGENTS.md

<!-- brief2dev-transplant:start — auto-managed block (transplant-bundle.mjs 가 재이식 시 갱신, 직접 편집 금지) -->

## 이식된 메커니즘 (brief2dev transplant-bundle)

- 이 프로젝트의 일부 자산(hook/script/skill)은 brief2dev 에서 이식되어 외부에서 유지보수된다. 인벤토리 SSOT: `.claude/.transplant-receipt.json`
- 번들: `git-worktree-isolation` (이식 2026-07-09, v1.0)
- receipt 의 `role: "managed"` 파일은 재이식 시 항상 최신으로 덮어써진다 — **직접 수정 금지**. 동작 조정은 `role: "customizable"` 설정 파일(재이식 시 보존됨)을 편집하거나 원본(brief2dev)에 반영한다.
- 재이식/업그레이드: receipt 각 번들의 `reapply_command` 실행 (managed 로컬 수정 감지 + customizable 보존 내장).

<!-- brief2dev-transplant:end -->
