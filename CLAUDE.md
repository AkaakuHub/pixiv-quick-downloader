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