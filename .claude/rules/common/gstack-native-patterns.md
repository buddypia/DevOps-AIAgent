---
paths:
  - ".claude/skills/**/SKILL.md"
  - ".claude/scripts/**/*.mjs"
---
# Process Patterns Rules

## ID: R-CM-017
## Severity: major
## Enforced by: null (prompt-level enforcement, systematic-debugging と連携)

### Purpose

brief2dev の 4 つのプロセスパターンを定義する。
Anti-Sycophancy(R-CM-016)と Completion Status Protocol(別テンプレート)は別管理のため、本ルールには含めない。

### Rules

1. **Completeness Principle (Boil the Lake)**: AI がオプションを提示する際、完全な実装(Option A: すべてのエッジケース、100% カバレッジ)と簡略な実装(Option B: 90% カバレッジ)の差が AI 時間基準で数分以内であれば、**常に完全な実装を推奨** する。「十分に良い」ものは、「完全な」もののコストが数分であるときには正しい選択ではない。
   - **Lake vs Ocean**: Lake(モジュール 100% テスト、全機能の実装、すべてのエッジケース)= 実行可能。Ocean(システム全面の書き直し、マルチクォーターのマイグレーション)= 範囲超過フラグ。
   - **Anti-patterns**: 「90% で十分です」(70 行の差なら A を選択)、「テストは後続 PR で」(テストは最も安価な lake)、人間チームの時間のみを引用(AI 時間も併記)

2. **See Something, Say Something**: どのワークフローステップであっても問題を発見したら — テスト失敗だけでなく deprecation 警告、セキュリティ問題、リンティングエラー、デッドコード、環境問題など — **即座に 1 文でフラグする**。発見した問題を黙って見過ごさない。
   - brief2dev は基本的に solo モード(単一ユーザー CLI)であるため、発見次第「修正しますか?」と提案する
   - 現在の作業範囲外の問題もフラグする(ただし修正はユーザー確認後)

3. **3-Strike Escalation**: 同一のアプローチで 3 回失敗したら **即座に中断してエスカレーション** する。4 回目の試行は禁止。
   - R-CM-010(検証なしの完了主張を禁止)と補完関係: R-CM-010 は「証拠なしの成功主張を禁止」、本ルールは「反復失敗時の中断を強制」
   - systematic-debugging の Phase 3 hypothesis testing と同一原則
   - エスカレーション時: BLOCKED 状態 + 試行した内容 + ユーザーへの推奨アクションを含める

3.1. **Stagnation 4 Patterns + Persona Best-Fit**: 単純な「3 回失敗」のカウントを 4 パターンに分類し、パターン別に適合する persona を推奨する。

   | パターン | 発現シグナル | 日本語名称 | Best-fit Persona |
   |------|---------|----------|----------------|
   | **SPINNING** | 同一出力 hash の反復 (3 回以上) | 空回り | **Hacker** (`data/personas/hacker.md`) |
   | **OSCILLATION** | A→B→A→B の period-2 cycle (2 cycles 以上) | 行ったり来たり | **Simplifier** または **Architect** |
   | **NO_DRIFT** | drift score に変化なし (epsilon < 0.01, 3 回以上) | 足踏み | **Researcher** または **Architect** |
   | **DIMINISHING_RETURNS** | progress rate < 0.01 (3 回以上) | 収穫逓減 | **Simplifier** または **Researcher** |
   | (全パターン) | universal applicability | — | **Contrarian** (`data/personas/contrarian.md`) |

   **Action**: 3-Strike 発動時にパターン分類 + best-fit persona の推奨のみ(自動呼び出しはしない — 単一ユーザー環境での自己拘束を回避、R-CM-024 の精神)。

   **Sources**: 日本語訳 + brief2dev への適用は `data/personas/manifest.json`。

   (brief2dev 生成器固有の仕組み。本プロジェクトでは参考情報)

4. **Dynamic Scope Lock**: バグ修正/デバッグ時に影響範囲が把握できたら **編集対象を当該モジュールに限定** する。スコープクリープを防止し、修正の blast radius を最小化する。
   - systematic-debugging の Phase 1 以降に自然に適用される
   - 修正が 5 個以上のファイルにまたがる場合はユーザーに blast radius 警告を出す
   - 「ついでに手を付けるから」というリファクタリングは禁止 — バグ修正とリファクタリングは別コミット

### 既存ルールとの関係

