import { IButtonFactory } from "./ButtonFactory";
import { IDomElementFinder } from "./DomElementFinder";
import { IUrlParser } from "./UrlParser";
import { IDownloadHandler } from "./DownloadHandler";
import { ModalManager } from "../../modal";
import { registerModalManager } from "./ContentStateManager";

export interface IContentView {
  addDownloadButtons(): void;
  addArtworkDetailButtons(): void;
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
      // 親要素を辿ってDOM構造をログ
      let parent = container.parentElement;
      let depth = 0;
      while (parent && depth < 5) {
        parent = parent.parentElement;
        depth++;
      }

      if (container.querySelector(".pixiv-detail-download-container")) {
        return; // すでに追加済み
      }

      // ログアウト状態でも通用するセレクタ
      const masterImageLink = document.querySelector('img[src*="img-master"][width][height]');
      if (!masterImageLink) {
        return;
      }

      // ログアウト状態ではsrc属性からURLを取得
      let imageUrl =
        masterImageLink.getAttribute("src") || masterImageLink.getAttribute("href") || "";
      imageUrl = imageUrl.replace("img-master", "img-original").replace(/_master\d+\./, ".");

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
