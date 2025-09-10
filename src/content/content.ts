import { ModalManager } from "./modal";
import { IPageDetector, PageDetector } from "./services/core/PageDetector";
import { IDomElementFinder, DomElementFinder } from "./services/core/DomElementFinder";
import { IUrlParser, UrlParser } from "./services/core/UrlParser";
import { IButtonFactory, ButtonFactory } from "./services/core/ButtonFactory";
import { IDomObserverManager, DomObserverManager } from "./services/core/DomObserverManager";
import { IDownloadHandler, DownloadHandler } from "./services/core/DownloadHandler";
import { IContentStateManager, ContentStateManager } from "./services/core/ContentStateManager";
import { IContentView, ContentView } from "./services/core/ContentView";
import { registerModalManager } from "./services/core/ContentStateManager";
import "../styles/main.css";

export class PixivDownloader {
  private modalManager: ModalManager;
  private pageDetector: IPageDetector;
  private domFinder: IDomElementFinder;
  private urlParser: IUrlParser;
  private buttonFactory: IButtonFactory;
  private observerManager: IDomObserverManager;
  private downloadHandler: IDownloadHandler;
  private stateManager: IContentStateManager;
  private contentView: IContentView;

  constructor() {
    // 各サービスを初期化（依存性の順序を考慮）
    this.modalManager = new ModalManager();
    this.pageDetector = new PageDetector();
    this.urlParser = new UrlParser();
    this.domFinder = new DomElementFinder(this.urlParser);
    this.buttonFactory = new ButtonFactory();
    this.observerManager = new DomObserverManager();
    this.downloadHandler = new DownloadHandler(this.modalManager);
    this.stateManager = new ContentStateManager();
    this.contentView = new ContentView(
      this.buttonFactory,
      this.domFinder,
      this.urlParser,
      this.modalManager,
      this.downloadHandler
    );

    this.init();
  }

  private init(): void {
    console.log("[PixivDownloader] Initializing extension...");
    console.log("[PixivDownloader] Current URL:", window.location.href);

    // ページタイプを検出
    const pathname = window.location.pathname;
    const pageType = this.pageDetector.detectPageType(pathname);
    console.log("[PixivDownloader] Detected page type:", pageType);
    this.stateManager.setPageType(pageType);

    // ページタイプに応じて初期化
    if (pageType === "detail") {
      console.log("[PixivDownloader] Detail page detected - will wait for 'show all' button");
      // 詳細ページは「すべて見る」ボタンクリック時にボタンを追加
    } else if (pageType === "search") {
      console.log("[PixivDownloader] Search page detected - adding download buttons immediately");
      this.contentView.addDownloadButtons();
    }

    // DOM監視を設定
    console.log("[PixivDownloader] Setting up observers...");
    this.setupObservers();

    // グローバルに公開（モーダル内からの呼び出し用）
    registerModalManager(this.modalManager);

    this.stateManager.setIsInitialized(true);
    console.log("[PixivDownloader] Initialization complete");
  }

  private setupObservers(): void {
    console.log("[PixivDownloader] Setting up DOM observer...");
    // DOM変更監視
    this.observerManager.setupObserver(() => {
      const state = this.stateManager.getState();
      console.log(
        "[PixivDownloader] DOM observer callback triggered, isDestroyed:",
        state.isDestroyed
      );
      if (state.isDestroyed) return;

      // 遅延実行してDOMの完全な読み込みを待つ
      setTimeout(() => {
        if (this.stateManager.getState().isDestroyed) return;

        // 検索ページの場合のみ自動実行（詳細ページは「すべて見る」ボタンクリックで実行）
        if (this.stateManager.getState().currentPageType === "search") {
          console.log("[PixivDownloader] Adding download buttons for search page");
          this.contentView.addDownloadButtons();
        }
      }, 10); // イラストDOMが完全に追加されるまで少し待つ
    });

    console.log("[PixivDownloader] Setting up show-all button observer...");
    // 「すべて見る」ボタン監視（SPA対応で即時チェックを実行）
    this.observerManager.setupShowAllButtonObserver(() => {
      console.log("[PixivDownloader] Show-all button observer callback triggered");
      if (this.stateManager.getState().isDestroyed) return;

      // 詳細ページの場合のみ実行
      if (this.stateManager.getState().currentPageType === "detail") {
        console.log("[PixivDownloader] Adding artwork detail buttons for detail page");
        this.contentView.addArtworkDetailButtons();
      } else {
        console.log("[PixivDownloader] Not a detail page, skipping detail buttons");
      }
    });

    console.log("[PixivDownloader] Observers setup complete");
  }

