import { ModalManager } from "./modal";
import { ExtendedWindow } from "../types";
import "../styles/main.css";

export class PixivDownloader {
  public modalManager: ModalManager;
  private observer: MutationObserver | null = null;
  private currentPageType: "search" | "detail" | "unknown" = "unknown";
  private isDestroyed = false;
  private showAllClickHandler: ((event: Event) => void) | null = null;

  constructor() {
    console.log("[PixivDownloader] Initializing...");
    this.modalManager = new ModalManager();
    this.detectPageType();
    this.init();
  }

  private detectPageType() {
    const pathname = window.location.pathname;
    console.log("[PixivDownloader] Detecting page type for:", pathname);

    if (/\/artworks\/\d+$/.test(pathname)) {
      this.currentPageType = "detail";
      console.log("[PixivDownloader] Page type detected: DETAIL PAGE");
    } else if (/\/tags\/.*\/artworks/.test(pathname) || /\/search\.php/.test(pathname)) {
      this.currentPageType = "search";
      console.log("[PixivDownloader] Page type detected: SEARCH RESULTS PAGE");
    } else {
      this.currentPageType = "unknown";
      console.log("[PixivDownloader] Page type detected: UNKNOWN");
    }
  }

  private init() {
    console.log("[PixivDownloader] Initializing page with type:", this.currentPageType);

    // 詳細ページの場合は初期セットアップをスキップ（「すべて見る」ボタンクリック後に実行）
    if (this.currentPageType === "detail") {
      console.log("[PixivDownloader] Detail page detected - skipping initial button setup");
      console.log("[PixivDownloader] Buttons will be added after 'Show All' button click");
    } else if (this.currentPageType === "search") {
      console.log("[PixivDownloader] Starting search page button setup...");
      this.addDownloadButtons();
    } else {
      console.log("[PixivDownloader] Page type not supported, skipping button setup");
    }

    this.setupObserver();

    // グローバルに公開（モーダル内からの呼び出し用）
    (window as ExtendedWindow).modalManager = this.modalManager;
    console.log("[PixivDownloader] Modal manager registered globally");
  }

