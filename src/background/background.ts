import { ExtensionSettings, FilenameFormat, FetchImagePayload } from "../types";

// バックグラウンドサービスワーカー
class BackgroundService {
  private settings: ExtensionSettings = {
    filenameFormat: "title_page" as FilenameFormat,
  };

  constructor() {
    this.init();
  }

  private init() {
    chrome.runtime.onInstalled.addListener(() => {
      this.loadSettings();
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      // popupからのメッセージもハンドルする
      if (sender.tab === undefined && sender.url !== undefined) {
        // popupからのメッセージ
        this.handleMessage(request, sender, sendResponse);
        return true;
      }

      // offscreen documentからのメッセージはハンドルしない
      if (sender.tab === undefined) {
        return false;
      }

      this.handleMessage(request, sender, sendResponse);
      return true; // 非同期レスポンスを許可
    });
  }

  private async handleMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: { type: string; payload?: any },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) {
    try {
      switch (request.type) {
        case "DOWNLOAD_IMAGE":
          await this.handleDownload(request.payload);
          sendResponse({ success: true });
          break;

        case "GET_SETTINGS":
          sendResponse({ success: true, data: this.settings });
          break;

        case "UPDATE_SETTINGS": {
          const newSettings = request.payload as Partial<ExtensionSettings>;
          if (newSettings.filenameFormat !== undefined)
            this.settings.filenameFormat = newSettings.filenameFormat as FilenameFormat;
          await this.saveSettings();
          sendResponse({ success: true });
          break;
        }

        case "FETCH_IMAGE": {
          const payload = request.payload as FetchImagePayload;
          const blobUrl = await this.fetchImageWithReferer(payload.url, payload.referer);
          sendResponse({ success: true, data: blobUrl });
          break;
        }

        default:
          sendResponse({ success: false, error: "Unknown message type" });
      }
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async handleDownload(payload: { url: string; filename: string; illustId?: string }) {
    try {
      if (!payload.illustId) {
        throw new Error("Invalid illustration ID");
      }
      // 画像を取得
      const response = await fetch(payload.url, {
        headers: {
          Referer: `https://www.pixiv.net/artworks/${payload.illustId}`,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        },
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
          reject(new Error("FileReader error"));
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
        conflictAction: "uniquify",
      });
    } catch (error) {
      throw error;
    }
  }

  private async loadSettings() {
    const result = await chrome.storage.sync.get("settings");
    if (result.settings) {
      const loadedSettings = result.settings as ExtensionSettings;
      // 型安全な設定マージ
      if (loadedSettings.filenameFormat !== undefined)
        this.settings.filenameFormat = loadedSettings.filenameFormat as FilenameFormat;
    }
  }

  private async saveSettings() {
    await chrome.storage.sync.set({ settings: this.settings });
  }

  private async fetchImageWithReferer(url: string, referer: string): Promise<string> {
    // 明示的にRefererヘッダーを設定してみる
    const response = await fetch(url, {
      headers: {
        Referer: referer,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      },
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
        reject(new Error("FileReader error"));
      };
      reader.readAsDataURL(blob);
    });
  }
}

// バックグラウンドサービスの初期化
new BackgroundService();
