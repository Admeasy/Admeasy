const NotificationToken = require('../models/NotificationToken');
const sendNotification = require('../utils/sendNotification');
const User = require('../models/userSchema');
const Mentor = require('../models/mentorSchema');

/**
 * Service to handle dispatching notifications
 */
class NotificationService {
    /**
     * Send notification to a specific user/mentor
     * @param {string} recipientId - The ID of the user/mentor receiving the notification
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @param {Object} data - Additional data for the notification
     * @param {string} actorId - ID of the user/mentor who triggered the action (to prevent self-notification)
     */
    static async sendToUser(recipientId, title, body, data = {}, actorId = null) {
        try {
            // 1. Skip if actor is the receiver
            if (actorId && recipientId.toString() === actorId.toString()) {
                return;
            }

            // 2. Fetch tokens for the recipient
            // We don't check for "notifications disabled" yet as per requirements ("assume future setting")
            // but we only fetch active tokens
            const tokens = await NotificationToken.find({
                userId: recipientId,
                isActive: true
            }).select('token');

            if (!tokens || tokens.length === 0) {
                return;
            }

            const tokenStrings = tokens.map(t => t.token);

            // 3. Send notification
            await sendNotification(tokenStrings, title, body, data);

        } catch (error) {
            console.error('Error in NotificationService.sendToUser:', error);
        }
    }

    /**
     * Send notification to multiple users (e.g. followers)
     * @param {Array<string>} recipientIds - Array of recipient IDs
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @param {Object} data - Additional data
     * @param {string} actorId - ID of the actor (to exclude from recipients)
     */
    static async sendToMultipleUsers(recipientIds, title, body, data = {}, actorId = null) {
        try {
            if (!recipientIds || recipientIds.length === 0) return;

            // Filter out actor from recipients
            const validRecipientIds = actorId
                ? recipientIds.filter(id => id.toString() !== actorId.toString())
                : recipientIds;

            if (validRecipientIds.length === 0) return;

            // Fetch tokens for all recipients
            const tokens = await NotificationToken.find({
                userId: { $in: validRecipientIds },
                isActive: true
            }).select('token');

            if (!tokens || tokens.length === 0) return;

            const tokenStrings = tokens.map(t => t.token);

            // Send notification (Firebase handles bulk sending to up to 500 tokens, 
            // if we have more we might need to batch, but for now assuming < 500 active devices per event burst)
            // sendEachForMulticast handles each token individually in response but expects a list of tokens.
            // Wait, sendEachForMulticast sends to EACH token.

            // Optimization: If the title/body is same for everyone, we can just pass the list.
            await sendNotification(tokenStrings, title, body, data);

        } catch (error) {
            console.error('Error in NotificationService.sendToMultipleUsers:', error);
        }
    }
}

module.exports = NotificationService;
