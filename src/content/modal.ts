import { ModalState, IllustInfo } from '../types';
import { PixivAPI } from './api';
import '../styles/main.css';

export class ModalManager {
  private modal: HTMLElement | null = null;
  private state: ModalState = {
    isOpen: false,
    currentIllust: null,
    images: [],
    isLoading: false,
    error: null
  };

  constructor() {
    // Simple CSS handles all styling
    // 自身をグローバルに登録
    (window as any).modalManager = this;
  }

  
  async openModal(illustId: string) {
    try {
      const api = PixivAPI.getInstance();
      this.state.isLoading = true;
      this.state.error = null;
      
      const [images, illustInfo] = await Promise.all([
        api.getIllustPages(illustId),
        api.getIllustInfo(illustId)
      ]);

      this.state.currentIllust = illustInfo;
      this.state.images = images;
      this.state.isLoading = false;
      this.state.isOpen = true;

      this.render();
    } catch (error) {
      this.state.isLoading = false;
      this.state.error = error instanceof Error ? error.message : 'Unknown error';
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

    this.modal = document.createElement('div');
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
    `;
    
    if (this.state.isOpen) {
      // モーダルを開く前に確実にグローバルに登録
      (window as any).modalManager = this;
      this.modal.innerHTML = this.getModalHTML();
      document.body.appendChild(this.modal);
      
      setTimeout(() => {
        if (this.modal) {
          this.modal.style.opacity = '1';
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

    const imageItems = this.state.images.map((url, index) => {
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
            <span class="pixiv-download-icon">⬇️</span>
            <span class="pixiv-download-text">クリックしてダウンロード</span>
          </div>
        </div>
        <div class="pixiv-image-info">
          <div class="pixiv-page-number">ページ ${index + 1} / ${this.state.images.length}</div>
        </div>
      </div>
    `;
    }).join('');

    return `
      <div class="pixiv-modal-container">
        <div class="pixiv-modal-header">
          <div class="pixiv-title-section">
            <h2 class="pixiv-title">${this.state.currentIllust?.title}</h2>
            <div class="pixiv-author">by ${this.state.currentIllust?.userName}</div>
          </div>
          <button class="pixiv-close-btn">✕</button>
        </div>
        
        ${this.state.images.length > 1 ? `
          <div class="pixiv-bulk-download">
            <button class="pixiv-download-all-btn">
              全てダウンロード (${this.state.images.length}枚)
            </button>
          </div>
        ` : ''}
        
        <div class="pixiv-images-grid">
          ${imageItems}
        </div>
      </div>
    `;
  }

  private attachEventListeners() {
    if (!this.modal) return;

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.isOpen) {
        this.closeModal();
      }
    });

    // 画像クリックイベントリスナーを追加
    const imageWrappers = this.modal.querySelectorAll('.pixiv-image-wrapper');
    imageWrappers.forEach((wrapper, index) => {
      const url = wrapper.getAttribute('data-url');
      const safeTitle = (this.state.currentIllust?.title || 'untitled').replace(/[^\w\s-]/g, '').trim();
      
      if (url) {
        wrapper.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.downloadImage(url, `${safeTitle}_${index + 1}.png`);
        });
      }
    });

    // 閉じるボタンのイベントリスナー
    const closeButtons = this.modal.querySelectorAll('.pixiv-close-btn');
    closeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.closeModal();
      });
    });

    // 全てダウンロードボタンのイベントリスナー
    const downloadAllButtons = this.modal.querySelectorAll('.pixiv-download-all-btn');
    downloadAllButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.downloadAllImages();
      });
    });
  }

  
  
  async downloadImage(url: string, filename: string) {
    try {
      // background script経由でダウンロード
      const response = await chrome.runtime.sendMessage({
        type: 'DOWNLOAD_IMAGE',
        payload: {
          url: url,
          filename: filename
        }
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (error) {
      alert('ダウンロードに失敗しました');
    }
  }

  async downloadAllImages() {
    if (!this.state.currentIllust || !this.state.images.length) return;

    const folderName = `${this.state.currentIllust.id}_${this.state.currentIllust.title.replace(/[^\w\s-]/g, '')}`;
    
    for (let i = 0; i < this.state.images.length; i++) {
      const url = this.state.images[i];
      const filename = `${folderName}/${i + 1}.png`;
      await this.downloadImage(url, filename);
      
      // レートリミット対策
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}