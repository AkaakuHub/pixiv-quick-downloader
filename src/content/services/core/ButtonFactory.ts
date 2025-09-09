import { createDownloadSvg } from "./ContentStateManager";

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
    clickHandler: (filename: string) => void
  ): HTMLElement {
    console.log("ButtonFactory.createDetailPageDownloadButton called");

    const container = document.createElement("div");
    container.className = "pixiv-detail-download-container";
    console.log("Created container:", container);

    const button = this.createBaseButton(
      "pixiv-download-btn pixiv-detail-download-btn",
      "ダウンロード"
    );
    console.log("Created button:", button);

    const input = document.createElement("input");
    input.type = "text";
    input.className = "pixiv-filename-input pixiv-detail-filename-input";
    input.id = `pixiv-filename-input-${illustId}-${pageIndex}`;
    input.name = `pixiv-filename-${illustId}-${pageIndex}`;
    input.placeholder = "ファイル名を入力";
    input.title = "ファイル名を入力すると、設定より優先されます";
    console.log("Created input:", input);

    button.addEventListener("click", async e => {
      e.preventDefault();
      e.stopPropagation();
      const filename = input.value.trim();
      console.log("Button clicked, filename:", filename);
      clickHandler(filename);
    });

    container.appendChild(button);
    container.appendChild(input);
    console.log("Final container with children:", container);
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
