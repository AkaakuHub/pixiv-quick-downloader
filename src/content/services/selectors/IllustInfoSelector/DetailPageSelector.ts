import { IllustInfo } from "../../../../types";
import { IIllustInfoSelector } from "./IIllustInfoSelector";

export class DetailPageSelector implements IIllustInfoSelector {
  getPageType(): "search" | "detail" {
    return "detail";
  }

  async getIllustInfo(illustId: string): Promise<IllustInfo> {
    try {
      // 詳細ページの情報取得ロジック
      return {
        id: illustId,
        title: this.getDetailPageTitle(),
        userName: this.getDetailPageUserName(),
        pageCount: this.getDetailPageCount(),
      };
    } catch {
      return {
        id: illustId,
        title: `作品 ${illustId}`,
        userName: "Unknown User",
        pageCount: 1,
      };
    }
  }

  private getDetailPageTitle(): string {
    // 詳細ページのタイトル取得ロジック
    const titleElement = document.querySelector("h1") as HTMLElement;
    return titleElement?.textContent?.trim() || "Unknown Title";
  }

  private getDetailPageUserName(): string {
    // 詳細ページのユーザー名取得ロジック
    const userElements = document.querySelectorAll('a[href*="/users/"][data-gtm-value]');

    for (const userElement of userElements) {
      const gtmValue = userElement.getAttribute("data-gtm-value");
      const href = userElement.getAttribute("href");

      if (gtmValue && href) {
        const userIdMatch = href.match(/\/users\/(\d+)/);
        const userId = userIdMatch ? userIdMatch[1] : null;

        // usersの行き先とdata-gtm-valueが一致する要素を探す
        if (userId && gtmValue === userId) {
          const userDiv = userElement.querySelector("div") as HTMLElement;
          return userDiv?.title?.trim() || "Unknown User";
        }
      }
    }

    return "Unknown User";
  }

  private getDetailPageCount(): number {
    // 詳細ページのページ数取得ロジック
    const pageElements = document.querySelectorAll("[data-page-count]");
    return pageElements.length > 0 ? pageElements.length : 1;
  }
}
