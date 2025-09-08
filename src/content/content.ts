import { ModalManager } from "./modal";
import { ExtendedWindow } from "../types";
import "../styles/main.css";

export class PixivDownloader {
  public modalManager: ModalManager;
  private observer: MutationObserver | null = null;

  constructor() {
    this.modalManager = new ModalManager();
    this.init();
  }

  private init() {
    this.addDownloadButtons();
    this.setupObserver();

    // グローバルに公開（モーダル内からの呼び出し用）
    (window as ExtendedWindow).modalManager = this.modalManager;
  }

  private addDownloadButtons() {
    const illustCards = this.findIllustCards();

    illustCards.forEach(card => {
      if (card.querySelector(".pixiv-download-btn")) return; // すでに追加済み

      const illustId = this.getIllustId(card);
      if (!illustId) return;

      const button = this.createDownloadButton(illustId);
      card.appendChild(button);
    });
  }

  private findIllustCards(): HTMLElement[] {
    // 正しいセレクタを決め打ち
    const selector = '[href*="/artworks/"]';
    const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];

    const filtered = elements.filter(el => this.getIllustId(el));
    if (filtered.length > 0) {
      // カードにクラスを追加してホバー効果を適用
      filtered.forEach(el => el.classList.add("pixiv-card"));
      return filtered;
    }

    return [];
  }

  private getIllustId(element: HTMLElement): string | null {
    // hrefからIDを抽出
    const href = element.getAttribute("href") || "";
    const hrefMatch = href.match(/\/artworks\/(\d+)/);
    if (hrefMatch) return hrefMatch[1];

    console.warn("Failed to extract illustId from element");

    return null;
  }

  private createDownloadButton(illustId: string): HTMLElement {
    const button = document.createElement("div");
    button.className = "pixiv-download-btn";
    button.title = "ダウンロード";

    // SVGアイコンを作成
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 128 128");
    svg.innerHTML = `
      <rect width="128" height="128" fill="#0096fa" rx="16"/>
      <path d="M64 32 L64 96 M32 64 L96 64" stroke="white" stroke-width="12" stroke-linecap="round"/>
      <circle cx="64" cy="64" r="40" fill="none" stroke="white" stroke-width="8" stroke-dasharray="4 8"/>
    `;

    button.appendChild(svg);

    button.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      // モーダルマネージャーをグローバルに登録してから開く
      (window as ExtendedWindow).modalManager = this.modalManager;
      this.modalManager.openModal(illustId);
    });

    return button;
  }

  private setupObserver() {
    // DOMの変更を監視して、新しいカードにボタンを追加
    this.observer = new MutationObserver(mutations => {
      let needsUpdate = false;

      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            needsUpdate = true;
          }
        });
      });

      if (needsUpdate) {
        this.addDownloadButtons();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // ダウンロードボタンを削除
    document.querySelectorAll(".pixiv-download-btn").forEach(btn => btn.remove());
  }
}

// 拡張機能の初期化
let downloader: PixivDownloader | null = null;

function initExtension() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      downloader = new PixivDownloader();
    });
  } else {
    downloader = new PixivDownloader();
  }
}

// ページ遷移時に再初期化
let lastUrl = location.href;
if (typeof MutationObserver !== "undefined") {
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (downloader) {
        downloader.destroy();
      }
      setTimeout(initExtension, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
}

// 設定変更通知を受信
chrome.runtime.onMessage.addListener(request => {
  if (request.type === "SETTINGS_CHANGED") {
    // モーダルマネージャーが存在する場合、設定を再読み込み
    if (downloader && downloader.modalManager) {
      downloader.modalManager.loadSettings();
    }
  }
  return true;
});

// 初期化実行
initExtension();
