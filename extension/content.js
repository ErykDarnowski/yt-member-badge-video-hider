// content.js
let pageHiddenCount = 0; // Count for this specific page
let filterEnabled = true;
let videoGridObserver = null;
let isInitialized = false;

// Initialize the extension
async function initializeExtension() {
    if (isInitialized) return;
    
    // Load settings from storage
    const result = await chrome.storage.local.get(['filterEnabled']);
    filterEnabled = result.filterEnabled !== false; // Default to true
    
    // Reset page count for new page
    pageHiddenCount = 0;
    
    if (filterEnabled) {
        // Add a small delay for initial page load
        setTimeout(() => {
            startFiltering();
        }, 1500);
    }
    
    isInitialized = true;
}

// Main filtering function
function processNewVideos() {
    if (!filterEnabled) return;
    
    let newlyHidden = 0;
    
    // Hide videos containing active supporter badge instead of removing
    [...document.getElementsByClassName('video-badge')].forEach(badgeEl => {
        if (badgeEl.attributes.hidden === undefined) {
            const videoContainer = badgeEl.closest('ytd-rich-item-renderer[class*="style-scope"]');
            if (videoContainer && videoContainer.style.display !== 'none') {
                videoContainer.style.display = 'none';
                newlyHidden++;
            }
        }
    });
    
    if (newlyHidden > 0) {
        pageHiddenCount += newlyHidden;
        console.log(`Member Badge Video Hider: Hidden ${newlyHidden} new videos (${pageHiddenCount} on this page)`);
        
        // Send live update to popup if it's open
        chrome.runtime.sendMessage({ 
            action: 'updateCount', 
            count: pageHiddenCount 
        }).catch(() => {
            // Popup might not be open, ignore error
        });
    }
}

// Start the filtering system
function startFiltering() {
    if (!filterEnabled) return;
    
    // Disconnect existing observer
    if (videoGridObserver) {
        videoGridObserver.disconnect();
    }
    
    // Create new observer
    videoGridObserver = new MutationObserver((mutations) => {
        const hasNewVideos = mutations.some(mutation => 
            Array.from(mutation.addedNodes).some(node => 
                node.nodeType === 1 && 
                (node.matches?.('ytd-rich-item-renderer') || 
                 node.querySelector?.('ytd-rich-item-renderer'))
            )
        );
        
        if (hasNewVideos) {
            setTimeout(processNewVideos, 100); // Small delay to ensure DOM is ready
        }
    });

    // Start observing
    const gridContainer = document.querySelector('ytd-rich-grid-renderer #contents');
    if (gridContainer) {
        videoGridObserver.observe(gridContainer, { childList: true });
        // Run once initially for existing videos
        processNewVideos();
        console.log('Member Badge Video Hider: Started filtering');
    } else {
        // If grid isn't ready yet, try again in a bit
        setTimeout(startFiltering, 1000);
    }
}

// Stop filtering and disconnect observer
function stopFiltering() {
    if (videoGridObserver) {
        videoGridObserver.disconnect();
        videoGridObserver = null;
    }
    console.log('Member Badge Video Hider: Stopped filtering');
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleFilter') {
        filterEnabled = request.enabled;
        
        if (filterEnabled) {
            startFiltering();
        } else {
            stopFiltering();
            // Reset page count when disabled
            pageHiddenCount = 0;
        }
        sendResponse({ success: true });
    } else if (request.action === 'getPageCount') {
        // Send current page count to popup
        sendResponse({ count: pageHiddenCount });
        return true; // Keep message channel open for async response
    }
    
    return true; // Keep message channel open
});

// Handle navigation changes (YouTube is a SPA)
let currentUrl = location.href;
const urlObserver = new MutationObserver(() => {
    if (location.href !== currentUrl) {
        currentUrl = location.href;
        isInitialized = false;
        
        // Reset page count for new page
        pageHiddenCount = 0;
        
        // Small delay to let YouTube load new content
        setTimeout(() => {
            initializeExtension();
        }, 1000);
    }
});

// Start URL monitoring
urlObserver.observe(document, { subtree: true, childList: true });

// Initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}