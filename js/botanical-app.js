// botanical-app.js - 画面遷移とUIインタラクションを管理
document.addEventListener('DOMContentLoaded', function() {
    console.log('Botanical App: 初期化開始');
    
    // ページ要素
    const homePage = document.getElementById('homePage');
    const scanPage = document.getElementById('scanPage');
    const capturePage = document.getElementById('capturePage');
    const confirmPage = document.getElementById('confirmPage');
    const completionPage = document.getElementById('completionPage');
    
    // ボタン要素
    const startScanButton = document.getElementById('startScanButton');
    const backToHomeButton = document.getElementById('backToHomeButton');
    const backToScanButton = document.getElementById('backToScanButton');
    const backToCaptureButton = document.getElementById('backToCaptureButton');
    const retakeButton = document.getElementById('retakeButton');
    const backToHomeFromCompletionButton = document.getElementById('backToHomeFromCompletionButton');
    
    // 設定モーダル関連
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeButton = document.querySelector('.close');
    const saveSettingsButton = document.getElementById('saveSettings');
    
    // グローバル状態変数
    let isTransitioning = false;
    
    // ページ遷移関数
    window.navigateTo = function(fromPage, toPage) {
        if (isTransitioning) return;
        isTransitioning = true;
        
        fromPage.classList.remove('active');
        fromPage.classList.add('previous');
        
        setTimeout(() => {
            toPage.classList.add('active');
            
            setTimeout(() => {
                fromPage.classList.remove('previous');
                fromPage.style.transform = 'translateX(100%)';
                
                setTimeout(() => {
                    fromPage.style.transform = '';
                    isTransitioning = false;
                }, 50);
            }, 500);
        }, 50);
    };
    
    // 設定ボタンクリック時
    if (settingsButton) {
        settingsButton.addEventListener('click', function() {
            console.log('設定ボタンクリック');
            // 現在の設定を表示
            const settings = getSettings();
            document.getElementById('botToken').value = settings.botToken || '';
            document.getElementById('channelId').value = settings.channelId || '';
            document.getElementById('proxyUrl').value = settings.proxyUrl || '';
            
            // モーダルを表示
            settingsModal.style.display = 'block';
        });
    }
    
    // 閉じるボタンクリック時
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            settingsModal.style.display = 'none';
        });
    }
    
    // モーダル外クリック時
    window.addEventListener('click', function(event) {
        if (event.target == settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    
    // 保存ボタンクリック時
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', function() {
            console.log('設定保存ボタンクリック');
            const botToken = document.getElementById('botToken').value;
            const channelId = document.getElementById('channelId').value;
            const proxyUrl = document.getElementById('proxyUrl').value;
            
            // 設定を保存
            saveSettings({
                botToken: botToken,
                channelId: channelId,
                proxyUrl: proxyUrl
            });
            
            // 保存成功メッセージ
            const settingsStatus = document.getElementById('settingsStatus');
            settingsStatus.textContent = '設定を保存しました';
            settingsStatus.className = 'status-message success';
            settingsStatus.style.display = 'block';
            
            // 3秒後にメッセージを非表示
            setTimeout(() => {
                settingsStatus.style.display = 'none';
            }, 3000);
        });
    }
    
    // ホーム → スキャン
    if (startScanButton) {
        startScanButton.addEventListener('click', function() {
            navigateTo(homePage, scanPage);
        });
    }
    
    // スキャン → ホーム
    if (backToHomeButton) {
        backToHomeButton.addEventListener('click', function() {
            navigateTo(scanPage, homePage);
        });
    }
    
    // 撮影 → スキャン
    if (backToScanButton) {
        backToScanButton.addEventListener('click', function() {
            navigateTo(capturePage, scanPage);
        });
    }
    
    // 確認 → 撮影
    if (backToCaptureButton) {
        backToCaptureButton.addEventListener('click', function() {
            navigateTo(confirmPage, capturePage);
        });
    }
    
    // 確認 → 撮影 (撮り直し)
    if (retakeButton) {
        retakeButton.addEventListener('click', function() {
            navigateTo(confirmPage, capturePage);
        });
    }
    
    // 完了 → ホーム
    if (backToHomeFromCompletionButton) {
        backToHomeFromCompletionButton.addEventListener('click', function() {
            navigateTo(completionPage, homePage);
        });
    }
    
    console.log('Botanical App: 初期化完了');
});
