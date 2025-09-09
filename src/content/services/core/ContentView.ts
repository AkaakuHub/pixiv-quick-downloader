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
    console.log("addArtworkDetailButtons called");
    const imageContainers = this.domFinder.findDetailPageImageContainers();
    console.log("Found imageContainers:", imageContainers.length);

    imageContainers.forEach((container, index) => {
      console.log(`Processing container ${index}:`, container);

      if (container.querySelector(".pixiv-detail-download-container")) {
        console.log("Container already has detail download container, skipping");
        return; // すでに追加済み
      }

      const originalImageLink = container.querySelector('a[href*="img-original"][target="_blank"]');
      console.log("Found originalImageLink:", !!originalImageLink);

      if (!originalImageLink) {
        console.log("No original image link found, skipping container");
        return;
      }

      const imageUrl = originalImageLink.getAttribute("href") || "";
      console.log("Image URL:", imageUrl);

      const illustId = this.urlParser.getIllustIdFromUrl(imageUrl);
      const pageIndex = this.urlParser.getPageIndexFromUrl(imageUrl);
      console.log("Illust ID:", illustId, "Page index:", pageIndex);

      if (!illustId || pageIndex === null) {
        console.log("Invalid illust ID or page index, skipping");
        return;
      }

      const button = this.buttonFactory.createDetailPageDownloadButton(
        imageUrl,
        illustId,
        pageIndex,
        (filename: string) => this.handleDetailPageDownload(imageUrl, illustId, pageIndex, filename)
      );
      console.log("Created button:", button);
      container.appendChild(button);
      console.log("Button appended to container");
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
