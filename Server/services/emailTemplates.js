/**
 * Generates HTML email templates for inactive users and mentors.
 * 
 * @param {string} userName - The name of the user
 * @param {number} days - The number of days of inactivity (7, 15, 30)
 * @param {string} role - The role of the recipient ('user' or 'mentor')
 * @returns {string} HTML content
 */
const getInactiveUserTemplate = (userName, days, role = 'user') => {
    let subject = '';
    let title = '';
    let message = '';
    const loginUrl = process.env.CLIENT_URL || 'https://admeasy.in/login';

    if (role === 'mentor') {
        if (days === 7) {
            subject = "Students are looking for your guidance!";
            title = "It's been a week!";
            message = "We noticed you haven't logged in for 7 days. Students on Admeasy are looking for guidance and your expertise can help them make better decisions. Come back and check out what's new!";
        } else if (days === 15) {
            subject = "Your followers miss your insights!";
            title = "15 days since your last visit";
            message = "It's been 15 days since you last shared your knowledge on Admeasy. Don't let your profile go cold! Log in now to help students and answer their queries.";
        } else if (days === 30) {
            subject = "Come back and inspire the next generation!";
            title = "We want to help you succeed as a mentor!";
            message = "It's been 30 days since you last checked in. The admission season is at its peak! Log in to share your experience and guide students to their dream colleges.";
        }
    } else {
        // Default to 'user' (student)
        if (days === 7) {
            subject = "We miss you on Admeasy!";
            title = "It's been a week!";
            message = "We noticed you haven't logged in for 7 days. We've missed you! There are new updates and content waiting for you. Come back and check them out.";
        } else if (days === 15) {
            subject = "Are you still looking for admissions?";
            title = "15 days since your last visit";
            message = "It's been 15 days since you last visited Admeasy. Don't let your admission preparation slow down! Log in now to explore new opportunities.";
        } else if (days === 30) {
            subject = "Don't miss out on your dream college!";
            title = "We want to help you succeed!";
            message = "It's been 30 days since you last checked in. The admission season is moving fast! Log in to make sure you don't miss any critical deadlines or updates.";
        }
    }

    return {
        subject,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f9f9f9;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #ffffff;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .content {
                    padding: 30px;
                }
                .content p {
                    font-size: 16px;
                    color: #555;
                    margin-bottom: 20px;
                }
                .cta-container {
                    text-align: center;
                    margin: 30px 0;
                }
                .cta-button {
                    display: inline-block;
                    padding: 12px 30px;
                    background-color: #00C853;
                    color: #ffffff !important;
                    text-decoration: none;
                    font-weight: bold;
                    border-radius: 5px;
                    transition: background-color 0.3s;
                }
                .cta-button:hover {
                    background-color: #00E676;
                }
                .footer {
                    background-color: #f1f1f1;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #777;
                }
                .footer a {
                    color: #764ba2;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${title}</h1>
                </div>
                <div class="content">
                    <p>Hello ${userName || 'Student'},</p>
                    <p>${message}</p>
                    <div class="cta-container">
                        <a href="${loginUrl}" class="cta-button">Log In Now</a>
                    </div>
                    <p>If you have any questions or need assistance, feel free to reply to this email.</p>
                    <p>Best regards,<br>The Admeasy Team</p>
                </div>
                <div class="footer">
                    <p>You are receiving this email because you registered on Admeasy.</p>
                    <p>&copy; 2026 Admeasy. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `
    };
};

module.exports = { getInactiveUserTemplate };
