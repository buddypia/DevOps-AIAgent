# Verification Before Completion Rules

## ID: R-CM-010
## Severity: critical
## Enforced by: completion-evidence-guard (Stop hook, settings.json)（本プロジェクトでは未配備 — prompt-level）

### Iron Law

```
検証の証拠なしに完了を主張してはならない。
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

このメッセージ内で検証コマンドを実行していないなら、通過したと主張することはできない。

### Generation-Verification Loop

すべての generation の直後に、verification が **同じ turn の中で** 実行されなければならない。次のターンへ先送りするのは verification ではない。

- コード作成 → 同じターンでビルド/テスト/lint を実行
- 成果物作成 → 同じターンで schema validation
- ルール変更 → 同じターンで回帰 audit

「次に確認します / すぐ検証します」= Iron Law 違反。検証を先送りすると generation の意図と結果が分断され、次のターンは新しいコンテキストで始まるため検証を忘れてしまう。

### Rules

1. **証拠優先**: すべての完了/成功の主張の前に、検証コマンドを実行し出力を確認しなければならない
2. **推測禁止**: 「たぶん通過するだろう」「動作しそうだ」などの推測表現は禁止。実行結果のみが証拠である
3. **部分検証禁止**: lint 通過 ≠ ビルド通過。テスト通過 ≠ 要求充足。それぞれ独立した検証が必須
4. **エージェント結果の不信**: サブエージェントの「成功」報告を信頼しない。VCS の diff で独立して検証する
5. **Red-Green 必須**: 回帰テストは必ず 失敗(Red) → 修正 → 通過(Green) のサイクルで検証する

### 検証マッピング

| 主張 | 必要な証拠 | 不十分な証拠 |
|------|-----------|-------------|
| 「テスト通過」 | テストコマンドの出力: 0 failures | 過去の実行、「通過するはず」 |
| 「lint クリーン」 | リンターの出力: 0 errors | 部分チェック、推定 |
| 「ビルド成功」 | ビルドコマンド: exit 0 | lint 通過、ログが良さそう |
| 「バグ修正済み」 | 元の症状テスト: 通過 | コード変更、修正の推定 |
| 「要求充足」 | 行ごとのチェックリスト | テスト通過 |

### Red Flags — こういう表現が出たら止まる

- 「たぶん」「おそらく」「〜そうだ」の使用
- 検証前の満足表現(「完了!」「終わり!」「成功!」など)
- コミット/プッシュ/PR の前に検証を未実行
- エージェントの成功報告を盲信
- 部分検証への依存
- 「今回だけ」という思考
- **検証なしに成功を匂わせるすべての表現**

### 合理化防止

| 言い訳 | 現実 |
|------|------|
| 「もう動作するはず」 | 検証を実行せよ |
| 「確信している」 | 確信 ≠ 証拠 |
| 「今回だけ」 | 例外なし |
| 「lint が通ったから」 | lint ≠ コンパイラ |
| 「エージェントが成功と言った」 | 独立して検証せよ |
| 「疲れている」 | 疲労 ≠ 免除 |
| 「もともとあったもの / pre-existing」 | 証拠なしの pre-existing 主張 = 回避。`git log -S` または `git blame` の出力で証明せよ |
| 「測定していません / not measured yet」 | 測定していないなら明示的に書け。任意の数字を作るな。'Don't make up numbers' |
| 「この数字は大体」 | 'Real numbers, real file names'。大体 = 推定の明示 + 後続の測定が必要 |
| 「I'll be notified when it completes / 後で確認します / 完了したらお知らせします」 | Long-running task のポーリング回避。同じターンで progress を確認するか、background 実行 + 完了後に即座に verification。`run_in_background` でも結果確認の責任は AI にある |
| 「ついでに手を付けたから / while I'm here / この機会に整理」 | Self-permission cleanup を遮断。バグ修正とリファクタリングは別コミット。スコープ外の変更はユーザー確認後(R-CM-017 Dynamic Scope Lock と同じ精神) |

---

### Rule 6: 「Clean」宣言の禁止

AI がチェッカー/ルール/遵守/検証/判定をすべて自ら行う self-reference ループにおいて、「Clean 達成」のような二分法的宣言は sycophantic な完了主張を構造的に誘発するため、これを禁止する。

#### 禁止語彙(artifact validation の文脈)

- 「Clean 達成」「Clean State」「完全に解決」「問題なし」
- "Perfect"、「100% 整合性」「全部通過」
- 「これで安全です」「異常ありません」

#### 強制フォーマット: Verification Bundle

検証結果を報告する際は、必ず以下の構造を使用する(自由記述は禁止):

```
Verified (実行した検証):
- <チェッカー名>: <exit code / stdout の証拠>

