#!/bin/bash
# scripts/autonomous-gate.sh
# Stop フックで実行され、project-config.json から検証コマンドを読み出して実行する

# エージェントが作業を終えようとする (Stop) 際の品質ゲート
# 標準入力から Stop イベントの情報 (JSON) を受け取るが、今回は特段使わないので無視または読み飛ばす

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CONFIG_FILE="${PROJECT_ROOT}/project-config.json"

# エラー出力と結果を格納する変数
ERROR_LOG=""
FAILED_COMMANDS=()

# 検証したいコマンドのキー一覧 (存在するものを順次実行)
KEYS=("lint" "typecheck" "test" "check_architecture" "quality_check")

if [ -f "$CONFIG_FILE" ]; then
  for KEY in "${KEYS[@]}"; do
    # jq で commands.<KEY> を取得
    CMD=$(jq -r ".commands.${KEY}" "$CONFIG_FILE" 2>/dev/null)
    if [ "$CMD" != "null" ] && [ -n "$CMD" ]; then
      echo "Running validation command [${KEY}]: ${CMD}" >&2
      
      # コマンドを実行し、出力を一時ファイルに記録
      TMP_ERR=$(mktemp)
      eval "$CMD" >"$TMP_ERR" 2>&1
      EXIT_CODE=$?
      
      if [ $EXIT_CODE -ne 0 ]; then
        FAILED_COMMANDS+=("$KEY ($CMD)")
        ERROR_LOG="${ERROR_LOG}\n--- Validation Failure [${KEY}] ---\n$(cat "$TMP_ERR")\n"
      fi
      rm -f "$TMP_ERR"
    fi
  done
else
  # 設定ファイルがない場合はデフォルトの Makefile コマンドを実行してみる
  if [ -f "${PROJECT_ROOT}/Makefile" ]; then
    TMP_ERR=$(mktemp)
    make q.check >"$TMP_ERR" 2>&1
    if [ $? -ne 0 ]; then
      FAILED_COMMANDS+=("make q.check")
      ERROR_LOG="${ERROR_LOG}\n--- Validation Failure [make q.check] ---\n$(cat "$TMP_ERR")\n"
    fi
    rm -f "$TMP_ERR"
  fi
fi

# 結果の判定
if [ ${#FAILED_COMMANDS[@]} -ne 0 ]; then
  # 失敗した場合：エージェントに差し戻す JSON を出力する
  # エラーメッセージの構築
  MSG="【自動検証エラー】品質ゲートの検証に失敗しました。以下のコマンドの失敗を修正してください。\n"
  for CMD in "${FAILED_COMMANDS[@]}"; do
    MSG="${MSG}- ${CMD}\n"
  done
  MSG="${MSG}\nエラーログ:\n${ERROR_LOG}"
  
  # JSONを標準出力に出力 (Codex, Antigravity, Claude Code すべてをカバーするための複合JSON)
  jq -n \
    --arg msg "$MSG" \
    '{
       "continue": false,
       "decision": "block",
       "stopReason": "Validation failed",
       "reason": $msg
     }'
  exit 0 # フックプロセス自体は正常終了して JSON を受け渡す
else
  # すべて成功した場合 (decision は "approve"/"block" のみ有効なため成功時は省略する)
  jq -n '{ "continue": true }'
  exit 0
fi