  destroy(): void {
    // 破棄フラグを設定
    this.stateManager.setIsDestroyed(true);

    // オブザーバーを破棄
    this.observerManager.destroy();

    // ダウンロードボタンを削除
    this.contentView.removeAllButtons();

    // 状態をリセット
    this.stateManager.reset();
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

// SPA対策 - 多重防御アプローチ
let lastUrl = location.href;
let isProcessing = false;

// 1. History APIの監視
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;

window.history.pushState = (...args) => {
  const result = originalPushState.apply(window.history, args);
  checkUrlChange();
  return result;
};

window.history.replaceState = (...args) => {
  const result = originalReplaceState.apply(window.history, args);
  checkUrlChange();
  return result;
};

window.addEventListener("popstate", checkUrlChange);

// 2. headタグの監視
const headObserver = new MutationObserver(mutations => {
  // titleタグの変更やmetaタグの変更を検出
  const hasTitleChange = mutations.some(
    mutation =>
      mutation.target === document.querySelector("title") ||
      (mutation.target as HTMLElement).tagName === "TITLE"
  );

  if (hasTitleChange) {
    checkUrlChange();
  }
});

headObserver.observe(document.head, {
  childList: true,
  subtree: true,
  characterData: true,
});

// 3. 主要なコンテンツエリアの監視
const mainContentObserver = new MutationObserver(mutations => {
  // 主要なコンテンツ領域の変更を検出
  const hasSignificantChange = mutations.some(mutation => {
    // pixivのメインコンテンツエリアの変更を検出
    return Array.from(mutation.addedNodes).some(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        // 主要なコンテンツコンテナの変更
        return (
          element.querySelector?.('[data-testid="main-content"]') ||
          element.id?.includes("main") ||
          element.className?.includes("main")
        );
      }
      return false;
    });
  });

  if (hasSignificantChange) {
    setTimeout(checkUrlChange, 100);
  }
});

// メインコンテンツエリアを監視
const mainContent =
  document.querySelector("main") || document.querySelector('[role="main"]') || document.body;
mainContentObserver.observe(mainContent, {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true,
});

// 4. ナビゲーション完了を検出するための監視
let navigationTimer: ReturnType<typeof setTimeout> | null = null;

// 5. 追加の検出方法 - 特定のpixiv要素を監視
function checkForPixivElements() {
  // pixiv特有の要素が変更されたかチェック
  const currentArtworkId = extractArtworkId();
  if (currentArtworkId && currentArtworkId !== lastArtworkId) {
    console.log("[Pixiv Quick Downloader] Artwork ID changed:", currentArtworkId);
    checkUrlChange();
  }
}

// 作品IDを抽出する関数
function extractArtworkId(): string | null {
  const urlMatch = location.pathname.match(/\/artworks\/(\d+)/);
  if (urlMatch) return urlMatch[1];

  // URLから取得できない場合はDOMから取得
  const metaElement = document.querySelector('meta[property="og-url"]');
  if (metaElement) {
    const metaMatch = metaElement.getAttribute("content")?.match(/\/artworks\/(\d+)/);
    if (metaMatch) return metaMatch[1];
  }

  return null;
}

let lastArtworkId = extractArtworkId();

function checkUrlChange() {
  if (isProcessing) return;

  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    console.log("[Pixiv Quick Downloader] URL changed detected:", currentUrl);
    handleUrlChange(currentUrl);
  }
}

function handleUrlChange(currentUrl: string) {
  if (isProcessing || currentUrl === lastUrl) return;

  isProcessing = true;
  lastUrl = currentUrl;
  lastArtworkId = extractArtworkId();

  console.log("[Pixiv Quick Downloader] URL change detected:", currentUrl);
  console.log("[Pixiv Quick Downloader] Previous URL:", lastUrl);
  console.log("[Pixiv Quick Downloader] Extracted artwork ID:", lastArtworkId);

  // 前のダウンローダーを破棄
  if (downloader) {
    console.log("[Pixiv Quick Downloader] Destroying existing downloader...");
    downloader.destroy();
    downloader = null;
  }

  // ナビゲーションタイマーをクリア
  if (navigationTimer) {
    window.clearTimeout(navigationTimer);
    navigationTimer = null;
  }

  // DOMのクリーンアップ - 既存の要素を削除
  console.log("[Pixiv Quick Downloader] Cleaning up existing elements...");
  cleanupExistingElements();

  // 少し待ってから再初期化（DOMの完全な読み込みを待つ）
  console.log("[Pixiv Quick Downloader] Scheduling reinitialization in 300ms...");
  navigationTimer = window.setTimeout(() => {
    console.log("[Pixiv Quick Downloader] Reinitializing extension...");
    isProcessing = false;
    initExtension();
  }, 300); // 800msから300msに短縮して即時実行
}

// 既存の要素をクリーンアップする関数
function cleanupExistingElements() {
  console.log("[Pixiv Quick Downloader] Cleaning up existing elements...");

  // ダウンロードボタンを削除
  const existingButtons = document.querySelectorAll(".pixiv-download-btn");
  existingButtons.forEach(btn => btn.remove());

  // モーダルを削除
  const existingModals = document.querySelectorAll(".pixiv-download-modal");
  existingModals.forEach(modal => modal.remove());

  console.log("[Pixiv Quick Downloader] Cleanup completed");
}

// 6. 定期的な作品IDチェック（最終手段として）
window.setInterval(() => {
  checkForPixivElements();
}, 2000);

// 7. 初期ロード時のチェック
window.addEventListener("load", () => {
  window.setTimeout(checkUrlChange, 1000);
});

// 設定変更通知を受信
chrome.runtime.onMessage.addListener(request => {
  if (request.type === "SETTINGS_CHANGED") {
    // モーダルマネージャーが存在する場合、設定を再読み込み
    if (downloader && downloader["modalManager"]) {
      // モーダルマネージャーの設定再読み込みはサービス経由で行う
      downloader["modalManager"].getModalService().loadSettings();
    }
  }
  return true;
});

// 初期化実行
initExtension();
console.log("[Pixiv Quick Downloader] Script initialized");
