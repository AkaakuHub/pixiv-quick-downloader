export interface IDomObserverManager {
  setupObserver(callback: () => void): void;
  setupShowAllButtonObserver(callback: () => void): void;
  destroy(): void;
}

export class DomObserverManager implements IDomObserverManager {
  private observer: MutationObserver | null = null;
  private showAllClickHandler: ((event: Event) => void) | null = null;

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
    // 「すべて見る」ボタンのクリックイベントを監視
    const handleShowAllClick = (event: Event) => {
      const target = event.target as HTMLElement;

      // ボタンまたはその子要素がクリックされたかチェック
      const showAllButton = target.closest("button") as HTMLElement;
      if (showAllButton && showAllButton.textContent?.trim().includes("すべて見る")) {
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
            callback();
          } else {
            // まだ準備できていないので続けてチェック
            setTimeout(checkDomReady, checkInterval);
          }
        };

        // 最初のチェックを少し遅らせて開始
        setTimeout(checkDomReady, 400);
      }
    };

    document.addEventListener("click", handleShowAllClick, true); // キャプチャフェーズでイベントを監視

    // 破棄時にイベントリスナーを削除できるように保持
    this.showAllClickHandler = handleShowAllClick;
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // 'Show All' button observerのクリーンアップ
    const handler = this.showAllClickHandler;
    if (handler) {
      document.removeEventListener("click", handler, true);
      this.showAllClickHandler = null;
    }
  }
}
