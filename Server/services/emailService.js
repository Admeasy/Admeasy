const nodemailer = require('nodemailer');
const { getInactiveUserTemplate } = require('./emailTemplates');
require('dotenv').config();

/**
 * Creates the Nodemailer transporter based on environment variables.
 * Falls back to a mock transporter if credentials are missing.
 */
const createTransporter = () => {
    // Check for SMTP_EMAIL (matching your existing convention) and SMTP_PASS
    const email = process.env.SMTP_EMAIL;
    const pass = process.env.SMTP_PASS;

    if (email && pass) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.zoho.in", // Default to your existing Zoho setup
            port: parseInt(process.env.SMTP_PORT) || 465,
            secure: true, // Zoho uses 465 with SSL
            auth: {
                user: email,
                pass: pass,
            },
        });
    } else {
        console.warn("[EmailService] SMTP credentials missing. Using mock transporter for development.");
        // Mock transporter that logs to console instead of sending
        return {
            sendMail: async (mailOptions) => {
                console.log("----------------------------------------");
                console.log(`[MOCK EMAIL SENT]`);
                console.log(`To: ${mailOptions.to}`);
                console.log(`Subject: ${mailOptions.subject}`);
                console.log(`From: ${mailOptions.from}`);
                console.log("----------------------------------------");
                return { messageId: "mock-" + Date.now() };
            }
        };
    }
};

const transporter = createTransporter();

/**
 * Send an email to an inactive user based on the milestone.
 * 
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {number} days - Number of days of inactivity (7, 15, 30)
 * @param {string} role - Role of the recipient ('user' or 'mentor')
 */
const sendInactivityEmail = async (email, name, days, role = 'user') => {
    try {
        const { subject, html } = getInactiveUserTemplate(name, days, role);
        
        const mailOptions = {
            from: `"Admeasy" <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL || 'no-reply@admeasy.in'}>`,
            to: email,
            subject: subject,
            html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Inactivity email sent to ${email} for ${days} days milestone.`);
        return info;
    } catch (error) {
        console.error(`[EmailService] Failed to send email to ${email}:`, error);
        // We don't throw here to avoid breaking the cron job loop
        return null;
    }
};

module.exports = { sendInactivityEmail };
