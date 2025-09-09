import { ExtensionSettings, IllustInfo } from "../../types";
import { PixivAPI } from "../api";
import { I18n } from "../../i18n";
import { FilenameGenerator } from "./FilenameGenerator";
import { SettingsManager } from "../services/core/ContentStateManager";

export class ModalService {
  private settingsManager: SettingsManager;
  private i18n: I18n;
  private filenameGenerator: FilenameGenerator;

  constructor() {
    this.settingsManager = new SettingsManager();
    this.i18n = I18n.getInstance();
    this.filenameGenerator = new FilenameGenerator(this.settingsManager.getSettings());
    this.loadSettings();
  }

  async loadSettings() {
    await this.settingsManager.loadSettings();
    this.filenameGenerator.updateSettings(this.settingsManager.getSettings());
  }

  async fetchIllustData(illustId: string): Promise<{
    images: string[];
    illustInfo: IllustInfo;
  }> {
    const api = PixivAPI.getInstance();

    const [images, illustInfo] = await Promise.all([
      api.getIllustPages(illustId),
      api.getIllustInfo(illustId),
    ]);

    return { images, illustInfo };
  }

  async downloadImage(url: string, filename: string, illustId?: string) {
    try {
      const sanitizedFilename = this.filenameGenerator.sanitizeFilename(filename);
      const finalFilename = this.filenameGenerator.ensureFileExtension(sanitizedFilename, url);

      const response = await chrome.runtime.sendMessage({
        type: "DOWNLOAD_IMAGE",
        payload: {
          url: url,
          filename: finalFilename,
          illustId: illustId,
        },
      });

      if (!response.success) {
        throw new Error(response.error || "Unknown error");
      }
    } catch {
      alert(this.i18n.t("downloadFailed"));
    }
  }

  async downloadAllImages(images: string[], currentIllust: IllustInfo) {
    if (!currentIllust || !images.length) return;

    const folderName = this.filenameGenerator.generateFolderName(
      currentIllust?.title || "untitled",
      currentIllust?.userName || "Unknown User",
      currentIllust?.id || "unknown"
    );

    for (let i = 0; i < images.length; i++) {
      const url = images[i];
      const filename = `${folderName}/${i + 1}`;
      await this.downloadImage(url, filename, currentIllust?.id);

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  generateFilename(title: string, userName: string, id: string, pageIndex: number): string {
    return this.filenameGenerator.generateFilename(title, userName, id, pageIndex);
  }

  getSettings(): ExtensionSettings {
    return this.settingsManager.getSettings();
  }
}
