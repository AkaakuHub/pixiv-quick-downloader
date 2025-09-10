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
    // ログアウト状態対応のセレクタ - img-master要素の親コンテナを探す
    const masterImages = Array.from(
      document.querySelectorAll('img[src*="img-master"][width][height]')
    ) as HTMLElement[];

    if (masterImages.length === 0) {
      return [];
    }

    // img-masterの親要素をコンテナとして使用
    const containers = masterImages
      .map(img => {
        let container = img.parentElement;
        // 適切なコンテナまで遡る
        while (
          container &&
          !container.classList.contains("sc-19z11m8-0") &&
          !container.querySelector('img[src*="img-master"]')
        ) {
          container = container.parentElement;
        }
        return container || img.parentElement;
      })
      .filter(Boolean) as HTMLElement[];

    // 重複を除去
    const uniqueContainers = Array.from(new Set(containers));

    // プレビューセクションを除外
    const filteredContainers = uniqueContainers.filter(
      container => !container.querySelector('[aria-label="プレビュー"]')
    );

    // コンテナにクラスを追加
    filteredContainers.forEach(el => el.classList.add("pixiv-detail-container"));

    return filteredContainers;
  }

  private getIllustId(element: HTMLElement): string | null {
    return this.urlParser.getIllustId(element);
  }
}
