// ==UserScript==
// @name         YouTube Member Badge Video Hider
// @description  Automatically hides videos with member badges on YouTube channel video pages
// @version      1.0.0
// @author       Eryk Darnowski
// @match        *://www.youtube.com/@*/videos
// @match        *://youtube.com/@*/videos
// @run-at       document-end
// @grant        none
// @namespace    
// @supportURL   
// @updateURL    
// @downloadURL  
// ==/UserScript==

/* Releases
- 1.0.0 Initial release
*/

(() => {
    "use strict";

    let isInitialized = false;
    let pageHiddenCount = 0;
    let videoGridObserver = null;

    // initialize the script (only on videos pages)
    const initializeScript = () => {
        if (isInitialized) return;
        
        // check if on channel's videos page
        if (!location.href.includes('/@') || !location.href.includes('/videos')) {
            return;
        }
        
        pageHiddenCount = 0;
        
        // add small delay for initial page load
        setTimeout(() => {
            startFiltering();
        }, 1500);
        
        isInitialized = true;
    }

    // main filtering func
    const processNewVideos = () => {
        let newlyHidden = 0;
        
		// go through all badge els
        [...document.getElementsByClassName('video-badge')].forEach(badgeEl => {
			// check if badge hidden
            if (badgeEl.attributes.hidden === undefined) {
				// hide videos
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
        }
    }

    // start filtering
    const startFiltering = () => {
        if (videoGridObserver) {
            videoGridObserver.disconnect();
        }
        
        videoGridObserver = new MutationObserver((mutations) => {
            const hasNewVideos = mutations.some(mutation => 
                Array.from(mutation.addedNodes).some(node => 
                    node.nodeType === 1 && 
                    (node.matches?.('ytd-rich-item-renderer') || 
                     node.querySelector?.('ytd-rich-item-renderer'))
                )
            );
            
            if (hasNewVideos) {
                setTimeout(processNewVideos, 100);
            }
        });

        const gridContainer = document.querySelector('ytd-rich-grid-renderer #contents');
        if (gridContainer) {
            videoGridObserver.observe(gridContainer, { childList: true });
            processNewVideos();
            console.info('Member Badge Video Hider: Started filtering');
        } else {
            setTimeout(startFiltering, 1000);
        }
    }

    // stop filtering
    const stopFiltering = () => {
        if (videoGridObserver) {
            videoGridObserver.disconnect();
            videoGridObserver = null;
        }
        pageHiddenCount = 0;
        console.info('Member Badge Video Hider: Stopped filtering');
    }

    // handle navigation changes (YouTube SPA)
    let currentUrl = location.href;
    const urlObserver = new MutationObserver(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            isInitialized = false;
            pageHiddenCount = 0;
            
            // stop filtering if not on channel's videos page
            if (!location.href.includes('/@') || !location.href.includes('/videos')) {
                stopFiltering();
                return;
            }
            
            // only reinitialize if on channel's videos page
            if (location.href.includes('/@') && location.href.includes('/videos')) {
                setTimeout(() => {
                    initializeScript();
                }, 1000);
            }
        }
    });

    // start URL monitoring
    urlObserver.observe(document, { subtree: true, childList: true });

    // initialize when script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeScript);
    } else {
        initializeScript();
    }
})();
