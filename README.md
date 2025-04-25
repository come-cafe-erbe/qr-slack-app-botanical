# QRコード読み取り & Slack連携アプリケーション（最終修正版）

このアプリケーションは、QRコードを読み取り、トレイ画像と共にSlackに送信するためのウェブアプリケーションです。

## 主な機能

- QRコードの読み取り
- カメラでトレイ画像を撮影
- 画像付きでSlackに送信（Cloudflare Workersプロキシ経由）
- テキストのみでSlackに送信（プロキシなしでも動作）

## 修正内容

- Slack APIの最新仕様に対応（`files.getUploadURLExternal` + `files.completeUploadExternal`）
- `files.completeUploadExternal` APIの呼び出し時に必要な `files` パラメータを正しく設定
- Cloudflare Workersプロキシを使用したCORS問題の解決
- カメラ機能の安定化

## 使用方法

1. GitHubリポジトリにファイルをアップロードします
2. GitHub Pagesを有効化して公開します
3. Cloudflare Workersを使用してプロキシを設定します
4. アプリケーションにアクセスし、以下の設定を行います：
   - Bot Token：Slack APIから取得したBot User OAuth Token
   - チャンネルID：送信先のSlackチャンネルID
   - プロキシURL：Cloudflare Workersのエンドポイント（例：`https://your-proxy.workers.dev/proxy/`）

## 重要なポイント

- Bot Tokenには必要な権限（`chat:write`、`files:write`、`channels:read`）が必要です
- Botをチャンネルに招待（`/invite @ボット名`）することを忘れないでください
- 画像付き送信を使用するには、Cloudflare Workersの設定が必要です
- テキストのみ送信は、プロキシ設定なしでも動作します

## 詳細なドキュメント

- `setup-guide.md` - セットアップガイド（初めてのユーザー向け）
- `cloudflare-workers-guide.md` - Cloudflare Workersの設定方法
- `implementation-guide.md` - 技術的な詳細と使用方法
