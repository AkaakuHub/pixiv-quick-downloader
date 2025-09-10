export interface IDomObserverManager {
  setupObserver(callback: () => void): void;
  setupShowAllButtonObserver(callback: () => void): void;
  destroy(): void;
}

export class DomObserverManager implements IDomObserverManager {
  private observer: MutationObserver | null = null;
  private buttonObserver: MutationObserver | null = null;
  private showAllClickHandler: ((event: Event) => void) | null = null;
  private isProcessing = false; // 重複実行防止フラグ
  private lastProcessTime = 0; // 最後の処理時間
  private callbackExecuted = false; // コールバック実行済みフラグ

  setupObserver(callback: () => void): void {
    // DOMの変更を監視して、新しいカードにボタンを追加
    this.observer = new MutationObserver(mutations => {
      let needsUpdate = false;

      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            needsUpdate = true;
          }
        });
      });

      if (needsUpdate) {
        // 遅延実行してDOMの完全な読み込みを待つ
        setTimeout(() => {
          callback();
        }, 500); // 500ms遅延
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  setupShowAllButtonObserver(callback: () => void): void {
    let hasShowAllButton = false;
    let checkCount = 0;
    const maxChecks = 4;

    // DOMが完全に読み込まれた後に「すべて見る」ボタンの存在を確認
    const checkShowAllButton = () => {
      const buttons = document.querySelectorAll("button");
      if (buttons.length > 12) {
        const specificButton = buttons[12];
        const specificDiv = specificButton.querySelectorAll("div")[1];
        hasShowAllButton = specificDiv?.textContent?.trim().includes("すべて見る") || false;
      }
    };

    // 初期チェックはしない
    // DOMの変更を監視してボタンの存在を再チェック
    this.buttonObserver = new MutationObserver(() => {
      checkShowAllButton();
      checkCount++;

      // ボタンが見つかったら監視を停止
      if (hasShowAllButton) {
        this.buttonObserver?.disconnect();
        this.buttonObserver = null;
      } else if (checkCount >= maxChecks) {
        // 4回チェックしても見つからない場合はcallbackを実行
        this.buttonObserver?.disconnect();
        this.buttonObserver = null;
        // コールバックがまだ実行されていない場合のみ実行
        if (!this.callbackExecuted) {
          this.callbackExecuted = true;
          callback();
        }
      }
    });

    this.buttonObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 複数のトリガーを監視
    const handleInteraction = (event: Event) => {
      const target = event.target as HTMLElement;

      // トリガー1: 「すべて見る」ボタン
      if (hasShowAllButton) {
        const showAllButton = target.closest("button") as HTMLElement;
        if (showAllButton && showAllButton.textContent?.trim().includes("すべて見る")) {
          this.triggerDomUpdate(callback);
          return;
        }
      }

      // トリガー2: 画像コンテナのクリック（img要素から上のdiv）
      const clickedImage = target.closest("img") as HTMLElement;
      if (clickedImage) {
        // 画像の親要素をたどって詳細ページコンテナを探す
        const clickTarget = clickedImage.parentElement;
        if (clickTarget) {
          this.triggerDomUpdate(callback);
        }
      }
    };

    document.addEventListener("click", handleInteraction, true); // キャプチャフェーズでイベントを監視

    // 破棄時にイベントリスナーを削除できるように保持
    this.showAllClickHandler = handleInteraction;
  }

  // DOM更新をトリガーする共通処理
  private triggerDomUpdate(callback: () => void): void {
    // 重複実行を防止
    const now = Date.now();
    if (this.isProcessing || now - this.lastProcessTime < 1000) {
      return; // 1秒以内の再実行は防止
    }

    this.isProcessing = true;
    this.lastProcessTime = now;

    let checkCount = 0;
    const maxChecks = 4;
    let domObserver: MutationObserver | null = null;

    const checkDomReady = () => {
      checkCount++;

      // img-originalを持つ要素が存在するか確認
      const hasOriginalImages =
        document.querySelectorAll('a[href*="img-original"][target="_blank"]').length > 0;

      if (hasOriginalImages) {
        // DOMが準備完了
        if (domObserver) {
          domObserver.disconnect();
          domObserver = null;
        }
        this.isProcessing = false;
        // コールバックがまだ実行されていない場合のみ実行
        if (!this.callbackExecuted) {
          this.callbackExecuted = true;
          callback();
        }
      } else if (checkCount >= maxChecks) {
        // 4回チェックしても見つからない場合は諦めて終了
        if (domObserver) {
          domObserver.disconnect();
          domObserver = null;
        }
        this.isProcessing = false;
      }
    };

    // DOMの変更を監視して画像リンクの存在を再チェック
    domObserver = new MutationObserver(() => {
      checkDomReady();
    });

    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 最初のチェックを少し遅らせて開始
    setTimeout(checkDomReady, 400);
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.buttonObserver) {
      this.buttonObserver.disconnect();
      this.buttonObserver = null;
    }

    // 'Show All' button observerのクリーンアップ
    const handler = this.showAllClickHandler;
    if (handler) {
      document.removeEventListener("click", handler, true);
      this.showAllClickHandler = null;
    }

    // 状態フラグをリセット
    this.isProcessing = false;
    this.lastProcessTime = 0;
    this.callbackExecuted = false;
  }
}
