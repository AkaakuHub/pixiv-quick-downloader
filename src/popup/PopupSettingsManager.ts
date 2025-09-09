import { ExtensionSettings } from "../types";

export class PopupSettingsManager {
  private settings: ExtensionSettings = {
    filenameFormat: "title_page",
  };

  async loadSettings(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
      if (response.success && response.data) {
        this.updateSettings(response.data);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }

  async saveSettings(settings: ExtensionSettings): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "UPDATE_SETTINGS",
        payload: settings,
      });
      if (!response.success) {
        throw new Error(response.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      throw error;
    }
  }

  getSettings(): ExtensionSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<ExtensionSettings>): void {
    this.settings = { ...this.settings, ...updates };
  }
}
