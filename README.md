# YT Member Badge Video Hider

A browser extension that automatically hides videos with **member badges** on YouTube channel video pages. Clean up your viewing experience by filtering out **member-exclusive** content.

### Before:

<p align="center">
  <img width="900" height="auto" src="https://github.com/user-attachments/assets/d302ce36-cbd1-4ee9-9447-c788302a9456">
</p>

### After:

<p align="center">
  <img width="900" height="auto" src="https://github.com/user-attachments/assets/30d0e1c8-6cea-47be-bc16-f5629dc8d743">
</p>

## Features

- **Automatic filtering** - Hides videos with member badges as you scroll
- **Channel-specific** - Only works on YouTube channel Videos pages (`youtube.com/@<channelname>/videos`)
- **Toggle control** - Easy on/off switch via popup interface
- **Live counter** - Shows how many videos are hidden on the current page
- **Dark mode UI** - Modern, clean popup interface
- **Tampermonkey version** - Also available as a userscript
- **No data collection** - Obviously, it works entirely locally

## Installation

### For End Users (Chrome Web Store)

*Coming soon - extension pending review*

### For Developers

1. Download or clone this repository
2. Open your chromium based browser and navigate to `<browser_name>://extensions/`
3. Enable "Developer Mode" in the top right corner
4. Click "Load Unpacked" and select the extension folder
5. The extension is now installed and ready to use!

### Tampermonkey Version

For users who prefer userscripts:
1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. [Install the userscript](userscript.js)
3. Make sure the script is enabled (should be by default) and visit any YouTube channel's Videos page

*If you want to stop filtering out the badges, simply toggle the extension off in the tampermonkey popup*

## Usage

1. **Navigate** to any YouTube channel's Videos page (`youtube.com/@channelname/videos`)
2. **Click** the extension icon to open the popup
3. **Toggle** the filter on/off as needed
4. **Watch** the live counter update as videos are hidden while scrolling

The extension only activates on channel Videos pages - it won't interfere with your regular YouTube browsing.

## How It Works

The extension uses a `MutationObserver` to watch for new videos being loaded in the video grid element as you scroll. When it detects videos with member / supporter badges, it hides them by setting `display: none`. The extension is designed to be lightweight, simple and non-intrusive.

## Technical Details

- **Manifest Version**: 3
- **Permissions**: `storage`, `tabs`, `activeTab`
- **Content Script**: Only injected on `*://*.youtube.com/@*/videos`
- **Popup Interface**: Real-time communication with content script
- **Storage**: Uses Chrome's local storage for settings persistence

## Development

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request


### Project Structure

```
.
├── extension/            # Browser extension
│   ├── background.js     # Service worker (handles extension lifecycle)
│   ├── content.js        # Main filtering logic (what runs on YouTube pages)
│   ├── icon.png          # Extension icon export
│   ├── icon.ai           # Extension icon Adobe Illustrator project file
│   ├── manifest.json     # Extension manifest
│   ├── popup.html        # Popup interface
│   └── popup.js          # Popup logic & toggle controls
├── LICENSE               
├── README.md             
└── tampermonkey.js       # Userscript version (alternative to extension)
```

### Building

No build process required - this is a vanilla JavaScript extension.

### Testing

1. Load the extension in developer mode
2. Navigate to any YouTube channel's Videos page
3. Open the popup and verify the toggle works
4. Check browser console for any errors

## Credits

This extension was built using the [Chrome Extension Base Template](https://github.com/ewliang/Chrome-Extension-Base-Template) by [ewliang](https://github.com/ewliang). Thank you for providing a nice and simple foundation for browser extension development!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have feature requests, please [open an issue](https://github.com/ErykDarnowski/yt-member-badge-video-hider/issues) on GitHub.
