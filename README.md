# kiroku-lot

シンプルな「テスト点数記録表」アプリ（HTML/CSS/JavaScript）です。

機能
- 複数のテスト種類を作成・選択
- 教科の追加・編集・削除
- 合計点・平均点の自動計算
- 「前回として保存」機能で前回の点数を保持し、差分を表示
- JSON エクスポート/インポート（バックアップ用）
- データはブラウザのローカルストレージに保存されます

確認方法（ローカル）

```bash
cd /workspaces/kiroku-lot
python3 -m http.server 8000
# ブラウザで http://127.0.0.1:8000 を開く
```

注意
- データはブラウザのローカルストレージに保存されます。別のブラウザや端末へ移す場合は JSON エクスポートでバックアップしてください。

拡張: Google アカウントでの同期(よくわからなくなったため使用不可)
--------------------------------
このリポジトリには Google アカウントによる同期の雛形を追加しています（Firebase を利用）。有効にする手順:

1. Firebase コンソールで新しいプロジェクトを作成
2. Authentication -> Sign-in method で Google を有効化
3. Firestore を有効化
4. プロジェクトの設定 -> SDK の設定から構成オブジェクトを取得
5. `firebase-config.sample.js` をコピーして `firebase-config.js` にリネームし、値を貼り付ける
6. ブラウザでページを開くとヘッダーに「Google でサインイン」ボタンが表示されるようになります

動作:
- サインインするとクラウドに保存されたデータが見つかれば上書きするかローカル→クラウドに上書きするか確認が出ます
- サインイン後は手動で「クラウドと同期」ボタンで同期できます

注意:
- 実運用では Firestore のセキュリティルールを適切に設定してください（本実装はサンプル用途のため簡易実装です）

セキュリティルールの設定
----------------------
サンプルの Firestore ルールを `firestore.rules` としてリポジトリに追加しています。内容は次の通りで、認証済ユーザのみ自分の `users/{uid}/data` ドキュメントの読み書きを許可します:

```
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		match /users/{userId}/data {
			allow read, write: if request.auth != null && request.auth.uid == userId;
		}
	}
}
```

これを Firebase コンソールに貼るか、Firebase CLI を使ってデプロイしてください（下記参照）。

CLI を使ったルールデプロイ
-------------------------
簡単なスクリプト `scripts/firebase-deploy.sh` を用意しています。使い方:

```bash
# install firebase tools if needed
npm install -g firebase-tools
# login
firebase login
# deploy rules (project id を指定)
./scripts/firebase-deploy.sh <YOUR_FIREBASE_PROJECT_ID>
```

注意: CLI の実行はユーザー側の環境で行ってください。CI での自動化も可能ですが、サービスアカウントやその他の認証設定が必要になります。

Vercelへのデプロイ
------------------
このアプリはVercelで簡単にデプロイできます。

### 方法1: Vercel CLI（推奨）

```bash
# Vercel CLIをインストール
npm install -g vercel

# ログイン
vercel login

# デプロイ（初回）
vercel

# 本番環境へデプロイ
vercel --prod
```

### 方法2: GitHub連携

1. GitHubにリポジトリをpush
2. [Vercel](https://vercel.com)にアクセス
3. "Import Project"をクリック
4. GitHubリポジトリを選択
5. 自動的にデプロイされます

### デプロイ後の設定

**Spotify連携を使用する場合:**
1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)でアプリを作成
2. Redirect URIに`https://your-app.vercel.app/spotify-callback.html`を追加
3. アプリでSpotifyボタンをクリックし、Client IDを入力

Netlify 自動デプロイ
--------------------
このリポジトリには Netlify へ自動デプロイするための GitHub Actions ワークフローを追加しています。セットアップ手順:

1. GitHub リポジトリの Secrets に以下を追加してください:
	- NETLIFY_AUTH_TOKEN: Netlify の Personal access token
	- NETLIFY_SITE_ID: 対象サイトの Site ID
2. main ブランチへ push すると自動でデプロイが走ります

ワークフロー定義: `.github/workflows/netlify-deploy.yml`

機能一覧
--------
- ✅ テスト点数記録・管理
- ✅ 暗記カード（デッキ）作成・学習・テスト
- ✅ 勉強タイマー（ストップウォッチ/タイマー）
- ✅ 教科別勉強時間記録・統計グラフ
- ✅ Spotify連携（音楽再生コントロール）
- ✅ アカウント同期（学籍番号ベース）
- ✅ 管理ダッシュボード
- ✅ osu!(lazer)風UIデザイン
- ✅ モバイル対応（iPad/iPhone）

今後の拡張案
- CSV エクスポート／印刷レイアウト
- 教科ごとの配点（重み付け）・合計満点の設定
- より高度なクラウド同期

Made with haka
