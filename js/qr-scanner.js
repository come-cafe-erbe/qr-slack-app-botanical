// qr-scanner.js - QRコード読み取り機能（最終修正版）

// QRコードスキャナーの参照
let html5QrScanner = null;

// QRコードスキャナーの初期化
function initQRScanner(onScanCallback) {
    try {
        console.log("QRスキャナー初期化開始");
        
        // QRリーダー要素を検出
        const qrReaderElement = document.getElementById('qr-reader');
        
        if (!qrReaderElement) {
            console.error("QRリーダー要素が見つかりません");
            return;
        }
        
        console.log("QRリーダー要素を検出しました:", qrReaderElement);
        
        // 既存のスキャナーがあれば停止
        if (html5QrScanner) {
            html5QrScanner.stop();
            html5QrScanner.clear();
            html5QrScanner = null;
        }
        
        // スキャナーの設定
        const config = {
            fps: CONFIG.QR_SCANNER.fps || 10,
            qrbox: CONFIG.QR_SCANNER.qrbox || 250,
            aspectRatio: CONFIG.QR_SCANNER.aspectRatio || 1.0
        };
        
        // スキャナーの作成
        html5QrScanner = new Html5Qrcode("qr-reader");
        
        console.log("QRスキャン開始処理");
        
        // カメラの起動とスキャン開始
        html5QrScanner.start(
            { facingMode: "environment" },
            config,
            onQRCodeScan,
            onQRCodeError
        ).then(() => {
            console.log("QRコードスキャナーが起動しました");
        }).catch(err => {
            console.error("QRスキャナーの起動に失敗しました:", err);
            showStatus(document.getElementById('status'), 'QRスキャナーの起動に失敗しました。ブラウザの設定でカメラへのアクセスを許可してください。', 'error');
        });
        
        // QRコードスキャン成功時の処理
        function onQRCodeScan(decodedText, decodedResult) {
            try {
                console.log("QRコードを読み取りました:", decodedText);
                
                // QRコードの内容をJSONとしてパース
                const qrData = JSON.parse(decodedText);
                
                // 結果表示
                const qrResult = document.getElementById('qr-result');
                if (qrResult) {
                    qrResult.textContent = `注文ID: ${qrData.orderId}, トークン: ${qrData.token}`;
                    qrResult.classList.add('success');
                    
                    // データを属性として保存（後で使用するため）
                    qrResult.dataset.qrData = decodedText;
                }
                
                // コールバック関数を呼び出し
                if (typeof onScanCallback === 'function') {
                    onScanCallback(qrData);
                }
                
                // スキャナーを一時停止（連続スキャン防止）
                html5QrScanner.pause();
                
                // ステータス表示
                showStatus(document.getElementById('status'), 'QRコードを読み取りました。トレイを撮影してください。', 'success');
            } catch (error) {
                console.error("QRコードの解析に失敗しました:", error);
                showStatus(document.getElementById('status'), 'QRコードの解析に失敗しました。有効なQRコードを読み取ってください。', 'error');
            }
        }
        
        // QRコードスキャンエラー時の処理
        function onQRCodeError(errorMessage) {
            // スキャン中のエラーは頻繁に発生するため、コンソールログは出力しない
        }
    } catch (error) {
        console.error("QRスキャナー初期化エラー:", error);
        showStatus(document.getElementById('status'), 'QRスキャナーの初期化に失敗しました。', 'error');
    }
}

// QRコードスキャナーの再開
function resumeQRScanner() {
    if (html5QrScanner) {
        html5QrScanner.resume();
        console.log("QRコードスキャナーを再開しました");
    }
}

// QRコードスキャナーの停止
function stopQRScanner() {
    if (html5QrScanner) {
        html5QrScanner.stop().then(() => {
            console.log("QRコードスキャナーを停止しました");
            html5QrScanner.clear();
            html5QrScanner = null;
        }).catch(err => {
            console.error("QRスキャナーの停止に失敗しました:", err);
        });
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
