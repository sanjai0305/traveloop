import nodemailer from "nodemailer";

const createTransporter = () => {
  const user = process.env.GOOGLE_SENDER_EMAIL;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!user || !clientId || !clientSecret || !refreshToken) {
    console.warn("Gmail API configuration missing");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user,
      clientId,
      clientSecret,
      refreshToken,
    },
  });
};

export const sendSupportEmail = async (name, email, message) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.error("Support Email Failed: Gmail transporter not configured");
    throw new Error("Gmail transporter not configured");
  }

  const supportEmail = process.env.SUPPORT_EMAIL || process.env.GOOGLE_SENDER_EMAIL;
  const timestamp = new Date().toLocaleString();

  const mailOptions = {
    from: `Traveloop Support <${process.env.GOOGLE_SENDER_EMAIL}>`,
    to: supportEmail,
    subject: `New Support Ticket from ${name}`,
    text: `New Support Ticket Received:

Name: ${name}
Email: ${email}
Message: ${message}
Timestamp: ${timestamp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Support Email Sent");
  } catch (error) {
    console.error("Support Email Failed:", error.message);
    throw error;
  }
};

export const sendSupportReply = async (name, email) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.error("Support Email Failed: Gmail transporter not configured");
    throw new Error("Gmail transporter not configured");
  }

  const mailOptions = {
    from: `Traveloop Support <${process.env.GOOGLE_SENDER_EMAIL}>`,
    to: email,
    subject: "Traveloop Support Request Received",
    text: `Thank you for contacting Traveloop.

We have received your request and our team will review it shortly.

Safe travels,
Traveloop Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Support Email Sent");
  } catch (error) {
    console.error("Support Email Failed:", error.message);
    throw error;
  }
};

export const sendInviteEmail = async ({ collaborator_email, trip_name, owner_name, role, invite_link }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.error("Invite Email Failed: Gmail transporter not configured");
    throw new Error("Gmail transporter not configured");
  }

  const mailOptions = {
    from: `Traveloop <${process.env.GOOGLE_SENDER_EMAIL}>`,
    to: collaborator_email,
    subject: `Invitation to collaborate on "${trip_name}"`,
    text: `You have been invited to collaborate on a trip.

Trip:
${trip_name}

Role:
${role}

Open Traveloop to accept the invitation:
${invite_link}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Invite Email Sent");
  } catch (error) {
    console.error("Invite Email Failed:", error.message);
    throw error;
  }
};
