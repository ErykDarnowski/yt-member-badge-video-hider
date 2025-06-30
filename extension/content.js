let pageHiddenCount = 0; // Count for this specific page
let filterEnabled = true;
let videoGridObserver = null;
let isInitialized = false;

// initialize the extension
const initializeExtension = async () => {
    if (isInitialized) return;
    
    // check if we're on a channel's videos page
    if (!location.href.includes('/@') || !location.href.includes('/videos')) {
        return;
    }
    
    // load settings from storage
    const result = await chrome.storage.local.get(['filterEnabled']);
    filterEnabled = result.filterEnabled !== false; // Default to true
    
    // reset page count for new page
    pageHiddenCount = 0;
    
    if (filterEnabled) {
        // add a small delay for initial page load
        setTimeout(() => {
            startFiltering();
        }, 1500);
    }
    
    isInitialized = true;
}

// main filtering function
const processNewVideos = () => {
    if (!filterEnabled) return;
    
    let newlyHidden = 0;
    
    // go through badge els
    [...document.getElementsByClassName('video-badge')].forEach(badgeEl => {
        // check if badge is hidden
        if (badgeEl.attributes.hidden === undefined) {
            // hide videos containing active supporter badge
            const videoContainer = badgeEl.closest('ytd-rich-item-renderer[class*="style-scope"]');
            if (videoContainer && videoContainer.style.display !== 'none') {
                videoContainer.style.display = 'none';
                newlyHidden++;
            }
        }
    });
    
    if (newlyHidden > 0) {
        pageHiddenCount += newlyHidden;
        console.info(`Member Badge Video Hider: Hidden ${newlyHidden} new videos (${pageHiddenCount} on this page)`);
        
        // send live update to popup if it's open
        chrome.runtime.sendMessage({ 
            action: 'updateCount', 
            count: pageHiddenCount 
        }).catch(() => {
            // popup might not be open, ignore err
        });
    }
};

// start the filtering system
const startFiltering = () => {
    if (!filterEnabled) return;
    
    // disconnect existing observer
    if (videoGridObserver) {
        videoGridObserver.disconnect();
    }
    
    // create new observer
    videoGridObserver = new MutationObserver((mutations) => {
        const hasNewVideos = mutations.some(mutation => 
            Array.from(mutation.addedNodes).some(node => 
                node.nodeType === 1 && 
                (node.matches?.('ytd-rich-item-renderer') || 
                 node.querySelector?.('ytd-rich-item-renderer'))
            )
        );
        
        if (hasNewVideos) {
            setTimeout(processNewVideos, 100); // small delay to ensure DOM is ready
        }
    });

    // start observing
    const gridContainer = document.querySelector('ytd-rich-grid-renderer #contents');
    if (gridContainer) {
        videoGridObserver.observe(gridContainer, { childList: true });
        // run once initially for existing videos
        processNewVideos();
        console.info('Member Badge Video Hider: Started filtering');
    } else {
        // if grid isn't ready yet, try again in a bit
        setTimeout(startFiltering, 1000);
    }
}

// stop filtering and disconnect observer
const stopFiltering = () => {
    if (videoGridObserver) {
        videoGridObserver.disconnect();
        videoGridObserver = null;
    }
    console.info('Member Badge Video Hider: Stopped filtering');
}

// listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleFilter') {
        filterEnabled = request.enabled;
        
        if (filterEnabled) {
            startFiltering();
        } else {
            stopFiltering();
            // reset page count when disabled
            pageHiddenCount = 0;
        }
        sendResponse({ success: true });
    } else if (request.action === 'getPageCount') {
        // send current page count to popup
        sendResponse({ count: pageHiddenCount });
        return true; // keep message channel open for async response
    }
    
    return true; // keep message channel open
});

// handle navigation changes (YT uses SPA)
let currentUrl = location.href;
const urlObserver = new MutationObserver(() => {
    if (location.href !== currentUrl) {
        currentUrl = location.href;
        isInitialized = false;
        
        // reset page count for new page
        pageHiddenCount = 0;
        
        // stop filtering if not on channel videos pages
        if (!location.href.includes('/@') || !location.href.includes('/videos')) {
            stopFiltering();
            return;
        }
        
        // only reinitialize on channel videos pages
        if (location.href.includes('/@') && location.href.includes('/videos')) {
            // small delay to let YouTube load new content
            setTimeout(() => {
                initializeExtension();
            }, 1000);
        }
    }
});

// start URL monitoring
urlObserver.observe(document, { subtree: true, childList: true });

// initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}
