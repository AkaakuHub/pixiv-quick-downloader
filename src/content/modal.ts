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
        <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; max-width: 90vw; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
          <div style="text-align: center; padding: 40px; color: #fff;">
            <div>読み込み中...</div>
          </div>
        </div>
      `;
    }

    if (this.state.error) {
      return `
        <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; max-width: 90vw; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
          <div style="text-align: center; padding: 40px; color: #ff6b6b;">
            <div>エラー: ${this.state.error}</div>
            <button onclick="modalManager.closeModal()" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; padding: 8px; border-radius: 50%; transition: background 0.2s;">閉じる</button>
          </div>
        </div>
      `;
    }

    const imageItems = this.state.images.map((url, index) => {
      // プレビュー用のサムネイルURLを生成
      const thumbnailUrl = url.replace('img-original', 'img-master').replace('.png', '_master1200.jpg');
      return `
      <div style="background: #2a2a2a; border-radius: 8px; overflow: hidden; transition: transform 0.2s;">
        <div class="pixiv-image-preview-container" data-url="${url}" data-index="${index}">
          <img 
            src="${thumbnailUrl}" 
            alt="Page ${index + 1}"
            style="width: 100%; height: 200px; object-fit: cover; cursor: pointer;"
            onerror="this.parentElement.innerHTML='<div style=\\'color: #ff6b6b; text-align: center; padding: 20px;\\'>プレビュー不可</div>'"
          >
        </div>
        <div style="padding: 12px; color: #fff; font-size: 12px; text-align: center;">
          <div>ページ ${index + 1} / ${this.state.images.length}</div>
          <button onclick="modalManager.downloadImage('${url}', '${this.state.currentIllust?.title}_${index + 1}.png')" style="background: #0096fa; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; width: 100%; margin-top: 8px; transition: background 0.2s;">
            ダウンロード
          </button>
        </div>
      </div>
    `;
    }).join('');

    return `
      <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; max-width: 90vw; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #333;">
          <div>
            <h2 style="color: #fff; font-size: 20px; font-weight: bold; margin: 0;">${this.state.currentIllust?.title}</h2>
            <div style="color: #999; font-size: 14px; margin-top: 4px;">by ${this.state.currentIllust?.userName}</div>
          </div>
          <button onclick="modalManager.closeModal()" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; padding: 8px; border-radius: 50%; transition: background 0.2s;">×</button>
        </div>
        
        ${this.state.images.length > 1 ? `
          <button onclick="modalManager.downloadAllImages()" style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 20px 0; width: 100%; transition: background 0.2s;">
            全てダウンロード (${this.state.images.length}枚)
          </button>
        ` : ''}
        
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 20px;">
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

    // 画像の遅延読み込み
    this.loadImages();
  }

  private async loadImages() {
    const previewElements = this.modal?.querySelectorAll('.pixiv-image-preview-container');
    if (!previewElements) return;

    for (const element of previewElements) {
      const url = element.getAttribute('data-url');
      const index = element.getAttribute('data-index');
      
      if (url && index) {
        try {
          // プレビューにも原寸大画像を使用
          const originalUrl = url;
          
          // background script経由で画像を取得（declarativeNetRequestがRefererを設定）
          const response = await chrome.runtime.sendMessage({
            type: 'FETCH_IMAGE',
            payload: {
              url: originalUrl,
              referer: `https://www.pixiv.net/artworks/${this.state.currentIllust?.id}`
            }
          });

          if (response.success) {
            const img = document.createElement('img');
            img.src = response.data;
            img.alt = `Page ${parseInt(index) + 1}`;
            img.className = 'w-full h-40 sm:h-48 md:h-56 object-cover cursor-pointer hover:brightness-110 transition-all duration-200';
            img.onclick = async () => {
          try {
            // ファイル名を安全な文字列に変換
            const safeTitle = (this.state.currentIllust?.title || 'untitled').replace(/[^\w\s-]/g, '').trim();
            await this.downloadImage(url, `${safeTitle}_${parseInt(index) + 1}.png`);
          } catch (error) {
            // Download failed
          }
        };
            
            element.innerHTML = '';
            element.appendChild(img);
            
          } else {
            throw new Error(response.error);
          }
        } catch (error) {
          if (element) {
            element.innerHTML = '<div class="pixiv-error text-red-400 text-sm py-2 px-3 bg-red-900/30 rounded">画像の読み込みに失敗しました</div>';
          }
        }
      }
    }
  }

  private findExistingImage(originalUrl: string): HTMLImageElement | null {
    // ページ内から同じ画像を探す
    const images = document.querySelectorAll('img');
    for (const img of images) {
      const imgSrc = img.src;
      // オリジナルURLから抽出できるIDで照合
      const urlMatch = originalUrl.match(/(\d+)_p(\d+)/);
      if (urlMatch) {
        const [, illustId, pageIndex] = urlMatch;
        if (imgSrc.includes(illustId) && imgSrc.includes(`_p${pageIndex}`)) {
          return img as HTMLImageElement;
        }
      }
    }
    return null;
  }

  private async fetchImageWithReferer(url: string): Promise<string> {
    try {
      // マスターサイズのURLに変換
      const masterUrl = url.replace('img-original', 'img-master').replace('.png', '_master1200.jpg');
      const referer = `https://www.pixiv.net/artworks/${this.state.currentIllust?.id}`;

      const response = await fetch(masterUrl, {
        headers: {
          'Referer': referer,
          'User-Agent': navigator.userAgent
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      throw error;
    }
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