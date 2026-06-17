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

# AI 統治ルール（brief2dev エコシステム由来・日本語化）

このプロジェクトには、`brief2dev` エコシステムからコア統治ルールを厳選・日本語化して移行した統治レイヤーが組み込まれている。AI は実装・レビュー・コミットの各段階でこれらを順守すること。

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

すべてのフックは fail-open（エラー時は素通り）。詳細・移行の経緯は `.claude/ECOSYSTEM-MIGRATION.md` を参照。