  private addArtworkDetailButtons() {
    console.log("[PixivDownloader] Adding detail page buttons...");

    const imageContainers = this.findDetailPageImageContainers();
    console.log("[PixivDownloader] Found image containers:", imageContainers.length);

    imageContainers.forEach((container, index) => {
      console.log(`[PixivDownloader] Processing container ${index + 1}/${imageContainers.length}`);

      if (container.querySelector(".pixiv-download-btn")) {
        console.log(`[PixivDownloader] Container ${index + 1} already has button, skipping`);
        return; // すでに追加済み
      }

      const originalImageLink = container.querySelector('a[href*="img-original"][target="_blank"]');
      if (!originalImageLink) {
        console.log(`[PixivDownloader] Container ${index + 1} no original image link found`);
        return;
      }

      const imageUrl = originalImageLink.getAttribute("href") || "";
      console.log(`[PixivDownloader] Container ${index + 1} image URL:`, imageUrl);

      const illustId = this.getIllustIdFromUrl(imageUrl);
      const pageIndex = this.getPageIndexFromUrl(imageUrl);

      console.log(
        `[PixivDownloader] Container ${index + 1} extracted - illustId: ${illustId}, pageIndex: ${pageIndex}`
      );

      if (!illustId || pageIndex === null) {
        console.log(`[PixivDownloader] Container ${index + 1} failed to extract required info`);
        return;
      }

      const button = this.createDetailPageDownloadButton(imageUrl, illustId, pageIndex);
      container.appendChild(button);
      console.log(`[PixivDownloader] Container ${index + 1} button added successfully`);
    });

    console.log("[PixivDownloader] Detail page button setup completed");
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

  private findDetailPageImageContainers(): HTMLElement[] {
    // 詳細ページ用の安定したセレクタ（確定要素のみを使用）
    const selectors = [
      'div[role="presentation"]:has(a[href*="img-original"][target="_blank"])', // 主要セレクタ
      'div[role="presentation"] a[href*="img-original"][target="_blank"]', // リンク直接検索
      'a[href*="img-original"][target="_blank"]', // 全体的な検索
    ];

    console.log("[PixivDownloader] Searching for detail page containers...");

    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      console.log(`[PixivDownloader] Trying selector ${i + 1}:`, selector);

      const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
      console.log(`[PixivDownloader] Selector ${i + 1} found:`, elements.length);

      if (elements.length > 0) {
        // コンテナを適切に抽出
        let containers: HTMLElement[] = [];

        if (selector.includes('a[href*="img-original"]')) {
          // リンク要素から親コンテナを取得
          const containerMap = new Map<HTMLElement, boolean>();

          elements.forEach(el => {
            // リンク要素の場合、その親のpresentationコンテナを探す
            const container = el.closest("div[role='presentation']");
            let finalContainer: HTMLElement | null = null;

            if (container) {
              // presentationコンテナが見つかった場合、カードコンテナかどうかを確認
              // カードコンテナはdiv[id]を持つ親要素を持つ
              const parentContainer = container.parentElement;
              const hasIdDiv = parentContainer && parentContainer.querySelector("div[id]");
              if (hasIdDiv && parentContainer) {
                // カードコンテナが見つかった場合、その親を使用
                finalContainer = parentContainer as HTMLElement;
              } else if (container.querySelector('a[href*="img-original"][target="_blank"]')) {
                // presentationコンテナ自体がimg-originalを含む場合
                finalContainer = container as HTMLElement;
              } else {
                // その他の場合はリンクの親要素を使用
                finalContainer = el.parentElement as HTMLElement;
              }
            } else {
              // presentationコンテナが見つからない場合、リンクの親要素を使用
              finalContainer = el.parentElement as HTMLElement;
            }

            // プレビューセクションを除外（aria-label="プレビュー"を持つコンテナをスキップ）
            if (finalContainer && finalContainer.querySelector('[aria-label="プレビュー"]')) {
              console.log(`[PixivDownloader] Skipping preview container`);
              return;
            }

            if (finalContainer && !containerMap.has(finalContainer)) {
              containerMap.set(finalContainer, true);
              containers.push(finalContainer);
            }
          });
        } else {
          // 直接コンテナ要素の場合
          containers = elements.filter(el => !el.querySelector('[aria-label="プレビュー"]'));
        }

        console.log(`[PixivDownloader] Final containers found:`, containers.length);

        // 各コンテナの情報をログ出力
        containers.forEach((container, index) => {
          const imageLink = container.querySelector('a[href*="img-original"][target="_blank"]');
          console.log(`[PixivDownloader] Container ${index + 1}:`, {
            hasImageLink: !!imageLink,
            imageUrl: imageLink?.getAttribute("href")?.substring(0, 50) + "...",
            hasIdDiv: !!container.querySelector("div[id]"),
            hasPreview: !!container.querySelector('[aria-label="プレビュー"]'),
            containerHTML: container.outerHTML.substring(0, 100) + "...",
          });
        });

        // コンテナにクラスを追加
        containers.forEach(el => el.classList.add("pixiv-detail-container"));
        console.log("[PixivDownloader] Added 'pixiv-detail-container' class to all containers");

        return containers;
      }
    }

    console.log("[PixivDownloader] No detail page containers found with any selector");
    return [];
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

  private getIllustIdFromUrl(url: string): string | null {
    // URLからイラストIDを抽出
    console.log("[PixivDownloader] Extracting illustId from URL:", url);
    const urlMatch = url.match(/\/(\d+)_p\d+\./);
    if (urlMatch) {
      console.log("[PixivDownloader] Successfully extracted illustId:", urlMatch[1]);
      return urlMatch[1];
    }

    console.warn("[PixivDownloader] Failed to extract illustId from URL");
    return null;
  }

  private getPageIndexFromUrl(url: string): number | null {
    // URLからページインデックスを抽出 (_p0, _p1, etc.)
    console.log("[PixivDownloader] Extracting pageIndex from URL:", url);
    const pageMatch = url.match(/_p(\d+)\./);
    if (pageMatch) {
      const pageIndex = parseInt(pageMatch[1], 10);
      console.log("[PixivDownloader] Successfully extracted pageIndex:", pageIndex);
      return pageIndex;
    }

    console.warn("[PixivDownloader] Failed to extract pageIndex from URL");
    return null;
  }

  private getIllustId(element: HTMLElement): string | null {
    // hrefからIDを抽出
    const href = element.getAttribute("href") || "";
    const hrefMatch = href.match(/\/artworks\/(\d+)/);
    if (hrefMatch) return hrefMatch[1];

    console.warn("Failed to extract illustId from element");

    return null;
  }

  private createDownloadSvg(): HTMLElement {
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

  private createBaseButton(className: string, title: string): HTMLElement {
    const button = document.createElement("div");
    button.className = className;
    button.title = title;

    // 共通SVGを使用
    const svg = this.createDownloadSvg();
    button.appendChild(svg);

    return button;
  }

  private createDetailPageDownloadButton(
    imageUrl: string,
    illustId: string,
    pageIndex: number
  ): HTMLElement {
    console.log(
      `[PixivDownloader] Creating detail page button for illust ${illustId}, page ${pageIndex}`
    );

    const button = this.createBaseButton(
      "pixiv-download-btn pixiv-detail-download-btn",
      "ダウンロード"
    );

    button.addEventListener("click", async e => {
      console.log(
        `[PixivDownloader] Detail page button clicked for illust ${illustId}, page ${pageIndex}`
      );
      e.preventDefault();
      e.stopPropagation();

      // モーダルマネージャーをグローバルに登録
      (window as ExtendedWindow).modalManager = this.modalManager;

      // 直接ダウンロード処理を呼び出し
      await this.downloadDetailPageImage(imageUrl, illustId, pageIndex);
    });

    console.log(
      `[PixivDownloader] Detail page button created successfully for illust ${illustId}, page ${pageIndex}`
    );
    return button;
  }

  private createDownloadButton(illustId: string): HTMLElement {
    const button = this.createBaseButton("pixiv-download-btn", "ダウンロード");

    button.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      // モーダルマネージャーをグローバルに登録してから開く
      (window as ExtendedWindow).modalManager = this.modalManager;
      this.modalManager.openModal(illustId);
    });

    return button;
  }

