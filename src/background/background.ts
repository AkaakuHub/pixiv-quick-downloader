import { ExtensionSettings } from '../types';

// バックグラウンドサービスワーカー
class BackgroundService {
  private settings: ExtensionSettings = {
    downloadPath: 'pixiv_downloads',
    autoCloseModal: true,
    showPreview: true,
    filenameFormat: 'title_page'
  };

  constructor() {
    this.init();
  }

  private init() {
    chrome.runtime.onInstalled.addListener(() => {
      this.loadSettings();
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      // offscreen documentからのメッセージはハンドルしない
      if (sender.tab === undefined) {
        return false;
      }
      this.handleMessage(request, sender, sendResponse);
      return true; // 非同期レスポンスを許可
    });
  }

  private async handleMessage(request: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
    try {
      switch (request.type) {
        case 'DOWNLOAD_IMAGE':
          await this.handleDownload(request.payload);
          sendResponse({ success: true });
          break;
          
        case 'GET_SETTINGS':
          sendResponse({ success: true, data: this.settings });
          break;
          
        case 'UPDATE_SETTINGS':
          this.settings = { ...this.settings, ...request.payload };
          await this.saveSettings();
          sendResponse({ success: true });
          break;
          
        case 'FETCH_IMAGE':
          const blobUrl = await this.fetchImageWithReferer(request.payload.url, request.payload.referer);
          sendResponse({ success: true, data: blobUrl });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleDownload(payload: { url: string; filename: string; illustId?: string }) {
    try {
      // 画像を取得
      const response = await fetch(payload.url, {
        headers: {
          'Referer': `https://www.pixiv.net/artworks/${payload.illustId}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // blobを直接data URLに変換
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error('FileReader error'));
        };
        reader.readAsDataURL(blob);
      });
      
      // ファイル名をデコード
      const decodedFilename = decodeURIComponent(payload.filename);
      
      // data URLでダウンロード
      await chrome.downloads.download({
        url: dataUrl,
        filename: decodedFilename,
        saveAs: false,
        conflictAction: 'uniquify'
      });
    } catch (error) {
      throw error;
    }
  }

  private async createOffscreenDocument() {
    if (await chrome.offscreen.hasDocument()) {
      return;
    }
    
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL('offscreen.html'),
      reasons: ['BLOBS' as any],
      justification: 'Download blobs with proper referer headers'
    });
  }

  private async loadSettings() {
    try {
      const result = await chrome.storage.sync.get('settings');
      if (result.settings) {
        this.settings = { ...this.settings, ...result.settings };
      }
    } catch (error) {
      // Settings load failed, using defaults
    }
  }

  private async saveSettings() {
    try {
      await chrome.storage.sync.set({ settings: this.settings });
    } catch (error) {
      throw error;
    }
  }

  private async fetchImageWithReferer(url: string, referer: string): Promise<string> {
    try {
      // 明示的にRefererヘッダーを設定してみる
      const response = await fetch(url, {
        headers: {
          'Referer': referer,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      
      // blobをbase64に変換して渡す
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error('FileReader error'));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw error;
    }
  }
}

// バックグラウンドサービスの初期化
new BackgroundService();