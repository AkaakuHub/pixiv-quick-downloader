import { IIllustInfoSelector } from "../selectors/IllustInfoSelector/IIllustInfoSelector";
import { SearchPageSelector } from "../selectors/IllustInfoSelector/SearchPageSelector";
import { DetailPageSelector } from "../selectors/IllustInfoSelector/DetailPageSelector";
import { IPageDetector, PageType } from "../core/PageDetector";

export interface ISelectorFactory {
  createSelector(pageType: PageType): IIllustInfoSelector;
  createSelectorFromCurrentPage(): IIllustInfoSelector;
}

export class SelectorFactory implements ISelectorFactory {
  constructor(private pageDetector: IPageDetector) {}

  createSelector(pageType: PageType): IIllustInfoSelector {
    switch (pageType) {
      case "search":
        return new SearchPageSelector();
      case "detail":
        return new DetailPageSelector();
      default:
        // デフォルトは検索ページ用のセレクタ
        return new SearchPageSelector();
    }
  }

  createSelectorFromCurrentPage(): IIllustInfoSelector {
    const pathname = window.location.pathname;
    const pageType = this.pageDetector.detectPageType(pathname);
    return this.createSelector(pageType);
  }
}