NOT verified (実行していないこと):
- <未実行の項目とその理由>

Known limitations (検証者の限界):
- <チェッカーが構造的に捕捉できないこと>

Adversarial check (Rule 7 を自動実行):
- 試行: <1 個の mutation 内容>
- 結果: <発見した/できなかった + 詳細>
```

ユーザーの承認なしに完了状態の宣言は不可。AI は「検証結果の報告者」であって「判定者」ではない。

#### Trivial 免除 (R-CM-030 Rule 10 と整合)

以下の 3 条件をすべて満たす場合、Verification Bundle の 4 ブロック様式 + Rule 7 Adversarial Self-Check 様式を SKIP 可能 — (a) 変更ファイル数 ≤ 2、(b) 変更 LOC ≤ 20 (insertions + deletions)、(c) 変更の性格が non-substantive(typo / config 値 / whitespace / 既存セクション内に bullet を 1 個追加など。**新規セクション / 新規 hook / コードロジック変更 / 新関数 = 即座に disqualified**)。条件を 1 個以上違反 → substantial → フル様式を義務化。

**免除時でも**: 検証コマンドは実行し、結果(exit code / 主要な stdout)は報告する。免除されるのは様式だけであり、検証そのものは免除されない(R-CM-010 Iron Law は維持)。「trivial だから検証していない」= Iron Law 違反。

#### Rules-as-Code 連携

`data/rules-as-code/` の predicate 結果を報告する際は **raw な結果のみ** を引用する。解釈は禁止。
違反 predicate がある場合に「改善した/良くなった」のような定性評価は禁止。`{rule_id, ok, reason, path}` をそのまま出力する。

### Rule 7: Adversarial Self-Check 1-step

**発動時点(両地点で義務)**: ① 検証コマンド通過の直後(1 ターン以内) ② **commit 作成の直前** — `git commit` の Bash 呼び出しの *前* の turn で。両地点ともで自己 mutation の試行を行う。検証通過だけでは commit の安全は保証されない — 検証者は自らの spec 内の edge case しか検査しないためである。

> 「通過したテストは、書かれた case の通過を証明するだけであり、書かれていない case の安全を証明しない。」

すべての「検証通過」の直後 + **commit 作成の直前**、AI は **1 ターン** 以内に実行する:

1. **Mutation 試行**: 現在の artifact を 1 個変形し、predicate が依然として通過するかを確認する。
   - 例: pricing type を "freemium" → "subscription" に変えると LI3 predicate が fail すべきである(expected behavior)。変えたのに依然として通過 = predicate の false positive。
2. **結果報告**:
   - 反例を発見 → その反例がバグ。即座に predicate または artifact を修正。
   - 反例を発見できず → Verification Bundle の "Adversarial check" に「試行 X、反例なし」と明示的に記録。

**記録の欠落 = ルール違反**。黙って通過を宣言することを禁止。

**Trivial 免除**: Rule 6 の Trivial 免除基準 (R-CM-030 Rule 10 と整合) を同時適用 — 同じ 3 条件 (≤ 2 ファイル + ≤ 20 LOC + non-substantive) を満たす場合、mutation 試行の様式を SKIP 可能。検証そのものは免除されない。Rule 7.3 の disqualifier (SSOT) を優先適用。

**Rule 7.1: 5 Mutation カタログ (escalation 候補)**: 単一 mutation では反例を見つけられなかった場合、mutation を 5 inversion パターン (Negation / Boundary shift / Type swap / Order flip / Scope inversion) に拡張する。5 項目すべての適用は強制ではない (Rule 7 の 1-step で十分)。5-mutation の詳細表 + 適用時点は `docs/governance/adversarial-self-check-catalog.md#rule-71` を参照 (SSOT)。

**Rule 7.2: Consensus Trigger Audit (multi-llm 推奨カタログ)**: Rule 7 mutation が self-reference loop (自己評価) であるという限界の補強。7 trigger (seed/SPEC mod, ontology evolution, goal reinterpretation, goal drift > 0.3, stage uncertainty > 0.3, lateral thinking adoption, Stage 1 confidence=high self-report) のいずれかが発現した時、multi-llm-debate / -reflection / -recursive-meta-cognition のユーザー明示呼び出しを推奨 (自動発動はしない — R-CM-016 Rule 10 と整合)。7 trigger ↔ スキルのマッピング表 + threshold の出典は `docs/governance/adversarial-self-check-catalog.md#rule-72` がカタログの SSOT。

