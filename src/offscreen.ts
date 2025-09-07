// Blob処理を担当
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CONVERT_BLOB_TO_DATAURL') {
        const { blob, filename } = request.payload;
        
        try {
            // Blobが正しいか確認
            if (!(blob instanceof Blob)) {
                throw new Error('Invalid blob object');
            }
            
            // FileReaderでdata URLに変換
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                sendResponse({ success: true, dataUrl: dataUrl });
            };
            reader.onerror = () => {
                sendResponse({ success: false, error: 'FileReader error' });
            };
            reader.readAsDataURL(blob);
            
        } catch (error) {
            sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
        
        return true; // 非同期レスポンスを許可
    }
    
    return false;
});