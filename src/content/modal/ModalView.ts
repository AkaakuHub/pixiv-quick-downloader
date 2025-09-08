import { ModalState } from "../../types";
import { I18n } from "../../i18n";
import { ModalService } from "./ModalService";

export class ModalView {
  private modal: HTMLElement | null = null;
  private i18n: I18n;
  private service: ModalService;

  constructor(service: ModalService) {
    this.i18n = I18n.getInstance();
    this.service = service;
  }

  render(state: ModalState): HTMLElement {
    if (this.modal) {
      this.modal.remove();
    }

    this.modal = document.createElement("div");
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      overflow-y: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      padding: 0;
    `;

    if (state.isOpen) {
      this.modal.innerHTML = this.getModalHTML(state);

      setTimeout(() => {
        if (this.modal) {
          this.modal.style.opacity = "1";
        }
      }, 10);
    }

    return this.modal;
  }

  private getModalHTML(state: ModalState): string {
    if (state.isLoading) {
      return `
        <div class="pixiv-modal-container">
          <div class="pixiv-modal-loading">
            <div class="pixiv-loading-spinner"></div>
            <div>${this.i18n.t("loading")}</div>
          </div>
        </div>
      `;
    }

    if (state.error) {
      return `
        <div class="pixiv-modal-container">
          <div class="pixiv-modal-error">
            <div class="pixiv-error-icon">⚠️</div>
            <div class="pixiv-error-message">${this.i18n.t("error", { error: state.error })}</div>
            <button class="pixiv-close-btn">${this.i18n.t("close")}</button>
          </div>
        </div>
      `;
    }

    const imageItems = state.images
      .map((url, index) => {
        const defaultFilename = this.service.generateFilename(
          state.currentIllust?.title || "untitled",
          state.currentIllust?.userName || "Unknown User",
          state.currentIllust?.id || "unknown",
          index
        );

        // _master1200を付与したURLプレビュー用やろうと思ったけど、こっちもrefererいるから無駄になる

        return `
      <div class="pixiv-image-card">
        <div class="pixiv-image-wrapper" data-url="${url}" data-index="${index}">
          <img 
            src="${url}" 
            alt="Page ${index + 1}"
            class="pixiv-thumbnail"
            onerror="this.parentElement.innerHTML='<div class=\\'pixiv-image-error\\'>${this.i18n.t("imageLoadError")}</div>'"
          >
          <div class="pixiv-download-overlay">
          </div>
        </div>
        <div class="pixiv-image-info">
          <div class="pixiv-page-number">${this.i18n.t("page", { current: String(index + 1), total: String(state.images.length) })}</div>
          <input 
            type="text" 
            class="pixiv-filename-input" 
            placeholder="${this.i18n.t("filenamePlaceholder")}"
            data-default-filename="${defaultFilename}"
            data-index="${index}"
            value=""
          >
        </div>
      </div>
    `;
      })
      .join("");

    return `
      <div class="pixiv-modal-container">
        <div class="pixiv-modal-header">
          <div class="pixiv-title-section">
            <h2 class="pixiv-title">${state.currentIllust?.title}</h2>
            <div class="pixiv-author">by ${state.currentIllust?.userName}</div>
          </div>
          <button class="pixiv-close-btn">✕</button>
        </div>
        <div class="pixiv-instruction">
          <div class="pixiv-instruction-text">
          ${this.i18n.t("clickToDownload")}
          </div>
          <div class="pixiv-instruction-subtext">
          ${this.i18n.t("or")}
          </div>
        </div>
        ${
          state.images.length > 1
            ? `
          <div class="pixiv-bulk-download">
            <button class="pixiv-download-all-btn">
              ${this.i18n.t("downloadAll", { count: String(state.images.length) })}
            </button>
          </div>
        `
            : ""
        }
        
        <div class="pixiv-images-grid">
          ${imageItems}
        </div>
      </div>
    `;
  }

  remove() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  attachEventListeners(
    onClose: () => void,
    onImageClick: (url: string, filename: string, index: number) => void,
    onDownloadAll: () => void,
    state: ModalState
  ) {
    if (!this.modal) return;

    this.modal.addEventListener("click", e => {
      if (e.target === this.modal) {
        onClose();
      }
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        onClose();
      }
    });

    const imageWrappers = this.modal.querySelectorAll(".pixiv-image-wrapper");
    imageWrappers.forEach((wrapper, index) => {
      const url = wrapper.getAttribute("data-url");

      if (url) {
        wrapper.addEventListener("click", e => {
          e.preventDefault();
          e.stopPropagation();

          const card = wrapper.closest(".pixiv-image-card");
          const filenameInput = card?.querySelector<HTMLInputElement>(".pixiv-filename-input");

          let filename;
          if (filenameInput && filenameInput.value.trim()) {
            filename = filenameInput.value.trim();
          } else {
            filename =
              filenameInput?.getAttribute("data-default-filename") ||
              this.service.generateFilename(
                state.currentIllust?.title || "untitled",
                state.currentIllust?.userName || "Unknown User",
                state.currentIllust?.id || "unknown",
                index
              );
          }

          onImageClick(url, filename, index);
        });
      }
    });

    const closeButtons = this.modal.querySelectorAll(".pixiv-close-btn");
    closeButtons.forEach(button => {
      button.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      });
    });

    const downloadAllButtons = this.modal.querySelectorAll(".pixiv-download-all-btn");
    downloadAllButtons.forEach(button => {
      button.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        onDownloadAll();
      });
    });
  }
}
