import { ModalState, ExtensionSettings, ExtendedWindow } from "../types";
import { PixivAPI } from "./api";
import "../styles/main.css";

export class ModalManager {
  private modal: HTMLElement | null = null;
  private state: ModalState = {
    isOpen: false,
    currentIllust: null,
    images: [],
    isLoading: false,
    error: null,
  };
  private settings: ExtensionSettings = {
    downloadPath: "pixiv_downloads",
    autoCloseModal: true,
    showPreview: true,
    filenameFormat: "title_page",
  };

  constructor() {
    // Simple CSS handles all styling
    // 自身をグローバルに登録
    (window as ExtendedWindow).modalManager = this;
    this.loadSettings();
  }

  public async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
      if (response.success && response.data) {
        this.settings = { ...this.settings, ...response.data };
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }

  private sanitizeFilename(filename: string): string {
    // Windowsで使えない文字を置換
    return (
      filename
        .replace(/</g, "＜")
        .replace(/>/g, "＞")
        .replace(/:/g, "：")
        .replace(/"/g, "＂")
        .replace(/\|/g, "｜")
        .replace(/\?/g, "？")
        .replace(/\*/g, "＊")
        .replace(/\\/g, "￥")
        .replace(/\//g, "／") // / を ／ に置換
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x1F\x7F]/g, "") // 制御文字を削除
        .replace(/[ ]+/g, " ") // 連続するスペースを1つに
        .trim() // 先頭と末尾のスペースを削除
        .replace(/^\./, "_") // 先頭のドットを _ に置換
        .replace(/[/]+/g, "/")
    ); // 連続するスラッシュを1つに
  }

  private generateFilename(title: string, userName: string, id: string, pageIndex: number): string {
    const sanitizedTitle = this.sanitizeFilename(title);
    const sanitizedUserName = this.sanitizeFilename(userName);
    const encodedTitle = encodeURIComponent(sanitizedTitle);
    const encodedUserName = encodeURIComponent(sanitizedUserName);

    // windowsでも、スラッシュ区切りで問題ない

    switch (this.settings.filenameFormat) {
      case "title_page":
        return `${encodedTitle}_${pageIndex + 1}.png`;
      case "id_page":
        return `${id}_${pageIndex + 1}.png`;
      case "author_title_page":
        return `${encodedUserName}/${encodedTitle}_${pageIndex + 1}.png`;
      case "author_id_page":
        return `${encodedUserName}/${id}_${pageIndex + 1}.png`;
      default:
        return `${encodedTitle}_${pageIndex + 1}.png`;
    }
  }

  private generateFolderName(title: string, userName: string, id: string): string {
    const sanitizedTitle = this.sanitizeFilename(title);
    const sanitizedUserName = this.sanitizeFilename(userName);
    const encodedTitle = encodeURIComponent(sanitizedTitle);
    const encodedUserName = encodeURIComponent(sanitizedUserName);

    switch (this.settings.filenameFormat) {
      case "title_page":
        return encodedTitle;
      case "id_page":
        return id;
      case "author_title_page":
        return `${encodedUserName}/${encodedTitle}`;
      case "author_id_page":
        return `${encodedUserName}/${id}`;
      default:
        return encodedTitle;
    }
  }

  async openModal(illustId: string) {
    try {
      const api = PixivAPI.getInstance();
      this.state.isLoading = true;
      this.state.error = null;

      const [images, illustInfo] = await Promise.all([
        api.getIllustPages(illustId),
        api.getIllustInfo(illustId),
      ]);

      this.state.currentIllust = illustInfo;
      this.state.images = images;
      this.state.isLoading = false;
      this.state.isOpen = true;

      this.render();
    } catch (error) {
      this.state.isLoading = false;
      this.state.error = error instanceof Error ? error.message : "Unknown error";
      this.render();
    }
  }

