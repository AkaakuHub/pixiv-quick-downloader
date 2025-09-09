export type PageType = "search" | "detail" | "unknown";

export interface IPageDetector {
  detectPageType(pathname: string): PageType;
}

export class PageDetector implements IPageDetector {
  detectPageType(pathname: string): PageType {
    if (/\/artworks\/\d+$/.test(pathname)) {
      return "detail";
    } else if (/\/tags\/.*\/artworks/.test(pathname) || /\/search\.php/.test(pathname)) {
      return "search";
    } else {
      return "unknown";
    }
  }
}
