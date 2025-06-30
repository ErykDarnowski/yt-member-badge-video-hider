chrome.runtime.onInstalled.addListener(() => {
    console.info('Member Badge Video Hider installed');
    
    // set default settings
    chrome.storage.local.set({
        filterEnabled: true
    });
});

// handle messages from content script to popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // forward count updates to any open popup
    if (message.action === 'updateCount') {
        // this will be handled by popup.js if popup is open
        return;
    }
});

/*
// Optional: handle extension icon click to open popup
chrome.action.onClicked.addListener((tab) => {
    // this will open the popup (by default)
    // you could also toggle the filter directly here
});
*/
