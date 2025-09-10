export interface IDomObserverManager {
  setupObserver(callback: () => void): void;
  setupShowAllButtonObserver(callback: () => void): void;
  destroy(): void;
  forceReset(): void;
}

export class DomObserverManager implements IDomObserverManager {
  private observer: MutationObserver | null = null;
  private buttonObserver: MutationObserver | null = null;
  private showAllClickHandler: ((event: Event) => void) | null = null;
  private isProcessing = false; // 重複実行防止フラグ
  private lastProcessTime = 0; // 最後の処理時間

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

    // DOMの完全な読み込みを待ってから「すべて見る」ボタンの存在を確認
    const checkShowAllButton = () => {
      const buttons = document.querySelectorAll("button");
      if (buttons.length > 12) {
        const specificButton = buttons[12];
        const specificDiv = specificButton.querySelectorAll("div")[1];
        hasShowAllButton = specificDiv?.textContent?.trim().includes("すべて見る") || false;
      }
    };

    // 即時チェックを実行
    checkShowAllButton();

    // 1枚画像ページの場合は即座にコールバックを実行
    if (!hasShowAllButton) {
      console.log(
        "[Pixiv Quick Downloader]  Single image page detected, executing callback immediately"
      );
      setTimeout(() => {
        callback();
      }, 500); // 少し待ってから実行
    }

    // DOMの変更を監視してボタンの存在を再チェック
    this.buttonObserver = new MutationObserver(() => {
      checkShowAllButton();
      // ボタンが見つかったら監視を停止
      if (hasShowAllButton) {
        this.buttonObserver?.disconnect();
        this.buttonObserver = null;
        console.log("[Pixiv Quick Downloader] 'Show All' button detected");
      }
    });

    this.buttonObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 複数のトリガーを監視
    const handleInteraction = (event: Event) => {
      const target = event.target as HTMLElement;

      // トリガー1: 「すべて見る」ボタン（複数画像ページ用）
      if (hasShowAllButton) {
        const showAllButton = target.closest("button") as HTMLElement;
        if (showAllButton && showAllButton.textContent?.trim().includes("すべて見る")) {
          this.triggerDomUpdate(callback);
          return;
        }
      }

      // トリガー2: 画像コンテナのクリック（複数画像・1枚画像ページ共通）
      const clickedImage = target.closest("img") as HTMLElement;
      if (clickedImage) {
        // 画像の親要素をたどって詳細ページコンテナを探す
        const clickTarget = clickedImage.parentElement;
        if (clickTarget) {
          this.triggerDomUpdate(callback);
        }
      }
    };

    document.addEventListener("click", handleInteraction, true);
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

    // 短い遅延でDOMの生成を待つが、頻繁にチェックする
    const checkInterval = 100; // 100msごとにチェック
    const maxWaitTime = 2000; // 最大2秒待つ
    let elapsedTime = 0;

    const checkDomReady = () => {
      elapsedTime += checkInterval;

      // img-originalを持つ要素が存在するか確認
      const hasOriginalImages =
        document.querySelectorAll('a[href*="img-original"][target="_blank"]').length > 0;

      if (hasOriginalImages || elapsedTime >= maxWaitTime) {
        // DOMが準備完了、またはタイムアウト
        this.isProcessing = false;
        callback();
      } else {
        // まだ準備できていないので続けてチェック
        setTimeout(checkDomReady, checkInterval);
      }
    };

    // 最初のチェックを少し遅らせて開始
    setTimeout(checkDomReady, 400);
  }

  destroy(): void {
    console.log("[Pixiv Quick Downloader]  Destroying observers...");

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

    console.log("[Pixiv Quick Downloader]  Observers destroyed");
  }

  // SPAナビゲーション用の強制リセット
  forceReset(): void {
    console.log("[Pixiv Quick Downloader]  Force resetting observers...");
    this.destroy();
  }
}
