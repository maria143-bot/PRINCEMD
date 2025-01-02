import { fileURLToPath } from 'url';
import path from 'path';
import { writeFileSync } from 'fs';
import { Dropbox } from 'dropbox'; // Import Dropbox SDK

async function processTxtAndSaveCredentials(txt, dropboxAccessToken) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  let decodedData;

  // Check if the input is Base64 or a Dropbox URL
  const isBase64 = /^[a-zA-Z0-9+/]+={0,2}$/.test(txt);
  const isDropbox = txt.startsWith('Prince~'); // Checking if it's a Dropbox identifier

  if (isBase64) {
    // Handle Base64 input
    decodedData = Buffer.from(txt, 'base64').toString('utf-8');
  } else if (isDropbox) {
    // Handle Dropbox link
    const dropboxCode = txt.replace('Prince~', '');
    const dropboxUrl = `https://www.dropbox.com/s/${dropboxCode}?dl=1`;
    console.log('Dropbox URL:', dropboxUrl);

    const dbx = new Dropbox({ accessToken: dropboxAccessToken }); // Use the passed access token

    try {
      // Download the file from Dropbox
      const response = await dbx.filesDownload({ path: dropboxUrl });

      // Get the file content
      const data = response.result.fileBinary;
      decodedData = data.toString('utf-8'); // Assuming the file is a text file in UTF-8 encoding
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
