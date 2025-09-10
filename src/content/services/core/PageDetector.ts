export type PageType = "search" | "detail" | "unknown";

export interface IPageDetector {
  detectPageType(pathname: string): PageType;
}

export class PageDetector implements IPageDetector {
  detectPageType(pathname: string): PageType {
    if (/\/artworks\/\d+$/.test(pathname)) {
      return "detail";
    } else if (/\/tags\/.*\/artworks/.test(pathname) || /\/tags\/[^/]+$/.test(pathname)) {
      // tags/タグ名/artworks または tags/タグ名 の場合は検索ページとみなす
      return "search";
    } else {
      return "unknown";
    }
  }
}
