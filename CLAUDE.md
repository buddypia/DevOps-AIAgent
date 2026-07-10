@AGENTS.md

<!-- brief2dev-transplant:start — auto-managed block (transplant-bundle.mjs が再移植時に更新、直接編集禁止) -->

## 移植されたメカニズム (brief2dev transplant-bundle)

- このプロジェクトの一部資産 (hook/script/skill) は brief2dev から移植され、外部で保守されます。インベントリ SSOT: `.claude/.transplant-receipt.json`
- バンドル: `git-worktree-isolation` (移植 2026-07-10, v1.0)
- receipt の `role: "managed"` ファイルは再移植時に常に最新で上書きされます — **直接修正禁止**。動作調整は `role: "customizable"` 設定ファイル (再移植時保存) を編集するか、オリジナル (brief2dev) に反映します。
- 再移植/アップグレード: receipt 各バンドルの `reapply_command` 実行 (managed ローカル修正検知 + customizable 保存内蔵)。

<!-- brief2dev-transplant:end -->
