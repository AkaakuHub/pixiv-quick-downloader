import { ModalState, IllustInfo } from "../../types";

export class ModalStateManager {
  private state: ModalState = {
    isOpen: false,
    currentIllust: null,
    images: [],
    isLoading: false,
    error: null,
  };

  getState(): ModalState {
    return { ...this.state };
  }

  updateState(updates: Partial<ModalState>): void {
    this.state = { ...this.state, ...updates };
  }

  setLoading(isLoading: boolean): void {
    this.state.isLoading = isLoading;
  }

  setError(error: string | null): void {
    this.state.error = error;
  }

  setOpen(isOpen: boolean): void {
    this.state.isOpen = isOpen;
  }

  setCurrentIllust(illust: IllustInfo): void {
    this.state.currentIllust = illust;
  }

  setImages(images: string[]): void {
    this.state.images = images;
  }

  reset(): void {
    this.state = {
      isOpen: false,
      currentIllust: null,
      images: [],
      isLoading: false,
      error: null,
    };
  }
}
