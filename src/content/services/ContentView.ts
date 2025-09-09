import { ExtendedWindow } from "../../types";
import { IButtonFactory } from "./ButtonFactory";
import { IDomElementFinder } from "./DomElementFinder";
import { IUrlParser } from "./UrlParser";
import { ModalManager } from "../modal";
import { IDownloadHandler } from "./DownloadHandler";

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
        (window as ExtendedWindow).modalManager = this.modalManager;
        this.modalManager.openModal(illustId);
      });
      card.appendChild(button);
    });
  }

  addArtworkDetailButtons(): void {
    const imageContainers = this.domFinder.findDetailPageImageContainers();
    imageContainers.forEach(container => {
      if (container.querySelector(".pixiv-download-btn")) {
        return; // すでに追加済み
      }

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
        () => this.handleDetailPageDownload(imageUrl, illustId, pageIndex)
      );
      container.appendChild(button);
    });
  }

  removeAllButtons(): void {
    const buttonsToRemove = document.querySelectorAll(".pixiv-download-btn");
    buttonsToRemove.forEach(btn => btn.remove());
  }

  private handleDetailPageDownload(imageUrl: string, illustId: string, pageIndex: number): void {
    // モーダルマネージャーをグローバルに登録
    (window as ExtendedWindow).modalManager = this.modalManager;

    // 直接ダウンロード処理を呼び出し
    this.downloadHandler.downloadDetailPageImage(imageUrl, illustId, pageIndex);
  }
}