  private async downloadDetailPageImage(imageUrl: string, illustId: string, pageIndex: number) {
    console.log(`[PixivDownloader] Starting download for illust ${illustId}, page ${pageIndex}`);
    console.log(`[PixivDownloader] Image URL: ${imageUrl}`);

    try {
      // ModalServiceを利用してダウンロード処理を実行
      const modalService = this.modalManager.getModalService();
      console.log("[PixivDownloader] ModalService obtained");

      // イラスト情報を取得
      console.log("[PixivDownloader] Fetching illust information...");
      const illustInfo = await modalService.fetchIllustData(illustId);
      console.log("[PixivDownloader] Illust info fetched successfully:", {
        title: illustInfo.illustInfo.title,
        userName: illustInfo.illustInfo.userName,
        pageCount: illustInfo.images.length,
      });

      // ファイル名を生成
      console.log("[PixivDownloader] Generating filename...");
      const filename = modalService.generateFilename(
        illustInfo.illustInfo.title,
        illustInfo.illustInfo.userName,
        illustId,
        pageIndex
      );
      console.log("[PixivDownloader] Generated filename:", filename);

      // ダウンロードを実行
      console.log("[PixivDownloader] Starting image download...");
      await modalService.downloadImage(imageUrl, filename, illustId);
      console.log(
        `[PixivDownloader] Download completed successfully for illust ${illustId}, page ${pageIndex}`
      );
    } catch (error) {
      console.error(
        `[PixivDownloader] Download failed for illust ${illustId}, page ${pageIndex}:`,
        error
      );
      alert("ダウンロードに失敗しました");
    }
  }

