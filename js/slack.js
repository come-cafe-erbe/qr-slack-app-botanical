// slack.js - Slackメッセージ送信機能（最終修正版）

/**
 * QRコードデータとトレイ画像をSlackに送信する関数
 * 画像付きで送信（プロキシ経由）
 */
async function sendQRDataToSlackBotWithImage(qrData, imageData, botToken, channelId, proxyUrl) {
    try {
        if (!botToken || !channelId) {
            throw new Error("Bot TokenとチャンネルIDが設定されていません");
        }
        
        if (!qrData) {
            throw new Error("QRコードデータがありません");
        }
        
        if (!imageData) {
            throw new Error("トレイ画像がありません");
        }
        
        // プロキシURLが設定されている場合は新APIを使用して画像をアップロード
        if (proxyUrl) {
            const result = await uploadImageToSlackNewAPIViaProxy(imageData, qrData, botToken, channelId, proxyUrl);
            
            if (result.ok) {
                showStatus(document.getElementById('status'), 'QRコードデータとトレイ画像をSlackに送信しました', 'success');
                return result;
            } else {
                throw new Error(`Slackへの送信に失敗しました: ${result.error}`);
            }
        } else {
            throw new Error("プロキシURLが設定されていません。画像付き送信にはプロキシが必要です。");
        }
    } catch (error) {
        console.error("Slackへの送信に失敗しました:", error);
        showStatus(document.getElementById('status'), `送信に失敗しました。${error.message}`, 'error');
        throw error;
    }
}

/**
 * QRコードデータをテキストのみでSlackに送信する関数
 * テキストのみの送信（プロキシなしでも動作）
 */
async function sendQRDataToSlackBotTextOnly(qrData, botToken, channelId, proxyUrl) {
    try {
        if (!botToken || !channelId) {
            throw new Error("Bot TokenとチャンネルIDが設定されていません");
        }
        
        if (!qrData) {
            throw new Error("QRコードデータがありません");
        }
        
        // メッセージテキストを作成
        const text = `QRコード情報:\n注文ID: ${qrData.orderId}\nトークン: ${qrData.token}`;
        
        // APIエンドポイント
        let apiUrl = 'https://slack.com/api/chat.postMessage';
        
        // プロキシURLが設定されている場合はプロキシを使用
        if (proxyUrl) {
            apiUrl = `${proxyUrl}chat.postMessage`;
        }
        
        // リクエストデータ
        const formData = new FormData();
        formData.append('token', botToken);
        formData.append('channel', channelId);
        formData.append('text', text);
        
        // APIリクエスト
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.ok) {
            showStatus(document.getElementById('status'), 'QRコードデータをSlackに送信しました', 'success');
            return result;
        } else {
            throw new Error(`Slackへの送信に失敗しました: ${result.error}`);
        }
    } catch (error) {
        console.error("テキストメッセージの送信に失敗しました:", error);
        showStatus(document.getElementById('status'), `送信に失敗しました。${error.message}`, 'error');
        throw error;
    }
}

// 状態メッセージを表示（app.jsと共通の関数）
function showStatus(element, message, type) {
    if (!element) return;
    
    element.textContent = message;
    element.className = 'status-message';
    element.classList.add(type);
    element.style.display = 'block';
}
