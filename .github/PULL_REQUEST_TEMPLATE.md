<!--
タイトルは Conventional Commits 形式で記述: feat: / fix: / docs: / refactor: / test: / chore:
このテンプレートは Codex CLI・Claude Code 双方で PR 作成時に必ず使用する (AGENTS.md「Pull Request」節参照)。
各セクションは削除せず、該当しない場合は「なし」と明記する。
-->

## 概要 / Summary

<!-- 何を、なぜ変更したかを箇条書きで -->
-

## 変更種別

<!-- 該当するものに x を入れる -->
- [ ] feat: 新機能
- [ ] fix: バグ修正
- [ ] docs: ドキュメント
- [ ] refactor: リファクタリング（挙動変更なし）
- [ ] test: テスト
- [ ] chore: ビルド・設定・その他

## 関連 Issue / PR

<!-- `Closes #123` など。なければ「なし」 -->
なし

## 検証 / Verification

<!--
R-CM-010: 検証証拠なしに「完了」を主張しない。実行したコマンドと結果を「証拠」として貼る。
未実行のものは「未実行」と明記する（推測での記入は禁止）。
`project-config.json` の commands が null の項目はスキップ可。
-->

**Verified（このPRで実行した検証）:**
- [ ] `make q.check`（typecheck + test）: <!-- 例: 77 tests passed -->
- [ ] `make q.check-architecture`（SSOT 検証）:
- [ ] その他:

**NOT verified（実行していないこと・理由）:**
-

## スコープ / 影響範囲

<!-- 変更が触れる範囲。本番 Cloud（Cloud Run 等）への影響有無を明記 -->
-

## チェックリスト

- [ ] タイトルが Conventional Commits 形式
- [ ] シークレットをハードコードしていない（`.env` / 環境変数経由）
- [ ] 検証証拠を添付済み（推測での「完了」主張なし）
- [ ] 変更を要求範囲に限定（無関係なリファクタ・整形なし）
