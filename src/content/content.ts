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
    // ページタイプを検出
    const pathname = window.location.pathname;
    const pageType = this.pageDetector.detectPageType(pathname);
    this.stateManager.setPageType(pageType);

    // ページタイプに応じて初期化
    if (pageType === "detail") {
      // 詳細ページは「すべて見る」ボタンクリック時にボタンを追加
    } else if (pageType === "search") {
      this.contentView.addDownloadButtons();
    }

    // DOM監視を設定
    this.setupObservers();

    // グローバルに公開（モーダル内からの呼び出し用）
    registerModalManager(this.modalManager);

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
          // 詳細ページは「すべて見る」ボタンクリック時に処理
        }
      }, 10); // イラストDOMが完全に追加されるまで少し待つ
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
