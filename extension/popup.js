// popup.js
document.addEventListener('DOMContentLoaded', async () => {
    const toggleSwitch = document.getElementById('toggle-switch');
    const statusIndicator = document.getElementById('status-indicator');
    const statsCount = document.getElementById('stats-count');
    
    // Load current settings
    const result = await chrome.storage.local.get(['filterEnabled']);
    const isEnabled = result.filterEnabled !== false; // Default to true
    
    // Get current page count from content script
    await updatePageCount();
    
    // Update UI
    updateToggleState(isEnabled);
    
    // Toggle switch click handler
    toggleSwitch.addEventListener('click', async () => {
        const newState = !toggleSwitch.classList.contains('active');
        
        // Save new state
        await chrome.storage.local.set({ filterEnabled: newState });
        
        // Update UI
        updateToggleState(newState);
        
        // Send message to content script about state change
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && tab.url.includes('youtube.com')) {
                chrome.tabs.sendMessage(tab.id, { 
                    action: 'toggleFilter', 
                    enabled: newState 
                });
                
                // If disabling, reload the page to show hidden videos
                if (!newState) {
                    chrome.tabs.reload(tab.id);
                }
            }
        } catch (error) {
            console.log('Could not send message to tab:', error);
        }
    });
    
    // Function to get current page count from content script
    async function updatePageCount() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && tab.url.includes('youtube.com')) {
                const response = await chrome.tabs.sendMessage(tab.id, { 
                    action: 'getPageCount' 
                });
                if (response && typeof response.count === 'number') {
                    statsCount.textContent = response.count;
                } else {
                    statsCount.textContent = '0';
                }
            } else {
                statsCount.textContent = '0';
            }
        } catch (error) {
            console.log('Could not get page count:', error);
            statsCount.textContent = '0';
        }
    }
    
    // Set up periodic updates while popup is open
    const updateInterval = setInterval(updatePageCount, 500);
    
    // Clean up interval when popup closes
    window.addEventListener('beforeunload', () => {
        clearInterval(updateInterval);
    });
    
    function updateToggleState(enabled) {
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
});

// Listen for messages from content script with live updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateCount') {
        const statsCount = document.getElementById('stats-count');
        if (statsCount) {
            statsCount.textContent = message.count;
        }
    }
});

// Listen for storage changes to update stats
chrome.storage.onChanged.addListener((changes) => {
    // Remove the hiddenCount listener since we're using page-specific counts now
});