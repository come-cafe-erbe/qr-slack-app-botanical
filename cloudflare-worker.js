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
