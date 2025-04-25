# QRコード読み取り & Slack連携アプリケーション 実装ガイド

このガイドでは、QRコード読み取り & Slack連携アプリケーションの技術的な詳細と実装方法について説明します。

## アプリケーション構成

アプリケーションは以下のコンポーネントで構成されています：

1. **フロントエンドアプリケーション**：
   - HTML/CSS/JavaScriptで実装されたウェブアプリケーション
   - QRコードの読み取り、カメラ制御、Slack連携機能を提供

2. **Cloudflare Workersプロキシ**：
   - CORS制限を回避するためのプロキシサーバー
   - Slack APIとファイルアップロードサーバーへのリクエストを中継

## 技術的な詳細

### Slack API連携

このアプリケーションは、Slackの最新APIを使用して画像付きメッセージを送信します：

1. **`files.getUploadURLExternal`**：
   - ファイルアップロード用のURLを取得
   - パラメータ：`filename`、`length`（ファイルサイズ）

2. **`files.completeUploadExternal`**：
   - アップロードを完了し、チャンネルに共有
   - パラメータ：`files`（JSONとして文字列化された配列）、`channel_id`、`initial_comment`

3. **`chat.postMessage`**：
   - テキストメッセージを送信（テキストのみ送信機能で使用）
   - パラメータ：`channel`、`text`

### CORS問題の解決

Slack APIとの通信時にCORS制限が発生するため、Cloudflare Workersを使用してプロキシを実装しています：

1. **`/proxy/`エンドポイント**：
   - Slack API（`api.slack.com`）へのリクエストを中継
   - 例：`https://your-proxy.workers.dev/proxy/chat.postMessage`

2. **`/upload/`エンドポイント**：
   - ファイルアップロードサーバー（`files.slack.com`）へのリクエストを中継
   - 例：`https://your-proxy.workers.dev/upload/upload/v1/...`

## 実装の重要なポイント

### 1. `files.completeUploadExternal` APIの正しい使用方法

Slack APIの `files.completeUploadExternal` を呼び出す際は、以下のように `files` パラメータを正しく設定する必要があります：

```javascript
// Slack APIが要求する形式でfilesパラメータを設定
const filesParam = JSON.stringify([{
    id: fileId,
    title: title
}]);

const formData = new FormData();
formData.append('token', botToken);
formData.append('files', filesParam);  // 重要: filesパラメータをJSON文字列として追加
formData.append('channel_id', channelId);
formData.append('initial_comment', initialComment);
```

### 2. アップロードURLの変換

Slackから取得したアップロードURLをプロキシ経由のURLに変換する必要があります：

```javascript
// アップロードURLをプロキシURLに変換
// https://files.slack.com/upload/v1/... → https://your-proxy.workers.dev/upload/upload/v1/...
const proxyUploadUrl = uploadUrl.replace('https://files.slack.com/', `${proxyUrl.replace('/proxy/', '/upload/')}`);
```

### 3. FormDataの使用

Slack APIとの通信には `FormData` を使用し、適切なパラメータを設定します：

```javascript
const formData = new FormData();
formData.append('token', botToken);
formData.append('channel', channelId);
formData.append('text', text);

const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData
});
```

## トラブルシューティング

### 1. 「invalid arguments」エラー

このエラーは、`files.completeUploadExternal` APIに渡すパラメータが不正な場合に発生します。以下を確認してください：

- `files` パラメータが正しくJSON文字列化されているか
- `files` 配列の各要素に `id` と `title` が含まれているか

### 2. CORS制限エラー

CORS制限エラーが発生する場合は、以下を確認してください：

- プロキシURLが正しく設定されているか
- Cloudflare Workersのコードが正しくデプロイされているか
- プロキシURLの末尾に `/proxy/` が含まれているか

### 3. カメラ関連のエラー

カメラ機能に問題がある場合は、以下を確認してください：

- ブラウザがカメラへのアクセスを許可しているか
- モバイルデバイスの場合、HTTPS接続を使用しているか

## セキュリティ上の注意点

- Bot Tokenは機密情報です。公開リポジトリにコミットしないでください
- ローカルストレージに保存される設定は暗号化されていません
- 本番環境では、適切なセキュリティ対策を実施してください
