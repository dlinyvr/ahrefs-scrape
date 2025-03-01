// Ahrefs data extraction code
document.getElementById('extractAhrefsColumns').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.textContent = 'Extracting Ahrefs data...';
  status.className = 'info';
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Function to extract keywords and metrics from Ahrefs
        function extractAhrefsColumnsData() {
          console.log('Starting Ahrefs data extraction...');
          
          // Extract data using the provided selectors and XPaths
          const data = [];
          
          try {
            // First, try to find the table
            const tableSelector = 'table';
            const table = document.querySelector(tableSelector);
            
            if (!table) {
              console.log('Table not found using basic selector');
              return { status: 'no-table', message: 'Could not find the table' };
            }
            
            console.log('Found table:', table);
            
            // Get all rows in the table
            const rows = table.querySelectorAll('tbody tr');
            console.log(`Found ${rows.length} rows`);
            
            if (rows.length === 0) {
              return { status: 'no-rows', message: 'No rows found in the table' };
            }
            
            // Process each row
            rows.forEach((row, index) => {
              try {
                // Extract Keyword using the provided selector
                // Keyword selector: td:nth-child(3) > div > a > div > span > span
                const keywordCell = row.querySelector('td:nth-child(3)');
                let keyword = '';
                
                if (keywordCell) {
                  // Try different possible structures for the keyword element
                  const keywordElement = 
                    keywordCell.querySelector('div > a > div > span > span') || 
                    keywordCell.querySelector('div > a > div > span') || 
                    keywordCell.querySelector('div > a > span') || 
                    keywordCell.querySelector('a > span') || 
                    keywordCell.querySelector('span') || 
                    keywordCell;
                  
                  keyword = keywordElement ? keywordElement.textContent.trim() : '';
                }
                
                // Extract KD using the provided selector
                // KD selector: td:nth-child(5) > div > div
                const kdCell = row.querySelector('td:nth-child(5)');
                let kd = '';
                
                if (kdCell) {
                  // Try different possible structures for the KD element
                  const kdElement = 
                    kdCell.querySelector('div > div') || 
                    kdCell.querySelector('div') || 
                    kdCell;
                  
                  kd = kdElement ? kdElement.textContent.trim() : '';
                }
                
                // Extract SV using the provided information
                // SV is in td:nth-child(6)
                const svCell = row.querySelector('td:nth-child(6)');
                let sv = '';
                
                if (svCell) {
                  sv = svCell.textContent.trim();
                }
                
                // Only add rows where we found at least one piece of data
                if (keyword || kd || sv) {
                  data.push({
                    Keyword: keyword,
                    KD: kd,
                    SV: sv
                  });
                }
              } catch (error) {
                console.error(`Error processing row ${index}:`, error);
              }
            });
          } catch (error) {
            console.error('Error extracting data:', error);
            return { status: 'error', message: error.message };
          }
          
          if (data.length === 0) {
            return { status: 'no-data', message: 'No data found in the table' };
          }
          
          console.log(`Found data for ${data.length} rows`);
          
          return { 
            status: 'success',
            data: data,
            count: data.length
          };
        }
        
        return extractAhrefsColumnsData();
      }
    });
    
    if (results && results[0] && results[0].result) {
      const result = results[0].result;
      
      if (result.status === 'success') {
        // Format the data as CSV
        const headers = ['Keyword', 'KD', 'SV'];
        const headerRow = headers.join(',');
        
        const rows = result.data.map(row => {
          return headers.map(header => {
            // Ensure values with commas are properly quoted
            const value = row[header] || '';
            return value.includes(',') ? `"${value}"` : value;
          }).join(',');
        });
        
        const csv = [headerRow, ...rows].join('\n');
        await navigator.clipboard.writeText(csv);
        status.textContent = `Copied data for ${result.count} rows to clipboard as CSV!`;
        status.className = 'success';
      } else {
        status.textContent = `Error: ${result.message || 'Failed to extract data'}`;
        status.className = 'error';
      }
    } else {
      status.textContent = 'Error: Failed to extract data';
      status.className = 'error';
    }
  } catch (error) {
    status.textContent = 'Error: ' + error.message;
    status.className = 'error';
    console.error('Extraction failed:', error);
  }
});