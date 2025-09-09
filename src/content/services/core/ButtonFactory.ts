import { createDownloadSvg } from "./ContentStateManager";

export interface IButtonFactory {
  createDownloadButton(illustId: string, clickHandler: () => void): HTMLElement;
  createDetailPageDownloadButton(
    imageUrl: string,
    illustId: string,
    pageIndex: number,
    clickHandler: () => void
  ): HTMLElement;
}

export class ButtonFactory implements IButtonFactory {
  createDownloadButton(illustId: string, clickHandler: () => void): HTMLElement {
    const button = this.createBaseButton("pixiv-download-btn", "ダウンロード");
    button.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      clickHandler();
    });
    return button;
  }

  createDetailPageDownloadButton(
    imageUrl: string,
    illustId: string,
    pageIndex: number,
    clickHandler: () => void
  ): HTMLElement {
    const button = this.createBaseButton(
      "pixiv-download-btn pixiv-detail-download-btn",
      "ダウンロード"
    );

    button.addEventListener("click", async e => {
      e.preventDefault();
      e.stopPropagation();
      clickHandler();
    });
    return button;
  }

  private createBaseButton(className: string, title: string): HTMLElement {
    const button = document.createElement("div");
    button.className = className;
    button.title = title;

    // 共通SVGを使用
    const svg = createDownloadSvg();
    button.appendChild(svg);

    return button;
  }
}
