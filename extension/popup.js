document.addEventListener('DOMContentLoaded', async () => {
    const toggleSwitch = document.getElementById('toggle-switch');
    const statusIndicator = document.getElementById('status-indicator');
    const statsCount = document.getElementById('stats-count');
    
    // function to get current page count from content script
    const updatePageCount = async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && tab.url.includes('youtube.com/@') && tab.url.includes('/videos')) {
                const response = await chrome.tabs.sendMessage(tab.id, { 
                    action: 'getPageCount' 
                });
                if (response && typeof response.count === 'number') {
                    statsCount.textContent = response.count;
                } else {
                    statsCount.textContent = '0';
                }
            } else {
                statsCount.textContent = 'N/A';
            }
        } catch (error) {
            console.error('Could not get page count:', error);
            statsCount.textContent = 'N/A';
        }
    }
    
    const updateToggleState = (enabled) => {
        if (enabled) {
            toggleSwitch.classList.add('active');
            statusIndicator.classList.remove('status-inactive');
            statusIndicator.classList.add('status-active');
        } else {
            toggleSwitch.classList.remove('active');
            statusIndicator.classList.remove('status-active');
            statusIndicator.classList.add('status-inactive');
        }
    }
    
    // load current settings
    const result = await chrome.storage.local.get(['filterEnabled']);
    const isEnabled = result.filterEnabled !== false; // true by default
    
    // get current page count from content script
    await updatePageCount();
    
    // update UI
    updateToggleState(isEnabled);
    
    // toggle switch click handler
    toggleSwitch.addEventListener('click', async () => {
        const newState = !toggleSwitch.classList.contains('active');
        
        // save new state
        await chrome.storage.local.set({ filterEnabled: newState });
        
        // update UI
        updateToggleState(newState);
        
        // send message to content script about state change
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && tab.url.includes('youtube.com/@') && tab.url.includes('/videos')) {
                chrome.tabs.sendMessage(tab.id, { 
                    action: 'toggleFilter', 
                    enabled: newState 
                });
                
                // if disabling, reload page to show hidden videos
                if (!newState) {
                    chrome.tabs.reload(tab.id);
                }
            }
        } catch (error) {
            console.error('Could not send message to tab:', error);
        }
    });
    
    // set up periodic updates while popup is open
    const updateInterval = setInterval(updatePageCount, 500);
    
    // clean up interval when popup closes
    window.addEventListener('beforeunload', () => {
        clearInterval(updateInterval);
    });
});

// listen for messages from content script with live updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateCount') {
        const statsCount = document.getElementById('stats-count');
        if (statsCount) {
            statsCount.textContent = message.count;
        }
    }
});
