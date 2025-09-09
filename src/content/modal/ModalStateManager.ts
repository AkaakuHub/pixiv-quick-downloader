import { ModalState, IllustInfo } from "../../types";
import { BaseStateManager } from "../services/core/ContentStateManager";

export class ModalStateManager extends BaseStateManager<ModalState> {
  constructor() {
    super({
      isOpen: false,
      currentIllust: null,
      images: [],
      isLoading: false,
      error: null,
    });
  }

  protected getInitialState(): ModalState {
    return {
      isOpen: false,
      currentIllust: null,
      images: [],
      isLoading: false,
      error: null,
    };
  }

  setLoading(isLoading: boolean): void {
    this.updateState({ isLoading });
  }

  setError(error: string | null): void {
    this.updateState({ error });
  }

  setOpen(isOpen: boolean): void {
    this.updateState({ isOpen });
  }

  setCurrentIllust(illust: IllustInfo): void {
    this.updateState({ currentIllust: illust });
  }

  setImages(images: string[]): void {
    this.updateState({ images });
  }
}
