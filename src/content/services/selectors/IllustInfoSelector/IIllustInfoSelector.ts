import { IllustInfo } from "../../../../types";

export interface IIllustInfoSelector {
  getIllustInfo(illustId: string): Promise<IllustInfo>;
  getPageType(): "search" | "detail";
}
