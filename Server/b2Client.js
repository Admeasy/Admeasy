require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const B2 = require('backblaze-b2');

// B2 Client initialization

class BackblazeB2Client {
    constructor() {
        // Initialize B2 client

        this.b2 = new (require('backblaze-b2'))({
            applicationKeyId: process.env.B2_KEY_ID,
            applicationKey: process.env.B2_APP_KEY
        });
        this.bucketId = process.env.B2_BUCKET_ID;
        this.bucketName = process.env.B2_BUCKET_NAME;
        this.authorized = false;
    }

    async ensureAuthorized() {
        if (!this.authorized) {
            // Attempt B2 authorization
            try {
                const authResponse = await this.b2.authorize();
                this.authorized = true;
                this.downloadUrl = authResponse.data.downloadUrl;
                this.authToken = authResponse.data.authorizationToken;
            } catch (error) {
                console.error('B2 authorization failed:', error.message);
                throw error;
            }
        }
        return {
            downloadUrl: this.downloadUrl,
            authToken: this.authToken
        };
    }

    async getUploadUrl() {
        await this.ensureAuthorized();
        return this.b2.getUploadUrl({
            bucketId: process.env.B2_BUCKET_ID
        });
    }

    // Calculate SHA1 hash for file
    calculateSHA1(filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha1');
        hash.update(fileBuffer);
        return hash.digest('hex');
    }

    // Upload a file
    async uploadFile(filePath, fileName) {
        const uploadUrlResponse = await this.getUploadUrl();
        const fileData = fs.readFileSync(filePath);
        
        await this.b2.uploadFile({
            uploadUrl: uploadUrlResponse.uploadUrl,
            uploadAuthToken: uploadUrlResponse.authorizationToken,
            fileName: fileName,
            data: fileData
        });
    }

    async uploadBuffer(buffer, fileName) {
        await this.ensureAuthorized();
        const uploadUrlResponse = await this.getUploadUrl();
        
        await this.b2.uploadFile({
            uploadUrl: uploadUrlResponse.uploadUrl,
            uploadAuthToken: uploadUrlResponse.authorizationToken,
            fileName: fileName,
            data: buffer,
            contentLength: buffer.length,
            mime: 'image/jpeg' // You might want to make this dynamic based on file type
        });
    }

    // Download a file
    async downloadFile(fileName, destinationPath) {
        try {
            await this.ensureAuthorized();
            const downloadUrl = `${this.downloadUrl}/file/${this.bucketName}/${fileName}`;
            
            const response = await axios({
                method: 'get',
                url: downloadUrl,
                headers: { Authorization: this.authToken },
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(destinationPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        } catch (error) {
            console.error('Download failed:', error.message);
            throw error;
        }
    }

    async listFiles(prefix) {
        const auth = await this.ensureAuthorized();
        const response = await this.b2.listFileNames({
            bucketId: process.env.B2_BUCKET_ID,
            prefix: prefix,
            maxFileCount: 1000
        });
        return response.data.files;
    }

    async getDownloadUrl(fileName) {
        const auth = await this.ensureAuthorized();
        try {
            
            // List files to get the exact file name (case sensitive)
            const files = await this.listFiles(fileName);
            const file = files.find(f => f.fileName === fileName);
            
            if (!file) {
                throw new Error(`File not found: ${fileName}`);
            }

            // Construct the download URL using the authorized download URL from B2
            const downloadUrl = `${auth.downloadUrl}/file/${process.env.B2_BUCKET_NAME}/${encodeURIComponent(file.fileName)}`;

            return {
                url: downloadUrl,
                authToken: auth.authToken
            };
        } catch (error) {
            console.error('Error generating download URL:', error);
            throw error;
        }
    }
}

module.exports = BackblazeB2Client; 