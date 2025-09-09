import { IllustInfo } from "../../../../types";
import { IIllustInfoSelector } from "./IIllustInfoSelector";

export class DetailPageSelector implements IIllustInfoSelector {
  getPageType(): "search" | "detail" {
    return "detail";
  }

  async getIllustInfo(illustId: string): Promise<IllustInfo> {
    try {
      // TODO: 詳細ページ用のセレクタを実装
      // ここに詳細ページの作品情報取得ロジックを実装

      // 仮の実装 - 後で実際のセレクタに置き換える
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
    const userElement = document.querySelector("[data-user-name]") as HTMLElement;
    return userElement?.textContent?.trim() || "Unknown User";
  }

  private getDetailPageCount(): number {
    // 詳細ページのページ数取得ロジック
    const pageElements = document.querySelectorAll("[data-page-count]");
    return pageElements.length > 0 ? pageElements.length : 1;
  }
}
