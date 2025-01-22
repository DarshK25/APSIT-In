import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  secure: true, // true for port 465, false for other ports
  auth: {
    user: "darshkalathiya25@gmail.com",
    pass: "mtmrnqigxjmohpuq",
  },
});

async function sendMail(to, subject, text, html) {
  const info = await transporter.sendMail({
    from: '"darshkalathiya25@gmail.com', // sender address
    to, // list of receivers
    subject, // Subject line
    text, // plain text body
    html, // HTML body
  });

  console.log("Message sent: %s", info.messageId);
}

export default sendMail;