**Rule 7.3: Pre-Commit Edge Case Checklist (5 軸)**

commit 作成の直前に発動 (上記「発動時点」②)。静的解析 hook では捕捉しづらく、mutation 時点で self-check しないと捕捉できない edge case パターンを surface する。自身の変更 (特に新関数 / 新正規表現 / 新 input パーサ) について、自身の変更範囲内で自己点検する。

| 軸 | 質問 | 通過基準 |
|----|------|----------|
| **A) empty / null / undefined** | 入力が `""` / `null` / `undefined` / `[]` / `{}` のとき、関数が throw / 無限ループ / silently 誤った値を返す ことはないか? | 明示的な分岐または type guard が存在する。なければ追加する。 |
| **B) whitespace / CRLF / multibyte** | 入力の前後の空白 / タブ / CRLF (`\r\n`) / 日本語・絵文字などの multibyte 文字を含む場合、正規表現 / split / trim が意図どおりに動作するか? | 正規表現に `\s*` / `String#trim()` / `\b` のような明示的な boundary 処理。回帰 fixture を 1 個追加可能。 |
| **C) 意図コメント / メタ行** | 入力に `# comment` / `// ...` / shebang / blank line / markdown heading のような *データではない* 行が混ざるとき、パーサがこれをデータと誤認しないか? | block separator / line filter / regex anchor `^...$` を明示。 |
| **D) Adversarial mutation** | Rule 7 mutation step 1 の commit 時点 instance。核心となる分岐を 1 個変形した後、検証が fail すべきなのが正常。報告は Verification Bundle の "Adversarial check" ブロックを再利用。 | 変形後に検証 fail。通過する場合は検証を補強。 |
| **E) cross-reference 整合** (2026-05-17 追加) | 本変更が、同一の fact / count / SSOT path / 段階数 / 名称を複数の位置で引用しているか? すべてのマッチが本 commit の訂正後の値と一致しているか? 特に docs 訂正 / カタログ / 表 / ルール本文の編集時に surface 漏れが起きるパターン。**Trivial 免除 disqualifier**: cross-ref 対象の fact 変更 (カウント / 名称 / SSOT path / 段階数 / ヘッダーラベルなど) を含む commit は trivial 免除の対象外 — Rule 6 / R-CM-030 Rule 10 の ≤ 2 ファイル + ≤ 20 LOC 条件を満たしても E 軸の自己点検は義務。 | 変更対象の fact の grep の全マッチ (`grep -nE "<fact>" docs/ .claude/`) が訂正後の値と一致。inline カウント / ヘッダーラベル / cross-pointer テキストの同期漏れがある場合は NEED FIX |

**報告形式 (commit 作成直前の turn のテキスト出力に含める)**:

```
Pre-Commit Edge Case Check:
- A (empty/null/undefined): <PASS / NEED FIX: ...>
- B (whitespace/CRLF/multibyte): <PASS / NEED FIX: ...>
- C (意図コメント / メタ行): <PASS / NEED FIX: ...>
- D (adversarial mutation): <Verification Bundle の Adversarial ブロックを参照>
- E (cross-reference 整合): <PASS / NEED FIX: どの cross-ref が漏れているか>
```

**適用範囲 + Trivial 免除**: Rule 7 本文下部の Trivial 免除 (Rule 6 / R-CM-030 Rule 10 と整合 — ≤ 2 ファイル + ≤ 20 LOC + non-substantive) を同時適用。追加の disqualifier — 新関数 / 新正規表現 / 新 input パーサ / 新ファイルパス処理を 1 行以上含む commit は trivial と無関係に義務。ルールテキスト / 文書 / typo / バージョン bump のみの変更 = 適用除外。

**摘発パターン (正直に明示)**: prompt-level の自己規律。hook による自動検出は不在 — commit 直前に silently SKIP 可能。次の commit の round-trip finding で retroactive に発見された場合、R-CM-024 audit の累積 + R-CM-021 retrospective の作成。

**適用除外時の明示義務 (silent SKIP 遮断)**: 適用除外の場合でも、commit 作成直前の turn のテキストに `Pre-Commit Edge Case Check: 適用除外 (理由: <ルールテキストのみ変更 / 文書 / typo など>)` を 1 行明示する。報告そのものを省略すると *適用義務なのか免除なのかをユーザーが区別できない* — silently SKIP と同じ効果になる。
