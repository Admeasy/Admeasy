const BackblazeB2Client = require('./b2-client');

async function example() {
    try {
        const b2Client = new BackblazeB2Client();

        // Upload a file
        console.log('Uploading file...');
        await b2Client.uploadFile(
            './test-image.jpg',  // Local file path
            'test-image.jpg'     // Name in B2 bucket
        );

        // Download the same file
        console.log('Downloading file...');
        await b2Client.downloadFile(
            'test-image.jpg',         // File name in B2 bucket
            './downloaded-image.jpg'   // Local destination path
        );

        console.log('Operations completed successfully!');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

example(); 