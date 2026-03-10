export const subscriptionEndTemplate = (data: { endDate: string; userName: string }) => ({
  subject: "Subscription Ending Soon",
  html: `
    <h2>Subscription Ending Soon</h2>
    <p>Hi ${data.userName},</p>
    <p>Your subscription will be ending on ${data.endDate}. To continue using pro features, please renew your subscription.</p>
    <p>Thank you,</p>
    <p>JobLensAI Team</p>
  `,
});
