require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const qs = require('querystring');
const crypto = require('crypto');
const B2 = require('backblaze-b2');


class BackblazeB2Client {
    constructor() {
        const requiredEnvVars = ['B2_KEY_ID', 'B2_APP_KEY', 'B2_BUCKET_ID', 'B2_BUCKET_NAME', 'B2_BUCKET_URL'];
        const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

        if (missingVars.length > 0) {
            throw new Error(`Missing required B2 environment variables: ${missingVars.join(', ')}`);
        }

        try {
            const url = new URL(process.env.B2_BUCKET_URL.replace('@', ''));
            if (!url.protocol.startsWith('http')) {
                throw new Error('Invalid URL protocol');
            }
        } catch (e) {
            throw new Error(`Invalid B2_BUCKET_URL format: ${e.message}`);
        }

        this.b2 = new B2({
            applicationKeyId: process.env.B2_KEY_ID,
            applicationKey: process.env.B2_APP_KEY
        });
        this.bucketId = process.env.B2_BUCKET_ID;
        this.bucketName = process.env.B2_BUCKET_NAME;
        this.authorized = false;
    }

    async ensureAuthorized() {
        if (!this.authorized) {
            try {
                const authResponse = await this.b2.authorize();
                this.authorized = true;
                this.downloadUrl = authResponse.data.downloadUrl;
                this.authToken = authResponse.data.authorizationToken;
            } catch (error) {
                throw new Error(`B2 authorization failed: ${error.message}`);
            }
        }
        return {
            downloadUrl: this.downloadUrl,
            authToken: this.authToken
        };
    }

    async getUploadUrl() {
        await this.ensureAuthorized();
        try {
            const response = await this.b2.getUploadUrl({ bucketId: this.bucketId });
            return response.data;
        } catch (error) {
            throw new Error(`Error getting upload URL: ${error.message}`);
        }
    }

    calculateSHA1(filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha1');
        hash.update(fileBuffer);
        return hash.digest('hex');
    }

    async uploadFile(filePath, fileName) {
        const uploadUrlResponse = await this.getUploadUrl();
        const fileData = fs.readFileSync(filePath);

        try {
            await this.b2.uploadFile({
                uploadUrl: uploadUrlResponse.uploadUrl,
                uploadAuthToken: uploadUrlResponse.authorizationToken,
                fileName: fileName,
                data: fileData
            });
        } catch (error) {
            throw new Error(`Error uploading file '${fileName}': ${error.message}`);
        }
    }

    async uploadBuffer(buffer, fileName) {
        const uploadUrlResponse = await this.getUploadUrl();

        try {
            const result = await this.b2.uploadFile({
                uploadUrl: uploadUrlResponse.uploadUrl,
                uploadAuthToken: uploadUrlResponse.authorizationToken,
                fileName: fileName,
                data: buffer,
                contentLength: buffer.length,
                mime: 'application/octet-stream'
            });
            return result;
        } catch (error) {
            throw new Error(`Error uploading buffer as file '${fileName}': ${error.message}`);
        }
    }

    async downloadFile(fileName, destinationPath) {
        await this.ensureAuthorized();
        const downloadUrl = `${this.downloadUrl}/file/${this.bucketName}/${fileName}`;

        try {
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
            throw new Error(`Download failed for file '${fileName}': ${error.message}`);
        }
    }

    async listFiles(prefix) {
        await this.ensureAuthorized();
        try {
            const response = await this.b2.listFileNames({
                bucketId: this.bucketId,
                prefix: prefix,
                maxFileCount: 1000
            });
            return response.data.files;
        } catch (error) {
            throw new Error(`Error listing files with prefix '${prefix}': ${error.message}`);
        }
    }

    async deleteFiles(prefix) {
        await this.ensureAuthorized();
        try {
            // First, list all files with the given prefix
            const files = await this.listFiles(prefix);
            
            // Delete each file
            const deletePromises = files.map(file => 
                this.b2.deleteFileVersion({
                    fileId: file.fileId,
                    fileName: file.fileName
                })
            );

            await Promise.all(deletePromises);
            return true;
        } catch (error) {
            throw new Error(`Error deleting files with prefix '${prefix}': ${error.message}`);
        }
    }

    async getDownloadAuthorization(fileName) {
        await this.ensureAuthorized();
      
        const resp = await this.b2.getDownloadAuthorization({
            bucketId: this.bucketId,
            fileNamePrefix: fileName,
            validDurationInSeconds: 3 * 60 * 60 // 3 hours
        });
      
        const authToken = resp.data.authorizationToken;
        const downloadUrl = `${this.downloadUrl}/file/${this.bucketName}/${fileName}`;
        
        // Return the complete authorized URL
        return {
            url: `${downloadUrl}?Authorization=${encodeURIComponent(authToken)}`
        };
    }
}

module.exports = BackblazeB2Client;