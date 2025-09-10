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
    const maxChecks = 2; // 4回から2回に減らして即時実行

    console.log("[Pixiv Quick Downloader]  setupShowAllButtonObserver called");
    console.log("[Pixiv Quick Downloader]  Current callbackExecuted:", this.callbackExecuted);

    // DOMが完全に読み込まれた後に「すべて見る」ボタンの存在を確認
    const checkShowAllButton = () => {
      console.log("[Pixiv Quick Downloader]  checkShowAllButton called");
      const buttons = document.querySelectorAll("button");
      console.log("[Pixiv Quick Downloader]  Total buttons found:", buttons.length);

      // すべてのボタンの中から「すべて見る」を検索（インデックス12に固定しない）
      hasShowAllButton = false;
      buttons.forEach((button, index) => {
        const text = button.textContent?.trim() || "";
        if (text.includes("すべて見る")) {
          console.log(`[Pixiv Quick Downloader]  Found 'すべて見る' button at index ${index}`);
          hasShowAllButton = true;
        }
      });

      console.log("[Pixiv Quick Downloader]  hasShowAllButton:", hasShowAllButton);
    };

    // 即時チェックを実行（SPA対応）
    console.log("[Pixiv Quick Downloader]  Performing immediate check...");
    checkShowAllButton();
    if (hasShowAllButton) {
      console.log("[Pixiv Quick Downloader]  Show-all button found on immediate check");
      if (!this.callbackExecuted) {
        this.callbackExecuted = true;
        console.log("[Pixiv Quick Downloader]  Executing callback immediately");
        callback();
      } else {
        console.log("[Pixiv Quick Downloader]  Callback already executed, skipping");
      }
      return;
    }

    console.log(
      "[Pixiv Quick Downloader]  Show-all button not found, will execute callback after short delay"
    );

    // 「すべて見る」ボタンがない場合は短時間待ってから実行（1枚画像ページ対応）
    setTimeout(() => {
      if (!this.callbackExecuted) {
        console.log("[Pixiv Quick Downloader]  Executing callback for single image page");
        this.callbackExecuted = true;
        callback();
      }
    }, 1000); // 1秒待ってから実行

    // 念のためDOM変更も監視（ただし最大チェック回数を減らす）
    this.buttonObserver = new MutationObserver(mutations => {
      console.log(
        "[Pixiv Quick Downloader]  MutationObserver triggered, mutations:",
        mutations.length
      );
      checkShowAllButton();
      checkCount++;

      console.log(
        "[Pixiv Quick Downloader]  Check count:",
        checkCount,
        "hasShowAllButton:",
        hasShowAllButton
      );

      // ボタンが見つかったら監視を停止
      if (hasShowAllButton) {
        console.log("[Pixiv Quick Downloader]  Show-all button found via observer");
        this.buttonObserver?.disconnect();
        this.buttonObserver = null;
        if (!this.callbackExecuted) {
          this.callbackExecuted = true;
          console.log("[Pixiv Quick Downloader]  Executing callback from observer");
          callback();
        } else {
          console.log("[Pixiv Quick Downloader]  Callback already executed, skipping");
        }
      } else if (checkCount >= maxChecks) {
        // 2回チェックしても見つからない場合は既存のsetTimeoutに任せる
        console.log("[Pixiv Quick Downloader]  Max checks reached, waiting for timeout");
        this.buttonObserver?.disconnect();
        this.buttonObserver = null;
      }
    });

    this.buttonObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log("[Pixiv Quick Downloader]  MutationObserver setup complete");

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

    // 状態フラグを完全にリセット
    this.isProcessing = false;
    this.lastProcessTime = 0;
    this.callbackExecuted = false;

    console.log("[Pixiv Quick Downloader]  Observers destroyed");
  }

  // SPAナビゲーション用の強制リセット
  forceReset(): void {
    console.log("[Pixiv Quick Downloader]  Force resetting observers...");
    this.destroy();
  }

  // SPA移動後の即時チェックを実行
  immediateShowAllCheck(callback: () => void): void {
    console.log("[Pixiv Quick Downloader]  Performing immediate show-all check...");

    // 即時チェックを実行
    const hasShowAllButton = this.checkForShowAllButton();

    if (hasShowAllButton) {
      console.log("[Pixiv Quick Downloader]  Show-all button found immediately");
      // 「すべて見る」ボタンが見つかった場合はクリックを待つ
      this.setupShowAllButtonObserver(callback);
    } else {
      console.log("[Pixiv Quick Downloader]  Show-all button not found, executing callback");
      // 「すべて見る」ボタンがない場合は直接コールバックを実行
      if (!this.callbackExecuted) {
        this.callbackExecuted = true;
        callback();
      }
    }
  }

  // 「すべて見る」ボタンの存在チェック
  private checkForShowAllButton(): boolean {
    // より確実な「すべて見る」ボタンの検出
    const buttons = document.querySelectorAll("button");
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const buttonText = button.textContent?.trim() || "";
      if (buttonText.includes("すべて見る")) {
        return true;
      }

      // div要素の中もチェック
      const divs = button.querySelectorAll("div");
      for (let j = 0; j < divs.length; j++) {
        const divText = divs[j].textContent?.trim() || "";
        if (divText.includes("すべて見る")) {
          return true;
        }
      }
    }

    return false;
  }
}
