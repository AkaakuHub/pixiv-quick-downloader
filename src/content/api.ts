import { IllustInfo } from '../types';

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
          'Referer': `https://www.pixiv.net/artworks/${illustId}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || 'API returned an error');
      }

      return data.body.map((page: any) => page.urls.original);
    } catch (error) {
      console.error('Error fetching illust pages:', error);
      throw error;
    }
  }

  async getIllustInfo(illustId: string): Promise<IllustInfo> {
    try {
      // 様々な方法でカードを検索
      const selectors = [
        `[href*="/artworks/${illustId}"]`,
        `[data-id*="${illustId}"]`,
        `a[href*="${illustId}"]`
      ];

      let card: HTMLElement | null = null;
      for (const selector of selectors) {
        card = document.querySelector(selector) as HTMLElement;
        if (card) {
          // 親要素を探す
          while (card && !card.closest('[class*="card"], [class*="illust"], [data-id]')) {
            card = card.parentElement;
          }
          break;
        }
      }

      if (!card) {
        // 最終手段：ページ全体から情報を取得
        return {
          id: illustId,
          title: `作品 ${illustId}`,
          userName: 'Unknown User',
          pageCount: 1
        };
      }

      // タイトルを取得（様々な方法を試す）
      let title = 'Unknown Title';
      const titleSelectors = [
        '[data-title]',
        'h1',
        '.title',
        '[class*="title"]'
      ];

      for (const selector of titleSelectors) {
        const titleElement = card.querySelector(selector) || document.querySelector(selector);
        if (titleElement && titleElement.textContent) {
          title = titleElement.textContent.trim();
          break;
        }
      }

      return {
        id: illustId,
        title,
        userName: 'Unknown User',
        pageCount: 1
      };
    } catch (error) {
      console.error('Error getting illust info:', error);
      return {
        id: illustId,
        title: `作品 ${illustId}`,
        userName: 'Unknown User',
        pageCount: 1
      };
    }
  }
}