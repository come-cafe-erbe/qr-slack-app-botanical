// app.js - メインアプリケーションロジック（最終修正版）

// DOMが読み込まれたら実行
document.addEventListener('DOMContentLoaded', function() {
    // 設定の読み込み
    loadSettings();
    
    // QRコードスキャナーの初期化
    initQRScanner(onQRCodeScanned);
    
    // カメラの初期化
    initCamera();
    
    // 設定ボタンのイベントリスナー
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeButton = document.querySelector('.close');
    
    if (settingsButton && settingsModal) {
        settingsButton.addEventListener('click', function() {
            settingsModal.style.display = 'block';
        });
    }
    
    if (closeButton && settingsModal) {
        closeButton.addEventListener('click', function() {
            settingsModal.style.display = 'none';
        });
    }
    
    // 設定保存ボタンのイベントリスナー
    const saveSettingsButton = document.getElementById('saveSettings');
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', saveSettings);
    }
    
    // 送信ボタンのイベントリスナー
    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
        sendButton.addEventListener('click', sendToSlack);
    }
    
    // テキストのみ送信ボタンのイベントリスナー
    const sendTextOnlyButton = document.getElementById('sendTextOnlyButton');
    if (sendTextOnlyButton) {
        sendTextOnlyButton.addEventListener('click', sendTextOnlyToSlack);
    }
    
    // ウィンドウクリックでモーダルを閉じる
    window.addEventListener('click', function(event) {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
});

// QRコードスキャン時の処理
function onQRCodeScanned(qrData) {
    // 撮影ボタンを有効化
    const captureButton = document.getElementById('captureButton');
    if (captureButton) {
        captureButton.disabled = false;
    }
}

// Slackに送信（画像付き）
async function sendToSlack() {
    try {
        // 設定の取得
        const settings = getSettings();
        if (!settings.botToken || !settings.channelId) {
            showStatus(document.getElementById('status'), '設定を確認してください', 'error');
            return;
        }
        
        // QRコードデータの取得
        const qrResult = document.getElementById('qr-result');
        if (!qrResult || !qrResult.dataset.qrData) {
            showStatus(document.getElementById('status'), 'QRコードをスキャンしてください', 'error');
            return;
        }
        
        const qrData = JSON.parse(qrResult.dataset.qrData);
        
        // 画像データの取得
        const imageData = getLastCapturedImage();
        if (!imageData) {
            showStatus(document.getElementById('status'), 'トレイを撮影してください', 'error');
            return;
        }
        
        // 送信ボタンを無効化
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {
            sendButton.disabled = true;
        }
        
        // ステータス表示
        showStatus(document.getElementById('status'), 'Slackに送信中...', 'info');
        
        // Slackに送信
        await sendQRDataToSlackBotWithImage(qrData, imageData, settings.botToken, settings.channelId, settings.proxyUrl);
        
        // 送信ボタンを有効化
        if (sendButton) {
            sendButton.disabled = false;
        }
        
        // QRスキャナーをリセット
        resumeQRScanner();
        
        // カメラをリセット
        resetCamera();
        
    } catch (error) {
        console.error('Slackへの送信に失敗しました:', error);
        
        // 送信ボタンを有効化
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {
            sendButton.disabled = false;
        }
        
        showStatus(document.getElementById('status'), `送信に失敗しました: ${error.message}`, 'error');
    }
}

