import { ExtensionSettings } from "../../types";

export class FilenameGenerator {
  private settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this.settings = settings;
  }

  generateFilename(title: string, userName: string, id: string, pageIndex: number): string {
    const sanitizedTitle = this.sanitizeFilename(title);
    const sanitizedUserName = this.sanitizeFilename(userName);
    const encodedTitle = encodeURIComponent(sanitizedTitle);
    const encodedUserName = encodeURIComponent(sanitizedUserName);

    switch (this.settings.filenameFormat) {
      case "title_page":
        return `${encodedTitle}_${pageIndex + 1}`;
      case "id_page":
        return `${id}_${pageIndex + 1}`;
      case "author_title_page":
        return `${encodedUserName}/${encodedTitle}_${pageIndex + 1}`;
      case "author_id_page":
        return `${encodedUserName}/${id}_${pageIndex + 1}`;
      default:
        return `${encodedTitle}_${pageIndex + 1}`;
    }
  }

  generateFolderName(title: string, userName: string, id: string): string {
    const sanitizedTitle = this.sanitizeFilename(title);
    const sanitizedUserName = this.sanitizeFilename(userName);
    const encodedTitle = encodeURIComponent(sanitizedTitle);
    const encodedUserName = encodeURIComponent(sanitizedUserName);

    switch (this.settings.filenameFormat) {
      case "title_page":
        return encodedTitle;
      case "id_page":
        return id;
      case "author_title_page":
        return `${encodedUserName}/${encodedTitle}`;
      case "author_id_page":
        return `${encodedUserName}/${id}`;
      default:
        return encodedTitle;
    }
  }

  sanitizeFilename(filename: string): string {
    const pathParts = filename.split("/");
    const filenamePart = pathParts.pop() || "";
    const directories = pathParts;

    const sanitizedFilename = filenamePart
      .replace(/</g, "＜")
      .replace(/>/g, "＞")
      .replace(/:/g, "：")
      .replace(/"/g, "＂")
      .replace(/\|/g, "｜")
      .replace(/\?/g, "？")
      .replace(/\*/g, "＊")
      .replace(/\\/g, "￥")
      .replace(/[\x00-\x1F\x7F]/g, "") // eslint-disable-line no-control-regex
      .replace(/[ ]+/g, " ")
      .trim()
      .replace(/^\./, "_");

    const sanitizedDirectories = directories.map(dir =>
      dir
        .replace(/</g, "＜")
        .replace(/>/g, "＞")
        .replace(/:/g, "：")
        .replace(/"/g, "＂")
        .replace(/\|/g, "｜")
        .replace(/\?/g, "？")
        .replace(/\*/g, "＊")
        .replace(/\\/g, "￥")
        .replace(/[\x00-\x1F\x7F]/g, "") // eslint-disable-line no-control-regex
        .replace(/[ ]+/g, " ")
        .trim()
        .replace(/^\./, "_")
        .replace(/[/]+/g, "/")
    );

    if (sanitizedDirectories.length > 0) {
      return sanitizedDirectories.join("/") + "/" + sanitizedFilename;
    }

    return sanitizedFilename;
  }

  getFileExtensionFromUrl(url: string): string {
    const urlParts = url.split(".");
    const extension = urlParts[urlParts.length - 1].split("?")[0].split("#")[0];
    return extension.toLowerCase();
  }

  ensureFileExtension(filename: string, url: string): string {
    const extension = this.getFileExtensionFromUrl(url);
    const filenameWithoutExtension = filename.replace(/\.[a-zA-Z0-9_-]+$/, "");
    return `${filenameWithoutExtension}.${extension}`;
  }

  updateSettings(settings: ExtensionSettings): void {
    this.settings = settings;
  }
}
