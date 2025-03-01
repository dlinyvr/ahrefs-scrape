// Blog extraction code
document.getElementById('extractButton').addEventListener('click', async () => {
    const status = document.getElementById('status');
    status.textContent = 'Extracting content...';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const contentSelectors = [
            '.blog_content',
            'article',
            '.post-content',
            '.entry-content',
            '.article-content',
            'main',
            '[role="main"]'
          ];
  
          let mainContent = null;
  
          for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              mainContent = element;
              break;
            }
          }
  
          if (!mainContent) {
            const paragraphs = document.getElementsByTagName('p');
            let largestTextBlock = '';
            let maxLength = 0;
  
            for (let i = 0; i < paragraphs.length; i++) {
              const text = paragraphs[i].textContent;
              if (text.length > maxLength) {
                maxLength = text.length;
                largestTextBlock = text;
              }
            }
  
            if (largestTextBlock) {
              mainContent = document.createElement('div');
              mainContent.textContent = largestTextBlock;
            }
          }
  
          if (!mainContent) {
            return { status: 'no-content' };
          }
  
          const clone = mainContent.cloneNode(true);
    
          const unwantedSelectors = [
            'header', 'footer', 'nav', 'sidebar', '.sidebar',
            '.comments', '.social-share', '.related-posts',
            '.advertisement', '.tags', '.categories', '.author-bio'
          ];
          
          unwantedSelectors.forEach(selector => {
            const elements = clone.querySelectorAll(selector);
            elements.forEach(el => el.remove());
          });
          
          let content = clone.textContent || clone.innerText;
          content = content.replace(/(\s{2,}|\n{2,})/g, '\n\n')
                          .replace(/^\s+|\s+$/g, '')
                          .trim();
          
          if (!content) {
            return { status: 'no-content' };
          }
          
          return { 
            status: 'success',
            content: content 
          };
        }
      });
      
      if (results && results[0] && results[0].result) {
        const result = results[0].result;
        
        if (result.status === 'no-content') {
          status.textContent = 'No blog content found on this page.';
          status.style.color = 'red';
        } else if (result.status === 'success') {
          try {
            await navigator.clipboard.writeText(result.content);
            status.textContent = 'Content copied to clipboard!';
            status.style.color = 'green';
          } catch (err) {
            status.textContent = 'Error copying to clipboard: ' + err.message;
            status.style.color = 'red';
          }
        } else {
          status.textContent = 'Error: ' + (result.message || 'Unknown error');
          status.style.color = 'red';
        }
      } else {
        status.textContent = 'Error: Failed to extract content';
        status.style.color = 'red';
      }
    } catch (error) {
      status.textContent = 'Error: ' + error.message;
      status.style.color = 'red';
      console.error('Extraction failed:', error);
    }
  });
  
  document.getElementById('showVideoUrls').addEventListener('click', async () => {
    const status = document.getElementById('status');
    status.textContent = 'Adding URL buttons...';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Helper functions used by both TikTok and YouTube
          function createUrlButton(isSingle, onClick) {
            const button = document.createElement('button');
            button.className = 'url-button';
            
            const singleLinkSVG = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            `;
            
            const multipleLinksSVG = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 3h5v5"></path>
                <path d="M21 3l-7 7"></path>
                <path d="M3 8v13h13"></path>
                <path d="M8 3h8"></path>
              </svg>
            `;
  
            button.innerHTML = isSingle ? singleLinkSVG : multipleLinksSVG;
            button.onclick = onClick;
            button.title = isSingle ? 'Copy video URL' : 'Copy all video URLs';
            return button;
          }
  
          function showToast(message) {
            const toast = document.createElement('div');
            toast.style.cssText = `
              position: fixed;
              bottom: 20px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 10px 20px;
              border-radius: 5px;
              z-index: 100000;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
          }
  
          // Add common styles
          const style = document.createElement('style');
          style.textContent = `
            .url-button {
              background: #1DA1F2;
              color: white;
              border: none;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0;
              margin: 0;
              transition: background-color 0.2s, transform 0.2s;
            }
            .url-button:hover {
              background: #0d8ecf;
              transform: scale(1.1);
            }
            .url-button svg {
              width: 16px;
              height: 16px;
            }
            .video-url-button-container, .tiktok-url-button-container {
              opacity: 0.8;
              background: rgba(0, 0, 0, 0.6);
              padding: 6px;
              border-radius: 20px;
              display: flex;
              gap: 6px;
            }
            .video-url-button-container:hover, .tiktok-url-button-container:hover {
              opacity: 1;
            }
          `;
          document.head.appendChild(style);
  
          // Determine which platform we're on and handle accordingly
          const isYouTube = window.location.hostname.includes('youtube.com');
          const isTikTok = window.location.hostname.includes('tiktok.com');
  
          if (isYouTube) {
            console.log('Starting to add YouTube URL buttons...');
            
            // Remove any existing buttons
            const existingButtons = document.querySelectorAll('.video-url-button-container');
            existingButtons.forEach(button => button.remove());
  
            // Find all video containers using multiple selectors
            const videoContainers = document.querySelectorAll([
              'ytd-rich-item-renderer',
              'ytd-video-renderer',
              'ytd-grid-video-renderer',
              'ytd-compact-video-renderer',
              'ytd-reel-item-renderer',
              'ytd-shorts'
            ].join(','));
            
            console.log('Found video containers:', videoContainers.length);
  
            videoContainers.forEach((container, index) => {
              const videoLink = 
                container.querySelector('a#thumbnail[href*="/watch?v="]') ||
                container.querySelector('a[href*="/watch?v="]') ||
                container.querySelector('a[href*="/shorts/"]') ||
                container.querySelector('a#video-title');
  
              if (!videoLink) return;
  
              const buttonContainer = document.createElement('div');
              buttonContainer.className = 'video-url-button-container';
              buttonContainer.style.cssText = `
                position: absolute;
                top: 4px;
                right: 4px;
                z-index: 99999;
                display: flex;
                gap: 4px;
              `;
  
              const thumbnailContainer = 
                container.querySelector('#thumbnail') ||
                container.querySelector('.thumbnail') ||
                container.querySelector('ytd-thumbnail') ||
                container;
  
              if (getComputedStyle(thumbnailContainer).position === 'static') {
                thumbnailContainer.style.position = 'relative';
              }
  
              const singleUrlButton = createUrlButton(true, async () => {
                const href = videoLink.getAttribute('href');
                const fullUrl = `https://www.youtube.com${href}`;
                await navigator.clipboard.writeText(fullUrl);
                showToast('URL copied!');
              });
  
              const allUrlsButton = createUrlButton(false, async () => {
                const allLinks = Array.from(document.querySelectorAll([
                  'a#thumbnail[href*="/watch?v="]',
                  'a[href*="/watch?v="]',
                  'a[href*="/shorts/"]',
                  'a#video-title'
                ].join(',')))
                  .map(a => `https://www.youtube.com${a.getAttribute('href')}`)
                  .filter((url, i, arr) => arr.indexOf(url) === i);
                
                if (allLinks.length > 0) {
                  await navigator.clipboard.writeText(allLinks.join('\n'));
                  showToast(`Copied ${allLinks.length} URLs!`);
                } else {
                  showToast('No video URLs found');
                }
              });
  
              buttonContainer.appendChild(singleUrlButton);
              buttonContainer.appendChild(allUrlsButton);
              thumbnailContainer.appendChild(buttonContainer);
            });
          } else if (isTikTok) {
            console.log('Starting to add TikTok URL buttons...');
            
            const existingButtons = document.querySelectorAll('.tiktok-url-button-container');
            existingButtons.forEach(button => button.remove());
  
            const videoContainers = document.querySelectorAll([
              'div[data-e2e="user-post-item"]',
              'div[class*="DivItemContainer"]',
              'div.tiktok-x6y88p-DivItemContainer',
              'div[class*="DivVideoFeed"]'
            ].join(','));
  
            console.log('Found video containers:', videoContainers.length);
  
            videoContainers.forEach((container, index) => {
              const buttonContainer = document.createElement('div');
              buttonContainer.className = 'tiktok-url-button-container';
              buttonContainer.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 99999;
                display: flex;
                gap: 5px;
              `;
  
              const videoLink = container.querySelector('a[href*="/video/"]') || 
                               container.closest('a[href*="/video/"]') ||
                               container.querySelector('a');
  
              const singleUrlButton = createUrlButton(true, async () => {
                if (videoLink?.href) {
                  await navigator.clipboard.writeText(videoLink.href);
                  showToast('URL copied!');
                } else {
                  showToast('Could not find video URL');
                }
              });
  
              const allUrlsButton = createUrlButton(false, async () => {
                const allLinks = Array.from(document.querySelectorAll('a[href*="/video/"]'))
                  .map(a => a.href)
                  .filter((url, i, arr) => arr.indexOf(url) === i);
                
                if (allLinks.length > 0) {
                  await navigator.clipboard.writeText(allLinks.join('\n'));
                  showToast(`Copied ${allLinks.length} URLs!`);
                } else {
                  showToast('No video URLs found');
                }
              });
  
              buttonContainer.appendChild(singleUrlButton);
              buttonContainer.appendChild(allUrlsButton);
  
              if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
              }
              
              container.appendChild(buttonContainer);
            });
          }
        }
      });
      
      status.textContent = 'URL buttons added!';
      status.style.color = 'green';
    } catch (error) {
      status.textContent = 'Error: ' + error.message;
      status.style.color = 'red';
      console.error('Failed to add URL buttons:', error);
    }
  });