# Pixiv Quick Downloader

A Chrome extension for downloading original images from pixiv search results pages.

## Features

- Download multiple original images from pixiv search results
- Batch download functionality
- Easy-to-use interface
- No external servers - all processing happens locally

## Installation(dev)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Navigate to pixiv search results page (`https://www.pixiv.net/tags/*`)
2. Click the extension icon in the browser toolbar
3. Select the images you want to download
4. Click the download button

## Permissions

This extension requires the following permissions:
- `downloads` - To save images to your computer
- `storage` - To store user preferences
- `activeTab` - To interact with the current pixiv page
- `tabs` - To manage extension tabs
- `declarativeNetRequestWithHostAccess` - To handle image requests
- `offscreen` - For background processing

## Privacy Policy

This extension does not collect, store, or transmit any personal data. All image downloads are processed locally on your device. No data is sent to external servers.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues or feature requests, please create an issue in the repository.