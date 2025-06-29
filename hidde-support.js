let hiddenCount = 0;

function processNewVideos() {
    // Hide videos containing active supporter badge instead of removing
    [...document.getElementsByClassName('video-badge')].map(badgeEl => {
        if (badgeEl.attributes.hidden === undefined) {
            const videoContainer = badgeEl.closest('ytd-rich-item-renderer[class*="style-scope"]');
            if (videoContainer && videoContainer.style.display !== 'none') {
                videoContainer.style.display = 'none';
                hiddenCount++;
            }
        }
    });
    
    console.log(`Processed videos - hidden ${hiddenCount} supporter badge videos total`);
}

// Simple observer targeting YouTube's video container
const videoGridObserver = new MutationObserver((mutations) => {
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
}

/*
 * Tampermonkey script
 * Put in extension with btn to turn off
 * 
 * Put on GH
 * Save on NAS
 */
