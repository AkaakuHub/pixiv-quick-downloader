import { IUrlParser } from "./UrlParser";

export interface IDomElementFinder {
  findIllustCards(): HTMLElement[];
  findDetailPageImageContainers(): HTMLElement[];
}

export class DomElementFinder implements IDomElementFinder {
  constructor(private urlParser: IUrlParser) {}

  findIllustCards(): HTMLElement[] {
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

  findDetailPageImageContainers(): HTMLElement[] {
    // 詳細ページ用の安定したセレクタ（確定要素のみを使用）
    const selector = 'div[role="presentation"]:has(a[href*="img-original"][target="_blank"])';
    const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    if (elements.length > 0) {
      // コンテナを適切に抽出
      let containers: HTMLElement[] = [];

      if (selector.includes('a[href*="img-original"]')) {
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

      // コンテナにクラスを追加
      containers.forEach(el => el.classList.add("pixiv-detail-container"));

      return containers;
    }
    return [];
  }

  private getIllustId(element: HTMLElement): string | null {
    return this.urlParser.getIllustId(element);
  }
}
