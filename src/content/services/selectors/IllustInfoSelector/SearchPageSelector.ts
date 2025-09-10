import { IllustInfo } from "../../../../types";
import { IIllustInfoSelector } from "./IIllustInfoSelector";

export class SearchPageSelector implements IIllustInfoSelector {
  getPageType(): "search" | "detail" {
    return "search";
  }

  async getIllustInfo(illustId: string): Promise<IllustInfo> {
    try {
      // カードを検索 - data-gtm-value属性から安定した方法で取得
      const targetLink = document.querySelector(`a[data-gtm-value="${illustId}"]`) as HTMLElement;

      let targetCard: HTMLElement | null = null;
      if (targetLink) {
        targetCard = targetLink?.parentElement?.parentElement?.parentElement as HTMLElement;
      }

      if (!targetCard) {
        console.warn(`Target card not found for illustId: ${illustId}`);
        return {
          id: illustId,
          title: `作品 ${illustId}`,
          userName: "Unknown User",
          pageCount: 1,
        };
      }

      // タイトルを取得 - カード内の2つ目のaタグ（実際のタイトルテキストを持つ方）を取得
      let title = "Unknown Title";
      const titleLinks = targetCard.querySelectorAll('a[href*="/artworks/"]');
      if (titleLinks.length > 1) {
        // 2つ目のaタグがタイトルテキストを持つ
        const titleLink = titleLinks[1] as HTMLElement;
        if (titleLink && titleLink.textContent) {
          title = titleLink.textContent.trim();
        }
      } else {
        console.warn(`Title link not found for illustId: ${illustId}`);
      }

      // ユーザー名を取得 - hrefに/users/を含むaタグから
      let userName = "Unknown User";
      const userElements = targetCard.querySelectorAll('a[href*="/users/"]');
      if (userElements.length > 0) {
        const userElement = userElements[0] as HTMLElement;
        const userDiv = userElement.querySelector("div") as HTMLElement;
        userName = userDiv?.title?.trim() || "Unknown User";
      } else {
        console.warn(`User link not found for illustId: ${illustId}`);
      }

      // ページ数を取得 - aria-labelからページ数を抽出
      let pageCount = 1;
      const pageElements = targetCard.querySelectorAll('[aria-label*="ページ目"]');
      if (pageElements.length > 0) {
        const lastPageElement = pageElements[pageElements.length - 1] as HTMLElement;
        const ariaLabel = lastPageElement.getAttribute("aria-label");
        if (ariaLabel) {
          const match = ariaLabel.match(/(\d+)ページ目/);
          if (match) {
            pageCount = parseInt(match[1], 10);
          }
        }
      }

      return {
        id: illustId,
        title,
        userName,
        pageCount,
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
}
