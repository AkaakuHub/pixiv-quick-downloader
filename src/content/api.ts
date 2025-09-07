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
      // 正しいセレクタを決め打ち
      const cardSelector = `[href*="/artworks/${illustId}"]`
      
      // 該当するillustIdを持つカードを検索
      const cards = Array.from(document.querySelectorAll(cardSelector)) as HTMLElement[];
      let targetCard: HTMLElement | null = null;
      
      for (const card of cards) {
        const link = card.querySelector(`a[data-gtm-value="${illustId}"]`);
        if (link) {
          targetCard = card;
          break;
        }
      }
      
      if (!targetCard) {
        return {
          id: illustId,
          title: `作品 ${illustId}`,
          userName: 'Unknown User',
          pageCount: 1
        };
      }

      // タイトルを取得（決め打ちセレクタ）
      let title = 'Unknown Title';
      const titleElement = targetCard.querySelector('.sc-57c4d86c-6.fNOdSq') as HTMLElement;
      if (titleElement && titleElement.textContent) {
        title = titleElement.textContent.trim();
      }

      // ユーザー名を取得（決め打ちセレクタ）
      let userName = 'Unknown User';
      const userElement = targetCard.querySelector('.sc-4fe4819c-2.QzTPT') as HTMLElement;
      if (userElement && userElement.textContent) {
        userName = userElement.textContent.trim();
      }

      return {
        id: illustId,
        title,
        userName,
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