// Slackに送信（テキストのみ）
async function sendTextOnlyToSlack() {
    try {
        // 設定の取得
        const settings = getSettings();
        if (!settings.botToken || !settings.channelId) {
            showStatus(document.getElementById('status'), '設定を確認してください', 'error');
            return;
        }
        
        // QRコードデータの取得
        const qrResult = document.getElementById('qr-result');
        if (!qrResult || !qrResult.dataset.qrData) {
            showStatus(document.getElementById('status'), 'QRコードをスキャンしてください', 'error');
            return;
        }
        
        const qrData = JSON.parse(qrResult.dataset.qrData);
        
        // 送信ボタンを無効化
        const sendTextOnlyButton = document.getElementById('sendTextOnlyButton');
        if (sendTextOnlyButton) {
            sendTextOnlyButton.disabled = true;
        }
        
        // ステータス表示
        showStatus(document.getElementById('status'), 'テキストをSlackに送信中...', 'info');
        
        // Slackに送信（テキストのみ）
        await sendQRDataToSlackBotTextOnly(qrData, settings.botToken, settings.channelId, settings.proxyUrl);
        
        // 送信ボタンを有効化
        if (sendTextOnlyButton) {
            sendTextOnlyButton.disabled = false;
        }
        
        // QRスキャナーをリセット
        resumeQRScanner();
        
    } catch (error) {
        console.error('テキスト送信に失敗しました:', error);
        
        // 送信ボタンを有効化
        const sendTextOnlyButton = document.getElementById('sendTextOnlyButton');
        if (sendTextOnlyButton) {
            sendTextOnlyButton.disabled = false;
        }
        
        showStatus(document.getElementById('status'), `テキスト送信に失敗しました: ${error.message}`, 'error');
    }
}

// 設定の保存
function saveSettings() {
    try {
        const botToken = document.getElementById('botToken').value;
        const channelId = document.getElementById('channelId').value;
        const proxyUrl = document.getElementById('proxyUrl').value;
        
        // 入力値の検証
        if (!botToken) {
            showStatus(document.getElementById('settingsStatus'), 'Bot Tokenを入力してください', 'error');
            return;
        }
        
        if (!channelId) {
            showStatus(document.getElementById('settingsStatus'), 'チャンネルIDを入力してください', 'error');
            return;
        }
        
        // プロキシURLの末尾にスラッシュを追加
        let formattedProxyUrl = proxyUrl;
        if (formattedProxyUrl && !formattedProxyUrl.endsWith('/')) {
            formattedProxyUrl += '/';
        }
        
        // 設定をローカルストレージに保存
        const settings = {
            botToken: botToken,
            channelId: channelId,
            proxyUrl: formattedProxyUrl
        };
        
        localStorage.setItem('slackSettings', JSON.stringify(settings));
        
        // 設定が保存されたことを表示
        showStatus(document.getElementById('settingsStatus'), '設定を保存しました', 'success');
        
        // プロキシURL設定の有無をコンソールに表示
        if (formattedProxyUrl) {
            console.log("プロキシURL設定あり:", formattedProxyUrl);
        } else {
            console.log("プロキシURL設定なし");
        }
        
        // 3秒後にステータスメッセージを消す
        setTimeout(() => {
            const statusElement = document.getElementById('settingsStatus');
            if (statusElement) {
                statusElement.style.display = 'none';
            }
        }, 3000);
        
    } catch (error) {
        console.error('設定の保存に失敗しました:', error);
        showStatus(document.getElementById('settingsStatus'), '設定の保存に失敗しました', 'error');
    }
}

// 設定の読み込み
function loadSettings() {
    try {
        const settingsJson = localStorage.getItem('slackSettings');
        if (settingsJson) {
            const settings = JSON.parse(settingsJson);
            
            // 入力フィールドに設定を反映
            if (document.getElementById('botToken')) {
                document.getElementById('botToken').value = settings.botToken || '';
            }
            
            if (document.getElementById('channelId')) {
                document.getElementById('channelId').value = settings.channelId || '';
            }
            
            if (document.getElementById('proxyUrl')) {
                document.getElementById('proxyUrl').value = settings.proxyUrl || '';
            }
            
            console.log("設定を読み込みました");
        }
    } catch (error) {
        console.error('設定の読み込みに失敗しました:', error);
    }
}

// 設定の取得
function getSettings() {
    try {
        const settingsJson = localStorage.getItem('slackSettings');
        if (settingsJson) {
            return JSON.parse(settingsJson);
        }
    } catch (error) {
        console.error('設定の取得に失敗しました:', error);
    }
    
    return {
        botToken: '',
        channelId: '',
        proxyUrl: ''
    };
}

// 状態メッセージを表示
function showStatus(element, message, type) {
    if (!element) return;
    
    element.textContent = message;
    element.className = 'status-message';
    element.classList.add(type);
    element.style.display = 'block';
    
    // エラーメッセージの場合は自動で消えないようにする
    if (type !== 'error') {
        // 5秒後にメッセージを消す
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}
