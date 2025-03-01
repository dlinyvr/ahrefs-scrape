console.log('Content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract") {
    console.log('Extracting content...');
    const result = extractContent();
    sendResponse(result);
  }
  return true;
});

function extractContent() {
  console.log('Starting content extraction...');
  
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
    console.log(`Trying selector: ${selector}`);
    const element = document.querySelector(selector);
    if (element) {
      console.log(`Found content with selector: ${selector}`);
      mainContent = element;
      break;
    }
  }

  if (!mainContent) {
    console.log('No content found with selectors, trying paragraph analysis');
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
    console.log('No content found on page');
    return { status: 'no-content' };
  }

  const cleanContent = cleanUpContent(mainContent);
  
  if (!cleanContent.trim()) {
    console.log('No content after cleanup');
    return { status: 'no-content' };
  }
  
  try {
    navigator.clipboard.writeText(cleanContent);
    console.log('Content copied to clipboard successfully');
    return { status: 'success' };
  } catch (err) {
    console.error('Failed to copy content: ', err);
    return { status: 'error', message: err.message };
  }
}

function cleanUpContent(element) {
  console.log('Starting content cleanup...');
  
  const clone = element.cloneNode(true);
  
  const unwantedSelectors = [
    'header', 'footer', 'nav', 'sidebar', '.sidebar',
    '.comments', '.social-share', '.related-posts',
    '.advertisement', '.tags', '.categories', '.author-bio'
  ];
  
  unwantedSelectors.forEach(selector => {
    const elements = clone.querySelectorAll(selector);
    console.log(`Removing ${elements.length} ${selector} elements`);
    elements.forEach(el => el.remove());
  });
  
  let content = clone.textContent || clone.innerText;
  content = content.replace(/(\s{2,}|\n{2,})/g, '\n\n').replace(/^\s+|\s+$/g, '');
  
  console.log('Cleanup complete. Content length:', content.length);
  return content;
}