// background.js
chrome.runtime.onInstalled.addListener(() => {
    console.log('Member Badge Video Hider installed');
    
    // Set default settings
    chrome.storage.local.set({
        filterEnabled: true
    });
});

// Handle messages from content script to popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Forward count updates to any open popup
    if (message.action === 'updateCount') {
        // This will be handled by popup.js if popup is open
        return;
    }
});

// Optional: Handle extension icon click to open popup
chrome.action.onClicked.addListener((tab) => {
    // This will open the popup (default behavior)
    // You could also toggle the filter directly here if you prefer
});