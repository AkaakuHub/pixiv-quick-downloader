import { IllustInfo, PixivPage } from "../types";
import { IIllustInfoSelector } from "./services/selectors/IllustInfoSelector/IIllustInfoSelector";
import { ISelectorFactory } from "./services/factories/SelectorFactory";
import { SelectorFactory } from "./services/factories/SelectorFactory";
import { PageDetector } from "./services/core/PageDetector";

export class PixivAPI {
  private static instance: PixivAPI;
  private illustInfoSelector: IIllustInfoSelector;

  constructor(selectorFactory: ISelectorFactory) {
    this.illustInfoSelector = selectorFactory.createSelectorFromCurrentPage();
  }

  public static getInstance(): PixivAPI {
    if (!PixivAPI.instance) {
      // TODO: DIコンテナからSelectorFactoryを注入する
      // 現在は直接インスタンス化（一時的な実装）
      const pageDetector = new PageDetector();
      const selectorFactory = new SelectorFactory(pageDetector);
      PixivAPI.instance = new PixivAPI(selectorFactory);
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
    return this.illustInfoSelector.getIllustInfo(illustId);
  }
}
