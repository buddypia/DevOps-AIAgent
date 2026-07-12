.PHONY: help q.check q.fix q.typecheck q.test q.build q.check-architecture wt.new wt.run

PACKAGE_MANAGER ?= npm

help:
	@echo "agent-guild — 品質ゲート"
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
	@test -f .github/workflows/deploy-cloud-run.yml
	@test -f .github/workflows/verify-public-proof.yml
	@grep -q "ops.triage.execute" .github/workflows/deploy-cloud-run.yml
	@grep -q "executableAgents" .github/workflows/deploy-cloud-run.yml
	@grep -q "ops.triage.execute" .github/workflows/verify-public-proof.yml
	@grep -q "executableAgents" .github/workflows/verify-public-proof.yml
	@grep -q "Answer Grounding" AGENTS.md || grep -q "統治" AGENTS.md || (echo "[FAIL] AGENTS.md から統治セクションが失われています" && exit 1)
	@echo "q.check-architecture PASS"

# ============================================================
# Worktree isolation
# ============================================================

## 新しい worktree を作成 (例: make wt.new BR=feature/<task>)
wt.new:
	@if [ -z "$(BR)" ]; then \
		echo "❌ wt.new: BR=<branch> 必須。例) make wt.new BR=feature/<task>"; \
		exit 2; \
	fi
	@node .claude/scripts/worktree-new.mjs --branch $(BR) $(if $(BASE),--base $(BASE)) $(if $(DRY),--dry-run)

## アクティブな worktree でコマンド実行 (CWD リダイレクション)
wt.run:
	@if [ -z "$(CMD)" ]; then \
		echo "❌ wt.run: CMD=\"<command>\" 必須。例) make wt.run CMD=\"npm test\""; \
		exit 2; \
	fi
	@node .claude/scripts/wt-run.mjs $(CMD)
