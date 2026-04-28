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
          html: `<a href="${resetURL}">Reset Password</a>`,
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