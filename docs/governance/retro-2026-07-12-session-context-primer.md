# Retro 2026-07-12 — SessionStart context primer でマルチエージェント状態誤読を防止

## Trigger
AI self-correction + repeated-friction(3x) + near-miss。PR テンプレート作成→マージ→クリーンアップの一連で、(1) 未pull commit を user WIP と誤読し「データ損失の可能性」と証拠なく警告、(2) deny 済み `git restore` を 3 回試行、(3) 並行セッションと二重 PR、が発生した。

## Facts
（system language。timeline + evidence）
- セッション開始時 local main = `#23 (924abe7)`。origin/main には未pull の `#24 (e70402c)` が存在（後続で #25/#26 が追加され現在 origin/main = `44f50b5`）。
- `#24` が変更した 8 ファイル（`.claude/settings.json` / `.codex/hooks.json` / `hooks.json` 削除 / `scripts/autonomous-gate.sh` ほか）が `git status` 上で「未コミット変更」として出現した。
- AI は `git diff HEAD -- <file>` による provenance 確認より前に「WIP 消失 / データ損失の可能性」と警告した。後に `git diff HEAD` が空 = 既コミット = 損失なしと判明した。証拠: `git log --oneline 924abe7..e70402c` = `#24` 単独、`git diff --stat 924abe7 e70402c` が当該 8 ファイルと一致。
- `.claude/settings.json` の `permissions.deny` に `Bash(git restore:*)` 等が存在。事前確認せず `git restore --staged <8 files>` を 3 回試行し、いずれも permission deny で遮断された（AskUserQuestion 承認は permission layer を上書きしない）。
- 並行セッションが同一「PR テンプレ」タスクで `docs/add-pr-template-rule` ブランチ・PR #25 を作成。AI は `docs/pr-template`・PR #26 を作成。内容はバイト一致で二重 PR となった。開始時の `gh pr list --state open` は空で、検知が後追いになった。origin/main 最終内容は重複・損失なし。

## 5 Whys → Root Cause
1. Why staged 差分を user WIP と解釈したか → provenance（由来）を検証しないまま「未コミット = user の手作業」と仮定した。
2. Why provenance 未検証で仮定したか → 「local main が stale だと未pull commit が未コミット変更として現れる」という状態を認識していなかった。
3. Why 認識していなかったか → session 開始時に local main の同期状況（behind/ahead）が可視化されていない。
4. Why 二重 PR を防げなかったか → 別セッションの active worktree / open PR が session 開始時に可視化されていない（点検が AI の手動気付き頼み = 後追い）。
5. Why deny コマンドを 3 回試したか → 環境の git deny 制約が session 開始時に提示されていない。

**Root cause(s) (the class-blocking point(s)):**
occurrence: session 開始時に「AI が状態を正しく理解するためのリポジトリ状態コンテキスト（main 同期状況 / active worktree / open PR / git deny 制約）」が自動提示されない。3 事象すべてがこの単一の context 欠落に収束する。 · detection: いずれも AI が手動で気付くまで検知されず後追いになる（session 冒頭に受動的に提示される機構がない）。

## Class
stale-context-parallel-agent-blindness
recurrence_of: none
recurring class（このリポジトリはマルチターミナル並行エージェント運用が前提のため恒常的に再発）。blast radius: AI 推論・コミュニケーション（誤警告・二重作業・無駄な試行）。reversibility of the failure action: read-only（実害なし。誤警告と無駄ターンのみ。git restore は deny で未実行）。

## Decision
- Tier: 動的⑤（SessionStart context primer フック = state 依存の advisory を毎 session 自動注入）+ ⑤ Rule（AGENTS.md、CLI 非依存の行動規律）。
- **Why this tier:**
  - ①（invalid state を型で排除）は不可 — 対象 state は system 外部（origin/main の進行、別セッションの worktree/PR）に依存し、型で表現できない。
  - ②（PreToolUse で遮断）は不適 — 遮断すべき「不正操作」ではない。stale main も並行作業も正当であり、遮断すると legitimate work を false-block する。
  - よって最上位は「毎 session AI が知るべき state 依存 advisory」= 動的⑤。静的 Rule だけでは AI が手動で state を収集する必要が残るため、live state を自動注入する SessionStart フックを主機構とし、行動規律（provenance 検証・二重作業確認・deny 回避）は CLI 非依存の AGENTS.md ルールで補完する。
  - 主機構をフックにする理由: 今回の失敗は「AI が context を持たなかった」こと自体。Rule（prompt-level）は AI の記憶・compaction 生存に依存するが、SessionStart フックは毎 session 決定論的に live state を注入する（= 「AI が正しく context を理解する」要件を機構で満たす）。
