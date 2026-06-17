.PHONY: help q.check q.fix q.typecheck q.test q.build q.check-architecture

PACKAGE_MANAGER ?= npm

help:
	@echo "a2a-agent-marketplace — 品質ゲート (brief2dev エコシステム由来・日本語化)"
	@echo "  make q.check               全品質ゲート (typecheck + test) を実行"
	@echo "  make q.typecheck           型チェックのみ"
	@echo "  make q.test                テストのみ"
	@echo "  make q.build               本番ビルド"
	@echo "  make q.check-architecture  SSOT ファイルの存在を検証"

# このプロジェクトには lint/format スクリプトが無いため、品質ゲートは
# typecheck + test で構成する (command-portability R-CM-009: null コマンドはスキップ扱い)。
q.check: q.typecheck q.test
	@echo "q.check PASS"

q.typecheck:
	@$(PACKAGE_MANAGER) run typecheck

q.test:
	@$(PACKAGE_MANAGER) test

q.build:
	@$(PACKAGE_MANAGER) run build

q.check-architecture:
	@test -f project-config.json
	@test -f AGENTS.md
	@test -f CLAUDE.md
	@test -d .claude/rules
	@test -f .claude/settings.json
	@grep -q "Answer Grounding" AGENTS.md || grep -q "統治" AGENTS.md || (echo "[FAIL] AGENTS.md から統治セクションが失われています" && exit 1)
	@echo "q.check-architecture PASS"
