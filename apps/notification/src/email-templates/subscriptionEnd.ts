export const subscriptionEndTemplate = (data: {
  endDate: string;
  userName: string;
}) => ({
  subject: "Subscription Ended",
  html: `
    <h2>Subscription Ended</h2>
    <p>Hi ${data.userName},</p>
    <p>Your subscription has ended on ${data.endDate}.</p>
    <p>Thank you,</p>
    <p>JobLensAI Team</p>
  `,
});
