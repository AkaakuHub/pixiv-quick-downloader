import { createDownloadSvg } from "./ContentStateManager";
import { I18n } from "../../../i18n/i18n";

export interface IButtonFactory {
  createDownloadButton(illustId: string, clickHandler: () => void): HTMLElement;
  createDetailPageDownloadButton(
    imageUrl: string,
    illustId: string,
    pageIndex: number,
    clickHandler: (filename: string) => void
  ): HTMLElement;
}

export class ButtonFactory implements IButtonFactory {
  private i18n = I18n.getInstance();
  createDownloadButton(illustId: string, clickHandler: () => void): HTMLElement {
    const button = this.createBaseButton(
      "pixiv-download-btn pixiv-search-download-btn",
      "ダウンロード"
    );
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
    clickHandler: (filename: string) => void
  ): HTMLElement {
    const container = document.createElement("div");
    container.className = "pixiv-detail-download-container";
    const button = this.createBaseButton(
      "pixiv-download-btn pixiv-detail-download-btn",
      "ダウンロード"
    );
    const input = document.createElement("input");
    input.type = "text";
    input.className = "pixiv-filename-input pixiv-detail-filename-input";
    input.id = `pixiv-filename-input-${illustId}-${pageIndex}`;
    input.name = `pixiv-filename-${illustId}-${pageIndex}`;
    input.placeholder = `${this.i18n.t("filenamePlaceholder")}`;

    button.addEventListener("click", async e => {
      e.preventDefault();
      e.stopPropagation();
      const filename = input.value.trim();
      clickHandler(filename);
    });

    container.appendChild(button);
    container.appendChild(input);
    return container;
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
