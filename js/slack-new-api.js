// slack-new-api.js - Slack API連携（最終修正版）

/**
 * Slack APIを使用して画像をアップロードする関数
 * 新しいSlack API（files.getUploadURLExternal + files.completeUploadExternal）を使用
 * プロキシを経由して画像をアップロード
 */
async function uploadImageToSlackNewAPIViaProxy(imageData, qrData, botToken, channelId, proxyUrl) {
    try {
        console.log("プロキシ経由で新APIを使用してSlackに画像をアップロード中...");
        
        if (!proxyUrl) {
            throw new Error("プロキシURLが設定されていません");
        }
        
        if (!proxyUrl.endsWith('/')) {
            proxyUrl += '/';
        }
        
        // Base64画像データをBlobに変換
        const imageBlob = await base64ToBlob(imageData);
        
        // ファイル情報
        const filename = "tray_image.jpg";
        const filesize = imageBlob.size;
        console.log(`ファイル情報: 名前=${filename}, サイズ=${filesize}バイト`);
        
        // Step 1: アップロードURLを取得
        const uploadUrlResponse = await getUploadUrl(botToken, filename, filesize, proxyUrl);
        console.log("アップロードURL取得結果:", uploadUrlResponse);
        
        if (!uploadUrlResponse.ok) {
            throw new Error(`アップロードURLの取得に失敗しました: ${uploadUrlResponse.error}`);
        }
        
        // Step 2: 取得したURLに画像をアップロード
        const uploadUrl = uploadUrlResponse.upload_url;
        const fileId = uploadUrlResponse.file_id;
        
        // アップロードURLをプロキシURLに変換
        // https://files.slack.com/upload/v1/... → https://your-proxy.workers.dev/upload/upload/v1/...
        const proxyUploadUrl = uploadUrl.replace('https://files.slack.com/', `${proxyUrl.replace('/proxy/', '/upload/')}`);
        
        await uploadFileToUrl(imageBlob, proxyUploadUrl);
        
        // Step 3: アップロードを完了
        const completeResponse = await completeUpload(botToken, fileId, channelId, qrData, proxyUrl);
        
        return completeResponse;
    } catch (error) {
        console.error("画像のアップロードに失敗しました:", error);
        throw error;
    }
}

/**
 * Slack APIからアップロードURLを取得
 */
async function getUploadUrl(botToken, filename, filesize, proxyUrl) {
    const apiUrl = `${proxyUrl}files.getUploadURLExternal`;
    
    const formData = new FormData();
    formData.append('token', botToken);
    formData.append('filename', filename);
    formData.append('length', filesize.toString());
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
    });
    
    return await response.json();
}

/**
 * 指定されたURLに画像をアップロード
 */
async function uploadFileToUrl(blob, uploadUrl) {
    const response = await fetch(uploadUrl, {
        method: 'POST',
        body: blob,
        headers: {
            'Content-Type': 'image/jpeg'
        }
    });
    
    if (!response.ok) {
        throw new Error(`ファイルのアップロードに失敗しました: ${response.status} ${response.statusText}`);
    }
    
    return response;
}

/**
 * アップロードを完了し、チャンネルに共有
 */
async function completeUpload(botToken, fileId, channelId, qrData, proxyUrl) {
    const apiUrl = `${proxyUrl}files.completeUploadExternal`;
    
    // QRコードデータをタイトルとして使用
    const title = `注文ID: ${qrData.orderId}, トークン: ${qrData.token}`;
    
    // 初期コメントを設定
    const initialComment = `QRコード情報:\n注文ID: ${qrData.orderId}\nトークン: ${qrData.token}`;
    
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
    
    console.log("completeUploadExternal パラメータ:", {
        files: filesParam,
        channel_id: channelId,
        initial_comment: initialComment
    });
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    console.log("completeUploadExternal 結果:", result);
    
    return result;
}

/**
 * Base64画像データをBlobに変換
 */
async function base64ToBlob(base64Data) {
    // Base64データのヘッダー部分を削除
    const base64Content = base64Data.split(',')[1];
    const byteCharacters = atob(base64Content);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: 'image/jpeg' });
}