  private setupObserver() {
    console.log("[PixivDownloader] Setting up DOM observer...");

    // DOMの変更を監視して、新しいカードにボタンを追加
    this.observer = new MutationObserver(mutations => {
      if (this.isDestroyed) return;

      let needsUpdate = false;
      let addedNodesCount = 0;

      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            needsUpdate = true;
            addedNodesCount++;
          }
        });
      });

      if (needsUpdate) {
        console.log(`[PixivDownloader] DOM mutation detected: ${addedNodesCount} new nodes added`);
        console.log(`[PixivDownloader] Current page type: ${this.currentPageType}`);

        // 遅延実行してDOMの完全な読み込みを待つ
        setTimeout(() => {
          if (this.isDestroyed) return;

          // 検索ページの場合のみ自動実行（詳細ページは「すべて見る」ボタンクリックで実行）
          if (this.currentPageType === "search") {
            console.log("[PixivDownloader] Triggering search page button update (delayed)...");
            this.addDownloadButtons();
          } else if (this.currentPageType === "detail") {
            console.log(
              "[PixivDownloader] Detail page mutation detected - waiting for 'Show All' button click"
            );
            // 詳細ページでは「すべて見る」ボタンクリックまで待機
          }
        }, 500); // 500ms遅延
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log("[PixivDownloader] DOM observer setup completed");

    // 「すべて見る」ボタンのクリックを監視
    this.setupShowAllButtonObserver();
  }

  private setupShowAllButtonObserver() {
    console.log("[PixivDownloader] Setting up 'Show All' button observer...");

    // 「すべて見る」ボタンのクリックイベントを監視
    const handleShowAllClick = (event: Event) => {
      if (this.isDestroyed) return;

      const target = event.target as HTMLElement;

      // ボタンまたはその子要素がクリックされたかチェック
      const showAllButton = target.closest("button") as HTMLElement;
      if (showAllButton && showAllButton.textContent?.trim().includes("すべて見る")) {
        console.log("[PixivDownloader] 'Show All' button clicked!");
        console.log("[PixivDownloader] Button text:", showAllButton.textContent?.trim());

        // 遅延実行して画像の完全な読み込みを待つ
        setTimeout(() => {
          if (this.isDestroyed) return;

          console.log(
            "[PixivDownloader] Executing delayed update after 'Show All' button click..."
          );

          // 詳細ページの場合のみ実行
          if (this.currentPageType === "detail") {
            console.log("[PixivDownloader] Processing detail page after 'Show All' click...");
            this.addArtworkDetailButtons();
          }
        }, 1500); // 1.5秒遅延でDOM再生成に対応
      }
    };

    document.addEventListener("click", handleShowAllClick, true); // キャプチャフェーズでイベントを監視

    // 破棄時にイベントリスナーを削除できるように保持
    this.showAllClickHandler = handleShowAllClick;

    console.log("[PixivDownloader] 'Show All' button observer setup completed");
  }

  destroy() {
    console.log("[PixivDownloader] Destroying instance...");

    // 破棄フラグを設定
    this.isDestroyed = true;

    if (this.observer) {
      console.log("[PixivDownloader] Disconnecting DOM observer...");
      this.observer.disconnect();
      this.observer = null;
    }

    // 'Show All' button observerのクリーンアップ
    console.log("[PixivDownloader] Cleaning up event listeners...");
    const handler = this.showAllClickHandler;
    if (handler) {
      document.removeEventListener("click", handler, true);
      console.log("[PixivDownloader] 'Show All' button event listener removed");
      this.showAllClickHandler = null;
    }

    // ダウンロードボタンを削除
    const buttonsToRemove = document.querySelectorAll(".pixiv-download-btn");
    console.log(`[PixivDownloader] Removing ${buttonsToRemove.length} download buttons...`);
    buttonsToRemove.forEach(btn => btn.remove());

    console.log("[PixivDownloader] Instance destroyed successfully");
  }
}

// 拡張機能の初期化
let downloader: PixivDownloader | null = null;

function initExtension() {
  console.log("[PixivDownloader] Initializing extension...");
  console.log("[PixivDownloader] Document readyState:", document.readyState);

  if (document.readyState === "loading") {
    console.log("[PixivDownloader] Waiting for DOMContentLoaded...");
    document.addEventListener("DOMContentLoaded", () => {
      console.log("[PixivDownloader] DOM loaded, creating downloader instance...");
      downloader = new PixivDownloader();
    });
  } else {
    console.log("[PixivDownloader] DOM already loaded, creating downloader instance...");
    downloader = new PixivDownloader();
  }
}

// ページ遷移時に再初期化
let lastUrl = location.href;
console.log("[PixivDownloader] Setting up page navigation observer...");
console.log("[PixivDownloader] Initial URL:", lastUrl);

if (typeof MutationObserver !== "undefined") {
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      console.log("[PixivDownloader] Page navigation detected!");
      console.log("[PixivDownloader] Old URL:", lastUrl);
      console.log("[PixivDownloader] New URL:", location.href);

      lastUrl = location.href;

      if (downloader) {
        console.log("[PixivDownloader] Destroying existing downloader instance...");
        downloader.destroy();
      }

      console.log("[PixivDownloader] Reinitializing extension after navigation...");
      setTimeout(initExtension, 500);
    }
  }).observe(document, { subtree: true, childList: true });

  console.log("[PixivDownloader] Page navigation observer setup completed");
} else {
  console.log("[PixivDownloader] MutationObserver not available, skipping navigation observer");
}

// 設定変更通知を受信
chrome.runtime.onMessage.addListener(request => {
  if (request.type === "SETTINGS_CHANGED") {
    console.log("[PixivDownloader] Settings change notification received");
    // モーダルマネージャーが存在する場合、設定を再読み込み
    if (downloader && downloader.modalManager) {
      console.log("[PixivDownloader] Reloading modal manager settings...");
      downloader.modalManager.loadSettings();
    } else {
      console.log("[PixivDownloader] No downloader or modal manager found for settings reload");
    }
  }
  return true;
});

// 初期化実行
console.log("[PixivDownloader] Starting extension initialization...");
initExtension();
console.log("[PixivDownloader] Extension initialization script loaded");
