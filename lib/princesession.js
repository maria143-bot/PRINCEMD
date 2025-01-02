import { fileURLToPath } from 'url';
import path from 'path';
import { writeFileSync } from 'fs';
import fetch from 'node-fetch';

async function processTxtAndSaveCredentials(txt) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  let decodedData;

  // Check if the input is Base64 or a Dropbox URL
  const isBase64 = /^[a-zA-Z0-9+/]+={0,2}$/.test(txt);
  const isDropbox = txt.startsWith('Prince~');

  if (isBase64) {
    // Handle Base64 input
    decodedData = Buffer.from(txt, 'base64').toString('utf-8');
  } else if (isDropbox) {
    // Handle Dropbox URL input
    const dropboxCode = txt.replace('Prince~', '');
    
    try {
      // Extract file path from Dropbox URL, ignoring query parameters
      const dropboxUrl = `https://www.dropbox.com/s/${dropboxCode.split('?')[0]}?dl=1`;
      console.log('Dropbox URL:', dropboxUrl);

      // Fetch file from Dropbox URL
      const response = await fetch(dropboxUrl);
      if (!response.ok) {
        throw new Error('Failed to download file from Dropbox');
      }

      // Check if the response is HTML (indicating an error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const htmlContent = await response.text();
        console.error('Received HTML error page from Dropbox:', htmlContent);
        return;
      }

      // Assuming the file content is JSON
      decodedData = await response.text();
      console.log('Downloaded Dropbox Data:', decodedData);
    } catch (error) {
      console.error('Error downloading from Dropbox:', error);
      return;
    }
  } else {
    console.error('Invalid input: Neither Base64 nor Dropbox URL.');
    return;
  }

  // Validate and Save the credentials
  try {
    const credsPath = path.join(__dirname, '..', 'sessions', 'creds.json');

    // Check if the decoded data is valid JSON
    let parsedData;
    try {
      parsedData = JSON.parse(decodedData);
    } catch (error) {
      console.error('Invalid JSON format in decoded data:', error);
      return;
    }

    // Save valid JSON data to creds.json
    writeFileSync(credsPath, JSON.stringify(parsedData, null, 2));
    console.log('Credentials saved to creds.json');
  } catch (error) {
    console.error('Error saving credentials:', error);
  }
}

export default processTxtAndSaveCredentials;
