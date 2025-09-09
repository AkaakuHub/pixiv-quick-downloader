import { PageType } from "./PageDetector";

interface ContentState {
  currentPageType: PageType;
  isDestroyed: boolean;
  isInitialized: boolean;
}

export interface IContentStateManager {
  getState(): ContentState;
  setPageType(type: PageType): void;
  setIsDestroyed(destroyed: boolean): void;
  setIsInitialized(initialized: boolean): void;
  reset(): void;
}

export class ContentStateManager implements IContentStateManager {
  private state: ContentState = {
    currentPageType: "unknown",
    isDestroyed: false,
    isInitialized: false,
  };

  getState(): ContentState {
    return { ...this.state };
  }

  setPageType(type: PageType): void {
    this.state.currentPageType = type;
  }

  setIsDestroyed(destroyed: boolean): void {
    this.state.isDestroyed = destroyed;
  }

  setIsInitialized(initialized: boolean): void {
    this.state.isInitialized = initialized;
  }

  reset(): void {
    this.state = {
      currentPageType: "unknown",
      isDestroyed: false,
      isInitialized: false,
    };
  }
}
