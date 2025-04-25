// camera.js - カメラ制御・画像撮影機能（最終修正版）

// 最後に撮影した画像データ
let lastCapturedImage = null;

// カメラの初期化
function initCamera() {
    try {
        console.log("カメラ初期化開始");
        
        // カメラ要素を検出
        const videoElement = document.getElementById('camera');
        
        if (!videoElement) {
            console.error("カメラ要素が見つかりません");
            return;
        }
        
        console.log("カメラ要素を検出しました:", videoElement);
        
        // カメラの設定
        const constraints = {
            video: {
                width: { ideal: CONFIG.CAMERA.width || 1280 },
                height: { ideal: CONFIG.CAMERA.height || 720 },
                facingMode: "environment"
            }
        };
        
        // カメラの起動
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function(stream) {
                videoElement.srcObject = stream;
                videoElement.play();
                console.log("カメラが起動しました");
                
                // 撮影ボタンのイベントリスナー
                const captureButton = document.getElementById('captureButton');
                if (captureButton) {
                    captureButton.addEventListener('click', captureImage);
                    console.log("撮影ボタンのイベントリスナーを設定しました");
                }
            })
            .catch(function(err) {
                console.error("カメラの起動に失敗しました:", err);
                showStatus(document.getElementById('status'), 'カメラの起動に失敗しました。ブラウザの設定でカメラへのアクセスを許可してください。', 'error');
            });
    } catch (error) {
        console.error("カメラ初期化エラー:", error);
        showStatus(document.getElementById('status'), 'カメラの初期化に失敗しました。', 'error');
    }
}

// 画像の撮影
function captureImage() {
    try {
        console.log("画像撮影開始");
        
        // カメラ要素を検出
        const videoElement = document.getElementById('camera');
        
        if (!videoElement) {
            console.error("カメラ要素が見つかりません");
            return;
        }
        
        // キャンバスの作成
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // キャンバスサイズの設定
        canvas.width = CONFIG.CAMERA.width || 1280;
        canvas.height = CONFIG.CAMERA.height || 720;
        
        console.log(`キャンバスサイズ設定: ${canvas.width} x ${canvas.height}`);
        
        // ビデオフレームをキャンバスに描画
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // 画像データをBase64形式で取得
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // 画像データを保存
        lastCapturedImage = imageData;
        
        // プレビュー表示
        const previewElement = document.getElementById('preview');
        if (previewElement) {
            previewElement.src = imageData;
            previewElement.style.display = 'block';
            console.log("トレイ画像を撮影しました");
        }
        
        // 送信ボタンを有効化
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {
            sendButton.disabled = false;
        }
        
        // テキストのみ送信ボタンも有効化
        const sendTextOnlyButton = document.getElementById('sendTextOnlyButton');
        if (sendTextOnlyButton) {
            sendTextOnlyButton.disabled = false;
        }
        
        // ステータス表示
        showStatus(document.getElementById('status'), 'トレイ画像を撮影しました。「Slackに送信」ボタンをクリックしてください。', 'success');
    } catch (error) {
        console.error("画像撮影エラー:", error);
        showStatus(document.getElementById('status'), '画像の撮影に失敗しました。', 'error');
    }
}

// カメラのリセット
function resetCamera() {
    // 最後に撮影した画像データをクリア
    lastCapturedImage = null;
    
    // プレビュー表示をクリア
    const previewElement = document.getElementById('preview');
    if (previewElement) {
        previewElement.src = '';
        previewElement.style.display = 'none';
    }
    
    // 送信ボタンを無効化
    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
        sendButton.disabled = true;
    }
    
    // テキストのみ送信ボタンも無効化
    const sendTextOnlyButton = document.getElementById('sendTextOnlyButton');
    if (sendTextOnlyButton) {
        sendTextOnlyButton.disabled = true;
    }
    
    // QR結果表示をクリア
    const qrResult = document.getElementById('qr-result');
    if (qrResult) {
        qrResult.textContent = '';
        qrResult.classList.remove('success');
        delete qrResult.dataset.qrData;
    }
    
    // ステータス表示をクリア
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.style.display = 'none';
    }
}

// 最後に撮影した画像データを取得
function getLastCapturedImage() {
    return lastCapturedImage;
}

// 状態メッセージを表示（app.jsと共通の関数）
function showStatus(element, message, type) {
    if (!element) return;
    
    element.textContent = message;
    element.className = 'status-message';
    element.classList.add(type);
    element.style.display = 'block';
}
