import sendMail from "../lib/sendMail.js"; // Default import

import {
  createCommentNotificationEmailTemplate,
  createConnectionAcceptedEmailTemplate,
  createWelcomeEmailTemplate,
  createClubMembershipEmailTemplate
} from "./emailTemplates.js";

export const sendWelcomeEmail = async (email, name, profileUrl) => {
  try {
    const subject = "Welcome to APSIT-In";
    const html = createWelcomeEmailTemplate(name, profileUrl);

    await sendMail(email, subject, "", html);

    console.log("Welcome Email sent successfully");
  } catch (error) {
    console.error("Error sending Welcome Email:", error);
    throw error;
  }
};

export const sendCommentNotificationEmail = async (
  recipientEmail,
  recipientName,
  commenterName,
  postUrl,
  commentContent
) => {
  try {
    const subject = "New Comment on Your Post";
    const html = createCommentNotificationEmailTemplate(
      recipientName,
      commenterName,
      postUrl,
      commentContent
    );

    await sendMail(recipientEmail, subject, "", html);

    console.log("Comment Notification Email sent successfully");
  } catch (error) {
    console.error("Error sending Comment Notification Email:", error);
    throw error;
  }
};

export const sendConnectionAcceptedEmail = async (
  senderEmail,
  senderName,
  recipientName,
  profileUrl
) => {
  try {
    const subject = `${recipientName} accepted your connection request`;
    const html = createConnectionAcceptedEmailTemplate(
      senderName,
      recipientName,
      profileUrl
    );

    await sendMail(senderEmail, subject, "", html);

    console.log("Connection Accepted Email sent successfully");
  } catch (error) {
    console.error("Error sending Connection Accepted Email:", error);
    throw error;
  }
};

export const sendClubMembershipEmail = async (
  userEmail,
  userName,
  clubName,
  role,
  clubProfileUrl
) => {
  try {
    const subject = `You've been added to ${clubName}`;
    const html = createClubMembershipEmailTemplate(
      userName,
      clubName,
      role,
      clubProfileUrl
    );

    await sendMail(userEmail, subject, "", html);

    console.log("Club Membership Email sent successfully");
  } catch (error) {
    console.error("Error sending Club Membership Email:", error);
    throw error;
  }
};