  closeModal() {
    this.state.isOpen = false;
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  private render() {
    if (this.modal) {
      this.modal.remove();
    }

    this.modal = document.createElement("div");
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      overflow-y: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      padding: 20px;
    `;

    if (this.state.isOpen) {
      // モーダルを開く前に確実にグローバルに登録
      (window as ExtendedWindow).modalManager = this;
      this.modal.innerHTML = this.getModalHTML();
      document.body.appendChild(this.modal);

      setTimeout(() => {
        if (this.modal) {
          this.modal.style.opacity = "1";
        }
      }, 10);

      this.attachEventListeners();
    }
  }

  private getModalHTML(): string {
    if (this.state.isLoading) {
      return `
        <div class="pixiv-modal-container">
          <div class="pixiv-modal-loading">
            <div class="pixiv-loading-spinner"></div>
            <div>読み込み中...</div>
          </div>
        </div>
      `;
    }

    if (this.state.error) {
      return `
        <div class="pixiv-modal-container">
          <div class="pixiv-modal-error">
            <div class="pixiv-error-icon">⚠️</div>
            <div class="pixiv-error-message">エラー: ${this.state.error}</div>
            <button class="pixiv-close-btn">閉じる</button>
          </div>
        </div>
      `;
    }

    const imageItems = this.state.images
      .map((url, index) => {
        // ダウンロード対象の画像をそのまま表示
        return `
      <div class="pixiv-image-card">
        <div class="pixiv-image-wrapper" data-url="${url}" data-index="${index}">
          <img 
            src="${url}" 
            alt="Page ${index + 1}"
            class="pixiv-thumbnail"
            onerror="this.parentElement.innerHTML='<div class=\\'pixiv-image-error\\'>画像の読み込みに失敗しました</div>'"
          >
          <div class="pixiv-download-overlay">
          </div>
        </div>
        <div class="pixiv-image-info">
          <div class="pixiv-page-number">ページ ${index + 1} / ${this.state.images.length}</div>
        </div>
      </div>
    `;
      })
      .join("");

    return `
      <div class="pixiv-modal-container">
        <div class="pixiv-modal-header">
          <div class="pixiv-title-section">
            <h2 class="pixiv-title">${this.state.currentIllust?.title}</h2>
            <div class="pixiv-author">by ${this.state.currentIllust?.userName}</div>
          </div>
          <button class="pixiv-close-btn">✕</button>
        </div>
        
        ${
          this.state.images.length > 1
            ? `
          <div class="pixiv-bulk-download">
            <button class="pixiv-download-all-btn">
              全てダウンロード (${this.state.images.length}枚)
            </button>
          </div>
        `
            : ""
        }
        
        <div class="pixiv-images-grid">
          ${imageItems}
        </div>
      </div>
    `;
  }

  private attachEventListeners() {
    if (!this.modal) return;

    this.modal.addEventListener("click", e => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && this.state.isOpen) {
        this.closeModal();
      }
    });

    // 画像クリックイベントリスナーを追加
    const imageWrappers = this.modal.querySelectorAll(".pixiv-image-wrapper");
    imageWrappers.forEach((wrapper, index) => {
      const url = wrapper.getAttribute("data-url");

      if (url) {
        wrapper.addEventListener("click", e => {
          e.preventDefault();
          e.stopPropagation();
          const filename = this.generateFilename(
            this.state.currentIllust?.title || "untitled",
            this.state.currentIllust?.userName || "Unknown User",
            this.state.currentIllust?.id || "unknown",
            index
          );
          this.downloadImage(url, filename, this.state.currentIllust?.id);
        });
      }
    });

    // 閉じるボタンのイベントリスナー
    const closeButtons = this.modal.querySelectorAll(".pixiv-close-btn");
    closeButtons.forEach(button => {
      button.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        this.closeModal();
      });
    });

    // 全てダウンロードボタンのイベントリスナー
    const downloadAllButtons = this.modal.querySelectorAll(".pixiv-download-all-btn");
    downloadAllButtons.forEach(button => {
      button.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        this.downloadAllImages();
      });
    });
  }

  async downloadImage(url: string, filename: string, illustId?: string) {
    try {
      // background script経由でダウンロード
      const response = await chrome.runtime.sendMessage({
        type: "DOWNLOAD_IMAGE",
        payload: {
          url: url,
          filename: filename,
          illustId: illustId,
        },
      });

      if (!response.success) {
        throw new Error(response.error || "Unknown error");
      }
    } catch {
      alert("ダウンロードに失敗しました");
    }
  }

  async downloadAllImages() {
    if (!this.state.currentIllust || !this.state.images.length) return;

    const folderName = this.generateFolderName(
      this.state.currentIllust?.title || "untitled",
      this.state.currentIllust?.userName || "Unknown User",
      this.state.currentIllust?.id || "unknown"
    );

    for (let i = 0; i < this.state.images.length; i++) {
      const url = this.state.images[i];
      const filename = `${folderName}/${i + 1}.png`;
      await this.downloadImage(url, filename, this.state.currentIllust?.id);

      // レートリミット対策
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}
