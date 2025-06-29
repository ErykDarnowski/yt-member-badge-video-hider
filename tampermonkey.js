// ==UserScript==
// @name         YouTube Member Badge Video Hider
// @description  Automatically hides videos with member badges on YouTube channel video pages
// @version      1.0.0
// @author       Eryk Darnowski
// @match        *://www.youtube.com/@*/videos
// @match        *://youtube.com/@*/videos
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @namespace    https://github.com/yourusername/youtube-member-badge-hider
// @supportURL   https://github.com/yourusername/youtube-member-badge-hider/issues
// @updateURL    https://github.com/yourusername/youtube-member-badge-hider/raw/main/userscript.js
// @downloadURL  https://github.com/yourusername/youtube-member-badge-hider/raw/main/userscript.js
// ==/UserScript==

/* Releases
- 1.0.0 Initial release - Hides videos with member badges on YouTube channel pages
*/

(() => {
    "use strict";

    let pageHiddenCount = 0;
    let filterEnabled = GM_getValue('filterEnabled', true);
    let videoGridObserver = null;
    let isInitialized = false;
    let controlPanel = null;

    // Add CSS for the control panel
    GM_addStyle(`
        #member-badge-hider-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: #1a1a1a;
            color: #e0e0e0;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            min-width: 250px;
            border: 1px solid #333;
        }

        #member-badge-hider-panel .header {
            text-align: center;
            margin-bottom: 16px;
        }

        #member-badge-hider-panel .title {
            font-size: 14px;
            font-weight: 600;
            color: #f5f5f5;
            margin-bottom: 4px;
        }

        #member-badge-hider-panel .subtitle {
            font-size: 11px;
            color: #b0b0b0;
            line-height: 1.4;
        }

        #member-badge-hider-panel .toggle-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 0;
            border-top: 1px solid #333;
            border-bottom: 1px solid #333;
            margin: 8px 0;
        }

        #member-badge-hider-panel .toggle-label {
            font-size: 12px;
            color: #e0e0e0;
            font-weight: 500;
            display: flex;
            align-items: center;
        }

        #member-badge-hider-panel .status-indicator {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            margin-right: 6px;
        }

        #member-badge-hider-panel .status-active {
            background: #4caf50;
        }

        #member-badge-hider-panel .status-inactive {
            background: #f44336;
        }

        #member-badge-hider-panel .toggle-switch {
            position: relative;
            width: 40px;
            height: 20px;
            background: #444;
            border-radius: 10px;
            cursor: pointer;
            transition: background 0.3s;
        }

        #member-badge-hider-panel .toggle-switch.active {
            background: #4285f4;
        }

        #member-badge-hider-panel .toggle-slider {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 16px;
            height: 16px;
            background: white;
            border-radius: 50%;
            transition: transform 0.3s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        #member-badge-hider-panel .toggle-switch.active .toggle-slider {
            transform: translateX(20px);
        }

        #member-badge-hider-panel .stats {
            text-align: center;
            margin-top: 8px;
        }

        #member-badge-hider-panel .stats-text {
            font-size: 10px;
            color: #b0b0b0;
            margin-bottom: 4px;
        }

        #member-badge-hider-panel .stats-count {
            font-size: 16px;
            font-weight: 600;
            color: #4285f4;
        }

        #member-badge-hider-panel .close-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            color: #b0b0b0;
            cursor: pointer;
            font-size: 16px;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #member-badge-hider-panel .close-btn:hover {
            color: #e0e0e0;
        }
    `);

    // Initialize the script (only on channel videos pages)
    function initializeScript() {
        if (isInitialized) return;
        
        // Check if we're on a channel videos page
        if (!location.href.includes('/@') || !location.href.includes('/videos')) {
            return;
        }
        
        pageHiddenCount = 0;
        
        if (filterEnabled) {
            setTimeout(() => {
                startFiltering();
            }, 1500);
        }
        
        createControlPanel();
        isInitialized = true;
    }

    // Create floating control panel
    function createControlPanel() {
        if (controlPanel) {
            controlPanel.remove();
        }

        controlPanel = document.createElement('div');
        controlPanel.id = 'member-badge-hider-panel';
        
        controlPanel.innerHTML = `
            <button class="close-btn">×</button>
            <div class="header">
                <div class="title">Member Badge Video Hider</div>
                <div class="subtitle">Hides videos with member badges</div>
            </div>
            <div class="toggle-container">
                <div class="toggle-label">
                    <span class="status-indicator ${filterEnabled ? 'status-active' : 'status-inactive'}"></span>
                    Filter Active
                </div>
                <div class="toggle-switch ${filterEnabled ? 'active' : ''}">
                    <div class="toggle-slider"></div>
                </div>
            </div>
            <div class="stats">
                <div class="stats-text">Member Badge Videos Hidden</div>
                <div class="stats-count">${pageHiddenCount}</div>
            </div>
        `;

        document.body.appendChild(controlPanel);

        // Add event listeners
        const closeBtn = controlPanel.querySelector('.close-btn');
        const toggleSwitch = controlPanel.querySelector('.toggle-switch');
        
        closeBtn.addEventListener('click', () => {
            controlPanel.style.display = 'none';
        });

        toggleSwitch.addEventListener('click', () => {
            filterEnabled = !filterEnabled;
            GM_setValue('filterEnabled', filterEnabled);
            
            updateControlPanel();
            
            if (filterEnabled) {
                startFiltering();
            } else {
                stopFiltering();
                // Reload page to show hidden videos
                location.reload();
            }
        });

        // Hide panel after 10 seconds
        setTimeout(() => {
            if (controlPanel && controlPanel.style.display !== 'none') {
                controlPanel.style.display = 'none';
            }
        }, 10000);
    }

    // Update control panel UI
    function updateControlPanel() {
        if (!controlPanel) return;

        const statusIndicator = controlPanel.querySelector('.status-indicator');
        const toggleSwitch = controlPanel.querySelector('.toggle-switch');
        const statsCount = controlPanel.querySelector('.stats-count');

        // Update status indicator
        statusIndicator.className = `status-indicator ${filterEnabled ? 'status-active' : 'status-inactive'}`;
        
        // Update toggle switch
        if (filterEnabled) {
            toggleSwitch.classList.add('active');
        } else {
            toggleSwitch.classList.remove('active');
        }

        // Update count
        statsCount.textContent = pageHiddenCount;
    }

    // Main filtering function
    function processNewVideos() {
        if (!filterEnabled) return;
        
        let newlyHidden = 0;
        
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
            updateControlPanel();
        }
    }

    // Start filtering
    function startFiltering() {
        if (!filterEnabled) return;
        
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
            console.log('Member Badge Video Hider: Started filtering');
        } else {
            setTimeout(startFiltering, 1000);
        }
    }

    // Stop filtering
    function stopFiltering() {
        if (videoGridObserver) {
            videoGridObserver.disconnect();
            videoGridObserver = null;
        }
        pageHiddenCount = 0;
        updateControlPanel();
        console.log('Member Badge Video Hider: Stopped filtering');
    }

    // Handle navigation changes (YouTube SPA)
    let currentUrl = location.href;
    const urlObserver = new MutationObserver(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            isInitialized = false;
            pageHiddenCount = 0;
            
            // Hide control panel if not on channel videos pages
            if (controlPanel && (!location.href.includes('/@') || !location.href.includes('/videos'))) {
                controlPanel.style.display = 'none';
                stopFiltering();
                return;
            }
            
            // Only reinitialize on channel videos pages
            if (location.href.includes('/@') && location.href.includes('/videos')) {
                setTimeout(() => {
                    initializeScript();
                }, 1000);
            }
        }
    });

    // Start URL monitoring
    urlObserver.observe(document, { subtree: true, childList: true });

    // Initialize when script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeScript);
    } else {
        initializeScript();
    }

    // Show panel with Ctrl+Shift+M
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'M') {
            if (controlPanel) {
                controlPanel.style.display = controlPanel.style.display === 'none' ? 'block' : 'none';
            }
        }
    });
})();