- Rejected tiers + reason:
  - ①: C1 — state が system 外部依存のため型で表現不能。② へ再検討 → ② も false-block リスクで却下 → 動的⑤。
  - ② PreToolUse block: C3 — 正当な並行作業・stale main を遮断してしまう（false-block）。SessionStart は遮断不可の advisory であり false-block リスクがゼロ。
  - ⑥ do-nothing: C2 — user 明示要求 + recurring class（並行前提 repo で恒常再発）のため one-off ではない。
- 独立 context Critic 免除の理由: 独立レビューの主目的は ② hook の C3 false-block risk 評価だが、本フックは非遮断・fail-open・read-only の advisory 専用で当該 risk が構造的に存在しない。inline Generator–Critic（C1–C6 全 PASS）で十分と判断。
- hook failure mode: fail-open 採用。SessionStart は side-effect-only（遮断不可）であり、内部例外・fetch タイムアウト・オフライン・gh 未認証は exit 0 + 無出力で素通り。理由: advisory の欠落は無害だが、session 開始を阻害するのは有害。

## Cure (existing instances)
- [x] 本 session の 3 事象は既に reconcile 済み（PR #26 正常 merge・データ損失なし・worktree/stale ref クリーンアップ済み）— PR #26。
- [x] 同 class の「他の未修正インスタンス」は grep 上存在しない — これは重複コードのバグではなく context 欠落の process gap のため、cure 対象は「機構の不在」そのもの（= Prevent で解消）。

## Prevent (prevention mechanism)
- `scripts/session-context-primer.mjs`（新規 SessionStart フック）— main 同期状況 / active worktree / open PR / git deny 一覧を additionalContext 注入。`.claude/settings.json` SessionStart に登録（trunk-start-warning と併記）。
- `AGENTS.md`「セッション/タスク開始時のコンテキスト確認（必須）」節（新規）— provenance 検証 / 二重作業確認 / git deny 回避の 3 規律（Codex CLI・Claude Code 双方）。
- negative test（violating input = local main が behind の状態で session 開始）:
  - `git rev-list --left-right --count origin/main...924abe7` → 実行結果 `3	0`（behind=3）→ スクリプトの `if (behind > 0)` 分岐が発火し「main 遅延 + provenance 検証」警告を注入する（元 session の #23 vs 進行後 origin の再現。当時の実 behind は 1、いずれも >0）。※ behind>0 の実 worktree が現存しないため full script 実行ではなく predicate で検証（`git worktree add` は destructive-git-guard で遮断されるため）。
  - 実スクリプト実行（現状 = behind 0）: valid JSON 出力 + `アクティブな worktree 5 件` + deny 8 項目を surface（Problem 2/3 の機構が動作）。
  - fail-open: 非 git dir から `CLAUDE_PROJECT_DIR="" node session-context-primer.mjs` → output-bytes=0, exit=0。
- positive test（false-block なし）: N/A — 本フックは非遮断の SessionStart advisory であり、いかなる入力でも tool 呼び出しを block しない（構造的に false-block 不能）。

## Verify cmd
```bash
ROOT="$(git rev-parse --show-toplevel)"
# 1. primer が valid JSON を出力し worktree/deny を surface するか
CLAUDE_PROJECT_DIR="$ROOT" node "$ROOT/scripts/session-context-primer.mjs" | python3 -m json.tool >/dev/null && echo "valid JSON OK"
# 2. behind>0 分岐の predicate（違反入力の検知）
git -C "$ROOT" rev-list --left-right --count origin/main...924abe7   # → "<behind>\t0", behind>0 で警告発火
# 3. fail-open: 非 git dir → 無出力 + exit 0
D="$(mktemp -d)"; ( cd "$D" && CLAUDE_PROJECT_DIR="" node "$ROOT/scripts/session-context-primer.mjs" | wc -c ); rmdir "$D"   # → 0
```

## Next
- [ ] Codex CLI 側の SessionStart 自動注入 — 現状は AGENTS.md 手動確認でカバー。`.codex/hooks.json` の出力契約（`_cli-dispatch.mjs` 経由）を確認し、価値 > 実装コストと判断できれば primer を Codex にも配線する（done-condition: Codex session 開始時に同等 context が注入される、または「手動確認で十分」と判断し本項目を close）。
