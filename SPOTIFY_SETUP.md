# Spotify連携セットアップガイド

## 1. Spotify Developer Appを作成

1. https://developer.spotify.com/dashboard にアクセス
2. Spotifyアカウントでログイン
3. **Create app** をクリック
4. 以下の情報を入力:
   - **App name**: `Kiroku Lot8`（任意）
   - **App description**: `Study timer with Spotify integration`
   - **Redirect URI**: `https://kiroku-lot8.vercel.app/spotify-callback.html`
   - **API/SDKs**: `Web API` にチェック
5. **Save** をクリック

## 2. Client IDとClient Secretを取得

1. 作成したアプリをクリック
2. **Settings** をクリック
3. **Client ID** をコピー
4. **View client secret** をクリックして **Client Secret** をコピー

## 3. Vercelに環境変数を設定

1. https://vercel.com にアクセス
2. プロジェクト `kiroku-lot8` を開く
3. **Settings** → **Environment Variables** をクリック
4. 以下の3つの環境変数を追加:

| Name | Value |
|------|-------|
| `SPOTIFY_CLIENT_ID` | コピーしたClient ID |
| `SPOTIFY_CLIENT_SECRET` | コピーしたClient Secret |
| `SPOTIFY_REDIRECT_URI` | `https://kiroku-lot8.vercel.app/spotify-callback.html` |

5. **Save** をクリック

## 4. 再デプロイ

環境変数を設定したら、Vercelで再デプロイが必要です:

1. Vercelダッシュボードの **Deployments** タブ
2. 最新のデプロイメントの **...** メニュー
3. **Redeploy** をクリック

または、GitHubにプッシュすると自動的に再デプロイされます。

## 5. 使い方

1. サイトにアクセス: https://kiroku-lot8.vercel.app
2. 右上の緑色の **Spotify** ボタンをクリック
3. モード選択:
   - **OK** = 本物のSpotify連携（Spotifyアカウントが必要）
   - **キャンセル** = デモモード（すぐ試せる）
4. 本物のモードを選択した場合、Spotifyの認証画面が開きます
5. **同意する** をクリック
6. サイトに戻ると、Spotifyプレイヤーが表示されます

## トラブルシューティング

### 「認証に失敗しました」と表示される

- Redirect URIが正確に設定されているか確認
- 環境変数が正しく設定されているか確認
- Vercelで再デプロイしたか確認

### 「トークンの取得に失敗しました」と表示される

- Client SecretがVercelに設定されているか確認
- Spotify Developer Dashboardでアプリが有効か確認

### 音楽が再生されない

- Spotifyアプリ（デスクトップまたはモバイル）で音楽を再生してから試す
- Spotify Premiumアカウントが必要です（無料アカウントでは一部機能が制限されます）

## デモモード

環境変数を設定しなくても、デモモードで動作確認ができます:

1. Spotifyボタンをクリック
2. **キャンセル** を選択
3. デモデータでUIを確認できます
