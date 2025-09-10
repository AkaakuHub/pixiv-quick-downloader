import { IButtonFactory } from "./ButtonFactory";
import { IDomElementFinder } from "./DomElementFinder";
import { IUrlParser } from "./UrlParser";
import { IDownloadHandler } from "./DownloadHandler";
import { ModalManager } from "../../modal";
import { registerModalManager } from "./ContentStateManager";

export interface IContentView {
  addDownloadButtons(): void;
  addArtworkDetailButtons(): void;
  addLoggedOutLabel(): void;
  removeAllButtons(): void;
}

export class ContentView implements IContentView {
  constructor(
    private buttonFactory: IButtonFactory,
    private domFinder: IDomElementFinder,
    private urlParser: IUrlParser,
    private modalManager: ModalManager,
    private downloadHandler: IDownloadHandler
  ) {}

  addDownloadButtons(): void {
    const illustCards = this.domFinder.findIllustCards();

    illustCards.forEach(card => {
      if (card.querySelector(".pixiv-download-btn")) return; // すでに追加済み

      const illustId = this.urlParser.getIllustId(card);
      if (!illustId) return;

      const button = this.buttonFactory.createDownloadButton(illustId, () => {
        // モーダルマネージャーをグローバルに登録してから開く
        registerModalManager(this.modalManager);
        this.modalManager.openModal(illustId);
      });
      card.appendChild(button);
    });
  }

  addArtworkDetailButtons(): void {
    const imageContainers = this.domFinder.findDetailPageImageContainers();
    imageContainers.forEach(container => {
      // SPA対策: 既存のダウンロード要素を完全に削除
      const existingContainer = container.querySelector(".pixiv-detail-download-container");
      if (existingContainer) {
        existingContainer.remove();
      }

      // SPA対策: 複数の要素が残っている場合も削除
      const existingButtons = container.querySelectorAll(
        ".pixiv-detail-download-btn, .pixiv-detail-filename-input"
      );
      existingButtons.forEach(btn => btn.remove());

      const originalImageLink = container.querySelector('a[href*="img-original"][target="_blank"]');
      if (!originalImageLink) {
        return;
      }

      const imageUrl = originalImageLink.getAttribute("href") || "";

      const illustId = this.urlParser.getIllustIdFromUrl(imageUrl);
      const pageIndex = this.urlParser.getPageIndexFromUrl(imageUrl);

      if (!illustId || pageIndex === null) {
        return;
      }

      const button = this.buttonFactory.createDetailPageDownloadButton(
        imageUrl,
        illustId,
        pageIndex,
        (filename: string) => this.handleDetailPageDownload(imageUrl, illustId, pageIndex, filename)
      );
      container.appendChild(button);
    });
  }

  // ログイン状態チェック
  private checkIsLoggedIn(): boolean {
    // ログアウト状態の判定: 「アカウントを作成」ボタンが存在するか
    const buttons = document.querySelectorAll("button.charcoal-button");
    for (const button of Array.from(buttons)) {
      if (button.textContent?.trim() === "アカウントを作成") {
        return true; // ログアウト状態
      }
    }
    return false; // ログイン状態
  }

  addLoggedOutLabel(): void {
    const isLoggedIn = !this.checkIsLoggedIn();
    if (!isLoggedIn) {
      const signupElements = document.querySelectorAll('a[href*="/signup.php"]');
      const loggedOutSelector = signupElements[1]?.parentElement?.parentElement;
      if (loggedOutSelector) {
        const loggedOutContainer = loggedOutSelector as HTMLElement;
        if (loggedOutContainer.querySelector(".pixiv-logged-out-label")) {
          return; // すでに追加済み
        }
        const messageDiv = document.createElement("div");
        messageDiv.className = "pixiv-logged-out-label";
        messageDiv.textContent =
          "[Pixiv Quick Downloader] パフォーマンス問題のためログアウト状態では使用できません。ログインしてください。";
        loggedOutContainer.appendChild(messageDiv);
      }
    }
  }

  removeAllButtons(): void {
    const buttonsToRemove = document.querySelectorAll(".pixiv-download-btn");
    buttonsToRemove.forEach(btn => btn.remove());
  }

  private handleDetailPageDownload(
    imageUrl: string,
    illustId: string,
    pageIndex: number,
    filename?: string
  ): void {
    // モーダルマネージャーをグローバルに登録
    registerModalManager(this.modalManager);

    // 直接ダウンロード処理を呼び出し
    this.downloadHandler.downloadDetailPageImage(imageUrl, illustId, pageIndex, filename);
  }
}
