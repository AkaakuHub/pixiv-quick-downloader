// API Response Types
export interface PixivPage {
  urls: {
    original: string;
    "1200x1200": string;
    "600x600": string;
    "128x128": string;
  };
  width: number;
  height: number;
}

// Illust Information
export interface IllustInfo {
  id: string;
  title: string;
  userName: string;
  pageCount: number;
}

// Modal State
export interface ModalState {
  isOpen: boolean;
  currentIllust: IllustInfo | null;
  images: string[];
  isLoading: boolean;
  error: string | null;
}

// Filename format options
export type FilenameFormat = "title_page" | "id_page" | "author_title_page" | "author_id_page";

// Extension Settings
export interface ExtensionSettings {
  filenameFormat: FilenameFormat;
}

export interface FetchImagePayload {
  url: string;
  referer: string;
}

export interface ExtendedWindow extends globalThis.Window {
  modalManager?: {
    openModal: (illustId: string) => Promise<void>;
    closeModal: () => void;
  };
}
