import { IllustInfo, PixivPage } from "../types";

export class PixivAPI {
  private static instance: PixivAPI;

  public static getInstance(): PixivAPI {
    if (!PixivAPI.instance) {
      PixivAPI.instance = new PixivAPI();
    }
    return PixivAPI.instance;
  }

  async getIllustPages(illustId: string): Promise<string[]> {
    try {
      const response = await fetch(`/ajax/illust/${illustId}/pages`, {
        headers: {
          Referer: `https://www.pixiv.net/artworks/${illustId}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || "API returned an error");
      }

      return data.body.map((page: PixivPage) => page.urls.original);
    } catch (error) {
      throw error;
    }
  }

  async getIllustInfo(illustId: string): Promise<IllustInfo> {
    try {
      // カードを検索 - data-gtm-value属性から安定した方法で取得
      const targetLink = document.querySelector(`a[data-gtm-value="${illustId}"]`) as HTMLElement;

      let targetCard: HTMLElement | null = null;
      if (targetLink) {
        // 親要素をたどってカードコンテナを探す
        // data-gtm-valueを持つa要素から、さらに親要素をたどってトップ階層のカードを取得
        targetCard = targetLink.closest("div")?.closest("div")?.closest("div") as HTMLElement;
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

      // ユーザー名を取得 - data-gtm-valueを持つユーザーリンクから取得
      let userName = "Unknown User";
      const userLinks = targetCard.querySelectorAll('a[href*="/users/"]');
      if (userLinks.length > 1) {
        // 2つ目のaタグがユーザー名を持つ
        const userLink = userLinks[1] as HTMLElement;
        if (userLink && userLink.textContent) {
          userName = userLink.textContent.trim();
        }
      }

      return {
        id: illustId,
        title,
        userName,
        pageCount: 1,
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
