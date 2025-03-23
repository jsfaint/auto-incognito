# Auto-Incognito

A browser extension for Chrome/Edge that automatically opens specified websites in incognito/private mode. 🔒

## Features

- Automatically open blacklisted websites in incognito mode
- Support for manually adding URLs or adding the current tab with one click
- Password protection for your blacklist settings
- Import/export blacklist data
- Import websites from bookmarks
- Multi-language support (Chinese/English)

## How to Use

### Basic Usage
1. Click the extension icon to open the popup
2. Enter a URL in the input field or click the "Add Current Tab" button
3. Once added, visiting websites in the blacklist will automatically open in incognito mode

### Private Mode Options
- **Enable Private Mode**: URLs in the blacklist will open directly in an incognito window
- **Disable Private Mode**: URLs in the blacklist will open in normal mode, but browsing history will be cleared when the tab is closed

### Password Protection
1. Check the "Enable Password" option in the settings area
2. Set your access password
3. After setting, you'll need to verify your password each time you open the extension

### Data Management
- **Export Blacklist**: Export your blacklist as a text file
- **Import Blacklist**: Import blacklist data from a text file
- **Import from Bookmarks**: Select and import websites directly from your browser bookmarks
- **Manage Blacklist**: View and manage all blacklist items in a separate page

## Installation

Install the extension from:
- [Microsoft Edge Extension Store](https://microsoftedge.microsoft.com/addons/detail/jifongmjndlfaakddlefojdgnijchfio)
- [Chrome Web Store](https://chromewebstore.google.com/detail/%E8%87%AA%E5%8A%A8%E9%9A%90%E7%A7%81%E6%A8%A1%E5%BC%8F/iligdhpfclclkdegfdicjniagankbpdb)

## Development

### Testing

The extension uses [Bun](https://bun.sh/) as the test runner. To run tests:

1. Install dependencies:
   ```bash
   bun install
   ```

2. Run tests:
   ```bash
   bun test
   ```

3. Run tests in watch mode:
   ```bash
   bun test:watch
   ```

4. Generate test coverage report:
   ```bash
   bun test:coverage
   ```

For more details about testing, check out the [test documentation](./test/README.md).

## Privacy Statement

This extension does not collect any user data. All blacklist and configuration information is stored locally in your browser.

## Changelog

For detailed update information, please refer to the [release page](https://github.com/jsfaint/auto-incognito/releases).

## Feedback

If you have any questions or suggestions, please submit feedback via [GitHub Issues](https://github.com/jsfaint/auto-incognito/issues).

## License

MIT License

Copyright (c) 2024 Jia Sui (jsfaint@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
