// config.js - アプリケーション設定（最終修正版）

// アプリケーション設定
const CONFIG = {
    // QRスキャナー設定
    QR_SCANNER: {
        fps: 10,          // フレームレート
        qrbox: 250,       // QRコード検出エリアのサイズ
        aspectRatio: 1.0  // アスペクト比
    },
    
    // カメラ設定
    CAMERA: {
        width: 1280,      // カメラ解像度（幅）
        height: 720       // カメラ解像度（高さ）
    }
};
