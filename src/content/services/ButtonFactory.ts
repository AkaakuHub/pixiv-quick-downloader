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
    const svg = this.createDownloadSvg();
    button.appendChild(svg);

    return button;
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
}
