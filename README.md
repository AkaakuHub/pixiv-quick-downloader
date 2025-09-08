# Pixiv Quick Downloader

A Chrome extension for downloading original images from pixiv search results pages.

## Features

- Download original images directly from pixiv search results
- Batch download with custom filenames
- Easy-to-use interface with modal download dialog
- Customizable folder structure for downloads
- No external servers - all processing happens locally

## Usage

### Downloading Images

1. Open any pixiv search results page
2. Click the light blue download button in the bottom-left corner of any illustration card
3. A modal will open showing the image
4. Click on the image to download (you can specify a custom filename)

### Configuring Download Settings

1. Click the extension icon in the browser toolbar
2. Configure your preferred folder structure for downloads

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Permissions

This extension requires the following permissions:
- `downloads` - To save images to your computer
- `storage` - To store user preferences
- `tabs` - To manage extension tabs
- `declarativeNetRequestWithHostAccess` - To handle image requests

## Privacy Policy

This extension does not collect, store, or transmit any personal data. All image downloads are processed locally on your device. No data is sent to external servers.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues or feature requests, please create an issue in the repository.