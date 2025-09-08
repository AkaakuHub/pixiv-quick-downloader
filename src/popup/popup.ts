import { ExtensionSettings, FilenameFormat } from '../types';
import '../styles/main.css';

class PopupManager {
  private settings: ExtensionSettings;

  constructor() {
    this.settings = {
      downloadPath: 'pixiv_downloads',
      autoCloseModal: true,
      showPreview: true,
      filenameFormat: 'title_page'
    };
    this.init();
  }

  private async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
  }

  private setupEventListeners() {
    document.getElementById('saveSettings')?.addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('openHelp')?.addEventListener('click', () => {
      this.openHelp();
    });

    // 設定変更時のリアルタイム更新
    document.getElementById('downloadPath')?.addEventListener('input', (e) => {
      this.settings.downloadPath = (e.target as HTMLInputElement).value;
    });

    document.getElementById('autoCloseModal')?.addEventListener('change', (e) => {
      this.settings.autoCloseModal = (e.target as HTMLInputElement).checked;
    });

    document.getElementById('showPreview')?.addEventListener('change', (e) => {
      this.settings.showPreview = (e.target as HTMLInputElement).checked;
    });

    document.getElementById('filenameFormat')?.addEventListener('change', (e) => {
      this.settings.filenameFormat = (e.target as HTMLSelectElement).value as FilenameFormat;
    });
  }

  private updateUI() {
    const downloadPathInput = document.getElementById('downloadPath') as HTMLInputElement;
    const autoCloseModalCheckbox = document.getElementById('autoCloseModal') as HTMLInputElement;
    const showPreviewCheckbox = document.getElementById('showPreview') as HTMLInputElement;
    const filenameFormatSelect = document.getElementById('filenameFormat') as HTMLSelectElement;

    if (downloadPathInput) downloadPathInput.value = this.settings.downloadPath;
    if (autoCloseModalCheckbox) autoCloseModalCheckbox.checked = this.settings.autoCloseModal;
    if (showPreviewCheckbox) showPreviewCheckbox.checked = this.settings.showPreview;
    if (filenameFormatSelect) filenameFormatSelect.value = this.settings.filenameFormat;
  }

  private async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (response.success && response.data) {
        this.settings = { ...this.settings, ...response.data };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  private async saveSettings() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        payload: this.settings
      });

      if (response.success) {
        this.showStatus('設定を保存しました', 'success');
      } else {
        this.showStatus('設定の保存に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showStatus('設定の保存に失敗しました', 'error');
    }
  }

  private showStatus(message: string, type: 'success' | 'error') {
    const statusElement = document.getElementById('status') as HTMLElement;
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `text-center py-3 px-4 rounded-lg text-xs mt-4 ${type === 'success' ? 'bg-green-900/20 text-green-400 border border-green-400' : 'bg-red-900/20 text-red-400 border border-red-400'}`;
    statusElement.className = statusElement.className.replace(' hidden', '');
    statusElement.classList.remove('hidden');

    setTimeout(() => {
      statusElement.classList.add('hidden');
    }, 3000);
  }

  private openHelp() {
    const helpUrl = 'https://github.com/your-repo/pixiv-downloader#readme';
    chrome.tabs.create({ url: helpUrl });
  }
}

// DOMが読み込まれたら初期化
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});