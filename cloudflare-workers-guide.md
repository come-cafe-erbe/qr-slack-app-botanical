# Cloudflare Workersの設定手順

このガイドでは、QRコード読み取り & Slack連携アプリケーションで使用するCloudflare Workersの設定方法を説明します。

## 1. Cloudflareアカウントの作成・ログイン

1. [Cloudflare公式サイト](https://dash.cloudflare.com/sign-up)にアクセスします
2. メールアドレスとパスワードを入力して新規アカウントを作成するか、既存のアカウントでログインします
3. 画面の指示に従って初期設定を完了します

## 2. Workersの作成

1. Cloudflareダッシュボードにログインした状態で、左側のメニューから「**Workers & Pages**」を選択します
2. 「**Create application**」ボタンをクリックします
3. 「**Create Worker**」を選択します
4. Worker名を入力します（例：`slack-proxy`）
   - 名前は英数字とハイフンのみ使用可能です
   - この名前がURLの一部になります（例：`slack-proxy.your-username.workers.dev`）
5. 「**Deploy**」ボタンをクリックします

## 3. プロキシコードの実装

1. Workerが作成されたら、「**Edit code**」ボタンをクリックします
2. エディタに表示されるデフォルトのコードをすべて削除します
3. 以下のコードをコピー＆ペーストします：

```javascript
// Cloudflare Workers スクリプト - 修正版
// Slack API プロキシ with CORS サポート

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // CORSヘッダーを設定
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };

  // OPTIONSリクエスト（プリフライト）の処理
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Slack API プロキシ
    if (path.startsWith('/proxy/')) {
      // /proxy/ を削除して、残りのパスをSlack APIエンドポイントとして使用
      const apiPath = path.replace('/proxy/', '');
      const slackApiUrl = `https://slack.com/api/${apiPath}`;
      
      // リクエストをコピーして新しいURLに転送
      const modifiedRequest = new Request(slackApiUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'follow'
      });
      
      // Slack APIにリクエストを転送
      const response = await fetch(modifiedRequest);
      const responseData = await response.json();
      
      // レスポンスにCORSヘッダーを追加
      return new Response(JSON.stringify(responseData), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // ファイルアップロードプロキシ
    else if (path.startsWith('/upload/')) {
      // /upload/ を削除して、残りのパスをSlackファイルアップロードエンドポイントとして使用
      const uploadPath = path.replace('/upload/', '');
      const slackUploadUrl = `https://files.slack.com/${uploadPath}`;
      
      // リクエストをコピーして新しいURLに転送
      const modifiedRequest = new Request(slackUploadUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'follow'
      });
      
      // Slackファイルアップロードサーバーにリクエストを転送
      const response = await fetch(modifiedRequest);
      
      // レスポンスの種類に応じて処理を分岐
      const contentType = response.headers.get('Content-Type') || '';
      
      if (contentType.includes('application/json')) {
        // JSONレスポンスの場合
        const responseData = await response.json();
        return new Response(JSON.stringify(responseData), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // その他のレスポンスの場合（バイナリデータなど）
        const responseData = await response.arrayBuffer();
        return new Response(responseData, {
          headers: {
            ...corsHeaders,
            'Content-Type': contentType
          },
          status: response.status,
          statusText: response.statusText
        });
      }
    }
    
    // ルートパスへのアクセス
    else if (path === '/' || path === '') {
      return new Response('Slack API Proxy is running. Use /proxy/api-endpoint to access Slack API or /upload/ for file uploads.', {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain'
        }
      });
    }
    
    // その他のパスは404を返す
    else {
      return new Response('Not Found', {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain'
        }
      });
    }
  } catch (error) {
    // エラーハンドリング
    return new Response(`Proxy Error: ${error.message}`, {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain'
      }
    });
  }
}
```

4. 「**Save and deploy**」ボタンをクリックします

## 4. デプロイの確認

1. デプロイが完了すると、「Your Worker was deployed successfully!」というメッセージが表示されます
2. 「**Visit**」ボタンをクリックして、Workerが正常に動作しているか確認します
3. 「Slack API Proxy is running. Use /proxy/api-endpoint to access Slack API or /upload/ for file uploads.」というメッセージが表示されれば成功です

## 5. プロキシURLの取得

1. ブラウザのアドレスバーに表示されているURLをコピーします
   - 例：`https://slack-proxy.your-username.workers.dev`
2. このURLに `/proxy/` を追加したものがプロキシURLになります
   - 例：`https://slack-proxy.your-username.workers.dev/proxy/`
3. このプロキシURLをQRコードアプリケーションの設定画面で使用します

## 6. アプリケーションでの設定

1. QRコードアプリケーションにアクセスします
2. 右上の「設定」ボタンをクリックします
3. 「プロキシURL」欄に、上記で取得したプロキシURL（末尾のスラッシュを含む）を入力します
4. 「保存」ボタンをクリックします

## 重要な注意点

- プロキシURLの末尾には必ず `/proxy/` を含めてください
- Cloudflare Workersの無料プランでは、1日あたりの実行回数に制限があります
- 本番環境での使用には、有料プランへのアップグレードを検討してください
