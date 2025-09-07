// API Response Types
export interface PixivPage {
  urls: {
    original: string;
    '1200x1200': string;
    '600x600': string;
    '128x128': string;
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

// Extension Settings
export interface ExtensionSettings {
  downloadPath: string;
  autoCloseModal: boolean;
  showPreview: boolean;
}

// Download Item
export interface DownloadItem {
  url: string;
  filename: string;
  illustId: string;
  pageIndex: number;
}

// Chrome Extension Types
export interface ChromeMessage {
  type: 'DOWNLOAD_IMAGE' | 'OPEN_MODAL' | 'CLOSE_MODAL' | 'GET_SETTINGS';
  payload?: any;
}

export interface ChromeDownloadOptions {
  url: string;
  filename: string;
  saveAs: boolean;
}