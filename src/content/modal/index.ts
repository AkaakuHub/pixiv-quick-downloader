import { ExtendedWindow } from "../../types";
import { ModalView } from "./ModalView";
import { ModalService } from "./ModalService";
import { ModalStateManager } from "./ModalStateManager";
import "../../styles/main.css";

export class ModalManager {
  private view: ModalView;
  private service: ModalService;
  private stateManager: ModalStateManager;

  constructor() {
    this.service = new ModalService();
    this.view = new ModalView(this.service);
    this.stateManager = new ModalStateManager();

    (window as ExtendedWindow).modalManager = this;
  }

  async loadSettings() {
    await this.service.loadSettings();
  }

  async openModal(illustId: string) {
    this.stateManager.setLoading(true);
    this.stateManager.setError(null);
    this.render();

    try {
      const { images, illustInfo } = await this.service.fetchIllustData(illustId);

      this.stateManager.setCurrentIllust(illustInfo);
      this.stateManager.setImages(images);
      this.stateManager.setLoading(false);
      this.stateManager.setOpen(true);

      this.render();
    } catch (error) {
      this.stateManager.setLoading(false);
      this.stateManager.setError(error instanceof Error ? error.message : "Unknown error");
      this.render();
    }
  }

  closeModal() {
    this.stateManager.setOpen(false);
    this.stateManager.reset();
    this.view.remove();
  }

  private render() {
    const state = this.stateManager.getState();
    const modalElement = this.view.render(state);

    if (state.isOpen) {
      (window as ExtendedWindow).modalManager = this;
      document.body.appendChild(modalElement);

      this.view.attachEventListeners(
        () => this.closeModal(),
        (url, filename) => this.handleImageClick(url, filename),
        () => this.handleDownloadAll(),
        state
      );
    }
  }

  private handleImageClick(url: string, filename: string) {
    const state = this.stateManager.getState();
    this.service.downloadImage(url, filename, state.currentIllust?.id);
  }

  private handleDownloadAll() {
    const state = this.stateManager.getState();
    if (state.currentIllust) {
      this.service.downloadAllImages(state.images, state.currentIllust);
    }
  }
}
