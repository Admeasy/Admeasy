require("dotenv").config();

const { Worker } = require("bullmq");
const redis = require("../config/redis");
const nodemailer = require("nodemailer");

console.log("🚀 Worker started...");

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.in",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
});

const worker = new Worker(
  "emailQueue",
  async (job) => {
    console.log("📩 Job received:", job.name);

    if (job.name === "sendResetEmail") {
      const { email, resetURL } = job.data;

      try {
        await transporter.sendMail({
          from: `"Admeasy" <${process.env.SMTP_EMAIL}>`,
          to: email,
          subject: "Admeasy Password Reset",
          text: `Reset your password: ${resetURL}`,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
            <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
              
              <h2 style="color: #333; text-align: center;">🔐 Reset Your Admeasy Password</h2>

              <p style="font-size: 15px; color: #555;">
                We received a request to reset your password.
              </p>

              <a href="${resetURL}" 
                 style="display:inline-block; margin:20px 0; padding:12px 20px; background:#4e6bff; color:#fff; text-decoration:none; border-radius:8px;">
                Reset Password
              </a>

              <p style="font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} Admeasy
              </p>

            </div>
          </div>`,
        });
      } catch (err) {
        console.error("❌ Email error:", err);
        throw err;
      }
    }
  },
  { connection: redis }
);

worker.on("completed", (job) => {
  console.log("✅ Email sent:", job.id);
});

worker.on("failed", (job, err) => {
  console.log("❌ Email failed:", err.message);
});