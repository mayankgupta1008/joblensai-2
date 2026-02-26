export const subscriptionCancelTemplate = (data: { endDate: string; userName: string }) => ({
  subject: "Subscription Cancelled",
  html: `
    <h2>Subscription Cancelled</h2>
    <p>Hi ${data.userName},</p>
    <p>Your subscription has been cancelled on ${data.endDate}. But you will have access to pro features till ${data.endDate}.</p>
    <p>Thank you,</p>
    <p>JobLensAI Team</p>
  `,
});
