# インフレ構成・移行仕様

本プロジェクトで利用する Google Cloud (GCP) インフラの構成、移行アカウント情報、およびセキュリティに関するガイドラインです。

## 1. 移行先プロジェクト情報
本プロジェクトは、以下のプロジェクトIDおよびアカウントでのみ利用し、動作させます。

* **Google Cloud アカウント**: `<YOUR_GCP_ACCOUNT_EMAIL>` (GCPにログインするGoogleアカウント)
* **プロジェクト名**: `Hackathon`
* **プロジェクトID**: `sixth-oath-502008-u3`
* **プロジェクト番号**: `232938133905`
* **デプロイリージョン**: `asia-northeast1` (東京)

---

## 2. インフラ構成要素

### A. Cloud Run
* **役割**: アプリケーション（フロントエンド+バックエンド統合Expressサーバー）の実行環境。
* **サービス名**: `a2a-agent-marketplace`
* **設定パラメータ (cloudbuild.yaml)**:
  * メモリ: `512Mi` / CPU: `1`
  * コストガード設定: 最小インスタンス数 `0` (オートスケールダウン)、最大インスタンス数 `2`

### B. Cloud Firestore (Native モード)
* **役割**: データストアの永続層（`agent_runs` コレクション、`agent_hires` コレクション）。
* **接続方法**: SDKは使用せず、ADC（Application Default Credentials）トークンを用いた **Firestore REST API**（`https://firestore.googleapis.com/v1/...`）によるダイレクト接続を行います。これにより依存ライブラリを最小化しています。
* **データベースID**: `(default)`

### C. Artifact Registry
* **役割**: Cloud Run で動かす Docker コンテナイメージ of 保存先。
* **リポジトリ名**: `cloud-run-source-deploy`

### D. Cloud Build
* **役割**: ビルドおよび Cloud Run への自動デプロイメントパイプライン。
* **ビルド構成**: `cloudbuild.yaml` に従い、Dockerビルド、レジストリへのプッシュ、Cloud Runへのデプロイを実行します。

### E. Vertex AI / Gemini API
* **役割**: エージェント判定、SLA生成、SWOT分析、デモシナリオの自律生成。
* **モデル**: `gemini-3.5-flash`

---

## 3. セットアップ・デプロイ手順

### ステップ 1: アカウントとプロジェクトの固定
お手元のターミナルで、他のプロジェクトやアカウントが混入しないよう設定を固定します。
```bash
# アカウントの切り替えと認証
gcloud auth login <YOUR_GCP_ACCOUNT_EMAIL>

# アプリケーションデフォルト認証（ADC）のログイン
# ※ローカル環境でFirestoreやGeminiを使用するために必要です
gcloud auth application-default login --scopes="https://www.googleapis.com/auth/datastore,https://www.googleapis.com/auth/cloud-platform"

# 対象プロジェクトを固定
gcloud config set project sixth-oath-502008-u3
```

### ステップ 2: 必要な Google API の有効化
移行先のプロジェクトで必要なAPIが有効化されていることを確認（または有効化）します。
```bash
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com
```

### ステップ 3: サービスアカウントの作成と権限設定
Cloud Run は、セキュリティ向上のため最小権限のカスタムサービスアカウント `agent-market-runtime` で実行されます。

1. **サービスアカウントの作成**:
   ```bash
   gcloud iam service-accounts create agent-market-runtime \
       --description="Runtime service account for Agent Marketplace" \
       --display-name="agent-market-runtime"
   ```
2. **必要な権限（IAMロール）の付与**:
   Firestore（Datastore）と Vertex AI の実行権限を付与します。
   ```bash
   # Firestoreの利用権限
   gcloud projects add-iam-policy-binding sixth-oath-502008-u3 \
       --member="serviceAccount:agent-market-runtime@sixth-oath-502008-u3.iam.gserviceaccount.com" \
       --role="roles/datastore.user"

   # Vertex AI (Gemini) の利用権限
   gcloud projects add-iam-policy-binding sixth-oath-502008-u3 \
       --member="serviceAccount:agent-market-runtime@sixth-oath-502008-u3.iam.gserviceaccount.com" \
       --role="roles/aiplatform.user"

   # Cloud Loggingの参照権限 (SRE/oracleなどのオブザーバビリティエージェントに必須)
   gcloud projects add-iam-policy-binding sixth-oath-502008-u3 \
       --member="serviceAccount:agent-market-runtime@sixth-oath-502008-u3.iam.gserviceaccount.com" \
       --role="roles/logging.viewer"
   ```

### ステップ 4: Artifact Registry リポジトリの作成
```bash
gcloud artifacts repositories create cloud-run-source-deploy \
    --repository-format=docker \
    --location=asia-northeast1 \
    --description="Docker repository for Cloud Run source deploys"
```

### ステップ 5: ビルド＆デプロイの実行
```bash
gcloud builds submit --config=cloudbuild.yaml
```

---

## 4. セキュリティと情報公開に関するガイドライン

### 公開されても問題ない情報か？
**結論として、この `docs/infra.md` に記載されている内容は公開されてもセキュリティ上のリスクはありません。**

* **公開して良い情報**:
  * **プロジェクトID (`sixth-oath-502008-u3`) / プロジェクト番号 (`232938133905`)**
    * これらはリソースの識別子に過ぎず、悪意のあるアクセスを直接許可するものではありません。
  * **構成図、使用サービス名、サービスアカウント名**
    * システム構成としての説明であり、公開リポジトリで解説されても全く問題ありません。
  * **Cloud Run の公開デプロイURL**
    * ハッカソンの審査員や一般ユーザーがアクセスする前提のURLです。

* **絶対に公開してはいけない情報 (コミット禁止)**:
  * **サービスアカウントの秘密鍵 (JSONキーファイル)**
    * ※本プロジェクトでは認証にローカルADC（Application Default Credentials）やCloud Runの割り当てIAMロールを利用するため、**JSON秘密鍵ファイルを作成・保持する必要はありません。**
  * **個人用のAPIキー、認証情報、`.env` 内のローカルシークレット**
    * リポジトリには `.env.example` のみを配置し、実シークレットが書き込まれた `.env` は `.gitignore` で除外されています。
