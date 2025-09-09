import { FilenameFormat } from "../types";
import { I18n } from "../i18n";
import { PopupSettingsManager } from "./PopupSettingsManager";
import "../styles/main.css";

class PopupManager {
  private settingsManager: PopupSettingsManager;
  private i18n: I18n;

  constructor() {
    this.settingsManager = new PopupSettingsManager();
    this.i18n = I18n.getInstance();
    this.init();
  }

  private async init() {
    await this.settingsManager.loadSettings();
    this.setupEventListeners();
    this.updateUI();
    this.updateUIText();
  }

  private setupEventListeners() {
    // 設定変更時のリアルタイム更新と自動保存
    document.getElementById("filenameFormat")?.addEventListener("change", async e => {
      this.settingsManager.updateSettings({
        filenameFormat: (e.target as HTMLSelectElement).value as FilenameFormat,
      });
      try {
        await this.settingsManager.saveSettings(this.settingsManager.getSettings());
        this.showStatus(this.i18n.t("settingsSaved"), "success");
        this.notifySettingsChanged();
      } catch (error) {
        console.error("Failed to save settings:", error);
        this.showStatus(this.i18n.t("settingsSaveFailed"), "error");
      }
    });
  }

  private updateUI() {
    const filenameFormatSelect = document.getElementById("filenameFormat") as HTMLSelectElement;

    if (filenameFormatSelect)
      filenameFormatSelect.value = this.settingsManager.getSettings().filenameFormat;
  }

  private updateUIText() {
    // Update section titles
    const sectionTitle = document.getElementById("sectionTitle");
    if (sectionTitle) {
      sectionTitle.textContent = this.i18n.t("settings");
    }

    // Update setting labels
    const filenameFormatLabel = document.getElementById("filenameFormatLabel");
    if (filenameFormatLabel) {
      filenameFormatLabel.textContent = this.i18n.t("filenameFormat");
    }

    // Update select options
    const optionTitlePage = document.getElementById("optionTitlePage");
    const optionIdPage = document.getElementById("optionIdPage");
    const optionAuthorTitlePage = document.getElementById("optionAuthorTitlePage");
    const optionAuthorIdPage = document.getElementById("optionAuthorIdPage");

    if (optionTitlePage) {
      optionTitlePage.textContent = this.i18n.t("formatTitlePage");
    }
    if (optionIdPage) {
      optionIdPage.textContent = this.i18n.t("formatIdPage");
    }
    if (optionAuthorTitlePage) {
      optionAuthorTitlePage.textContent = this.i18n.t("formatAuthorTitlePage");
    }
    if (optionAuthorIdPage) {
      optionAuthorIdPage.textContent = this.i18n.t("formatAuthorIdPage");
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
