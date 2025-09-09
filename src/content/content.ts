import { ExtendedWindow } from "../types";
import { ModalManager } from "./modal";
import { IPageDetector, PageDetector } from "./services/PageDetector";
import { IDomElementFinder, DomElementFinder } from "./services/DomElementFinder";
import { IUrlParser, UrlParser } from "./services/UrlParser";
import { IButtonFactory, ButtonFactory } from "./services/ButtonFactory";
import { IDomObserverManager, DomObserverManager } from "./services/DomObserverManager";
import { IDownloadHandler, DownloadHandler } from "./services/DownloadHandler";
import { IContentStateManager, ContentStateManager } from "./services/ContentStateManager";
import { IContentView, ContentView } from "./services/ContentView";
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
    // 各サービスを初期化
    this.modalManager = new ModalManager();
    this.pageDetector = new PageDetector();
    this.domFinder = new DomElementFinder();
    this.urlParser = new UrlParser();
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
    // ページタイプを検出
    const pathname = window.location.pathname;
    const pageType = this.pageDetector.detectPageType(pathname);
    this.stateManager.setPageType(pageType);

    // ページタイプに応じて初期化
    if (pageType === "detail") {
      // 何も
    } else if (pageType === "search") {
      this.contentView.addDownloadButtons();
    }

    // DOM監視を設定
    this.setupObservers();

    // グローバルに公開（モーダル内からの呼び出し用）
    (window as ExtendedWindow).modalManager = this.modalManager;

    this.stateManager.setIsInitialized(true);
  }

  private setupObservers(): void {
    // DOM変更監視
    this.observerManager.setupObserver(() => {
      const state = this.stateManager.getState();
      if (state.isDestroyed) return;

      // 遅延実行してDOMの完全な読み込みを待つ
      setTimeout(() => {
        if (this.stateManager.getState().isDestroyed) return;

        // 検索ページの場合のみ自動実行（詳細ページは「すべて見る」ボタンクリックで実行）
        if (this.stateManager.getState().currentPageType === "search") {
          this.contentView.addDownloadButtons();
        } else if (this.stateManager.getState().currentPageType === "detail") {
          // 何も
        }
      }, 500);
    });

    // 「すべて見る」ボタン監視
    this.observerManager.setupShowAllButtonObserver(() => {
      if (this.stateManager.getState().isDestroyed) return;

      // 詳細ページの場合のみ実行
      if (this.stateManager.getState().currentPageType === "detail") {
        this.contentView.addArtworkDetailButtons();
      }
    });
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

// ページ遷移時に再初期化
let lastUrl = location.href;

if (typeof MutationObserver !== "undefined") {
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;

      if (downloader) {
        downloader.destroy();
      }
      setTimeout(initExtension, 500);
    }
  }).observe(document, { subtree: true, childList: true });
}

// 設定変更通知を受信
chrome.runtime.onMessage.addListener(request => {
  if (request.type === "SETTINGS_CHANGED") {
    // モーダルマネージャーが存在する場合、設定を再読み込み
    if (downloader && downloader["modalManager"]) {
      downloader["modalManager"].loadSettings();
    }
  }
  return true;
});

// 初期化実行
initExtension();
