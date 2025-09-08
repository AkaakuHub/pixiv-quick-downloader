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

export interface PixivIllustResponse {
  body: PixivPage[];
  error: boolean;
  message: string;
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
  downloadPath: string;
  autoCloseModal: boolean;
  showPreview: boolean;
  filenameFormat: FilenameFormat;
}

// Download Item
export interface DownloadItem {
  url: string;
  filename: string;
  illustId: string;
  pageIndex: number;
}

// Chrome Extension Types
export interface DownloadImagePayload {
  url: string;
  filename: string;
  illustId?: string;
}

export interface UpdateSettingsPayload {
  downloadPath?: string;
  autoCloseModal?: boolean;
  showPreview?: boolean;
  filenameFormat?: FilenameFormat;
}

export interface FetchImagePayload {
  url: string;
  referer: string;
}

export interface ChromeMessage {
  type:
    | "DOWNLOAD_IMAGE"
    | "OPEN_MODAL"
    | "CLOSE_MODAL"
    | "GET_SETTINGS"
    | "UPDATE_SETTINGS"
    | "FETCH_IMAGE";
  payload?:
    | DownloadImagePayload
    | UpdateSettingsPayload
    | FetchImagePayload
    | Partial<ExtensionSettings>;
}

export interface ChromeDownloadOptions {
  url: string;
  filename: string;
  saveAs: boolean;
}

export interface ExtendedWindow extends globalThis.Window {
  modalManager?: {
    openModal: (illustId: string) => Promise<void>;
    closeModal: () => void;
  };
}
