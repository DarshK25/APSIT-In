import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
});

async function sendMail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({
      from: `"APSIT-In" <${process.env.EMAIL_USER}>`, // sender address with a friendly name
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error in sending email:", error);
    throw error;
  }
}

export default sendMail;
