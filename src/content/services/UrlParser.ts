export interface IUrlParser {
  getIllustIdFromUrl(url: string): string | null;
  getPageIndexFromUrl(url: string): number | null;
  getIllustId(element: HTMLElement): string | null;
}

export class UrlParser implements IUrlParser {
  getIllustIdFromUrl(url: string): string | null {
    // URLからイラストIDを抽出
    const urlMatch = url.match(/\/(\d+)_p\d+\./);
    if (urlMatch) {
      return urlMatch[1];
    }

    console.warn("[UrlParser] Failed to extract illustId from URL");
    return null;
  }

  getPageIndexFromUrl(url: string): number | null {
    // URLからページインデックスを抽出 (_p0, _p1, etc.)
    const pageMatch = url.match(/_p(\d+)\./);
    if (pageMatch) {
      const pageIndex = parseInt(pageMatch[1], 10);
      return pageIndex;
    }

    console.warn("[UrlParser] Failed to extract pageIndex from URL");
    return null;
  }

  getIllustId(element: HTMLElement): string | null {
    // hrefからIDを抽出
    const href = element.getAttribute("href") || "";
    const hrefMatch = href.match(/\/artworks\/(\d+)/);
    if (hrefMatch) return hrefMatch[1];

    console.warn("Failed to extract illustId from element");
    return null;
  }
}
