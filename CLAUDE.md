# Pixiv Downloader Extension

A Chrome extension for downloading images from pixiv search results pages.

### ルール
- エラーは常にide diagnosticsで検知して修正すること。
- when online search, use `gemini -p "<your question>"` to get more reliable and accurate information.

## Development

This project uses pnpm for package management.

### Setup
```bash
pnpm install
```

### Build
```bash
pnpm run build        # Production build
pnpm run build:dev    # Development build
pnpm run watch        # Watch mode for development
```

### Type Check
```bash
pnpm run type-check
```

### Load Extension
1. Run `pnpm run build` to create the dist folder
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

## Features

- AJAX API integration for reliable original image downloads
- Modal interface for previewing and downloading multiple images
- Bulk download functionality
- TypeScript for type safety
- Modern UI with dark theme

## Architecture

- **Content Script**: Handles UI injection and DOM manipulation
- **Background Service**: Manages downloads and settings
- **Popup**: Settings and configuration interface
- **TypeScript**: Full type safety throughout the codebase

## File Structure

```
src/
├── content/           # Content script
│   ├── content.ts    # Main content script
│   ├── api.ts        # Pixiv API integration
│   ├── modal.ts      # Modal management
│   └── content.css   # Styles
├── background/       # Background service
│   └── background.ts
├── popup/            # Popup interface
│   ├── popup.html
│   └── popup.ts
├── types/            # TypeScript definitions
│   └── index.ts
└── icons/            # Extension icons
```

## API Usage

The extension uses Pixiv's AJAX API endpoints:
- `/ajax/illust/{illustId}/pages` - Get original image URLs

## Development Notes

- Uses Manifest V3
- Compatible with modern Chrome browsers
- Requires user to be logged into pixiv
- Referer headers are automatically set for API requests

## セレクタの実装について

この拡張機能は、フォールバックロジックやトライアンドエラーを排除し、決め打ちのセレクタを使用しています。

### カード検出セレクタ
- カード要素: `.sc-57c4d86c-5.gTqtlQ, .sc-57c4d86c-5.gTqsCV`
- 作品ID取得: `a[data-gtm-value]` 属性から取得
- タイトル取得: `.sc-57c4d86c-6.fNOdSq` 要素から取得
- ユーザー名取得: `.sc-4fe4819c-2.QzTPT` 要素から取得

### HTML構造の分析
`cc-docs/demo/` フォルダにあるHTMLファイルを分析し、pixivの実際のDOM構造に基づいてセレクタを実装しています。
- `sample.html`: 個別作品ページの構造
- `search.html`: 検索結果ページの構造

### 改善点
- 以前のバージョンでは「Unknown Title」と表示される問題がありましたが、正しいセレクタを使用することで解決しました
- 複数のフォールバック処理を排除し、直接的で信頼性の高い実装に変更しました
- Google Tag Manager用の `data-gtm-value` 属性を活用して正確な作品IDを取得しています