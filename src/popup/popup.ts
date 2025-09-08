import { ExtensionSettings, FilenameFormat } from "../types";
import "../styles/main.css";

class PopupManager {
  private settings: ExtensionSettings;

  constructor() {
    this.settings = {
      downloadPath: "pixiv_downloads",
      autoCloseModal: true,
      showPreview: true,
      filenameFormat: "title_page",
    };
    this.init();
  }

  private async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
  }

  private setupEventListeners() {
    // 設定変更時のリアルタイム更新と自動保存
    document.getElementById("filenameFormat")?.addEventListener("change", async e => {
      this.settings.filenameFormat = (e.target as HTMLSelectElement).value as FilenameFormat;
      await this.saveSettings();
    });
  }

  private updateUI() {
    const filenameFormatSelect = document.getElementById("filenameFormat") as HTMLSelectElement;

    if (filenameFormatSelect) filenameFormatSelect.value = this.settings.filenameFormat;
  }

  public async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });

      if (response.success && response.data) {
        const loadedSettings = response.data;

        // 型安全な設定マージ
        if (loadedSettings.filenameFormat !== undefined) {
          this.settings.filenameFormat = loadedSettings.filenameFormat as FilenameFormat;
        }
      } else {
        console.error("Popup: Failed to load settings - response:", response);
      }
    } catch (error) {
      console.error("Popup: Error loading settings:", error);
    }
  }

  private async saveSettings() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "UPDATE_SETTINGS",
        payload: this.settings,
      });

      if (response.success) {
        this.showStatus("設定を保存しました", "success");

        // モーダルが開いている場合に設定を再読み込みさせるためのイベントを発火
        this.notifySettingsChanged();
      } else {
        this.showStatus("設定の保存に失敗しました", "error");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      this.showStatus("設定の保存に失敗しました", "error");
    }
  }

  private notifySettingsChanged() {
    // コンテントスクリプトに設定変更を通知
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        if (tab.id && tab.url?.includes("pixiv.net")) {
          chrome.tabs
            .sendMessage(tab.id, {
              type: "SETTINGS_CHANGED",
            })
            .catch(() => {
              // メッセージ送信に失敗しても無視（コンテントスクリプトが動作していない可能性がある）
            });
        }
      });
    });
  }

  private showStatus(message: string, type: "success" | "error") {
    const statusElement = document.getElementById("status") as HTMLElement;
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `text-center py-3 px-4 rounded-lg text-xs mt-4 ${type === "success" ? "bg-green-900/20 text-green-400 border border-green-400" : "bg-red-900/20 text-red-400 border border-red-400"}`;
    statusElement.className = statusElement.className.replace(" hidden", "");
    statusElement.classList.remove("hidden");

    setTimeout(() => {
      statusElement.classList.add("hidden");
    }, 3000);
  }
}

// DOMが読み込まれたら初期化
document.addEventListener("DOMContentLoaded", () => {
  new PopupManager();
});