| 本ルール | 補完対象 | 関係 |
|---------|----------|------|
| Completeness Principle | CLAUDE.md「AI 能動提案」 | 強化 — 具体的な判断基準 (Lake vs Ocean) を提供 |
| See Something Say Something | pipeline-drift-guard (L3)（本プロジェクトでは未配備 — prompt-level） | 拡張 — パイプライン外の一般開発にも適用 |
| 3-Strike Escalation | R-CM-010 (verification-before-completion) | 補完 — R-CM-010 は「証拠」、本ルールは「反復失敗の中断」 |
| Dynamic Scope Lock | systematic-debugging | 補完 — debugging の scope 制限をルールとして明文化 |

### Phase 1-3 Advisory Patterns

本ルールの 4 つのパターン (Completeness / See Something Say Something / 3-Strike / Dynamic Scope Lock) に加え、brief2dev の Phase 1-3 分析/企画/設計の advisory に適用される追加 native パターンが、以下のスキルに直接統合されている。本ルールは cross-reference のみを維持する(フルテキストの重複を回避)。

| Pattern | 統合位置 | 本ルールとの関係 |
|---------|----------|--------------|
| **Premise Challenge (3 questions)** | `business-analyzer/SKILL.md` Step 1.7 | 補完 — 分析ステージで *問題の framing* に挑戦。R-CM-016 Rule 1 (ポジション) の分析ステージ強化 |
| **Implementation Alternatives MANDATORY (2-3 approaches)** | `business-analyzer/SKILL.md` Step 1.8 + `mvp-scoper/SKILL.md` Step 4.6 | 補完 — 単一ソリューションでの沈黙進行を遮断。R-CM-029 Rule 2 (Goal-Driven) の事前 alternatives 明示 |
| **Founder Signal Synthesis (8 signals)** | `business-analyzer/SKILL.md` Step 4.6 | 補完 — confidence calibration の入力。R-PL-001 Rule 7 (evidence_grade 上限) と直交 |
| **4 Scope Modes posture + analysis** | `mvp-scoper/SKILL.md` Step 4.5 | 補完 — 既存の scope_posture カテゴリに mode-specific な分析パターン + opt-in ceremony を追加。R-CM-016 Rule 11 (Mode Commit Iron Law) と cross-ref |
| **CEO Cognitive Patterns (5 native)** | `mvp-scoper/SKILL.md` Step 4.7 | 補完 — Reversibility×Magnitude / Inversion / Focus as subtraction / Edge case paranoia / Subtraction default の 5 個 |
| **Scope Challenge 6Q + Anti-shortcut clause** | `system-designer/SKILL.md` Step 0.5 | 補完 — C4 ダイアグラムを描く *前* のシステム境界に挑戦するゲート |
| **Eng Manager Cognitive Patterns (5 native)** | `system-designer/SKILL.md` Step 0.7 | 補完 — Boring by default / Blast radius / Brooks essential vs accidental / Reversibility / Beck make change easy の 5 個 |
| **Failure Modes マトリクス (codepath × test/error/silent)** | `system-designer/SKILL.md` Step 3.5 | 補完 — 本ルール See Something Say Something のアーキテクチャステージ強化。C4 ダイアグラムだけ描いて終わる罠を遮断 |
| **Worktree Parallelization Strategy** | `system-designer/SKILL.md` Step 3.7 | 補完 — Dependency table + Parallel lanes + Conflict flags。scaffold ユーザーの multiple worktree 並列実装ガイド |
| **OWASP Top 10 + STRIDE Security Checklist (G1-G5 gates)** | `final-review/SKILL.md` Axis 4 + `references/cso-security-protocol.md` | 強化 — 本ルール See Something Say Something のセキュリティ次元。8/10 confidence gate + concrete exploit scenario を義務化し、FP/sycophantic なセキュリティ報告を遮断 |
| **Secrets Archaeology + Dependency Supply Chain commit-blocking** | `pre-quality-gate/SKILL.md` Critical-tier | 強化 — 本ルール Dynamic Scope Lock の push 前ゲート次元。AKIA/sk-/ghp/xoxb prefix + npm audit HIGH+ を自動遮断 |
| **AI Effort Compression Table (Human/CC/Compression 3-col)** | `mvp-scoper/SKILL.md` Step 6 + `engineering-plan-writer/SKILL.md` のすべての Task `**Effort**:` 様式 | 強化 — 本ルール Completeness Principle の定量次元。「AI 時間のみ引用 = 意思決定の歪曲」を遮断。boundary-uniform |

(上表の各スキル/persona 参照は brief2dev 生成器固有の仕組み。本プロジェクトでは参考情報)
