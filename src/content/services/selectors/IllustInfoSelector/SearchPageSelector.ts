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
      }

      // ユーザー名を取得 - aria-label="ユーザー名"を持つ要素を検索
      let userName = "Unknown User";
      const userElement = targetCard.querySelector('[aria-label*="ユーザー名"]') as HTMLElement;
      if (userElement && userElement.textContent) {
        userName = userElement.textContent.trim();
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
