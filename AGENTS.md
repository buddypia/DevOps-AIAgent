# DevOps × AI Agent Hackathon — キーポイント

主催: ファインディ / メインスポンサー: Google Cloud。AIエージェントを「企画→開発→デプロイ→運用」までフルサイクルで作るDevOpsハッカソン。

- **コンセプト**: つくる（Google Cloud AI中核のエージェント）/ まわす（GitHub連携・CI/CDでDevOps）/ とどける（Cloud Runで本番デプロイ）
- **必須技術①（実行基盤）**: Cloud Run / Cloud Functions / GKE / App Engine・GCE / Cloud TPU・GPU から1つ以上
- **必須技術②（AI）**: Gemini Enterprise Agent Platform（旧Vertex AI）/ Gemini API / ADK / Gemma・Imagen・Agent Builder / Speech・Vision・NL・Translation API から1つ以上
- **任意技術**: Flutter / Firebase / Veo / Elasticsearch ほか
- **審査基準（5項目）**: ①AIエージェントが価値の中心（自律的判断・実行、“必然性”）②課題アプローチ力（ストーリーの一貫性・新規性）③ユーザビリティ ④実用性・体験価値 ⑤実装力（技術選定・拡張性・実運用配慮）
- **賞金（総額200万円）**: 最優秀50万×1 / 優秀30万×3 / 特別10万×6
- **主要日程**: 作品提出〆切 2026/7/10 23:59（ProtoPedia）→ 一次審査 7/13–17 → 二次審査 7/21–24 → 結果発表 7/30 → 最終ピッチ 8/19（Google渋谷オフィス、選抜10チーム）
- **提出物（3点）**: ①公開GitHubリポジトリURL ②デプロイ済みURL（動作確認可能な状態）③ProtoPedia作品URL
- **ProtoPedia登録**: 動画・システム構成図・ストーリー（課題/対象ユーザー/特徴）必須、タグに `findy_hackathon` を必ず付与
- **参加資格**: 日本居住18歳以上、個人/チーム可。SNSハッシュタグ `#findy_hackathon`

詳細は `docs/01_hackathon/devops_ai_agent_hackathon_notion.md` を参照。
インフラ構成や移行方法については [docs/infra.md](file:///Users/a13973/dev/buddypia/hackathon/DevOps×AIAgent/docs/infra.md) を参照。

## Pull Request（必須ルール）

**すべての PR は `.github/PULL_REQUEST_TEMPLATE.md` の構成に従って本文を書く。Codex CLI・Claude Code 双方で必須。**

- PR 本文を生成するとき（`/create-pr` の `--body`、`gh pr create --body`、Web UI いずれも）は、テンプレートの全セクション（概要 / 変更種別 / 関連 Issue / 検証 / スコープ / チェックリスト）を維持する。該当しないセクションは削除せず「なし」と明記する。
- **検証セクション**は R-CM-010 に従い、実行した検証コマンドと結果を証拠として記載する。未実行なら「未実行」と明記し、推測で埋めない。
- PR タイトルは Conventional Commits 形式（`feat:` / `fix:` / `docs:` / `refactor:` / `test:` / `chore:`）。
- `gh pr create` を `--body` なしで実行するとテンプレートが自動適用される。本文を用意する場合もテンプレート構成を踏襲する。

## セッション/タスク開始時のコンテキスト確認（必須）

マルチターミナル並行運用（Codex CLI / Claude Code）が前提のため、状態誤読・二重作業を防ぐ。Codex CLI・Claude Code 双方で必須。

- **provenance 検証**: `git status` の staged/modified を user の未コミット WIP と断定する前に、必ず `git diff HEAD -- <file>` で確認する。local main が origin/main より遅延していると、未pull の upstream commit が「未コミット変更」として現れる（損失ではない）。証拠なしに「WIP消失 / データ損失」等を主張しない（R-CM-010）。
- **二重作業の回避**: PR を作る作業の前に `gh pr list --state open` と `git worktree list` で、別セッションが同一タスクを進行中でないか確認する。同一タスクの重複を検知したら着手前にユーザーへ確認する。
- **git deny 制約**: 本 repo は `git restore` / `git reset` / `git rebase` / `git clean` / `git checkout .` / force push を deny する（`.claude/settings.json` の `permissions.deny`）。index 調整が必要でも `git restore`/`git reset` を試さず、worktree フロー（`make wt.new BR=...`）を使う。
- **自動提示**: Claude Code では SessionStart フック `scripts/session-context-primer.mjs` が上記の現在値（main 同期状況 / active worktree / open PR / deny 一覧）を毎回自動注入する。Codex CLI では本節に従い手動で確認する。

---

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# AI 統治ルール

AI は実装・レビュー・コミットの各段階で、このプロジェクトの統治ルールを順守すること。

## SSOT（信頼できる唯一の情報源）

- **`.claude/rules/`**: AI 行動・コーディング・テスト・セキュリティ・git の統治ルール群（日本語化済み）。一覧とメタデータは `.claude/rules/MANIFEST.json`。
- **`project-config.json`**: パス・規約・品質ゲート命令の SSOT。パスや命令を仮定する前に必ず参照する（`commands.lint` などが `null` の場合は当該命令なし＝スキップ）。
- **`Makefile`**: 品質ゲート（`make q.check` = typecheck + test、`make q.check-architecture` = SSOT ファイル検証）。

## 常時適用される主要ルール（抜粋）

- **R-CM-010 検証前完了禁止**: 検証証拠（テスト/型チェック/ビルドの実行出力）なしに「完了」「成功」「通る」と主張しない。生成と検証は同一ターン内で行う。「たぶん通る」は禁止語。
- **R-CM-016 Anti-Sycophancy**: 迎合しない。根拠に基づき立場を明示し、必要なら反論する。
- **R-CM-017 プロセスパターン**: Completeness（数分差なら完全実装を推奨）/ See Something Say Something（問題発見は即フラグ）/ 3-Strike（同一手法3回失敗で中断・エスカレーション）/ Dynamic Scope Lock（バグ修正のスコープを当該モジュールに限定）。
- **R-CM-003 セキュリティ**: シークレットをコードにハードコードしない。`.env` 経由・環境変数参照。入力は Zod 等で検証。
- **R-CM-008 git ワークフロー**: Conventional Commits 形式。`main` への force push 禁止。破壊的 git コマンドは事前にユーザー確認。

## 配備済みフック（`.claude/settings.json` で自動有効）

| フック | イベント | 役割 |
|--------|---------|------|
| `secret-leak-guard` | PreToolUse Edit/Write | コードへのシークレット混入を検出してブロック |
| `destructive-git-guard` | PreToolUse Bash | 破壊的 git コマンド（reset --hard / push --force / clean / rebase 等）をブロック |
| `prompt-injection-guard` | PostToolUse Read | 信頼できないファイルの prompt-injection パターンを警告（ブロックはしない） |
| `edit-error-recovery` | PostToolUse Edit | Edit 失敗時に「まず Read」等の復旧ガイダンスを注入 |

すべてのフックは fail-open（エラー時は素通り）。
