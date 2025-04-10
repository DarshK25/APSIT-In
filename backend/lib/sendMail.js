import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "darshkalathiya25@gmail.com",
    // You need to generate an App Password from your Google Account
    // Go to Google Account > Security > 2-Step Verification > App Passwords
    // Generate a new App Password for 'Mail' and your app name
    pass: "prxtbazyxaxbthjs" // Replace this with your App Password
  },
});

async function sendMail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({
      from: '"APSIT-In" <darshkalathiya25@gmail.com>', // sender address with a friendly name
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // HTML body
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error in sending email:", error);
    throw error;
  }
}

export default sendMail;
