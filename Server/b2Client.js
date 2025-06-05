require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');

class BackblazeB2Client {
    constructor() {
        this.applicationKeyId = process.env.B2_APPLICATION_KEY_ID;
        this.applicationKey = process.env.B2_APPLICATION_KEY;
        this.bucketId = process.env.B2_BUCKET_ID;
        this.bucketName = process.env.B2_BUCKET_NAME;
        this.authToken = null;
        this.apiUrl = null;
        this.downloadUrl = null;
    }

    // Authenticate with B2
    async authorize() {
        try {
            const credentials = `${this.applicationKeyId}:${this.applicationKey}`;
            const base64Credentials = Buffer.from(credentials).toString('base64');

            const response = await axios.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
                headers: { Authorization: `Basic ${base64Credentials}` }
            });

            this.authToken = response.data.authorizationToken;
            this.apiUrl = response.data.apiUrl;
            this.downloadUrl = response.data.downloadUrl;
            return response.data;
        } catch (error) {
            console.error('Authorization failed:', error.message);
            throw error;
        }
    }

    // Get upload URL
    async getUploadUrl() {
        try {
            const response = await axios.post(`${this.apiUrl}/b2api/v2/b2_get_upload_url`, 
                { bucketId: this.bucketId },
                { headers: { Authorization: this.authToken } }
            );
            return response.data;
        } catch (error) {
            console.error('Failed to get upload URL:', error.message);
            throw error;
        }
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
        try {
            await this.authorize();
            const uploadData = await this.getUploadUrl();
            const fileBuffer = fs.readFileSync(filePath);
            const sha1 = this.calculateSHA1(filePath);

            const response = await axios.post(uploadData.uploadUrl, fileBuffer, {
                headers: {
                    Authorization: uploadData.authorizationToken,
                    'X-Bz-File-Name': fileName,
                    'Content-Type': 'b2/x-auto',
                    'Content-Length': fileBuffer.length,
                    'X-Bz-Content-Sha1': sha1
                }
            });

            console.log('File uploaded successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Upload failed:', error.message);
            throw error;
        }
    }

    // Download a file
    async downloadFile(fileName, destinationPath) {
        try {
            await this.authorize();
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
}

module.exports = BackblazeB2Client; 