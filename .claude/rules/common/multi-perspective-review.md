---
paths:
  - ".claude/skills/final-review/**"
---
# Multi-Perspective Review Rules

## ID: R-CM-012
## Severity: major
## Enforced by: null (skill: `final-review` Deep mode prompt-level)

### Rules

1. **Deep モードの自動有効化**: 変更ファイル 16 個以上、または Core/Shared の変更時に multi-perspective レビューを自動で有効化する
2. **6 役割必須**: PM, Developer, QE, Security, DevOps, UI/UX の 6 つの観点から独立して評価する
3. **証拠ベース**: すべての発見事項に具体的なコード位置またはスクリーンショットの証拠を必須とする
4. **Future is Now**: HIGH 以上の発見事項は即座に解決する。「次のスプリントへ延期」を禁止する
5. **加重平均スコア**: Security(1.5x) > Developer/QE(1.2x) > PM/DevOps(1.0x) > UI/UX(0.8x)
6. **統合判定**: 6 役割すべて Go → Go。CRITICAL 1 件以上 → No-Go。3 役割以上が No-Go → No-Go
7. **`--strict` 連携**: strict モードでは multi-perspective が自動で有効化される
8. **詳細プロトコル**: `.claude/skills/final-review/references/multi-perspective-protocol.md` を参照する
