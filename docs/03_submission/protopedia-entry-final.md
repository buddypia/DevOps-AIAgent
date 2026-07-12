# ProtoPedia 作品登録完成稿 — Agent Guild

2026-07-12 の公開環境とリポジトリに基づく転記用原稿。動画URLだけは公開後に差し替える。

## 作品ステータス

` 完成 `

## 作品タイトル

`Agent Guild — 目標から実働するDevOps AIギルド`

## 作品のURL

<https://agent-guild-nxbw7of6cq-an.a.run.app>

## 概要

目標を1つ渡すと、Geminiオーケストレーターが9体の専門エージェントから必要な編成を自律選抜。Cloud Runの実ログ、GitHub Actionsの実CI、OSV.devの脆弱性DB、配信中HTML、A2A委任を調査し、引用ゲートと独立Geminiチェッカーによる再検証を通過した所見だけを、優先度付き対応計画にまとめるDevOpsミッションコントロールです。Cloud Run上でUI・API・Agent Card・A2A JSON-RPCを公開し、実行履歴と評判をFirestoreに永続化します。

## ライセンスの設定

` 表示しない `

公開リポジトリに明示的な `LICENSE` がないため。作品の画像・文章を CC BY 4.0+ で再利用可能にする意思がある場合だけ「表示する」へ変更する。

## 画像（5枚・掲載順）

1. `protopedia-assets/01-main-visual.png` — メイン画像
2. `protopedia-assets/02-live-mission-control.png` — 本番ミッションの目標達成レポート
3. `protopedia-assets/03-live-evidence-dashboard.png` — 実行履歴から集計した実測値
4. `protopedia-assets/04-live-agent-roster.png` — 9体の専門エージェント一覧
5. `protopedia-assets/05-system-architecture.png` — システム構成図

すべて 880×495px / PNG。システム構成欄には5枚目を再利用する。

## 動画

`<YouTubeまたはVimeoに公開したデモ動画URL>`

## システム構成

### アップロード画像

`protopedia-assets/05-system-architecture.png`

### 説明文

1. ユーザーはCloud Run上のReact UIに「本番サービスを総点検」などの目標を1つ入力します。外部エージェントは公開Agent CardとA2A JSON-RPCの `mission.execute` から同じミッションを起動できます。
2. Express APIがGemini 3.5 Flashオーケストレーターを呼び、9体の専門エージェントから最大4体を順序付きで選抜します。各ラン後に続行・スキップ・1体追加を判断し、1ミッション最大5ステップで停止します。
3. 各調査役がCloud Logging、GitHub ActionsとライブAPI、OSV.dev、配信中HTML、公開Agent Cardから実証拠を収集します。
4. 共通パイプラインで「証拠収集 → Gemini maker → 引用ゲート → 独立Gemini checker → 受入判定」を実行します。critical/high所見は自動変更せず、人間承認待ちにエスカレーションします。
5. 受け入れた所見だけから優先度付き統合レポートを生成し、ランと評判をFirestoreに保存。ランクや採用率、checker一致率、コスト見積りを実履歴から自動算出します。
6. GitHub Actionsでtypecheck・test・build・architecture checkを実行し、Cloud Build経由でCloud Runへデプロイします。

## 開発素材

`Google Cloud Run` / `Cloud Build` / `Vertex AI` / `Gemini API` / `Gemini 3.5 Flash` / `Cloud Logging` / `Firestore` / `A2A Protocol` / `GitHub Actions` / `OSV.dev` / `React` / `Vite` / `TypeScript` / `Express` / `Node.js` / `Zod`

## タグ

`findy_hackathon` / `AIエージェント` / `DevOps` / `Gemini` / `CloudRun`

## ストーリー

### 「AIが言った」から、「証拠で判断できる」へ

AIエージェントにDevOps調査を任せても、実際のログやCIを見たのか、もっともらしい回答を作っただけなのかが分からなければ、本番の判断には使えません。また、ログ、CI、脆弱性、UXの調査は専門性が異なり、人間が毎回適切な手順と担当を組み立てるのも負担です。

Agent Guildでユーザーが書くのは「目標」だけ。Geminiが調査計画と専門エージェントの編成を決め、各エージェントが実システムから証拠を集めます。さらに、一次分析とは別のGeminiが所見を再確認し、証拠の引用と整合した結果だけを採用します。

例えば「Cloud Runサービスの稼働リスクを総点検して」と入力すると、オーケストレーターがCloud Run SRE、セキュリティ監査役、UX設計役、テスト検証役を選抜。Cloud Logging、OSV.dev、配信中HTML、GitHub ActionsとライブAPIを横断調査し、「目標達成／部分達成／ブロック」の判定と優先度付き対応計画を返します。結果にはrunIdと根拠ログが残るため、人間が後から追跡できます。

使うのは、少人数で本番サービスを守る開発チーム、Platform/SRE、そして短期間で実装と運用の両方を証明したいハッカソンチームです。破壊的な操作はせず、高リスク所見は人間承認待ちにして、AIの速さと運用の安全性を両立しました。

ランクや「採用率」も演出用の数値ではありません。Firestoreに残る実行回数、受入所見、checker一致率、コスト見積りから自動算出し、実際に検証を通った仕事だけが評判になります。

**Wowメッセージ:** 「AIエージェントを増やす」だけではなく、誰に任せ、どの証拠を信じ、どこで人間が止めるかまでを一つの運用体験にしました。目標を1つ渡せば、AIギルドが実働します。

## スライドモード

`OFF`

## メンバー登録

`userbuddypia @buddypia`

## 関連リンク

- GitHub: <https://github.com/buddypia/DevOps-AIAgent>
- Cloud Run: <https://agent-guild-nxbw7of6cq-an.a.run.app>
- Agent Card: <https://agent-guild-nxbw7of6cq-an.a.run.app/.well-known/agent-card.json>
- 審査用スナップショット: <https://agent-guild-nxbw7of6cq-an.a.run.app/judge-snapshot>
- GitHub Actions CI: <https://github.com/buddypia/DevOps-AIAgent/actions/workflows/ci.yml>
