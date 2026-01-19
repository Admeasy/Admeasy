const admin = require("../config/firebaseAdmin");

/**
 * Send a push notification to specific tokens
 * @param {Array<string>} tokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional data payload
 */
const sendNotification = async (tokens, title, body, data = {}) => {
    if (!tokens || tokens.length === 0) return;

    // Filter out invalid tokens explicitly (empty strings or nulls)
    const validTokens = tokens.filter(t => t && typeof t === 'string' && t.trim().length > 0);

    if (validTokens.length === 0) return;

    try {
        const message = {
            notification: {
                title,
                body,
            },
            data: {
                ...data, // Spread existing data
                click_action: 'FLUTTER_NOTIFICATION_CLICK', // Standard for many hybrid apps, optional
                timestamp: new Date().toISOString()
            },
            tokens: validTokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        // Log failures if any
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(validTokens[idx]);
                    // Optional: You could remove invalid tokens from DB here
                    // if (resp.error.code === 'messaging/invalid-registration-token' ||
                    //     resp.error.code === 'messaging/registration-token-not-registered') {
                    //     // Remove token logic
                    // }
                }
            });
            console.warn(`Failed to send ${response.failureCount} notifications. Failed tokens:`, failedTokens);
        }

        // console.log(`Successfully sent ${response.successCount} notifications.`);
        return response;
    } catch (error) {
        console.error('Error sending notification:', error);
        // We do not throw here to prevent crashing the main flow
    }
};

module.exports = sendNotification;