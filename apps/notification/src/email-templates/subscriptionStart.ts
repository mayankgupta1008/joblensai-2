export const subscriptionStartTemplate = (data: {
  startDate: string;
  userName: string;
}) => ({
  subject: "Subscription Started",
  html: `
    <h2>Subscription Started</h2>
    <p>Hi ${data.userName},</p>
    <p>Your subscription has started on ${data.startDate}.</p>
    <p>Thank you,</p>
    <p>JobLensAI Team</p>
  `,
});
