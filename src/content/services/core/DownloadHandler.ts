import { ModalManager } from "../../modal";

export interface IDownloadHandler {
  downloadDetailPageImage(
    imageUrl: string,
    illustId: string,
    pageIndex: number,
    customFilename?: string
  ): Promise<void>;
}

export class DownloadHandler implements IDownloadHandler {
  constructor(private modalManager: ModalManager) {}

  async downloadDetailPageImage(
    imageUrl: string,
    illustId: string,
    pageIndex: number,
    customFilename?: string
  ): Promise<void> {
    try {
      // ModalServiceを利用してダウンロード処理を実行
      const modalService = this.modalManager.getModalService();

      // イラスト情報を取得
      const illustInfo = await modalService.fetchIllustData(illustId);

      // ファイル名を生成
      let filename;
      if (customFilename && customFilename.trim()) {
        // カスタムファイル名が入力されている場合はそれを使用
        filename = customFilename.trim();
      } else {
        // デフォルトのファイル名生成ロジックを使用
        filename = modalService.generateFilename(
          illustInfo.illustInfo.title,
          illustInfo.illustInfo.userName,
          illustId,
          pageIndex
        );
      }

      // ダウンロードを実行
      await modalService.downloadImage(imageUrl, filename, illustId);
    } catch {
      alert("ダウンロードに失敗しました");
    }
  }
}
