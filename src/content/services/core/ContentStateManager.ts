import { PageType } from "./PageDetector";
import { ExtensionSettings, ExtendedWindow } from "../../../types";

interface ContentState {
  currentPageType: PageType;
  isDestroyed: boolean;
  isInitialized: boolean;
}

export interface IContentStateManager {
  getState(): ContentState;
  setPageType(type: PageType): void;
  setIsDestroyed(destroyed: boolean): void;
  setIsInitialized(initialized: boolean): void;
  reset(): void;
}

export abstract class BaseStateManager<T> {
  protected state: T;

  constructor(initialState: T) {
    this.state = { ...initialState };
  }

  getState(): T {
    return { ...this.state };
  }

  protected updateState(updates: Partial<T>): void {
    this.state = { ...this.state, ...updates };
  }

  reset(): void {
    this.state = { ...this.getInitialState() };
  }

  protected abstract getInitialState(): T;
}

export class ContentStateManager
  extends BaseStateManager<ContentState>
  implements IContentStateManager
{
  constructor() {
    super({
      currentPageType: "unknown",
      isDestroyed: false,
      isInitialized: false,
    });
  }

  protected getInitialState(): ContentState {
    return {
      currentPageType: "unknown",
      isDestroyed: false,
      isInitialized: false,
    };
  }

  setPageType(type: PageType): void {
    this.updateState({ currentPageType: type });
  }

  setIsDestroyed(destroyed: boolean): void {
    this.updateState({ isDestroyed: destroyed });
  }

  setIsInitialized(initialized: boolean): void {
    this.updateState({ isInitialized: initialized });
  }
}

export class SettingsManager {
  private settings: ExtensionSettings = {
    filenameFormat: "title_page",
    downloadDirectory: "pixiv_downloads",
    autoDownload: false,
    includeArtistId: false,
    includePageNumber: false,
    sanitizeFilename: true,
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
      await chrome.storage.sync.set({ settings });
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

export function registerModalManager(modalManager: {
  openModal: (illustId: string) => Promise<void>;
  closeModal: () => void;
}): void {
  (window as ExtendedWindow).modalManager = modalManager;
}

export function createDownloadSvg(): HTMLElement {
  const svg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  ) as unknown as HTMLElement;
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 128 128");
  svg.innerHTML = `
    <rect width="128" height="128" fill="#0096fa" rx="16"/>
    <path d="M64 32 L64 96 M32 64 L96 64" stroke="white" stroke-width="12" stroke-linecap="round"/>
    <circle cx="64" cy="64" r="40" fill="none" stroke="white" stroke-width="8" stroke-dasharray="4 8"/>
  `;
  return svg;
}
