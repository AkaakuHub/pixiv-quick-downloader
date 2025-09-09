import { ModalManager } from "../modal";

export interface IDownloadHandler {
  downloadDetailPageImage(imageUrl: string, illustId: string, pageIndex: number): Promise<void>;
}

export class DownloadHandler implements IDownloadHandler {
  constructor(private modalManager: ModalManager) {}

  async downloadDetailPageImage(
    imageUrl: string,
    illustId: string,
    pageIndex: number
  ): Promise<void> {
    try {
      // ModalServiceを利用してダウンロード処理を実行
      const modalService = this.modalManager.getModalService();

      // イラスト情報を取得
      const illustInfo = await modalService.fetchIllustData(illustId);

      // ファイル名を生成
      const filename = modalService.generateFilename(
        illustInfo.illustInfo.title,
        illustInfo.illustInfo.userName,
        illustId,
        pageIndex
      );

      // ダウンロードを実行
      await modalService.downloadImage(imageUrl, filename, illustId);
    } catch (error) {
      console.error(
        `[DownloadHandler] Download failed for illust ${illustId}, page ${pageIndex}:`,
        error
      );
      alert("ダウンロードに失敗しました");
    }
  }
}
