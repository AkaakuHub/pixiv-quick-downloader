export interface IUrlParser {
  getIllustIdFromUrl(url: string): string | null;
  getPageIndexFromUrl(url: string): number | null;
  getIllustId(element: HTMLElement): string | null;
}

export class UrlParser implements IUrlParser {
  getIllustIdFromUrl(url: string): string | null {
    const urlMatch = url.match(/\/(\d+)_p\d+\./);
    return urlMatch ? urlMatch[1] : null;
  }

  getPageIndexFromUrl(url: string): number | null {
    const pageMatch = url.match(/_p(\d+)\./);
    return pageMatch ? parseInt(pageMatch[1], 10) : null;
  }

  getIllustId(element: HTMLElement): string | null {
    const href = element.getAttribute("href") || "";
    const hrefMatch = href.match(/\/artworks\/(\d+)/);
    return hrefMatch ? hrefMatch[1] : null;
  }
}
