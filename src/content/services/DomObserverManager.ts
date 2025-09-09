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
        // 遅延実行して画像の完全な読み込みを待つ
        setTimeout(() => {
          callback();
        }, 1500); // 1.5秒遅延でDOM再生成に対応
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
