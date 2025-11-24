# デプロイガイド

## Vercelへのデプロイ手順

### 前提条件
- GitHubアカウント
- Vercelアカウント（無料）

### 手順

#### 1. GitHubにプッシュ

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 2. Vercelでインポート

1. [Vercel](https://vercel.com)にアクセス
2. GitHubでログイン
3. "Add New..." → "Project"をクリック
4. リポジトリを選択
5. "Import"をクリック

#### 3. プロジェクト設定

- **Framework Preset**: Other
- **Build Command**: (空欄のまま)
- **Output Directory**: (空欄のまま)
- **Install Command**: (空欄のまま)

"Deploy"をクリック

#### 4. デプロイ完了

数分でデプロイが完了し、URLが発行されます。
例: `https://your-app.vercel.app`

### Vercel CLIを使う方法

```bash
# CLIインストール
npm install -g vercel

# ログイン
vercel login

# デプロイ（プレビュー）
vercel

# 本番デプロイ
vercel --prod
```

## デプロイ後の設定

### Spotify連携

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)にアクセス
2. "Create an App"をクリック
3. アプリ名と説明を入力
4. "Edit Settings"をクリック
5. Redirect URIsに以下を追加:
   ```
   https://your-app.vercel.app/spotify-callback.html
   ```
6. Client IDをコピー
7. アプリでSpotifyボタンをクリックし、Client IDを入力

### カスタムドメイン（オプション）

1. Vercelダッシュボードでプロジェクトを開く
2. "Settings" → "Domains"
3. カスタムドメインを追加
4. DNSレコードを設定

## トラブルシューティング

### デプロイが失敗する

- `vercel.json`が正しく配置されているか確認
- GitHubリポジトリが公開されているか確認

### Spotifyログインができない

- Redirect URIが正しく設定されているか確認
- HTTPSを使用しているか確認（Vercelは自動的にHTTPS）

### データが保存されない

- ブラウザのlocalStorageが有効か確認
- プライベートブラウジングモードでないか確認

## 環境変数（必要に応じて）

Vercelダッシュボードで環境変数を設定できます:

1. プロジェクト → "Settings" → "Environment Variables"
2. 必要な変数を追加

現在のアプリでは環境変数は不要ですが、将来的にAPIキーなどを追加する場合に使用できます。

## 更新のデプロイ

GitHubにプッシュすると自動的に再デプロイされます:

```bash
git add .
git commit -m "Update features"
git push origin main
```

Vercelが自動的に検知して再デプロイします。

## ロールバック

1. Vercelダッシュボードでプロジェクトを開く
2. "Deployments"タブ
3. 以前のデプロイメントの"..."メニュー
4. "Promote to Production"をクリック
